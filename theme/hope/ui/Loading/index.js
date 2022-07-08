/**
 * @Loading.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-23
 * @Log: 2017-09-19 loading类名的添加基于标签，而非类名
 * @edit by littleLionGuoQing:  20-05-07  ES6、<ui-loading> web components组件 && 支持rows和size属性的设置和获取
**/

/**/import '../Toast/index.js';

(() => {

    /**
     * 给HTML元素扩展一个loading属性
     */

    let CL = 'ui-loading';
    Object.defineProperty(HTMLElement.prototype, 'loading', {
        configurable: true,
        enumerable: true,
        get () {
            return !!(this.classList.contains(CL) || this.matches(CL));
        },
        set (flag) {
            let action = 'remove';
            if (flag) {
                action = 'add';
                if (this.loading) {
                    return flag;
                }
            }
            let strClassButton = 'ui-button';
            if (this.classList.contains(strClassButton) || this.getAttribute('is') == strClassButton) {
                this.classList[action]('loading');
            } else {
                this.classList[action](CL);
            }
        }
    });

    // loading 的分段展示
    let eleLoading = null;
    let timerLoading = null;

    // 定义 document 全局 loading 加载效果
    Object.defineProperty(document, 'loading', {
        get () {
            return Boolean(eleLoading && eleLoading.isConnected);
        },
        set (value) {

            let html = function (con) {
                return con && '<ui-loading-text>' + con + '<ui-dot>...</ui-dot></ui-loading-text>';
            }

            if (value || value === '') {
                if (eleLoading) {
                    document.body.append(eleLoading);
                    // 这里需要设置open属性
                    eleLoading.open = true;
                } else {
                    eleLoading = new Toast('1', 0);
                    eleLoading.loading = true;
                }
                // loading 文字显示
                let numIndex = 0;
                let arrTips = ['正在加载中', '仍在加载中', '即将加载完毕'];
                if (typeof value == 'string') {
                    arrTips = [value];
                } else if (Array.isArray(value)) {
                    arrTips = value;
                }

                // 显示提示的内容
                eleLoading.innerHTML = html(arrTips[numIndex]);

                // 清除之前的定时器（如果有）
                clearInterval(timerLoading);

                // 步阶显示提示内容
                timerLoading = setInterval(() => {
                    numIndex++;
                    eleLoading.innerHTML = html(arrTips[numIndex] || arrTips[numIndex - 1]);
                    if (numIndex >= arrTips.length - 1) {
                        clearInterval(timerLoading);
                    }
                }, 6000);
            } else if (eleLoading) {
                eleLoading.remove();
                clearInterval(timerLoading);
            }
        }
    });
})();

// <ui-loading> 自定义组件实现
class UiLoading extends HTMLElement {
    static get observedAttributes () {
        return ['rows', 'size', 'color'];
    }

    constructor () {
        super();
    }

    get size () {
        return this.getAttribute('size');
    }
    set size (value) {
        this.setAttribute('size', value);
    }

    get rows () {
        return this.getAttribute('rows');
    }
    set rows (value) {
        this.setAttribute('rows', value);
    }

    get color () {
        return this.getAttribute('color');
    }
    set color (value) {
        this.setAttribute('color', value);
    }

    render (attrs) {
        if (!attrs) {
            attrs = this.observedAttributes || [];
        } else if (typeof attrs == 'string') {
            attrs = [attrs];
        }
        if (attrs.forEach) {
            attrs.forEach(attr => {
                let val = this[attr];
                if (val === null) {
                    this.style.removeProperty('--ui-' + attr);
                } else {
                    this.style.setProperty('--ui-' + attr, val);
                }                
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

customElements.define('ui-loading', UiLoading);
