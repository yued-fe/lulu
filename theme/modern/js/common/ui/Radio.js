/**
 * @Radio.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-17
 */
(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        factory().init();
    }
}(this, function () {
    //require('plugin/jquery');
	
	/**
     * 模拟单选效果
	 * 只针对IE8-浏览器进行处理
	 * 状态关键字为checked
     */
	
	var CHECKED = 'checked';
	
	/**
     * jQuery模式下的扩展方法，
	 * 只针对IE8-浏览器进行处理
	 * 根据当前单复选框的选中态toggle类名checked
	 * @example
	 *  $('[type=radio]').propMatch();
     */
	
	$.fn.propMatch = function() {
		if (!window.addEventListener) {
			var _match = function(element) {
				element = $(element);
				if (element.prop(CHECKED)) {
					element.attr(CHECKED, CHECKED);
				} else {
					element.removeAttr(CHECKED);
				}
				// 触发重绘，使相邻选择器渲染
				element.parent().addClass('z').toggleClass('i_i');
			};
			
			if ($(this).length == 1 && $(this).attr('type') == 'radio') {
				// 单选框含有组的概念
				// 也就是a选中的时候，b则变成非选中态					
				// 因此，类名切换不能只关注当前元素
				var name = $(this).attr('name');
				$('input[type=radio][name='+ name +']').each(function() {
					_match(this);	
				});
			} else {
				$(this).each(function() {
					_match(this);
				});
			}
			
			
			return $(this);
		}
	};
	
    return {
		// 使用面对对象模式暴露给其他方法使用，例如Checkbox.js
		// 当然，你也可以直接使用$().propMatch()方法
		match: function(control) {
			control.propMatch();
		},
		init: function() {
			if (!window.addEventListener && !window.initedRadio) {
				// 压缩的时候少36字节
				var selector = 'input[type=radio]';
				// 全局委托
				$(document.body).delegate(selector, 'click', function() {
					$(this).propMatch();
				});
				
				// 首次页面载入，对页面所有单选框（根据是否选中态）进行初始化				
				$(selector).propMatch();
				
				// 防止多次初始化
				window.initedRadio = true;								
			}
		}
	};
}));
