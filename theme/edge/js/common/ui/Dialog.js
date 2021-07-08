/**
 * @Dialog.js
 * @author  zhangxinxu
 * @version
 * @created 15-06-18
 * @edited  19-11-01
 * @edited  20-06-26 @ziven27
 * @edited  20-12-01 by zhangxinxu method extends from <dialog>
 */

const Dialog = (() => {

    // 类名前缀
    const DIALOG = 'dialog';

    // 处理类名
    const CL = {
        add: (...arg) => `ui-${DIALOG}-${arg.join('-')}`,
        toString: (value) => `ui-${value || DIALOG}`
    };

    /**
   * 弹框实例方法
   * @param {Object} options 纯对象，可选参数
   */
    class Component {
        constructor (options = {}) {
            // 最终参数
            const objParams = {
                title: '',
                // 不同类别的内容类型
                content: '',
                // 弹框的宽度
                width: 'auto',
                // 弹框高度
                height: 'auto',
                // 不同类别的默认按钮
                buttons: [],
                // 弹框显示、隐藏、移除的回调
                onShow: function () {
                },
                onHide: function () {
                },
                onRemove: function () {
                },
                ...options
            };

            // 各个元素创建
            // 容器-含半透明遮罩背景
            const dialog = document.createElement(DIALOG);
            dialog.setAttribute('is', 'ui-dialog');

            // MutationObserver是一个异步的过程，因此
            // 元素样式的设置在'DOMContentLoaded'事件之后完成
            dialog.addEventListener('DOMContentLoaded', () => {
                // 务必有传参
                // 否则不会对初始元素进行处理
                if (JSON.stringify(options) != '"{}"') {
                    // 改变参数，会自动触发DOM元素内容的变化
                    dialog.setParams({
                        title: objParams.title,
                        width: objParams.width,
                        height: objParams.height,
                        content: objParams.content,
                        buttons: objParams.buttons
                    });

                    // 回调处理
                    if (typeof options.onShow == 'function') {
                        dialog.addEventListener('show', function (event) {
                            options.onShow.call(dialog, event);
                        });
                    }
                    if (typeof options.onHide == 'function') {
                        dialog.addEventListener('hide', function (event) {
                            options.onHide.call(dialog, event);
                        });
                    }
                    if (typeof options.onRemove == 'function') {
                        dialog.addEventListener('remove', function (event) {
                            options.onRemove.call(dialog, event);
                        });
                    }
                }

                // 显示
                dialog.show();
            });

            // 插入的细节
            // 1. 插在所有dialog的前面
            // 2. 如果没有，则放在页面后面
            const eleExistDialog = document.querySelector('body > ' +  DIALOG);

            if (eleExistDialog) {
                eleExistDialog.insertAdjacentElement('beforebegin', dialog);
            } else {
                document.body.appendChild(dialog);
            }

            // 注册当前<dialog>元素
            // 为了可以立即使用alert()、confirm()方法，
            // 在这里提前注册了
            funDialogRegist(dialog);

            return dialog;
        }
    }

    // 对不支持<dialog>元素的浏览器进行polyfill
    // 仅polyfill部分主要功能
    let DialogPolyfill = function (dialog) {
        this.element = {
            dialog: dialog
        };
        // aria支持
        if (!dialog.hasAttribute('role')) {
            dialog.setAttribute('role', 'dialog');
        }
        // 内置方法
        dialog.show = this.show.bind(this);
        dialog.showModal = this.showModal.bind(this);
        dialog.close = this.close.bind(this);
        // 自定义方法
        dialog.zIndex = this.zIndex.bind(this);

        Object.defineProperty(dialog, 'open', {
            set: this.setOpen.bind(this),
            get: dialog.hasAttribute.bind(dialog, 'open')
        });
    };

    DialogPolyfill.prototype = {
        get dialog () {
            return this.element.dialog;
        },
        show () {
            this.setOpen(true);
            // 层级最高
            this.zIndex();
        },
        showModal () {
            this.setOpen(true);
        },
        close () {
            this.setOpen(false);
            // 原生<dialog>就有close事件
            this.dialog.dispatchEvent(new CustomEvent('close', {
                bubbles: false,
                cancelable: false
            }));
        },
        setOpen (value) {
            if (value) {
                this.dialog.setAttribute('open', '');
            } else {
                this.dialog.removeAttribute('open');
            }
        },

        /**
         * 弹框元素zIndex实时最大化
         * 原生dialog无需此能力
         * @return {[type]} [description]
         */
        zIndex () {
            var dialog = this.dialog;
            // 返回eleTarget才是的样式计算对象
            const objStyleTarget = window.getComputedStyle(dialog);
            // 此时元素的层级
            const numZIndexTarget = objStyleTarget.zIndex;
            // 用来对比的层级，也是最小层级
            let numZIndexNew = 19;

            // 只对<body>子元素进行层级最大化计算处理
            document.body.childNodes.forEach(function (eleChild) {
                if (eleChild.nodeType !== 1) {
                    return;
                }

                const objStyleChild = window.getComputedStyle(eleChild);

                const numZIndexChild = objStyleChild.zIndex * 1;

                if (numZIndexChild && (dialog !== eleChild && objStyleChild.display !== 'none')) {
                    numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
                }
            });

            if (numZIndexNew !== numZIndexTarget) {
                dialog.style.zIndex = numZIndexNew;
            }
        }
    };

    // 对弹框元素进行方法注册
    let funDialogRegist = function (dialog) {
        if (dialog.hide && dialog.button) {
            // 已经注册过
            return;
        }
        if ('open' in document.createElement('dialog') == false) {
            new DialogPolyfill(dialog);
        }

        // 自定义的方法支持
        // 全新的remove和show方法
        // 新增hide, alert, confirm等方法
        if (dialog.getAttribute('is') == 'ui-dialog') {
            Object.defineProperties(dialog, {
                setParams: {
                    value: function (options) {
                        Object.assign(this.params, options || {});

                        return this.params;
                    }
                },

                /**
                 * 弹框按钮的处理
                 * @returns {Object}  返回当前<dialog>元素
                 */
                button: {
                    value: function () {
                        const objParams = this.params;
                        const objElement = this.element;

                        // 清除之前的按钮内容和数据
                        objElement.footer.innerHTML = '';
                        // 元素数据清除
                        for (const keyElement in objElement) {
                            if (/^button/.test(keyElement)) {
                                delete objElement[keyElement];
                            }
                        }

                        // 按钮元素创建
                        objParams.buttons.forEach(function (objButton, numIndex) {
                            // objButton可能是null等
                            objButton = objButton || {};

                            // 按钮类型和值的处理
                            let strType = objButton.type;
                            let strValue = objButton.value;

                            if (strType === 'remind' || (!strType && numIndex === 0)) {
                                strType = 'primary';
                            }

                            if (!strValue) {
                                strValue = ['确定', '取消'][numIndex];
                            }

                            let eleButton = document.createElement('button');
                            if (objButton['for']) {
                                eleButton = document.createElement('label');
                                eleButton.setAttribute('for', objButton['for']);
                            } else if (objButton.form) {
                                eleButton.setAttribute('form', objButton.form);
                                eleButton.type = 'submit';
                            }
                            // 自定义的类名
                            if (objButton.className) {
                                eleButton.className = objButton.className;
                            }
                            // 按钮样式
                            eleButton.classList.add(CL.toString('button'));
                            if (strType) {
                                eleButton.setAttribute('data-type', strType);
                            }
                            // 按钮是否禁用
                            eleButton.disabled = Boolean(objButton.disabled);
                            // 按钮内容
                            eleButton.innerHTML = strValue;

                            // 放在底部元素中
                            objElement.footer.appendChild(eleButton);

                            // 对外暴露
                            objElement['button' + numIndex] = eleButton;
                        });

                        // 按钮事件
                        // 底部确定取消按钮
                        objParams.buttons.forEach((objButton, numIndex) => {
                            // objButton可能是null等
                            objButton = objButton || {};

                            const eleButton = objElement['button' + numIndex];

                            if (!eleButton || objButton['for'] || objButton.form) {
                                return;
                            }

                            let objEvents = objButton.events || {
                                click: () => {
                                    this[this.closeMode]();
                                }
                            };

                            if (typeof objEvents === 'function') {
                                objEvents = {
                                    click: objEvents
                                };
                            }

                            for (const strEventType in objEvents) {
                                eleButton.addEventListener(strEventType, (event) => {
                                    // 把实例对象传入
                                    event.dialog = this;
                                    // 事件执行
                                    objEvents[strEventType](event);
                                });
                            }

                            // 额外的focus事件支持
                            eleButton.addEventListener('focus', function () {
                                if (window.isKeyEvent) {
                                    this.style.outline = '';
                                } else {
                                    this.style.outline = 'none';
                                }
                            });
                        });

                        return this;
                    }
                },

                /**
                 * 固定结构元素的事件绑定
                 * @returns {Object}    返回当前<dialog>元素对象
                 */
                events: {
                    value: function () {
                        const objElement = this.element;

                        this.addEventListener('animationend', function (event) {
                            if (event.target.tagName.toLowerCase() === DIALOG) {
                                this.classList.remove(CL.add('animation'));
                            }
                        });

                        // 关闭弹框按钮
                        const eleClose = objElement.close;
                        if (eleClose) {
                            eleClose.addEventListener('click', () => {
                                // 有其他可ESC元素存在时候，弹框不关闭
                                const eleActiveElement = document.activeElement;
                                const attrActiveElement = eleActiveElement.getAttribute('data-target');
                                let eleTargetElement = null;

                                if (attrActiveElement) {
                                    eleTargetElement = document.getElementById(attrActiveElement);
                                }

                                // 如果是其他元素的键盘访问
                                if (window.isKeyEvent && eleTargetElement && eleActiveElement !== eleClose && document.querySelector('a[data-target="' + attrActiveElement + '"],input[data-target="' + attrActiveElement + '"],button[data-target="' + attrActiveElement + '"]') && eleTargetElement.clientWidth > 0) {
                                    return;
                                }

                                // 关闭弹框
                                this[this.closeMode]();
                            });
                        }

                        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

                        return this;
                    }
                },

                /**
                 * alert类型的弹框，默认仅一个“确定”按钮
                 * @param  {String} content    提示文字或者提示HTML片段
                 * @param  {Object} options    提示可选参数
                 * @return {Object}            返回当前<dialog>元素对象
                 */
                alert: {
                    value: function (content, options) {
                        const objElement = this.element;

                        if (!content) {
                            return;
                        }

                        let strContent = content;

                        // alert框的默认参数
                        const defaults = {
                            title: '',
                            // 类型, 'remind', 'success', 'warning', danger', 或者任意 'custom'
                            type: 'remind',
                            buttons: [{}]
                        };
                        // 最终参数
                        const objParams = {
                            ...defaults,
                            ...options
                        };

                        if (objParams.type === 'error' || objParams.type === 'fail') {
                            objParams.type = 'danger';
                        } else if (objParams.type === 'primary') {
                            objParams.type = 'remind';
                        }

                        if (objParams.buttons.length && !objParams.buttons[0].type) {
                            objParams.buttons[0].type = objParams.type;
                            // 如果是自定义类型，则使用'primary'作为按钮类型
                            if (/^remind|success|warning|danger$/.test(objParams.type) === false) {
                                objParams.buttons[0].type = defaults.type;
                            }
                        }

                        let nodes = new DOMParser().parseFromString(strContent, 'text/html').body.childNodes;

                        if (nodes.length == 1) {
                            // 如果是纯文本
                            if (nodes[0].nodeType === 3) {
                                strContent = '<p class="' + CL.add('wrap') + '">' + strContent + '</p>';
                            }
                        } else {
                            strContent = '<div class="' + CL.add('wrap') + '">' + strContent + '</div>';
                        }

                        // 主体内容更新
                        strContent = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('alert') + '">' + strContent + '</div>';

                        this.setParams({
                            width: 'auto',
                            title: objParams.title,
                            buttons: objParams.buttons,
                            content: strContent
                        });

                        this.show();

                        if (objElement.button0) {
                            objElement.button0.focus();
                        }

                        return this;
                    }
                },

                /**
                 * confirm类型的弹框，默认有一个“确定”和一个“取消”按钮
                 * @param  {String} content    提示文字或者提示HTML片段
                 * @param  {Object} options    提示可选参数
                 * @return {Object}            返回当前<dialog>元素对象
                 */
                confirm: {
                    value: function (content, options) {
                        const objElement = this.element;

                        if (!content) {
                            return;
                        }

                        let strContent = content;

                        // confirm框的默认参数
                        const defaults = {
                            title: '',
                            type: 'danger',
                            buttons: [{}, {}]
                        };

                        // 最终参数
                        const objParams = {
                            ...defaults,
                            ...options
                        };

                        if (objParams.type === 'error' || objParams.type === 'fail') {
                            objParams.type = 'danger';
                        }
                        if (objParams.type === 'primary') {
                            objParams.type = 'remind';
                        }

                        // danger类型的按钮可缺省
                        if (objParams.buttons.length && !objParams.buttons[0].type) {
                            objParams.buttons[0].type = objParams.type;
                            // 如果是自定义类型，则使用'primary'作为按钮类型
                            if (/^remind|success|warning|danger$/.test(objParams.type) === false) {
                                objParams.buttons[0].type = defaults.type;
                            }
                        }

                        let nodes = new DOMParser().parseFromString(strContent, 'text/html').body.childNodes;

                        if (nodes.length == 1) {
                            // 如果是纯文本
                            if (nodes[0].nodeType === 3) {
                                strContent = '<p class="' + CL.add('wrap') + '">' + strContent + '</p>';
                            }
                        } else {
                            strContent = '<div class="' + CL.add('wrap') + '">' + strContent + '</div>';
                        }

                        // 主体内容设置
                        strContent = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('confirm') + '">' + strContent + '</div>';

                        // 参数对外
                        this.setParams({
                            width: 'auto',
                            title: objParams.title,
                            buttons: objParams.buttons,
                            content: strContent
                        });

                        this.show();

                        if (objElement.button0) {
                            objElement.button0.focus();
                        }

                        return this;
                    }
                },

                /**
                 * loading弹框，通常用在ajax请求之前使用
                 * loading结束后可以直接调用弹框实例的open()方法显示
                 * @return {Object} 返回当前实例对象
                 */
                loading: {
                    value: function () {
                        const objElement = this.element;

                        this.params.content = '<ui-loading rows="10" size="3"></ui-loading>';
                        // 显示loading样式
                        objElement.dialog.classList.add(CL.add('loading'));

                        this.show();

                        return this;
                    }
                },

                /**
                 * 内容赋值
                 */
                content: {
                    get () {
                        return this.params.content;
                    },
                    set (content) {
                        // 让直接设置content时候可以和params.content数据保持一致
                        if (content != this.params.content) {
                            this.params.content = content;
                            return;
                        }

                        let eleBody = this.element.body;
                        let eleDialog = this.element.dialog;
                        // 去除可能的loading类名
                        eleDialog.classList.remove(CL.add('loading'));
                        // content可以是函数
                        if (typeof content == 'function') {
                            content = content();
                        } else if (typeof content == 'string' && /^#?\w+(?:[-_]\w+)*$/i.test(content)) {
                            // 如果是字符串
                            // 如果是选择器，仅支持ID选择器
                            let eleMatch = document.querySelector(content);
                            if (eleMatch) {
                                if (eleMatch.matches('textarea')) {
                                    content = eleMatch.value;
                                } else if (eleMatch.matches('script')) {
                                    content = eleMatch.innerHTML;
                                } else {
                                    content = eleMatch;
                                }
                            }
                        }

                        // 基于内容的数据类型，使用不同的默认的弹框关闭方式
                        this.closeMode = typeof content == 'string' ? 'remove' : 'hide';

                        // 是隐藏模式，则eleBody里面的内容保护出来
                        // 主要是使用content语法替换内容时候用到，这段代码一般不会执行到
                        if (this.closeMode == 'hide' && eleBody.innerHTML) {
                            let eleProtect = document.createElement('div');
                            eleProtect.setAttribute('hidden', '');
                            // 遍历并转移
                            eleBody.childNodes.forEach(node => {
                                eleProtect.appendChild(node);
                            });
                            // 保护到页面中
                            document.body.appendChild(eleProtect);
                        }

                        // 清空主内容区域的内容
                        eleBody.innerHTML = '';

                        if (this.closeMode == 'remove') {
                            eleBody.innerHTML = content;
                        } else {
                            let eleContentParent = content.parentElement;
                            let isParentHidden = eleContentParent && eleContentParent.matches('div[hidden]');
                            // 弹框中显示
                            eleBody.appendChild(content);
                            // 如果原父级是隐藏div，该div删除
                            if (isParentHidden && eleContentParent.innerHTML.trim() === '') {
                                eleContentParent.remove();
                            }
                            // 如果content是隐藏的则显示
                            if (content.nodeType === 1 && getComputedStyle(content).display == 'none') {
                                content.removeAttribute('hidden');
                                content.style.display = '';
                                // 如果此时元素的display状态还是none，则设置为浏览器初始display值
                                if (getComputedStyle(content).display == 'none') {
                                    content.style.display = 'revert';
                                }
                            }
                        }
                    }
                },

                /**
                 * 背景滚动锁定带来的
                 * @returns    当前<dialog>元素
                 */
                scrollbar: {
                    value: function () {
                        const eleAllDialog = document.querySelectorAll('dialog[is="ui-dialog"]');

                        // 是否有显示的弹框
                        const isDisplayed = [].slice.call(eleAllDialog).some(function (eleDialog) {
                            return window.getComputedStyle(eleDialog).display !== 'none';
                        });

                        document.documentElement.style.overflow = '';
                        document.body.style.borderRight = '';

                        let widthScrollbar = window.innerWidth - document.documentElement.clientWidth;

                        // 因为去掉了滚动条，所以宽度需要偏移，保证页面内容没有晃动
                        if (isDisplayed) {
                            // 所有PC浏览器都滚动锁定
                            document.documentElement.style.overflow = 'hidden';
                            document.body.style.borderRight = widthScrollbar + 'px solid transparent';
                        }

                        return this;
                    }
                },

                /**
                 * 键盘访问与聚焦的细节设置
                 * @returns    当前<dialog>元素
                 */
                tabindex: {
                    value: function () {
                        var eleDialog = this.element.dialog;
                        var eleLastActiveElement = this.lastActiveElement;

                        if (this.open == true) {
                            var eleActiveElement = document.activeElement;
                            if (eleDialog != eleActiveElement) {
                                this.lastActiveElement = eleActiveElement;
                            }

                            // 键盘索引起始位置变为在弹框元素上
                            if (eleDialog) {
                                eleDialog.focus();
                            }
                        } else if (eleLastActiveElement && eleLastActiveElement.tagName.toLowerCase() != 'body') {
                            // 键盘焦点元素还原
                            eleLastActiveElement.focus();
                            eleLastActiveElement.blur();
                            this.lastActiveElement = null;
                        }

                        return this;
                    }
                },

                /**
                 * 弹框显示
                 * @returns    当前<dialog>元素
                 */
                show: {
                    value: function () {
                        if (this.open !== true) {
                            this.classList.add(CL.add('animation'));
                        }

                        // 弹框显示
                        this.open = true;

                        // 面板显示
                        if (this.zIndex) {
                            this.zIndex();
                        }

                        this.dispatchEvent(new CustomEvent('show', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                },

                /**
                 * 弹框隐藏
                 * @returns    当前<dialog>元素
                 */
                hide: {
                    value: function () {
                        this.close();

                        this.dispatchEvent(new CustomEvent('hide', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                },

                /**
                 * 弹框移除
                 * @returns    当前<dialog>元素
                 */
                remove: {
                    value: function () {
                        this.open = false;

                        this.parentElement.removeChild(this);

                        this.dispatchEvent(new CustomEvent('remove', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                }
            });

            // 暴露的参数
            // 并观察参数变化
            dialog.params = new Proxy(dialog.params || {}, {
                get (target, prop) {
                    return target[prop];
                },
                set (target, prop, value) {
                    if (!dialog.element) {
                        return false;
                    }
                    // 赋值
                    target[prop] = value;

                    // 拦截
                    if (prop == 'title' && dialog.element.title) {
                        dialog.element.title.innerHTML = value;
                    } else if (prop == 'content') {
                        dialog.content = value;
                    } else if (prop == 'buttons') {
                        dialog.button();
                    } else if (dialog.element.dialog && (prop == 'width' || prop == 'height')) {
                        let eleDialog = dialog.element.dialog;
                        eleDialog.classList.remove(CL.add('stretch'));
                        // 纯数值认为是px长度
                        if (value !== '' && Number(value) == value) {
                            eleDialog.style[prop] = value + 'px';
                        } else if (prop == 'height' && value == 'stretch') {
                            eleDialog.classList.add(CL.add(value));
                        } else {
                            if (value == 'auto') {
                                value = '';
                            }
                            eleDialog.style[prop] = value;
                        }
                    }

                    return true;
                }
            });

            // 弹框主要元素的创建
            // 1. 主体
            const eleDialog = document.createElement('div');
            eleDialog.classList.add(CL);
            // 使该元素也可以被focus
            eleDialog.setAttribute('tabindex', '-1');

            // 2. 标题
            const eleTitle = document.createElement('h4');
            eleTitle.classList.add(CL.add('title'));
            eleTitle.innerHTML = dialog.title;
            dialog.removeAttribute('title');

            // 3. 关闭按钮
            // 随机id，ESC快捷键关闭弹框用到
            const strIdClose = ('lulu_' + Math.random()).replace('0.', '');
            // 关闭按钮元素创建
            const eleClose = document.createElement('button');
            eleClose.textContent = '关闭';
            eleClose.classList.add(CL.add('close'), 'ESC');
            eleClose.id = strIdClose;
            // 无障碍支持
            eleClose.setAttribute('data-target', strIdClose);

            // 4. 主体内容元素
            const eleBody = document.createElement('div');
            eleBody.classList.add(CL.add('body'));

            // 5. 底部元素
            const eleFooter = document.createElement('div');
            eleFooter.classList.add(CL.add('footer'));

            // 暴露元素
            dialog.element = Object.assign(dialog.element || {}, {
                dialog: eleDialog,
                close: eleClose,
                title: eleTitle,
                body: eleBody,
                footer: eleFooter
            });

            // 下面是主体元素的创建
            // 如果默认弹框里面就有内容
            // 则内容认为是主体内容，记录下来
            let nodesOriginDialog = [...dialog.childNodes];

            // 原始节点放在eleBody主体内容元素中
            if (nodesOriginDialog.length) {
                nodesOriginDialog.forEach(node => {
                    eleBody.append(node);
                });
            }

            // 元素插入
            // 组装
            eleDialog.append(eleClose, eleTitle, eleBody, eleFooter);
            dialog.append(eleDialog);

            // 观察open属性变化
            var moDialogOpen = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(mutation => {
                    let eleDialog = mutation.target;
                    if (mutation.type == 'attributes') {
                        // 滚动条状态变化
                        eleDialog.scrollbar();
                        // 焦点变化
                        eleDialog.tabindex();
                    }
                });
            });
            moDialogOpen.observe(dialog, {
                attributes: true,
                attributeFilter: ['open']
            });

            // 默认模式是关闭
            dialog.closeMode = 'hide';
            // 事件
            dialog.events();
        }

        // 回调
        dialog.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-dialog'
            }
        }));
    };

    // 弹框观察并注册
    let funDialogInitAndWatching = function () {
        const elesDialog = document.querySelectorAll('dialog');
        elesDialog.forEach(item => {
            funDialogRegist(item);
        });
        // 观察Dialog元素载入页面
        var observerTips = new MutationObserver(function (mutationsList) {
            // 此时不检测DOM变化
            mutationsList.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (eleAdd) {
                    if (eleAdd.matches && eleAdd.matches('dialog')) {
                        funDialogRegist(eleAdd);
                    } else if (eleAdd.querySelector) {
                        eleAdd.querySelectorAll('dialog').forEach(item => {
                            funDialogRegist(item);
                        });
                    }
                });
            });
        });

        observerTips.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // 如果浏览器不支持<dialog>，则对出现在页面上的<dialog>元素进行注册
    if (document.readyState != 'loading') {
        funDialogInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funDialogInitAndWatching);
    }

    return Component;
})();


// 为了直接使用
window.Dialog = Dialog;

// 可以 import
export default Dialog;
