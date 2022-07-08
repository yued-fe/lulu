/*
 * @Select.js
 * @author liuwentao
 * @version
 * @Created: 2020-06-09
 * @edit: 2020-06-09
**/

/**/import UiPopup from '../Popup/index.js';
/**/import '../Layout/list.js';

/**/(async () => {
/**/    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
/**/        await import('../safari-polyfill.js');
/**/    }

    class UiSelect extends HTMLSelectElement {

        static get observedAttributes () {
            return ['width', 'height', 'radius', 'open', 'color'];
        }

        constructor () {
            super();

            // 关联的元素们
            if (!this.element) {
                this.element = {
                    trigger: null,
                    popup: null
                };
            }
            // 尺寸变化的观察器
            this.resizeObserver = null;
            this.intersectionObserver = null;

            // 重置原生的属性
            this.setProperty();
        }

        set popup (value) {
            this.toggleAttribute('popup', Boolean(value));

            // 弹出选择层的动态处理
            if (!this.element.popup) {
                this.create();
                this.events();
            }
        }
        get popup () {
            return this.hasAttribute('popup');
        }

        set open (value) {
            this.toggleAttribute('open', Boolean(value));
        }
        get open () {
            return this.hasAttribute('open');
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        get font () {
            let fontSize = this.getAttribute('font');
            if (!isNaN(fontSize) && !isNaN(parseFloat(fontSize))) {
                fontSize = fontSize + 'px';
            }
            return fontSize;
        }

        set font (val) {
            this.setAttribute('font', val);
        }

        get color () {
            return this.getAttribute('color');
        }

        set color (val) {
            this.setAttribute('color', val);
        }

        get radius () {
            let radius = this.getAttribute('radius');
            if (!isNaN(radius) && !isNaN(parseFloat(radius))) {
                radius = radius + 'px';
            }
            return radius;
        }

        set radius (val) {
            this.setAttribute('radius', val);
        }

        // 创建必要的元素
        create () {
            // trigger 元素
            if (!this.element.trigger && this.hasAttribute('trigger')) {
                this.element.trigger = document.getElementById(this.getAttribute('trigger'));
            }

            if (!this.element.trigger) {
                // 浮在原生下拉框上的元素
                let eleTrigger = document.createElement('ui-select');
                eleTrigger.setAttribute('is', 'ui-select');

                // 插入到前面
                this.insertAdjacentElement('beforebegin', eleTrigger);

                // 是否是静态定位
                if (getComputedStyle(eleTrigger).position == 'static') {
                    eleTrigger.style.position = 'absolute';
                }
                // 层级高一个
                let numZIndex = getComputedStyle(this).zIndex;
                if (typeof numZIndex == 'number') {
                    eleTrigger.style.zIndex = numZIndex + 1;
                }

                // 和下拉元素关联
                this.element.trigger = eleTrigger;

                // 尺寸和定位
                this.resize();
            }

            // popup 元素创建
            if (!this.element.popup) {
                this.element.popup = new UiPopup({
                    transition: true,
                    overlay: {
                        touch: 'none'
                    },
                    radius: true,
                    width: 'calc(100% - 2rem)',
                    style: {
                        maxHeight: 'calc(100% - 10rem)'
                    }
                });
            }

            // DOM 创建完毕的事件
            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }

        /**
         * 下拉内容的刷新
         */
        refresh () {
            // 主要的几个元素
            let elePopup = this.element.popup;
            if (!elePopup) {
                return;
            }

            if (!this.options.length) {
                elePopup.content = '<div class="ui-select-empty">没有选项</div>';
                return;
            }

            // <select> 元素隐射
            // <optgroup> -> <ui-list>
            // <option> -> <ui-list-item>

            // 单选还是复选
            let type = 'radio';
            const isMutiple = this.multiple;
            if (isMutiple) {
                type = 'checkbox';
            }

            // 随机 name 值
            let name = ('n' + Math.random()).replace('0.', '');

            // 索引值
            let index = -1;

            // 最终的内容
            let funGetItem = (option) => {
                let eleList = document.createElement('ui-list-item');
                eleList.className = option.className;
                eleList.setAttribute('space', '');
                // 索引值递增
                // 作用是，当所有 option 都没有 value 的时候，通过
                // index 值进行选中匹配
                index++;
                // 里面的选择框
                eleList.innerHTML = `<input
                    type="${type}"
                    name="${name}"
                    value="${option.value}"
                    ${option.selected ? 'checked' : ''}
                    ${option.disabled ? 'disabled' : ''}
                    data-index="${index}"
                >${option.innerHTML}`;

                return eleList;
            };

            // 放在 form 元素中
            let eleForm = document.createElement('form');
            // 遍历处理
            [...this.children].forEach((child) => {
                let eleList = null;
                if (child.matches('optgroup')) {
                    eleList = document.createElement('ui-list');
                    if (child.label) {
                        eleList.setAttribute('label', child.label);
                    }
                    if (child.disabled) {
                        eleList.setAttribute('disabled', '');
                    }
                    eleList.className = child.className;
                    // 子元素处理
                    child.querySelectorAll('option').forEach(option => {
                        // 禁用覆盖到子元素
                        if (child.disabled) {
                            option.disabled = true;
                        }
                        eleList.appendChild(funGetItem(option));
                    });
                } else if (child.matches('option')) {
                    eleList = funGetItem(child);
                }

                eleForm.appendChild(eleList);
            });

            // 多选增加确定按钮
            if (isMutiple) {
                let eleListBtn = document.createElement('ui-flex');
                eleListBtn.innerHTML = `<button type="reset" is="ui-button" blank>重置</button>
                <hr v>
                <button type="button" is="ui-button" data-type="primary" blank>确定</button>`;
                eleForm.append(eleListBtn);
            }

            // 内容显示
            elePopup.content = eleForm
        }

        /**
         * 下拉的事件处理
         */
        events () {
            const eleTrigger = this.element.trigger;
            const elePopup = this.element.popup;

            if (eleTrigger && elePopup) {
                eleTrigger.addEventListener('click', () => {
                    elePopup.show();
                });
                elePopup.addEventListener('show', () => {
                    this.refresh();
                });

                // 弹出层的列表选中处理
                const eleContainer = elePopup.element.container;
                eleContainer.addEventListener('click', event => {
                    let eleTarget = event.target;
                    if (!eleTarget || !eleTarget.type) {
                        return;
                    }

                    // 重置，原设想这里代码是不需要的
                    // 但是 click 执行比 reset 重置要快，
                    // 所以这里插了这个处理
                    if (eleTarget.type == 'reset') {
                        eleTarget.closest('form').reset();
                    }

                    if (eleTarget.type === 'radio') {
                        if (eleTarget.value) {
                            this.value = eleTarget.value;
                        } else {
                            this.selectedIndex = Number(eleTarget.dataset.index);
                        }
                    } else if (this.multiple) {
                        this.value = [...eleContainer.querySelectorAll(`[type="checkbox"]:checked`)].map(checkbox => {
                            return checkbox.value;
                        }).join();
                    }

                    // 触发元素的内容替换
                    let arrTextSelected = [];                    
                    [...this.options].forEach(option => {
                        if (option.selected)  {
                            arrTextSelected.push(option.innerHTML);
                        }
                    });
                    let nodeText = document.createTextNode(arrTextSelected.join() || eleTrigger.originText || '');
                    let isNodeText = [...eleTrigger.childNodes].some(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            node.parentNode.replaceChild(nodeText, node);
                            return true;
                        }
                        return false;
                    });
                    // 如果没有文本节点
                    if (!isNodeText) {
                        eleTrigger.prepend(nodeText);
                    }
                    // 隐藏弹出层
                    if (eleTarget.type != 'checkbox') {
                        elePopup.remove();
                    }                    
                });

                // 如果 trigger 元素非自主创建
                // 则定位什么的都不做观察处理
                if (eleTrigger.matches('ui-select[is="ui-select"]')) {
                    // 尺寸变化同步变化
                    this.resizeObserver = new ResizeObserver(() => {
                        this.resize();
                    });
                    this.resizeObserver.observe(this);

                    // 位置变化时候也跟踪
                    // 发生在进入视区和离开视区
                    this.intersectionObserver = new IntersectionObserver(() => {
                        this.resize();
                    });
                    this.intersectionObserver.observe(this);
                }
                eleTrigger.originText = eleTrigger.textContent;
            }
        }

        /**
         * popup点击浮层根据下拉框的位置偏移
         */
        resize () {
            const objElement = this.element;
            let eleTrigger = objElement.trigger;

            if (!eleTrigger) {
                return;
            }

            // 按钮的尺寸和位置
            let objBoundSelect = this.getBoundingClientRect();
            // 尺寸设置
            eleTrigger.style.width = objBoundSelect.width + 'px';
            eleTrigger.style.height = objBoundSelect.height + 'px';
            // 偏移对比
            let objBoundTrigger = eleTrigger.getBoundingClientRect();
            let objStyleTrigger = getComputedStyle(eleTrigger);
            // 目前的偏移
            let numOffsetX = objStyleTrigger.getPropertyValue('--ui-offset-x') || 0;
            let numOffsetY = objStyleTrigger.getPropertyValue('--ui-offset-y') || 0;

            // 偏移误差
            let numDistanceX = objBoundSelect.left - objBoundTrigger.left;
            let numDistanceY = objBoundSelect.top - objBoundTrigger.top;

            // 设置新的偏移值
            eleTrigger.style.setProperty('--ui-offset-x', Number(numOffsetX) + numDistanceX);
            eleTrigger.style.setProperty('--ui-offset-y', Number(numOffsetY) + numDistanceY);
        }

        /**
         * 重置原生的属性
         */
        setProperty () {
            Object.defineProperty(this, 'value', {
                configurable: true,
                enumerable: true,
                writeable: true,
                get: () => {
                    let valArr = [];
                    [].slice.call(this.options).forEach((option) => {
                        if (option.selected) {
                            valArr.push(option.value);
                        }
                    });
                    return valArr.join();
                },
                set: (value) => {
                    let isMatch = false;
                    value = this.multiple ? value.split(',') : [value.toString()];
                    [].slice.call(this.options).forEach((option) => {
                        // 单选框模式下，如果多个值匹配，让第一个选中
                        // 如果没有下面这句，会最后一个匹配的选中
                        if (!this.multiple && isMatch) return;
                        if (value.indexOf(option.value) !== -1) {
                            option.selected = isMatch = true;
                        } else if (this.multiple) {
                            option.selected = false;
                        }
                    });

                    // 触发 change 事件
                    this.dispatchEvent(new CustomEvent('change'));
                }
            });

            const props = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
            Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', {
                ...props,
                set (v) {
                    if (this.options[v]) {
                        this.options[v].selected = true;
                    }
                }
            });
        }

        /**
         * <select>属性变化时候的处理
         * @param {String} name 变化的属性名称
         */
        renderAttribute (name, keep) {
            if (typeof this[name] == 'string') {
                this.style.setProperty('--ui-select-' + name, this[name]);
            } else if (!keep) {
                this.style.removeProperty('--ui-select-' + name);
            }
        }

        render () {
            UiSelect.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.render(name);
        }

        /**
         * is="ui-select" 元素载入到页面后
         */
        connectedCallback () {
            // 渲染
            if (this.popup) {
                this.create();
                this.events();
            }

            this.render();

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-select'
                }
            }));

            this.isConnectedCallback = true;
        }

        /**
         * is="ui-select" 元素从页面移除后
         */
        disconnectedCallback () {
            if (this.element.trigger) {
                this.element.trigger.remove();
            }
            if (this.element.popup) {
                this.element.popup.remove();
            }

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
        }
    }


    // 自定义元素注册
    if (!customElements.get('ui-select')) {
        customElements.define('ui-select', UiSelect, {
            extends: 'select'
        });
    }
/**/})();
