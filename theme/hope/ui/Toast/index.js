/**
 * @LightTip.js
 * @author zhangxinxu
 * @version
 * @description 顶部提示
 * @created 22-06-06
 */

/**/import UiFloat from "../Float/index.js";

class UiToast extends UiFloat {
    // 定位处理
    setParams (text, arg1, arg2) {
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

        if (typeof time == 'number') {
            this.time = time;
        }

        if (type) {
            this.type = type;
        }
    
        this.innerHTML = text;
    }

    // success
    static success (text, time = 3000) {
        return this.custom(text, 'success', time);
    }
    // error
    static error (text, time = 3000) {
        return this.custom(text, 'error', time);
    }
    // warning
    static warning (text, time = 3000) {
        return this.custom(text, 'warning', time);
    }
    // normal
    static custom (text, type, time) {
        if (UiToast.toast) {
            UiToast.toast.setParams(text, type, time);
            UiToast.toast.show();            
        } else {
            UiToast.toast = new window.Toast(text, type, time);
        }

        return UiToast.toast;
    }
}

// 将该方法定义为 window 全局使用的方法
window.Toast = function () {
    const ele = document.createElement('ui-toast');
    ele.setParams(...arguments);
    document.body.append(ele);
    ele.open = true;

    return ele;
};

if (!customElements.get('ui-toast')) {
    customElements.define('ui-toast', UiToast);
}

/**/export default UiToast;
