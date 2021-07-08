/**
 * @Datalist.js
 * @author zhangxinxu
 * @version
 * Created: 16-03-28
 * edited: 20-07-30 edit by yanmeng
 * @description 多功能下拉数据列表
 **/

import './Follow.js';

const Datalist = (() => {

    /**
     * 数据下拉列表
     * 类似于传统Autocomplete功能
     * 仿HTML5原生datalist功能实现
     * 支持静态呈现(基于现有HTML构建)和动态获取(本地存储或ajax请求)
     */

    // 常量变量
    const DATALIST = 'datalist';
    const SELECTED = 'selected';
    const DISABLED = 'disabled';
    const ACTIVE = 'active';
    const REVERSE = 'reverse';

    // 样式类名统一处理
    const CL = {
        add: (props) => ['ui', DATALIST].concat([props]).join('-'),
        toString: () => `ui-${DATALIST}`
    };

    let objEventType = {
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
     * 对输入框元素进行Datalist类扩展
     */

    class Datalist extends HTMLInputElement {
        constructor () {
            super();

            if (!this.params) {
                this.params = {};
            }
            if (!this.element) {
                this.element = {};
            }
        }

        /**
         * 过滤HTML标签的方法
         * @param  {String} str 需要过滤的HTML字符串
         * @return {String}     返回过滤后的HTML字符串
         */
        static stripHTML (str) {
            if (typeof str == 'string') {
                return str.replace(/<\/?[^>]*>/g, '');
            }

            return '';
        }

        /**
         * 转义HTML标签的方法
         * @param  {String} str 需要转义的HTML字符串
         * @return {String}     转义后的字符串
         */
        static encodeHTML (str) {
            if (typeof str == 'string') {
                return str.replace(/<|&|>/g, function (matches) {
                    return {
                        '<': '&lt;',
                        '>': '&gt;',
                        '&': '&amp;'
                    }[matches];
                });
            }

            return '';
        }

        /**
         * 反转义HTML标签的方法
         * @param  {String} str 需要反转义的字符串
         * @return {String}     反转义后的字符串
         */
        static decodeHTML (str) {
            if (typeof str == 'string') {
                return str.replace(/&lt;|&gt;|&amp;/g, (matches) => {
                    return {
                        '&lt;': '<',
                        '&gt;': '>',
                        '&amp;': '&'
                    }[matches];
                });
            }

            return '';
        }

        // 多个参数快捷设置方法
        setParams (options) {
            Object.assign(this.params, options || {});
        }

        /**
         * @param {Object} value 不同的数据类型统一为function类型
         */
        convertData (value) {
            this.params.data = value || this.params.data;
            // 从本地自动获得数据
            if (this.params.data == 'auto') {
                // 数据实时从<datalist>元素获取
                let strAttrList = this.getAttribute('list');
                if (strAttrList) {
                // 走<datalist>元素获取数据
                    let eleDatalist = document.getElementById(strAttrList);
                    if (!eleDatalist) {
                        return;
                    }
                    // 去掉浏览器原生的行为
                    this.removeAttribute('list');
                    // 数据实时从<datalist>元素获取
                    this.params.data = function () {
                        return [].slice.call(eleDatalist.querySelectorAll('option')).map(function (eleOption) {
                            let objAttr = {};

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
                } else if (this.name && (this.autocomplete === '' || this.autocomplete == 'on')) {
                    this.params.twice = true;
                    // autocomplete交互占位符不参与
                    this.params.placeholder = false;
                    // 走本地存储获取数据，模拟浏览器autocomplete效果
                    // 跟随浏览器autocomplete行为规范实现
                    // 数据从本地localStorage实时获取
                    this.params.data = () => {
                        let data = [];
                        // 本地获取
                        let strList = localStorage[DATALIST + '-' + this.name];

                        if (strList) {
                            strList.split(',').forEach(function (value) {
                                // value必须
                                if (value && value.trim()) {
                                    data.push({
                                        label: '',
                                        value: value
                                    });
                                }
                            });
                        }

                        return data;
                    };
                } else {
                    this.params.data =  function () {
                        return [];
                    };
                }
            } else if (this.params.data instanceof Array) {
                // 2. 如果直接data参数
                let array = this.params.data;
                this.params.data = function () {
                    return array;
                };

            } else if (typeof this.params.data == 'function') {
                // 3. 如果是函数
            } else if (typeof this.params.data == 'object' && this.params.data.url) {
                // 4. 如果是ajax参数对象
                let timerAjaxDatalist = null;
                let objParams = {
                    ...this.params.data
                };
                this.params.data = () => {
                    // 清除延时，避免每次输入都请求
                    clearTimeout(timerAjaxDatalist);

                    if (!this.name) {
                        this.name = 'k';
                    }

                    // 没有值的时候清空数据
                    // 不请求
                    let strValue = this.value.trim();

                    if (strValue == '') {
                        this.datalist = [];

                        return [];
                    }

                    let objAjaxParams = new URLSearchParams(objParams.data);
                    // 加入输入数据
                    objAjaxParams.append(this.name, strValue);

                    // URL处理
                    let strUrlAjax = objParams.url.split('#')[0];
                    // URL拼接
                    if (strUrlAjax.split('?').length > 1) {
                        strUrlAjax = strUrlAjax + '&' + objAjaxParams.toString();
                    } else {
                        strUrlAjax = strUrlAjax + '?' + objAjaxParams.toString();
                    }

                    // 有2个参数有内置，需要合并
                    // 1是搜索查询参数
                    // 2是成功后的回调
                    let funAjax = async () => {
                        const response = await fetch(strUrlAjax);
                        this.setAttribute('aria-busy', 'true');
                        const json = await response.json();
                        this.removeAttribute('aria-busy');

                        if (json && json.data) {
                            let jsonData = json.data;
                            // encode转义处理
                            if (this.params.encode && jsonData.map) {
                                jsonData = jsonData.map(obj => {
                                    if (obj.value) {
                                        obj.value = Datalist.encodeHTML(obj.value);
                                    }
                                    return obj;
                                });
                            }
                            this.refresh(this.params.filter.call(this, jsonData));
                            // 成功回调
                            if (objParams.success) {
                                objParams.success(json);
                            }
                        } else if (objParams.error) {
                            objParams.error(json);
                        }
                    };
                    // 请求保护，200毫秒延迟判断
                    timerAjaxDatalist = setTimeout(funAjax, 200);

                };
                // autocomplete交互占位符不参与
                this.params.placeholder = false;
            }
        }

        /**
         * 本地存储输入框的值
         * @return {Object} 返回当前输入框元素
         */
        store () {
            // 元素属性值
            const strValue = this.val();
            const {
                name: strName
            } = this;

            // 只有有值的时候才本地记忆
            if (strValue && strName) {
                // 本地获取
                let arrList = (localStorage[`${DATALIST}-${strName}`] || '').split(',');
                // 如果当前数据并未保存过
                const numIndexMatch = arrList.indexOf(strValue);
                if (numIndexMatch == -1) {
                    // 新值，前面插入
                    arrList.unshift(strValue);
                } else if (numIndexMatch != 0) {
                    // 如果当前匹配内容不是首位，顺序提前
                    // 把需要提前的数组弄出来
                    let arrSplice = arrList.splice(numIndexMatch, 1);
                    // 重新连接
                    arrList = [arrSplice, ...arrList];
                }

                // 更改对应的本地存储值
                localStorage[`${DATALIST}-${strName}`] = arrList.join();
            }

            return this;
        }

        /**
         * 清除本地存储的值
         * @param  {String} value value参数存在3种逻辑，具体参见方法内注释
         * @return {Object}       返回当前输入框元素
         */
        removeStore (value) {
            // value参数存在下面3种逻辑
            // 1. 字符串内容，表示移除本地该值数据（如果有）
            // 2. true，表示清空本地对应该存储
            // 3. undefined, 表示使用输入框的value值作为移除对象

            // 元素属性值
            const strName = this.name;
            // 值
            const strValue = value || this.val();
            // 只有data为auto时候才本地记忆
            if (strValue && strName) {
                if (strValue === true) {
                    localStorage.removeItem(`${DATALIST}-${strName}`);
                } else if (typeof strValue == 'string') {
                    // 本地获取
                    let arrList = (
                        localStorage[`${DATALIST}-${strName}`] || ''
                    ).split(',');
                    // 当前数据位置
                    const numIndexMatch = arrList.indexOf(strValue);
                    if (numIndexMatch != -1) {
                        // 删除
                        arrList.splice(numIndexMatch, 1);
                        // 更改对应的本地存储值
                        localStorage[`${DATALIST}-${strName}`] = arrList.join();
                    }
                }
            }

            return this;
        }

        /**
         * 刷新列表
         * @param  {Array} data 刷新列表的数据，可缺省，缺省则调用API中的data()方法获取
         * @return {Object}     返回当前输入框元素
         */
        refresh (data) {
            // 元素们
            let eleTarget = this.element.target;

            if (!eleTarget) {
                this.create();
                eleTarget = this.element.target;
            }
            // 此时输入框的值
            const strValue = this.val();
            // 显示的列表数据
            let arrData = data;

            // 列表的刷新
            // 根据data和filter得到最终呈现的数据
            if (typeof arrData == 'undefined') {
                if (typeof this.params.data != 'function') {
                    this.convertData();
                }
                if (typeof this.params.data != 'function') {
                    return this;
                }
                arrData = this.params.data();
                if (!arrData) {
                    return this;
                }
                if (this.params.encode && arrData.map) {
                    arrData = arrData.map(obj => {
                        if (obj.value) {
                            obj.value = Datalist.encodeHTML(obj.value);
                        }
                        return obj;
                    });
                }
                arrData = this.params.filter.call(this, arrData, strValue);
                if (arrData instanceof Array == false) {
                    return this;
                }
            }
            // max是否通过原生的results属性设置
            const strResults = this.getAttribute('results');
            const numResults = Number(strResults);
            if (strResults) {
                arrData = arrData.slice(0, numResults);
            }
            // 暴露最终使用的列表数据
            this.datalist = arrData;
            // 列表HTML组装
            let strHtmlList = '';
            if (arrData?.length) {
                // 先不匹配任何列表项
                this.params.index = -1;

                // 占位符
                const strAttrPlaceholder = this.getAttribute('placeholder');
                const strParamPlaceholder = this.params.placeholder;

                // 拼接列表字符内容
                arrData.forEach((objData, numIndex) => {
                    let strValueEncode = objData.value || '';
                    // 过滤HTML标签和换行
                    let strValueStrip = Datalist.stripHTML(strValueEncode).trim().replace(/\n/g, '');
                    let strLabelStrip = Datalist.stripHTML(objData.label || '').trim().replace(/\n/g, '');

                    let strClassList = '';
                    if (
                        (strValue && strValueStrip == strValue) ||
                        (!strValue &&
                            strValueStrip == strAttrPlaceholder &&
                            strValueStrip != strParamPlaceholder)
                    ) {
                        strClassList = ` ${SELECTED}`;
                        // 这个键盘操作时候需要
                        this.params.index = numIndex;
                    }
                    // 禁用态，禁用态和选中态不能同时存在
                    if (objData[DISABLED] || typeof objData[DISABLED] == 'string') {
                        strClassList = ' ' + DISABLED;
                    }

                    if (objData.label) {
                        // 虽然使用其他标签模拟<datalist>
                        // 但是，一些属性值，还是遵循HTML规范
                        // label应该前置，可以通过相邻选择器控制后面内容的UI
                        strHtmlList = `${strHtmlList}<li class="${CL.add(
                            'option'
                        )}${strClassList}" data-value="${strValueStrip}" label="${strLabelStrip}" data-index="${numIndex}"><label class="${CL.add(
                            'label'
                        )}">${objData.label}</label><span class="${CL.add(
                            'value'
                        )}">${strValueEncode}</span></li>`;
                    } else {
                        // 但是，一些属性值，还是遵循HTML规范
                        strHtmlList = `${strHtmlList}<li class="${CL.add(
                            'option'
                        )}${strClassList}" data-value="${strValueStrip}" data-index="${numIndex}"><span class="${CL.add(
                            'value'
                        )}">${strValueEncode}</span></li>`;
                    }
                });
            }

            if (strHtmlList != '') {
                strHtmlList = `<ul class="${CL.add(
                    DATALIST
                )}">${strHtmlList}</ul>`;
            }

            eleTarget.innerHTML = strHtmlList;

            const eleSelected = eleTarget.querySelector('.' + SELECTED);
            if (this.display == true && eleSelected) {
                // 选中元素距离容器上边缘的位置
                const numOffsetTop =
                    eleSelected.offsetTop - (eleTarget.lastScrollTop || 0);

                // 如果不可见
                if (
                    numOffsetTop < 0 ||
                    numOffsetTop >= eleSelected.parentElement.clientHeight
                ) {
                    eleSelected.parentElement.scrollTop = eleSelected.offsetTop;
                    eleTarget.lastScrollTop = eleSelected.offsetTop;
                } else {
                    eleSelected.parentElement.scrollTop =
                        eleTarget.lastScrollTop || 0;
                }
            }

            if (strHtmlList) {
                if (this.display == false) {
                    this.show();
                }
            } else if (this.display == true) {
                this.hide();
            }
        }

        /**
         * 创建下拉面板
         * 方法私有
         * @return {Object} 返回当前输入框元素
         */
        create () {
            // list属性值需要和创建的列表元素id对应获取

            // 原生HTML5应该是对应datalist元素
            // 但1. datalist无法自定义UI; 2. IE9-不支持；3. 一些bug存在
            // 所以，我们使用普通的ul列表元素模拟
            if (!this.element.target) {
                // 看看是否有list属性值
                let strId = this.element.datalist?.id;
                if (!strId) {
                    // 如果没有关联id，创建之
                    strId = `lulu_${Math.random()}`.replace('0.', '');
                    // 设置关联id
                    this.setAttribute('data-target', strId);
                }

                const eleTarget = document.createElement('div');
                eleTarget.classList.add(CL);
                eleTarget.addEventListener('click', (event) => {
                    if (event.touches?.length) {
                        event = event.touches[0];
                    }

                    if (!event.target) {
                        return;
                    }

                    const eleClicked = event.target.closest('li');

                    if (eleClicked && eleClicked.classList.contains(DISABLED) == false) {
                        const strIndex = eleClicked.getAttribute('data-index');
                        this.params.index = Number(strIndex);
                        // 赋值并关闭列表
                        this.val(this.datalist[this.params.index]);
                        this.hide();

                        this.dispatchEvent(new CustomEvent('select', {
                            detail: this.datalist[this.params.index]
                        }));
                    }
                });

                // 方便区分不同的数据列表
                if (this.id) {
                    eleTarget.classList.add(
                        CL.add(
                            this.id
                                .replace(
                                    /[A-Z]/g,
                                    (matches) => `-${matches.toLowerCase()}`
                                )
                                .replace(/^-+|-+$/g, '')
                        )
                    );
                }
                // 载入页面
                document.body.appendChild(eleTarget);

                // 元素暴露
                this.element.target = eleTarget;

                // 默认display态
                this.display = false;

                this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
            }

            return this;
        }

        /**
         * 输入框赋值或者取值
         * @param  {String} value 赋予输入框的值，如果缺省，则表示取值
         * @param  {String} label 赋予输入框的值，如果缺省，则表示取值
         * @return {Object}       返回当前输入框元素
         */
        val (props = {}) {
            const {value} = props;
            // 元素们

            if (typeof value == 'undefined') {
                // 取值
                return Datalist.encodeHTML(this.value.trim());
            }

            const strValue = value.toString();

            // 赋值
            this.value = Datalist.decodeHTML(Datalist.stripHTML(strValue.trim()));

            // 事件
            if (strValue != this.oldValue) {
                // 赋值时候触发的回调事件们
                this.dispatchEvent(
                    new CustomEvent('change', {
                        bubbles: true,
                        detail: {...props}
                    })
                );
                // 由于输入框可输入，因此input事件是一定要触发的
                this.dispatchEvent(
                    new CustomEvent('input', {
                        bubbles: true,
                        detail: {...props}
                    })
                );
            }

            this.oldValue = strValue;

            return this;
        }

        /**
         * 一些事件
         * @return {Object} 返回当前输入框元素
         */
        events () {
            // 事件
            // 元素们
            if (document.activeElement != this) {
                this.isFocus = false;
            }

            this.addEventListener('blur', function () {
                this.isFocus = false;
            });

            this.addEventListener('focus', function () {
                if (window.isKeyEvent) {
                    this.click();
                }
            });

            this.addEventListener('click', () => {
                if (this.display == false) {
                    // autocomplete模式不执行占位符交互
                    if (this.params.placeholder === true) {
                        this.focusValue = this.value.trim();
                        if (this.focusValue) {
                            this.setAttribute('placeholder', this.focusValue);
                        }
                        this.value = '';
                    }

                    if (this.params.twice == true && this.isFocus == true) {
                        this.refresh();
                    } else if (!this.params.twice) {
                        this.refresh();
                    }
                }

                this.isFocus = true;
            });

            this.addEventListener('input', (event) => {
                if (event.isTrusted === false) {
                    return;
                }
                // 输入行为的时候，如果内容为空，内隐藏列表
                if (this.params.placeholder == true || this.value.trim()) {
                    this.refresh();
                } else {
                    this.hide();
                }
            });

            this.addEventListener('keydown', (event) => {
                // data为当前列表使用的数据
                // index表示当前选中列表的索引值
                let arrData = this.datalist;
                let numIndex = this.params.index;

                // 面板元素
                const eleTarget = this.element.target;

                if (!eleTarget) return;

                const eleSelected = eleTarget.querySelector(`.${SELECTED}`);

                switch (event.code) {
                    case 'Escape':
                    case 'Enter': {
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
                                    const eleInput = this;
                                    if (this.setSelectionRange) {
                                        try {
                                            // 部分输入框类型，例如email, number不支持selection
                                            eleInput.setSelectionRange(
                                                eleInput.value.length,
                                                eleInput.value.length
                                            );
                                        } catch (e) {
                                            eleInput.value = eleInput.value;
                                        }
                                    } else {
                                        eleInput.value = eleInput.value;
                                    }

                                    // 触发Validate.js中的验证
                                    eleInput.dispatchEvent(
                                        new CustomEvent('input', {
                                            bubbles: true,
                                            detail: arrData[numIndex]
                                        })
                                    );
                                }, 17);
                            }
                        }

                        break;
                    }
                    case 'ArrowUp':
                    case 'ArrowDown': {
                        // UP-38
                        if (this.display == true && arrData?.length) {
                            event.preventDefault();

                            // 过滤出可以用来选中的索引
                            const arrIndexMatchAble = [];
                            arrData.forEach((objData, numIndexMatch) => {
                                if (
                                    !objData[DISABLED] &&
                                    objData[DISABLED] !== ''
                                ) {
                                    arrIndexMatchAble.push(numIndexMatch);
                                }
                            });

                            // 全部列表都禁用，忽略
                            if (arrIndexMatchAble.length == 0) return;

                            // 然后索引往后挪一位
                            let numIndexFilterMatch = arrIndexMatchAble.indexOf(
                                numIndex
                            );

                            if (event.code == 'ArrowUp') {
                                numIndexFilterMatch--;
                            } else {
                                numIndexFilterMatch++;
                            }

                            if (numIndexFilterMatch < 0) {
                                numIndex =
                                    arrIndexMatchAble[
                                        arrIndexMatchAble.length - 1
                                    ];
                            } else if (
                                numIndexFilterMatch >
                                arrIndexMatchAble.length - 1
                            ) {
                                numIndex = arrIndexMatchAble[0];
                            } else {
                                numIndex =
                                    arrIndexMatchAble[numIndexFilterMatch];
                            }
                        }

                        // 上下键的时候，列表数据不动态获取和过滤
                        if (arrData[numIndex]) {
                            const curValue = arrData[numIndex];
                            this.val(curValue);
                        }

                        this.select();

                        this.refresh(arrData);

                        break;
                    }
                    case 'Delete': {
                        // DELETE-46
                        if (
                            this.display == true &&
                            this.params.twice == true &&
                            eleSelected
                        ) {
                            let strValueSelected = eleSelected.getAttribute(
                                'data-value'
                            );
                            // 清除本地存储内容
                            this.removeStore(strValueSelected);
                            // data中对应对象删除
                            arrData = arrData.filter(
                                (objData) => objData.value != strValueSelected
                            );
                            // 阻止默认删除行为
                            event.preventDefault();

                            // 获取现在应该显示的值
                            const objDataLeave =
                                arrData[numIndex] || arrData[numIndex - 1];
                            if (objDataLeave) {
                                this.val(objDataLeave.value);
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
            });

            // 表单记忆，模拟原生autocomplete行为
            if (this.form && this.params.data == 'auto' && this.name && (this.autocomplete == '' || this.autocomplete == 'on')) {
                this.form.addEventListener('submit', () => {
                    this.store();
                });
            }

            // 点击空白处隐藏
            document.addEventListener(objEventType.end, (event) => {
                if (event.touches && event.touches.length) {
                    event = event.touches[0];
                }

                const eleClicked = event.target;
                const eleTarget = this.element.target;

                if (
                    eleTarget &&
                    eleClicked.nodeType == 1 &&
                    eleTarget.contains(eleClicked) == false
                ) {
                    this.hide();
                }

                if (eleClicked != this && this.value.trim() == '') {
                    if (this.focusValue) {
                        this.value = this.focusValue;
                    } else if (typeof this.params.placeholder == 'string' && this.params.placeholder !== 'auto') {
                        this.setAttribute('placeholder', this.params.placeholder);
                    }
                }
            });

            // 浏览器窗口改变重定位
            window.addEventListener('resize', () => {
                if (this.display == true) {
                    this.position();
                }
            });

            return this;
        }

        /**
         * 下拉面板的定位
         * @return {Object} 返回当前实例
         */
        position () {
            // 元素们
            const eleTarget = this.element.target;

            if (this && eleTarget) {
                this.follow(eleTarget);

                if (this.display == true) {
                    this.classList.add(ACTIVE);
                }
            }

            // 列表的定位
            return this;
        }

        /**
         * 下拉面板显示
         * @return {Object} 返回当前实例
         */
        show () {
            // 元素们
            let eleTarget = this.element.target;

            if (!eleTarget) {
                this.create();
                eleTarget = this.element.target;
            }

            // 当前的显示状态
            const isDisplay = this.display;

            // 列表的宽度
            let numWidthTarget = this.params.width;
            const numWidthTrigger =
                this.getBoundingClientRect().width ||
                this.clientWidth;

            if (numWidthTarget == 'auto') {
                numWidthTarget = numWidthTrigger;
            } else if (typeof numWidthTarget == 'function') {
                numWidthTarget = numWidthTarget.call(
                    this,
                    eleTarget
                );
            }

            if (numWidthTarget != 'auto' && typeof numWidthTarget != 'number') {
                numWidthTarget = numWidthTrigger;
            }

            eleTarget.style.display = 'block';
            eleTarget.style.width = numWidthTarget + 'px';

            if (
                typeof eleTarget.lastScrollTop == 'number' &&
                eleTarget.querySelector('ul')
            ) {
                eleTarget.querySelector('ul').scrollTop =
                    eleTarget.lastScrollTop;
            }

            // 显示状态标记
            this.display = true;

            // 定位
            this.position();

            // 显示回调，当之前隐藏时候才触发
            if (isDisplay == false) {
                this.dispatchEvent(new CustomEvent('show', {
                    detail: {
                        type: 'ui-datalist'
                    }
                }));
            }
        }

        /**
         * 下拉面板隐藏
         * @return {Object} 返回当前实例
         */
        hide () {
            // 元素们
            const eleTarget = this.element.target;

            if (eleTarget && this.display == true) {
                // 记住滚动高度
                if (eleTarget.querySelector('ul')) {
                    eleTarget.lastScrollTop = eleTarget.querySelector(
                        'ul'
                    ).scrollTop;
                }

                eleTarget.style.display = 'none';
                eleTarget.classList.remove(REVERSE);

                // 隐藏回调
                this.dispatchEvent(new CustomEvent('hide', {
                    detail: {
                        type: 'ui-datalist'
                    }
                }));
            }

            this.classList.remove(ACTIVE);
            this.classList.remove(REVERSE);

            // 隐藏状态标记
            this.display = false;
        }

        // 元素进入页面时候的生命周期函数执行
        connectedCallback () {
            this.params = Object.assign(this.params, {
                filter (data, value) {
                    // this是当前输入框元素
                    const arr = [];

                    if (!data || !data.forEach) {
                        return arr;
                    }

                    // 默认是从头到尾完全字符匹配
                    data.forEach(function (obj) {
                        if (!value || obj.value.indexOf(value) == 0) {
                            arr.push(obj);
                        }
                    });

                    return arr;
                },
                encode: true,
                index: -1,
                data: 'auto',
                // 默认值是'auto'，还支持true/和false
                placeholder: 'auto',
                width: 'auto'
            });

            // 记住输入框默认的placeholder值
            const strAttrPlaceholder = this.getAttribute('placeholder');
            if (strAttrPlaceholder) {
                this.params.placeholder = strAttrPlaceholder;
            }
            this.display = false;
            // 占位符交互标示量
            if (this.params.placeholder == 'auto') {
                this.params.placeholder = true;
            }
            // 事件绑定
            this.events();
            // 列表数据的格式转换
            this.convertData();
            // 去掉浏览器原生的行为
            // 务必灭了浏览器内置的autocomplete 谷歌off 会带出密码
            if (this.form) {
                this.setAttribute('autocomplete', 'off');
            } else {
                this.setAttribute('autocomplete', 'new-password');
            }

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-datalist'
                }
            }));
        }
    }

    return Datalist;
})();

if (!customElements.get('ui-datalist')) {
    customElements.define('ui-datalist', Datalist, {
        extends: 'input'
    });
}

export default Datalist;
