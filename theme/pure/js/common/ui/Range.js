/**
 * @Range.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-20
 * @edit:    19-09-24 remove jQuery by 5ibinbin
 * @review:  19-09-27 by zhangxinxu
 */
/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Tips = require('./Tips');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Range = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Tips = (this || self).Tips;

    if (typeof require === 'function' && !Tips) {
        Tips = require('common/ui/Tips');
    } else if (!Tips) {
        window.console.error('need Tips.js');
        return {};
    }

    /**
     * 基于HTML原生range范围选择框的模拟选择框效果
     * 兼容IE9+
     * min/max/step
     */
    // 状态类名
    var REVERSE = 'reverse';
    var ACTIVE = 'active';
    var DISABLED = 'disabled';

    // 样式类名统一处理
    var CL = {
        add: function () {
            return ['ui', 'range'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-range';
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
     * range滑块效果
     * @param {Object} element 原生的type为range的input元素
     * @param {Object} options 可选参数
     */
    var Range = function (element, options) {
        var defaults = {
            reverse: false,
            tips: function (value) {
                return value;
            }
        };

        options = options || {};

        // 参数合并
        var objParams = Object.assign({}, defaults, options);

        // 获取<range>元素
        var eleRange = element;
        if (typeof element == 'string') {
            eleRange = document.querySelector(element);
        }

        if (!eleRange) {
            return this;
        }

        // 如果 eleRange 不是隐藏状态，则认为是原生显示
        if (window.getComputedStyle(eleRange).visibility !== 'hidden') {
            return;
        }

        if (eleRange.data && eleRange.data.range) {
            return eleRange.data.range;
        }

        // 一些属性值获取
        var numMin = eleRange.getAttribute('min') || 0;
        var numMax = eleRange.getAttribute('max') || 100;
        var numStep = eleRange.getAttribute('step') || 1;

        // 一些元素的创建
        var eleContainer = document.createElement('div');
        var eleRangeClass = eleRange.className;
        eleContainer.setAttribute('class', eleRangeClass);
        eleContainer.classList.add(CL);

        // 轨道元素
        var eleTrack = document.createElement('div');
        eleTrack.classList.add(CL.add('track'));

        // 中间的圈圈
        var eleThumb = document.createElement('a');
        eleThumb.setAttribute('href', 'javascript:');
        eleThumb.setAttribute('aria-valuenow', eleRange.value);
        eleThumb.setAttribute('aria-valuemax', numMax);
        eleThumb.setAttribute('aria-valuemin', numMin);
        eleThumb.setAttribute('role', 'slider');
        eleThumb.setAttribute('draggable', 'false');
        eleThumb.classList.add(CL.add('thumb'));

        // 是否反向
        if (objParams.reverse || eleRange.classList.contains(REVERSE) || eleRange.hasAttribute(REVERSE)) {
            objParams.reverse = true;
            eleThumb.classList.add(REVERSE);
        }

        // tips提示Function
        var strTips = eleRange.getAttribute('data-tips');
        if (strTips && !options.tips) {
            if (strTips == 'null') {
                objParams.tips = null;
            } else {
                objParams.tips = function (value) {
                    return strTips.replace('${value}', value);
                };
            }
        }

        // 前置插入
        eleRange.insertAdjacentElement('afterend', eleContainer);
        // 如果元素没宽度，则使用el计算的宽度
        if (eleRange.getAttribute('width') != '100%' && eleRange.parentElement.classList.contains(CL.add('input')) == false) {
            eleContainer.style.width = window.getComputedStyle(eleRange).width;
        } else {
            eleContainer.style.display = 'block';
        }
        eleContainer.style.height = window.getComputedStyle(eleRange).height;

        eleRange.style.display = 'none';

        // 组装
        eleTrack.appendChild(eleThumb);
        eleContainer.appendChild(eleTrack);

        // 全局变量
        this.number = {
            min: +numMin,
            max: +numMax,
            step: +numStep
        };
        // 暴露给其他方法
        this.element = {
            input: eleRange,
            container: eleContainer,
            track: eleTrack,
            thumb: eleThumb
        };
        this.params = objParams;
        // 初始化
        this.value();
        // 事件
        this.event();

        // 禁用态
        if (eleRange[DISABLED] == true) {
            this.disabled = true;
        }

        // 实例自身通过DOM元素暴露
        if (!eleRange.data) {
            eleRange.data = {};
        }

        eleRange.data.range = this;

        return this;
    };

    /**
     * 相关的事件处理
     * @return {[type]} [description]
     */
    Range.prototype.event = function () {
        // 各个元素
        var objElement = this.element;
        var objNumber = this.number;
        // 主要的几个元素
        var eleRange = objElement.input;
        var eleContainer = objElement.container;
        var eleThumb = objElement.thumb;
        // 一些数值
        var numMin = objNumber.min;
        var numMax = objNumber.max;
        var numStep = objNumber.step;

        // 移动
        eleContainer.addEventListener('click', function (event) {
            var target = event && event.target;
            if (target && target !== eleThumb && !eleRange.disabled) {
                var distance = event.clientX - eleRange.offsetLeft - eleThumb.offsetLeft - parseInt(window.getComputedStyle(eleThumb).width) / 2;
                var value = eleRange.value * 1 + (numMax - numMin) * distance / parseInt(eleContainer.style.width || eleContainer.clientWidth);
                this.value(value);
            }
        }.bind(this));

        // 拖动
        var objPosThumb = {};
        var funBindTips = function () {
            if (this.params.tips) {
                var strContent = this.params.tips.call(eleThumb, eleRange.value);
                if (this.tips) {
                    this.tips.content = strContent;
                    this.tips.show();
                } else {
                    this.tips = new Tips(eleThumb, {
                        eventType: 'null',
                        content: strContent
                    });
                }
            }
        };

        // 判断是否支持touch事件
        eleThumb.addEventListener(objEventType.start, function (event) {
            if (eleRange.disabled) {
                return;
            }
            // 阻止默认行为
            // 否则iOS下可能会触发点击行为
            event.preventDefault();

            if (event.touches && event.touches.length) {
                event = event.touches[0];
            }
            objPosThumb.x = event.clientX;
            objPosThumb.value = eleRange.value * 1;
            // 返回此时tips的提示内容
            funBindTips.call(this);

            eleThumb.classList.add(ACTIVE);
        }.bind(this));

        if (objEventType.start == 'mousedown') {
            eleThumb.addEventListener('mouseenter', function () {
                if (eleThumb.classList.contains(ACTIVE) == false) {
                    funBindTips.call(this);
                }
            }.bind(this));
            eleThumb.addEventListener('mouseout', function () {
                if (eleThumb.classList.contains(ACTIVE) == false) {
                    if (this.tips) {
                        this.tips.hide();
                    }
                }
            }.bind(this));
        }

        // 移动时候
        document.addEventListener(objEventType.move, function (event) {
            if (typeof objPosThumb.x === 'number' && eleThumb.classList.contains(ACTIVE)) {
                // 阻止默认行为
                event.preventDefault();

                if (event.touches && event.touches.length) {
                    event = event.touches[0];
                }
                // 获取当前位置
                var numDistance = event.clientX - objPosThumb.x;
                // 根据移动的距离，判断值
                var value = objPosThumb.value + (numMax - numMin) * numDistance / parseInt(eleContainer.style.width || eleContainer.clientWidth);

                // 赋值
                this.value(value);

                // 改变提示内容
                if (this.tips) {
                    this.tips.content = this.params.tips.call(eleThumb, eleRange.value);
                    this.tips.show();
                }
            }
        }.bind(this));

        // 触摸或点击抬起时候
        document.addEventListener(objEventType.end, function () {
            if (eleThumb.classList.contains(ACTIVE)) {
                objPosThumb.x = null;
                objPosThumb.value = null;
                if (this.tips) {
                    this.tips.hide();
                }
                eleThumb.classList.remove(ACTIVE);
            }
        }.bind(this));

        // 键盘支持，左右
        eleThumb.addEventListener('keydown', function (event) {
            if (eleRange.disabled) {
                return;
            }
            var strValue = eleRange.value * 1;
            if (event.keyCode == 37 || event.keyCode == 39) {
                event.preventDefault();
                if (event.keyCode == 37) {
                    // left
                    strValue = Math.max(numMin, strValue - numStep);
                } else if (event.keyCode == 39) {
                    // right
                    strValue = Math.min(numMax, strValue + numStep * 1);
                }
                this.value(strValue);
            }
        }.bind(this));

        // 自适应场景下的resize处理
        if (eleContainer.style.display == 'block') {
            window.addEventListener('resize', function () {
                this.position();
            }.bind(this));
        }

        // 禁用状态变化检测
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    if (mutation.type == 'attributes') {
                        this[DISABLED] = eleRange[DISABLED];
                    }
                }.bind(this));
            }.bind(this));

            observerSelect.observe(eleRange, {
                attributes: true,
                attributeFilter: [DISABLED]
            });
        } else {
            eleRange.addEventListener('DOMAttrModified', function (event) {
                if (event.attrName == DISABLED) {
                    this[DISABLED] = eleRange[DISABLED];
                }
            }.bind(this));
        }
    };

    /**
     * range输入框赋值与定位
     * @param  {String} value 需要赋予的值
     * @return {Object}       返回当前实例对象
     */
    Range.prototype.value = function (value) {
        var eleInput = this.element.input;
        var oldValue = eleInput.value;

        // 一些值
        var number = this.number;
        var numMax = number.max;
        var numMin = number.min;
        var numStep = number.step;

        if (!value && value !== 0) {
            oldValue = value;
            value = eleInput.value || Math.floor(numMin / 2 + numMax / 2);
        }
        // 区域范围判断以及值是否合法的判断
        if (value > numMax || (numMax - value) < numStep / 2) {
            value = numMax;
        } else if (value === '' || value < numMin || (value - numMin) < numStep / 2) {
            value = numMin;
        } else {
            // 寻找最近的合法value值
            value = numMin + Math.round((value - numMin) / numStep) * numStep;
        }
        // 改变range内部的value值
        eleInput.value = value;
        // 圈圈重新定位
        this.position();
        // 如果前后值不一样，触发change事件
        if (value !== oldValue) {
            eleInput.dispatchEvent(new CustomEvent('change', {
                'bubbles': true
            }));
        }
        return this;
    };

    /**
     * 根据range的值确定UI滑块的位置
     * @return {Object}       返回当前实例对象
     */
    Range.prototype.position = function () {
        var eleInput = this.element.input;
        var eleContainer = this.element.container;
        // 几个数值
        var objNumber = this.number;
        var strValue = eleInput.value;

        var numMax = objNumber.max;
        var numMin = objNumber.min;
        // 计算百分比
        this.element.track.style.borderLeftWidth = parseInt(eleContainer.style.width || eleContainer.clientWidth) * (strValue - numMin) / (numMax - numMin) + 'px';
        // aria同步
        this.element.thumb.setAttribute('aria-valuenow', strValue);

        return this;
    };


    /**
     * 定义一个disabled属性，设置元素的禁用态与否
     * @param {[type]} )
     */
    Object.defineProperty(Range.prototype, DISABLED, {
        configurable: true,
        enumerable: true,
        writeable: true,
        get: function () {
            return this.element.input[DISABLED];
        },
        set: function (value) {
            var objElement = this.element;

            var eleContainer = objElement.container;
            var eleThumb = objElement.thumb;

            // 如果设置禁用
            if (value) {
                // 容器样式变化
                eleContainer.classList.add(CL.add(DISABLED));
                // 滑块按钮不能focus
                eleThumb.removeAttribute('href');
                return;
            }

            // 容器样式变化
            eleContainer.classList.remove(CL.add(DISABLED));
            // 滑块按钮不能focus
            eleThumb.setAttribute('href', 'javascript:');
        }
    });

    var funAutoInitAndWatching = function () {
        // 如果没有开启自动初始化，则返回
        if (window.autoInit === false) {
            return;
        }
        // 遍历页面上的range元素
        var strSelector = 'input[type="range"]';
        // IE11模式下IE9识别不了[type="range"]
        // 原生IE9没这个问题
        // 所以这里做一个妥协处理，不支持[type="range"]匹配的使用类名匹配
        var eleInput = document.createElement('input');
        eleInput.setAttribute('type', 'range');
        if (eleInput.getAttribute('type') != 'range') {
            strSelector = 'input.' + CL.add('input') + ',.' + CL.add('input') + '>input';
        }

        // 自动绑定 range 输入框
        var funSyncRefresh = function (nodes, action) {
            if (!nodes) {
                return;
            }
            if (!nodes.forEach) {
                if (nodes.matches && nodes.matches(strSelector)) {
                    nodes = [nodes];
                } else if (nodes.querySelector) {
                    nodes = nodes.querySelectorAll(strSelector);
                }
            }

            if (!nodes.forEach) {
                return;
            }

            nodes.forEach(function (node) {
                if (node.matches(strSelector)) {
                    if (action == 'remove' && node.data && node.data.range) {
                        var objElement = node.data.range.element;
                        if (objElement.thumb && objElement.thumb.data && objElement.thumb.data.tips) {
                            objElement.thumb.data.tips.element.tips.remove();
                        }
                        objElement.container.remove();
                    } else if (!node.data || !node.data.range) {
                        new Range(node);
                    }
                }
            });
        };

        // 如果没有开启观察，不监听DOM变化
        if (window.watching === false) {
            return;
        }

        funSyncRefresh(document.querySelectorAll(strSelector));

        // DOM Insert自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    var nodeAdded = mutation.addedNodes;
                    var nodeRemoved = mutation.removedNodes;

                    if (nodeAdded.length) {
                        nodeAdded.forEach(function (eleAdd) {
                            funSyncRefresh(eleAdd, 'add');
                        });
                    }
                    if (nodeRemoved.length) {
                        nodeRemoved.forEach(function (eleRemove) {
                            funSyncRefresh.call(mutation, eleRemove, 'remove');
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
                funSyncRefresh(event.target, 'add');
            });
            document.body.addEventListener('DOMNodeRemoved', function (event) {
                // 删除节点
                // 这里方法执行的时候，元素还在页面上
                funSyncRefresh(event.target, 'remove');
            });
        }
    };

    // 监听-免初始绑定
    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }

    return Range;
}));
