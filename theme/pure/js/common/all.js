/**
 * @Keyboard.js
 * @author zhangxinxu
 * @version
 * Created: 17-06-13
 */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function () {
    var doc = document;
    var win = window;

    if (win.isKeyEventBind || !doc.addEventListener) {
        return {};
    }

    /*
    ** HTML accesskey辅助增强脚本
    ** 作用包括：
    ** 1. 统一IE浏览器和其它浏览器的快捷访问行为；
    ** 2. 增加单独accesskey属性值对应按键按下的focus行为；
    ** 3. 增加accesskey生效的前置键按下的提示行为，例如window上Alt键提示，Mac下的Alt + control组合提示等；
    ** 4. 增加shift + '?'(keyCode=191)键的提示行为支持；
    */

    // 操作系统和浏览器设备检测
    var ua = navigator.userAgent;

    var system = 'windows';

    if (/Mac\sOS\sX/i.test(ua)) {
        system = 'mac';
    }

    // 浏览器判断
    var browser = 'chrome';
    if (typeof doc.mozFullScreen != 'undefined') {
        browser = 'moz';
    } else if (typeof doc.msHidden != 'undefined' || typeof doc.hidden == 'undefined') {
        browser = 'ie';
    }

    // 快捷键组合
    var keyPrefix = ({
        windows: browser == 'moz' ? {
            ctrlKey: false,
            altKey: true,
            shiftKey: true
        } : {
            ctrlKey: false,
            altKey: true,
            shiftKey: false
        },
        mac: {
            ctrlKey: true,
            altKey: true,
            shiftKey: false
        }
    })[system];

    // 获取字符Unicode值方法
    var U = function (a, b) {
        if (!a) {
            return '';
        }
        b = b || 'x';
        var c = '';
        var d = 0;
        var e;

        for (d; d < a.length; d += 1) a.charCodeAt(d) >= 55296 && a.charCodeAt(d) <= 56319 ? (e = (65536 + 1024 * (Number(a.charCodeAt(d)) - 55296) + Number(a.charCodeAt(d + 1)) - 56320).toString(16), d += 1) : e = a.charCodeAt(d).toString(16),
            c += b + e;

        return c.substr(b.length);
    };

    // 提示当前元素快捷键的方法
    var timerTips = null;
    var tips = function (arrEles) {
        // 已经显示中，忽略
        if (doc.hasTipsShow) {
            return;
        }
        // 页面的滚动高度
        var scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
        var scrollLeft = doc.documentElement.scrollLeft || doc.body.scrollLeft;

        // 遍历创建提示元素
        arrEles.forEach(function (ele) {

            // 如果元素隐藏，也忽略
            if (ele.clientHeight * ele.clientWidth == 0) {
                return;
            }

            var accesskey = ele.getAttribute('accesskey');
            var arrAccesskey = [];
            for (var key in keyPrefix) {
                if (keyPrefix[key]) {
                    arrAccesskey.push(key);
                }
            }
            arrAccesskey.push(accesskey);

            // 当前元素相对于文档的偏移
            var bounding = ele.getBoundingClientRect();

            // 创建tips提示元素
            var div = doc.createElement('div');
            div.className = 'ui-kbd-tips AK_Tips';
            div.setAttribute('style', 'top:' + (bounding.top + scrollTop) + 'px;left:' + (bounding.left + scrollLeft) + 'px;');
            div.innerHTML = arrAccesskey.map(function (key) {
                return '<kbd>' + key.replace('Key', '') + '</kbd>';
            }).join('+');

            doc.body.appendChild(div);

            div.fromTarget = ele;
        });

        // 标记，避免重复生成
        doc.hasTipsShow = true;

        // 一段时间隐藏
        timerTips = setTimeout(function () {
            removeTips();
        }, 3000);
    };
    // 隐藏tips
    var removeTips = function () {
        clearTimeout(timerTips);
        // 移除所有的快捷键提示
        var elesTips = doc.querySelectorAll('.AK_Tips');
        [].slice.call(elesTips).forEach(function (ele) {
            if (ele.fromTarget) {
                ele.fromTarget.hasTipsShow = null;
            }
            doc.body.removeChild(ele);
        });
        doc.hasTipsShow = null;
    };


    // IE9+
    doc.addEventListener('keydown', function (event) {
        // 当前元素是否是可输入的input或者textarea
        var isTargetInputable = false;
        var eleTarget = event.target || doc.activeElement;
        var tagName = eleTarget.tagName.toLowerCase();
        if (tagName == 'textarea' || (tagName == 'input' && /checkbox|radio|select|file|button|image|hidden/i.test(eleTarget.type) == false)) {
            isTargetInputable = true;
        }

        // 遍历所有设置了accesskey的符合HTML4.0.1规范的元素
        // 包括<a>, <area>, <button>, <input>, <label>, <legend>以及<textarea>
        var elesOwnAccesskey = doc.querySelectorAll('a[accesskey],area[accesskey],button[accesskey],input[accesskey],label[accesskey],legend[accesskey],textarea[accesskey]');
        if (elesOwnAccesskey.length == 0) {
            return;
        }
        // 对象列表转换成数组
        var arrElesOwnAccesskey = [].slice.call(elesOwnAccesskey);
        // 进行遍历
        var arrAcceeekey = arrElesOwnAccesskey.map(function (ele) {
            return ele.getAttribute('accesskey');
        });
        // windows下图下直接event.key就是按下的键对于的内容，但OS X系统却没有key属性，有的是event.keyIdentifier，表示字符的Unicode值
        // 根据这个判断按键是否有对应的匹配
        var indexMatch = -1;
        arrAcceeekey.forEach(function (accesskey, index) {
            if ((event.key && event.key == accesskey) || (event.keyIdentifier && parseInt(event.keyIdentifier.toLowerCase().replace('u+', ''), 16) == parseInt(U(accesskey), 16))) {
                indexMatch = index;

                return false;
            }
        });

        // 1. 单独按下某个键的匹配支持
        if (event.altKey == false && event.shiftKey == false && event.ctrlKey == false) {
            if (isTargetInputable) {
                return;
            }
            // focus高亮
            if (arrElesOwnAccesskey[indexMatch]) {
                arrElesOwnAccesskey[indexMatch].focus();
                // 阻止内容输入
                event.preventDefault();
            }
        // 2. shift + '?'(keyCode=191)键的提示行为支持
        } else if (event.altKey == false && event.shiftKey == true && event.ctrlKey == false) {
            if (event.keyCode == 191 && !isTargetInputable) {
                doc.hasTipsShow ? removeTips() : tips(arrElesOwnAccesskey);
            }
        // 3. 增加accesskey生效的前置键按下的提示行为
        } else if (event.altKey == keyPrefix.altKey && event.shiftKey == keyPrefix.shiftKey && event.ctrlKey == keyPrefix.ctrlKey) {
            if (indexMatch == -1) {
                event.preventDefault();
                doc.hasTipsShow ? removeTips() : tips(arrElesOwnAccesskey);
            } else {
                removeTips();
            }

            // 4. IE浏览器和其他浏览器行为一致的处理
            if (browser == 'ie' && arrElesOwnAccesskey[indexMatch] && !isTargetInputable) {
                // click行为触发
                arrElesOwnAccesskey[indexMatch].click();
            }
        }
    });
    doc.addEventListener('mousedown', function () {
        removeTips();
    });


    /*
    ** CSS :focus或者JS的focus事件让下拉或浮层元素显示的时候键盘交互支持
    ** 基于data-target属性进行关联
    */

    var keycode = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        13: 'enter',
        9: 'tab',
        27: 'esc'
    };
    // 键盘高亮类名
    var className = 'ui-outline';
    // 高亮类名的添加与删除
    var classList = {
        add: function (ele) {
            ele.className = ele.className + ' ' + className;
        },
        remove: function (ele) {
            if (ele.className && ele.className.split) {
                ele.className = ele.className.split(/\s+/).filter(function (cl) {
                    if (cl != className) {
                        return cl;
                    }
                }).join(' ');
            }
        },
        removeAll: function () {
            [].slice.call(doc.querySelectorAll('.' + className)).forEach(function (ele) {
                classList.remove(ele);
            });
        },
        has: function (ele) {
            if (!ele.className || !ele.className.split) {
                return false;
            }

            return ele.className.split(/\s+/).filter(function (cl) {
                if (cl == className) {
                    return cl;
                }
            }).length > 0;
        }
    };

    win.isKeyEvent = false;
    //键盘事件
    doc.addEventListener('keydown', function (event) {
        win.isKeyEvent = true;

        setTimeout(function () {
            win.isKeyEvent = false;
        }, 100);

        // 是否是上下左右键
        var keyName = keycode[event.keyCode];
        if (!keyName) {
            return;
        }

        // 当前激活元素
        var trigger = doc.activeElement;
        if (!trigger || /body/i.test(trigger.tagName)) {
            return;
        }

        // 单复选框的增加回车选中，原生是空格键选中
        if (/^radio|checkbox$/i.test(trigger.type) && keyName == 'enter') {
            trigger.click();
            // 阻止默认的回车行为，主要是表单提交
            event.preventDefault();

            return;
        }

        // 如果是ESC退出
        var eleFirstMatchAttrTarget = null;
        var eleEscAll = doc.querySelectorAll('.ESC');
        if (keyName == 'esc' && eleEscAll.length) {
            [].slice.call(eleEscAll).forEach(function (eleEsc) {
                var idEsc = eleEsc.id;

                eleFirstMatchAttrTarget = idEsc && doc.querySelector('a[data-target="' + idEsc + '"],input[data-target="' + idEsc + '"],button[data-target="' + idEsc + '"]');
                if (eleFirstMatchAttrTarget && eleEsc.style.display !== 'none' && eleEsc.clientHeight > 0) {
                    eleFirstMatchAttrTarget.click();
                } else if (eleEsc == document.activeElement && eleEsc.click) {
                    eleEsc.click();
                }
            });
        }

        // 对应的面板
        // 1. data-target 点击出现的面板
        // 2. data-focus focus出现的面板
        var attrFocus = trigger.getAttribute('data-focus');
        var attrTarget = trigger.getAttribute('data-target');

        var target = null;

        if (!attrFocus && !attrTarget) {
            return;
        }

        if (attrFocus) {
            target = doc.getElementById(attrFocus);
        } else if (attrTarget) {
            target = doc.getElementById(attrTarget);
        }

        // 目标元素存在，并且是显示状态
        if (!target || (target.clientWidth == 0 && target.clientHeight == 0)) {
            return;
        }

        // 如果是Tab键
        if (keyName == 'tab') {
            classList.removeAll();

            var eleFirstFocusable = target;

            if (!target.getAttribute('tabindex')) {
                eleFirstFocusable = target.querySelector('a[href], button:not(:disabled), input:not(:disabled)');
            }

            if (eleFirstFocusable) {
                eleFirstFocusable.focus();
            }

            return;
        }

        // 如果是回车事件
        if (keyName == 'enter') {
            var eleFocus = target.querySelector('.' + className);
            if (eleFocus && attrFocus) {
                // 阻止默认的回车
                event.preventDefault();
                eleFocus.click();

                return;
            }
            if (attrTarget) {
                return;
            }
        }

        // ESC退出
        if (keyName == 'esc') {
            eleFirstMatchAttrTarget = doc.querySelector('a[data-target="' + attrTarget + '"],input[data-target="' + attrTarget + '"]');

            if (attrFocus) {
                trigger.blur();
            } else if (eleFirstMatchAttrTarget && /ESC/.test(eleFirstMatchAttrTarget.className) == false) {
                eleFirstMatchAttrTarget.click();
            }

            return;
        }

        // 如果都符合，同时有目标子元素
        var arrEleFocusable = [].slice.call(target.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled)'));
        var index = -1;

        if (arrEleFocusable.length == 0) {
            return;
        }

        // 计算出当前索引
        arrEleFocusable.forEach(function (ele, indexFocus) {
            if (attrFocus) {
                if (classList.has(ele)) {
                    index = indexFocus;
                }
            } else if (trigger == ele) {
                index = indexFocus;
            }
            // 先全部清除focus态
            classList.remove(ele);
        });

        // 阻止默认的上下键滚屏
        event.preventDefault();
        // 索引加加减减
        if (keyName == 'left' || keyName == 'up') {
            index--;
            if (index < 0) {
                index = -1;
            }
        } else if (keyName == 'right' || keyName == 'down') {
            index++;
            if (index > arrEleFocusable.length - 1) {
                index = arrEleFocusable.length;
            }
        }

        // 如果有对应的索引元素
        if (arrEleFocusable[index]) {
            // 高亮对应的控件元素
            if (attrFocus) {
                classList.add(arrEleFocusable[index]);
            } else {
                arrEleFocusable[index].focus();
            }
        }
    });

    doc.addEventListener('mousedown', function (event) {
        var target = event.target;
        if (target && !classList.has(target)) {
            classList.removeAll();
        }
    });

    doc.addEventListener('click', function (event) {
        var target = event.target;
        var eleActive = doc.activeElement;

        var tabindex = target.getAttribute('tabindex') || '-1';

        // 单复选框点击不focus
        // tabindex>=0 元素点击也不focus（避免outline出现）
        if (target && target == eleActive && (/^radio|checkbox$/i.test(eleActive.type) || tabindex >= 0) && win.isKeyEvent == false) {
            eleActive.blur();
        }
    });

    // 全局对a标签按钮进行无障碍角色设置
    doc.addEventListener('focusin', function (event) {
        var target = event.target;
        if (!target) {
            return;
        }

        // 无障碍增强
        if (/^javascript/.test(target.href) && !target.getAttribute('role')) {
            target.setAttribute('role', 'button');
        }

        if (!win.isKeyEvent) {
            return;
        }

        var objStyleTarget = window.getComputedStyle(target);

        // 键盘高亮
        if (objStyleTarget.outlineStyle == 'none') {
            classList.add(target);
        }
    });
    doc.addEventListener('focusout', function (event) {
        var target = event.target;
        if (target) {
            classList.remove(target);
        }
    });

    // 防止多次重复绑定键盘事件
    win.isKeyEventBind = true;

    return {};
}));
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
/**
 * @Tab.js
 * @author zhangxinxu
 * @version
 * @created: 15-06-12
 * @edit:    19-09-21 native js rewrite by lennonover
 * @review   19-09-25 by zhangxinxu
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Tab = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 可定制的极简选项卡切换效果
     * 状态类名使用.active
     * @使用示例
     *  new Tab(document.querySelectorAll('#tabView > a'), {
     *     onSwitch: function() {}
     *  });
     */

    var STATE = 'active';

    var CL = {
        add: function () {
            return ['ui-tab'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-tab';
        }
    };


    var Tab = function (elements, options) {
        // 元素的获取与判断
        var eleTabs = elements;
        // 如果元素没有，打道回府
        if (!eleTabs) {
            return;
        }
        if (typeof elements == 'string') {
            eleTabs = document.querySelectorAll(elements);
        }
        // 参数获取
        options = options || {};

        if (typeof options == 'function') {
            options = {
                onSwitch: options
            };
        }

        var defaults = {
            // 事件名称，还可以是mouseenter或者mouseover
            eventType: 'click',
            // 'auto' 表示根据选项卡上的状态类名获取index值
            index: 'auto',
            // 是否使用HTML5 history在URL上标记当前选项卡位置，for IE10+
            history: true,
            // tab 切换时 滑动效果
            slide: false,
            // 发生状态变化时候的回调
            onSwitch: function () {}
        };

        // 参数合并
        var objParams = Object.assign({}, defaults, options);

        // 很重要的索引
        var numIndexTab = objParams.index;

        // 所有对应的面板元素
        var elePanels = [];

        // 首先，获得索引值
        eleTabs.forEach(function (eleTab, index) {
            if (typeof numIndexTab != 'number' && eleTab.classList.contains(STATE)) {
                numIndexTab = index;
            }
            eleTab.setAttribute('data-index', index);
            eleTab.setAttribute('role', 'tab');
            eleTab.setAttribute('aria-selected', 'false');

            // 乘机获取所有对应的面板元素
            var elePanel = this.getPanel(eleTab);
            elePanels.push(elePanel);

            if (elePanel) {
                elePanel.setAttribute('role', 'tabpanel');
            }
        }.bind(this));

        // 如果没有匹配的选项卡索引，认为第一个选中
        if (typeof numIndexTab != 'number') {
            numIndexTab = 0;
        }

        // 暴露元素
        this.element = {
            tabs: eleTabs,
            tab: eleTabs[numIndexTab],
            panels: elePanels,
            panel: elePanels[numIndexTab]
        };
        // 参数暴露
        objParams.index = numIndexTab;
        this.params = objParams;
        // 回调暴露
        this.callback = {
            switch: objParams.onSwitch
        };
        // 事件绑定
        this.events();

        // 默认就来一发
        // 以便回调可以触发
        // 为了等业务事件绑定，这里的触发设置在DOM准备结束之后
        window.addEventListener('DOMContentLoaded', function () {
            eleTabs[numIndexTab].dispatchEvent(new CustomEvent(objParams.eventType));
            objParams.onSwitch.call(this, eleTabs[numIndexTab], elePanels[numIndexTab], null, null);
        }.bind(this));

        // 设置父元素的无障碍访问信息
        if (eleTabs.length > 1 && eleTabs[0].parentElement == eleTabs[1].parentElement) {
            eleTabs[0].parentElement.setAttribute('role', 'tablist');
        }
    };

    /**
     * 基于tab元素获取panel元素的方法
     * @param  {[type]} eleTab [description]
     * @return {[type]}        [description]
     */
    Tab.prototype.getPanel = function (eleTab) {
        if (!eleTab) {
            eleTab = this.element.tab;
        }
        // 获得属性对应的值
        var strAttr = eleTab.getAttribute('data-rel') || eleTab.getAttribute('href');

        if (!strAttr) {
            return null;
        }

        // 如果是href的锚点匹配
        if (/^#/.test(strAttr)) {
            return document.querySelector(strAttr);
        }

        // 如果是data-rel设置
        return document.querySelector('#' + strAttr) || document.querySelector('.' + strAttr);
    };

    /**
     * 播放的处理
     * @return {[type]} [description]
     */
    Tab.prototype.show = function (eleTab) {
        // 一些必须的暴露的参数
        var numIndexTab = this.index;
        var eleTabs = this.element.tabs;
        var objParams = this.params;

        // 对应选项卡显示的处理
        eleTab = eleTab || this.element.tab;
        if (!eleTab) {
            return;
        }
        var elePanel = this.getPanel(eleTab);
        var eleParent = eleTab.parentElement;

        // 改变当前选中tab与panel元素
        this.element.tab = eleTab;
        this.element.panel = elePanel;

        var strHref = eleTab.getAttribute('href');

        // 需要非选中状态才行执行切换
        if (eleTab.classList.contains(STATE)) {
            return;
        }

        // 选中元素的索引值
        numIndexTab = eleParent.querySelector('.' + STATE).getAttribute('data-index');
        // 选项卡样式变变变
        // 类名变化
        eleTab.classList.add(STATE);

        // 要移除类名的选项卡和选项面板
        var eleResetTab = eleTabs[numIndexTab];
        var eleResetPanel = this.getPanel(eleResetTab);
        // 类名移除
        eleResetTab.classList.remove(STATE);

        // 面板的变化
        elePanel.classList.add(STATE);
        eleResetPanel.classList.remove(STATE);
        // 索引参数变化
        numIndexTab = eleTab.getAttribute('data-index');
        this.params.index = numIndexTab * 1;

        // line 滑动效果 IE10+
        var eleLine;
        // 需要参数配合
        if (objParams.slide == true && history.pushState) {
            eleLine = eleParent.querySelector('.' + CL.add('line'));
            if (!eleLine) {
                eleLine = document.createElement('i');
                eleLine.className = CL.add('line');
                eleParent.insertBefore(eleLine, eleTabs[0]);
            }
            eleLine.style.display = 'block';
            eleLine.style.width = eleTab.clientWidth + 'px';
            eleLine.style.left = eleTab.offsetLeft + 'px';
        }
        // 回调方法
        this.callback.switch.call(this, eleTab, eleResetTab, elePanel, eleResetPanel);

        // 历史记录的处理
        if (/^(:?javas|#)/.test(strHref)) {
            var strAttr = (eleTab.getAttribute('data-rel') || strHref || '').replace(/^#/, '');

            if (objParams.history == true) {
                // url地址查询键值对替换
                var objURLParams = new URLSearchParams(location.search);
                // 改变查询键值，有则替换，无则新增
                objURLParams.set('tab', strAttr);

                // hash优化，去除重复的hash
                var strHash = location.hash;
                if (strHref == strHash) {
                    location.hash = strHash = '';
                }
                // 改变当前URL
                if (history.replaceState) {
                    history.replaceState(null, document.title, location.href.split('?')[0] + '?' + objURLParams.toString() + strHash);
                } else {
                    location.replace('#tab=' + strAttr);
                }
            }
        }
    };

    /**
     * 相关事件
     * @return {[type]} [description]
     */
    Tab.prototype.events = function () {
        // 获得选项卡对应的面板元素
        // 各个元素
        var objElement = this.element;
        var eleTabs = objElement.tabs;
        var objParams = this.params;

        // 单个监听事件，综合考虑不做委托
        eleTabs.forEach(function (eleTab) {
            eleTab.addEventListener(objParams.eventType, function (event) {
                if (/^(:?javas|#)/.test(event.target.getAttribute('href'))) {
                    event.preventDefault();
                }
                this.show(event.target);
            }.bind(this), false);
        }.bind(this));
    };

    return Tab;
}));
/**
 * @Select.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-18
 * @edit:    07-06-15  rewrite
 * @edit:    09-08-28  native js rewrite
**/

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Select = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 模拟下拉框效果
     * 针对所有浏览器进行处理
     * 基于原生的<select>元素生成
     *
     */

    // 常量变量
    var SELECT = 'select';
    var SELECTED = 'selected';
    var DISABLED = 'disabled';
    var ACTIVE = 'active';
    var REVERSE = 'reverse';
    var MULTIPLE = 'multiple';

    // 样式类名统一处理
    var CL = {
        add: function () {
            return ['ui', SELECT].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-' + SELECT;
        }
    };

    /**
     * 基于原生下拉框生成的下拉组件
     * @param {Object} element 原生select元素
     */
    var Select = function (element) {
        if (!element) {
            return this;
        }

        var eleSelect = element;

        // 避免重复初始化
        if (eleSelect.data && eleSelect.data.select) {
            return;
        }

        var strAttrWidth = eleSelect.style.width || eleSelect.getAttribute('width');
        if (!strAttrWidth) {
            strAttrWidth = eleSelect.offsetWidth;
        }
        this.offsetWidth = strAttrWidth;

        // 构造元素
        // 1. 得到关联id
        var strId = eleSelect.id;
        if (!strId) {
            strId = ('lulu_' + Math.random()).replace('0.', '');
        } else {
            strId = 'lulu_' + strId;
        }
        this.id = strId;

        // 2. 是否多选
        var isMultiple = (typeof eleSelect.getAttribute(MULTIPLE) == 'string');
        this.multiple = isMultiple;

        // 3. 创建下拉组合框元素
        var eleCombobox = document.createElement('div');
        eleCombobox.setAttribute('role', 'combobox');

        // 4. 创建下拉点击按钮元素
        var eleButton = document.createElement('a');
        if (!eleSelect[DISABLED]) {
            eleButton.setAttribute('href', 'javascript:');
        }
        eleButton.setAttribute('data-target', strId);
        // 下面3个aria无障碍访问需要
        eleButton.setAttribute('role', 'button');
        eleButton.setAttribute('aria-expanded', 'false');
        eleButton.setAttribute('aria-owns', strId);
        // 样式类名
        eleButton.classList.add(CL.add('button'));

        // 5. 创建下拉列表元素
        var eleDatalist = document.createElement('div');
        eleDatalist.id = strId;
        eleDatalist.setAttribute('role', 'listbox');
        eleDatalist.setAttribute('aria-expanded', 'true');
        eleDatalist.classList.add(CL.add('datalist'));

        // 6. 元素组装
        // multiple没有button
        if (isMultiple == false) {
            eleCombobox.appendChild(eleButton);
            eleCombobox.appendChild(eleDatalist);
            // 插入到下拉框的后面
            eleSelect.style.display = 'none';
            eleSelect.insertAdjacentElement('afterend', eleCombobox);
        } else {
            eleCombobox.appendChild(eleDatalist);
            // 绝对定位隐藏，以便可以响应键盘focus
            eleSelect.style.position = 'absolute';
            eleSelect.style.zIndex = 1;
            eleSelect.insertAdjacentElement('afterend', eleCombobox);
            // 视觉列表不参与设置为不可访问
            eleDatalist.setAttribute('aria-hidden', 'true');
        }
        // 暴露给其他方法
        this.element = {
            select: eleSelect,
            combobox: eleCombobox,
            button: eleButton,
            datalist: eleDatalist
        };

        // 刷新内容
        this.refresh();

        // 事件绑定
        this.events();

        // 存储
        if (!eleSelect.data) {
            eleSelect.data = {
                select: this
            };
        } else {
            eleSelect.data.select = this;
        }
    };

    /**
     * 下拉相关的事件处理
     * @return {[type]} [description]
     */
    Select.prototype.events = function () {
        // 各个元素
        var objElement = this.element;
        // 主要的几个元素
        var eleSelect = objElement.select;
        var eleCombobox = objElement.combobox;
        var eleButton = objElement.button;
        var eleDatalist = objElement.datalist;

        // 单选下拉框的事件
        if (this.multiple == false) {
            // 点击页面空白要隐藏
            // 测试表明，这里优化下可以提高40~50%性能
            // 原本是绑定对应元素上，现在改成委托
            if (!document.isSelectMouseEvent) {
                document.addEventListener('click', function (event) {
                    var target = event.target;

                    if (!target || !target.closest) {
                        return;
                    }

                    // 获取下拉元素是关键，因为存储了实例对象
                    // 元素什么的都可以直接匹配
                    eleCombobox = target.closest('.' + CL);
                    eleSelect = eleCombobox && eleCombobox.previousElementSibling;

                    if (!eleSelect || !eleSelect.data || !eleSelect.data.select) {
                        return;
                    }

                    // 按钮和列表元素就知道了
                    objElement = eleSelect.data.select.element;

                    eleButton = objElement.button;
                    eleDatalist = objElement.datalist;

                    // 下面判断点击的是按钮还是列表了
                    if (eleButton.contains(target)) {
                        if (eleSelect[DISABLED]) {
                            return false;
                        }

                        // 显示与隐藏
                        eleCombobox.classList.toggle(ACTIVE);

                        if (eleCombobox.classList.contains(ACTIVE)) {
                            // 边界判断
                            var isOverflow = eleDatalist.getBoundingClientRect().bottom + window.pageYOffset > Math.max(document.body.clientHeight, window.innerHeight);
                            eleCombobox.classList[isOverflow ? 'add' : 'remove'](REVERSE);
                            // aria状态
                            eleButton.setAttribute('aria-expanded', 'true');

                            // 滚动与定位
                            var arrDataScrollTop = eleCombobox.dataScrollTop;
                            var eleDatalistSelected = eleDatalist.querySelector('.' + SELECTED);
                            // 严格验证
                            if (arrDataScrollTop && arrDataScrollTop[1] == eleDatalistSelected.getAttribute('data-index') && arrDataScrollTop[2] == eleDatalistSelected.innerText) {
                                eleDatalist.scrollTop = arrDataScrollTop[0];
                                // 重置
                                delete eleCombobox.dataScrollTop;
                            }
                        } else {
                            eleCombobox.classList.remove(REVERSE);
                            // aria状态
                            eleButton.setAttribute('aria-expanded', 'false');
                        }
                    } else if (eleDatalist.contains(target)) {
                        // 点击的列表元素
                        var eleList = target;
                        // 对应的下拉<option>元素
                        var eleOption = null;
                        // 是否当前点击列表禁用
                        var isDisabled = eleList.classList.contains(DISABLED);
                        // 获取索引
                        var indexOption = eleList.getAttribute('data-index');
                        // 存储可能的滚动定位需要的数据
                        var scrollTop = eleDatalist.scrollTop;
                        eleCombobox.dataScrollTop = [scrollTop, indexOption, eleList.innerText];

                        // 修改下拉选中项
                        if (isDisabled == false) {
                            eleOption = eleSelect[indexOption];
                            if (eleOption) {
                                eleOption[SELECTED] = true;
                            }
                        }
                        // 下拉收起
                        eleCombobox.classList.remove(ACTIVE);
                        eleButton.setAttribute('aria-expanded', 'false');
                        // focus
                        eleButton.focus();
                        eleButton.blur();

                        if (isDisabled == false) {
                            // 更新下拉框
                            eleSelect.refresh();
                            // 回调处理
                            // 触发change事件
                            eleSelect.dispatchEvent(new CustomEvent('change', {
                                'bubbles': true
                            }));
                        }
                    }
                });

                document.addEventListener('mouseup', function (event) {
                    var target = event.target;
                    if (!target) {
                        return;
                    }
                    // 识别此时的combobox
                    eleCombobox = document.querySelector(SELECT + '+.' + CL + '.' + ACTIVE);

                    if (!eleCombobox) {
                        return;
                    }

                    eleButton = eleCombobox.querySelector('.' + CL.add('button'));

                    if (eleCombobox.contains(target) == false) {
                        eleCombobox.classList.remove(ACTIVE);
                        eleCombobox.classList.remove(REVERSE);
                        // aria状态
                        if (eleButton) {
                            eleButton.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                document.isSelectMouseEvent = true;
            }

            // disabled状态变化与键盘访问
            var funSyncDisabled = function () {
                if (eleSelect[DISABLED]) {
                    eleButton.removeAttribute('href');
                } else {
                    eleButton.href = 'javascript:';
                }
            };
            // 禁用状态变化检测
            if (window.MutationObserver) {
                var observerSelect = new MutationObserver(function (mutationsList) {
                    mutationsList.forEach(function (mutation) {
                        if (mutation.type == 'attributes') {
                            funSyncDisabled();
                        }
                    });
                });

                observerSelect.observe(eleSelect, {
                    attributes: true,
                    attributeFilter: [DISABLED]
                });
            } else {
                eleSelect.addEventListener('DOMAttrModified', function (event) {
                    if (event.attrName == DISABLED) {
                        funSyncDisabled();
                    }
                });
            }
        } else {
            // 下拉多选
            // 键盘交互UI同步
            eleSelect.addEventListener('change', function () {
                // 更新下拉框
                this.refresh();
            }.bind(this));
            // 滚动同步
            eleSelect.addEventListener('scroll', function () {
                eleDatalist.scrollTop = eleSelect.scrollTop;
            });
            // hover穿透
            eleSelect.addEventListener('mousedown', function () {
                eleSelect.setAttribute('data-active', 'true');
            });
            eleSelect.addEventListener('mousemove', function (event) {
                if (eleSelect.getAttribute('data-active')) {
                    this.refresh();

                    return;
                }
                var clientY = event.clientY;
                // 当前坐标元素
                // 最好方法是使用
                // document.elementsFromPoint
                // IE10+是document.msElementFromPoint
                // 但IE8, IE9浏览器并不支持
                // 所以这里采用其他方法实现
                // 判断列表的y位置和clientY做比较
                var eleListAll = eleDatalist.querySelectorAll('a');
                for (var indexList = 0; indexList < eleListAll.length; indexList++) {
                    var eleList = eleListAll[indexList];
                    // hover状态先还原
                    eleList.removeAttribute('href');
                    // 然后开始寻找匹配的列表元素
                    // 进行比对
                    var beginY = eleList.getBoundingClientRect().top;
                    var endY = beginY + eleList.clientHeight;
                    // 如果在区间范围
                    if (clientY >= beginY && clientY <= endY) {
                        if (eleList.classList.contains(SELECTED) == false && eleList.classList.contains(DISABLED) == false) {
                            eleList.href = 'javascript:';
                        }
                        // 退出循环
                        // forEach无法中断，因此这里使用了for循环
                        break;
                    }
                }
            }.bind(this));

            eleSelect.addEventListener('mouseout', function () {
                var eleListAllWithHref = eleDatalist.querySelectorAll('a[href]');
                eleListAllWithHref.forEach(function (eleList) {
                    eleList.removeAttribute('href');
                });
            });

            document.addEventListener('mouseup', function () {
                eleSelect.removeAttribute('data-active');
            });
        }
    };

    /**
     * 把下拉元素变成数据，格式为：
     * [{
        html: '选项1',
        value: '1',
        selected: false,
        className: 'a'
     }, {
        html: '选项2',
        value: '2',
        selected: true,
        className: 'b'
     }]
    * @return 数组
    */
    Select.prototype.getData = function () {
        var eleSelect = this.element.select;

        var eleOptions = eleSelect.querySelectorAll('option');

        if (eleOptions.length == 0) {
            return [{
                html: ''
            }];
        }

        return [].slice.call(eleOptions).map(function (option) {
            return {
                html: option.innerHTML,
                value: option.value,
                selected: option.selected,
                disabled: option.disabled,
                className: option.className
            };
        });
    };

    /**
     * 下拉刷新方法
     * @param  {Array} data 根据数组数据显示下拉内容
     * @return {Object}     返回当前实例对象
     */
    Select.prototype.refresh = function (data) {
        // 实例id
        var id = this.id;
        // 是否多选
        var isMultiple = this.multiple;
        // 各个元素
        var objElement = this.element;
        // 主要的几个元素
        var eleSelect = objElement.select;
        var eleCombobox = objElement.combobox;
        var eleButton = objElement.button;
        var eleDatalist = objElement.datalist;

        // 获取当下下拉框的数据和状态
        data = data || this.getData();

        // 下拉组合框元素的UI和尺寸
        eleCombobox.className = (eleSelect.className + ' ' + CL).trim();

        // offsetWidth/clientWidth/getBoundingClientRect在下拉元素很多的的时候会有明显的性能问题
        // 因此宽度已知的时候，使用定值，否则实时获取
        var strAttrWidth = this.offsetWidth;

        if (/\D$/.test(strAttrWidth)) {
            // 如果是<length>
            eleCombobox.style.width = strAttrWidth;
        } else {
            // 如果是<number>
            eleCombobox.style.width = strAttrWidth + 'px';
        }

        // 多选，高度需要同步，因为选项高度不确定
        if (isMultiple) {
            eleCombobox.style.height = eleSelect.style.height || (eleSelect.offsetHeight + 'px');
        } else {
            // 按钮元素中的文案
            eleButton.innerHTML = '<span class="' + CL.add('text') + '">' + (function () {
                var htmlSelected = '';

                data.forEach(function (obj) {
                    if (obj.selected) {
                        htmlSelected = obj.html;
                    }
                });

                return htmlSelected || data[0].html;
            })() + '</span><i class="' + CL.add('icon') + '" aria-hidden="true"></i>';
        }

        // 列表内容的刷新
        eleDatalist.innerHTML = data.map(function (obj, index) {
            var arrCl = [CL.add('datalist', 'li')];

            if (obj.className) {
                arrCl.push(obj.className);
            }
            if (obj[SELECTED]) {
                arrCl.push(SELECTED);
            }
            if (obj[DISABLED]) {
                arrCl.push(DISABLED);
            }

            // 复选模式列表不参与无障碍访问识别，因此HTML相对简单
            if (isMultiple) {
                return '<a class="' + arrCl.join(' ') + '" data-index=' + index + '>' + obj.html + '</a>';
            }

            return '<a ' + (obj[DISABLED] ? '' : 'href="javascript:" ') + 'class="' + arrCl.join(' ') + '" data-index=' + index + ' data-target="' + id + '" role="option" aria-selected="' + obj[SELECTED] + '">' + obj.html + '</a>';
        }).join('');

        return this;
    };

    /**
     * 删除方法
     * @return {[type]} [description]
     */
    Select.prototype.remove = function () {
        // 主元素
        var eleCombobox = this.element.combobox;

        if (eleCombobox) {
            eleCombobox.remove();
        }
    };

    // 重新定义select元素的value方法
    Object.defineProperty(HTMLSelectElement.prototype, 'value', {
        configurable: true,
        enumerable: true,
        writeable: true,
        get: function () {
            var arrValue = [];
            this.querySelectorAll('option').forEach(function (eleOption) {
                if (eleOption[SELECTED] == true) {
                    arrValue.push(eleOption.value);
                }
            });

            return arrValue.join();
        },
        set: function (value) {
            var isOptionMatch = false;
            // 是否多选框
            var isMultiple = (typeof this.getAttribute('multiple') == 'string');
            if (isMultiple) {
                value = value.split(',');
            } else {
                value = [value.toString()];
            }

            this.querySelectorAll('option').forEach(function (eleOption) {
                // 单选框模式下，如果多个值匹配，让第一个选中
                // 如果没有下面这句，会最后一个匹配的选中
                if (isMultiple == false && isOptionMatch == true) {
                    return;
                }
                if (value.indexOf(eleOption.value) != -1) {
                    eleOption[SELECTED] = isOptionMatch = true;
                } else if (isMultiple) {
                    eleOption[SELECTED] = false;
                }
            });

            // 如果包含匹配的值，则重新刷新
            if (isOptionMatch == true) {
                this.refresh();
            }
        }
    });

    HTMLSelectElement.prototype.refresh = function () {
        if (this.data && this.data.select) {
            this.data.select.refresh();
        } else {
            new Select(this);
        }
    };

    var funAutoInitAndWatching = function () {
        // 如果没有开启自动初始化，则返回
        if (window.autoInit === false) {
            return;
        }
        document.querySelectorAll('select').forEach(function (eleSelect) {
            if (window.getComputedStyle(eleSelect).opacity != '1') {
                eleSelect.refresh();
            }
        });

        // 如果没有开启观察，不监听DOM变化
        if (window.watching === false) {
            return;
        }

        var funSyncRefresh = function (node, action) {
            if (node.nodeType != 1) {
                return;
            }

            if (node.tagName == 'SELECT') {
                if (action == 'remove') {
                    if (node.data && node.data.select) {
                        node.data.select[action]();
                    } else {
                        node.parentNode.removeChild(node);
                    }
                } else {
                    node[action]();
                }
            } else if (node.tagName == 'OPTION') {
                var eleSelect = node.parentElement;

                if (!eleSelect) {
                    // 可以认为是观察者模式的删除
                    if (this.target && this.target.tagName == 'SELECT') {
                        this.target.refresh();
                    }
                } else if (eleSelect.data && eleSelect.data.select) {
                    setTimeout(function () {
                        eleSelect.refresh();
                    }, 16);
                }
            } else if (action == 'refresh') {
                // 此时Select初始化也会触发DOM检测
                // 但没有必要，因此，阻止
                funAutoInitAndWatching.flag = false;
                // 只是Select初始化
                node.querySelectorAll('select').forEach(function (element) {
                    funSyncRefresh(element, action);
                });
                // 恢复到正常检测
                funAutoInitAndWatching.flag = true;
            }
        };

        // DOM Insert自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                // 此时不检测DOM变化
                if (funAutoInitAndWatching.flag === false || window.watching === false) {
                    return;
                }
                mutationsList.forEach(function (mutation) {
                    var nodeAdded = mutation.addedNodes;
                    var nodeRemoved = mutation.removedNodes;

                    if (nodeAdded.length) {
                        nodeAdded.forEach(function (eleAdd) {
                            funSyncRefresh.call(mutation, eleAdd, 'refresh');
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
            // IE9-IE10优化处理
            // 借助定时器先观察，再统一处理
            var arrMutationsList = [];
            var timerRenderList = null;

            var funMutationObserver = function (target, action, event) {
                // 此时不检测DOM变化
                if (funAutoInitAndWatching.flag === false || window.watching === false || target.nodeType != 1) {
                    return;
                }

                clearTimeout(timerRenderList);

                if (target.tagName == 'SELECT') {
                    arrMutationsList.push({
                        action: action,
                        node: target
                    });
                } else if (target.tagName == 'OPTION' && (arrMutationsList.length == 0 || arrMutationsList[arrMutationsList.length - 1].node.contains(target) == false)) {
                    arrMutationsList.push({
                        action: 'refresh',
                        node: event.relatedNode || target
                    });
                }

                // 定时器处理
                timerRenderList = setTimeout(function () {
                    funAutoInitAndWatching.flag = false;

                    arrMutationsList.forEach(function (objList) {
                        // 插入节点
                        funSyncRefresh(objList.node, objList.action);
                    });

                    funAutoInitAndWatching.flag = true;

                    arrMutationsList = [];
                }, 16);
            };

            document.body.addEventListener('DOMNodeInserted', function (event) {
                funMutationObserver(event.target, 'refresh', event);
            });
            document.body.addEventListener('DOMNodeRemoved', function (event) {
                // relatedNode
                funMutationObserver(event.target, 'remove', event);
            });
        }
    };

    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }

    return Select;
}));
/**
 * @Drop.js
 * @author zhangxinxu
 * @version
 * Created: 15-06-30
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        this.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Drop = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Follow = this.Follow;
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
            eleTrigger = document.querySelector(eleTrigger);
        }
        if (typeof eleTarget == 'string') {
            eleTarget = document.querySelector(eleTarget);
        }

        if (typeof eleTarget == 'object' && typeof eleTarget.nodeType != 'number') {
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
        document.addEventListener('click', function (event) {
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

    return Drop;
}));
/**
 * @Tips.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edit:    17-06-19
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Tips = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
        
    var Follow = this.Follow;
    if (typeof require == 'function' && !Follow) {
        Follow = require('common/ui/Follow');
    } else if (!Follow) {
        window.console.error('need Follow.js');

        return {};
    }

    /**
     * 黑色tips效果
     * @example
     * new Tips(element, options)
     **/

    // 类名变量
    var CL = {
        add: function () {
            return ['ui-tips'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-tips';
        }
    };
    var REVERSE = 'reverse';

    /**
     * 黑色tips效果
     * @param {Object|String}    element 需要提示的元素，也可以是元素的选择器
     * @param {Object} options   可选参数
     */
    var Tips = function (element, options) {
        if (!element) {
            return this;
        }

        var defaults = {
            // eventType其他值：'click', 'null'
            eventType: 'hover',
            // align: auto表示自动根据元素上的属性确定定位方式
            // 可以使用data-align或者data-position自定义定位
            // 如果没有这些属性值，有类名reverse
            // 认为是7-5
            // 其他场景认为是5-7
            // 支持Follow.js中所有position位置
            align: 'auto',
            content: '',
            onShow: function () {},
            onHide: function () {}
        };

        var eleTrigger = element;

        // 如果参数是字符串，认为是选择器
        if (typeof element == 'string') {
            eleTrigger = document.querySelectorAll(element);
            if (eleTrigger.length == 0) {
                return this;
            }
        }

        // 避免重复初始化
        if (eleTrigger.data && eleTrigger.data.tips) {
            return eleTrigger.data.tips;
        }

        if (eleTrigger.length && eleTrigger.forEach) {
            eleTrigger.forEach(function (trigger) {
                new Tips(trigger, options);
            });
            return eleTrigger[0].data.tips;
        }

        var objParams = Object.assign({}, defaults, options || {});

        // 暴露参数
        this.element = {
            trigger: eleTrigger
        };

        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };
        this.params = {
            eventType: objParams.eventType,
            align: objParams.align
        };

        if (objParams.content) {
            this.content = objParams.content;
        }

        // 事件处理
        this.events();

        // 存储实例对象
        if (!eleTrigger.data) {
            eleTrigger.data = {};
        }
        eleTrigger.data.tips = this;

        return this;
    };

    /**
     * 定义一个content属性，可以设置与获取tips提示内容
     * @param {[type]} )
     */
    Object.defineProperty(Tips.prototype, 'content', {
        configurable: true,
        enumerable: true,
        writeable: true,
        get: function () {
            var eleTrigger = this.element && this.element.trigger;
            if (!eleTrigger) {
                return '';
            }
            var strTitle = eleTrigger.getAttribute('title') || eleTrigger.getAttribute('data-title') || '';

            // CSS 驱动的tips提示效果是基于data-title
            eleTrigger.setAttribute('data-title', strTitle);
            // 屏幕阅读无障碍访问支持
            eleTrigger.setAttribute('aria-label', strTitle);

            // 移除浏览器默认的title，防止交互冲突
            eleTrigger.removeAttribute('title');

            return strTitle;
        },
        set: function (value) {
            var eleTrigger = this.element && this.element.trigger;
            if (eleTrigger) {
                eleTrigger.setAttribute('data-title', value);
                // 屏幕阅读无障碍访问支持
                eleTrigger.setAttribute('aria-label', value);
            }
        }
    });


    /**
     * 相关的事件处理
     * @return {[type]} [description]
     */
    Tips.prototype.events = function () {
        var eleTrigger = this.element.trigger;
        // 非focusable元素使其focusable
        if (/^a|input|button|area$/i.test(eleTrigger.tagName) == false) {
            eleTrigger.setAttribute('tabindex', '0');
            // 更语义
            eleTrigger.setAttribute('role', 'tooltip');
        }

        // 如果是纯CSS定位实现的tips效果
        if (eleTrigger.classList.contains(CL)) {
            // 如果元素含有title, 需要转换成data-title
            this.content;

            // outline处理，点击时候提示不跟随
            // 键盘无障碍访问的细节处理
            eleTrigger.addEventListener('click', function () {
                if (!window.isKeyEvent) {
                    this.blur();
                }
            }, false);

            return;
        }

        var objParams = this.params;
        // hover显示延迟时间
        var numDelay = 100;
        // 设置定时器对象
        var timerTips;
        // 如果是不支持hover行为的浏览器，hover变click
        var isHover = getComputedStyle(document.documentElement).getPropertyValue('--hoverNone'); 
        if (isHover && objParams.eventType == 'hover') {
            objParams.eventType = 'click';
        }
        // 事件走起
        if (objParams.eventType == 'hover') {
            // 鼠标进入
            eleTrigger.addEventListener('mouseenter', function () {
                timerTips = setTimeout(function () {
                    this.show();
                }.bind(this), numDelay);
            }.bind(this));
            // 鼠标离开
            eleTrigger.addEventListener('mouseleave', function () {
                clearTimeout(timerTips);
                // 隐藏提示
                this.hide();
            }.bind(this));

            // 支持focus的显示与隐藏
            // 但是需要是键盘访问触发的focus
            eleTrigger.addEventListener('focus', function () {
                if (window.isKeyEvent) {
                    this.show();
                }
            }.bind(this));
            // 元素失焦
            eleTrigger.addEventListener('blur', function () {
                this.hide();
            }.bind(this));
        } else if (objParams.eventType == 'click') {
            eleTrigger.addEventListener('click', function () {
                this.show();
            }.bind(this));
            // 关闭
            document.addEventListener('mouseup', function (event) {
                var eleTarget = event.target;
                if (this.display == true && eleTrigger.contains(eleTarget) == false && this.element.tips.contains(eleTarget) == false) {
                    this.hide();
                }
            }.bind(this));
        } else {
            // 其他事件类型直接显示
            this.show();
        }
    };

    /**
     * tip提示显示
     * @param  {String} content 显示的提示信息
     * @return {Object}         返回当前实例对象
     */
    Tips.prototype.show = function () {
        var strContent = this.content;
        if (!strContent) {
            return this;
        }

        // 元素
        var eleTrigger = this.element.trigger;
        var eleTips = this.element.tips;

        // tips图形需要的元素
        var eleContent, eleArrow;

        if (eleTips) {
            eleTips.style.display = 'block';
            // 三角元素获取
            eleContent = eleTips.querySelector('span');
            eleArrow = eleTips.querySelector('i');
            // 坐标还原，因为可能有偏移处理
            eleArrow.style.left = '';
            // 改变显示内容
            eleContent.innerHTML = strContent;
        } else {
            // eleTips元素不存在，则重新创建
            eleTips = document.createElement('div');
            eleTips.classList.add(CL.add('x'));
            // 创建内容元素和三角元素
            eleContent = document.createElement('span');
            eleContent.classList.add(CL.add('content'));
            // 内容
            eleContent.innerHTML = strContent;

            eleArrow = document.createElement('i');
            eleArrow.classList.add(CL.add('arrow'));

            // 屏幕阅读无障碍访问描述
            if (!eleTrigger.getAttribute('aria-label')) {
                // 创建随机id, aria需要
                var strRandomId = 'lulu_' + (Math.random() + '').replace('0.', '');
                // 设置
                eleContent.id = strRandomId;
                eleTrigger.setAttribute('aria-labelledby', strRandomId);
            }

            // append到页面中
            eleTips.appendChild(eleContent);
            eleTips.appendChild(eleArrow);
            document.body.appendChild(eleTips);
        }

        // 定位
        var strPosition = '5-7';
        // 定位只有5-7, 7-5, 6-8, 8-6这几种
        // 其中5-7是默认，提示在上方
        // 7-5是由'reverse'类名或参数决定的
        var strAlign = this.params.align;
        if (strAlign == 'auto') {
            strAlign = eleTrigger.getAttribute('data-align') || eleTrigger.getAttribute('data-position') || 'center';
        }

        // 关键字参数与位置
        if (strAlign == 'center') {
            strPosition = '5-7';
            if (eleTrigger.classList.contains(REVERSE)) {
                strPosition = '7-5';
            }
        } else if (strAlign == 'left') {
            strPosition = '1-4';
            if (eleTrigger.classList.contains(REVERSE)) {
                strPosition = '4-1';
            }
        } else if (strAlign == 'right') {
            strPosition = '2-3';
            if (eleTrigger.classList.contains(REVERSE)) {
                strPosition = '3-2';
            }
        } else if (/^\d-\d$/.test(strAlign)) {
            strPosition = strAlign;
        }

        new Follow(eleTrigger, eleTips, {
            // trigger-target
            position: strPosition,
            // 边界溢出不自动修正
            edgeAdjust: false
        });


        // 三角的重定位
        var strPositionTips = eleTips.getAttribute('data-align');
        if (strPositionTips && strPositionTips.split('-').reduce(function (accumulator, currentValue) {
            return accumulator * 1 + currentValue * 1;
        }) == 5) {
            var numHalfOffsetWidth = eleTrigger.getBoundingClientRect().width / 2 - eleArrow.getBoundingClientRect().width / 2;

            // 三角偏移处理
            if (strPositionTips == '1-4' || strPositionTips == '4-1') {
                eleArrow.style.left = numHalfOffsetWidth + 'px';
            } else {
                eleArrow.style.left = 'calc(100% - ' + (eleArrow.getBoundingClientRect().width + numHalfOffsetWidth) + 'px)';
            }
        }

        // 显示的回调
        this.callback.show.call(this, eleTrigger, eleTips);

        this.element.tips = eleTips;

        this.display = true;

        return this;
    };

    /**
     * tip提示隐藏
     * @return {Object} 返回当前实例对象
     */
    Tips.prototype.hide = function () {
        var eleTips = this.element.tips;
        if (eleTips) {
            eleTips.style.display = 'none';
            // 移除回调
            this.callback.hide.call(this, this.element.trigger, eleTips);
        }
        this.display = false;

        return this;
    };

    // 自动初始化.ui-tips和.jsTips类名元素
    window.addEventListener('DOMContentLoaded', function () {
        new Tips('.' + CL + ', .jsTips');
    });

    // 全局委托
    document.addEventListener('mouseover', function (event) {
        var eleTrigger = event.target;
        if (!eleTrigger || !eleTrigger.closest) {
            return;
        }
        eleTrigger = eleTrigger.closest('.' + CL + ', .jsTips');

        if (eleTrigger && (!eleTrigger.data || !eleTrigger.data.tips)) {
            new Tips(eleTrigger);

            var objTips = eleTrigger.data.tips;
            if (objTips && eleTrigger.classList.contains('jsTips')) {
                objTips.show();
            }
        }
    });

    return Tips;
}));

/**
 * @LightTip.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @Update: 19-09-13 @ziven27 [去jQuery]
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.LightTip = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 顶部的请提示效果
     * @example
     * new LightTip(content, options);
     * 快捷方式：
     * new LightTip().success(content, duration);
     * new LightTip().error(content, duration);
     **/

    // 类名变量
    var CL = {
        add: function () {
            return ['ui-lightip'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-lightip';
        }
    };

    var LightTip = function (content, options) {
        // 默认参数
        var defaults = {
            // normal为黑色显示
            // 还支持success和error
            // 以及其他自定义状态
            // status也可以换成type
            status: 'normal',
            duration: 3000
        };

        if (typeof content == 'object') {
            options = content;
            content = undefined;
        }

        this.params = Object.assign({}, defaults, options || {});
        if (this.params.type) {
            this.params.status = this.params.type;
        }

        // 1. 容器元素
        // <div>元素改成<a>元素，前者默认无法响应回车click
        var eleContainer = document.createElement('a');
        eleContainer.href = 'javascript:';
        eleContainer.setAttribute('role', 'tooltip');
        eleContainer.className = CL + ' ESC';

        // 2. 提示内容元素
        // 原来<span>改成<div>因为可能有其他HTML元素
        var eleContent = document.createElement('div');
        eleContent.className = CL.add('text');

        // 组合
        eleContainer.appendChild(eleContent);
        // 装载到页面中
        document.body.appendChild(eleContainer);

        // 暴露出去给其他方法使用
        this.element = {
            container: eleContainer,
            content: eleContent
        };

        // 隐藏的定时器
        this.timerRemove = null;

        // 事件处理
        this.events();

        // 提示内容
        this.content = content;

        // 显示
        this.show();
    };

    /**
     * 轻提示的相关事件处理
     * @return {[type]} [description]
     */
    LightTip.prototype.events = function () {
        // 元素们
        var objElement = this.element;
        var eleContainer = objElement.container;

        // 点击轻提示可以快速隐藏
        eleContainer.addEventListener('click', function () {
            this.remove();
        }.bind(this));
    };

    /**
     * 键盘可访问的细节处理
     * @return {Object} 返回当前实例对象
     */
    LightTip.prototype.tabIndex = function () {
        var eleContainer = this.element.container;
        var eleLastActive = this.lastActiveElement;

        if (this.display == true) {
            var eleActiveElement = document.activeElement;
            if (eleContainer !== eleActiveElement) {
                this.lastActiveElement = eleActiveElement;
            }

            // 键盘索引起始位置定位在提示元素上
            eleContainer.focus();
        } else if (eleLastActive && !eleLastActive.matches('body')) {
            // 键盘焦点元素还原
            // IE有一定概率会重定位，暂时忽略不处理
            eleLastActive.focus({
                preventScroll: true
            });
            if (!window.isKeyEvent) {
                eleLastActive.blur();
            }
            this.lastActiveElement = null;
        }

        return this;
    };


    /**
     * LightTip显示
     * @returns {LightTip}
     */
    LightTip.prototype.show = function () {
        // 元素们
        var objElement = this.element;
        var eleContainer = objElement.container;
        var eleContent = objElement.content;

        // 这是参数
        var objParams = this.params;

        // 提示内容
        var strContent = this.content;

        if (!strContent) {
            return;
        }

        // 清除隐藏轻提示的定时器
        clearTimeout(this.timerRemove);

        // 当前轻提示的状态和内容
        eleContainer.setAttribute('data-status', objParams.status);
        if (objParams.type) {
            eleContainer.setAttribute('data-type', objParams.type);
        }
        eleContent.innerHTML = strContent;

        // 轻提示显示
        eleContainer.setAttribute('open', 'open');

        // 状态更改为显示
        this.display = true;

        // 键盘无障碍处理
        this.tabIndex();

        // 层级最大
        this.zIndex();

        // 显示一定时间之后消失
        this.timerRemove = setTimeout(function () {
            this.remove();
        }.bind(this), objParams.duration);

        return this;
    };

    /**
     * 移除轻提示元素，直接移除
     * @param  {[type]} ele [description]
     * @return {[type]}     [description]
     */
    LightTip.prototype.remove = function () {
        var eleContainer = this.element.container;
        if (eleContainer && eleContainer.remove) {
            // 清除隐藏轻提示的定时器
            clearTimeout(this.timerRemove);
            // 元素移除
            eleContainer.remove();
        }

        // 改变显示状态
        this.display = false;

        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        this.tabIndex();
    };

    /**
     * 隐藏轻提示元素，直接移除
     * @param  {[type]} ele [description]
     * @return {[type]}     [description]
     */
    LightTip.prototype.hide = function () {
        var eleContainer = this.element.container;
        if (eleContainer) {
            // 清除隐藏轻提示的定时器
            clearTimeout(this.timerRemove);
            // 元素移除
            eleContainer.removeAttribute('open');
        }

        // 改变显示状态
        this.display = false;

        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        this.tabIndex();
    };

    /**
     *
     * @param content [显示文案]
     * @param duration  [显示时间]
     * @returns {LightTip}
     */
    LightTip.prototype.success = function (content, duration) {
        if (typeof content == 'function') {
            content = content();
        }

        // 根据设置改变参数值
        if (typeof content == 'string') {
            this.content = content;
        } else if (typeof content == 'number') {
            duration = content;
        }

        this.params.status = 'success';

        if (duration) {
            this.params.duration = duration;
        }

        // 增强的无障碍访问提示
        if (this.element.container) {
            this.element.container.setAttribute('aria-label', '操作成功');
        }

        this.show();

        return this;
    };

    /**
     *
     * @param content [显示文案]
     * @param duration  [显示时间]
     * @returns {LightTip}
     */
    LightTip.prototype.error = function (content, duration) {
        if (typeof content == 'function') {
            content = content();
        }

        // 根据设置改变参数值
        if (typeof content == 'string') {
            this.content = content;
        } else if (typeof content == 'number') {
            duration = content;
        }

        this.params.status = 'error';

        if (duration) {
            this.params.duration = duration;
        }

        // 增强的无障碍访问提示
        if (this.element.container) {
            this.element.container.setAttribute('aria-label', '操作失败');
        }

        this.show();

        return this;
    };

    /**
     * 提示条元素zIndex实时最大化
     * @return {[type]} [description]
     */
    LightTip.prototype.zIndex = function () {
        var eleContainer = this.element.container;
        // 返回eleTarget才是的样式计算对象
        var objStyleContainer = window.getComputedStyle(eleContainer);
        // 此时元素的层级
        var numZIndexTarget = objStyleContainer.zIndex;
        // 用来对比的层级，也是最小层级
        var numZIndexNew = 19;

        // 只对<body>子元素进行层级最大化计算处理
        document.body.childNodes.forEach(function (eleChild) {
            if (eleChild.nodeType != 1) {
                return;
            }

            var objStyleChild = window.getComputedStyle(eleChild);

            var numZIndexChild = objStyleChild.zIndex * 1;

            if (numZIndexChild && eleContainer != eleChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew != numZIndexTarget) {
            eleContainer.style.zIndex = numZIndexNew;
        }
    };

    return LightTip;
}));
/**
 * @ErrorTip.js
 * @author zhangxinxu
 * @version
 * Created: 15-07-01
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.ErrorTip = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Follow = this.Follow;

    if (typeof require == 'function' && !Follow) {
        Follow = require('common/ui/Follow');
    } else if (!Follow) {
        window.console.error('need Follow.js');

        return {};
    }

    /**
     * 红色的tips错误提示效果
     * @example
     * new ErrorTips(element, content, options)
     **/

    // 类名变量
    var CL = {
        add: function () {
            return ['ui-tips'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-tips';
        }
    };

    /**
     * 红色的tips错误提示效果
     * @param {Object} element 红色tips显示在哪个元素上
     * @param {String} content tips里面显示的内容
     * @param {Object} options 可选参数
     */
    var ErrorTip = function (element, content, options) {
        var defaults = {
            unique: true,
            onShow: function () {},
            onHide: function () {}
        };

        // 参数
        var objParams = Object.assign({}, defaults, options || {});


        // 显示字符内容的处理
        var strContent = content;

        // 支持Function类型
        if (typeof strContent == 'function') {
            strContent = strContent();
        }
        if (typeof strContent != 'string') {
            return this;
        }

        // 一些元素
        var eleTrigger = element;
        var eleTips, eleContent, eleArrow;
        // 全局的出错实例
        var objUniqueErrorTip = window.uniqueErrorTip;

        // 如果是唯一模式，则看看全局出错的对象
        if (objParams.unique == true && objUniqueErrorTip) {
            // window.errorTip存储的是唯一的红色提示元素
            // 改变存储的触发元素
            eleTips = objUniqueErrorTip.element.tips;
        } else if (objParams.unique == false && eleTrigger.data && eleTrigger.data.errorTip) {
            eleTips = eleTrigger.data.errorTip.element.tips;
        } else {
            // 首次
            eleTips = document.createElement('div');
            eleTips.className = CL.add('x') + ' ' + CL.add('error');
            // 提示内容元素
            eleContent = document.createElement('span');
            eleContent.className = CL.add('content');
            // 三角元素
            eleArrow = document.createElement('i');
            eleArrow.className = CL.add('arrow');
            // 元素组装并插入到页面中
            eleTips.appendChild(eleContent);
            eleTips.appendChild(eleArrow);
            document.body.appendChild(eleTips);

            // 任何键盘操作，点击，或者拉伸都会隐藏错误提示框
            document.addEventListener('keydown', function (event) {
                // ctrl/shift键不隐藏
                if (event.keyCode != 16 && event.keyCode != 17) {
                    (window.uniqueErrorTip || this).hide();
                }
            }.bind(this));

            document.addEventListener('mousedown', function (event) {
                // ctrl/shift键等不隐藏
                var eleActiveElement = document.activeElement;

                var eleActiveTrigger = eleTips.trigger;
                var eleTarget = event.target;

                // 如果点击的就是触发的元素，且处于激活态，则忽略
                if (eleActiveElement && eleActiveTrigger && eleActiveElement == eleTarget &&
                    eleActiveElement == eleActiveTrigger &&
                    // 这个与Datalist.js关联
                    !eleActiveTrigger.getAttribute('data-focus')
                ) {
                    return;
                }
                (window.uniqueErrorTip || this).hide();
            }.bind(this));

            window.addEventListener('resize', function () {
                (window.uniqueErrorTip || this).hide();
            }.bind(this));
        }

        // 如果是唯一模式，全局存储
        if (objParams.unique == true) {
            window.uniqueErrorTip = this;
        }

        // 更新提示元素对应的触发元素
        eleTips.trigger = eleTrigger;

        this.element = {
            trigger: eleTrigger,
            tips: eleTips,
            content: eleContent || eleTips.querySelector('span'),
            arrow: eleArrow || eleTips.querySelector('i')
        };
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };

        this.params = {
            unique: objParams.unique
        };

        // 暴露在外
        this.content = strContent;

        // 在DOM对象上暴露对应的实例对象
        if (!eleTrigger.data) {
            eleTrigger.data = {};
        }
        eleTrigger.data.errorTip = this;

        // 显示
        this.show();

        return this;
    };

    /**
     * 错误tips提示显示方法
     * @param  {String} content 错误显示的文字内容
     * @return {Object}         返回当前实例对象
     */
    ErrorTip.prototype.show = function () {
        var objElement = this.element;
        // 触发元素和提示元素
        var eleTips = objElement.tips;
        var eleTrigger = objElement.trigger;

        // 两个元素
        var eleContent = objElement.content;

        // 修改content内容
        eleContent.innerHTML = this.content;

        // 提示元素显示
        eleTips.style.display = '';

        // 定位
        new Follow(eleTrigger, eleTips, {
            // trigger-target
            position: '5-7',
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // aria无障碍访问增强
        eleTrigger.setAttribute('aria-label', '错误提示：' + eleContent.textContent || eleContent.innerText);
        // 两个重要标志类名
        eleTrigger.classList.add('error');
        eleTrigger.classList.add('valided');

        this.display = true;

        // 显示的回调
        if (this.callback && this.callback.show) {
            this.callback.show.call(this, eleTrigger, eleTips);
        }

        return this;
    };

    /**
     * 错误tips提示隐藏方法
     * @return {Object}         返回当前实例对象
     */
    ErrorTip.prototype.hide = function () {
        var eleTips = this.element.tips;
        var eleTrigger = this.element.trigger;

        eleTrigger.removeAttribute('aria-label');

        if (window.getComputedStyle(eleTips).display != 'none') {
            eleTips.style.display = 'none';

            eleTrigger.classList.remove('error');

            // 隐藏的回调
            if (this.callback && this.callback.hide) {
                this.callback.hide.call(this, eleTrigger, eleTips);
            }

            this.display = false;
        }

        return this;
    };

    return ErrorTip;
}));
/**
 * @Loading.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-23
 * @Log: 2017-09-19 loading类名的添加基于标签，而非类名
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Loading = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function () {

    var LOADING = 'loading';

    // 样式类名统一处理
    var CL = {
        add: function () {
            return ['ui', LOADING].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-' + LOADING;
        }
    };

    /**
     * 给HTML元素扩展一个loading属性
     * 经测试，不会和IMG和IFRAME原生loading属性冲突
     * 是否正在loading：element.loading
     * 设置元素loading：element.loading = true;
     * 取消loading效果：element.loading = false;
     */

    Object.defineProperty(HTMLElement.prototype, 'loading', {
        configurable: true,
        enumerable: true,
        writeable: true,
        get: function () {
            return !!(this.classList.contains(CL) || this.classList.contains(LOADING) || this.matches(CL));
        },
        set: function (flag) {
            var action = 'remove';
            if (flag) {
                action = 'add';
                if (this.loading) {
                    return flag;
                }
            }
            if (this.classList.contains(CL.toString().replace(LOADING, 'button'))) {
                this.classList[action](LOADING);
            } else {
                this.classList[action](CL);
                // IE9支持旋转
                if (typeof funRunRotate == 'function') {
                    funRunRotate(this);
                }
            }
            // Aria无障碍设置
            this.setAttribute('aria-busy', !!flag);
            if (flag && this.innerHTML.trim() == '') {
                this.setAttribute('aria-label', '正在加载中');
            } else {
                this.removeAttribute('aria-label');
            }
        }
    });

    /**
     * IE9浏览器动画支持
     */
    if (typeof window.getComputedStyle(document.head).transition == 'undefined') {
        var funRunRotate = function (eleLoading) {
            if (!eleLoading) {
                return;
            }
            // 方便控制旋转进行的loading图形
            var eleLoadingBefore;
            if (eleLoading.loading == true) {
                if (!eleLoading.getAttribute('spin')) {
                    eleLoadingBefore = document.createElement('i');
                    eleLoadingBefore.className = CL.add('before');
                    // 插入到前面
                    eleLoading.insertAdjacentElement('afterbegin', eleLoadingBefore);
                    // 本身设置标志量
                    eleLoading.setAttribute('spin', '');

                    // 清除动画定时
                    clearInterval(eleLoading.timerLoading);

                    // 开始旋转
                    var numStep = 16;
                    eleLoading.timerLoading = setInterval(function () {
                        var numRotate = eleLoading.rotate || 0;
                        numRotate += 360 / numStep;

                        if (numRotate > 360) {
                            numRotate = numRotate - 360;
                        }

                        eleLoading.rotate = numRotate;

                        // 设置transform旋转
                        eleLoadingBefore.style.msTransform = 'rotate(' + numRotate + 'deg)';
                    }, 1000 / numStep);
                }
            } else if (eleLoading.loading === false) {
                eleLoading.removeAttribute('spin');

                eleLoadingBefore = eleLoading.querySelector('.' + CL.add('before'));
                // 节点移除
                if (eleLoadingBefore) {
                    eleLoadingBefore.remove();
                }

                // 清除动画定时
                clearInterval(eleLoading.timerLoading);
            }
        };
        window.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll(CL).forEach(funRunRotate);
        });
        document.body.addEventListener('DOMNodeInserted', function (event) {
            if (!event.target || event.target.nodeType != 1) {
                return;
            }
            // 插入节点
            if (event.target.matches(CL)) {
                funRunRotate(event.target);
            }
        });
    }

    /**
     * 为了暴露方法一致
     * 实际开发多用不到Loading实例方法
     */
    var Loading = function (element, options) {
        var defaults = {
            // 其他参数attributes
            observer: 'childList',
            size: 2
        };

        if (typeof element == 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return this;
        }

        var eleTarget = element;

        var objParams = Object.assign({}, defaults, options || {});

        // 若干参数暴露
        this.params = objParams;
        this.element = {
            target: element
        };

        if (!eleTarget.data) {
            eleTarget.data = {};
        }
        // 元素上存储loading实例
        eleTarget.data.loading = this;

        // loading显示
        this.show();
    };

    /**
     * loading效果的显示
     * @return {[type]} [description]
     */
    Loading.prototype.show = function () {
        var objParams = this.params;
        var eleTarget = this.element.target;

        if (objParams.observer == 'attributes') {
            eleTarget.loading = true;
            eleTarget.setAttribute('size', objParams.size);
            // 更新标志量
            this.loading = true;
            this.display = true;
        } else if (objParams.observer == 'childList') {
            var strPosition = window.getComputedStyle(eleTarget).position;
            if (strPosition == 'static') {
                // 记住初始position属性值
                if (eleTarget.style && eleTarget.style.position) {
                    this.position = 'static-inline';
                } else {
                    this.position = 'static-computed';
                }
                // 设置position为相对定位
                // 方便loading图形居中显示
                eleTarget.style.position = 'relative';
            } else {
                this.position = '';
            }
            eleTarget.initHTML = eleTarget.innerHTML;
            eleTarget.innerHTML = '<' + CL + ' size="' + objParams.size + ' align="center"></' + CL + '>';
            // 更新标志量
            this.loading = true;
            this.display = true;
        }
    };

    /**
     * loading效果的取消
     * @return {[type]} [description]
     */
    Loading.prototype.hide = function () {
        var objParams = this.params;
        var eleTarget = this.element.target;

        if (objParams.observer == 'attributes') {
            eleTarget.loading = false;
            // 更新标志量
            this.loading = false;
            this.display = false;
        } else if (objParams.observer == 'childList') {
            var strPosition = this.position;
            if (strPosition == 'static-inline') {
                eleTarget.style.position = 'static';
            } else if (strPosition == 'static-computed') {
                eleTarget.style.position = '';
            }
            // 移除<ui-loading>元素
            if (typeof eleTarget.initHTML == 'string') {
                eleTarget.innerHTML = eleTarget.initHTML;
            } else if (eleTarget.querySelector(CL)) {
                eleTarget.querySelector(CL).remove();
            }
            // 更新标志量
            this.loading = false;
            this.display = false;
        }
    };

    return Loading;
}));
/**
 * @Range.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-20
 * @edit:    19-09-24 remove jQuery by 5ibinbin
 * @review:  19-09-27 by zhangxinxu
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Tips = require('./Tips');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Range = factory();
    }
}((typeof global !== 'undefined') ? global
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Tips = this.Tips;
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
        if (objParams.reverse || eleRange.classList.contains(REVERSE)) {
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

        document.querySelectorAll(strSelector).forEach(function (eleRange) {
            if (!(eleRange.data && eleRange.data.range) && window.getComputedStyle(eleRange).visibility == 'hidden') {
                new Range(eleRange);
            }
        });

        // 如果没有开启观察，不监听DOM变化
        if (window.watching === false) {
            return;
        }

        var funSyncRefresh = function (node, action) {
            if (node.nodeType != 1) {
                return;
            }

            if (node.matches(strSelector)) {
                if (action == 'remove' && node.data && node.data.range) {
                    node.data.range.element.container.remove();
                } else if (window.getComputedStyle(node).visibility == 'hidden' && action == 'add') {
                    new Range(node);
                }
            }
        };

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
/**
 * @Color.js
 * @author zhangxinxu
 * @version
 * Created: 16-06-03
 */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Drop = require('./Drop');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Color = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
    // require
    var Drop = this.Drop;
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

        // 如果是rgb(a)色值
        arr = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
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
            var value = this.value;
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
                    strValue = $.rgbToHex('#' + strValue);
                    if (strValue != strOldvalue) {
                        // 支持输入#000
                        eleField.value = strValue;
                    }
                    this.value('#' + strValue);
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

        document.querySelectorAll(strSelector).forEach(function (eleColorInput) {
            if (!(eleColorInput.data && eleColorInput.data.color) && window.getComputedStyle(eleColorInput).opacity == '0') {
                new Color(eleColorInput);
            }
        });

        // 如果没有开启观察，不监听DOM变化
        if (window.watching === false) {
            return;
        }

        var funSyncRefresh = function (node, action) {
            if (node.nodeType != 1) {
                return;
            }

            if (node.matches(strSelector)) {
                if (action == 'remove' && node.data && node.data.color) {
                    node.data.color.element.track.remove();
                    node.data.color.element.container.remove();
                } else if (action == 'add' && window.getComputedStyle(node).opacity == '0') {
                    new Color(node);
                }
            }
        };

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

    return Color;
}));
/**
 * @Dialog.js
 * @author  zhangxinxu
 * @version
 * @created 15-06-18
*  @edited  19-11-01
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Dialog = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 弹框组件
     * IE9+基于HTML5 <dialog>元素创建
     * 透明遮罩层和弹框在一个元素内
     * @example
     * var myDialog = new Dialog(options);
     * button.addEventListener('click', function() {
           myDialog.remove();
       });
     */

    // 类名前缀
    var DIALOG = 'dialog';

    var CL = {
        add: function () {
            return ['ui', DIALOG].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-' + DIALOG;
        }
    };

    // 关闭SVG
    var strCloseSvg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>';

    var isSupportDialog = false;

    /**
     * 弹框实例方法
     * @param {Object} options 纯对象，可选参数
     */
    var Dialog = function (options) {
        var defaults = {
            title: '',
            // 不同类别的内容类型
            content: '',
            // 弹框的宽度
            width: 'auto',
            // 弹框高度
            height: 'auto',
            // 不同类别的默认按钮
            buttons: [],
            // 弹框显示、隐藏、移除的回调
            onShow: function () {},
            onHide: function () {},
            onRemove: function () {}
        };
        // 最终参数
        var objParams = Object.assign({}, defaults, options || {});


        // 各个元素创建
        // 容器-含半透明遮罩背景
        var eleContainer = document.createElement(DIALOG);
        eleContainer.classList.add(CL.add('container'));
        // 使该元素也可以被focus
        eleContainer.setAttribute('tabindex', '-1');

        // 是否支持原生弹框
        isSupportDialog = ('open' in eleContainer);

        // 不支持的浏览器设置无障碍访问信息
        if (isSupportDialog == false) {
            eleContainer.setAttribute('role', DIALOG);
        }

        // 弹框主体
        var eleDialog = document.createElement('div');
        eleDialog.classList.add(CL);
        // 设置尺寸和键盘访问特性
        // 如果宽度设置的是纯数值，则认为是px单位
        if (/^\d+$/.test(objParams.width)) {
            eleDialog.style.width = objParams.width + 'px';
        } else {
            eleDialog.style.width = objParams.width;
        }
        // 高度
        if (/^\d+$/.test(objParams.height)) {
            eleDialog.style.height = objParams.height + 'px';
        } else if (objParams.height == 'stretch') {
            eleDialog.classList.add(CL.add(objParams.height));
        } else if (objParams.height != 'auto') {
            eleDialog.style.height = objParams.height;
        }

        // 标题
        var eleTitle = document.createElement('h4');
        eleTitle.classList.add(CL.add('title'));
        eleTitle.innerHTML = objParams.title;

        // 关闭按钮
        // 随机id，ESC快捷键关闭弹框用到
        var strIdClose = ('lulu_' + Math.random()).replace('0.', '');
        // 关闭按钮元素创建
        var eleClose = document.createElement('button');
        eleClose.classList.add(CL.add('close'));
        eleClose.classList.add('ESC');
        // 无障碍支持
        eleClose.setAttribute('aria-label', '关闭');
        eleClose.id = strIdClose;
        eleClose.setAttribute('data-target', strIdClose);
        eleClose.innerHTML = strCloseSvg;

        // 主体内容
        var dataContent = objParams.content || '';
        // content可以是函数
        if (typeof dataContent == 'function') {
            dataContent = dataContent();
        }

        // 基于内容的数据类型，使用不同的默认的弹框关闭方式
        if (typeof dataContent == 'string') {
            this.closeMode = 'remove';
        } else {
            this.closeMode = 'hide';
        }

        // 主体内容元素
        var eleBody = document.createElement('div');
        eleBody.classList.add(CL.add('body'));

        if (this.closeMode == 'remove') {
            eleBody.innerHTML = dataContent;
        } else {
            eleBody.appendChild(dataContent);
        }

        // 底部元素
        var eleFooter = document.createElement('div');
        eleFooter.classList.add(CL.add('footer'));

        // 组装
        eleDialog.appendChild(eleClose);
        eleDialog.appendChild(eleTitle);
        eleDialog.appendChild(eleBody);
        eleDialog.appendChild(eleFooter);

        eleContainer.appendChild(eleDialog);

        // 插入的细节
        // 1. 插在所有dialog的前面
        // 2. 如果没有，则放在页面后面
        var eleAllDialog = document.querySelectorAll(DIALOG);

        if (eleAllDialog.length) {
            eleAllDialog[0].insertAdjacentElement('beforebegin', eleContainer);
        } else {
            (objParams.container || document.body).appendChild(eleContainer);
        }

        // 暴露元素
        this.element = {
            container: eleContainer,
            dialog: eleDialog,
            close: eleClose,
            title: eleTitle,
            body: eleBody,
            footer: eleFooter
        };

        // 暴露一些参数
        this.params = {
            title: objParams.title,
            width: objParams.width,
            buttons: objParams.buttons,
            content: dataContent
        };

        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide,
            remove: objParams.onRemove
        };

        this.display = false;

        // 按钮处理
        this.button();

        // 事件
        this.events();

        if (dataContent) {
            this.show();
        }

        return this;
    };


    /**
     * 弹框按钮需要单独处理
     * @return {[type]} [description]
     */
    Dialog.prototype.button = function () {
        var objParams = this.params;
        var objElement = this.element;

        objElement.footer.innerHTML = '';

        for (var keyElement in objElement) {
            if (/^button/.test(keyElement)) {
                delete objElement[keyElement];
            }
        }

        // 按钮元素创建
        objParams.buttons.forEach(function (objButton, numIndex) {
            // objButton可能是null等
            objButton = objButton || {};

            // 按钮类型和值的处理
            var strType = objButton.type;
            var strValue = objButton.value;

            if (strType == 'remind' || (!strType && numIndex == 0)) {
                strType = 'primary';
            }

            if (!strValue) {
                strValue = ['确定', '取消'][numIndex];
            }

            var eleButton = document.createElement('button');
            if (objButton['for']) {
                eleButton = document.createElement('label');
                eleButton.setAttribute('for', objButton['for']);
            }
            // 自定义的类名
            if (objButton.className) {
                eleButton.className = objButton.className;
            }
            // 按钮样式
            eleButton.classList.add(String(CL).replace(DIALOG, 'button'));
            if (strType) {
                eleButton.setAttribute('data-type', strType);
            }
            // 按钮内容
            eleButton.innerHTML = strValue;

            // 放在底部元素中
            objElement.footer.appendChild(eleButton);

            // 对外暴露
            objElement['button' + numIndex] = eleButton;
        });

        // 按钮事件
        // 底部确定取消按钮
        objParams.buttons.forEach(function (objButton, numIndex) {
            var eleButton = objElement['button' + numIndex];

            if (!eleButton || objButton['for']) {
                return;
            }

            var objEvents = objButton.events || {
                click: function () {
                    this[this.closeMode]();
                }.bind(this)
            };

            if (typeof objEvents == 'function') {
                objEvents = {
                    click: objEvents
                };
            }

            for (var strEventType in objEvents) {
                eleButton.addEventListener(strEventType, function (event) {
                    // 把实例对象传入
                    event.dialog = this;
                    // 事件执行
                    objEvents[strEventType](event);
                }.bind(this));
            }

            // 额外的focus事件支持
            eleButton.addEventListener('focus', function () {
                if (window.isKeyEvent) {
                    this.style.outline = '';
                } else {
                    this.style.outline = 'none';
                }
            });
        }.bind(this));
    };

    /**
     * 弹框相关事件处理
     * @return {[type]} [description]
     */
    Dialog.prototype.events = function () {
        var objElement = this.element;

        // IE10+增加CSS3动画支持
        var eleContainer = objElement.container;
        eleContainer.addEventListener('animationend', function (event) {
            if (event.target.tagName.toLowerCase() == DIALOG) {
                eleContainer.classList.remove(CL.add('animation'));
            }
        });
        if (isSupportDialog == true) {
            eleContainer.addEventListener('close', function () {
                // 滚动条处理
                this.scrollbar();
                // 显示状态切换
                this.display = false;
                // 键盘焦点元素还原
                this.tabindex();
            }.bind(this));
        }

        // 关闭弹框按钮
        var eleClose = objElement.close;
        if (eleClose) {
            eleClose.addEventListener('click', function () {
                // 有其他可ESC元素存在时候，弹框不关闭
                var eleActiveElement = document.activeElement;
                var attrActiveElement = eleActiveElement.getAttribute('data-target');
                var eleTargetElement = null;

                if (attrActiveElement) {
                    eleTargetElement = document.getElementById(attrActiveElement);
                }

                // 如果是其他元素的键盘访问
                if (window.isKeyEvent && eleTargetElement && eleActiveElement != eleClose && document.querySelector('a[data-target="' + attrActiveElement + '"],input[data-target="' + attrActiveElement + '"],button[data-target="' + attrActiveElement + '"]') && eleTargetElement.clientWidth > 0) {
                    return;
                }

                // 关闭弹框
                this[this.closeMode]();
            }.bind(this));
        }

        return this;
    };

    /**
     * 打开类型弹框的底层方法
     * @param  {String} content    弹框字符内容
     * @param  {Object} options 可选参数，这里只支持标题和按钮的自定义
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.open = function (content, options) {
        var objElement = this.element;

        // 默认参数
        // 只支持标题和按钮的自定义
        var defaults = {
            title: '',
            buttons: []
        };

        var dataContent = content || '';
        // content可以是函数
        if (typeof dataContent == 'function') {
            dataContent = dataContent();
        }

        // 基于内容的数据类型，使用不同的默认的弹框关闭方式
        if (typeof dataContent == 'string') {
            this.closeMode = 'remove';
        } else {
            this.closeMode = 'hide';
        }

        // 最终参数
        this.params = Object.assign({}, defaults, options || {}, {
            content: dataContent
        });

        // 类名还原为初始
        objElement.container.className = CL.add('container');

        // 替换当前弹框的内容，包括按钮等
        if (this.closeMode == 'remove') {
            objElement.body.innerHTML = dataContent;
        } else {
            objElement.body.appendChild(dataContent);
        }
        objElement.title.innerHTML = this.params.title;
        // 按钮
        this.button();
        // 显示
        this.show();

        return this;
    };

    /**
     * loading弹框，通常用在ajax请求之前使用
     * loading结束后可以直接调用弹框实例的open()方法显示
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.loading = function () {
        var objElement = this.element;

        objElement.container.className = [CL.add('container'), CL.add('loading')].join(' ');
        objElement.body.innerHTML = '<ui-loading rows="10" size="3"></ui-loading>';

        this.show();

        return this;
    };

    /**
     * alert类型的弹框，默认仅一个“确定”按钮
     * @param  {String} content    提示文字或者提示HTML片段
     * @param  {Object} options 提示可选参数
     * @return {Object}         返回当前实例对象
     */
    Dialog.prototype.alert = function (content, options) {
        var objElement = this.element;

        if (!content) {
            return;
        }

        var strContent = content;

        // alert框的默认参数
        var defaults = {
            title: '',
            // 类型, 'remind', 'success', 'warning', danger', 或者任意 'custom'
            type: 'remind',
            buttons: [{}]
        };
        // 最终参数
        var objParams = Object.assign({}, defaults, options || {});

        if (objParams.type == 'error' || objParams.type == 'fail') {
            objParams.type = 'danger';
        }
        if (objParams.type == 'primary') {
            objParams.type = 'remind';
        }

        if (objParams.buttons.length && !objParams.buttons[0].type) {
            objParams.buttons[0].type = objParams.type;
            // 如果是自定义类型，则使用'primary'作为按钮类型
            if (/^remind|success|warning|danger$/.test(objParams.type) == false) {
                objParams.buttons[0].type = defaults.type;
            }
        }

        // 替换当前弹框的内容，包括按钮等
        objElement.container.className = [CL.add('container'), CL.add('container', 'alert')].join(' ');

        // 尺寸
        objElement.dialog.style.width = 'auto';

        objElement.title.innerHTML = objParams.title;
        // 如果是纯文本
        if (/<[\w\W]+>/.test(strContent) == false) {
            strContent = '<p>' + strContent + '</p>';
        }

        objElement.body.innerHTML = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('alert') + '">' + strContent + '</div>';

        this.params = {
            width: 'auto',
            title: objParams.title,
            buttons: objParams.buttons,
            content: strContent
        };

        this.button();

        this.show();

        if (objElement.button0) {
            objElement.button0.focus();
        }

        return this;
    };

    /**
     * confirm类型的弹框，默认有一个“确定”和一个“取消”按钮
     * @param  {String} content    提示文字或者提示HTML片段
     * @param  {Object} options 提示可选参数
     * @return {Object}         返回当前实例对象
     */
    Dialog.prototype.confirm = function (content, options) {
        var objElement = this.element;

        if (!content) {
            return;
        }

        var strContent = content;

        // confirm框的默认参数
        var defaults = {
            title: '',
            type: 'danger',
            buttons: [{}, {}]
        };
        // 最终参数
        var objParams = Object.assign({}, defaults, options || {});

        if (objParams.type == 'error' || objParams.type == 'fail') {
            objParams.type = 'danger';
        }
        if (objParams.type == 'primary') {
            objParams.type = 'remind';
        }

        // danger类型的按钮可缺省
        if (objParams.buttons.length && !objParams.buttons[0].type) {
            objParams.buttons[0].type = objParams.type;
            // 如果是自定义类型，则使用'primary'作为按钮类型
            if (/^remind|success|warning|danger$/.test(objParams.type) == false) {
                objParams.buttons[0].type = defaults.type;
            }
        }

        // 替换当前弹框的内容，包括按钮等
        objElement.container.className = [CL.add('container'), CL.add('container', 'confirm')].join(' ');

        // 尺寸
        objElement.dialog.style.width = 'auto';

        objElement.title.innerHTML = objParams.title;
        // 如果是纯文本
        if (/<[\w\W]+>/.test(strContent) == false) {
            strContent = '<p>' + strContent + '</p>';
        }

        objElement.body.innerHTML = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('confirm') + '">' + strContent + '</div>';

        this.params = {
            width: 'auto',
            title: objParams.title,
            buttons: objParams.buttons,
            content: strContent
        };

        this.button();

        this.show();

        if (objElement.button0) {
            objElement.button0.focus();
        }


        return this;
    };

    /**
     * 弹框出现与不出现，背景锁定同时页面不晃动的处理
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.scrollbar = function () {
        var eleAllDialog = document.querySelectorAll(DIALOG);

        // 是否有显示的弹框
        var isDisplayed = [].slice.call(eleAllDialog).some(function (eleDialog) {
            return window.getComputedStyle(eleDialog).display != 'none';
        });

        // 因为去掉了滚动条，所以宽度需要偏移，保证页面内容没有晃动
        if (isDisplayed) {
            var widthScrollbar = 17;
            if (this.display != true) {
                widthScrollbar = window.innerWidth - document.documentElement.clientWidth;
            }
            // 所有PC浏览器都滚动锁定
            document.documentElement.style.overflow = 'hidden';

            if (this.display != true) {
                document.body.style.borderRight = widthScrollbar + 'px solid transparent';
            }
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.borderRight = '';
        }

        return this;
    };

    /**
     * 键盘可访问的细节处理
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.tabindex = function () {
        var eleDialog = this.element.dialog;
        var eleLastActiveElement = this.lastActiveElement;

        if (this.display == true) {
            var eleActiveElement = document.activeElement;
            if (eleDialog != eleActiveElement) {
                this.lastActiveElement = eleActiveElement;
            }

            // 键盘索引起始位置变为在弹框元素上
            if (eleDialog) {
                eleDialog.focus();
            }
        } else if (eleLastActiveElement && eleLastActiveElement.tagName.toLowerCase() != 'body') {
            // 键盘焦点元素还原
            eleLastActiveElement.focus();
            eleLastActiveElement.blur();
            this.lastActiveElement = null;
        }

        return this;
    };

    /**
     * 弹框元素zIndex实时最大化
     * @return {[type]} [description]
     */
    Dialog.prototype.zIndex = function () {
        var eleContainer = this.element.container;
        // 返回eleTarget才是的样式计算对象
        var objStyleTarget = window.getComputedStyle(eleContainer);
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

            if (numZIndexChild && eleContainer != eleChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew != numZIndexTarget) {
            eleContainer.style.zIndex = numZIndexNew;
        }
    };

    /**
     * 弹框显示方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.show = function () {
        var eleContainer = this.element.container;
        // 面板显示
        if (isSupportDialog) {
            if (!eleContainer.open) {
                eleContainer.show();
            }
        } else {
            eleContainer.setAttribute('open', 'open');
            // 层级最大
            this.zIndex();
        }

        if (this.display != true) {
            eleContainer.classList.add(CL.add('animation'));
        }
        this.scrollbar();
        this.display = true;

        this.tabindex();

        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this, eleContainer);
        }

        return this;
    };

    /**
     * 弹框隐藏方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.hide = function () {
        var eleContainer = this.element.container;

        if (isSupportDialog) {
            eleContainer.close();
        } else {
            eleContainer.removeAttribute('open');
        }

        // 滚动条处理
        this.scrollbar();
        // 显示状态切换
        this.display = false;
        // 键盘焦点元素还原
        this.tabindex();

        if (typeof this.callback.hide == 'function') {
            this.callback.hide.call(this, eleContainer);
        }

        return this;
    };

    /**
     * 弹框移除方法
     * @return {Object} 返回当前实例对象
     */
    Dialog.prototype.remove = function () {
        var eleContainer = this.element.container;

        eleContainer.remove();
        // 滚动条处理
        this.scrollbar();
        // 显示状态切换
        this.display = false;
        // 键盘焦点元素还原
        this.tabindex();

        if (typeof this.callback.remove == 'function') {
            this.callback.remove.call(this, eleContainer);
        }

        return this;
    };

    return Dialog;
}));
/**
 * @Datalist.js
 * @author zhangxinxu
 * @version
 * Created: 16-03-28
 * @description 多功能下拉数据列表
**/
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Datalist = factory();
    }
}((typeof global !== 'undefined') ? global
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Follow = this.Follow;

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
        eleInput.setAttribute('autocomplete', 'off');

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

    return Datalist;
}));
/**
 * @DateTime.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-03
 * @editd:   19-11-12
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.DateTime = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Follow = this.Follow;
    if (typeof require == 'function' && !Follow) {
        Follow = require('common/ui/Follow');
    } else if (!Follow) {
        window.console.error('need Follow.js');
        return {};
    }

    // 样式类名统一处理
    var CL = {
        toString: function () {
            return 'ui-datetime';
        }
    };
    ['date', 'range', 'day', 'year', 'month', 'hour', 'minute'].forEach(function (key) {
        CL[key] = function () {
            return ['ui', key].concat([].slice.call(arguments)).join('-');
        };
    });


    var SELECTED = 'selected';
    var ACTIVE = 'active';

    var regDate = /-|\//g;

    // 拓展方法之字符串变时间对象
    String.prototype.toDate = function () {
        var year, month, day;
        var arrDate = this.split(regDate);
        year = arrDate[0] * 1;
        month = arrDate[1] || 1;
        day = arrDate[2] || 1;
        // 年份需要是数值字符串
        if (!year) {
            return new Date();
        }

        return new Date(year, month - 1, day);
    };

    // 日期对象变成年月日数组
    Date.prototype.toArray = function () {
        var year = this.getFullYear();
        var month = this.getMonth() + 1;
        var date = this.getDate();
        if (month < 10) {
            month = '0' + month;
        }
        if (date < 10) {
            date = '0' + date;
        }

        return [year, month, date];
    };

    /**
     * 日期，时间选择器
     * 基于HTML5时间类输入框
     * @example new DateTime(trigger, options);
     * @trigger 触发的元素，可以是文本框也可以是文本框容器(父级)
     * @options 可选参数
     */
    var DateTime = function (element, options) {
        var eleTrigger = element;
        if (typeof element == 'string') {
            eleTrigger = document.querySelector(element);
        }

        if (!eleTrigger) {
            return this;
        }

        // 默认参数
        var defaults = {
            // 文本框初始值，优先从文本框获取。
            value: '',
            // 浮层面板类型，可以是'date'(2015-01-01), 'year'(2015), 'month'(2015-01), 'time'(12:00), 'date-range'(2015-01-01 至 2015-06-01)
            type: 'auto',
            // 时间范围最小值，优先从文本框获取。'auto'表示无最小限制。
            min: 'auto',
            // 时间范围最大值，优先从文本框获取。'auto'表示无最大限制。
            max: 'auto',
            onShow: function () {},
            onHide: function () {}
        };

        // 参数合并
        var objParams = Object.assign({}, defaults, options || {});

        // 容器元素
        var eleContainer = null;

        // 找到文本输入框
        var eleInput = null;
        if (eleTrigger.getAttribute('type')) {
            eleInput = eleTrigger;
            eleTrigger = eleInput.parentElement;
        } else {
            eleInput = eleTrigger.querySelector('input');
        }
        // 如果没有时间类输入框，则认为不是点击展开模式
        // 而是直接显示在容器中
        if (!eleInput) {
            eleInput = document.createElement('input');

            if (objParams.min != 'auto') {
                eleInput.setAttribute('min', objParams.min);
            }
            if (objParams.max != 'auto') {
                eleInput.setAttribute('max', objParams.max);
            }
            if (objParams.type != 'auto') {
                eleInput.setAttribute('type', objParams.type);
            }

            eleContainer = eleTrigger;
        }

        // 避免重复初始化
        if (eleInput.data && eleInput.data.dateTime) {
            return eleInput.data.dateTime;
        }

        // readonly
        eleInput.setAttribute('readonly', 'readonly');

        // 时间选择的类型
        var strType = objParams.type;
        if (strType == 'auto') {
            strType = eleInput.getAttribute('type') || 'date';
        }

        // 插入下拉箭头
        var strId = eleInput.id;
        if (!strId) {
            // 如果没有id, 创建随机id
            // 下拉箭头需要
            strId = ('lulu_' + Math.random()).replace('0.', '');
            eleInput.id = strId;
        }
        // 下拉元素
        var eleLabel = document.createElement('label');
        eleLabel.classList.add(CL.date('arrow'));
        // eleLabel.setAttribute('for', strId);

        // 插入到文本框的后面
        eleInput.insertAdjacentElement('afterend', eleLabel);
        eleInput.setAttribute('lang', 'zh-Hans-CN');

        // 初始值
        var strInitValue = eleInput.value;
        if (strInitValue == '' && objParams.value) {
            strInitValue = eleInput.value = objParams.value;
        }

        // 初始值转换成时间值
        switch (strType) {
            case 'date': case 'year': case 'month': {
                // 日期
                var objInitDate = strInitValue.toDate();
                var arrDate = objInitDate.toArray();

                // 一开始的赋值
                if (strInitValue == '') {
                    // 赋值今日
                    if (strType == 'date') {
                        eleInput.value = arrDate.join('-');
                    } else if (strType == 'year') {
                        eleInput.value = arrDate[0];
                    } else if (strType == 'month') {
                        eleInput.value = arrDate.slice(0, 2).join('-');
                    }
                }

                // eg. [2015,07,20]
                this[SELECTED] = arrDate;

                break;
            }
            case 'time': case 'hour': case 'minute': {
                var arrTime = strInitValue.split(':');
                // 时间
                var strHour = arrTime[0];
                var strMinute = arrTime[1];
                // 这里的处理情况如下
                // 1. 空值
                // 2. 小时数不是数值
                // 3. 小时数不在0~24之间
                // 以上均认为时间是00:00
                if (strInitValue == '' || !(strHour < 24 && strHour > 0)) {
                    strHour = '00';
                    strMinute = '00';
                } else {
                    // 分钟无论如何都要是正常值
                    if (!(strMinute > 0 && strMinute < 60) || strType == 'hour') {
                        strMinute = '00';
                    } else if (strMinute.length == 1) {
                        strMinute = '0' + strMinute;
                    }
                    // 补0是必要的
                    if (strHour.length == 1) {
                        strHour = '0' + strHour;
                    }
                }
                eleInput.value = [strHour, strMinute].join(':');

                this[SELECTED] = [strHour, strMinute];

                break;
            }
            case 'date-range': case 'month-range': {
                // 日期范围
                var objBeginDate = new Date();
                var objEndDate = new Date();
                // 前后时间字符串
                var arrRange = strInitValue.split(' ');
                // 有如下一些情况：
                // 1. 空，则选择范围就是今日
                // 2. 只有一个时间，则选择范围只这个时间到今天这个范围
                // 3. 其他就是正常的
                if (strInitValue != '' && arrRange.length == 1) {
                    var someDate = arrRange[0].toDate();
                    if (someDate.getTime() > objBeginDate.getTime()) {
                        objEndDate = someDate;
                    } else {
                        objBeginDate = someDate;
                    }
                } else {
                    objBeginDate = arrRange[0].toDate();
                    objEndDate = arrRange[arrRange.length - 1].toDate();
                }
                // 赋值
                var arrBegin = objBeginDate.toArray();
                var arrEnd = objEndDate.toArray();

                if (strType == 'date-range') {
                    eleInput.value = arrBegin.join('-') + ' 至 ' + arrEnd.join('-');
                } else {
                    eleInput.value = arrBegin.slice(0, 2).join('-') + ' 至 ' + arrEnd.slice(0, 2).join('-');
                }

                // 存储
                this[SELECTED] = [arrBegin, arrEnd];

                break;
            }
        }

        // 容器元素的创建
        if (!eleContainer) {
            eleContainer = document.createElement('div');
            eleContainer.classList.add(CL.date('container'));

            // keyboard键盘无障碍访问需要
            var strRandId = ('lulu_' + Math.random()).replace('0.', '');
            eleContainer.setAttribute('id', strRandId);
            eleContainer.classList.add('ESC');
            eleInput.setAttribute('data-target', strRandId);
            // 记录input的id
            eleContainer.setAttribute('data-id', strId);
        }


        // 暴露的一些数据
        this.element = {
            container: eleContainer,
            trigger: eleTrigger,
            input: eleInput
        };

        this.params = {
            type: strType,
            // 最大小值的处理在各个种类的面板中执行
            // 以便支持动态时间修改
            // 例如，选择A时间，然后设置B时间的min值为A时间
            // 这里先占个位
            max: objParams.max,
            min: objParams.min
        };

        // 回调方法
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };


        // IE9+ 前后分页图标使用内联SVG, 以便支持retina屏幕
        this.svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"/></svg>';

        this.events();

        if (!eleInput.data) {
            eleInput.data = {};
        }
        eleInput.data.dateTime = this;

        // 如果是静态模式，则实例对象暴露在容器元素上
        if (eleContainer == eleTrigger) {
            eleContainer.data = {
                dateTime: this
            };

            // 同时显示
            this.show();
        }

        return this;
    };


    /**
     * 事件
     * @return {[type]} [description]
     */
    DateTime.prototype.events = function () {
        var objElement = this.element;
        // 具体元素们
        var eleContainer = objElement.container;
        var eleTrigger = objElement.trigger;
        var eleInput = objElement.input;

        // 点击容器的事件处理
        eleContainer.addEventListener('click', function (event) {
            // IE可能是文件节点
            if (event.target.nodeType != 1 || !event.target.closest) {
                return;
            }

            var eleClicked = event.target.closest('a, button');
            if (!eleClicked) {
                return;
            }
            // 各个分支中可能会用到的变量
            var numYear = 0;
            var numMonth = 0;
            // var numDate = 0;
            var numHour = 0;
            var numDay = 0;
            // 日期范围
            var arrRange = [];
            // 根据选中状态决定新的状态
            var dataRange;
            // 按钮类型
            var strTypeButton = '';

            // 各种事件
            switch (eleContainer.getAttribute('data-type')) {
                case 'date': {
                    // 日期选择主体
                    // 1. 前后月份选择
                    if (/prev|next/.test(eleClicked.className)) {
                        numMonth = eleClicked.getAttribute('data-month');

                        // 设置选择月份
                        // 这样可以获得目标月份对应的日期数据
                        // 就是下面this.getMonthDay做的事情
                        this[SELECTED][1] = numMonth * 1;

                        // 日期和月份要匹配，例如，不能出现4月31日
                        // arrMonthDay是一个数组，当前年份12个月每月最大的天数
                        var arrMonthDay = this.getMonthDay(this[SELECTED]);

                        // 切分月份
                        // 日期正常是不会变化的
                        // 但是类似31号这样的日子不是每个月都有的
                        // 因此，需要边界判断
                        // 下面这段逻辑就是做这个事情的

                        // 1. 当前月份最大多少天
                        var numDayMax = (function () {
                            if (numMonth - 1 < 0) {
                                return arrMonthDay[11];
                            } else if (numMonth > arrMonthDay.length) {
                                return arrMonthDay[0];
                            }

                            return arrMonthDay[numMonth - 1];
                        })();

                        // 2. 之前选择的天数
                        numDay = this[SELECTED][2];
                        // 之前记住的日期
                        var numDayOverflow = eleContainer.dataDayOverflow;
                        // 例如，我们超出日期是31日，如果月份可以满足31日，使用31日
                        if (numDayOverflow) {
                            this[SELECTED][2] = Math.min(numDayOverflow, numDayMax);
                        } else if (this[SELECTED][2] > numDayMax) {
                            this[SELECTED][2] = numDayMax;

                            // 这里是对体验的升级，
                            // 虽然下月份变成了30号，但是再回来时候，原来的31号变成了30号
                            // 不完美，我们需要处理下
                            // 通过一个变量记住，点击item项的时候，移除
                            // 且只在第一次的时候记住
                            // 因为28,29,30,31都可能出现，每次记忆会混乱
                            eleContainer.dataDayOverflow = numDay;
                        }

                        // 更新选择的月日数据
                        this[SELECTED] = this[SELECTED].join('-').toDate().toArray();

                        // 刷新
                        this.date();

                        // 如果在时间范围内
                        if (eleContainer.querySelector('.' + SELECTED + '[href]')) {
                            this.value();
                        }
                    } else if (/item/.test(eleClicked.className)) {
                        // 选择某日期啦
                        numDay = eleClicked.innerHTML;

                        // 含有非数字，认为是今天
                        if (/\D/.test(numDay)) {
                            // 今天
                            this[SELECTED] = new Date().toArray();
                        } else {
                            if (numDay < 10) {
                                numDay = '0' + numDay;
                            }
                            // 修改全局
                            this[SELECTED][2] = numDay;
                        }

                        // 赋值
                        this.value();
                        // 隐藏
                        this.hide();

                        delete eleContainer.dataDayOverflow;
                    } else if (eleClicked.getAttribute('data-type') == 'month') {
                        // 切换到年份选择
                        this.month();
                    }
                    break;
                }
                case 'date-range': {
                    // 区域选择
                    // 1. 前后月份选择
                    if (/prev|next/.test(eleClicked.className)) {
                        numMonth = eleClicked.getAttribute('data-month') * 1;

                        arrRange = eleContainer.dataDate || this[SELECTED][0];

                        // 跟其他面板不同，这里只刷新，点击确定再赋值
                        eleContainer.dataDate = new Date(arrRange[0], numMonth - 1, 1).toArray();
                        // 之前arrRange[2]存在跨多月风险，尤其31号的日子
                        // 刷新
                        this['date-range']();
                    } else if (/item/.test(eleClicked.className)) {
                        // 选择某日期
                        // 获得选中的年月日
                        numYear = eleClicked.getAttribute('data-year');
                        numMonth = eleClicked.getAttribute('data-month');
                        numDay = eleClicked.innerHTML;

                        // 位数不足补全
                        if (numMonth < 10) {
                            numMonth = '0' + numMonth;
                        }
                        if (numDay < 10) {
                            numDay = '0' + numDay;
                        }
                        // 根据选中状态决定新的状态
                        dataRange = this[SELECTED];
                        if (dataRange[0].join() == dataRange[1].join()) {
                            // 如果之前前后日期一样，说明只选中了一个日期
                            // 根据前后顺序改变其中一个日期
                            if (numYear + numMonth + numDay > dataRange[0].join('')) {
                                // 新时间靠后
                                dataRange[1] = [numYear, numMonth, numDay];
                            } else {
                                dataRange[0] = [numYear, numMonth, numDay];
                            }
                        } else {
                            // 如果前后时间不一样，说明现在有范围
                            // 则取消范围，变成单选
                            dataRange = [[numYear, numMonth, numDay], [numYear, numMonth, numDay]];
                        }
                        this[SELECTED] = dataRange;

                        this['date-range']();
                    } else if (/button/.test(eleClicked.className)) {
                        strTypeButton = eleClicked.getAttribute('data-type');
                        if (strTypeButton == 'primary') {
                            // 点击确定按钮
                            // 赋值
                            this.value();
                            // 修改存储值
                            this.dataRangeSelected = this[SELECTED];
                            // 关闭浮层
                            this.hide();
                        } else if (strTypeButton == 'normal') {
                            // 重置选中值
                            if (this.dataRangeSelected) {
                                this[SELECTED] = this.dataRangeSelected;
                            }
                            // 关闭浮层
                            this.hide();
                        }
                    }
                    break;
                }
                case 'month-range': {
                    // 区域选择
                    // 1. 前后年份选择
                    if (/prev|next/.test(eleClicked.className)) {
                        numYear = eleClicked.getAttribute('data-year') * 1;

                        arrRange = eleContainer.dataDate || this[SELECTED][0];

                        // 跟其他面板不同，这里只刷新，点击确定再赋值
                        eleContainer.dataDate = new Date(numYear, arrRange[1], 1).toArray();
                        // 刷新
                        this['month-range']();
                    } else if (/item/.test(eleClicked.className)) {
                        // 选择某日期
                        // 获得选中的年月日
                        numYear = eleClicked.getAttribute('data-year');
                        numMonth = eleClicked.getAttribute('data-value');
                        numDay = '01';
                        // 根据选中状态决定新的状态
                        dataRange = this[SELECTED];
                        if (dataRange[0].join() == dataRange[1].join()) {
                            // 如果之前前后日期一样，说明只选中了一个日期
                            // 根据前后顺序改变其中一个日期
                            if (numYear + numMonth + numDay > dataRange[0].join('')) {
                                // 新时间靠后
                                dataRange[1] = [numYear, numMonth, numDay];
                            } else {
                                dataRange[0] = [numYear, numMonth, numDay];
                            }
                        } else {
                            // 如果前后时间不一样，说明现在有范围
                            // 则取消范围，变成单选
                            dataRange = [[numYear, numMonth, numDay], [numYear, numMonth, numDay]];
                        }
                        this[SELECTED] = dataRange;
                        this['month-range']();
                    } else if (/button/.test(eleClicked.className)) {
                        strTypeButton = eleClicked.getAttribute('data-type');
                        if (strTypeButton == 'primary') {
                            // 点击确定按钮
                            // 赋值
                            this.value();
                            // 修改存储值
                            this.dataRangeSelected = this[SELECTED];
                            // 关闭浮层
                            this.hide();
                        } else if (strTypeButton == 'normal') {
                            // 重置选中值
                            if (this.dataRangeSelected) {
                                this[SELECTED] = this.dataRangeSelected;
                            }
                            // 关闭浮层
                            this.hide();
                        }
                    }

                    break;
                }
                case 'month': {
                    // 选择月份，可能从年份，也可能从日期过来
                    // 1. 前后年份
                    if (/prev|next/.test(eleClicked.className)) {
                        numYear = eleClicked.getAttribute('data-year');
                        // 修改当前选中的年份数
                        this[SELECTED][0] = numYear * 1;
                        // 刷新
                        this.month();
                        // 文本框赋值
                        // 如果在区域内状态
                        if (eleContainer.querySelector('.' + SELECTED + '[href]')) {
                            this.value();
                        }
                    } else if (/item/.test(eleClicked.className)) {
                        // value实际上是月份两位数值
                        var value = eleClicked.getAttribute('data-value');
                        if (value) {
                            this[SELECTED][1] = value;
                        } else {
                            // 今月，只改变年月为今年和今月
                            var arrToday = new Date().toArray();
                            this[SELECTED][0] = arrToday[0];
                            this[SELECTED][1] = arrToday[1];
                        }

                        // 赋值
                        this.value();

                        // 根据是否是月份输入框，决定是面板切换，还是关闭
                        if (this.params.type == 'month') {
                            // 隐藏
                            this.hide();
                        } else {
                            this.date();
                        }
                    } else if (eleClicked.getAttribute('data-type') == 'year') {
                        // 切换到年份选择
                        this.year();
                    }
                    break;
                }
                case 'year': {
                    // 选择年份，可能从月份过来，也可能直接打开
                    // 1. 前后12年翻页
                    if (/prev|next/.test(eleClicked.className)) {
                        numYear = eleClicked.getAttribute('data-year');
                        // 修改当前选中的年份数
                        this[SELECTED][0] = numYear * 1;
                        // 刷新
                        this.year();
                        // 文本框赋值
                        // 如果在区域内状态
                        if (eleContainer.querySelector('.' + SELECTED + '[href]')) {
                            this.value();
                        }
                    }  else if (/item/.test(eleClicked.className)) {
                        if (eleClicked.innerHTML == '今年') {
                            this[SELECTED][0] = new Date().getFullYear();
                        } else {
                            this[SELECTED][0] = eleClicked.innerHTML * 1;
                        }

                        // 赋值
                        this.value();
                        // 如果是年份选择输入框
                        if (this.params.type == 'year') {
                            // 隐藏
                            this.hide();
                        } else {
                            // 回到月份面板
                            this.month();
                        }
                    }

                    break;
                }
                case 'minute': {
                    // 选择分钟，可以是minute类型，或者time类型, 但不包括hour类型
                    // 1. 前后翻页
                    if (/prev|next/.test(eleClicked.className)) {
                        numHour = eleClicked.getAttribute('data-hour');
                        if (numHour.length == 1) {
                            numHour = '0' + numHour;
                        }
                        // 修改当前选中的小时数
                        this[SELECTED][0] = numHour;

                        // 刷新
                        this.minute();
                        // 文本框赋值
                        // 如果在区域内状态
                        if (eleContainer.querySelector('.' + SELECTED + '[href]'))    {
                            this.value();
                        }
                    } else if (/item/.test(eleClicked.className)) {
                        // 确定选择时间
                        this[SELECTED] = eleClicked.innerHTML.split(':');
                        this.value();
                        this.hide();
                    } else if (eleClicked.getAttribute('data-type') == 'hour') {
                        // 切换到小时选择
                        this.hour();
                    }

                    break;
                }
                case 'hour': {
                    if (/item/.test(eleClicked.className)) {
                        // 修改选中的小时
                        this[SELECTED][0] = eleClicked.innerHTML.split(':')[0];
                        // 赋值
                        this.value();

                        // 如果是从分钟模式切换过来，则切换回去，否则，直接隐藏
                        if (this.params.type == 'hour') {
                            this.hide();
                        } else {
                            this.minute();
                        }
                    }
                    break;
                }
            }
        }.bind(this));

        // 显隐控制
        eleTrigger.addEventListener('click', function (event) {
            event.preventDefault();

            // 显隐控制
            if (!this.display) {
                this.show();
            } else {
                this.hide();
            }
        }.bind(this));

        // 输入框元素行为
        eleInput.addEventListener('keydown', function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                this.click();
            }
        });

        // 时间范围选择点击页面空白区域不会隐藏
        document.addEventListener('mouseup', function (event) {
            // 点击页面空白区域，隐藏
            var eleTarget = event.target;

            if (eleTarget && eleTrigger.contains(eleTarget) == false && eleContainer.contains(eleTarget) == false) {
                this.hide();
            }
        }.bind(this));
    };

    /**
     * 输入框的值根据日期类型进行格式化
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.format = function () {
        // 根据当前value值修改实例对象缓存的选中值
        // 特殊情况一般不处理
        var strType = this.params.type;
        var eleInput = this.element.input;

        // 此时输入框初始值
        var strInitValue = eleInput && eleInput.value.trim();
        if (!strInitValue) {
            return this;
        }

        switch (strType) {
            case 'date': case 'year': case 'month': {
                // 日期
                var objInitDate = strInitValue.toDate();
                var arrDate = objInitDate.toArray();
                // eg. [2015,07,20]
                this[SELECTED] = arrDate;

                break;
            }
            case 'time': case 'hour': case 'minute': {
                var arrTime = strInitValue.split(':');
                // 时间
                var numHour = arrTime[0];
                var numMinute = arrTime[1];
                // 补0
                if (arrTime.length == 2) {
                    // 分钟无论如何都要是正常值
                    if (!(numMinute > 0 && numMinute < 60) || strType == 'hour') {
                        numMinute = '00';
                    } else if (numMinute.length == 1) {
                        numMinute = '0' + numMinute;
                    }
                    // 补0是必要的
                    if (numHour.length == 1) {
                        numHour = '0' + numHour;
                    }

                    eleInput.value = [numHour, numMinute].join(':');

                    this[SELECTED] = [numHour, numMinute];
                }

                break;
            }
            case 'date-range': case 'month-range': {
                // 日期范围
                var objBeginDate = new Date();
                var objEndDate = new Date();
                // 前后时间字符串
                var arrRange = strInitValue.split(' ');
                if (arrRange.length == 3) {
                    objBeginDate = arrRange[0].toDate();
                    objEndDate = arrRange[arrRange.length - 1].toDate();
                    // 存储
                    this[SELECTED] = [objBeginDate.toArray(), objEndDate.toArray()];
                }
                break;
            }
        }

        return this;
    };

    /**
     * 赋值
     * @return {Object} 返回当前输入框的值
     */
    DateTime.prototype.value = function () {
        var eleInput = this.element.input;
        var arrSelected = this[SELECTED];
        var strValue = eleInput.value;

        switch (this.params.type) {
            case 'date': {
                eleInput.value = arrSelected.join('-');
                break;
            }
            case 'month': {
                eleInput.value = arrSelected.slice(0, 2).join('-');
                break;
            }
            case 'year': {
                eleInput.value = arrSelected[0];
                break;
            }
            case 'date-range': {
                eleInput.value = arrSelected[0].join('-') + ' 至 ' + arrSelected[1].join('-');
                break;
            }
            case 'month-range': {
                eleInput.value = arrSelected[0].slice(0, 2).join('-') + ' 至 ' + arrSelected[1].slice(0, 2).join('-');
                break;
            }
            case 'time':  case 'minute': {
                eleInput.value = arrSelected.join(':');
                break;
            }
            case 'hour': {
                eleInput.value = arrSelected[0] + ':00';
                break;
            }
        }

        if (eleInput.value != strValue) {
            eleInput.dispatchEvent(new CustomEvent('change', {
                'bubbles': true
            }));
        }

        return eleInput.value;
    };

    /**
     * 返回日历HTML字符串等数据的私有方法
    // 因date和range浮层主结构类似，因此这里公用下
     * @param  {Array} arrDate 格式化为数组的日期
     * @return {Object}     返回包含需要的数据的对象，生成的HTML字符内容以及最大最小月份等
     */
    Object.defineProperty(DateTime.prototype, 'getCalendarData', {
        value: function (arrDate) {
            var strHtml = '';
            // 根据当前日期数据返回
            // eg. [2015,'02', 23]

            // 文本框元素比较常用，使用局部变量，一是节约文件大小，二是性能更好！
            var eleInput = this.element.input;

            // 类型
            var strType = this.params.type;

            // 最大日期和最小日期
            var numMin = eleInput.getAttribute('min') || this.params.min;
            var numMax = eleInput.getAttribute('max') || this.params.max;
            // 这里使用日期对象(时间戳)做比对

            var arrMapMinMax = [numMin, numMax].map(function (minMax, index) {
                if (typeof minMax == 'string' && /^\d{8}$/.test(minMax.replace(regDate, '')) == true) {
                    // 这里对字符串进行比较简单的合法性判别
                    // 自己人使用不会乱来的
                    minMax = minMax.toDate();
                } else if (typeof minMax != 'object' || !minMax.getTime) {
                    minMax = index ? new Date(9999, 0, 1) : new Date(0, 0, 1);
                }

                return minMax;
            });

            numMin = arrMapMinMax[0];
            numMax = arrMapMinMax[1];

            var arrChinese = ['日', '一', '二', '三', '四', '五', '六'];
            var arrMonthDay = this.getMonthDay(arrDate);

            // 目前日期对象
            var currentDate = arrDate.join('-').toDate();

            // 3 星期几七大罪
            strHtml = strHtml + '<div class="' + CL.day('x') + '">' + (function () {
                var strHtmlDay = '';
                arrChinese.forEach(function (strChineseDay, indexDay) {
                    strHtmlDay = strHtmlDay + '<span class="' + CL.day('item') + ' col' + indexDay + '">' + strChineseDay + '</span>';
                });

                return strHtmlDay;
            })() + '</div>';

            // 4. 日期详细
            //  4.1 首先算出今月1号是星期几
            var objNewDate = arrDate.join('-').toDate();
            var numDayFirst = 0;
            // 设置为1号
            objNewDate.setDate(1);

            if (objNewDate.getDate() == 2) {
                objNewDate.setDate(0);
            }
            // 每月的第一天是星期几
            numDayFirst = objNewDate.getDay();
            // 上个月是几月份
            var numLastMonth = objNewDate.getMonth() - 1;
            if (numLastMonth < 0) {
                numLastMonth = 11;
            }

            var strHtmlData = 'data-year="' + arrDate[0] + '" data-month="' + (objNewDate.getMonth() + 1) + '"';
            var strHtmlYearMonthData = 'data-date=';
            var strHtmlFullData = '';

            strHtml = strHtml + '<div class="' + CL.date('body') + '">' + (function () {
                var strHtmlDate = '';
                var strClass = '';

                // 列表生成
                for (var tr = 0; tr < 6; tr++) {
                    strHtmlDate = strHtmlDate + '<div class="' + CL.date('tr') + '">';

                    // 日期遍历
                    for (var td = 0; td < 7; td++) {
                        // 类名
                        strClass = CL.date('item') + ' col' + td;

                        // 今天
                        var numYearNow = arrDate[0];
                        var numMonthNow = objNewDate.getMonth() + 1;
                        var numDayNow;
                        var objDateNow;

                        // 由于range选择和date选择UI上有比较大大差异
                        // 为了可读性以及后期维护
                        // 这里就不耦合在一起，而是分开处理
                        if (strType == 'date') {
                            // 第一行上个月一些日期补全
                            if (tr == 0 && td < numDayFirst) {
                                // 当前日子
                                numDayNow = arrMonthDay[numLastMonth] - numDayFirst + td + 1;
                                // 当前日期
                                objDateNow = new Date(numYearNow, numLastMonth, numDayNow);
                                // 完整data-date属性及其值
                                strHtmlFullData = strHtmlYearMonthData + objDateNow.toArray().join('-');
                                // HTML拼接
                                strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                            } else {
                                // 当前日子
                                numDayNow = tr * 7 + td - numDayFirst + 1;
                                // 如果没有超过这个月末
                                if (numDayNow <= arrMonthDay[objNewDate.getMonth()]) {
                                    // 这个日子对应的时间对象
                                    objDateNow = new Date(numYearNow, objNewDate.getMonth(), numDayNow);
                                    // 完整data-date属性及其值
                                    strHtmlFullData = strHtmlYearMonthData + objDateNow.toArray().join('-');
                                    // 如果日子匹配
                                    if (currentDate.getDate() == numDayNow) {
                                        strClass = strClass + ' ' + SELECTED;
                                    }
                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = strHtmlDate + '<a href="javascript:;" ' + strHtmlData + ' class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</a>';
                                    } else {
                                        strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                                    }
                                } else {
                                    numDayNow = numDayNow - arrMonthDay[objNewDate.getMonth()];
                                    // 更新strHtmlFullData
                                    strHtmlFullData = strHtmlYearMonthData + new Date(numYearNow, numMonthNow, numDayNow).toArray().join('-');
                                    // 日期字符拼接
                                    strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                                }
                            }
                        } else if (strType == 'date-range') {
                            // 非当前月部分使用空格补全
                            if (tr == 0 && td < numDayFirst) {
                                strHtmlDate = strHtmlDate + '<span class="' + strClass + '"></span>';
                            } else {
                                numDayNow = tr * 7 + td - numDayFirst + 1;
                                // 如果没有超过这个月末
                                if (numDayNow <= arrMonthDay[objNewDate.getMonth()]) {
                                    // 这个日子对应的时间对象
                                    objDateNow = new Date(numYearNow, objNewDate.getMonth(), numDayNow);

                                    // 完整data-date属性及其值
                                    strHtmlFullData = strHtmlYearMonthData + objDateNow.toArray().join('-');

                                    // range选择的匹配规则如下：
                                    // 1. 获得已经选中到时间范围
                                    // 2. 起始时间和结束时间是方框表示
                                    // 3. 之间的时间是选中表示
                                    var dateBegin = this[SELECTED][0].join('-').toDate();
                                    var dateEnd = this[SELECTED][1].join('-').toDate();

                                    // 各个时间的时间戳
                                    var timeNow = objDateNow.getTime();
                                    var timeBegin = dateBegin.getTime();
                                    var timeEnd = dateEnd.getTime();

                                    if (timeNow >= timeBegin && timeNow <= timeEnd) {
                                        // 在时间范围之内
                                        strClass = strClass + ' ' + SELECTED;
                                        // 跟开始时间一样
                                        if (timeNow == timeBegin) {
                                            strClass = strClass + ' ' + CL.date('begin');
                                        }
                                        // 跟结束时间一样
                                        if (timeNow == timeEnd) {
                                            strClass = strClass + ' ' + CL.date('end');
                                        }
                                        // 今月的第一天还是最后一天
                                        if (numDayNow == 1) {
                                            strClass = strClass + ' ' + CL.date('first');
                                        } else if (numDayNow == arrMonthDay[objNewDate.getMonth()]) {
                                            strClass = strClass + ' ' + CL.date('last');
                                        }
                                    }

                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = strHtmlDate + '<a href="javascript:;" ' + strHtmlData + ' class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</a>';
                                    } else {
                                        strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                                    }
                                } else {
                                    strHtmlDate = strHtmlDate + '<span class="' + strClass + '"></span>';
                                }
                            }
                        }
                    }
                    strHtmlDate += '</div>';
                }

                return strHtmlDate;
            }).call(this) + '</div>';

            return {
                monthDay: arrMonthDay,
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }
    });

    /**
     * 月份组装
     * @param  {Array} arrDate 数组化的日期表示值
     * @return {Object}        返回的是后续方法需要的数据的纯对象，包括组装的HTML字符数据，月份最大和最小值。
     */
    Object.defineProperty(DateTime.prototype, 'getMonthData', {
        value: function (arrDate) {
            // 文本框元素
            var eleInput = this.element.input;

            // 最大月份和最小月份
            var numMin = eleInput.getAttribute('min') || this.params.min;
            var numMax = eleInput.getAttribute('max') || this.params.max;

            // 这里使用年月组合做比对
            var arrMapMinMax = [numMin, numMax].map(function (minMax, index) {
                if (typeof minMax == 'object' && minMax.getTime) {
                    minMax = minMax.toArray().slice(0, 2).join('');
                } else if (typeof minMax == 'string' && /\D/.test(minMax.replace(regDate, '')) == false) {
                    // 这里对字符串进行比较简单的合法性判别
                    // 自己人使用不会乱来的
                    minMax = minMax.replace(regDate, '').slice(0, 6);
                } else {
                    minMax = index ? '999912' : '000000';
                }

                return minMax;
            });

            numMin = arrMapMinMax[0];
            numMax = arrMapMinMax[1];

            var arrChinese = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

            // 年份
            var numYear = arrDate[0] * 1;

            // 类型
            var strType = this.params.type;

            var strHtml = '<div class="' + CL.month('body') + '">' + (function () {
                var strHtmlDate = '';
                var strClass = '';
                var strMonth = '';

                for (var i = 1; i <= 12; i += 1) {
                    // 合法格式字符串
                    if (i < 10) {
                        strMonth = '0' + i;
                    } else {
                        strMonth = i + '';
                    }

                    // 基本类名
                    strClass = CL.date('item');

                    if (strType == 'month') {
                        if (i == arrDate[1]) {
                            // 选中态的类名
                            strClass = strClass + ' ' + SELECTED;
                        }
                    } else if (strType == 'month-range') {
                        // range选择的匹配规则如下：
                        // 1. 获得已经选中到时间范围
                        // 2. 起始时间和结束时间是选中表示
                        // 3. 之间的时间也是选中表示
                        var strBegin = this[SELECTED][0].slice(0, 2).join('');
                        var strEnd = this[SELECTED][1].slice(0, 2).join('');
                        var strNow = numYear + strMonth;
                        if (strNow >= strBegin && strNow <= strEnd)  {
                            strClass = strClass + ' ' + SELECTED;
                        }
                    }
                    // 是否在范围以内
                    if (numYear + strMonth >= numMin && numYear + strMonth <= numMax) {
                        strHtmlDate = strHtmlDate + '<a href="javascript:" class="' + strClass + '" data-year="' + numYear + '" data-value="' + strMonth + '">' + arrChinese[i - 1] + '月</a>';
                    } else {
                        strHtmlDate = strHtmlDate + '<span class="' + strClass + '" data-value="' + strMonth + '">' + arrChinese[i - 1] + '月</span>';
                    }
                }

                return strHtmlDate;
            }).call(this) +
            '</div>';

            return {
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }
    });

    /**
     * 当前日期下这一年每月最大的日期数目
     * @param  {Array} date 格式化为数组的日期
     * @return {Array}      返回这一年每月最大的日期数目
     */
    Object.defineProperty(DateTime.prototype, 'getMonthDay', {
        value: function (date) {
            var arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                arrDate = date.toArray();
            }

            var arrMonthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            // 如果是闰年
            if (((arrDate[0] % 4 == 0) && (arrDate[0] % 100 != 0)) || (arrDate[0] % 400 == 0)) {
                arrMonthDay[1] = 29;
            }

            return arrMonthDay;
        }
    });


    /**
     * 上个月同日期
     * @param  {Array} date 格式化为数组的日期
     * @return {Object}     返回Date类型对象
     */
    Object.defineProperty(DateTime.prototype, 'getDatePrevMonth', {
        value: function (date) {
            // add on 2016-03-31
            // 原先的加减月份的跨月计算是有些问题的
            // 因为例如31号的下一月，系统会自动变成下下个月的1号
            var arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            var numMonth = arrDate[1] * 1;
            var arrMonthDay = this.getMonthDay(arrDate);

            if (numMonth == 1) {
                // 上个月是前一年的12月
                // 12月有31号，无压力
                return [arrDate[0] - 1, 12, arrDate[2]].join('-').toDate();
            }

            // 其他月份不跨年
            // 如果上一个月的最后1天小于本月的最后1天
            // 嘿嘿嘿嘿
            // 年不变，月减一，日期下个月
            if (arrMonthDay[numMonth - 2] < arrDate[2]) {
                return [arrDate[0], numMonth - 1, arrMonthDay[numMonth - 2]].join('-').toDate();
            }

            // 年不变，月减一，日期不变
            return [arrDate[0], numMonth - 1, arrDate[2]].join('-').toDate();
        }
    });


    /**
     * 下个月同日期
     * @param  {Array} date 格式化为数组的日期
     * @return {Object}     返回Date类型对象
     */
    Object.defineProperty(DateTime.prototype, 'getDateNextMonth', {
        value: function (date) {
            var arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            var numMonth = arrDate[1] * 1;
            var arrMonthDay = this.getMonthDay(arrDate);

            if (numMonth == 12) {
                // 下个月跨年了
                // 1月份也有31天，无压力
                return [arrDate[0] + 1, 1, arrDate[2]].join('-').toDate();
            }

            // 其他月份不跨年
            // 如果下个月最后1天小于本月最后1天，例如，3月31日
            if (arrMonthDay[numMonth] < arrDate[2]) {
                return [arrDate[0], numMonth + 1, arrMonthDay[numMonth]].join('-').toDate();
            }

            // 其他时候正常
            return [arrDate[0], numMonth + 1, arrDate[2]].join('-').toDate();
        }
    });

    /**
     * 选择日期
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.date = function () {
        var eleContainer = this.element.container;


        var arrDate = this[SELECTED];

        // 上一个月
        var numPrevMonth = arrDate[1] - 1;
        // 下一个月
        var numNextMonth = arrDate[1] * 1 + 1;

        var objCalender = this.getCalendarData(arrDate);

        // 选择日期的完整HTML代码
        // 1. 日期专属类名容器
        var strHtml = '<div class="' + CL.date('x') + '">';
        // 2. 头部月份切换
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';
        // 根据前后月份是否在范围之外，决定使用的标签类型
        // span标签则是禁用态，本组件全部都是如此
        // 2.1 上个月
        // datePrevMonth指上个月日期
        var datePrevMonth = this.getDatePrevMonth(arrDate);
        // numPrevMonth指上个月
        var numPrevMonthGet = datePrevMonth.getMonth();
        var numPrevYearGet = datePrevMonth.getFullYear();

        // add on 2015-12-01
        // 原来的判断逻辑有问题
        // 只要上个月份的最大日期比最小限制大就可以了
        if (new Date(numPrevYearGet, numPrevMonthGet, objCalender.monthDay[numPrevMonthGet]) >= objCalender.min && datePrevMonth <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-month="' + numPrevMonth + '" role="button" aria-label="上一月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '" aria-label="上一月">' + this.svg + '</span>';
        }

        // 2.2 下个月
        var objDateNextMonth = this.getDateNextMonth(arrDate);
        var numNextMonthGet = objDateNextMonth.getMonth();
        var numNextYearGet = objDateNextMonth.getFullYear();
        //if (objDateNextMonth >= objCalender.min && objDateNextMonth <= objCalender.max) {
        // add on 2015-12-01
        // 经反馈，如果当前日期是30号，但是最大日期是下月1号，则下个月不能进入
        // 这是有问题的
        // 原因是此时的objDateNextMonth > objCalender.max
        // 因此判断应该从月初
        if (objDateNextMonth >= objCalender.min && new Date(numNextYearGet, numNextMonthGet, 1) <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-month="' + numNextMonth + '" role="button" aria-label="下一月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '" aria-label="下一月">' + this.svg + '</span>';
        }

        //   头部月份公用结束
        strHtml = strHtml + '<a href="javascript:" class="' + CL.date('switch') + '" data-type="month" role="button" aria-label="快速切换月份">' + arrDate.slice(0, 2).join('-') + '</a>\
        </div>';

        // 3. 主体内容来自getCalendarData()方法
        strHtml += objCalender.html;

        // 今天
        // 首先，今天要在时间范围内
        if (new Date() >= objCalender.min && new Date() <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('item') + ' ' + CL.date('now') + '" role="button">今天</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('item') + ' ' + CL.date('now') + '">今天</span>';
        }

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'date');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择日期范围
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype['date-range'] = function () {
        var eleContainer = this.element.container;


        // 选择的日期范围数组
        var arrDates = this[SELECTED];
        // 当前起始日期
        // 默认（第一次）打开使用选中日期
        // 如果有，使用面板存储月份
        // 因为range选择不是即时更新文本框
        var arrDate = eleContainer.dataDate || arrDates[0];
        eleContainer.dataDate = arrDate;
        // 前一个月
        var numPrevMonth = arrDate[1] - 1;
        // 后一个月
        var numNextMonth = arrDate[1] * 1 + 1;

        // 含时间范围和对应月份日历HTML的对象
        var objCalender = this.getCalendarData(arrDate);

        // 选择时间范围完整HTML代码
        // 1. 同样的，range容器
        var strHtml = '<div class="' + CL.range('x') + '">';
        // 2. 头部
        strHtml = strHtml + '<div class="' + CL.date('head') + '">\
            <div class="' + CL.date('half') + '">';
        //  2.1 上一个月箭头
        var datePrevMonth = new Date(arrDate[0], numPrevMonth - 1, arrDate[2]);
        if (datePrevMonth >= objCalender.min && datePrevMonth <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-month="' + numPrevMonth + '" aria-label="上一个月，当前' + arrDate[1] + '月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '">' + this.svg + '</span>';
        }
        // 今月月份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + new Date(arrDate[0], numPrevMonth, arrDate[2]).toArray().slice(0, 2).join('-') + '</span>\
        </div>\
        <div class="' + CL.date('half') + '">';

        // 2.2 下下个月
        var objDateNextMonth = new Date(arrDate[0], arrDate[1], 1);
        var objDateAfterMonth = new Date(arrDate[0], numNextMonth, arrDate[2]);

        // 例如是3月31日
        // 此时 arrDate[1] '03'
        // numNextMonth 是 4

        // 此时原来的实现是由bug的
        // 因为下个月没有4月31日，于是，就会变成5月
        // 因此arrDate[2]应使用1代替

        // 下个月的当前日期在合理范围之内，则使用该月
        if (objDateAfterMonth >= objCalender.min && objDateAfterMonth <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-month="' + numNextMonth + '" aria-label="下一个月，当前' + numNextMonth + '月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        }

        // 下月月份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + objDateNextMonth.toArray().slice(0, 2).join('-') + '</span>\
        </div>';

        // 头部闭合
        strHtml += '</div>';

        // 3. 两个主体列表
        // 这里要嵌套一层range特有的body
        strHtml = strHtml + '<div class="' + CL.range('body') + ' ' + CL.range('date', 'body') + '">' +
        // 根据getCalendarData()方法创建两个月份日历
            '<div class="' + CL.date('half') + '">' + objCalender.html + '</div>' +
            '<div class="' + CL.date('half') + '">' + this.getCalendarData(objDateNextMonth.toArray()).html + '</div>' +
        // 主体标签闭合
        '</div>';

        // 4. 确定与取消按钮
        strHtml = strHtml + '<div class="' + CL.range('footer') + '">' +
            '<button class="ui-button" data-type="primary">确定</button>' +
            '<button class="ui-button" data-type="normal">取消</button>' +
        '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'date-range');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择月份
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.month = function () {
        var eleContainer = this.element.container;

        // 当前选择日期
        var arrDate = this[SELECTED];
        // 对应的月份数据
        var objMonth = this.getMonthData(arrDate);

        // 返回的最大值最小值
        var numMin = objMonth.min;
        var numMax = objMonth.max;

        // 选择月份的完整HTML代码
        // 1. month专属类名容器
        var strHtml = '<div class="' + CL.month('x') + '">';
        // 2. 月份切换的头部
        var numYear = arrDate[0] * 1;
        //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
        //    例如，假设今年是2015年，则头部年份范围是2009-2020
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';
        //    2.1 是否还有上一年
        if (numYear - 1 >= Math.floor(numMin / 100) && numYear - 1 <= Math.floor(numMax / 100)) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-year="' + (numYear - 1) + '" role="button" aria-label="上一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '" aria-label="上一年">' + this.svg + '</span>';
        }
        // 2.2 是否还有下一年
        if (numYear + 1 >= Math.floor(numMin / 100) && numYear + 1 <= Math.floor(numMax / 100)) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-year="' + (numYear + 1) + '" role="button" aria-label="下一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        }
        // 头部结束
        strHtml = strHtml + '<a href="javascript:" class="' + CL.date('switch') + '" data-type="year" role="button" aria-label="快速切换年份">' + numYear + '</a>\
        </div>';
        // 3. 月份切换主体列表
        strHtml += objMonth.html;

        // 今月
        // 首先，今月要在时间范围内
        var objThisYearMonth = new Date().toArray().slice(0, 2).join('');
        if (objThisYearMonth >= numMin && objThisYearMonth <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('item') + ' ' + CL.date('now') + '">今月</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('item') + ' ' + CL.date('now') + '">今月</span>';
        }

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'month');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择月份范围
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype['month-range'] = function () {
        var eleContainer = this.element.container;

        // 当前选择日期
        var arrDates = this[SELECTED];
        // 当前起始日期
        // 默认（第一次）打开使用选中日期
        // 如果有，使用面板存储月份
        // 因为range选择不是即时更新文本框
        var arrDate = eleContainer.dataDate || arrDates[0];
        eleContainer.dataDate = arrDate;
        // 前一年
        var numPrevYear = arrDate[0] * 1 - 1;
        // 后一个年
        var numNextYear = arrDate[0] * 1 + 1;

        // 含时间范围和对应月份日历HTML的对象
        var objMonth = this.getMonthData(arrDate);
        // 最大年份
        var numMaxYear = objMonth.max.slice(0, 4);
        var numMinYear = objMonth.min.slice(0, 4);

        // 选择时间范围完整HTML代码
        // 1. 同样的，range容器
        var strHtml = '<div class="' + CL.range('x') + '">';
        // 2. 头部
        strHtml = strHtml + '<div class="' + CL.date('head') + '">\
            <div class="' + CL.date('half') + '">';
        //  2.1 上一年箭头
        if (numPrevYear >= numMinYear && numPrevYear <= numMaxYear) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-year="' + numPrevYear + '" role="button" aria-label="上一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '" aria-label="上一年">' + this.svg + '</span>';
        }
        // 今年年份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + arrDate[0] + '</span>\
        </div>\
        <div class="' + CL.date('half') + '">';

        // 2.2 下一年
        if (numNextYear >= numMinYear && numNextYear < numMaxYear) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-year="' + numNextYear + '" role="button" aria-label="下一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '" aria-label="下一年">' + this.svg + '</span>';
        }

        // 下月月份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + numNextYear + '</span>\
        </div>';

        // 头部闭合
        strHtml += '</div>';

        // 3. 两个主体列表
        // 这里要嵌套一层range特有的body
        strHtml = strHtml + '<div class="' + CL.range('body') + ' ' + CL.range('month', 'body') + '">' +
        // 根据getCalendarData()方法创建两个月份日历
            '<div class="' + CL.date('half') + '">' + objMonth.html + '</div>' +
            '<div class="' + CL.date('half') + '">' + this.getMonthData([numNextYear, arrDate[1], arrDate[2]]).html + '</div>' +
        // 主体标签闭合
        '</div>';

        // 4. 确定与取消按钮
        strHtml = strHtml + '<div class="' + CL.range('footer') + '">' +
            '<button class="ui-button" data-type="primary">确定</button>' +
            '<button class="ui-button" data-type="normal">取消</button>' +
        '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'month-range');
        eleContainer.innerHTML = strHtml;

        return this;
    };


    /**
     * 选择年份
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.year = function () {
        // 元素
        var eleInput = this.element.input;
        var eleContainer = this.element.container;

        // 当前选择日期
        var arrDate = this[SELECTED];

        // 最小年份和最大年份
        var numMin = eleInput.getAttribute('min') || this.params.min;
        var numMax = eleInput.getAttribute('max') || this.params.max;

        // 用户可能使用时间对象
        if (typeof numMin == 'object' && numMin.getFullYear) {
            numMin = numMin.getFullYear();
        } else if (typeof numMin == 'string' && /\D/.test(numMin.replace(regDate, '')) == false) {
            // 这里对字符串进行比较简单的合法性判别
            // 自己人使用不会乱来的
            numMin = numMin.toDate().getFullYear();
        } else {
            numMin = 0;
        }
        if (typeof numMax == 'object' && numMax.getFullYear) {
            numMax = numMax.getFullYear();
        } else if (typeof numMax == 'string' && /\D/.test(numMax.replace(regDate, '')) == false) {
            numMax = numMax.toDate().getFullYear();
        } else {
            numMax = 9999;
        }

        // 选择年份的完整HTML代码
        // 1. 同样的，year专属类名容器
        var strHtml = '<div class="' + CL.year('x') + '">';
        // 2. 头部的年份切换，一切就是12年
        //    有必要先知道当前的年份
        var numYear = arrDate[0];
        //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
        //    例如，假设今年是2015年，则头部年份范围是2009-2020
        //    左右切换是没有限制的
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';
        //    年份不是你想翻就能翻到
        //    2.1 上一个12年
        if (numYear - 12 >= numMin && numYear - 12 <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-year="' + (numYear - 12) + '" role="button" aria-label="上一个12年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '">' + this.svg + '</span>';
        }
        //    2.2 下一个12年
        if (numYear + 12 >= numMin && numYear + 12 <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-year="' + (numYear + 12) + '" role="button" aria-label="下一个12年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        }
        // year选择是顶级类别，一定是不可点击的
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + [numYear - 6, numYear + 5].join('-') + '</span></div>';

        // 3. 年份选择的主体
        strHtml = strHtml + '<div class="' + CL.year('body') + '">' + (function () {
            var strHtmlDate = '';
            var strClass = '';

            for (var indexYear = numYear - 6; indexYear < numYear + 6; indexYear += 1) {
                // 选中态的类名
                strClass = CL.date('item');

                if (indexYear == numYear) {
                    strClass = strClass + ' ' + SELECTED;
                }

                // 是否在范围以内
                if (indexYear >= numMin && indexYear <= numMax) {
                    strHtmlDate = strHtmlDate + '<a href="javascript:" class="' + strClass + '">' + indexYear + '</a>';
                } else {
                    strHtmlDate = strHtmlDate + '<span class="' + strClass + '">' + indexYear + '</span>';
                }
            }

            return strHtmlDate;
        })() + '</div>';

        // 今年
        // 首先，今年要在时间范围内
        var numThisYear = new Date().getFullYear();
        if (numThisYear >= numMin && numThisYear <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('item') + ' ' + CL.date('now') + '" role="button">今年</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('item') + ' ' + CL.date('now') + '">今年</span>';
        }

        // 头部标签闭合
        strHtml += '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'year');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择小时
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.hour = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleInput = this.element.input;

        // 当前选择时间
        var arrTime = this[SELECTED];

        // 时间选择的小时间隔，默认是1小时
        var numStep = eleInput.getAttribute('step') * 1;
        if (this.params.type != 'hour' || !numStep || numStep < 1) {
            numStep = 1;
        } else {
            numStep = Math.round(numStep);
        }

        // 最小时间，和最大时间
        // 这里只比较小时
        var numMin = (eleInput.getAttribute('min') || this.params.min.toString()).split(':')[0];
        var numMax = (eleInput.getAttribute('max') || this.params.max.toString()).split(':')[0];

        if (/\D/.test(numMin)) {
            numMin = 0;
        } else {
            numMin *= 1;
        }
        if (/\D/.test(numMax)) {
            numMax = 24;
        } else {
            numMax *= 1;
        }

        // 选择小时的完整HTML
        // 1. 同样的，专有容器
        var strHtml = '<div class="' + CL.hour('x') + '">';
        // 2. 小时没有头部切换，直接列表们
        strHtml = strHtml + '<div class="' + CL.hour('body') + '">' + (function () {
            var strHtmlTime = '';
            var strHour = '';
            var strClass = '';
            // 遍历24小时
            for (var indexHour = 0; indexHour < 24; indexHour += numStep) {
                strHour = indexHour + '';
                if (strHour.length == 1) {
                    strHour = '0' + strHour;
                }

                // 选中态的类名
                strClass = CL.date('item');
                if (strHour == arrTime[0]) {
                    strClass = strClass + ' ' + SELECTED;
                }

                // 是否在范围以内
                if (strHour >= numMin && strHour <= numMax) {
                    strHtmlTime = strHtmlTime + '<a href="javascript:" class="' + strClass + '">' + strHour + ':00</a>';
                } else {
                    strHtmlTime = strHtmlTime + '<span class="' + strClass + '">' + strHour + ':00</span>';
                }
            }

            return strHtmlTime;
        })() + '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'hour');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择分钟
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.minute = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleInput = this.element.input;

        // 当前选择时间
        var arrTime = this[SELECTED];

        // 分钟时间间隔, 默认为5分钟
        var numStep = eleInput.getAttribute('step') * 1 || 5;

        // 最小时间，和最大时间
        // 跟小时不同，这里必须符合00:00格式
        // 由于格式固定，我们直接去除':'后的值进行比较
        // 例如：10:20 → 1020
        var numMin = eleInput.getAttribute('min') || (this.params.min + '');
        var numMax = eleInput.getAttribute('max') || (this.params.max + '');

        if (numMin == 'auto' || /\D/.test(numMin.replace(':', '')) || numMin.split(':').length != 2) {
            numMin = 0;
        } else {
            numMin = numMin.replace(':', '') * 1;
        }
        if (numMax == 'auto' || /\D/.test(numMax.replace(':', '')) || numMax.split(':').length != 2) {
            numMax = 2359;
        } else {
            numMax = numMax.replace(':', '') * 1;
        }

        // 选择分钟的完整HTML
        // 1. 外部的容器，含有专有容器类名，可以重置内部的一些样式
        var strHtml = '<div class="' + CL.minute('x') + '" data-step="' + numStep + '">';
        // 2. 头部小时的左右切换
        var hour = arrTime[0] * 1;
        //   首先是公共部分
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';


        //   2.1 可不可往前翻
        if (hour <= Math.floor(numMin / 100)) {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '">' + this.svg + '</span>';
        } else {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-hour="' + (hour - 1) + '" role="button" aria-label="上一个小时">' + this.svg + '</a>';
        }
        // 2.2 可不可以往后翻
        if (hour >= Math.floor(numMax / 100)) {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        } else {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-hour="' + (hour + 1) + '" role="button" aria-label="下一个小时">' + this.svg + '</a>';
        }

        // 头部结束的公共html部分
        strHtml = strHtml + '<a href="javascript:" class="' + CL.date('switch') + '" data-type="hour">' + arrTime[0] + ':00</a></div>';

        // 3. 分钟主体
        strHtml = strHtml + '<div class="' + CL.minute('body') + '">' + (function () {
            var strHtmlTime = '';
            var strMinute = '';
            var strClass = '';
            // 遍历60分钟
            for (var indexMinute = 0; indexMinute < 60; indexMinute += numStep) {
                strMinute = indexMinute + '';
                if (strMinute.length == 1) {
                    strMinute = '0' + strMinute;
                }

                // 基本样式
                strClass = CL.date('item');

                // 是否在时间范围内
                if ((arrTime[0] + strMinute) * 1 >= numMin && (arrTime[0] + strMinute) * 1 <= numMax) {
                    // 选中态
                    if (strMinute == arrTime[1]) {
                        strClass = strClass + ' ' + SELECTED;
                    }
                    strHtmlTime = strHtmlTime + '<a href="javascript:" class="' + strClass + '">' + [arrTime[0], strMinute].join(':') + '</a>';
                } else {
                    strHtmlTime = strHtmlTime + '<span class="' + strClass + '">' + [arrTime[0], strMinute].join(':') + '</span>';
                }
            }

            return strHtmlTime;
        })() + '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'minute');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 日期选择面板的显示
     * @return {Object} 当前实例对象
     */
    DateTime.prototype.show = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleTrigger = this.element.trigger;
        var eleInput = this.element.input;

        if (eleInput.disabled) {
            return this;
        }

        // 根据value更新SELECTED
        this.format();

        // 不同的类名显示不同的内容
        if (this.params.type == 'time') {
            this.minute();
        } else if (this.params.type == 'date-range') {
            // 存储当前日期范围数据，以便取消的时候可以正确还原
            if (!this.dataRangeSelected) {
                this.dataRangeSelected = this[SELECTED];
            }
            this['date-range']();
        } else if (this.params.type == 'month-range') {
            // 存储当前日期范围数据，以便取消的时候可以正确还原
            if (!this.dataRangeSelected) {
                this.dataRangeSelected = this[SELECTED];
            }
            this['month-range']();
        } else if (this[this.params.type]) {
            this[this.params.type]();
        } else {
            this.date();
        }

        // 如果面板对象在内存中，非文档中，则载入
        if (document.body.contains(eleContainer) == false) {
            document.body.appendChild(eleContainer);
        }

        if (eleTrigger != eleContainer) {
            eleContainer.style.display = 'block';
            eleTrigger.classList.add(ACTIVE);

            new Follow(eleTrigger, eleContainer, {
                position: '4-1'
            });

            // 如果屏幕外，则偏移
            // 3是阴影的距离
            var numLeft = parseFloat(eleContainer.style.left);
            var numWidth = eleContainer.offsetWidth;
            if (numLeft + numWidth + 3 > screen.width) {
                eleContainer.style.left = Math.max(screen.width - numWidth - 3, 0) + 'px';
            }
        }

        // 显示回调
        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this, eleInput, eleContainer);
        }

        // 改变显示与隐藏的标志量
        this.display = true;

        return this;
    };

    /**
     * 日期选择面板的隐藏
     * @return {Object} 当前实例对象
     */
    DateTime.prototype.hide = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleTrigger = this.element.trigger;
        var eleInput = this.element.input;

        if (this.display == true && eleTrigger != eleContainer) {
            eleContainer.style.display = 'none';
            eleTrigger.classList.remove(ACTIVE);

            // 焦点位置还原
            eleInput.focus();
            eleInput.blur();

            // 隐藏回调
            if (typeof this.callback.hide == 'function') {
                this.callback.hide.call(this, eleInput, eleContainer);
            }
        }

        // 改变显示与隐藏的标志量
        this.display = false;

        return this;
    };

    var funAutoInitAndWatching = function () {
        // 如果没有开启自动初始化，则返回
        if (window.autoInit === false) {
            return;
        }

        var funSyncRefresh = function (node) {
            if (node.nodeType != 1 || node.tagName != 'INPUT' || (node.data && node.data.dateTime)) {
                return;
            }

            var strType = node.getAttribute('type');
            if (/^date|year|month|time|hour|minute/.test(strType)) {
                new DateTime(node);
            }
        };

        document.querySelectorAll('input[type]').forEach(funSyncRefresh);


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

                    if (nodeAdded.length) {
                        nodeAdded.forEach(function (eleAdd) {
                            funSyncRefresh.call(mutation, eleAdd);
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
                funSyncRefresh(event.target);
            });
        }
    };

    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }


    return DateTime;
}));
/**
 * @Validate.js
 * @author zhangxinxu
 * @version
 * Created: 15-08-19
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.ErrorTip = require('./ErrorTip');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Validate = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {

    var ErrorTip = this.ErrorTip;
    if (typeof require == 'function' && !ErrorTip) {
        ErrorTip = require('common/ui/ErrorTip');
    } else if (!ErrorTip) {
        window.console.error('need ErrorTip.js');
        return {};
    }

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

    // 全角转半角方法
    window.DBC2SBC = function (str) {
        var result = '';
        var i, code;
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
    window.scrollTopTo = function (top, callback) {
        var scrollTop = document.scrollingElement.scrollTop;
        var rate = 2;

        var funTop = function () {
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
            selectRange: function (element, start, end) {
                if (!element) {
                    return;
                }
                if (element.createTextRange) {
                    var objRange = element.createTextRange();
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
            getTel: function (tel) {
                var strTel = tel || '';
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
            getLength: function (element, max) {
                if (element.type == 'password') {
                    return max ? max : element.value.length;
                }
                // 语言属性和trim后的值
                var strAttrLang = element.getAttribute('lang');
                var strValue = element.value.trim();
                if (!strAttrLang) {
                    return max ? max : strValue.length;
                }
                if (strValue == '') {
                    return 0;
                }

                // 中文和英文计算字符个数的比例
                var numRatioCh = 1;
                var numRatioEn = 1;

                if (/zh/i.test(strAttrLang)) {
                    // 1个英文半个字符
                    numRatioEn = 0.5;
                } else if (/en/i.test(strAttrLang)) {
                    // 1个中文2个字符
                    numRatioCh = 2;
                }

                // 下面是中文或全角等字符正则
                if (!max) {
                    var lenOriginCh = strValue.replace(/[\x00-\xff]/g, '').length;
                    var lenOriginEn = strValue.length - lenOriginCh;

                    // 根据比例返回最终长度
                    return Math.ceil(lenOriginEn * numRatioEn) + Math.ceil(lenOriginCh * numRatioCh);
                }
                var numStart = 0;
                var lenMatch = max;

                strValue.split('').forEach(function (letter, index) {
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
            getType: function (element) {
                // 控件的类型
                // 这里不能直接element.type获取，否则，类似email类型直接就是text类型
                // 但是，有些元素的type是隐式的，例如textarea，因此element.type还是需要的
                var strAttrType = element.getAttribute('type');
                var strType = strAttrType || element.type || '';
                // 高级版本IE浏览器的向下兼容模式，会忽略email类型
                // 虽然这种情况出现的可能性很小，但是，为了万一
                // 可以使用type='email '解决此问题
                // 所以，才会有下面的正则替换，得到最精准的type类型
                strType = strType.toLowerCase().replace(/\W+$/, '');

                // 对于本来支持的浏览器，需要变成真实的
                if (strAttrType && strAttrType != strType && !element.isTypeReset) {
                    var eleInput = document.createElement('input');
                    eleInput.type = strType;

                    if (eleInput.getAttribute('type') == strType) {
                        try {
                            element.type = strType;
                            element.isTypeReset = true;
                        } catch (e) {
                            //
                        }
                    }
                }

                if (strType == 'select-one') {
                    strType = 'select';
                }

                // 类似_date_这种干掉浏览器默认类型的处理
                return strType.replace(/_/g, '');
            },

            /**
             * 返回对应的提示信息
             * @param  {[type]} element 提示元素
             * @return {String}         返回对应的提示信息
             */
            getReportText: function (element) {
                var defaultPrompt = {
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
                var objValidateState = element.validity;

                // 如果没有错误，没有任何返回
                if (objValidateState.valid == true) {
                    return '';
                }

                // 最终的提示文字
                var strFinalText = '';

                // 元素的id, type等
                var strId = element.id;
                var strType = this.getType(element);

                // 元素上自定义的提示信息
                // 元素存储的提示信息，主要是自定义方法返回的自定义提示
                var customValidate = element.customValidate || {};
                var optionPrompt = customValidate.report || {};

                // 错误提示关键字
                var strName = defaultPrompt.name[strType] || (function () {
                    if (!customValidate.label || !strId || /checkbox|radio/.test(strType)) {
                        return;
                    }
                    var strTextLabel = '';
                    // 从label动态获取提示数据
                    document.querySelectorAll('label[for=' + strId + ']').forEach(function (eleLabel) {
                        var eleLabelClone = eleLabel.cloneNode(true);
                        // 只使用裸露的文字作为提示关键字
                        [].slice.call(eleLabelClone.children).forEach(function (eleChild) {
                            eleChild.remove();
                        });

                        // 去除数字和冒号
                        var strLabelCloneText = eleLabelClone.innerHTML.trim().replace(/\d/g, '').replace('：', '');
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
                        var isMultiple = element.hasAttribute('multiple') && element.value.split(',').length > 1;

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
                        var strMin = element.getAttribute('min');
                        var strMax = element.getAttribute('max');

                        if (strType == 'month-range') {
                            strMin = strMin.slice(0, 7);
                            strMax = strMax.slice(0, 7);
                        }

                        var strTextBigger = '必须要大于或等于' + strMin;
                        var strTextSmall = '必须要小于或等于' + strMax;

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
                        var numMin = element.getAttribute('min') * 1;
                        var numMax = element.getAttribute('max') * 1;
                        var numStep = element.getAttribute('step') * 1 || 1;

                        if (strType == 'number' || strType == 'range') {
                            strFinalText = '请输入有效的值。两个最接近的有效值是' + (function () {
                                var numValue = element.value.trim() * 1;
                                var numClosest = numMin;
                                for (var start = numMin; start < numMax; start += numStep) {
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
                    var strAttrLang = element.getAttribute('lang');
                    var strTextCharLength = '';

                    if (/zh/i.test(strAttrLang)) {
                        strTextCharLength = '个汉字(2字母=1汉字)';
                    } else if (/en/i.test(strAttrLang)) {
                        strTextCharLength = '个字符(1汉字=2字符)';
                    }

                    if (objValidateState.tooLong) {
                        // 先看看有没有自定义的提示
                        strFinalText = optionPrompt.tooLong;

                        if (!strFinalText) {
                            var strMaxLength = element.maxlength || element.getAttribute('maxlength');

                            strFinalText = (strName || '') + '内容长度不能大于' + strMaxLength.replace(/\D/g, '') + strTextCharLength;
                        }
                    } else {
                        // 先看看有没有自定义的提示
                        strFinalText = optionPrompt.tooShort;
                        if (!strFinalText) {
                            var strMinLength = element.getAttribute('minlength');

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
            }
            */

            /**
             * 判断元素是否为空的验证
             * @param  Element  element 验证的DOM元素
             * @return Object           返回验证的状态对象
             */
            getMissingState: function (element) {
                var objValidateState = {
                    valueMissing: false
                };

                // 主要针对required必填或必选属性的验证
                if (!element || element.disabled) {
                    return objValidateState;
                }

                // 类型
                var strType = this.getType(element);

                // 此时的值才是准确的值（浏览器可能会忽略文本框中的值，例如number类型输入框中的不合法数值）
                var strValue = element.value;

                if (element.hasAttribute('required')) {
                    // 根据控件类型进行验证
                    // 1. 单复选框比较特殊，先处理下
                    if (strType == 'radio') {
                        // 单选框，只需验证是否必选，同一name单选组只有要一个设置required即可
                        var eleRadios = [element];
                        var eleForm = element.closest('form') || element.parentElement.parentElement;

                        if (element.name && eleForm) {
                            eleRadios = eleForm.querySelectorAll('input[type="radio"][name="' + element.name + '"]');
                        }

                        // 如果单选框们没有一个选中，则认为无视了required属性
                        var isAtLeastOneRadioChecked = [].slice.call(eleRadios).some(function (eleRadio) {
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
                        // 重新赋值，清空可能被浏览器默认认为不合法的值
                        // 但是需要是现代浏览器，低版本IE会不断触发属性改变事件
                        if (history.pushState) {
                            element.value = '';
                        }

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
            isMissing: function (element) {
                return this.getMissingState(element).valueMissing;
            },

            /**
             * 返回元素值的合法状态
             * @param  {Element}  element 验证的DOM元素
             * @param  {RegExp}  regex 验证的正则
             * @return {Boolean|Object} 返回验证通过布尔值或者出错信息对象
             */
            getMismatchState: function (element, regex, params) {
                var objValidateState = {
                    patternMismatch: false,
                    typeMismatch: false
                };

                // 禁用元素不参与验证
                if (!element || element.disabled) {
                    return false;
                }

                // 原始值和处理值
                var strInputValue = element.value;
                var strDealValue = strInputValue;

                // 类型
                var strType = this.getType(element);

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
                regex = regex || (function () {
                    return element.getAttribute('pattern');
                })() ||
                (function () {
                    // 文本框类型处理，可能有管道符——多类型重叠，如手机或邮箱
                    return strType && strType.split('|').map(function (strTypeSplit) {
                        var regMatch = document.validate.reg[strTypeSplit];
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
                var isMultiple = element.hasAttribute('multiple');
                var regNew = new RegExp(regex, params || 'i');

                // 正则验证标志量
                var isAllPass = true;

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
            isMismatch: function (element, regex, params) {
                var objValidateState = this.getMismatchState(element, regex, params);

                return objValidateState.patternMismatch || objValidateState.typeMismatch;
            },

            /**
             * 判断数值或日期范围超出
             * @param  {Element}  element 验证的DOM元素
             * @return {Boolean|Object} 返回验证状态对象
             */
            getRangeState: function (element) {
                var objValidateState = {
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
                var strType = this.getType(element);
                var strValue = element.value.trim();

                if (/radio|checkbox|select|textarea/i.test(strType) || strValue == '') {
                    return objValidateState;
                }

                var strAttrMin = element.getAttribute('min');
                var strAttrMax = element.getAttribute('max');
                var strAttrStep = Number(element.getAttribute('step')) || 1;


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
                        var minuteValue = strValue.split(':')[1];
                        var minuteMin = strAttrMin.split(':')[1];

                        if (strType == 'hour' && (minuteValue != minuteMin || (strValue.split(':')[0] - strAttrMin.split(':')[0]) % strAttrStep != 0)) {
                            // 小时，则是分钟要一致，小时数正好step
                            objValidateState.stepMismatch = true;
                        } else if ((minuteValue - minuteMin) % strAttrStep !== 0) {
                            objValidateState.stepMismatch = true;
                        }
                    }
                } else {
                    // 时间范围
                    var arrSplitValue = strValue.split(' ');

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
            isOut: function (element) {
                var objValidateState = this.getRangeState(element);

                return objValidateState.badInput || objValidateState.rangeOverflow || objValidateState.rangeUnderflow || objValidateState.stepMismatch;
            },

            /**
             * 内容是否超出长度限制的判断
             * @param  {Element}  element   DOM元素对象
             * @return {Boolean|Object} 返回验证通过布尔值或者出错信息对象
             */
            getLengthState: function (element) {
                var objValidateState = {
                    tooLong: false,
                    tooShort: false
                };
                // 是否内容长度溢出的判断
                if (!element || element.disabled || /^radio|checkbox|select$/i.test(element.type)) {
                    return objValidateState;
                }

                //  大小限制
                var strAttrMinLenght = element.getAttribute('minlength');
                var strAttrMaxLenght = element.maxlength || element.getAttribute('maxlength');
                // 值
                var strValue = element.value;

                if (strValue == '') {
                    return objValidateState;
                }

                var numLength = this.getLength(element);

                if (strAttrMinLenght && numLength < strAttrMinLenght) {
                    objValidateState.tooShort = true;
                }

                if (strAttrMaxLenght) {
                    strAttrMaxLenght = strAttrMaxLenght.replace(/\D/g, '');
                    if (numLength > strAttrMaxLenght) {
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
            isOverflow: function (element) {
                var objValidateState = this.getLengthState(element);
                return objValidateState.tooLong || objValidateState.tooShort;
            },

            /**
             * 自定义验证状态
             * @return {[type]} [description]
             */
            getCustomState: function (element) {
                var objValidateState = {
                    customError: false
                };
                var customValidate = element.customValidate;

                if (customValidate && typeof customValidate.method == 'function') {
                    var dataResult = customValidate.method.call(customValidate.owner, element);
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
            setCustomValidity: function (element, content) {
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
            checkValidity: function (element) {
                // 1. 元素不存在不验证
                // 2. 禁用态表单元素不参与验证
                if (!element || element.disabled) {
                    return true;
                }

                // 3. 提交、重置等元素不参与验证
                var strType = element.getAttribute('type') || element.type;
                var strTag = element.tagName.toLowerCase();

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
            getValidity: function (element) {
                // 性能优化
                // 如果值不变，且之前已经验证过，
                // 且不是单复选框，则直接返回
                // 避免同一元素短时间多次验证
                if (element.lastValidateState && element.lastValue === element.value && /radio|checkbox/.test(element.type) == false) {
                    return element.lastValidateState;
                }

                // 浏览器原生的状态
                var objValidateState = {
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
                objValidateState = Object.assign({}, objValidateState, this.getMissingState(element), this.getMismatchState(element), this.getRangeState(element), this.getLengthState(element), this.getCustomState(element));

                var isSomeInvalid = false;

                for (var keyValidate in objValidateState) {
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
            reportValidity: function (element, content) {
                // 验证并设置结果状态
                content = content || this.getReportText(element);

                // 提示
                this.errorTip(element, content);

                var isPass = !content;

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
            styleError: function (element, valid) {
                // 是否有错
                if (!element) {
                    return this;
                }

                if (typeof valid == 'undefined') {
                    valid = element.validity.valid;
                }

                var eleTarget = this.getTarget(element);

                if (!eleTarget) {
                    return valid;
                }

                var eleForm = element.closest('form') || (element.customValidate && element.customValidate.owner);

                if (element.type == 'radio' && element.name && eleForm) {
                    // 单选框组是整体去除高亮
                    eleForm.querySelectorAll('input[type=radio][name=' + element.name + ']').forEach(function (eleRadio) {
                        var eleTargetRadio = this.getTarget(eleRadio);

                        if (valid) {
                            eleTargetRadio.classList.remove('error');
                            eleTargetRadio.removeAttribute('aria-label');
                        } else {
                            eleTargetRadio.classList.add('error');
                        }
                    }.bind(this));
                } else if (valid) {
                    eleTarget.classList.remove('error');
                    eleTarget.removeAttribute('aria-label');
                } else {
                    eleTarget.classList.add('error');
                }

                return valid;
            },

            /**
             * 显示出错信息处理
             * @param  {Object} element 出错提示原始元素（这里可能会进行转移）
             * @param  {String} content 出错提示内容
             * @return {Object}         返回当前上下文
             */
            errorTip: function (element, content) {
                var eleTarget = this.getTarget(element);

                if (!eleTarget || !content) {
                    return this;
                }

                // 如果元素隐藏，也不提示
                var objStyle = window.getComputedStyle(eleTarget);

                if (objStyle.display == 'none' || objStyle.visibility == 'hidden') {
                    return this;
                }

                var funShow = function () {
                    var eleControl = document.validate.errorTip.control;
                    var eleTarget = document.validate.errorTip.target;

                    new ErrorTip(eleTarget, content, {
                        onShow: function (eleTrigger, eleTips) {
                            // 如果tips宽度比较小，居左定位
                            // 否则，使用默认的居中
                            var numOffsetX = 0.5 * (eleTips.clientWidth - eleTarget.clientWidth);

                            if (numOffsetX < 0) {
                                eleTips.style.marginLeft = 0.5 * (eleTips.clientWidth - eleTarget.clientWidth) + 'px';
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
                        onHide: function () {
                            var eleForm = eleControl.closest('form');

                            if (!eleForm || !eleForm.isImmediated) {
                                return;
                            }

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
                        var strValue = eleControl.value;
                        var numLength = strValue.length;
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
                        var strAttrMaxLength = eleControl.maxlength || eleControl.getAttribute('maxlength').replace(/\D/g, '');

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
                var objRect = eleTarget.getBoundingClientRect();
                var numScrollTop = -1;
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
            getTarget: function (element) {
                if (!element) {
                    return null;
                }

                var eleTarget = element;

                // 根据原生控件元素，确定真实的自定义控件元素
                // 这里的很多处理跟其他表单UI组件想耦合、关联
                var strType = element.getAttribute('type') || element.type;
                var strId = element.id;
                var strTag = element.tagName.toLowerCase();

                var objStyle = window.getComputedStyle(element);

                // 1. 单复选框
                if (strType == 'radio' && objStyle.opacity != '1') {
                    eleTarget = element.parentElement.querySelector('label.ui-radio[for="' + strId + '"]');
                } else if (strType == 'checkbox' && objStyle.opacity != '1') {
                    eleTarget = element.parentElement.querySelector('label.ui-checkbox[for="' + strId + '"]');
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
                    var eleTargetRel = document.getElementById(eleTarget.getAttribute('data-target')) || element.dataTarget;
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
            get: function ValidityState () {
                return document.validate.getValidity(this);
            },
            configurable: true
        });

        Object.defineProperty(prop, 'checkValidity', {
            value: function () {
                return this.validity.valid;
            },
            configurable: true
        });

        Object.defineProperty(prop, 'reportValidity', {
            value: function (content) {
                return document.validate.reportValidity(this, content);
            },
            configurable: true
        });

        Object.defineProperty(prop, 'setCustomValidity', {
            value: function (content) {
                if (!content) {
                    return;
                }

                // 浏览器原生的状态
                var arrValidateKey = [
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
                    }.bind(this));
                } else if (typeof content == 'object') {
                    Object.assign(this.customValidate.report, content);
                }
            },
            configurable: true
        });
    });

    // 表单元素的checkValidity()方法支持
    Object.defineProperty(HTMLFormElement.prototype, 'checkValidity', {
        value: function () {
            return document.validate.checkValidity(this);
        },
        configurable: true
    });


    /**
     * 验证实例方法主体
     * @param {Object}   el       通常值验证的表单元素
     * @param {Function} callback 验证成功的回调
     * @param {Object}   options  可选参数
     */
    var Validate = function (element, callback, options) {
        if (typeof element == 'string') {
            element = document.querySelector(element);
        }
        // el一般指的是form元素
        if (!element) {
            return this;
        }

        var eleForm = element;

        if (eleForm.data && eleForm.data.validate) {
            return eleForm.data.validate;
        }

        // 干掉浏览器默认的验证
        eleForm.setAttribute('novalidate', 'novalidate');

        var defaults = {
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
            onError: function () {},
            onSuccess: function () {}
        };

        var objParams = Object.assign({}, defaults, options || {});

        // 还原禁用的提交和关闭按钮
        eleForm.querySelectorAll('[type="submit"]:disabled, [type="image"]:disabled').forEach(function (eleSubmit) {
            eleSubmit.disabled = false;
        });

        // 干掉默认的提交
        eleForm.addEventListener('submit', function (event) {
            if (this.stopValidate) {
                return;
            }
            event.preventDefault();

            if (this.checkValidity() && typeof callback == 'function') {
                callback.call(this, eleForm);
            }

            return false;
        }.bind(this));

        // 自定义的验证绑定
        var dataValidate = objParams.validate;
        // 确保是数组
        if (dataValidate && !dataValidate.forEach && dataValidate.id) {
            dataValidate = [dataValidate];
        }

        // 是否从<label>元素寻找提示关键字
        var isLabel = objParams.label;
        // 遍历元素并匹配
        eleForm.querySelectorAll('input, select, textarea').forEach(function (eleInput) {
            var strId = eleInput.id;

            // 是否使用自定义的验证和提示
            var customValidate = {
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
            eleInput.lastValue = eleInput.value || '';

            // 绑定在元素上
            eleInput.customValidate = customValidate;
        }.bind(this));

        // 暴露的数据
        this.element = {
            form: eleForm
        };

        this.callback = {
            error: objParams.onError,
            success: objParams.onSuccess
        };

        this.data = dataValidate;

        this.params = {
            multiple: objParams.multiple,
            immediate: objParams.immediate,
            label: isLabel
        };

        // 计数效果
        this.count();

        // 手机号过滤等增强体验功能
        this.enhance();

        if (!eleForm.data) {
            eleForm.data = {};
        }

        eleForm.data.validate = this;

        return this;
    };

    /**
     * 表单内有计数功能元素的处理
     * 私有
     * @return {Object} 返回当前实例
     */
    Object.defineProperty(Validate.prototype, 'count', {
        value: function () {
            // 即时验证
            var eleForm = this.element.form;
            // 遍历计数元素
            eleForm.querySelectorAll('input, textarea').forEach(function (element) {
                // 对maxlength进行处理
                var strAttrMaxLength = element.getAttribute('maxlength');
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
                var strAttrMinLength = element.getAttribute('minlength');

                if (!strAttrMaxLength) {
                    return;
                }
                // 过滤非数值字符
                if (strAttrMaxLength) {
                    strAttrMaxLength = strAttrMaxLength.replace(/\D/g, '');
                }

                // 标签名
                var strTag = element.tagName.toLowerCase();
                // 类名
                var CL = {
                    add: function () {
                        return ['ui', strTag].concat([].slice.call(arguments)).join('-');
                    },
                    toString: function () {
                        return 'ui-' + strTag;
                    }
                };

                // 有没有label元素
                var eleLabel = element.parentElement.querySelector('.' + CL.add('count')) || eleForm.querySelector('.' + CL.add('count') + '[for="' + element.id + '"]');

                // 如果没有对应label元素，同时不是适合创建label元素的HTML结构，则返回
                if (!eleLabel && !element.parentElement.classList.contains(CL.add('x'))) {
                    return;
                }

                // 元素id必须
                var strId = element.id;
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

                var eleMin = eleLabel.querySelector('span') || eleLabel;

                // 计数，标红方法
                var funCount = function () {
                    var length = document.validate.getLength(element);
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
                element.addEventListener('input', funCount);
                // 一开始就计数
                funCount();
                // 兼容模式下IE9删除的时候不会触发input事件
                if (!history.pushState) {
                    element.addEventListener('blur', funCount);
                }
            });

            return this;
        }
    });

    /**
     * 表单内一些元素体验增强处理
     * 私有方法
     * @return {Object} 返回当前实例
     */
    Object.defineProperty(Validate.prototype, 'enhance', {
        value: function () {
            var eleForm = this.element.form;

            eleForm.querySelectorAll('input, textarea').forEach(function (element) {
                // 输入框类型
                var strAttrType = document.validate.getType(element);

                // 手机号码粘贴的优化处理
                if (/^checkbox|radio|range$/i.test(strAttrType) == false) {
                    element.addEventListener('paste', function (event) {
                        // 剪切板数据对象
                        // 输入框类型
                        var type = this.getAttribute('type') || this.type;
                        // 剪切板数据对象
                        var clipboardData = event.clipboardData || window.clipboardData;
                        // 粘贴内容
                        var paste = '';
                        // 剪切板对象可以获取
                        if (!clipboardData) {
                            return;
                        }
                        // 获取选中的文本内容
                        var textSelected = '';
                        if (window.getSelection) {
                            // 现代浏览器
                            // 直接window.getSelection().toString()对于IE的输入框无效
                            textSelected = this.value.slice(element.selectionStart, element.selectionEnd);
                        } else if (document.selection) {
                            // 旧IE浏览器
                            textSelected = document.selection.createRange().text;
                        }
                        // 只有输入框没有数据，或全选状态才处理
                        if (this.value.trim() == '' || textSelected === this.value) {
                            // 阻止冒泡和默认粘贴行为
                            event.preventDefault();
                            event.stopPropagation();
                            // 获取粘贴数据
                            paste = clipboardData.getData('text') || '';
                            // 进行如下处理
                            // 除非是password，其他都过滤前后空格
                            if (type != 'password') {
                                paste = paste.trim();
                            }
                            // 邮箱处理，可能会使用#代替@避免被爬虫抓取
                            if (type == 'email') {
                                paste = paste.replace('#', '@');
                            } else if (type == 'tel') {
                                // 手机号处理
                                paste = document.validate.getTel(paste);
                            }

                            // 插入
                            this.value = paste;

                            // 触发input事件
                            element.dispatchEvent(new CustomEvent('input'));
                        }
                    });
                }
            });
        }
    });

    /**
     * 表单即时验证的细节处理
     * @return {Object} 返回当前实例
     */
    Validate.prototype.immediate = function () {
        // 即时验证
        var eleForm = this.element.form;

        if (eleForm.isImmediated) {
            return this;
        }

        eleForm.querySelectorAll('input, select, textarea').forEach(function (element) {
            // type类型筛选
            var strType = element.type;
            var strAttrType = element.getAttribute('type');
            // 给每个控件绑定即时验证
            if (strType == 'button' || strType == 'submit' || strType == 'reset' || strType == 'file' || strType == 'image') {
                return;
            }

            // 不同类别不同事件
            if (strType == 'radio' || strType == 'checkbox') {
                element.addEventListener('click', function () {
                    if (this.params.immediate == false) {
                        return;
                    }
                    this.reportValidity(element);
                }.bind(this));
            } else if (/select/.test(strType) || /range|date|time|hour|minute|hidden/.test(strAttrType)) {
                element.addEventListener('change', function () {
                    if (this.params.immediate == false) {
                        return;
                    }
                    this.reportValidity(element);
                }.bind(this));
            } else {
                // 输入
                element.addEventListener('focus', function () {
                    if (this.params.immediate) {
                        setTimeout(function () {
                            document.validate.focusable = 0;

                            this.reportValidity(element);
                        }.bind(this), 20);
                    }
                }.bind(this));

                element.addEventListener('input', function () {
                    if (this.params.immediate == false) {
                        return;
                    }
                    // IE10+下有个bug
                    // focus placeholder变化时候，会触发input事件，我只能呵呵了
                    if (document.msHidden != undefined && element.value == '' && !element.lastValue && element.getAttribute('placeholder')) {
                        element.lastValue = element.value;

                        return;
                    }

                    document.validate.focusable = false;

                    this.reportValidity(element);

                    element.lastValue = element.value;
                }.bind(this));
            }
        }.bind(this));

        eleForm.isImmediated = true;

        return this;
    };

    /**
     * 表单所有元素验证通过的判断处理
     * @return {Boolean} 是否表单所有元素验证通过
     */
    Validate.prototype.checkValidity = function () {
        var eleForm = this.element.form;

        var isAllPass = true;

        document.validate.focusable = true;

        eleForm.querySelectorAll('input, select, textarea').forEach(function (element) {
            // 还没有出现不合法的验证
            if (isAllPass == true || this.params.multiple) {
                // multiple参数为true的时候，其他都要标红，但提示仅出现在第一个错误元素上
                var isPass = document.validate.styleError(element);

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
    };

    /**
     * 出错提示显示
     * @return {[type]} [description]
     */
    Validate.prototype.reportValidity = function (element, content) {
        if (element) {
            document.validate.reportValidity(element, content);
        }
    };

    return Validate;
}));
/**
 * @Pagination.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-26
 * @edit:    19-09-10 native js rewrite
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Pagination = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 分页组件
     * 支持new实例构造
     * eg new Pagination(element, options);
     **/
    // ui类名
    // 类名变量
    var CL = {
        add: function () {
            return ['ui-page'].concat([].slice.call(arguments)).join('-');
        },
        join: function () {
            return CL + ' ' + this.add.apply(this, arguments);
        },
        toString: function () {
            return 'ui-page';
        }
    };

    /**
     * Ajax分页组件
     * @param {[type]} element [description]
     * @param {[type]} options [description]
     */
    var Pagination = function (element, options) {
        // 默认参数
        var defaults = {
            // 总的数据量
            total: 0,
            // 当前的页码
            current: 1,
            // 每页显示的数目
            per: 15,
            // short 长分页还是短分页
            mode: 'long',
            // href也可以是动态Function
            href: null,
            onClick: function () {}
        };

        // 元素的获取与判断
        var elePagination = element;

        if (typeof element == 'string') {
            elePagination = document.querySelector(element);
        }

        // 如果分页容器元素不存在，隐藏
        if (elePagination) {
            // 参数还可以取自element元素
            var objParamsFromElement = {};
            for (var keyParam in defaults) {
                if (elePagination.hasAttribute(keyParam)) {
                    objParamsFromElement[keyParam] = element.getAttribute(keyParam);
                }
            }

            // 避如果已经初始化
            if (elePagination.data && elePagination.data.pagination) {
                return elePagination.data.pagination;
            }
        }

        // 可选参数整合
        var objParams = Object.assign({}, defaults, objParamsFromElement, options || {});

        // 数据的暴露
        this.params = Object.assign({}, objParams);

        // onClick作为callback暴露
        delete this.params.onClick;
        // 回调暴露
        this.callback = {
            click: objParams.onClick
        };
        // 元素暴露
        this.element = {
            container: elePagination,
            pagination: elePagination
        };

        // 前后分页使用的内联SVG代码
        this.svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"/></svg>';

        if (!elePagination) {
            return this;
        }

        // 事件
        this.events();

        // 呈现
        this.show();

        // 存储
        if (!elePagination.data) {
            elePagination.data = {};
        }
        elePagination.data.pagination = this;

        // 自定义元素的属性
        Object.keys(this.params).forEach(function (keyParam) {
            Object.defineProperty(elePagination, keyParam, {
                writeable: true,
                enumerable: true,
                get: function () {
                    return this.getAttribute(keyParam) || (function () {
                        if (this.data && this.data.pagination) {
                            return this.data.pagination.params[keyParam] || null;
                        }
                        return null;
                    })();
                },
                set: function (value) {
                    this.setAttribute(keyParam, value);
                    // 模板属性变化了，重渲染
                    if (this.data && this.data.pagination) {
                        this.data.pagination.params[keyParam] = value;
                        this.data.pagination.show();
                    }
                }
            });
        });
    };



    /**
     * 分页相关的事件处理
     * @return {[type]} [description]
     */
    Pagination.prototype.events = function () {
        var elePagination = this.element.pagination;

        // 委托点击事件
        elePagination.addEventListener('click', function (event) {
            // 一些元素
            var eleTarget = event.target;
            // 目标点击元素
            var eleClicked = eleTarget.closest('a');

            // 未获取到元素返回
            if (!eleClicked) {
                return;
            }

            var numCurrent = eleClicked.getAttribute('data-page');
            // 改变全局暴露的current值
            this.params.current = numCurrent * 1;

            // 当前的类名，onClick回调可以准确识别点击DOM元素
            var strClassName = eleClicked.className;

            // 分页刷新
            this.show();

            // 此时由于HTML刷新，原来的eleClicked元素已经不复存在
            // 因此需要重新获取一遍

            if (/prev/.test(strClassName)) {
                eleClicked = elePagination.querySelector('.' + CL.add('prev'));
            } else if (/next/.test(strClassName)) {
                eleClicked = elePagination.querySelector('.' + CL.add('next'));
            } else {
                eleClicked = elePagination.querySelector('.' + CL.add('current'));
            }

            // aria以及键盘访问
            if (eleClicked) {
                eleClicked.focus();

                if (window.isKeyEvent == false) {
                    eleClicked.blur();
                }

                if (/^javascript/.test(eleClicked.href)) {
                    event.preventDefault();
                }
            }

            this.callback.click.call(this, eleClicked, this.params.current);


        }.bind(this));
    };

    /**
     * 创建分页字符串的方法
     * @param  {Object} params  分页相关的数据对象
     * @param  {String} mode 分页的类型
     * @return {String}      返回拼接好的HTML字符串
     */
    Pagination.prototype.create = function () {
        var objParams = this.params;

        // 分页一些数据
        var numTotal = objParams.total * 1 || 0;
        var numCurrent = objParams.current * 1 || 1;
        var numPer = objParams.per * 1 || 1;

        // href的支持与处理
        var strOrFunHref = objParams.href || 'javascript:';

        var funHref = function (index) {
            if (typeof strOrFunHref == 'function') {
                return strOrFunHref(index);
            }
            return strOrFunHref.toString().replace('${current}', index);
        };

        // 计算总页数
        var numPageSize = Math.ceil(numTotal / numPer) || 1;

        // 分页HTML内容
        var strHtmlPage = '';

        // 1. 首先是通用的前后翻页
        if (numCurrent > 1) {
            strHtmlPage = strHtmlPage + '<a href="' +  funHref(numCurrent - 1) + '" class="' +  CL.join('prev') + '" data-page="' +  (numCurrent - 1) + '" aria-label="上一页，当前第' +  numCurrent + '页">' +  this.svg + '</a>';
        } else {
            // 当前是第一页，自然不能往前翻页
            strHtmlPage = strHtmlPage + '<span class="' + CL.join('prev') + '">' +  this.svg + '</span>';
        }

        // 2. 中间部分
        // 短分页和长分页
        var numVisible = 6;
        if (objParams.mode == 'long') {
            var funLong = function (numStart) {
                if (numStart == numCurrent) {
                    strHtmlPage = strHtmlPage + '<span class="' +  CL.join('current') + '" aria-label="第' +  numStart + '页，共' +  numPageSize + '页" aria-selected="true" role="option">' +  numStart + '</span>';
                } else {
                    strHtmlPage = strHtmlPage + '<a href="' +  funHref(numStart) + '" class="' +  CL + '" data-page="' +  numStart + '" aria-label="第' +  numStart + '页，共' +  numPageSize + '页">' +  numStart + '</a>';
                }
            };


            /**
             * 为了保证体验，在分页数量大的时候，要保证总条目数为7个
                假设页码总数20，规则如下
                当前是1: 则 1-5,... 20
                 2: 则 1-5,...,20
                 3: 则 1-5,...,20
                 4: 则 1-5,...,20
                 5: 则 1...456,...,20
                 ...

                 参见下面的else if的处理
             */
            if (numPageSize <= numVisible) {
                // 如果页面不大于6个，全部显示
                for (var start = 1; start <= numPageSize; start++) {
                    funLong(start);
                }
            } else if (numCurrent < numPageSize * 0.5 && numCurrent < numVisible - 1) {
                // 至少保证current的前后有数据
                if (numCurrent < numVisible - 1) {
                    for (start = 1; start < numVisible; start++) {
                        funLong(start);
                    }
                }
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                funLong(numPageSize);
            } else if (numCurrent > numPageSize * 0.5 && numCurrent > numPageSize - numVisible + 2) {
                funLong(1);
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                for (start = numPageSize - numVisible + 2; start <= numPageSize; start++) {
                    funLong(start);
                }
            } else {
                // 前后两处打点
                funLong(1);
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                funLong(numCurrent - 1);
                funLong(numCurrent);
                funLong(numCurrent + 1);
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                funLong(numPageSize);
            }

        } else if (objParams.mode == 'short') {
            strHtmlPage = strHtmlPage + '<span class="' +  CL.join('text') + '" aria-label="第' +  numCurrent + '页，共' +  numPageSize + '页" role="option">' +  [numCurrent, numPageSize].join('/') + '</span>';
        }

        // 3. 往后翻页
        if (numCurrent < numPageSize) {
            strHtmlPage = strHtmlPage + '<a href="' +  funHref(numCurrent + 1) + '" class="' +  CL.join('next') + '" data-page="' +  (numCurrent + 1) + '" aria-label="下一页，当前第' +  numCurrent + '页">' +  this.svg + '</a>';
        } else {
            strHtmlPage = strHtmlPage + '<span class="' +  CL.join('next') + '">' +  this.svg + '</span>';
        }

        return '<div class="' +  CL.add('x') + '">' + strHtmlPage + '</div>';
    };

    /**
     * 分页显示（也是刷新方法）
     * @return {Object} 返回当前实例
     */
    Pagination.prototype.show = function () {
        // 数据合法性处理
        var objParams = this.params;

        objParams.total = Math.max(objParams.total, 0);
        objParams.per = Math.max(objParams.per, 0);

        // current合法性处理
        var numMaxCurrent = Math.ceil(objParams.total / objParams.per);
        if (objParams.current > numMaxCurrent) {
            objParams.current = numMaxCurrent;
        } else if (objParams.current < 1) {
            objParams.current = 1;
        }

        // 更新分页的HTML内容
        this.element.pagination.innerHTML = this.create();

        return this;
    };

    /**
     * 分页数据刷新，根据元素属性变化
     * @return {[type]} [description]
     */
    Pagination.prototype.refresh = function () {
        var objParams = this.params;
        // 元素
        var elePagination = this.element.pagination;

        for (var keyParam in objParams) {
            if (elePagination.hasAttribute(keyParam)) {
                this.params[keyParam] = elePagination.getAttribute(keyParam);
            }
        }

        this.show();
    };

    /**
     * 支持自定义的<lu-pagination>元素
     * @return {[type]}   [description]
     */
    var funAutoInitAndWatching = function () {
        // 遍历页面上所有的<ui-pagination>元素
        document.querySelectorAll('ui-pagination').forEach(function (elePagination) {
            new Pagination(elePagination);
        });

        if (window.watching === false) {
            return;
        }
        // 同步更新分页内容的方法
        var funSyncRefresh = function (node) {
            if (node.nodeType != 1 || node.matches('ui-pagination') == false) {
                return;
            }
            // 元素
            var elePagination = node;
            // 实例对象
            var objPagination = elePagination.data && elePagination.data.pagination;
            // 有则刷新无则初始化
            if (!objPagination) {
                new Pagination(elePagination);
            } else {
                // 更新
                objPagination.refresh();
            }
        };

        // DOM Insert检测自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    if (mutation.type == 'childList') {
                        mutation.addedNodes.forEach(function (eleAdd) {
                            funSyncRefresh(eleAdd);
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
                funSyncRefresh(event.target);
            });
        }
    };

    // 监听-免初始绑定
    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }

    return Pagination;
}));
/**
 * @Table.js
 * @author   zhangxinxu
 * @version
 * @created  15-06-28
 * @edited   17-07-18 非模块化使用支持
 *           19-12-03 ES5原生语法支持
**/

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Drop = require('../ui/Drop');
        global.Pagination = require('../ui/Pagination');
        global.Loading = require('../ui/Loading');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Table = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Drop = this.Drop;
    var Pagination = this.Pagination;
    var Loading = this.Loading;

    if (typeof require == 'function') {
        if (!Pagination) {
            Pagination = require('common/ui/Pagination');
        }
        if (!Drop) {
            Drop = require('common/ui/Drop');
        }
        // 加载动效
        if (!Loading) {
            Loading = require('common/ui/Loading');
        }
    } else if (!Loading) {
        window.console.warn('suggest include Loading.js');
    }

    // 滚动到顶部缓动实现
    // rate表示缓动速率，默认是2
    window.scrollTopTo = function (top, callback) {
        var scrollTop = document.scrollingElement.scrollTop;
        var rate = 2;

        var funTop = function () {
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

    /**
     * 项目表格组件
     * @使用示例
     *  new Table($('#table'), {});
     */

    var LOADING = 'loading';

    var CHECKED = 'checked';
    var SELECTED = 'selected';

    // 一些元素类名
    var CL = {
        empty: 'table-null-x',
        // 错误
        error: 'table-error-x',
        // 加载
        loading: 'ui-loading',
        // 下面是分页相关的：
        //   总数据量
        total: 'table-page-total',
        //   每页系那是数目
        per: 'table-page-per',
        //   分页左侧容器
        data: 'table-page-data',
        //   分页列表（右侧）容器
        page: 'table-page',
        // 复选框选择器
        checkbox: '[type="checkbox"]'
    };

    // 表格
    var Table = function (element, options) {
        if (typeof element == 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return this;
        }

        if (element.data && element.data.table) {
            return element.data.table;
        }

        var defaultPageOptions = {
            // 总数据量
            total: 0,
            // 每页显示数目
            per: 15,
            // 当前的页数
            current: 1,

            // 与后台交互时候UI分页需要的参数和后台分页参数对应关系
            // 下面注释的是起点个人中心的接口对应关系
            // 其中key表示后台分页数据在那个接口名称下，例如，下面注释内容表示的JSON数据结构是：
            // {
            //     "code": 0,
            //     "data": {
            //         "pageInfo": {
            //             "pageIndex": 1,
            //             "pageSize": 20,
            //             "pageMax": 6,
            //             "totalCount": 113
            //          }
            //     }
            // }
            // keyMap: {
            //     key: 'pageInfo',
            //     total: 'totalCount',
            //     per: 'pageSize',
            //     current: 'pageIndex'
            // }
            // 下面这里未注释的是默认设定
            keyMap: {
                key: '',
                total: 'total',
                per: 'per',
                current: 'current'
            }
        };

        // 默认参数
        var defaults = {
            // 请求列表数据的Ajax参数
            // 默认dataType为'json'
            ajaxOptions: { },
            // 分页数目下拉内容
            pageList: [15, 30, 50],
            // 一般情况下，pageOptions参数都是使用默认值
            // 就算有分页字段名称调整，也建议修改defaultPageOptions中的关键字
            pageOptions: defaultPageOptions,
            // 对请求的JSON数据进行处理，并返回
            parse: function (data) {
                if (typeof data == 'string') {
                    return data;
                }

                return '';
            },
            // 列表内容显示的回调
            onShow: function () {},
            // 点击分页的回调
            // 如果存在，会替换本组件内置的分页Ajax处理
            // 经过N多年实践，此参数使用场景不多
            onPage: null,
            // 点击复选框的回调
            onCheck: function () {}
        };

        // 参数合并
        var objParams = Object.assign({}, defaults, options || {});

        // 分页合并
        if (options.pageOptions) {
            objParams.pageOptions = Object.assign({}, defaultPageOptions, options.pageOptions);
        }

        // 表格元素
        var eleTable = element;
        // 容器元素
        var eleContainer = eleTable.parentElement;
        // 空元素
        var eleEmpty = eleContainer.querySelector('.' + CL.empty);
        // loading元素
        var eleLoading = eleContainer.querySelector(CL.loading + ', .' + CL.loading);

        // 分页相关的元素
        var eleTotal = eleContainer.querySelector('.' + CL.total);
        var elePer = eleContainer.querySelector('.' + CL.per);
        var eleData = eleContainer.querySelector('.' + CL.data);
        var elePage = eleContainer.querySelector('.' + CL.page);

        // 元素之类
        this.element = {
            container: eleContainer,
            table: eleTable,
            empty: eleEmpty,
            loading: eleLoading,
            total: eleTotal,
            per: elePer,
            data: eleData,
            page: elePage
        };

        // 回调之类
        this.callback = {
            parse: objParams.parse,
            page: objParams.onPage,
            check: objParams.onCheck,
            show: objParams.onShow
        };

        // 数据之类
        this.params = {
            page: objParams.pageOptions,
            ajax: objParams.ajaxOptions,
            list: objParams.pageList
        };

        // ajax数据
        this.events();

        // 获得数据
        var eleTbody = eleTable.querySelector('tbody');
        if (!eleTbody) {
            window.console.error('<tbody>元素必需');
            return;
        }

        if (eleTbody.textContent.trim() == '') {
            this.isFirstAjax = true;
            this.ajax();
        } else {
            // 认为是列表第一页直出，
            // 这样的交互可以有更好体验
            this.page();
        }

        // 存储实例
        if (!eleTable.data) {
            eleTable.data = {};
        }
        eleTable.data.table = this;
    };


    /**
     * 列表解决方案中的事件处理
     * @return {[type]} [description]
     */
    Table.prototype.events = function () {
        // 实例暴露的参数
        var objParams = this.params;
        var objElement = this.element;
        var objCallback = this.callback;

        // 一些事件
        // 单复选框选中效果
        var eleTable = objElement.table;

        eleTable.addEventListener('click', function (event) {
            var eleCheckbox = event.target;

            if (!eleCheckbox || eleCheckbox.type != 'checkbox') {
                return;
            }

            var eleTr = eleCheckbox.closest('tr');

            // 如果不是第一td中的checkbox，忽略
            if (eleTr.querySelector(':first-child ' + CL.checkbox) !== eleCheckbox) {
                return;
            }

            // 获取所有的td标签中的复选框
            // 需要tr单元行显示，需要第一个子元素，需要可用
            var eleAllTdCheckbox = [];

            eleTable.querySelectorAll('tr').forEach(function (tr) {
                if (tr.clientWidth == 0) {
                    return;
                }

                var eleTdCheckbox = tr.querySelector('td:first-child ' + CL.checkbox + ':enabled');
                if (eleTdCheckbox) {
                    eleAllTdCheckbox.push(eleTdCheckbox);
                }
            });

            // 全选和非全选标志量
            var isAllChecked = false;
            var isAllUnchecked = false;
            // 全选
            var eleTh = eleCheckbox.closest('th');
            // 点击的是全选复选框
            if (eleTh) {
                isAllChecked = eleCheckbox[CHECKED];
                isAllUnchecked = !isAllChecked;
                // 下面所有的td复选框同步
                eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                    eleTdCheckbox[CHECKED] = isAllChecked;
                });
            } else {
                var numLengthChecked = [].slice.call(eleAllTdCheckbox).filter(function (eleTdCheckbox) {
                    return eleTdCheckbox[CHECKED];
                }).length;
                // 是否取消全选
                isAllChecked = (eleAllTdCheckbox.length == numLengthChecked);
                // 是否全部非选
                isAllUnchecked = (numLengthChecked == 0);
            }
            // 改变全选复选框的状态
            var eleThCheckbox = eleTable.querySelector('th:first-child ' + CL.checkbox);
            if (eleThCheckbox) {
                eleThCheckbox[CHECKED] = isAllChecked;
            }

            // 根据复选框状态决定表格行样式
            eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                eleTdCheckbox.closest('tr').classList[eleTdCheckbox[CHECKED] ? 'add' : 'remove'](SELECTED);
            });

            // 回调
            objCallback.check.call(this, isAllChecked, isAllUnchecked, eleCheckbox, eleAllTdCheckbox);

        }.bind(this));

        // 点击列表，只有不是a元素或者是复选框本事，选中当前复选框
        eleTable.addEventListener('click', function (event) {
            var eleTarget = event.target;
            var eleCheckbox = null;

            if (eleTarget && /^(?:a|input|textarea|tbody|i|select|label|th)$/i.test(eleTarget.tagName) == false) {
                eleCheckbox = eleTarget.closest('tr') && eleTarget.closest('tr').querySelector('td:first-child ' + CL.checkbox + ':enabled');
                if (eleCheckbox) {
                    eleCheckbox.click();
                }
            }
        });

        // 切换每页数目的dropList
        // 求得当前选中的分页数
        // 优先本地存储
        var strStoreId = eleTable.id;
        var numCurrentPer = objParams.page.per;
        var elePer = objElement.per;

        if (elePer) {
            if (strStoreId && window.localStorage && localStorage[strStoreId]) {
                numCurrentPer = localStorage[strStoreId];
                objParams.page.per = numCurrentPer;
            }
            // 赋值
            elePer.innerHTML = numCurrentPer;

            if (!Drop) {
                window.console.error('need Drop.js');
                return;
            }

            // 下拉
            this.dropList = new Drop(elePer).list(objParams.list.map(function (number) {
                return {
                    value: number
                };
            }), {
                width: 60,
                onSelect: function (data) {
                    var numPerNew = data.value;

                    // 记住当前选择的分页数
                    if (window.localStorage && strStoreId) {
                        localStorage[strStoreId] = numPerNew;
                    }

                    // 如果分页有变
                    if (objParams.page.per != numPerNew) {
                        // 改变分页数目
                        objParams.page.per = numPerNew;
                        // 当前页重置为1
                        objParams.page.current = 1;
                        // 重新刷新
                        this.ajax();
                    }
                }.bind(this)
            });
        }
    };


    /**
     * 列表数据请求
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    Table.prototype.ajax = function (options) {
        options = options || {};

        // 暴露的参数和元素
        var objParams = this.params;
        var objElement = this.element;
        var objCallback = this.callback;

        // 列表元素
        var eleTable = objElement.table;
        var eleContainer = objElement.container;

        // 避免重复请求
        if (eleTable.getAttribute('aria-busy') == 'true') {
            return this;
        }

        // 列表容器元素
        var eleTbody = eleTable.querySelector('tbody');

        // ajax请求参数
        var objAjax = Object.assign({}, objParams.ajax, options);

        // ajax地址是必需项
        if (!objAjax.url) {
            return this;
        }

        if (/^\/\//.test(objAjax.url)) {
            objAjax.url = location.protocol + objAjax.url;
        }

        // 1. ajax发送的data数据走合并策略
        var data = options.data || {};
        var dataOptions = objParams.ajax.data || {};

        if (typeof dataOptions == 'function') {
            dataOptions = dataOptions() || {};
        }

        // 发送给后台的分页数据的键值对
        var dataPage = {};
        var objKeyMap = objParams.page.keyMap;

        if (objKeyMap) {
            dataPage[objKeyMap['current']] = objParams.page.current;
            dataPage[objKeyMap['per']] = objParams.page.per;
        }

        // current和per数据的更新
        var objDataSend = Object.assign({}, dataPage, dataOptions, data);

        if (objKeyMap) {
            objParams.page.current = objDataSend[objKeyMap['current']];
            objParams.page.per = objDataSend[objKeyMap['per']];
        }

        // 2. url get请求地址合并
        var objAjaxParams = new URLSearchParams(objDataSend);
        // URL处理
        var strUrlAjax = objAjax.url;

        // 查询字符串的处理
        var strUrlSearch = '?';
        if (strUrlAjax.split('?').length > 1) {
            strUrlSearch = strUrlSearch + strUrlAjax.split('?')[1];
        }

        // URL拼接
        strUrlAjax = strUrlAjax.split('?')[0] + strUrlSearch + '&' + objAjaxParams.toString();

        // 3. 回调方法的处理
        // ajax发生错误的处理
        var funError = function (content) {
            var eleError = eleContainer.querySelector('.' + CL.error);

            if (!eleError) {
                eleError = document.createElement('div');
                eleError.className = CL.error;
                // 创建的错误元素插到列表的后面
                eleTable.insertAdjacentElement('afterend', eleError);

                objElement.error = eleError;
            }
            eleError.style.display = 'block';
            eleError.innerHTML = content || '数据没有获取成功';

            if (typeof objAjax.error == 'function') {
                objAjax.error();
            }
        };
        // 请求完成的事件处理
        var funComplete = function () {
            // 请求结束标志量
            eleTable.removeAttribute('aria-busy');
            // 去除中间的大loading
            if (objElement.loading) {
                objElement.loading.style.display = 'none';
            }

            // 去掉分页的小loading
            if (this.pagination) {
                var elePageLoading = this.pagination.element.container.querySelector('.' + LOADING);
                if (elePageLoading) {
                    elePageLoading.classList.remove(LOADING);
                }
            }
            if (typeof objAjax.complete == 'function') {
                objAjax.complete();
            }

            // 呈现与动画
            this.show();
        };

        // 执行Ajax请求的方法
        var funAjax = function () {
            // IE9不支持跨域
            if (!history.pushState && /\/\//.test(strUrlAjax) && strUrlAjax.split('//')[1].split('/')[0] != location.host) {
                funComplete.call(this);
                funError('当前浏览器不支持跨域数据请求');
                return;
            }

            // 请求执行
            var xhr = new XMLHttpRequest();
            // 使用GET方法拉取列表数据
            xhr.open('GET', strUrlAjax);
            // 请求完毕后的处理
            xhr.onload = function () {
                var json = {};

                try {
                    json = JSON.parse(xhr.responseText) || {};
                } catch (event) {
                    funComplete.call(this);
                    funError('解析异常，请稍后重试');
                    return;
                }

                // 出错处理
                // 0认为是成功
                // 关键字支持code或者error
                // { code: 0 } 或 { error: 0 } 都认为成功
                if (json.code !== 0 && json.error !== 0) {
                    funComplete.call(this);
                    funError(json.msg || '返回数据格式不符合要求');
                    return;
                }

                var strHtml = objCallback.parse(json);

                // 如果解析后无数据，显示空提示信息
                if (history.pushState) {
                    eleTbody.innerHTML = strHtml || '';
                } else {
                    // IE9 tbody不能直接innerHTML
                    var eleTemp = document.createElement('div');
                    eleTemp.innerHTML = '<table><tbody>' + (strHtml || '') + '</tbody></table>';

                    eleTbody.parentNode.replaceChild(eleTemp.firstChild.firstChild, eleTbody);
                }

                // 内容为空的处理
                var eleEmpty = objElement.empty;
                if (!strHtml || !strHtml.trim()) {
                    if (!eleEmpty) {
                        eleEmpty = document.createElement('div');
                        eleEmpty.className = CL.empty;
                        // 插入到列表元素后面
                        eleTable.insertAdjacentElement('afterend', eleEmpty);

                        objElement.empty = eleEmpty;
                    }
                    eleEmpty.style.display = 'block';
                }

                // 获得后端返回的分页总数
                var jsonKey = objKeyMap.key;
                // 总数目
                var numTotal;

                if (jsonKey) {
                    numTotal = json.data[jsonKey][objKeyMap['total']];
                } else {
                    numTotal = json.data[objKeyMap['total']];
                }

                // 修改总数值并显示
                if (numTotal || numTotal == 0) {
                    if (objElement.total) {
                        objElement.total.innerHTML = numTotal;
                    }

                    objParams.page.total = numTotal;
                }

                // 左侧切换分页数目元素显示
                if (objElement.data) {
                    objElement.data.style.display = 'block';
                }

                this.page();

                if (typeof objAjax.success == 'function') {
                    objAjax.success(json);
                }

                funComplete.call(this);
            }.bind(this);
            // 请求网络异常处理
            xhr.onerror = function () {
                funError('网络异常，数据没有获取成功，您可以稍后重试！');
                // 因为IE9不支持oncomplate，
                // 所以在onload和onerror方法中处理了
                funComplete.call(this);
            }.bind(this);

            xhr.send();

            // 标记输入框忙碌状态
            eleTable.setAttribute('aria-busy', 'true');
        };

        // 滚动到表格上边缘
        var numScrollTop = window.pageYOffset;

        // loading元素
        var eleLoading = objElement.loading;
        if (!eleLoading) {
            eleLoading = document.createElement('div');
            eleLoading.className = CL.loading;
            // 插入到列表元素后面
            eleTable.insertAdjacentElement('afterend', eleLoading);

            objElement.loading = eleLoading;
        }

        // 显示loading
        eleLoading.style.paddingBottom = '';

        if (window.getComputedStyle(eleLoading).display == 'none') {
            var eleThead = eleTable.querySelector('thead');

            eleLoading.style.height = (eleTable.clientHeight - (eleThead ? eleThead.clientHeight : 0)) + 'px';

            if (eleTbody.innerHTML.trim() == '') {
                eleLoading.style.height = '';
            }
        }

        // 微调圈圈的位置
        var numDistance = parseFloat(eleLoading.style.height) - window.innerHeight;

        // loading尺寸比浏览器窗口还大
        // 微调未知，使在窗体居中位置
        if (numDistance > 0) {
            eleLoading.style.paddingBottom = numDistance + 'px';
        }

        // loading显示
        eleLoading.style.display = 'block';

        // 其他元素隐藏
        if (objElement.empty) {
            objElement.empty.style.display = 'none';
        }
        if (objElement.error) {
            objElement.error.style.display = 'none';
        }

        eleTbody.innerHTML = '';

        // 请求走起
        // 判断是否需要先滚动
        var objBound = eleTable.getBoundingClientRect();
        // 第一次不定位
        if (!this.isFirstAjax && objBound.top < 0) {
            numScrollTop = objBound.top + numScrollTop;
            window.scrollTopTo(numScrollTop, function () {
                funAjax.call(this);
            }.bind(this));
        } else if (!this.isFirstAjax && objBound.top > window.innerHeight) {
            numScrollTop = numScrollTop - objBound.top;
            window.scrollTopTo(numScrollTop, function () {
                funAjax.call(this);
            }.bind(this));
        } else {
            funAjax.call(this);

            this.isFirstAjax = false;
        }

        return this;
    };

    /**
     * 分页的处理
     * @param  {[type]} total [description]
     * @return {[type]}       [description]
     */
    Table.prototype.page = function (total) {
        if (!this.element.page) {
            return this;
        }
        if (!Pagination) {
            window.console.error('need Pagination.js');
            return this;
        }
        var objPage = this.params.page;

        // 显示分页
        if (this.pagination) {
            this.pagination.params = Object.assign(this.pagination.params, objPage);
            this.pagination.show();
        } else {
            this.pagination = new Pagination(this.element.page, {
                total: total || objPage.total,
                current: objPage.current,
                per: objPage.per,
                mode: objPage.mode || 'long',
                onClick: function (eleClicked, numCurrent) {
                    // 更新分页
                    objPage.current = numCurrent;
                    // 自定义分页事件
                    if (typeof this.callback.page == 'function') {
                        this.callback.page.call(this, eleClicked, numCurrent);
                    } else {
                        // 显示小loading
                        eleClicked.classList.add(LOADING);

                        // ajax再次
                        this.ajax();
                    }
                }.bind(this)
            });
        }
    };

    /**
     * 列表请求完毕显示的方法
     * @return {[type]} [description]
     */
    Table.prototype.show = function () {
        // 显示loading
        if (this.element.loading) {
            this.element.loading.style.paddingBottom = '';
        }

        //没有全选
        var eleThCheckbox = this.element.table.querySelector('th:first-child ' + CL.checkbox);
        if (eleThCheckbox) {
            eleThCheckbox[CHECKED] = false;
        }

        // 列表显示的回调
        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this);
        }

        return this;
    };

    return Table;
}));
/**
 * @Form.js
 * @author zhangxinxu
 * @version
 * @created  16-03-01
 * @edited   19-12-02    ES5原生语法支持
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.LightTip = require('../ui/LightTip');
        global.Loading = require('../ui/Loading');
        global.Validate = require('../ui/Validate');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Form = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var LightTip = this.LightTip;
    var Loading = this.Loading;
    var Validate = this.Validate;
    // require
    if (typeof require == 'function') {
        // 轻tips
        if (!LightTip) {
            LightTip = require('common/ui/LightTip');
        }
        // 加载
        if (!Loading) {
            Loading = require('common/ui/Loading');
        }
        // 验证
        if (!Validate) {
            Validate = require('common/ui/Validate');
        }
    } else if (!Validate) {
        window.console.error('need Validate.js');

        return {};
    } else if (!LightTip) {
        window.console.error('need LightTip.js');

        return {};
    } else if (!Loading) {
        window.console.warn('need Loading.js');
    }

    /**
     * 表单解决方案组件
     * @使用示例
     *  new Form('#form', {}, {});
     */
    var DISABLED = 'disabled';

    // 表单
    var Form = function (element, optionCallback, optionValidate) {
        if (typeof element == 'string') {
            element = document.querySelector(element);
        }
        if (!element) {
            return this;
        }

        // 避免重复初始化
        if (element.data && element.data.form) {
            return element.data.form;
        }

        // optionCallback可以是对象也可以直接是成功回调
        /*
            optionCallback = {
                avoidSend: function () {},    // 验证成功之后，请求发送前的条件约束
                success: function () {},
                error: function () {},
                complete: function () {}
            };
        */
        optionCallback = optionCallback || function () {};
        if (typeof optionCallback == 'function') {
            optionCallback = {
                success: optionCallback
            };
        }

        optionValidate = optionValidate || {};

        // 表单元素
        var eleForm = element;
        // 通过submit按钮找到找到关联的我们肉眼所见的提交按钮
        var eleBtnSubmit = eleForm.querySelector('[type="submit"], [type="image"]');
        if (!eleBtnSubmit) {
            eleBtnSubmit = eleForm.querySelector('button:nth-of-last-type()');
        }

        if (!eleBtnSubmit) {
            return this;
        }

        // 下拉框的初始化
        if (window.autoInit === false) {
            // 下拉框
            eleForm.querySelectorAll('select').forEach(function (eleSelect) {
                if (eleSelect.refresh) {
                    eleSelect.refresh();
                }
            });
        }

        // 暴露的元素
        this.element = {
            form: eleForm,
            submit: eleBtnSubmit
        };

        // 回调方法们
        this.callback = optionCallback;

        // 绑定表单验证
        this.validate = new Validate(eleForm, function () {
            // 验证成功之后
            if (!optionCallback.avoidSend || !optionCallback.avoidSend.call(this, eleForm)) {
                this.ajax();
            }
        }.bind(this), optionValidate);

        if (!eleForm.data) {
            eleForm.data = {};
        }

        eleForm.data.form = this;

        return this;
    };

    /**
     * 表单提交的处理
     * @return {[type]} [description]
     */
    Form.prototype.ajax = function () {
        // 回调
        var optionCallback = this.callback;
        // 元素
        var eleForm = this.element.form;
        var eleButton = null;
        var eleSubmit = this.element.submit;

        // 我们肉眼所见的按钮，进行一些状态控制
        eleButton = eleSubmit.id && document.querySelector('label[for=' + eleSubmit.id + ']');
        if (!eleButton) {
            eleButton = eleSubmit;
        }
        this.element.button = eleButton;

        // 请求地址
        var strUrl = eleForm.action.split('#')[0] || location.href.split('#')[0];
        // 请求类型
        var strMethod = eleForm.method || 'POST';

        // IE9不支持cros跨域
        if (!history.pushState && new URL(strUrl).host != location.host) {
            new LightTip().error('当前浏览器不支持跨域数据请求。');
            return;
        }

        // 提交数据
        // 1. 菊花转起来
        eleButton.loading = true;
        // 2. 提交按钮禁用
        eleSubmit.setAttribute(DISABLED, DISABLED);

        // 3. 数据
        var objFormData = new FormData(eleForm);
        if (optionCallback.beforeSend) {
            optionCallback.beforeSend.call(this, xhr, objFormData);
        }
        // 请求类型不同，数据地址也不一样
        var strSearchParams = '';

        if (strMethod.toLowerCase() == 'get') {
            strSearchParams = new URLSearchParams(objFormData).toString();

            if (strUrl.split('?').length > 1) {
                strUrl = strUrl + '&' + strSearchParams;
            } else {
                strUrl = strUrl + '?' + strSearchParams;
            }
        }

        // 4. 请求走起来
        var xhr = new XMLHttpRequest();
        xhr.open(strMethod, strUrl);

        // 请求结束
        xhr.onload = function () {
            var json = {};

            try {
                json = JSON.parse(xhr.responseText);

                if (json && (json.code == 0 || json.error == 0)) {
                    // 成功回调
                    if (optionCallback.success) {
                        optionCallback.success.call(this, json);
                    } else {
                        // 如果没有成功回调，组件自己提示成功
                        new LightTip().success(json.msg || '操作成功。');
                    }
                } else {
                    new LightTip().error((json && json.msg) || '返回数据格式不符合要求。');

                    // 失败回调
                    if (optionCallback.error) {
                        optionCallback.error.call(this, json);
                    }
                }
            } catch (event) {
                new LightTip().error(json.msg || '返回数据解析出错。');
                // 回调
                if (optionCallback.error) {
                    optionCallback.error.call(this, event);
                }
            }

            funLoadend(json);
        }.bind(this);

        // 请求错误
        xhr.onerror = function () {
            new LightTip().error('网络异常，刚才的操作没有成功，您可以稍后重试。');
            // 回调
            if (optionCallback.error) {
                optionCallback.error.apply(this, arguments);
            }

            funLoadend();
        }.bind(this);


        // 请求结束，无论成功还是失败
        // xhr.onloadend IE9不支持，因此这里使用
        // 其他方法代替
        var funLoadend = function () {
            // 菊花关闭
            eleButton.loading = false;
            // 表单恢复提交
            eleSubmit.removeAttribute(DISABLED);
            // 回调
            if (optionCallback.complete) {
                optionCallback.complete.apply(this, arguments);
            }
        };

        xhr.send(objFormData);
    };

    /**
     * 执行表单的提交
     * @return {Object} 返回当前实例对象
     */
    Form.prototype.submit = function () {
        this.element.form.dispatchEvent(new CustomEvent('submit'));

        return this;
    };

    return Form;
}));