/**
 * @Checkbox.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-18
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        factory().init();
    }
}(this, function () {
	if (!$().propMatch && window.console) {
		console.error('need Radio.js');
	}

	return {
		init: function() {
			if (!window.addEventListener && !window.initedCheckbox && $().propMatch) {
				var selector = 'input[type=checkbox]';
				
				$(document.body).delegate(selector, 'click', function() {
					$(this).propMatch();
				});
				
				// 首次页面载入，对页面所有复选框（根据是否选中态）进行初始化				
				$(selector).propMatch();
				
				// 防止多次初始化
				window.initedCheckbox = true;
			}
		}
	};
}));
