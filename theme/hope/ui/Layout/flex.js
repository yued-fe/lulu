/**
 * @author zhangxinxu
 * @create 2022-01-07
 * @description <ui-flex> 自定义组件元素开发
**/

// flex 布局
class UiFlex extends HTMLElement {
    static get observedAttributes () {
        return ['gap'];
    }
    constructor () {
        super();
    }

    get gap () {
        return this.getAttribute('gap') || '0';
    }

    set gap (val) {
        this.setAttribute('gap', val);
    }

    render (attrs) {
        if (!attrs) {
            attrs = UiFlex.observedAttributes;
        } else if (typeof attrs == 'string') {
            attrs = [attrs];
        }
        if (attrs.forEach) {
            attrs.forEach(attr => {
                let val = this[attr];
                if (!isNaN(val) && !isNaN(parseFloat(val))) {
                    val = val + 'rem';
                }
                this.style.setProperty('--ui-' + attr, val);
            });
        }
    }

    attributeChangedCallback (name) {
        this.render(name);
    }

    connectedCallback () {
        this.render();
    }
}

if (!customElements.get('ui-flex')) {
    customElements.define('ui-flex', UiFlex);
}
