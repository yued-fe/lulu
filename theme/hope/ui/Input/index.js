/**
 * @author zhangxinxu
 * @create 2022-01-19
 * @description 输入框的语法增强处理
**/

/**/export default (async () => {
/**/    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
/**/        await import('../safari-polyfill.js');
/**/    }

    class UiInput extends HTMLInputElement {
        static get observedAttributes () {
            return ['height', 'radius', 'width', 'label', 'font', 'minLength', 'maxLength'];
        }

        get label () {
            return this.getAttribute('label');
        }

        set label (val) {
            this.setAttribute('label', val);
            this.setAttribute('aria-label', val);
            if (!this.placeholder) {
                this.placeholder = val;
            }
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

        // 标签背景的显示
        setLabel () {
            this.style.setProperty('--ui-' + this.tagName.toLowerCase() + '-image-label', `url("data:image/svg+xml,%3Csvg width='500' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0%25' y='50%25' font-size='16' font-family='system-ui, sans-serif' fill='${encodeURIComponent(getComputedStyle(this).getPropertyValue('--ui-fill'))}' dominant-baseline='central'%3E${this.label}%3C/text%3E%3C/svg%3E")`);
            if (!this.placeholder) {
                this.placeholder = this.label;
            }
        }

        // 计数效果的显示
        count () {
            let numMin = this.minLength;
            let numMax = this.maxLength;

            if (numMin <= 0) {
                numMin = 0;
            }
            if (numMax <= 0) {
                numMax = this._maxLength || 0;
            } else {
                this._maxLength = numMax;
                this.removeAttribute('maxlength');
            }

            let tag = this.tagName.toLowerCase();

            // 如果没有最长最短文字限制
            if (!numMax && !numMin) {
                this.removeAttribute('_maxlength');
                this.style.removeProperty(`--ui-${tag}-image-count`);
                return;
            }

            // maxlength 会限制输入，移除
            this.setAttribute('_maxlength', numMax);

            // 确定字符显示内容
            let strRange = (numMin || '0') + '-' + numMax;
            if (!numMax) {
                strRange = numMin + '-?';
            } else if (!numMin) {
                strRange = numMax;
            }

            // 根据输入的字符确定内容的颜色
            let numLenValue = this.value.trim().length;
            // 获取颜色
            let strColorDefault = encodeURIComponent(getComputedStyle(this).getPropertyValue('--ui-gray'));
            let strColorLength = strColorDefault;
            if ((numMin && numLenValue < numMin) || (numMax && numLenValue > numMax)) {
                strColorLength = encodeURIComponent(getComputedStyle(this).getPropertyValue('--ui-red'));
            }

            // 设置背景图像
            this.style.setProperty('--ui-' + tag + '-image-count', `url("data:image/svg+xml,%3Csvg width='500' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='100%25' y='14' font-size='12' text-anchor='end' font-family='system-ui, sans-serif' fill='${strColorDefault}'%3E%3Ctspan fill='${strColorLength}'%3E${numLenValue}%3C/tspan%3E%3Ctspan%3E/${strRange}%3C/tspan%3E%3C/text%3E%3C/svg%3E")`);
            // 设置字符个数，方便 padding 定位
            this.style.setProperty('--ui-char-numbers', String(numLenValue).length + 1 + String(strRange).length);
        }

        renderAttribute (name, keep) {
            if (!name) {
                return;
            }

            if (/length$/i.test(name) && this[name]) {
                this.count();
                return;
            }

            let tag = this.tagName.toLowerCase();

            if (this.hasAttribute(name) && (typeof this[name] == 'string' || typeof this[name] == 'number')) {
                if (name == 'label') {
                    this.setLabel();
                } else {
                    this.style.setProperty('--ui-' + tag + '-' + name, this[name]);
                }
            } else if (!keep) {
                this.style.removeProperty('--ui-' + tag + '-' + name);
            }
        }

        render () {
            UiInput.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.renderAttribute(name);
        }

        constructor () {
            super();

            this.render();

            // 事件处理
            this.addEventListener('focus', function () {
                if (this.label) {
                    setTimeout(() => {
                        this.setLabel();
                    }, 16);
                }
            });
            this.addEventListener('blur', function () {
                if (this.label) {
                    setTimeout(() => {
                        this.setLabel();
                    }, 16);
                }
            });
            // 计数处理
            this.addEventListener('input', () => {
                this.count();
            });
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-input'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-input')) {
        customElements.define('ui-input', UiInput, {
            extends: 'input'
        });
    }

    window.UiInput = UiInput;

    /**/return UiInput;
/**/})();
