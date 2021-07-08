/**
 * @Pagination.js
 * @author sunmeiye
 * @version
 * @Created: 20-06-07
 * @edit:    20-06-07
 */

// ui tab custom HTML
class Tab extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }
    static get defaults () {
        return {
            eventType: 'click',
            history: false,
            autoplay: 3000
        };
    }
    constructor (trigger, options) {
        super();

        // 元素的获取
        let eleTrigger = null;
        if (typeof trigger == 'string') {
            eleTrigger = document.getElementById(trigger);
        } else if (typeof trigger == 'object') {
            if (trigger.tagName) {
                eleTrigger = trigger;
            } else if (!options) {
                options = trigger;
            }
        }

        options = options || {};

        if (eleTrigger) {
            let strTriggerId = eleTrigger.id;
            if (!strTriggerId) {
                strTriggerId = ('lulu_' + Math.random()).replace('0.', '');
                eleTrigger.id = strTriggerId;
                // for属性设置
                this.htmlFor = strTriggerId;
            }

            // 参数转移
            if (eleTrigger.getAttribute('name')) {
                this.name = eleTrigger.getAttribute('name');
            }
            if (eleTrigger.hasAttribute('open')) {
                this.open = true;
            }

            for (let paramsKey in Tab.defaults) {
                if (typeof eleTrigger.dataset[paramsKey.toLowerCase()] != 'undefined') {
                    this[paramsKey] = eleTrigger.dataset[paramsKey.toLowerCase()];
                } else if (typeof options[paramsKey] != 'undefined') {
                    this[paramsKey] = eleTrigger.dataset[paramsKey.toLowerCase()] = options[paramsKey];
                }
            }

            // target值也可以使用is-tab属性设置
            let strIsTab = eleTrigger.getAttribute('is-tab');
            if (strIsTab && !eleTrigger.dataset.target) {
                eleTrigger.dataset.target = strIsTab;
            }

            // 非控件元素的键盘访问支持
            if (eleTrigger.tabIndex == -1) {
                eleTrigger.setAttribute('tabindex', 0);
            }
        }

        // 参数和元素设置的处理
        let objElement = this.element || {};

        // trigger和target元素的设置与获取
        this.element = new Proxy(objElement, {
            get: (target, prop) => {
                if (prop == 'target') {
                    let strIdTarget = this.target;
                    let eleTarget = null;
                    let eleTrigger = this.element.trigger;
                    if (!strIdTarget && eleTrigger) {
                        strIdTarget = eleTrigger.dataset.target || eleTrigger.getAttribute('href');

                        if (strIdTarget && /#/.test(strIdTarget)) {
                            strIdTarget = strIdTarget.split('#')[1];
                        }
                    }

                    // 对应的目标元素获取
                    if (strIdTarget) {
                        eleTarget = document.getElementById(strIdTarget);
                    }
                    return eleTarget;
                }

                if (prop == 'trigger') {
                    return (this.htmlFor && document.getElementById(this.htmlFor)) || this;
                }

                return target[prop];
            },
            set: (target, prop, value) => {
                if (typeof value == 'string') {
                    value = document.getElementById(value) || document.querySelector(value);
                }
                // 只有当value是节点元素时候才赋值
                if (value && typeof value.nodeType != 'number') {
                    return false;
                }

                // 元素赋值
                target[prop] = value;

                // target元素设置时候同时需要赋值
                if (prop == 'target' && value) {
                    let eleTarget = value;
                    let strId = eleTarget.id;
                    if (!strId) {
                        strId = ('lulu_' + Math.random()).replace('0.', '');
                        eleTarget.id = strId;
                    }

                    // 如果用户直接使用this.element.target赋值，则需要同步target属性值
                    if (this.element.trigger == this) {
                        // 此if判断可以避免死循环
                        if (this.target != strId) {
                            this.target = strId;
                        }
                    } else if (this.element.trigger) {
                        this.element.trigger.setAttribute('data-target', strId);
                    }
                }

                return true;
            }
        });

        // 参数设置
        // 在本组件中，作用较弱
        this.setParams(options);

        // 载入到页面
        if (!this.parentElement) {
            // 使用专门的div包裹，避免暴露过多的细节
            let eleHidden = document.querySelector('body > div[hidden="tab"]');
            if (!eleHidden) {
                eleHidden = document.createElement('div');
                eleHidden.setAttribute('hidden', 'tab');
                document.body.append(eleHidden);
            }
            eleHidden.append(this);
        }
    }
    get eventType () {
        let strEventType = this.getAttribute('eventtype') || Tab.defaults.eventType;
        if (strEventType == 'hover') {
            strEventType = 'mouseenter';
        }
        return strEventType;
    }
    set eventType (value) {
        this.setAttribute('eventtype', value);
    }
    get history () {
        return this.hasAttribute('history') || Tab.defaults.history;
    }
    set history (value) {
        this.toggleAttribute('history', value);
    }
    get autoplay () {
        let strAttrAutoplay = this.getAttribute('autoplay');
        if (typeof strAttrAutoplay !== 'string') {
            return false;
        }
        if (/^\d+$/.test(strAttrAutoplay)) {
            return strAttrAutoplay * 1;
        }

        return Tab.defaults.autoplay;
    }
    set autoplay (value) {
        if (!value && value !== '') {
            this.removeAttribute('autoplay');
        } else {
            this.setAttribute('autoplay', value);
        }
    }
    get name () {
        return this.getAttribute('name');
    }
    set name (value) {
        this.setAttribute('name', value);
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (v) {
        // 设置属性
        this.setAttribute('for', v);
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

    // 参数批量设置
    setParams (options) {
        this.params = this.params || {};
        options = options || {};

        Object.assign(this.params, options);
    }

    switch () {
        let strName = this.name;
        let eleTabGroup = [];
        // 对应选项卡显示的处理
        if (strName) {
            eleTabGroup = document.querySelectorAll('ui-tab[name="' + strName + '"]');

            if (!this.open) {
                eleTabGroup.forEach(tab => {
                    if (tab.open) {
                        tab.open = false;
                    }
                });
                this.open = true;
            }
        } else {
            this.open = !this.open;
        }

        // 历史记录的处理
        if (this.history == true && strName && /tab\d{10,16}/.test(strName) == false) {
            if (!this.element.target) {
                return;
            }
            let strId = this.element.target.id;

            // url地址查询键值对替换
            const objURLParams = new URLSearchParams(location.search);
            // 改变查询键值，有则替换，无则新增
            objURLParams.set(strName, strId);

            // hash优化，去除重复的hash
            let strHash = location.hash;
            if (strId == strHash) {
                location.hash = strHash = '';
            }

            // 改变当前URL
            history.replaceState(null, document.title, location.href.split('?')[0] + '?' + objURLParams.toString() + strHash);
        }
    }

    // 自动切换
    autoSwitch () {
        // 自动播放
        let numTimeAutoplay = this.autoplay;
        let strName = this.name;

        if (numTimeAutoplay && strName) {
            let eleTabGroup = document.querySelectorAll('ui-tab[name="' + strName + '"]');
            clearTimeout(this.timer);
            if (numTimeAutoplay && strName && eleTabGroup.length > 1) {
                let indexTab = [].slice.call(eleTabGroup).findIndex(tab => {
                    return tab == this;
                });
                indexTab++;
                if (indexTab >= eleTabGroup.length) {
                    indexTab = 0;
                }
                this.timer = setTimeout(() => {
                    eleTabGroup[indexTab].switch();
                    // 自动播放
                    eleTabGroup[indexTab].autoSwitch();
                }, numTimeAutoplay);
            }
        }
    }

    // 初始化tab事件
    events () {
        // hover事件的键盘访问支持
        if (this.eventType == 'mouseover' || this.eventType == 'mouseenter') {
            // 增加延时判断，避免误经过产生的不好体验
            this.element.trigger.addEventListener(this.eventType, () => {
                Tab.hoverTimer = setTimeout(() => {
                    this.switch();
                }, 150);
            }, false);
            // 如果快速移出，则不执行切换
            this.element.trigger.addEventListener(this.eventType.replace('over', 'out').replace('enter', 'leave'), () => {
                clearTimeout(Tab.hoverTimer);
            });
        }

        // 无论什么事件类型，都需要click事件兜底
        this.element.trigger.addEventListener('click', (event) => {
            if (/^(:?javas|#)/.test(event.target.getAttribute('href'))) {
                event.preventDefault();
            }
            this.switch();
        }, false);

        // 如果定时播放，鼠标经过暂停
        if (this.autoplay && this.name) {
            [this.element.trigger, this.element.target].forEach((ele) => {
                ele.addEventListener('mouseenter', () => {
                    clearTimeout(this.timer);
                });
                ele.addEventListener('mouseleave', () => {
                    this.autoSwitch();
                });
            });

            // 当前open选项卡开始准备自动播放
            let eleFirstOpenTab = document.querySelector('ui-tab[name="' + this.name + '"][open]');
            if (eleFirstOpenTab) {
                eleFirstOpenTab.autoSwitch();
            }
        }
    }

    // ui-tab元素在页面出现的时候
    connectedCallback () {
        if (!this.closest('a, button') && !this.querySelector('a, button')) {
            this.setAttribute('tabindex', '0');
        }
        let eleTarget = this.element.target;
        let eleTrigger = this.element.trigger;

        if (eleTrigger) {
            eleTrigger.setAttribute('role', 'tab');
        }
        if (eleTarget) {
            eleTarget.setAttribute('role', 'tabpanel');
        }
        // 事件
        this.events();

        // URL查询看看能不能获取到记录的选项卡状态信息
        let objURLParams = new URLSearchParams(location.search);
        objURLParams.forEach((value, key) => {
            if (eleTrigger && eleTarget && this.name == key && eleTarget.id == value && !eleTrigger.hasAttribute('open')) {
                eleTrigger.click();
            }
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-tab'
            }
        }));

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

        // is-tab等类型初始化完毕标志事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    /**
     * open属性变化时候的变化
     * @param {*} name
     * @param {*} newValue
     * @param {*} oldValue
     */
    attributeChangedCallback (name, newValue, oldValue) {
        if (this.element && name === 'open' && typeof newValue != typeof oldValue) {
            const elePanel = this.element.target;
            if (!elePanel) {
                return;
            }
            if (this.open) {
                elePanel.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                this.dispatchEvent(new CustomEvent('show', {
                    detail: {
                        type: 'ui-tab'
                    }
                }));
            } else {
                elePanel.classList.remove('active');
                this.setAttribute('aria-selected', 'false');
                this.dispatchEvent(new CustomEvent('hide', {
                    detail: {
                        type: 'ui-tab'
                    }
                }));
            }

            // is-tab等普通元素的open属性变化
            let eleTrigger = this.element.trigger;
            if (eleTrigger && eleTrigger != this) {
                eleTrigger.toggleAttribute('open', this.open);
            }

            // 内置选项卡划来划去效果
            if (eleTrigger && this.name && /ui-tab/.test(eleTrigger.className)) {
                eleTrigger.parentElement.style.setProperty('--ui-tab-width', eleTrigger.clientWidth);
                eleTrigger.parentElement.style.setProperty('--ui-tab-left', eleTrigger.offsetLeft);
            }

            // 无论选项卡切换还是隐藏，都会触发switch事件
            this.dispatchEvent(new CustomEvent('switch'));
        }
    }
}

// 扩展HTML元素tab的方法
NodeList.prototype.tab = function (options = {}) {
    const eleTabs = this;
    let strName = options.name || '';

    for (var eleTab of eleTabs) {
        if (!strName && eleTab.getAttribute('name')) {
            strName = eleTab.getAttribute('name');
        }
    }

    if (!strName) {
        strName = ('tab' + Math.random()).replace('0.', '');
    }

    for (let eleTab of eleTabs) {
        eleTab.setAttribute('name', strName);
        eleTab['ui-tab'] = new Tab(eleTab, options);
    }
};

// 定义ui-tab
if (!customElements.get('ui-tab')) {
    customElements.define('ui-tab', Tab);
}

window.Tab = Tab;

/**
 * 自动化
 */
(function () {

    /**
     *
     */
    function funAutoInitAndWatching () {
        document.querySelectorAll('[is-tab]').forEach(function (eleTab) {
            if (!eleTab['ui-tab']) {
                eleTab['ui-tab'] = new Tab(eleTab);
            }
        });
        var observerTab = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (eleAdd) {
                    if (!eleAdd.tagName) {
                        return;
                    }
                    if (eleAdd.hasAttribute('is-tab')) {
                        if (!eleAdd['ui-tab']) {
                            eleAdd['ui-tab'] = new Tab(eleAdd);
                        }
                    } else {
                        eleAdd.querySelectorAll('[is-tab]').forEach(function (eleTab) {
                            if (!eleTab['ui-tab']) {
                                eleTab['ui-tab'] = new Tab(eleTab);
                            }
                        });
                    }
                });
            });
        });

        observerTab.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }
})();

// 只有type=module的时候可以用，否则会报错
export default Tab;
