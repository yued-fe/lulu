/**
 * @Drop.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-30
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Drop = factory();
    }
}(this, function (require, exports, module) {
	// require
	if (typeof require == 'function') {
		require('common/ui/Follow');
	} else if (!$().follow) {
		if (window.console) {
			console.error('need Follow.js');
		}
		return {};
	}

	/*
	* 元素的下拉显示
	 */
	
	/*
	 * 支持jQuery API调用和模块化调用两种
	 * @example
	 * $('trigger').drop(target, options);
	 * or
	 * new Drop(trigger, target, options)
	*/

	$.fn.drop = function(target, options) {
		return $(this).each(function() {
			var drop = $(this).data('drop');
			if (!drop) {
				$(this).data('drop', new Drop($(this), target, options));
			}         
        });
	};

	// 实例方法
	var Drop = function(trigger, target, options) {
		var defaults = {
			eventType: 'null',        // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示,
			selector: '',             // 新增，实现点击或hover事件的委托实现
			offsets: {
				x: 0,
				y: 0
			},
			edgeAdjust: true,
			position: '7-5',
			onShow: $.noop,
			onHide: $.noop
		};

		var params = $.extend({}, defaults, options || {});

		// 元素暴露给实例
		this.el = {};
		this.el.trigger = trigger;
		this.el.target = target;

		// 偏移
		this.offsets = params.offsets;

		// 回调
		this.callback = {
			show: params.onShow,
			hide: params.onHide
		};

		// 位置
		this.position = params.position;
		// 边缘调整
		this.edgeAdjust = params.edgeAdjust;

        // 实例的显示状态
        this.display = false;

		var drop = this;
		
		switch (params.eventType) {
			case 'null': {
				this.show();
				break;
			} 
			case 'hover': {
				// hover处理需要增加延时
				var timerHover;
				// 同时，从trigger移动到target也需要延时，因为两者可能有间隙，不能单纯移出就隐藏
				var timerHold;

				trigger.delegate(params.selector, 'mouseenter', function() {
					drop.el.trigger = $(this);
					// 显示的定时器
					timerHover = setTimeout(function() {
						drop.show();
					}, 150);
					// 去除隐藏的定时器
					clearTimeout(timerHold);
				});
				trigger.delegate(params.selector, 'mouseleave', function() {
					// 清除显示的定时器
					clearTimeout(timerHover);
					// 隐藏的定时器
					timerHold = setTimeout(function() {
						drop.hide();
					}, 200);
				});
				
				if (!target.data('dropHover')) {
					target.hover(function() {
						// 去除隐藏的定时器
						clearTimeout(timerHold);
					}, function() {
						// 隐藏
						timerHold = setTimeout(function() {
							drop.hide();
						}, 100);
					});
					target.data('dropHover', true);
				}

				break;
			}
			case 'click': {
				trigger.delegate(params.selector, 'click', function(event) {
					drop.el.trigger = $(this);
					// 点击即显示
					if (drop.display == false) {
						drop.show();
					} else {
						drop.hide();
					}
					event.preventDefault();	
				});
				break;
			}
		}

		// 点击页面空白区域隐藏
		if (params.eventType == 'null' || params.eventType == 'click') {
			$(document).mousedown(function(event) {
			    var clicked = event && event.target;
			    if (!clicked || !drop || drop.display != true) return;

			    var tri = drop.el.trigger.get(0), tar = drop.el.target.get(0);
			    if (clicked != tri && clicked != tar && tri.contains(clicked) == false && tar.contains(clicked) == false) {
			        drop.hide();
			    }
			});
		}

		// 窗体尺寸改变生活的重定位
		$(window).resize(function() {
			drop.follow();
		});
	};

	Drop.prototype.follow = function() {
		if (this.display = true && this.el.trigger.css('display') != 'none') {
			this.el.target.follow(this.el.trigger, {
				offsets: this.offsets,
				position: this.position,
				edgeAdjust: this.edgeAdjust
			});
		}
	};

	Drop.prototype.show = function() {
		// target需要在页面中
		var target = this.el.target;
		if (target && $.contains(document.body, target.get(0)) == false) {
			$('body').append(target);
		}
		this.display = true;
		target.css('position', 'absolute').show();
		
		// 定位
		this.follow();

		// onShow callback
		if ($.isFunction(this.callback.show)) {
			this.callback.show.call(this, this.el.trigger, this.el.target);
		}
	};

	Drop.prototype.hide = function() {
		this.el.target.hide();
		this.display = false;
		// onHide callback
		if ($.isFunction(this.callback.hide)) {
			this.callback.hide.call(this, this.el.trigger, this.el.target);
		}
	};

	return Drop;
}));
