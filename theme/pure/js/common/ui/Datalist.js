/**
 * @Datalist.js
 * @author zhangxinxu
 * @version
 * Created: 16-03-28
 * @description 多功能下拉数据列表
**/

/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Datalist = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Follow = (this || self).Follow;

    if (typeof require == 'function' && !Follow) {
        Follow = require('common/ui/Follow');
    } else if (!Follow) {
        window.console.error('need Follow.js');
        return {};
    }

    /**
     * 数据下拉列表
     * 类似于传统Autocomplete功能
     * 仿HTML5原生datalist功能实现
     * 支持静态呈现(基于现有HTML构建)和动态获取(本地存储或ajax请求)
     */

    // 常量变量
    var DATALIST = 'datalist';
    var SELECTED = 'selected';
    var DISABLED = 'disabled';
    var ACTIVE = 'active';
    var REVERSE = 'reverse';

    // 样式类名统一处理
    var CL = {
        add: function () {
            return ['ui', DATALIST].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-' + DATALIST;
        }
    };

    var objEventType = {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup'
    };
    if ('ontouchstart' in document) {
        objEventType = {
            start: 'touchstart',
            move: 'touchmove',
            end: 'touchend'
        };
    }

    /**
     * 过滤HTML标签的方法
     * @param  {String} str 需要过滤的HTML字符串
     * @return {String}     返回过滤后的HTML字符串
     */
    var funStripHTML = function (str) {
        if (typeof str == 'string') {
            return str.replace(/<\/?[^>]*>/g, '');
        }

        return '';
    };

    /**
     * 转义HTML标签的方法
     * @param  {String} str 需要转义的HTML字符串
     * @return {String}     转义后的字符串
     */
    var funEncodeHTML = function (str) {
        if (typeof str == 'string') {
            return str.replace(/<|&|>/g, function (matches) {
                return ({
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;'
                })[matches];
            });
        }

        return '';
    };

    /**
     * 反转义HTML标签的方法
     * @param  {String} str 需要反转义的字符串
     * @return {String}     反转义后的字符串
     */
    var funDecodeHTML = function (str) {
        if (typeof str == 'string') {
            return str.replace(/&lt;|&gt;|&amp;/g, function (matches) {
                return ({
                    '&lt;': '<',
                    '&gt;': '>',
                    '&amp;': '&'
                })[matches];
            });
        }

        return '';
    };

    /*
     * 支持jQuery API调用和模块化调用两种
     * @example
     * new Datalist(element)
    */

    /**
     * Datalist实例方法
     * @param {Object|Element} element      输入框元素DOM对象或者选择器
     * @param {Object} options  可选参数
     */
    var Datalist = function (element, options) {
        if (typeof element == 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            window.console.error('Datalist实例方法参数缺失');

            return;
        }
        // el一般特指输入框
        if (element.nodeType != 1) {
            window.console.error('element参数不合法');

            return;
        }

        // 分3种情况
        // 1. list属性静态获取
        // 2. 根据name值本地获取
        // 3. options的data参数获取
        var defaults = {
            // 列表数据，'auto'表示取自本地存储，还支持数组和函数类型和对象
            data: 'auto',
            // 最多出现的匹配条目数，如果数目不限，使用'auto'关键字
            // 支持从element元素的results属性获取
            max: 8,
            // 下拉列表的宽度，默认和输入框宽度一致，支持数值和function
            width: 'auto',
            // 显示容器
            container: document.body,
            // 输入框点击时候的交互方式，是否变成placeholder状态
            // 默认值是'auto'，还支持true/和false
            placeholder: 'auto',
            // 对总数据的过滤方法，默认前序匹配
            filter: function (data, value) {
                // this是当前实例对象
                var arr = [];
                // 默认是从头到尾完全字符匹配
                if (data.forEach) {
                    data.forEach(function (obj) {
                        if (value == '' || obj.value.indexOf(value) == 0) {
                            arr.push(obj);
                        }
                    });
                }

                return arr;
            },
            // 选中某一项的回调
            // 点击和回车，上下键不会触发此事件
            onSelect: function () {},
            // 显示和隐藏时候的回调
            // this为实例对象，支持两个参数，
            // 分别是trigger(输入框)和target(生成列表)元素
            onShow: function () {},
            onHide: function () {}
        };

        options = options || {};

        // 元素
        var eleInput = element;

        if (eleInput.data && eleInput.data.datalist) {
            return eleInput.data.datalis;
        }

        // max是否通过原生的results属性设置
        var strResults = eleInput.getAttribute('results');
        var numResults = Number(strResults);
        if (strResults) {
            options.max = numResults;
        }

        var objParams = Object.assign({}, defaults, options);

        var eleContainer = objParams.container;
        if (eleContainer == 'string') {
            eleContainer = document.querySelector(eleContainer);
        }

        // 暴露的数据
        this.element = {
            input: eleInput,
            trigger: eleInput,
            form: eleInput.closest('form'),
            container: eleContainer
        };

        this.callback = {
            filter: objParams.filter,
            select: objParams.onSelect,
            show: objParams.onShow,
            hide: objParams.onHide
        };
        this.params = {
            width: objParams.width,
            max: objParams.max,
            data: objParams.data,
            index: -1
        };

        // 记住输入框默认的placeholder值
        var strAttrPlaceholder = eleInput.getAttribute('placeholder');
        if (strAttrPlaceholder) {
            this.params.placeholder = strAttrPlaceholder;
        }

        // 下拉列表是否显示的标志量
        this.display = false;
        // 占位符交互标示量
        if (objParams.placeholder == 'auto') {
            this.placeholder = true;
        }

        // 输入框的name属性值
        var strAttrName = eleInput.name;

        // 从本地自动获得数据
        if (objParams.data == 'auto') {
            var strAttrList = eleInput.getAttribute('list');

            var strAttrAutocomplete = eleInput.getAttribute('autocomplete');

            if (strAttrList) {
                // 走<datalist>元素获取数据
                var eleDatalist = document.getElementById(strAttrList);
                if (!eleDatalist) {
                    return;
                }
                // 暴露在外
                this.element.datalist = eleDatalist;
                // 去掉浏览器原生的行为
                eleInput.removeAttribute('list');
                // 数据实时从<datalist>元素获取
                this.callback.data = function () {
                    return [].slice.call(eleDatalist.querySelectorAll('option')).map(function (eleOption) {
                        var objAttr = {};

                        [].slice.call(eleOption.attributes).forEach(function (objNameValue) {
                            objAttr[objNameValue.name] = objNameValue.value;
                        });

                        // value和label是必须的
                        // 降低filter中出错概率
                        objAttr.value = objAttr.value || '';
                        objAttr.label = objAttr.label || '';

                        return objAttr;
                    });
                };
            } else if (strAttrName && strAttrAutocomplete != 'off') {
                // 走本地存储获取数据，模拟浏览器autocomplete效果
                // 跟随浏览器autocomplete行为规范实现

                // 数据从本地localStorage实时获取
                this.callback.data = function () {
                    var data = [];
                    // IE7忽略自动记忆功能
                    // 本地获取
                    var strList = localStorage[DATALIST + '-' + strAttrName];
                    if (strList) {
                        strList.split(',').forEach(function (value) {
                            // value必须
                            if (value) {
                                data.push({
                                    label: '',
                                    value: value
                                });
                            }
                        });
                    }

                    return data;
                };

                this.params.twice = true;

                // autocomplete交互占位符不参与
                this.placeholder = false;

                // 表单记忆
                if (this.element.form) {
                    this.element.form.addEventListener('submit', function () {
                        this.store();
                    }.bind(this));
                }
            } else {
                this.callback.data = function () {
                    return [];
                };
            }

        } else if (objParams.data instanceof Array) {
            // 2. 如果直接data参数
            this.callback.data = function () {
                return objParams.data;
            };
        } else if (typeof objParams.data == 'function') {
            // 3. 如果是函数
            this.callback.data = objParams.data;
        } else if (typeof objParams.data == 'object' && objParams.data.url) {
            // 4. 如果是ajax参数对象
            // 更改filter内置过滤处理（如果用户并没有自定义的话）
            if (!options.filter) {
                this.callback.filter = function (data) {
                    return data;
                };
            }

            var timerAjaxDatalist = null;
            var objDatalist = this;

            this.callback.data = function () {
                // 清除延时，避免每次输入都请求
                clearTimeout(timerAjaxDatalist);

                if (!strAttrName) {
                    strAttrName = 'k';
                }

                // 没有值的时候清空数据
                // 不请求
                var strValue = eleInput.value.trim();

                if (strValue == '') {
                    objDatalist.data = [];

                    return [];
                }

                var objAjaxParams = new URLSearchParams(objParams.data.data);
                // 加入输入数据
                objAjaxParams.append(strAttrName, strValue);

                // URL处理
                var strUrlAjax = objParams.data.url.split('#')[0];
                // URL拼接
                if (strUrlAjax.split('?').length > 1) {
                    strUrlAjax = strUrlAjax + '&' + objAjaxParams.toString();
                } else {
                    strUrlAjax = strUrlAjax + '?' + objAjaxParams.toString();
                }

                // 有2个参数有内置，需要合并
                // 1是搜索查询参数
                // 2是成功后的回调
                var funAjax = function () {
                    var xhr = new XMLHttpRequest();

                    xhr.open('GET', strUrlAjax);

                    xhr.onload = function () {
                        var json = {};

                        try {
                            json = JSON.parse(xhr.responseText);

                            if (json && json.data) {
                                objDatalist.refresh(objDatalist.callback.filter.call(objDatalist, json.data));
                                // 成功回调
                                if (objParams.data.success) {
                                    objParams.data.success(json);
                                }
                            } else if (objParams.data.error) {
                                objParams.data.error(json);
                            }
                        } catch (event) {
                            if (objParams.data.error) {
                                objParams.data.error(event);
                            }
                        }
                    };

                    xhr.onloadend = function () {
                        // 清除输入框忙碌状态
                        eleInput.removeAttribute('aria-busy');
                    };

                    xhr.onerror = function (event) {
                        if (objParams.data.error) {
                            objParams.data.error(event);
                        }
                    };

                    xhr.send();

                    // 标记输入框忙碌状态
                    eleInput.setAttribute('aria-busy', 'true');
                };

                // 请求保护，200毫秒延迟判断
                timerAjaxDatalist = setTimeout(funAjax, 200);
            };

            // autocomplete交互占位符不参与
            this.placeholder = false;
        }

        // 务必灭了浏览器内置的autocomplete
        if (eleInput.form) {
            eleInput.setAttribute('autocomplete', 'off');
        } else {
            eleInput.setAttribute('autocomplete', 'new-password');
        }

        // 上面的数据方法准备完毕，下面事件
        this.events();

        // 暴露
        // 存储
        if (!eleInput.data) {
            eleInput.data = {};
        }
        eleInput.data.datalist = this;
    };

    /**
     * 本地存储输入框的值
     * @return {Object} 返回当前实例对象
     */
    Datalist.prototype.store = function () {
        // 元素
        var eleInput = this.element.input;
        // 元素属性值
        var strValue = this.value();
        var strName = eleInput.name;
        // 只有有值的时候才本地记忆
        if (strValue && strName) {
            // 本地获取
            var arrList = (localStorage[DATALIST + '-' + strName] || '').split(',');
            // 如果当前数据并未保存过
            var numIndexMatch = arrList.indexOf(strValue);
            if (numIndexMatch == -1) {
                // 新值，前面插入
                arrList.unshift(strValue);
            } else if (numIndexMatch != 0) {
                // 如果当前匹配内容不是首位，顺序提前
                // 把需要提前的数组弄出来
                var arrSplice = arrList.splice(numIndexMatch, 1);
                // 重新连接
                arrList = arrSplice.concat(arrList);
            }

            // 更改对应的本地存储值
            localStorage[DATALIST + '-' + strName] = arrList.join();
        }

        return this;
    };

    /**
     * 清除本地存储的值
     * @param  {String} value value参数存在3种逻辑，具体参见方法内注释
     * @return {Object}       返回当前实例对象
     */
    Datalist.prototype.removeStore = function (value) {
        // value参数存在下面3种逻辑
        // 1. 字符串内容，表示移除本地该值数据（如果有）
        // 2. true，表示清空本地对应该存储
        // 3. undefined, 表示使用输入框的value值作为移除对象

        // 元素
        var eleInput = this.element.input;
        // 元素属性值
        var strName = eleInput.name;
        // 值
        var strValue = value || this.value();
        // 只有data为auto时候才本地记忆
        if (strValue && strName) {
            if (strValue === true) {
                localStorage.removeItem(DATALIST + '-' + strName);
            } else if (typeof strValue == 'string') {
                // 本地获取
                var arrList = (localStorage[DATALIST + '-' + strName] || '').split(',');
                // 当前数据位置
                var numIndexMatch = arrList.indexOf(strValue);
                if (numIndexMatch != -1) {
                    // 删除
                    arrList.splice(numIndexMatch, 1);
                    // 更改对应的本地存储值
                    localStorage[DATALIST + '-' + strName] = arrList.join();
                }
            }
        }

        return this;
    };

    /**
     * 刷新列表
     * @param  {Array} data 刷新列表的数据，可缺省，缺省则调用API中的data()方法获取
     * @return {Object}     返回当前实例对象
     */
    Datalist.prototype.refresh = function (data) {
        // 元素们
        var eleTarget = this.element.target;
        var eleInput = this.element.input;

        if (!eleTarget) {
            this.create();
            eleTarget = this.element.target;
        }

        // 此时输入框的值
        var strValue = this.value();
        // 显示的列表数据
        var arrData = data;

        // 这个键盘操作时候需要
        var numParamsIndex = this.params.index;

        // 列表的刷新
        // 根据data和filter得到最终呈现的数据
        if (typeof arrData == 'undefined') {
            if (typeof this.callback.data != 'function') {
                return this;
            }
            arrData = this.callback.filter.call(this, this.callback.data(), strValue);

            if (arrData instanceof Array == false) {
                return this;
            }
        }
        // 显示的最大个数
        if (typeof this.params.max == 'number') {
            arrData = arrData.slice(0, this.params.max);
        }

        // 暴露最终使用的列表数据
        this.data = arrData;

        // 列表HTML组装
        var strHtmlList = '';
        if (arrData && arrData.length) {
            // 占位符
            var strAttrPlaceholder = eleInput.getAttribute('placeholder');
            var strParamPlaceholder = this.params.placeholder;

            // 拼接列表字符内容
            arrData.forEach(function (objData, numIndex) {
                // 过滤HTML标签
                var strValueStrip = funStripHTML(objData.value || '').trim();
                var strLabelStrip = funStripHTML(objData.label || '').trim();

                var strClassList = '';
                if ((strValue && strValueStrip == strValue) || (!strValue && strValueStrip == strAttrPlaceholder && strValueStrip != strParamPlaceholder)) {
                    if (numParamsIndex == numIndex) {
                        strClassList = ' ' + SELECTED;
                    }
                }
                // 禁用态，禁用态和选中态不能同时存在
                if (objData[DISABLED] || typeof objData[DISABLED] == 'string') {
                    strClassList = ' ' + DISABLED;
                }

                if (objData.label) {
                    strHtmlList = strHtmlList +
                    // 虽然使用其他标签模拟<datalist>
                    // 但是，一些属性值，还是遵循HTML规范
                    '<li class="' + CL.add('option') + strClassList + '" data-value="' + strValueStrip + '" label="' + strLabelStrip + '" data-index="' + numIndex + '">' +
                        // label应该前置，可以通过相邻选择器控制后面内容的UI
                        '<label class="' + CL.add('label') + '">' +
                            objData.label +
                        '</label><span class="' + CL.add('value') + '">' +
                            objData.value +
                        '</span>' +
                    '</li>';
                } else {
                    strHtmlList = strHtmlList +
                    // 但是，一些属性值，还是遵循HTML规范
                    '<li class="' + CL.add('option') + strClassList + '" data-value="' + strValueStrip + '" data-index="' + numIndex + '">' +
                        '<span class="' + CL.add('value') + '">' + objData.value + '</span>' +
                    '</li>';
                }
            });
        }

        if (strHtmlList != '') {
            strHtmlList = '<ul class="' + CL.add(DATALIST) + '">' + strHtmlList + '</ul>';
        }

        eleTarget.innerHTML = strHtmlList;

        var eleSelected = eleTarget.querySelector('.' + SELECTED);
        if (this.display == true && eleSelected) {

            // 选中元素距离容器上边缘的位置
            var numOffsetTop = eleSelected.offsetTop - (eleTarget.lastScrollTop || 0);

            // 如果不可见
            if (numOffsetTop < 0 || numOffsetTop >= eleSelected.parentElement.clientHeight) {
                eleSelected.parentElement.scrollTop = eleSelected.offsetTop;
                eleTarget.lastScrollTop = eleSelected.offsetTop;
            } else {
                eleSelected.parentElement.scrollTop = eleTarget.lastScrollTop || 0;
            }
        }

        if (strHtmlList) {
            if (this.display == false) {
                this.show();
            }
        } else if (this.display == true) {
            this.hide();
        }
    };

    /**
     * 创建下拉面板
     * 方法私有
     * @return {Object} 返回当前实例对象
     */
    Object.defineProperty(Datalist.prototype, 'create', {
        value: function () {
            // list属性值需要和创建的列表元素id对应获取
            var eleTrigger = this.element.trigger;

            // 原生HTML5应该是对应datalist元素
            // 但1. datalist无法自定义UI; 2. IE9-不支持；3. 一些bug存在
            // 所以，我们使用普通的ul列表元素模拟
            if (!this.element.target) {
                // 看看是否有list属性值
                var strId = this.element.datalist && this.element.datalist.id;
                if (!strId) {
                    // 如果没有关联id，创建之
                    strId = ('lulu_' + Math.random()).replace('0.', '');
                    // 设置关联id
                    eleTrigger.setAttribute('data-target', strId);
                }

                var eleTarget = document.createElement('div');
                eleTarget.classList.add(CL);

                eleTarget.addEventListener('click', function (event) {
                    if (event.touches && event.touches.length) {
                        event = event.touches[0];
                    }

                    var eleClicked = event.target.closest && event.target.closest('li');
                    if (eleClicked && eleClicked.classList.contains(DISABLED) == false) {
                        var strValue = eleClicked.getAttribute('data-value');
                        var strIndex = eleClicked.getAttribute('data-index');

                        this.params.index = Number(strIndex);
                        // 赋值并关闭列表
                        this.value(strValue);
                        this.hide();

                        // 选中触发
                        this.select();
                    }
                }.bind(this));

                // 方便区分不同的数据列表
                if (eleTrigger.id) {
                    eleTarget.classList.add(CL.add(eleTrigger.id.replace(/[A-Z]/g, function (matches) {
                        return '-' + matches.toLowerCase();
                    }).replace(/^-+|-+$/g, '')));
                }
                // 载入页面
                this.element.container.appendChild(eleTarget);

                // 元素暴露
                this.element.target = eleTarget;

                // 默认display态
                this.display = false;
            }

            return this;
        }
    });

    /**
     * 输入框赋值或者取值
     * @param  {String} value 赋予输入框的值，如果缺省，则表示取值
     * @return {Object}       返回当前实例对象
     */
    Datalist.prototype.value = function (value) {
        // 元素们
        var eleInput = this.element.input;

        if (typeof value == 'undefined') {
            // 取值
            return funEncodeHTML(eleInput.value.trim());
        }

        var strValue = value.toString();

        // 赋值
        eleInput.value = funDecodeHTML(strValue.trim());

        // 使用的数据对象
        var objData = this.data[this.params.index];

        // 事件
        if (JSON.stringify(objData) != JSON.stringify(eleInput.oldValue) || this.params.index != eleInput.lastIndex) {
            // 赋值时候触发的回调事件们
            eleInput.dispatchEvent(new CustomEvent('change', {
                'bubbles': true,
                'detail': objData
            }));
            // 由于输入框可输入，因此input事件是一定要触发的
            eleInput.dispatchEvent(new CustomEvent('input', {
                'bubbles': true,
                'detail': objData
            }));
        }

        // 记住上一次的值和索引
        eleInput.oldValue = objData;
        // 记住索引的原因在于，可能两条数据是一样的
        eleInput.lastIndex = this.params.index;

        return this;
    };

    /**
     * 一些事件
     * @return {Object} 返回当前实例对象
     */
    Datalist.prototype.events = function () {
        // 事件
        // 元素们
        var eleTrigger = this.element.trigger;

        if (document.activeElement != eleTrigger) {
            eleTrigger.isFocus = false;
        }

        eleTrigger.addEventListener('blur', function () {
            eleTrigger.isFocus = false;
        });

        eleTrigger.addEventListener('focus', function () {
            if (window.isKeyEvent) {
                eleTrigger.click();
            }
        });

        eleTrigger.addEventListener('click', function () {
            if (this.display == false) {
                // autocomplete模式不执行占位符交互
                if (this.placeholder === true) {
                    eleTrigger.focusValue = eleTrigger.value.trim();

                    if (eleTrigger.focusValue) {
                        eleTrigger.setAttribute('placeholder', eleTrigger.focusValue);
                    }
                    eleTrigger.value = '';
                }

                if (this.params.twice == true && eleTrigger.isFocus == true) {
                    this.refresh();
                } else if (!this.params.twice) {
                    this.refresh();
                }
            }

            eleTrigger.isFocus = true;
        }.bind(this));

        eleTrigger.addEventListener('input', function (event) {
            if (event.isTrusted === false) {
                return;
            }
            // IE10+下有个bug
            // focus placeholder变化时候，会触发input事件
            if (document.msHidden != undefined && eleTrigger.value.trim() == '' && !eleTrigger.lastValue && eleTrigger.getAttribute('placeholder')) {
                eleTrigger.lastValue = eleTrigger.value;

                return;
            }
            // 输入行为的时候，如果内容为空，内隐藏列表
            if (this.placeholder == true || eleTrigger.value.trim()) {
                this.refresh();
            } else {
                this.hide();
            }
        }.bind(this));

        eleTrigger.addEventListener('keydown', function (event) {
            // data为当前列表使用的数据
            // index表示当前选中列表的索引值
            var arrData = this.data;
            var numIndex = this.params.index;

            // 面板元素
            var eleTarget = this.element.target;

            if (!eleTarget) {
                return;
            }

            var eleSelected = eleTarget.querySelector('.' + SELECTED);

            switch (event.keyCode) {
                case 27: case 13: {
                    // ESC-27 ENTER-13
                    if (this.display == true) {
                        // 列表隐藏
                        this.hide();

                        event.preventDefault();

                        if (eleSelected) {
                            eleSelected.click();
                            // 当键盘选值的时候，阻止默认行为
                            // 例如ENTER表单提交，ESC输入框内容清空
                            event.preventDefault();
                            // 文本内容从选中态改为focus态
                            setTimeout(function () {
                                var eleInput = eleTrigger;
                                if (eleTrigger.setSelectionRange) {
                                    try {
                                        // 部分输入框类型，例如email, number不支持selection
                                        eleInput.setSelectionRange(eleInput.value.length, eleInput.value.length);
                                    } catch (e) {
                                        eleInput.value = eleInput.value;
                                    }
                                } else {
                                    eleInput.value = eleInput.value;
                                }

                                // 触发Validate.js中的验证
                                eleInput.dispatchEvent(new CustomEvent('input', {
                                    'bubbles': true,
                                    'detail': arrData[numIndex]
                                }));
                            }, 17);
                        }
                    }

                    break;
                }
                case 38: case 40: {
                    // UP-38
                    if (this.display == true && arrData && arrData.length) {
                        event.preventDefault();

                        // 过滤出可以用来选中的索引
                        var arrIndexMatchAble = [];
                        arrData.forEach(function (objData, numIndexMatch) {
                            if (!objData[DISABLED] && objData[DISABLED] !== '') {
                                arrIndexMatchAble.push(numIndexMatch);
                            }
                        });

                        // 全部列表都禁用，忽略
                        if (arrIndexMatchAble.length == 0) {
                            return;
                        }

                        // 然后索引往后挪一位
                        var numIndexFilterMatch = arrIndexMatchAble.indexOf(numIndex);

                        if (event.keyCode == 38) {
                            numIndexFilterMatch--;
                        } else {
                            numIndexFilterMatch++;
                        }

                        if (numIndexFilterMatch < 0) {
                            numIndex = arrIndexMatchAble[arrIndexMatchAble.length - 1];
                        } else if (numIndexFilterMatch > arrIndexMatchAble.length - 1) {
                            numIndex = arrIndexMatchAble[0];
                        } else {
                            numIndex = arrIndexMatchAble[numIndexFilterMatch];
                        }

                        this.params.index = numIndex;
                    }

                    // 上下键的时候，列表数据不动态获取和过滤
                    if (arrData[numIndex]) {
                        this.value(funStripHTML(arrData[numIndex].value));
                    }

                    eleTrigger.select();

                    this.refresh(arrData);

                    break;
                }
                case 46: {
                    // DELETE-46
                    if (this.display == true && this.params.twice == true && eleSelected) {
                        var strValueSelected = eleSelected.getAttribute('data-value');
                        // 清除本地存储内容
                        this.removeStore(strValueSelected);
                        // data中对应对象删除
                        arrData = arrData.filter(function (objData) {
                            return objData.value != strValueSelected;
                        });
                        // 阻止默认删除行为
                        event.preventDefault();

                        // 获取现在应该显示的值
                        var objDataLeave = arrData[numIndex] || arrData[numIndex - 1];
                        if (objDataLeave) {
                            this.value(funStripHTML(objDataLeave.value));
                            // 列表刷新
                            this.refresh(arrData);
                        } else {
                            // 全部删除
                            this.value = '';
                            // 列表隐藏
                            this.hide();
                        }
                    }

                    break;
                }
            }
        }.bind(this));

        // 点击空白处隐藏
        document.addEventListener(objEventType.end, function (event) {
            if (event.touches && event.touches.length) {
                event = event.touches[0];
            }

            var eleClicked = event.target;
            var eleTarget = this.element.target;

            if (eleTarget && eleClicked.nodeType == 1 && eleTarget.contains(eleClicked) == false) {
                this.hide();
            }

            if (eleClicked != eleTrigger && eleTrigger.value.trim() == '') {
                if (eleTrigger.focusValue) {
                    eleTrigger.value = eleTrigger.focusValue;
                } else if (this.params.placeholder) {
                    eleTrigger.setAttribute('placeholder', this.params.placeholder);
                }
            }
        }.bind(this));

        // 浏览器窗口改变重定位
        window.addEventListener('resize', function () {
            if (this.display == true) {
                this.position();
            }
        }.bind(this));

        return this;
    };

    /**
     * 下拉面板的定位
     * @return {Object} 返回当前实例
     */
    Datalist.prototype.position = function () {
        // 元素们
        var eleTrigger = this.element.trigger;
        var eleTarget = this.element.target;

        if (eleTrigger && eleTarget) {
            new Follow(eleTrigger, eleTarget, {
                // 边缘不自动调整，此处手动调整
                edgeAdjust: this.params.edgeAdjust || false
            });

            if (this.display == true) {
                eleTrigger.classList.add(ACTIVE);
            }
        }

        // 列表的定位
        return this;
    };

    /**
     * 列表选择
     * @return {Object} 返回当前实例
     */
    Datalist.prototype.select = function () {
        // 选择回调
        this.callback.select.call(this, this.data[this.params.index], this.element.trigger, this.element.target);
    };

    /**
     * 下拉面板显示
     * @return {Object} 返回当前实例
     */
    Datalist.prototype.show = function () {
        // 元素们
        var eleTrigger = this.element.trigger;
        var eleTarget = this.element.target;

        if (!eleTarget) {
            this.create();
            eleTarget = this.element.target;
        }

        // 当前的显示状态
        var isDisplay = this.display;

        // 列表的宽度
        var numWidthTarget = this.params.width;
        var numWidthTrigger = eleTrigger.getBoundingClientRect().width || eleTrigger.clientWidth;

        if (numWidthTarget == 'auto') {
            numWidthTarget = numWidthTrigger;
        } else if (typeof numWidthTarget == 'function') {
            numWidthTarget = numWidthTarget.call(this, eleTrigger, eleTarget);
        }

        if (numWidthTarget != 'auto' && typeof numWidthTarget != 'number') {
            numWidthTarget = numWidthTrigger;
        }

        eleTarget.style.display = 'block';
        eleTarget.style.width = numWidthTarget + 'px';

        if (typeof eleTarget.lastScrollTop == 'number' && eleTarget.querySelector('ul')) {
            eleTarget.querySelector('ul').scrollTop = eleTarget.lastScrollTop;
        }

        // 显示状态标记
        this.display = true;

        // 定位
        this.position();

        // 显示回调，当之前隐藏时候才触发
        if (isDisplay == false) {
            this.callback.show.call(this, eleTrigger, eleTarget);
        }
    };

    /**
     * 下拉面板隐藏
     * @return {Object} 返回当前实例
     */
    Datalist.prototype.hide = function () {
        // 元素们
        var eleTrigger = this.element.trigger;
        var eleTarget = this.element.target;

        if (eleTarget && this.display == true) {
            // 记住滚动高度
            if (eleTarget.querySelector('ul')) {
                eleTarget.lastScrollTop = eleTarget.querySelector('ul').scrollTop;
            }

            eleTarget.style.display = 'none';
            eleTarget.classList.remove(REVERSE);

            // 隐藏回调
            this.callback.hide.call(this, eleTrigger, eleTarget);
        }

        eleTrigger.classList.remove(ACTIVE);
        eleTrigger.classList.remove(REVERSE);

        // 隐藏状态标记
        this.display = false;
    };

    // is-datalist 属性实时watch
    var funAutoInitAndWatching = function () {
        // 目标选择器
        var strSelector = 'input[is-datalist]';

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

        // 遍历页面上匹配的元素
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

    return Datalist;
}));
