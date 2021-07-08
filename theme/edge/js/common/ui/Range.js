/**
 * @Range.js
 * @author xboxyan
 * @version
 * @created: 20-04-30
 */

class XRange extends HTMLInputElement {

    static get observedAttributes () {
        return ['max', 'min', 'step', 'disabled'];
    }

    constructor () {
        super();
        this.tips = this.dataset.tips;
    }

    get defaultrange () {
        return this.getAttribute('range') || `${this.getAttribute('from') || this.min || 0},${this.getAttribute('to') || this.max || 100}`;
    }

    get vertical () {
        return this.getAttribute('vertical') !== null;
    }

    get multiple () {
        return this.getAttribute('multiple') !== null;
    }

    get from () {
        if (this.element?.otherRange) {
            return Math.min(this.value, this.element?.otherRange?.value);
        }
        return '';
    }

    get to () {
        if (this.element?.otherRange) {
            return Math.max(this.value, this.element.otherRange.value);
        }
        return '';
    }

    get range () {
        if (this.multiple) {
            return this.from + ',' + this.to;
        }
    }

    get isFrom () {
        // 是否为起始range
        if (this.element?.otherRange) {
            return this.value - this.element.otherRange.value < 0;
        }
    }

    set from (v) {
        if (this.element?.otherRange) {
            if (this.isFrom) {
                this.value = v;
            } else {
                this.element.otherRange.value = v;
            }
        }
    }

    set to (v) {
        if (this.element?.otherRange) {
            if (!this.isFrom) {
                this.value = v;
            } else {
                this.element.otherRange.value = v;
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

    connectedCallback () {
        this.addEventListener('input', this.render);
        this.addEventListener('change', this.change);
        this.addEventListener('touchstart', this.stopPropagation);
        // 垂直方向
        if (this.vertical) {
            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const {
                        height
                    } = entry.contentRect;
                    this.style.setProperty('--h', height + 'px');
                }
            });
            this.resizeObserver.observe(this);
        }
        this.element = this.element || {};
        // 区间选择
        if (this.multiple && !this.element.otherRange) {
            Object.assign(this.element, {
                otherRange: this.cloneNode(false),
                splitRange: document.createElement('Q')
            });
            this.element.otherRange.tips = this.tips;
            this.element.otherRange.element = {
                otherRange: this
            };
            this.element.splitRange.hidden = true;
            if (this.vertical) {
                this.after(this.element.otherRange);
                this.element.otherRange.after(this.element.splitRange);
            } else {
                this.before(this.element.otherRange);
                this.after(this.element.splitRange);
            }
            this.range = this.defaultrange;
            if (getComputedStyle(this.parentNode).position === 'static') {
                // 给父级添加一个定位，不然相对宽度会有问题
                this.parentNode.style.position = 'relative';
            }
        }

        // CSS使用的是[is="ui-range"]控制的选择框样式，因此，该属性是必须的
        if (this.getAttribute('is') === null) {
            this.setAttribute('is', 'ui-range');
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-range'
            }
        }));

        this.render();

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    disconnectedCallback () {
        this.removeEventListener('input', this.render);
        this.removeEventListener('change', this.change);
        this.removeEventListener('touchstart', this.stopPropagation);
        if (this.vertical) {
            this.resizeObserver.unobserve(this);
        }
        if (this.element?.otherRange && !this.exchange) {
            this.element.otherRange.remove();
        }
        if (this.element?.splitRange && !this.exchange) {
            this.element.splitRange.remove();
        }
    }

    stopPropagation (ev) {
        ev.stopPropagation();
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'disabled' && this.element?.otherRange) {
                this.element.otherRange.disabled = newValue !== null;
            } else {
                this.render();
            }
        }
    }

    change () {
        if (!this.element?.otherRange) {
            return;
        }
        // 保持html结构和视觉上一致，也就是初始值在前面，结束值在后面，如果不一致就调换位置，目的是为tab键切换正常
        const isLeft = !this.isFrom && this.nextElementSibling === this.element.otherRange && !this.vertical;
        const isRight = this.isFrom && this.nextElementSibling !== this.element.otherRange && !this.vertical;
        const isTop = !this.isFrom && this.nextElementSibling !== this.element.otherRange && this.vertical;
        const isBottom = this.isFrom && this.nextElementSibling === this.element.otherRange && this.vertical;
        if (isTop || isRight || isBottom || isLeft) {
            this.exchange = true;
            if (isTop || isRight) {
                this.element.otherRange.before(this);
            } else {
                this.element.otherRange.after(this);
            }
            this.exchange = false;
            this.focus();
        }
    }

    render () {
        const max = this.max || 100;
        const min = this.min || 0;
        this.style.setProperty('--percent', (this.value - min) / (max - min));
        if (this.tips) {
            this.dataset.tips = this.tips.replace(/\${value}/g, this.value);
        }
        this.style.setProperty('--from', this.from);
        this.style.setProperty('--to', this.to);
        if (this.element?.otherRange) {
            this.element.otherRange.style.setProperty('--from', this.from);
            this.element.otherRange.style.setProperty('--to', this.to);
        }
    }

    addEventListener (...par) {
        document.addEventListener.apply(this, par);
        if (this.element?.otherRange) {
            document.addEventListener.apply(this.element.otherRange, par);
        }
    }
}


const props = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
Object.defineProperty(XRange.prototype, 'value', {
    ...props,
    set (v) {
        props.set.call(this, v);
        // 重新渲染
        this.render();
    }
});

if (!customElements.get('ui-range')) {
    customElements.define('ui-range', XRange, {
        extends: 'input'
    });
}
