/**
 * @Range.js
 * @author xboxyan
 * @version
 * @created: 20-04-30
 * @edited:  22-02-28 by zhangxinxu
 */

/**/(async () => {
/**/    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
/**/        await import('../safari-polyfill.js');
/**/    }

    class UiRange extends HTMLInputElement {

        static get observedAttributes () {
            return ['max', 'min', 'step', 'disabled'].concat(UiRange.observedUIAttributes);
        }

        static get observedUIAttributes () {
            return ['color', 'width', 'height', 'size'];
        }

        constructor () {
            super();

            this.originTips = this.getAttribute('tips');

            if (!this.element) {
                this.element = {};
            }
        }

        get defaultrange () {
            return this.getAttribute('range') || `${this.getAttribute('from') || this.min || 0}, ${this.getAttribute('to') || this.max || 100}`;
        }

        set multiple (value) {
            return this.toggleAttribute('multiple', value);
        }

        get multiple () {
            return this.getAttribute('multiple') !== null;
        }

        get from () {
            if (this.element.brother) {
                return Math.min(this.value, this.element.brother.value);
            }
            return '';
        }

        get to () {
            if (this.element.brother) {
                return Math.max(this.value, this.element.brother.value);
            }
            return '';
        }

        get range () {
            if (this.multiple) {
                return this.from + ',' + this.to;
            }
            return '';
        }

        get isFrom () {
            // 是否为起始range
            if (this.element.brother) {
                return this.value - this.element.brother.value < 0;
            }
            return false;
        }

        set from (v) {
            if (this.element.brother) {
                if (this.isFrom) {
                    this.value = v;
                } else {
                    this.element.brother.value = v;
                }
            }
        }

        set to (v) {
            if (this.element.brother) {
                if (!this.isFrom) {
                    this.value = v;
                } else {
                    this.element.brother.value = v;
                }
            }
        }

        set range (v) {
            if (this.multiple) {
                const [from, to] = v.split(',');
                this.to = to;
                this.from = from;
            }
        }

        set tips (value) {
            if (!value) {
                this.removeAttribute('tips');
                return;
            }

            if (!this.originTips) {
                this.originTips = value;
            }

            this.setAttribute('tips', value);
        }

        get tips () {
            const originTips = this.originTips;
            if (!originTips) {
                return null;
            }

            // 值
            return `${new Function(...['value'], `return \`${originTips}\`;`)(...[this.value])}`;
        }

        get color () {
            return this.getAttribute('color');
        }

        set color (val) {
            this.setAttribute('color', val);
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

        get size () {
            let size = this.getAttribute('size');
            if (!isNaN(size) && !isNaN(parseFloat(size))) {
                size = size + 'px';
            }
            return size;
        }

        set size (val) {
            this.setAttribute('size', val);
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

        setMultiple () {
            let eleBrother = this.element.brother;
            // 按钮的尺寸和位置
            let objBoundRange = this.getBoundingClientRect();
            // 尺寸设置
            eleBrother.style.width = objBoundRange.width + 'px';
            eleBrother.style.height = objBoundRange.height + 'px';
            // 偏移对比
            let objBoundTrigger = eleBrother.getBoundingClientRect();
            let objStyleTrigger = getComputedStyle(eleBrother);
            // 目前的偏移
            let numOffsetX = objStyleTrigger.getPropertyValue('--ui-offset-x') || 0;
            let numOffsetY = objStyleTrigger.getPropertyValue('--ui-offset-y') || 0;

            // 偏移误差
            let numDistanceX = objBoundRange.left - objBoundTrigger.left;
            let numDistanceY = objBoundRange.top - objBoundTrigger.top;

            console.log(objBoundRange.left, objBoundTrigger.left);

            // 设置新的偏移值
            eleBrother.style.setProperty('--ui-offset-x', Number(numOffsetX) + numDistanceX);
            eleBrother.style.setProperty('--ui-offset-y', Number(numOffsetY) + numDistanceY);
        }

        connectedCallback () {
            // 一些事件
            this.addEventListener('input', this.renderPosition);
            this.addEventListener('touchstart', this.stopPropagation);

            let eleBrother = this.element.brother;

            // 使组件 [is="ui-range"] 一直存在
            if (this.getAttribute('is') === null) {
                this.setAttribute('is', 'ui-range');
            }

            // 区间选择
            if (this.multiple && !eleBrother && this.getAttribute('rel') !== 'brother') {
                eleBrother = this.cloneNode(false);
                eleBrother.removeAttribute('id');
                eleBrother.originTips = this.originTips;
                eleBrother.element = {
                    brother: this
                };
                this.element.brother = eleBrother;
                // 载入到页面中
                this.before(eleBrother);
                // 初始化一个前后关系
                eleBrother.setAttribute('rel', 'brother');
                // 范围
                this.range = this.defaultrange;

                // 尺寸观察
                // 观察尺寸变化
                let objResizeObserver = new ResizeObserver(() => {
                    // 尺寸和偏移处理
                    this.setMultiple();
                });
                // 观察文本域元素
                objResizeObserver.observe(this);
            }            

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-range'
                }
            }));

            this.isConnectedCallback = true;

            this.render();

            if (eleBrother && eleBrother.getAttribute('rel') == 'brother') {
                // 默认先计算下尺寸和位置
                this.setMultiple();
            }

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }

        disconnectedCallback () {
            this.removeEventListener('input', this.renderPosition);
            this.removeEventListener('touchstart', this.stopPropagation);

            if (this.element.brother && !this.exchange) {
                this.element.brother.remove();
            }
        }

        stopPropagation (ev) {
            ev.stopPropagation();
        }

        attributeChangedCallback (name, oldValue, newValue) {
            if (oldValue !== newValue) {
                if (name === 'disabled' && this.element.brother) {
                    this.element.brother.disabled = newValue !== null;
                } else if (['color', 'width', 'height'].includes(name)) {
                    this.renderAttribute(name);
                } else {
                    this.renderPosition();
                }
            }
        }

        renderAttribute (name, keep) {
            if (this[name] || typeof this[name] == 'string') {
                this.style.setProperty('--ui-range-' + name, this[name]);
                // 关键字值不处理
                if (name == 'size' && /^[a-z]+$/i.test(String(this[name]))) {
                    this.style.removeProperty('--ui-range-' + name);
                }
            } else if (!keep) {
                this.style.removeProperty('--ui-range-' + name);
            }
        }

        renderPosition () {
            const max = this.max || 100;
            const min = this.min || 0;
            this.style.setProperty('--percent', (this.value - min) / (max - min));

            this.tips = this.tips;

            this.style.setProperty('--from', this.from);
            this.style.setProperty('--to', this.to);

            const eleBrother = this.element.brother;

            if (eleBrother) {
                eleBrother.style.setProperty('--from', this.from);
                eleBrother.style.setProperty('--to', this.to);
            }
        }

        render () {
            this.renderPosition();
            UiRange.observedUIAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        addEventListener (...par) {
            document.addEventListener.apply(this, par);
            if (this.element.brother) {
                document.addEventListener.apply(this.element.brother, par);
            }
        }
    }

    const props = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(UiRange.prototype, 'value', {
        ...props,
        set (v) {
            props.set.call(this, v);
            // 重新渲染
            this.renderPosition();
        }
    });

    if (!customElements.get('ui-range')) {
        customElements.define('ui-range', UiRange, {
            extends: 'input'
        });
    }
/**/})();
