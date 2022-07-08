/**
 * @author zhangxinxu
 * @create 2022-01-07
 * @description <ui-grid> 自定义组件元素开发
**/

// 列表项布局
class UiListItem extends HTMLElement {
    static get observedAttributes () {
        return ['value', 'checked', 'name', 'disabled', 'type', 'space'];
    }

    constructor () {
        super();

        let type = this.type;

        if (!type) {
            return this;
        }

        let element = this.querySelector(`:scope > [type="${type}"]`);

        // 如果元素不存在，创建
        if (!element) {
            element = document.createElement('input');
            if (typeof this.name == 'string') {
                element.name = this.name;
            }
            if (typeof this.value == 'string') {
                element.value = this.value;
            }
            element.type = type;
            element.checked = this.checked;
            element.disabled = this.disabled;

            // change 事件传递
            element.addEventListener('change', () => {
                this.dispatchEvent(new CustomEvent('change'));
            });

            // 插入
            this.insertAdjacentElement('beforeend', element);
        }
    }

    get type () {
        return this.getAttribute('type');
    }

    set type (val) {
        this.setAttribute('type', val);
    }

    get name () {
        return this.getAttribute('name');
    }

    get value () {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            return element.value;
        }

        return this.getAttribute('value');
    }

    set value (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.value = val;
        }

        this.setAttribute('value', val);
    }

    set name (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.name = val;
        }
        this.setAttribute('name', val);
    }

    get checked () {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            return element.checked;
        }

        return this.hasAttribute('checked');
    }

    set checked (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.checked = val;
        }

        this.toggleAttribute('checked', val);
    }

    get disabled () {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            return element.disabled;
        }

        return this.hasAttribute('disabled');
    }

    set disabled (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.disabled = val;
        }

        this.toggleAttribute('disabled', val);
    }

    get space () {
        let space = this.getAttribute('space');
        if (space === '') {
            space = '.75rem 1rem';
        }
        return space || '0';
    }

    set space (val) {
        this.setAttribute('space', val);
    }

    render (name) {
        if (name == 'space') {
            let val = this.space;
            if (val) {
                if (!isNaN(val) && !isNaN(parseFloat(val))) {
                    val = val + 'rem';
                }
                this.style.setProperty('--ui-' + name, val);
            } else {
                this.style.removeProperty('--ui-' + name);
            }
        }
    }

    attributeChangedCallback (name) {
        this.render(name);
    }

    connectedCallback () {
        this.render('space');
    }
}

if (!customElements.get('ui-list-item')) {
    customElements.define('ui-list-item', UiListItem);
}
