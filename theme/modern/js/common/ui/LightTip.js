/**
 * @LightTip.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-25
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.LightTip = factory();
    }
}(this, function () {
	/**
     * 顶部的请提示效果
	 * 支持jQuery $全局调用以及模块化调用
	 * @example
	 * $.lightTip.success(message);
	 * $.lightTip.error(message);
	 * new LightTip().success(message);
	 * new LightTip().error(message);
     **/
	
	// 类名变量
	var CL = 'ui-lightip', prefixTips = CL + '-';
	
	$.lightTip = (function() {
		// 下面是两个私有方法
		var _create = function(message) {
			return _position($('<div class="'+ CL +'"></div>')
				.html('<i class="'+ prefixTips +'icon">&nbsp;</i><span class="'+ prefixTips +'text">' + message + '</span>')
				.appendTo($(document.body)));
		}, _position = function(tips) {
			var zIndex = tips.css('z-index'), newZIndex = 0;
			$('body').children().each(function() {
				newZIndex = Math.max(zIndex, parseInt($(this).css('z-index')) || 0);
			});

			if (zIndex != newZIndex) {
				tips.css('z-index', newZIndex);
			}

			return tips.css({
				left: '50%',
				marginLeft: tips.outerWidth() * -0.5	
			});


		};
		
		return {
			success: function(message, time) {
				var lightTips = _create(message).addClass(prefixTips + 'success');
				setTimeout(function() {
					lightTips.fadeOut(function() {
						lightTips.remove();
						lightTips = null;	
					});
				}, time || 3000);

				return lightTips;
			},
			error: function(message, time) {
				var lightTips = _create(message).addClass(prefixTips + 'error');
				setTimeout(function() {
					lightTips.fadeOut(function() {
						lightTips.remove();
						lightTips = null;	
					});
				}, time || 3000);

				return lightTips;
			}
		}	
	})();
	
	var LightTip = function() {
		this.el = {};
		return this;
	};
	
	LightTip.prototype.success = function(message) {		
		this.el.container = $.lightTip.success(message);	
		return this;
	};
	LightTip.prototype.error = function(message) {
		this.el.container = $.lightTip.error(message);		
		return this;
	};
	
    return LightTip;
}));
