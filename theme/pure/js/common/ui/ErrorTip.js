/**
 * @ErrorTip.js
 * @author zhangxinxu
 * @version
 * Created: 15-07-01
 */
/* global module */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.ErrorTip = factory();
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
     * 红色的tips错误提示效果
     * @example
     * new ErrorTips(element, content, options)
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

    /**
     * 红色的tips错误提示效果
     * @param {Object} element 红色tips显示在哪个元素上
     * @param {String} content tips里面显示的内容
     * @param {Object} options 可选参数
     */
    var ErrorTip = function (element, content, options) {
        var defaults = {
            unique: true,
            onShow: function () {},
            onHide: function () {}
        };

        // 参数
        var objParams = Object.assign({}, defaults, options || {});


        // 显示字符内容的处理
        var strContent = content;

        // 支持Function类型
        if (typeof strContent == 'function') {
            strContent = strContent();
        }
        if (typeof strContent != 'string') {
            return this;
        }

        // 一些元素
        var eleTrigger = element;
        var eleTips, eleContent, eleArrow;
        // 全局的出错实例
        var objUniqueErrorTip = window.uniqueErrorTip;

        // 如果是唯一模式，则看看全局出错的对象
        if (objParams.unique == true && objUniqueErrorTip) {
            // window.errorTip存储的是唯一的红色提示元素
            // 改变存储的触发元素
            eleTips = objUniqueErrorTip.element.tips;
        } else if (objParams.unique == false && eleTrigger.data && eleTrigger.data.errorTip) {
            eleTips = eleTrigger.data.errorTip.element.tips;
        } else {
            // 首次
            eleTips = document.createElement('div');
            eleTips.className = CL.add('x') + ' ' + CL.add('error');
            // 提示内容元素
            eleContent = document.createElement('span');
            eleContent.className = CL.add('content');
            // 三角元素
            eleArrow = document.createElement('i');
            eleArrow.className = CL.add('arrow');
            // 元素组装并插入到页面中
            eleTips.appendChild(eleContent);
            eleTips.appendChild(eleArrow);
            document.body.appendChild(eleTips);

            // 任何键盘操作，点击，或者拉伸都会隐藏错误提示框
            document.addEventListener('keydown', function (event) {
                // ctrl/shift键不隐藏
                if (event.keyCode != 16 && event.keyCode != 17) {
                    (window.uniqueErrorTip || this).hide();
                }
            }.bind(this));

            document.addEventListener('mousedown', function (event) {
                // ctrl/shift键等不隐藏
                var eleActiveElement = document.activeElement;

                var eleActiveTrigger = eleTips.trigger;
                var eleTarget = event.target;

                // 如果点击的就是触发的元素，且处于激活态，则忽略
                if (eleActiveElement && eleActiveTrigger && eleActiveElement == eleTarget &&
                    eleActiveElement == eleActiveTrigger &&
                    // 这个与Datalist.js关联
                    !eleActiveTrigger.getAttribute('data-focus')
                ) {
                    return;
                }
                (window.uniqueErrorTip || this).hide();
            }.bind(this));

            window.addEventListener('resize', function () {
                (window.uniqueErrorTip || this).hide();
            }.bind(this));
        }

        // 如果是唯一模式，全局存储
        if (objParams.unique == true) {
            window.uniqueErrorTip = this;
        }

        // 更新提示元素对应的触发元素
        eleTips.trigger = eleTrigger;

        this.element = {
            trigger: eleTrigger,
            tips: eleTips,
            content: eleContent || eleTips.querySelector('span'),
            arrow: eleArrow || eleTips.querySelector('i')
        };
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };

        this.params = {
            unique: objParams.unique
        };

        // 暴露在外
        this.content = strContent;

        // 在DOM对象上暴露对应的实例对象
        if (!eleTrigger.data) {
            eleTrigger.data = {};
        }
        eleTrigger.data.errorTip = this;

        // 显示
        this.show();

        return this;
    };

    /**
     * 错误tips提示显示方法
     * @param  {String} content 错误显示的文字内容
     * @return {Object}         返回当前实例对象
     */
    ErrorTip.prototype.show = function () {
        var objElement = this.element;
        // 触发元素和提示元素
        var eleTips = objElement.tips;
        var eleTrigger = objElement.trigger;

        // 两个元素
        var eleContent = objElement.content;

        // 修改content内容
        eleContent.innerHTML = this.content;

        // 提示元素显示
        eleTips.style.display = '';

        // 定位
        new Follow(eleTrigger, eleTips, {
            // trigger-target
            position: '5-7',
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // aria无障碍访问增强
        eleTrigger.setAttribute('aria-label', '错误提示：' + eleContent.textContent || eleContent.innerText);
        // 两个重要标志类名
        eleTrigger.classList.add('error');
        eleTrigger.classList.add('valided');

        this.display = true;

        // 显示的回调
        if (this.callback && this.callback.show) {
            this.callback.show.call(this, eleTrigger, eleTips);
        }

        return this;
    };

    /**
     * 错误tips提示隐藏方法
     * @return {Object}         返回当前实例对象
     */
    ErrorTip.prototype.hide = function () {
        var eleTips = this.element.tips;
        var eleTrigger = this.element.trigger;

        eleTrigger.removeAttribute('aria-label');

        if (window.getComputedStyle(eleTips).display != 'none') {
            eleTips.style.display = 'none';

            eleTrigger.classList.remove('error');

            // 隐藏的回调
            if (this.callback && this.callback.hide) {
                this.callback.hide.call(this, eleTrigger, eleTips);
            }

            this.display = false;
        }

        return this;
    };

    return ErrorTip;
}));
