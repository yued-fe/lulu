/**
 * @Dialog.js
 * @author  zhangxinxu
 * @version
 * @created 15-06-18
*  @edited  19-11-01
 */
/* global module */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Dialog = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 弹框组件
     * IE9+基于HTML5 <dialog>元素创建
     * 透明遮罩层和弹框在一个元素内
     * @example
     * var myDialog = new Dialog(options);
     * button.addEventListener('click', function() {
           myDialog.remove();
       });
     */

    // 类名前缀
    var DIALOG = 'dialog';

    var CL = {
        add: function () {
            return ['ui', DIALOG].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-' + DIALOG;
        }
    };

    // 关闭SVG
    var strCloseSvg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>';

    var isSupportDialog = false;

    /**
     * 弹框实例方法
     * @param {Object} options 纯对象，可选参数
     */
    var Dialog = function (options) {
        var defaults = {
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
            onShow: function () {},
            onHide: function () {},
            onRemove: function () {}
        };
        // 最终参数
        var objParams = Object.assign({}, defaults, options || {});


        // 各个元素创建
        // 容器-含半透明遮罩背景
        var eleContainer = document.createElement(DIALOG);
        eleContainer.classList.add(CL.add('container'));
        // 使该元素也可以被focus
        eleContainer.setAttribute('tabindex', '-1');

        // 是否支持原生弹框
        isSupportDialog = ('open' in eleContainer);

        // 不支持的浏览器设置无障碍访问信息
        if (isSupportDialog == false) {
            eleContainer.setAttribute('role', DIALOG);
        }

        // 弹框主体
        var eleDialog = document.createElement('div');
        eleDialog.classList.add(CL);
        // 设置尺寸和键盘访问特性
        // 如果宽度设置的是纯数值，则认为是px单位
        if (/^\d+$/.test(objParams.width)) {
            eleDialog.style.width = objParams.width + 'px';
        } else {
            eleDialog.style.width = objParams.width;
        }
        // 高度
        if (/^\d+$/.test(objParams.height)) {
            eleDialog.style.height = objParams.height + 'px';
        } else if (objParams.height == 'stretch') {
            eleDialog.classList.add(CL.add(objParams.height));
        } else if (objParams.height != 'auto') {
            eleDialog.style.height = objParams.height;
        }

        // 标题
        var eleTitle = document.createElement('h4');
        eleTitle.classList.add(CL.add('title'));
        eleTitle.innerHTML = objParams.title;

        // 关闭按钮
        // 随机id，ESC快捷键关闭弹框用到
        var strIdClose = ('lulu_' + Math.random()).replace('0.', '');
        // 关闭按钮元素创建
        var eleClose = document.createElement('button');
        eleClose.classList.add(CL.add('close'));
        eleClose.classList.add('ESC');
        // 无障碍支持
        eleClose.setAttribute('aria-label', '关闭');
        eleClose.id = strIdClose;
        eleClose.setAttribute('data-target', strIdClose);
        eleClose.innerHTML = strCloseSvg;

        // 主体内容
        var dataContent = objParams.content || '';
        // content可以是函数
        if (typeof dataContent == 'function') {
            dataContent = dataContent();
        }

        // 基于内容的数据类型，使用不同的默认的弹框关闭方式
        if (typeof dataContent == 'string') {
            this.closeMode = 'remove';
        } else {
            this.closeMode = 'hide';
        }

        // 主体内容元素
        var eleBody = document.createElement('div');
        eleBody.classList.add(CL.add('body'));

        if (this.closeMode == 'remove') {
            eleBody.innerHTML = dataContent;
        } else {
            eleBody.appendChild(dataContent);
        }

        // 底部元素
        var eleFooter = document.createElement('div');
        eleFooter.classList.add(CL.add('footer'));

        // 组装
        eleDialog.appendChild(eleClose);
        eleDialog.appendChild(eleTitle);
        eleDialog.appendChild(eleBody);
        eleDialog.appendChild(eleFooter);

        eleContainer.appendChild(eleDialog);

        // 插入的细节
        // 1. 插在所有dialog的前面
        // 2. 如果没有，则放在页面后面
        var eleAllDialog = document.querySelectorAll(DIALOG);

        if (eleAllDialog.length) {
            eleAllDialog[0].insertAdjacentElement('beforebegin', eleContainer);
        } else {
            (objParams.container || document.body).appendChild(eleContainer);
        }

        // 暴露元素
        this.element = {
            container: eleContainer,
            dialog: eleDialog,
            close: eleClose,
            title: eleTitle,
            body: eleBody,
            footer: eleFooter
        };

        // 暴露一些参数
        this.params = {
            title: objParams.title,
            width: objParams.width,
            buttons: objParams.buttons,
            content: dataContent
        };

        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide,
            remove: objParams.onRemove
        };

        this.display = false;

        // 按钮处理
        this.button();

        // 事件
        this.events();

        if (dataContent) {
            this.show();
        }

        return this;
    };


    /**
     * 弹框按钮需要单独处理
     * @return {[type]} [description]
     */
    Dialog.prototype.button = function () {
        var objParams = this.params;
        var objElement = this.element;

        objElement.footer.innerHTML = '';

        for (var keyElement in objElement) {
            if (/^button/.test(keyElement)) {
                delete objElement[keyElement];
            }
        }

        // 按钮元素创建
        objParams.buttons.forEach(function (objButton, numIndex) {
            // objButton可能是null等
            objButton = objButton || {};

            // 按钮类型和值的处理
            var strType = objButton.type;
            var strValue = objButton.value;

            if (strType == 'remind' || (!strType && numIndex == 0)) {
                strType = 'primary';
            }

            if (!strValue) {
                strValue = ['确定', '取消'][numIndex];
            }

            var eleButton = document.createElement('button');
            if (objButton['for']) {
                eleButton = document.createElement('label');
                eleButton.setAttribute('for', objButton['for']);
            }
            // 自定义的类名
            if (objButton.className) {
                eleButton.className = objButton.className;
            }
            // 按钮样式
            eleButton.classList.add(String(CL).replace(DIALOG, 'button'));
            if (strType) {
                eleButton.setAttribute('data-type', strType);
            }
            // 按钮内容
            eleButton.innerHTML = strValue;

            // 放在底部元素中
            objElement.footer.appendChild(eleButton);

            // 对外暴露
            objElement['button' + numIndex] = eleButton;
        });

        // 按钮事件
        // 底部确定取消按钮
        objParams.buttons.forEach(function (objButton, numIndex) {
            var eleButton = objElement['button' + numIndex];

            if (!eleButton || objButton['for']) {
                return;
            }

            var objEvents = objButton.events || {
                click: function () {
                    this[this.closeMode]();
                }.bind(this)
            };

            if (typeof objEvents == 'function') {
                objEvents = {
                    click: objEvents
                };
            }

            for (var strEventType in objEvents) {
                eleButton.addEventListener(strEventType, function (event) {
                    // 把实例对象传入
                    event.dialog = this;
                    // 事件执行
                    objEvents[strEventType](event);
                }.bind(this));
            }

            // 额外的focus事件支持
            eleButton.addEventListener('focus', function () {
                if (window.isKeyEvent) {
                    this.style.outline = '';
                } else {
                    this.style.outline = 'none';
                }
            });
        }.bind(this));
    };

    /**
     * 弹框相关事件处理
     * @return {[type]} [description]
     */
    Dialog.prototype.events = function () {
        var objElement = this.element;

        // IE10+增加CSS3动画支持
        var eleContainer = objElement.container;
        eleContainer.addEventListener('animationend', function (event) {
            if (event.target.tagName.toLowerCase() == DIALOG) {
                eleContainer.classList.remove(CL.add('animation'));
            }
        });
        if (isSupportDialog == true) {
            eleContainer.addEventListener('close', function () {
                // 滚动条处理
                this.scrollbar();
                // 显示状态切换
                this.display = false;
                // 键盘焦点元素还原
                this.tabindex();
            }.bind(this));
        }

        // 关闭弹框按钮
        var eleClose = objElement.close;
        if (eleClose) {
            eleClose.addEventListener('click', function () {
                // 有其他可ESC元素存在时候，弹框不关闭
                var eleActiveElement = document.activeElement;
                var attrActiveElement = eleActiveElement.getAttribute('data-target');
                var eleTargetElement = null;

                if (attrActiveElement) {
                    eleTargetElement = document.getElementById(attrActiveElement);
                }

                // 如果是其他元素的键盘访问
                if (window.isKeyEvent && eleTargetElement && eleActiveElement != eleClose && document.querySelector('a[data-target="' + attrActiveElement + '"],input[data-target="' + attrActiveElement + '"],button[data-target="' + attrActiveElement + '"]') && eleTargetElement.clientWidth > 0) {
                    return;
                }

                // 关闭弹框
                this[this.closeMode]();
            }.bind(this));
        }

        return this;
    };

    /**
     * 打开类型弹框的底层方法
     * @param  {String} content    弹框字符内容
     * @param  {Object} options 可选参数，这里只支持标题和按钮的自定义
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.open = function (content, options) {
        var objElement = this.element;

        // 默认参数
        // 只支持标题和按钮的自定义
        var defaults = {
            title: '',
            buttons: []
        };

        var dataContent = content || '';
        // content可以是函数
        if (typeof dataContent == 'function') {
            dataContent = dataContent();
        }

        // 基于内容的数据类型，使用不同的默认的弹框关闭方式
        if (typeof dataContent == 'string') {
            this.closeMode = 'remove';
        } else {
            this.closeMode = 'hide';
        }

        // 最终参数
        this.params = Object.assign({}, defaults, options || {}, {
            content: dataContent
        });

        // 类名还原为初始
        objElement.container.className = CL.add('container');

        // 替换当前弹框的内容，包括按钮等
        if (this.closeMode == 'remove') {
            objElement.body.innerHTML = dataContent;
        } else {
            objElement.body.appendChild(dataContent);
        }
        objElement.title.innerHTML = this.params.title;
        // 按钮
        this.button();
        // 显示
        this.show();

        return this;
    };

    /**
     * loading弹框，通常用在ajax请求之前使用
     * loading结束后可以直接调用弹框实例的open()方法显示
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.loading = function () {
        var objElement = this.element;

        objElement.container.className = [CL.add('container'), CL.add('loading')].join(' ');
        objElement.body.innerHTML = '<ui-loading rows="10" size="3"></ui-loading>';

        this.show();

        return this;
    };

    /**
     * alert类型的弹框，默认仅一个“确定”按钮
     * @param  {String} content    提示文字或者提示HTML片段
     * @param  {Object} options 提示可选参数
     * @return {Object}         返回当前实例对象
     */
    Dialog.prototype.alert = function (content, options) {
        var objElement = this.element;

        if (!content) {
            return;
        }

        var strContent = content;

        // alert框的默认参数
        var defaults = {
            title: '',
            // 类型, 'remind', 'success', 'warning', danger', 或者任意 'custom'
            type: 'remind',
            buttons: [{}]
        };
        // 最终参数
        var objParams = Object.assign({}, defaults, options || {});

        if (objParams.type == 'error' || objParams.type == 'fail') {
            objParams.type = 'danger';
        }
        if (objParams.type == 'primary') {
            objParams.type = 'remind';
        }

        if (objParams.buttons.length && !objParams.buttons[0].type) {
            objParams.buttons[0].type = objParams.type;
            // 如果是自定义类型，则使用'primary'作为按钮类型
            if (/^remind|success|warning|danger$/.test(objParams.type) == false) {
                objParams.buttons[0].type = defaults.type;
            }
        }

        // 替换当前弹框的内容，包括按钮等
        objElement.container.className = [CL.add('container'), CL.add('container', 'alert')].join(' ');

        // 尺寸
        objElement.dialog.style.width = 'auto';

        objElement.title.innerHTML = objParams.title;
        // 如果是纯文本
        if (/<[\w\W]+>/.test(strContent) == false) {
            strContent = '<p>' + strContent + '</p>';
        }

        objElement.body.innerHTML = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('alert') + '">' + strContent + '</div>';

        this.params = {
            width: 'auto',
            title: objParams.title,
            buttons: objParams.buttons,
            content: strContent
        };

        this.button();

        this.show();

        if (objElement.button0) {
            objElement.button0.focus();
        }

        return this;
    };

    /**
     * confirm类型的弹框，默认有一个“确定”和一个“取消”按钮
     * @param  {String} content    提示文字或者提示HTML片段
     * @param  {Object} options 提示可选参数
     * @return {Object}         返回当前实例对象
     */
    Dialog.prototype.confirm = function (content, options) {
        var objElement = this.element;

        if (!content) {
            return;
        }

        var strContent = content;

        // confirm框的默认参数
        var defaults = {
            title: '',
            type: 'danger',
            buttons: [{}, {}]
        };
        // 最终参数
        var objParams = Object.assign({}, defaults, options || {});

        if (objParams.type == 'error' || objParams.type == 'fail') {
            objParams.type = 'danger';
        }
        if (objParams.type == 'primary') {
            objParams.type = 'remind';
        }

        // danger类型的按钮可缺省
        if (objParams.buttons.length && !objParams.buttons[0].type) {
            objParams.buttons[0].type = objParams.type;
            // 如果是自定义类型，则使用'primary'作为按钮类型
            if (/^remind|success|warning|danger$/.test(objParams.type) == false) {
                objParams.buttons[0].type = defaults.type;
            }
        }

        // 替换当前弹框的内容，包括按钮等
        objElement.container.className = [CL.add('container'), CL.add('container', 'confirm')].join(' ');

        // 尺寸
        objElement.dialog.style.width = 'auto';

        objElement.title.innerHTML = objParams.title;
        // 如果是纯文本
        if (/<[\w\W]+>/.test(strContent) == false) {
            strContent = '<p>' + strContent + '</p>';
        }

        objElement.body.innerHTML = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('confirm') + '">' + strContent + '</div>';

        this.params = {
            width: 'auto',
            title: objParams.title,
            buttons: objParams.buttons,
            content: strContent
        };

        this.button();

        this.show();

        if (objElement.button0) {
            objElement.button0.focus();
        }


        return this;
    };

    /**
     * 弹框出现与不出现，背景锁定同时页面不晃动的处理
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.scrollbar = function () {
        var eleAllDialog = document.querySelectorAll(DIALOG);

        // 是否有显示的弹框
        var isDisplayed = [].slice.call(eleAllDialog).some(function (eleDialog) {
            return window.getComputedStyle(eleDialog).display != 'none';
        });

        // 因为去掉了滚动条，所以宽度需要偏移，保证页面内容没有晃动
        if (isDisplayed) {
            var widthScrollbar = 17;
            if (this.display != true) {
                widthScrollbar = window.innerWidth - document.documentElement.clientWidth;
            }
            // 所有PC浏览器都滚动锁定
            document.documentElement.style.overflow = 'hidden';

            if (this.display != true) {
                document.body.style.borderRight = widthScrollbar + 'px solid transparent';
            }
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.borderRight = '';
        }

        return this;
    };

    /**
     * 键盘可访问的细节处理
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.tabindex = function () {
        var eleDialog = this.element.dialog;
        var eleLastActiveElement = this.lastActiveElement;

        if (this.display == true) {
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
    };

    /**
     * 弹框元素zIndex实时最大化
     * @return {[type]} [description]
     */
    Dialog.prototype.zIndex = function () {
        var eleContainer = this.element.container;
        // 返回eleTarget才是的样式计算对象
        var objStyleTarget = window.getComputedStyle(eleContainer);
        // 此时元素的层级
        var numZIndexTarget = objStyleTarget.zIndex;
        // 用来对比的层级，也是最小层级
        var numZIndexNew = 19;

        // 只对<body>子元素进行层级最大化计算处理
        document.body.childNodes.forEach(function (eleChild) {
            if (eleChild.nodeType != 1) {
                return;
            }

            var objStyleChild = window.getComputedStyle(eleChild);

            var numZIndexChild = objStyleChild.zIndex * 1;

            if (numZIndexChild && eleContainer != eleChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew != numZIndexTarget) {
            eleContainer.style.zIndex = numZIndexNew;
        }
    };

    /**
     * 弹框显示方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.show = function () {
        var eleContainer = this.element.container;
        // 面板显示
        if (isSupportDialog) {
            if (!eleContainer.open) {
                eleContainer.show();
            }
        } else {
            eleContainer.setAttribute('open', 'open');
            // 层级最大
            this.zIndex();
        }

        if (this.display != true) {
            eleContainer.classList.add(CL.add('animation'));
        }
        this.scrollbar();
        this.display = true;

        this.tabindex();

        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this, eleContainer);
        }

        return this;
    };

    /**
     * 弹框隐藏方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.hide = function () {
        var eleContainer = this.element.container;

        if (isSupportDialog) {
            eleContainer.close();
        } else {
            eleContainer.removeAttribute('open');
        }

        // 滚动条处理
        this.scrollbar();
        // 显示状态切换
        this.display = false;
        // 键盘焦点元素还原
        this.tabindex();

        if (typeof this.callback.hide == 'function') {
            this.callback.hide.call(this, eleContainer);
        }

        return this;
    };

    /**
     * 弹框移除方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.remove = function () {
        var eleContainer = this.element.container;

        eleContainer.remove();
        // 滚动条处理
        this.scrollbar();
        // 显示状态切换
        this.display = false;
        // 键盘焦点元素还原
        this.tabindex();

        if (typeof this.callback.remove == 'function') {
            this.callback.remove.call(this, eleContainer);
        }

        return this;
    };

    return Dialog;
}));
