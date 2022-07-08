/**
 * @author zhangxinxu
 * @create 2022-01-28
 * @description Textarea 文本域的语法增强处理
**/

/**/import promiseInput from '../Input/index.js';

/**/promiseInput.then(UiInput => {
    const INPUT = new UiInput();

    class UiTextarea extends HTMLTextAreaElement {
        static get observedAttributes () {
            return ['rows', 'height', 'width', 'label', 'font', 'minLength', 'maxLength'];
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

        count () {
            INPUT.count.call(this);
        }

        setLabel () {
            INPUT.setLabel.call(this);
        }

        attributeChangedCallback (name) {
            this.renderAttribute(name);
        }

        renderAttribute (name, keep) {
            INPUT.renderAttribute.call(this, name, keep);
        }

        render () {
            UiTextarea.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
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

            // 高度自动
            if (this.height == 'auto') {
                this.addEventListener('input', function () {
                    let borderHeight = parseFloat(getComputedStyle(this).borderTopWidth) + parseFloat(getComputedStyle(this).borderBottomWidth);

                    if (!borderHeight) {
                        borderHeight = 0;
                    }

                    this.height = 'auto';
                    if (this.scrollHeight + borderHeight > this.offsetHeight) {
                        this.height = this.scrollHeight + borderHeight;
                    }
                });
            }
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-textarea'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-textarea')) {
        customElements.define('ui-textarea', UiTextarea, {
            extends: 'textarea'
        });
    }
/**/});
