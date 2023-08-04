/**
 * @Keyboard.js
 * @author zhangxinxu
 * @version
 * Created: 17-06-13
 */
(function (doc, win) {
    if (win.isKeyEventBind || !doc.addEventListener) {
        return {};
    }

    /*
    ** HTML accesskey辅助增强脚本
    ** 作用包括：
    ** 1. 统一IE浏览器和其它浏览器的快捷访问行为；
    ** 2. 增加单独accesskey属性值对应按键按下的focus行为；
    ** 3. windows系统下Firefox也支持 Alt + key的访问能力；
    ** 4. 增加shift + '?'(keyCode=191)键的提示行为支持；
    */

    // 操作系统和浏览器设备检测
    var ua = navigator.platform || navigator.userAgent;

    var system = 'windows';

    if (/mac/i.test(ua)) {
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
        windows: {
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

    // accesskey键盘处理
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
        // windows下图下直接event.key就是按下的键对应的内容，但老的OS X系统却没有key属性，有的是event.keyIdentifier，表示字符的Unicode值
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
                // 延时目的是让后面的键盘高亮逻辑可以顺利执行
                setTimeout(function () {
                    arrElesOwnAccesskey[indexMatch].focus();
                }, 1);
                // 阻止内容输入
                event.preventDefault();
            }
        // 2. shift + '?'(keyCode=191)键的提示行为支持
        } else if (event.altKey == false && event.shiftKey == true && event.ctrlKey == false) {
            if (event.keyCode == 191 && !isTargetInputable) {
                doc.hasTipsShow ? removeTips() : tips(arrElesOwnAccesskey);
            }
        } else if (arrElesOwnAccesskey[indexMatch] && !isTargetInputable && (browser == 'ie' || browser == 'moz') && event.altKey && !event.shiftKey && !event.ctrlKey) {
            arrElesOwnAccesskey[indexMatch].click();
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
            ele.classList.add(className);
        },
        remove: function (ele) {
            ele.classList.remove(className);
        },
        removeAll: function () {
            [].slice.call(doc.querySelectorAll('.' + className)).forEach(function (ele) {
                classList.remove(ele);
            });
        },
        has: function (ele) {
            ele.classList.contains(className);
        }
    };

    // 是否是键盘事件
    var timerKeyEvent = null;
    win.isKeyEvent = false;

    doc.addEventListener('keydown', function (event) {
        win.isKeyEvent = true;

        clearTimeout(timerKeyEvent);

        timerKeyEvent = setTimeout(function () {
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
        if (keyName == 'enter' && (/^radio|checkbox$/i.test(trigger.type) || trigger.getAttribute('tabindex') == '0')) {
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

                eleFirstMatchAttrTarget = idEsc && doc.querySelector('[data-target="' + idEsc + '"],[data-target2="' + idEsc + '"],ui-drop[target="' + idEsc + '"]');

                if (eleFirstMatchAttrTarget && eleEsc.style.display !== 'none' && eleEsc.clientHeight > 0) {
                    if (eleFirstMatchAttrTarget.hide) {
                        eleFirstMatchAttrTarget.hide();
                    } else if (eleFirstMatchAttrTarget['ui-drop']) {
                        eleFirstMatchAttrTarget['ui-drop'].hide();
                    } else {
                        eleFirstMatchAttrTarget.click();
                    }
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
        // 当然，本身outline不是none
        if (target && target == eleActive && (/^radio|checkbox$/i.test(eleActive.type) || tabindex >= 0) && win.isKeyEvent == false && /none/.test(getComputedStyle(target).outline) == false) {
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
        if (/none|auto/.test(objStyleTarget.outlineStyle) && (!event.path || event.path[0] === target)) {
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
})(document, window);

/**
 * @Follow.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edited:  17-06-19
 * @edited: by littleLionGuoQing:  20-05-14 ES6
 * @edited:  2020-11-29 rewrite by zhangxinxu
 */


/**
 * 绝对定位元素的定位效果
 * 自动含边界判断
 * 可用在Drop, Tips等组件上
 * @example

 * 文档见：https://www.zhangxinxu.com/wordpress/?p=1328 position()方法
 **/

HTMLElement.prototype.follow = function (eleTarget, options) {
    // 默认参数值
    let defaults  = {
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

    let objParams = Object.assign({}, defaults, options);

    // eleTarget 非必须，可 eleTrigger 元素 html 属性指定
    if (!eleTarget) {
        let strTarget = this.getAttribute('is-follow') || this.dataset.target;
        if (!strTarget) {
            return;
        }
        eleTarget = document.getElementById(strTarget) || document.querySelector('.' + strTarget) || document.querySelector(strTarget);
        if (!eleTarget) {
            return;
        }
    }

    // 合法的位置关系数据
    let arrLegalPosition = ['4-1', '1-4', '5-7', '2-3', '2-1', '6-8', '3-4', '4-3', '8-6', '1-2', '7-5', '3-2'];

    // eleTrigger 元素属性指定 options，传入的 options 参数优先级更高
    // offsets
    let dataOffsets = this.dataset.offsets;
    let arrOffsets = [];
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

    let dataOffsetX = this.dataset.offsetX;
    let dataOffsetY = this.dataset.offsetY;

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
    let dataPosition = this.dataset.position;
    let dataAlign = this.dataset.align;
    // data-align是否符合合法位置关系
    let isDataAlignMatch = arrLegalPosition.some((strLegalPosition) => {
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
    let dataEdgeAdjust = this.dataset.edgeAdjust || objParams.edgeAdjust;
    // data-edge-adjust 字符串为 0、none、false 认为是 false，其他都是 true
    let isEdgeAdjust = !((dataEdgeAdjust === '0') || (dataEdgeAdjust === 'none') || (dataEdgeAdjust === 'false') || (dataEdgeAdjust === false));
    if (typeof dataEdgeAdjust == 'string' && typeof objParams.edgeAdjust != 'boolean') {
        objParams.edgeAdjust = isEdgeAdjust;
    }

    // 先绝对定位，以便获取更准确的尺寸
    let strOriginPosition = eleTarget.style.position;
    if (strOriginPosition != 'absolute') {
        eleTarget.style.position = 'absolute';
    }

    // 触发元素和目标元素的坐标数据
    let objBoundTrigger = this.getBoundingClientRect();
    let objBoundTarget = eleTarget.getBoundingClientRect();

    // 如果目标元素隐藏，则不处理
    if (objBoundTarget.width * objBoundTarget.height === 0) {
        eleTarget.style.position = strOriginPosition || '';
        window.console.warn((eleTarget.id ? 'id为' + eleTarget.id + '的' : '') + '目前元素尺寸为0，无法定位');
        return;
    }

    // 页面的水平和垂直滚动距离
    let numScrollTop = window.pageYOffset;
    let numScrollLeft = window.pageXOffset;

    // 浏览器窗口的尺寸
    let numWinWidth = window.innerWidth;
    let numWinHeight = window.innerHeight;

    // 如果trigger元素全部都在屏幕外，则不进行边缘调整
    if ((objBoundTrigger.left < 0 && objBoundTrigger.right < 0) || (objBoundTrigger.top < 0 && objBoundTrigger.bottom < 0) || (objBoundTrigger.left > numWinWidth && objBoundTrigger.right > numWinWidth) || (objBoundTrigger.top > numWinHeight && objBoundTrigger.bottom > numWinHeight)) {
        objParams.edgeAdjust = isEdgeAdjust = false;
    }

    // target的包含块祖先元素，也就是定位元素
    let eleOffsetParent = eleTarget.offsetParent;
    let objBoundOffsetParent = eleOffsetParent.getBoundingClientRect();

    // 暴露给实例
    const element = {
        follow: eleTarget
    };

    this.element = this.element ? Object.assign(this.element, element) : element;
    this.params = this.params ? Object.assign(this.params, objParams) : objParams;

    // 参数中设置的偏移位置
    let objOffsets = objParams.offsets;
    // target元素所在的offset偏移
    let numOffsetTop = objBoundOffsetParent.top + numScrollTop;
    let numOffsetLeft = objBoundOffsetParent.left + numScrollLeft;

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
    let strPosition = objParams.position;

    // 最终定位的left/top坐标
    let numTargetLeft, numTargetTop;

    // eleTarget元素zIndex实时最大化
    let zIndex = function () {
        // 返回eleTarget才是的样式计算对象
        let objStyleTarget = window.getComputedStyle(eleTarget);
        // 此时元素的层级
        let numZIndexTarget = Number(objStyleTarget.zIndex);
        // 用来对比的层级，也是最小层级
        let numZIndexNew = 19;

        // 只对同级子元素进行层级最大化计算处理
        eleOffsetParent.childNodes.forEach((eleChild) => {
            if (eleChild.nodeType !== 1) return;

            let objStyleChild = window.getComputedStyle(eleChild);

            let numZIndexChild = objStyleChild.zIndex * 1;

            if (numZIndexChild && eleTarget !== eleChild && objStyleChild.display !== 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew !== numZIndexTarget) {
            eleTarget.style.zIndex = numZIndexNew;
        }
    };

    // 如果直接指定了坐标
    if (typeof strPosition !== 'string' && strPosition.length === 2) {
        let arrPosition = strPosition;

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
        eleTarget.style.left = `${ numTargetLeft }px`;
        eleTarget.style.top = `${ numTargetTop }px`;
        // 记住定位标识码
        eleTarget.dataset.align = '3-1';

        // z-index自动最高
        zIndex();

        return;
    }


    // 是否对齐匹配的标志量
    // 遍历，以确定设定的对齐是否有匹配
    let isAlignMatch = arrLegalPosition.some((strLegalPosition) => {
        return strLegalPosition === strPosition;
    });

    // 如果没有匹配的对齐方式，使用默认的对齐方式
    if (isAlignMatch === false) {
        strPosition = defaults.position;
    }

    // 自动调整距离边缘的安全距离
    let arrSafeArea = this.dataset.safeArea || getComputedStyle(eleTarget).getPropertyValue('--safe-area') || objParams.safeArea;
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
    const objIsOverflow = {
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

    let strDirection = 'bottom';

    var funGetPosition = () => {
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
    eleTarget.style.left = `${ Math.round(numTargetLeft) }px`;
    eleTarget.style.top = `${ Math.round(numTargetTop) }px`;

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
        eleTarget.style.left = `${ Math.round(numTargetLeft) }px`;
        eleTarget.style.top = `${ Math.round(numTargetTop) }px`;
    }

    eleTarget.dataset.align = strPosition;
    eleTarget.dataset.direction = strDirection;

    // z-index自动最高
    zIndex();

    if (!eleTarget.zIndex) {
        eleTarget.zIndex = zIndex;
    }
};

[NodeList.prototype, HTMLCollection.prototype].forEach(prop => {
    prop.follow = function () {
        [...this].forEach(node => {
            if (node.nodeType === 1) {
                node.follow.apply(node, this.arguments);
            }
        });
    };
});

/**
 * @Pagination.js
 * @author sunmeiye
 * @version
 * @Created: 20-06-07
 * @edit:    20-06-07
 */

// ui tab custom HTML
class Tab extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }
    static get defaults () {
        return {
            eventType: 'click',
            history: false,
            autoplay: 3000
        };
    }
    constructor (trigger, options) {
        super();

        // 元素的获取
        let eleTrigger = null;
        if (typeof trigger == 'string') {
            eleTrigger = document.getElementById(trigger);
        } else if (typeof trigger == 'object') {
            if (trigger.tagName) {
                eleTrigger = trigger;
            } else if (!options) {
                options = trigger;
            }
        }

        options = options || {};

        if (eleTrigger) {
            // is-tab处理
            let strIsTab = eleTrigger.getAttribute('is-tab');
            // 必须有data-name值
            const strName = eleTrigger.dataset.name;
            // 上一项下一项
            if (strName && (strIsTab == 'prev' || strIsTab == 'next')) {
                eleTrigger.addEventListener('click', () => {
                    const eleTabGroup = document.querySelectorAll('ui-tab[name="' + strName + '"]');
                    const indexOpen = [...eleTabGroup].findIndex(eleTab => {
                        return eleTab.open;
                    });
                    if (strIsTab == 'prev') {
                        (eleTabGroup[indexOpen - 1] || eleTabGroup[eleTabGroup.length - 1]).switch();
                    } else {
                        (eleTabGroup[indexOpen + 1] || eleTabGroup[0]).switch();
                    }
                });
                // 如果是定时播放，暂停
                eleTrigger.addEventListener('mouseenter', () => {
                    document.querySelectorAll('ui-tab[name="' + strName + '"][autoplay]').forEach(eleTab => {
                        clearTimeout(eleTab.timer);
                    })
                });
                eleTrigger.addEventListener('mouseout', () => {
                    [...document.querySelectorAll('ui-tab[name="' + strName + '"][autoplay]')].some(eleTab => {
                        if (eleTab.open) {
                            eleTab.autoSwitch();
                            return true;
                        }
                    })
                });
                
                return;
            }

            let strTriggerId = eleTrigger.id;
            if (!strTriggerId) {
                strTriggerId = ('lulu_' + Math.random()).replace('0.', '');
                eleTrigger.id = strTriggerId;
                // for属性设置
                this.htmlFor = strTriggerId;
            }

            // 参数转移
            if (eleTrigger.getAttribute('name')) {
                this.name = eleTrigger.getAttribute('name');
            }
            if (eleTrigger.hasAttribute('open')) {
                this.open = true;
            }

            for (let paramsKey in Tab.defaults) {
                if (typeof eleTrigger.dataset[paramsKey.toLowerCase()] != 'undefined') {
                    this[paramsKey] = eleTrigger.dataset[paramsKey.toLowerCase()];
                } else if (typeof options[paramsKey] != 'undefined') {
                    this[paramsKey] = eleTrigger.dataset[paramsKey.toLowerCase()] = options[paramsKey];
                }
            }

            // target值也可以使用is-tab属性设置
            if (strIsTab && !eleTrigger.dataset.target) {
                eleTrigger.dataset.target = strIsTab;
            }

            // 非控件元素的键盘访问支持
            if (eleTrigger.tabIndex == -1) {
                eleTrigger.setAttribute('tabindex', 0);
            }
        }

        // 参数和元素设置的处理
        let objElement = this.element || {};

        // trigger和target元素的设置与获取
        this.element = new Proxy(objElement, {
            get: (target, prop) => {
                if (prop == 'target') {
                    let strIdTarget = this.target;
                    let eleTarget = null;
                    let eleTrigger = this.element.trigger;
                    if (!strIdTarget && eleTrigger) {
                        strIdTarget = eleTrigger.dataset.target || eleTrigger.getAttribute('href');

                        if (strIdTarget && /#/.test(strIdTarget)) {
                            strIdTarget = strIdTarget.split('#')[1];
                        }
                    }

                    // 对应的目标元素获取
                    if (strIdTarget) {
                        eleTarget = document.getElementById(strIdTarget);
                    }
                    return eleTarget;
                }

                if (prop == 'trigger') {
                    return (this.htmlFor && document.getElementById(this.htmlFor)) || this;
                }

                return target[prop];
            },
            set: (target, prop, value) => {
                if (typeof value == 'string') {
                    value = document.getElementById(value) || document.querySelector(value);
                }
                // 只有当value是节点元素时候才赋值
                if (value && typeof value.nodeType != 'number') {
                    return false;
                }

                // 元素赋值
                target[prop] = value;

                // target元素设置时候同时需要赋值
                if (prop == 'target' && value) {
                    let eleTarget = value;
                    let strId = eleTarget.id;
                    if (!strId) {
                        strId = ('lulu_' + Math.random()).replace('0.', '');
                        eleTarget.id = strId;
                    }

                    // 如果用户直接使用this.element.target赋值，则需要同步target属性值
                    if (this.element.trigger == this) {
                        // 此if判断可以避免死循环
                        if (this.target != strId) {
                            this.target = strId;
                        }
                    } else if (this.element.trigger) {
                        this.element.trigger.setAttribute('data-target', strId);
                    }
                }

                return true;
            }
        });

        // 参数设置
        // 在本组件中，作用较弱
        this.setParams(options);

        // 载入到页面
        if (eleTrigger && !this.parentElement && eleTrigger != this) {
            // 使用专门的div包裹，避免暴露过多的细节
            let eleHidden = document.querySelector('body > div[hidden="tab"]');
            if (!eleHidden) {
                eleHidden = document.createElement('div');
                eleHidden.setAttribute('hidden', 'tab');
                document.body.append(eleHidden);
            }
            eleHidden.append(this);
        }
    }
    get eventType () {
        let strEventType = this.getAttribute('eventtype') || Tab.defaults.eventType;
        if (strEventType == 'hover') {
            strEventType = 'mouseenter';
        }
        return strEventType;
    }
    set eventType (value) {
        this.setAttribute('eventtype', value);
    }
    get history () {
        return this.hasAttribute('history') || Tab.defaults.history;
    }
    set history (value) {
        this.toggleAttribute('history', value);
    }
    get autoplay () {
        let strAttrAutoplay = this.getAttribute('autoplay');
        if (typeof strAttrAutoplay !== 'string') {
            return false;
        }
        if (/^\d+$/.test(strAttrAutoplay)) {
            return strAttrAutoplay * 1;
        }

        return Tab.defaults.autoplay;
    }
    set autoplay (value) {
        if (!value && value !== '') {
            this.removeAttribute('autoplay');
        } else {
            this.setAttribute('autoplay', value);
        }
    }
    get name () {
        return this.getAttribute('name');
    }
    set name (value) {
        this.setAttribute('name', value);
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (v) {
        // 设置属性
        this.setAttribute('for', v);
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get open () {
        return this.hasAttribute('open');
    }
    set open (value) {
        this.toggleAttribute('open', value);
    }

    // 参数批量设置
    setParams (options) {
        this.params = this.params || {};
        options = options || {};

        Object.assign(this.params, options);
    }

    switch () {
        let strName = this.name;
        let eleTabGroup = [];
        // 对应选项卡显示的处理
        if (strName) {
            eleTabGroup = document.querySelectorAll('ui-tab[name="' + strName + '"]');

            if (!this.open) {
                eleTabGroup.forEach(tab => {
                    if (tab.open) {
                        tab.open = false;
                    }
                });
                this.open = true;
            }
        } else {
            this.open = !this.open;
        }

        const location = window.location;

        // 历史记录的处理
        if (this.history == true && strName && /tab\d{10,16}/.test(strName) == false) {
            if (!this.element.target) {
                return;
            }
            let strId = this.element.target.id;

            // url地址查询键值对替换
            const objURLParams = new URLSearchParams(location.search);
            // 改变查询键值，有则替换，无则新增
            objURLParams.set(strName, strId);

            // hash优化，去除重复的hash
            let strHash = location.hash;
            if (strId == strHash) {
                location.hash = strHash = '';
            }

            // 改变当前URL
            window.history.replaceState(null, document.title, location.href.split('?')[0] + '?' + objURLParams.toString() + strHash);
        }
    }

    // 自动切换
    autoSwitch () {
        // 自动播放
        let numTimeAutoplay = this.autoplay;
        let strName = this.name;

        if (numTimeAutoplay && strName) {
            let eleTabGroup = document.querySelectorAll('ui-tab[name="' + strName + '"]');
            clearTimeout(this.timer);
            if (numTimeAutoplay && strName && eleTabGroup.length > 1) {
                let indexTab = [].slice.call(eleTabGroup).findIndex(tab => {
                    return tab == this;
                });
                indexTab++;
                if (indexTab >= eleTabGroup.length) {
                    indexTab = 0;
                }
                this.timer = setTimeout(() => {
                    eleTabGroup[indexTab].switch();
                    // 自动播放
                    eleTabGroup[indexTab].autoSwitch();
                }, numTimeAutoplay);
            }
        }
    }

    // 初始化tab事件
    events () {
        // hover事件的键盘访问支持
        if (this.eventType == 'mouseover' || this.eventType == 'mouseenter') {
            // 增加延时判断，避免误经过产生的不好体验
            this.element.trigger.addEventListener(this.eventType, () => {
                Tab.hoverTimer = setTimeout(() => {
                    this.switch();
                }, 150);
            }, false);
            // 如果快速移出，则不执行切换
            this.element.trigger.addEventListener(this.eventType.replace('over', 'out').replace('enter', 'leave'), () => {
                clearTimeout(Tab.hoverTimer);
            });
        }

        // 无论什么事件类型，都需要click事件兜底
        this.element.trigger.addEventListener('click', (event) => {
            if (/^(:?javas|#)/.test(event.target.getAttribute('href'))) {
                event.preventDefault();
            }
            this.switch();
        }, false);

        // 如果定时播放，鼠标经过暂停
        if (this.autoplay && this.name) {
            [this.element.trigger, this.element.target].forEach((ele) => {
                ele.addEventListener('mouseenter', () => {
                    clearTimeout(this.timer);
                });
                ele.addEventListener('mouseleave', () => {
                    this.autoSwitch();
                });
            });

            // 当前open选项卡开始准备自动播放
            let eleFirstOpenTab = document.querySelector('ui-tab[name="' + this.name + '"][open]');
            if (eleFirstOpenTab) {
                eleFirstOpenTab.autoSwitch();
            }
        }
    }

    // ui-tab元素在页面出现的时候
    connectedCallback () {
        if (!this.closest('a, button') && !this.querySelector('a, button')) {
            this.setAttribute('tabindex', '0');
        }
        let eleTarget = this.element.target;
        let eleTrigger = this.element.trigger;

        if (eleTrigger) {
            eleTrigger.setAttribute('role', 'tab');
        }
        if (eleTarget) {
            eleTarget.setAttribute('role', 'tabpanel');
        }
        // 事件
        this.events();

        // URL查询看看能不能获取到记录的选项卡状态信息
        let objURLParams = new URLSearchParams(window.location.search);
        objURLParams.forEach((value, key) => {
            if (eleTrigger && eleTarget && this.name == key && eleTarget.id == value && !eleTrigger.hasAttribute('open')) {
                eleTrigger.click();
            }
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-tab'
            }
        }));

        this.isConnectedCallback = true;

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

        // is-tab等类型初始化完毕标志事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('DOMContentLoaded'));

            if (eleTrigger.hasAttribute('is-tab')) {
                eleTrigger.dispatchEvent(new CustomEvent('connected', {
                    detail: {
                        type: 'ui-tab'
                    }
                }));
                // 设置定义完毕标志量
                eleTrigger.setAttribute('defined', '');
            }
        }
    }

    /**
     * open属性变化时候的变化
     * @param {*} name
     * @param {*} newValue
     * @param {*} oldValue
     */
    attributeChangedCallback (name, newValue, oldValue) {
        if (this.element && name === 'open' && typeof newValue != typeof oldValue) {
            const elePanel = this.element.target;
            if (!elePanel) {
                return;
            }
            if (this.open) {
                elePanel.classList.add('active');
                this.setAttribute('aria-selected', 'true');
                this.dispatchEvent(new CustomEvent('show', {
                    detail: {
                        type: 'ui-tab'
                    }
                }));
            } else {
                elePanel.classList.remove('active');
                this.setAttribute('aria-selected', 'false');
                this.dispatchEvent(new CustomEvent('hide', {
                    detail: {
                        type: 'ui-tab'
                    }
                }));
            }

            // is-tab等普通元素的open属性变化
            let eleTrigger = this.element.trigger;
            if (eleTrigger && eleTrigger != this) {
                eleTrigger.toggleAttribute('open', this.open);
            }

            // 内置选项卡划来划去效果
            if (eleTrigger && this.name && /ui-tab/.test(eleTrigger.className)) {
                eleTrigger.parentElement.style.setProperty('--ui-tab-width', eleTrigger.clientWidth);
                eleTrigger.parentElement.style.setProperty('--ui-tab-left', eleTrigger.offsetLeft);
            }

            // 无论选项卡切换还是隐藏，都会触发switch事件
            this.dispatchEvent(new CustomEvent('switch'));
        }
    }
}

// 扩展HTML元素tab的方法
NodeList.prototype.tab = function (options = {}) {
    const eleTabs = this;
    let strName = options.name || '';

    for (var eleTab of eleTabs) {
        if (!strName && eleTab.getAttribute('name')) {
            strName = eleTab.getAttribute('name');
        }
    }

    if (!strName) {
        strName = ('tab' + Math.random()).replace('0.', '');
    }

    for (let eleTab of eleTabs) {
        eleTab.setAttribute('name', strName);
        eleTab['ui-tab'] = new Tab(eleTab, options);
    }
};

// 定义ui-tab
if (!customElements.get('ui-tab')) {
    customElements.define('ui-tab', Tab);
}

window.Tab = Tab;


/**
 * 自动化
 */
(function () {

    /**
     *
     */
    function funAutoInitAndWatching () {
        document.querySelectorAll('[is-tab]').forEach(function (eleTab) {
            if (!eleTab['ui-tab']) {
                eleTab['ui-tab'] = new Tab(eleTab);
            }
        });
        var observerTab = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (eleAdd) {
                    if (!eleAdd.tagName) {
                        return;
                    }
                    if (eleAdd.hasAttribute('is-tab')) {
                        if (!eleAdd['ui-tab']) {
                            eleAdd['ui-tab'] = new Tab(eleAdd);
                        }
                    } else {
                        eleAdd.querySelectorAll('[is-tab]').forEach(function (eleTab) {
                            if (!eleTab['ui-tab']) {
                                eleTab['ui-tab'] = new Tab(eleTab);
                            }
                        });
                    }
                });
            });
        });

        observerTab.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }
})();

// 只有type=module的时候可以用，否则会报错
// export default Tab;
/*
 * @Select.js
 * @author liuwentao
 * @version
 * @Created: 2020-06-09
 * @edit: 2020-06-09
**/

class Select extends HTMLSelectElement {

    static get observedAttributes () {
        return ['multiple', 'disabled', 'width'];
    }

    constructor () {
        super();

        // 关联的元素们
        if (!this.element) {
            this.element = {
                button: null,
                combobox: null,
                datalist: null
            };
        }
        // 尺寸和属性变化的观察器
        this.observer = null;
        this.resizeObserver = null;

        // 重置原生的属性
        this.setProperty();
    }

    static addClass () {
        return ['ui', 'select'].concat([].slice.call(arguments)).join('-');
    }

    set multiple (value) {
        return this.toggleAttribute('multiple', Boolean(value));
    }
    get multiple () {
        return this.hasAttribute('multiple');
    }

    render () {
        this.create();
        this.refresh();
        this.events();
    }

    remove () {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
        if (this.element.combobox) {
            this.element.combobox.remove();
        }
    }

    getData () {
        if (!this.options.length) {
            return [{
                html: ''
            }];
        }
        // 所有分组元素
        let eleOptgroups = this.querySelectorAll('optgroup');
        // 如果有任意一个分组元素设置了label，那么就是标题分组
        // 如果只是optgroup标签包括，那么使用分隔线分隔
        let isIntent = !!this.querySelector('optgroup[label]');

        // 如果有分组
        if (eleOptgroups.length) {
            let arrData = [];

            eleOptgroups.forEach(optgroup => {
                arrData.push({
                    html: optgroup.label,
                    disabled: optgroup.disabled,
                    className: optgroup.className,
                    divide: !isIntent
                });

                optgroup.querySelectorAll('option').forEach(option => {
                    arrData.push({
                        html: option.innerHTML,
                        value: option.value,
                        selected: option.selected,
                        disabled: optgroup.disabled || option.disabled,
                        className: option.className,
                        intent: isIntent
                    });
                });
            });

            return arrData;
        }

        return [].slice.call(this.options).map(option => {
            return {
                html: option.innerHTML,
                value: option.value,
                selected: option.selected,
                disabled: option.disabled,
                className: option.className
            };
        });
    }

    // 获取<select>元素原始状态下的尺寸
    get width () {
        let strAttrWidth = this.getAttribute('width');
        // 如果是纯数字，则px为单位
        if (strAttrWidth && Number(strAttrWidth) === parseFloat(strAttrWidth)) {
            strAttrWidth = strAttrWidth + 'px';
        }
        return strAttrWidth;
    }

    set width (value) {
        if (/\d/.test(value) == false) {
            return;
        }
        this.setAttribute('width', value);
    }

    getWidth () {
        return this.style.width || this.width || this.offsetWidth + 'px';
    }
    setWidth () {
        if (this.element.combobox) {
            const width = this.getWidth();
            // 创建的下拉的尺寸设置
            this.element.combobox.style.width = width;

            this.style.transform = '';

            if (width.lastIndexOf('%') !== -1 && this.originPosition != 'absolute' && this.originPosition != 'fixed') {
                // 如果是百分比宽度
                // 同时原下拉框不是绝对定位
                // 则有可能尺寸不不对的，通过水平缩放调整下
                // 避免水平滚动的出现
                this.style.transform = `scaleX(${ this.parentElement.clientWidth * parseFloat(width) * 0.01 / this.offsetWidth })`;
            }
        }
    }

    create () {
        // 防止多次重复创建
        if (this.element && this.element.combobox) {
            return;
        }

        const strId = ('lulu_' + (this.id || Math.random())).replace('0.', '');

        // 创建的列表元素需要的类名
        const BUTTON_CLASS = Select.addClass('button');
        const DATALIST_CLASS = Select.addClass('datalist');

        // 原始下拉的定位属性
        let strOriginPosition = window.getComputedStyle(this).position;
        this.originPosition = strOriginPosition;

        // 滚动宽度
        var isCustomScroll = /windows/i.test(navigator.userAgent);

        // 直接插入对应的片段内容
        this.insertAdjacentHTML('afterend', `<div style="width: ${this.getWidth()}">
           ${!this.multiple ? `<a
                class="${BUTTON_CLASS}"
                data-target="${strId}"
                aria-owns="${strId}"
                aria-expanded="false"
                style="display: ${this.multiple ? 'none' : 'block'}"
                ${!this.disabled ? 'href="javascript:" ' : ''}
                role="button"
            /></a>` : '' }
           <ui-select-list id="${strId}" role="listbox" aria-expanded="false" class="${DATALIST_CLASS}" ${!this.multiple ? 'aria-hidden="true"' : ''} data-custom-scroll="${isCustomScroll}"></ui-select-list>
        </div>`);

        let eleCombobox = this.nextElementSibling;

        // 元素暴露出去
        Object.assign(this.element, {
            combobox: eleCombobox,
            button: eleCombobox.querySelector(`.${BUTTON_CLASS}`),
            datalist: eleCombobox.querySelector(`.${DATALIST_CLASS}`)
        });

        // 原始下拉框的层级和位置
        // 变成绝对定位，不占据任何空间
        if (strOriginPosition != 'fixed') {
            this.style.position = 'absolute';
        }

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    /**
     * 下拉内容的刷新
     * @param {Array} data 刷新列表数组项，可选
     */
    refresh (data) {
        // 是否多选
        const isMultiple = this.multiple;
        // 主要的几个元素
        const eleSelect = this;
        // 几个创建元素
        const eleCombobox = this.element.combobox;
        const eleButton = this.element.button;
        const eleDatalist = this.element.datalist;
        if (!eleDatalist) {
            return;
        }
        // id
        const strId = eleDatalist.id;

        // 获取当下下拉框的数据和状态
        data = data || this.getData();

        // 下拉组合框元素的样式
        // 把原<select>的样式复制过来，这样，类似 margin 等样式可以继承过来
        // 布局会更稳定
        eleCombobox.className = (`${eleSelect.className} ${Select.addClass()}`).trim();

        // 多选，高度需要同步，因为选项高度不确定
        // eleSelect.style.height 性能很高，offsetHeight会触发重绘，因此优先 style 对象 获取
        if (isMultiple) {
            eleCombobox.style.height = eleSelect.style.height || (eleSelect.offsetHeight + 'px');
        } else if (eleSelect[eleSelect.selectedIndex]) {
            // 按钮元素中的文案
            const strHtmlSelected = eleSelect[eleSelect.selectedIndex].innerHTML;
            // 按钮赋值
            eleButton.innerHTML = `<span class="${Select.addClass('text')}">${strHtmlSelected}</span><i class="${Select.addClass('icon')}" aria-hidden="true"></i>`;
        }
        // 列表内容的刷新
        let index = -1;
        eleDatalist.innerHTML = data.map((obj) => {
            let arrCl = [Select.addClass('datalist', 'li'), obj.className];
            if (obj.selected) arrCl.push('selected');
            if (obj.disabled) arrCl.push('disabled');

            // 如果有分隔线
            if (typeof obj.divide != 'undefined') {
                if (obj.divide) {
                    arrCl = [Select.addClass('datalist', 'hr'), obj.className];
                    return `<div class="${arrCl.join(' ')}"></div>`;
                }

                return `<div class="${arrCl.join(' ')}" role="heading">${obj.html}</div>`;
            }

            // 这才是有效的索引
            index++;

            // 如果有缩进
            if (obj.intent) {
                arrCl.push(Select.addClass('intent'));
            }

            // 如果没有项目内容
            if (!obj.html) {
                return `<span class="${arrCl.join(' ')} disabled"></span>`;
            }

            // 复选模式列表不参与无障碍访问识别，因此HTML相对简单
            if (isMultiple) {
                return `<a class="${arrCl.join(' ')}" data-index=${index}>${obj.html}</a>`;
            }

            // 单选模式返回内容
            return `<a
                ${obj.disabled ? '' : ' href="javascript:" '}
                class="${arrCl.join(' ')}"
                data-index=${index}
                data-target="${strId}"
                role="option"
                aria-selected="${obj.selected}"
            >${obj.html}</a>`;
        }).join('');
    }

    /**
     * 下拉的事件处理
     */
    events () {
        if (this.multiple) {
            this.createMultipleEvent();
        } else {
            this.createNormalEvent();
        }
    }

    /**
     * 下拉的层级处理
     */
    zIndex () {
        let eleTarget = this.element.datalist;
        // 返回eleTarget才是的样式计算对象
        let objStyleTarget = window.getComputedStyle(eleTarget);
        // 此时元素的层级
        let numZIndexTarget = Number(objStyleTarget.zIndex);
        // 用来对比的层级，也是最小层级
        let numZIndexNew = 19;

        // 只对同级子元素进行层级最大化计算处理
        document.body.childNodes.forEach((eleChild) => {
            if (eleChild.nodeType !== 1) return;

            let objStyleChild = window.getComputedStyle(eleChild);

            let numZIndexChild = objStyleChild.zIndex * 1;

            if (numZIndexChild && eleTarget !== eleChild && objStyleChild.display !== 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew !== numZIndexTarget) {
            eleTarget.style.zIndex = numZIndexNew;
        }
    }

    /**
     * 定位
     */
    position () {
        const objElement = this.element;
        let eleCombobox = objElement.combobox;
        let eleButton = objElement.button;
        let eleDatalist = objElement.datalist;

        if (!eleCombobox.classList.contains('active')) {
            return;
        }

        // 按钮的尺寸和位置
        let objBoundButton = eleButton.getBoundingClientRect();
        // 下拉列表的尺寸和位置设置
        eleDatalist.style.left = (objBoundButton.left + document.scrollingElement.scrollLeft) + 'px';
        eleDatalist.style.top = (objBoundButton.bottom + document.scrollingElement.scrollTop - 1) + 'px';
        eleDatalist.style.width = eleCombobox.getBoundingClientRect().width + 'px';
        // 列表显示
        eleDatalist.classList.add('active');
        // 层级
        this.zIndex();

        // 边界判断
        let objBoundDatalist = eleDatalist.getBoundingClientRect();
        var isOverflow = objBoundDatalist.bottom + window.pageYOffset > Math.max(document.body.clientHeight, window.innerHeight);
        eleCombobox.classList[isOverflow ? 'add' : 'remove']('reverse');

        if (isOverflow) {
            eleDatalist.style.top = (objBoundButton.top + document.scrollingElement.scrollTop - objBoundDatalist.height + 1) + 'px';
        }
    }

    /**
     * 单选下拉框的事件
     */
    createNormalEvent () {
        const objElement = this.element;
        let eleCombobox = objElement.combobox;
        let eleButton = objElement.button;
        let eleDatalist = objElement.datalist;

        // 点击按钮
        eleButton.addEventListener('click', () => {
            // 如果下拉被禁用则不处理
            if (this.disabled) {
                return false;
            }
            // 显示与隐藏
            eleCombobox.classList.toggle('active');
            // 显示
            if (eleCombobox.classList.contains('active')) {
                document.body.appendChild(eleDatalist);
                // 定位
                this.position();
                
                // aria状态
                eleButton.setAttribute('aria-expanded', 'true');
                // 滚动与定位
                var arrDataScrollTop = eleCombobox.dataScrollTop;
                var eleDatalistSelected = eleDatalist.querySelector('.selected');

                // 严格验证
                if (arrDataScrollTop && eleDatalistSelected && arrDataScrollTop[1] === eleDatalistSelected.getAttribute('data-index') && arrDataScrollTop[2] === eleDatalistSelected.innerText) {
                    eleDatalist.scrollTop = arrDataScrollTop[0];
                    // 重置
                    delete eleCombobox.dataScrollTop;
                }
            } else {
                eleCombobox.classList.remove('reverse');
                // aria状态
                eleButton.setAttribute('aria-expanded', 'false');
                // 隐藏列表
                eleDatalist.remove();
            }
        });

        eleDatalist.addEventListener('click', (event) => {
            var target = event.target;
            if (!target || !target.closest) {
                return;
            }
            // 点击的列表元素
            var eleList = target;
            // 对应的下拉<option>元素
            var eleOption = null;
            // 是否当前点击列表禁用
            var isDisabled = eleList.classList.contains('disabled');
            // 获取索引
            var indexOption = eleList.getAttribute('data-index');
            // 存储可能的滚动定位需要的数据
            var scrollTop = eleDatalist.scrollTop;

            eleCombobox.dataScrollTop = [scrollTop, indexOption, eleList.innerText];

            // 修改下拉选中项
            if (!isDisabled) {
                eleOption = this[indexOption];
                if (eleOption) {
                    eleOption.selected = true;
                }
            }
            // 下拉收起
            eleCombobox.classList.remove('active');
            eleButton.setAttribute('aria-expanded', 'false');
            eleDatalist.remove();
            
            // focus
            eleButton.focus();
            eleButton.blur();

            if (!isDisabled) {
                // 更新下拉框
                this.refresh();
                // 回调处理
                // 触发change事件
                this.dispatchEvent(new CustomEvent('change', {
                    'bubbles': true
                }));
            }
        });

        // 点击页面空白要隐藏
        // 测试表明，这里优化下可以提高40~50%性能
        // 优化方式为改为一次性委托委托
        if (!document.isSelectMouseEvent) {
            // 点击空白隐藏处理
            document.addEventListener('mouseup', (event) => {
                var target = event.target;
                if (!target) {
                    return;
                }
                // 识别此时的combobox
                const eleCombobox = document.querySelector('select+.ui-select.active');
                if (!eleCombobox) {
                    return;
                }

                // 对应的下拉元素
                const eleSelect = eleCombobox.previousElementSibling;
                const eleDatalist = eleSelect.element && eleSelect.element.datalist;
                if (!eleDatalist.contains(target) && !eleCombobox.contains(target)) {
                    eleCombobox.classList.remove('active');
                    eleCombobox.classList.remove('reverse');
                    eleDatalist.remove();
                }
            });

            // 防止事件2次绑定
            document.isSelectMouseEvent = true;
        }
    }

    /**
     * 多选下拉的事件处理
     */
    createMultipleEvent () {
        const eleDatalist = this.element.datalist;

        // 下拉多选
        // 键盘交互UI同步
        this.addEventListener('change', () => {
            this.refresh();
        });
        // 滚动同步
        this.addEventListener('scroll', () => {
            eleDatalist.scrollTop = this.scrollTop;
        });
        // hover穿透
        this.addEventListener('mousedown', () => {
            this.setAttribute('data-active', 'true');
        });
        this.addEventListener('mousemove', (event) => {
            if (this.getAttribute('data-active')) {
                this.refresh();
                return;
            }

            // 当前坐标元素
            var clientY = event.clientY;
            var clientX = event.clientX;

            // 匹配当前坐标的页面元素
            var elesFromPoint = document.elementsFromPoint(clientX, clientY);

            // 识别哪几个列表元素匹配坐标元素
            var eleListAll = eleDatalist.querySelectorAll('a');
            for (var indexList = 0; indexList < eleListAll.length; indexList++) {
                var eleList = eleListAll[indexList];
                // hover状态先还原
                eleList.removeAttribute('href');
                // 然后开始寻找匹配的列表元素
                if ([...elesFromPoint].includes(eleList)) {
                    if (!eleList.classList.contains('selected') && !eleList.classList.contains('disabled')) {
                        eleList.href = 'javascript:';
                    }
                    // 退出循环
                    // forEach无法中断，因此这里使用了for循环
                    break;
                }
            }
        });
        this.addEventListener('mouseout', () => {
            var eleListAllWithHref = eleDatalist.querySelectorAll('a[href]');
            eleListAllWithHref.forEach(function (eleList) {
                eleList.removeAttribute('href');
            });
        });
        document.addEventListener('mouseup', () => {
            this.removeAttribute('data-active');
        });
    }

    /**
     * 重置原生的属性
     */
    setProperty () {
        Object.defineProperty(this, 'value', {
            configurable: true,
            enumerable: true,
            writeable: true,
            get: () => {
                let valArr = [];
                [].slice.call(this.options).forEach((option) => {
                    if (option.selected) {
                        valArr.push(option.value);
                    }
                });
                return valArr.join();
            },
            set: (value) => {
                let isMatch = false;
                value = this.multiple ? value.split(',') : [value.toString()];
                [].slice.call(this.options).forEach((option) => {
                    // 单选框模式下，如果多个值匹配，让第一个选中
                    // 如果没有下面这句，会最后一个匹配的选中
                    if (!this.multiple && isMatch) return;
                    if (value.indexOf(option.value) !== -1) {
                        option.selected = isMatch = true;
                    } else if (this.multiple) {
                        option.selected = false;
                    }
                });
            }
        });

        const props = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
        Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', {
            ...props,
            set (v) {
                if (this.options[v]) {
                    this.options[v].selected = true;
                }
            }
        });
    }

    /**
     * <select>属性变化时候的处理
     * @param {String} name 变化的属性名称
     */
    attributeChangedCallback (name) {
        const eleButton = this.element.button;

        if (name === 'disabled') {
            if (!eleButton) return;
            if (this.disabled) {
                eleButton.removeAttribute('href');
            } else {
                eleButton.setAttribute('href', 'javascript:');
            }
        } else if (name === 'multiple') {
            if (this.element.combobox) {
                this.element.combobox.remove();
                this.render();
            }
        } else if (name == 'width') {
            this.setWidth();
        }
    }

    /**
     * is="ui-select" 元素载入到页面后
     */
    connectedCallback () {
        // 尚未完成初始化的弹框内的下拉不渲染
        const eleDialog = this.closest('dialog[is="ui-dialog"]')
        if (eleDialog && !eleDialog.button) {
            return;
        }
        // 观察
        this.observer = new MutationObserver((mutationsList) => {
            let isRefresh = true;
            mutationsList.forEach(mutation => {
                if (mutation.type == 'attributes' && mutation.target.hasAttribute('selected')) {
                    // setAttribute('selected') 并不一定能真正改变selected状态
                    // 因此这里重新设置一次
                    mutation.target.selected = true;
                    // 上面代码就会自动触发刷新，无需再执行一次
                    isRefresh = false;
                }
            });
            if (isRefresh) {
                this.refresh();
            }
        });
        this.resizeObserver = new ResizeObserver(() => {
            this.setWidth();
            this.position();
        });
        this.observer.observe(this, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['selected']
        });
        this.resizeObserver.observe(this);

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-select'
            }
        }));

        this.isConnectedCallback = true;

        // 渲染
        this.render();
    }

    /**
     * is="ui-select" 元素从页面移除后
     */
    disconnectedCallback () {
        if (!this.observer || !this.resizeObserver) {
            return;
        }
        this.remove();
        this.observer.disconnect();
        this.resizeObserver.disconnect();
    }
}

// option.selected 观察
const propOptionSelected = Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'selected');
Object.defineProperty(HTMLOptionElement.prototype, 'selected', {
    ...propOptionSelected,
    set (value) {
        propOptionSelected.set.call(this, value);

        // 重新渲染
        if (this.parentElement && this.parentElement.refresh) {
            this.parentElement.refresh();
        }
    }
});

// 自定义元素注册
if (!customElements.get('ui-select')) {
    customElements.define('ui-select', Select, {
        extends: 'select'
    });
}

/**
 * @Drop.js
 * @author zhangxinxu
 * @version
 * @created 15-06-30
 * @edited  20-07-08 edit by wanglei
 */

// import './Follow.js';

class Drop extends HTMLElement {

    static get observedAttributes () {
        return ['open', 'target'];
    }

    static get defaults () {
        return {
            eventtype: 'click',
            position: '7-5'
        };
    }

    /**
     * @param {Object} trigger 触发元素
     * @param {Object} target  显示的浮动定位元素
     * @param {Object} options 可选参数
     */
    constructor (eleTrigger, eleTarget, options) {
        super();

        // 参数的处理
        options = options || {};
        this.params = this.params || {};
        // 观察参数变化
        this.params = new Proxy(this.params, {
            get: (params, prop) => {
                if (!prop) {
                    return;
                }
                prop = prop.toLowerCase();

                let value = params[prop];
                let eleTrigger = this.element.trigger;

                if (typeof value == 'undefined') {
                    value = eleTrigger.getAttribute(prop) || eleTrigger.dataset[prop];

                    if (prop == 'width') {
                        if (eleTrigger !== this) {
                            value = eleTrigger.dataset[prop];
                        } else {
                            value = eleTrigger.getAttribute(prop);
                        }
                    }

                    // 部分参数如果没有，则使用默认的参数值
                    if (typeof value == 'undefined' && Drop.defaults[prop]) {
                        value = Drop.defaults[prop];
                    }
                }

                return value;
            },
            set: (params, prop, value) => {
                params[prop.toLowerCase()] = value;
                return true;
            }
        });

        let objElement = this.element || {};

        // trigger和target元素的设置与获取
        this.element = new Proxy(objElement, {
            get: (target, prop) => {
                if (prop == 'target') {
                    let strIdTarget = this.getAttribute('target');
                    let eleTarget = target[prop];
                    if (!eleTarget && strIdTarget) {
                        eleTarget = document.getElementById(strIdTarget);
                    }
                    return eleTarget;
                }

                if (prop == 'trigger') {
                    return target[prop] || this;
                }

                return target[prop];
            },
            set: (target, prop, value) => {
                if (typeof value == 'string') {
                    value = document.getElementById(value) || document.querySelector(value);
                }
                // 只有当value是节点元素时候才赋值
                if (value && typeof value.nodeType != 'number') {
                    return false;
                }

                // 元素赋值
                target[prop] = value;

                // target元素设置时候同时需要赋值
                if (prop == 'target' && value) {
                    let eleTarget = value;
                    let strId = eleTarget.id;
                    if (!strId) {
                        strId = ('lulu_' + Math.random()).replace('0.', '');
                        eleTarget.id = strId;
                    }

                    let eleTrigger = this.element.trigger;

                    // 如果用户直接使用this.element.target赋值，则需要同步target属性值
                    if (eleTrigger == this) {
                        // 此if判断可以避免死循环
                        if (this.target != strId) {
                            this.target = strId;
                        }
                    } else if (eleTrigger) {
                        let strAttrTarget = eleTrigger.dataset.target;
                        if (strAttrTarget && document.querySelector('datalist[id="' + strAttrTarget + '"]')) {
                            // 如果匹配的是<datalist>元素
                            eleTrigger.setAttribute('data-target2', strId);
                        } else {
                            eleTrigger.setAttribute('data-target', strId);
                        }
                    }
                }

                return true;
            }
        });

        // 开始参数设置
        // eleTrigger, eleTarget, options均可缺省
        [...arguments].forEach(function (argument) {
            if (typeof argument == 'object' && argument && !argument.tagName) {
                options = argument;
            }
        });

        if (eleTrigger) {
            this.element.trigger = eleTrigger;
        }

        // 此时的eleTrigger一定是元素，之前可能是选择器
        eleTrigger = this.element.trigger;
        // target的处理
        if (eleTrigger) {
            // target元素
            if (eleTarget && eleTarget !== options) {
                this.element.target = eleTarget;
            } else if (!eleTarget && eleTrigger.dataset && eleTrigger.dataset.target) {
                this.element.target = eleTrigger.dataset.target;
            }
        }

        // 参数设置
        this.setParams(options);

        // 如果默认open为true，则显示
        if (this.open) {
            if (document.readyState != 'loading') {
                this.show();
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    this.show();
                });
            }
        }

        if (eleTrigger !== this) {
            // 隐藏<ui-drop>元素细节
            this.addEventListener('connected', function () {
                this.remove();
            });

            eleTrigger['ui-drop'] = this;

            document.body.append(this);
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (v) {
        // 设置属性
        this.setAttribute('for', v);
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get eventType () {
        return this.getAttribute('eventtype') || 'click';
    }
    set eventType (value) {
        this.setAttribute('eventtype', value);
    }

    get open () {
        return this.hasAttribute('open');
    }
    set open (value) {
        this.toggleAttribute('open', value);
    }

    // 设置参数方法
    setParams (options) {
        options = options || {};
        // 显示与隐藏的回调
        let funCallShow = options.onShow;
        let funCallHide = options.onHide;
        if (typeof funCallShow == 'function') {
            this.addEventListener('show', function (event) {
                funCallShow.call(this, event);
                // 自定义的显示方法需要重定位
                this.position();
            });

            delete options.onShow;
        }
        if (typeof funCallHide == 'function') {
            this.addEventListener('hide', function (event) {
                funCallHide.call(this, event);
            });

            delete options.onHide;
        }
        // 参数合并
        Object.assign(this.params, options || {});
    }

    /**
     * 下拉定位的事件处理
     * @return {[type]} [description]
     */
    events (isIgnoreTarget) {
        // 元素
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 如果没有target 并且不是无视没有target，返回
        if (!eleTarget && !isIgnoreTarget) {
            return;
        }

        if (eleTarget && eleTarget.matches('datalist')) {
            return;
        }

        // 参数
        const objParams = this.params;

        // 获取匹配选择器的eleTrigger子元素
        const funGetClosestChild = (element) => {
            if (!objParams.selector) {
                return null;
            }

            const eleClosestSelector = element.closest(objParams.selector);
            if (eleTrigger.contains(eleClosestSelector) == false) {
                return null;
            }

            return eleClosestSelector;
        };

        // 根据不同事件类型进行逻辑处理
        switch (objParams.eventType) {
            // 默认值，直接显示
            case 'null': {
                break;
            }
            case 'hover': case 'mouseover': case 'mouseenter': {
                // 如果不是无视target
                if (!eleTarget) {
                    setTimeout(() => {
                        // vue, react等框架渲染时候，target可能会滞后
                        // 所以加个定时器处理
                        if (this.element.target) {
                            this.events();
                        }
                    }, 1);
                    // 一定要返回，否则下面的会报错
                    // click事件可以不返回，因为target不存在也可以触发
                    return;
                }
                // hover处理需要增加延时
                eleTarget.timerHover = null;
                // 同时，从trigger移动到target也需要延时，
                // 因为两者可能有间隙，不能单纯移出就隐藏
                eleTarget.timerHold = null;
                // 此if逻辑用来避免事件重复绑定
                // 因为Panel或List方法会再次执行一遍events()方法
                if (!eleTrigger.isBindDropEvents) {
                    // 事件走起
                    eleTrigger.addEventListener('mouseover', event => {
                        // 不是在元素自身移动
                        if (event.relatedTarget !== event.target) {
                            // 委托查询
                            const eleClosestSelector = funGetClosestChild(event.target);

                            // 如果走委托
                            if (eleClosestSelector) {
                                // 改变trigger元素
                                this.element.trigger = eleClosestSelector;
                            }

                            // 显示定时器
                            if (!objParams.selector || eleClosestSelector) {
                                // 显示的定时器
                                eleTarget.timerHover = setTimeout(() => {
                                    this.show();
                                }, 150);

                                // 去除隐藏的定时器
                                clearTimeout(eleTarget.timerHold);
                            }
                        }
                    });

                    eleTrigger.addEventListener('mouseout', (event) => {
                        // 这个 if 判断主要是兼容设置了 options.selector 参数的场景
                        // 避免容器元素鼠标移出的时候才隐藏，因为是容器内委托的元素移除隐藏
                        if (this.element.trigger == event.target || this.element.trigger.contains(event.target)) {
                            // 清除显示的定时器
                            clearTimeout(eleTarget.timerHover);
                            // 隐藏的定时器
                            eleTarget.timerHold = setTimeout(() => {
                                this.hide();
                            }, 200);
                        }
                    });

                    if (eleTarget && !eleTarget.isBindDropHover) {
                        eleTarget.addEventListener('mouseenter', () => {
                            // 去除隐藏的定时器
                            clearTimeout(eleTarget.timerHold);
                        });
                        eleTarget.addEventListener('mouseleave', () => {
                            // 隐藏
                            eleTarget.timerHold = setTimeout(() => {
                                // 需要触发元素也是hover类型
                                let eleRelatedTrigger = eleTarget.element.trigger;
                                // eleRelatedTrigger是<ui-drop>元素
                                if (eleRelatedTrigger && eleRelatedTrigger.eventType == 'hover') {
                                    eleRelatedTrigger.hide();
                                }
                            }, 100);
                        });

                        eleTarget.isBindDropHover = true;
                    }

                    // 键盘支持，原本使用focus事件，但并不利于键盘交互
                    eleTrigger.addEventListener('click', event => {
                        // window.isKeyEvent表示是否键盘触发，来自Keyboard.js
                        if (!window.isKeyEvent) {
                            return;
                        }

                        event.preventDefault();

                        const eleClosestSelector = funGetClosestChild(event.target);
                        // 如果走委托
                        if (eleClosestSelector) {
                            // 改变trigger元素
                            this.element.trigger = eleClosestSelector;
                        }

                        // 显示定时器
                        if (!objParams.selector || eleClosestSelector) {
                            // 点击即显示
                            if (!this.open) {
                                this.show();
                            } else {
                                this.hide();
                            }
                        }
                    });

                    // 统一设置事件类型为hover
                    if (this.eventType != 'hover') {
                        this.eventType = 'hover';
                    }
                }

                break;
            }

            // 点击或者右键
            case 'click': case 'contextmenu': {
                if (!eleTrigger.isBindDropEvents || eleTrigger.isBindDropEvents !== objParams.eventType) {
                    eleTrigger.addEventListener(objParams.eventType, event => {
                        event.preventDefault();
                        // aria支持
                        // 获得委托的选择器匹配元素
                        const eleClosestSelector = funGetClosestChild(event.target);

                        if (eleClosestSelector) {
                            // 改变trigger元素
                            this.element.trigger = eleClosestSelector;
                        }

                        // 点击即显示
                        if (!objParams.selector || eleClosestSelector) {
                            // 连续右键点击保持显示，非显隐切换
                            if (objParams.eventType == 'contextmenu') {
                                objParams.position = [event.pageX, event.pageY];
                                this.show();

                                return;
                            }

                            if (!this.open) {
                                this.show();
                            } else {
                                this.hide();
                            }
                        }
                    });
                }

                break;
            }

            default: {
                break;
            }
        }

        // 点击页面空白区域隐藏
        if (objParams.eventType != 'null' && !eleTrigger.isBindDocMouseUp) {
            document.addEventListener('mouseup', event => {
                let eleClicked = event && event.target;

                if (!eleClicked || !this.open) {
                    return;
                }

                // 因为trigger和target可能动态变化
                // 因此这里再次获取一遍
                let eleTrigger = this.element.trigger;
                let eleTarget = this.element.target;

                if (eleTrigger.contains(eleClicked) == false && (!eleTarget || eleTarget.contains(eleClicked) == false)) {
                    this.hide();
                }
            });

            eleTrigger.isBindDocMouseUp = true;
        }

        eleTrigger.isBindDropEvents = objParams.eventType || true;

        // 窗体尺寸改变生活的重定位
        window.addEventListener('resize', () => {
            this.position();
        });

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    /**
     * 下拉定位处理
     * @return {Object} 返回当前自定义元素
     */
    position () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 下拉必须是显示状态才执行定位处理
        if (this.open && eleTarget && window.getComputedStyle(eleTrigger).display != 'none') {
            eleTrigger.follow(eleTarget, {
                offsets: this.params.offsets,
                position: this.params.position,
                edgeAdjust: this.params.edgeAdjust
            });
        }

        return this;
    }

    /**
     * 下拉的显示处理
     * @return {Object} 返回当前自定义元素
     */
    show () {
        // target需要在页面中
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 如果target在内存中，append到页面上
        if (eleTarget && document.body.contains(eleTarget) == false) {
            document.body.appendChild(eleTarget);
        }

        if (eleTarget) {
            // 进行定位
            eleTarget.style.position = 'absolute';
            eleTarget.style.display = 'inline';
            // 键盘ESC隐藏支持
            eleTarget.classList.add('ESC');
            eleTarget.tabIndex = -1;
            // 焦点转移到浮层元素上
            eleTarget.focus({
                preventScroll: true
            });

            // 标记target此时对应的trigger元素
            eleTarget.element = eleTarget.element || {};
            eleTarget.element.trigger = this;
        }
        // aria
        eleTrigger.setAttribute('aria-expanded', 'true');

        // 改变显示标志量
        if (!this.open) {
            this.open = true;
        }

        // 定位
        this.position();

        // 触发自定义事件 - show
        this.dispatchEvent(new CustomEvent('show'));

        // 如果trigger元素非<ui-drop>元素，则也触发一下，同时传递show事件来源
        // 因为一个普通的HTML元素可能会LuLu ui不同的组件触发'show'事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }

    /**
     * 下拉的隐藏处理
     * @return {Object} 返回当前自定义元素
     */
    hide () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 隐藏下拉面板
        if (eleTarget) {
            eleTarget.style.display = 'none';
            eleTarget.classList.remove('ESC');
            // 取消target元素上的trigger关联
            // 因为一个target元素可以关联多个trigger
            if (eleTarget.element) {
                delete eleTarget.element.trigger;
            }
        }

        // aria
        eleTrigger.setAttribute('aria-expanded', 'false');

        if (window.isKeyEvent) {
            eleTrigger.focus();
        }

        // 更改显示标志量
        if (this.open) {
            this.open = false;
        }

        // 触发自定义事件 - hide
        this.dispatchEvent(new CustomEvent('hide'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('hide', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }


    /**
     * drop 拓展list
     * @date 2019-11-01
     * @returns {object} 返回当前自定义元素
     * 兼容以下几种语法
     * new Drop().list(eleTrigger, data);
     * new Drop().list(eleTrigger, data, options);
     * new Drop(eleTrigger).list(data, options);
     * new Drop(eleTrigger, options).list(data);
     */
    list (eleTrigger, data, options) {
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
    }

    /**
     * drop 拓展panel
     * @date 2019-11-01
     * 兼容以下两种语法
     * new Drop().panel(eleTrigger, options);
     * new Drop(eleTrigger).panel(options);
     * new Drop(eleTrigger).panel(eleTarget);
     * @returns {object} 返回当前自定义元素
     */
    panel (eleTrigger, options) {
        // 不同类型参数的处理
        if (arguments.length === 2) {
            eleTrigger = arguments[0];
            options = arguments[1];
        } else if (arguments.length === 1) {
            options = arguments[0];

            if (options.matches && options.matches('dialog')) {
                let eleTarget = options;
                // 按钮信息
                let strButtons = eleTarget.dataset.buttons;
                var arrButtons = [];
                // 如果data-buttons为空字符串，或者是 null、false, 则不显示按钮
                if (strButtons !== '' && strButtons !== 'null' && strButtons !== 'false') {
                    strButtons = strButtons || '';
                    arrButtons = [{
                        value: strButtons.split(',')[0].trim(),
                        events: () => {
                            eleTarget.dispatchEvent(new CustomEvent('ensure', {
                                detail: {
                                    drop: this
                                }
                            }));
                        }
                    }, {
                        value: (strButtons.split(',')[1] || '').trim(),
                        events: () => {
                            eleTarget.dispatchEvent(new CustomEvent('cancel', {
                                detail: {
                                    drop: this
                                }
                            }));
                            this.hide();
                        }
                    }];
                }

                options = {
                    content: eleTarget.innerHTML,
                    title: eleTarget.title,
                    buttons: arrButtons
                };
            }

            eleTrigger = null;
        }
        if (typeof eleTrigger === 'string') {
            eleTrigger = document.querySelector(eleTrigger);
        }

        eleTrigger = eleTrigger || this.element.trigger;

        if (!eleTrigger) {
            return this;
        }

        options = options || {};

        // 支持从 trigger 元素上获取部分参数
        ['width', 'eventType', 'selector', 'offsets', 'position'].forEach(function (strKey) {
            let strAttrKey = eleTrigger.getAttribute(strKey) || eleTrigger.dataset[strKey];
            if (strAttrKey && typeof options[strKey] == 'undefined') {
                options[strKey] = strAttrKey;
            }
        });

        const defaults = {
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
            onShow: () => { },
            onHide: () => { }
        };

        // Drop 配置
        const objParams = Object.assign({}, defaults, options);

        // ui类名
        // 类名变量
        // 样式类名统一处理
        const CL = {
            add: function () {
                return ['ui-dropanel'].concat([].slice.call(arguments)).join('-');
            },
            toString: () => {
                return 'ui-dropanel';
            }
        };

        // 面板容器
        const elePanel = document.createElement('div');
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
        const eleTitle = document.createElement('h5');
        eleTitle.className = CL.add('title');
        eleTitle.innerHTML = objParams.title;

        // close button
        const eleClose = document.createElement('button');
        eleClose.setAttribute('aria-label', '关闭');
        eleClose.className = CL.add('close');

        // content
        const eleContent = document.createElement('content');
        eleContent.className = CL.add('content');
        eleContent.innerHTML = objParams.content;

        // footer
        const eleFooter = document.createElement('div');
        eleFooter.className = CL.add('footer');

        // 组装
        elePanel.appendChild(eleTitle);
        elePanel.appendChild(eleClose);
        elePanel.appendChild(eleContent);
        elePanel.appendChild(eleFooter);

        // 初始化
        this.setParams({
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
            trigger: eleTrigger,
            target: elePanel,
            panel: elePanel,
            title: eleTitle,
            close: eleClose,
            content: eleContent,
            footer: eleFooter
        });

        // 事件初始化
        this.events();

        // 绑定事件
        // 关闭事件
        eleClose.addEventListener('click', () => {
            this.hide();
        }, false);

        // 按钮
        objParams.buttons.forEach((objBtn, numIndex) => {
            // 避免btn为null等值报错
            objBtn = objBtn || {};
            // 按钮的默认参数
            let strType = objBtn.type || '';
            if (!strType && numIndex == 0) {
                strType =  objParams.buttons.length > 1 ? 'danger' : 'primary';
            }
            let strValue = objBtn.value;
            if (!strValue) {
                strValue = ['确定', '取消'][numIndex];
            }

            // 如果没有指定事件，则认为是关闭行为
            let objEvents = objBtn.events || {
                click: () => {
                    this.hide();
                }
            };

            // 如果没有指定事件类型，直接是函数
            // 则认为是点击事件
            if (typeof objEvents === 'function') {
                objEvents = {
                    click: objEvents
                };
            }

            let eleBtn = null;

            // 普通按钮
            if (objBtn['for']) {
                eleBtn = document.createElement('label');
                eleBtn.setAttribute('for', objBtn['for']);
                eleBtn.setAttribute('role', 'button');
            } else if (objBtn.form) {
                eleBtn.setAttribute('form', objBtn.form);
                eleBtn.type = 'submit';
            } else {
                eleBtn = document.createElement('button');
                this.element['button' + numIndex] = eleBtn;
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

            for (let strEventType in objEvents) {
                eleBtn.addEventListener(strEventType, event => {
                    event.drop = this;
                    objEvents[strEventType](event);
                }, false);
            }
            this.element.footer.appendChild(eleBtn);
        });

        return this;
    }

    /**
     * <ui-drop>元素进入页面中的时候
    **/
    connectedCallback () {
        let eleTarget = this.element.target;
        let eleTrigger = this.element.trigger;

        // 默认的aria状态设置
        if (eleTrigger.open) {
            eleTrigger.setAttribute('aria-expanded', 'true');
        } else {
            eleTrigger.setAttribute('aria-expanded', 'false');
        }

        // 页面中的<ui-drop>元素如果没有target
        // 强制绑定事件，这样<ui-drop>元素可以实现open切换效果
        if (!eleTarget) {
            this.events(eleTrigger === this);
        } else if (eleTarget.matches('datalist')) {
            this.list(eleTarget);
        } else if (eleTarget.matches('dialog')) {
            this.panel(eleTarget);
        } else {
            this.events();
        }

        // 无障碍访问设置
        if (!this.querySelector('a, button') && !this.closest('a, button')) {
            this.tabIndex = 0;
            this.role = 'button';
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-drop'
            }
        }));

        if (eleTrigger != this && eleTrigger.hasAttribute('is-drop')) {
            eleTrigger.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-drop'
                }
            }));

            // 设置定义完毕标志量
            eleTrigger.setAttribute('defined', '');
        }

        this.isConnectedCallback = true;
    }

    // open属性变化的时候
    attributeChangedCallback (name, oldValue, newValue) {
        if (name == 'target') {
            let eleTarget = document.getElementById(newValue);
            if (eleTarget) {
                this.element.target = eleTarget;
            }
        } else if (name == 'open') {
            let strAriaExpanded = this.element.trigger.getAttribute('aria-expanded');
            if (this.open && strAriaExpanded == 'false') {
                this.show();
            } else if (!this.open && strAriaExpanded == 'true') {
                this.hide();
            }
        }
    }
}

window.Drop = Drop;

if (!customElements.get('ui-drop')) {
    customElements.define('ui-drop', Drop);
}

// 给 HTML 元素扩展 drop 方法
HTMLElement.prototype.drop = function (eleTarget, options) {
    if (!this.matches('ui-drop, [is-drop]') && !this['ui-drop']) {
        this['ui-drop'] = new Drop(this, eleTarget, options);
    }

    return this;
};


/**
 * 初始化所有包含is-drop属性的节点
 * 支持事件冒泡，当点击的元素或者祖先元素，设置了is-drop属性，则把is-drop的属性值作为下拉元素的id，并根据这个id值获取并显示下拉元素。
 */
const initAllIsDropAttrAction = (ele) => {
    const eleDrops = ele || document.querySelectorAll('[is-drop]');
    eleDrops.forEach(eleTrigger => {
        let eleTargetId = eleTrigger.getAttribute('is-drop');
        if (eleTargetId && !eleTrigger.dataset.target) {
            eleTrigger.dataset.target = eleTargetId;
        }
        // 基于data-target获取元素
        eleTargetId = eleTrigger.dataset.target;
        let eleTarget = eleTargetId && document.getElementById(eleTargetId);
        if (eleTarget) {
            eleTrigger['ui-drop'] = new Drop(eleTrigger, eleTarget);
        }
    });
};


/**
 * 初始化并监听页面包含is-drop属性的DOM节点变化
 */
const autoInitAndWatchingIsDropAttr = () => {
    // 先实例化已有is-drop属性的DOM节点，再监听后续的节点变化
    initAllIsDropAttrAction();

    const observer = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                if (!eleAdd.tagName) {
                    return;
                }
                if (eleAdd.hasAttribute('is-drop')) {
                    initAllIsDropAttrAction([eleAdd]);
                } else {
                    initAllIsDropAttrAction(eleAdd.querySelectorAll('[is-drop]'));
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

if (document.readyState != 'loading') {
    autoInitAndWatchingIsDropAttr();
} else {
    window.addEventListener('DOMContentLoaded', autoInitAndWatchingIsDropAttr);
}

// export default Drop;

/**
 * @Tips.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 * @edit:    17-06-19
 * @edit:    20-06-09 edit by y2x
 * @edit:    20-11-03 by zxx
 */
// import './Follow.js';

class Tips extends HTMLElement {
    static get observedAttributes () {
        return ['title', 'reverse', 'for', 'eventType', 'align'];
    }

    constructor (trigger, content, options) {
        super();

        // trigger可以是ID选择器
        if (typeof trigger == 'string' && /^#?\w+(?:[-_]\w+)*$/.test(trigger)) {
            trigger = document.getElementById(trigger.replace('#', ''));
        }

        if (trigger && trigger.tips) {
            trigger.tips(content, options);

            return trigger['ui-tips'];
        }

        this.target = null;
    }

    get title () {
        let strTitle = this.getAttribute('title');

        if (strTitle) {
            this.setAttribute('data-title', strTitle);
            // 移除浏览器默认的title，防止交互冲突
            this.removeAttribute('title');
        } else {
            strTitle = this.getAttribute('data-title') || '';
        }

        return strTitle;
    }

    set title (value) {
        this.setAttribute('data-title', value);
        // 屏幕阅读无障碍访问支持
        this.setAttribute('aria-label', value);
    }

    get reverse () {
        return this.getAttribute('reverse') !== null || this.classList.contains('reverse');
    }

    set reverse (value) {
        if (value) {
            this.setAttribute('reverse', '');
        } else {
            this.removeAttribute('reverse');
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (v) {
        this.setAttribute('for', v);
    }

    get align () {
        return this.getAttribute('align') || 'auto';
    }
    set align (v) {
        this.setAttribute('align', v);
    }

    get eventType () {
        return this.getAttribute('eventtype') || 'hover';
    }
    set eventType (v) {
        this.setAttribute('eventtype', v);
    }

    get trigger () {
        const htmlFor = this.htmlFor;

        let eleTrigger;
        if (htmlFor) {
            eleTrigger = document.getElementById(htmlFor);
        }

        return eleTrigger || this;
    }

    create () {
        let eleTrigger = this.trigger;
        let strContent = this.title;
        // eleTips元素不存在，则重新创建
        let eleTips = document.createElement('div');
        eleTips.classList.add('ui-tips-x');
        eleTips.innerHTML = strContent;

        // 屏幕阅读无障碍访问描述
        if (!eleTrigger.getAttribute('aria-label')) {
            // 创建随机id, aria需要
            const strRandomId = 'lulu_' + (Math.random() + '').replace('0.', '');
            eleTrigger.setAttribute('aria-labelledby', strRandomId);
        }

        // append到页面中
        document.body.appendChild(eleTips);
        this.target = eleTips;

        // DOM
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    show () {
        let eleTrigger = this.trigger;
        let strContent = this.title;

        if (this.target) {
            // 改变显示内容
            this.target.innerHTML = strContent;
        } else {
            this.create();
        }
        // 显示
        this.target.style.display = 'block';

        // 定位
        let strPosition = '5-7';
        // 定位只有5-7, 7-5, 6-8, 8-6这几种
        // 其中5-7是默认，提示在上方
        // 7-5是由'reverse'类名或参数决定的
        let strAlign = this.align;
        const isReverse = this.reverse;
        if (strAlign === 'auto') {
            strAlign = eleTrigger.dataset.align || eleTrigger.dataset.position || 'center';
        }

        // 关键字参数与位置
        if (strAlign === 'center') {
            strPosition = !isReverse ? '5-7' : '7-5';
        } else if (strAlign === 'left') {
            strPosition = !isReverse ? '1-4' : '4-1';
        } else if (strAlign === 'right') {
            strPosition = !isReverse ? '2-3' : '3-2';
        } else if (/^\d-\d$/.test(strAlign)) {
            strPosition = strAlign;
        }

        eleTrigger.follow(this.target, {
            // trigger-target
            position: strPosition,
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // 同时以CSS变量的形式设置 trigger 的宽度和高度
        this.target.style.setProperty('--ui-width', eleTrigger.offsetWidth);
        this.target.style.setProperty('--ui-height', eleTrigger.offsetHeight);

        // 显示的回调
        eleTrigger.dispatchEvent(new CustomEvent('show', {
            detail: {
                type: 'ui-tips'
            }
        }));
    }

    hide () {
        if (!this.target) {
            return;
        }
        this.target.style.display = 'none';
        this.trigger.dispatchEvent(new CustomEvent('hide', {
            detail: {
                type: 'ui-tips'
            }
        }));
    }

    events () {
        let eleTrigger = this.trigger;
        // hover显示延迟时间
        const numDelay = 100;
        // 设置定时器对象
        this.timerTips = null;
        this.handleMouseEnter = () => {
            this.timerTips = setTimeout(() => {
                this.show();
            }, numDelay);
        };
        this.handleMouseLeave = () => {
            clearTimeout(this.timerTips);
            // 隐藏提示
            this.hide();
        };
        this.handleFocus = () => {
            if (window.isKeyEvent) {
                this.show();
            }
        };
        this.handleMouseUp = (event) => {
            const eleTarget = event.target;
            if (!eleTrigger.contains(eleTarget) && !this.target.contains(eleTarget)) {
                this.hide();
            }
        };

        // 事件走起
        if (this.eventType === 'hover') {
            // 鼠标进入
            eleTrigger.addEventListener('mouseenter', this.handleMouseEnter);
            // 鼠标离开
            eleTrigger.addEventListener('mouseleave', this.handleMouseLeave);

            // 支持focus的显示与隐藏
            // 但是需要是键盘访问触发的focus
            eleTrigger.addEventListener('focus', this.handleFocus);
            // 元素失焦
            eleTrigger.addEventListener('blur', this.hide);
        } else if (this.eventType === 'click') {
            eleTrigger.addEventListener('click', this.show);
            // 关闭
            document.addEventListener('mouseup', this.handleMouseUp);
        } else {
            // 其他事件类型直接显示
            this.show();
        }
    }

    connectedCallback () {
        let eleTrigger = this.trigger;
        // format title
        eleTrigger.originTitle = this.title;

        if (this.isConnectedCallback) {
            return;
        }

        // 更语义
        // 非focusable元素使其focusable
        if (!/^a|input|button|area$/i.test(eleTrigger.tagName)) {
            eleTrigger.setAttribute('tabindex', '0');
            // 更语义
            eleTrigger.setAttribute('role', 'tooltip');
        }

        this.events();

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-tips'
            }
        }));

        if (eleTrigger != this && eleTrigger.hasAttribute('is-tips')) {
            eleTrigger.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-tips'
                }
            }));

            // 设置定义完毕标志量
            eleTrigger.setAttribute('defined', '');
        }

        this.isConnectedCallback = true;
    }
}

if (!customElements.get('ui-tips')) {
    customElements.define('ui-tips', Tips);
}

window.Tips = Tips;


/**
 * 给任意 dom 注入 tips 方法
 * @param options {eventType, align}
 */
HTMLElement.prototype.tips = function (content, options = {}) {
    // 如果是CSS驱动的tips提示效果
    if (this.getAttribute('is-tips') === 'css' || this.classList.contains('ui-tips')) {
        if (this.title) {
            this.setAttribute('data-title', this.title);
            this.setAttribute('aria-label', this.title);
            this.removeAttribute('title');
        }
        return;
    }

    if (typeof content != 'string') {
        options = content || {};
    }

    const isReverse = this.hasAttribute('reverse') || this.classList.contains('reverse');

    // 只调用一次
    if (this['ui-tips']) {
        this['ui-tips'].toggleAttribute('reverse', isReverse);
        // 显示与否的判断
        if (typeof options.eventType != 'undefined' && options.eventType != 'hover' && options.eventType != 'click') {
            this['ui-tips'].show();
        }
        return;
    }

    let eleTips = document.createElement('ui-tips');

    if (typeof content == 'string') {
        eleTips.title = content;
    } else {
        eleTips.title = this.getAttribute('title') || options.content || '';
    }

    // 是否反向的处理
    eleTips.toggleAttribute('reverse', isReverse);

    // 移除原始的标题
    this.removeAttribute('title');

    // custom trigger
    if (!this.id) {
        this.id = 'lulu_' + (Math.random() + '').replace('0.', '');
    }
    eleTips.htmlFor = this.id;

    if (options.eventType) {
        eleTips.eventType = options.eventType;
    }
    if (options.align) {
        eleTips.align = options.align;
    }

    this['ui-tips'] = eleTips;

    eleTips.addEventListener('connected', function () {
        this.remove();
    });
    document.body.appendChild(eleTips);
};

(function () {
    // 处理所有非 <ui-tips /> 的情况: .ui-tips, [is-tips="css"], [is-tips]
    let funTipsInitAndWatching = function () {
        const strSelector = '.ui-tips, [is-tips]';
        document.querySelectorAll(strSelector).forEach((item) => {
            if (item.tips) {
                item.tips();
            }
        });

        var observerTips = new MutationObserver(function (mutationsList) {
            mutationsList.forEach(function (mutation) {
                var nodeAdded = mutation.addedNodes;
                var nodeRemoved = mutation.removedNodes;
                if (nodeAdded.length) {
                    nodeAdded.forEach(function (eleAdd) {
                        if (!eleAdd.matches) {
                            return;
                        }
                        if (eleAdd.matches(strSelector)) {
                            eleAdd.tips();
                        } else {
                            eleAdd.querySelectorAll(strSelector).forEach(item => {
                                item.tips();
                            });
                        }
                    });
                }

                if (nodeRemoved.length) {
                    nodeRemoved.forEach(function (eleRemove) {
                        if (!eleRemove.matches) {
                            return;
                        }
                        // 删除对应的<ui-tips>元素，如果有
                        if (eleRemove['ui-tips'] && eleRemove['ui-tips'].target) {
                            eleRemove['ui-tips'].target.remove();
                        } else {
                            eleRemove.querySelectorAll(strSelector).forEach(function (item) {
                                if (item['ui-tips'] && item['ui-tips'].target) {
                                    item['ui-tips'].target.remove();
                                }
                            });
                        }
                    });
                }
            });
        });

        observerTips.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState != 'loading') {
        funTipsInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funTipsInitAndWatching);
    }
})();

// export default Tips;

/**
 * @LightTip.js
 * @author popeyesailorman(yangfan)
 * @version
 * @Created: 20-05-15
 * @edit: 20-05-15
 */

class LightTip extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }

    constructor () {
        super();

        if (arguments.length) {
            LightTip.custom.apply(this, arguments);
        }
    }

    get type () {
        return this.getAttribute('type');
    }

    get time () {
        let strTime = this.getAttribute('time');
        if (!isNaN(strTime) && !isNaN(parseFloat(strTime))) {
            return Number(strTime);
        }

        return 3000;
    }

    set type (value) {
        this.setAttribute('type', value);
    }

    set time (value) {
        this.setAttribute('time', value);
    }

    get open () {
        return this.hasAttribute('open');
    }

    set open (value) {
        this.toggleAttribute('open', value);
    }

    connectedCallback () {
        // 自定义元素设置 tabIndex=0 代表改元素可聚焦，并可通过键盘导航来聚焦到该元素
        this.setAttribute('tabIndex', 0);
        this.setAttribute('role', 'tooltip');

        if (!this.closeMode) {
            this.closeMode = 'hide';
        }

        // 点击组件本身或按键盘 esc/enter 键即可关闭组件
        this.addEventListener('click', () => {
            // 移除元素
            this[this.closeMode]();
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-lighttip'
            }
        }));

        this.isConnectedCallback = true;
    }

    attributeChangedCallback (name, oldValue, newValue) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open' && typeof oldValue !== typeof newValue) {
            if (typeof newValue === 'string') {
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    // 标志量，是否是因为时间到关闭
                    this.isTimeHide = true;
                    // 关闭提示
                    this[this.closeMode]();
                    this.position();
                }, this.time);

                this.setAttribute('data-tid', this.timer);
                this.classList.add('ESC');

                // 组件的 z-index 层级计算
                this.zIndex();

                // 组件的定位，不同的提示位置不重叠
                this.position();
            } else {
                this.classList.remove('ESC');
            }
            this.tabIndex();

            this.isTimeHide = null;
        }
    }

    zIndex () {
        // 只对<body>子元素进行层级最大化计算处理，这里lighttip默认的z-index值是19
        var numZIndexNew = 19;
        this.parentElement && [...this.parentElement.childNodes].forEach(function (eleChild) {
            if (eleChild.nodeType != 1) {
                return;
            }
            var objStyleChild = window.getComputedStyle(eleChild);
            var numZIndexChild = objStyleChild.zIndex * 1;
            if (numZIndexChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });
        this.style.zIndex = numZIndexNew;
    }

    // 定位处理
    position () {
        var elesOpen = [...document.querySelectorAll('ui-lighttip[open]:not([type="loading"])')];
        // 基于 data-tid 排序
        var elesOpenSort = elesOpen.sort(function (eleA, eleB) {
            return (eleA.getAttribute('data-tid') || 0) - (eleB.getAttribute('data-tid') || 0);
        });
        // 确定提示内容
        var objMatchText = {};
        var numIndex = -1;

        elesOpenSort.forEach((ele) => {
            let strText = ele.textContent;
            if (typeof objMatchText[strText] == 'undefined') {
                numIndex++;
                objMatchText[strText] = numIndex;
            }
            ele.style.setProperty('--ui-sort-index', objMatchText[strText]);
        });
    }

    // 新的元素层级总是最高
    tabIndex () {
        var eleContainer = this;
        var eleLastActive = LightTip.lastActiveElement;
        if (this.open == true) {
            var eleActiveElement = document.activeElement;
            
            // 键盘索引起始位置定位在提示元素上
            if (eleActiveElement && !eleActiveElement.closest('[keepfocus]')) {
                if (eleContainer !== eleActiveElement) {
                    LightTip.lastActiveElement = eleActiveElement;
                }
                
                eleContainer.focus();
            }
        } else if (eleLastActive && !eleLastActive.matches('body')) {
            // 获取焦点但不会定位
            eleLastActive.focus({
                preventScroll: true
            });
            // 如果不是键盘关闭提示，而是点击的话，之前的焦点元素失焦
            // 这里实现有问题，如果是时间到了自动关闭的话，这里不应该失焦
            if (!window.isKeyEvent && !this.isTimeHide) {
                eleLastActive.blur();
            }
            LightTip.lastActiveElement = null;
        }
        return this;
    }

    // success
    static success (text, time = 3000) {
        return this.custom(text, 'success', time);
    }
    // error
    static error (text, time = 3000) {
        return this.custom(text, 'error', time);
    }
    // normal
    static normal (text, time = 3000) {
        return this.custom(text, 'normal', time);
    }
    // loading
    static loading (text) {
        text = text || '正在加载中...';
        return this.custom(text, 'loading');
    }
    // 调用方法处理
    static custom (text = '', type, time) {
        // 如果是静态方法执行
        // 创建ui-lighttip自定义元素
        if (!this.matches || !this.matches('ui-lighttip')) {
            return LightTip.custom.apply(document.createElement('ui-lighttip'), arguments);
        }

        if (typeof text == 'object') {
            type = text;
            text = '';
        }

        if (typeof text != 'string') {
            return this;
        }

        this.closeMode = 'remove';

        // 如果传入的类型是object形式
        if (type && typeof type === 'object') {
            LightTip.custom.call(this, text, type.type, type.time);
            return;
        }
        // 如果type的类型是number，则赋值给time
        if (typeof type === 'number') {
            LightTip.custom.call(this, text, time, type);
            return;
        }

        if (type == 'loading') {
            if (!text) {
                text = '正在加载中...';
            }
            time = 999999;
        }

        if (time) {
            this.time = time;
        }
        if (type) {
            this.type = type;
        }

        this.innerHTML = text;
        // 提高无障碍
        if (type == 'success') {
            this.setAttribute('aria-lable', '操作成功');
        } else if (type == 'error') {
            this.setAttribute('aria-lable', '操作失败');
        }

        // append内存中创建的ui-lighttip元素
        if (!this.parentElement) {
            document.body.appendChild(this);

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }

        this.show();

        return this;
    }
    remove () {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
        this.open = false;
    }
    show () {
        if (this.time > 0) {
            this.open = true;
        }
    }
    hide () {
        this.open = false;
    }
}

if (!customElements.get('ui-lighttip')) {
    customElements.define('ui-lighttip', LightTip);
}

// 将该方法定义为 window 全局使用的方法
window.LightTip = LightTip;

// export default LightTip;


/**
 * @ErrorTip.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-01
 * @edited:  20-07-07 edit by peter.qiyuanhao
 */

// import './Follow.js';

class ErrorTip {
    static allHide (exclude) {
        ErrorTip.collectionErrorTip.forEach(obj => {
            if (exclude != obj) {
                obj.hide();
            }
        });
    }

    constructor (element, content, options) {
        const defaults = {
            unique: true,
            onShow: () => {},
            onHide: () => {}
        };

        // 参数
        const objParams = {
            ...defaults,
            ...options
        };

        // 显示字符内容的处理
        let strContent = content;

        // 支持Function类型
        if (typeof strContent == 'function') {
            strContent = strContent();
        }
        if (typeof strContent != 'string') {
            return this;
        }

        // 一些元素
        const eleTrigger = element;

        let objErrorTip = eleTrigger.data && eleTrigger.data.errorTip;
        // 如果当前元素之前有过出错提示实例，则重复使用，无需再构造
        if (objErrorTip) {
            objErrorTip.content = strContent;
            objErrorTip.callback = {
                show: objParams.onShow,
                hide: objParams.onHide
            };
            objErrorTip.element.tips.trigger = eleTrigger;
            objErrorTip.show();

            return this;
        }

        // eleTips指的是红色出错提示元素
        let eleTips;
        // 为了单出错提示模式下，所有的红色都能取消的处理
        // 所有提示过的实例对象合在一起隐藏
        let collectionErrorTip = ErrorTip.collectionErrorTip;
        // 全局的出错实例
        const objUniqueErrorTip = collectionErrorTip[collectionErrorTip.length - 1];

        // 如果是唯一模式，则看看全局出错的对象
        if (objParams.unique == true && objUniqueErrorTip) {
            // window.errorTip存储的是唯一的红色提示元素
            // 改变存储的触发元素
            eleTips = objUniqueErrorTip.element.tips;
        } else if (objParams.unique == false && eleTrigger.data && eleTrigger.data.errorTip) {
            eleTips = eleTrigger.data.errorTip.element.tips;
        } else {
            eleTips = this.create();
        }

        // 如果是唯一模式，全局存储
        if (objParams.unique == true && collectionErrorTip.includes(this) == false) {
            collectionErrorTip.push(this);
        }

        // 更新提示元素对应的触发元素
        eleTips.trigger = eleTrigger;

        this.element = {
            trigger: eleTrigger,
            tips: eleTips
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
    }

    /**
     * 红色出错提示元素的创建
     */
    create () {
        // 首次
        let eleTips = document.createElement('div');
        eleTips.className = 'ui-tips-x ui-tips-error';
        document.body.appendChild(eleTips);

        // 事件
        this.events(eleTips);

        return eleTips;
    }

    /**
     * 无论是键盘操作，还是按下，都隐藏出错提示
     * @param {Element} eleTips 表示创建的红色提示元素
     */
    events (eleTips) {
        // 任何键盘操作，点击，或者拉伸都会隐藏错误提示框
        document.addEventListener('keydown', (event) => {
            // ctrl/shift键不隐藏
            if (!/Control|Shift/i.test(event.code)) {
                ErrorTip.allHide(this);
                this.hide();
            }
        });

        document.addEventListener('mousedown', (event) => {
            const eleActiveElement = document.activeElement;

            const eleActiveTrigger = eleTips.trigger;
            const eleTarget = event.target;

            // 如果点击的就是触发的元素，且处于激活态，则忽略
            if (eleActiveElement && eleActiveTrigger && eleActiveElement == eleTarget &&
                eleActiveElement == eleActiveTrigger &&
                // 这个与Datalist.js关联
                !eleActiveTrigger.getAttribute('data-focus')
            ) {
                return;
            }

            ErrorTip.allHide(this);
            this.hide();
        });

        window.addEventListener('resize', () => {
            ErrorTip.allHide(this);
            this.hide();
        });
    }

    /**
     * 错误tips提示显示方法
     */
    show () {
        const objElement = this.element;
        // 触发元素和提示元素
        const eleTips = objElement.tips;
        const eleTrigger = objElement.trigger;

        // 修改content内容
        eleTips.innerHTML = this.content;

        // 提示元素显示
        eleTips.style.display = '';

        // 定位
        eleTrigger.follow(eleTips, {
            // trigger-target
            position: '5-7',
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // aria无障碍访问增强
        eleTrigger.setAttribute('aria-label', '错误提示：' + this.content);
        // 两个重要标志类名
        eleTrigger.toggleAttribute('is-error', true);
        eleTrigger.classList.add('valided');

        this.display = true;

        // 显示的回调
        if (this.callback && this.callback.show) {
            this.callback.show.call(this, eleTrigger, eleTips);
        }

        // 触发自定义的 show 事件
        eleTrigger.dispatchEvent(new CustomEvent('show', {
            detail: {
                type: 'ui-errortip',
                content: this.content
            }
        }));
    }

    /**
       * 错误tips提示隐藏方法
       * @return {Object}  返回当前实例对象
       */
    hide () {
        // 避免重复隐藏执行
        if (!this.display) {
            return;
        }

        const eleTips = this.element.tips;
        const eleTrigger = this.element.trigger;

        eleTrigger.removeAttribute('aria-label');
        eleTrigger.removeAttribute('is-error');

        eleTips.style.display = 'none';

        this.display = false;

        // 隐藏的回调
        if (this.callback && this.callback.hide) {
            this.callback.hide.call(this, eleTrigger, eleTips);
        }

        // 触发自定义的 hide 事件
        eleTrigger.dispatchEvent(new CustomEvent('hide', {
            detail: {
                type: 'ui-errortip'
            }
        }));
    }
}

ErrorTip.collectionErrorTip = [];

window.ErrorTip = ErrorTip;


/**
 * 给任意 dom 注入 errorTip 方法
 * @param content String
 * @param options { unique, onShow, onHide }
 */
HTMLElement.prototype.errorTip = function (content, options = {}) {
    new ErrorTip(this, content, options);

    return this;
};

// export default ErrorTip;

/**
 * @Loading.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-23
 * @Log: 2017-09-19 loading类名的添加基于标签，而非类名
 * @edit by littleLionGuoQing:  20-05-07  ES6、<ui-loading> web components组件 && 支持rows和size属性的设置和获取
 */

// import LightTip from './LightTip.js';

(() => {
    // 避免重复定义
    if ('loading' in HTMLElement.prototype) {
        return;
    }

    /**
     * 给HTML元素扩展一个loading属性
     */
    let LOADING = 'loading';
    let CL = 'ui-' + LOADING;
    Object.defineProperty(HTMLElement.prototype, 'loading', {
        configurable: true,
        enumerable: true,
        get () {
            return !!(this.classList.contains(CL) || this.matches(CL));
        },
        set (flag) {
            let action = 'remove';
            if (flag) {
                action = 'add';
                if (this.loading) {
                    return flag;
                }
            }
            let strClassButton = CL.replace(LOADING, 'button');
            if (this.classList.contains(strClassButton) || this.getAttribute('is') == strClassButton) {
                this.classList[action](LOADING);
            } else {
                this.classList[action](CL);
            }
        }
    });

    // loading 的分段展示
    let eleLightLoading = null;
    let timerLoading = null;
    Object.defineProperty(document, 'loading', {
        get () {
            return Boolean(eleLightLoading && document.querySelector('ui-lighttip[type=loading]'));
        },
        set (newValue) {
            if (newValue) {
                if (eleLightLoading) {
                    document.body.append(eleLightLoading);
                    // 这里需要设置open属性
                    eleLightLoading.open = true;
                } else {
                    eleLightLoading = new LightTip({
                        type: 'loading'
                    });
                }
                // loading 文字显示
                let numIndex = 0;
                let arrTips = ['正在加载中<ui-dot>...</ui-dot>', '仍在加载中<ui-dot>...</ui-dot>', '请再稍等片刻<ui-dot>...</ui-dot>'];
                if (typeof newValue == 'string') {
                    arrTips = [newValue];
                } else if (Array.isArray(newValue)) {
                    arrTips = newValue;
                }
                eleLightLoading.innerHTML = arrTips[numIndex];
                clearInterval(timerLoading);
                timerLoading = setInterval(() => {
                    numIndex++;
                    eleLightLoading.innerHTML = arrTips[numIndex] || arrTips[numIndex - 1];
                    if (numIndex >= arrTips.length - 1) {
                        clearInterval(timerLoading);
                    }
                }, 6000);
            } else {
                eleLightLoading && eleLightLoading.remove();
                clearInterval(timerLoading);
            }
        }
    });

})();

// <ui-loading> 自定义组件实现
class Loading extends HTMLElement {
    constructor () {
        super();
    }
    get size () {
        return this.getAttribute('size') || 2;
    }
    set size (value) {
        this.setAttribute('size', value);
    }
    get rows () {
        return this.getAttribute('rows');
    }
    set rows (value) {
        this.setAttribute('rows', value);
    }
}

if (!customElements.get('ui-loading')) {
    customElements.define('ui-loading', Loading);
}

/**
 * @Range.js
 * @author xboxyan
 * @version
 * @created: 20-04-30
 */

class XRange extends HTMLInputElement {

    static get observedAttributes () {
        return ['max', 'min', 'step', 'disabled'];
    }

    get defaultrange () {
        return this.getAttribute('range') || `${this.getAttribute('from') || this.min || 0},${this.getAttribute('to') || this.max || 100}`;
    }

    set multiple (value) {
        return this.toggleAttribute('multiple', value);
    }

    get multiple () {
        return this.getAttribute('multiple') !== null;
    }

    get from () {
        if (this.element && this.element.otherRange) {
            return Math.min(this.value, this.element.otherRange.value);
        }
        return '';
    }

    get to () {
        if (this.element && this.element.otherRange) {
            return Math.max(this.value, this.element.otherRange.value);
        }
        return '';
    }

    get range () {
        if (this.multiple) {
            return this.from + ',' + this.to;
        }
        return '';
    }

    get isFrom () {
        // 是否为起始range
        if (this.element && this.element.otherRange) {
            return this.value - this.element.otherRange.value < 0;
        }
        return false;
    }

    set from (v) {
        if (this.element && this.element.otherRange) {
            if (this.isFrom) {
                this.value = v;
            } else {
                this.element.otherRange.value = v;
            }
        }
    }

    set to (v) {
        if (this.element && this.element.otherRange) {
            if (!this.isFrom) {
                this.value = v;
            } else {
                this.element.otherRange.value = v;
            }
        }
    }

    set range (v) {
        if (this.multiple) {
            const [from, to] = v.split(',');
            this.to = to;
            this.from = from;
        }
    }

    connectedCallback () {
        this.tips = this.dataset.tips;
        // 一些事件
        this.addEventListener('input', this.render);
        this.addEventListener('change', this.change);
        this.addEventListener('touchstart', this.stopPropagation);

        this.element = this.element || {};
        // 区间选择
        if (this.multiple && !this.element.otherRange) {
            if (getComputedStyle(this.parentNode).position === 'static') {
                // 给父级添加一个定位，不然相对宽度会有问题
                this.parentNode.style.position = 'relative';
            }
            Object.assign(this.element, {
                otherRange: this.cloneNode(false),
            });
            this.element.otherRange.tips = this.tips;
            this.element.otherRange.element = {
                otherRange: this
            };
            this.before(this.element.otherRange);
            this.setAttribute('data-range', 'to');
            this.element.otherRange.setAttribute('data-range', 'from');
            this.range = this.defaultrange;
        }

        // CSS使用的是[is="ui-range"]控制的选择框样式，因此，该属性是必须的
        if (this.getAttribute('is') === null) {
            this.setAttribute('is', 'ui-range');
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-range'
            }
        }));

        this.isConnectedCallback = true;

        this.render();

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    disconnectedCallback () {
        this.removeEventListener('input', this.render);
        this.removeEventListener('change', this.change);
        this.removeEventListener('touchstart', this.stopPropagation);

        if (this.element && this.element.otherRange && !this.exchange) {
            this.element.otherRange.remove();
        }
    }

    stopPropagation (ev) {
        ev.stopPropagation();
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'disabled' && this.element && this.element.otherRange) {
                this.element.otherRange.disabled = newValue !== null;
            } else {
                this.render();
            }
        }
    }

    change () {
        if (!(this.element && this.element.otherRange)) {
            return;
        }
        // 保持html结构和视觉上一致，也就是初始值在前面，结束值在后面，如果不一致就调换位置，目的是为tab键切换正常
        const isLeft = !this.isFrom && this.nextElementSibling === this.element.otherRange;
        const isRight = this.isFrom && this.nextElementSibling !== this.element.otherRange;
        const isTop = !this.isFrom && this.nextElementSibling !== this.element.otherRange;
        const isBottom = this.isFrom && this.nextElementSibling === this.element.otherRange;
        if (isTop || isRight || isBottom || isLeft) {
            this.exchange = true;
            if (isTop || isRight) {
                this.element.otherRange.before(this);
                this.setAttribute('data-range', 'from');
                this.element.otherRange.setAttribute('data-range', 'to');
            } else {
                this.element.otherRange.after(this);
                this.setAttribute('data-range', 'to');
                this.element.otherRange.setAttribute('data-range', 'from');
            }
            this.exchange = false;
            this.focus();
        }
    }

    render () {
        const max = this.max || 100;
        const min = this.min || 0;
        this.style.setProperty('--percent', (this.value - min) / (max - min));

        if (typeof this.tips == 'string') {
            if (/^\d+$/.test(this.tips)) {
                this.dataset.tips = this.value;
            } else if (/^\${value}/.test(this.tips)) {
                this.dataset.tips = this.tips.replace(/\${value}/g, this.value);
            } else {
                this.dataset.tips = this.tips.replace(/\d+/, this.value);
            }
        }
        this.style.setProperty('--from', this.from);
        this.style.setProperty('--to', this.to);
        if (this.element && this.element.otherRange) {
            this.element.otherRange.style.setProperty('--from', this.from);
            this.element.otherRange.style.setProperty('--to', this.to);
        }
    }

    addEventListener (...par) {
        document.addEventListener.apply(this, par);
        if (this.element && this.element.otherRange) {
            document.addEventListener.apply(this.element.otherRange, par);
        }
    }
}


const props = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
Object.defineProperty(XRange.prototype, 'value', {
    ...props,
    set (v) {
        props.set.call(this, v);
        // 重新渲染
        this.render();
    }
});

if (!customElements.get('ui-range')) {
    customElements.define('ui-range', XRange, {
        extends: 'input'
    });
}

/**
 * @Color.js
 * @author zhangxinxu
 * @version
 * @created 16-06-03
 * @edited 20-07-16 @Gwokhov
 */

// import './Follow.js';

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
        hex = (hex || '').replace('#', '');

        if (hex.length == 3 || hex.length == 4) {
            hex = hex.split('').map(function (char) {
                return char + char;
            }).join('');
        }

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
        eleArrow.addEventListener('pointerdown', (event) => {
            event.preventDefault();

            objPosArrow.pageY = event.pageY;
            objPosArrow.top = parseFloat(window.getComputedStyle(eleArrow).top);
        });
        eleFill.addEventListener('pointerdown', (event) => {
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

            objPosArrow.pageY = event.pageY;
            objPosArrow.top = parseFloat(window.getComputedStyle(eleArrow).top);
        });

        // 范围上下左右
        eleCircle.parentElement.querySelectorAll('a').forEach((eleRegion) => {
            eleRegion.addEventListener('pointerdown', (event) => {
                event.preventDefault();

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

        document.addEventListener('pointermove', (event) => {
            if (typeof objPosArrow.top == 'number') {
                event.preventDefault();

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
        document.addEventListener('pointerup', () => {
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
        const arrBasicColorPreset = this.params.color.basicPreset;
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
            basicPreset: arrBasicColorPreset,
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

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-color'
            }
        }));

        this.isConnectedCallback = true;
    }
}

Color.defaultValue = '#000000';

if (!customElements.get('ui-color')) {
    customElements.define('ui-color', Color, {
        extends: 'input'
    });
}

// export default Color;

/**
 * @Dialog.js
 * @author  zhangxinxu
 * @version
 * @created 15-06-18
 * @edited  19-11-01
 * @edited  20-06-26 @ziven27
 * @edited  20-12-01 by zhangxinxu method extends from <dialog>
 */

const Dialog = (() => {

    // 类名前缀
    const DIALOG = 'dialog';

    // 处理类名
    const CL = {
        add: (...arg) => `ui-${DIALOG}-${arg.join('-')}`,
        toString: (value) => `ui-${value || DIALOG}`
    };

    /**
   * 弹框实例方法
   * @param {Object} options 纯对象，可选参数
   */
    class Component {
        constructor (options = {}) {
            // 最终参数
            const objParams = {
                title: '',
                // 不同类别的内容类型
                content: '',
                // 弹框的宽度
                width: 'auto',
                // 弹框高度
                height: 'auto',
                // 不同类别的默认按钮
                buttons: [],
                // 关闭按钮
                closable: true,
                // 弹框显示、隐藏、移除的回调
                onShow: function () {
                },
                onHide: function () {
                },
                onRemove: function () {
                },
                ...options
            };

            // 各个元素创建
            // 容器-含半透明遮罩背景
            const dialog = document.createElement(DIALOG);
            dialog.setAttribute('is', 'ui-dialog');

            // MutationObserver是一个异步的过程，因此
            // 元素样式的设置在'DOMContentLoaded'事件之后完成
            dialog.addEventListener('DOMContentLoaded', () => {
                // 务必有传参
                // 否则不会对初始元素进行处理
                if (JSON.stringify(options) != '"{}"') {
                    // 改变参数，会自动触发DOM元素内容的变化
                    dialog.setParams({
                        ...objParams
                    });
                }

                // 显示
                dialog.show();
            });

            // 插入的细节
            // 1. 插在所有dialog的前面
            // 2. 如果没有，则放在页面后面
            const eleExistDialog = document.querySelector('body > ' +  DIALOG);

            if (eleExistDialog) {
                eleExistDialog.insertAdjacentElement('beforebegin', dialog);
            } else {
                document.body.appendChild(dialog);
            }

            // 注册当前<dialog>元素
            // 为了可以立即使用alert()、confirm()方法，
            // 在这里提前注册了
            funDialogRegist(dialog);

            return dialog;
        }
    }

    // 对不支持<dialog>元素的浏览器进行polyfill
    // 仅polyfill部分主要功能
    let DialogPolyfill = function (dialog) {
        this.element = {
            dialog: dialog
        };
        // aria支持
        if (!dialog.hasAttribute('role')) {
            dialog.setAttribute('role', 'dialog');
        }
        // 内置方法
        dialog.show = this.show.bind(this);
        dialog.showModal = this.showModal.bind(this);
        dialog.close = this.close.bind(this);
        // 自定义方法
        dialog.zIndex = this.zIndex.bind(this);

        Object.defineProperty(dialog, 'open', {
            set: this.setOpen.bind(this),
            get: dialog.hasAttribute.bind(dialog, 'open')
        });
    };

    DialogPolyfill.prototype = {
        get dialog () {
            return this.element.dialog;
        },
        show () {
            this.setOpen(true);
            // 层级最高
            this.zIndex();
        },
        showModal () {
            this.setOpen(true);
        },
        close () {
            this.setOpen(false);
            // 原生<dialog>就有close事件
            this.dialog.dispatchEvent(new CustomEvent('close', {
                bubbles: false,
                cancelable: false
            }));
        },
        setOpen (value) {
            if (value) {
                this.dialog.setAttribute('open', '');
            } else {
                this.dialog.removeAttribute('open');
            }
        },

        /**
         * 弹框元素zIndex实时最大化
         * 原生dialog无需此能力（更正，浏览器变化，现在也需要了）
         * @return {[type]} [description]
         */
        zIndex () {
            var dialog = this.dialog;
            // 原生元素需要
            if (this.matches && this.matches('dialog')) {
                dialog = this;
            }
            // 返回eleTarget才是的样式计算对象
            const objStyleTarget = window.getComputedStyle(dialog);
            // 此时元素的层级
            const numZIndexTarget = objStyleTarget.zIndex;
            // 用来对比的层级，也是最小层级
            let numZIndexNew = 19;

            // 只对<body>子元素进行层级最大化计算处理
            [...document.body.children].forEach(function (eleChild) {
                const objStyleChild = window.getComputedStyle(eleChild);

                const numZIndexChild = objStyleChild.zIndex * 1;

                if (numZIndexChild && (dialog !== eleChild && objStyleChild.display !== 'none')) {
                    numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
                }
            });

            if (numZIndexNew !== numZIndexTarget) {
                dialog.style.zIndex = numZIndexNew;
            }
        }
    };

    // 对弹框元素进行方法注册
    let funDialogRegist = function (dialog) {
        if (dialog.hide && dialog.button) {
            // 已经注册过
            return;
        }
        if ('open' in document.createElement('dialog') == false) {
            new DialogPolyfill(dialog);
        }

        // 自定义的方法支持
        // 全新的remove和show方法
        // 新增hide, alert, confirm等方法
        if (dialog.getAttribute('is') == 'ui-dialog') {
            Object.defineProperties(dialog, {
                setParams: {
                    value: function (options) {
                        Object.assign(this.params, options || {});

                        // 回调处理
                        if (typeof options.onShow == 'function') {
                            this.addEventListener('show', function (event) {
                                options.onShow.call(this, event);
                            });
                        }
                        if (typeof options.onHide == 'function') {
                            this.addEventListener('hide', function (event) {
                                options.onHide.call(this, event);
                            });
                        }
                        if (typeof options.onRemove == 'function') {
                            this.addEventListener('remove', function (event) {
                                options.onRemove.call(this, event);
                            });
                        }

                        return this.params;
                    }
                },

                /**
                 * 弹框按钮的处理
                 * @returns {Object}  返回当前<dialog>元素
                 */
                button: {
                    value: function () {
                        const objParams = this.params;
                        const objElement = this.element;

                        // 清除之前的按钮内容和数据
                        objElement.footer.innerHTML = '';
                        // 元素数据清除
                        for (const keyElement in objElement) {
                            if (/^button/.test(keyElement)) {
                                delete objElement[keyElement];
                            }
                        }

                        // 按钮元素创建
                        objParams.buttons.forEach(function (objButton, numIndex) {
                            // objButton可能是null等
                            objButton = objButton || {
                                type: 'normal'
                            };

                            // 按钮类型和值的处理
                            let strType = objButton.type;
                            let strValue = objButton.value;

                            if (strType === 'remind' || (!strType && numIndex === 0)) {
                                strType = 'primary';
                            } else if (!strType && numIndex === 1) {
                                strType = 'normal';
                            }

                            if (!strValue) {
                                strValue = ['确定', '取消'][numIndex];
                            }

                            let eleButton = document.createElement('button');
                            if (objButton['for']) {
                                eleButton = document.createElement('label');
                                eleButton.setAttribute('for', objButton['for']);
                            } else if (objButton.form) {
                                eleButton.setAttribute('form', objButton.form);
                                eleButton.type = 'submit';
                            }
                            // 自定义的类名
                            if (objButton.className) {
                                eleButton.className = objButton.className;
                            }
                            // 按钮样式
                            eleButton.classList.add(CL.toString('button'));
                            if (strType) {
                                eleButton.setAttribute('data-type', strType);
                            }
                            // 按钮是否禁用
                            eleButton.disabled = Boolean(objButton.disabled);
                            // 按钮内容
                            eleButton.innerHTML = strValue;

                            // 放在底部元素中
                            objElement.footer.appendChild(eleButton);

                            // 对外暴露
                            objElement['button' + numIndex] = eleButton;
                        });

                        // 按钮事件
                        // 底部确定取消按钮
                        objParams.buttons.forEach((objButton, numIndex) => {
                            // objButton可能是null等
                            objButton = objButton || {};

                            const eleButton = objElement['button' + numIndex];

                            if (!eleButton || objButton['for'] || objButton.form) {
                                return;
                            }

                            let objEvents = objButton.events || {
                                click: () => {
                                    this[this.closeMode]();
                                }
                            };

                            if (typeof objEvents === 'function') {
                                objEvents = {
                                    click: objEvents
                                };
                            }

                            for (const strEventType in objEvents) {
                                eleButton.addEventListener(strEventType, (event) => {
                                    // 把实例对象传入
                                    event.dialog = this;
                                    // 事件执行
                                    objEvents[strEventType](event);
                                });
                            }

                            // 额外的focus事件支持
                            eleButton.addEventListener('focus', function () {
                                if (window.isKeyEvent) {
                                    this.style.outline = '';
                                } else {
                                    this.style.outline = 'none';
                                }
                            });
                        });

                        return this;
                    }
                },

                /**
                 * 固定结构元素的事件绑定
                 * @returns {Object}    返回当前<dialog>元素对象
                 */
                events: {
                    value: function () {
                        const objElement = this.element;

                        this.addEventListener('animationend', function (event) {
                            if (event.target.tagName.toLowerCase() === DIALOG) {
                                this.classList.remove(CL.add('animation'));
                            }
                        });

                        // 关闭弹框按钮
                        const eleClose = objElement.close;
                        if (eleClose) {
                            eleClose.addEventListener('click', () => {
                                // 有其他可ESC元素存在时候，弹框不关闭
                                const eleActiveElement = document.activeElement;
                                const attrActiveElement = eleActiveElement.getAttribute('data-target');
                                let eleTargetElement = null;

                                if (attrActiveElement) {
                                    eleTargetElement = document.getElementById(attrActiveElement);
                                }

                                // 如果是其他元素的键盘访问
                                if (window.isKeyEvent && eleTargetElement && eleActiveElement !== eleClose && document.querySelector('a[data-target="' + attrActiveElement + '"],input[data-target="' + attrActiveElement + '"],button[data-target="' + attrActiveElement + '"]') && eleTargetElement.clientWidth > 0) {
                                    return;
                                }

                                // 关闭弹框
                                this[this.closeMode]();
                            });
                        }

                        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

                        return this;
                    }
                },

                /**
                 * alert类型的弹框，默认仅一个“确定”按钮
                 * @param  {String} content    提示文字或者提示HTML片段
                 * @param  {Object} options    提示可选参数
                 * @return {Object}            返回当前<dialog>元素对象
                 */
                alert: {
                    value: function (content, options) {
                        if (!content) {
                            return;
                        }

                        let strContent = content;

                        // alert框的默认参数
                        const defaults = {
                            title: '',
                            // 类型, 'remind', 'success', 'warning', danger', 或者任意 'custom'
                            type: 'remind',
                            buttons: [{}]
                        };
                        // 最终参数
                        const objParams = {
                            ...defaults,
                            ...options
                        };

                        if (objParams.type === 'error' || objParams.type === 'fail') {
                            objParams.type = 'danger';
                        } else if (objParams.type === 'primary') {
                            objParams.type = 'remind';
                        }

                        if (objParams.buttons.length && !objParams.buttons[0].type) {
                            objParams.buttons[0].type = objParams.type;
                            // 如果是自定义类型，则使用'primary'作为按钮类型
                            if (/^remind|success|warning|danger$/.test(objParams.type) === false) {
                                objParams.buttons[0].type = defaults.type;
                            }
                        }

                        let nodes = new DOMParser().parseFromString(strContent, 'text/html').body.childNodes;

                        if (nodes.length == 1) {
                            // 如果是纯文本
                            if (nodes[0].nodeType === 3) {
                                strContent = '<p class="' + CL.add('wrap') + '">' + strContent + '</p>';
                            }
                        } else {
                            strContent = '<div class="' + CL.add('wrap') + '">' + strContent + '</div>';
                        }

                        // 主体内容更新
                        strContent = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('alert') + '">' + strContent + '</div>';

                        this.setParams({
                            width: 'auto',
                            title: objParams.title,
                            buttons: objParams.buttons,
                            content: strContent
                        });

                        this.type = 'alert';

                        this.show();

                        return this;
                    }
                },

                /**
                 * confirm类型的弹框，默认有一个“确定”和一个“取消”按钮
                 * @param  {String} content    提示文字或者提示HTML片段
                 * @param  {Object} options    提示可选参数
                 * @return {Object}            返回当前<dialog>元素对象
                 */
                confirm: {
                    value: function (content, options) {
                        if (!content) {
                            return;
                        }

                        let strContent = content;

                        // confirm框的默认参数
                        const defaults = {
                            title: '',
                            type: 'danger',
                            buttons: [{}, {}]
                        };

                        // 最终参数
                        const objParams = {
                            ...defaults,
                            ...options
                        };

                        if (objParams.type === 'error' || objParams.type === 'fail') {
                            objParams.type = 'danger';
                        }
                        if (objParams.type === 'primary') {
                            objParams.type = 'remind';
                        }

                        // danger类型的按钮可缺省
                        if (objParams.buttons.length && !objParams.buttons[0].type) {
                            objParams.buttons[0].type = objParams.type;
                            // 如果是自定义类型，则使用'primary'作为按钮类型
                            if (/^remind|success|warning|danger$/.test(objParams.type) === false) {
                                objParams.buttons[0].type = defaults.type;
                            }
                        }

                        let nodes = new DOMParser().parseFromString(strContent, 'text/html').body.childNodes;

                        if (nodes.length == 1) {
                            // 如果是纯文本
                            if (nodes[0].nodeType === 3) {
                                strContent = '<p class="' + CL.add('wrap') + '">' + strContent + '</p>';
                            }
                        } else {
                            strContent = '<div class="' + CL.add('wrap') + '">' + strContent + '</div>';
                        }

                        // 主体内容设置
                        strContent = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('confirm') + '">' + strContent + '</div>';

                        // 参数对外
                        this.setParams({
                            width: 'auto',
                            title: objParams.title,
                            buttons: objParams.buttons,
                            content: strContent
                        });

                        this.type = 'confirm';

                        this.show();

                        return this;
                    }
                },

                /**
                 * loading弹框，通常用在ajax请求之前使用
                 * loading结束后可以直接调用弹框实例的open()方法显示
                 * @return {Object} 返回当前实例对象
                 */
                loading: {
                    value: function () {
                        const objElement = this.element;

                        this.params.content = '<ui-loading rows="10" size="3"></ui-loading>';
                        // 显示loading样式
                        objElement.dialog.classList.add(CL.add('loading'));

                        this.show();

                        return this;
                    }
                },

                /**
                 * 内容赋值
                 */
                content: {
                    get () {
                        return this.params.content;
                    },
                    set (content) {
                        // 让直接设置content时候可以和params.content数据保持一致
                        if (content != this.params.content) {
                            this.params.content = content;
                            return;
                        }

                        let eleBody = this.element.body;
                        let eleDialog = this.element.dialog;
                        // 去除可能的loading类名
                        eleDialog.classList.remove(CL.add('loading'));
                        // content可以是函数
                        if (typeof content == 'function') {
                            content = content();
                        } else if (typeof content == 'string' && /^#?\w+(?:[-_]\w+)*$/i.test(content)) {
                            // 如果是字符串
                            // 如果是选择器，仅支持ID选择器
                            let eleMatch = document.querySelector(content);
                            if (eleMatch) {
                                if (eleMatch.matches('textarea')) {
                                    content = eleMatch.value;
                                } else if (eleMatch.matches('script')) {
                                    content = eleMatch.innerHTML;
                                } else {
                                    content = eleMatch;
                                }
                            }
                        }

                        // 基于内容的数据类型，使用不同的默认的弹框关闭方式
                        this.closeMode = typeof content == 'string' ? 'remove' : 'hide';

                        // 是隐藏模式，则eleBody里面的内容保护出来
                        // 主要是使用content语法替换内容时候用到，这段代码一般不会执行到
                        if (this.closeMode == 'hide' && eleBody.innerHTML) {
                            let eleProtect = document.createElement('div');
                            eleProtect.setAttribute('hidden', '');
                            // 遍历并转移
                            eleBody.childNodes.forEach(node => {
                                eleProtect.appendChild(node);
                            });
                            // 保护到页面中
                            document.body.appendChild(eleProtect);
                        }

                        // 清空主内容区域的内容
                        eleBody.innerHTML = '';

                        if (this.closeMode == 'remove') {
                            eleBody.innerHTML = content;
                        } else {
                            let eleContentParent = content.parentElement;
                            let isParentHidden = eleContentParent && eleContentParent.matches('div[hidden]');
                            // 弹框中显示
                            eleBody.appendChild(content);
                            // 如果原父级是隐藏div，该div删除
                            if (isParentHidden && eleContentParent.innerHTML.trim() === '') {
                                eleContentParent.remove();
                            }
                            // 如果content是隐藏的则显示
                            if (content.nodeType === 1 && getComputedStyle(content).display == 'none') {
                                content.removeAttribute('hidden');
                                content.style.display = '';
                                // 如果此时元素的display状态还是none，则设置为浏览器初始display值
                                if (getComputedStyle(content).display == 'none') {
                                    content.style.display = 'revert';
                                }
                            }
                        }
                    }
                },

                /**
                 * 背景滚动锁定带来的
                 * @returns    当前<dialog>元素
                 */
                scrollbar: {
                    value: function () {
                        const eleAllDialog = document.querySelectorAll('dialog[is="ui-dialog"]');

                        // 是否有显示的弹框
                        const isDisplayed = [].slice.call(eleAllDialog).some(function (eleDialog) {
                            return window.getComputedStyle(eleDialog).display !== 'none';
                        });

                        document.documentElement.style.overflow = '';
                        document.body.style.borderRight = '';

                        let widthScrollbar = window.innerWidth - document.documentElement.clientWidth;

                        // 因为去掉了滚动条，所以宽度需要偏移，保证页面内容没有晃动
                        if (isDisplayed) {
                            // 所有PC浏览器都滚动锁定
                            document.documentElement.style.overflow = 'hidden';
                            document.body.style.borderRight = widthScrollbar + 'px solid transparent';
                        }

                        return this;
                    }
                },

                /**
                 * 键盘访问与聚焦的细节设置
                 * @returns    当前<dialog>元素
                 */
                tabindex: {
                    value: function () {
                        var eleDialog = this.element.dialog;
                        var eleLastActiveElement = this.lastActiveElement;

                        if (this.open == true) {
                            var eleActiveElement = document.activeElement;
                            if (this.type == 'alert' || this.type == 'confirm') {
                                if (this.element.button0 != eleActiveElement) {
                                    this.lastActiveElement = eleActiveElement;
                                }
                                this.element.button0.focus();
                            } else if (eleDialog) {
                                if (eleDialog != eleActiveElement) {
                                    this.lastActiveElement = eleActiveElement;
                                }
                                // 键盘索引起始位置变为在弹框元素上
                                eleDialog.focus();
                            }
                        } else if (eleLastActiveElement && eleLastActiveElement.tagName.toLowerCase() != 'body') {
                            // 键盘焦点元素还原
                            eleLastActiveElement.focus({
                                preventScroll: true
                            });
                            eleLastActiveElement.blur();
                            this.lastActiveElement = null;
                        }

                        return this;
                    }
                },

                /**
                 * 弹框显示
                 * @returns    当前<dialog>元素
                 */
                show: {
                    value: function () {
                        if (this.open !== true) {
                            this.classList.add(CL.add('animation'));
                        }

                        // 弹框显示
                        this.open = true;

                        if (!this.zIndex) {
                            this.zIndex = DialogPolyfill.prototype.zIndex.bind(this);
                        }

                        // 面板显示
                        if (this.zIndex) {
                            this.zIndex();
                        }

                        this.dispatchEvent(new CustomEvent('show', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                },

                /**
                 * 弹框隐藏
                 * @returns    当前<dialog>元素
                 */
                hide: {
                    value: function () {
                        this.close();

                        this.dispatchEvent(new CustomEvent('hide', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                },

                /**
                 * 弹框移除
                 * @returns    当前<dialog>元素
                 */
                remove: {
                    value: function () {
                        this.open = false;

                        this.parentElement.removeChild(this);

                        this.dispatchEvent(new CustomEvent('remove', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                }
            });

            // 暴露的参数
            // 并观察参数变化
            dialog.params = new Proxy(dialog.params || {}, {
                get (target, prop) {
                    return target[prop];
                },
                set (target, prop, value) {
                    if (!dialog.element) {
                        return false;
                    }
                    // 赋值
                    target[prop] = value;

                    // 拦截
                    if (prop == 'title' && dialog.element.title) {
                        dialog.element.title.innerHTML = value;
                    } else if (prop == 'content') {
                        dialog.content = value;
                    } else if (prop == 'buttons') {
                        dialog.button();
                    } else if (prop == 'closable' && dialog.element.close) {
                        dialog.element.close.style.display = value ? '' : 'none';
                    } else if (dialog.element.dialog && (prop == 'width' || prop == 'height')) {
                        let eleDialog = dialog.element.dialog;
                        eleDialog.classList.remove(CL.add('stretch'));
                        // 纯数值认为是px长度
                        if (value !== '' && Number(value) == value) {
                            eleDialog.style[prop] = value + 'px';
                        } else if (prop == 'height' && value == 'stretch') {
                            eleDialog.classList.add(CL.add(value));
                        } else {
                            if (value == 'auto') {
                                value = '';
                            }
                            eleDialog.style[prop] = value;
                        }
                    }

                    return true;
                }
            });

            // 弹框主要元素的创建
            // 1. 主体
            const eleDialog = document.createElement('div');
            eleDialog.classList.add(CL);
            // 使该元素也可以被focus
            eleDialog.setAttribute('tabindex', '-1');

            // 2. 标题
            const eleTitle = document.createElement('h4');
            eleTitle.classList.add(CL.add('title'));
            eleTitle.innerHTML = dialog.title;
            dialog.removeAttribute('title');

            // 3. 关闭按钮
            // 随机id，ESC快捷键关闭弹框用到
            const strIdClose = ('lulu_' + Math.random()).replace('0.', '');
            // 关闭按钮元素创建
            const eleClose = document.createElement('button');
            eleClose.textContent = '关闭';
            eleClose.classList.add(CL.add('close'), 'ESC');
            eleClose.id = strIdClose;
            // 无障碍支持
            eleClose.setAttribute('data-target', strIdClose);

            // 4. 主体内容元素
            const eleBody = document.createElement('div');
            eleBody.classList.add(CL.add('body'));

            // 5. 底部元素
            const eleFooter = document.createElement('div');
            eleFooter.classList.add(CL.add('footer'));

            // 暴露元素
            dialog.element = Object.assign(dialog.element || {}, {
                dialog: eleDialog,
                close: eleClose,
                title: eleTitle,
                body: eleBody,
                footer: eleFooter
            });

            // 下面是主体元素的创建
            // 如果默认弹框里面就有内容
            // 则内容认为是主体内容，记录下来
            let nodesOriginDialog = [...dialog.childNodes];

            // 原始节点放在eleBody主体内容元素中
            if (nodesOriginDialog.length) {
                // 一次性 append
                eleBody.append.apply(eleBody, nodesOriginDialog);
            }

            // 元素插入
            // 组装
            eleDialog.append(eleClose, eleTitle, eleBody, eleFooter);
            dialog.append(eleDialog);

            // 参数处理，如果有
            const strParams = dialog.dataset.params || dialog.getAttribute('params');

            if (strParams && /{/.test(strParams)) {
                try {
                    const objParams = (new Function('return ' + strParams))();
                    // 参数设置
                    dialog.setParams(objParams);
                } catch (e) {
                    console.error(e);
                }
            } 

            // 观察open属性变化
            var moDialogOpen = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(mutation => {
                    let eleDialog = mutation.target;
                    if (mutation.type == 'attributes') {
                        // 滚动条状态变化
                        eleDialog.scrollbar();
                        // 焦点变化
                        eleDialog.tabindex();
                    }
                });
            });
            moDialogOpen.observe(dialog, {
                attributes: true,
                attributeFilter: ['open']
            });

            // 默认模式是关闭
            dialog.closeMode = 'hide';
            // 事件
            dialog.events();
        }

        // 回调
        dialog.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-dialog'
            }
        }));

        // 设置定义完毕标志量
        dialog.setAttribute('defined', '');

        dialog.isConnectedCallback = true;
    };

    // 弹框观察并注册
    let funDialogInitAndWatching = function () {
        const elesDialog = document.querySelectorAll('dialog');
        elesDialog.forEach(item => {
            funDialogRegist(item);
        });
        // 观察Dialog元素载入页面
        var observerTips = new MutationObserver(function (mutationsList) {
            // 此时不检测DOM变化
            mutationsList.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (eleAdd) {
                    if (eleAdd.matches && eleAdd.matches('dialog')) {
                        funDialogRegist(eleAdd);
                    } else if (eleAdd.querySelector) {
                        eleAdd.querySelectorAll('dialog').forEach(item => {
                            funDialogRegist(item);
                        });
                    }
                });
            });
        });

        observerTips.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // 如果浏览器不支持<dialog>，则对出现在页面上的<dialog>元素进行注册
    if (document.readyState != 'loading') {
        funDialogInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funDialogInitAndWatching);
    }

    return Component;
})();


// 为了直接使用
window.Dialog = Dialog;

// 可以 import
// export default Dialog;

/**
 * @Datalist.js
 * @author zhangxinxu
 * @version
 * Created: 16-03-28
 * edited: 20-07-30 edit by yanmeng
 * @description 多功能下拉数据列表
 **/

// import './Follow.js';

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
        end: 'mouseup'
    };

    if ('ontouchstart' in document) {
        objEventType = {
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
                return str.replace(/<\/?[^<>]*>/g, '').replace(/<\/?[^<>]*>/g, '');
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
                return str.replace(/&lt;|&gt;|&amp;/gi, (matches) => {
                    return {
                        '&lt;': '<',
                        '&gt;': '>',
                        '&amp;': '&'
                    }[matches.toLowerCase()];
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
                        // 有可能是内容在后面渲染，没来得及识别
                        setTimeout(() => {
                            if (document.getElementById(strAttrList)) {
                                this.convertData();
                            }
                        }, 1);
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
                            // 如果没有设置value值，尝试使用内容值作为value值
                            if (!eleOption.hasAttribute('value')) {
                                objAttr.value = eleOption.textContent || '';
                            }
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

                    // 搜索关键字的查询字段
                    let strName = objParams.name || this.name || 'k';

                    // 没有值的时候清空数据
                    // 不请求
                    let strValue = this.value.trim();

                    if (strValue == '') {
                        this.datalist = [];

                        return [];
                    }

                    let objAjaxParams = new URLSearchParams(objParams.data);
                    // 加入输入数据
                    objAjaxParams.append(strName, strValue);

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
                            this.refresh(this.params.filter.call(this, jsonData, strValue));
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
                // 边缘超出不重定位
                if (!this.dataset.edgeAdjust) {
                    this.dataset.edgeAdjust = 'false';
                }
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
            if (arrData && arrData.length) {
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
                let strId = this.element.datalist && this.element.datalist.id;
                if (!strId) {
                    // 如果没有关联id，创建之
                    strId = `lulu_${Math.random()}`.replace('0.', '');
                    // 设置关联id
                    this.setAttribute('data-target', strId);
                }

                const eleTarget = document.createElement('div');
                eleTarget.classList.add(CL);
                eleTarget.addEventListener('click', (event) => {
                    if (event.touches && event.touches.length) {
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
                        if (this.display == true && arrData && arrData.length) {
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

            this.isConnectedCallback = true;
        }
    }

    return Datalist;
})();

if (!customElements.get('ui-datalist')) {
    customElements.define('ui-datalist', Datalist, {
        extends: 'input'
    });
}

// export default Datalist;

/**
 * @DateTime.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-03
 * @edited:   19-11-12
 * @edited:    20-07-27 edit by wanghao
 */

// import './Follow.js';


/**
 * 日期，时间选择器
 * 基于HTML5时间类输入框
 * @example is="ui-datetime"
 * @trigger 触发的元素，可以是文本框也可以是文本框容器(父级)
 * @options 可选参数
 */
const DateTime = (() => {
    // 样式类名统一处理
    const CL = {
        toString: () => 'ui-datetime'
    };
    ['date', 'range', 'day', 'year', 'month', 'hour', 'minute', 'time', 'datetime'].forEach((key) => {
        CL[key] = (...args) => ['ui', key, ...args].join('-');
    });

    const SELECTED = 'selected';
    const ACTIVE = 'active';
    const regDate = /-|\//g;

    // 拓展方法之字符串变时间对象
    String.prototype.toDate = function () {
        let year, month, day;
        const arrDate = this.replace(/年|月|日/g, '-').split(regDate);
        // 字符串变数值
        year = arrDate[0] * 1;
        month = arrDate[1] || 1;
        day = arrDate[2] || 1;
        // 年份需要是数值字符串
        if (!year) {
            return new Date();
        }

        return new Date(year, month - 1, day);
    };

    String.prototype.toTime = function () {
        let arrTime = this.trim().split(':').map((hm, index) => {
            if (!hm || /\D/.test(hm))  {
                return '';
            }

            if (hm < 0) {
                return '00';
            } else if (index === 0) {
                if (hm > 23) {
                    hm = '23';
                }
            } else if (hm > 59) {
                hm = '59';
            }

            return hm.padStart(2, '0');
        }).filter(_ => _).slice(0, 3);

        // 至少有时分
        if (arrTime.length == 1) {
            arrTime.push('00');
        }

        return arrTime;
    };

    // 日期对象变成年月日数组
    Date.prototype.toArray = function () {
        let year = this.getFullYear();
        let month = this.getMonth() + 1;
        let date = this.getDate();
        if (month < 10) {
            month = `0${month}`;
        }
        if (date < 10) {
            date = `0${date}`;
        }

        return [year, month, date];
    };


    class Component extends HTMLInputElement {
        constructor () {
            super();
        }

        minMaxConvert (value) {
            // 直接设置为数值
            if (typeof value == 'number' && Number.isInteger(value)) {
                // 认为是时间戳
                if (value > 10000000) {
                    value = new Date(value);
                } else if (value < 9999) {
                    // 认为是年份
                    value = String(value);
                }
            }

            // 日期和时间
            let arrDate = [];
            let arrHourMin = [];

            // value可以是Date对象
            if (value.toArray) {
                arrDate = value.toArray();
                // 此时的对应的时间值
                arrHourMin = (value.getHours() + ':' + value.getMinutes()).toTime();
            } else if (value && typeof value == 'string') {
                const arrDateTime = value.split(/\s+|T/);
                arrDate = arrDateTime[0].toDate().toArray();

                if (arrDateTime[1] && arrDateTime[1].includes(':')) {
                    arrHourMin = arrDateTime[1].toTime();
                }
            }

            let strType = this.getAttribute('type') || 'date';

            // 赋值
            if (strType == 'date' || strType == 'date-range') {
                value = arrDate.join('-');
            } else if (strType == 'year') {
                value = arrDate[0];
            } else if (strType == 'month' || strType == 'month-range') {
                value = arrDate.slice(0, 2).join('-');
            } else if (/^datetime/.test(strType)) {
                value = arrDate.join('-') + ' ' + arrHourMin.join(':');
            } else  {
                if (value.toArray) {
                    // 其他日期类型转换成 时:分 模式
                    value = value.getHours() + ':' + value.getMinutes();
                }
                // 补0的处理
                let arrHourMin = value.toTime();
                // 时间类型
                if (!arrHourMin[0]) {
                    return '';
                }

                value = arrHourMin.join(':');
            }

            return value;
        }

        get min () {
            let strAttrMin = this.getAttribute('min') || '';
            if (strAttrMin) {
                return this.minMaxConvert(strAttrMin).toString();
            }
            return strAttrMin;
        }

        set min (value) {
            if (!value) {
                this.removeAttribute('min');
                return;
            }

            this.setAttribute('min', this.minMaxConvert(value));
        }

        get max () {
            let strAttrMax = this.getAttribute('max') || '';
            if (strAttrMax) {
                return this.minMaxConvert(strAttrMax).toString();
            }
            return strAttrMax;
        }

        set max (value) {
            if (!value) {
                this.removeAttribute('max');
                return;
            }

            this.setAttribute('max', this.minMaxConvert(value));
        }
        get step () {
            let strStep = this.getAttribute('step');
            let strType = this.params.type;
            let numStep = Number(strStep);
            if (strStep && /^\d+$/.test(strStep)) {
                if (strType == 'time') {
                    if (strStep > 60) {
                        if (strStep % 60 != 0 || strStep / 60 > 30) {
                            numStep = 1;
                        }
                    } else if (numStep > 30) {
                        numStep = 1;
                    }
                } else if (strType == 'hour') {
                    if (numStep > 12) {
                        numStep = 1;
                    }
                } else if (strType == 'minute' && numStep > 30) {
                    numStep = 1;
                }

                return numStep;
            }
            return '';
        }

        set step (value) {
            if (!value) {
                this.removeAttribute('step');
                return;
            }

            this.setAttribute('step', value);
        }

        /**
         * 事件
         * @return {[type]} [description]
         */
        events () {
            // 具体元素们
            const eleContainer = this.element.target;

            // 点击容器的事件处理
            eleContainer.addEventListener('click', (event) => {
                // IE可能是文件节点
                if (event.target.nodeType != 1 || !event.target.closest) {
                    return;
                }

                const eleClicked = event.target.closest('a, button');
                if (!eleClicked) {
                    return;
                }
                // 各个分支中可能会用到的变量
                let numYear = 0;
                let numMonth = 0;
                // var numDate = 0;
                let numHour = 0;
                let numDay = 0;
                // 日期范围
                let arrRange = [];
                // 根据选中状态决定新的状态
                let dataRange;
                // 按钮类型
                let strTypeButton = '';

                // 选择的日期类型
                const strType = eleContainer.dataset.type;

                // 各种事件
                switch (strType) {
                    case 'date': {
                        // 日期选择主体
                        // 1. 前后月份选择
                        if (/prev|next/.test(eleClicked.className)) {
                            numMonth = eleClicked.dataset.month;

                            // 设置选择月份
                            // 这样可以获得目标月份对应的日期数据
                            // 就是下面this.getMonthDay做的事情
                            this[SELECTED][1] = numMonth * 1;

                            // 日期和月份要匹配，例如，不能出现4月31日
                            // arrMonthDay是一个数组，当前年份12个月每月最大的天数
                            const arrMonthDay = this.getMonthDay(this[SELECTED]);

                            // 切分月份
                            // 日期正常是不会变化的
                            // 但是类似31号这样的日子不是每个月都有的
                            // 因此，需要边界判断
                            // 下面这段逻辑就是做这个事情的

                            // 1. 当前月份最大多少天
                            const numDayMax = (() => {
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
                            const numDayOverflow = eleContainer.dataDayOverflow;
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
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
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
                                    numDay = `0${numDay}`;
                                }
                                // 修改全局
                                this[SELECTED][2] = numDay;
                            }

                            // 赋值
                            this.setValue();
                            // 隐藏
                            this.hide();

                            delete eleContainer.dataDayOverflow;
                        } else if (eleClicked.dataset.type == 'month') {
                            // 切换到年份选择
                            this.month();
                        }
                        break;
                    }
                    case 'date-range': {
                        // 区域选择
                        // 1. 前后月份选择
                        if (/prev|next/.test(eleClicked.className)) {
                            numMonth = eleClicked.dataset.month * 1;

                            arrRange = eleContainer.dataDate || this[SELECTED][0];

                            // 跟其他面板不同，这里只刷新，点击确定再赋值
                            eleContainer.dataDate = new Date(arrRange[0], numMonth - 1, 1).toArray();
                            // 之前arrRange[2]存在跨多月风险，尤其31号的日子
                            // 刷新
                            this['date-range']();
                        } else if (/item/.test(eleClicked.className)) {
                            // 选择某日期
                            // 获得选中的年月日
                            numYear = eleClicked.dataset.year;
                            numMonth = eleClicked.dataset.month;
                            numDay = eleClicked.innerHTML;

                            // 位数不足补全
                            if (numMonth < 10) {
                                numMonth = `0${numMonth}`;
                            }
                            if (numDay < 10) {
                                numDay = `0${numDay}`;
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
                            strTypeButton = eleClicked.dataset.type;
                            if (strTypeButton == 'primary') {
                                // 点击确定按钮
                                // 赋值
                                this.setValue();
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
                            numYear = eleClicked.dataset.year * 1;

                            arrRange = eleContainer.dataDate || this[SELECTED][0];

                            // 跟其他面板不同，这里只刷新，点击确定再赋值
                            eleContainer.dataDate = new Date(numYear, arrRange[1], 1).toArray();
                            // 刷新
                            this['month-range']();
                        } else if (/item/.test(eleClicked.className)) {
                            // 选择某日期
                            // 获得选中的年月日
                            numYear = eleClicked.dataset.year;
                            numMonth = eleClicked.dataset.value;
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
                            strTypeButton = eleClicked.dataset.type;
                            if (strTypeButton == 'primary') {
                                // 点击确定按钮
                                // 赋值
                                this.setValue();
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
                            numYear = eleClicked.dataset.year;
                            // 修改当前选中的年份数
                            this[SELECTED][0] = numYear * 1;
                            // 刷新
                            this.month();
                            // 文本框赋值
                            // 如果在区域内状态
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
                            }
                        } else if (/item/.test(eleClicked.className)) {
                            // value实际上是月份两位数值
                            const value = eleClicked.dataset.value;
                            if (value) {
                                this[SELECTED][1] = value;
                            } else {
                                // 今月，只改变年月为今年和今月
                                const arrToday = new Date().toArray();
                                this[SELECTED][0] = arrToday[0];
                                this[SELECTED][1] = arrToday[1];
                            }

                            // 赋值
                            this.setValue();

                            // 根据是否是月份输入框，决定是面板切换，还是关闭
                            if (this.params.type == 'month') {
                                // 隐藏
                                this.hide();
                            } else {
                                this.date();
                            }
                        } else if (eleClicked.dataset.type == 'year') {
                            // 切换到年份选择
                            this.year();
                        }
                        break;
                    }
                    case 'year': {
                        // 选择年份，可能从月份过来，也可能直接打开
                        // 1. 前后12年翻页
                        if (/prev|next/.test(eleClicked.className)) {
                            numYear = eleClicked.dataset.year;
                            // 修改当前选中的年份数
                            this[SELECTED][0] = numYear * 1;
                            // 刷新
                            this.year();
                            // 文本框赋值
                            // 如果在区域内状态
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
                            }
                        } else if (/item/.test(eleClicked.className)) {
                            if (eleClicked.innerHTML == '今年') {
                                this[SELECTED][0] = new Date().getFullYear();
                            } else {
                                this[SELECTED][0] = eleClicked.innerHTML * 1;
                            }

                            // 赋值
                            this.setValue();
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
                    case 'time': {
                        if (eleClicked.tagName == 'BUTTON' && eleClicked.classList.contains(SELECTED) == false) {
                            let strTypeButton = eleClicked.parentElement.dataset.type;
                            let numIndexButton = eleClicked.dataset.index;
                            if (strTypeButton == 'ampm') {
                                if (numIndexButton == '0') {
                                    this[SELECTED][0] -= 12;
                                } else {
                                    this[SELECTED][0] = Number(this[SELECTED][0]) + 12;
                                }
                                this[SELECTED][0] = String(this[SELECTED][0]).padStart(2, '0');
                            } else if (strTypeButton == 'hour') {
                                this[SELECTED][0] = numIndexButton.padStart(2, '0');
                            } else if (strTypeButton == 'minute') {
                                this[SELECTED][1] = numIndexButton.padStart(2, '0');
                            } else if (strTypeButton == 'second') {
                                this[SELECTED][2] = numIndexButton.padStart(2, '0');
                            }

                            this.setValue();
                            this.time();
                        }
                        break;
                    }
                    case 'minute': {
                        // 选择分钟，可以是minute类型，或者time类型, 但不包括hour类型
                        // 1. 前后翻页
                        if (/prev|next/.test(eleClicked.className)) {
                            numHour = eleClicked.getAttribute('data-hour');
                            if (numHour.length == 1) {
                                numHour = `0${numHour}`;
                            }
                            // 修改当前选中的小时数
                            this[SELECTED][0] = numHour;

                            // 刷新
                            this.minute();
                            // 文本框赋值
                            // 如果在区域内状态
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
                            }
                        } else if (/item/.test(eleClicked.className)) {
                            // 确定选择时间
                            this[SELECTED] = eleClicked.innerHTML.split(':');
                            this.setValue();
                            this.hide();
                        } else if (eleClicked.dataset.type == 'hour') {
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
                            this.setValue();

                            // 如果是从分钟模式切换过来，则切换回去，否则，直接隐藏
                            if (this.params.type == 'hour') {
                                this.hide();
                            } else {
                                this.minute();
                            }
                        }
                        break;
                    }
                    case 'datetime': {
                        // 日期时间选择
                        const arrSelected = this[SELECTED];
                        const eleContainerDate = eleClicked.closest('[data-type="date"]');
                        const eleContainerMonth = eleClicked.closest('[data-type="month"]');
                        const eleContainerYear = eleClicked.closest('[data-type="year"]');
                        const eleContainerTime = eleContainer.querySelector('[data-type="time"]');
                        // 日期选择主体
                        if (eleContainerDate) {
                            // 日期数组项
                            const arrDate = arrSelected[0];
                            // 1. 前后月份选择
                            if (/prev|next/.test(eleClicked.className)) {
                                numMonth = eleClicked.dataset.month;

                                // 设置选择月份
                                // 这样可以获得目标月份对应的日期数据
                                // 就是下面this.getMonthDay做的事情
                                arrDate[1] = numMonth * 1;

                                // 日期和月份要匹配，例如，不能出现4月31日
                                // arrMonthDay是一个数组，当前年份12个月每月最大的天数
                                const arrMonthDay = this.getMonthDay(this[SELECTED]);

                                // 切分月份
                                // 日期正常是不会变化的
                                // 但是类似31号这样的日子不是每个月都有的
                                // 因此，需要边界判断
                                // 下面这段逻辑就是做这个事情的

                                // 1. 当前月份最大多少天
                                const numDayMax = (() => {
                                    if (numMonth - 1 < 0) {
                                        return arrMonthDay[11];
                                    } else if (numMonth > arrMonthDay.length) {
                                        return arrMonthDay[0];
                                    }

                                    return arrMonthDay[numMonth - 1];
                                })();

                                // 2. 之前选择的天数
                                numDay = arrDate[2];
                                // 之前记住的日期
                                const numDayOverflow = eleContainer.dataDayOverflow;
                                // 例如，我们超出日期是31日，如果月份可以满足31日，使用31日
                                if (numDayOverflow) {
                                    arrDate[2] = Math.min(numDayOverflow, numDayMax);
                                } else if (arrDate[2] > numDayMax) {
                                    arrDate[2] = numDayMax;

                                    // 这里是对体验的升级，
                                    // 虽然下月份变成了30号，但是再回来时候，原来的31号变成了30号
                                    // 不完美，我们需要处理下
                                    // 通过一个变量记住，点击item项的时候，移除
                                    // 且只在第一次的时候记住
                                    // 因为28,29,30,31都可能出现，每次记忆会混乱
                                    eleContainer.dataDayOverflow = numDay;
                                }

                                // 更新选择的月日数据
                                this[SELECTED][0] = arrDate.join('-').toDate().toArray();

                                // 刷新
                                this.date(eleContainerDate);
                                // 时间也刷新，因为可能禁用态变化
                                this.time(eleContainerTime);

                                // 如果在时间范围内
                                if (eleContainer.querySelector(`[data-type="date"] .${SELECTED}[href]`)) {
                                    this.setValue();
                                }
                            } else if (/item/.test(eleClicked.className)) {
                                // 选择某日期啦
                                numDay = eleClicked.innerHTML;

                                // 含有非数字，认为是今天
                                if (/\D/.test(numDay)) {
                                    // 今天
                                    this[SELECTED][0] = new Date().toArray();
                                } else {
                                    if (numDay < 10) {
                                        numDay = `0${numDay}`;
                                    }
                                    // 修改全局
                                    this[SELECTED][0][2] = numDay;
                                }

                                // 赋值和选中态更新
                                this.setValue();
                                this.date(eleContainerDate);
                                // 时间也刷新，因为可能禁用态变化
                                this.time(eleContainerTime);

                                delete eleContainer.dataDayOverflow;
                            } else if (eleClicked.dataset.type == 'month') {
                                // 切换到年份选择
                                this.month(eleContainerDate);
                            }
                        } else if (eleContainerMonth) {
                            // 月份切换
                            // 选择月份，可能从年份，也可能从日期过来
                            // 1. 前后年份
                            if (/prev|next/.test(eleClicked.className)) {
                                numYear = eleClicked.dataset.year;
                                // 修改当前选中的年份数
                                this[SELECTED][0][0] = numYear * 1;
                                // 刷新
                                this.month(eleContainerMonth);
                                // 时间也刷新，因为可能禁用态变化
                                this.time(eleContainerTime);
                                // 文本框赋值
                                // 如果在区域内状态
                                if (eleContainerMonth.querySelector(`.${SELECTED}[href]`)) {
                                    this.setValue();
                                }
                            } else if (/item/.test(eleClicked.className)) {
                                // value实际上是月份两位数值
                                const value = eleClicked.dataset.value;
                                if (value) {
                                    this[SELECTED][0][1] = value;
                                } else {
                                    // 今月，只改变年月为今年和今月
                                    const arrToday = new Date().toArray();
                                    this[SELECTED][0][0] = arrToday[0];
                                    this[SELECTED][0][1] = arrToday[1];
                                }

                                // 赋值
                                this.setValue();

                                this.date(eleContainerMonth);
                                // 时间也刷新，因为可能禁用态变化
                                this.time(eleContainerTime);
                            } else if (eleClicked.dataset.type == 'year') {
                                // 切换到年份选择
                                this.year(eleContainerMonth);
                            }
                        } else if (eleContainerYear) {
                            // 选择年份，从月份过来
                            if (/prev|next/.test(eleClicked.className)) {
                                numYear = eleClicked.dataset.year;
                                // 修改当前选中的年份数
                                this[SELECTED][0][0] = numYear * 1;
                                // 刷新
                                this.year(eleContainerYear);
                                // 时间也刷新，因为可能禁用态变化
                                this.time(eleContainerTime);
                                // 文本框赋值
                                // 如果在区域内状态
                                if (eleContainerYear.querySelector(`.${SELECTED}[href]`)) {
                                    this.setValue();
                                }
                            } else if (/item/.test(eleClicked.className)) {
                                if (eleClicked.innerHTML == '今年') {
                                    this[SELECTED][0][0] = new Date().getFullYear();
                                } else {
                                    this[SELECTED][0][0] = eleClicked.innerHTML * 1;
                                }

                                // 赋值
                                this.setValue();
                                // 回到月份面板
                                this.month(eleContainerYear);
                                // 时间也刷新，因为可能禁用态变化
                                this.time(eleContainerTime);
                            }
                        } else if (eleClicked.tagName == 'BUTTON' && eleClicked.classList.contains(SELECTED) == false) {
                            const arrTime = this[SELECTED][1];

                            let strTypeButton = eleClicked.parentElement.dataset.type;
                            let numIndexButton = eleClicked.dataset.index;
                            if (strTypeButton == 'ampm') {
                                if (numIndexButton == '0') {
                                    arrTime[0] -= 12;
                                } else {
                                    arrTime[0] = Number(arrTime[0]) + 12;
                                }
                                arrTime[0] = String(arrTime[0]).padStart(2, '0');
                            } else if (strTypeButton == 'hour') {
                                arrTime[0] = numIndexButton.padStart(2, '0');
                            } else if (strTypeButton == 'minute') {
                                arrTime[1] = numIndexButton.padStart(2, '0');
                            } else if (strTypeButton == 'second') {
                                arrTime[2] = numIndexButton.padStart(2, '0');
                            }

                            // 改变时间值
                            this[SELECTED][1] = arrTime;

                            // 赋值并刷新样式
                            this.setValue();
                            this.time(eleContainerTime);
                        }
                    }
                }
            });

            // 显隐控制
            this.addEventListener('click', (event) => {
                event.preventDefault();

                // 显隐控制
                if (!this.display) {
                    this.show();
                } else {
                    this.hide();
                }
            });

            // 输入框元素行为
            this.addEventListener('keydown', (event) => {
                if (event.code == 'Enter') {
                    event.preventDefault();
                    this.click();
                }
            });

            // 时间范围选择点击页面空白区域不会隐藏
            document.addEventListener('mouseup', (event) => {
                // 点击页面空白区域，隐藏
                const eleTarget = event.target;

                if (eleTarget && eleTarget != this && eleContainer.contains(eleTarget) == false) {
                    if (this.display) {
                        this.hide();
                    }
                }
            });

            // time类型的上下左右快捷键处理
            document.addEventListener('keydown', event => {
                const strType = eleContainer.dataset.type;
                if (!strType) {
                    return;
                }
                if (strType.includes('time') && this.display == true && eleContainer.contains(document.activeElement)) {
                    if (/^arrow/i.test(event.key)) {
                        event.preventDefault();
                        // 所有列选中元素
                        let eleButtonSelected = [...eleContainer.querySelectorAll('.' + SELECTED)];
                        if (strType.includes('datetime')) {
                            eleButtonSelected = [...eleContainer.querySelectorAll('[data-type="time"] .' + SELECTED)];
                        }
                        let numIndexButton = eleButtonSelected.findIndex(item => item == event.target);
                        // 当前列所有可点击元素
                        let eleButtonClickable = [...event.target.parentElement.querySelectorAll('button:enabled:not([data-visibility="false"])')];
                        let numIndexButtonClickable = eleButtonClickable.findIndex(item => item == event.target);
                        // 上下左右快捷键的处理
                        if (event.key == 'ArrowLeft') {
                            numIndexButton--;
                            if (eleButtonSelected[numIndexButton]) {
                                eleButtonSelected[numIndexButton].focus();
                            }
                        } else if (event.key == 'ArrowRight') {
                            numIndexButton++;
                            if (eleButtonSelected[numIndexButton]) {
                                eleButtonSelected[numIndexButton].focus();
                            }
                        } else if (event.key == 'ArrowUp') {
                            let eleButtonPrev = eleButtonClickable[numIndexButtonClickable - 1];
                            if (!eleButtonPrev) {
                                eleButtonPrev = eleButtonClickable[eleButtonClickable.length - 1];
                            }
                            if (eleButtonPrev) {
                                eleButtonPrev.click();
                                eleButtonPrev.focus();
                            }
                        } else if (event.key == 'ArrowDown') {
                            let eleButtonNext = eleButtonClickable[numIndexButtonClickable + 1];
                            if (!eleButtonNext) {
                                eleButtonNext = eleButtonClickable[0];
                            }
                            if (eleButtonNext) {
                                eleButtonNext.click();
                                eleButtonNext.focus();
                            }
                        }
                    }

                    if (event.key == 'Enter') {
                        this.hide();
                    }
                }
            });

            // 窗口尺寸变化与重定位
            window.addEventListener('resize', () => {
                if (this.display) {
                    this.position();
                }
            });

            return this;
        }

        /**
         * 输入框的值根据日期类型进行格式化
         * @return {Object} 返回当前DOM对象
         */
        format () {
            // 根据当前value值修改DOM元素对象缓存的选中值
            // 特殊情况一般不处理
            const strType = this.params.type;

            // 此时输入框初始值
            const strInitValue = this.value.trim();

            if (!strInitValue) {
                return this;
            }

            switch (strType) {
                case 'date': case 'year': case 'month': {
                    // 日期
                    const objInitDate = strInitValue.toDate();
                    const arrDate = objInitDate.toArray();
                    // eg. [2015,07,20]
                    this[SELECTED] = arrDate;

                    break;
                }
                case 'time': case 'hour': case 'minute': {
                    // 时间
                    const arrTime = strInitValue.toTime();
                    // 补0
                    if (arrTime.length > 1) {
                        this[SELECTED] = [...arrTime];
                    }

                    break;
                }
                case 'datetime': case 'datetime-local': {
                    // 日期和时间
                    const arrDateTime = strInitValue.split(/\s+|T/);
                    const arrPart1 = arrDateTime[0].toDate().toArray();
                    let arrPart2 = ['00', '00'];
                    if (arrDateTime[1] && arrDateTime[1].includes(':')) {
                        arrPart2 = arrDateTime[1].toTime();
                    }

                    this[SELECTED] = [arrPart1, arrPart2];

                    break;
                }
                case 'date-range': case 'month-range': {
                    // 日期范围
                    let objBeginDate = new Date();
                    let objEndDate = new Date();
                    // 前后时间字符串
                    const arrRange = strInitValue.split(' ');
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
        }

        /**
         * 赋值
         * @return {Object} 返回当前输入框的值
         */
        setValue () {
            const arrSelected = this[SELECTED];
            const strValue = this.value;

            switch (this.params.type) {
                case 'date': {
                    this.value = arrSelected.join('-');
                    break;
                }
                case 'month': {
                    this.value = arrSelected.slice(0, 2).join('-');
                    break;
                }
                case 'year': {
                    this.value = arrSelected[0];
                    break;
                }
                case 'date-range': {
                    this.value = `${arrSelected[0].join('-')} 至 ${arrSelected[1].join('-')}`;
                    break;
                }
                case 'month-range': {
                    this.value = `${arrSelected[0].slice(0, 2).join('-')} 至 ${arrSelected[1].slice(0, 2).join('-')}`;
                    break;
                }
                case 'time': case 'minute': {
                    this.value = arrSelected.join(':');
                    break;
                }
                case 'hour': {
                    this.value = `${arrSelected[0]}:00`;
                    break;
                }
                case 'datetime': case 'datetime-local': {
                    this.value = arrSelected[0].join('-') + ' ' + arrSelected[1].join(':');
                    break;
                }
            }

            if (this.value != strValue) {
                this.dispatchEvent(new CustomEvent('change', {
                    'bubbles': true
                }));
            }

            return this.value;
        }

        /**
         * 返回日历HTML字符串等数据的私有方法
         * 因date和range浮层主结构类似，因此这里公用下
         * @param  {Array} arrDate 格式化为数组的日期
         * @return {Object}     返回包含需要的数据的对象，生成的HTML字符内容以及最大最小月份等
         */
        getCalendarData (arrDate) {
            let strHtml = '';
            // 根据当前日期数据返回
            // eg. [2015,'02', 23]

            // 最大最小限制
            let strMin = this.min;
            let strMax = this.max;
            // 类型
            const strType = this.params.type;

            // 如果是日期时间选择，则最大最小月份是前面部分内容
            if (strType.includes('datetime')) {
                if (strMin) {
                    strMin = strMin.split(/\s+/)[0];
                }
                if (strMax) {
                    strMax = this.max.split(/\s+/)[0];
                }
            }

            // 最大日期和最小日期
            let numMin = (strMin || '0001-01-01').toDate();
            let numMax = (strMax || '9999-00-01').toDate();

            const arrChinese = ['日', '一', '二', '三', '四', '五', '六'];
            const arrMonthDay = this.getMonthDay(arrDate);

            // 目前日期对象
            const currentDate = arrDate.join('-').toDate();

            const getStrHtmlDay = () => {
                let strHtmlDay = '';
                arrChinese.forEach((strChineseDay, indexDay) => {
                    strHtmlDay = `${strHtmlDay}<span class="${CL.day('item')} col${indexDay}">${strChineseDay}</span>`;
                });
                return strHtmlDay;
            };

            // 3 星期几七大罪
            strHtml = `<div class="${CL.day('x')}">${getStrHtmlDay()}</div>`;

            // 4. 日期详细
            //  4.1 首先算出今月1号是星期几
            const objNewDate = arrDate.join('-').toDate();
            let numDayFirst = 0;
            // 设置为1号
            objNewDate.setDate(1);

            if (objNewDate.getDate() == 2) {
                objNewDate.setDate(0);
            }
            // 每月的第一天是星期几
            numDayFirst = objNewDate.getDay();
            // 上个月是几月份
            let numLastMonth = objNewDate.getMonth() - 1;
            if (numLastMonth < 0) {
                numLastMonth = 11;
            }

            const strHtmlData = `data-year="${arrDate[0]}" data-month="${objNewDate.getMonth() + 1}"`;
            const strHtmlYearMonthData = 'data-date=';
            let strHtmlFullData = '';

            const getStrHtmlDate = () => {
                let strHtmlDate = '';
                let strClass = '';

                // 列表生成
                for (let tr = 0; tr < 6; tr++) {
                    strHtmlDate = `${strHtmlDate}<div class="${CL.date('tr')}">`;

                    // 日期遍历
                    for (let td = 0; td < 7; td++) {
                        // 类名
                        strClass = `${CL.date('item')} col${td}`;

                        // 今天
                        const numYearNow = arrDate[0];
                        const numMonthNow = objNewDate.getMonth() + 1;
                        let numDayNow;
                        let objDateNow;

                        // 由于range选择和date选择UI上有比较大大差异
                        // 为了可读性以及后期维护
                        // 这里就不耦合在一起，而是分开处理
                        if (strType == 'date' || strType.includes('datetime')) {
                            // 第一行上个月一些日期补全
                            if (tr == 0 && td < numDayFirst) {
                                // 当前日子
                                numDayNow = arrMonthDay[numLastMonth] - numDayFirst + td + 1;
                                // 当前日期
                                objDateNow = new Date(numYearNow, numLastMonth, numDayNow);
                                // 完整data-date属性及其值
                                strHtmlFullData = strHtmlYearMonthData + objDateNow.toArray().join('-');
                                // HTML拼接
                                strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
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
                                        strClass = `${strClass} ${SELECTED}`;
                                    }
                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = `${strHtmlDate}<a href="javascript:;" ${strHtmlData} class="${strClass}" ${strHtmlFullData}>${numDayNow}</a>`;
                                    } else {
                                        strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
                                    }
                                } else {
                                    numDayNow = numDayNow - arrMonthDay[objNewDate.getMonth()];
                                    // 更新strHtmlFullData
                                    strHtmlFullData = strHtmlYearMonthData + new Date(numYearNow, numMonthNow, numDayNow).toArray().join('-');
                                    // 日期字符拼接
                                    strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
                                }
                            }
                        } else if (strType == 'date-range') {
                            // 非当前月部分使用空格补全
                            if (tr == 0 && td < numDayFirst) {
                                strHtmlDate = `${strHtmlDate}<span class="${strClass}"></span>`;
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
                                    const dateBegin = this[SELECTED][0].join('-').toDate();
                                    const dateEnd = this[SELECTED][1].join('-').toDate();

                                    // 各个时间的时间戳
                                    const timeNow = objDateNow.getTime();
                                    const timeBegin = dateBegin.getTime();
                                    const timeEnd = dateEnd.getTime();

                                    if (timeNow >= timeBegin && timeNow <= timeEnd) {
                                        // 在时间范围之内
                                        strClass = `${strClass} ${SELECTED}`;
                                        // 跟开始时间一样
                                        if (timeNow == timeBegin) {
                                            strClass = `${strClass} ${CL.date('begin')}`;
                                        }
                                        // 跟结束时间一样
                                        if (timeNow == timeEnd) {
                                            strClass = `${strClass} ${CL.date('end')}`;
                                        }
                                        // 今月的第一天还是最后一天
                                        if (numDayNow == 1) {
                                            strClass = `${strClass} ${CL.date('first')}`;
                                        } else if (numDayNow == arrMonthDay[objNewDate.getMonth()]) {
                                            strClass = `${strClass} ${CL.date('last')}`;
                                        }
                                    }

                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = `${strHtmlDate}<a href="javascript:;" ${strHtmlData} class="${strClass}" ${strHtmlFullData}>${numDayNow}</a>`;
                                    } else {
                                        strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
                                    }
                                } else {
                                    strHtmlDate = `${strHtmlDate}<span class="${strClass}"></span>`;
                                }
                            }
                        }
                    }
                    strHtmlDate += '</div>';
                }

                return strHtmlDate;
            };

            strHtml = `${strHtml}<div class="${CL.date('body')}">${getStrHtmlDate()}</div>`;

            return {
                monthDay: arrMonthDay,
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }

        /**
         * 月份组装
         * @param  {Array} arrDate 数组化的日期表示值
         * @return {Object}        返回的是后续方法需要的数据的纯对象，包括组装的HTML字符数据，月份最大和最小值。
         */
        getMonthData (arrDate) {
            // 类型
            const strType = this.params.type;
            // 最大最小限制
            let strMin = this.min;
            let strMax = this.max;

            // 如果是日期时间选择，则最大最小月份是前面部分内容
            if (strType.includes('datetime')) {
                if (strMin) {
                    strMin = strMin.split(/\s+/)[0];
                }
                if (strMax) {
                    strMax = this.max.split(/\s+/)[0];
                }
            }

            // 最大月份和最小月份
            let numMin = (strMin || '000000').replace(regDate, '').slice(0, 6);
            let numMax = (strMax || '999912').replace(regDate, '').slice(0, 6);

            const arrChinese = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

            // 年份
            const numYear = arrDate[0] * 1;

            // 获取字符内容方法
            const getStrHtmlDate = () => {
                let strHtmlDate = '';
                let strClass = '';
                let strMonth = '';

                for (let i = 1; i <= 12; i += 1) {
                    // 合法格式字符串
                    if (i < 10) {
                        strMonth = `0${i}`;
                    } else {
                        strMonth = `${i}`;
                    }

                    // 基本类名
                    strClass = CL.date('item');

                    if (strType == 'month' || strType.includes('datetime')) {
                        if (i == arrDate[1]) {
                            // 选中态的类名
                            strClass = `${strClass} ${SELECTED}`;
                        }
                    } else if (strType == 'month-range') {
                        // range选择的匹配规则如下：
                        // 1. 获得已经选中到时间范围
                        // 2. 起始时间和结束时间是选中表示
                        // 3. 之间的时间也是选中表示
                        const strBegin = this[SELECTED][0].slice(0, 2).join('');
                        const strEnd = this[SELECTED][1].slice(0, 2).join('');
                        const strNow = numYear + strMonth;
                        if (strNow >= strBegin && strNow <= strEnd) {
                            strClass = `${strClass} ${SELECTED}`;
                        }
                    }
                    // 是否在范围以内
                    if (numYear + strMonth >= numMin && numYear + strMonth <= numMax) {
                        strHtmlDate = `${strHtmlDate}<a href="javascript:" class="${strClass}" data-year="${numYear}" data-value="${strMonth}">${arrChinese[i - 1]}月</a>`;
                    } else {
                        strHtmlDate = `${strHtmlDate}<span class="${strClass}" data-value="${strMonth}">${arrChinese[i - 1]}月</span>`;
                    }
                }

                return strHtmlDate;
            };

            const strHtml = `<div class="${CL.month('body')}">${getStrHtmlDate()}</div>`;

            return {
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }

        /**
         * 当前日期下这一年每月最大的日期数目
         * @param  {Array} date 格式化为数组的日期
         * @return {Array}      返回这一年每月最大的日期数目
         */
        getMonthDay (date) {
            let arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                arrDate = date.toArray();
            }

            const arrMonthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            // 如果是闰年
            if (((arrDate[0] % 4 == 0) && (arrDate[0] % 100 != 0)) || (arrDate[0] % 400 == 0)) {
                arrMonthDay[1] = 29;
            }

            return arrMonthDay;
        }

        /**
         * 上个月同日期
         * @param  {Array} date 格式化为数组的日期
         * @return {Object}     返回Date类型对象
         */
        getDatePrevMonth (date) {
            // add on 2016-03-31
            // 原先的加减月份的跨月计算是有些问题的
            // 因为例如31号的下一月，系统会自动变成下下个月的1号
            let arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            const numMonth = arrDate[1] * 1;
            const arrMonthDay = this.getMonthDay(arrDate);

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

        /**
         * 下个月同日期
         * @param  {Array} date 格式化为数组的日期
         * @return {Object}     返回Date类型对象
         */
        getDateNextMonth (date) {
            let arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            const numMonth = arrDate[1] * 1;
            const arrMonthDay = this.getMonthDay(arrDate);

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

        /**
         * 选择日期
         * @return {Object} 返回当前DOM对象
         */
        date (container) {
            const eleContainer = container || this.element.target;

            let arrDate = this[SELECTED];

            // 如果是日期时间类型
            if (this.params.type.includes('datetime')) {
                arrDate = arrDate[0];
            }

            // 上一个月
            const numPrevMonth = arrDate[1] - 1;
            // 下一个月
            const numNextMonth = arrDate[1] * 1 + 1;

            const objCalender = this.getCalendarData(arrDate);

            // 选择日期的完整HTML代码
            // 1. 日期专属类名容器
            let strHtml = `<div class="${CL.date('x')}">`;
            // 2. 头部月份切换
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;
            // 根据前后月份是否在范围之外，决定使用的标签类型
            // span标签则是禁用态，本组件全部都是如此
            // 2.1 上个月
            // datePrevMonth指上个月日期
            const datePrevMonth = this.getDatePrevMonth(arrDate);
            // numPrevMonth指上个月
            const numPrevMonthGet = datePrevMonth.getMonth();
            const numPrevYearGet = datePrevMonth.getFullYear();
            const datePrevMonthLastDay = new Date(numPrevYearGet, numPrevMonthGet, objCalender.monthDay[numPrevMonthGet]);

            // 上个月份的最大日期比最小限制大
            // 或者没有最小限制
            // 或者
            if (datePrevMonthLastDay >= objCalender.min) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-month="${numPrevMonth}" role="button" aria-label="上一月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}" aria-label="上一月"></span>`;
            }

            // 2.2 下个月
            const objDateNextMonth = this.getDateNextMonth(arrDate);
            const numNextMonthGet = objDateNextMonth.getMonth();
            const numNextYearGet = objDateNextMonth.getFullYear();

            if (new Date(numNextYearGet, numNextMonthGet, 1) <= objCalender.max) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-month="${numNextMonth}" role="button" aria-label="下一月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}" aria-label="下一月"></span>`;
            }

            // 头部月份公用结束
            strHtml = `${strHtml}<a href="javascript:" class="${CL.date('switch')}" data-type="month" role="button" aria-label="快速切换月份">${arrDate.slice(0, 2).join('-')}</a></div>`;

            // 3. 主体内容来自getCalendarData()方法
            strHtml += objCalender.html;

            // 今天
            // 首先，今天要在时间范围内
            if (new Date() >= objCalender.min && new Date() <= objCalender.max) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('item')} ${CL.date('now')}" role="button">今天</a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('item')} ${CL.date('now')}">今天</span>`;
            }

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'date';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择日期范围
         * @return {Object} 返回当前DOM对象
         */
        ['date-range'] (container) {
            const eleContainer = container || this.element.target;

            // 选择的日期范围数组
            const arrDates = this[SELECTED];
            // 当前起始日期
            // 默认（第一次）打开使用选中日期
            // 如果有，使用面板存储月份
            // 因为range选择不是即时更新文本框
            const arrDate = eleContainer.dataDate || arrDates[0];
            eleContainer.dataDate = arrDate;
            // 前一个月
            const numPrevMonth = arrDate[1] - 1;
            // 后一个月
            const numNextMonth = arrDate[1] * 1 + 1;

            // 含时间范围和对应月份日历HTML的对象
            const objCalender = this.getCalendarData(arrDate);

            // 选择时间范围完整HTML代码
            // 1. 同样的，range容器
            let strHtml = `<div class="${CL.range('x')}">`;
            // 2. 头部
            strHtml = `${strHtml}<div class="${CL.date('head')}"><div class="${CL.date('half')}">`;
            //  2.1 上一个月箭头
            const datePrevMonthLastDay = new Date(arrDate[0], numPrevMonth - 1, objCalender.monthDay[numPrevMonth]);
            // 上个月的最后1天大于min最小限制
            if (datePrevMonthLastDay >= objCalender.min) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-month="${numPrevMonth}" aria-label="上一个月，当前${arrDate[1]}月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}"></span>`;
            }
            // 今月月份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${new Date(arrDate[0], numPrevMonth, arrDate[2]).toArray().slice(0, 2).join('-')}</span></div><div class="${CL.date('half')}">`;

            // 2.2 下下个月
            const objDateNextMonth = new Date(arrDate[0], arrDate[1], 1);
            const objDateAfterMonth = new Date(arrDate[0], numNextMonth, arrDate[2]);

            // 下个月的当前日期在合理范围之内，则使用该月
            if (objDateAfterMonth <= objCalender.max) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-month="${numNextMonth}" aria-label="下一个月，当前${numNextMonth}月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            }

            // 下月月份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${objDateNextMonth.toArray().slice(0, 2).join('-')}</span></div>`;

            // 头部闭合
            strHtml += '</div>';

            // 3. 两个主体列表
            // 这里要嵌套一层range特有的body
            // 根据getCalendarData()方法创建两个月份日历
            // 主体标签闭合
            strHtml = `${strHtml}<div class="${CL.range('body')} ${CL.range('date', 'body')}">\
            <div class="${CL.date('half')}">${objCalender.html}</div>\
            <div class="${CL.date('half')}">${this.getCalendarData(objDateNextMonth.toArray()).html}</div>\
            </div>`;

            // 4. 确定与取消按钮
            strHtml = `${strHtml}<div class="${CL.range('footer')}">\
            <button class="ui-button" data-type="primary">确定</button>\
            <button class="ui-button" data-type="normal">取消</button>\
            </div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'date-range';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择月份
         * @return {Object} 返回当前DOM对象
         */
        month (container) {
            const eleContainer = container || this.element.target;

            // 当前选择日期
            let arrDate = this[SELECTED];

            if (this.params.type.includes('datetime')) {
                arrDate = arrDate[0];
            }

            // 对应的月份数据
            const objMonth = this.getMonthData(arrDate);

            // 返回的最大值最小值
            const numMin = objMonth.min;
            const numMax = objMonth.max;

            // 选择月份的完整HTML代码
            // 1. month专属类名容器
            let strHtml = `<div class="${CL.month('x')}">`;
            // 2. 月份切换的头部
            const numYear = arrDate[0] * 1;
            //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
            //    例如，假设今年是2015年，则头部年份范围是2009-2020
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;
            //    2.1 是否还有上一年
            if (numYear - 1 >= Math.floor(numMin / 100) && numYear - 1 <= Math.floor(numMax / 100)) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-year="${numYear - 1}" role="button" aria-label="上一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}" aria-label="上一年"></span>`;
            }
            // 2.2 是否还有下一年
            if (numYear + 1 >= Math.floor(numMin / 100) && numYear + 1 <= Math.floor(numMax / 100)) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-year="${numYear + 1}" role="button" aria-label="下一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            }
            // 头部结束
            strHtml = `${strHtml}<a href="javascript:" class="${CL.date('switch')}" data-type="year" role="button" title="快速切换年份" aria-label="快速切换年份">${numYear}</a>\
            </div>`;
            // 3. 月份切换主体列表
            strHtml += objMonth.html;

            // 今月
            // 首先，今月要在时间范围内
            const objThisYearMonth = new Date().toArray().slice(0, 2).join('');
            if (objThisYearMonth >= numMin && objThisYearMonth <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('item')} ${CL.date('now')}">今月</a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('item')} ${CL.date('now')}">今月</span>`;
            }

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'month';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择月份范围
         * @return {Object} 返回当前DOM对象
         */
        ['month-range'] (container) {
            const eleContainer = container || this.element.target;

            // 当前选择日期
            const arrDates = this[SELECTED];
            // 当前起始日期
            // 默认（第一次）打开使用选中日期
            // 如果有，使用面板存储月份
            // 因为range选择不是即时更新文本框
            const arrDate = eleContainer.dataDate || arrDates[0];
            eleContainer.dataDate = arrDate;
            // 前一年
            const numPrevYear = arrDate[0] * 1 - 1;
            // 后一个年
            const numNextYear = arrDate[0] * 1 + 1;

            // 含时间范围和对应月份日历HTML的对象
            const objMonth = this.getMonthData(arrDate);
            // 最大年份
            const numMaxYear = objMonth.max.slice(0, 4);
            const numMinYear = objMonth.min.slice(0, 4);

            // 选择时间范围完整HTML代码
            // 1. 同样的，range容器
            let strHtml = `<div class="${CL.range('x')}">`;
            // 2. 头部
            strHtml = `${strHtml}<div class="${CL.date('head')}">\
            <div class="${CL.date('half')}">`;
            //  2.1 上一年箭头
            if (numPrevYear >= numMinYear && numPrevYear <= numMaxYear) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-year="${numPrevYear}" role="button" aria-label="上一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}" aria-label="上一年"></span>`;
            }
            // 今年年份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${arrDate[0]}</span>\
            </div>\
            <div class="${CL.date('half')}">`;

            // 2.2 下一年
            if (numNextYear >= numMinYear && numNextYear < numMaxYear) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-year="${numNextYear}" role="button" aria-label="下一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}" aria-label="下一年"></span>`;
            }

            // 下月月份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${numNextYear}</span>\
            </div>`;

            // 头部闭合
            strHtml += '</div>';

            // 3. 两个主体列表
            // 这里要嵌套一层range特有的body
            // 根据getCalendarData()方法创建两个月份日历
            // 主体标签闭合
            strHtml = `${strHtml}<div class="${CL.range('body')} ${CL.range('month', 'body')}">\
            <div class="${CL.date('half')}">${objMonth.html}</div>\
            <div class="${CL.date('half')}">${this.getMonthData([numNextYear, arrDate[1], arrDate[2]]).html}</div>\
            </div>`;

            // 4. 确定与取消按钮
            strHtml = `${strHtml}<div class="${CL.range('footer')}">\
            <button class="ui-button" data-type="primary">确定</button>\
            <button class="ui-button" data-type="normal">取消</button>\
            </div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'month-range';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择年份
         * @return {Object} 返回当前DOM对象
         */
        year (container) {
            // 元素
            const eleContainer = container || this.element.target;

            // 最大最小限制
            let strMin = this.min;
            let strMax = this.max;

            // 最小年份和最大年份
            let numMin = 0;
            let numMax = 9999;
            // 类型
            const strType = this.params.type;

            // 当前选择日期
            let arrDate = this[SELECTED];

            if (strType.includes('datetime')) {
                arrDate = arrDate[0];

                // 最大年份和最小年份
                if (strMin) {
                    numMin = strMin.split(/\s+/)[0].toDate().getFullYear();
                }
                if (strMax) {
                    numMax = strMax.split(/\s+/)[0].toDate().getFullYear();
                }
            }

            // 选择年份的完整HTML代码
            // 1. 同样的，year专属类名容器
            let strHtml = `<div class="${CL.year('x')}">`;
            // 2. 头部的年份切换，一切就是12年
            //    有必要先知道当前的年份
            const numYear = arrDate[0];
            //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
            //    例如，假设今年是2015年，则头部年份范围是2009-2020
            //    左右切换是没有限制的
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;
            //    年份不是你想翻就能翻到
            //    2.1 上一个12年
            if (numYear - 12 >= numMin && numYear - 12 <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-year="${numYear - 12}" role="button" aria-label="上一个12年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}"></span>`;
            }
            //    2.2 下一个12年
            if (numYear + 12 >= numMin && numYear + 12 <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-year="${numYear + 12}" role="button" aria-label="下一个12年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            }
            // year选择是顶级类别，一定是不可点击的
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${[numYear - 6, numYear + 5].join('-')}</span></div>`;

            const getStrHtmlDate = () => {
                let strHtmlDate = '';
                let strClass = '';

                for (let indexYear = numYear - 6; indexYear < numYear + 6; indexYear += 1) {
                    // 选中态的类名
                    strClass = CL.date('item');

                    if (indexYear == numYear) {
                        strClass = `${strClass} ${SELECTED}`;
                    }

                    // 是否在范围以内
                    if (indexYear >= numMin && indexYear <= numMax) {
                        strHtmlDate = `${strHtmlDate}<a href="javascript:" class="${strClass}">${indexYear}</a>`;
                    } else {
                        strHtmlDate = `${strHtmlDate}<span class="${strClass}">${indexYear}</span>`;
                    }
                }

                return strHtmlDate;
            };
            // 3. 年份选择的主体
            strHtml = `${strHtml}<div class="${CL.year('body')}">${getStrHtmlDate()}</div>`;

            // 今年
            // 首先，今年要在时间范围内
            const numThisYear = new Date().getFullYear();
            if (numThisYear >= numMin && numThisYear <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('item')} ${CL.date('now')}" role="button">今年</a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('item')} ${CL.date('now')}">今年</span>`;
            }

            // 头部标签闭合
            strHtml += '</div>';

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'year';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择小时
         * @return {Object} 返回当前DOM对象
         */
        hour (container) {
            // 元素
            const eleContainer = container || this.element.target;

            // 当前选择时间
            const arrTime = this[SELECTED];

            // 时间选择的小时间隔，默认是1小时
            let numStep = this.step || 1;

            // 最小时间，和最大时间
            // 这里只比较小时
            let numMin = Number(this.min.split(':')[0]) || 0;
            let numMax = Number(this.max.split(':')[0]);
            if (isNaN(numMax) || !this.max) {
                numMax = 24;
            }

            // 选择小时的完整HTML
            // 1. 同样的，专有容器
            let strHtml = `<div class="${CL.hour('x')}">`;

            const getStrHtmlTime = () => {
                let strHtmlTime = '';
                let strHour = '';
                let strClass = '';
                // 遍历24小时
                for (let indexHour = 0; indexHour < 24; indexHour += numStep) {
                    strHour = String(indexHour).padStart(2, '0');

                    // 选中态的类名
                    strClass = CL.date('item');
                    if (strHour == arrTime[0]) {
                        strClass = `${strClass} ${SELECTED}`;
                    }

                    // 是否在范围以内
                    if (indexHour >= numMin && indexHour <= numMax) {
                        strHtmlTime = `${strHtmlTime}<a href="javascript:" class="${strClass}">${strHour}:00</a>`;
                    } else {
                        strHtmlTime = `${strHtmlTime}<span class="${strClass}">${strHour}:00</span>`;
                    }
                }

                return strHtmlTime;
            };
            // 2. 小时没有头部切换，直接列表们
            strHtml = `${strHtml}<div class="${CL.hour('body')}">${getStrHtmlTime()}</div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'hour';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择时间，多垂直列表选择模式，支持到时分秒
         * step如果设置，则可以选择秒
         */
        time (container) {
            // 元素
            const eleContainer = container || this.element.target;

            // 当前选择时间
            let arrTime = this[SELECTED];
            let arrDate = null;

            // 如果是日期时间类型
            const strType = this.params.type;
            if (strType.includes('datetime')) {
                arrDate = this[SELECTED][0];
                arrTime = this[SELECTED][1];
            }

            let numHourSelected = Number(arrTime[0]);
            let numMinuteSelected = Number(arrTime[1]);
            let numSecondSelected = Number(arrTime[2]);

            // 时间间隔, 默认为1秒或者1分钟
            let numStep = this.step * 1 || 1;
            if (numStep > 60) {
                numStep = Math.floor(numStep / 60);
            }

            let strMin = this.min;
            let strMax = this.max;

            // 如果是日期时间选择，则时间范围与日期值强烈相关
            if (strType.includes('datetime') && arrDate && (strMin || strMax)) {
                let strMinDate = '';
                let strMinTime = '';
                if (strMin) {
                    strMinDate = strMin.split(/\s+/)[0];
                    strMinTime = strMin.split(/\s+/)[1];
                }
                let strMaxDate = '';
                let strMaxTime = '';
                if (strMax) {
                    strMaxDate = strMax.split(/\s+/)[0];
                    strMaxTime = strMax.split(/\s+/)[1];
                }

                // 如果日期范围不对
                if ((strMinDate && arrDate.join('-').toDate() < strMinDate.toDate()) || (strMaxDate && arrDate.join('-').toDate() > strMaxDate.toDate())) {
                    strMin = '24:60:60';
                    strMax = '00:00:00';
                } else if (arrDate.join('-') == strMinDate) {
                    // 正好是最小日期，则超过的时间禁用
                    strMin = strMinTime;
                    strMax = '23:59:59';
                } else if (arrDate.join('-') == strMaxDate) {
                    // 正好是最大日期选拸禁用
                    strMax = strMaxTime;
                    strMin = '00:00:00';
                }
            }

            // 默认时间范围的处理
            strMin = strMin || '00:00:00';
            strMax = strMax || '23:59:59';

            let numMinHour = Number(strMin.split(':')[0]) || 0;
            let numMinMinute = Number(strMin.split(':')[1]) || 0;
            let numMinSecond = Number(strMin.split(':')[2]) || 0;

            let numMaxHour = Number(strMax.split(':')[0]);
            if (isNaN(numMaxHour)) {
                numMaxHour = 23;
            }
            let numMaxMinute = Number(strMax.split(':')[1]);
            let numMaxSecond = Number(strMax.split(':')[2]);
            if (isNaN(numMaxMinute)) {
                numMaxMinute = 59;
            }
            if (isNaN(numMaxSecond)) {
                numMaxSecond = 59;
            }

            let arrAmpm = [];
            if (this.datetimeformat != 'H:mm') {
                // pm
                arrAmpm = [0, 1].map(index => {
                    if (index == 0) {
                        return  {
                            value: '上午',
                            selected: numHourSelected <= 11
                        };
                    }
                    return  {
                        value: '下午',
                        selected: numHourSelected > 11
                    };
                });
            }

            // 小时的范围
            let arrHours = Array(24).fill().map((empty, index) => {
                let disabled = false;
                if (index < numMinHour || index > numMaxHour) {
                    disabled = true;
                }
                // 是否隐藏
                let visibility = true;
                // 是否选中
                let selected = false;

                let value = String(index).padStart(2, '0');

                if (this.datetimeformat != 'H:mm') {
                    if ((index > 11 && arrAmpm[0].selected) || (index <= 11 && arrAmpm[1].selected)) {
                        visibility = false;
                    }

                    if (index >= 12) {
                        value = String(index - 12).padStart(2, '0');
                    }
                    if (value == '00') {
                        value = '12';
                    }
                }

                if (index == numHourSelected) {
                    selected = true;
                }

                return {
                    value: value,
                    disabled: disabled,
                    selected: selected,
                    visibility: visibility
                };
            });

            // 小时和分钟的禁用态处理
            let arrMinutes = Array(60).fill().map((empty, index) => {
                // 是否禁用
                let disabled = false;
                // 是否不可见
                let visibility = true;
                // 是否选中
                let selected = false;

                if (numHourSelected == numMinHour && index < numMinMinute) {
                    disabled = true;
                } else if (numHourSelected == numMaxHour && index > numMaxMinute) {
                    disabled = true;
                } else if (numHourSelected < numMinHour || numHourSelected > numMaxHour) {
                    disabled = true;
                }
                // step的处理
                if (arrTime.length == 2 && index % numStep != 0) {
                    visibility = false;
                }

                if (index == numMinuteSelected) {
                    selected = true;
                }

                return {
                    value: String(index).padStart(2, '0'),
                    disabled: disabled,
                    visibility: visibility,
                    selected: selected
                };
            });

            let arrSeconds = Array(60).fill().map((empty, index) => {
                // 是否禁用
                let disabled = false;
                // 是否不可见
                let visibility = true;
                // 是否选中
                let selected = false;

                if (numHourSelected == numMinHour && numMinuteSelected == numMinMinute && index < numMinSecond) {
                    disabled = true;
                } else if (numHourSelected == numMaxHour && numMinuteSelected == numMaxMinute && index > numMaxSecond) {
                    disabled = true;
                }
                // step的处理
                if (arrTime.length == 3 && index % numStep != 0) {
                    visibility = false;
                }

                if (index == numSecondSelected) {
                    selected = true;
                }

                return {
                    value: String(index).padStart(2, '0'),
                    disabled: disabled,
                    visibility: visibility,
                    selected: selected
                };
            });

            if (eleContainer.innerHTML) {
                // 如果有内容，基于DOM比对
                [...eleContainer.querySelectorAll('button')].forEach(function (button) {
                    // 所有样式先还原
                    button.classList.remove(SELECTED);
                    button.disabled = false;
                    button.dataset.visibility = 'true';
                    // 按钮再所在分组的索引值
                    let numIndexButton = button.dataset.index;
                    // 再分别匹配处理
                    let strButtonType = button.parentElement.dataset.type;
                    if (strButtonType == 'ampm') {
                        if (arrAmpm[numIndexButton].selected) {
                            button.classList.add(SELECTED);
                        }
                    } else {
                        // 时分秒可以统一处理
                        let objTypeData = {
                            hour: arrHours,
                            minute: arrMinutes,
                            second: arrSeconds
                        };
                        let objDataMatch = objTypeData[strButtonType][numIndexButton];
                        if (objDataMatch.selected) {
                            button.classList.add(SELECTED);
                        }
                        if (objDataMatch.disabled) {
                            button.disabled = true;
                        }
                        if (objDataMatch.visibility == false) {
                            button.dataset.visibility = 'false';
                        }
                    }
                });

                return this;
            }

            // 选择时间的完整HTML
            // 1. 外部的容器，含有专有容器类名，可以重置内部的一些样式
            let strHtml = `<div class="${CL.time('x')}" data-step="${numStep}">`;

            // 上午下午
            if (this.datetimeformat != 'H:mm') {
                strHtml = strHtml + `<div class="${CL.time('col')}" data-type="ampm">
                    ${arrAmpm.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' selected' : ''}" data-index="${index}">${obj.value}</button>`).join('')}
                </div>`;
            }
            // 时分秒
            strHtml = strHtml + `<div class="${CL.time('col')}" data-type="hour">
                ${arrHours.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' ' + SELECTED : ''}" data-index="${index}"${obj.disabled ? ' disabled' : ''} data-visibility="${obj.visibility}">${obj.value}</button>`).join('')}
            </div>`;
            strHtml = strHtml + `<div class="${CL.time('col')}" data-type="minute">
                ${arrMinutes.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' ' + SELECTED : ''}" data-index="${index}"${obj.disabled ? ' disabled' : ''} data-visibility="${obj.visibility}">${obj.value}</button>`).join('')}
            </div>`;

            if (arrTime.length == 3) {
                strHtml = strHtml + `<div class="${CL.time('col')}" data-type="second">
                    ${arrSeconds.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' ' + SELECTED : ''}" data-index="${index}"${obj.disabled ? ' disabled' : ''} data-visibility="${obj.visibility}">${obj.value}</button>`).join('')}
                </div>`;
            }

            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'time';
            eleContainer.innerHTML = strHtml;
        }

        /**
         * 选择分钟
         * @return {Object} 返回当前DOM对象
         */
        minute (container) {
            // 元素
            const eleContainer = container ||  this.element.target;

            // 当前选择时间
            const arrTime = this[SELECTED];

            // 分钟时间间隔, 默认为5分钟
            const numStep = this.step * 1 || 1;

            // 最小时间，和最大时间
            // 跟小时不同，这里必须符合00:00格式
            // 由于格式固定，我们直接去除':'后的值进行比较
            // 例如：10:20 → 1020
            let numMin = (this.min || '0').replace(':', '') * 1;
            let numMax = (this.max || '2359').replace(':', '') * 1;

            // 选择分钟的完整HTML
            // 1. 外部的容器，含有专有容器类名，可以重置内部的一些样式
            let strHtml = `<div class="${CL.minute('x')}" data-step="${numStep}">`;
            // 2. 头部小时的左右切换
            const hour = arrTime[0] * 1;
            //   首先是公共部分
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;

            //   2.1 可不可往前翻
            if (hour <= Math.floor(numMin / 100)) {
                strHtml = `${strHtml}<span class="${CL.date('prev')}"></span>`;
            } else {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-hour="${hour - 1}" role="button" aria-label="上一个小时"></a>`;
            }
            // 2.2 可不可以往后翻
            if (hour >= Math.floor(numMax / 100)) {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            } else {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-hour="${hour + 1}" role="button" aria-label="下一个小时"></a>`;
            }

            // 头部结束的公共html部分
            strHtml = `${strHtml}<a href="javascript:" class="${CL.date('switch')}" data-type="hour">${arrTime[0]}:00</a></div>`;

            const getStrHtmlTime = () => {
                let strHtmlTime = '';
                let strMinute = '';
                let strClass = '';
                // 遍历60分钟
                for (let indexMinute = 0; indexMinute < 60; indexMinute += numStep) {
                    strMinute = `${indexMinute}`;
                    if (strMinute.length == 1) {
                        strMinute = `0${strMinute}`;
                    }

                    // 基本样式
                    strClass = CL.date('item');

                    // 是否在时间范围内
                    if ((arrTime[0] + strMinute) * 1 >= numMin && (arrTime[0] + strMinute) * 1 <= numMax) {
                        // 选中态
                        if (strMinute == arrTime[1]) {
                            strClass = `${strClass} ${SELECTED}`;
                        }
                        strHtmlTime = `${strHtmlTime}<a href="javascript:" class="${strClass}">${[arrTime[0], strMinute].join(':')}</a>`;
                    } else {
                        strHtmlTime = `${strHtmlTime}<span class="${strClass}">${[arrTime[0], strMinute].join(':')}</span>`;
                    }
                }

                return strHtmlTime;
            };
            // 3. 分钟主体
            strHtml = `${strHtml}<div class="${CL.minute('body')}">${getStrHtmlTime()}</div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'minute';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        // 日期时间选择
        datetime (container) {
            // 元素
            const eleContainer = container || this.element.target;

            // 创建容器元素
            eleContainer.dataset.type = 'datetime';
            eleContainer.innerHTML = `<div class="${CL.datetime('x')}"></div>`;

            // 创建两个容器元素
            const eleDateX = document.createElement('div');
            const eleTimeX = document.createElement('div');
            // 类名
            eleDateX.className = CL.datetime('date');
            eleTimeX.className = CL.datetime('time');
            // append到容器中
            eleContainer.querySelector('div').append(eleDateX, eleTimeX);

            // 设置日期和时间内容
            this.date(eleDateX);
            this.time(eleTimeX);

            return this;
        }

        ['datetime-local'] () {
            return this.datetime();
        }

        /**
         * 面板的定位
         * @return 当前DOM元素对象
         */
        position () {
            // 定位
            this.follow();

            return this;
        }

        /**
         * 日期选择面板的显示
         * @return {Object} 当前DOM元素对象
         */
        show () {
            // 元素
            const eleContainer = this.element.target;

            if (this.disabled) {
                return this;
            }

            // 根据value更新SELECTED
            this.format();

            // 不同的类名显示不同的内容
            if (this.params.type == 'date-range') {
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
                // DOM准备完毕
                this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
            }

            eleContainer.style.display = 'inline-block';
            this.classList.add(ACTIVE);

            // 定位
            this.position();

            // 改变显示与隐藏的标志量
            this.display = true;

            // 选中的元素进入视区
            let eleTimeSelectedAll = null;
            if (this.params.type == 'time') {
                eleTimeSelectedAll = eleContainer.querySelectorAll('.' + SELECTED);
            } else if (this.params.type.includes('datetime')) {
                eleTimeSelectedAll = eleContainer.querySelectorAll('[data-type="time"] .' + SELECTED);
            }

            if (eleTimeSelectedAll) {
                eleTimeSelectedAll.forEach((item, index) => {
                    if (item.scrollIntoViewIfNeeded) {
                        item.scrollIntoViewIfNeeded();
                    } else if (item.offsetTop - 5 > item.parentElement.scrollTop + item.parentElement.clientHeight || item.offsetTop - 5 < item.parentElement.scrollTop) {
                        // firefox尚未支持scrollIntoViewIfNeeded()
                        item.parentElement.scrollTop = item.offsetTop - 5;
                    }
                    if (index == 0) {
                        item.focus({
                            preventScroll: true
                        });
                    }
                });
            }

            // 触发自定义事件 - show
            this.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-datetime'
                }
            }));

            return this;
        }

        /**
         * 日期选择面板的隐藏
         * @return {Object} 当前DOM元素对象
         */
        hide () {
            // 元素
            const eleContainer = this.element.target;

            if (this.display == true) {
                eleContainer.style.display = 'none';
                this.classList.remove(ACTIVE);

                // 焦点位置还原
                if (document.activeElement == document.body || eleContainer.contains(document.activeElement)) {
                    this.focus();
                    this.blur();
                }
            }

            // 改变显示与隐藏的标志量
            this.display = false;

            // 触发自定义事件 - hide
            this.dispatchEvent(new CustomEvent('hide', {
                detail: {
                    type: 'ui-datetime'
                }
            }));

            return this;
        }

        // 自定义组件进入页面时候
        connectedCallback () {
            if (this.isConnectedCallback) {
                return;
            }
            // 普通文本类型变成日期类型
            let strType = this.getAttribute('type');
            if (['date', 'year', 'month', 'time', 'hour', 'minute', 'datetime', 'datetime-local', 'date-range', 'month-range'].includes(strType) == false) {
                strType = 'date';

                // 移除type属性可以和CSS中设置的尺寸的选择器匹配
                if (strType) {
                    this.removeAttribute('type');
                }
            }
            // 关联的参数
            this.params = this.params || {};
            // 输入框应用的时间选择类型
            this.params.type = strType;

            // 容器元素
            let eleContainer = null;

            // readonly 文本输入框不可直接修改
            this.setAttribute('readonly', 'readonly');
            this.toggleAttribute('required', true);

            let strId = this.id;
            if (!strId) {
                // 如果没有id, 创建随机id
                strId = `lulu_${String(Math.random()).replace('0.', '')}`;
                this.id = strId;
            }

            // 初始值
            let strInitValue = this.getAttribute('value') || this.value;

            // 初始值转换成时间值
            switch (strType) {
                case 'date': case 'year': case 'month': {
                    // 日期
                    const objInitDate = strInitValue.toDate();
                    const arrDate = objInitDate.toArray();

                    // 赋值
                    if (strType == 'date') {
                        this.value = arrDate.join('-');
                    } else if (strType == 'year') {
                        this.value = arrDate[0];
                    } else if (strType == 'month') {
                        this.value = arrDate.slice(0, 2).join('-');
                    }

                    // eg. [2015,07,20]
                    this[SELECTED] = arrDate;

                    break;
                }
                case 'time': {
                    const arrTime = strInitValue.toTime();
                    // 当前时分秒
                    let dateCurrent = new Date();
                    let numHour = dateCurrent.getHours();
                    let numMinute = dateCurrent.getMinutes();
                    let numSecond = dateCurrent.getSeconds();
                    // 时间
                    let strHour = String(arrTime[0] || numHour).padStart(2, '0');
                    let strMinute = String(arrTime[1] || numMinute).padStart(2, '0');
                    let strSecond = String(arrTime[2] || numSecond).padStart(2, '0');

                    // 如果有设置合理的step值，且类型是time，则支持秒
                    let numStep = this.step;

                    if (strType == 'time' && ((!numStep && arrTime[2]) || (numStep > 0 && numStep <= 30))) {
                        this.value = [strHour, strMinute, strSecond].join(':');
                    } else {
                        this.value = [strHour, strMinute].join(':');
                    }

                    this[SELECTED] = [strHour, strMinute, strSecond];

                    break;
                }
                case 'hour': case 'minute': {
                    const arrTime = strInitValue.toTime();
                    // 当前时分秒
                    let dateCurrent = new Date();
                    let numHour = dateCurrent.getHours();
                    let numMinute = dateCurrent.getMinutes();
                    // 时间
                    let strHour = String(arrTime[0] || numHour).padStart(2, '0');
                    let strMinute = String(arrTime[1] || numMinute).padStart(2, '0');

                    if (!arrTime[0] && strType == 'hour') {
                        strMinute = '00';
                    }

                    this.value = [strHour, strMinute].join(':');

                    this[SELECTED] = [strHour, strMinute];

                    break;
                }
                case 'datetime': case 'datetime-local': {
                    // 日期和时间
                    const arrDateTime = strInitValue.split(/\s+|T/);
                    const arrPart1 = arrDateTime[0].toDate().toArray();
                    // 默认的时间
                    let dateCurrent = new Date();
                    let arrPart2 = [String(dateCurrent.getHours()).padStart(2, '0'), String(dateCurrent.getMinutes()).padStart(2, '0')];
                    if (arrDateTime[1] && arrDateTime[1].includes(':')) {
                        arrPart2 = arrDateTime[1].toTime();
                    }
                    this.value = arrPart1.join('-') + ' ' + arrPart2.join(':');

                    this[SELECTED] = [arrPart1, arrPart2];

                    break;
                }
                case 'date-range': case 'month-range': {
                    // 日期范围
                    let objBeginDate = new Date();
                    let objEndDate = new Date();
                    // 前后时间字符串
                    const arrRange = strInitValue.split(' ');
                    // 有如下一些情况：
                    // 1. 空，则选择范围就是今日
                    // 2. 只有一个时间，则选择范围只这个时间到今天这个范围
                    // 3. 其他就是正常的
                    if (strInitValue != '' && arrRange.length == 1) {
                        const someDate = arrRange[0].toDate();
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
                    const arrBegin = objBeginDate.toArray();
                    const arrEnd = objEndDate.toArray();

                    if (strType == 'date-range') {
                        this.value = `${arrBegin.join('-')} 至 ${arrEnd.join('-')}`;
                    } else {
                        this.value = `${arrBegin.slice(0, 2).join('-')} 至 ${arrEnd.slice(0, 2).join('-')}`;
                    }

                    // 存储
                    this[SELECTED] = [arrBegin, arrEnd];

                    break;
                }                
            }

            // time时间类型的是H:mm还是ah:mm的判断
            if (/time/.test(strType)) {
                // 默认是24小时类型，不支持time类型输入框的浏览器会使用此类型，例如Safari
                this.datetimeformat = 'H:mm';

                if (!strType.includes('datetime')) {
                    // 根据尺寸判断
                    let eleInputTmp = document.createElement('input');
                    eleInputTmp.setAttribute('type', 'time');
                    eleInputTmp.value = '00:00';
                    document.body.append(eleInputTmp);
                    // 默认不可见
                    eleInputTmp.style.position = 'absolute';
                    eleInputTmp.style.left = '-999px';
                    eleInputTmp.style.fontFamily = 'revert';
                    // 如果浏览器不支持time类型输入框，例如Safari，则使用H:mm格式
                    if (eleInputTmp.type == 'time') {
                        eleInputTmp.style.fontSize = '20px';
                        // 获取此时输入框的尺寸
                        let numWidthOrigin = eleInputTmp.clientWidth;
                        // 修改尺寸
                        eleInputTmp.style.fontSize = '30px';
                        // 比较前后尺寸变化的差异
                        let numDiffWidth = eleInputTmp.clientWidth - numWidthOrigin;
                        // 可以判断输入框字符个数
                        let numLetters = Math.ceil(numDiffWidth / 10);
                        if (numLetters >= 5) {
                            this.datetimeformat = 'ah:mm';
                        }
                        eleInputTmp.remove();
                    }
                }
            }

            // 容器元素的创建
            if (!eleContainer) {
                eleContainer = document.createElement('div');
                eleContainer.classList.add(CL.date('container'));

                // keyboard键盘无障碍访问需要
                const strRandId = `lulu_${String(Math.random()).replace('0.', '')}`;
                eleContainer.setAttribute('id', strRandId);
                eleContainer.classList.add('ESC');
                this.setAttribute('data-target', strRandId);
                // 记录input的id
                eleContainer.setAttribute('data-id', strId);
            }

            // 暴露的一些数据
            // 关联的元素
            this.element = this.element || {};
            this.element.target = eleContainer;

            this.events();

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-datetime'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    return Component;
})();

if (!customElements.get('ui-datetime')) {
    customElements.define('ui-datetime', DateTime, {
        extends: 'input'
    });
}

// export default DateTime;

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

// import './ErrorTip.js';

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
                    document.querySelectorAll('label[for="' + strId + '"]').forEach(function (eleLabel) {
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

                    // 如果是日期选择
                    if (strType.includes('datetime')) {
                        strValue = strValue.replace('T', ' ');
                        if (strAttrMin) {
                            strAttrMin.replaceAll('/', '-').replace('T', ' ');
                        }
                        if (strAttrMax) {
                            strAttrMax.replaceAll('/', '-').replace('T', ' ');
                        }
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
                } else {
                    // 触发验证通过与否的自定义事件
                    element.dispatchEvent(new CustomEvent(valid ? 'valid' : 'invalid'));
                }

                // 获取提示应该显示的元素
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

                // 出错显示逻辑
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

        Object.defineProperty(prop, 'validationMessage', {
            get () {
                return document.validate.getReportText(this);
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
         * @param {Function} callback 可选，表示验证成功的回调，可以使用自定义 DOM 事件代替
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
                ]
            };

            if (typeof callback == 'object') {
                options = callback;
                // 下一行其实去掉也没什么事，
                // 放着是防止以后有什么新逻辑，
                // 没有这一行可能会导致报错
                callback = null;
            }

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

                if (this.checkValidity()) {
                    if (typeof callback == 'function') {
                        callback.call(this, eleForm);
                    }
                    eleForm.dispatchEvent(new CustomEvent('valid'));
                }

                return false;
            });

            // 暴露的数据
            this.element = {
                form: eleForm
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

                const eleMin = eleLabel.querySelector('span, output') || eleLabel;

                // 计数，标红方法
                const funCount = function () {
                    const length = document.validate.getLength(element);
                    // 实时更新现在的字符个数
                    eleMin.innerHTML = length;

                    // 超出范围或范围不足
                    if (length != 0 && (length > strAttrMaxLength || (strAttrMinLength && length < strAttrMinLength))) {
                        eleMin.classList.add('error');
                        eleMin.toggleAttribute('is-error', true);
                    } else {
                        eleMin.classList.remove('error');
                        eleMin.toggleAttribute('is-error', false);
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
                            // 如果设置了不增强处理，也忽略
                            if (this.dataset.enhance == 'false') {
                                return;
                            }
                            // 获取选中的文本内容
                            let textSelected = this.value.slice(element.selectionStart, element.selectionEnd);

                            // 只有输入框没有数据，或全选状态才处理
                            if (this.value.trim() == '' || textSelected === this.value) {
                                // 阻止冒泡和默认粘贴行为
                                event.preventDefault();
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

            eleForm.querySelectorAll('input, select, textarea').forEach(element => {
                // 还没有出现不合法的验证
                if (isAllPass == true || this.params.multiple) {
                    // multiple参数为true的时候，其他都要标红，但提示仅出现在第一个错误元素上
                    const isPass = element.validity.valid;

                    if (isAllPass == true && isPass == false) {
                        // reportValidity方法也会执行styleError
                        // 因此 styleError 这句在 else 中执行
                        this.reportValidity(element);
                        isAllPass = false;
                    } else {
                        document.validate.styleError(element, isPass);
                    }
                }
            });

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


/**
 * 给任意 <form> 元素 注入 validate 方法
 */
HTMLFormElement.prototype.validate = function () {
    new Validate(this);

    return this;
};

// 观察is-validate属性，并认为绑定验证
(function () {
    const initAllValidate = (ele) => {
        const eleValidates = ele || document.querySelectorAll('[is-validate]');

        eleValidates.forEach(item => {
            item.validate();
            item.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-validate'
                }
            }));
            item.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        });
    };

    /**
     * 初始化并监听页面包含is-pagination属性的DOM节点变化
     */
    const autoInitAndWatchingValidate = () => {
        // 先实例化已有is-pagination属性的DOM节点，再监听后续的节点变化
        initAllValidate();
        const observer = new MutationObserver(mutationsList => {
            mutationsList.forEach(mutation => {
                mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                    if (!eleAdd.tagName) {
                        return;
                    }
                    if (eleAdd.hasAttribute('is-validate')) {
                        initAllValidate([eleAdd]);
                    } else {
                        initAllValidate(eleAdd.querySelectorAll('[is-validate]'));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState != 'loading') {
        autoInitAndWatchingValidate();
    } else {
        window.addEventListener('DOMContentLoaded', autoInitAndWatchingValidate);
    }
})();

// export default Validate;

/**
 * @Pagination.js
 * @author XboxYan(yanwenbin)
 * @version
 * @Created: 20-04-22
 * @edit:    20-04-22
 */

class Pagination extends HTMLElement {

    static get observedAttributes () {
        return ['per', 'total', 'current', 'loading'];
    }

    constructor ({per, total, current, loading, href, container = null, onChange = () => {}} = {}) {
        super();
        const shadowRoot = this.attachShadow({
            mode: 'open'
        });
        const isLink = href || this.href;
        const el = isLink ? 'a' : 'button';
        if (per) {
            this.per = per;
        }
        if (total) {
            this.total = total;
        }
        if (current) {
            this.setAttribute('current', current);
        }
        this.loading = loading;
        this.onchange = onChange;
        shadowRoot.innerHTML = `
        <style>
        :host {
            display: flex;
            font-size: 14px;
            height: 30px;
            align-items: center;
        }

        .ui-page {
            display: inline-flex;
            min-width: 18px;
            padding: 0 var(--ui-page-padding, 2px);
            margin: 0 5px;
            height: var(--ui-page-height, 28px);
            border: 1px solid transparent;
            border-radius: var(--ui-page-radius, 0);
            color: var(--ui-gray, #a2a9b6);
            font-size: var(--ui-font, 14px);
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            transition: border-color var(--ui-animate-time, .2s), background-color var(--ui-animate-time, .2s);
            text-decoration: none;
            user-select: none;
            position: relative;
            justify-content: center;
            align-items: center;
            background: none;
            box-sizing: content-box;
        }

        .ui-page:not(:focus-visible){
            outline: 0;
        }

        .ui-page[current] {
            cursor: default;
        }

        .ui-page:not([current]):not([disabled]):not(:disabled):hover {
            border-color: #b6bbc6;
            color: var(--ui-gray, #a2a9b6);
            cursor: pointer;
        }

        .ui-page:disabled {
            color: #ccd0d7;
            cursor: default;
        }

        .ui-page > svg {
            width: 20px;
            height: 20px;
        }

        .ui-page-prev,
        .ui-page-next {
            text-align: center;
            fill: currentColor;
            overflow: hidden;
        }

        /* 当前不可点的按钮颜色 */
        span.ui-page-prev,
        span.ui-page-next {
            color: var(--ui-diabled, #ccd0d7);
        }

        .ui-page-next svg {
            transform: scaleX(-1);
        }

        .ui-page-prev {
            margin-left: 0;
        }

        .ui-page-next {
            margin-right: 0;
        }

        .ui-page-ellipsis {
            display: inline-block;
        }

        :host(:not([loading]):not([data-loading=true])) .ui-page[current] {
            color: var(--ui-white, #ffffff);
            background-color: var(--ui-blue, #2a80eb);
        }

        .ui-page-text {
            color: var(--ui-dark, #4c5161);
        }

        .ui-page.loading > svg {
            visibility: hidden;
        }

        :host([loading]) .ui-page[current]::before,
        :host([data-loading=true]) .ui-page[current]::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            background-repeat: no-repeat;
            width: 20px;
            height: 20px;
            background: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M512 1024q-104 0-199-40-92-39-163-110T40 711Q0 616 0 512q0-15 10.5-25.5T36 476t25.5 10.5T72 512q0 90 35 171 33 79 94 140t140 95q81 34 171 34t171-35q79-33 140-94t95-140q34-81 34-171t-35-171q-33-79-94-140t-140-95q-81-34-171-34-15 0-25.5-10.5T476 36t10.5-25.5T512 0q104 0 199 40 92 39 163 110t110 163q40 95 40 199t-40 199q-39 92-110 163T711 984q-95 40-199 40z' fill='%232a80eb'/%3E%3C/svg%3E")
                no-repeat center;
            background-size: 20px 20px;
            margin: auto;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from {
                transform: rotate(0);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .simple-page {
            width: auto;
            padding: 0 .625em;
            pointer-events: none;
            color: #4c5161;
        }
        .page {
            display: inline-flex;
            height: 100%;
            align-items: center;
        }
        .pagination-wrap {
            display: contents;
            visibility: var(--ui-visibility, initial);
        }
        @media (prefers-reduced-motion: reduce) {
            .ui-page {
                transition: none;
            }
        }
        </style>
        <fieldset id="wrap" class="pagination-wrap">
            <${el} class="ui-page ui-page-prev" id="left">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
            <div class="page" id="page"></div>
            <${el} class="ui-page ui-page-next" id="right">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
        </fieldset>
        `;
        // trigger元素的获取
        this.element = new Proxy({}, {
            get: (target, prop) => {
                if (prop == 'trigger') {
                    return this.htmlFor && document.getElementById(this.htmlFor);
                }
            }
        });

        // 如果存在容器，就append进去
        if (typeof container == 'string') {
            container = document.querySelector(container);
        }
        if (container) {
            container.append(this);
        }
    }

    get per () {
        return Number(this.getAttribute('per')) || 15;
    }

    get simple () {
        return this.getAttribute('mode') === 'short';
    }

    get total () {
        return Number(this.getAttribute('total')) || 0;
    }

    get current () {
        return Number(this.getAttribute('current')) || 1;
    }

    get loading () {
        return this.getAttribute('loading') !== null;
    }

    get href () {
        //?page=1
        return this.getAttribute('href');
    }

    set current (value) {
        this.setAttribute('current', Math.min(Math.max(1, value), this.count));
    }

    set per (value) {
        this.setAttribute('per', value);
    }

    set total (value) {
        this.setAttribute('total', value);
    }

    set loading (value) {
        if (!value) {
            this.removeAttribute('loading');
        } else {
            this.setAttribute('loading', '');
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (value) {
        this.setAttribute('for', value);
    }

    render (per, total) {
        const item = this.href ? 'a' : 'button';
        this.count = Math.ceil(total / per) || 1;
        const current = Math.min(Math.max(1, this.current), this.count);
        if (this.simple) {
            const html = `<div class="simple-page ui-page" >${current} / ${this.count}</div>`;
            this.page.innerHTML = html;
        } else {
            // 生成一个长度为count，且最大长度为10的数组 [undefined,undefined,undefined,undefined,undefined,...]
            const arr = Array.from({length: this.count}).splice(0, 9);
            // 将数组映射成每一页的节点
            const html = arr.map((el, index) => {
                // <button class="ui-page" data-current="2" aria-label="第2页，共20页">2</button>
                return `<${item} class="ui-page" data-current="${index + 1}" aria-label="第${index + 1}页，共${this.count}页">${index + 1}</${item}>`;
            }).join('');
            this.page.innerHTML = html;
        }

        // 存在同时改变多个自定义元素属性的情况，此时应该执行一次
        clearTimeout(this.timerRender);
        this.timerRender = setTimeout(() => {
            this.updatePage(current);
        });
    }

    updatePage (current = this.current) {
        if (current == 1) {
            this.left.setAttribute('disabled', true);
            this.left.setAttribute('aria-label', '已经是第一页了');
            this.left.removeAttribute('href');
        } else {
            this.left.removeAttribute('disabled');
            this.left.setAttribute('aria-label', `上一页，当前第${current}页`);
            this.left.href = this.href ? this.href.replace(/\${current}/g, current - 1) : 'javascript:;';
        }
        if (current == this.count) {
            this.right.setAttribute('disabled', true);
            this.right.setAttribute('aria-label', '已经是最后一页了');
            this.right.removeAttribute('href');
        } else {
            this.right.removeAttribute('disabled');
            this.right.setAttribute('aria-label', `下一页，当前第${current}页`);
            this.right.href = this.href ? this.href.replace(/\${current}/g, current + 1) : 'javascript:;';
        }
        if (this.simple) {
            this.page.querySelector('.simple-page').textContent = current + ' / ' + this.count;
        } else if (this.count > 9) {
            let place = [];
            switch (current) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                    place = [1, 2, 3, 4, 5, 6, 7, 'next', this.count];
                    break;
                case this.count:
                case this.count - 1:
                case this.count - 2:
                case this.count - 3:
                case this.count - 4:
                    place = [1, 'pre', this.count - 6, this.count - 5, this.count - 4, this.count - 3, this.count - 2, this.count - 1, this.count];
                    break;
                default:
                    place = [1, 'pre', current - 2, current - 1, current, current + 1, current + 2, 'next', this.count];
                    break;
            }
            this.page.querySelectorAll('.ui-page').forEach((el, i) => {
                if (typeof place[i] === 'number') {
                    el.dataset.current = place[i];
                    el.textContent = place[i];
                    el.disabled = false;
                    el.href = 'javascript:;';
                    if (place[i] == current) {
                        el.setAttribute('current', '');
                        if (this.isKeepFocusIn) {
                            el.focus({
                                preventScroll: true
                            });
                        }
                    } else {
                        el.removeAttribute('current');
                    }
                    el.removeAttribute('disabled');
                    el.setAttribute('aria-label', `第${place[i]}页，共${this.count}页`);
                    if (this.href) {
                        el.href = this.href.replace(/\${current}/g, el.dataset.current);
                    }
                } else {
                    el.textContent = '...';
                    el.removeAttribute('current');
                    el.removeAttribute('data-current');
                    el.removeAttribute('aria-label');
                    el.setAttribute('disabled', true);
                    el.removeAttribute('href');
                }
            });
        } else {
            this.page.querySelectorAll('.ui-page').forEach((el) => {
                if (el.dataset.current == current) {
                    el.setAttribute('current', '');
                    if (this.isKeepFocusIn) {
                        el.focus({
                            preventScroll: true
                        });
                    }
                } else {
                    el.removeAttribute('current');
                }
                if (this.href) {
                    el.href = this.href.replace(/\${current}/g, el.dataset.current);
                }
            });
        }
    }

    // 上一个聚焦元素
    focusPrev () {
        const current = this.shadowRoot.activeElement;
        if (current === this.right) {
            if (this.simple) {
                this.left.focus();
            } else {
                this.page.lastElementChild.focus();
            }
        } else {
            const prev = current.previousElementSibling;
            if (prev) {
                if (!prev.disabled) {
                    prev.focus();
                } else {
                    prev.previousElementSibling.focus();
                }
            } else {
                this.left.focus();
            }
        }
    }

    // 下一个聚焦元素
    focusNext () {
        const current = this.shadowRoot.activeElement;
        if (current === this.left) {
            if (this.simple) {
                this.right.focus();
            } else {
                this.page.firstElementChild.focus();
            }
        } else {
            const next = current.nextElementSibling;
            if (next) {
                if (!next.disabled) {
                    next.focus();
                } else {
                    next.nextElementSibling.focus();
                }
            } else {
                this.right.focus();
            }
        }
    }

    connectedCallback () {
        if (!this.isConnectedCallback) {
            return this;
        }
        this.page = this.shadowRoot.getElementById('page');
        this.left = this.shadowRoot.getElementById('left');
        this.right = this.shadowRoot.getElementById('right');
        this.wrap = this.shadowRoot.getElementById('wrap');

        this.render(this.per, this.total);
        this.page.addEventListener('click', (ev) => {
            const item = ev.target.closest('.ui-page');
            if (item) {
                this.nativeClick = true;
                this.current = Number(item.dataset.current);
            }
        });
        this.page.addEventListener('focusin', () => {
            this.isKeepFocusIn = true;
        });
        this.addEventListener('keydown', (ev) => {
            if (this.loading) {
                return;
            }
            switch (ev.key) {
                case 'ArrowDown':
                case 'PageDown':
                    ev.preventDefault();
                    this.nativeClick = true;
                    this.current--;
                    break;
                case 'ArrowUp':
                case 'PageUp':
                    ev.preventDefault();
                    this.nativeClick = true;
                    this.current++;
                    break;
                case 'ArrowLeft':
                    this.focusPrev();
                    break;
                case 'ArrowRight':
                    this.focusNext();
                    break;
                default:
                    break;
            }
        });
        this.left.addEventListener('click', () => {
            this.nativeClick = true;
            this.current--;
            this.left.focus();
        });
        this.right.addEventListener('click', () => {
            this.nativeClick = true;
            this.current++;
            this.right.focus();
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-pagination'
            }
        }));

        this.isConnectedCallback = true;

        // 分页内容准备完毕
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if (!this.page || oldValue === newValue) {
            return;
        }
        let eleTrigger = this.element && this.element.trigger;

        if (name == 'per') {
            this.render(newValue, this.total);
            // 普通元素分页数据per数据同步
            if (eleTrigger) {
                eleTrigger.dataset.per = newValue;
            }
        } else if (name == 'total') {
            this.render(this.per, newValue);
            // 普通元素分页数据total数据同步
            if (eleTrigger) {
                eleTrigger.dataset.total = newValue;
            }
        } else if (name == 'loading') {
            this.wrap.disabled = newValue !== null;

            // 普通元素分页数据loading状态同步
            if (eleTrigger) {
                eleTrigger.dataset.loading = newValue !== null;
            }
        } else if (name == 'current' && oldValue !== newValue) {
            // 一定程度上避免冗余的渲染
            clearTimeout(this.timerRender);
            this.timerRender = setTimeout(() => {
                this.updatePage(Number(newValue));
            });

            // 普通元素分页数据信息的实时同步
            if (eleTrigger) {
                eleTrigger.dataset.current = newValue;
            }
            if (this.nativeClick) {
                this.nativeClick = false;
                this.dispatchEvent(new CustomEvent('change', {
                    detail: {
                        current: Number(newValue),
                        per: this.per,
                        total: this.total
                    }
                }));

                if (eleTrigger && eleTrigger != this) {
                    eleTrigger.dispatchEvent(new CustomEvent('change', {
                        detail: {
                            current: Number(newValue),
                            per: this.per,
                            total: this.total
                        }
                    }));
                }
            }
        }
    }
}

if (!customElements.get('ui-pagination')) {
    customElements.define('ui-pagination', Pagination);
}

window.Pagination = Pagination;

// 给 HTML 元素扩展 pagination 方法
HTMLElement.prototype.pagination = function (options) {
    if (this.matches('ui-pagination') || this['ui-pagination']) {
        return this;
    }

    const {
        total = 0,
        current = 1,
        per = 15,
        href = null,
        loading = false
    } = this.dataset;

    let objParams = Object.assign({}, {
        per,
        total,
        href,
        loading
    }, options || {});

    const pagination = new Pagination(objParams);

    const strId = this.id || ('lulu_' + Math.random()).replace('0.', '');
    this.innerHTML = '';
    this.id = strId;
    this['ui-pagination'] = pagination;
    pagination.htmlFor = strId;
    pagination.setAttribute('current', current);
    // 删除自定义元素，隐藏不必要的细节
    pagination.addEventListener('connected', () => {
        // 所有普通元素也触发 connected 生命周期事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-pagination'
            }
        }));

        // 原分页从页面中删除
        pagination.remove();

        // DOM 执行完毕
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    });
    document.body.append(pagination);
    // 转移shadow dom
    const shadowRoot = this.attachShadow({
        mode: 'open'
    });
    shadowRoot.append(pagination.shadowRoot);

    // 设置定义完毕标志量
    this.setAttribute('defined', '');

    return this;
};

(function () {
    const initAllPagination = (ele) => {
        const elePaginations = ele || document.querySelectorAll('[is-pagination]');

        elePaginations.forEach(item => {
            item.pagination();
        });
    };

    /**
     * 初始化并监听页面包含is-pagination属性的DOM节点变化
     */
    const autoInitAndWatchingIsPaginationAttr = () => {
        // 先实例化已有is-pagination属性的DOM节点，再监听后续的节点变化
        initAllPagination();
        const observer = new MutationObserver(mutationsList => {
            mutationsList.forEach(mutation => {
                mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                    if (!eleAdd.tagName) {
                        return;
                    }
                    if (eleAdd.hasAttribute('is-pagination')) {
                        initAllPagination([eleAdd]);
                    } else {
                        initAllPagination(eleAdd.querySelectorAll('[is-pagination]'));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState != 'loading') {
        autoInitAndWatchingIsPaginationAttr();
    } else {
        window.addEventListener('DOMContentLoaded', autoInitAndWatchingIsPaginationAttr);
    }
})();

// export default Pagination;

/**
 * @Table.js
 * @author   zhangxinxu
 * @version
 * @created  15-06-28
 * @edited   17-07-18 非模块化使用支持
 *           19-12-03 ES5原生语法支持
 *           21-01-08 Web Components
**/
// import '../ui/Drop.js';
// import '../ui/Pagination.js';
// import Validate from '../ui/Validate.js';

const Table = (function () {

    /**
     * 项目表格组件
     */

    let CHECKED = 'checked';
    let SELECTED = 'selected';

    // 一些元素类名
    let CL = {
        // 容器
        container: 'table-x',
        // 为空
        empty: 'table-null-x',
        // 错误
        error: 'table-error-x',
        // 分页容器类名
        page: 'table-page',
        // 复选框选择器
        checkbox: '[type="checkbox"]'
    };

    class Table extends HTMLTableElement {
        static get defaultKeyMap () {
            return {
                key: '',
                total: 'total',
                per: 'per',
                current: 'current'
            };
        }

        // 滚动到顶部缓动实现
        // rate表示缓动速率，默认是2
        static scrollTopTo (top, callback) {
            let scrollTop = document.scrollingElement.scrollTop;
            let rate = 2;

            let funTop = function () {
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
        }

        constructor () {
            super();

            this.params = this.params || {};
            this.element = this.element || {};

            // 内置的固定参数
            this.params.parse = (data) => {
                // 如果有模板，按照模板和内置的ES6模板字符串语法进行渲染
                if (this.params.template) {
                    return this.params.template.interpolate(data);
                }

                return '';
            };

            // 其他参数的设置
            this.params.ajax = {};
            this.params.form = {};
            this.params.list = [15, 30, 50];
            this.params.page = {
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
                keyMap: Table.defaultKeyMap
            };
        }

        setParams (options) {
            options = options || {};

            // 分页数据中的keyMap也是一个可选参数对象
            // 为了支持嵌套合并，这里提前处理下
            let objPageOption = options.page;
            if (objPageOption) {
                objPageOption.keyMap = Object.assign({}, this.params.page.keyMap || Table.defaultKeyMap, objPageOption.keyMap || {});
            }

            this.params = Object.assign(this.params, options);

            return this;
        }

        /**
         * 列表解决方案中的事件处理
         * @return {[type]} [description]
         */
        events () {
            // 实例暴露的参数
            let objParams = this.params;
            let objElement = this.element;

            // 一些事件
            // 单复选框选中效果
            this.addEventListener('click', function (event) {
                let eleCheckbox = event.target;

                if (!eleCheckbox || eleCheckbox.type != 'checkbox') {
                    return;
                }

                let eleTr = eleCheckbox.closest('tr');

                // 如果不是第一td中的checkbox，忽略
                if (eleTr.querySelector(':first-child ' + CL.checkbox) !== eleCheckbox) {
                    return;
                }

                // 获取所有的td标签中的复选框
                // 需要tr单元行显示，需要第一个子元素，需要可用
                let eleAllTdCheckbox = [];

                this.querySelectorAll('tr').forEach(function (tr) {
                    if (tr.clientWidth == 0) {
                        return;
                    }
                    // 所有非禁用复选框
                    let eleTdCheckbox = tr.querySelector('td:first-child ' + CL.checkbox + ':enabled');
                    if (eleTdCheckbox) {
                        eleAllTdCheckbox.push(eleTdCheckbox);
                    }
                });

                // 全选和非全选标志量
                let isAllChecked = false;
                let isAllUnchecked = false;
                // 全选
                let eleTh = eleCheckbox.closest('th');
                // 点击的是全选复选框
                if (eleTh) {
                    isAllChecked = eleCheckbox[CHECKED];
                    isAllUnchecked = !isAllChecked;
                    // 下面所有的td复选框同步
                    eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                        eleTdCheckbox[CHECKED] = isAllChecked;
                    });
                } else {
                    let numLengthChecked = [].slice.call(eleAllTdCheckbox).filter(function (eleTdCheckbox) {
                        return eleTdCheckbox[CHECKED];
                    }).length;
                    // 是否取消全选
                    isAllChecked = (eleAllTdCheckbox.length == numLengthChecked);
                    // 是否全部非选
                    isAllUnchecked = (numLengthChecked == 0);
                }
                // 改变全选复选框的状态
                let eleThCheckbox = this.querySelector('th:first-child ' + CL.checkbox);
                if (eleThCheckbox) {
                    eleThCheckbox[CHECKED] = isAllChecked;
                }

                // 根据复选框状态决定表格行样式
                eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                    eleTdCheckbox.closest('tr').classList[eleTdCheckbox[CHECKED] ? 'add' : 'remove'](SELECTED);
                });

                // 回调
                this.dispatchEvent(new CustomEvent('check', {
                    detail: {
                        isAllChecked: isAllChecked,
                        isAllUnchecked: isAllUnchecked,
                        target: eleCheckbox,
                        allEnabledCheckbox: eleAllTdCheckbox
                    }
                }));
            });

            // 点击列表，只有不是a元素或者是复选框本身，选中当前复选框
            this.addEventListener('click', function (event) {
                let eleTarget = event.target;
                let eleCheckbox = null;

                if (eleTarget && /^(?:a|input|textarea|tbody|i|select|label|th)$/i.test(eleTarget.tagName) == false) {
                    eleCheckbox = eleTarget.closest('tr') && eleTarget.closest('tr').querySelector('td:first-child ' + CL.checkbox + ':enabled');
                    if (eleCheckbox) {
                        eleCheckbox.click();
                    }
                }
            });

            // 分页选择的事件处理
            let elePagination = this.element.pagination;
            if (elePagination) {
                elePagination.addEventListener('change', event => {
                    let numCurrent = event.detail.current;
                    // 更新分页
                    objParams.page.current = numCurrent;
                    // 显示小loading
                    elePagination.loading = true;
                    // ajax再次
                    this.ajax();
                });
            }

            // 切换每页数目的dropList
            // 求得当前选中的分页数
            // 优先本地存储
            let strStoreId = this.id;
            let numCurrentPer = objParams.page.per;
            let elePer = objElement.drop;

            // 触发分页数量的下拉元素
            if (elePer && elePer.list) {
                if (strStoreId && localStorage[strStoreId]) {
                    numCurrentPer = localStorage[strStoreId];
                    objParams.page.per = Number(numCurrentPer);
                }
                // 赋值
                elePer.textContent = numCurrentPer;

                // 下拉
                elePer.list(() => {
                    return objParams.list.map(function (number) {
                        return {
                            value: number
                        };
                    });
                }, {
                    width: 60,
                    onSelect: (data) => {
                        let numPerNew = data.value;

                        // 记住当前选择的分页数
                        if (strStoreId) {
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
                    }
                });
            }

            // 关联表单的行为处理
            let eleForm = this.form;
            if (eleForm) {
                new Validate(eleForm, () => {
                    objParams.page.current = 1;
                    this.ajax({
                        data: this.params.form.data || {}
                    });
                }, {
                    validate: () => {
                        return this.params.form.validate || [];
                    }
                });
            }
        }

        /**
         * 列表数据请求
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        ajax (options) {
            options = options || {};

            // 暴露的参数和元素
            let objParams = this.params;
            let objElement = this.element;

            // 避免重复请求
            if (this.getAttribute('aria-busy') == 'true') {
                return this;
            }

            // 列表容器元素
            let eleContainer = this.parentElement;
            let eleTbody = this.querySelector('tbody');
            let eleForm = this.form;

            // ajax请求参数
            // 可以从4处获取
            // 1. options直接传参
            // 2. this.setParams()传参，此参数可以多次使用，只要不被重置
            // 3. 关联form元素中的参数
            // 4. <table>元素上data-*获取，但是只能获取url参数
            // 以上优先级越往后越低

            // eleForm元素与参数获取
            let objAjaxForm = {
                data: {}
            };
            if (eleForm) {
                let strAttrAction = eleForm.getAttribute('action');
                if (strAttrAction) {
                    objAjaxForm.url = strAttrAction;
                }
                eleForm.querySelectorAll('input[name]:enabled, select[name]:enabled, textarea[name]:enabled').forEach(ele => {
                    if (/^(?:submit|image|file)$/.test(ele.type)) {
                        return;
                    }
                    objAjaxForm.data[ele.name] = ele.value;
                });
            }

            let objAjax = Object.assign({}, this.dataset, objAjaxForm, objParams.ajax, options);

            // ajax地址是必需项
            if (!objAjax.url) {
                if (this.element.pagination) {
                    this.element.pagination.loading = false;
                }

                return this;
            }

            // 补充协议头
            if (/^\/\//.test(objAjax.url)) {
                objAjax.url = location.protocol + objAjax.url;
            }

            // 1. ajax发送的data数据走合并策略
            let data = options.data || {};
            let dataForm = objAjaxForm.data;
            let dataOptions = objParams.ajax.data || {};

            if (typeof dataOptions == 'function') {
                dataOptions = dataOptions() || {};
            }
            if (typeof dataForm == 'function') {
                dataForm = dataForm() || {};
            }
            if (typeof data == 'function') {
                data = data() || {};
            }

            // 发送给后台的分页数据的键值对
            let dataPage = {};
            let objKeyMap = objParams.page.keyMap;

            if (objKeyMap) {
                dataPage[objKeyMap['current']] = objParams.page.current;
                dataPage[objKeyMap['per']] = objParams.page.per;
            }

            // current和per数据的更新
            let objDataSend = Object.assign({}, dataPage, dataForm, dataOptions, data);

            if (objKeyMap) {
                objParams.page.current = objDataSend[objKeyMap['current']];
                objParams.page.per = objDataSend[objKeyMap['per']];
            }

            // 2. url get请求地址合并
            let objAjaxParams = new URLSearchParams(objDataSend);
            // URL处理
            let strUrlAjax = objAjax.url;

            // 查询字符串的处理
            let strUrlSearch = '?';
            if (strUrlAjax.split('?').length > 1) {
                strUrlSearch = strUrlSearch + strUrlAjax.split('?')[1] + '&';
            }

            // URL拼接
            strUrlAjax = strUrlAjax.split('?')[0] + strUrlSearch + objAjaxParams.toString();

            // 3. 回调方法的处理
            // ajax发生错误的处理
            let funError = (content) => {
                let eleError = objElement.error || eleContainer.querySelector('.' + CL.error);

                if (!eleError) {
                    eleError = document.createElement('div');
                    eleError.className = CL.error;
                    // 创建的错误元素插到列表的后面
                    this.insertAdjacentElement('afterend', eleError);

                    objElement.error = eleError;
                }
                eleError.style.display = 'flex';
                eleError.innerHTML = content || '数据没有获取成功';

                if (typeof objAjax.error == 'function') {
                    objAjax.error();
                }
            };
            // 请求完成的事件处理
            let funComplete = () => {
                // 请求结束标志量
                this.removeAttribute('aria-busy');
                // 去除中间的大loading
                if (objElement.loading) {
                    objElement.loading.style.display = 'none';
                }

                // 去掉分页的小loading
                if (objElement.pagination) {
                    objElement.pagination.loading = false;
                }
                if (typeof objAjax.complete == 'function') {
                    objAjax.complete();
                }

                // 列表内容呈现
                this.show();
            };

            // 执行Ajax请求的方法
            let funAjax = () => {
                let xhr = new XMLHttpRequest();

                xhr.open('GET', strUrlAjax);

                xhr.onload = () => {
                    let json = {};

                    try {
                        json = JSON.parse(xhr.responseText) || {};
                    } catch (event) {
                        funError('解析异常，请稍后重试');
                        return;
                    }

                    // 出错处理
                    // 0认为是成功
                    // 关键字支持code或者error
                    // { code: 0 } 或 { error: 0 } 都认为成功
                    if (json.code !== 0 && json.error !== 0) {
                        funError(json.msg || '返回数据格式不符合要求');

                        return;
                    }

                    let strHtml = objParams.parse(json);

                    // 如果解析后无数据，显示空提示信息
                    eleTbody.innerHTML = strHtml || '';

                    let eleEmpty = objElement.empty;

                    if (!strHtml || !strHtml.trim()) {
                        if (!eleEmpty) {
                            eleEmpty = document.querySelector('.' + CL.empty) || document.createElement('div');
                            eleEmpty.className = CL.empty;
                            // 插入到列表元素后面
                            this.insertAdjacentElement('afterend', eleEmpty);

                            objElement.empty = eleEmpty;
                        }
                        eleEmpty.style.display = 'flex';
                    }

                    // 获得后端返回的分页总数
                    let jsonKey = objKeyMap.key;
                    // 总数目
                    let numTotal;

                    if (jsonKey) {
                        numTotal = json.data[jsonKey][objKeyMap['total']];
                    } else {
                        numTotal = json.data[objKeyMap['total']];
                    }

                    // 修改总数值并显示
                    if (numTotal || numTotal == 0) {
                        eleContainer.querySelectorAll('output[data-type="total"]').forEach(function (eleTotal) {
                            eleTotal.innerHTML = numTotal;
                        });

                        objParams.page.total = numTotal;
                    }

                    this.page();

                    if (typeof objAjax.success == 'function') {
                        objAjax.success(json);
                    }
                };

                xhr.onerror = () => {
                    funError('网络异常，数据没有获取成功，您可以稍后重试！');

                };

                xhr.onloadend = () => {
                    funComplete();
                };

                xhr.send();

                // 标记输入框忙碌状态
                this.setAttribute('aria-busy', 'true');
            };

            // 滚动到表格上边缘
            let numScrollTop = window.pageYOffset;

            // loading元素
            let eleLoading = objElement.loading;
            if (!eleLoading) {
                eleLoading = document.createElement('ui-loading');
                eleLoading.setAttribute('rows', 15);
                // 插入到列表元素后面
                this.insertAdjacentElement('afterend', eleLoading);

                objElement.loading = eleLoading;
            }

            // 显示loading
            eleLoading.style.paddingBottom = '';

            if (window.getComputedStyle(eleLoading).display == 'none') {
                let eleThead = this.querySelector('thead');

                eleLoading.style.height = (this.clientHeight - (eleThead ? eleThead.clientHeight : 0)) + 'px';

                if (eleTbody.innerHTML.trim() == '') {
                    eleLoading.style.height = '';
                }
            }

            // 微调圈圈的位置
            let numDistance = parseFloat(eleLoading.style.height) - window.innerHeight;

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
            let objBound = this.getBoundingClientRect();
            // 第一次不定位
            if (!this.isFirstAjax && objBound.top < 0) {
                numScrollTop = objBound.top + numScrollTop;
                Table.scrollTopTo(numScrollTop, funAjax);
            } else if (!this.isFirstAjax && objBound.top > window.innerHeight) {
                numScrollTop = numScrollTop - objBound.top;
                Table.scrollTopTo(numScrollTop, funAjax);
            } else {
                funAjax();

                this.isFirstAjax = false;
            }

            return this;
        }

        /**
         * 分页的处理
         * @param  {[type]} total [description]
         * @return {[type]}       [description]
         */
        page (total) {
            let objPage = this.params.page;

            // 分页元素
            let elePagination = this.element.pagination;

            // 显示分页
            if (!elePagination) {
                return;
            }

            // 分页数据的设置
            let objParamPage = {
                total: total || objPage.total,
                current: objPage.current,
                per: objPage.per,
                mode: objPage.mode || 'long'
            };

            // 分页数据赋值
            for (let key in objParamPage) {
                elePagination[key] = objParamPage[key];
            }
        }

        /**
         * 列表请求完毕显示的方法
         * @return {[type]} [description]
         */
        show () {
            // 显示loading
            if (this.element.loading) {
                this.element.loading.style.paddingBottom = '';
            }

            //没有全选
            let eleThCheckbox = this.querySelector('th:first-child ' + CL.checkbox);
            if (eleThCheckbox) {
                eleThCheckbox[CHECKED] = false;
            }

            // 显示的回调
            this.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-table'
                }
            }));

            return this;
        }

        // 元素进入页面时候的生命周期函数执行
        connectedCallback () {
            // 获得数据
            let eleTbody = this.querySelector('tbody');
            if (!eleTbody) {
                eleTbody = document.createElement('tbody');
                this.append(eleTbody);
            }

            // 模板元素
            let eleTemplate = this.querySelector('template');
            if (eleTemplate) {
                this.params.template = eleTemplate.innerHTML;
            }

            // 容器
            let eleContainer = this.closest('.' + CL.container);

            // 分页元素
            let elePagination = null;
            if (eleContainer) {
                elePagination = eleContainer.querySelector('ui-pagination');

                if (elePagination) {
                    this.element.pagination = elePagination;

                    // 设置分页的参数
                    this.setParams({
                        page: {
                            current: elePagination.current,
                            total: elePagination.total,
                            per: elePagination.per
                        }
                    });
                } else {
                    // 创建一个分页元素
                    elePagination = document.createElement('ui-pagination');
                    this.element.pagination = elePagination;
                    // 分页内容显示
                    let elePage = eleContainer.querySelector('.' + CL.page);
                    if (elePage) {
                        elePage.appendChild(elePagination);
                    }
                }

                // loading元素
                let eleLoading = eleContainer.querySelector('ui-loading');
                if (eleLoading) {
                    this.element.loading = eleLoading;
                }

                // 下拉列表，切换分页元素
                let eleDrop = eleContainer.querySelector('ui-drop[data-type="per"]');
                if (eleDrop) {
                    this.element.drop = eleDrop;
                }
            }

            // 为了动态呈现的列表可以先设置参数，后执行，这里延后
            setTimeout(() => {
                // 事件绑定和处理
                this.events();

                // 基于tbody内容决定首次交互的行为
                if (eleTbody.textContent.trim() == '') {
                    this.isFirstAjax = true;
                    this.ajax();
                } else {
                    // 认为是列表第一页直出，
                    // 这样的交互可以有更好体验
                    this.page();
                }
            }, 1);

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-table'
                }
            }));

            this.isConnectedCallback = true;

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    if (!('').interpolate) {
        // 字符串转模板字符串 https://www.zhangxinxu.com/wordpress/2020/10/es6-html-template-literal/
        String.prototype.interpolate = function (params) {
            const names = Object.keys(params);
            const vals = Object.values(params);
            return new Function(...names, `return \`${(function (str) {
                return str.replace(/&(lt|gt|amp|quot);/ig, function (all, t) {
                    return ({
                        'lt': '<',
                        'gt': '>',
                        'amp': '&',
                        'quot': '"'
                    })[t];
                });
            })(this)}\`;`)(...vals);
        };
    }

    return Table;
})();

// 给<table>元素扩展form属性
Object.defineProperty(HTMLTableElement.prototype, 'form', {
    get () {
        let attrForm = this.getAttribute('form');
        if (!attrForm) {
            return null;
        }
        return document.getElementById(attrForm);
    }
});

if (!customElements.get('ui-table')) {
    customElements.define('ui-table', Table, {
        extends: 'table'
    });
}

/**
 * @Form.js
 * @author zhangxinxu
 * @version
 * @created  16-03-01
 * @edited   19-12-02    ES5原生语法支持
 */

/**
 * 表单解决方案组件
 * @使用示例
 *  <form is="ui-form">
 */

// import LightTip from '../ui/LightTip.js';
// import Validate from '../ui/Validate.js';
// import '../ui/Loading.js';

// 表单
class Form extends HTMLFormElement {
    constructor () {
        super();

        this.element = this.element || {};
        this.params = this.params || {
            // 验证成功之后，请求发送前的条件约束
            // avoidSend: function () {}
        };
        // 回调方法们
        this.callback = this.callback || {};

        Object.defineProperty(this.params, 'validate', {
            set (value) {
                if (this.validate) {
                    this.validate.setCustomValidity(value);
                }
            }
        });

        return this;
    }

    /**
     * 表单提交的处理
     * @return {[type]} [description]
     */
    ajax () {
        // 回调
        // optionCallback可以是对象也可以直接是成功回调
        /*
            optionCallback = {
                success: function () {},
                error: function () {},
                complete: function () {}
            };
        */
        let optionCallback = this.callback;
        optionCallback = optionCallback || function () {};
        if (typeof optionCallback == 'function') {
            optionCallback = {
                success: optionCallback
            };
        }

        // 表单提交按钮元素的获取
        let eleSubmit = [...this.elements].filter(function (control) {
            return control.type && /^(?:submit|image)$/i.test(control.type);
        })[0] || this.querySelector('button:nth-last-of-type(1)');

        if (!eleSubmit) {
            eleSubmit = (() => {
                let ele = document.createElement('button');
                ele.type = 'submit';
                ele.setAttribute('hidden', '');
                this.appendChild(ele);

                return ele;
            })();
        }

        this.element.submit = eleSubmit;

        // 按钮元素
        let eleButton = null;

        // 我们肉眼所见的按钮，进行一些状态控制
        eleButton = eleSubmit.id && document.querySelector('label[for=' + eleSubmit.id + ']');
        if (!eleButton) {
            eleButton = eleSubmit;
        }
        this.element.button = eleButton;

        // 请求地址
        let strUrl = this.action.split('#')[0] || location.href.split('#')[0];
        // 请求类型
        let strMethod = this.method || 'POST';
        let strEnctype = this.getAttribute('enctype') || this.enctype;

        // 提交数据
        // 1. 菊花转起来
        eleButton.loading = true;
        // 2. 提交按钮禁用
        eleSubmit.setAttribute('disabled', 'disabled');

        // 3. 数据
        let objFormData = new FormData(this);
        // 支持外部传入额外的请求参数
        if (this.params.data) {
            Object.keys(this.params.data).forEach(key => {
                objFormData.append(key, this.params.data[key]);
            });
        }

        // 请求类型不同，数据地址也不一样
        let strSearchParams = new URLSearchParams(objFormData).toString();

        if (strMethod.toLowerCase() == 'get') {
            if (strUrl.split('?').length > 1) {
                strUrl = strUrl + '&' + strSearchParams;
            } else {
                strUrl = strUrl + '?' + strSearchParams;
            }
        }

        // 4. 请求走起来
        let xhr = new XMLHttpRequest();
        xhr.open(strMethod, strUrl);

        if (optionCallback.beforeSend) {
            optionCallback.beforeSend.call(this, xhr, objFormData);
        }

        // 请求结束
        xhr.onload = () => {
            let json = {};

            try {
                json = JSON.parse(xhr.responseText);
            } catch (event) {
                new LightTip('返回数据解析出错。', 'error');
                // 回调
                if (optionCallback.error) {
                    optionCallback.error.call(this, event);
                }

                // 触发出错自定义事件
                this.dispatchEvent(new CustomEvent('error', {
                    detail: {
                        data: {
                            code: -1,
                            msg: '解析出错'
                        }
                    }
                }));

                return;
            }

            if (json && (json.code === 0 || json.error === 0)) {
                // 成功回调
                if (optionCallback.success) {
                    optionCallback.success.call(this, json);
                } else {
                    // 如果没有成功回调，组件自己提示成功
                    new LightTip(json.msg || '操作成功。', 'success');
                    // 表单重置
                    this.reset();
                }

                // 支持绑定success事件
                this.dispatchEvent(new CustomEvent('success', {
                    detail: {
                        data: json
                    }
                }));
            } else {
                new LightTip((json && json.msg) || '返回数据格式不符合要求。', 'error');

                // 失败回调
                if (optionCallback.error) {
                    optionCallback.error.call(this, json);
                }

                // 触发出错自定义事件
                this.dispatchEvent(new CustomEvent('error', {
                    detail: {
                        data: json
                    }
                }));
            }
        };

        // 请求错误
        xhr.onerror = () => {
            new LightTip('网络异常，刚才的操作没有成功，您可以稍后重试。', 'error');
            // 回调
            if (optionCallback.error) {
                optionCallback.error.apply(this, arguments);
            }
            // 触发出错自定义事件
            this.dispatchEvent(new CustomEvent('error', {
                detail: {
                    code: -1,
                    msg: '网络异常'
                }
            }));
        };

        // 请求结束，无论成功还是失败
        xhr.onloadend = () => {
            // 菊花关闭
            eleButton.loading = false;
            // 表单恢复提交
            eleSubmit.removeAttribute('disabled');
            // 回调
            if (optionCallback.complete) {
                optionCallback.complete.apply(this, arguments);
            }

            // 支持绑定complete事件
            this.dispatchEvent(new CustomEvent('complete'));
        };

        if (strEnctype && strEnctype.toLowerCase() === 'application/x-www-form-urlencoded') {
            xhr.send(strSearchParams);
        } else if (strEnctype == 'application/json') {
            xhr.setRequestHeader('Content-Type', strEnctype);
            const objSend = {};
            objFormData.forEach(function(value, key){
                objSend[key] = value;
            });
            xhr.send(JSON.stringify(objSend));
        } else {
            xhr.send(objFormData);
        }
    }

    connectedCallback () {
        // 绑定表单验证
        this.validate = new Validate(this, () => {
            let funAvoidSend = this.params.avoidSend || this.callback.avoidSend;
            // 验证成功之后
            if (!funAvoidSend || !funAvoidSend(this)) {
                this.ajax();
            }
        }, this.params.validate || {});

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-form'
            }
        }));

        this.isConnectedCallback = true;

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }
}

if (!customElements.get('ui-form')) {
    customElements.define('ui-form', Form, {
        extends: 'form'
    });
}