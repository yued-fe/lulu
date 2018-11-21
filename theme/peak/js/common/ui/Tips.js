/**
 * @Tips.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edit:    17-06-19
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Tips = factory();
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
     * 黑色tips效果
     * 支持jQuery包装器调用以及模块化调用
     * @example
     * $().tips(options);
     * new Tips(el, options)
     **/

    // 类名变量
    var CL = 'ui-tips';
    var prefixTips = CL + '-';
    var REVERSE = 'reverse';

    // 支持jQuery语法调用
    $.fn.tips = function(options) {
        return $(this).each(function() {
            if (!$(this).data('tips')) {
                $(this).data('tips', new Tips($(this), options));
            }
        });
    };

    /**
     * 黑色tips效果
     * @param {Object|String} el 需要提示的元素，也可以是元素的选择器
     * @param {Object} options   可选参数
     */
    var Tips = function(el, options) {
        var defaults = {
            attribute: 'title',
            // eventType其他值：'click', 'null'
            eventType: 'hover',
            content: '',
            align: 'center',
            delay: 100,
            onShow: $.noop,
            onHide: $.noop
        };

        if (typeof el == 'string') {
            el = $(el);
        }

        if (!el || !el.length) {
            return this;
        }

        if (el.length > 1) {
            el.tips(options);

            return el.eq(0).data('tips');
        }

        var params = $.extend({}, defaults, options || {});

        // 创建元素
        var trigger = el;
        var before, after;

        if (trigger.is('a,button,input') == false) {
            trigger.attr({
                tabindex: '0',
                role: 'tooltip'
            });
        }

        // 分两种情况
        // 1. IE9+ 纯CSS(伪元素)实现，使用类名ui-tips; IE7-IE8 内入两元素，水平居中效果JS实现
        // 2. 所有浏览器都绝对定位跟随, 手动绑定

        // 对于第一种情况
        if (trigger.hasClass(CL)) {
            // 如果元素含有title, 需要转换成data-title
            var title = trigger.attr('title') || trigger.attr('data-title');
            if (title) {
                trigger.attr({
                    'data-title': title,
                    'aria-label': title
                // 原本的title移除
                }).removeAttr('title');
            }
            // 对于IE7和IE8浏览器，我们需要插入两个元素
            if (!window.addEventListener) {
                before = $('<span class="' + prefixTips + 'before"></span>').html(title);
                after = $('<i class="' + prefixTips + 'after"></i>');
                // 前后插入
                trigger.prepend(before);
                trigger.append(after);

                // 水平居中必须
                before.css('margin-left', before.outerWidth() * -0.5);
                after.css('margin-left', after.outerWidth() * -0.5);
                // 其余交给CSS
            }

            // outline处理，点击时候提示不跟随
            trigger.on('click', function () {
                if (!window.isKeyEvent) {
                    this.blur();
                }
            });

            if (!trigger.data('tips')) {
                trigger.data('tips', this);
            }

            return;
        }

        var self = this;
        var tips, timer;

        var _content = function() {
            var content = params.content;
            if (!content) {
                content = trigger.attr(params.attribute);
                // 如果是title, 移除避免重复交互
                if (params.attribute == 'title') {
                    content = content || trigger.data('title');
                    if (content) {
                        trigger.attr({
                            'aria-label': content
                        }).data('title', content);
                    }
                    trigger.removeAttr('title');
                }
            }

            return content;
        };

        // 暴露参数
        this.el = {
            trigger: trigger,
            tips: tips
        };
        this.callback = {
            show: params.onShow,
            hide: params.onHide
        };
        this.align = params.align;

        // 事件走起
        if (params.eventType == 'hover') {
            trigger.hover(function() {
                var content = _content();
                timer = setTimeout(function() {
                    self.show(content);
                }, params.delay);
            }, function() {
                clearTimeout(timer);
                self.hide();
            });

            trigger.on({
                'focus': function () {
                    self.show(_content());
                },
                'blur': function () {
                    self.hide();
                }
            });
        } else if (params.eventType == 'click') {
            trigger.click(function() {
                self.show(_content());
            });
            $(document).mouseup(function(event) {
                var target = event.target;
                var dom = trigger.get(0);

                if (self.display == true && dom != target && dom.contains(target) == false && self.el.tips.get(0).contains(target) == false) {
                    self.hide();
                }
            });
        } else {
            this.show(_content());
        }

        return this;
    };

    /**
     * tip提示显示
     * @param  {String} content 显示的提示信息
     * @return {Object}         返回当前实例对象
     */
    Tips.prototype.show = function(content) {
        if (!content) {
            return this;
        }
        // 元素
        var trigger = this.el.trigger;
        var tips = this.el.tips;

        // tips图形需要的元素
        var before, after;

        if (tips) {
            tips.show();

            before = tips.find('span').html(content);
            after = tips.find('i');
        } else {
            tips = $('<div></div>').addClass(prefixTips + 'x');
            // 两个元素
            before = $('<span class="' + prefixTips + 'before"></span>').html(content);
            after = $('<i class="' + prefixTips + 'after"></i>');

            // aria tips描述
            if (!trigger.attr('aria-label')) {
                // 创建随机id, aria需要
                var id = 't_' + (Math.random() + '').replace('0.', '');
                before.attr('id', id);
                trigger.attr('aria-labelledby', id);
            }

            $(document.body).append(tips.append(before).append(after));
        }

        // 水平偏移大小
        var offsetX = 0;
        var position = '5-7';
        if (this.align == 'left') {
            offsetX = -0.5 * before.width() + parseInt(before.css('padding-left')) || 0;
        } else if (this.align == 'right') {
            offsetX = 0.5 * before.width() - parseInt(before.css('padding-right')) || 0;
        } else if (this.align == 'rotate') {
            position = '6-8';
        } else if (typeof this.align == 'number') {
            offsetX = this.align;
        } else if (trigger.hasClass(REVERSE) || this.align == REVERSE) {
            position = '7-5';
            this.align = REVERSE;
        }

        // 标示对齐类名
        tips.addClass(prefixTips + this.align);

        if (this.align != 'rotate' && this.align != REVERSE) {
            after.css({
                // 尖角的位置永远对准元素
                left: offsetX
            });
        }

        // 定位
        tips.follow(trigger, {
            offsets: {
                x: offsetX,
                y: 0
            },
            // trigger-target
            position: position,
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // 显示的回调
        this.callback.show.call(trigger, tips);

        this.el.tips = tips;

        this.display = true;

        return this;
    };

    /**
     * tip提示隐藏
     * @return {Object} 返回当前实例对象
     */
    Tips.prototype.hide = function() {
        if (this.el.tips) {
            this.el.tips.hide();
            // 移除回调
            this.callback.hide.call(this.el.trigger, this.el.tips);
        }
        this.display = false;

        return this;
    };

    /**
     * tip提示初始化
     * @return {Object} 返回当前实例对象
     */
    Tips.prototype.init = function() {
        $('.' + CL).tips();

        // 全局委托，因为上面的初始化对于动态创建的IE7,IE8浏览器无效
        $(document).mouseover(function(event) {
            var target = event && event.target;
            if (target && $(target).hasClass(CL) && !$(target).data('tips')) {
                $(target).tips();
            }
        });

        return this;
    };

    return Tips;
}));

