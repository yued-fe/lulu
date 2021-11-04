/**
 * @Drop.js
 * @author zhangxinxu
 * @version
 * Created: 15-06-30
 */

/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Drop = factory();
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
     * 实例方法
     * @param {Object} trigger 触发元素，$()包装器元素类型
     * @param {Object} target  显示的浮动定位元素，$()包装器元素类型
     * @param {Object} options 可选参数
     */
    var Drop = function (eleTrigger, eleTarget, options) {
        this.init(eleTrigger, eleTarget, options);
        return this;
    };

    /**
     * Drop 初始化方法
     * @date 2019-10-28
     * @param {Object} trigger 触发元素，$()包装器元素类型
     * @param {Object} target  显示的浮动定位元素，$()包装器元素类型
     * @param {Object} options 可选参数
     */
    Drop.prototype.init = function (eleTrigger, eleTarget, options) {
        if (typeof eleTrigger == 'string') {
            eleTrigger = document.getElementById(eleTrigger) || document.querySelector(eleTrigger);
        }
        if (typeof eleTarget == 'string') {
            eleTarget = document.getElementById(eleTarget) || document.querySelector(eleTarget);
        }

        if (eleTarget && typeof eleTarget == 'object' && typeof eleTarget.nodeType != 'number') {
            options = eleTarget;
            eleTarget = null;
        }

        var defaults = {
            // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏。
            eventType: 'null',
            offsets: {
                x: 0,
                y: 0
            },
            position: '7-5',
            selector: '',
            edgeAdjust: true,
            onShow: function () { },
            onHide: function () { }
        };

        options = options || {};

        for (var key in defaults) {
            if (typeof options[key] == 'undefined' && eleTrigger) {
                var strAttr = eleTrigger.getAttribute('data-' + key.toLowerCase());
                if (strAttr !== null) {
                    if (key == 'edgeAdjust' && strAttr == 'false') {
                        options[key] = false;
                    } else if (key == 'offsets') {
                        var arrOffsets = strAttr.split(/,|\s+/);
                        var objOffsets = {
                            x: Number(arrOffsets[0].trim()) || 0,
                            y: Number(arrOffsets[1].trim()) || 0
                        };
                        options[key] = objOffsets;
                    } else {
                        options[key] = strAttr;
                    }
                }
            }
        }

        var objParams = Object.assign({}, defaults, options || {});

        // 元素暴露给实例
        this.element = {
            trigger: eleTrigger,
            target: eleTarget
        };

        // 回调
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };

        // 暴露参数
        this.params = {
            // 事件类型
            eventType: objParams.eventType,
            // 偏移
            offsets: objParams.offsets,
            // 位置
            position: objParams.position,
            // 选择器
            selector: objParams.selector,
            // 边缘调整
            edgeAdjust: objParams.edgeAdjust
        };

        // 实例的显示状态
        this.display = false;

        if (!eleTarget || !eleTrigger) {
            return this;
        }

        // 事件绑定处理
        this.events();

        // 存储实例对象
        if (!eleTrigger.data) {
            eleTrigger.data = {};
        }
        eleTrigger.data.drop = this;

        return this;
    };

    /**
     * 下拉定位的事件处理
     * @return {[type]} [description]
     */
    Drop.prototype.events = function () {
        // 元素
        var eleTrigger = this.element.trigger;
        var eleTarget = this.element.target;
        // 参数
        var objParams = this.params;

        // 获取匹配选择器的eleTrigger子元素
        var funGetClosestChild = function (element) {
            if (!objParams.selector) {
                return null;
            }
            var eleClosestSelector = element.closest(objParams.selector);
            if (eleTrigger.contains(eleClosestSelector) == false) {
                return null;
            }

            return eleClosestSelector;
        };
        // 根据不同事件类型进行逻辑处理
        switch (objParams.eventType) {
            // 默认值，直接显示
            case 'null': {
                this.show();
                break;
            }
            case 'hover': {
                // hover处理需要增加延时
                var timerHover;
                // 同时，从trigger移动到target也需要延时，
                // 因为两者可能有间隙，不能单纯移出就隐藏
                var timerHold;
                // 事件走起
                eleTrigger.addEventListener('mouseover', function (event) {
                    // 不是在元素自身移动
                    if (event.relatedTarget !== event.target) {
                        // 委托查询
                        var eleClosestSelector = funGetClosestChild(event.target);

                        // 如果走委托
                        if (eleClosestSelector) {
                            // 改变trigger元素
                            this.element.trigger = eleClosestSelector;
                        }

                        // 显示定时器
                        if (!objParams.selector || eleClosestSelector) {
                            // 显示的定时器
                            timerHover = setTimeout(function () {
                                this.show();
                            }.bind(this), 150);
                            // 去除隐藏的定时器
                            clearTimeout(timerHold);
                        }
                    }

                }.bind(this));

                eleTrigger.addEventListener('mouseleave', function () {
                    // 清除显示的定时器
                    clearTimeout(timerHover);
                    // 隐藏的定时器
                    timerHold = setTimeout(function () {
                        this.hide();
                    }.bind(this), 200);
                }.bind(this));

                if (!eleTarget.isBindDropHover) {
                    eleTarget.addEventListener('mouseenter', function () {
                        // 去除隐藏的定时器
                        clearTimeout(timerHold);
                    });
                    eleTarget.addEventListener('mouseleave', function () {
                        // 隐藏
                        timerHold = setTimeout(function () {
                            this.hide();
                        }.bind(this), 100);
                    }.bind(this));

                    eleTarget.isBindDropHover = true;
                }

                // 键盘支持，原本使用focus事件，但并不利于键盘交互
                eleTrigger.addEventListener('click', function (event) {
                    // window.isKeyEvent表示是否键盘触发，来自Keyboard.js
                    if (!window.isKeyEvent) {
                        return;
                    }

                    event.preventDefault();

                    var eleClosestSelector = funGetClosestChild(event.target);
                    // 如果走委托
                    if (eleClosestSelector) {
                        // 改变trigger元素
                        this.element.trigger = eleClosestSelector;
                    }

                    // 显示定时器
                    if (!objParams.selector || eleClosestSelector) {
                        // 点击即显示
                        if (this.display == false) {
                            this.show();
                        } else {
                            this.hide();
                        }
                    }
                }.bind(this));

                break;
            }

            // 点击或者右键
            case 'click': case 'contextmenu': {
                eleTrigger.addEventListener(objParams.eventType, function (event) {

                    event.preventDefault();
                    // aria支持
                    // 获得委托的选择器匹配元素
                    var eleClosestSelector = funGetClosestChild(event.target);
                    if (eleClosestSelector) {
                        // 改变trigger元素
                        this.element.trigger = eleClosestSelector;
                    }
                    // 点击即显示
                    if (!objParams.selector || eleClosestSelector) {
                        // 重复右键点击一直显示，非显隐切换
                        if (objParams.eventType == 'contextmenu') {
                            objParams.position = [event.pageX, event.pageY];
                            this.show();

                            return;
                        }

                        if (this.display == false) {
                            this.show();
                        } else {
                            this.hide();
                        }
                    }
                }.bind(this));

                break;
            }
        }

        // 点击页面空白区域隐藏
        document.addEventListener('mouseup', function (event) {
            var eleClicked = event && event.target;

            if (!eleClicked || this.display != true) {
                return;
            }

            // 因为trigger和target可能动态变化
            // 因此这里再次获取一遍
            var eleTrigger = this.element.trigger;
            var eleTarget = this.element.target;

            if (!eleTarget || !eleTrigger) {
                return;
            }

            if (eleTrigger.contains(eleClicked) == false && eleTarget.contains(eleClicked) == false) {
                this.hide();
            }
        }.bind(this));

        // 窗体尺寸改变生活的重定位
        window.addEventListener('resize', function () {
            this.follow();
        }.bind(this));
    };

    /**
     * 下拉定位处理
     * @return {Object} 返回当前实例对象
     */
    Drop.prototype.follow = function () {
        var eleTrigger = this.element.trigger;
        var eleTarget = this.element.target;

        // 下拉必须是显示状态才执行定位处理
        if (this.display == true && window.getComputedStyle(eleTrigger).display != 'none') {
            new Follow(eleTrigger, eleTarget, {
                offsets: this.params.offsets,
                position: this.params.position,
                edgeAdjust: this.params.edgeAdjust
            });
        }

        return this;
    };

    /**
     * 下拉的显示处理
     * @return {Object} 返回当前实例对象
     */
    Drop.prototype.show = function () {
        // target需要在页面中
        var eleTrigger = this.element.trigger;
        var eleTarget = this.element.target;

        // 如果target在内存中，append到页面上
        if (eleTarget && document.body.contains(eleTarget) == false) {
            document.body.appendChild(eleTarget);
        }
        // 改变显示标志量
        this.display = true;
        // 进行定位
        eleTarget.style.position = 'absolute';
        eleTarget.style.display = 'inline';
        // 键盘ESC隐藏支持
        eleTarget.classList.add('ESC');

        var strId = eleTarget.id;
        if (!strId) {
            strId = ('lulu_' + Math.random()).replace('0.', '');
            eleTarget.id = strId;
        }

        eleTrigger.setAttribute('data-target', strId);
        // aria
        eleTrigger.setAttribute('aria-expanded', 'true');

        // 定位
        this.follow();

        // 显示回调处理
        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this, eleTrigger, eleTarget);
        }

        return this;
    };

    /**
     * 下拉的隐藏处理
     * @return {Object} 返回当前实例对象
     */
    Drop.prototype.hide = function () {
        var eleTrigger = this.element.trigger;
        var eleTarget = this.element.target;

        // 隐藏下拉面板
        eleTarget.style.display = 'none';
        eleTarget.classList.remove('ESC');

        // aria
        eleTrigger.setAttribute('aria-expanded', 'false');

        if (window.isKeyEvent) {
            eleTrigger.focus();
        }

        // 更改显示标志量
        this.display = false;

        // 隐藏回调处理
        if (typeof this.callback.hide == 'function') {
            this.callback.hide.call(this, eleTrigger, eleTarget);
        }

        return this;
    };


    /**
     * drop 拓展list
     * @date 2019-11-01
     * @returns {object} 返回当前实例对象
     * 兼容以下几种语法
     * new Drop().list(eleTrigger, data);
     * new Drop().list(eleTrigger, data, options);
     * new Drop(eleTrigger).list(data, options);
     * new Drop(eleTrigger, options).list(data);
     */
    Drop.prototype.list = function (eleTrigger, data, options) {
        // 基于类型进行参数判断
        [].slice.call(arguments).forEach(function (argument) {
            var strTypeArgument = typeof argument;
            if (strTypeArgument == 'string') {
                eleTrigger = document.querySelector(argument);
            } else if (strTypeArgument == 'function') {
                data = argument;
            } else if (strTypeArgument == 'object') {
                if (typeof argument.nodeType == 'number') {
                    eleTrigger = argument;
                } else if (argument.map) {
                    data = argument;
                } else {
                    options = argument;
                }
            }
        });

        if (eleTrigger && typeof eleTrigger.nodeType != 'number') {
            eleTrigger = null;
        }
        eleTrigger = eleTrigger || this.element.trigger;

        // 触发元素和数据是必须项
        if (!eleTrigger || !data) {
            return this;
        }

        // 如果已经初始化就不用初始化了
        if (eleTrigger.data && eleTrigger.data.drop) {
            return eleTrigger.data.drop;
        }

        var defaults = {
            // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏。
            eventType: 'click',
            offsets: {
                x: 0,
                y: 0
            },
            position: '4-1',
            selector: '',
            width: '',
            onShow: function () { },
            onHide: function () { },
            // this为当前点击的列表元素，支持两个参数，第一个参数为列表元素对应的数据(纯对象)，第二个是当前实例对象
            onSelect: function () { }
        };

        // Drop 配置
        var objParams = Object.assign({}, defaults, options || {});

        // 一些常量
        var SELECTED = 'selected';
        var DISABLED = 'disabled';
        // ui类名
        // 类名变量
        // 样式类名统一处理

        var CL = {
            add: function () {
                return ['ui-droplist'].concat([].slice.call(arguments)).join('-');
            },
            toString: function () {
                return 'ui-droplist';
            }
        };

        // trigger元素赋值的方法
        var strMethod = 'innerHTML';
        if (eleTrigger.matches('input')) {
            strMethod = 'value';
        }

        // 存储原始参数值
        this.data = data;

        // 列表渲染需要的数组项
        var arrListData = data;

        if (typeof data == 'function') {
            arrListData = data();
        }


        // 初始的匹配和默认索引值获取（如果没有设置selected选项）
        // 匹配的索引值
        var strMatchIndex = '-1';
        // 是否默认包含选中项
        var isSomeItemSelected = false;

        // target元素创建
        var eleTarget = document.createElement('div');
        eleTarget.setAttribute('role', 'listbox');
        eleTarget.setAttribute('tabindex', '-1');

        // 宽度处理
        if (/^\d+$/.test(objParams.width)) {
            eleTarget.style.width = objParams.width + 'px';
        } else {
            eleTarget.style.width = objParams.width;
        }
        eleTarget.className = CL.add('x');

        // 遍历数据
        // 目的是获得匹配索引，和改变默认值（如果有设置selected选项）
        // 由于数据可能无限嵌套，因此走递归
        var funRecursion = function (arrData, arrIndex) {
            if (!arrData || !arrData.length) {
                return;
            }

            arrData.forEach(function (objData, numIndex) {
                // 此时数组项的索引深度
                var arrCurrentIndex = arrIndex.concat(numIndex);

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

        funRecursion(arrListData, []);

        // 此时trigger元素内部的内容
        var strTrigger = (eleTrigger[strMethod] || '').trim();

        // 根据eleTrigger的内容信息确定哪个数据是selected
        // 遍历数据
        if (isSomeItemSelected == false && strTrigger) {
            funRecursion = function (arrData, arrIndex) {
                if (!arrData || !arrData.length) {
                    return;
                }

                arrData.forEach(function (objData, numIndex) {
                    // 此时数组项的索引深度
                    var arrCurrentIndex = arrIndex.concat(numIndex);

                    // 多级数据结构
                    if (objData && objData.data) {
                        funRecursion(objData.data, arrCurrentIndex);
                        return;
                    }
                    // 如果有匹配，设置为选中
                    if (typeof objData.value == 'string' && objData.value.trim() == strTrigger) {
                        strMatchIndex = arrCurrentIndex.join('-');

                        // 设置为选中
                        objData[SELECTED] = true;
                    }
                });
            };

            funRecursion(arrListData, []);
        }

        // 列表绘制渲染方法
        // 每次show的时候都执行刷新
        var funRender = function (eleTarget, arrListData) {
            if (typeof arrListData == 'function') {
                arrListData = arrListData();
            }

            // 没有数据时候的处理
            if (!arrListData || arrListData.length == 0) {
                arrListData = [{
                    value: '没有数据',
                    disabled: true
                }];
            }

            // 是否包含选中项
            var isSomeItemSelected = arrListData.some(function (objData) {
                return objData && objData[SELECTED];
            });

            // 列表数据更新
            eleTarget.innerHTML = (function () {
                var strHtml = '';

                var funStep = function (arrData, arrIndex) {

                    var strHtmlStep = '';

                    arrData.forEach(function (objData, numIndex) {
                        // 为空数据作为分隔线
                        if (objData == '-' || objData === null || JSON.stringify(objData) == '{}') {
                            strHtmlStep += '<hr class="' + CL.add('hr') + '">';
                            return;
                        }

                        // 此时数组项的索引深度
                        var arrCurrentIndex = arrIndex.concat(numIndex);

                        // 一些属性值
                        var strAttrHref = objData.href || 'javascript:';

                        // target属性
                        var strAttrTarget = '';
                        if (objData.target) {
                            strAttrTarget = ' target="' + objData.target + '"';
                        }

                        // 类名
                        var strAttrClass = CL.add('li');
                        if (objData[SELECTED]) {
                            strAttrClass = strAttrClass + ' ' + SELECTED;
                        }

                        // 是否包含子项
                        var strAttrSublist = '';
                        if (objData.data) {
                            strAttrSublist = ' data-sublist';
                        }

                        // label标记
                        var strAttrLabel = '';
                        if (objData.label) {
                            strAttrLabel = ' aria-label="' + objData.label + '"';
                        }

                        // 如果数据不含选中项，使用存储的索引值进行匹配
                        if (isSomeItemSelected == false && strMatchIndex == arrCurrentIndex.join('-')) {
                            objData[SELECTED] = true;
                        }
                        // 禁用态和非禁用使用标签区分
                        // 如果想要支持多级，data-index值可以"1-2"这样
                        if (objData[DISABLED] != true) {
                            strHtmlStep += '<a href="' + strAttrHref + '"' + strAttrTarget + strAttrLabel + ' class="' + strAttrClass + '" data-index="' + arrCurrentIndex.join('-') + '" role="option" aria-selected="' + (objData[SELECTED] || 'false') + '" ' + strAttrSublist + '>' + objData.value + '</a>';

                            if (objData.data) {
                                strHtmlStep += '<div class="' + CL.add('xx') + '"><div class="' + CL.add('x') + '" role="listbox">' + funStep(objData.data, arrCurrentIndex) + '</div></div>';
                            }
                        } else {
                            strHtmlStep += '<span class="' + strAttrClass + '"' + strAttrLabel + '>' + objData.value + '</span>';
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
        this.init(eleTrigger, eleTarget, {
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

        // 绑定事件
        eleTarget.addEventListener('click', function (event) {
            // IE可能是文件节点
            if (event.target.nodeType != 1 || !event.target.closest) {
                return;
            }
            // 目标点击元素
            var eleClicked = event.target.closest('a');

            // 未获取到元素返回
            if (!eleClicked) {
                return;
            }

            // 当前列表显示使用的数据
            var arrListData = eleTarget.listData;

            // 如果是多级嵌套列表，这里需要额外处理
            var strIndex = eleClicked.getAttribute('data-index');

            if (!strIndex) {
                return;
            }

            // 根据点击的元素索引获取对应的数据对象
            var objItemData = null;
            strIndex.split('-').forEach(function (numIndex) {
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
            if (typeof eleClicked.getAttribute('data-sublist') == 'string') {
                eleClicked.classList.add(SELECTED);

                // 此时显示的下级列表元素
                var eleSubTarget = eleClicked.nextElementSibling.querySelector('.' + CL.add('x'));

                if (!eleSubTarget) {
                    return;
                }

                var objBounding = eleSubTarget.getBoundingClientRect();

                // 水平方向是方向变化
                // 交给CSS控制
                if (objBounding.right > window.innerWidth) {
                    eleSubTarget.classList.add('reverse');
                } else {
                    eleSubTarget.classList.remove('reverse');
                }

                // 垂直方向偏移
                var offsetTop = 0;

                if (objBounding.bottom > window.innerHeight) {
                    offsetTop = window.innerHeight - objBounding.bottom;
                }

                eleSubTarget.style.msTransform = 'translateY(' + offsetTop + 'px)';
                eleSubTarget.style.transform = 'translateY(' + offsetTop + 'px)';

                return;
            }

            // 改变选中索引
            if (strIndex != strMatchIndex) {
                var objLastItemData = null;

                if (strMatchIndex != '-1') {
                    strMatchIndex.split('-').forEach(function (numIndex) {
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
            objParams.onSelect.call(this, objItemData, eleClicked);

            // 不是鼠标右击事件，也不是委托模式更新
            if (objParams.eventType != 'contextmenu' && objParams.selector == '' && !objItemData.href) {
                eleTrigger[strMethod] = objItemData.value;
            }
            // 隐藏
            this.hide();
        }.bind(this));

        // hover时候次级列表也显示
        eleTarget.addEventListener('mouseover', function (event) {
            // IE可能是文件节点
            if (event.target.nodeType != 1 || !event.target.closest) {
                return;
            }
            var eleHovered = event.target.closest('a');

            if (!eleHovered) {
                return;
            }

            var eleItemSublist = eleHovered.parentElement.querySelector('.' + SELECTED + '[data-sublist]');

            if (eleItemSublist && eleItemSublist != eleHovered) {
                eleItemSublist.classList.remove(SELECTED);
            }
            if (eleHovered.classList.contains(SELECTED) == false && typeof eleHovered.getAttribute('data-sublist') == 'string') {
                eleHovered.click();
            }
        });

        return this;
    };

    /**
     * drop 拓展panel
     * @date 2019-11-01
     * 兼容以下两种语法
     * new Drop().panel(eleTrigger, options);
     * new Drop(eleTrigger).panel(options);
     * @returns {object} 返回当前实例对象
     */
    Drop.prototype.panel = function (eleTrigger, options) {
        // 不同类型参数的处理
        if (arguments.length === 2) {
            eleTrigger = arguments[0];
            options = arguments[1];
        } else if (arguments.length === 1) {
            options = arguments[0];
            eleTrigger = null;
        }
        if (typeof eleTrigger == 'string') {
            eleTrigger = document.querySelector(eleTrigger);
        }

        eleTrigger = eleTrigger || this.element.trigger;

        if (!eleTrigger) {
            return this;
        }

        // 如果已经初始化就不用初始化了
        if (eleTrigger.data && eleTrigger.data.drop) {
            return eleTrigger.data.drop;
        }

        var defaults = {
            title: '',
            content: '',
            buttons: [{}, {}],
            width: 'auto',
            eventType: 'click',
            selector: '',
            offsets: {
                x: 0,
                y: 0
            },
            position: '4-1',
            onShow: function () { },
            onHide: function () { }
        };

        // Drop 配置
        var objParams = Object.assign({}, defaults, options || {});

        // 关闭SVG
        var SVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>';

        // ui类名
        // 类名变量
        // 样式类名统一处理
        var CL = {
            add: function () {
                return ['ui-dropanel'].concat([].slice.call(arguments)).join('-');
            },
            toString: function () {
                return 'ui-dropanel';
            }
        };

        // 面板容器
        var elePanel = document.createElement('div');
        elePanel.className = CL.add('x');
        // 面板的宽度设置
        // 如果纯数值，认为是px长度
        if (/^\d+$/.test(objParams.width)) {
            elePanel.style.width = objParams.width + 'px';
        } else if (/^\d+\D+$/.test(objParams.width)) {
            elePanel.style.width = objParams.width;
        }

        // 创建轻弹框面板的各个元素
        // title
        var eleTitle = document.createElement('h5');
        eleTitle.className = CL.add('title');
        eleTitle.innerHTML = objParams.title;

        // close button
        var eleClose = document.createElement('button');
        eleClose.setAttribute('aria-label', '关闭');
        eleClose.innerHTML = SVG;
        eleClose.className = CL.add('close');

        // content
        var eleContent = document.createElement('content');
        eleContent.className = CL.add('content');
        eleContent.innerHTML = objParams.content;

        // footer
        var eleFooter = document.createElement('div');
        eleFooter.className = CL.add('footer');

        // 组装
        elePanel.appendChild(eleTitle);
        elePanel.appendChild(eleClose);
        elePanel.appendChild(eleContent);
        elePanel.appendChild(eleFooter);

        // 初始化
        this.init(eleTrigger, elePanel, {
            eventType: objParams.eventType,
            offsets: objParams.offsets,
            // 实现点击或hover事件的委托实现
            selector: objParams.selector,
            position: objParams.position,
            onShow: objParams.onShow,
            onHide: objParams.onHide
        });

        // 重新添加element
        Object.assign(this.element, {
            panel: elePanel,
            title: eleTitle,
            close: eleClose,
            content: eleContent,
            footer: eleFooter
        });

        // 绑定事件
        // 关闭事件
        eleClose.addEventListener('click', function () {
            this.hide();
        }.bind(this), false);

        // 按钮
        objParams.buttons.forEach(function (objBtn, numIndex) {
            // 避免btn为null等值报错
            objBtn = objBtn || {};
            // 按钮的默认参数
            var strType = objBtn.type || '';
            if (!strType && numIndex == 0) {
                strType = 'danger';
            }
            var strValue = objBtn.value;
            if (!strValue) {
                strValue = ['确定', '取消'][numIndex];
            }

            // 如果没有指定事件，则认为是关闭行为
            var objEvents = objBtn.events || {
                click: function () {
                    this.hide();
                }.bind(this)
            };

            // 如果没有指定事件类型，直接是函数
            // 则认为是点击事件
            if (typeof objEvents == 'function') {
                objEvents = {
                    click: objEvents
                };
            }

            var eleBtn = null;

            // 普通按钮
            if (!objBtn['for']) {
                eleBtn = document.createElement('button');
                this.element['button' + numIndex] = eleBtn;
            } else {
                eleBtn = document.createElement('label');
                eleBtn.setAttribute('for', objBtn['for']);
                eleBtn.setAttribute('role', 'button');
            }
            // 按钮的文案
            eleBtn.innerHTML = strValue;
            // 按钮类名
            eleBtn.className = String(CL).replace('dropanel', 'button') + ' ' + CL.add('button') + ' ' + (objBtn.className || '');
            // 按钮的类型
            if (strType) {
                eleBtn.setAttribute('data-type', strType);
            }
            this.element['button' + numIndex] = eleBtn;

            for (var strEventType in objEvents) {
                eleBtn.addEventListener(strEventType, function (event) {
                    event.drop = this;
                    objEvents[strEventType](event);
                }.bind(this), false);
            }
            this.element.footer.appendChild(eleBtn);
        }.bind(this));

        return this;
    };

    // is-drop 属性下的快捷语法
    var funAutoInitAndWatching = function () {
        var strSelector = '[is-drop]';

        // 同步更新分页内容的方法
        var funSyncRefresh = function (nodes) {
            if (!nodes || !nodes.forEach) {
                return;
            }

            nodes.forEach(function (node) {
                if (node.nodeType !== 1) {
                    return;
                }
                var attrDrop = node.getAttribute('is-drop');
                var objOption = {
                    eventType: node.getAttribute('data-eventtype') || 'click'
                };
                var objDrop = null;
                if (attrDrop) {
                    objDrop = new Drop(node, attrDrop, objOption);
                } else {
                    objDrop = new Drop(node, objOption);
                }

                node.dispatchEvent(new CustomEvent('connected', {
                    detail: {
                        drop: objDrop
                    }
                }));
            });
        };

        // 所有 is-drop 元素初始设置
        funSyncRefresh(document.querySelectorAll(strSelector));

        if (window.watching === false) {
            return;
        }

        // DOM Insert检测自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    if (mutation.type == 'childList') {
                        mutation.addedNodes.forEach(function (eleAdd) {
                            if (eleAdd.matches && eleAdd.matches(strSelector)) {
                                funSyncRefresh([eleAdd]);
                            } else if (eleAdd.querySelector) {
                                funSyncRefresh(eleAdd.querySelectorAll(strSelector));
                            }
                        });
                    }
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

    return Drop;
}));
