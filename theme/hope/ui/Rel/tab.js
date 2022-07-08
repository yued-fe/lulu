/**
 * @Tab.js
 * @author zhangxinxu
 * @description 选项卡功能
 * @version
 * @created 22-06-30
 */

/**/import UiRel from "./index.js";

// ui tab custom HTML
class UiTab extends UiRel {
    get history () {
        return this.hasAttribute('history');
    }
    set history (value) {
        this.toggleAttribute('history', value);
    }

    // 自动切换
    onSwitch () {
        let eleTarget = document.getElementById(this.target);

        // 自动播放
        const location = window.location;

        let strName = this.name;

        // 历史记录的处理
        if (this.history == true && strName && /tab\d{10,16}/.test(strName) == false && this.open) {
            if (!eleTarget) {
                return;
            }
            let strId = eleTarget.id;

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
            window.history.replaceState(null, document.title, location.href.split('?')[0] + '?' + objURLParams.toString() + strHash);
        }
    }

    // ui-tab元素在页面出现的时候
    connectedCallback () {
        if (!this.closest('a, button') && !this.querySelector('a, button')) {
            this.setAttribute('tabindex', '0');
        }

        // 无障碍设置
        this.setAttribute('role', 'tab');

        let eleTarget = document.getElementById(this.target);
        if (eleTarget) {
            eleTarget.setAttribute('role', 'tabpanel');
        }

        // URL查询看看能不能获取到记录的选项卡状态信息
        let objURLParams = new URLSearchParams(window.location.search);
        objURLParams.forEach((value, key) => {
            if (eleTarget && this.name == key && eleTarget.id == value && !this.open) {
                this.click();
            }
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-tab'
            }
        }));

        this.isConnectedCallback = true;

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }
}


// 定义ui-tab
if (!customElements.get('ui-tab')) {
    customElements.define('ui-tab', UiTab);
}


class UiTabs extends HTMLElement {
    constructor () {
        super();

        // this.addEventListener('switch', event => {
        //     let eleTarget = event.target;
        //     let eleTab = eleTarget && eleTarget.closest('ui-tab');
        //     if (eleTab && !eleTab.disabled) {
        //         this.setVar(eleTab);

        //         // 触发事件
        //         this.dispatchEvent(new CustomEvent('switch'));
        //     }
        // });

        this.setAttribute('role', 'tablist');

        // 尺寸变化时候，位置重新调整
        let ro = new ResizeObserver(() => {
            this.setVar(this.selectedTab);
        });
        ro.observe(this);
    }

    get selectedTab () {
        return this.querySelector('ui-tab[open]');
    }

    set selectedTab (tab) {
        if (tab && tab.switch) {
            tab.switch();
        }
    }

    get selectedIndex () {
        return [...this.tabs].indexOf(this.selectedTab);
    }

    set selectedIndex (index) {
        this.selectedTab = this.tabs[index];
    }

    get tabs () {
        return this.querySelectorAll('ui-tab');
    }

    set tabs(vals) {
        if (vals) {
            this.append.apply(this, [...vals]);
        }
    }

    setVar (tab) {
        let numLeftTab = tab.offsetLeft;
        let numWidthTab = tab.clientWidth;
        // 获取标签里面文字内容的宽度
        let div = document.createElement('div');
        div.style.position = 'absolute';
        div.textContent = tab.textContent;
        tab.append(div);
        let numWidthText = div.clientWidth;

        // 设置变量尺寸和偏移
        this.style.setProperty('--ui-tab-width', numWidthText);
        this.style.setProperty('--ui-tab-left', numLeftTab + (numWidthTab - numWidthText) / 2);

        // 用完就扔掉
        div.remove();

        // 进入视区中心位置
        let numWidthTabs = this.offsetWidth;
        let numScrollLeft = this.scrollLeft;
        // 无论在什么位置，都往中心靠
        // 如果可以滚动，会定位
        // 如果滚动不了，反正没有任何反应
        this.scrollLeft = this.scrollLeft + (numLeftTab - numScrollLeft - numWidthTabs / 2 + numWidthTab / 2);
    }

    connectedCallback () {
        // 如果内部的 <ui-tab> 元素没有 name，自动添加 name
        let eleTabs = this.tabs;
        if (eleTabs.length && !this.querySelector('ui-tab[name]')) {
            let strName = this.id || 'lu_' + setTimeout(0);
            eleTabs.forEach(tab => {
                tab.name = strName;

                if (tab.open) {
                    this.setVar(tab);
                }

                tab.addEventListener('show', () => {
                    this.setVar(tab);
                    // 触发事件
                    this.dispatchEvent(new CustomEvent('switch'));
                });
            });
        }
    }
}

if (!customElements.get('ui-tabs')) {
    customElements.define('ui-tabs', UiTabs);
}

// 只有type=module的时候可以用，否则会报错
/**/export default UiTab;
