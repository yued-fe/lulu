/**
 * @Keyboard.js
 * @author zhangxinxu
 * @version
 * Created: 17-06-13
 */
(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        factory();
    }
}(this, function () {
    var doc = document;
    var win = window;

    if (typeof win.Keyboard == 'object') {
        return win.Keyboard;
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

    var syetem = 'windows';

    if (/Mac\sOS\sX/i.test(ua)) {
        syetem = 'mac';
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
    })[syetem];

    // 获取字符Unicode值方法
    var U = function(a, b) {
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

    if (doc.addEventListener) {
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
    }

    /*
    ** CSS :focus或者JS的focus事件让下拉或浮层元素显示的时候键盘交互支持
    ** 基于data-target属性进行关联
    */
    if (doc.addEventListener) {
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
                ele.className = ele.className.split(/\s+/).filter(function (cl) {
                    if (cl != className) {
                        return cl;
                    }
                }).join(' ');
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

                    eleFirstMatchAttrTarget = idEsc && doc.querySelector('a[data-target="' + idEsc + '"],input[data-target="' + idEsc + '"]');
                    if (eleFirstMatchAttrTarget && eleEsc.style.display !== 'none' && eleEsc.clientHeight > 0) {
                        eleFirstMatchAttrTarget.click();
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

                var eleFirstFocusable = target.querySelector('a[href], button:not(:disabled), input:not(:disabled)');
                if (eleFirstFocusable) {
                    eleFirstFocusable.focus();
                    event.preventDefault();
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
            if (/^javascript/.test(target.href) && !target.getAttribute('role')) {
                target.setAttribute('role', 'button');
            } else if (target.type == 'button' || target.type == 'submit') {
                if (win.isKeyEvent) {
                    classList.add(target);
                }
            }
        });
        doc.addEventListener('focusout', function (event) {
            var target = event.target;
            if (!target) {
                return;
            }
            if (target.type == 'button' || target.type == 'submit') {
                classList.remove(target);
            }
        });
    }

    win.Keyboard = {
        ua: ua,
        browser: browser,
        keycode: keycode,
        keyPrefix: keyPrefix
    };
}));
