/**
 * @Drop.js
 * @author zhangxinxu
 * @version
 * @created 15-06-30
 * @edited  20-07-08 edit by wanglei
 * @edited  22-06-16 edit by wanglei
 */

/**/import '../Float/follow.js';

class Drop extends HTMLElement {

    static get observedAttributes () {
        return ['open', 'target'];
    }

    static get defaults () {
        return {
            eventtype: 'click',
            position: '7-5'
        };
    }

    /**
     * @param {Object} trigger 触发元素
     * @param {Object} target  显示的浮动定位元素
     * @param {Object} options 可选参数
     */
    constructor (eleTrigger, eleTarget, options) {
        super();

        // 参数的处理
        options = options || {};
        this.params = this.params || {};
        // 观察参数变化
        this.params = new Proxy(this.params, {
            get: (params, prop) => {
                if (!prop) {
                    return;
                }
                prop = prop.toLowerCase();

                let value = params[prop];
                let eleTrigger = this.element.trigger;

                if (typeof value == 'undefined') {
                    value = eleTrigger.getAttribute(prop) || eleTrigger.dataset[prop];

                    if (prop == 'width') {
                        if (eleTrigger !== this) {
                            value = eleTrigger.dataset[prop];
                        } else {
                            value = eleTrigger.getAttribute(prop);
                        }
                    }

                    // 部分参数如果没有，则使用默认的参数值
                    if (typeof value == 'undefined' && Drop.defaults[prop]) {
                        value = Drop.defaults[prop];
                    }
                }

                return value;
            },
            set: (params, prop, value) => {
                params[prop.toLowerCase()] = value;
                return true;
            }
        });

        let objElement = this.element || {};

        // trigger和target元素的设置与获取
        this.element = new Proxy(objElement, {
            get: (target, prop) => {
                if (prop == 'target') {
                    let strIdTarget = this.getAttribute('target');
                    let eleTarget = target[prop];
                    if (!eleTarget && strIdTarget) {
                        eleTarget = document.getElementById(strIdTarget);
                    }
                    return eleTarget;
                }

                if (prop == 'trigger') {
                    return target[prop] || this;
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

                    let eleTrigger = this.element.trigger;

                    // 如果用户直接使用this.element.target赋值，则需要同步target属性值
                    if (eleTrigger == this) {
                        // 此if判断可以避免死循环
                        if (this.target != strId) {
                            this.target = strId;
                        }
                    } else if (eleTrigger) {
                        let strAttrTarget = eleTrigger.dataset.target;
                        if (strAttrTarget && document.querySelector('datalist[id="' + strAttrTarget + '"]')) {
                            // 如果匹配的是<datalist>元素
                            eleTrigger.setAttribute('data-target2', strId);
                        } else {
                            eleTrigger.setAttribute('data-target', strId);
                        }
                    }
                }

                return true;
            }
        });

        // 开始参数设置
        // eleTrigger, eleTarget, options均可缺省
        [...arguments].forEach(function (argument) {
            if (typeof argument == 'object' && argument && !argument.tagName) {
                options = argument;
            }
        });

        if (eleTrigger) {
            this.element.trigger = eleTrigger;
        }

        // 此时的eleTrigger一定是元素，之前可能是选择器
        eleTrigger = this.element.trigger;
        // target的处理
        if (eleTrigger) {
            // target元素
            if (eleTarget && eleTarget !== options) {
                this.element.target = eleTarget;
            } else if (!eleTarget && eleTrigger.dataset && eleTrigger.dataset.target) {
                this.element.target = eleTrigger.dataset.target;
            }
        }

        // 参数设置
        this.setParams(options);

        // 如果默认open为true，则显示
        if (this.open) {
            if (document.readyState != 'loading') {
                this.show();
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    this.show();
                });
            }
        }

        if (eleTrigger !== this) {
            // 隐藏<ui-drop>元素细节
            this.addEventListener('connected', function () {
                this.remove();
            });

            eleTrigger['ui-drop'] = this;

            document.body.append(this);
        }
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

    // 设置参数方法
    setParams (options) {
        options = options || {};
        // 显示与隐藏的回调
        let funCallShow = options.onShow;
        let funCallHide = options.onHide;
        if (typeof funCallShow == 'function') {
            this.addEventListener('show', function (event) {
                funCallShow.call(this, event);
            });

            delete options.onShow;
        }
        if (typeof funCallHide == 'function') {
            this.addEventListener('hide', function (event) {
                funCallHide.call(this, event);
            });

            delete options.onHide;
        }
        // 参数合并
        Object.assign(this.params, options || {});
    }

    /**
     * 下拉定位的事件处理
     * @return {[type]} [description]
     */
    events (isIgnoreTarget) {
        // 元素
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 如果没有target 并且不是无视没有target，返回
        if (!eleTarget && !isIgnoreTarget) {
            return;
        }

        if (eleTarget && eleTarget.matches('datalist')) {
            return;
        }

        // 参数
        const objParams = this.params;

        // 获取匹配选择器的eleTrigger子元素
        const funGetClosestChild = (element) => {
            if (!objParams.selector) {
                return null;
            }

            const eleClosestSelector = element.closest(objParams.selector);
            if (eleTrigger.contains(eleClosestSelector) == false) {
                return null;
            }

            return eleClosestSelector;
        };

        // 根据不同事件类型进行逻辑处理
        switch (objParams.eventType) {
            // 默认值，直接显示
            case 'null': {
                break;
            }

            // 点击或者右键
            case 'click': {
                if (!eleTrigger.isBindDropEvents || eleTrigger.isBindDropEvents !== objParams.eventType) {
                    eleTrigger.addEventListener(objParams.eventType, event => {
                        event.preventDefault();
                        // aria支持
                        // 获得委托的选择器匹配元素
                        const eleClosestSelector = funGetClosestChild(event.target);

                        if (eleClosestSelector) {
                            // 改变trigger元素
                            this.element.trigger = eleClosestSelector;
                        }

                        // 点击即显示
                        if (!objParams.selector || eleClosestSelector) {
                            // 连续右键点击保持显示，非显隐切换
                            if (objParams.eventType == 'contextmenu') {
                                objParams.position = [event.pageX, event.pageY];
                                this.show();

                                return;
                            }

                            if (!this.open) {
                                this.show();
                            } else {
                                this.hide();
                            }
                        }
                    });
                }

                break;
            }

            default: {
                break;
            }
        }

        // 点击页面空白区域隐藏
        if (objParams.eventType != 'null' && !eleTrigger.isBindDocMouseUp) {
            document.addEventListener('mouseup', event => {
                let eleClicked = event && event.target;

                if (!eleClicked || !this.open) {
                    return;
                }

                // 因为trigger和target可能动态变化
                // 因此这里再次获取一遍
                let eleTrigger = this.element.trigger;
                let eleTarget = this.element.target;

                if (eleTrigger.contains(eleClicked) == false && (!eleTarget || eleTarget.contains(eleClicked) == false)) {
                    this.hide();
                }
            });

            eleTrigger.isBindDocMouseUp = true;
        }

        eleTrigger.isBindDropEvents = objParams.eventType || true;

        // 窗体尺寸改变生活的重定位
        window.addEventListener('resize', () => {
            this.position();
        });

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    /**
     * 下拉定位处理
     * @return {Object} 返回当前自定义元素
     */
    position () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 下拉必须是显示状态才执行定位处理
        if (this.open && eleTarget && window.getComputedStyle(eleTrigger).display != 'none') {
            eleTrigger.follow(eleTarget, {
                offsets: this.params.offsets,
                position: this.params.position,
                edgeAdjust: this.params.edgeAdjust
            });
        }

        return this;
    }

    /**
     * 下拉的显示处理
     * @return {Object} 返回当前自定义元素
     */
    show () {
        // target需要在页面中
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 如果target在内存中，append到页面上
        if (eleTarget && document.body.contains(eleTarget) == false) {
            document.body.appendChild(eleTarget);
        }

        if (eleTarget) {
            // 进行定位
            eleTarget.style.position = 'absolute';
            eleTarget.style.display = 'inline';
            eleTarget.style.outline = 'none';
            // 焦点转移
            eleTarget.tabIndex = -1;
            // 焦点转移到浮层元素上
            eleTarget.focus({
                preventScroll: true
            });

            // 标记target此时对应的trigger元素
            eleTarget.element = eleTarget.element || {};
            eleTarget.element.trigger = this;
        }
        // aria
        eleTrigger.setAttribute('aria-expanded', 'true');

        // 改变显示标志量
        if (!this.open) {
            this.open = true;
        }

        // 定位
        this.position();

        // 触发自定义事件 - show
        this.dispatchEvent(new CustomEvent('show'));

        // 如果trigger元素非<ui-drop>元素，则也触发一下，同时传递show事件来源
        // 因为一个普通的HTML元素可能会LuLu ui不同的组件触发'show'事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }

    /**
     * 下拉的隐藏处理
     * @return {Object} 返回当前自定义元素
     */
    hide () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 隐藏下拉面板
        if (eleTarget) {
            eleTarget.style.display = 'none';
            eleTarget.classList.remove('ESC');
            // 取消target元素上的trigger关联
            // 因为一个target元素可以关联多个trigger
            if (eleTarget.element) {
                delete eleTarget.element.trigger;
            }
        }

        // aria
        eleTrigger.setAttribute('aria-expanded', 'false');

        if (window.isKeyEvent) {
            eleTrigger.focus();
        }

        // 更改显示标志量
        if (this.open) {
            this.open = false;
        }

        // 触发自定义事件 - hide
        this.dispatchEvent(new CustomEvent('hide'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('hide', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }

    /**
     * <ui-drop>元素进入页面中的时候
    **/
    connectedCallback () {
        let eleTarget = this.element.target;
        let eleTrigger = this.element.trigger;

        // 默认的aria状态设置
        if (eleTrigger.open) {
            eleTrigger.setAttribute('aria-expanded', 'true');
        } else {
            eleTrigger.setAttribute('aria-expanded', 'false');
        }

        // 页面中的<ui-drop>元素如果没有target
        // 强制绑定事件，这样<ui-drop>元素可以实现open切换效果
        if (!eleTarget) {
            this.events(eleTrigger === this);
        } else if (eleTarget.matches('datalist')) {
            setTimeout(() => {
                if (this.list) {
                    this.list(eleTarget);
                }
            }, 1);            
        } else {
            this.events();
        }

        // 无障碍访问设置
        if (!this.querySelector('a, button') && !this.closest('a, button')) {
            this.tabIndex = 0;
            this.role = 'button';
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-drop'
            }
        }));

        if (eleTrigger != this && eleTrigger.hasAttribute('is-drop')) {
            eleTrigger.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-drop'
                }
            }));

            // 设置定义完毕标志量
            eleTrigger.setAttribute('defined', '');
        }

        this.isConnectedCallback = true;
    }

    // open属性变化的时候
    attributeChangedCallback (name, oldValue, newValue) {
        if (name == 'target') {
            let eleTarget = document.getElementById(newValue);
            if (eleTarget) {
                this.element.target = eleTarget;
            }
        } else if (name == 'open') {
            let strAriaExpanded = this.element.trigger.getAttribute('aria-expanded');
            if (this.open && strAriaExpanded == 'false') {
                this.show();
            } else if (!this.open && strAriaExpanded == 'true') {
                this.hide();
            }
        }
    }
}

window.Drop = Drop;

if (!customElements.get('ui-drop')) {
    customElements.define('ui-drop', Drop);
}

// 给 HTML 元素扩展 drop 方法
HTMLElement.prototype.drop = function (eleTarget, options) {
    if (!this.matches('ui-drop, [is-drop]') && !this['ui-drop']) {
        this['ui-drop'] = new Drop(this, eleTarget, options);
    }

    return this;
};

/**
 * 初始化所有包含is-drop属性的节点
 * 支持事件冒泡，当点击的元素或者祖先元素，设置了is-drop属性，则把is-drop的属性值作为下拉元素的id，并根据这个id值获取并显示下拉元素。
 */
const initAllIsDropAttrAction = (ele) => {
    const eleDrops = ele || document.querySelectorAll('[is-drop]');
    eleDrops.forEach(eleTrigger => {
        let eleTargetId = eleTrigger.getAttribute('is-drop');
        if (eleTargetId && !eleTrigger.dataset.target) {
            eleTrigger.dataset.target = eleTargetId;
        }
        // 基于data-target获取元素
        eleTargetId = eleTrigger.dataset.target;
        let eleTarget = eleTargetId && document.getElementById(eleTargetId);
        if (eleTarget) {
            eleTrigger['ui-drop'] = new Drop(eleTrigger, eleTarget);
        }
    });
};

/**
 * 初始化并监听页面包含is-drop属性的DOM节点变化
 */
const autoInitAndWatchingIsDropAttr = () => {
    // 先实例化已有is-drop属性的DOM节点，再监听后续的节点变化
    initAllIsDropAttrAction();

    const observer = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                if (!eleAdd.tagName) {
                    return;
                }
                if (eleAdd.hasAttribute('is-drop')) {
                    initAllIsDropAttrAction([eleAdd]);
                } else {
                    initAllIsDropAttrAction(eleAdd.querySelectorAll('[is-drop]'));
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
    autoInitAndWatchingIsDropAttr();
} else {
    window.addEventListener('DOMContentLoaded', autoInitAndWatchingIsDropAttr);
}

/**/export default Drop;
