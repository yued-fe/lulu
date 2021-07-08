/**
 * @Tips.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edit:    17-06-19
 * @edit:    20-06-09 edit by y2x
 * @edit:    20-11-03 by zxx
 */
import './Follow.js';

class Tips extends HTMLElement {
    static get observedAttributes () {
        return ['title', 'reverse', 'for', 'eventType', 'align'];
    }

    constructor () {
        super();

        this.target = null;
    }

    get title () {
        let strTitle = this.getAttribute('title');

        if (strTitle) {
            this.setAttribute('data-title', strTitle);
            // 移除浏览器默认的title，防止交互冲突
            this.removeAttribute('title');
        } else {
            strTitle = this.getAttribute('data-title') || '';
        }

        return strTitle;
    }

    set title (value) {
        this.setAttribute('data-title', value);
        // 屏幕阅读无障碍访问支持
        this.setAttribute('aria-label', value);
    }

    get reverse () {
        return this.getAttribute('reverse') !== null || this.classList.contains('reverse');
    }

    set reverse (value) {
        if (value) {
            this.setAttribute('reverse', '');
        } else {
            this.removeAttribute('reverse');
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (v) {
        this.setAttribute('for', v);
    }

    get align () {
        return this.getAttribute('align') || 'auto';
    }
    set align (v) {
        this.setAttribute('align', v);
    }

    get eventType () {
        return this.getAttribute('eventtype') || 'hover';
    }
    set eventType (v) {
        this.setAttribute('eventtype', v);
    }

    get trigger () {
        const htmlFor = this.htmlFor;

        let eleTrigger;
        if (htmlFor) {
            eleTrigger = document.getElementById(htmlFor);
        }

        return eleTrigger || this;
    }

    create () {
        let eleTrigger = this.trigger;
        let strContent = this.title;
        // eleTips元素不存在，则重新创建
        let eleTips = document.createElement('div');
        eleTips.classList.add('ui-tips-x');
        eleTips.innerHTML = strContent;

        // 屏幕阅读无障碍访问描述
        if (!eleTrigger.getAttribute('aria-label')) {
            // 创建随机id, aria需要
            const strRandomId = 'lulu_' + (Math.random() + '').replace('0.', '');
            eleTrigger.setAttribute('aria-labelledby', strRandomId);
        }

        // append到页面中
        document.body.appendChild(eleTips);
        this.target = eleTips;

        // DOM
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    show () {
        let eleTrigger = this.trigger;
        let strContent = this.title;

        if (this.target) {
            // 改变显示内容
            this.target.innerHTML = strContent;
        } else {
            this.create();
        }
        // 显示
        this.target.style.display = 'block';

        // 定位
        let strPosition = '5-7';
        // 定位只有5-7, 7-5, 6-8, 8-6这几种
        // 其中5-7是默认，提示在上方
        // 7-5是由'reverse'类名或参数决定的
        let strAlign = this.align;
        const isReverse = this.reverse;
        if (strAlign === 'auto') {
            strAlign = eleTrigger.dataset.align || eleTrigger.dataset.position || 'center';
        }

        // 关键字参数与位置
        if (strAlign === 'center') {
            strPosition = !isReverse ? '5-7' : '7-5';
        } else if (strAlign === 'left') {
            strPosition = !isReverse ? '1-4' : '4-1';
        } else if (strAlign === 'right') {
            strPosition = !isReverse ? '2-3' : '3-2';
        } else if (/^\d-\d$/.test(strAlign)) {
            strPosition = strAlign;
        }

        eleTrigger.follow(this.target, {
            // trigger-target
            position: strPosition,
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // 显示的回调
        eleTrigger.dispatchEvent(new CustomEvent('show', {
            detail: {
                type: 'ui-tips'
            }
        }));
    }

    hide () {
        if (!this.target) {
            return;
        }
        this.target.style.display = 'none';
        this.trigger.dispatchEvent(new CustomEvent('hide', {
            detail: {
                type: 'ui-tips'
            }
        }));
    }

    events () {
        let eleTrigger = this.trigger;
        // hover显示延迟时间
        const numDelay = 100;
        // 设置定时器对象
        this.timerTips = null;
        this.handleMouseEnter = () => {
            this.timerTips = setTimeout(() => {
                this.show();
            }, numDelay);
        };
        this.handleMouseLeave = () => {
            clearTimeout(this.timerTips);
            // 隐藏提示
            this.hide();
        };
        this.handleFocus = () => {
            if (window.isKeyEvent) {
                this.show();
            }
        };
        this.handleMouseUp = (event) => {
            const eleTarget = event.target;
            if (!eleTrigger.contains(eleTarget) && !this.target.contains(eleTarget)) {
                this.hide();
            }
        };

        // 事件走起
        if (this.eventType === 'hover') {
            // 鼠标进入
            eleTrigger.addEventListener('mouseenter', this.handleMouseEnter);
            // 鼠标离开
            eleTrigger.addEventListener('mouseleave', this.handleMouseLeave);

            // 支持focus的显示与隐藏
            // 但是需要是键盘访问触发的focus
            eleTrigger.addEventListener('focus', this.handleFocus);
            // 元素失焦
            eleTrigger.addEventListener('blur', this.hide);
        } else if (this.eventType === 'click') {
            eleTrigger.addEventListener('click', this.show);
            // 关闭
            document.addEventListener('mouseup', this.handleMouseUp);
        } else {
            // 其他事件类型直接显示
            this.show();
        }
    }

    connectedCallback () {
        let eleTrigger = this.trigger;
        // format title
        this.title;

        // 更语义
        // 非focusable元素使其focusable
        if (!/^a|input|button|area$/i.test(eleTrigger.tagName)) {
            eleTrigger.setAttribute('tabindex', '0');
            // 更语义
            eleTrigger.setAttribute('role', 'tooltip');
        }

        this.events();

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-tips'
            }
        }));
    }
}

if (!customElements.get('ui-tips')) {
    customElements.define('ui-tips', Tips);
}

/**
 * 给任意 dom 注入 tips 方法
 * @param options {eventType, align, onShow, onHide}
 */
HTMLElement.prototype.tips = function (content, options = {}) {
    // 如果是CSS驱动的tips提示效果
    if (this.getAttribute('is-tips') === 'css' || this.classList.contains('ui-tips')) {
        if (this.title) {
            this.setAttribute('data-title', this.title);
            this.setAttribute('aria-label', this.title);
            this.removeAttribute('title');
        }
        return;
    }

    if (typeof content != 'string') {
        options = content || {};
    }

    // 只调用一次
    if (this['ui-tips']) {
        if (typeof options.eventType != 'undefined' && options.eventType != 'hover' && options.eventType != 'click') {
            this['ui-tips'].show();
        }
        return;
    }

    let eleTips = document.createElement('ui-tips');

    if (typeof content == 'string') {
        eleTips.title = content;
    } else {
        eleTips.title = this.getAttribute('title') || options.content || '';
    }

    // 移除原始的标题
    this.removeAttribute('title');

    // custom trigger
    if (!this.id) {
        this.id = 'lulu_' + (Math.random() + '').replace('0.', '');
    }
    eleTips.htmlFor = this.id;

    if (options.eventType) {
        eleTips.eventType = options.eventType;
    }
    if (options.align) {
        eleTips.align = options.align;
    }
    if (options.onShow) {
        eleTips.addEventListener('show', options.onShow.bind(this));
    }
    if (options.onHide) {
        eleTips.addEventListener('hide', options.onHide.bind(this));
    }

    this['ui-tips'] = eleTips;

    eleTips.addEventListener('connected', function () {
        this.remove();
    });
    document.body.appendChild(eleTips);
};

(function () {
    // 处理所有非 <ui-tips /> 的情况: .ui-tips, [is-tips="css"], [is-tips]
    let funTipsInitAndWatching = function () {
        const tips = document.querySelectorAll('.ui-tips, [is-tips]');
        tips.forEach((item) => {
            item.tips();
        });

        var observerTips = new MutationObserver(function (mutationsList) {
        // 此时不检测DOM变化
            if (window.watching === false) {
                return;
            }
            mutationsList.forEach(function (mutation) {
                var nodeAdded = mutation.addedNodes;
                var nodeRemoved = mutation.removedNodes;
                if (nodeAdded.length) {
                    nodeAdded.forEach(function (eleAdd) {
                        if (!eleAdd.matches) {
                            return;
                        }
                        if (eleAdd.matches('.ui-tips, [is-tips]')) {
                            eleAdd.tips();
                        } else {
                            eleAdd.querySelectorAll('.ui-tips, [is-tips]').forEach(item => {
                                item.tips();
                            });
                        }
                    });
                }

                if (nodeRemoved.length) {
                    nodeRemoved.forEach(function (eleRemove) {
                        // 删除对应的<ui-tips>元素，如果有
                        if (eleRemove.tagName && eleRemove['ui-tips']) {
                            eleRemove['ui-tips'].remove();
                        }
                        if (eleRemove.childNodes.length) {
                            eleRemove.childNodes.forEach(function (ele) {
                                if (ele['ui-tips']) {
                                    ele['ui-tips'].remove();
                                }
                            });
                        }
                    });
                }
            });
        });

        observerTips.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState != 'loading') {
        funTipsInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funTipsInitAndWatching);
    }
})();
