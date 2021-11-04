/**
 * @Form.js
 * @author zhangxinxu
 * @version
 * @created  16-03-01
 * @edited   19-12-02    ES5原生语法支持
 */

/* global module */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.LightTip = require('../ui/LightTip');
        global.Loading = require('../ui/Loading');
        global.Validate = require('../ui/Validate');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Form = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var LightTip = (this || self).LightTip;
    var Loading = (this || self).Loading;
    var Validate = (this || self).Validate;
    // require
    if (typeof require == 'function') {
        // 轻tips
        if (!LightTip) {
            LightTip = require('common/ui/LightTip');
        }
        // 加载
        if (!Loading) {
            Loading = require('common/ui/Loading');
        }
        // 验证
        if (!Validate) {
            Validate = require('common/ui/Validate');
        }
    } else if (!Validate || !LightTip || !Loading) {
        window.console.error('need Validate.js');

        if (!LightTip) {
            window.console.error('need LightTip.js');
        } else if (!Loading) {
            window.console.warn('need Loading.js');
        } else {
            window.console.error('need Validate.js');
        }

        return {};
    }

    /**
     * 表单解决方案组件
     * @使用示例
     *  new Form('#form', {}, {});
     */
    var DISABLED = 'disabled';

    // 表单
    var Form = function (element, optionCallback, optionValidate) {
        if (typeof element == 'string') {
            element = document.querySelector(element);
        }
        if (!element) {
            return this;
        }

        // 避免重复初始化
        if (element.data && element.data.form) {
            return element.data.form;
        }

        // optionCallback可以是对象也可以直接是成功回调
        /*
            optionCallback = {
                avoidSend: function () {},    // 验证成功之后，请求发送前的条件约束
                success: function () {},
                error: function () {},
                complete: function () {}
            };
        */
        optionCallback = optionCallback || function () {};
        if (typeof optionCallback == 'function') {
            optionCallback = {
                success: optionCallback
            };
        }

        optionValidate = optionValidate || {};

        // 表单元素
        var eleForm = element;
        // 通过submit按钮找到找到关联的我们肉眼所见的提交按钮
        var eleBtnSubmit = eleForm.querySelector('[type="submit"], [type="image"]');
        if (!eleBtnSubmit) {
            eleBtnSubmit = eleForm.querySelector('button:nth-of-last-type()');
        }

        if (!eleBtnSubmit) {
            return this;
        }

        // 下拉框的初始化
        if (window.autoInit === false) {
            // 下拉框
            eleForm.querySelectorAll('select').forEach(function (eleSelect) {
                if (eleSelect.refresh) {
                    eleSelect.refresh();
                }
            });
        }

        // 暴露的元素
        this.element = {
            form: eleForm,
            submit: eleBtnSubmit
        };

        // 回调方法们
        this.callback = optionCallback;

        // 绑定表单验证
        this.validate = new Validate(eleForm, function () {
            // 验证成功之后
            if (!optionCallback.avoidSend || !optionCallback.avoidSend.call(this, eleForm)) {
                this.ajax();
            }
        }.bind(this), optionValidate);

        if (!eleForm.data) {
            eleForm.data = {};
        }

        eleForm.data.form = this;

        return this;
    };

    /**
     * 表单提交的处理
     * @return {[type]} [description]
     */
    Form.prototype.ajax = function () {
        // 回调
        var optionCallback = this.callback;
        // 元素
        var eleForm = this.element.form;
        var eleButton = null;
        var eleSubmit = this.element.submit;

        // 我们肉眼所见的按钮，进行一些状态控制
        eleButton = eleSubmit.id && document.querySelector('label[for=' + eleSubmit.id + ']');
        if (!eleButton) {
            eleButton = eleSubmit;
        }
        this.element.button = eleButton;

        // 请求地址
        var strUrl = eleForm.action.split('#')[0] || location.href.split('#')[0];
        // 请求类型
        var strMethod = eleForm.method || 'POST';
        var strEnctype = eleForm.enctype;

        // IE9不支持cros跨域
        if (!history.pushState && new URL(strUrl).host != location.host) {
            new LightTip().error('当前浏览器不支持跨域数据请求。');
            return;
        }

        // 提交数据
        // 1. 菊花转起来
        eleButton.loading = true;
        // 2. 提交按钮禁用
        eleSubmit.setAttribute(DISABLED, DISABLED);

        // 3. 数据
        var objFormData = new FormData(eleForm);

        // 请求类型不同，数据地址也不一样
        var strSearchParams = new URLSearchParams(objFormData).toString();

        if (strMethod.toLowerCase() == 'get') {
            if (strUrl.split('?').length > 1) {
                strUrl = strUrl + '&' + strSearchParams;
            } else {
                strUrl = strUrl + '?' + strSearchParams;
            }
        }

        // 4. 请求走起来
        var xhr = new XMLHttpRequest();
        xhr.open(strMethod, strUrl);

        if (strEnctype) {
            xhr.setRequestHeader('Content-Type', strEnctype);
        }

        if (optionCallback.beforeSend) {
            optionCallback.beforeSend.call(this, xhr, objFormData);
        }

        // 请求结束
        xhr.onload = function () {
            var json = {};

            try {
                json = JSON.parse(xhr.responseText);

                if (json && (json.code == 0 || json.error == 0)) {
                    // 成功回调
                    if (optionCallback.success) {
                        optionCallback.success.call(this, json);
                    } else {
                        // 如果没有成功回调，组件自己提示成功
                        new LightTip().success(json.msg || '操作成功。');
                        // 重置
                        eleForm.reset();
                    }
                } else {
                    new LightTip().error((json && json.msg) || '返回数据格式不符合要求。');

                    // 失败回调
                    if (optionCallback.error) {
                        optionCallback.error.call(this, json);
                    }
                }
            } catch (event) {
                new LightTip().error(json.msg || '返回数据解析出错。');
                // 回调
                if (optionCallback.error) {
                    optionCallback.error.call(this, event);
                }
            }

            funLoadend(json);
        }.bind(this);

        // 请求错误
        xhr.onerror = function () {
            new LightTip().error('网络异常，刚才的操作没有成功，您可以稍后重试。');
            // 回调
            if (optionCallback.error) {
                optionCallback.error.apply(this, arguments);
            }

            funLoadend();
        }.bind(this);


        // 请求结束，无论成功还是失败
        // xhr.onloadend IE9不支持，因此这里使用
        // 其他方法代替
        var funLoadend = function () {
            // 菊花关闭
            eleButton.loading = false;
            // 表单恢复提交
            eleSubmit.removeAttribute(DISABLED);
            // 回调
            if (optionCallback.complete) {
                optionCallback.complete.apply(this, arguments);
            }
        };

        if (strEnctype && strEnctype.toLowerCase() === 'application/x-www-form-urlencoded') {
            xhr.send(strSearchParams);
        } else {
            xhr.send(objFormData);
        }
    };

    /**
     * 执行表单的提交
     * @return {Object} 返回当前实例对象
     */
    Form.prototype.submit = function () {
        this.element.form.dispatchEvent(new CustomEvent('submit'));

        return this;
    };

    // 对is-form属性观察
    var funAutoInitAndWatching = function () {
        // 目标选择器
        var strSelector = 'form[is-form]';

        var funSyncRefresh = function (nodes) {
            if (!nodes || !nodes.forEach) {
                return;
            }

            nodes.forEach(function (node) {
                if (node.matches && node.matches(strSelector)) {
                    node.dispatchEvent(new CustomEvent('connected'));
                }
            });
        };

        setTimeout(function () {
            funSyncRefresh(document.querySelectorAll(strSelector));
        }, 1);

        // 如果没有开启观察，不监听DOM变化
        if (window.watching === false) {
            return;
        }

        // DOM Insert自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (eleAdd) {
                        if (eleAdd.matches) {
                            if (eleAdd.matches(strSelector)) {
                                funSyncRefresh([eleAdd]);
                            } else if (eleAdd.querySelector) {
                                funSyncRefresh(eleAdd.querySelectorAll(strSelector));
                            }
                        }
                    });
                });
            });

            observerSelect.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.body.addEventListener('DOMNodeInserted', function (event) {
                // 插入节点
                funSyncRefresh([event.target]);
            });
        }
    };

    // 监听-免初始绑定
    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }

    return Form;
}));
