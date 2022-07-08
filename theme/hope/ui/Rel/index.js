/**
 * @Rel.js
 * @author zhangxinxu
 * @description 切换引擎
 * @version
 * @created 22-06-29
 */

// ui tab custom HTML
class UiRel extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }

    constructor () {
        super();

        // 事件
        this.events();
    }

    get name () {
        return this.getAttribute('name');
    }
    set name (value) {
        this.setAttribute('name', value);
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get open () {
        return this.hasAttribute('open');
    }
    set open (value) {
        this.toggleAttribute('open', value);
    }

    get disabled () {
        return this.hasAttribute('disabled');
    }

    set disabled (val) {
        this.toggleAttribute('disabled', val);
    }

    onSwitch () {

    }

    switch () {
        let strName = this.name;
        let strTag = this.tagName.toLowerCase();
        let eleGroup = [];
        // 对应选项卡显示的处理
        if (strName) {
            eleGroup = document.querySelectorAll(strTag + '[name="' + strName + '"]');

            if (!this.open) {
                eleGroup.forEach(tab => {
                    if (tab.open) {
                        tab.open = false;
                    }
                });
                this.open = true;
            }
        } else {
            this.open = !this.open;
        }
    }

    // 初始化tab事件
    events () {
        // 点击切换
        this.addEventListener('click', (event) => {
            if (/^(:?javas|#)/.test(event.target.getAttribute('href'))) {
                event.preventDefault();
            }
            if (!this.disabled) {
                this.switch();
            }            
        }, false);
    }

    // ui-tab元素在页面出现的时候
    connectedCallback () {
        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: this.tagName.toLowerCase()
            }
        }));

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    /**
     * open属性变化时候的变化
     * @param {*} name
     * @param {*} newValue
     * @param {*} oldValue
     */
    attributeChangedCallback (name, newValue, oldValue) {
        if (name === 'open' && typeof newValue != typeof oldValue) {
            const eleTarget = document.getElementById(this.target);
            if (eleTarget) {
                eleTarget.classList[this.open ? 'add' : 'remove']('active');
            }

            // 当前元素的标签类型，因为可能是 ui-rel，也可能是 ui-tab
            let strTag = this.tagName.toLowerCase();

            if (this.open) {                
                this.setAttribute('aria-selected', 'true');
                this.dispatchEvent(new CustomEvent('show', {
                    detail: {
                        type: strTag
                    }
                }));
            } else {
                this.setAttribute('aria-selected', 'false');
                this.dispatchEvent(new CustomEvent('hide', {
                    detail: {
                        type: strTag
                    }
                }));
            }

            // 无论选项卡切换还是隐藏，都会触发switch事件
            this.dispatchEvent(new CustomEvent('switch'));
            // 对外预留的钩子
            this.onSwitch();
        }
    }
}

// 定义 <ui-rel>
if (!customElements.get('ui-rel')) {
    customElements.define('ui-rel', UiRel);
}

// 暴露对外
/**/export default UiRel;
