/**
 * @FollowText.js
 * @author zhangxinxu
 * @version
 * @description 文字 popup 提示
 * @created 22-06-09
 */

/**/import '../Float/index.js';

// 将该方法定义为 window 全局使用的方法
window.FollowText = function (text, arg1, arg2) {
    const ele = document.createElement('ui-float');
    
    // 参数类型的处理
    var type, pos;

    [arg1, arg2].forEach(function (arg) {
        if (typeof arg == 'string') {
            type = arg;
        } else if (typeof arg == 'object') {
            pos = arg;
        }
    });

    if (!pos) {
        pos = {
            x: -100,
            y: -100
        };
    }

    // text 类型是必须的
    type = [type || pos.type || '', 'text'].join(' ');

    var x = pos.pageX || pos.x;
    var y = pos.pageY || pos.y;

    if (typeof x != 'number') {
        x = window.innerWidth / 2;
    }
    if (typeof y != 'number') {
        y = window.pageYOffset + window.innerHeight / 2;
    }

    // 内容写入
    ele.innerHTML = text || '';
    // 提示类型
    ele.type = type
    // 页面中显示
    ele.open = true;
    document.body.append(ele);
    // 事件处理
    ele.addEventListener('animationend', function() {
        document.body.removeChild(ele);
    });
    // 定位
    ele.style.left = (x - ele.clientWidth / 2) + 'px';
    ele.style.top = (y - ele.clientHeight) + 'px';

    return ele;
};

FollowText.success = function (text, event) {
    return this.custom(text, 'success', event);
}
FollowText.error = function (text, event) {
    return this.custom(text, 'error', event);
}
FollowText.warning = function (text, event) {
    return this.custom(text, 'warning', event);
}
FollowText.custom = function () {
    return FollowText(...arguments);
}

/**/export default FollowText;
