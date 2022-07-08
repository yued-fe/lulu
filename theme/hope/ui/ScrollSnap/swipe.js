/**
 * @description 基于 ScrollSnap 的轮播效果
 * @author zhangxinxu
 * @created  2022-07-01
 */

/**/import './index.js';

class uiScrollSnapSwipe extends HTMLElement {
    constructor () {
        super();
    }

    get snap () {
        return this.querySelector('ui-scroll-snap');
    }

    set snap (val) {
        this.append(val);
    }

    get autoplay () {
        let strAttrAutoplay = this.getAttribute('autoplay');
        if (typeof strAttrAutoplay !== 'string') {
            return false;
        }
        if (/^\d+$/.test(strAttrAutoplay)) {
            return strAttrAutoplay * 1;
        }

        return 3000;
    }
    set autoplay (value) {
        if (!value && value !== '') {
            this.removeAttribute('autoplay');
        } else {
            this.setAttribute('autoplay', value);
        }
    }

    create () {
        // 创建点点点元素
        let eleControl = this.querySelector('ui-swipe-control');

        if (!eleControl) {
            eleControl = document.createElement('ui-swipe-control');
            this.append(eleControl);
        }
        // 清空
        eleControl.innerHTML = '';
        
        // 根据 item 数量 创建圈圈数量
        let eleSnap = this.snap;
        let eleSnapItems = eleSnap.querySelectorAll('ui-scroll-snap-item');

        // 元素创建
        let eleControlItems = [...eleSnapItems].map(ele => {
            let eleItem = document.createElement('ui-swipe-control-item');
            if (ele.selected) {
                eleItem.setAttribute('selected', '');
            }

            eleControl.append(eleItem);

            return eleItem;
        });

        // 元素暴露
        this.control = eleControl;
        this.controlItems = eleControlItems;

        // 事件处理
        eleSnap.addEventListener('scrollEnd', (event) => {
            let detail = event.detail;
            // 改变选中的点点
            eleControlItems.forEach((item, index) => {
                if (detail.index % eleSnapItems.length === index) {
                    item.setAttribute('selected', '');
                } else {
                    item.removeAttribute('selected');
                }
            });

            // 继续自动播放
            this.autoSwipe();
        });

        eleSnap.addEventListener('scroll', () => {
            clearTimeout(this.timer);
        });

        if (!eleControl.querySelector('[selected]')) {
            eleControlItems[0].toggleAttribute('selected');
        }
    }

    // 自动切换
    autoSwipe () {
        // 自动播放时间
        let numTimeAutoplay = this.autoplay;
        // snap 主体元素
        let eleSnap = this.snap;
        // 子项
        let eleSnapItems = eleSnap.querySelectorAll('ui-scroll-snap-item');

        if (numTimeAutoplay && eleSnapItems.length) {
            clearTimeout(this.timer);
            // 当前选中元素
            let indexItem = [...eleSnapItems].findIndex(item => {
                return item.hasAttribute('selected');
            });
            indexItem++;
            if (indexItem >= eleSnapItems.length) {
                indexItem = 0;
            }
            this.timer = setTimeout(() => {
                eleSnapItems[indexItem].selected = true;
                eleSnapItems[indexItem].position();
                // 自动播放
                this.autoSwipe();
            }, numTimeAutoplay);
        }
    }

    connectedCallback () {
        let eleSnap = this.snap;
        if (eleSnap) {
            // 设置必要的 swipe 切换属性
            eleSnap.type = 'x mandatory';
            // 元素创建
            this.create();
            // 设置为无限循环切换
            eleSnap.loop = true;
            // 每次只滚一个
            eleSnap.stop = true;
            // 自动切换
            this.autoSwipe();
        }
    }
}

if (!customElements.get('ui-scroll-snap-swipe')) {
    customElements.define('ui-scroll-snap-swipe', uiScrollSnapSwipe);
}
