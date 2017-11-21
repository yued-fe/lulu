/**
 * @ErrorTip.js
 * @author xunxuzhang
 * @version
 * Created: 15-07-01
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.ErrorTip = factory();
    }
}(this, function (require, exports, module) {
	if (typeof require == 'function') {
		require('common/ui/Follow');
	} else if (!$().follow) {
		if (window.console) {
			console.error('need Follow.js');
		}
		return {};
	}

	/**
     * 红色的tips错误提示效果
	 * 支持jQuery包装器调用以及模块化调用
	 * @example
	 * $().tips(options);
	 * new Tips(el, options)
     **/
	
	// 类名变量
	var CL = 'ui-tips', prefixTips = CL + '-';
	
	$.fn.errorTip = function(content, options) {
		var defaults = {
			unique: true,
			align: 'center',
			onShow: $.noop,
			onHide: $.noop
		};
		
		var params = $.extend({}, defaults, options || {});

		// 要显示的字符内容
		if ($.isFunction(content)) content = content();
		if (typeof content != 'string') return this;
		
		return $(this).each(function(index, element) {
			// 单实例模式下，我们只处理第一个包装器元素
			if (params.unique == true && index > 0) { return; }

			// 一些元素
			var trigger = $(this), tips, before, after;
			
			if (params.unique == true && window.errorTip) {
				tips = errorTip.data('trigger', trigger);
			} else if (params.unique == false && trigger.data('errorTip')) {
				tips = trigger.data('errorTip');				
			} else {
				tips = $('<div class="'+ prefixTips +'x '+ prefixTips +'error"></div>').html(
					'<span class="'+ prefixTips +'before"></span><i class="'+ prefixTips +'after"></i>'
				);
				
				$(document.body).append(tips.append(before).append(after));
				
				// 如果是唯一模式，全局存储
				if (params.unique == true) {
					window.errorTip = tips.data('trigger', trigger);
				} else {
					trigger.data('errorTip', tips);
				}

				// 隐藏
				var hide = function() {
					if (tips.css('display') != 'none') {
						tips.hide();
						params.onHide.call((tips.data('trigger') || trigger).removeClass('error'), tips);
					}
				};
				// 任何键盘操作，点击，或者拉伸都会隐藏错误提示框
				$(document).bind({
					keydown: function(event) {
						// ctrl/shift键等不隐藏
						if (event.keyCode != 16 && event.keyCode != 17) {
							hide();
						}
					},
					mousedown: function(event) {
						var activeElement = document.activeElement, 
							activeTrigger = tips.data('trigger'),
							activeTarget = event.target;

						if (activeElement && activeTrigger && activeElement == activeTarget && 
							activeElement == activeTrigger.get(0) && 
							// 这个与Datalist.js关联
							activeTrigger.data('focus') == false
							) {
							return;
						}
						hide();
					}
				});
				$(window).bind({
					resize: hide 
				});
			}
			
			// 显示提示
			tips.show();
			// 两个元素
			before = tips.find('span');
			after = tips.find('i');
			
			// 修改content内容
			before.html(content);
			
			// 水平偏移大小
			var offsetX = 0;
			if (params.align == 'left') {
				offsetX = -0.5 * before.width() + parseInt(before.css('padding-left')) || 0;
			} else if (params.align == 'right') {
				offsetX = 0.5 * before.width() - parseInt(before.css('padding-right')) || 0;
			} else if (typeof params.align == 'number') {
				offsetX = params.align;
			}

			after.css({
				// 尖角的位置永远对准元素
				left: offsetX	
			});
			
			// 定位
			tips.follow(trigger, {
				align: params.align,
				position: "5-7",       //trigger-target
				edgeAdjust: false  	   // 边界溢出不自动修正
			});
			
			// 显示的回调
			params.onShow.call(trigger.addClass('error valided'), tips);

        });
	};
	
	var ErrorTip = function(el, content, options) {
		el.errorTip(content, options);
		
		this.el = {
			trigger: el	
		};
		this.cl = CL;
		
		return this;
	};
	
    return ErrorTip;
}));
