/**
 * @LightTip.js
 * @author zhangxinxu
 * @version
 * @description 顶部提示
 * @created 22-06-06
 */

/**/import UiFloat from "../Float/index.js";

class UiLightTip extends UiFloat {
    // 定位处理
    position () {
        var elesOpen = [...document.querySelectorAll('ui-lighttip[open]')];
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
    // normal
    static custom (text, type, time) {
        return new window.LightTip(text, type, time);
    }
}

// 将该方法定义为 window 全局使用的方法
window.LightTip = function (text, arg1, arg2) {
    if (!text) {
        return;
    }

    // 参数处理
    var type, time;

    [arg1, arg2].forEach(function (arg) {
        if (typeof arg == 'number') {
            time = arg;
        } else if (typeof arg == 'string') {
            type = arg;
        } else if (typeof arg == 'object') {
            type = arg.type;
            time = arg.time
        }
    });

    const ele = document.createElement('ui-lighttip');

    if (typeof time == 'number') {
        ele.time = time;
    }
    if (type) {
        ele.type = type;
    }
    ele.innerHTML = text;
    document.body.append(ele);
    ele.open = true;

    return ele;
};

if (!customElements.get('ui-lighttip')) {
    customElements.define('ui-lighttip', UiLightTip);
}

/**/export default UiLightTip;

