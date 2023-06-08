/**
 * @Form.js
 * @author zhangxinxu
 * @version
 * @created  16-03-01
 * @edited   19-12-02    ES5原生语法支持
 */
/**
 * 表单解决方案组件
 * @使用示例
 *  <form is="ui-form">
 */

import LightTip from '../ui/LightTip.js';
import Validate from '../ui/Validate.js';
import '../ui/Loading.js';

// 表单
class Form extends HTMLFormElement {
    constructor () {
        super();

        this.element = this.element || {};
        this.params = this.params || {
            // 验证成功之后，请求发送前的条件约束
            // avoidSend: function () {}
        };
        // 回调方法们
        this.callback = this.callback || {};

        Object.defineProperty(this.params, 'validate', {
            set (value) {
                if (this.validate) {
                    this.validate.setCustomValidity(value);
                }
            }
        });

        return this;
    }

    /**
     * 表单提交的处理
     * @return {[type]} [description]
     */
    ajax () {
        // 回调
        // optionCallback可以是对象也可以直接是成功回调
        /*
            optionCallback = {
                success: function () {},
                error: function () {},
                complete: function () {}
            };
        */
        let optionCallback = this.callback;
        optionCallback = optionCallback || function () {};
        if (typeof optionCallback == 'function') {
            optionCallback = {
                success: optionCallback
            };
        }

        // 表单提交按钮元素的获取
        let eleSubmit = [...this.elements].filter(function (control) {
            return control.type && /^(?:submit|image)$/i.test(control.type);
        })[0] || this.querySelector('button:nth-last-of-type(1)');

        if (!eleSubmit) {
            eleSubmit = (() => {
                let ele = document.createElement('button');
                ele.type = 'submit';
                ele.setAttribute('hidden', '');
                this.appendChild(ele);

                return ele;
            })();
        }

        this.element.submit = eleSubmit;

        // 按钮元素
        let eleButton = null;

        // 我们肉眼所见的按钮，进行一些状态控制
        eleButton = eleSubmit.id && document.querySelector('label[for=' + eleSubmit.id + ']');
        if (!eleButton) {
            eleButton = eleSubmit;
        }
        this.element.button = eleButton;

        // 请求地址
        let strUrl = this.action.split('#')[0] || location.href.split('#')[0];
        // 请求类型
        let strMethod = this.method || 'POST';
        let strEnctype = this.getAttribute('enctype') || this.enctype;

        // 提交数据
        // 1. 菊花转起来
        eleButton.loading = true;
        // 2. 提交按钮禁用
        eleSubmit.setAttribute('disabled', 'disabled');

        // 3. 数据
        let objFormData = new FormData(this);
        // 支持外部传入额外的请求参数
        if (this.params.data) {
            Object.keys(this.params.data).forEach(key => {
                objFormData.append(key, this.params.data[key]);
            });
        }

        // 请求类型不同，数据地址也不一样
        let strSearchParams = new URLSearchParams(objFormData).toString();

        if (strMethod.toLowerCase() == 'get') {
            if (strUrl.split('?').length > 1) {
                strUrl = strUrl + '&' + strSearchParams;
            } else {
                strUrl = strUrl + '?' + strSearchParams;
            }
        }

        // 4. 请求走起来
        let xhr = new XMLHttpRequest();
        xhr.open(strMethod, strUrl);

        if (optionCallback.beforeSend) {
            optionCallback.beforeSend.call(this, xhr, objFormData);
        }

        // 请求结束
        xhr.onload = () => {
            let json = {};

            try {
                json = JSON.parse(xhr.responseText);
            } catch (event) {
                new LightTip('返回数据解析出错。', 'error');
                // 回调
                if (optionCallback.error) {
                    optionCallback.error.call(this, event);
                }

                // 触发出错自定义事件
                this.dispatchEvent(new CustomEvent('error', {
                    detail: {
                        data: {
                            code: -1,
                            msg: '解析出错'
                        }
                    }
                }));

                return;
            }

            if (json && (json.code === 0 || json.error === 0)) {
                // 成功回调
                if (optionCallback.success) {
                    optionCallback.success.call(this, json);
                } else {
                    // 如果没有成功回调，组件自己提示成功
                    new LightTip(json.msg || '操作成功。', 'success');
                    // 表单重置
                    this.reset();
                }

                // 支持绑定success事件
                this.dispatchEvent(new CustomEvent('success', {
                    detail: {
                        data: json
                    }
                }));
            } else {
                new LightTip((json && json.msg) || '返回数据格式不符合要求。', 'error');

                // 失败回调
                if (optionCallback.error) {
                    optionCallback.error.call(this, json);
                }

                // 触发出错自定义事件
                this.dispatchEvent(new CustomEvent('error', {
                    detail: {
                        data: json
                    }
                }));
            }
        };

        // 请求错误
        xhr.onerror = () => {
            new LightTip('网络异常，刚才的操作没有成功，您可以稍后重试。', 'error');
            // 回调
            if (optionCallback.error) {
                optionCallback.error.apply(this, arguments);
            }
            // 触发出错自定义事件
            this.dispatchEvent(new CustomEvent('error', {
                detail: {
                    code: -1,
                    msg: '网络异常'
                }
            }));
        };

        // 请求结束，无论成功还是失败
        xhr.onloadend = () => {
            // 菊花关闭
            eleButton.loading = false;
            // 表单恢复提交
            eleSubmit.removeAttribute('disabled');
            // 回调
            if (optionCallback.complete) {
                optionCallback.complete.apply(this, arguments);
            }

            // 支持绑定complete事件
            this.dispatchEvent(new CustomEvent('complete'));
        };

        if (strEnctype && strEnctype.toLowerCase() === 'application/x-www-form-urlencoded') {
            xhr.send(strSearchParams);
        } else if (strEnctype == 'application/json') {
            xhr.setRequestHeader('Content-Type', strEnctype);
            const objSend = {};
            objFormData.forEach(function(value, key){
                objSend[key] = value;
            });
            xhr.send(JSON.stringify(objSend));
        } else {
            xhr.send(objFormData);
        }
    }

    connectedCallback () {
        // 绑定表单验证
        this.validate = new Validate(this, () => {
            let funAvoidSend = this.params.avoidSend || this.callback.avoidSend;
            // 验证成功之后
            if (!funAvoidSend || !funAvoidSend(this)) {
                this.ajax();
            }
        }, this.params.validate || {});

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-form'
            }
        }));

        this.isConnectedCallback = true;

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }
}

if (!customElements.get('ui-form')) {
    customElements.define('ui-form', Form, {
        extends: 'form'
    });
}
