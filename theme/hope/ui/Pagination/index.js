/**
 * @Pagination.js
 * @author XboxYan(yanwenbin)
 * @version
 * @Created: 20-04-22
 * @edit:    20-04-22
 */

class UiPagination extends HTMLElement {

    static get observedAttributes () {
        return ['per', 'total', 'current', 'loading'];
    }

    constructor ({per, total, current, loading, href, container = null} = {}) {
        super();

        const isLink = href || this.href;
        const el = isLink ? 'a' : 'button';
        if (per) {
            this.per = per;
        }
        if (total) {
            this.total = total;
        }
        if (current) {
            this.setAttribute('current', current);
        }
        this.loading = loading;
        this.innerHTML = `<fieldset class="ui-page-wrap">
            <${el} class="ui-page-item ui-page-prev">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
            <div class="ui-page"></div>
            <${el} class="ui-page-item ui-page-next">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
        </fieldset>`;
        // trigger元素的获取
        this.element = new Proxy(this.element || {}, {
            get: (target, prop) => {
                if (prop == 'trigger') {
                    return this.htmlFor && document.getElementById(this.htmlFor);
                }

                return target[prop];
            },
            set (target, prop, value) {
                // 赋值
                target[prop] = value;

                return true;
            }
        });

        // 如果存在容器，就append进去
        if (typeof container == 'string') {
            container = document.querySelector(container);
        }
        if (container) {
            container.append(this);
        }
    }

    get per () {
        return Number(this.getAttribute('per')) || 15;
    }

    get simple () {
        return this.getAttribute('mode') === 'short';
    }

    get total () {
        return Number(this.getAttribute('total')) || 0;
    }

    get current () {
        return Number(this.getAttribute('current')) || 1;
    }

    get loading () {
        return this.getAttribute('loading') !== null;
    }

    get href () {
        //?page=1
        return this.getAttribute('href');
    }

    set current (value) {
        this.setAttribute('current', Math.min(Math.max(1, value), this.count));
    }

    set per (value) {
        this.setAttribute('per', value);
    }

    set total (value) {
        this.setAttribute('total', value);
    }

    set loading (value) {
        if (!value) {
            this.removeAttribute('loading');
        } else {
            this.setAttribute('loading', '');
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (value) {
        this.setAttribute('for', value);
    }

    // 渲染方法
    render (per, total) {
        let elePage = this.element.page;
        if (!elePage) {
            return;
        }

        // 如果是链接，使用 <a> 元素
        // 否则，使用 <button> 元素
        const item = this.href ? 'a' : 'button';
        this.count = Math.ceil(total / per) || 1;
        const current = Math.min(Math.max(1, this.current), this.count);

        // 如果是简单分页模式
        if (this.simple) {
            elePage.innerHTML = `<div class="ui-page-simple ui-page-item" >${current} / ${this.count}</div>`;
        } else {
            // 生成一个长度为count，且最大长度为10的数组 [undefined,undefined,undefined,undefined,undefined,...]
            const arr = Array.from({length: this.count}).splice(0, 7);
            // 将数组映射成每一页的节点
            const html = arr.map((el, index) => {
                return `<${item} class="ui-page-item" data-current="${index + 1}" aria-label="第${index + 1}页，共${this.count}页">${index + 1}</${item}>`;
            }).join('');
            elePage.innerHTML = html;
        }

        // 存在同时改变多个自定义元素属性的情况，此时应该执行一次
        clearTimeout(this.timerRender);
        this.timerRender = setTimeout(() => {
            this.updatePage(current);
        });
    }

    updatePage (current = this.current) {
        // 元素获取
        let elePage = this.element.page;
        let elePrev = this.element.prev;
        let eleNext = this.element.next;

        if (current == 1) {
            elePrev.setAttribute('disabled', true);
            elePrev.setAttribute('aria-label', '已经是第一页了');
            elePrev.removeAttribute('href');
        } else {
            elePrev.removeAttribute('disabled');
            elePrev.setAttribute('aria-label', `上一页，当前第${current}页`);
            elePrev.href = this.href ? this.href.replace(/\${current}/g, current - 1) : 'javascript:;';
        }
        if (current == this.count) {
            eleNext.setAttribute('disabled', true);
            eleNext.setAttribute('aria-label', '已经是最后一页了');
            eleNext.removeAttribute('href');
        } else {
            eleNext.removeAttribute('disabled');
            eleNext.setAttribute('aria-label', `下一页，当前第${current}页`);
            eleNext.href = this.href ? this.href.replace(/\${current}/g, current + 1) : 'javascript:;';
        }
        if (this.simple) {
            elePage.querySelector('.ui-page-simple').textContent = current + ' / ' + this.count;
        } else if (this.count > 7) {
            let place = [];
            switch (current) {
                case 1:
                case 2:
                case 3:
                case 4:
                    place = [1, 2, 3, 4, 5, 'next', this.count];
                    break;
                case this.count:
                case this.count - 1:
                case this.count - 2:
                case this.count - 3:
                    place = [1, 'pre', this.count - 4, this.count - 3, this.count - 2, this.count - 1, this.count];
                    break;
                default:
                    place = [1, 'pre', current - 1, current, current + 1, 'next', this.count];
                    break;
            }
            elePage.querySelectorAll('.ui-page-item').forEach((el, i) => {
                if (typeof place[i] === 'number') {
                    el.dataset.current = place[i];
                    el.textContent = place[i];
                    el.disabled = false;
                    el.href = 'javascript:;';
                    if (place[i] == current) {
                        el.setAttribute('current', '');
                    } else {
                        el.removeAttribute('current');
                    }
                    el.removeAttribute('disabled');
                    el.setAttribute('aria-label', `第${place[i]}页，共${this.count}页`);
                    if (this.href) {
                        el.href = this.href.replace(/\${current}/g, el.dataset.current);
                    }
                } else {
                    el.textContent = '...';
                    el.removeAttribute('current');
                    el.removeAttribute('data-current');
                    el.removeAttribute('aria-label');
                    el.setAttribute('disabled', true);
                    el.removeAttribute('href');
                }
            });
        } else {
            elePage.querySelectorAll('.ui-page-item').forEach((el) => {
                if (el.dataset.current == current) {
                    el.setAttribute('current', '');
                } else {
                    el.removeAttribute('current');
                }
                if (this.href) {
                    el.href = this.href.replace(/\${current}/g, el.dataset.current);
                }
            });
        }
    }


    connectedCallback () {
        // 一些元素内容
        let eleWrap = this.querySelector('fieldset');
        if (!eleWrap) {
            return;
        }

        // 前后按钮和分页主体元素
        let elePage = eleWrap.querySelector('.ui-page');
        let elePrev = eleWrap.firstElementChild;
        let eleNext = eleWrap.lastElementChild;

        // 全局暴露
        this.element.wrap = eleWrap;
        this.element.page = elePage;
        this.element.prev = elePrev;
        this.element.next = eleNext;
        
        // 开启渲染
        this.render(this.per, this.total);

        // 事件的处理
        elePage.addEventListener('click', (ev) => {
            const item = ev.target.closest('.ui-page-item');
            if (item) {
                this.nativeClick = true;
                this.current = Number(item.dataset.current);
            }
        });

        elePrev.addEventListener('click', () => {
            this.nativeClick = true;
            this.current--;
        });
        eleNext.addEventListener('click', () => {
            this.nativeClick = true;
            this.current++;
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-pagination'
            }
        }));

        this.isConnectedCallback = true;

        // 分页内容准备完毕
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if (!this.element || oldValue === newValue) {
            return;
        }
        let eleTrigger = this.element.trigger;
        let eleWrap = this.element.wrap;

        if (name == 'per') {
            this.render(newValue, this.total);
            // 普通元素分页数据per数据同步
            if (eleTrigger) {
                eleTrigger.dataset.per = newValue;
            }
        } else if (name == 'total') {
            this.render(this.per, newValue);
            // 普通元素分页数据total数据同步
            if (eleTrigger) {
                eleTrigger.dataset.total = newValue;
            }
        } else if (name == 'loading') {
            eleWrap.disabled = newValue !== null;

            // 普通元素分页数据loading状态同步
            if (eleTrigger) {
                eleTrigger.dataset.loading = newValue !== null;
            }
        } else if (name == 'current' && oldValue !== newValue) {
            // 一定程度上避免冗余的渲染
            clearTimeout(this.timerRender);
            this.timerRender = setTimeout(() => {
                this.updatePage(Number(newValue));
            });

            // 普通元素分页数据信息的实时同步
            if (eleTrigger) {
                eleTrigger.dataset.current = newValue;
            }
            if (this.nativeClick) {
                this.nativeClick = false;
                this.dispatchEvent(new CustomEvent('change', {
                    detail: {
                        current: Number(newValue),
                        per: this.per,
                        total: this.total
                    }
                }));

                if (eleTrigger && eleTrigger != this) {
                    eleTrigger.dispatchEvent(new CustomEvent('change', {
                        detail: {
                            current: Number(newValue),
                            per: this.per,
                            total: this.total
                        }
                    }));
                }
            }
        }
    }
}

if (!customElements.get('ui-pagination')) {
    customElements.define('ui-pagination', UiPagination);
}

window.Pagination = UiPagination;

// 给 HTML 元素扩展 pagination 方法
HTMLElement.prototype.pagination = function (options) {
    if (this.matches('ui-pagination') || this['ui-pagination']) {
        return this;
    }

    const {
        total = 0,
        current = 1,
        per = 15,
        href = null,
        loading = false
    } = this.dataset;

    let objParams = Object.assign({}, {
        per,
        total,
        href,
        loading
    }, options || {});

    const pagination = new Pagination(objParams);

    const strId = this.id || ('lulu_' + Math.random()).replace('0.', '');
    this.innerHTML = '';
    this.id = strId;
    this['ui-pagination'] = pagination;
    pagination.htmlFor = strId;
    pagination.setAttribute('current', current);
    // 删除自定义元素，隐藏不必要的细节
    pagination.addEventListener('connected', () => {
        // 所有普通元素也触发 connected 生命周期事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-pagination'
            }
        }));

        // 原分页从页面中删除
        pagination.remove();

        // DOM 执行完毕
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    });
    document.body.append(pagination);

    this.append.apply(this, [...pagination.children]);

    // 设置定义完毕标志量
    this.setAttribute('defined', '');

    return this;
};

(function () {
    const initAllPagination = (ele) => {
        const elePaginations = ele || document.querySelectorAll('[is-pagination]');

        elePaginations.forEach(item => {
            item.pagination();
        });
    };

    /**
     * 初始化并监听页面包含is-pagination属性的DOM节点变化
     */
    const autoInitAndWatchingIsPaginationAttr = () => {
        // 先实例化已有is-pagination属性的DOM节点，再监听后续的节点变化
        initAllPagination();
        const observer = new MutationObserver(mutationsList => {
            mutationsList.forEach(mutation => {
                mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                    if (!eleAdd.tagName) {
                        return;
                    }
                    if (eleAdd.hasAttribute('is-pagination')) {
                        initAllPagination([eleAdd]);
                    } else {
                        initAllPagination(eleAdd.querySelectorAll('[is-pagination]'));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState != 'loading') {
        autoInitAndWatchingIsPaginationAttr();
    } else {
        window.addEventListener('DOMContentLoaded', autoInitAndWatchingIsPaginationAttr);
    }
})();

/**/export default UiPagination;
