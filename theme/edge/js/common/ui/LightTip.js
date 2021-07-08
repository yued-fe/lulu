/**
 * @LightTip.js
 * @author popeyesailorman(yangfan)
 * @version
 * @Created: 20-05-15
 * @edit: 20-05-15
 */

class LightTip extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }

    constructor () {
        super();

        if (arguments.length) {
            LightTip.custom.apply(this, arguments);
        }
    }

    get type () {
        return this.getAttribute('type');
    }

    get time () {
        let strTime = this.getAttribute('time');
        if (!isNaN(strTime) && !isNaN(parseFloat(strTime))) {
            return Number(strTime);
        }

        return 3000;
    }

    set type (value) {
        this.setAttribute('type', value);
    }

    set time (value) {
        this.setAttribute('time', value);
    }

    get open () {
        return this.hasAttribute('open');
    }

    set open (value) {
        this.toggleAttribute('open', value);
    }

    connectedCallback () {
        // 自定义元素设置 tabIndex=0 代表改元素可聚焦，并可通过键盘导航来聚焦到该元素
        this.setAttribute('tabIndex', 0);
        this.setAttribute('role', 'tooltip');

        if (!this.closeMode) {
            this.closeMode = 'hide';
        }

        // 点击组件本身或按键盘 esc/enter 键即可关闭组件
        this.addEventListener('click', () => {
            // 移除元素
            this[this.closeMode]();
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-lighttip'
            }
        }));
    }

    attributeChangedCallback (name, oldValue, newValue) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open' && typeof oldValue !== typeof newValue) {
            if (typeof newValue === 'string') {
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    this[this.closeMode]();
                }, this.time);

                this.classList.add('ESC');

                // 组件的 z-index 层级计算
                this.zIndex();
            } else {
                this.classList.remove('ESC');
            }
            this.tabIndex();
        }
    }

    zIndex () {
        // 只对<body>子元素进行层级最大化计算处理，这里lighttip默认的z-index值是9
        var numZIndexNew = 19;
        this.parentElement && [...this.parentElement.childNodes].forEach(function (eleChild) {
            if (eleChild.nodeType != 1) {
                return;
            }
            var objStyleChild = window.getComputedStyle(eleChild);
            var numZIndexChild = objStyleChild.zIndex * 1;
            if (numZIndexChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });
        this.style.zIndex = numZIndexNew;
    }

    tabIndex () {
        var eleContainer = this;
        var eleLastActive = LightTip.lastActiveElement;
        if (this.open == true) {
            var eleActiveElement = document.activeElement;
            if (eleContainer !== eleActiveElement) {
                LightTip.lastActiveElement = eleActiveElement;
            }
            // 键盘索引起始位置定位在提示元素上
            eleContainer.focus();
        } else if (eleLastActive && !eleLastActive.matches('body')) {
            // 获取焦点但不会定位
            eleLastActive.focus({
                preventScroll: true
            });
            // 如果不是键盘关闭提示，而是点击的话，之前的焦点元素失焦
            if (!window.isKeyEvent) {
                eleLastActive.blur();
            }
            LightTip.lastActiveElement = null;
        }
        return this;
    }

    // success
    static success (text, time = 3000) {
        return this.custom(text, 'success', time);
    }
    // error
    static error (text, time = 3000) {
        return this.custom(text, 'error', time);
    }
    // normal
    static normal (text, time = 3000) {
        return this.custom(text, 'normal', time);
    }
    // 调用方法处理
    static custom (text = '', type, time) {
        // 如果是静态方法执行
        // 创建ui-lighttip自定义元素
        if (!this.matches || !this.matches('ui-lighttip')) {
            return LightTip.custom.apply(document.createElement('ui-lighttip'), arguments);
        }

        if (!text) {
            return this;
        }

        this.closeMode = 'remove';

        // 如果传入的类型是object形式
        if (type && typeof type === 'object') {
            LightTip.custom.call(this, text, type.type, type.time);
            return;
        }
        // 如果type的类型是number，则赋值给time
        if (typeof type === 'number') {
            LightTip.custom.call(this, text, time, type);
            return;
        }

        if (time) {
            this.time = time;
        }
        if (type) {
            this.type = type;
        }

        this.innerHTML = text;
        // 提高无障碍
        if (type == 'success') {
            this.setAttribute('aria-lable', '操作成功');
        } else if (type == 'error') {
            this.setAttribute('aria-lable', '操作失败');
        }

        // append内存中创建的ui-lighttip元素
        if (!this.parentElement) {
            document.body.appendChild(this);

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }

        this.show();

        return this;
    }
    remove () {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
        this.open = false;
    }
    show () {
        if (this.time > 0) {
            this.open = true;
        }
    }
    hide () {
        this.open = false;
    }
}

if (!customElements.get('ui-lighttip')) {
    customElements.define('ui-lighttip', LightTip);
}

// 将该方法定义为 window 全局使用的方法
window.LightTip = LightTip;

export default LightTip;

