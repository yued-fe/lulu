/**
 * @Pagination.js
 * @author XboxYan(yanwenbin)
 * @version
 * @Created: 20-04-22
 * @edit:    20-04-22
 */

class Pagination extends HTMLElement {

    static get observedAttributes () {
        return ['per', 'total', 'current', 'loading'];
    }

    constructor ({per, total, current, loading, href, container = null, onChange = () => {}} = {}) {
        super();
        const shadowRoot = this.attachShadow({
            mode: 'open'
        });
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
        this.onchange = onChange;
        shadowRoot.innerHTML = `
        <style>
        :host {
            display: flex;
            font-size: 14px;
            height: 30px;
            align-items: center;
        }

        .ui-page {
            display: inline-flex;
            min-width: 18px;
            padding: 0 var(--ui-page-padding, 2px);
            margin: 0 5px;
            height: var(--ui-page-height, 28px);
            border: 1px solid transparent;
            border-radius: var(--ui-page-radius, 0);
            color: var(--ui-gray, #a2a9b6);
            font-size: var(--ui-font, 14px);
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            transition: border-color var(--ui-animate-time, .2s), background-color var(--ui-animate-time, .2s);
            text-decoration: none;
            user-select: none;
            position: relative;
            justify-content: center;
            align-items: center;
            background: none;
            box-sizing: content-box;
        }

        .ui-page:not(:focus-visible){
            outline: 0;
        }

        .ui-page[current] {
            cursor: default;
        }

        .ui-page:not([current]):not([disabled]):not(:disabled):hover {
            border-color: #b6bbc6;
            color: var(--ui-gray, #a2a9b6);
            cursor: pointer;
        }

        .ui-page:disabled {
            color: #ccd0d7;
            cursor: default;
        }

        .ui-page > svg {
            width: 20px;
            height: 20px;
        }

        .ui-page-prev,
        .ui-page-next {
            text-align: center;
            fill: currentColor;
            overflow: hidden;
        }

        /* 当前不可点的按钮颜色 */
        span.ui-page-prev,
        span.ui-page-next {
            color: var(--ui-diabled, #ccd0d7);
        }

        .ui-page-next svg {
            transform: scaleX(-1);
        }

        .ui-page-prev {
            margin-left: 0;
        }

        .ui-page-next {
            margin-right: 0;
        }

        .ui-page-ellipsis {
            display: inline-block;
        }

        :host(:not([loading]):not([data-loading=true])) .ui-page[current] {
            color: var(--ui-white, #ffffff);
            background-color: var(--ui-blue, #2a80eb);
        }

        .ui-page-text {
            color: var(--ui-dark, #4c5161);
        }

        .ui-page.loading > svg {
            visibility: hidden;
        }

        :host([loading]) .ui-page[current]::before,
        :host([data-loading=true]) .ui-page[current]::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            background-repeat: no-repeat;
            width: 20px;
            height: 20px;
            background: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M512 1024q-104 0-199-40-92-39-163-110T40 711Q0 616 0 512q0-15 10.5-25.5T36 476t25.5 10.5T72 512q0 90 35 171 33 79 94 140t140 95q81 34 171 34t171-35q79-33 140-94t95-140q34-81 34-171t-35-171q-33-79-94-140t-140-95q-81-34-171-34-15 0-25.5-10.5T476 36t10.5-25.5T512 0q104 0 199 40 92 39 163 110t110 163q40 95 40 199t-40 199q-39 92-110 163T711 984q-95 40-199 40z' fill='%232a80eb'/%3E%3C/svg%3E")
                no-repeat center;
            background-size: 20px 20px;
            margin: auto;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from {
                transform: rotate(0);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .simple-page {
            width: auto;
            padding: 0 .625em;
            pointer-events: none;
            color: #4c5161;
        }
        .page {
            display: inline-flex;
            height: 100%;
            align-items: center;
        }
        .pagination-wrap {
            display: contents;
            visibility: var(--ui-visibility, initial);
        }
        </style>
        <fieldset id="wrap" class="pagination-wrap">
            <${el} class="ui-page ui-page-prev" id="left">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
            <div class="page" id="page"></div>
            <${el} class="ui-page ui-page-next" id="right">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
        </fieldset>
        `;
        // trigger元素的获取
        this.element = new Proxy({}, {
            get: (target, prop) => {
                if (prop == 'trigger') {
                    return this.htmlFor && document.getElementById(this.htmlFor);
                }
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

    render (per, total) {
        const item = this.href ? 'a' : 'button';
        this.count = Math.ceil(total / per) || 1;
        const current = Math.min(Math.max(1, this.current), this.count);
        if (this.simple) {
            const html = `<div class="simple-page ui-page" >${current} / ${this.count}</div>`;
            this.page.innerHTML = html;
        } else {
            // 生成一个长度为count，且最大长度为10的数组 [undefined,undefined,undefined,undefined,undefined,...]
            const arr = Array.from({length: this.count}).splice(0, 9);
            // 将数组映射成每一页的节点
            const html = arr.map((el, index) => {
                // <button class="ui-page" data-current="2" aria-label="第2页，共20页">2</button>
                return `<${item} class="ui-page" data-current="${index + 1}" aria-label="第${index + 1}页，共${this.count}页">${index + 1}</${item}>`;
            }).join('');
            this.page.innerHTML = html;
        }

        // 存在同时改变多个自定义元素属性的情况，此时应该执行一次
        clearTimeout(this.timerRender);
        this.timerRender = setTimeout(() => {
            this.updatePage(current);
        });
    }

    updatePage (current = this.current) {
        if (current == 1) {
            this.left.setAttribute('disabled', true);
            this.left.setAttribute('aria-label', '已经是第一页了');
            this.left.removeAttribute('href');
        } else {
            this.left.removeAttribute('disabled');
            this.left.setAttribute('aria-label', `上一页，当前第${current}页`);
            this.left.href = this.href ? this.href.replace(/\${current}/g, current - 1) : 'javascript:;';
        }
        if (current == this.count) {
            this.right.setAttribute('disabled', true);
            this.right.setAttribute('aria-label', '已经是最后一页了');
            this.right.removeAttribute('href');
        } else {
            this.right.removeAttribute('disabled');
            this.right.setAttribute('aria-label', `下一页，当前第${current}页`);
            this.right.href = this.href ? this.href.replace(/\${current}/g, current + 1) : 'javascript:;';
        }
        if (this.simple) {
            this.page.querySelector('.simple-page').textContent = current + ' / ' + this.count;
        } else if (this.count > 9) {
            let place = [];
            switch (current) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    place = [1, 2, 3, 4, 5, 6, 7, 'next', this.count];
                    break;
                case this.count:
                case this.count - 1:
                case this.count - 2:
                case this.count - 3:
                case this.count - 4:
                    place = [1, 'pre', this.count - 6, this.count - 5, this.count - 4, this.count - 3, this.count - 2, this.count - 1, this.count];
                    break;
                default:
                    place = [1, 'pre', current - 2, current - 1, current, current + 1, current + 2, 'next', this.count];
                    break;
            }
            this.page.querySelectorAll('.ui-page').forEach((el, i) => {
                if (typeof place[i] === 'number') {
                    el.dataset.current = place[i];
                    el.textContent = place[i];
                    el.disabled = false;
                    el.href = 'javascript:;';
                    if (place[i] == current) {
                        el.setAttribute('current', '');
                        if (this.isKeepFocusIn) {
                            el.focus({
                                preventScroll: true
                            });
                        }
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
            this.page.querySelectorAll('.ui-page').forEach((el) => {
                if (el.dataset.current == current) {
                    el.setAttribute('current', '');
                    if (this.isKeepFocusIn) {
                        el.focus({
                            preventScroll: true
                        });
                    }
                } else {
                    el.removeAttribute('current');
                }
                if (this.href) {
                    el.href = this.href.replace(/\${current}/g, el.dataset.current);
                }
            });
        }
    }

    // 上一个聚焦元素
    focusPrev () {
        const current = this.shadowRoot.activeElement;
        if (current === this.right) {
            if (this.simple) {
                this.left.focus();
            } else {
                this.page.lastElementChild.focus();
            }
        } else {
            const prev = current.previousElementSibling;
            if (prev) {
                if (!prev.disabled) {
                    prev.focus();
                } else {
                    prev.previousElementSibling.focus();
                }
            } else {
                this.left.focus();
            }
        }
    }

    // 下一个聚焦元素
    focusNext () {
        const current = this.shadowRoot.activeElement;
        if (current === this.left) {
            if (this.simple) {
                this.right.focus();
            } else {
                this.page.firstElementChild.focus();
            }
        } else {
            const next = current.nextElementSibling;
            if (next) {
                if (!next.disabled) {
                    next.focus();
                } else {
                    next.nextElementSibling.focus();
                }
            } else {
                this.right.focus();
            }
        }
    }

    connectedCallback () {
        this.page = this.shadowRoot.getElementById('page');
        this.left = this.shadowRoot.getElementById('left');
        this.right = this.shadowRoot.getElementById('right');
        this.wrap = this.shadowRoot.getElementById('wrap');

        this.render(this.per, this.total);
        this.page.addEventListener('click', (ev) => {
            const item = ev.target.closest('.ui-page');
            if (item) {
                this.current = Number(item.dataset.current);
            }
        });
        this.page.addEventListener('focusin', () => {
            this.isKeepFocusIn = true;
        });
        this.addEventListener('keydown', (ev) => {
            if (this.loading) {
                return;
            }
            switch (ev.key) {
                case 'ArrowDown':
                case 'PageDown':
                    ev.preventDefault();
                    this.current--;
                    break;
                case 'ArrowUp':
                case 'PageUp':
                    ev.preventDefault();
                    this.current++;
                    break;
                case 'ArrowLeft':
                    this.focusPrev();
                    break;
                case 'ArrowRight':
                    this.focusNext();
                    break;
                default:
                    break;
            }
        });
        this.left.addEventListener('click', () => {
            this.current--;
            this.left.focus();
        });
        this.right.addEventListener('click', () => {
            this.current++;
            this.right.focus();
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-pagination'
            }
        }));

        // 分页内容准备完毕
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

        // 插入完成初始化的内容
        this.innerHTML = '&#x3000';
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if (!this.page || oldValue === newValue) {
            return;
        }
        let eleTrigger = this.element && this.element.trigger;

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
            this.wrap.disabled = newValue !== null;

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
            this.dispatchEvent(new CustomEvent('change', {
                detail: {
                    current: Number(newValue),
                    per: this.per,
                    total: this.total
                }
            }));
        }
    }
}

if (!customElements.get('ui-pagination')) {
    customElements.define('ui-pagination', Pagination);
}

window.Pagination = Pagination;

export default Pagination;

(function () {
    const initAllPagination = (ele) => {
        const elePaginations = ele || document.querySelectorAll('[is-pagination]');
        elePaginations.forEach(item => {
            const {total = 0, current = 1, per = 15, href = null, loading = false} = item.dataset;
            const pagination = new Pagination({
                per,
                total,
                href,
                loading
            });
            const strId = ('lulu_' + Math.random()).replace('0.', '');
            item.innerHTML = '';
            item.id = strId;
            item['ui-pagination'] = pagination;
            pagination.htmlFor = strId;
            pagination.setAttribute('current', current);
            // 删除自定义元素，隐藏不必要的细节
            pagination.addEventListener('connected', () => {
                pagination.remove();
            });
            document.body.append(pagination);
            const shadowRoot = item.attachShadow({
                mode: 'open'
            });
            shadowRoot.append(pagination.shadowRoot);
            item.setAttribute('defined', '');
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
