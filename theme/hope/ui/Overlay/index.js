/**
 * @author zhangxinxu
 * @create 2022-02-14
 * @description 覆盖层处理
**/

class UiOverlay extends HTMLElement {
    static get observedAttributes () {
        return ['open', 'opacity', 'color'];
    }
    constructor () {
        super();
    }

    get mode () {
        return this.getAttribute('mode') || 'hide';
    }

    set mode (value) {
        this.setAttribute('mode', value);
    }

    get open () {
        return this.hasAttribute('open');
    }

    set open (value) {
        this.toggleAttribute('open', value);
    }

    get fade () {
        return this.hasAttribute('fade');
    }

    set fade (value) {
        this.toggleAttribute('fade', value);
    }

    get opacity () {
        return this.getAttribute('opacity');
    }

    set opacity (value) {
        this.setAttribute('opacity', value);
    }

    get color () {
        return this.getAttribute('color');
    }

    set color (value) {
        this.setAttribute('color', value);
    }

    get touch () {
        return this.getAttribute('touch');
    }

    set touch (value) {
        this.setAttribute('touch', value);
    }

    renderAttribute (name, keep) {
        if (name == 'open') {
            return;
        }
        if (typeof this[name] == 'string') {
            this.style.setProperty('--ui-overlay-' + name, this[name]);
        } else if (!keep) {
            this.style.removeProperty('--ui-overlay-' + name);
        }
    }

    render () {
        UiOverlay.observedAttributes.forEach(attr => {
            this.renderAttribute(attr, true);
        });

        // 可点击性
        if (this[this.mode]) {
            // 自定义元素设置 tabIndex=0 代表改元素可聚焦，并可通过键盘导航来聚焦到该元素
            this.setAttribute('tabIndex', 0);
            this.setAttribute('role', 'button');
        } else {
            this.removeAttribute('tabIndex');
            this.removeAttribute('role');
        }
    }

    attributeChangedCallback (name) {
        this.renderAttribute(name);
    }

    zIndex () {
        // 只对同级元素进行层级最大化计算处理
        var numZIndexNew = 19;
        this.parentElement && [...this.parentElement.childNodes].forEach((eleChild) => {
            if (eleChild.nodeType != 1 || eleChild === this || eleChild.parentElement.zIndex) {
                return;
            }
            var objStyleChild = window.getComputedStyle(eleChild);
            var numZIndexChild = objStyleChild.zIndex * 1;
            if (numZIndexChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew > getComputedStyle(this).zIndex) {
            this.style.zIndex = numZIndexNew;
        }
    }

    attributeChangedCallback (name) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open') {
            // 组件的 z-index 层级计算
            if (this.open) {
                this.zIndex();
                this.render();
            }
        }
    }

    connectedCallback () {
        // 属性与样式渲染
        this.render();

        // 点击组件本身或按键盘 esc/enter 键即可关闭组件
        this.addEventListener('click', () => {
            if (this[this.mode]) {
                // 模式方法
                this[this.mode]();
            }
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-overlay'
            }
        }));

        this.isConnectedCallback = true;
    }

    remove () {
        if (this.fade) {
            this.addEventListener('animationend', () => {
                if (this.parentElement) {
                    this.parentElement.removeChild(this);
                }
            });
        } else {
            if (this.parentElement) {
                this.parentElement.removeChild(this);
            }
        }
        
        this.open = false;

        this.dispatchEvent(new CustomEvent('remove'));
    }
    show () {
        this.open = true;

        // 从内存中取出
        if (document.body.contains(this) == false) {
            document.body.append(this);
        }

        this.dispatchEvent(new CustomEvent('show'));
    }
    hide () {
        this.open = false;

        this.dispatchEvent(new CustomEvent('hide'));
    }
}

if (!customElements.get('ui-overlay')) {
    customElements.define('ui-overlay', UiOverlay);
}

// 将该方法定义为 window 全局使用的方法
window.Overlay = function (options) {
    options = options || {};

    var defaults = {
        fade: true,
        mode: 'remove',
        open: true,
        touch: 'none'
    };

    var params = Object.assign({}, defaults, options);

    // 创建 <ui-overlay> 元素
    let overlay = new UiOverlay();

    // 参数赋予
    for (let key in params) {
        overlay[key] = params[key];
    }

    // 插入到页面
    document.body.append(overlay);

    return overlay;
};

/**/export default UiOverlay;
