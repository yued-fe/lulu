/**
 * @Follow.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edited:  17-06-19
 */

/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Follow = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 绝对定位元素的定位效果
     * 针对所有浏览器
     * 自动含边界判断
     * 可用在DropDown, Tips等组件上
     * 支持链式调用和模块化调用
     * @example
     * new Follow(eleTrigger, eleTarget, options);

     * 文档见：https://www.zhangxinxu.com/wordpress/?p=1328 position()方法
    **/
    var Follow = function (eleTrigger, eleTarget, options) {
        // 默认参数值
        var defaults  = {
            offsets: {
                x: 0,
                y: 0
            },
            safeArea: [0, 0, 0, 0],
            // eleTrigger-eleTarget
            position: '4-1',
            // 边缘位置自动调整
            edgeAdjust: true
        };

        // 判断第一个参数是否是DOM元素，不是的话判断是否是对象，是对象则将第一个参数当作options
        if (eleTarget && Object.prototype.toString.call(eleTarget) === '[object Object]') {
            options = eleTarget;
            eleTarget = null;
        }

        for (var keyOption in (options || (options = {}))) {
            if (typeof options[keyOption] == 'undefined') {
                delete options[keyOption];
            }
        }

        var objParams = Object.assign({}, defaults, options);

        // eleTarget 非必须，可 eleTrigger 元素 html 属性指定
        if (!eleTarget) {
            var strTarget = eleTrigger.getAttribute('is-follow') || eleTrigger.dataset.target;
            if (!strTarget) {
                return;
            }
            eleTarget = document.getElementById(strTarget) || document.querySelector('.' + strTarget) || document.querySelector(strTarget);
            if (!eleTarget) {
                return;
            }
        }

        // 合法的位置关系数据
        var arrLegalPosition = ['4-1', '1-4', '5-7', '2-3', '2-1', '6-8', '3-4', '4-3', '8-6', '1-2', '7-5', '3-2'];

        // eleTrigger 元素属性指定 options，传入的 options 参数优先级更高
        // offsets
        var dataOffsets = eleTrigger.dataset.offsets;
        var arrOffsets = [];
        if (objParams.offsets.map && objParams.offsets.length) {
            arrOffsets = objParams.offsets;
        } else if (typeof objParams.offsets == 'string') {
            arrOffsets = objParams.offsets.trim().split(/,\s*|\s+/);
        }
        if (dataOffsets && !options.offsets) {
            arrOffsets = dataOffsets.trim().split(/,\s*|\s+/);
        }

        // 如果arrOffsets有值
        if (arrOffsets.length) {
            objParams.offsets = {};
            objParams.offsets.x = arrOffsets[0];
            objParams.offsets.y = arrOffsets[1] || arrOffsets[0];
        }

        var dataOffsetX = eleTrigger.dataset.offsetX;
        var dataOffsetY = eleTrigger.dataset.offsetY;

        if (dataOffsetX) {
            objParams.offsets.x = dataOffsetX;
        }
        if (dataOffsetY) {
            objParams.offsets.y = dataOffsetY;
        }

        // 转数值
        objParams.offsets.x *= 1;
        objParams.offsets.y *= 1;

        // position
        var dataPosition = eleTrigger.dataset.position;
        var dataAlign = eleTrigger.dataset.align;
        // data-align是否符合合法位置关系
        var isDataAlignMatch = arrLegalPosition.some(function (strLegalPosition) {
            return strLegalPosition === dataAlign;
        });
        // 若没有设置 data-position，设置了 data-align 也行，若都设置了以 data-position 的值为准
        if (!dataPosition && dataAlign && isDataAlignMatch) {
            dataPosition = dataAlign;
        }
        if (dataPosition && (!options || !options.position)) {
            objParams.position = dataPosition;
        }

        // edge-adjust
        var dataEdgeAdjust = eleTrigger.dataset.edgeAdjust || objParams.edgeAdjust;
        // data-edge-adjust 字符串为 0、none、false 认为是 false，其他都是 true
        var isEdgeAdjust = !((dataEdgeAdjust === '0') || (dataEdgeAdjust === 'none') || (dataEdgeAdjust === 'false') || (dataEdgeAdjust === false));
        if (typeof dataEdgeAdjust == 'string' && typeof objParams.edgeAdjust != 'boolean') {
            objParams.edgeAdjust = isEdgeAdjust;
        }

        // 先绝对定位，以便获取更准确的尺寸
        var strOriginPosition = eleTarget.style.position;
        if (strOriginPosition != 'absolute') {
            eleTarget.style.position = 'absolute';
        }

        // 触发元素和目标元素的坐标数据
        var objBoundTrigger = eleTrigger.getBoundingClientRect();
        var objBoundTarget = eleTarget.getBoundingClientRect();

        // 如果目标元素隐藏，则不处理
        if (objBoundTarget.width * objBoundTarget.height === 0) {
            eleTarget.style.position = strOriginPosition || '';
            window.console.warn((eleTarget.id ? 'id为' + eleTarget.id + '的' : '') + '目前元素尺寸为0，无法定位');
            return;
        }

        // 页面的水平和垂直滚动距离
        var numScrollTop = window.pageYOffset;
        var numScrollLeft = window.pageXOffset;

        // 浏览器窗口的尺寸
        var numWinWidth = window.innerWidth;
        var numWinHeight = window.innerHeight;

        // 如果trigger元素全部都在屏幕外，则不进行边缘调整
        if ((objBoundTrigger.left < 0 && objBoundTrigger.right < 0) || (objBoundTrigger.top < 0 && objBoundTrigger.bottom < 0) || (objBoundTrigger.left > numWinWidth && objBoundTrigger.right > numWinWidth) || (objBoundTrigger.top > numWinHeight && objBoundTrigger.bottom > numWinHeight)) {
            objParams.edgeAdjust = isEdgeAdjust = false;
        }

        // target的包含块祖先元素，也就是定位元素
        var eleOffsetParent = eleTarget.offsetParent;
        var objBoundOffsetParent = eleOffsetParent.getBoundingClientRect();

        // 暴露给实例
        var element = {
            follow: eleTarget,
            target: eleTarget,
            trigger: eleTrigger
        };

        this.element = this.element ? Object.assign(this.element, element) : element;
        this.params = this.params ? Object.assign(this.params, objParams) : objParams;

        // 参数中设置的偏移位置
        var objOffsets = objParams.offsets;
        // target元素所在的offset偏移
        var numOffsetTop = objBoundOffsetParent.top + numScrollTop;
        var numOffsetLeft = objBoundOffsetParent.left + numScrollLeft;

        // 如果是body元素，同时没有设置定位属性的话，忽略
        // 因为此时margin有值或者margin重叠时候会有定位bug
        if (eleOffsetParent === document.body && window.getComputedStyle(eleOffsetParent).position === 'static') {
            numOffsetTop = 0;
            numOffsetLeft = 0;
        }

        // 直接嫁接在offsets对象上，可以大大简化后续处理的逻辑
        // 减去包含块元素的偏移位置，这样的objOffsets尺寸是精准的定位尺寸
        // objOffsets.x -= numOffsetLeft;
        // objOffsets.y -= numOffsetTop;

        // 这是指定位置
        // 支持具体坐标值
        var strPosition = objParams.position;

        // 最终定位的left/top坐标
        var numTargetLeft, numTargetTop;

        // 如果直接指定了坐标
        if (typeof strPosition !== 'string' && strPosition.length === 2) {
            var arrPosition = strPosition;

            numTargetLeft = arrPosition[0] + objOffsets.x;
            numTargetTop = arrPosition[1] + objOffsets.y;

            // 边缘检测
            if (objParams.edgeAdjust === true) {
                if (numTargetLeft + objBoundTarget.width > numWinWidth + numScrollLeft) {
                    numTargetLeft = numWinWidth + numScrollLeft - objBoundTarget.width - objOffsets.x;
                }
                if (numTargetTop + objBoundTarget.height > numWinHeight + numScrollTop) {
                    numTargetTop = numWinHeight + numScrollTop - objBoundTarget.height - objOffsets.y;
                }
            }
            // 浮动框的定位与显示
            eleTarget.style.left = numTargetLeft + 'px';
            eleTarget.style.top = numTargetTop + 'px';
            // 记住定位标识码
            eleTarget.setAttribute('data-align', '3-1');

            // z-index自动最高
            this.zIndex();

            return;
        }


        // 是否对齐匹配的标志量
        // 遍历，以确定设定的对齐是否有匹配
        var isAlignMatch = arrLegalPosition.some(function (strLegalPosition) {
            return strLegalPosition === strPosition;
        });

        // 如果没有匹配的对齐方式，使用默认的对齐方式
        if (isAlignMatch === false) {
            strPosition = defaults.position;
        }

        // 自动调整距离边缘的安全距离
        var arrSafeArea = eleTrigger.dataset.safeArea || objParams.safeArea;
        // 字符串转数组
        if (typeof arrSafeArea == 'string') {
            arrSafeArea = arrSafeArea.trim().split(/(?:,\s*|\s+)/);
        }
        arrSafeArea = arrSafeArea.map(function (val) {
            return parseFloat(val) || 0;
        });
        // 数量的处理
        if (arrSafeArea.length == 1) {
            arrSafeArea = arrSafeArea.concat(arrSafeArea[0], arrSafeArea[0], arrSafeArea[0]);
        } else if (arrSafeArea.length == 2) {
            arrSafeArea.push(arrSafeArea[0]);
            arrSafeArea.push(arrSafeArea[1]);
        } else if (arrSafeArea.length == 3) {
            arrSafeArea.push(arrSafeArea[1]);
        }

        // 是否超出边界的判断
        // 只考虑在视区的情况，页面的滚动距离不处理
        var objIsOverflow = {
            // 键使用trigger-target方位表示
            // 例如'left-right'表示trigger元素的左边缘和target元素右边缘对齐时候是否溢出
            'left-right': objBoundTarget.width + objOffsets.x + arrSafeArea[3] > objBoundTrigger.left,
            'top-bottom': objBoundTrigger.top - (objBoundTarget.height + objOffsets.y + arrSafeArea[0]) < 0,
            'right-left': objBoundTrigger.right + objBoundTarget.width + objOffsets.x + arrSafeArea[1] > numWinWidth,
            'bottom-top': objBoundTrigger.bottom + objBoundTarget.height + objOffsets.y + arrSafeArea[2] > numWinHeight,
            // 新增4个方位
            'right-right': objBoundTarget.width + objOffsets.x + arrSafeArea[3] > objBoundTrigger.right,
            'left-left': objBoundTrigger.left + objBoundTarget.width + objOffsets.x + arrSafeArea[1] > numWinWidth,
            'bottom-bottom': objBoundTarget.height + objOffsets.y + arrSafeArea[0] > objBoundTrigger.bottom,
            'top-top': objBoundTrigger.top + objBoundTarget.height + objOffsets.y + arrSafeArea[2] > numWinHeight
        };

        var strDirection = 'bottom';

        var funGetPosition = function () {
            // 定位的处理
            // 有别于之前的逻辑
            // 直接枚举处理，覆盖所有的情况，之前是方位调整比较粗放
            switch (strPosition) {
                case '1-4': case '5-7': case '2-3': {
                    // 如果在上方显示
                    // top坐标是确定的
                    numTargetTop = objBoundTrigger.top - objBoundTarget.height;
                    // left坐标确定
                    if (strPosition === '1-4') {
                        numTargetLeft = objBoundTrigger.left;
                    } else if (strPosition === '5-7') {
                        numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width) / 2;
                    } else {
                        numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width);
                    }

                    strDirection = 'top';

                    // 如果上方超出，则看看下方有没有空间
                    if (isEdgeAdjust && objIsOverflow['top-bottom']) {
                        if (!objIsOverflow['bottom-top']) {
                            strPosition = ({
                                '1-4': '4-1',
                                '5-7': '7-5',
                                '2-3': '3-2'
                            })[strPosition];
                            // 再执行一次
                            funGetPosition();
                        } else if (!objIsOverflow['left-right'] || !objIsOverflow['right-left']) {
                            // 上下无空间，但是左侧或右侧有空间
                            // 随便给个水平方向就好
                            strPosition = ({
                                '1-4': '2-1',
                                '5-7': '6-8',
                                '2-3': '3-4'
                            })[strPosition];
                            funGetPosition();
                        }
                    }

                    break;
                }
                case '2-1': case '6-8': case '3-4': {
                    // left坐标固定
                    numTargetLeft = objBoundTrigger.right;
                    // top坐标确定
                    if (strPosition === '2-1') {
                        numTargetTop = objBoundTrigger.top;
                    } else if (strPosition === '6-8') {
                        numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height) / 2;
                    } else {
                        numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height);
                    }

                    strDirection = 'right';

                    // 如果右侧超出，则看看左方有没有空间
                    if (isEdgeAdjust && objIsOverflow['right-left']) {
                        if (!objIsOverflow['left-right']) {
                            strPosition = ({
                                '2-1': '1-2',
                                '6-8': '8-6',
                                '3-4': '4-3'
                            })[strPosition];
                            // 再执行一次
                            funGetPosition();
                        } else if (!objIsOverflow['top-bottom'] || !objIsOverflow['bottom-top']) {
                            strPosition = ({
                                '2-1': '1-4',
                                '6-8': '5-7',
                                '3-4': '2-3'
                            })[strPosition];
                            // 再执行一次
                            funGetPosition();
                        }
                    }

                    break;
                }
                case '4-1': case '7-5': case '3-2': {
                    // top坐标是确定的
                    numTargetTop = objBoundTrigger.bottom;
                    // left坐标确定
                    if (strPosition === '4-1') {
                        numTargetLeft = objBoundTrigger.left;
                    } else if (strPosition === '7-5') {
                        numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width) / 2;
                    } else {
                        numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width);
                    }

                    strDirection = 'bottom';

                    // 如果下方超出，则看看上方有没有空间
                    if (isEdgeAdjust && objIsOverflow['bottom-top']) {
                        if (!objIsOverflow['top-bottom']) {
                            strPosition = ({
                                '4-1': '1-4',
                                '7-5': '5-7',
                                '3-2': '2-3'
                            })[strPosition];
                            // 再执行一次
                            funGetPosition();
                        } else if (!objIsOverflow['left-right'] || !objIsOverflow['right-left']) {
                            // 上下无空间，但是左侧或右侧有空间
                            // 随便给个水平方向就好
                            strPosition = ({
                                '4-1': '2-1',
                                '7-5': '6-8',
                                '3-2': '3-4'
                            })[strPosition];
                            funGetPosition();
                        }
                    }

                    break;
                }
                case '1-2': case '8-6': case '4-3': {
                    // left坐标固定
                    numTargetLeft = objBoundTrigger.left - objBoundTarget.width;

                    // top坐标确定
                    if (strPosition === '1-2') {
                        numTargetTop = objBoundTrigger.top;
                    } else if (strPosition === '8-6') {
                        numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height) / 2;
                    } else {
                        numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height);
                    }

                    strDirection = 'left';

                    // 如果左侧超出，则看看右侧有没有空间
                    if (isEdgeAdjust && objIsOverflow['left-right']) {
                        if (!objIsOverflow['right-left']) {
                            strPosition = ({
                                '1-2': '2-1',
                                '8-6': '6-8',
                                '4-3': '3-4'
                            })[strPosition];
                            // 再执行一次
                            funGetPosition();
                        } else if (!objIsOverflow['top-bottom'] || !objIsOverflow['bottom-top']) {
                            strPosition = ({
                                '1-2': '1-4',
                                '8-6': '5-7',
                                '4-3': '2-3'
                            })[strPosition];
                            // 再执行一次
                            funGetPosition();
                        }
                    }

                    break;
                }
            }
        };

        funGetPosition();

        numTargetLeft = numTargetLeft + objOffsets.x - numOffsetLeft;
        numTargetTop = numTargetTop + objOffsets.y - numOffsetTop;

        // 边界溢出，当前方位的安全举例处理
        if (isEdgeAdjust) {
            // 水平方向的微调
            if (strDirection == 'top') {
                numTargetTop = numTargetTop - arrSafeArea[2];
            } else if (strDirection == 'bottom') {
                numTargetTop = numTargetTop + arrSafeArea[0];
            } else if (strDirection == 'left') {
                numTargetLeft = numTargetLeft - arrSafeArea[1];
            } else {
                numTargetLeft = numTargetLeft + arrSafeArea[3];
            }
        }

        // 加上滚动距离
        numTargetTop += numScrollTop;
        numTargetLeft += numScrollLeft;

        //浮动框显示
        eleTarget.style.left = Math.round(numTargetLeft) + 'px';
        eleTarget.style.top = Math.round(numTargetTop) + 'px';

        // // 此时的eleTarget位置
        objBoundTarget = eleTarget.getBoundingClientRect();
        // 对立分享水平方向的微调
        if (isEdgeAdjust) {
            if (strDirection == 'top' || strDirection == 'bottom') {
                if (objBoundTarget.left < arrSafeArea[3]) {
                    numTargetLeft = numTargetLeft + (arrSafeArea[3] - objBoundTarget.left);
                } else if (objBoundTarget.right + arrSafeArea[1] > numWinWidth) {
                    numTargetLeft = numTargetLeft - (objBoundTarget.right + arrSafeArea[1] - numWinWidth);
                }
            } else if (objBoundTarget.top < arrSafeArea[0]) {
                numTargetTop += arrSafeArea[0] - objBoundTarget.top;
            } else if (objBoundTarget.bottom + arrSafeArea[2] > numWinHeight) {
                numTargetTop -= (objBoundTarget.bottom + arrSafeArea[2] - numWinHeight);
            }

            //浮动框显示
            eleTarget.style.left = Math.round(numTargetLeft) + 'px';
            eleTarget.style.top = Math.round(numTargetTop) + 'px';
        }

        eleTarget.setAttribute('data-align', strPosition);
        eleTarget.setAttribute('data-direction', strDirection);

        // z-index自动最高
        this.zIndex();
    };

    /**
     * eleTarget元素zIndex实时最大化
     * @return {[type]} [description]
     */
    Follow.prototype.zIndex = function () {
        var eleTarget = this.element.target;
        // 返回eleTarget才是的样式计算对象
        var objStyleTarget = window.getComputedStyle(eleTarget);
        // 此时元素的层级
        var numZIndexTarget = objStyleTarget.zIndex;
        // 用来对比的层级，也是最小层级
        var numZIndexNew = 19;

        // 只对<body>子元素进行层级最大化计算处理
        document.body.childNodes.forEach(function (eleChild) {
            if (eleChild.nodeType != 1) {
                return;
            }

            var objStyleChild = window.getComputedStyle(eleChild);

            var numZIndexChild = objStyleChild.zIndex * 1;

            if (numZIndexChild && eleTarget != eleChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew != numZIndexTarget) {
            eleTarget.style.zIndex = numZIndexNew;
        }
    };

    return Follow;
}));
