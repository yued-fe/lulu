/**
 * @Loading.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-23
 * @Log: 2017-09-19 loading类名的添加基于标签，而非类名
 * @edit by littleLionGuoQing:  20-05-07  ES6、<ui-loading> web components组件 && 支持rows和size属性的设置和获取
 */
(() => {

    /**
     * 给HTML元素扩展一个loading属性
     */
    let LOADING = 'loading';
    let CL = 'ui-' + LOADING;
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
            if (this.classList.contains(CL.replace(LOADING, 'button'))) {
                this.classList[action](LOADING);
            } else {
                this.classList[action](CL);
            }
        }
    });
})();


class Loading extends HTMLElement {
    constructor () {
        super();
    }
    get size () {
        return this.getAttribute('size') || 2;
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
}

customElements.define('ui-loading', Loading);
