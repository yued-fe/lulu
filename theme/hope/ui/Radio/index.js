/**
 * @author zhangxinxu
 * @create 2022-01-19
 * @description 唯一点击选择交互的泛支持
**/

/**/(async () => {
/**/    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
/**/        await import('../safari-polyfill.js');
/**/    }

    class UiRadio extends HTMLInputElement {
        static get observedAttributes () {
            return ['extends', 'checked', 'disabled'];
        }

        get extends () {
            return this.hasAttribute('extends');
        }

        set extends (val) {
            this.toggleAttribute('extends', val);
        }

        render () {
            if (!this.extends) {
                return;
            }
            document.querySelectorAll(`[is="ui-radio"][extends][name="${this.name}"]`).forEach(radio => {
                [...radio.labels].forEach(label => {
                    label.classList[radio.checked ? 'add' : 'remove']('active');
                    label.classList[radio.disabled ? 'add' : 'remove']('disabled');
                    label.setAttribute('role', "button");
                });
            });
        }

        attributeChangedCallback () {
            this.render();
        }

        constructor () {
            super();

            // 事件处理
            this.addEventListener('change', () => {
                this.render();
            });

            this.render();

            const propChecked = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
            Object.defineProperty(UiRadio.prototype, 'checked', {
                ...propChecked,
                set (value) {
                    // 赋值
                    propChecked.set.call(this, value);
                    // 触发渲染
                    this.render();
                }
            });
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-radio'
                }
            }));

            this.isConnectedCallback = true;
        }
    }
    
    if (!customElements.get('ui-radio')) {
        customElements.define('ui-radio', UiRadio, {
            extends: 'input'
        });
    }
/**/})();
