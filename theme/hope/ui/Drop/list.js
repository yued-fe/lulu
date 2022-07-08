/**
 * @Drop.js
 * @author zhangxinxu
 * @version
 * @created 15-06-30
 * @edited  20-07-08 edit by wanglei
 */

/**/import Drop from './index.js';

/**
 * drop 拓展list
 * @date 2019-11-01
 * @returns {object} 返回当前自定义元素
 * 兼容以下几种语法
 * new Drop().list(eleTrigger, data);
 * new Drop().list(eleTrigger, data, options);
 * new Drop(eleTrigger).list(data, options);
 * new Drop(eleTrigger, options).list(data);
**/
Drop.prototype.list = function (eleTrigger, data, options) {
    // datalist 元素的 option 转为列表数据
    const funGetDataByOption = function (option) {
        let obj = {
            id: option.id || option.value,
            value: option.innerHTML || option.value,
            className: option.className,
            disabled: option.disabled,
            label: option.label,
            accessKey: option.accessKey
        };
        // disabled处理
        let eleOptgroup = option.closest('optgroup');
        if (eleOptgroup && eleOptgroup.disabled) {
            obj.disabled = true;
        }
        // href 属性处理
        if (option.hasAttribute('href')) {
            obj.href = option.getAttribute('href');
        }

        return obj;
    };
    // 基于类型进行参数判断
    [...arguments].forEach(argument => {
        const strTypeArgument = typeof argument;
        if (strTypeArgument === 'string') {
            eleTrigger = document.getElementById(argument) || document.querySelector(argument);
        } else if (strTypeArgument === 'function') {
            data = argument;
        } else if (strTypeArgument === 'object') {
            if (typeof argument.nodeType === 'number') {
                // 支持从原生的列表元素中获取数据信息
                if (argument.matches('datalist')) {
                    data = function () {
                        // 所有分组元素
                        let eleOptgroups = argument.querySelectorAll('optgroup');
                        // 如果有任意一个分组元素设置了label，那么就是标题分组
                        // 如果只是optgroup标签包括，那么使用分隔线分隔
                        let isSubTitle = !!argument.querySelector('optgroup[label]');

                        // 如果有分组
                        if (eleOptgroups.length) {
                            let arrData = [];

                            eleOptgroups.forEach(optgroup => {
                                if (isSubTitle) {
                                    arrData.push({
                                        id: '-1',
                                        value: optgroup.label,
                                        disabled: optgroup.disabled,
                                        className: optgroup.className,
                                        heading: true
                                    });
                                } else {
                                    // 分隔线
                                    arrData.push({});
                                }

                                optgroup.querySelectorAll('option').forEach(option => {
                                    arrData.push(funGetDataByOption(option));
                                });
                            });

                            return arrData;
                        }

                        return [...argument.querySelectorAll('option')].map((option, index) => {
                            let objOption = funGetDataByOption(option);
                            if (!objOption.value) {
                                return {};
                            }
                            if (!objOption.id) {
                                objOption.id = index;
                            }

                            return objOption;
                        });
                    };
                    if (eleTrigger == argument) {
                        eleTrigger = null;
                    }
                } else {
                    eleTrigger = argument;
                }
            } else if (argument.map) {
                data = argument;
            } else {
                options = argument;
            }
        }
    });

    if (eleTrigger && typeof eleTrigger.nodeType !== 'number') {
        eleTrigger = null;
    }
    eleTrigger = eleTrigger || this.element.trigger;

    // 触发元素和数据是必须项
    if (!eleTrigger) {
        return this;
    }

    if (!data) {
        data = [];
    }

    const defaults = {
        // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏。
        eventType: 'click',
        offsets: {
            x: 0,
            y: 0
        },
        position: '4-1',
        selector: '',
        width: '',
        onShow: () => {},
        onHide: () => {},
        // this为当前点击的列表元素，支持两个参数，第一个参数为列表元素对应的数据(纯对象)，第二个是当前实例对象
        onSelect: () => {}
    };

    // 参数处理
    const objParams = {};
    options = options || {};

    Object.keys(defaults).forEach(prop => {
        objParams[prop] = options[prop] || this.params[prop] || defaults[prop];
    });

    // 一些常量
    const SELECTED = 'selected';
    const DISABLED = 'disabled';
    // ui类名
    // 类名变量
    // 样式类名统一处理

    const CL = {
        add: function () {
            return ['ui-droplist'].concat([].slice.call(arguments)).join('-');
        },
        toString: () => {
            return 'ui-droplist';
        }
    };

    // trigger元素赋值的方法
    let strMethod = 'innerHTML';
    if (eleTrigger.matches('input')) {
        strMethod = 'value';
    }

    // target元素创建
    let eleTarget = document.createElement('div');
    eleTarget.setAttribute('role', 'listbox');
    eleTarget.setAttribute('tabindex', '-1');

    // 宽度处理
    if (/^\d+$/.test(objParams.width)) {
        eleTarget.style.width = objParams.width + 'px';
    } else {
        eleTarget.style.width = objParams.width;
    }
    eleTarget.className = CL.add('x');

    // 存储原始参数值
    this.data = data;

    // 列表渲染需要的数组项
    let arrListData = data;

    // 索引值内容的匹配
    let funGetMatchIndex = (arr) => {
        // 初始的匹配和默认索引值获取（如果没有设置selected选项）
        // 匹配的索引值
        let strMatchIndex = '-1';
        // 是否默认包含选中项
        let isSomeItemSelected = false;

        // 遍历数据
        // 目的是获得匹配索引，和改变默认值（如果有设置selected选项）
        // 由于数据可能无限嵌套，因此走递归
        let funRecursion = (arrData, arrIndex) => {
            if (!arrData || !arrData.length) {
                return;
            }

            arrData.forEach((objData, numIndex) => {
                // 此时数组项的索引深度
                const arrCurrentIndex = arrIndex.concat(numIndex);

                // 多级数据结构
                if (objData && objData.data) {
                    funRecursion(objData.data, arrCurrentIndex);
                    return;
                }

                if (objData && objData[SELECTED] && !objData[DISABLED] && objData.value) {

                    eleTrigger[strMethod] = objData.value;

                    // 找到设置了selected的选项，并记住索引
                    strMatchIndex = arrCurrentIndex.join('-');
                }

                // 修改全局判断，这样，eleTrigger无需
                // 再根据本身内容确定默认的选中项了
                if (objData && objData[SELECTED]) {
                    isSomeItemSelected = true;
                }
            });
        };

        funRecursion(arr, []);

        // 此时trigger元素内部的内容
        const strTrigger = (eleTrigger[strMethod] || '').trim();

        // 根据eleTrigger的内容信息确定哪个数据是selected
        // 遍历数据
        if (isSomeItemSelected == false && strTrigger) {
            funRecursion = (arrData, arrIndex) => {
                if (!arrData || !arrData.length) {
                    return;
                }

                arrData.forEach((objData, numIndex) => {
                    // 此时数组项的索引深度
                    const arrCurrentIndex = arrIndex.concat(numIndex);

                    // 多级数据结构
                    if (objData && objData.data) {
                        funRecursion(objData.data, arrCurrentIndex);
                        return;
                    }
                    // 如果有匹配，设置为选中
                    if (typeof objData.value === 'string' && objData.value.trim() == strTrigger) {
                        strMatchIndex = arrCurrentIndex.join('-');

                        // 设置为选中
                        objData[SELECTED] = true;
                    }
                });
            };

            funRecursion(arr, []);
        }

        return strMatchIndex;
    };

    let strMatchIndex = -1;

    if (typeof data !== 'function' && data.length && data.map) {
        strMatchIndex = funGetMatchIndex(arrListData);
    }

    // 列表绘制渲染方法
    // 每次show的时候都执行刷新
    const funRender = (eleTarget, arrListData) => {
        if (typeof arrListData === 'function') {
            arrListData = arrListData();
            // 重新获取索引值，只有data是function类型的时候才执行
            strMatchIndex = funGetMatchIndex(arrListData);
        }

        // 没有数据时候的处理
        if (!arrListData || !arrListData.length) {
            arrListData = [{
                value: '没有数据',
                disabled: true
            }];
        } else {
            arrListData = arrListData.map(arrData => {
                if (typeof arrData == 'string' && arrData !== '-') {
                    return {
                        value: arrData
                    };
                }
                return arrData;
            });
        }

        // 是否包含选中项
        let isSomeItemSelected = arrListData.some(objData => {
            return objData && objData[SELECTED];
        });

        // 列表数据更新
        eleTarget.innerHTML = (() => {
            let strHtml = '';

            const funStep = (arrData, arrIndex) => {

                let strHtmlStep = '';

                arrData.forEach((objData, numIndex) => {
                    // 为空数据作为分隔线
                    if (objData == '-' || objData === null || JSON.stringify(objData) == '{}') {
                        strHtmlStep += '<hr class="' + CL.add('hr') + '">';
                        return;
                    }

                    // 此时数组项的索引深度
                    const arrCurrentIndex = arrIndex.concat(numIndex);

                    // 一些属性值
                    let strAttrHref = objData.href;
                    if (typeof strAttrHref != 'string') {
                        strAttrHref = 'javascript:';
                    } else if (!strAttrHref) {
                        strAttrHref = location.href.split('#')[0];
                    }

                    // target属性
                    let strAttrTarget = '';
                    if (objData.target) {
                        strAttrTarget = ' target="' + objData.target + '"';
                    }

                    // 是否包含子项
                    let strAttrSublist = '';
                    if (objData.data) {
                        strAttrSublist = ' data-sublist';
                    }

                    // label标记
                    let strAttrLabel = '';
                    if (objData.label) {
                        strAttrLabel = ' aria-label="' + objData.label + '"';
                    }

                    // accesskey快捷访问
                    let strAttrAccess = '';
                    if (objData.accessKey) {
                        strAttrAccess = ` accesskey="${objData.accessKey}"`;
                    }

                    // 如果数据不含选中项，使用存储的索引值进行匹配
                    if (isSomeItemSelected == false && strMatchIndex == arrCurrentIndex.join('-')) {
                        objData[SELECTED] = true;
                    }

                    // 类名
                    let strAttrClass = CL.add('li') + ' ' + objData.className;
                    if (objData[SELECTED]) {
                        strAttrClass = strAttrClass + ' ' + SELECTED;
                    }

                    strAttrClass = strAttrClass.trim();

                    // 如果是标题元素
                    if (objData.heading == true) {
                        if (objData.disabled) {
                            strAttrClass += ' disabled';
                        }
                        strHtmlStep += '<div class="' + strAttrClass + '"' + strAttrLabel + ' role="heading">' + objData.value + '</div>';
                        return;
                    }

                    // 禁用态和非禁用使用标签区分
                    // 如果想要支持多级，data-index值可以"1-2"这样
                    if (objData[DISABLED] != true) {
                        strHtmlStep += '<a href="' + strAttrHref + '"' + strAttrTarget + strAttrLabel + strAttrAccess + ' class="' + strAttrClass + '" data-index="' + arrCurrentIndex.join('-') + '" role="option" aria-selected="' + (objData[SELECTED] || 'false') + '" ' + strAttrSublist + '>' + objData.value + '</a>';

                        if (objData.data) {
                            strHtmlStep += '<div class="' + CL.add('xx') + '"><div class="' + CL.add('x') + '" role="listbox">' + funStep(objData.data, arrCurrentIndex) + '</div></div>';
                        }
                    } else {
                        strHtmlStep += '<span class="' + strAttrClass + '"' + strAttrLabel + strAttrAccess + '>' + objData.value + '</span>';
                    }
                });

                return strHtmlStep;
            };

            strHtml += funStep(arrListData, []);

            return strHtml;
        })();

        // 存储在DOM对象上，给回调使用
        eleTarget.listData = arrListData;
    };

    // 重新初始化 drop
    this.setParams({
        eventType: objParams.eventType,
        offsets: objParams.offsets,
        selector: objParams.selector,
        position: objParams.position,
        onShow: function () {
            funRender.call(this, eleTarget, this.data);
            objParams.onShow.apply(this, arguments);
        },
        onHide: objParams.onHide
    });

    this.element.trigger = eleTrigger;
    this.element.target = eleTarget;

    // 新的事件
    this.events();

    // 绑定事件
    eleTarget.addEventListener('click', event => {
        // IE可能是文件节点
        if (event.target.nodeType != 1 || !event.target.closest) {
            return;
        }
        // 目标点击元素
        const eleClicked = event.target.closest('a');

        // 未获取到元素返回
        if (!eleClicked) {
            return;
        }

        // 当前列表显示使用的数据
        const arrListData = eleTarget.listData;

        // 如果是多级嵌套列表，这里需要额外处理
        const strIndex = eleClicked.getAttribute('data-index');

        if (!strIndex) {
            return;
        }

        // 根据点击的元素索引获取对应的数据对象
        let objItemData = null;
        strIndex.split('-').forEach(numIndex => {
            if (objItemData === null) {
                objItemData = arrListData[numIndex];
            } else if (objItemData.data) {
                objItemData = objItemData.data[numIndex];
            } else {
                objItemData = objItemData[numIndex];
            }
        });

        // 如果这里返回，说明数据有问题
        // 或者代码逻辑有bug
        if (!objItemData) {
            return;
        }

        // 点击包含下级数据的列表
        if (typeof eleClicked.getAttribute('data-sublist') === 'string') {
            eleClicked.classList.add(SELECTED);

            // 此时显示的下级列表元素
            const eleSubTarget = eleClicked.nextElementSibling.querySelector('.' + CL.add('x'));

            if (!eleSubTarget) {
                return;
            }
            // 偏移还原
            // 否则会A/B重定位
            eleSubTarget.style.transform = '';
            eleSubTarget.classList.remove('reverse');

            // 此时偏移
            const objBounding = eleSubTarget.getBoundingClientRect();
            // 水平方向是方向变化，这里使用document.documentElement宽度判断
            // 因为window.innerWidth包括滚动条宽度，可能会导致水平滚动条出现
            // 交给CSS控制
            if (objBounding.right > document.documentElement.clientWidth) {
                eleSubTarget.classList.add('reverse');
            }

            // 垂直方向偏移
            let offsetTop = 0;

            if (objBounding.bottom > window.innerHeight) {
                offsetTop = window.innerHeight - objBounding.bottom;
            }

            eleSubTarget.style.transform = 'translateY(' + offsetTop + 'px)';

            return;
        }

        // 改变选中索引
        if (strIndex != strMatchIndex) {
            let objLastItemData = null;

            if (strMatchIndex != '-1') {
                strMatchIndex.split('-').forEach(numIndex => {
                    if (objLastItemData === null) {
                        objLastItemData = arrListData[numIndex];
                    } else if (objLastItemData.data) {
                        objLastItemData = objLastItemData.data[numIndex];
                    } else {
                        objLastItemData = objLastItemData[numIndex];
                    }
                });

                if (objLastItemData) {
                    delete objLastItemData[SELECTED];
                }
            }

            // 设置为true
            objItemData[SELECTED] = true;

            // 更新匹配索引
            strMatchIndex = strIndex;
        }

        // 触发用户自定义选择事件
        (this.params.onSelect || objParams.onSelect).call(this, objItemData, eleClicked);

        // 触发自定义事件 - select
        this.dispatchEvent(new CustomEvent('select', {
            detail: {
                data: objItemData,
                target: eleClicked
            }
        }));

        // 如果trigger元素非<ui-drop>元素，则也触发一下，同时传递select事件来源
        // 如果是在Vue中，可以使用@select绑定选择事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('select', {
                detail: {
                    type: 'ui-drop',
                    data: objItemData,
                    target: eleClicked
                }
            }));
        }

        // 不是鼠标右击事件，也不是委托模式更新
        if (objParams.eventType != 'contextmenu' && objParams.selector == '' && !objItemData.href) {
            eleTrigger[strMethod] = objItemData.value;
        }
        // 隐藏
        this.hide();
    });

    // hover时候次级列表也显示
    eleTarget.addEventListener('mouseover', event => {
        // IE可能是文件节点
        if (event.target.nodeType != 1 || !event.target.closest) {
            return;
        }
        const eleHovered = event.target.closest('a');

        if (!eleHovered) {
            return;
        }

        const eleItemSublist = eleHovered.parentElement.querySelector('.' + SELECTED + '[data-sublist]');

        if (eleItemSublist && eleItemSublist != eleHovered) {
            eleItemSublist.classList.remove(SELECTED);
        }
        if (eleHovered.classList.contains(SELECTED) == false && typeof eleHovered.getAttribute('data-sublist') === 'string') {
            eleHovered.click();
        }
    });

    return this;
};
