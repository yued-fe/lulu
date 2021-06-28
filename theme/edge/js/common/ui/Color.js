/**
 * @Color.js
 * @author zhangxinxu
 * @version
 * @created 16-06-03
 * @edited 20-07-16 @Gwokhov
 */

import './Follow.js';

const BG_COLOR = 'background-color';

class Color extends HTMLInputElement {
    // 指定观察的属性，这样attributeChangedCallback才会起作用
    static get observedAttributes () {
        return ['disabled'];
    }

    constructor () {
        super();
        this.setProperty();
    }

    static addClass (...arg) {
        return ['ui', 'color', ...arg].join('-');
    }

    // hsl颜色转换成十六进制颜色
    static funHslToHex (h, s, l, a) {
        let r, g, b;

        if (s == 0) {
        // 非彩色的
            r = g = b = l;
        } else {
            const hue2rgb = function (p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;

                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        const arrRgb = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];

        // Alpha值
        if (a) {
            arrRgb.push(Math.round(a * 255));
        }

        return arrRgb.map(rgb => {
            rgb = rgb.toString(16);

            if (rgb.length == 1) {
                return '0' + rgb;
            }

            return rgb;
        }).join('');
    }

    // 16进制颜色转换成hsl颜色表示
    static funHexToHsl (hex) {
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s;
        const l = (max + min) / 2;

        if (max == min) {
        // 非彩色
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        if (hex.length == 8) {
            const a = parseInt(hex.slice(6, 8), 16) / 255;
            return [h, s, l, a];
        }
        return [h, s, l];
    }

    // rgb/rgba颜色转hex
    static funRgbToHex (rgb) {
        if (!rgb) {
            return Color.defaultValue;
        }
        let arr = [];
        let arrA = [];

        // 如果是不全的hex值，不全
        // 有没有#都支持
        rgb = rgb.replace('#', '').toLowerCase();
        if (/^[0-9A-F]{1,6}$/i.test(rgb)) {
            return '#' + rgb.repeat(Math.ceil(6 / rgb.length)).slice(0, 6);
        }
        if (/^[0-9A-F]{1,8}$/i.test(rgb)) {
            return '#' + rgb.repeat(Math.ceil(8 / rgb.length)).slice(0, 8);
        }

        // 如果是rgb(a)色值
        arr = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)/i);
        arrA = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0|1]?\.?\d+)/i);
        const hex = (x) => ('0' + parseInt(x, 10).toString(16)).slice(-2);

        if (arr && arr.length == 4) {
            return `#${hex(arr[1])}${hex(arr[2])}${hex(arr[3])}`;
        }

        if (arrA && arrA.length == 5) {
            return `#${hex(arrA[1])}${hex(arrA[2])}${hex(arrA[3])}${Math.round(arrA[4] * 255).toString(16).padStart(2, '0')}`;
        }

        return Color.defaultValue;
    }

    get type () {
        return this.getAttribute('type') || 'color';
    }

    set type (v) {
        return this.setAttribute('type', v || 'color');
    }

    /**
     * container内的一些事件
     * @return {Object} 返回当前DOM元素对象
     */
    events () {
        const objElement = this.element;
        // 元素
        const eleContainer = objElement.target;
        // 元素
        const eleCircle = objElement.circle;
        const eleFill = objElement.fill;
        const eleArrow = objElement.arrow;
        // 面板内部唯一的输入框元素
        const eleField = objElement.field;
        // 透明度滑动条
        const eleOpacity = objElement.opacity;

        eleContainer.addEventListener('click', (event) => {
            const eleTarget = event.target;

            // 选择的颜色值
            let strValue = '';
            // 当前类名
            const strCl = eleTarget.className;
            // 按钮分类别处理
            if (/cancel/.test(strCl)) {
                // 1. 取消按钮
                this.hide();
            } else if (/lump/.test(strCl)) {
                // 3. 小色块
                strValue = eleTarget.getAttribute('data-color');
                this.value = '#' + strValue;
            } else if (/switch/.test(strCl)) {
                // 4. 面板类名切换按钮
                if (eleTarget.textContent === '更多') {
                    objElement.more.style.display = 'block';
                    objElement.basic.style.display = 'none';
                    eleTarget.textContent = '基本';
                    objElement.mode.setAttribute('data-mode', 'basic');
                } else {
                    objElement.more.style.display = 'none';
                    objElement.basic.style.display = 'block';
                    eleTarget.textContent = '更多';
                    objElement.mode.setAttribute('data-mode', 'more');
                }
                // 面板的色块啊，圆和尖角位置匹配
                this.match();
            }
        });

        // 输入框事件
        eleField.addEventListener('input', () => {
            const value = this.value;
            if (/^[0-9A-F]{6}$/i.test(value) || /^[0-9A-F]{8}$/i.test(value)) {
                this.match();
            } else if (/^[0-9A-F]{3, 4}$/i.test(value)) {
                this.match(Color.funRgbToHex('#' + value).replace('#', ''));
            }
        });

        eleField.addEventListener('keyup', (event) => {
            if (event.keyCode == 13) {
                let strValue = eleField.value;
                if (strValue) {
                    if (eleOpacity) {
                        strValue = Color.funRgbToHex('#' + strValue).replace('#', '');
                    } else {
                        strValue = Color.funRgbToHex('#' + strValue.slice(0, 6)).replace('#', '');
                    }
                    this.value = '#' + strValue;
                }
                this.hide();
            }
        });

        // 透明度改变的时候
        if (eleOpacity) {
            eleOpacity.addEventListener('input', () => {
                let strValue = eleField.value;
                let curOpacity =  Math.round(eleOpacity.value / 100 * 255).toString(16).padStart(2, '0');

                if (strValue) {
                    let strValueColor = strValue.slice(0, 6) + curOpacity;
                    this.value = strValueColor;
                }
            });
        }


        // 滑块拖动事件
        const objPosArrow = {};
        const objPosCircle = {};
        // 三角上下
        eleArrow.addEventListener(Color.objEventType.start, (event) => {
            event.preventDefault();
            if (event.touches && event.touches.length) {
                event = event.touches[0];
            }
            objPosArrow.pageY = event.pageY;
            objPosArrow.top = parseFloat(window.getComputedStyle(eleArrow).top);
        });
        eleFill.addEventListener(Color.objEventType.start, (event) => {
            event.preventDefault();

            // 5. 渐变色的覆盖层
            // offsetLeft, offsetTop
            let eleTarget = event.target;
            const objRect = eleTarget.getBoundingClientRect();
            const numOffsetTop = event.pageY - window.pageYOffset - objRect.top;

            eleArrow.style.top = numOffsetTop + 'px';

            // 赋值
            this.isTrustedEvent = true;
            this.value = this.getValueByStyle();

            if (event.touches && event.touches.length) {
                event = event.touches[0];
            }
            objPosArrow.pageY = event.pageY;
            objPosArrow.top = parseFloat(window.getComputedStyle(eleArrow).top);
        });

        // 范围上下左右
        eleCircle.parentElement.querySelectorAll('a').forEach((eleRegion) => {
            eleRegion.addEventListener(Color.objEventType.start, (event) => {
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

                // UI变化
                this.isTrustedEvent = true;
                this.value = this.getValueByStyle();
            });
        });

        document.addEventListener(Color.objEventType.move, (event) => {
            if (typeof objPosArrow.top == 'number') {
                event.preventDefault();

                if (event.touches && event.touches.length) {
                    event = event.touches[0];
                }
                let numTop = objPosArrow.top + (event.pageY - objPosArrow.pageY);
                const numMaxTop = eleArrow.parentElement.clientHeight;

                // 边界判断
                if (numTop < 0) {
                    numTop = 0;
                } else if (numTop > numMaxTop) {
                    numTop = numMaxTop;
                }
                eleArrow.style.top = numTop + 'px';
                // 赋值，此次赋值，无需重定位
                this.isTrustedEvent = true;
                this.value = this.getValueByStyle();
            } else if (typeof objPosCircle.top == 'number') {
                event.preventDefault();

                if (event.touches && event.touches.length) {
                    event = event.touches[0];
                }

                const objPos = {
                    top: event.pageY - objPosCircle.pageY + objPosCircle.top,
                    left: event.pageX - objPosCircle.pageX + objPosCircle.left
                };

                const objMaxPos = {
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
                const numColorH = objPos.left / objMaxPos.left;
                const strColorS = 1 - objPos.top / objMaxPos.top;

                // 圈圈定位
                eleCircle.style.left = objPos.left + 'px';
                eleCircle.style.top = objPos.top + 'px';

                const strHsl = `hsl('${[360 * numColorH, 100 * strColorS + '%', '50%'].join()})`;

                eleCircle.style[BG_COLOR] = strHsl;

                // 赋值
                this.isTrustedEvent = true;
                this.value = this.getValueByStyle();
            }
        }, {
            passive: false
        });
        document.addEventListener(Color.objEventType.end, () => {
            objPosArrow.top = null;
            objPosCircle.top = null;
        });

        // 滑块的键盘支持
        eleFill.parentElement.querySelectorAll('a').forEach((eleButton) => {
            eleButton.addEventListener('keydown', (event) => {
                // 上下控制
                if (event.keyCode == 38 || event.keyCode == 40) {
                    event.preventDefault();

                    let numTop = parseFloat(window.getComputedStyle(eleArrow).top);
                    const numMaxTop = eleFill.clientHeight;

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

                    const ariaLabel = eleArrow.getAttribute('aria-label');

                    eleArrow.style.top = numTop + 'px';
                    eleArrow.setAttribute('aria-label', ariaLabel.replace(/\d+/, Math.round(100 * numTop / numMaxTop)));

                    // 赋值，此次赋值，无需重定位
                    this.isTrustedEvent = true;
                    this.value = this.getValueByStyle();
                }
            });
        });

        // 圈圈的键盘访问
        // 区域背景的键盘支持
        eleCircle.parentElement.querySelectorAll('a').forEach((eleRegion) => {
            eleRegion.addEventListener('keydown', (event) => {
                // 上下左右控制
                if (event.keyCode >= 37 && event.keyCode <= 40) {
                    event.preventDefault();

                    const objStyleCircle = window.getComputedStyle(eleCircle);

                    let numTop = parseFloat(objStyleCircle.top);
                    let numLeft = parseFloat(objStyleCircle.left);

                    const numMaxTop = eleRegion.clientHeight;
                    const numMaxLeft = eleRegion.clientWidth;

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

                    eleCircle.style.left = numLeft + 'px';
                    eleCircle.style.top = numTop + 'px';

                    // 赋值
                    this.isTrustedEvent = true;
                    this.value = this.getValueByStyle();
                }
            });
        });

        return this;
    }

    /**
     * container内HTML的创建
     * @return {Object} 返回当前DOM元素对象
     */
    create () {
        // 元素
        const eleContainer = this.element.target;
        const isSupportOpacity = this.type === 'color-opacity';

        // switch button
        const strHtmlConvert = `<button class="${Color.addClass('switch')} colorMode" data-mode="more" role="button">更多</button>`;
        // current color

        const strHtmlCurrent =
        `<div class="${Color.addClass('current')}">
            <i class="${isSupportOpacity ? Color.addClass('current', 'square', 'opacity')  : Color.addClass('current', 'square')} colorCurrent"></i>
            #<input class="${Color.addClass('current', 'input')}" value="${this.value.replace('#', '')}">
        </div>`;

        // const arrBasicColor = this.params.color.basic;
        const arrBasicColorPreset = this.params.color.basicpreset;
        const arrFixedColor = this.params.color.fixed;

        // body
        const strHtmlBody = `<div class="${Color.addClass('body')}">` +
            (function () {
                // basic color picker
                let strHtml = `<div class="${Color.addClass('basic')} colorBasicX" role="listbox">`;
                let arrCommonColors = (localStorage.commonColors || '').split(',');
                // color left
                strHtml += `<aside class="${Color.addClass('basic', 'l')}">` + (function () {
                    return arrFixedColor.concat(arrCommonColors[0] || '0ff', arrCommonColors[1] || '800180').map(function (color) {
                        const strColor = Color.funRgbToHex(color).replace('#', '');

                        return `<a href="javascript:" class="${Color.addClass('lump')}" data-color="${strColor}" aria-label="${strColor}" style="${BG_COLOR}:#${strColor}" role="option"></a>`;
                    }).join('');
                })() + '</aside>';

                // color main
                strHtml = strHtml + `<div class="${Color.addClass('basic', 'r')}">` + (function () {
                    let strHtmlRG = '';

                    arrBasicColorPreset.forEach(colorItem => {
                        strHtmlRG += `<a href="javascript:" title="#${colorItem}${isSupportOpacity ? 'ff' : ''}" class="${Color.addClass('lump', 'preset')}" data-color="${colorItem}${isSupportOpacity ? 'ff' : ''}" style="${BG_COLOR}:#${colorItem}${isSupportOpacity ? 'ff' : ''}" aria-label="${colorItem}${isSupportOpacity ? 'ff' : ''}" role="option"></a>`;
                    });

                    return strHtmlRG;
                })() + '</div>';

                return strHtml + '</div>';
            })() +

            (function () {
                // more color picker
                let html = `<div class="${Color.addClass('more')} colorMoreX">`;
                // color left
                html += `<div class="${Color.addClass('more', 'l')}">
                <a href="javascript:" class="${Color.addClass('cover', 'white')}" aria-label="色域背景块" role="region"></a><div class="${Color.addClass('circle')} colorCircle"></div>
                <div class="${Color.addClass('gradient')}">
                </div>
                </div><div class="${Color.addClass('more', 'r')}">
                    <div class="${Color.addClass('more', 'fill')} colorFill">
                        <a href="javascript:" class="${Color.addClass('more', 'cover')}" aria-label="明度控制背景条" role="region"></a>
                        <div class="${Color.addClass('gradient')}" style="background: linear-gradient(#ffffff 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0) 50%, ${Color.defaultValue} 100%);">
                        </div>
                    </div>
                    <a href="javascript:" class="${Color.addClass('more', 'arrow')} colorArrow" role="slider" aria-label="明度控制按钮：100%"></a>
                </div>`;

                return html + '</div>';
            })() +
            (function () {
                // 透明度-滑动条
                if (isSupportOpacity) {
                    let opacityHtml = '<div' + ` class="${Color.addClass('opacity')}">透明度：<input class="${Color.addClass('opacity', 'range')} colorOpacity"` + 'type="range"  value="100" min="0" max="100" step="1" data-tips="${value}%" is="ui-range"></div>';
                    return opacityHtml;
                }
                return '';
            })() + '</div>';

        // footer
        const strHtmlFooter = '';
        // append
        eleContainer.innerHTML = strHtmlConvert + strHtmlCurrent + strHtmlBody + strHtmlFooter;

        // 一些元素
        Object.assign(this.element, {
            field: eleContainer.querySelector('input'),
            basic: eleContainer.querySelector('.colorBasicX'),
            more: eleContainer.querySelector('.colorMoreX'),
            mode: eleContainer.querySelector('.colorMode'),
            opacity: eleContainer.querySelector('.colorOpacity'),
            circle: eleContainer.querySelector('.colorCircle'),
            fill: eleContainer.querySelector('.colorFill'),
            arrow: eleContainer.querySelector('.colorArrow'),
            current: eleContainer.querySelector('.colorCurrent')
        });

        // filed做一些事情
        const propValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        let eleField = this.element.field;

        Object.defineProperty(eleField, 'value', {
            ...propValue,
            set (value) {
                // 赋值
                propValue.set.call(this, value);
                // 回调触发
                eleField.dispatchEvent(new CustomEvent('change'));
            }
        });

        if (document.body.contains(eleContainer) == false) {
            document.body.appendChild(eleContainer);
        }

        // 事件
        this.events();

        return this;
    }

    /**
     * 面板的色块啊，圆和尖角位置匹配
     * @param  {String} value 面板UI相匹配的色值，可缺省，表示使用当前输入框的颜色值进行UI变化
     * @return {Object}       返回当前DOM元素对象
     */
    match (value) {
        // 首先要面板显示
        if (this.display != true) {
            return this;
        }
        // 元素对象
        const objElement = this.element;
        // 元素
        const eleContainer = objElement.target;
        const eleCurrent = objElement.current;
        // 更多元素
        const eleMore = objElement.more;
        // 元素
        const eleCircle = objElement.circle;
        const eleFill = objElement.fill;
        const eleArrow = objElement.arrow;
        // 面板内部唯一的输入框元素
        const eleField = objElement.field;

        const eleOpacity = objElement.opacity;

        // 重定位
        let isRePosition = true;
        if (value === false) {
            isRePosition = false;
        }

        // 当前的颜色值
        let strValue = value || eleField.value;
        if (strValue == '') {
            // 如果输入框没有值
            // 使用之前一个合法的颜色值作为现在值
            strValue = Color.funRgbToHex(getComputedStyle(eleCurrent)[BG_COLOR]).replace('#', '');
            eleField.value = strValue;
        }
        strValue = strValue.replace('#', '');

        // 色块值示意&透明度条状态更新
        if (eleOpacity) {
            if (/^[0-9A-F]{8}$/i.test(strValue)) {
                eleOpacity.value = parseInt(strValue.slice(6, 8), 16) / 255 * 100;
            }
            if (/^[0-9A-F]{6}$/i.test(strValue)) {
                eleField.value += Math.round(eleOpacity.value / 100 * 255).toString(16).padStart(2, '0');
            }
        } else {
            eleCurrent.style[BG_COLOR] = '#' + strValue;
        }

        // 当前是基本色面板还是任意色面板
        if (window.getComputedStyle(eleMore).display == 'none') {
            // 1. 基本色
            // 所有当前高亮的元素不高亮
            const eleActive = eleContainer.querySelector('.active');
            if (eleActive) {
                eleActive.classList.remove('active');
            }
            // 所有颜色一致的高亮
            const eleColorMatch = eleContainer.querySelector(`a[data-color="${strValue.toUpperCase()}"]`);
            if (eleColorMatch) {
                eleColorMatch.classList.add('active');
            }
        } else {
            let numWidth = eleCircle.parentElement.clientWidth;
            let numHeight = eleCircle.parentElement.clientHeight;

            let numColorH = 0;
            let numColorS = 1;
            let numColorL = 0.5;

            // 滑块和尖角的颜色和位置
            if (isRePosition == true) {
                // to HSL
                let arrHSL = Color.funHexToHsl(strValue);
                // hsl value
                numColorH = arrHSL[0];
                numColorS = arrHSL[1];
                numColorL = arrHSL[2];

                eleCircle.style.left = numWidth * numColorH + 'px';
                eleCircle.style.top = numHeight * (1 - numColorS) + 'px';

                eleArrow.style.top = eleArrow.parentElement.clientHeight * (1 - numColorL) + 'px';
            } else {
                numColorH = parseFloat(eleCircle.style.left || 0) / numWidth;
                numColorS = 1 - parseFloat(eleCircle.style.top || 0) / numHeight;
            }

            // 滑块和尖角的颜色和位置
            let strColor = `hsl(${[360 * numColorH, Math.round(100 * numColorS) + '%', '50%'].join()}`;
            eleFill.style[BG_COLOR] = strColor;
            eleCircle.style[BG_COLOR] = strColor;
        }

        return this;
    }

    /**
     * 浮层定位方法
     * @return undefined
     */
    position () {
        // 面板定位
        this.follow();

        return this;
    }

    /**
    * 颜色面板显示
    * @return undefined
    */
    show () {
        // 元素
        let eleContainer = this.element.target;

        // 输入框赋值
        if (eleContainer.innerHTML.trim() == '') {
            this.create();
        }

        // 改变显示状态
        this.display = true;

        // 面板显示
        eleContainer.style.display = 'inline';
        // 键盘ESC隐藏支持
        eleContainer.classList.add('ESC');

        // aria
        this.setAttribute('aria-expanded', 'true');

        // 定位
        this.position();

        // 面板UI匹配
        const eleCurrent = this.element.current;
        if (!eleCurrent.getAttribute('style')) {
            eleCurrent.style[BG_COLOR] = this.value;
        }
        this.match();

        // show callback
        this.dispatchEvent(new CustomEvent('show', {
            detail: {
                type: 'ui-color'
            }
        }));

        return this;
    }

    /**
     * 颜色面板隐藏
     * @return undefined
     */
    hide () {
        let eleContainer = this.element.target;
        // 面板隐藏
        eleContainer.style.display = 'none';
        eleContainer.classList.remove('ESC');

        // aria
        this.setAttribute('aria-expanded', 'false');

        // 改变显示状态
        this.display = false;

        // 聚焦，键盘访问顺序回归正常
        this.focus();

        // hide callback
        // 因为this.drop.hide的时候还会执行一次这里的hide()方法，
        // 因此这里加了个display判断
        // 避免连续两次hide事件的实习
        this.dispatchEvent(new CustomEvent('hide', {
            detail: {
                type: 'ui-color'
            }
        }));

        return this;
    }

    /**
     * 给当前元素对象扩展方法、重置原生value属性
     */
    setProperty () {

        /**
         * 根据坐标位置获得hsl值
         * 私有
         * @return {String} [返回当前坐标对应的hex表示的颜色值]
         */
        Object.defineProperty(this, 'getValueByStyle', {
            value: () => {
            // 需要的元素
                const eleCircle = this.element.circle;
                const eleArrow = this.element.arrow;
                const eleOpacity = this.element.opacity;

                if (eleCircle.length * eleArrow.length == 0) {
                    return Color.defaultValue;
                }

                let numColorH, numColorS, numColorL;
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
                // 支持透明度
                if (eleOpacity && eleOpacity.value) {
                    return '#' + Color.funHslToHex(numColorH, numColorS, numColorL, eleOpacity.value / 100);
                }
                return '#' + Color.funHslToHex(numColorH, numColorS, numColorL);
            }
        });

        const props = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        Object.defineProperty(Color.prototype, 'value', {
            ...props,
            set (value) {
                let strValue = value;
                // 元素
                // 目前的颜色值
                let strOldValue = this.value;
                // 取值还是赋值
                if (typeof value == 'string') {
                    // 如果是纯字母，则认为是关键字
                    if (/^[a-z]{3,}$/.test(strValue)) {
                        document.head.style.backgroundColor = strValue;
                        strValue = window.getComputedStyle(document.head).backgroundColor;
                        document.head.style.backgroundColor = '';
                    }

                    // 使用hex值
                    strValue = Color.funRgbToHex(strValue);
                    // 赋值
                    props.set.call(this, strValue);

                    // 可能存在还未和页面建立联系的时候执行value赋值
                    if (!this.params) {
                        return;
                    }

                    // 作为常用颜色记录下来
                    const strCommonColors = localStorage.commonColors || '';
                    let arrCommonColors = strCommonColors.split(',');
                    // 前提颜色非纯灰色若干色值
                    const arrFixedColor = this.params.color.fixed;

                    if (arrFixedColor.some((strFixedColor) => {
                        return Color.funRgbToHex(strFixedColor) == strValue;
                    }) == false) {
                        // 过滤已经存在的相同颜色的色值
                        arrCommonColors = arrCommonColors.filter((strValueWithSharp) => {
                            return strValueWithSharp && strValueWithSharp != strValue.replace('#', '');
                        });

                        // 从前面插入
                        arrCommonColors.unshift(strValue.replace('#', ''));

                        // 本地存储
                        localStorage.commonColors = arrCommonColors.join();

                        // 2个动态色值更新
                        const eleBasic = this.element.basic;
                        if (eleBasic) {
                            const eleAsideColors = eleBasic.querySelectorAll('aside a');
                            const eleBasicColorLast = eleAsideColors[eleAsideColors.length - 2];
                            const eleBasicColorSecond = eleAsideColors[eleAsideColors.length - 1];

                            eleBasicColorLast.setAttribute('data-color', arrCommonColors[0]);
                            eleBasicColorLast.setAttribute('aria-label', arrCommonColors[0]);
                            eleBasicColorLast.style[BG_COLOR] = strValue;

                            const strColorSecond = arrCommonColors[1] || '0ff';
                            eleBasicColorSecond.setAttribute('data-color', strColorSecond);
                            eleBasicColorSecond.setAttribute('aria-label', strColorSecond);
                            eleBasicColorSecond.style[BG_COLOR] = '#' + strColorSecond;
                        }
                    }

                    this.style.setProperty('--ui-color-opacity', strValue);
                    this.element.target.style.setProperty('--ui-color-opacity', strValue);
                    if (this.element.field) {
                        this.element.field.value = strValue.replace('#', '');
                    }

                    // 面板上的值，各种定位的匹配
                    if (this.isTrustedEvent) {
                        this.match(false);
                        this.isTrustedEvent = null;
                    } else {
                        this.match();
                    }
                } else if (!strOldValue) {
                    // 取值
                    // 如果默认无值，使用颜色作为色值，一般出现在初始化的时候
                    strOldValue = Color.defaultValue;
                    // 赋值
                    props.set.call(this, strOldValue);
                }

                if (strOldValue && strValue != strOldValue) {
                    this.dispatchEvent(new CustomEvent('change', {
                        'bubbles': true
                    }));
                    this.dispatchEvent(new CustomEvent('input', {
                        'bubbles': true
                    }));
                }
            }
        });

        // 标题设置
        if (!this.title) {
            this.title = (this.disabled ? '禁止' : '') + '颜色选择';
        }
    }

    attributeChangedCallback (name) {
        if (name == 'disabled') {
            if (this.title == '颜色选择' && this.disabled) {
                this.title = '禁止颜色选择';
            } else if (this.title == '禁止颜色选择' && !this.disabled) {
                this.title = '颜色选择';
            }
        }
    }

    connectedCallback () {
        if (!this.id) {
            // 创建随机id
            this.id = 'lulu_' + (Math.random() + '').split('.')[1];
        }

        // 阻止默认的颜色选择出现
        this.addEventListener('click', event => {
            event.preventDefault();

            if (this.display != true) {
                this.show();
            }
        });

        // 默认朝下居中对齐
        if (!this.dataset.position) {
            this.dataset.position = '7-5';
        }

        // 浮层容器
        const eleContainer = document.createElement('div');
        eleContainer.classList.add(Color.addClass('container'));
        eleContainer.id = ('lulu_' + Math.random()).replace('0.', '');
        this.dataset.target = eleContainer.id;

        // 全局暴露的一些元素
        this.element = {
            target: eleContainer
        };

        if (this.getAttribute('type') === 'color-opacity') {
            this.style.setProperty('--ui-color-opacity', this.value);
            eleContainer.style.setProperty('--ui-color-opacity', this.value);
        }

        // 全局的基础色值
        const arrBasicColor = ['0', '3', '6', '9', 'c', 'f'];
        const arrBasicColorPreset = ['2a80eb', '0057c3', '7fdbff', 'f7f9fa', '1cad70', '3d9970', '39cccc', 'dddddd', 'eb4646', 'ab2526', 'ef8a5e', 'a2a9b6', 'f59b00', 'de6d00', 'ffdc00', '4c5161'];
        const arrFixedColor = arrBasicColor.concat('eb4646', '1cad70', '2a80eb', 'f59b00');

        this.params = this.params || {};

        this.params.color = {
            basic: arrBasicColor,
            basicpreset: arrBasicColorPreset,
            fixed: arrFixedColor
        };

        // 点击空白隐藏浮层的处理
        document.addEventListener('click', event => {
            const eleClicked = event && event.target;

            if (!eleClicked || !this.display) {
                return;
            }

            if (eleClicked != this && eleContainer.contains(eleClicked) == false) {
                this.hide();
            }
        });

        // 窗口尺寸变化时候的处理
        window.addEventListener('resize', () => {
            if (this.display) {
                this.position();
            }
        });
    }
}

// 静态属性
Color.objEventType = {
    start: 'mousedown',
    move: 'mousemove',
    end: 'mouseup'
};

if ('ontouchstart' in document) {
    Color.objEventType = {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
    };
}

Color.defaultValue = '#000000';

if (!customElements.get('ui-color')) {
    customElements.define('ui-color', Color, {
        extends: 'input'
    });
}

export default Color;
