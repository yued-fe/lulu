/**
 * @Float.js
 * @author zhangxinxu
 * @version
 * @description 自动隐藏的浮层显示元素
 * @created 22-06-06
 */

 class UiFloat extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }

    constructor () {
        super();

        if (arguments.length) {
            UiFloat.custom.apply(this, arguments);
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
                type: 'ui-float'
            }
        }));

        this.isConnectedCallback = true;
    }

    attributeChangedCallback (name, oldValue, newValue) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open' && typeof oldValue !== typeof newValue) {
            if (typeof newValue === 'string') {
                clearTimeout(this.timer);
                if (this.time) {
                    this.timer = setTimeout(() => {
                        this[this.closeMode]();
                        this.position();
                    }, this.time);
                }

                this.setAttribute('data-tid', this.timer);

                // 组件的 z-index 层级计算
                this.zIndex();

                // 组件的定位，不同的提示位置不重叠
                this.position();
            }
        }
    }

    zIndex () {
        // 只对<body>子元素进行层级最大化计算处理，这里float默认的z-index值是19
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

    // 定位处理
    position () {}

    // 调用方法处理
    static custom (text = '', type, time) {
        // 如果是静态方法执行
        // 创建ui-float自定义元素
        if (!this.matches || !this.matches('ui-float')) {
            return UiFloat.custom.apply(document.createElement('ui-float'), arguments);
        }

        if (typeof text == 'object') {
            type = text;
            text = '';
        }

        if (typeof text != 'string') {
            return this;
        }

        this.closeMode = 'remove';

        // 如果传入的类型是object形式
        if (type && typeof type === 'object') {
            UiFloat.custom.call(this, text, type.type, type.time);
            return;
        }
        // 如果type的类型是number，则赋值给time
        if (typeof type === 'number') {
            UiFloat.custom.call(this, text, time, type);
            return;
        }

        if (time || time === 0) {
            this.time = time;
        }

        if (type) {
            this.type = type;
        }

        this.innerHTML = text;

        // append 内存中创建的 <ui-float> 元素
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

if (!customElements.get('ui-float')) {
    customElements.define('ui-float', UiFloat);
}

// 将该方法定义为 window 全局使用的方法
window.UiFloat = UiFloat;

/**/export default UiFloat;
