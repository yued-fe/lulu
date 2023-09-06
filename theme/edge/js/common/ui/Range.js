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

    get defaultrange () {
        return this.getAttribute('range') || `${this.getAttribute('from') || this.min || 0},${this.getAttribute('to') || this.max || 100}`;
    }

    set multiple (value) {
        return this.toggleAttribute('multiple', value);
    }

    get multiple () {
        return this.getAttribute('multiple') !== null;
    }

    get from () {
        if (this.element && this.element.otherRange) {
            return Math.min(this.value, this.element.otherRange.value);
        }
        return '';
    }

    get to () {
        if (this.element && this.element.otherRange) {
            return Math.max(this.value, this.element.otherRange.value);
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
        if (this.element && this.element.otherRange) {
            return this.value - this.element.otherRange.value < 0;
        }
        return false;
    }

    set from (v) {
        if (this.element && this.element.otherRange) {
            if (this.isFrom) {
                this.value = v;
            } else {
                this.element.otherRange.value = v;
            }
        }
    }

    set to (v) {
        if (this.element && this.element.otherRange) {
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
        this.tips = this.dataset.tips;
        // 一些事件
        this.addEventListener('input', this.render);
        this.addEventListener('change', this.change);
        this.addEventListener('touchstart', this.stopPropagation);

        // 如果所在表单触发的重置，则UI也跟着重置
        if (this.form) {
            this.form.addEventListener('reset', () => {
                setTimeout(() => {
                    this.render();
                }, 1);
            });
        }

        this.element = this.element || {};
        // 区间选择
        if (this.multiple && !this.element.otherRange) {
            if (getComputedStyle(this.parentNode).position === 'static') {
                // 给父级添加一个定位，不然相对宽度会有问题
                this.parentNode.style.position = 'relative';
            }
            Object.assign(this.element, {
                otherRange: this.cloneNode(false),
            });
            this.element.otherRange.tips = this.tips;
            this.element.otherRange.element = {
                otherRange: this
            };
            this.before(this.element.otherRange);
            this.setAttribute('data-range', 'to');
            this.element.otherRange.setAttribute('data-range', 'from');
            this.range = this.defaultrange;
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

        this.isConnectedCallback = true;

        this.render();

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    disconnectedCallback () {
        this.removeEventListener('input', this.render);
        this.removeEventListener('change', this.change);
        this.removeEventListener('touchstart', this.stopPropagation);

        if (this.element && this.element.otherRange && !this.exchange) {
            this.element.otherRange.remove();
        }
    }

    stopPropagation (ev) {
        ev.stopPropagation();
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'disabled' && this.element && this.element.otherRange) {
                this.element.otherRange.disabled = newValue !== null;
            } else {
                this.render();
            }
        }
    }

    change () {
        // 另外一个range元素
        const eleOtherRange = this.element && this.element.otherRange;
        if (!eleOtherRange) {
            return;
        }
        // 保持html结构和视觉上一致，也就是初始值在前面，结束值在后面，如果不一致就调换位置，目的是为tab键切换正常
        const isLeft = !this.isFrom && this.nextElementSibling === eleOtherRange;
        const isRight = this.isFrom && this.nextElementSibling !== eleOtherRange;
        const isTop = !this.isFrom && this.nextElementSibling !== eleOtherRange;
        const isBottom = this.isFrom && this.nextElementSibling === eleOtherRange;
        if (isTop || isRight || isBottom || isLeft) {
            this.exchange = true;
            if (isTop || isRight) {
                eleOtherRange.before(this);
                this.setAttribute('data-range', 'from');
                eleOtherRange.setAttribute('data-range', 'to');
            } else {
                eleOtherRange.after(this);
                this.setAttribute('data-range', 'to');
                eleOtherRange.setAttribute('data-range', 'from');
            }
            this.exchange = false;
            this.focus();
        }
    }

    render () {
        const max = this.max || 100;
        const min = this.min || 0;

        this.style.setProperty('--percent', (this.value - min) / (max - min));

        if (typeof this.tips == 'string') {
            if (/^\d+$/.test(this.tips)) {
                this.dataset.tips = this.value;
            } else if (/^\${value}/.test(this.tips)) {
                this.dataset.tips = this.tips.replace(/\${value}/g, this.value);
            } else {
                this.dataset.tips = this.tips.replace(/\d+/, this.value);
            }
        }
        this.style.setProperty('--from', this.from);
        this.style.setProperty('--to', this.to);

        // 另外一个range元素
        const eleOtherRange = this.element && this.element.otherRange;

        if (eleOtherRange) {
            eleOtherRange.style.setProperty('--from', this.from);
            eleOtherRange.style.setProperty('--to', this.to);
        }
    }

    addEventListener (...par) {
        document.addEventListener.apply(this, par);

        // 另外一个range元素
        const eleOtherRange = this.element && this.element.otherRange;
        if (eleOtherRange) {
            document.addEventListener.apply(eleOtherRange, par);
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
