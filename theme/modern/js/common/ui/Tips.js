/**
 * @Tips.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-25
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Tips = factory();
    }
}(this, function (require) {
	if (typeof require == 'function') {
		require('common/ui/Follow');
	} else if (!$().follow) {
		if (window.console) {
			console.error('need Follow.js');
		}
		return {};
	}

	/**
     * 黑色tips效果
	 * 支持jQuery包装器调用以及模块化调用
	 * @example
	 * $().tips(options);
	 * new Tips(el, options)
     **/
	
	// 类名变量
	var CL = 'ui-tips', prefixTips = CL + '-';
	
	$.fn.tips = function(options) {		
		return $(this).each(function() {
			if (!$(this).data('tips')) {
				$(this).data('tips', new Tips($(this), options));
			}
        });
	};
	
	var Tips = function(el, options) {
		var defaults = {
			attribute: 'title',
			eventType: 'hover',    // 'click', 'null'
			content: '',
			align: 'center',
			delay: 100,
			onShow: $.noop,
			onHide: $.noop
		};

		if (typeof el == 'string') {
            el = $(el);
        }

        if (!el || !el.length) {
            return this;
        }
		
		var params = $.extend({}, defaults, options || {});

		// 创建元素
		var trigger = el, before, after;
			
        // 分两种情况
		// 1. IE9+ 纯CSS(伪元素)实现，使用类名ui-tips; IE7-IE8 内入两元素，水平居中效果JS实现
		// 2. 所有浏览器都绝对定位跟随, 手动绑定
		
		// 对于第一种情况			
		if (trigger.hasClass(CL)) {
			// 如果元素含有title, 需要转换成data-title
			var title = trigger.attr('title') || trigger.attr('data-title');
			if (title) {
				trigger.attr('data-title', title)
				// 原本的title移除
				.removeAttr('title');
			}
			// 对于IE7和IE8浏览器，我们需要插入两个元素
			if (!window.addEventListener) {
				before = $('<span class="'+ prefixTips +'before"></span>').html(title);
				after = $('<i class="'+ prefixTips +'after"></i>'); 
				// 前后插入
				trigger.prepend(before);
				trigger.append(after);
				
				// 水平居中必须
				before.css('margin-left', before.outerWidth() * -0.5);
				after.css('margin-left', after.outerWidth() * -0.5);
				// 其余交给CSS
			}

			trigger.data('tips', true);

			return;	
		}
		
		var self = this, tips, timer;
		
		var _content = function() {
			var content = params.content;
			if (!content) {
				content = trigger.attr(params.attribute);
				// 如果是title, 移除避免重复交互
				if (params.attribute == 'title') {
					content = content || trigger.data('title');
					if (content) {
						trigger.data('title', content)
					}
					trigger.removeAttr('title');
				}
			}
			return content;
		}
		
		// 暴露参数
		this.el = {
			trigger: trigger,
			tips: tips
		};
		this.callback = {
			show: params.onShow,
			hide: params.onHide
		};
		this.align = params.align;


		// 事件走起
		if (params.eventType == 'hover') {
			trigger.hover(function() {
				var content = _content();
				timer = setTimeout(function() {
					self.show(content);
				}, params.delay);					
			}, function() {
				clearTimeout(timer);
				self.hide();
			});
		} else if (params.eventType == "click") {
			trigger.click(function() {
				self.show(_content());
			});
			$(document).mouseup(function(event) {
				var target = event.target, dom = trigger.get(0);
				if (self.display == true && dom != target && dom.contains(target) == false && self.el.tips.get(0).contains(target) == false) {
					self.hide();
				}
			});
		} else {
			this.show(_content());
		}
		
		return this;
	};
	
	Tips.prototype.show = function(content) {
		if (!content) return this;

		var trigger = this.el.trigger, tips = this.el.tips, before, after;
		// 一些参数

		if (tips) {
			tips.show();

			before = tips.find('span').html(content);
			after = tips.find('i');
		} else {
			tips = $('<div></div>').addClass(prefixTips + 'x');
			// 两个元素
			before = $('<span class="'+ prefixTips +'before"></span>').html(content);
			after = $('<i class="'+ prefixTips +'after"></i>');
			
			$(document.body).append(tips.append(before).append(after));
		}
		
		// 水平偏移大小
		var offsetX = 0, position = '5-7';
		if (this.align == 'left') {
			offsetX = -0.5 * before.width() + parseInt(before.css('padding-left')) || 0;
		} else if (this.align == 'right') {
			offsetX = 0.5 * before.width() - parseInt(before.css('padding-right')) || 0;
		} else if (this.align == 'rotate') {
			position = '6-8'
		} else if (typeof this.align == 'number') {
			offsetX = this.align;
		}

		tips.addClass(prefixTips + this.align);

		if (this.align != 'rotate') after.css({
			// 尖角的位置永远对准元素
			left: offsetX	
		});

		// 定位
		tips.follow(trigger, {
			offsets: {
				x: offsetX,
				y: 0
			},
			position: position,       // trigger-target
			edgeAdjust: false  	   // 边界溢出不自动修正
		});
		
		// 显示的回调
		this.callback.show.call(trigger, tips);

		this.el.tips = tips;

		this.display = true;

		return this;
	};

	Tips.prototype.hide = function() {
		if (this.el.tips) {
			this.el.tips.hide();
			// 移除回调
			this.callback.hide.call(this.el.trigger, this.el.tips);
		}
		this.display = false;

		return this;
	};
	
	Tips.prototype.init = function() {
		$('.' + CL).tips();

		// 全局委托，因为上面的初始化对于动态创建的IE7,IE8浏览器无效
		$(document).mouseover(function(event) {
			var target = event && event.target;
			if (target && $(target).hasClass(CL) && !$(target).data('tips')) {
				$(target).tips();
			}
		});

		return this;
	}

    return Tips;
}));

