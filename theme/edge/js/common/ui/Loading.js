/**
 * @Loading.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-23
 * @Log: 2017-09-19 loading类名的添加基于标签，而非类名
 * @edit by littleLionGuoQing:  20-05-07  ES6、<ui-loading> web components组件 && 支持rows和size属性的设置和获取
 */

import LightTip from './LightTip.js';

(() => {
    // 避免重复定义
    if ('loading' in HTMLElement.prototype) {
        return;
    }

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
            let strClassButton = CL.replace(LOADING, 'button');
            if (this.classList.contains(strClassButton) || this.getAttribute('is') == strClassButton) {
                this.classList[action](LOADING);
            } else {
                this.classList[action](CL);
            }
        }
    });

    // loading 的分段展示
    let eleLightLoading = null;
    let timerLoading = null;
    Object.defineProperty(document, 'loading', {
        get () {
            return Boolean(eleLightLoading && document.querySelector('ui-lighttip[type=loading]'));
        },
        set (newValue) {
            if (newValue) {
                if (eleLightLoading) {
                    document.body.append(eleLightLoading);
                    // 这里需要设置open属性
                    eleLightLoading.open = true;
                } else {
                    eleLightLoading = new LightTip({
                        type: 'loading'
                    });
                }
                // loading 文字显示
                let numIndex = 0;
                let arrTips = ['正在加载中<ui-dot>...</ui-dot>', '仍在加载中<ui-dot>...</ui-dot>', '请再稍等片刻<ui-dot>...</ui-dot>'];
                if (typeof newValue == 'string') {
                    arrTips = [newValue];
                } else if (Array.isArray(newValue)) {
                    arrTips = newValue;
                }
                eleLightLoading.innerHTML = arrTips[numIndex];
                clearInterval(timerLoading);
                timerLoading = setInterval(() => {
                    numIndex++;
                    eleLightLoading.innerHTML = arrTips[numIndex] || arrTips[numIndex - 1];
                    if (numIndex >= arrTips.length - 1) {
                        clearInterval(timerLoading);
                    }
                }, 6000);
            } else {
                eleLightLoading && eleLightLoading.remove();
                clearInterval(timerLoading);
            }
        }
    });

})();

// <ui-loading> 自定义组件实现
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

if (!customElements.get('ui-loading')) {
    customElements.define('ui-loading', Loading);
}
