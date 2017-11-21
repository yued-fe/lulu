/**
 * @Placeholder.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-17
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Placeholder = factory();
    }
}(this, function () {
	var PLACEHOLDER = 'placeholder';
	
	/**
     * 针对IE7-IE9浏览器的placeholder占位符效果
	 * 支持jQuery用法，以及模块化使用
     * @使用示例
     *  $('input').placeholder();
	 *	or 
	 *  new Placeholder($('input'));
     */
	
	$.fn[PLACEHOLDER] = function() {		
		return $(this).each(function(index, element) {
			var placeholder = $(this).data(PLACEHOLDER);
			if (placeholder) {
				placeholder.visibility();
			} else {
				new Placeholder($(this));
			}           
        });
	};
	
	var Placeholder = function(el) {
		// IE10+不处理
		if (typeof history.pushState == 'function') return this;
		// 默认所有的占位符元素
		if (!el) {
			el = $('['+ PLACEHOLDER +']').placeholder();
			return this;
		}

		var self = this;

		// 暴露的元素
		this.el = {};
		this.el.target = el;

		// 创建
		// 1. 得到对应的id, 没有则赋值
		var attribute = el.attr(PLACEHOLDER), id = el.attr('id');
		// 需要有placeholder属性值，以及不能重复实例化
		if (!attribute || el.data(PLACEHOLDER)) return this;
		if (!id) {
			// 如果没有id, 设置随机id，使placeholder所在的label元素与之关联
			id = PLACEHOLDER + (Math.random() + '').replace('.', '');
			el.attr('id', id);
		}
		// 2. 对应的label元素
		var elePlaceholder = $('<label class="ui-'+ PLACEHOLDER +'" for='+ id +'>'+ attribute +'</label>').hide();
			
		// 插入
		var isHide = el.is(':visible') == false;
		// 当input是内联时候，后置; 块状时候，下置
		if (isHide == false) {
			if (el.css('display') != 'block') {
				elePlaceholder.insertAfter(el);
			} else {
				$('<div aria-hidden="true"></div>').append(elePlaceholder).insertAfter(el);
			}

			// 事件
			// IE9 使用input事件
			// IE7/IE8使用propertychange事件
			if (window.addEventListener) {
				el.on('input', function() {
					self.visibility();
				});	
			} else {
				el.get(0).attachEvent('onpropertychange',  function(event) {
					if (event && event.propertyName == "value") {
						self.visibility();
					}
				});
			}

			// 元素上存储对应的实例对象
			el.data(PLACEHOLDER, self);

			// 实例存储
			this.el.placeholder = elePlaceholder;

			// 显示或隐藏
			this.visibility();
		} else {
			$(document.body).click(function() {
				// 全局委托
				if (el.is(':visible') && !el.data(PLACEHOLDER)) {
					self = new Placeholder(el);
				}
				// 实时同步文本框的显隐状态
				if (el.data(PLACEHOLDER)) {
					self.visibility();
				}
			});

			// 遇到DOM载入后fadeIn效果，导致初始化时候，元素还是隐藏的，加个定时器看看
			setTimeout(function() {
				self.visibility();
			}, 200);
		}			
		
	};

	Placeholder.prototype.position = function() {
		var target = this.el.target, label = this.el.placeholder;
		// 创建label元素
		var mt = parseInt(target.css('marginTop')) || 0, 
			mr = parseInt(target.css('marginRight')) || 0, 
			mb = parseInt(target.css('marginBottom')) || 0,
			ml = parseInt(target.css('marginLeft')) || 0, 
			width = target.width(), 
			outerWidth = target.outerWidth(),
			outerHeight = target.outerHeight();

		// 块状
		if (label.parent().attr('aria-hidden')) {
			// 块状
			label.css({
				width: width,
				marginLeft: ml,
				marginTop: (outerHeight + mb) * -1
			});			
		} else {
			// 内联
			label.css({
				width: width,
				marginTop: mt,
				marginLeft: (outerWidth + mr) * -1
			});
		}

		// if (target.attr('id') == 'spanSearch') location.href += '#' + label.get(0).outerHTML;

		return this;
	};

	Placeholder.prototype.visibility = function() {
		var target = this.el.target;
		if (target.is(':visible') == false || $.trim(target.val())) {
			this.hide();
		} else {
			this.show();
		}
		return this;
	};

	Placeholder.prototype.show = function() {
		if (this.el.placeholder) {
			this.el.placeholder.html(this.el.target.attr(PLACEHOLDER)).show();
			// 显示同时重定位，各种复杂场景都能适应
			this.position();
		}
		return this;
	};

	Placeholder.prototype.hide = function() {
		if (this.el.placeholder) this.el.placeholder.hide();
		return this;
	};
	
    return Placeholder;
}));