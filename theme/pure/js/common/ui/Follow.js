/**
 * @Follow.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edited:  17-06-19
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Follow = factory();
    }
}((typeof global !== 'undefined') ? global
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
        var defaults  = {
            offsets: {
                x: 0,
                y: 0
            },
            // eleTrigger-eleTarget
            // 也可以是[left, top]数组，不过用到场景不多
            position: '4-1',
            // 边缘位置自动调整
            edgeAdjust: true
        };

        var objParams = Object.assign({}, defaults, options || {});

        if (!eleTarget) {
            return;
        }

        // 先绝对定位，以便获取更准确的尺寸
        eleTarget.style.position = 'absolute';

        // 触发元素和目标元素的坐标数据
        var objBoundTrigger = eleTrigger.getBoundingClientRect();
        var objBoundTarget = eleTarget.getBoundingClientRect();

        // 如果目标元素隐藏，则不处理
        if (objBoundTarget.width * objBoundTarget.height == 0) {
            return;
        }

        var eleOffsetParent = eleTarget.offsetParent;
        var objBoundOffsetParent = eleOffsetParent.getBoundingClientRect();

        // 暴露给实例
        this.element = {
            trigger: eleTrigger,
            target: eleTarget
        };

        this.params = objParams;

        // 页面的水平和垂直滚动距离
        var numScrollTop = window.pageYOffset;
        var numScrollLeft = window.pageXOffset;

        // 浏览器窗口的尺寸
        var numWinWidth = window.innerWidth;
        var numWinHeight = window.innerHeight;

        // 参数中设置的偏移位置
        var objOffsets = objParams.offsets;
        // target元素所在的offset偏移
        var numOffsetTop = objBoundOffsetParent.top + numScrollTop;
        var numOffsetLeft = objBoundOffsetParent.left + numScrollLeft;

        // 如果是body元素，同时没有设置定位属性的话，忽略
        // 因为此时margin有值或者margin重叠时候会有定位bug
        if (eleOffsetParent == document.body && window.getComputedStyle(eleOffsetParent).position == 'static') {
            numOffsetTop = 0;
            numOffsetLeft = 0;
        }

        // 直接嫁接在offsets对象上，可以大大简化后续处理的逻辑
        objOffsets.x -= numOffsetLeft;
        objOffsets.y -= numOffsetTop;

        // 这是指定位置
        // 支持具体坐标值
        var strPosition = objParams.position;

        // 最终定位的left/top坐标
        var numTargetLeft, numTargetTop;

        // 如果直接指定了坐标
        if (typeof strPosition != 'string' && strPosition.length == 2) {
            var arrPosition = strPosition;

            numTargetLeft = arrPosition[0] + objOffsets.x;
            numTargetTop = arrPosition[1] + objOffsets.y;

            // 边缘检测
            if (objParams.edgeAdjust == true) {
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

        // 合法的位置关系数据
        var arrLegalPosition = ['4-1', '1-4', '5-7', '2-3', '2-1', '6-8', '3-4', '4-3', '8-6', '1-2', '7-5', '3-2'];

        // 是否对齐匹配的标志量
        var isAlignMatch = false;

        // 遍历，以确定设定的对齐是否有匹配
        isAlignMatch = arrLegalPosition.some(function (strLegalPosition) {
            return strLegalPosition == strPosition;
        });

        // 如果没有匹配的对齐方式，使用默认的对齐方式
        if (isAlignMatch == false) {
            strPosition = defaults.position;
        }

        // 确定定位方位，是上下左右的哪个
        var funDirection = function (position) {
            var direction = 'bottom';
            //确定方向
            switch (position) {
                case '1-4': case '5-7': case '2-3': {
                    direction = 'top';
                    break;
                }
                case '2-1': case '6-8': case '3-4': {
                    direction = 'right';
                    break;
                }
                case '1-2': case '8-6': case '4-3': {
                    direction = 'left';
                    break;
                }
                case '4-1': case '7-5': case '3-2': {
                    direction = 'bottom';
                    break;
                }
            }

            return direction;
        };

        // 居中判断
        var funCenterJudge = function (position) {
            if (position === '5-7' || position === '6-8' || position === '8-6' || position === '7-5') {
                return true;
            }

            return false;
        };

        // 是否超出边界的判断
        var funOverflowJudge = function (direction) {
            return ({
                left: objBoundTarget.width + objOffsets.x > objBoundTrigger.left - numScrollLeft,
                top: objBoundTarget.height + objOffsets.y > objBoundTrigger.top - numScrollTop,
                right: objBoundTrigger.right + objBoundTarget.width + objOffsets.x > numWinWidth + numScrollLeft,
                bottom: objBoundTrigger.bottom + objBoundTarget.height + objOffsets.y > numWinHeight + numScrollTop
            })[direction] || false;
        };

        // 此时的方向
        var strDirection = funDirection(strPosition);

        // 边缘过界判断
        // 只会调整一次
        if (objParams.edgeAdjust && funOverflowJudge(strDirection)) {
            // 这是居中位置的调整，是更换方向
            if (funCenterJudge(strPosition)) {
                var center = {
                    '5-7': '7-5',
                    '7-5': '5-7',
                    '6-8': '8-6',
                    '8-6': '6-8'
                };
                strPosition = center[strPosition];
            } else {
                // 这是其他位置调整
                // 判断隔壁方向位置是否足够，如果足够，就是要这个坐标参数
                var objDirectionHash = {
                    top: {
                        left: '3-2',
                        right: '4-1'
                    },
                    right: {
                        bottom: '1-2',
                        top: '4-3'
                    },
                    bottom: {
                        left: '2-3',
                        right: '1-4'
                    },
                    left: {
                        bottom: '2-1',
                        top: '3-4'
                    }
                };
                var objDirection = objDirectionHash[strDirection];
                var arrDirection = Object.keys(objDirection);

                if (!funOverflowJudge(arrDirection[0]) || funOverflowJudge(arrDirection[1])) {
                    strPosition = objDirection[arrDirection[0]];
                } else {
                    strPosition = objDirection[arrDirection[1]];
                }
            }
        }

        // 是否变换了方向
        var strNewDirection = funDirection(strPosition);
        var strFirst = strPosition.split('-')[0];

        //确定left, top值
        switch (strNewDirection) {
            case 'top': {
                // 如果在上方显示
                // top坐标是确定的
                numTargetTop = objBoundTrigger.top - objBoundTarget.height + numScrollTop;
                // left坐标确定
                if (strFirst == '1') {
                    numTargetLeft = objBoundTrigger.left;
                } else if (strFirst === '5') {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width) / 2;
                } else {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width);
                }

                numTargetLeft += numScrollLeft;

                break;
            }
            case 'right': {
                // left坐标固定
                numTargetLeft = objBoundTrigger.right + numScrollLeft;
                // top坐标确定
                if (strFirst == '2') {
                    numTargetTop = objBoundTrigger.top;
                } else if (strFirst === '6') {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height) / 2;
                } else {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height);
                }

                numTargetTop += numScrollTop;

                break;
            }
            case 'bottom': {
                // top坐标是确定的
                numTargetTop = objBoundTrigger.bottom + numScrollTop;
                // left坐标确定
                if (strFirst == '4') {
                    numTargetLeft = objBoundTrigger.left;
                } else if (strFirst === '7') {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width) / 2;
                } else {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width);
                }

                numTargetLeft += numScrollLeft;

                break;
            }
            case 'left': {
                // left坐标固定
                numTargetLeft = objBoundTrigger.left - objBoundTarget.width + numScrollLeft;

                // top坐标确定
                if (strFirst == '1') {
                    numTargetTop = objBoundTrigger.top;
                } else if (strFirst == '8') {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height) / 2;
                } else {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height);
                }

                numTargetTop += numScrollTop;

                break;
            }
        }

        if (objParams.edgeAdjust && funCenterJudge(strPosition)) {
            // 是居中定位
            // 变更的不是方向，而是offset大小
            // 偏移处理
            if (strPosition == '7-5' || strPosition == '5-7') {
                // 左右是否超出
                if (numTargetLeft - numScrollLeft < 0.5 * numWinWidth) {
                    // 左半边，判断左边缘
                    if (numTargetLeft - numScrollLeft < 0) {
                        numTargetLeft = numScrollLeft;
                    }
                } else if (numTargetLeft - numScrollLeft + objBoundTarget.width > numWinWidth) {
                    numTargetLeft = numWinWidth + numScrollLeft - objBoundTarget.width;
                }
                // 下面两个else if 判断上下是否超出
            } else if (numTargetTop - numScrollTop < 0.5 * numWinHeight) {
                // 左半边，判断左边缘
                if (numTargetTop - numScrollTop < 0) {
                    numTargetTop = numScrollTop;
                }
            } else if (numTargetTop - numScrollTop + objBoundTarget.height > numWinHeight) {
                numTargetTop = numWinHeight + numScrollTop - objBoundTarget.height;
            }
        }

        if (strNewDirection == 'top' || strNewDirection == 'left') {
            numTargetLeft = numTargetLeft - objOffsets.x;
            numTargetTop = numTargetTop - objOffsets.y;
        } else {
            numTargetLeft = numTargetLeft + objOffsets.x;
            numTargetTop = numTargetTop + objOffsets.y;
        }

        //浮动框显示
        eleTarget.style.left = Math.round(numTargetLeft) + 'px';
        eleTarget.style.top = Math.round(numTargetTop) + 'px';

        eleTarget.setAttribute('data-align', strPosition);
        eleTarget.setAttribute('data-direction', strNewDirection);

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
