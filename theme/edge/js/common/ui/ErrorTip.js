/**
 * @ErrorTip.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-01
 * @edited:  20-07-07 edit by peter.qiyuanhao
 */

import './Follow.js';

class ErrorTip {
    static allHide (exclude) {
        ErrorTip.collectionErrorTip.forEach(obj => {
            if (exclude != obj) {
                obj.hide();
            }
        });
    }

    constructor (element, content, options) {
        const defaults = {
            unique: true,
            onShow: () => {},
            onHide: () => {}
        };

        // 参数
        const objParams = {
            ...defaults,
            ...options
        };

        // 显示字符内容的处理
        let strContent = content;

        // 支持Function类型
        if (typeof strContent == 'function') {
            strContent = strContent();
        }
        if (typeof strContent != 'string') {
            return this;
        }

        // 一些元素
        const eleTrigger = element;

        let objErrorTip = eleTrigger.data && eleTrigger.data.errorTip;
        // 如果当前元素之前有过出错提示实例，则重复使用，无需再构造
        if (objErrorTip) {
            objErrorTip.content = strContent;
            objErrorTip.callback = {
                show: objParams.onShow,
                hide: objParams.onHide
            };
            objErrorTip.element.tips.trigger = eleTrigger;
            objErrorTip.show();

            return this;
        }

        // eleTips指的是红色出错提示元素
        let eleTips;
        // 为了单出错提示模式下，所有的红色都能取消的处理
        // 所有提示过的实例对象合在一起隐藏
        let collectionErrorTip = ErrorTip.collectionErrorTip;
        // 全局的出错实例
        const objUniqueErrorTip = collectionErrorTip[collectionErrorTip.length - 1];

        // 如果是唯一模式，则看看全局出错的对象
        if (objParams.unique == true && objUniqueErrorTip) {
            // window.errorTip存储的是唯一的红色提示元素
            // 改变存储的触发元素
            eleTips = objUniqueErrorTip.element.tips;
        } else if (objParams.unique == false && eleTrigger.data && eleTrigger.data.errorTip) {
            eleTips = eleTrigger.data.errorTip.element.tips;
        } else {
            eleTips = this.create();
        }

        // 如果是唯一模式，全局存储
        if (objParams.unique == true && collectionErrorTip.includes(this) == false) {
            collectionErrorTip.push(this);
        }

        // 更新提示元素对应的触发元素
        eleTips.trigger = eleTrigger;

        this.element = {
            trigger: eleTrigger,
            tips: eleTips
        };
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };

        this.params = {
            unique: objParams.unique
        };

        // 暴露在外
        this.content = strContent;

        // 在DOM对象上暴露对应的实例对象
        if (!eleTrigger.data) {
            eleTrigger.data = {};
        }
        eleTrigger.data.errorTip = this;

        // 显示
        this.show();
    }

    /**
     * 红色出错提示元素的创建
     */
    create () {
        // 首次
        let eleTips = document.createElement('div');
        eleTips.className = 'ui-tips-x ui-tips-error';
        document.body.appendChild(eleTips);

        // 事件
        this.events(eleTips);

        return eleTips;
    }

    /**
     * 无论是键盘操作，还是按下，都隐藏出错提示
     * @param {Element} eleTips 表示创建的红色提示元素
     */
    events (eleTips) {
        // 任何键盘操作，点击，或者拉伸都会隐藏错误提示框
        document.addEventListener('keydown', (event) => {
            // ctrl/shift键不隐藏
            if (!/Control|Shift/i.test(event.code)) {
                ErrorTip.allHide(this);
                this.hide();
            }
        });

        document.addEventListener('mousedown', (event) => {
            const eleActiveElement = document.activeElement;

            const eleActiveTrigger = eleTips.trigger;
            const eleTarget = event.target;

            // 如果点击的就是触发的元素，且处于激活态，则忽略
            if (eleActiveElement && eleActiveTrigger && eleActiveElement == eleTarget &&
                eleActiveElement == eleActiveTrigger &&
                // 这个与Datalist.js关联
                !eleActiveTrigger.getAttribute('data-focus')
            ) {
                return;
            }

            ErrorTip.allHide(this);
            this.hide();
        });

        window.addEventListener('resize', () => {
            ErrorTip.allHide(this);
            this.hide();
        });
    }

    /**
     * 错误tips提示显示方法
     */
    show () {
        const objElement = this.element;
        // 触发元素和提示元素
        const eleTips = objElement.tips;
        const eleTrigger = objElement.trigger;

        // 修改content内容
        eleTips.innerHTML = this.content;

        // 提示元素显示
        eleTips.style.display = '';

        // 定位
        eleTrigger.follow(eleTips, {
            // trigger-target
            position: '5-7',
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // aria无障碍访问增强
        eleTrigger.setAttribute('aria-label', '错误提示：' + this.content);
        // 两个重要标志类名
        eleTrigger.toggleAttribute('is-error', true);
        eleTrigger.classList.add('valided');

        this.display = true;

        // 显示的回调
        if (this.callback && this.callback.show) {
            this.callback.show.call(this, eleTrigger, eleTips);
        }
    }

    /**
       * 错误tips提示隐藏方法
       * @return {Object}  返回当前实例对象
       */
    hide () {
        // 避免重复隐藏执行
        if (!this.display) {
            return;
        }

        const eleTips = this.element.tips;
        const eleTrigger = this.element.trigger;

        eleTrigger.removeAttribute('aria-label');
        eleTrigger.removeAttribute('is-error');

        eleTips.style.display = 'none';

        // 隐藏的回调
        if (this.callback && this.callback.hide) {
            this.callback.hide.call(this, eleTrigger, eleTips);
        }

        this.display = false;
    }
}

ErrorTip.collectionErrorTip = [];

window.ErrorTip = ErrorTip;

/**
 * 给任意 dom 注入 errorTip 方法
 * @param content String
 * @param options { unique, onShow, onHide }
 */
HTMLElement.prototype.errorTip = function (content, options = {}) {
    new ErrorTip(this, content, options);
};

export default ErrorTip;
