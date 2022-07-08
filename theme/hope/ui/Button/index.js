/**
 * @author zhangxinxu
 * @create 2022-01-19
 * @description 按钮的语法增强处理
**/

/**/(async () => {
/**/    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
/**/        await import('../safari-polyfill.js');
/**/    }

    class UiButton extends HTMLButtonElement {
        static get observedAttributes () {
            return ['color', 'height', 'radius', 'width'];
        }

        constructor () {
            super();

            this.render();
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

        renderAttribute (name, keep) {
            if (typeof this[name] == 'string') {
                this.style.setProperty('--ui-button-' + name, this[name]);
            } else if (!keep) {
                this.style.removeProperty('--ui-button-' + name);
            }
        }

        render () {
            UiButton.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.render(name);
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-button'
                }
            }));

            this.isConnectedCallback = true;
        }
    }
    
    if (!customElements.get('ui-button')) {
        customElements.define('ui-button', UiButton, {
            extends: 'button'
        });
    }
/**/})();


