/**
 * @Loading.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-23
 * @Log: 2017-09-19 loading类名的添加基于标签，而非类名
 */

/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Loading = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function () {

    var LOADING = 'loading';

    // 样式类名统一处理
    var CL = {
        add: function () {
            return ['ui', LOADING].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-' + LOADING;
        }
    };

    /**
     * 给HTML元素扩展一个loading属性
     * 经测试，不会和IMG和IFRAME原生loading属性冲突
     * 是否正在loading：element.loading
     * 设置元素loading：element.loading = true;
     * 取消loading效果：element.loading = false;
     */

    Object.defineProperty(HTMLElement.prototype, 'loading', {
        configurable: true,
        enumerable: true,
        writeable: true,
        get: function () {
            return !!(this.classList.contains(CL) || this.classList.contains(LOADING) || this.matches(CL));
        },
        set: function (flag) {
            var action = 'remove';
            if (flag) {
                action = 'add';
                if (this.loading) {
                    return flag;
                }
            }
            if (this.classList.contains(CL.toString().replace(LOADING, 'button'))) {
                this.classList[action](LOADING);
            } else {
                this.classList[action](CL);
                // IE9支持旋转
                if (typeof funRunRotate == 'function') {
                    funRunRotate(this);
                }
            }
            // Aria无障碍设置
            this.setAttribute('aria-busy', !!flag);
            if (flag && this.innerHTML.trim() == '') {
                this.setAttribute('aria-label', '正在加载中');
            } else {
                this.removeAttribute('aria-label');
            }
        }
    });

    /**
     * IE9浏览器动画支持
     */
    if (typeof window.getComputedStyle(document.head).transition == 'undefined') {
        var funRunRotate = function (eleLoading) {
            if (!eleLoading) {
                return;
            }
            // 方便控制旋转进行的loading图形
            var eleLoadingBefore;
            if (eleLoading.loading == true) {
                if (!eleLoading.getAttribute('spin')) {
                    eleLoadingBefore = document.createElement('i');
                    eleLoadingBefore.className = CL.add('before');
                    // 插入到前面
                    eleLoading.insertAdjacentElement('afterbegin', eleLoadingBefore);
                    // 本身设置标志量
                    eleLoading.setAttribute('spin', '');

                    // 清除动画定时
                    clearInterval(eleLoading.timerLoading);

                    // 开始旋转
                    var numStep = 16;
                    eleLoading.timerLoading = setInterval(function () {
                        var numRotate = eleLoading.rotate || 0;
                        numRotate += 360 / numStep;

                        if (numRotate > 360) {
                            numRotate = numRotate - 360;
                        }

                        eleLoading.rotate = numRotate;

                        // 设置transform旋转
                        eleLoadingBefore.style.msTransform = 'rotate(' + numRotate + 'deg)';
                    }, 1000 / numStep);
                }
            } else if (eleLoading.loading === false) {
                eleLoading.removeAttribute('spin');

                eleLoadingBefore = eleLoading.querySelector('.' + CL.add('before'));
                // 节点移除
                if (eleLoadingBefore) {
                    eleLoadingBefore.remove();
                }

                // 清除动画定时
                clearInterval(eleLoading.timerLoading);
            }
        };
        window.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll(CL).forEach(funRunRotate);
        });
        document.body.addEventListener('DOMNodeInserted', function (event) {
            if (!event.target || event.target.nodeType != 1) {
                return;
            }
            // 插入节点
            if (event.target.matches(CL)) {
                funRunRotate(event.target);
            }
        });
    }

    /**
     * 为了暴露方法一致
     * 实际开发多用不到Loading实例方法
     */
    var Loading = function (element, options) {
        var defaults = {
            // 其他参数attributes
            observer: 'childList',
            size: 2
        };

        if (typeof element == 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return this;
        }

        var eleTarget = element;

        var objParams = Object.assign({}, defaults, options || {});

        // 若干参数暴露
        this.params = objParams;
        this.element = {
            target: element
        };

        if (!eleTarget.data) {
            eleTarget.data = {};
        }
        // 元素上存储loading实例
        eleTarget.data.loading = this;

        // loading显示
        this.show();
    };

    /**
     * loading效果的显示
     * @return {[type]} [description]
     */
    Loading.prototype.show = function () {
        var objParams = this.params;
        var eleTarget = this.element.target;

        if (objParams.observer == 'attributes') {
            eleTarget.loading = true;
            eleTarget.setAttribute('size', objParams.size);
            // 更新标志量
            this.loading = true;
            this.display = true;
        } else if (objParams.observer == 'childList') {
            var strPosition = window.getComputedStyle(eleTarget).position;
            if (strPosition == 'static') {
                // 记住初始position属性值
                if (eleTarget.style && eleTarget.style.position) {
                    this.position = 'static-inline';
                } else {
                    this.position = 'static-computed';
                }
                // 设置position为相对定位
                // 方便loading图形居中显示
                eleTarget.style.position = 'relative';
            } else {
                this.position = '';
            }
            eleTarget.initHTML = eleTarget.innerHTML;
            eleTarget.innerHTML = '<' + CL + ' size="' + objParams.size + ' align="center"></' + CL + '>';
            // 更新标志量
            this.loading = true;
            this.display = true;
        }
    };

    /**
     * loading效果的取消
     * @return {[type]} [description]
     */
    Loading.prototype.hide = function () {
        var objParams = this.params;
        var eleTarget = this.element.target;

        if (objParams.observer == 'attributes') {
            eleTarget.loading = false;
            // 更新标志量
            this.loading = false;
            this.display = false;
        } else if (objParams.observer == 'childList') {
            var strPosition = this.position;
            if (strPosition == 'static-inline') {
                eleTarget.style.position = 'static';
            } else if (strPosition == 'static-computed') {
                eleTarget.style.position = '';
            }
            // 移除<ui-loading>元素
            if (typeof eleTarget.initHTML == 'string') {
                eleTarget.innerHTML = eleTarget.initHTML;
            } else if (eleTarget.querySelector(CL)) {
                eleTarget.querySelector(CL).remove();
            }
            // 更新标志量
            this.loading = false;
            this.display = false;
        }
    };

    return Loading;
}));
