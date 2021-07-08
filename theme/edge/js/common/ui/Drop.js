/**
 * @Drop.js
 * @author zhangxinxu
 * @version
 * @created 15-06-30
 * @edited  20-07-08 edit by wanglei
 */

import './Follow.js';

class Drop extends HTMLElement {

    static get observedAttributes () {
        return ['open', 'target'];
    }

    static get defaults () {
        return {
            eventtype: 'click',
            position: '7-5'
        };
    }

    /**
     * @param {Object} trigger 触发元素
     * @param {Object} target  显示的浮动定位元素
     * @param {Object} options 可选参数
     */
    constructor (eleTrigger, eleTarget, options) {
        super();

        // 参数的处理
        options = options || {};
        this.params = this.params || {};
        // 观察参数变化
        this.params = new Proxy(this.params, {
            get: (params, prop) => {
                if (!prop) {
                    return;
                }
                prop = prop.toLowerCase();

                let value = params[prop];
                let eleTrigger = this.element.trigger;

                if (typeof value == 'undefined') {
                    value = eleTrigger.getAttribute(prop) || eleTrigger.dataset[prop];

                    if (prop == 'width') {
                        if (eleTrigger !== this) {
                            value = eleTrigger.dataset[prop];
                        } else {
                            value = eleTrigger.getAttribute(prop);
                        }
                    }

                    // 部分参数如果没有，则使用默认的参数值
                    if (typeof value == 'undefined' && Drop.defaults[prop]) {
                        value = Drop.defaults[prop];
                    }
                }

                return value;
            },
            set: (params, prop, value) => {
                params[prop.toLowerCase()] = value;
                return true;
            }
        });

        let objElement = this.element || {};

        // trigger和target元素的设置与获取
        this.element = new Proxy(objElement, {
            get: (target, prop) => {
                if (prop == 'target') {
                    let strIdTarget = this.getAttribute('target');
                    let eleTarget = target[prop];
                    if (!eleTarget && strIdTarget) {
                        eleTarget = document.getElementById(strIdTarget);
                    }
                    return eleTarget;
                }

                if (prop == 'trigger') {
                    return target[prop] || this;
                }

                return target[prop];
            },
            set: (target, prop, value) => {
                if (typeof value == 'string') {
                    value = document.getElementById(value) || document.querySelector(value);
                }
                // 只有当value是节点元素时候才赋值
                if (value && typeof value.nodeType != 'number') {
                    return false;
                }

                // 元素赋值
                target[prop] = value;

                // target元素设置时候同时需要赋值
                if (prop == 'target' && value) {
                    let eleTarget = value;
                    let strId = eleTarget.id;
                    if (!strId) {
                        strId = ('lulu_' + Math.random()).replace('0.', '');
                        eleTarget.id = strId;
                    }

                    // 如果用户直接使用this.element.target赋值，则需要同步target属性值
                    if (this.element.trigger == this) {
                        // 此if判断可以避免死循环
                        if (this.target != strId) {
                            this.target = strId;
                        }
                    } else if (this.element.trigger) {
                        this.element.trigger.setAttribute('data-target', strId);
                    }
                }

                return true;
            }
        });

        // 开始参数设置
        // eleTrigger, eleTarget, options均可缺省
        [...arguments].forEach(function (argument) {
            if (typeof argument == 'object' && argument && !argument.tagName) {
                options = argument;
            }
        });

        if (eleTrigger) {
            this.element.trigger = eleTrigger;
        }

        // 此时的eleTrigger一定是元素，之前可能是选择器
        eleTrigger = this.element.trigger;
        // target的处理
        if (eleTrigger) {
            // target元素
            if (eleTarget && eleTarget !== options) {
                this.element.target = eleTarget;
            } else if (!eleTarget && eleTrigger.dataset && eleTrigger.dataset.target) {
                this.element.target = eleTrigger.dataset.target;
            }
        }

        // 参数设置
        this.setParams(options);

        // 默认的aria状态设置
        if (eleTrigger.open) {
            eleTrigger.setAttribute('aria-expanded', 'true');
        } else {
            eleTrigger.setAttribute('aria-expanded', 'false');
        }

        // 事件绑定处理
        this.events();

        // 如果默认open为true，则显示
        if (this.open) {
            if (document.readyState != 'loading') {
                this.show();
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    this.show();
                });
            }
        }

        if (eleTrigger !== this) {
            document.body.append(this);
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (v) {
        // 设置属性
        this.setAttribute('for', v);
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get eventType () {
        return this.getAttribute('eventtype') || 'click';
    }
    set eventType (value) {
        this.setAttribute('eventtype', value);
    }

    get open () {
        return this.hasAttribute('open');
    }
    set open (value) {
        this.toggleAttribute('open', value);
    }

    /**
     * <ui-drop>元素进入页面中的时候
     */
    connectedCallback () {
        let eleTarget = this.element.target;

        // 页面中的<ui-drop>元素如果没有target
        // 强制绑定事件，这样<ui-drop>元素可以实现open切换效果
        if (!eleTarget) {
            this.events(this.element.trigger === this);
        } else if (eleTarget.matches('datalist')) {
            this.list(eleTarget);
        } else if (eleTarget.matches('dialog')) {
            this.panel(eleTarget);
        }

        // 无障碍访问设置
        if (!this.querySelector('a, button') && !this.closest('a, button')) {
            this.tabIndex = 0;
            this.role = 'button';
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-drop'
            }
        }));
    }

    // open属性变化的时候
    attributeChangedCallback (name, oldValue, newValue) {
        if (name == 'target') {
            let eleTarget = document.getElementById(newValue);
            if (eleTarget) {
                this.element.target = eleTarget;
            }
        } else if (name == 'open') {
            let strAriaExpanded = this.element.trigger.getAttribute('aria-expanded');
            if (this.open && strAriaExpanded == 'false') {
                this.show();
            } else if (!this.open && strAriaExpanded == 'true') {
                this.hide();
            }
        }
    }

    // 设置参数方法
    setParams (options) {
        options = options || {};
        // 显示与隐藏的回调
        let funCallShow = options.onShow;
        let funCallHide = options.onHide;
        if (typeof funCallShow == 'function') {
            this.addEventListener('show', function (event) {
                funCallShow.call(this, event);
            });

            delete options.onShow;
        }
        if (typeof funCallHide == 'function') {
            this.addEventListener('hide', function (event) {
                funCallHide.call(this, event);
            });

            delete options.onHide;
        }
        // 参数合并
        Object.assign(this.params, options || {});
    }

    /**
     * 下拉定位的事件处理
     * @return {[type]} [description]
     */
    events (isIgnoreTarget) {
        // 元素
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        if (!eleTarget && !isIgnoreTarget) {
            return;
        }

        if (eleTarget && eleTarget.matches('datalist')) {
            return;
        }

        // 参数
        const objParams = this.params;

        // 获取匹配选择器的eleTrigger子元素
        const funGetClosestChild = (element) => {
            if (!objParams.selector) {
                return null;
            }

            const eleClosestSelector = element.closest(objParams.selector);
            if (eleTrigger.contains(eleClosestSelector) == false) {
                return null;
            }

            return eleClosestSelector;
        };

        // 根据不同事件类型进行逻辑处理
        switch (objParams.eventType) {
            // 默认值，直接显示
            case 'null': {
                break;
            }
            case 'hover': case 'mouseover': case 'mouseenter': {
                // hover处理需要增加延时
                eleTarget.timerHover = null;
                // 同时，从trigger移动到target也需要延时，
                // 因为两者可能有间隙，不能单纯移出就隐藏
                eleTarget.timerHold = null;
                // 此if逻辑用来避免事件重复绑定
                // 因为Panel或List方法会再次执行一遍events()方法
                if (!eleTrigger.isBindDropEvents) {
                    // 事件走起
                    eleTrigger.addEventListener('mouseover', event => {
                        // 不是在元素自身移动
                        if (event.relatedTarget !== event.target) {
                            // 委托查询
                            const eleClosestSelector = funGetClosestChild(event.target);

                            // 如果走委托
                            if (eleClosestSelector) {
                                // 改变trigger元素
                                this.element.trigger = eleClosestSelector;
                            }

                            // 显示定时器
                            if (!objParams.selector || eleClosestSelector) {
                                // 显示的定时器
                                eleTarget.timerHover = setTimeout(() => {
                                    this.show();
                                }, 150);

                                // 去除隐藏的定时器
                                clearTimeout(eleTarget.timerHold);
                            }
                        }
                    });

                    eleTrigger.addEventListener('mouseout', (event) => {
                        // 这个 if 判断主要是兼容设置了 options.selector 参数的场景
                        // 避免容器元素鼠标移出的时候才隐藏，因为是容器内委托的元素移除隐藏
                        if (this.element.trigger == event.target || this.element.trigger.contains(event.target)) {
                            // 清除显示的定时器
                            clearTimeout(eleTarget.timerHover);
                            // 隐藏的定时器
                            eleTarget.timerHold = setTimeout(() => {
                                this.hide();
                            }, 200);
                        }
                    });

                    if (eleTarget && !eleTarget.isBindDropHover) {
                        eleTarget.addEventListener('mouseenter', () => {
                            // 去除隐藏的定时器
                            clearTimeout(eleTarget.timerHold);
                        });
                        eleTarget.addEventListener('mouseleave', () => {
                            // 隐藏
                            eleTarget.timerHold = setTimeout(() => {
                                // 需要触发元素也是hover类型
                                let eleRelatedTrigger = eleTarget.element.trigger;
                                // eleRelatedTrigger是<ui-drop>元素
                                if (eleRelatedTrigger && eleRelatedTrigger.eventType == 'hover') {
                                    eleRelatedTrigger.hide();
                                }
                            }, 100);
                        });

                        eleTarget.isBindDropHover = true;
                    }

                    // 键盘支持，原本使用focus事件，但并不利于键盘交互
                    eleTrigger.addEventListener('click', event => {
                        // window.isKeyEvent表示是否键盘触发，来自Keyboard.js
                        if (!window.isKeyEvent) {
                            return;
                        }

                        event.preventDefault();

                        const eleClosestSelector = funGetClosestChild(event.target);
                        // 如果走委托
                        if (eleClosestSelector) {
                            // 改变trigger元素
                            this.element.trigger = eleClosestSelector;
                        }

                        // 显示定时器
                        if (!objParams.selector || eleClosestSelector) {
                            // 点击即显示
                            if (!this.open) {
                                this.show();
                            } else {
                                this.hide();
                            }
                        }
                    });

                    // 统一设置事件类型为hover
                    if (this.eventType != 'hover') {
                        this.eventType = 'hover';
                    }
                }

                break;
            }

            // 点击或者右键
            case 'click': case 'contextmenu': {
                if (!eleTrigger.isBindDropEvents || eleTrigger.isBindDropEvents !== objParams.eventType) {
                    eleTrigger.addEventListener(objParams.eventType, event => {
                        event.preventDefault();
                        // aria支持
                        // 获得委托的选择器匹配元素
                        const eleClosestSelector = funGetClosestChild(event.target);

                        if (eleClosestSelector) {
                            // 改变trigger元素
                            this.element.trigger = eleClosestSelector;
                        }

                        // 点击即显示
                        if (!objParams.selector || eleClosestSelector) {
                            // 连续右键点击保持显示，非显隐切换
                            if (objParams.eventType == 'contextmenu') {
                                objParams.position = [event.pageX, event.pageY];
                                this.show();

                                return;
                            }

                            if (!this.open) {
                                this.show();
                            } else {
                                this.hide();
                            }
                        }
                    });
                }

                break;
            }
        }

        // 点击页面空白区域隐藏
        if (objParams.eventType != 'null' && !eleTrigger.isBindDocMouseUp) {
            document.addEventListener('mouseup', event => {
                let eleClicked = event && event.target;

                if (!eleClicked || !this.open) {
                    return;
                }

                // 因为trigger和target可能动态变化
                // 因此这里再次获取一遍
                let eleTrigger = this.element.trigger;
                let eleTarget = this.element.target;

                if (eleTrigger.contains(eleClicked) == false && (!eleTarget || eleTarget.contains(eleClicked) == false)) {
                    this.hide();
                }
            });

            eleTrigger.isBindDocMouseUp = true;
        }

        eleTrigger.isBindDropEvents = objParams.eventType || true;

        // 窗体尺寸改变生活的重定位
        window.addEventListener('resize', () => {
            this.position();
        });

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    /**
     * 下拉定位处理
     * @return {Object} 返回当前自定义元素
     */
    position () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 下拉必须是显示状态才执行定位处理
        if (this.open && eleTarget && window.getComputedStyle(eleTrigger).display != 'none') {
            eleTrigger.follow(eleTarget, {
                offsets: this.params.offsets,
                position: this.params.position,
                edgeAdjust: this.params.edgeAdjust
            });
        }

        return this;
    }

    /**
     * 下拉的显示处理
     * @return {Object} 返回当前自定义元素
     */
    show () {
        // target需要在页面中
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 如果target在内存中，append到页面上
        if (eleTarget && document.body.contains(eleTarget) == false) {
            document.body.appendChild(eleTarget);
        }

        if (eleTarget) {
            // 进行定位
            eleTarget.style.position = 'absolute';
            eleTarget.style.display = 'inline';
            // 键盘ESC隐藏支持
            eleTarget.classList.add('ESC');
            eleTarget.tabIndex = -1;
            // 焦点转移到浮层元素上
            eleTarget.focus({
                preventScroll: true
            });

            // 标记target此时对应的trigger元素
            eleTarget.element = eleTarget.element || {};
            eleTarget.element.trigger = this;
        }
        // aria
        eleTrigger.setAttribute('aria-expanded', 'true');

        // 改变显示标志量
        if (!this.open) {
            this.open = true;
        }

        // 定位
        this.position();

        // 触发自定义事件 - show
        this.dispatchEvent(new CustomEvent('show'));

        // 如果trigger元素非<ui-drop>元素，则也触发一下，同时传递show事件来源
        // 因为一个普通的HTML元素可能会LuLu ui不同的组件触发'show'事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }

    /**
     * 下拉的隐藏处理
     * @return {Object} 返回当前自定义元素
     */
    hide () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 隐藏下拉面板
        if (eleTarget) {
            eleTarget.style.display = 'none';
            eleTarget.classList.remove('ESC');
            // 取消target元素上的trigger关联
            // 因为一个target元素可以关联多个trigger
            if (eleTarget.element) {
                delete eleTarget.element.trigger;
            }
        }

        // aria
        eleTrigger.setAttribute('aria-expanded', 'false');

        if (window.isKeyEvent) {
            eleTrigger.focus();
        }

        // 更改显示标志量
        if (this.open) {
            this.open = false;
        }

        // 触发自定义事件 - hide
        this.dispatchEvent(new CustomEvent('hide'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('hide', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }


    /**
     * drop 拓展list
     * @date 2019-11-01
     * @returns {object} 返回当前自定义元素
     * 兼容以下几种语法
     * new Drop().list(eleTrigger, data);
     * new Drop().list(eleTrigger, data, options);
     * new Drop(eleTrigger).list(data, options);
     * new Drop(eleTrigger, options).list(data);
     */
    list (eleTrigger, data, options) {
        // 基于类型进行参数判断
        [...arguments].forEach(argument => {
            const strTypeArgument = typeof argument;
            if (strTypeArgument === 'string') {
                eleTrigger = document.querySelector(argument);
            } else if (strTypeArgument === 'function') {
                data = argument;
            } else if (strTypeArgument === 'object') {
                if (typeof argument.nodeType === 'number') {
                    // 支持从原生的列表元素中获取数据信息
                    if (argument.matches('datalist')) {
                        data = function () {
                            return [...argument.querySelectorAll('option')].map((option, index) => {
                                let value = option.innerHTML;
                                let id = option.value;
                                if (!value) {
                                    value = option.value;
                                    id = option.id || index;
                                    // 如果依然没有数据，认为是分隔线
                                    if (!value) {
                                        return {};
                                    }
                                }
                                return {
                                    id: id,
                                    value: value,
                                    selected: option.selected,
                                    disabled: option.disabled
                                };
                            });
                        };
                        if (eleTrigger == argument) {
                            eleTrigger = null;
                        }
                    } else {
                        eleTrigger = argument;
                    }
                } else if (argument.map) {
                    data = argument;
                } else {
                    options = argument;
                }
            }
        });

        if (eleTrigger && typeof eleTrigger.nodeType !== 'number') {
            eleTrigger = null;
        }
        eleTrigger = eleTrigger || this.element.trigger;

        // 触发元素和数据是必须项
        if (!eleTrigger) {
            return this;
        }

        if (!data) {
            data = [];
        }

        const defaults = {
            // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏。
            eventType: 'click',
            offsets: {
                x: 0,
                y: 0
            },
            position: '4-1',
            selector: '',
            width: '',
            onShow: () => {},
            onHide: () => {},
            // this为当前点击的列表元素，支持两个参数，第一个参数为列表元素对应的数据(纯对象)，第二个是当前实例对象
            onSelect: () => {}
        };

        // 参数处理
        const objParams = {};
        options = options || {};

        Object.keys(defaults).forEach(prop => {
            objParams[prop] = options[prop] || this.params[prop] || defaults[prop];
        });

        // 一些常量
        const SELECTED = 'selected';
        const DISABLED = 'disabled';
        // ui类名
        // 类名变量
        // 样式类名统一处理

        const CL = {
            add: function () {
                return ['ui-droplist'].concat([].slice.call(arguments)).join('-');
            },
            toString: () => {
                return 'ui-droplist';
            }
        };

        // trigger元素赋值的方法
        let strMethod = 'innerHTML';
        if (eleTrigger.matches('input')) {
            strMethod = 'value';
        }

        // target元素创建
        let eleTarget = document.createElement('div');
        eleTarget.setAttribute('role', 'listbox');
        eleTarget.setAttribute('tabindex', '-1');

        // 宽度处理
        if (/^\d+$/.test(objParams.width)) {
            eleTarget.style.width = objParams.width + 'px';
        } else {
            eleTarget.style.width = objParams.width;
        }
        eleTarget.className = CL.add('x');

        // 存储原始参数值
        this.data = data;

        // 列表渲染需要的数组项
        let arrListData = data;

        // 索引值内容的匹配
        let funGetMatchIndex = (arr) => {
            // 初始的匹配和默认索引值获取（如果没有设置selected选项）
            // 匹配的索引值
            let strMatchIndex = '-1';
            // 是否默认包含选中项
            let isSomeItemSelected = false;

            // 遍历数据
            // 目的是获得匹配索引，和改变默认值（如果有设置selected选项）
            // 由于数据可能无限嵌套，因此走递归
            let funRecursion = (arrData, arrIndex) => {
                if (!arrData || !arrData.length) {
                    return;
                }

                arrData.forEach((objData, numIndex) => {
                    // 此时数组项的索引深度
                    const arrCurrentIndex = arrIndex.concat(numIndex);

                    // 多级数据结构
                    if (objData && objData.data) {
                        funRecursion(objData.data, arrCurrentIndex);
                        return;
                    }

                    if (objData && objData[SELECTED] && !objData[DISABLED] && objData.value) {

                        eleTrigger[strMethod] = objData.value;

                        // 找到设置了selected的选项，并记住索引
                        strMatchIndex = arrCurrentIndex.join('-');
                    }

                    // 修改全局判断，这样，eleTrigger无需
                    // 再根据本身内容确定默认的选中项了
                    if (objData && objData[SELECTED]) {
                        isSomeItemSelected = true;
                    }
                });
            };

            funRecursion(arr, []);

            // 此时trigger元素内部的内容
            const strTrigger = (eleTrigger[strMethod] || '').trim();

            // 根据eleTrigger的内容信息确定哪个数据是selected
            // 遍历数据
            if (isSomeItemSelected == false && strTrigger) {
                funRecursion = (arrData, arrIndex) => {
                    if (!arrData || !arrData.length) {
                        return;
                    }

                    arrData.forEach((objData, numIndex) => {
                        // 此时数组项的索引深度
                        const arrCurrentIndex = arrIndex.concat(numIndex);

                        // 多级数据结构
                        if (objData && objData.data) {
                            funRecursion(objData.data, arrCurrentIndex);
                            return;
                        }
                        // 如果有匹配，设置为选中
                        if (typeof objData.value === 'string' && objData.value.trim() == strTrigger) {
                            strMatchIndex = arrCurrentIndex.join('-');

                            // 设置为选中
                            objData[SELECTED] = true;
                        }
                    });
                };

                funRecursion(arr, []);
            }

            return strMatchIndex;
        };

        let strMatchIndex = -1;

        if (typeof data !== 'function' && data.length && data.map) {
            strMatchIndex = funGetMatchIndex(arrListData);
        }

        // 列表绘制渲染方法
        // 每次show的时候都执行刷新
        const funRender = (eleTarget, arrListData) => {
            if (typeof arrListData === 'function') {
                arrListData = arrListData();
                // 重新获取索引值，只有data是function类型的时候才执行
                strMatchIndex = funGetMatchIndex(arrListData);
            }

            // 没有数据时候的处理
            if (!arrListData || !arrListData.length) {
                arrListData = [{
                    value: '没有数据',
                    disabled: true
                }];
            } else {
                arrListData = arrListData.map(arrData => {
                    if (typeof arrData == 'string' && arrData !== '-') {
                        return {
                            value: arrData
                        };
                    }
                    return arrData;
                });
            }

            // 是否包含选中项
            let isSomeItemSelected = arrListData.some(objData => {
                return objData && objData[SELECTED];
            });

            // 列表数据更新
            eleTarget.innerHTML = (() => {
                let strHtml = '';

                const funStep = (arrData, arrIndex) => {

                    let strHtmlStep = '';

                    arrData.forEach((objData, numIndex) => {
                        // 为空数据作为分隔线
                        if (objData == '-' || objData === null || JSON.stringify(objData) == '{}') {
                            strHtmlStep += '<hr class="' + CL.add('hr') + '">';
                            return;
                        }

                        // 此时数组项的索引深度
                        const arrCurrentIndex = arrIndex.concat(numIndex);

                        // 一些属性值
                        const strAttrHref = objData.href || 'javascript:';

                        // target属性
                        let strAttrTarget = '';
                        if (objData.target) {
                            strAttrTarget = ' target="' + objData.target + '"';
                        }

                        // 是否包含子项
                        let strAttrSublist = '';
                        if (objData.data) {
                            strAttrSublist = ' data-sublist';
                        }

                        // label标记
                        let strAttrLabel = '';
                        if (objData.label) {
                            strAttrLabel = ' aria-label="' + objData.label + '"';
                        }

                        // 如果数据不含选中项，使用存储的索引值进行匹配
                        if (isSomeItemSelected == false && strMatchIndex == arrCurrentIndex.join('-')) {
                            objData[SELECTED] = true;
                        }

                        // 类名
                        let strAttrClass = CL.add('li');
                        if (objData[SELECTED]) {
                            strAttrClass = strAttrClass + ' ' + SELECTED;
                        }

                        // 禁用态和非禁用使用标签区分
                        // 如果想要支持多级，data-index值可以"1-2"这样
                        if (objData[DISABLED] != true) {
                            strHtmlStep += '<a href="' + strAttrHref + '"' + strAttrTarget + strAttrLabel + ' class="' + strAttrClass + '" data-index="' + arrCurrentIndex.join('-') + '" role="option" aria-selected="' + (objData[SELECTED] || 'false') + '" ' + strAttrSublist + '>' + objData.value + '</a>';

                            if (objData.data) {
                                strHtmlStep += '<div class="' + CL.add('xx') + '"><div class="' + CL.add('x') + '" role="listbox">' + funStep(objData.data, arrCurrentIndex) + '</div></div>';
                            }
                        } else {
                            strHtmlStep += '<span class="' + strAttrClass + '"' + strAttrLabel + '>' + objData.value + '</span>';
                        }

                    });

                    return strHtmlStep;
                };

                strHtml += funStep(arrListData, []);

                return strHtml;
            })();

            // 存储在DOM对象上，给回调使用
            eleTarget.listData = arrListData;
        };

        // 重新初始化 drop
        this.setParams({
            eventType: objParams.eventType,
            offsets: objParams.offsets,
            selector: objParams.selector,
            position: objParams.position,
            onShow: function () {
                funRender.call(this, eleTarget, this.data);
                objParams.onShow.apply(this, arguments);
            },
            onHide: objParams.onHide
        });

        this.element.trigger = eleTrigger;
        this.element.target = eleTarget;

        // 新的事件
        this.events();

        // 绑定事件
        eleTarget.addEventListener('click', event => {
            // IE可能是文件节点
            if (event.target.nodeType != 1 || !event.target.closest) {
                return;
            }
            // 目标点击元素
            const eleClicked = event.target.closest('a');

            // 未获取到元素返回
            if (!eleClicked) {
                return;
            }

            // 当前列表显示使用的数据
            const arrListData = eleTarget.listData;

            // 如果是多级嵌套列表，这里需要额外处理
            const strIndex = eleClicked.getAttribute('data-index');

            if (!strIndex) {
                return;
            }

            // 根据点击的元素索引获取对应的数据对象
            let objItemData = null;
            strIndex.split('-').forEach(numIndex => {
                if (objItemData === null) {
                    objItemData = arrListData[numIndex];
                } else if (objItemData.data) {
                    objItemData = objItemData.data[numIndex];
                } else {
                    objItemData = objItemData[numIndex];
                }
            });

            // 如果这里返回，说明数据有问题
            // 或者代码逻辑有bug
            if (!objItemData) {
                return;
            }

            // 点击包含下级数据的列表
            if (typeof eleClicked.getAttribute('data-sublist') === 'string') {
                eleClicked.classList.add(SELECTED);

                // 此时显示的下级列表元素
                const eleSubTarget = eleClicked.nextElementSibling.querySelector('.' + CL.add('x'));

                if (!eleSubTarget) {
                    return;
                }
                // 偏移还原
                // 否则会A/B重定位
                eleSubTarget.style.transform = '';
                eleSubTarget.classList.remove('reverse');

                // 此时偏移
                const objBounding = eleSubTarget.getBoundingClientRect();
                // 水平方向是方向变化，这里使用document.documentElement宽度判断
                // 因为window.innerWidth包括滚动条宽度，可能会导致水平滚动条出现
                // 交给CSS控制
                if (objBounding.right > document.documentElement.clientWidth) {
                    eleSubTarget.classList.add('reverse');
                }

                // 垂直方向偏移
                let offsetTop = 0;

                if (objBounding.bottom > window.innerHeight) {
                    offsetTop = window.innerHeight - objBounding.bottom;
                }

                eleSubTarget.style.transform = 'translateY(' + offsetTop + 'px)';

                return;
            }

            // 改变选中索引
            if (strIndex != strMatchIndex) {
                let objLastItemData = null;

                if (strMatchIndex != '-1') {
                    strMatchIndex.split('-').forEach(numIndex => {
                        if (objLastItemData === null) {
                            objLastItemData = arrListData[numIndex];
                        } else if (objLastItemData.data) {
                            objLastItemData = objLastItemData.data[numIndex];
                        } else {
                            objLastItemData = objLastItemData[numIndex];
                        }
                    });

                    if (objLastItemData) {
                        delete objLastItemData[SELECTED];
                    }
                }

                // 设置为true
                objItemData[SELECTED] = true;

                // 更新匹配索引
                strMatchIndex = strIndex;
            }

            // 触发用户自定义选择事件
            (this.params.onSelect || objParams.onSelect).call(this, objItemData, eleClicked);

            // 触发自定义事件 - select
            this.dispatchEvent(new CustomEvent('select'), {
                data: objItemData,
                target: eleClicked
            });

            // 如果trigger元素非<ui-drop>元素，则也触发一下，同时传递select事件来源
            // 如果是在Vue中，可以使用@select绑定选择事件
            if (eleTrigger != this) {
                eleTrigger.dispatchEvent(new CustomEvent('select', {
                    detail: {
                        type: 'ui-drop',
                        data: objItemData,
                        target: eleClicked
                    }
                }));
            }

            // 不是鼠标右击事件，也不是委托模式更新
            if (objParams.eventType != 'contextmenu' && objParams.selector == '' && !objItemData.href) {
                eleTrigger[strMethod] = objItemData.value;
            }
            // 隐藏
            this.hide();
        });

        // hover时候次级列表也显示
        eleTarget.addEventListener('mouseover', event => {
            // IE可能是文件节点
            if (event.target.nodeType != 1 || !event.target.closest) {
                return;
            }
            const eleHovered = event.target.closest('a');

            if (!eleHovered) {
                return;
            }

            const eleItemSublist = eleHovered.parentElement.querySelector('.' + SELECTED + '[data-sublist]');

            if (eleItemSublist && eleItemSublist != eleHovered) {
                eleItemSublist.classList.remove(SELECTED);
            }
            if (eleHovered.classList.contains(SELECTED) == false && typeof eleHovered.getAttribute('data-sublist') === 'string') {
                eleHovered.click();
            }
        });

        return this;
    }

    /**
     * drop 拓展panel
     * @date 2019-11-01
     * 兼容以下两种语法
     * new Drop().panel(eleTrigger, options);
     * new Drop(eleTrigger).panel(options);
     * new Drop(eleTrigger).panel(eleTarget);
     * @returns {object} 返回当前自定义元素
     */
    panel (eleTrigger, options) {
        // 不同类型参数的处理
        if (arguments.length === 2) {
            eleTrigger = arguments[0];
            options = arguments[1];
        } else if (arguments.length === 1) {
            options = arguments[0];

            if (options.matches && options.matches('dialog')) {
                let eleTarget = options;
                // 按钮信息
                let strButtons = eleTarget.dataset.buttons || '';

                options = {
                    content: eleTarget.innerHTML,
                    title: eleTarget.title,
                    buttons: [{
                        value: strButtons.split(',')[0].trim(),
                        events: () => {
                            eleTarget.dispatchEvent(new CustomEvent('ensure', {
                                detail: {
                                    drop: this
                                }
                            }));
                        }
                    }, {
                        value: (strButtons.split(',')[1] || '').trim(),
                        events: () => {
                            eleTarget.dispatchEvent(new CustomEvent('cancel', {
                                detail: {
                                    drop: this
                                }
                            }));
                            this.hide();
                        }
                    }]
                };
            }

            eleTrigger = null;
        }
        if (typeof eleTrigger === 'string') {
            eleTrigger = document.querySelector(eleTrigger);
        }

        eleTrigger = eleTrigger || this.element.trigger;

        if (!eleTrigger) {
            return this;
        }

        const defaults = {
            title: '',
            content: '',
            buttons: [{}, {}],
            width: 'auto',
            eventType: 'click',
            selector: '',
            offsets: {
                x: 0,
                y: 0
            },
            position: '4-1',
            onShow: () => { },
            onHide: () => { }
        };

        // Drop 配置
        const objParams = Object.assign({}, defaults, options || {});

        // ui类名
        // 类名变量
        // 样式类名统一处理
        const CL = {
            add: function () {
                return ['ui-dropanel'].concat([].slice.call(arguments)).join('-');
            },
            toString: () => {
                return 'ui-dropanel';
            }
        };

        // 面板容器
        const elePanel = document.createElement('div');
        elePanel.className = CL.add('x');
        // 面板的宽度设置
        // 如果纯数值，认为是px长度
        if (/^\d+$/.test(objParams.width)) {
            elePanel.style.width = objParams.width + 'px';
        } else if (/^\d+\D+$/.test(objParams.width)) {
            elePanel.style.width = objParams.width;
        }

        // 创建轻弹框面板的各个元素
        // title
        const eleTitle = document.createElement('h5');
        eleTitle.className = CL.add('title');
        eleTitle.innerHTML = objParams.title;

        // close button
        const eleClose = document.createElement('button');
        eleClose.setAttribute('aria-label', '关闭');
        eleClose.className = CL.add('close');

        // content
        const eleContent = document.createElement('content');
        eleContent.className = CL.add('content');
        eleContent.innerHTML = objParams.content;

        // footer
        const eleFooter = document.createElement('div');
        eleFooter.className = CL.add('footer');

        // 组装
        elePanel.appendChild(eleTitle);
        elePanel.appendChild(eleClose);
        elePanel.appendChild(eleContent);
        elePanel.appendChild(eleFooter);

        // 初始化
        this.setParams({
            eventType: objParams.eventType,
            offsets: objParams.offsets,
            // 实现点击或hover事件的委托实现
            selector: objParams.selector,
            position: objParams.position,
            onShow: objParams.onShow,
            onHide: objParams.onHide
        });

        // 重新添加element
        Object.assign(this.element, {
            trigger: eleTrigger,
            target: elePanel,
            panel: elePanel,
            title: eleTitle,
            close: eleClose,
            content: eleContent,
            footer: eleFooter
        });

        // 事件初始化
        this.events();

        // 绑定事件
        // 关闭事件
        eleClose.addEventListener('click', () => {
            this.hide();
        }, false);

        // 按钮
        objParams.buttons.forEach((objBtn, numIndex) => {
            // 避免btn为null等值报错
            objBtn = objBtn || {};
            // 按钮的默认参数
            let strType = objBtn.type || '';
            if (!strType && numIndex == 0) {
                strType =  objParams.buttons.length > 1 ? 'danger' : 'primary';
            }
            let strValue = objBtn.value;
            if (!strValue) {
                strValue = ['确定', '取消'][numIndex];
            }

            // 如果没有指定事件，则认为是关闭行为
            let objEvents = objBtn.events || {
                click: () => {
                    this.hide();
                }
            };

            // 如果没有指定事件类型，直接是函数
            // 则认为是点击事件
            if (typeof objEvents === 'function') {
                objEvents = {
                    click: objEvents
                };
            }

            let eleBtn = null;

            // 普通按钮
            if (objBtn['for']) {
                eleBtn = document.createElement('label');
                eleBtn.setAttribute('for', objBtn['for']);
                eleBtn.setAttribute('role', 'button');
            } else if (objBtn.form) {
                eleBtn.setAttribute('form', objBtn.form);
                eleBtn.type = 'submit';
            } else {
                eleBtn = document.createElement('button');
                this.element['button' + numIndex] = eleBtn;
            }
            // 按钮的文案
            eleBtn.innerHTML = strValue;
            // 按钮类名
            eleBtn.className = String(CL).replace('dropanel', 'button') + ' ' + CL.add('button') + ' ' + (objBtn.className || '');
            // 按钮的类型
            if (strType) {
                eleBtn.setAttribute('data-type', strType);
            }
            this.element['button' + numIndex] = eleBtn;

            for (let strEventType in objEvents) {
                eleBtn.addEventListener(strEventType, event => {
                    event.drop = this;
                    objEvents[strEventType](event);
                }, false);
            }
            this.element.footer.appendChild(eleBtn);
        });

        return this;
    }
}

window.Drop = Drop;

if (!customElements.get('ui-drop')) {
    customElements.define('ui-drop', Drop);
}

/**
 * 初始化所有包含is-drop属性的节点
 * 支持事件冒泡，当点击的元素或者祖先元素，设置了is-drop属性，则把is-drop的属性值作为下拉元素的id，并根据这个id值获取并显示下拉元素。
 */
const initAllIsDropAttrAction = (ele) => {
    const eleDrops = ele || document.querySelectorAll('[is-drop]');
    eleDrops.forEach(eleTrigger => {
        let eleTargetId = eleTrigger.getAttribute('is-drop');
        if (eleTargetId) {
            eleTrigger.dataset.target = eleTargetId;
        }
        // 基于data-target获取元素
        eleTargetId = eleTrigger.dataset.target;
        let eleTarget = eleTargetId && document.getElementById(eleTargetId);
        if (eleTarget) {
            eleTrigger['ui-drop'] = new Drop(eleTrigger, eleTarget);
            // 隐藏<ui-drop>元素细节
            eleTrigger['ui-drop'].addEventListener('connected', function () {
                this.remove();
            });
        }
    });
};

/**
 * 初始化并监听页面包含is-drop属性的DOM节点变化
 */
const autoInitAndWatchingIsDropAttr = () => {
    // 先实例化已有is-drop属性的DOM节点，再监听后续的节点变化
    initAllIsDropAttrAction();

    const observer = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                if (!eleAdd.tagName) {
                    return;
                }
                if (eleAdd.hasAttribute('is-drop')) {
                    initAllIsDropAttrAction([eleAdd]);
                } else {
                    initAllIsDropAttrAction(eleAdd.querySelectorAll('[is-drop]'));
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

if (document.readyState != 'loading') {
    autoInitAndWatchingIsDropAttr();
} else {
    window.addEventListener('DOMContentLoaded', autoInitAndWatchingIsDropAttr);
}

export default Drop;
