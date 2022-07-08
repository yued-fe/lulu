/**
 * @description 基于 ScrollSnap 的滑动选项卡效果
 * @author zhangxinxu
 * @created  2022-07-05
 */

/**/import './index.js';
/**/import '../Rel/tab.js';

class uiScrollSnapTab extends HTMLElement {
    constructor () {
        super();
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get snap () {
        let target = this.target;

        if (target) {
            return document.getElementById(target);
        }

        return this.querySelector('ui-scroll-snap');
    }

    set snap (val) {
        this.append(val);
    }

    events () {
        let eleSnap = this.snap;
        let eleTabs = this.querySelector('ui-tabs');
        let eleSnapItems = eleSnap && eleSnap.items;

        if (eleSnap && !eleSnap.isEventBind) {
            // 设置必要的切换属性
            eleSnap.type = 'x mandatory';
            eleSnap.toggleAttribute('smooth', true);
            eleSnap.stop = true;
            // 滚动结束时候的选项卡处理
            eleSnap.addEventListener('scrollEnd', (event) => {
                let indexTab = event.detail && event.detail.index;
                if (typeof indexTab == 'number' && eleTabs) {
                    eleTabs.selectedIndex = indexTab;
                }
            });

            // 元素创建
            eleSnap.isEventBind = true;
        }

        if (eleTabs && !eleTabs.isEventBind) {
            eleTabs.addEventListener('switch', () => {
                let selectedIndex = eleTabs.selectedIndex;
                // 对于的面板元素定位
                if (eleSnapItems && eleSnapItems[selectedIndex]) {
                    eleSnapItems[selectedIndex].selected = true;
                    eleSnapItems[selectedIndex].position();
                }

                // 触发切换事件处理
                this.dispatchEvent(new CustomEvent('switch', {
                    detail: {
                        index: selectedIndex
                    }
                }));
            });

            eleTabs.isEventBind = true;
        }
    }

    connectedCallback () {
        this.events();
    }
}

if (!customElements.get('ui-scroll-snap-tab')) {
    customElements.define('ui-scroll-snap-tab', uiScrollSnapTab);
}
