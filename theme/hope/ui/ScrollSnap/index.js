/**
 * @ScrollSnap.js
 * @author zhangxinxu
 * @version
 * @description 基于 scroll snap 实现的 UI 组件
 * @created: 22-03-08
 */

class uiScrollSnap extends HTMLElement {
    constructor () {
        super();

        this.events();
    }

    static get observedAttributes () {
        return ['loop', 'type', 'stop', 'align', 'padding'];
    }

    set type (value) {
        this.setAttribute('type', value);
    }

    get type () {
        let type = 'both';
        if (this.closest('ui-scroll-snap-swipe')) {
            type = 'x mandatory';
        }
        return this.getAttribute('type') || type;
    }

    set stop (value) {
        this.setAttribute('stop', value);
    }

    get stop () {
        return this.getAttribute('stop') || 'normal';
    }

    set loop (value) {
        this.toggleAttribute('loop', value);
    }

    get loop () {
        return this.hasAttribute('loop');
    }

    set align (value) {
        if (value == 'center') {
            value = 'centre';
        }
        this.setAttribute('align', value);
    }

    get align () {
        let align = this.getAttribute('align');
        if (align !== 'start' || align !== 'end') {
            align = 'center';
        }
        return align;
    }

    appendItemForScroll () {
        if (this.isAppendItem) {
            return;
        }
        let eleOriginItems = this.items;
        // 方向
        let type = this.type;

        // 循环滚动不支持双向
        // 要么垂直滚动，要么水平滚动
        var size = 'height';
        var scroll = 'top';

        if (type.split(/\s/).includes('x')) {
            size = 'width';
            scroll = 'left';
        }

        // 首字母大写
        let sizeUpper = size.replace(/^[a-z]/, function (matches) {
            return matches.toUpperCase();
        });
        let scrollUpper = scroll.replace(/^[a-z]/, function (matches) {
            return matches.toUpperCase();
        });

        // 此时的 items
        let clientSize = this['client' + sizeUpper];
        let scrollSize = this['scroll' + sizeUpper];

        // 如果滚动尺寸不足，没有必要无限滚动，不处理
        if (scrollSize <= clientSize) {
            return;
        }

        // 如果滚动位置不足
        let eleFragmentAfter = document.createDocumentFragment();
        let eleFragmentBefore = document.createDocumentFragment();

        [...eleOriginItems].forEach(item => {
            let cloneItem1 = item.cloneNode(true);
            let cloneItem2 = item.cloneNode(true);

            // 去除 selected 状态
            cloneItem1.removeAttribute('selected');
            cloneItem2.removeAttribute('selected');

            // DOM 片段组装
            eleFragmentAfter.appendChild(cloneItem1);
            eleFragmentBefore.appendChild(cloneItem2);
        });

        this.prepend(eleFragmentBefore);
        this.append(eleFragmentAfter);

        // 第一个和最后一个元素
        let eleCurrentItem = this.querySelectorAll('ui-scroll-snap-item');
        let lastItem = eleCurrentItem[eleCurrentItem.length - 1];

        // 定位
        let offset = eleOriginItems[0]['offset' + scrollUpper] - this['offset' + scrollUpper];
        this['scroll' + scrollUpper] = offset;

        // 判断滚动的方向
        let lastScroll = offset;

        // 滚动事件
        this.addEventListener('scroll', () => {
            let scrollValue = this['scroll' + scrollUpper];

            // 尺寸重新
            clientSize = this['client' + sizeUpper];
            scrollSize = this['scroll' + sizeUpper];

            if (scrollValue < lastScroll && scrollValue == 0) {
                if (this.onScrollStart) {
                    this.onScrollStart(eleCurrentItem, eleOriginItems, offset);
                }
                this.style.scrollBehavior = 'auto';
                this['scroll' + scrollUpper] = offset;
            } else if (scrollValue > lastScroll && scrollValue >= (scrollSize - clientSize - 1)) {
                if (this.onScrollEnd) {
                    this.onScrollEnd(eleCurrentItem, eleOriginItems, offset);
                }
                this.style.scrollBehavior = 'auto';
                // 偏移一整个原始 items 的高度
                this['scroll' + scrollUpper] -= (lastItem['offset' + scrollUpper] - eleOriginItems[eleOriginItems.length - 1]['offset' + scrollUpper]);
            }

            lastScroll = this['scroll' + scrollUpper];

            // 移除 selected 元素
            let eleItemSelected = this.querySelector('ui-scroll-snap-item[selected]');
            if (eleItemSelected) {
                eleItemSelected.selected = false;
            }

            // 还原是否平滑滚动
            setTimeout(() => {
                this.style.scrollBehavior = '';
            }, 1);
        });

        if (this.onScrollInited) {
            this.onScrollInited(eleCurrentItem, eleOriginItems, offset);
        }

        this.isAppendItem = true;
    }

    // 滚动事件处理
    events () {
        // 元素匹配偏移值
        let numOffsetMatch = 5;

        // 滚动事件执行
        this.addEventListener('scroll', () => {
            clearTimeout(this.timerScroll);
            this.timerScroll = setTimeout(() => {
                // 方向
                let type = this.type;

                // 循环滚动不支持双向
                // 要么垂直滚动，要么水平滚动
                var size = 'height';
                var dir = 'top';

                if (type.split(/\s/).includes('x')) {
                    size = 'width';
                    dir = 'left';
                }
                // 容器相关计算点
                let boundSnap = this.getBoundingClientRect();

                // 100毫秒内滚动事件没触发，认为停止滚动了
                // 对列表元素进行位置检测
                [].slice.call(this.children).forEach((eleList, index) => {
                    // 对齐方式
                    let align = eleList.align || this.align;

                    // 容器对比位置
                    let pointSnap = boundSnap[dir] + boundSnap[size] / 2;
                    if (align == 'start') {
                        pointSnap = boundSnap[dir];
                    } else if (align == 'end') {
                        pointSnap = boundSnap[dir] + boundSnap[size];
                    }
                    // 列表的尺寸和定位
                    let boundList = eleList.getBoundingClientRect();
                    // 列表元素对比点
                    let pointList = boundList[dir] + boundList[size] / 2;
                    if (align == 'start') {
                        pointList = boundList[dir];
                    } else if (align == 'end') {
                        pointList = boundList[dir] + boundSnap[size];
                    }

                    // 如果和目标距离小于指定偏移
                    if (Math.abs(pointList - pointSnap) < numOffsetMatch) {
                        // 添加标志类名
                        eleList.selected = true;
                        // 触发事件
                        this.dispatchEvent(new CustomEvent('scrollEnd', {
                            detail: {
                                index: index,
                                item: eleList
                            }
                        }));
                    } else {
                        eleList.selected = false;
                    }
                });
            }, 100);
        });
    }

    attributeChangedCallback (name) {
        if (name === 'loop' && this.loop) {
            this.appendItemForScroll();
        }
    }

    connectedCallback () {
        this.items = this.querySelectorAll('ui-scroll-snap-item');

        if (this.loop) {
            this.appendItemForScroll();
        }
    }
}

if (!customElements.get('ui-scroll-snap')) {
    customElements.define('ui-scroll-snap', uiScrollSnap);
}

class uiScrollSnapItem extends HTMLElement {
    static get observedAttributes () {
        return ['margin', 'align'];
    }
    constructor () {
        super();

        this.addEventListener('click', function () {
            let href = this.href;
            if (href) {
                location.href = href;
            }
        });
    }
    set align (value) {
        this.setAttribute('type', value);
    }

    get align () {
        return getComputedStyle(this).scrollSnapAlign || 'center';
    }

    set selected (value) {
        this.toggleAttribute('selected', value);
    }

    get selected () {
        return this.hasAttribute('selected');
    }

    set disabled (value) {
        this.toggleAttribute('disabled', value);
    }

    get disabled () {
        return this.hasAttribute('disabled');
    }

    get href () {
        return this.getAttribute('href');
    }

    set href (value) {
        this.setAttribute('href', value);
    }

    // 选中元素的重定位
    position () {
        const eleSnap = this.snap;
        // 定位
        if (eleSnap && this.selected) {
            let align = this.align;

            // 方向
            let type = eleSnap.type;

            // 循环滚动不支持双向
            // 要么垂直滚动，要么水平滚动
            var size = 'height';
            var dir = 'top';
            var scrollDir = 'scrollTop';

            if (type.split(/\s/).includes('x')) {
                size = 'width';
                dir = 'left';
                scrollDir = 'scrollLeft';
            }

            // 定位
            let scrollDistance = eleSnap[scrollDir];

            // 偏移定位距离
            let scrollOffset = 0;

            // 计算应该偏移的距离
            let boundSnap = eleSnap.getBoundingClientRect();
            let boundList = this.getBoundingClientRect();

            // 默认是居中定位
            scrollOffset = (boundSnap[dir] + boundSnap[size] / 2) - (boundList[dir] + boundList[size] / 2);

            if (align == 'start') {
                scrollOffset = boundSnap[dir] - boundList[dir];
            } else if (align == 'end') {
                scrollOffset = (boundSnap[dir] + boundSnap[size]) - (boundList[dir] + boundList[size]);
            }

            eleSnap[scrollDir] = scrollDistance - scrollOffset;
        }
    }

    connectedCallback () {
        this.snap = this.closest('ui-scroll-snap');

        if (!this.snap) {
            return this;
        }

        this.position();

        // 如果有链接行为
        if (this.hasAttribute('href')) {
            this.setAttribute('role', 'link');
        }
    }
}

if (!customElements.get('ui-scroll-snap-item')) {
    customElements.define('ui-scroll-snap-item', uiScrollSnapItem);
}
