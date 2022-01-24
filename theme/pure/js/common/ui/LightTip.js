/**
 * @LightTip.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @Update: 19-09-13 @ziven27 [去jQuery]
 */
/* global module */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.LightTip = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 顶部的请提示效果
     * @example
     * new LightTip(content, options);
     * 快捷方式：
     * new LightTip().success(content, duration);
     * new LightTip().error(content, duration);
     **/

    // 类名变量
    var CL = {
        add: function () {
            return ['ui-lightip'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-lightip';
        }
    };

    var LightTip = function (content, options) {
        // 默认参数
        var defaults = {
            // normal为黑色显示
            // 还支持success和error
            // 以及其他自定义状态
            // status也可以换成type
            status: 'normal',
            duration: 3000
        };

        if (typeof content == 'object') {
            options = content;
            content = undefined;
        }

        this.params = Object.assign({}, defaults, options || {});
        if (this.params.type) {
            this.params.status = this.params.type;
        }

        // 1. 容器元素
        // <div>元素改成<a>元素，前者默认无法响应回车click
        var eleContainer = document.createElement('a');
        eleContainer.href = 'javascript:';
        eleContainer.setAttribute('role', 'tooltip');
        eleContainer.className = CL + ' ESC';

        // 2. 提示内容元素
        // 原来<span>改成<div>因为可能有其他HTML元素
        var eleContent = document.createElement('div');
        eleContent.className = CL.add('text');

        // 组合
        eleContainer.appendChild(eleContent);
        // 装载到页面中
        document.body.appendChild(eleContainer);

        // 暴露出去给其他方法使用
        this.element = {
            container: eleContainer,
            content: eleContent
        };

        // 隐藏的定时器
        this.timerRemove = null;

        // 事件处理
        this.events();

        // 提示内容
        this.content = content;

        // 显示
        this.show();
    };

    /**
     * 轻提示的相关事件处理
     * @return {[type]} [description]
     */
    LightTip.prototype.events = function () {
        // 元素们
        var objElement = this.element;
        var eleContainer = objElement.container;

        // 点击轻提示可以快速隐藏
        eleContainer.addEventListener('click', function () {
            this.remove();
        }.bind(this));
    };

    /**
     * 键盘可访问的细节处理
     * @return {Object} 返回当前实例对象
     */
    LightTip.prototype.tabIndex = function () {
        var eleContainer = this.element.container;
        var eleLastActive = this.lastActiveElement;

        if (this.display == true) {
            var eleActiveElement = document.activeElement;
            if (eleContainer !== eleActiveElement) {
                this.lastActiveElement = eleActiveElement;
            }

            // 键盘索引起始位置定位在提示元素上
            eleContainer.focus();
        } else if (eleLastActive && !eleLastActive.matches('body')) {
            // 键盘焦点元素还原
            // IE有一定概率会重定位，暂时忽略不处理
            eleLastActive.focus({
                preventScroll: true
            });
            if (!window.isKeyEvent) {
                eleLastActive.blur();
            }
            this.lastActiveElement = null;
        }

        return this;
    };

    /**
     * 不同内容的提示位置不重叠的处理
     * @return {Object} 返回当前实例对象
     */
    LightTip.prototype.position = function () {
        var elesOpen = [].slice.call(document.querySelectorAll('.' + CL + '[open]'));
        // 基于 data-tid 排序
        var elesOpenSort = elesOpen.sort(function (eleA, eleB) {
            return (eleA.tid || 0) - (eleB.tid || 0);
        });
        // 确定提示内容
        var objMatchText = {};
        var numTop = 10;

        // 基于排序确定位置
        elesOpenSort.forEach(function (ele) {
            var strText = ele.textContent;
            if (typeof objMatchText[strText] == 'undefined') {
                objMatchText[strText] = numTop;
                numTop = numTop + ele.offsetHeight + 10;
            }
            ele.style.top = objMatchText[strText] + 'px';
        });

        return this;
    };

    /**
     * LightTip显示
     * @returns {LightTip}
     */
    LightTip.prototype.show = function () {
        // 元素们
        var objElement = this.element;
        var eleContainer = objElement.container;
        var eleContent = objElement.content;

        // 这是参数
        var objParams = this.params;

        // 提示内容
        var strContent = this.content;

        if (!strContent) {
            return;
        }

        // 清除隐藏轻提示的定时器
        clearTimeout(this.timerRemove);

        // 当前轻提示的状态和内容
        eleContainer.setAttribute('data-status', objParams.status);
        if (objParams.type) {
            eleContainer.setAttribute('data-type', objParams.type);
        }
        eleContent.innerHTML = strContent;

        // 轻提示显示
        eleContainer.setAttribute('open', 'open');

        // 状态更改为显示
        this.display = true;

        // 键盘无障碍处理
        this.tabIndex();

        // 层级最大
        this.zIndex();

        // 显示一定时间之后消失
        this.timerRemove = setTimeout(function () {
            this.remove();
            // 隐藏后再次定位
            this.position();
        }.bind(this), objParams.duration);

        // 标记定时器 ID，这样可以确认 DOM 的先后顺序
        eleContainer.tid = this.timerRemove;

        // 定位
        this.position();

        return this;
    };

    /**
     * 移除轻提示元素，直接移除
     * @param  {[type]} ele [description]
     * @return {[type]}     [description]
     */
    LightTip.prototype.remove = function () {
        var eleContainer = this.element.container;
        if (eleContainer && eleContainer.remove) {
            // 清除隐藏轻提示的定时器
            clearTimeout(this.timerRemove);
            // 元素移除
            eleContainer.remove();
        }

        // 改变显示状态
        this.display = false;

        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        this.tabIndex();
    };

    /**
     * 隐藏轻提示元素，直接移除
     * @param  {[type]} ele [description]
     * @return {[type]}     [description]
     */
    LightTip.prototype.hide = function () {
        var eleContainer = this.element.container;
        if (eleContainer) {
            // 清除隐藏轻提示的定时器
            clearTimeout(this.timerRemove);
            // 元素移除
            eleContainer.removeAttribute('open');
        }

        // 改变显示状态
        this.display = false;

        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        this.tabIndex();
    };

    /**
     *
     * @param content [显示文案]
     * @param duration  [显示时间]
     * @returns {LightTip}
     */
    LightTip.prototype.success = function (content, duration) {
        if (typeof content == 'function') {
            content = content();
        }

        // 根据设置改变参数值
        if (typeof content == 'string') {
            this.content = content;
        } else if (typeof content == 'number') {
            duration = content;
        }

        this.params.status = 'success';

        if (duration) {
            this.params.duration = duration;
        }

        // 增强的无障碍访问提示
        if (this.element.container) {
            this.element.container.setAttribute('aria-label', '操作成功');
        }

        this.show();

        return this;
    };

    /**
     *
     * @param content [显示文案]
     * @param duration  [显示时间]
     * @returns {LightTip}
     */
    LightTip.prototype.error = function (content, duration) {
        if (typeof content == 'function') {
            content = content();
        }

        // 根据设置改变参数值
        if (typeof content == 'string') {
            this.content = content;
        } else if (typeof content == 'number') {
            duration = content;
        }

        this.params.status = 'error';

        if (duration) {
            this.params.duration = duration;
        }

        // 增强的无障碍访问提示
        if (this.element.container) {
            this.element.container.setAttribute('aria-label', '操作失败');
        }

        this.show();

        return this;
    };

    /**
     * 提示条元素zIndex实时最大化
     * @return {[type]} [description]
     */
    LightTip.prototype.zIndex = function () {
        var eleContainer = this.element.container;
        // 返回eleTarget才是的样式计算对象
        var objStyleContainer = window.getComputedStyle(eleContainer);
        // 此时元素的层级
        var numZIndexTarget = objStyleContainer.zIndex;
        // 用来对比的层级，也是最小层级
        var numZIndexNew = 19;

        // 只对<body>子元素进行层级最大化计算处理
        document.body.childNodes.forEach(function (eleChild) {
            if (eleChild.nodeType != 1) {
                return;
            }

            var objStyleChild = window.getComputedStyle(eleChild);

            var numZIndexChild = objStyleChild.zIndex * 1;

            if (numZIndexChild && eleContainer != eleChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew != numZIndexTarget) {
            eleContainer.style.zIndex = numZIndexNew;
        }
    };

    return LightTip;
}));
