/**
 * @Validate.js
 * @author zhangxinxu
 * @version
 * Created: 15-08-19
 * @edited: 20-08-17 edit by wanghao
 */

/**
 * 基于HTML5规范的表单验证方法
 * 根据原生属性:type, required, min, max, minlength, maxlength, step, pattern等属性进行验证
 * 使用原生checkValidity方法名，以及{
    badInput: false
    customError: false
    patternMismatch: false
    rangeOverflow: false
    rangeUnderflow: false
    stepMismatch: false
    tooLong: false
    tooShort: false
    typeMismatch: false
    valid: true
    valueMissing: false
   }
   等参数名。
 * 支持new实例构造，例如：
 * new Validate(el, options);
 * 很多验证规则基于其他UI组件特征
 */

import './ErrorTip.js';

const Validate = (() => {
    // 全角转半角方法
    window.DBC2SBC = (str) => {
        let result = '';
        let i, code;
        for (i = 0; i < str.length; i++) {
            code = str.charCodeAt(i);
            if (code >= 65281 && code <= 65373) {
                result += String.fromCharCode(str.charCodeAt(i) - 65248);
            } else if (code == 12288) {
                result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32);
            } else {
                result += str.charAt(i);
            }
        }

        return result;
    };

    // 滚动到顶部缓动实现
    // rate表示缓动速率，默认是2
    window.scrollTopTo = (top, callback) => {
        let scrollTop = document.scrollingElement.scrollTop;
        const rate = 2;

        const funTop = () => {
            scrollTop = scrollTop + (top - scrollTop) / rate;

            // 临界判断，终止动画
            if (Math.abs(scrollTop - top) <= 1) {
                document.scrollingElement.scrollTop = top;
                callback && callback();
                return;
            }
            document.scrollingElement.scrollTop = scrollTop;
            // 动画gogogo!
            requestAnimationFrame(funTop);
        };
        funTop();
    };

    // 一些全局的属性和方法
    document.validate = (function () {
        return {
            reg: {
                email: '^[a-z0-9._%-]+@([a-z0-9-]+\\.)+[a-z]{2,4}$',
                number: '^\\-?\\d+(\\.\\d+)?$',
                url: "^(http|https)\\:\\/\\/[a-z0-9\\-\\.]+\\.[a-z]{2,3}(:[a-z0-9]*)?\\/?([a-z0-9\\-\\._\\:\\?\\,\\'\\/\\\\\\+&amp;%\\$#\\=~])*$",
                tel: '^1\\d{10}$',
                zipcode: '^\\d{6}$',
                date: '^\\d{4}\\-(0\\d|1[0-2])\\-([0-2]\\d|3[0-1])$',
                time: '^[0-2]\\d\\:[0-5]\\d$',
                hour: '^[0-2]\\d\\:00$',
                minute: '^[0-2]\\d\\:[0-5]\\d$',
                'date-range': '^\\d{4}(\\-\\d{2}){2}\\s至\\s\\d{4}(\\-\\d{2}){2}$',
                'month-range': '^\\d{4}\\-\\d{2}\\s至\\s\\d{4}\\-\\d{2}$'
            },

            name: {
                email: '邮箱',
                tel: '手机号码',
                url: '网址',
                zipcode: '邮编',
                password: '密码',
                number: '数值',
                range: '数值',
                date: '日期',
                year: '年份',
                month: '月份',
                hour: '小时',
                minute: '分钟',
                time: '时间',
                datetime: '日期时间',
                'date-range': '日期范围',
                'month-range': '月份范围'
            },

            // 选中某范围文字内容的拓展方法
            selectRange (element, start, end) {
                if (!element) {
                    return;
                }
                if (element.createTextRange) {
                    const objRange = element.createTextRange();
                    objRange.collapse(true);
                    objRange.moveEnd('character', end);
                    objRange.moveStart('character', start);
                    objRange.select();
                } else if (element.focus) {
                    element.focus();
                    element.setSelectionRange(start, end);
                }
            },

            // 电话号码过滤成符合要求的号码，省去用户自己处理
            // 例如我们从某个地方复制电话号码，可能是短横线相连
            // 或者前面带+86
            getTel (tel) {
                let strTel = tel || '';
                strTel = strTel.replace('+86', '');
                // 如果此时剩余所有数字正好11位
                if (strTel.match(/\d/) && strTel.match(/\d/g).length == 11) {
                    strTel = strTel.replace(/\D/g, '');
                }
                return strTel;
            },

            // 获得字符长度
            // @element  Object   input/textarea表单控件元素
            // @max  Number   返回满足最大值时候的真实字符长度
            getLength (element, max) {
                if (element.type == 'password') {
                    return max ? max : element.value.length;
                }
                // 语言属性和trim后的值
                const strAttrLang = element.getAttribute('lang');
                const strValue = element.value.trim();
                if (!strAttrLang) {
                    return max ? max : strValue.length;
                }
                if (strValue == '') {
                    return 0;
                }

                // 中文和英文计算字符个数的比例
                let numRatioCh = 1;
                let numRatioEn = 1;

                if (/zh/i.test(strAttrLang)) {
                    // 1个英文半个字符
                    numRatioEn = 0.5;
                } else if (/en/i.test(strAttrLang)) {
                    // 1个中文2个字符
                    numRatioCh = 2;
                }

                // 下面是中文或全角等字符正则
                if (!max) {
                    const lenOriginCh = strValue.replace(/[\x00-\xff]/g, '').length;
                    const lenOriginEn = strValue.length - lenOriginCh;

                    // 根据比例返回最终长度
                    return Math.ceil(lenOriginEn * numRatioEn) + Math.ceil(lenOriginCh * numRatioCh);
                }
                let numStart = 0;
                let lenMatch = max;

                strValue.split('').forEach((letter, index) => {
                    if (numStart >= max) {
                        return;
                    }
                    if (/[\x00-\xff]/.test(letter)) {
                        // 如果字符是中文或全角
                        numStart += numRatioEn;
                    } else {
                        // 如果字符是英文
                        numStart += numRatioCh;
                    }

                    if (numStart >= max) {
                        lenMatch = index + 1;
                    }
                });

                return lenMatch;
            },

            // 获得并重置type
            getType (element) {
                // 控件的类型
                // 这里不能直接element.type获取，否则，类似email类型直接就是text类型
                // 但是，有些元素的type是隐式的，例如textarea，因此element.type还是需要的
                const strAttrType = element.getAttribute('type');
                let strType = strAttrType || element.type || '';

                if (strType == 'select-one') {
                    strType = 'select';
                }

                return strType;
            },

            /**
             * 返回对应的提示信息
             * @param  {[type]} element 提示元素
             * @return {String}         返回对应的提示信息
             */
            getReportText (element) {
                const defaultPrompt = {
                    name: this.name,
                    badInput: '值无效',
                    customError: '包含错误',
                    patternMismatch: {
                        pattern: '内容格式不符合要求',
                        multiple: '某项内容格式不符合要求'
                    },
                    valueMissing: {
                        radio: '请选择一个选项',
                        checkbox: '如果要继续，请选中此框',
                        select: '请选择列表中的一项',
                        'select-one': '请选择列表中的一项',
                        empty: '请填写此字段'
                    },
                    rangeOverflow: '值偏大',
                    rangeUnderflow: '值偏小',
                    stepMismatch: '值不在间隔要求范围内',
                    tooLong: '内容长度偏大',
                    tooShort: '内容长度偏小',
                    typeMismatch: '值和输入框类型不匹配'
                };

                if (!element) {
                    return '';
                }

                // 验证信息
                const objValidateState = element.validity;

                // 如果没有错误，没有任何返回
                if (objValidateState.valid == true) {
                    return '';
                }

                // 最终的提示文字
                let strFinalText = '';

                // 元素的id, type等
                const strId = element.id;
                const strType = this.getType(element);

                // 元素上自定义的提示信息
                // 元素存储的提示信息，主要是自定义方法返回的自定义提示
                const customValidate = element.customValidate || {};
                const optionPrompt = customValidate.report || {};

                // 错误提示关键字
                const strName = defaultPrompt.name[strType] || (function () {
                    if (!customValidate.label || !strId || /checkbox|radio/.test(strType)) {
                        return;
                    }
                    let strTextLabel = '';
                    // 从label动态获取提示数据
                    document.querySelectorAll('label[for=' + strId + ']').forEach(function (eleLabel) {
                        const eleLabelClone = eleLabel.cloneNode(true);
                        // 只使用裸露的文字作为提示关键字
                        [].slice.call(eleLabelClone.children).forEach(function (eleChild) {
                            eleChild.remove();
                        });

                        // 去除数字和冒号
                        const strLabelCloneText = eleLabelClone.innerHTML.trim().replace(/\d/g, '').replace('：', '');
                        // 内容最长的那个元素作为提示文字
                        if (strLabelCloneText.length > strTextLabel.length) {
                            strTextLabel = strLabelCloneText;
                        }
                    });
                    // 提示关键字显然不会小于2个字
                    // 不会是纯数字
                    if (strTextLabel.length >= 2) {
                        return strTextLabel;
                    }
                })();

                // 开始一个一个确认提示
                if (objValidateState.valueMissing) {
                    strFinalText = optionPrompt.valueMissing;
                    // 如果没有对应的自定义提示
                    if (!strFinalText) {
                        // 则使用默认的提示：
                        // 1. 根据类型关键字组装的提示
                        if (strType && strName) {
                            if (strType != 'select') {
                                strFinalText = strName + '不能为空';
                            } else {
                                strFinalText = '您尚未选择' + strName;
                            }
                        } else {
                            // 2. 默认的missing几个错误提示
                            strFinalText = defaultPrompt.valueMissing[strType];
                        }

                        strFinalText = strFinalText || defaultPrompt.valueMissing.empty;
                    }
                } else if (objValidateState.patternMismatch) {
                    // 首先，优先使用自定义提示是一样的
                    strFinalText = optionPrompt.patternMismatch;

                    if (!strFinalText) {
                        // 然后确定是否是多值
                        const isMultiple = element.hasAttribute('multiple') && element.value.split(',').length > 1;

                        strFinalText = defaultPrompt.patternMismatch[isMultiple ? 'multiple' : 'pattern'];
                        // 然后
                        if (strType && strName) {
                            // 1. 试试关键字提示
                            strFinalText = strName + strFinalText;
                        }
                    }
                } else if (objValidateState.badInput) {
                    // 优先使用自定义提示是一样的
                    strFinalText = optionPrompt.badInput;

                    if (!strFinalText) {
                        strFinalText = (strName || '') + defaultPrompt.badInput;
                    }
                } else if (objValidateState.typeMismatch) {
                    // 优先使用自定义提示是一样的
                    strFinalText = optionPrompt.typeMismatch;

                    if (!strFinalText) {
                        strFinalText = defaultPrompt.typeMismatch;
                        if (strName) {
                            strFinalText = strFinalText.replace('输入框', strName);
                        }
                    }
                } else if (objValidateState.rangeUnderflow || objValidateState.rangeOverflow) {
                    // 先看看有没有自定义的提示
                    strFinalText = optionPrompt.rangeUnderflow || optionPrompt.rangeOverflow;

                    if (!strFinalText && strType && strName) {
                        let strMin = element.getAttribute('min');
                        let strMax = element.getAttribute('max');

                        if (strType == 'month-range') {
                            strMin = strMin.slice(0, 7);
                            strMax = strMax.slice(0, 7);
                        }

                        const strTextBigger = '必须要大于或等于' + strMin;
                        const strTextSmall = '必须要小于或等于' + strMax;

                        // 同时范围超出，一定是日期范围
                        if (objValidateState.rangeUnderflow && objValidateState.rangeOverflow) {
                            strFinalText = '起始日期' + strTextBigger + '，结束日期' + strTextSmall;
                        } else if (objValidateState.rangeUnderflow) {
                            strFinalText = strName + strTextBigger;
                            // 如果是日期范围
                            if (strType.slice(-6) == '-range') {
                                strFinalText = '起始日期' + strTextBigger;
                            }
                        } else {
                            strFinalText = strName + strTextSmall;
                            // 如果是日期范围
                            if (strType.slice(-6) == '-range') {
                                strFinalText = '结束日期' + strTextSmall;
                            }
                        }
                    }

                    strFinalText = strFinalText || '值不在要求的范围内';
                } else if (objValidateState.stepMismatch) {
                    // 优先使用自定义提示是一样的
                    strFinalText = optionPrompt.stepMismatch;

                    if (!strFinalText) {
                        const numMin = element.getAttribute('min') * 1;
                        const numMax = element.getAttribute('max') * 1;
                        const numStep = element.getAttribute('step') * 1 || 1;

                        if (strType == 'number' || strType == 'range') {
                            strFinalText = '请输入有效的值。两个最接近的有效值是' + (function () {
                                const numValue = element.value.trim() * 1;
                                let numClosest = numMin;
                                for (let start = numMin; start < numMax; start += numStep) {
                                    if (start < numValue && (start + numStep) > numValue) {
                                        numClosest = start;
                                        break;
                                    }
                                }

                                return [numClosest, numClosest + numStep].join('和');
                            })();
                        } else {
                            strFinalText = '请' + (element.hasAttribute('readonly') ? '选择' : '输入') + '有效的值。' + (strName || '') + '间隔是' + numStep;
                        }
                    }

                    strFinalText = strFinalText || defaultPrompt.stepMismatch;
                } else if (objValidateState.tooLong || objValidateState.tooShort) {
                    // 输入内容太多或太少
                    const strAttrLang = element.getAttribute('lang');
                    let strTextCharLength = '';

                    if (/zh/i.test(strAttrLang)) {
                        strTextCharLength = '个汉字(2字母=1汉字)';
                    } else if (/en/i.test(strAttrLang)) {
                        strTextCharLength = '个字符(1汉字=2字符)';
                    }

                    if (objValidateState.tooLong) {
                        // 先看看有没有自定义的提示
                        strFinalText = optionPrompt.tooLong;

                        if (!strFinalText) {
                            const strMaxLength = element.maxlength || element.getAttribute('maxlength');

                            strFinalText = (strName || '') + '内容长度不能大于' + strMaxLength.replace(/\D/g, '') + strTextCharLength;
                        }
                    } else {
                        // 先看看有没有自定义的提示
                        strFinalText = optionPrompt.tooShort;
                        if (!strFinalText) {
                            const strMinLength = element.getAttribute('minlength');

                            strFinalText = '内容长度不能小于' + strMinLength + strTextCharLength;
                        }
                    }
                } else if (objValidateState.customError) {
                    // 先看看有没有自定义的提示
                    strFinalText = optionPrompt.customError || defaultPrompt.customError;
                }

                if (typeof strFinalText == 'function') {
                    strFinalText = strFinalText.call(element, element);
                }

                return strFinalText;
            },

            /*
            ** 验证一般包括下面几个个方向：
            ** 1. 是否required同时值为空
            ** 2. 是否数据匹配错误(pattern, type)
            ** 3. 是否超出范围(min/max/step)
            ** 4. 内容超出限制(minlength, maxlength)
            ** 下面的这些方法就是上面3个方向判断
            ** 其中，参数element为DOM对象
            ** 返回数据规则如下：
            ** 如果没有把柄，返回false;
            ** 如果真的有误，则返回错误类别：{
                  type: ''
               }
            */

            /**
             * 判断元素是否为空的验证
             * @param  Element  element 验证的DOM元素
             * @return Object           返回验证的状态对象
             */
            getMissingState (element) {
                const objValidateState = {
                    valueMissing: false
                };

                // 主要针对required必填或必选属性的验证
                if (!element || element.disabled) {
                    return objValidateState;
                }

                // 类型
                const strType = this.getType(element);

                // 此时的值才是准确的值（浏览器可能会忽略文本框中的值，例如number类型输入框中的不合法数值）
                let strValue = element.value;

                if (element.hasAttribute('required')) {
                    // 根据控件类型进行验证
                    // 1. 单复选框比较特殊，先处理下
                    if (strType == 'radio') {
                        // 单选框，只需验证是否必选，同一name单选组只有要一个设置required即可
                        let eleRadios = [element];
                        const eleForm = element.closest('form') || element.parentElement.parentElement;

                        if (element.name && eleForm) {
                            eleRadios = eleForm.querySelectorAll('input[type="radio"][name="' + element.name + '"]');
                        }

                        // 如果单选框们没有一个选中，则认为无视了required属性
                        const isAtLeastOneRadioChecked = [].slice.call(eleRadios).some(function (eleRadio) {
                            return eleRadio.checked;
                        });

                        if (isAtLeastOneRadioChecked == false) {
                            // 没有一个单选框选中
                            objValidateState.valueMissing = true;
                        }

                        return objValidateState;
                    } else if (strType == 'checkbox') {
                        // 复选框是每一个都必须选中
                        if (element.checked == false) {
                            objValidateState.valueMissing = true;
                        }

                        return objValidateState;
                    } else if (strType != 'password') {
                        strValue = strValue.trim();
                    }

                    if (strValue == '') {
                        // 重新赋值
                        element.value = '';

                        // 返回验证结果
                        objValidateState.valueMissing = true;
                    }
                }

                return objValidateState;
            },

            /**
             * 判断元素是否为空的验证
             * @param  {Element}  element 验证的DOM元素
             * @return {Boolean|Object} 返回验证通过布尔值或者出错信息对象
             */
            isMissing (element) {
                return this.getMissingState(element).valueMissing;
            },

            /**
             * 返回元素值的合法状态
             * @param  {Element}  element 验证的DOM元素
             * @param  {RegExp}  regex 验证的正则
             * @return {Boolean|Object} 返回验证通过布尔值或者出错信息对象
             */
            getMismatchState (element, regex, params) {
                const objValidateState = {
                    patternMismatch: false,
                    typeMismatch: false
                };

                // 禁用元素不参与验证
                if (!element || element.disabled) {
                    return false;
                }

                // 原始值和处理值
                const strInputValue = element.value;
                let strDealValue = strInputValue;

                // 类型
                const strType = this.getType(element);

                // 特殊控件不参与验证
                if (/^radio|checkbox|select$/i.test(strType)) {
                    return objValidateState;
                }

                // 全角半角以及前后空格的处理
                // 适用于type=url/email/tel/zipcode/number/date/time等
                if (strType != 'password') {
                    strDealValue = strInputValue.trim();
                }
                if (/^text|textarea|password$/i.test(strType) == false) {
                    strDealValue = window.DBC2SBC(strDealValue);
                }
                if (strType == 'tel') {
                    strDealValue = this.getTel(strDealValue);
                }

                // 文本框值改变，重新赋值
                // 即时验证的时候，不赋值，否则，无法输入空格
                if (document.validate.focusable !== false && document.validate.focusable !== 0 && strDealValue != strInputValue) {
                    element.value = strDealValue;
                }

                // 如果没有值，则认为通过，没有错误
                if (strDealValue == '') {
                    return objValidateState;
                }

                // 获取正则表达式，pattern属性获取优先，然后通过type类型匹配。
                // 注意，不处理为空的情况
                regex = regex ||
                    (function () {
                        return element.getAttribute('pattern');
                    })() ||
                    (function () {
                        // 文本框类型处理，可能有管道符——多类型重叠，如手机或邮箱
                        return strType && strType.split('|').map(function (strTypeSplit) {
                            const regMatch = document.validate.reg[strTypeSplit];
                            if (regMatch) {
                                return regMatch;
                            }
                        }).join('|');
                    })();

                // 如果没有正则匹配的表达式，就没有验证的说法，认为出错为false
                if (!regex) {
                    return objValidateState;
                }

                // multiple多数据的处理
                const isMultiple = element.hasAttribute('multiple');
                const regNew = new RegExp(regex, params || 'i');

                // 正则验证标志量
                let isAllPass = true;

                // number,range等类型下multiple是无效的
                if (isMultiple && /^number|range$/i.test(strType) == false) {
                    strDealValue.split(',').forEach(function (partValue) {
                        partValue = partValue.trim();
                        if (isAllPass && !regNew.test(partValue)) {
                            isAllPass = false;
                        }
                    });
                } else {
                    isAllPass = regNew.test(strDealValue);
                }

                // 根据pattern判断类型
                if (isAllPass == false) {
                    if (element.hasAttribute('pattern')) {
                        objValidateState.patternMismatch = true;
                    } else {
                        objValidateState.typeMismatch = true;
                    }
                }

                return objValidateState;
            },


            /**
             * 判断元素值的合法性
             * @param  {Element}  element 验证的DOM元素
             * @param  {RegExp}  regex 验证的正则
             * @return {Boolean|Object} 返回验证通过布尔值或者出错信息对象
             */
            isMismatch (element, regex, params) {
                const objValidateState = this.getMismatchState(element, regex, params);

                return objValidateState.patternMismatch || objValidateState.typeMismatch;
            },

            /**
             * 判断数值或日期范围超出
             * @param  {Element}  element 验证的DOM元素
             * @return {Boolean|Object} 返回验证状态对象
             */
            getRangeState (element) {
                const objValidateState = {
                    badInput: false,
                    rangeOverflow: false,
                    rangeUnderflow: false,
                    stepMismatch: false
                };

                // 是否数值或日期范围超出
                if (!element || element.disabled) {
                    return objValidateState;
                }

                // 类型和值
                const strType = this.getType(element);
                let strValue = element.value.trim();

                if (/radio|checkbox|select|textarea/i.test(strType) || strValue == '') {
                    return objValidateState;
                }

                let strAttrMin = element.getAttribute('min');
                let strAttrMax = element.getAttribute('max');
                const strAttrStep = Number(element.getAttribute('step')) || 1;


                if ((strType == 'number' || strType == 'range') && !/[-+]?[0-9]/.test(strValue)) {
                    objValidateState.badInput = true;
                }

                if (strType.slice(-6) != '-range') {
                    if (strValue == '0' || Number(strValue) == strValue) {
                        strValue = strValue * 1;
                    }
                    if (strAttrMin && strValue < strAttrMin) {
                        objValidateState.rangeUnderflow = true;
                    }
                    if (strAttrMax && strValue > strAttrMax) {
                        objValidateState.rangeOverflow = true;
                    }

                    // number, range类型的范围
                    if ((strType == 'number' || strType == 'range') && strAttrStep && strAttrMin &&
                        !/^\d+$/.test(Math.abs(strValue - strAttrMin) / strAttrStep)
                    ) {
                        objValidateState.stepMismatch = true;
                    }
                    // hour, minute, time类型的范围
                    if ((strType == 'hour' || strType == 'minute' || strType == 'time') && strAttrMin && strAttrStep) {
                        const minuteValue = strValue.split(':')[1];
                        const minuteMin = strAttrMin.split(':')[1];

                        if (strType == 'hour' && (minuteValue != minuteMin || (strValue.split(':')[0] - strAttrMin.split(':')[0]) % strAttrStep != 0)) {
                            // 小时，则是分钟要一致，小时数正好step
                            objValidateState.stepMismatch = true;
                        } else if ((minuteValue - minuteMin) % strAttrStep !== 0) {
                            objValidateState.stepMismatch = true;
                        }
                    }
                } else {
                    // 时间范围
                    const arrSplitValue = strValue.split(' ');

                    // 防止month-range时候，min/max设置的是完整时间，
                    // 如2017-07-07，而不是2017-07
                    if (strType == 'month-range') {
                        strAttrMin = strAttrMin && strAttrMin.slice(0, 7);
                        strAttrMax = strAttrMax && strAttrMax.slice(0, 7);
                    }

                    if (arrSplitValue.length == 3) {
                        if (strAttrMin && arrSplitValue[0] < strAttrMin) {
                            objValidateState.rangeUnderflow = true;
                        }
                        if (strAttrMax && arrSplitValue[2] > strAttrMax) {
                            objValidateState.rangeOverflow = true;
                        }
                    }
                }

                return objValidateState;
            },


            /**
             * 判断数值或日期范围超出
             * @param  {Element}  element 验证的DOM元素
             * @return {Boolean|Object} 返回验证通过布尔值或者出错信息对象
             */
            isOut (element) {
                const objValidateState = this.getRangeState(element);

                return objValidateState.badInput || objValidateState.rangeOverflow || objValidateState.rangeUnderflow || objValidateState.stepMismatch;
            },

            /**
             * 内容是否超出长度限制的判断
             * @param  {Element}  element   DOM元素对象
             * @return {Boolean|Object} 返回验证通过布尔值或者出错信息对象
             */
            getLengthState (element) {
                const objValidateState = {
                    tooLong: false,
                    tooShort: false
                };
                // 是否内容长度溢出的判断
                if (!element || element.disabled || /^radio|checkbox|select$/i.test(element.type)) {
                    return objValidateState;
                }

                //  大小限制
                const strAttrMinLength = element.getAttribute('minlength');
                let strAttrMaxLength = element.maxlength || element.getAttribute('maxlength');
                // 值
                const strValue = element.value;

                if (strValue == '') {
                    return objValidateState;
                }

                const numLength = this.getLength(element);

                if (strAttrMinLength && numLength < strAttrMinLength) {
                    objValidateState.tooShort = true;
                }

                if (strAttrMaxLength) {
                    strAttrMaxLength = strAttrMaxLength.replace(/\D/g, '');
                    if (numLength > strAttrMaxLength) {
                        objValidateState.tooLong = true;
                    }
                }

                return objValidateState;
            },

            /**
             * 是否范围超出
             * @param  {[type]}  element [description]
             * @return {Boolean}         [description]
             */
            isOverflow (element) {
                const objValidateState = this.getLengthState(element);
                return objValidateState.tooLong || objValidateState.tooShort;
            },

            /**
             * 自定义验证状态
             * @return {[type]} [description]
             */
            getCustomState (element) {
                const objValidateState = {
                    customError: false
                };
                const customValidate = element.customValidate;

                if (customValidate && typeof customValidate.method == 'function') {
                    const dataResult = customValidate.method.call(customValidate.owner, element);
                    if (dataResult) {
                        objValidateState.customError = true;
                        // 记住自定义提示内容
                        if (typeof dataResult == 'object' && dataResult.customError) {
                            this.setCustomValidity(element, dataResult.customError);
                        } else {
                            this.setCustomValidity(element, dataResult);
                        }
                    }
                }

                return objValidateState;
            },

            /**
             * 设置自定义提示内容
             */
            setCustomValidity (element, content) {
                if (!content) {
                    return;
                }
                if (!element.customValidate) {
                    element.customValidate = {
                        report: {}
                    };
                }
                if (!element.customValidate.report) {
                    element.customValidate.report = {};
                }

                element.customValidate.report.customError = content;
            },

            /**
             * 判断元素验证通过与否
             * @param  Element  element 输入框元素或者表单元素
             * @return {[type]} [description]
             */
            checkValidity (element) {
                // 1. 元素不存在不验证
                // 2. 禁用态表单元素不参与验证
                if (!element || element.disabled) {
                    return true;
                }

                // 3. 提交、重置等元素不参与验证
                const strType = element.getAttribute('type') || element.type;
                const strTag = element.tagName.toLowerCase();

                if (/^button|submit|reset|file|image$/.test(strType) == true || strTag == 'button') {
                    return true;
                }

                if (element.matches('input, select, textarea') == false && element.children) {
                    element = element.querySelectorAll('input, select, textarea');
                }

                if (element.nodeType == 1) {
                    return this.getValidity(element).valid;
                }

                if (element.length) {
                    return [].slice.call(element).every(function (ele) {
                        return this.checkValidity(ele);
                    }.bind(this));
                }

                return true;
            },

            /**
             * 获取元素的验证状态
             * @return {[type]} [description]
             */
            getValidity (element) {
                // 性能优化
                // 如果值不变，且之前已经验证过，
                // 且不是单复选框，则直接返回
                // 避免同一元素短时间多次验证
                if (element.lastValidateState && element.lastValue === element.value && /radio|checkbox/.test(element.type) == false) {
                    return element.lastValidateState;
                }

                // 浏览器原生的状态
                let objValidateState = {
                    badInput: false,
                    customError: false,
                    patternMismatch: false,
                    rangeOverflow: false,
                    rangeUnderflow: false,
                    stepMismatch: false,
                    tooLong: false,
                    tooShort: false,
                    typeMismatch: false,
                    valid: true,
                    valueMissing: false
                };

                // 但是，不足以满足实际需求
                objValidateState = Object.assign({},
                    objValidateState,
                    this.getMissingState(element),
                    this.getMismatchState(element),
                    this.getRangeState(element),
                    this.getLengthState(element),
                    this.getCustomState(element)
                );

                let isSomeInvalid = false;

                for (let keyValidate in objValidateState) {
                    if (keyValidate != 'valid' && objValidateState[keyValidate] == true) {
                        isSomeInvalid = true;
                    }
                }

                objValidateState.valid = !isSomeInvalid;

                element.lastValue = element.value;
                element.lastValidateState = objValidateState;

                setTimeout(function () {
                    delete element.lastValidateState;
                }, 1);

                return objValidateState;
            },

            /**
             * 验证并进行错误提示
             * @param  {Element} element 需要显示提示信息的元素
             * @param  {Object}  options 可选参数，主要包括label，以及自定义提示和验证方法
             * @return {[type]}         [description]
             */
            reportValidity (element, content) {
                // 验证并设置结果状态
                content = content || this.getReportText(element);

                // 提示
                this.errorTip(element, content);

                // 认为是成功，隐藏提示
                if (content === '' && element.data && element.data.errorTip) {
                    element.data.errorTip.hide();
                }

                const isPass = !content;

                this.styleError(element, isPass);

                // 根据提示内容判断验证结果
                return isPass;
            },

            /**
             * 出错还是成功的样式处理
             * @param  {[type]} element [description]
             * @param  {[type]} valid   [description]
             * @return {[type]}         [description]
             */
            styleError (element, valid) {
                // 是否有错
                if (!element) {
                    return this;
                }

                if (typeof valid == 'undefined') {
                    valid = element.validity.valid;
                }

                const eleTarget = this.getTarget(element);

                if (!eleTarget) {
                    return valid;
                }

                const eleForm = element.form || element.closest('form') || (element.customValidate && element.customValidate.owner);

                if (element.type == 'radio' && element.name && eleForm) {
                    // 单选框组是整体去除高亮
                    eleForm.querySelectorAll('input[type=radio][name=' + element.name + ']').forEach(function (eleRadio) {
                        const eleTargetRadio = this.getTarget(eleRadio);

                        if (valid) {
                            eleTargetRadio.removeAttribute('is-error');
                            eleTargetRadio.removeAttribute('aria-label');
                        } else {
                            eleTargetRadio.setAttribute('is-error', '');
                        }
                    }.bind(this));
                } else if (valid) {
                    eleTarget.removeAttribute('is-error');
                    eleTarget.removeAttribute('aria-label');
                } else {
                    eleTarget.setAttribute('is-error', '');
                }

                return valid;
            },

            /**
             * 显示出错信息处理
             * @param  {Object} element 出错提示原始元素（这里可能会进行转移）
             * @param  {String} content 出错提示内容
             * @return {Object}         返回当前上下文
             */
            errorTip (element, content) {
                const eleTarget = this.getTarget(element);

                if (!eleTarget || !content) {
                    return this;
                }

                // 如果元素隐藏，也不提示
                const objStyle = window.getComputedStyle(eleTarget);

                if (objStyle.display == 'none' || objStyle.visibility == 'hidden') {
                    return this;
                }

                const funShow = function () {
                    const eleControl = document.validate.errorTip.control;
                    const eleTipTarget = document.validate.errorTip.target;

                    eleTipTarget.errorTip(content, {
                        onShow (eleTrigger, eleTips) {
                            // 如果tips宽度比较小，居左定位
                            // 否则，使用默认的居中
                            const numOffsetX = 0.5 * (eleTips.clientWidth - eleTipTarget.clientWidth);

                            if (numOffsetX < 0) {
                                eleTips.style.marginLeft = 0.5 * (eleTips.clientWidth - eleTipTarget.clientWidth) + 'px';
                            } else {
                                eleTips.style.marginLeft = 0;
                            }

                            // 使提示出现时候不会闪
                            if (document.validate.focusable === false) {
                                eleTips.classList.add('none');
                            } else {
                                eleTips.classList.remove('none');
                            }
                        },
                        onHide (eleTrigger, eleTips) {
                            const eleForm = eleControl.form || eleControl.closest('form');

                            if (!eleForm || !eleForm.isImmediated) {
                                return;
                            }

                            // margin偏移还原，否则其他的出错提示会有定位问题
                            eleTips.style.marginLeft = '';

                            // 即时验证的时候，如果出错了，提示隐藏时候，红色仍然保留
                            document.validate.styleError(eleControl);
                        }
                    });

                    // 即时验证不需要focus与选中
                    // input输入的时候focusable是false
                    // focus时候focusable是0
                    if (document.validate.focusable === false || document.validate.focusable === 0) {
                        return;
                    }

                    // focus状态还原
                    document.validate.focusable = null;

                    if (!document.validate.getType(eleControl)) {
                        return;
                    }

                    // 如果是内容超出，选中超出的文字内容
                    if (content.indexOf('内容长度') != -1 && content.indexOf('大') != -1) {
                        const strValue = eleControl.value;
                        const numLength = strValue.length;
                        // var lang = element.getAttribute('lang');
                        // 中文和英文计算字符个数的比例
                        // var numRatioCh = 1;
                        // var numRatioEn = 1;
                        // if (/zh/i.test(lang)) {
                        //     // 1个英文半个字符
                        //     numRatioEn = 0.5;
                        // } else if (/en/i.test(lang)) {
                        //     // 1个中文2个字符
                        //     numRatioCh = 2;
                        // }
                        // 获得最大长度的索引位置
                        const strAttrMaxLength = eleControl.maxlength || eleControl.getAttribute('maxlength').replace(/\D/g, '');

                        if (numLength && strAttrMaxLength) {
                            document.validate.selectRange(element, document.validate.getLength(element, strAttrMaxLength), numLength);
                        }
                    } else if (eleControl.focus && eleControl.select) {
                        eleControl.focus();
                        eleControl.select();
                    }
                };

                document.validate.errorTip.control = element;
                document.validate.errorTip.target = eleTarget;

                // 1. 首先，确保el在屏幕内，且需要预留tips的显示的足够距离，这里使用50像素
                const objRect = eleTarget.getBoundingClientRect();
                let numScrollTop = -1;
                if (objRect.top < 50) {
                    numScrollTop = window.pageYOffset - (50 - objRect.top);
                } else if (objRect.bottom > window.innerHeight) {
                    numScrollTop = window.pageYOffset + (objRect.bottom - window.innerHeight);
                }

                if (numScrollTop >= 0) {
                    window.scrollTopTo(numScrollTop, funShow);
                } else {
                    funShow();
                }

                return this;
            },

            /**
             * 获得对应展示的元素
             * @param  {Object} el 元素
             * @return {Object}    返回对应的展示元素（可能就是自身）
             */
            getTarget (element) {
                if (!element) {
                    return null;
                }

                let eleTarget = element;

                // 根据原生控件元素，确定真实的自定义控件元素
                // 这里的很多处理跟其他表单UI组件想耦合、关联
                const strType = element.getAttribute('type') || element.type;
                const strId = element.id;
                const strTag = element.tagName.toLowerCase();

                const objStyle = window.getComputedStyle(element);

                // 1. 单复选框
                if (strType == 'radio') {
                    if (objStyle.opacity != '1') {
                        eleTarget = element.parentElement.querySelector('label.ui-radio[for="' + strId + '"]');
                    }
                } else if (strType == 'checkbox') {
                    if (objStyle.opacity != '1') {
                        eleTarget = element.parentElement.querySelector('label.ui-checkbox[for="' + strId + '"]');
                    }
                    // 下拉框
                } else if (strType == 'select' || strTag == 'select') {
                    if (objStyle.opacity != '1') {
                        eleTarget = element.nextElementSibling;
                    }
                    // range范围选择框
                } else if (strType == 'range') {
                    if (objStyle.display == 'none') {
                        eleTarget = element.nextElementSibling;
                    }
                    // 隐藏元素的目标提示元素的转移
                } else if (strType == 'hidden' || objStyle.display == 'none' || objStyle.visibility == 'hidden') {
                    const eleTargetRel = document.getElementById(eleTarget.getAttribute('data-target')) || element.dataTarget;
                    if (eleTargetRel) {
                        eleTarget = document.validate.getTarget(eleTargetRel);
                    }
                } else if (strType == 'textarea' || strTag == 'textarea') {
                    if (element.classList.contains('ui-textarea') == false && element.parentElement.querySelector('.ui-textarea')) {
                        eleTarget = element.parentElement.querySelector('.ui-textarea');
                    }
                } else if (strTag == 'input') {
                    if (element.classList.contains('ui-input') == false && element.parentElement.querySelector('.ui-input')) {
                        eleTarget = element.parentElement.querySelector('.ui-input');
                    }
                }

                return eleTarget;
            }
        };
    })();

    // 重置原生的validity属性和checkValidity方法
    [HTMLInputElement.prototype, HTMLSelectElement.prototype, HTMLTextAreaElement.prototype].forEach(function (prop) {
        Object.defineProperty(prop, 'validity', {
            get () {
                return document.validate.getValidity(this);
            },
            configurable: true
        });

        Object.defineProperty(prop, 'checkValidity', {
            value () {
                return this.validity.valid;
            },
            configurable: true
        });

        Object.defineProperty(prop, 'reportValidity', {
            value (content) {
                return document.validate.reportValidity(this, content);
            },
            configurable: true
        });

        Object.defineProperty(prop, 'setCustomValidity', {
            value (content) {
                if (!content) {
                    return;
                }

                // 浏览器原生的状态
                const arrValidateKey = [
                    'badInput',
                    'customError',
                    'patternMismatch',
                    'rangeOverflow',
                    'rangeUnderflow',
                    'stepMismatch',
                    'tooLong',
                    'tooShort',
                    'typeMismatch',
                    'valueMissing'
                ];

                if (!this.customValidate) {
                    this.customValidate = {};
                }
                if (!this.customValidate.report) {
                    this.customValidate.report = {};
                }

                // 如果content是字符串，则重置所有提示
                if (typeof content == 'string') {
                    arrValidateKey.forEach(function (key) {
                        this.customValidate.report[key] = content;
                    });
                } else if (typeof content == 'object') {
                    Object.assign(this.customValidate.report, content);
                }
            },
            configurable: true
        });
    });

    // 表单元素的checkValidity()方法支持
    Object.defineProperty(HTMLFormElement.prototype, 'checkValidity', {
        value () {
            return document.validate.checkValidity(this);
        },
        configurable: true
    });

    class Component {

        /**
         * 验证实例方法主体
         * @param {Object}   el       通常值验证的表单元素
         * @param {Function} callback 验证成功的回调
         * @param {Object}   options  可选参数
         */
        constructor (element, callback, options) {
            if (typeof element == 'string') {
                element = document.getElementById(element) || document.querySelector(element);
            }
            // el一般指的是form元素
            if (!element) {
                return this;
            }

            const eleForm = element;

            if (eleForm.data && eleForm.data.validate) {
                return eleForm.data.validate;
            }

            // 干掉浏览器默认的验证
            eleForm.setAttribute('novalidate', 'novalidate');

            const defaults = {
                // 提交时候是全部出错红色高亮，还是仅第一个，默认是全部
                multiple: true,
                // 是否开启即时验证
                immediate: true,
                // 是否利用label关联元素的innerHTML作为提示关键字
                label: true,
                // 自定义验证提示与数据
                validate: [
                    // 下面为结构示意
                    /*{
                        id: '',
                        report: {
                            // 源自规范，详见：https://www.zhangxinxu.com/wordpress/?p=8895
                            badInput: '该错误类型对应的提示'
                            customError: '该错误类型对应的提示'
                            patternMismatch: '该错误类型对应的提示'
                            rangeOverflow: '该错误类型对应的提示'
                            rangeUnderflow: '该错误类型对应的提示'
                            stepMismatch: '该错误类型对应的提示'
                            tooLong: '该错误类型对应的提示'
                            tooShort: '该错误类型对应的提示'
                            typeMismatch: '该错误类型对应的提示'
                            valueMissing: '该错误类型对应的提示'
                        },
                        method: function () {}
                    }*/
                ],
                onError () { },
                onSuccess () { }
            };

            const objParams = Object.assign({}, defaults, options || {});

            // 还原禁用的提交和关闭按钮
            eleForm.querySelectorAll('[type="submit"]:disabled, [type="image"]:disabled').forEach(function (eleSubmit) {
                eleSubmit.disabled = false;
            });

            // 干掉默认的提交
            eleForm.addEventListener('submit', (event) => {
                if (this.stopValidate) {
                    return;
                }
                event.preventDefault();

                if (this.checkValidity() && typeof callback == 'function') {
                    callback.call(this, eleForm);
                }

                return false;
            });

            // 暴露的数据
            this.element = {
                form: eleForm
            };

            this.callback = {
                error: objParams.onError,
                success: objParams.onSuccess
            };

            this.params = {
                multiple: objParams.multiple,
                immediate: objParams.immediate,
                label: objParams.label
            };

            // 设置自定义验证
            this.setCustomValidity(objParams.validate);

            // 计数效果
            this.count();

            // 手机号过滤等增强体验功能
            this.enhance();

            if (!eleForm.data) {
                eleForm.data = {};
            }

            eleForm.data.validate = this;

            return this;
        }

        /**
         * 设置自定义提示内容
         */
        setCustomValidity (validate) {
            // 自定义的验证绑定
            let dataValidate = validate || this.dataValidate;
            if (!dataValidate || !this.element || !this.element.form) {
                return this;
            }
            if (typeof dataValidate == 'function') {
                dataValidate = dataValidate();
            }
            // 确保是数组
            if (dataValidate && !dataValidate.forEach && dataValidate.id) {
                dataValidate = [dataValidate];
            }

            // 是否从<label>元素寻找提示关键字
            const isLabel = this.params.label;

            // 遍历元素并匹配
            let eleFormCollection = this.element.form.elements || this.element.form.querySelectorAll('input, textarea, select');

            if (!eleFormCollection.length) {
                return this;
            }

            [...eleFormCollection].forEach(eleInput => {
                const strId = eleInput.id;

                // 是否使用自定义的验证和提示
                let customValidate = {
                    label: isLabel,
                    owner: this
                };

                if (strId && dataValidate && dataValidate.length) {
                    dataValidate.forEach(function (objValidate) {
                        if (objValidate.id == strId) {
                            // 最终的提示文字，是否借助label元素
                            objValidate.label = isLabel;
                            // 实例对象存储
                            objValidate.owner = this;
                            // 自定义验证参数
                            customValidate = objValidate;
                        }
                    }.bind(this));
                }

                // 记住上一次的值
                // 只在初次记住
                if (!this.element.form.data || !this.element.form.data.validate) {
                    eleInput.lastValue = eleInput.value || '';
                }

                // 绑定在元素上
                eleInput.customValidate = customValidate;
            });

            this.dataValidate = validate;
        }

        /**
         * 表单内有计数功能元素的处理
         * 私有
         * @return {Object} 返回当前实例
         */
        count () {
            // 即时验证
            const eleForm = this.element.form;
            // 原生value属性描述符
            const propsInput = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
            const propsTextarea = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
            // 遍历计数元素
            eleForm.querySelectorAll('input, textarea').forEach(function (element) {
                // 对maxlength进行处理
                let strAttrMaxLength = element.getAttribute('maxlength');
                if (strAttrMaxLength) {
                    // 给maxlength设置不合法的值，阻止默认的长度限制
                    try {
                        element.setAttribute('maxlength', '_' + strAttrMaxLength + '_');
                    } catch (e) {
                        // IE7不能设置不合法的maxlength值 %>_<%
                        element.removeAttribute('maxlength');
                        element.maxlength = strAttrMaxLength;
                    }
                }

                // 获得限制大小
                const strAttrMinLength = element.getAttribute('minlength');

                if (!strAttrMaxLength) {
                    return;
                }
                // 过滤非数值字符
                if (strAttrMaxLength) {
                    strAttrMaxLength = strAttrMaxLength.replace(/\D/g, '');
                }

                // 标签名
                const strTag = element.tagName.toLowerCase();
                // 类名
                const CL = {
                    add () {
                        return ['ui', strTag].concat([].slice.call(arguments)).join('-');
                    },
                    toString () {
                        return 'ui-' + strTag;
                    }
                };

                // 有没有label元素
                let eleLabel = element.parentElement.querySelector('.' + CL.add('count')) || eleForm.querySelector('.' + CL.add('count') + '[for="' + element.id + '"]');

                // 如果没有对应label元素，同时不是适合创建label元素的HTML结构，则返回
                if (!eleLabel && !element.parentElement.classList.contains(CL.add('x'))) {
                    return;
                }

                // 元素id必须
                let strId = element.id;
                if (!strId) {
                    // 没有id随机id
                    strId = ('lulu_' + Math.random()).replace('0.', '');
                    element.id = strId;
                }

                // 计数的<label>元素，有则查询，无则新建
                if (!eleLabel) {
                    // 生成并载入计数元素
                    eleLabel = document.createElement('label');
                    eleLabel.className = CL.add('count');
                    eleLabel.setAttribute('for', strId);
                    eleLabel.innerHTML = '<span>0</span><slash>/</slash><span>' + (strAttrMinLength ? strAttrMinLength + '-' : '') + strAttrMaxLength + '</span>';
                    // 插入到后面
                    element.parentElement.appendChild(eleLabel);
                } else if (!eleLabel.hasAttribute('for')) {
                    eleLabel.setAttribute('for', strId);
                }

                const eleMin = eleLabel.querySelector('span') || eleLabel;

                // 计数，标红方法
                const funCount = function () {
                    const length = document.validate.getLength(element);
                    // 实时更新现在的字符个数
                    eleMin.innerHTML = length;

                    // 超出范围或范围不足
                    if (length != 0 && (length > strAttrMaxLength || (strAttrMinLength && length < strAttrMinLength))) {
                        eleMin.classList.add('error');
                    } else {
                        eleMin.classList.remove('error');
                    }
                };
                // 事件
                element.count = funCount;
                element.addEventListener('input', funCount);

                if (strTag == 'input') {
                    Object.defineProperty(element, 'value', {
                        ...propsInput,
                        set (value) {
                            // 赋值
                            propsInput.set.call(this, value);
                            // 计数
                            funCount();
                        }
                    });
                } else if (strTag == 'textarea') {
                    Object.defineProperty(element, 'value', {
                        ...propsTextarea,
                        set (value) {
                            // 赋值
                            propsTextarea.set.call(this, value);
                            // 计数
                            funCount();
                        }
                    });
                }

                // 一开始就计数
                funCount();
            });

            // reset事件不会自动计数处理
            eleForm.addEventListener('reset', function () {
                this.querySelectorAll('input, textarea').forEach(function (element) {
                    if (element.count) {
                        setTimeout(() => {
                            element.count();
                        }, 1);
                    }
                });
            });

            return this;
        }

        /**
         * 表单内一些元素体验增强处理
         * 私有方法
         * @return {Object} 返回当前实例
         */
        enhance () {
            const eleForm = this.element.form;

            eleForm.querySelectorAll('input, textarea').forEach(function (element) {
                // 输入框类型
                const strAttrType = document.validate.getType(element);

                // 手机号码粘贴的优化处理
                if (/^checkbox|radio|range$/i.test(strAttrType) == false) {
                    ['paste', 'drop'].forEach(eventType => {
                        element.addEventListener(eventType, function (event) {
                            // 剪切板数据对象
                            // 输入框类型
                            const type = this.getAttribute('type') || this.type;
                            // 剪切板数据对象
                            const objPassData = event.clipboardData || event.dataTransfer;
                            // 粘贴或拖拽内容
                            let strPassText = '';
                            // 剪切板对象可以获取
                            if (!objPassData) {
                                return;
                            }
                            // 获取选中的文本内容
                            let textSelected = this.value.slice(element.selectionStart, element.selectionEnd);

                            // 只有输入框没有数据，或全选状态才处理
                            if (this.value.trim() == '' || textSelected === this.value) {
                                // 阻止冒泡和默认粘贴行为
                                event.preventDefault();
                                event.stopPropagation();
                                // 获取粘贴数据
                                strPassText = objPassData.getData('text') || '';
                                // 进行如下处理
                                // 除非是password，其他都过滤前后空格
                                if (type != 'password') {
                                    strPassText = strPassText.trim();
                                }
                                // 邮箱处理，可能会使用#代替@避免被爬虫抓取
                                if (type == 'email') {
                                    strPassText = strPassText.replace('#', '@');
                                } else if (type == 'tel') {
                                    // 手机号处理
                                    strPassText = document.validate.getTel(strPassText);
                                }

                                // 插入
                                this.value = strPassText;

                                // 触发input事件
                                element.dispatchEvent(new CustomEvent('input'));
                            }
                        });
                    });
                }
            });
        }

        /**
         * 表单即时验证的细节处理
         * @return {Object} 返回当前实例
         */
        immediate () {
            // 即时验证
            const eleForm = this.element.form;

            if (eleForm.isImmediated) {
                return this;
            }

            // 下面三个是不同事件的验证提示
            const funReportValidity = (event) => {
                if (this.params.immediate == false) {
                    return;
                }
                this.reportValidity(event.target);
            };

            const funReportFocus = (event) => {
                if (this.params.immediate) {
                    setTimeout(function () {
                        document.validate.focusable = 0;

                        this.reportValidity(event.target);
                    }.bind(this), 20);
                }
            };

            const funReportInput = (event) => {
                if (this.params.immediate == false) {
                    return;
                }

                document.validate.focusable = false;
                this.reportValidity(event.target);
                event.target.lastValue = event.target.value;
            };

            eleForm.querySelectorAll('input, select, textarea').forEach(function (element) {
                // type类型筛选
                let strType = element.type;
                let strAttrType = element.getAttribute('type');
                // 给每个控件绑定即时验证
                if (strType == 'button' || strType == 'submit' || strType == 'reset' || strType == 'file' || strType == 'image') {
                    return;
                }

                // 不同类别不同事件
                if (strType == 'radio' || strType == 'checkbox') {
                    element.addEventListener('click', funReportValidity);
                } else if (/select/.test(strType) || /range|date|time|hour|minute|hidden/.test(strAttrType)) {
                    element.addEventListener('change', funReportValidity);
                } else {
                    // 输入
                    element.addEventListener('focus', funReportFocus);
                    element.addEventListener('input', funReportInput);
                }
            });

            eleForm.isImmediated = true;

            // 如果表单重置，移除所有的即时验证绑定
            const funRemoveValidate = function () {
                [...eleForm.elements].forEach(element => {
                    // type类型筛选
                    let strType = element.type;
                    // 给每个控件绑定即时验证
                    if (['button', 'submit', 'reset', 'file', 'image'].includes(strType)) {
                        return;
                    }

                    let strAttrType = element.getAttribute('type');
                    // 不同类别不同事件
                    if (strType == 'radio' || strType == 'checkbox') {
                        element.removeEventListener('click', funReportValidity);
                    } else if (/select/.test(strType) || /range|date|time|hour|minute|hidden/.test(strAttrType)) {
                        element.removeEventListener('change', funReportValidity);
                    } else {
                        // 输入
                        element.removeEventListener('focus', funReportFocus);
                        element.removeEventListener('input', funReportInput);
                    }
                });

                [...eleForm.querySelectorAll('.valided')].forEach(element => {
                    element.classList.remove('valided');
                });
                [...eleForm.querySelectorAll('[is-error]')].forEach(element => {
                    // 因此可能的提错误示
                    let objErrorTip = element.data && element.data.errorTip;
                    if (objErrorTip) {
                        objErrorTip.hide();
                    }

                    element.removeAttribute('is-error');
                });

                eleForm.isImmediated = false;

                eleForm.removeEventListener('reset', funRemoveValidate);
            };
            eleForm.addEventListener('reset', funRemoveValidate);

            return this;
        }

        /**
         * 表单所有元素验证通过的判断处理
         * @return {Boolean} 是否表单所有元素验证通过
         */
        checkValidity () {
            const eleForm = this.element.form;

            let isAllPass = true;

            document.validate.focusable = true;

            eleForm.querySelectorAll('input, select, textarea').forEach(function (element) {
                // 还没有出现不合法的验证
                if (isAllPass == true || this.params.multiple) {
                    // multiple参数为true的时候，其他都要标红，但提示仅出现在第一个错误元素上
                    const isPass = document.validate.styleError(element);

                    if (isAllPass == true && isPass == false) {
                        this.reportValidity(element);
                        isAllPass = false;
                    }
                    // 回调触发
                    this.callback[isPass ? 'success' : 'error'].call(this, element);
                }
            }.bind(this));

            // 当有过一次提交之后，开启即时验证
            if (!eleForm.isImmediated && this.params.immediate) {
                this.immediate();
            }

            return isAllPass;
        }

        /**
         * 出错提示显示
         * @return {[type]} [description]
         */
        reportValidity (element, content) {
            if (element) {
                document.validate.reportValidity(element, content);
            }
        }
    }

    return Component;
})();

// 为了直接使用
window.Validate = Validate;

export default Validate;
