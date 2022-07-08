/**
 * @author zhangxinxu
 * @create 2022-02-14
 * @description 弹出层处理
**/

/**/import UiOverlay from '../Overlay/index.js';

class UiPopup extends HTMLElement {
    static get observedAttributes () {
        return ['open', 'height', 'width', 'radius', 'background', 'close-icon'];
    }
    constructor (params) {
        super();

        // 元素
        if (!this.element) {
            this.element = {};
        }
        // 这个是必须的，即使不在文档中
        this.element.overlay = new UiOverlay();
        // 创建容器元素
        let eleContainer = document.createElement('ui-popup-container');
        this.element.container = eleContainer;
        // 创建关闭按钮
        let eleClose = document.createElement('button');
        eleClose.setAttribute('part', 'close');
        eleClose.textContent = '关闭';
        eleClose.addEventListener('click', () => {
            if (this[this.mode]) {
                this[this.mode]();
            } else {
                this.hide();
            }
        });
        this.element.close = eleClose;
        // 写入内容
        if (this.childNodes.length) {
            this.content = this.childNodes;
        }
        this.append(eleContainer);
        // 设置参数
        this.setParams(params);
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

    get transition () {
        return this.hasAttribute('transition');
    }

    set transition (value) {
        this.toggleAttribute('transition', value);
    }

    get background () {
        return this.getAttribute('background');
    }

    set background (value) {
        this.setAttribute('background', value);
    }

    get position () {
        return this.getAttribute('position') || 'bottom';
    }

    set position (value) {
        this.setAttribute('position', value);
    }

    get overlay () {
        return this.hasAttribute('overlay');
    }

    set overlay (value) {
        this.toggleAttribute('overlay', Boolean(value));
    }

    get content () {
        return this.originContent;
    }

    get closeIcon () {
        return this.getAttribute('close-icon');
    }

    set closeIcon (value) {
        this.setAttribute('close-icon', value);
    }

    get closeable () {
        return this.hasAttribute('close-icon');
    }

    set closeable (value) {
        this.toggleAttribute('close-icon', Boolean(value));
    }

    set content (content) {
        // 给 popup.content 获取用
        this.originContent = content;

        let eleContainer = this.element.container;
        let eleClose = this.element.close;
        // content可以是函数
        if (typeof content == 'function') {
            content = content();
        } else if (typeof content == 'string' && /^#?\w+(?:[-_]\w+)*$/i.test(content)) {
            // 如果是字符串
            // 如果是选择器，仅支持ID选择器
            let eleMatch = document.querySelector(content);
            if (eleMatch) {
                if (eleMatch.matches('textarea')) {
                    content = eleMatch.value;
                } else if (eleMatch.matches('script')) {
                    content = eleMatch.innerHTML;
                } else if (eleMatch.matches('template')) {
                    content = document.importNode(eleMatch.content, true);
                } else {
                    content = eleMatch;
                }
            }
        }

        // 关闭方式的确认
        if (!this.hasAttribute('mode') && !this.isConnectedCallback) {
            // 基于内容的数据类型，使用不同的默认的弹框关闭方式
            this.mode = typeof content == 'string' ? 'remove' : 'hide';
        }

        // 清空内容
        if (eleContainer.contains(eleClose)) {
            eleClose.remove();
        }
        eleContainer.innerHTML = '';

        if (this.closeable) {
            eleContainer.prepend(eleClose);
        }

        // 如果是字符串内容
        if (typeof content == 'string') {
            eleContainer.insertAdjacentHTML('afterbegin', content);
        } else if (content.length && !content.tagName) {
            content.owner = this;
            // 节点列表或者元素合集
            [...content].forEach(node => {
                if (typeof node == 'string') {
                    eleContainer.insertAdjacentHTML('afterbegin', node);
                } else {
                    eleContainer.appendChild(node);
                }                
            });
        } else if (typeof content.nodeType == 'number') {
            content.owner = this;
            eleContainer.append(content);

            // 元素显示方法
            var funVisible = () => {
                if (content.removeAttribute) {
                    content.removeAttribute('hidden');
                    if (content.style && content.style.display == 'none') {
                        content.style.display = '';
                    }
                    // 如果此时元素的display状态还是none，则设置为浏览器初始display值
                    if (getComputedStyle(content).display == 'none') {
                        content.style.display = 'revert';
                    }
                }
                // 移除事件
                this.removeEventListener('connected', funVisible);
            };

            // 如果是 Element 元素，保证显示
            if (this.isConnectedCallback) {
                funVisible();
            } else {
                this.addEventListener('connected', funVisible);
            } 
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
        if (val === true || val === false) {
            this.toggleAttribute('radius', val);
            return;
        }
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

    // 参数批量设置
    setParams (params) {
        if (!params || !Object.keys(params).length) {
            return;
        }
        // 参数赋予
        for (let key in params) {
            if (typeof params[key] == 'function') {
                this.addEventListener(key.toLowerCase().replace(/^on/, ''), () => {
                    params[key]();
                });
            } else {
                this[key] = params[key];
            }
        }

        // overlay 的处理
        let eleOverlay = this.element && this.element.overlay;
        if (typeof params.overlay == 'string') {
            this.setAttribute('overlay', params.overlay);
        } else if (typeof params.overlay == 'object' && eleOverlay) {
            for (let keyOverlay in params.overlay) {
                eleOverlay[keyOverlay] = params.overlay[keyOverlay];
            }
        }

        // 样式的处理
        let eleContainer = this.element && this.element.container;
        if (typeof params.style == 'object' && eleContainer) {
            for (let keyStyle in params.style) {
                if (typeof keyStyle == 'string') {
                    // setProperty 不支持驼峰命名属性，转换成短横线方式
                    let strKeyStyle = keyStyle.replace(/([a-z])([A-Z])/, function (_, $1, $2) {
                        return [$1, $2.toLowerCase()].join('-');
                    });

                    eleContainer.style.setProperty(strKeyStyle, params.style[keyStyle]);
                }
            }
        }
    }

    renderAttribute (name, keep) {
        if (!name || name == 'open') {
            return;
        }

        let attrName = name.replace(/\-(\w)/g, (_, $1) => {
            return $1.toUpperCase();
        });

        if (attrName == 'closeIcon' && this[attrName] && /^(?:#|\.)?(?:\w|-)+$/.test(this[attrName].replace(/\s/g, ''))) {
            // 如果是选择器
            // 这里算是针对特殊功能的冗余处理
            if (/^(?:#|\.)(?:\w|-)+$/.test(this[attrName].replace(/\s/g, ''))) {
                let eleMatch = this.querySelector(this[attrName]);
                if (eleMatch && !eleMatch.isBindClose) {
                    this.element.close.style.display = 'none';
                    eleMatch.addEventListener('click', () => {
                        this.element.close.click();
                    });
                    eleMatch.isBindClose = true;
                }
            }
            return;
        }

        if (this[attrName]) {
            this.style.setProperty('--ui-popup-' + name, this[attrName]);
        } else if (!keep) {
            this.style.removeProperty('--ui-popup-' + name);
        }
    }

    render () {
        UiPopup.observedAttributes.forEach(attr => {
            this.renderAttribute(attr, true);
        });
    }

    attributeChangedCallback (name) {
        this.renderAttribute(name);
    }

    zIndex () {
        // 只对同级元素进行层级最大化计算处理
        // 这里使用了 overlay 中的方法
        this.element.overlay.zIndex.call(this);
    }

    attributeChangedCallback (name) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open') {
            // 组件的 z-index 层级计算
            if (this.open) {
                this.zIndex();
                this.render();
            }
            // 覆盖层的显隐状态和弹出层一致
            this.element.overlay.open = this.open;
        }
    }

    connectedCallback () {
        // 属性与样式渲染
        this.render();

        // 是否显示覆盖层
        let eleOverlay = this.element.overlay;
        if (this.overlay) {
            // 是否显示
            eleOverlay.open = this.open;
            // 是否有动画
            eleOverlay.fade = this.transition;
            // 是否滚动锁定
            if (this.touch) {
                eleOverlay.touch = this.touch;
            }
            // 其他参数设置
            let strOverlay = this.getAttribute('overlay');
            // 字符串参数应用到覆盖层上，例如
            // overlay="color: #fff0" => <ui-overlay color="#fff0">
            strOverlay.trim().replace(/\{|\}/g, '').split(',').forEach(parts => {
                if (/:/.test(parts)) {
                    eleOverlay[parts.split(':')[0].trim()] = parts.split(':')[1].trim();
                }
            });
            // 无障碍访问提示
            eleOverlay.setAttribute('aria-label', '弹出层后方的覆盖层' + (eleOverlay[eleOverlay.mode] ? '，点击关闭弹出层': ''));
            // 载入
            this.prepend(eleOverlay);
            // 如果没有指定模式
            // 或者都是默认的模式
            // 则将覆盖层的隐藏行为冒泡到弹出层
            if (!eleOverlay.hasAttribute('mode') || /^(?:hide|remove)$/.test(eleOverlay.mode)) {
                eleOverlay.mode = 'bubbling';
                eleOverlay.bubbling = () => {
                    if (this[this.mode]) {
                        this[this.mode]();
                    }
                }
            }
        }

        // 是否显示关闭按钮
        let eleClose = this.element.close;
        if (this.closeable && this.contains(eleClose) == false) {
            this.element.container.prepend(eleClose);
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-popup'
            }
        }));

        this.isConnectedCallback = true;
    }

    remove () {
        let eleContainer = this.element.container;

        if (this.transition) {
            const funRemove = () => {
                if (this.parentElement) {
                    this.parentElement.removeChild(this);
                }
                eleContainer.removeEventListener('transitionend', funRemove);
            };
            eleContainer.addEventListener('transitionend', funRemove);
        } else if (this.parentElement) {
            this.parentElement.removeChild(this);
        }

        this.open = false;

        this.dispatchEvent(new CustomEvent('remove'));
    }

    show () {
        // 从内存中取出
        if (document.body.contains(this) == false) {
            document.body.append(this);
            // 让过渡效果有效
            if (this.transition) {
                this.offsetHeight;
            }
        }

        this.open = true;

        this.dispatchEvent(new CustomEvent('show'));
    }

    hide () {
        this.open = false;

        this.dispatchEvent(new CustomEvent('hide'));
    }
}

if (!customElements.get('ui-popup')) {
    customElements.define('ui-popup', UiPopup);
}

// 将该方法定义为 window 全局使用的方法
window.Popup = function (content, options) {
    // content 参数可选
    // 如果是纯对象，非严格判断，
    // 和 content 支持的其他类型区分即可
    if (typeof content == 'object' && !content.nodeName && !content.forEach) {
        options = content;
    }
    options = options || {};

    var defaults = {
        transition: true,
        overlay: {}
    };

    var params = Object.assign({}, defaults, options);

    // 默认禁止滚动
    if (typeof params.overlay.touch == 'undefined') {
        params.overlay.touch = 'none';
    }

    // 创建 <ui-popup> 元素
    let popup = new UiPopup();

    // 写入内容
    if (content) {
        popup.content = content;
    }

    // 提前 open=true 会影响 transition 动画的执行
    let isOpen = params.open;
    if (isOpen === true) {
        delete params.open;
    }

    // 设置参数
    popup.setParams(params);

    if (isOpen !== false) {
        setTimeout(() => {
            popup.show();
        }, 1);
    }    

    return popup;
};

/**/export default UiPopup;
