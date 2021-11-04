/**
 * @Tips.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edit:    17-06-19
 */

/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Tips = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {

    var Follow = (this || self).Follow;
    if (typeof require == 'function' && !Follow) {
        Follow = require('common/ui/Follow');
    } else if (!Follow) {
        window.console.error('need Follow.js');

        return {};
    }

    /**
     * 黑色tips效果
     * @example
     * new Tips(element, options)
     **/

    // 类名变量
    var CL = {
        add: function () {
            return ['ui-tips'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-tips';
        }
    };
    var REVERSE = 'reverse';

    /**
     * 黑色tips效果
     * @param {Object|String}    element 需要提示的元素，也可以是元素的选择器
     * @param {Object} options   可选参数
     */
    var Tips = function (element, options) {
        if (!element) {
            return this;
        }

        var defaults = {
            // eventType其他值：'click', 'null'
            eventType: 'hover',
            // align: auto表示自动根据元素上的属性确定定位方式
            // 可以使用data-align或者data-position自定义定位
            // 如果没有这些属性值，有类名reverse
            // 认为是7-5
            // 其他场景认为是5-7
            // 支持Follow.js中所有position位置
            align: 'auto',
            content: '',
            onShow: function () {},
            onHide: function () {}
        };

        var eleTrigger = element;

        // 如果参数是字符串，认为是选择器
        if (typeof element == 'string') {
            eleTrigger = document.querySelectorAll(element);
            if (eleTrigger.length == 0) {
                return this;
            }
        }

        // 避免重复初始化
        if (eleTrigger.data && eleTrigger.data.tips) {
            return eleTrigger.data.tips;
        }

        if (eleTrigger.length && eleTrigger.forEach) {
            eleTrigger.forEach(function (trigger) {
                new Tips(trigger, options);
            });
            return eleTrigger[0].data.tips;
        }

        var objParams = Object.assign({}, defaults, options || {});

        // 暴露参数
        this.element = {
            trigger: eleTrigger
        };

        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };
        this.params = {
            eventType: objParams.eventType,
            align: objParams.align
        };

        if (objParams.content) {
            this.content = objParams.content;
        }

        // 事件处理
        this.events();

        // 存储实例对象
        if (!eleTrigger.data) {
            eleTrigger.data = {};
        }
        eleTrigger.data.tips = this;

        return this;
    };

    /**
     * 定义一个content属性，可以设置与获取tips提示内容
     * @param {[type]} )
     */
    Object.defineProperty(Tips.prototype, 'content', {
        configurable: true,
        enumerable: true,
        writeable: true,
        get: function () {
            var eleTrigger = this.element && this.element.trigger;
            if (!eleTrigger) {
                return '';
            }
            var strTitle = eleTrigger.getAttribute('title') || eleTrigger.getAttribute('data-title') || '';

            // CSS 驱动的tips提示效果是基于data-title
            eleTrigger.setAttribute('data-title', strTitle);
            // 屏幕阅读无障碍访问支持
            eleTrigger.setAttribute('aria-label', strTitle);

            // 移除浏览器默认的title，防止交互冲突
            eleTrigger.removeAttribute('title');

            return strTitle;
        },
        set: function (value) {
            var eleTrigger = this.element && this.element.trigger;
            if (eleTrigger) {
                eleTrigger.setAttribute('data-title', value);
                // 屏幕阅读无障碍访问支持
                eleTrigger.setAttribute('aria-label', value);
            }
        }
    });


    /**
     * 相关的事件处理
     * @return {[type]} [description]
     */
    Tips.prototype.events = function () {
        var eleTrigger = this.element.trigger;
        // 非focusable元素使其focusable
        if (/^a|input|button|area$/i.test(eleTrigger.tagName) == false) {
            eleTrigger.setAttribute('tabindex', '0');
            // 更语义
            eleTrigger.setAttribute('role', 'tooltip');
        }

        // 如果是纯CSS定位实现的tips效果
        if (eleTrigger.classList.contains(CL)) {
            // 如果元素含有title, 需要转换成data-title
            this.content;

            // outline处理，点击时候提示不跟随
            // 键盘无障碍访问的细节处理
            eleTrigger.addEventListener('click', function () {
                if (!window.isKeyEvent) {
                    this.blur();
                }
            }, false);

            return;
        }

        var objParams = this.params;
        // hover显示延迟时间
        var numDelay = 100;
        // 设置定时器对象
        var timerTips;
        // 如果是不支持hover行为的浏览器，hover变click
        var isHover = getComputedStyle(document.documentElement).getPropertyValue('--hoverNone');
        if (isHover && objParams.eventType == 'hover') {
            objParams.eventType = 'click';
        }
        // 事件走起
        if (objParams.eventType == 'hover') {
            // 鼠标进入
            eleTrigger.addEventListener('mouseenter', function () {
                timerTips = setTimeout(function () {
                    this.show();
                }.bind(this), numDelay);
            }.bind(this));
            // 鼠标离开
            eleTrigger.addEventListener('mouseleave', function () {
                clearTimeout(timerTips);
                // 隐藏提示
                this.hide();
            }.bind(this));

            // 支持focus的显示与隐藏
            // 但是需要是键盘访问触发的focus
            eleTrigger.addEventListener('focus', function () {
                if (window.isKeyEvent) {
                    this.show();
                }
            }.bind(this));
            // 元素失焦
            eleTrigger.addEventListener('blur', function () {
                this.hide();
            }.bind(this));
        } else if (objParams.eventType == 'click') {
            eleTrigger.addEventListener('click', function () {
                this.show();
            }.bind(this));
            // 关闭
            document.addEventListener('mouseup', function (event) {
                var eleTarget = event.target;
                if (this.display == true && eleTrigger.contains(eleTarget) == false && this.element.tips.contains(eleTarget) == false) {
                    this.hide();
                }
            }.bind(this));
        } else {
            // 其他事件类型直接显示
            this.show();
        }
    };

    /**
     * tip提示显示
     * @param  {String} content 显示的提示信息
     * @return {Object}         返回当前实例对象
     */
    Tips.prototype.show = function () {
        var strContent = this.content;
        if (!strContent) {
            return this;
        }

        // 元素
        var eleTrigger = this.element.trigger;
        var eleTips = this.element.tips;

        // tips图形需要的元素
        var eleContent, eleArrow;

        if (eleTips) {
            eleTips.style.display = 'block';
            // 三角元素获取
            eleContent = eleTips.querySelector('span');
            eleArrow = eleTips.querySelector('i');
            // 坐标还原，因为可能有偏移处理
            eleArrow.style.left = '';
            // 改变显示内容
            eleContent.innerHTML = strContent;
        } else {
            // eleTips元素不存在，则重新创建
            eleTips = document.createElement('div');
            eleTips.classList.add(CL.add('x'));
            // 创建内容元素和三角元素
            eleContent = document.createElement('span');
            eleContent.classList.add(CL.add('content'));
            // 内容
            eleContent.innerHTML = strContent;

            eleArrow = document.createElement('i');
            eleArrow.classList.add(CL.add('arrow'));

            // 屏幕阅读无障碍访问描述
            if (!eleTrigger.getAttribute('aria-label')) {
                // 创建随机id, aria需要
                var strRandomId = 'lulu_' + (Math.random() + '').replace('0.', '');
                // 设置
                eleContent.id = strRandomId;
                eleTrigger.setAttribute('aria-labelledby', strRandomId);
            }

            // append到页面中
            eleTips.appendChild(eleContent);
            eleTips.appendChild(eleArrow);
            document.body.appendChild(eleTips);
        }

        // 定位
        var strPosition = '5-7';
        // 定位只有5-7, 7-5, 6-8, 8-6这几种
        // 其中5-7是默认，提示在上方
        // 7-5是由'reverse'类名或参数决定的
        var strAlign = this.params.align;
        if (strAlign == 'auto') {
            strAlign = eleTrigger.getAttribute('data-align') || eleTrigger.getAttribute('data-position') || 'center';
        }

        // 关键字参数与位置
        if (strAlign == 'center') {
            strPosition = '5-7';
            if (eleTrigger.classList.contains(REVERSE) || eleTrigger.hasAttribute(REVERSE)) {
                strPosition = '7-5';
            }
        } else if (strAlign == 'left') {
            strPosition = '1-4';
            if (eleTrigger.classList.contains(REVERSE) || eleTrigger.hasAttribute(REVERSE)) {
                strPosition = '4-1';
            }
        } else if (strAlign == 'right') {
            strPosition = '2-3';
            if (eleTrigger.classList.contains(REVERSE) || eleTrigger.hasAttribute(REVERSE)) {
                strPosition = '3-2';
            }
        } else if (/^\d-\d$/.test(strAlign)) {
            strPosition = strAlign;
        }

        new Follow(eleTrigger, eleTips, {
            // trigger-target
            position: strPosition,
            // 边界溢出不自动修正
            edgeAdjust: false
        });


        // 三角的重定位
        var strPositionTips = eleTips.getAttribute('data-align');
        if (strPositionTips && strPositionTips.split('-').reduce(function (accumulator, currentValue) {
            return accumulator * 1 + currentValue * 1;
        }) == 5) {
            var numHalfOffsetWidth = eleTrigger.getBoundingClientRect().width / 2 - eleArrow.getBoundingClientRect().width / 2;

            // 三角偏移处理
            if (strPositionTips == '1-4' || strPositionTips == '4-1') {
                eleArrow.style.left = numHalfOffsetWidth + 'px';
            } else {
                eleArrow.style.left = 'calc(100% - ' + (eleArrow.getBoundingClientRect().width + numHalfOffsetWidth) + 'px)';
            }
        }

        // 显示的回调
        this.callback.show.call(this, eleTrigger, eleTips);

        this.element.tips = eleTips;

        this.display = true;

        return this;
    };

    /**
     * tip提示隐藏
     * @return {Object} 返回当前实例对象
     */
    Tips.prototype.hide = function () {
        var eleTips = this.element.tips;
        if (eleTips) {
            eleTips.style.display = 'none';
            // 移除回调
            this.callback.hide.call(this, this.element.trigger, eleTips);
        }
        this.display = false;

        return this;
    };

    var strSelector = '.' + CL + ', .jsTips,[is-tips]';

    // 自动初始化.ui-tips和.jsTips类名元素
    window.addEventListener('DOMContentLoaded', function () {
        new Tips(strSelector);
    });

    // 全局委托
    document.addEventListener('mouseover', function (event) {
        var eleTrigger = event.target;
        if (!eleTrigger || !eleTrigger.closest) {
            return;
        }
        eleTrigger = eleTrigger.closest(strSelector);

        if (eleTrigger && (!eleTrigger.data || !eleTrigger.data.tips)) {
            new Tips(eleTrigger);

            var objTips = eleTrigger.data.tips;
            if (objTips && (eleTrigger.classList.contains('jsTips') || eleTrigger.hasAttribute('is-tips'))) {
                objTips.show();
            }
        }
    });

    return Tips;
}));

