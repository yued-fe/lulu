/**
 * @author zhangxinxu
 * @create 2022-01-07
 * @description <ui-grid> 自定义组件元素开发
**/

class UiGrid extends HTMLElement {
    static get observedAttributes () {
        return ['gap', 'size', 'space'];
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

    get size () {
        return this.getAttribute('size') || '6';
    }

    set size (val) {
        this.setAttribute('size', val);
    }

    get space () {
        return this.getAttribute('space') || '0';
    }

    set space (val) {
        this.setAttribute('space', val);
    }

    render (attrs) {
        if (!attrs) {
            attrs = UiGrid.observedAttributes;
        } else if (typeof attrs == 'string') {
            attrs = [attrs];
        }
        if (attrs.forEach) {
            attrs.forEach(attr => {
                let val = this[attr];
                if (!isNaN(val) && !isNaN(parseFloat(val))) {
                    val = val + 'rem';
                }
                if (attr == 'size' && this.hasAttribute('repeat')) {
                    this.style.setProperty('--ui-repeat-size', val);
                } else {
                    this.style.setProperty('--ui-' + attr, val);
                }
            });
        }
    }

    attributeChangedCallback (name) {
        this.render(name);
    }
};

if (!customElements.get('ui-grid')) {
    customElements.define('ui-grid', UiGrid);
}