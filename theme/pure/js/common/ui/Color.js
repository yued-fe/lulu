/**
 * @Color.js
 * @author zhangxinxu
 * @version
 * Created: 16-06-03
 */
/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Drop = require('./Drop');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Color = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {
    // require
    var Drop = (this || self).Drop;
    if (typeof require == 'function' && !Drop) {
        Drop = require('common/ui/Drop');
    } else if (!Drop) {
        window.console.error('need Drop.js');

        return {};
    }

    /**
     * 基于HTML原生color颜色选择
     * 兼容IE9+
     * type=color Hex format
     */

    // 样式类名统一处理
    var CL = {
        add: function () {
            return ['ui-color'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-color';
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

    // 其他变量
    var ACTIVE = 'active';
    var BGCOLOR = 'background-color';
    var defaultValue = '#000000';

    /* 一些颜色间的相互转换的公用方法 */

    // hsl颜色转换成十六进制颜色
    var funHslToHex = function (h, s, l) {
        var r, g, b;

        if (s == 0) {
            // 非彩色的
            r = g = b = l;
        } else {
            var hue2rgb = function (p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

                return p;
            };

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        var arrRgb = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];

        return arrRgb.map(function (rgb) {
            rgb = rgb.toString(16);

            if (rgb.length == 1) {
                return '0' + rgb;
            }

            return rgb;
        }).join('');
    };

    // 16进制颜色转换成hsl颜色表示
    var funHexToHsl = function (hex) {
        var r = parseInt(hex.slice(0, 2), 16) / 255;
        var g = parseInt(hex.slice(2, 4), 16) / 255;
        var b = parseInt(hex.slice(4, 6), 16) / 255;

        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h, s;
        var l = (max + min) / 2;

        if (max == min) {
            // 非彩色
            h = s = 0;
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    };

    // rgb/rgba颜色转hex
    var funRgbToHex = function (rgb) {
        if (!rgb) {
            return defaultValue;
        }
        var arr = [];

        // 如果是不全的hex值，不全
        // 有没有#都支持
        rgb = rgb.replace('#', '').toLowerCase();

        if (/^[0-9A-F]{1,6}$/i.test(rgb)) {
            return '#' + rgb.repeat(Math.ceil(6 / rgb.length)).slice(0, 6);
        }

        // 如果是rgb(a)色值，防止不合法的值报错
        arr = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i) || [];
        var hex = function (x) {
            return ('0' + parseInt(x, 10).toString(16)).slice(-2);
        };

        if (arr.length == 4) {
            return '#' + hex(arr[1]) + hex(arr[2]) + hex(arr[3]);
        }

        return defaultValue;
    };

    /**
     * 颜色选择实例方法
     * @param {[type]} element [description]
     * @param {[type]} options [description]
     */
    var Color = function (element, options) {
        // 参数
        var defaults = {
            offsets: {
                x: 0,
                y: 0
            },
            edgeAdjust: false,
            position: '7-5',
            onShow: function () {},
            onHide: function () {}
        };
        var objParams = Object.assign({}, defaults, options || {});

        // element如果是选择器
        if (typeof element == 'string') {
            element = document.querySelector(element);
        }

        // el需要是原生的type=color的输入框
        if (!element) {
            return;
        }

        // 必须是透明度为0
        if (window.getComputedStyle(element).opacity !== '0') {
            return;
        }

        var eleInput = element;

        // 避免重复初始化
        if (eleInput.data && eleInput.data.color) {
            return eleInput.data.color;
        }

        // 一些默认的属性值
        var id = eleInput.id;

        if (!id) {
            // 创建随机id
            id = 'lulu_' + (Math.random() + '').split('.')[1];
            eleInput.id = id;
        }

        // 只读
        eleInput.setAttribute('readonly', 'readonly');
        // 阻止默认的颜色选择出现
        eleInput.addEventListener('click', function (event) {
            event.preventDefault();
        });
        // Edge14-Edge18
        if (eleInput.type == 'color' && window.msCredentials) {
            eleInput.addEventListener('focus', function () {
                this.blur();
            });
        }

        // 元素构建
        // track是替换输入框的色块元素的轨道
        var eleTrack = document.createElement('label');
        eleTrack.setAttribute('for', id);
        eleTrack.classList.add(CL.add('track'));

        // thumb是替换输入框的色块元素的色块区域
        var eleThumb = document.createElement('span');
        eleThumb.classList.add(CL.add('thumb'));

        // 前置插入
        eleTrack.appendChild(eleThumb);
        eleInput.insertAdjacentElement('beforebegin', eleTrack);

        // 浮层容器
        var eleContainer = document.createElement('div');
        eleContainer.classList.add(CL.add('container'));

        // 全局暴露的一些元素
        this.element = {
            input: eleInput,
            container: eleContainer,
            track: eleTrack,
            thumb: eleThumb
        };

        // 暴露的回调方法
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };

        this.params = {
            offsets: objParams.offsets,
            edgeAdjust: objParams.edgeAdjust,
            position: objParams.position
        };

        // 全局的基础色值
        var arrBasicColor = ['0', '3', '6', '9', 'c', 'f'];
        var arrFixedColor = arrBasicColor.concat('eb4646', '1cad70', '2a80eb', 'f59b00');
        this.color = {
            basic: arrBasicColor,
            fixed: arrFixedColor
        };

        // 事件绑定
        this.initEvents();

        // 初始化
        this.value(eleInput.value);

        // data暴露
        if (eleInput.data) {
            eleInput.data = {};
        }
        eleInput.data.color = this;

        return this;
    };

    /**
     * 颜色选择器的事件们
     * @return {[type]} [description]
     */
    Color.prototype.initEvents = function () {
        var objElement = this.element;
        // 元素们
        var eleInput = objElement.input;
        var eleTrack = objElement.track;
        var eleContainer = objElement.container;
        // 参数
        var objParams = this.params;

        // 浮层显隐与定位
        this.drop = new Drop(eleInput, eleContainer, {
            eventType: 'click',
            offsets: objParams.offsets,
            edgeAdjust: objParams.edgeAdjust,
            position: objParams.position,
            onShow: function () {
                this.show();

                // 颜色面板边界超出的微调
                if (objParams.edgeAdjust == false) {
                    var objRect = eleContainer.getBoundingClientRect();
                    if (objRect.left < 3) {
                        eleContainer.style.left =  '3px';
                    } else if (objRect.right - screen.width > 3) {
                        eleContainer.style.left = (screen.width - objRect.width - 3) + 'px';
                    }
                }
            }.bind(this),
            onHide: function () {
                this.hide();

                eleContainer.style.marginLeft = 0;
            }.bind(this)
        });

        // 键盘无障碍访问的处理
        eleInput.addEventListener('focus', function () {
            if (window.isKeyEvent) {
                eleTrack.classList.add('ui-outline');
            }
        });
        eleInput.addEventListener('blur', function () {
            eleTrack.classList.remove('ui-outline');
        });
    };

    /**
     * container内的一些事件
     * @return {Object} 返回当前实例对象
     */
    Color.prototype.events = function () {
        var objElement = this.element;
        // 元素
        var eleContainer = objElement.container;
        // 更多元素
        // 元素
        var eleCircle = objElement.circle;
        var eleFill = objElement.fill;
        var eleArrow = objElement.arrow;
        // 面板内部唯一的输入框元素
        var eleField = objElement.field;

        // var keycode = {
        //     37: 'left',
        //     38: 'up',
        //     39: 'right',
        //     40: 'down',
        //     13: 'enter'
        // };

        eleContainer.addEventListener('click', function (event) {
            var eleTarget = event.target;

            // IE可能是文件节点
            if (!eleTarget.matches || !eleTarget.matches('a, button')) {
                return;
            }

            // 选择的颜色值
            var strValue = '';
            // 当前类名
            var strCl = eleTarget.className;
            // 按钮分类别处理
            if (/cancel/.test(strCl)) {
                // 1. 取消按钮
                this.hide();
            } else if (/ensure/.test(strCl)) {
                // 2. 确定按钮
                // 赋值
                strValue = eleField.value;

                if (strValue) {
                    this.value('#' + strValue);
                }
                this.hide();
            } else if (/lump/.test(strCl)) {
                // 3. 小色块
                strValue = eleTarget.getAttribute('data-color');
                eleField.value = strValue;
                this.match();
            } else if (/switch/.test(strCl)) {
                // 4. 面板类名切换按钮
                if (eleTarget.innerHTML == '更多') {
                    objElement.more.style.display = 'block';
                    objElement.basic.style.display = 'none';
                    eleTarget.innerHTML = '基本';
                } else {
                    objElement.more.style.display = 'none';
                    objElement.basic.style.display = 'block';
                    eleTarget.innerHTML = '更多';
                }
                // 面板的色块啊，圆和尖角位置匹配
                this.match();
            } else if (/cover/.test(strCl)) {
                // 5. 渐变色的覆盖层
                // offsetLeft, offsetTop
                var objRect = eleTarget.getBoundingClientRect();
                var numOffsetLeft = event.pageX - objRect.left;
                var numOffsetTop = event.pageY - window.pageYOffset - objRect.top;

                // width, height
                var numWidth = eleTarget.clientWidth;
                var numHeight = eleTarget.clientHeight;

                // color
                var numColorH, strColorS;

                if (eleCircle && eleFill && eleArrow) {
                    if (/white/.test(strCl) == true) {
                        numColorH = numOffsetLeft / numWidth;
                        strColorS = 1 - numOffsetTop / numHeight;

                        // 圈圈定位
                        eleCircle.style.left = numOffsetLeft + 'px';
                        eleCircle.style.top = numOffsetTop + 'px';

                        var strHsl = 'hsl(' + [360 * numColorH, 100 * strColorS + '%', '50%'].join() + ')';

                        eleCircle.style[BGCOLOR] = strHsl;
                    } else {
                        eleArrow.style.top = numOffsetTop + 'px';
                    }

                    // 赋值
                    eleField.value = this.getValueByStyle().replace('#', '');
                    // UI变化
                    this.match();
                }
            }
        }.bind(this));

        // 输入框事件
        eleField.addEventListener('input', function () {
            // 获取面板中的input
            var value = this.element.field.value;
            if (/^[0-9A-F]{6}$/i.test(value)) {
                this.match();
            } else if (/^[0-9A-F]{3}$/i.test(value)) {
                this.match(funRgbToHex('#' + value).replace('#', ''));
            }
        }.bind(this));

        eleField.addEventListener('keyup', function (event) {
            if (event.keyCode == 13) {
                var strValue = eleField.value;
                var strOldvalue = strValue;
                if (strValue) {
                    strValue = funRgbToHex('#' + strValue);
                    if (strValue != strOldvalue) {
                        // 支持输入#000
                        eleField.value = strValue;
                    }
                    this.value(strValue);
                }
                this.hide();
            }
        }.bind(this));

        // 滑块拖动事件
        var objPosArrow = {};
        var objPosCircle = {};

        // 三角上下
        eleArrow.addEventListener(objEventType.start, function (event) {
            event.preventDefault();

            if (event.touches && event.touches.length) {
                event = event.touches[0];
            }
            objPosArrow.pageY = event.pageY;
            objPosArrow.top = parseFloat(window.getComputedStyle(eleArrow).top);
        });

        eleFill.addEventListener(objEventType.start, function (event) {
            event.preventDefault();

            // 5. 渐变色的覆盖层
            // offsetLeft, offsetTop
            var eleTarget = event.target;
            var objRect = eleTarget.getBoundingClientRect();
            var numOffsetTop = event.pageY - window.pageYOffset - objRect.top;

            eleArrow.style.top = numOffsetTop + 'px';

            if (event.touches && event.touches.length) {
                event = event.touches[0];
            }
            objPosArrow.pageY = event.pageY;
            objPosArrow.top = parseFloat(window.getComputedStyle(eleArrow).top);

            // 赋值，此次赋值，无需重定位
            eleField.value = this.getValueByStyle().replace('#', '');

            this.match(false);
        }.bind(this));

        // 圆圈移动
        eleCircle.parentElement.querySelectorAll('a').forEach(function (eleRegion) {
            eleRegion.addEventListener(objEventType.start, function (event) {
                event.preventDefault();
                if (event.touches && event.touches.length) {
                    event = event.touches[0];
                }

                objPosCircle.pageY = event.pageY;
                objPosCircle.pageX = event.pageX;
                // 当前位移位置
                eleCircle.style.left = event.offsetX + 'px';
                eleCircle.style.top = event.offsetY + 'px';
                objPosCircle.top = parseFloat(event.offsetY);
                objPosCircle.left = parseFloat(event.offsetX);

                // 最大位置范围
                var objMaxPos = {
                    top: eleCircle.parentElement.clientHeight,
                    left: eleCircle.parentElement.clientWidth
                };
                // 根据目标位置位置和变色
                var numColorH = event.offsetX / objMaxPos.left;
                var strColorS = 1 - event.offsetY / objMaxPos.top;

                var strHsl = 'hsl(' + [360 * numColorH, 100 * strColorS + '%', '50%'].join() + ')';

                eleCircle.style[BGCOLOR] = strHsl;

                // 赋值，此次赋值，无需重定位
                eleField.value = this.getValueByStyle().replace('#', '');

                this.match(false);
            }.bind(this));
        }.bind(this));

        // 圆圈移动
        eleCircle.addEventListener(objEventType.start, function (event) {
            event.preventDefault();

            if (event.touches && event.touches.length) {
                event = event.touches[0];
            }
            objPosCircle.pageY = event.pageY;
            objPosCircle.pageX = event.pageX;

            var objStyleCircle = window.getComputedStyle(eleCircle);
            // 当前位移位置
            objPosCircle.top = parseFloat(objStyleCircle.top);
            objPosCircle.left = parseFloat(objStyleCircle.left);
        });

        document.addEventListener(objEventType.move, function (event) {
            if (typeof objPosArrow.top == 'number') {
                event.preventDefault();

                if (event.touches && event.touches.length) {
                    event = event.touches[0];
                }
                var numTop = objPosArrow.top + (event.pageY - objPosArrow.pageY);
                var numMaxTop = eleArrow.parentElement.clientHeight;

                // 边界判断
                if (numTop < 0) {
                    numTop = 0;
                } else if (numTop > numMaxTop) {
                    numTop = numMaxTop;
                }
                eleArrow.style.top = numTop + 'px';
                // 赋值，此次赋值，无需重定位
                eleField.value = this.getValueByStyle().replace('#', '');

                this.match(false);
            } else if (typeof objPosCircle.top == 'number') {
                event.preventDefault();

                if (event.touches && event.touches.length) {
                    event = event.touches[0];
                }

                var objPos = {
                    top: objPosCircle.top + (event.pageY - objPosCircle.pageY),
                    left: objPosCircle.left + (event.pageX - objPosCircle.pageX)
                };

                // 最大位置范围
                var objMaxPos = {
                    top: eleCircle.parentElement.clientHeight,
                    left: eleCircle.parentElement.clientWidth
                };

                // 边界判断
                if (objPos.left < 0) {
                    objPos.left = 0;
                } else if (objPos.left > objMaxPos.left) {
                    objPos.left = objMaxPos.left;
                }
                if (objPos.top < 0) {
                    objPos.top = 0;
                } else if (objPos.top > objMaxPos.top) {
                    objPos.top = objMaxPos.top;
                }

                // 根据目标位置位置和变色
                var numColorH = objPos.left / objMaxPos.left;
                var strColorS = 1 - objPos.top / objMaxPos.top;

                // 圈圈定位
                eleCircle.style.left = objPos.left + 'px';
                eleCircle.style.top = objPos.top + 'px';

                var strHsl = 'hsl(' + [360 * numColorH, 100 * strColorS + '%', '50%'].join() + ')';

                eleCircle.style[BGCOLOR] = strHsl;

                // 赋值
                eleField.value = this.getValueByStyle().replace('#', '');
                // UI变化
                this.match(false);
            }
        }.bind(this), {
            passive: false
        });
        document.addEventListener(objEventType.end, function () {
            objPosArrow.top = null;
            objPosCircle.top = null;
        });

        // 滑块的键盘支持
        eleFill.parentElement.querySelectorAll('a').forEach(function (eleButton) {
            eleButton.addEventListener('keydown', function (event) {
                // 上下控制
                if (event.keyCode == 38 || event.keyCode == 40) {
                    event.preventDefault();

                    var numTop = parseFloat(window.getComputedStyle(eleArrow).top);

                    var numMaxTop = eleFill.clientHeight;

                    if (event.keyCode == 38) {
                        numTop--;
                        if (numTop < 0) {
                            numTop = 0;
                        }
                    } else {
                        numTop++;
                        if (numTop > numMaxTop) {
                            numTop = numMaxTop;
                        }
                    }

                    var ariaLabel = eleArrow.getAttribute('aria-label');

                    eleArrow.style.top = numTop + 'px';
                    eleArrow.setAttribute('aria-label', ariaLabel.replace(/\d+/, Math.round(100 * numTop / numMaxTop)));

                    // 赋值，此次赋值，无需重定位
                    eleField.value = this.getValueByStyle().replace('#', '');

                    this.match(false);
                }
            }.bind(this));
        }.bind(this));

        // 圈圈的键盘访问
        // 区域背景的键盘支持
        eleCircle.parentElement.querySelectorAll('a').forEach(function (eleRegion) {
            eleRegion.addEventListener('keydown', function (event) {
                // 上下左右控制
                if (event.keyCode >= 37 && event.keyCode <= 40) {
                    event.preventDefault();

                    var objStyleCircle = window.getComputedStyle(eleCircle);

                    var numTop = parseFloat(objStyleCircle.top);
                    var numLeft = parseFloat(objStyleCircle.left);

                    var numMaxTop = eleRegion.clientHeight;
                    var numMaxLeft = eleRegion.clientWidth;

                    if (event.keyCode == 38) {
                        // up
                        numTop--;
                        if (numTop < 0) {
                            numTop = 0;
                        }
                    } else if (event.keyCode == 40) {
                        // down
                        numTop++;
                        if (numTop > numMaxTop) {
                            numTop = numMaxTop;
                        }
                    } else if (event.keyCode == 37) {
                        // left
                        numLeft--;
                        if (numLeft < 0) {
                            numLeft = 0;
                        }
                    } else if (event.keyCode == 39) {
                        // down
                        numLeft++;
                        if (numLeft > numMaxLeft) {
                            numLeft = numMaxLeft;
                        }
                    }

                    var numColorH = numLeft / numMaxLeft;
                    var numColorS = 1 - numTop / numMaxTop;

                    eleCircle.style.left = numLeft + 'px';
                    eleCircle.style.top = numTop + 'px';

                    var strHsl = 'hsl(' + [360 * numColorH, 100 * numColorS + '%', '50%'].join() + ')';

                    eleCircle.style[BGCOLOR] = strHsl;

                    // 赋值
                    eleField.value = this.getValueByStyle().replace('#', '');
                    this.match();
                }
            }.bind(this));
        }.bind(this));

        return this;
    };

    /**
     * container内HTML的创建
     * @return {Object} 返回当前实例对象
     */
    Color.prototype.create = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleInput = this.element.input;

        // switch button
        var strHtmlConvert = '<button class="' + CL.add('switch') + '" role="button">更多</button>';
        // current color
        var strHtmlCurrent = '<div class="' + CL.add('current') + '">\
            <i class="' + CL.add('current', 'square') + ' colorCurrent"></i>\
            #<input class="' + CL.add('current', 'input') + '">\
        </div>';

        var arrBasicColor = this.color.basic;
        var arrFixedColor = this.color.fixed;

        // body
        var strHtmlBody = '<div class="' + CL.add('body') + '">' +
            (function () {
                // basic color picker
                var strHtml = '<div class="' + CL.add('basic') + ' colorBasicX" role="listbox">';
                var arrCommonColors = (localStorage.commonColors || '').split(',');
                // color left
                strHtml = strHtml + '<aside class="' + CL.add('basic', 'l') + '">' + (function () {
                    return arrFixedColor.concat(arrCommonColors[0] || '0ff', arrCommonColors[1] || '800180').map(function (color) {
                        var strColor = funRgbToHex(color).replace('#', '');

                        return '<a href="javascript:" class="' + CL.add('lump') + '" data-color="' + strColor + '" aria-label="' + strColor + '" style="' + BGCOLOR + ':#' + strColor + '" role="option"></a>';
                    }).join('');
                })() + '</aside>';

                // color main
                strHtml = strHtml + '<div class="' + CL.add('basic', 'r') + '">' + (function () {
                    var strHtmlR = '';
                    arrBasicColor.forEach(function (r) {
                        strHtmlR += '<div class="' + CL.add('lump', 'group') + '">';
                        arrBasicColor.forEach(function (g) {
                            arrBasicColor.forEach(function (b) {
                                var strColor = r + r + g + g + b + b;
                                strHtmlR = strHtmlR + '<a href="javascript:" class="' + CL.add('lump') + '" data-color="' + strColor + '" style="' + BGCOLOR + ':#' + strColor + '" aria-label="' + strColor + '" role="option"></a>';
                            });
                        });
                        strHtmlR += '</div>';
                    });

                    return strHtmlR;
                })() + '</div>';

                return strHtml + '</div>';
            })() +

            (function () {
                var strIdGradient = 'lg-' + eleInput.id;
                var strIdGradient2 = 'lg2-' + eleInput.id;
                // more color picker
                var html = '<div class="' + CL.add('more') + ' colorMoreX">';
                // color left
                html = html + '<div class="' + CL.add('more', 'l') + '">\
                <a href="javascript:" class="' + CL.add('cover', 'white') + '" aria-label="色域背景块" role="region"></a><div class="' + CL.add('circle') + ' colorCircle"></div>\
                <svg>\
                    <defs>\
                        <linearGradient x1="0" y1="0" x2="1" y2="0" id="' + strIdGradient + '">\
                            <stop offset="0%" stop-color="#ff0000"></stop>\
                            <stop offset="16.66%" stop-color="#ffff00"></stop>\
                            <stop offset="33.33%" stop-color="#00ff00"></stop>\
                            <stop offset="50%" stop-color="#00ffff"></stop>\
                            <stop offset="66.66%" stop-color="#0000ff"></stop>\
                            <stop offset="83.33%" stop-color="#ff00ff"></stop>\
                            <stop offset="100%" stop-color="#ff0000"></stop>\
                        </linearGradient>\
                    </defs>\
                    <rect x="0" y="0" width="180" height="100" fill="url(#' + strIdGradient + ')"></rect>\
                </svg></div><div class="' + CL.add('more', 'r') + '">\
                    <div class="' + CL.add('more', 'fill') + ' colorFill">\
                        <a href="javascript:" class="' + CL.add('more', 'cover') + '" aria-label="明度控制背景条" role="region"></a>\
                        <svg>\
                        <defs>\
                            <linearGradient x1="0" y1="0" x2="0" y2="1" id="' + strIdGradient2 + '">\
                                <stop offset="0%" stop-color="#ffffff"></stop>\
                                <stop offset="50%" stop-color="rgba(255,255,255,0)"></stop>\
                                <stop offset="50%" stop-color="rgba(0,0,0,0)"></stop>\
                                <stop offset="100%" stop-color="' + defaultValue + '"></stop>\
                            </linearGradient>\
                        </defs>\
                        <rect x="0" y="0" width="16" height="100" fill="url(#' + strIdGradient2 + ')"></rect>\
                    </svg>\
                    </div>\
                    <a href="javascript:" class="' + CL.add('more', 'arrow') + ' colorArrow" role="slider" aria-label="明度控制按钮：100%"></a>\
                </div>';

                return html + '</div>';
            })() + '</div>';
        // footer
        var strHtmlFooter = '<div class="' + CL.add('footer') + '">\
            <button class="' + CL.add('button', 'cancel') + '">取消</button><button class="' + CL.add('button', 'ensure') + '">确定</button>\
        </div>';
        // append
        eleContainer.innerHTML = strHtmlConvert + strHtmlCurrent + strHtmlBody + strHtmlFooter;

        // 一些元素
        Object.assign(this.element, {
            field: eleContainer.querySelector('input'),
            basic: eleContainer.querySelector('.colorBasicX'),
            more: eleContainer.querySelector('.colorMoreX'),
            circle: eleContainer.querySelector('.colorCircle'),
            fill: eleContainer.querySelector('.colorFill'),
            arrow: eleContainer.querySelector('.colorArrow'),
            current: eleContainer.querySelector('.colorCurrent')
        });

        // 事件
        this.events();

        return this;
    };

    /**
    * 输入框的赋值和取值，同时会更改对应的UI
    * @param {String} value  HEX颜色值，例如'#000000'。可缺省，表示取值
    * @return {Object} 返回当前的实例对象
    */
    Color.prototype.value = function (value) {
        var strValue = value;
        // 元素
        var eleInput = this.element.input;
        var eleThumb = this.element.thumb;
        var eleField = this.element.field;
        // 目前的颜色值
        var strOldValue = eleInput.value;
        // 取值还是赋值
        if (typeof strValue == 'string') {
            // 如果是纯字母，则认为是关键字
            if (/^[a-z]{3,}$/.test(strValue)) {
                document.head.style.backgroundColor = strValue;
                strValue = window.getComputedStyle(document.head).backgroundColor;
                document.head.style.backgroundColor = '';
            }

            // 使用hex值
            strValue = funRgbToHex(strValue);
            // 赋值
            eleInput.value = strValue;
            if (eleField) {
                eleField.value = strValue.replace('#', '');
            }
            // 按钮上的色块值
            eleThumb.style[BGCOLOR] = strValue;

            // 作为常用颜色记录下来
            var strCommonColors = localStorage.commonColors || '';
            var arrCommonColors = strCommonColors.split(',');
            // 前提颜色非纯灰色若干色值
            var arrFixedColor = this.color.fixed;

            if (arrFixedColor.some(function (strFixedColor) {
                return funRgbToHex(strFixedColor) == strValue;
            }) == false) {
                // 过滤已经存在的相同颜色的色值
                arrCommonColors = arrCommonColors.filter(function (strValueWithSharp) {
                    return strValueWithSharp && strValueWithSharp != strValue.replace('#', '');
                });

                // 从前面插入
                arrCommonColors.unshift(strValue.replace('#', ''));

                // 本地存储
                localStorage.commonColors = arrCommonColors.join();

                // 2个动态色值更新
                var eleBasic = this.element.basic;
                if (eleBasic) {
                    var eleAsideColors = eleBasic.querySelectorAll('aside a');
                    var eleBasicColorLast = eleAsideColors[eleAsideColors.length - 2];
                    var eleBasicColorSecond = eleAsideColors[eleAsideColors.length - 1];

                    eleBasicColorLast.setAttribute('data-color', arrCommonColors[0]);
                    eleBasicColorLast.setAttribute('aria-label', arrCommonColors[0]);
                    eleBasicColorLast.style[BGCOLOR] = strValue;

                    var strColorSecond = arrCommonColors[1] || '0ff';
                    eleBasicColorSecond.setAttribute('data-color', strColorSecond);
                    eleBasicColorSecond.setAttribute('aria-label', strColorSecond);
                    eleBasicColorSecond.style[BGCOLOR] = '#' + strColorSecond;
                }
            }

            // 面板上的值，各种定位的匹配
            this.match();
        } else {
            // 取值
            // 如果默认无值，使用颜色作为色值，一般出现在初始化的时候
            if (!strOldValue) {
                strOldValue = defaultValue;
                // 赋值
                eleInput.value = strOldValue;
                // 按钮上的色块值
                eleThumb.style[BGCOLOR] = strOldValue;
            }

            return strOldValue;
        }

        if (strOldValue && strValue != strOldValue) {
            eleInput.dispatchEvent(new CustomEvent('change', {
                'bubbles': true
            }));
        }

        return this;
    };

    /**
     * 根据坐标位置获得hsl值
     * 私有
     * @return {String} [返回当前坐标对应的hex表示的颜色值]
     */
    Object.defineProperty(Color.prototype, 'getValueByStyle', {
        value: function () {
            // 需要的元素
            var eleCircle = this.element.circle;
            var eleArrow = this.element.arrow;

            if (eleCircle.length * eleArrow.length == 0) {
                return defaultValue;
            }

            var numColorH, numColorS, numColorL;
            // get color
            // hsl color
            if (eleCircle.style.left) {
                numColorH = parseFloat(window.getComputedStyle(eleCircle).left) / eleCircle.parentElement.clientWidth;
            } else {
                numColorH = 0;
            }
            if (eleCircle.style.top) {
                numColorS = 1 - parseFloat(window.getComputedStyle(eleCircle).top) / eleCircle.parentElement.clientHeight;
            } else {
                numColorS = 1;
            }
            if (eleArrow.style.top) {
                numColorL = 1 - parseFloat(window.getComputedStyle(eleArrow).top) / eleArrow.parentElement.clientHeight;
            } else {
                numColorL = 0;
            }
            return '#' + funHslToHex(numColorH, numColorS, numColorL);
        }
    });

    /**
     * 面板的色块啊，圆和尖角位置匹配
     * @param  {String} value 面板UI相匹配的色值，可缺省，表示使用当前输入框的颜色值进行UI变化
     * @return {Object}       返回当前实例对象
     */
    Color.prototype.match = function (value) {
        // 首先要面板显示
        if (this.display != true) {
            return this;
        }

        // 元素对象
        var objElement = this.element;
        // 元素
        var eleContainer = objElement.container;
        var eleCurrent = objElement.current;
        // 更多元素
        var eleMore = objElement.more;
        // 元素
        var eleCircle = objElement.circle;
        var eleFill = objElement.fill;
        var eleArrow = objElement.arrow;
        // 面板内部唯一的输入框元素
        var eleField = objElement.field;

        // 重定位
        var isRePosition = true;
        if (value === false) {
            isRePosition = value;
        }

        // 当前的颜色值
        var strValue = value || eleField.value;
        if (strValue == '') {
            // 如果输入框没有值
            // 使用之前一个合法的颜色值作为现在值
            strValue = funRgbToHex(window.getComputedStyle(eleCurrent)[BGCOLOR]).replace('#', '');
            eleField.value = strValue;
        }
        strValue = strValue.replace('#', '');

        // 色块值示意
        eleCurrent.style[BGCOLOR] = '#' + strValue;

        // 当前是基本色面板还是任意色面板
        if (window.getComputedStyle(eleMore).display == 'none') {
            // 1. 基本色
            // 所有当前高亮的元素不高亮
            var eleActive = eleContainer.querySelector('.' + ACTIVE);
            if (eleActive) {
                eleActive.classList.remove(ACTIVE);
            }
            // 所有颜色一致的高亮
            var eleColorMatch = eleContainer.querySelector('a[data-color="' + strValue.toUpperCase() + '"]');
            if (eleColorMatch) {
                eleColorMatch.classList.add(ACTIVE);
            }
        } else {
            // to HSL
            var arrHSL = funHexToHsl(strValue);
            // hsl value
            var numColorH = arrHSL[0];
            var numColorS = arrHSL[1];
            var numColorL = arrHSL[2];

            // 滑块和尖角的颜色和位置
            var strHsl = 'hsl(' + [360 * numColorH, 100 * numColorS + '%', '50%'].join() + ')';

            // 如果不是默认黑色也不是纯白色
            if (strValue != '000000' && strValue != 'ffffff') {
                eleCircle.style[BGCOLOR] = strHsl;
                eleFill.style[BGCOLOR] = strHsl;
            }

            if (isRePosition == true) {
                if (numColorL != 0 && numColorL != 1) {
                    eleCircle.style.left = eleCircle.parentElement.clientWidth * numColorH + 'px';
                    eleCircle.style.top = eleCircle.parentElement.clientHeight * (1 - numColorS) + 'px';
                }

                eleArrow.style.top = eleArrow.parentElement.clientHeight * (1 - numColorL) + 'px';
            }
        }

        return this;
    };

    /**
    * 颜色面板显示
    * @return {Object} 返回当前实例对象
    */
    Color.prototype.show = function () {
        // 元素
        var eleContainer = this.element.container;

        // 输入框赋值
        if (eleContainer.innerHTML.trim() == '') {
            this.create();
        }

        // 面板显示
        if (this.drop.display == false) {
            this.drop.show();
        }
        this.display = this.drop.display;

        // 面板UI匹配
        var eleCurrent = this.element.current;
        if (!eleCurrent.getAttribute('style')) {
            eleCurrent.style[BGCOLOR] = this.element.input.value;
        }
        this.match();

        // onShow callback
        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this, this.element.track, eleContainer);
        }

        return this;
    };

    /**
     * 颜色面板隐藏
     * @return {Object} 返回当前实例对象
     */
    Color.prototype.hide = function () {
        // 面板隐藏
        if (this.drop.display == true) {
            this.drop.hide();
        }
        this.display = this.drop.display;

        this.element.input.focus();

        // onShow callback
        if (typeof this.callback.hide == 'function') {
            this.callback.hide.call(this, this.element.trigger, this.element.container);
        }

        return this;
    };

    var funAutoInitAndWatching = function () {
        // 如果没有开启自动初始化，则返回
        if (window.autoInit === false) {
            return;
        }
        // 遍历页面上的range元素
        var strSelector = 'input[type="color"]';

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

            if (!nodes.length || !nodes.forEach) {
                return;
            }

            nodes.forEach(function (node) {
                if (node.matches && node.matches(strSelector)) {
                    if (action == 'remove' && node.data && node.data.color) {
                        node.data.color.element.track.remove();
                        node.data.color.element.container.remove();
                    } else if (!node.data || !node.data.color) {
                        new Color(node);
                    }
                }
            });
        };

        funSyncRefresh(document.querySelectorAll(strSelector));

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

    // 颜色转换静态方法暴露
    Color.funHexToHsl = funHexToHsl;
    Color.funHslToHex = funHslToHex;
    Color.funRgbToHex = funRgbToHex;

    return Color;
}));
