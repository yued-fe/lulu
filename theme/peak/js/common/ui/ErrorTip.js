/**
 * @ErrorTip.js
 * @author zhangxinxu
 * @version
 * Created: 15-07-01
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.ErrorTip = factory();
    }
}(this, function (require) {
    if (typeof require == 'function') {
        require('common/ui/Follow');
    } else if (!$().follow) {
        if (window.console) {
            window.console.error('need Follow.js');
        }

        return {};
    }

    /**
     * 红色的tips错误提示效果
     * 支持jQuery包装器调用以及模块化调用
     * @example
     * $().tips(options);
     * new Tips(el, options)
     **/

    // 类名变量
    var CL = 'ui-tips';
    var prefixTips = CL + '-';

    // 同时支持jQuery链式调用
    $.fn.errorTip = function(content, options) {
        return $(this).each(function() {
            new ErrorTip($(this), content, options);
        });
    };

    /**
     * 红色的tips错误提示效果
     * @param {Object} el      红色tips显示在哪个元素上
     * @param {String} content tips里面显示的内容
     * @param {Object} options 可选参数
     */
    var ErrorTip = function(el, content, options) {
        var defaults = {
            unique: true,
            align: 'center',
            onShow: $.noop,
            onHide: $.noop
        };

        var params = $.extend({}, defaults, options || {});

        // 要显示的字符内容
        if ($.isFunction(content)) {
            content = content();
        }
        if (typeof content != 'string') {
            return this;
        }

        var self = this;

        // 一些元素
        var trigger = el;
        var tips, before, after;

        if (params.unique == true && window.errorTip) {
            tips = window.errorTip.data('trigger', trigger);
        } else if (params.unique == false && trigger.data('errorTip')) {
            tips = trigger.data('errorTip');
        } else {
            tips = $('<div class="' + prefixTips + 'x ' + prefixTips + 'error"></div>');
            before = $('<span></span>').addClass(prefixTips + 'before');
            after = $('<i></i>').addClass(prefixTips + 'after');

            $(document.body).append(tips.append(before).append(after));

            // 如果是唯一模式，全局存储
            if (params.unique == true) {
                window.errorTip = tips.data('trigger', trigger);
            } else {
                trigger.data('errorTip', tips);
            }

            // 任何键盘操作，点击，或者拉伸都会隐藏错误提示框
            $(document).bind({
                keydown: function(event) {
                    // ctrl/shift键等不隐藏
                    if (event.keyCode != 16 && event.keyCode != 17) {
                        self.hide();
                    }
                },
                mousedown: function(event) {
                    var activeElement = document.activeElement;

                    var activeTrigger = tips.data('trigger');
                    var activeTarget = event.target;

                    if (activeElement && activeTrigger && activeElement == activeTarget &&
                        activeElement == activeTrigger.get(0) &&
                        // 这个与Datalist.js关联
                        activeTrigger.data('focus') == false
                    ) {
                        return;
                    }
                    self.hide();
                }
            });
            $(window).bind({
                resize: function () {
                    self.hide();
                }
            });
        }

        this.el = {
            trigger: el,
            tips: tips,
            before: before || tips.find('span'),
            after: after || tips.find('i')
        };
        this.callback = {
            show: params.onShow,
            hide: params.onHide
        };
        this.cl = CL;
        this.align = params.align;

        this.show(content);

        return this;
    };

    /**
     * 错误tips提示显示方法
     * @param  {String} content 错误显示的文字内容
     * @return {Object}         返回当前实例对象
     */
    ErrorTip.prototype.show = function (content) {
        var el = this.el;
        // 触发元素和提示元素
        var tips = el.tips;
        var trigger = el.trigger;
        // 两个元素
        var before = el.before;
        var after = el.after;

        // 修改content内容
        before.html(content);

        var align = this.align;

        // 水平偏移大小
        var offsetX = 0;
        if (align == 'left') {
            offsetX = -0.5 * before.width() + parseInt(before.css('padding-left')) || 0;
        } else if (align == 'right') {
            offsetX = 0.5 * before.width() - parseInt(before.css('padding-right')) || 0;
        } else if (typeof align == 'number') {
            offsetX = align;
        }

        after.css({
            // 尖角的位置永远对准元素
            left: offsetX
        });

        // 定位
        tips.follow(trigger, {
            align: align,
            // trigger-target
            position: '5-7',
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        tips.show();

        // aria提示
        trigger.attr('aria-label', '错误提示：' + content);

        // 显示的回调
        if (this.callback && this.callback.show) {
            this.callback.show.call(trigger.addClass('error valided'), tips);
        }

        return this;
    };

    /**
     * 错误tips提示隐藏方法
     * @return {Object}         返回当前实例对象
     */
    ErrorTip.prototype.hide = function () {
        var tips = this.el.tips;
        var trigger = this.el.trigger;

        trigger.removeAttr('aria-label');

        if (tips.css('display') != 'none') {
            tips.hide();

            // 隐藏的回调
            if (this.callback && this.callback.hide) {
                this.callback.hide.call((tips.data('trigger') || trigger).removeClass('error'), tips);
            }
        }

        return this;
    };

    return ErrorTip;
}));
