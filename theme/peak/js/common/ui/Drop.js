/**
 * @Drop.js
 * @author zhangxinxu
 * @version
 * Created: 15-06-30
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Drop = factory();
    }
}(this, function (require) {
    // require
    if (typeof require == 'function') {
        require('common/ui/Follow');
    } else if (!$().follow) {
        if (window.console) {
            window.console.error('need Follow.js');
        }

        return {};
    }

    /*
    * 元素的下拉显示
     */

    /*
     * 支持jQuery API调用和模块化调用两种
     * @example
     * $('trigger').drop(target, options);
     * or
     * new Drop(trigger, target, options);
    */

    $.fn.drop = function(target, options) {
        return $(this).each(function() {
            var drop = $(this).data('drop');
            if (!drop) {
                $(this).data('drop', new Drop($(this), target, options));
            }
        });
    };

    /**
     * 实例方法
     * @param {Object} trigger 触发元素，$()包装器元素类型
     * @param {Object} target  显示的浮动定位元素，$()包装器元素类型
     * @param {Object} options 可选参数
     */
    var Drop = function(trigger, target, options) {
        var defaults = {
            // 触发元素显示的事件，'null'直接显示；'hover'是hover方法；'click'是点击显示,
            eventType: 'null',
            // 实现点击或hover事件的委托实现
            selector: '',
            offsets: {
                x: 0,
                y: 0
            },
            edgeAdjust: true,
            position: '7-5',
            onShow: $.noop,
            onHide: $.noop
        };

        var params = $.extend({}, defaults, options || {});

        var id = target.attr('id');

        if (!id) {
            id = ('id_' + Math.random()).replace('0.', '');
            target.attr('id', id);
        }

        if (params.selector == '') {
            trigger.attr({
                'data-target': id,
                'aria-expanded': 'false'
            });
        }

        // 元素暴露给实例
        this.el = {
            trigger: trigger,
            target: target
        };

        // 偏移
        this.offsets = params.offsets;

        // 回调
        this.callback = {
            show: params.onShow,
            hide: params.onHide
        };

        // 位置
        this.position = params.position;
        // 边缘调整
        this.edgeAdjust = params.edgeAdjust;

        // 实例的显示状态
        this.display = false;

        var drop = this;

        switch (params.eventType) {
            case 'null': {
                this.show();
                break;
            }
            case 'hover': {
                // hover处理需要增加延时
                var timerHover;
                // 同时，从trigger移动到target也需要延时，因为两者可能有间隙，不能单纯移出就隐藏
                var timerHold;

                trigger.delegate(params.selector, 'mouseenter', function() {
                    if (params.selector) {
                        drop.el.trigger = $(this).attr({
                            'data-target': id,
                            'aria-expanded': 'false'
                        });
                    }

                    // 显示的定时器
                    timerHover = setTimeout(function() {
                        drop.show();
                    }, 150);
                    // 去除隐藏的定时器
                    clearTimeout(timerHold);
                });

                trigger.delegate(params.selector, 'mouseleave', function() {
                    // 清除显示的定时器
                    clearTimeout(timerHover);
                    // 隐藏的定时器
                    timerHold = setTimeout(function() {
                        drop.hide();
                    }, 200);
                });

                if (!target.data('dropHover')) {
                    target.hover(function() {
                        // 去除隐藏的定时器
                        clearTimeout(timerHold);
                    }, function() {
                        // 隐藏
                        timerHold = setTimeout(function() {
                            drop.hide();
                        }, 100);
                    });
                    target.data('dropHover', true);
                }

                // 键盘支持，原本使用focus事件，但并不利于键盘交互
                trigger.delegate(params.selector, 'click', function(event) {
                    // window.isKeyEvent表示是否键盘触发，来自Enhance.js
                    if (window.isKeyEvent) {
                        if (params.selector) {
                            drop.el.trigger = $(this).attr({
                                'data-target': id,
                                'aria-expanded': 'false'
                            });
                        }
                        // 点击即显示
                        if (drop.display == false) {
                            drop.show();
                        } else {
                            drop.hide();
                        }
                        event.preventDefault();
                    }
                });

                break;
            }
            case 'click': {
                trigger.delegate(params.selector, 'click', function(event) {
                    if (params.selector) {
                        drop.el.trigger = $(this).attr({
                            'data-target': id,
                            'aria-expanded': 'false'
                        });
                    }
                    // 点击即显示
                    if (drop.display == false) {
                        drop.show();
                    } else {
                        drop.hide();
                    }
                    event.preventDefault();
                });
                break;
            }
        }

        // 点击页面空白区域隐藏
        $(document).click(function(event) {
            var clicked = event && event.target;

            if (!clicked || !drop || drop.display != true) return;

            var tri = drop.el.trigger.get(0);
            var tar = drop.el.target.get(0);
            if (tri && tar && clicked != tri && clicked != tar && tri.contains(clicked) == false && tar.contains(clicked) == false) {
                drop.hide();
            }
        });

        // 窗体尺寸改变生活的重定位
        $(window).resize(function() {
            drop.follow();
        });

        return drop;
    };

    /**
     * 下拉定位处理
     * @return {Object} 返回当前实例对象
     */
    Drop.prototype.follow = function() {
        var target = this.el.target;
        var trigger = this.el.trigger;

        // 下拉必须是显示状态才执行定位处理
        if (this.display == true && trigger.css('display') != 'none') {
            target.follow(trigger, {
                offsets: this.offsets,
                position: this.position,
                edgeAdjust: this.edgeAdjust
            });
        }

        return this;
    };

    /**
     * 下拉的显示处理
     * @return {Object} 返回当前实例对象
     */
    Drop.prototype.show = function() {
        // target需要在页面中
        var target = this.el.target;
        var trigger = this.el.trigger;
        // 如果target在内存中，append到页面上
        if (target && $.contains(document.body, target.get(0)) == false) {
            $('body').append(target);
        }
        // 改变显示标志量
        this.display = true;
        // 进行定位
        target.css({
            position: 'absolute',
            display: 'inline'
        }).addClass('ESC');

        // aria
        trigger.attr({
            'aria-expanded': 'true'
        });

        // 定位
        this.follow();

        // 显示回调处理
        if ($.isFunction(this.callback.show)) {
            this.callback.show.call(this, trigger, target);
        }

        return this;
    };

    /**
     * 下拉的隐藏处理
     * @return {Object} 返回当前实例对象
     */
    Drop.prototype.hide = function() {
        var target = this.el.target;
        var trigger = this.el.trigger;
        // 隐藏下拉面板
        target.hide().removeClass('ESC');
        // aria
        trigger.attr({
            'aria-expanded': 'false'
        });

        if (window.isKeyEvent) {
            trigger.focus();
        }

        // 更改显示标志量
        this.display = false;
        // 隐藏回调处理
        if ($.isFunction(this.callback.hide)) {
            this.callback.hide.call(this, trigger, target);
        }

        return this;
    };

    return Drop;
}));
