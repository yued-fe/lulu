/**
 * @Checkbox.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-18
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        factory();
    }
}(this, function (require) {
    var win = window;
    if (typeof require == 'function') {
        require('common/ui/Radio');
    } else if (!$().propMatch && win.console) {
        win.console.error('need Radio.js');
    }

    // !win.addEventListener表示IE8及其以下浏览器才需要JS处理
    // !win.initedCheckbox表示事件只能委托一次
    // $().propMatch表示需要已经有对应的方法
    if (!win.addEventListener && !win.initedCheckbox && $().propMatch) {
        var selector = 'input[type=checkbox]';

        $(document.body).on('click', selector, function() {
            $(this).propMatch();
        });

        // 首次页面载入，对页面所有复选框（根据是否选中态）进行初始化
        $(selector).propMatch();

        // 防止多次初始化
        win.initedCheckbox = true;
    }
}));
