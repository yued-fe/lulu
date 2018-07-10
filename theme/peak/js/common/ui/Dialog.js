/**
 * @Dialog.js
 * @author zhangxinxu
 * @version
 * Created: 15-06-18
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Dialog = factory();
    }
}(this, function (require) {
    // require
    if (typeof require == 'function') {
        require('common/ui/Loading');
    }

    /**
     * 弹框组件
     * IE9+基于HTML5 <dialog>元素创建
     * 本透明遮罩层和弹框在一个元素内
     * @example
     * var myDialog = new Dialog(options);
     * $(button).click(function() {
           myDialog.remove();
       });
     */

    // 类名前缀
    var prefixGlobal = 'ui-';
    var prefixDialog = 'ui-dialog-';
    var joiner = '-';

    // 关闭SVG
    var svg = window.addEventListener ? '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>' : '';

    // Is it webkit
    var isWebkit = 'WebkitAppearance' in document.documentElement.style || typeof document.webkitHidden != 'undefined';

    // jquery语法
    $.dialog = function (options) {
        return new Dialog(options);
    };

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
            // 不同类别的默认按钮
            buttons: [],
            // 弹框显示、隐藏、移除的回调
            onShow: $.noop,
            onHide: $.noop,
            onRemove: $.noop
        };
        // 最终参数
        var params = $.extend({}, defaults, options || {});

        var el = {};
        this.el = el;
        // 存储一些参数
        this.width = params.width;
        this.callback = {
            show: params.onShow,
            hide: params.onHide,
            remove: params.onRemove
        };
        // 各个元素创建
        // 容器-含半透明遮罩背景
        el.container = window.addEventListener ? $('<dialog class="' + prefixDialog + 'container"></dialog>') : $('<div class="' + prefixDialog + 'container"></div>');

        // IE10+增加CSS3动画支持
        if (history.pushState) {
            el.container.get(0).addEventListener(isWebkit ? 'webkitAnimationEnd' : 'animationend', function(event) {
                if (event.target.tagName.toLowerCase() == 'dialog') {
                    this.classList.remove(prefixDialog + 'animation');
                }
            });
        }

        // 弹框主体
        el.dialog = $('<div class="' + prefixGlobal + 'dialog"></div>').css('width', params.width).attr({
            tabindex: '-1',
            role: 'dialog'
        });
        // 标题
        el.title = $('<div class="' + prefixDialog + 'title" role="heading"></div>').html(params.title);
        // 关闭按钮
        var idClose = ('id_' + Math.random()).replace('0.', '');
        el.close = $('<a href="javascript:" class="' + prefixDialog + 'close ESC"></a>').attr({
            role: 'button',
            'aria-label': '关闭',
            id: idClose,
            'data-target': idClose
        }).html(svg).click($.proxy(function(event) {
            event.preventDefault();
            // 有其他可ESC元素存在时候，弹框不关闭
            var activeElement = document.activeElement;
            var attrActiveElement = activeElement.getAttribute('data-target');
            var targetElement = attrActiveElement && document.getElementById(attrActiveElement);

            if (window.isKeyEvent && targetElement && activeElement != el.close[0] && document.querySelector('a[data-target="' + attrActiveElement + '"],input[data-target="' + attrActiveElement + '"]') && targetElement.clientWidth > 0) {
                return;
            }
            // 关闭弹框
            this[this.closeMode]();
        }, this));
        // 主体
        var content = params.content;
        // content可以是函数
        if ($.isFunction(content)) {
            content = content();
        }

        if (!content.size) {
            this.closeMode = 'remove';
        } else {
            this.closeMode = 'hide';
        }

        el.body = $('<div class="' + prefixDialog + 'body"></div>')[content.size ? 'append' : 'html'](content);
        // 底部
        el.footer = $('<div class="' + prefixDialog + 'footer"></div>');
        // 按钮
        this.button(params.buttons);

        // 组装
        el.container.append(el.dialog.append(el.close).append(el.title).append(el.body).append(el.footer));

        // IE7 额外辅助元素
        if (!document.querySelector) {
            el.container.append('<i class="' + prefixDialog + 'after"></i>');
        }

        // zIndex动态计算
        // 所有dialog的前面
        var dialog = $('.' + prefixDialog + 'container');
        if (dialog.length) {
            // 页面前置
            dialog.eq(0).before(el.container.css({
                // 动态计算zIndex值
                zIndex: dialog.eq(0).css('z-index') * 1 + 1
            }));
        } else {
            // 页面后入
            (params.container || $(document.body)).append(el.container);
        }

        this.display = false;

        if (params.content) {
            this.show();
        }

        return this;
    };

    /**
     * 弹框按钮元素
     * @param  {Array} data 数组，数组项为弹框按钮相关的数据对象
     * @return {Object}     返回当前实例对象
     */
    Dialog.prototype.button = function(data) {
        var el = this.el;
        var dialog = this;
        // 先清空弹框的footer
        el.footer.empty();
        // 遍历按钮数据生成按钮
        $.each(data, function(i, btn) {
            // 避免btn为null等值报错
            btn = btn || {};

            // 按钮的默认参数
            var type = i ? (btn.type || '') : (btn.type || 'primary');
            var value = i ? (btn.value || '取消') : (btn.value || '确定');

            // 事件处理，如果直接function类型，则认为是点击方法
            var events = btn.events || {
                click: function() {
                    dialog[dialog.closeMode]();
                }
            };

            if ($.isFunction(events)) {
                events = {
                    click: events
                };
            }

            // 按钮的类名值
            var cl = prefixGlobal + 'button';
            if (type) cl = cl + ' ' + cl + joiner + type;

            if (!btn['for']) {
                el['button' + i] = $('<a href="javascript:" class="' + cl + '" role="button">' + value + '</a>');
            } else {
                el['button' + i] = $('<label for="' + btn['for'] + '" class="' + cl + '" role="button">' + value + '</label>');
            }

            $.each(events, function (eventType, fn) {
                el['button' + i].bind(eventType, {
                    dialog: dialog
                }, fn);

                el['button' + i].on('focus', function () {
                    $(this).css('outline', window.isKeyEvent ? '' : 'none');
                });
            });

            el.footer.append(el['button' + i]);
        });

        return dialog;
    },

    /**
     * loading弹框，通常用在ajax请求弹框数据之前使用
     * loading结束后可以直接调用弹框实例的open()方法显示
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.loading = function () {
        if (!$().loading) {
            window.console && window.console.error('need Loading.js');
            return dialog;
        }

        var el = this.el;
        var dialog = this;

        if (el) {
            el.container.attr('class', [prefixDialog + 'container', prefixDialog + 'loading'].join(' '));
            el.body.loading();
            dialog.show();
        }

        return dialog;
    };

    /**
     * loading结束调用，主要包含内容展开的动画交互效果
     * @param  {number|0|false} time 参见Loading.js中的time参数
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.unloading = function (time) {
        if (!$().unloading) {
            window.console && window.console.error('need Loading.js');
            return dialog;
        }

        var el = this.el;
        var dialog = this;
        if (el) {
            el.container.removeClass(prefixDialog + 'loading');
            el.body.unloading(time);
        }

        return dialog;
    };

    /**
     * 打开类型弹框的底层方法
     * @param  {String} html    弹框字符内容
     * @param  {Object} options 可选参数，这里只支持标题和按钮的自定义
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.open = function (html, options) {
        var el = this.el;
        var dialog = this;
        // 默认参数
        var defaults = {
            title: '',
            buttons: []
        };
        // 最终参数
        var params = $.extend({}, defaults, options || {});
        // 替换当前弹框的内容，包括按钮等
        if (el && html) {
            el.container.attr('class', [prefixDialog + 'container'].join(' '));
            el.title.html(params.title);
            el.body.html(html);
            dialog.button(params.buttons).show();
        }

        return dialog;
    };

    /**
     * alert类型的弹框，默认仅一个“确定”按钮
     * @param  {String} html    提示文字或者提示HTML片段
     * @param  {Object} options 提示可选参数
     * @return {Object}         返回当前实例对象
     */
    Dialog.prototype.alert = function (html, options) {
        var el = this.el;
        var dialog = this;
        // alert框的默认参数
        var defaults = {
            title: '',
            // 类型, 'remind', 'success', 'warning', 或者任意 'custom'
            type: 'remind',
            buttons: [{}]
        };
        // 最终参数
        var params = $.extend({}, defaults, options || {});

        if (!params.buttons[0].type && params.type != 'remind') {
            params.buttons[0].type = params.type;
        }

        // 替换当前弹框的内容，包括按钮等
        if (el && html) {
            el.container.attr('class', [prefixDialog + 'container', prefixDialog + 'alert'].join(' '));
            el.dialog.width('auto').attr({
                role: 'alertdialog'
            });
            el.title.html(params.title);
            // 如果是纯文本
            if (/<[\w\W]+>/.test(html) == false) {
                html = '<p>' + html + '</p>';
            }

            el.body.html('<div class="' + prefixDialog + params.type + ' ' + prefixDialog + 'alert">' + html + '</div>');
            this.button(params.buttons).show();

            if (el.button0) {
                el.button0.focus();
            }
        }

        return dialog;
    };

    /**
     * confirm类型的弹框，默认有一个“确定”和一个“取消”按钮
     * @param  {String} html    提示文字或者提示HTML片段
     * @param  {Object} options 提示可选参数
     * @return {Object}         返回当前实例对象
     */
    Dialog.prototype.confirm = function (html, options) {
        var el = this.el;
        var dialog = this;
        // confirm框的默认参数
        var defaults = {
            title: '',
            type: 'warning',
            buttons: [{
                type: 'warning'
            }, {
                // 取消按钮使用默认配置
            }]
        };
        // 最终参数
        var params = $.extend({}, defaults, options || {});

        // warning类型的按钮可缺省
        if (params.buttons.length && !params.buttons[0].type) {
            params.buttons[0].type = 'warning';
        }

        // 替换当前弹框的内容，包括按钮等
        if (el && html) {
            el.container.attr('class', [prefixDialog + 'container', prefixDialog + 'confirm'].join(' '));
            el.dialog.width('auto');
            el.title.html(params.title);
            // 如果是纯文本
            if (/<[\w\W]+>/.test(html) == false) {
                html = '<p>' + html + '</p>';
            }

            el.body.html('<div class="' + prefixDialog + params.type + ' ' + prefixDialog + 'confirm">' + html + '</div>');
            this.button(params.buttons).show();

            if (el.button0) {
                el.button0.focus();
            }
        }

        return dialog;
    };

    /**
     * 直接ajax请求数据并弹框显示处理
     * @param  {Object} ajaxOptions ajax请求参数，同$.ajax()参数
     * @param  {Object} options     弹框相关的可选参数
     * @return {Object}             返回当前实例对象
     */
    Dialog.prototype.ajax = function (ajaxOptions, options) {
        var dialog = this;
        // ajax请求的一些默认参数
        // 类似timeout等参数这里缺省了
        // url直接注释了，就是jQuery的Ajax参数
        var ajaxDefaults = {
            // 必须参数，请求地址
            // url: '',
            dataType: 'JSON',
            timeout: 30000,
            error: function(xhr, status) {
                var msgSorry = '<h6>尊敬的用户，很抱歉您刚才的操作没有成功！</h6>';
                var msgReason = '';

                if (status == 'timeout') {
                    msgReason = '<p>主要是由于请求时间过长，数据没能成功加载，这一般是由于网速过慢导致，您可以稍后重试！</p>';
                } else if (status == 'parsererror') {
                    msgReason = '<p>原因是请求的数据含有不规范的内容。一般出现这样的问题是开发人员没有考虑周全，欢迎向我们反馈此问题！</p>';
                } else {
                    msgReason = '<p>一般是网络出现了异常，如断网；或是网络临时阻塞，您可以稍后重试！如依然反复出现此问题，欢迎向我们反馈！</p>';
                }
                dialog.alert(msgSorry + msgReason, {
                    type: 'warning'
                }).unloading();
            }
        };
        var ajaxParams = $.extend({}, ajaxDefaults, ajaxOptions || {});

        // ajax的url地址是必须参数
        if (!ajaxParams.url) {
            return this;
        }

        // 下面是弹框的一些默认参数
        var defaults = {
            title: '',
            content: function(data) {
                // 如果ajax的类型是'JSON', 此方法用来返回格式化的HTML数据
                // 如果是HTML, 默认返回HTML
                if (typeof data == 'string') {
                    return data;
                }

                return '看见我说明没使用\'options.content\'做JSON解析';
            },
            buttons: []
        };
        var params = $.extend({}, defaults, options || {});

        // 存储ajax时候的activeElement
        // var lastActiveElement = this.lastActiveElement;
        // ajax走起，记录当前时间戳
        var timer = new Date().getTime();
        // ajax success回调走合并
        var success = ajaxParams.success;
        ajaxParams.success = function (data) {
            dialog.open(params.content(data), params);
            // 移除菊花态
            // 如果时间戳小于100毫秒
            // 弹框直接打开，无动画
            if (new Date().getTime() - timer < 100) {
                dialog.unloading(0);
            } else {
                dialog.unloading();
            }

            // 这是用户设置的成功回调
            if ($.isFunction(success)) {
                success.apply(this, arguments);
            }
        };

        // 开始执行Ajax请求
        // 稍等……
        // 请求之前，我们还需要做一件事件
        // 开菊花
        dialog.loading();
        // ajax走起
        // 下面的定时器测试用
        // setTimeout(function() {
        $.ajax(ajaxParams);
        // }, 150);

        return dialog;
    };

    /**
     * 弹框出现与不出现，背景锁定同时页面不晃动的处理
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.scroll = function () {
        var containers = $('.' + prefixDialog + 'container');

        // 是否有显示的弹框
        var isDisplayed = false;
        containers.each(function() {
            if ($(this).css('display') == 'block') {
                isDisplayed = true;
            }
        });

        // 因为去掉了滚动条，所以宽度需要偏移，保证页面内容没有晃动
        if (isDisplayed) {
            var widthScrollbar = 17;
            if (this.display != true && typeof window.innerWidth == 'number') {
                widthScrollbar = window.innerWidth - document.documentElement.clientWidth;
            }
            document.documentElement.style.overflow = 'hidden';

            if (this.display != true) {
                $(document.body).css('border-right', widthScrollbar + 'px solid transparent');
            }
        } else {
            document.documentElement.style.overflow = '';
            $(document.body).css('border-right', '');
        }

        return this;
    };

    /**
     * 键盘可访问的细节处理
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.tabindex = function () {
        var dialog = this.el.dialog;
        var lastActiveElement = this.lastActiveElement;

        if (this.display == true) {
            var activeElement = document.activeElement;
            if (dialog[0] !== activeElement) {
                this.lastActiveElement = activeElement;
            }

            // 键盘索引起始位置变为在弹框元素上
            if (dialog) {
                dialog.focus();
            }
        } else if (lastActiveElement && lastActiveElement.tagName.toLowerCase() != 'body') {
            // 键盘焦点元素还原
            lastActiveElement.focus();
            lastActiveElement.blur();
            this.lastActiveElement = null;
        }

        return dialog;
    };

    /**
     * 弹框显示方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.show = function () {
        var container = this.el && this.el.container;
        if (container) {
            // 面板显示
            container.css('display', 'block');
            if (this.display != true) {
                container.addClass(prefixDialog + 'animation');
            }
            this.scroll();
            this.display = true;

            this.tabindex();

            if ($.isFunction(this.callback.show)) {
                this.callback.show.call(this, container);
            }
        }

        return this;
    };

    /**
     * 弹框隐藏方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.hide = function () {
        var container = this.el.container;

        if (container) {
            container.hide();
            this.scroll();
            this.display = false;
            // 键盘焦点元素还原
            this.tabindex();
            if ($.isFunction(this.callback.hide)) {
                this.callback.hide.call(this, container);
            }
        }

        return this;
    };

    /**
     * 弹框移除方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.remove = function () {
        var container = this.el && this.el.container;
        // var lastActiveElement = this.lastActiveElement;
        if (container) {
            container.remove();
            this.scroll();
            this.display = false;
            // 键盘焦点元素还原
            this.tabindex();
            if ($.isFunction(this.callback.remove)) {
                this.callback.remove.call(this, container);
            }
        }

        return this;
    };

    return Dialog;
}));
