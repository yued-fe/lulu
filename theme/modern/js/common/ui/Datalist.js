/**
 * @Datalist.js
 * @author xunxuzhang
 * @version
 * Created: 16-03-28
 *
**/
(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Datalist = factory();
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
     * 数据下拉列表
     * 类似于传统Autocomplete功能
	 * 仿HTML5原生datalist功能实现
	 * 支持静态呈现(基于现有HTML构建)和动态获取(本地存储或请求)
     */
	
	// 常量变量
	var DATALIST = 'datalist', SELECTED = 'selected', ACTIVE = 'active', REVERSE = 'reverse';
	var CL = 'ui-datalist';

	/* 过滤HTML标签的方法 */
	$.stripHTML = function(str) {
		if (typeof str == 'string') {
			return str.replace(/<\/?[^>]*>/g, '');
		}
		return '';
	};
	/* 转义HTML标签的方法 */
	$.encodeHTML = function(str) {
		if (typeof str == 'string') {
			return str.replace(/<|&|>/g, function(matchs) {
				return ({
					'<': '&lt;',
					'>': '&gt;',
					'&': '&amp;'
				})[matchs];
			});
		}
		return '';
	};
	$.decodeHTML = function(str) {
		if (typeof str == 'string') {
			return str.replace(/&lt;|&gt;|&amp;/g, function(matchs) {
				return ({
					'&lt;': '<',
					'&gt;': '>',
					'&amp;': '&'
				})[matchs];
			});
		}
		return '';
	};

	/*
	 * 支持jQuery API调用和模块化调用两种
	 * @example
	 * $('input').datalist();
	 * or
	 * new Datalist($('input'))
	*/

	$.fn.datalist = function(options) {
		return $(this).each(function(index, element) {
			var datalist = $(this).data(DATALIST);
			if (!datalist) {
				$(this).data(DATALIST, new Datalist($(this), options));
			}         
        });
	};
	
	
	var Datalist = function(el, options) {
		if (!el) return;
		// el一般特指输入框
		if (el.nodeType == 1) el = $(el);
		// 分3种情况
		// 1. list属性静态获取(使用场景有限，已经不考虑该实现)
		// 2. 根据name值本地获取
		// 3. options的data参数获取
		var defaults = {
			// 列表数据，'auto'表示取自本地存储，还支持数组和函数类型和对象
			data: 'auto',
			// 最多出现的匹配条目数，如果数目不限，使用'auto'关键字
			max: 8,
			// 下拉列表的宽度，默认和输入框宽度一致，支持数值和function
			width: 'auto',
			// 显示容器
			container: $(document.body),
			// 对总数据的过滤方法，默认前序匹配
			filter: function(data, value) {
				// this是当前实例对象
				var self = this;
				// 元素
				var trigger = self.el.trigger;
				// this是当前实例对象
				var arr = [];
				// 默认是从头到尾完全字符匹配
				if ($.isArray(data)) {
					$.each(data, function(i, obj) {
						if (value == '' || obj.value.indexOf(value) == 0) {
							arr.push(obj);
						}
					});
				}
				return arr;				
			},
			// 当值通过下拉选择改变时候触发的事件
			// 可以数值，也可以是字符串
			trigger: ['change'],
			// 显示和隐藏时候的回调
			// this为实例对象，支持两个参数，
			// 分别是trigger(输入框)和target(生成列表)元素	
			onShow: $.noop,
			onHide: $.noop
		};

		options = options || {};

		// max是否通过原生的results属性设置
		var results = el.attr('results');
		if (results) {
			options.max = +results;
		}

		var params = $.extend({}, defaults, options);

		// 暴露的数据
		var self = this;
		self.el = {
			input: el,
			trigger: el,
			container: params.container
		};
		self.callback = {
			trigger: params.trigger,
			filter: params.filter,
			show: params.onShow,
			hide: params.onHide
		};
		self.params = {
			width: params.width,
			max: params.max,
			data: params.data,
			index: -1
		};

		this.bool = {
			modern: 'oninput' in document.createElement('div')
		};

		self.display = false;

		// 从本地自动获得数据
		if (params.data == 'auto') {
			// 前提要有name属性值同时autocomplete开启，也就是值不是off
			var name = el.attr('name'),
				autocomplete = el.attr('autocomplete');
			if (name && autocomplete != 'off') {
				// 跟随浏览器autocomplete规范实现
				// 首先灭了浏览器内置的autocomplete
				el.attr('autocomplete', 'off');
			}	
			this.callback.data = function() {
				var data = [];
				// IE7忽略自动记忆功能
				if (window.localStorage && name && autocomplete != 'off') {
					// 本地获取
					var strList = localStorage[DATALIST + '-' + name];
					if (strList) {
						$.each(strList.split(','), function(i, value) {
							// value必须
							if (value) data.push({
								label: '',
								value: value
							});
						});
					}
				}

				return data;
			};

			// 表单记忆
			el.parents('form').on('submit', function() {
				self.store();
			});
		} 
		// 直接data参数
		else if ($.isArray(params.data)) {
			this.callback.data = function() {
				return params.data;
			};
		}
		// 如果是函数
		else if ($.isFunction(params.data)) {
			this.callback.data = params.data;
		}
		// 如果是ajax参数对象
		else if ($.isPlainObject(params.data) && params.data.url) {
			// 首先灭了浏览器内置的autocomplete
			el.attr('autocomplete', 'off');

			// 更改filter内置过滤处理（如果用户并没有自定义的话）
			if (!options.filter) {
				self.callback.filter = function(data) {
					return data;
				};
			}

			// 外部的success设置
			var customSuccess = params.data.success;

			this.callback.data = function() {
				// 清除延时，避免妹子输入都请求
				clearTimeout(self.ajaxTimer);

				// 有2个参数有内置，需要合并
				// 1是搜索查询参数
				// 2是成功后的回调
				var ajaxParams = $.extend({}, {					
					dataType: 'json'
				}, params.data);

				ajaxParams.data = ajaxParams.data || {};

				// 合并搜索查询
				var name = el.attr('name') || 'k', value = $.trim(el.val());

				if (value == '') {
					self.data = [];
					return [];
				}

				ajaxParams.data[name] = value;

				// 合并成功回调
				ajaxParams.success = function(json) {
					if (customSuccess) {
						customSuccess.apply(ajaxParams, arguments);
					}
					if (json && $.isArray(json.data)) {
						self.refresh(self.callback.filter.call(self, json.data));
					}
				};

				// 请求保护，200毫秒延迟判断
				self.ajaxTimer = setTimeout(function() {
					$.ajax(ajaxParams);
				}, 200);				
			};
		}

		// 上面的数据方法准备完毕，下面事件
		this.events();
	};




	/*
	 * 本地存储输入框的值
	*/
	Datalist.prototype.store = function() {
		// 元素
		var trigger = this.el.trigger;
		// 元素属性值
		var value = '', name = '';
		// 只有data为auto时候才本地记忆
		if (window.localStorage && this.params.data == 'auto' && (value = this.value()) && (name = trigger.attr('name'))) {
			// 本地获取
			var arrList = (localStorage[DATALIST + '-' + name] || '').split(',');
			// 如果当前数据并未保存过
			var indexMatch = $.inArray(value, arrList);
			if (indexMatch == -1) {
				// 新值，前面插入
				arrList.unshift(value);				
			} else if (indexMatch != 0) {
				// 如果当前匹配内容不是首位，顺序提前
				// 把需要提前的数组弄出来
				var arrSplice = arrList.splice(indexMatch, 1);
				// 重新连接
				arrList = arrSplice.concat(arrList);
			}

			// 更改对应的本地存储值
			localStorage[DATALIST + '-' + name] = arrList.join();
		}

		return this;
	},

	/*
	 * 清除本地存储的值
	*/
	Datalist.prototype.removeStore = function(value) {
		// value参数存在下面3种逻辑
		// 1. 字符串内容，表示移除本地该值数据（如果有）
		// 2. true，表示清空本地对应该存储
		// 3. undefined, 表示使用trigger的value值作为移除对象

		// 元素
		var trigger = this.el.trigger;
		// 元素属性值
		var name = trigger.attr('name');
		// 只有data为auto时候才本地记忆
		if (window.localStorage && this.params.data == 'auto' && name && (value = value || this.value())) {
			if (value === true) {
				localStorage.removeItem(DATALIST + '-' + name);
			} else if (typeof value == 'string') {
				// 本地获取
				var arrList = (localStorage[DATALIST + '-' + name] || '').split(',');
				// 当前数据位置
				var indexMatch = $.inArray(value, arrList);
				if (indexMatch != -1) {
					// 删除
					arrList.splice(indexMatch, 1);
					// 更改对应的本地存储值
					localStorage[DATALIST + '-' + name] = arrList.join();
				}
			}
		}

		return this;
	},

	/*
	 * 刷新列表
	*/
	Datalist.prototype.refresh = function(data) {
		var self = this;
		// 元素们
		var trigger = this.el.trigger, target = this.el.target;

		if (!target) {
			this.create();
			target = this.el.target;
		}

		// 此时输入框的值
		var value = this.value();

		// 列表的刷新
		// 根据data和filter得到最终呈现的数据
		if (typeof data == 'undefined') {
			var data = this.callback.filter.call(this, this.callback.data(), value);

			if ($.isArray(data) == false) return this;
		}
		// 显示的最大个数
		if (typeof this.params.max == 'number') {
			data = data.slice(0, this.params.max);
		}

		// 暴露最终使用的列表数据
		this.data = data;

		// 列表HTML组装
		var htmlList = '';
		if (data && data.length) {
			// 先不匹配任何列表项
			self.params.index = -1;
			// 拼接列表字符内容
			$.each(data, function(i, obj) {
				// 过滤HTML标签
				var valueStrip = $.stripHTML(obj.value || ''),
					labelStrip = $.stripHTML(obj.label || '');

				var selected = '';
				if (value && valueStrip == value) {
					selected = ' ' + SELECTED;
					// 这个键盘操作时候需要
					self.params.index = i;
				}

				if (obj.label) {
					htmlList = htmlList + 
					// 虽然使用其他标签模拟<datalist>
					// 但是，一些属性值，还是遵循HTML规范					
					'<li class="'+ CL +'-option'+ selected +'" value="'+ valueStrip +'" label="'+ labelStrip +'" data-index="'+ i +'">'+ 
						// label应该前置，可以通过相邻选择器控制后面内容的UI
						'<label class="'+ CL +'-label">'+ 
							obj.label +
						'</label><span class="'+ CL +'-value">'+ 
							obj.value + 
						'</span>' +
					'</li>';
				} else {
					htmlList = htmlList + 
					// 但是，一些属性值，还是遵循HTML规范
					'<li class="'+ CL +'-option'+ selected +'" value="'+ valueStrip +'" data-index="'+ i +'">'+ 
						'<span class="'+ CL +'-value">'+ obj.value + '</span>' +
					'</li>';
				}				
			});
		}

		if (htmlList != '') {
			htmlList = '<ul class="'+ CL +'-datalist">' + htmlList + '</ul>';
		}

		target.html(htmlList);

		if (htmlList) {
			if (this.display == false) {
				this.show();				
			}
		} else if (this.display == true) {
			this.hide();
		}

		if (this.display == true) {
			var eleSelected = target.find('.' + SELECTED)[0];
			if (eleSelected) {
				$(eleSelected).parent().scrollTop(eleSelected.offsetTop);
			}
		}
	};

	Datalist.prototype.create = function() {
		var self = this;
		// list属性值需要和创建的列表元素id对应获取
		var trigger = this.el.trigger;		

		// 原生HTML5应该是对应datalist元素
		// 但1. datalist无法自定义UI; 2. IE9-不支持；3. 一些bug存在
		// 所以，我们使用普通的ul列表元素模拟
		if (!this.el.target) {
			// 看看是否有list属性值
			var id = trigger.attr('list');
			if (!id) {
				// 如果没有关联id，创建之
				id = DATALIST + (Math.random() + '').split('.')[1];
				trigger.attr('list', id);
			}

			var target = $('<div id="'+ id +'">').addClass(CL).on('click', 'li', function() {
				// 选择某一项
				var value = $(this).attr('value');
				// 赋值
				self.value(value)
				// 关闭列表
				.hide();
			});

			if (trigger.attr('id')) {
				target.addClass(DATALIST + '-' + trigger.attr('id').toLowerCase());
			}
			// 载入页面
			self.el.container.append(target);

			// 元素暴露
			this.el.target = target;

			// 默认display态
			this.display = false;
		}

		return this;		
	};

	/*
	 * 输入框赋值或者取值
	*/
	Datalist.prototype.value = function(value) {
		// 元素们
		var trigger = this.el.trigger;
		// 回调
		var triggerEvent = this.callback.trigger, 
		// 常量变量
		INPUT = 'input';

		if (typeof value == 'undefined') {
			// 取值
			return $.encodeHTML($.trim(trigger.val()));
		} else {
			// 赋值
			trigger.val($.decodeHTML(value + ''));
		}

		// 事件
		if (value && triggerEvent) {
			// 赋值时候触发的回调事件们
			// 对于现代浏览器input事件是一定要触发的
			if (this.bool.modern) {
				if ($.isArray(triggerEvent)) {
					if ($.inArray(INPUT, triggerEvent) == -1) {
						triggerEvent.push(INPUT);
					}
				} else if (triggerEvent && typeof triggerEvent == 'string' && triggerEvent != INPUT) {
					triggerEvent = [INPUT, triggerEvent];	
				} else {
					triggerEvent = [INPUT];
				}
			} else 
				// IE7, IE8赋值自动触发，无需额外触发input
				if ($.isArray(triggerEvent) == false) {
				triggerEvent = [triggerEvent];
			}

			$.each(triggerEvent, function(i, eventType) {
				trigger.trigger(eventType);
			});
		}

		return this;
	},

	/*
	 * 一些事件
	*/
	Datalist.prototype.events = function() {
		var self = this;
		// 事件
		// 元素们
		var trigger = this.el.trigger;
		// 输入
		trigger.on({
			blur: function() {
				// 仅仅标记当前是否是focus态
				$(this).data('focus', false);
			},
			click: function() {					
				if (self.display == false && 
					$(this).data('focus') == true && 
					(self.params.data == 'auto' || $.trim(this.value))
				) {
					// 当前列表隐藏，同时是focus态
					self.refresh();
				}
				// 标记为focus态
				$(this).data('focus', true);
			},
			input: function(event) {
				if (event.isTrigger) return;
				// 输入行为的时候，如果内容为空，内隐藏列表
				if ($.trim(this.value)) {
					self.refresh();
				} else {
					self.hide();
				}		
			},
			keydown: function(event) {
				// data为当前列表使用的数据
				// index表示当前选中列表的索引值
				var data = self.data, index = self.params.index;

				switch (event.keyCode) {
					case 27: case 13: {
						// ESC-27 ENTER-13
						if (self.display == true) {	
							// 列表隐藏						
							self.hide();

							event.preventDefault();
							
							if (this.value && self.el.target.find('.' + SELECTED).length) {
								// 当键盘选值的时候，阻止默认行为
								// 例如ENTER表单提交，ESC输入框内容清空 
								event.preventDefault();
								// 文本内容从选中态改为focus态
								setTimeout(function() {
									var ele = event.target;
									if(ele.setSelectionRange) {
						                try {
						                	// 部分输入框类型，例如email, number不支持selection
						                	ele.setSelectionRange(ele.value.length, ele.value.length);
						                } catch (e) {
						                	ele.value = ele.value;
						                }
						            } else {
						                ele.value = ele.value;
						            }

						            // 触发Validate.js中的验证
						            if (isSupportInput) $(ele).trigger('input');
								}, 17);
							}						
						}
						break;
					}
					case 38: {						
						// UP-38						
						if (self.display == true && data && data.length) {
							index--;
							if (index < 0) {
								index = data.length - 1;
							}
						}
						break;
					}
					case 40: {
						// DOWN-40
						if (self.display == true && data && data.length) {
							index++;
							if (index > data.length - 1) {
								index = 0;
							}							
						}
						break;
					}
				}

				if (event.keyCode == 38 || event.keyCode == 40) {
					event.preventDefault();
					// for IE8 不执行onpropertychange事件
					$(this).data('stopPropertyChange', true)
					// 上下键的时候，列表数据不动态获取和过滤
					if (data[index]) self.value($.stripHTML(data[index].value));
					
					$(this).select();

					self.refresh(data);
				}
			}
		});
		
		var isSupportInput = this.bool.modern;

		// IE7-IE8 模拟 input
		if (trigger.length && isSupportInput == false) {
			trigger[0].attachEvent('onpropertychange',  function(event) {
				if (event && event.propertyName == "value" && !trigger.data('stopPropertyChange')) {
					if ($.trim(trigger.val())) {
						self.refresh();
					} else {
						self.hide();
					}
				}
				$(this).data('stopPropertyChange', false)
			});
		}	

		// 点击空白处隐藏
		$(document).mouseup(function(event) {
			var ele = event.target, target = self.el.target;

			if (ele && target && ele != trigger[0] && ele != target[0] && target[0].contains(ele) == false) {
				self.hide();
			}
		});

		// 浏览器窗口改变重定位
		$(window).resize(function() {
			if (self.display == true) {
				self.position();
			}
		});

		return this;
	};

	Datalist.prototype.position = function() {
		// 元素们
		var trigger = this.el.trigger, target = this.el.target;

		if (trigger && target) {
			target.follow(trigger, {
				// 边缘不自动调整，此处手动调整
				edgeAdjust: false
			});

			if (this.display == true) {
				trigger.addClass(ACTIVE);
			}
		}

		// 列表的定位
		return this;
	};
	
	Datalist.prototype.show = function() {
		// 元素们
		var trigger = this.el.trigger, target = this.el.target;

		if (!target) {
			this.create();
			target = this.el.target;
		}

		// 当前的显示状态
		var display = this.display;

		// 列表的宽度
		var width = this.params.width;
		if (width == 'auto') {
			width = trigger.outerWidth();
		} else if ($.isFunction(width)) {
			width = width.call(this, trigger, target);
		}

		if (width != 'auto' && typeof width != 'number') {
			width = trigger.width();
		}

		// z-index自动最高
		var zIndex = target.css('zIndex') * 1 || 19, maxIndex = zIndex;
		$('body').children().each(function() {
			var z = $(this).css('zIndex') * 1;
			if (z) {
				maxIndex = Math.max(z, maxIndex);
			}
		});
		if (zIndex < maxIndex) {
			target.css('zIndex', maxIndex + 1);
		}

		target.css({
			display: 'block',
			width: width
		});

		// 显示状态标记
		this.display = true;

		// 定位
		this.position();

		// 显示回调，当之前隐藏时候才触发
		if (display == false) {
			this.callback.show.call(this, trigger, target);
		}
	};
	
	Datalist.prototype.hide = function() {
		// 元素们
		var trigger = this.el.trigger, target = this.el.target;

		if (target && this.display == true) {
			target.hide().removeClass(REVERSE);
			// 隐藏回调
			this.callback.hide.call(this, trigger, target);
		}

		trigger.removeClass(ACTIVE).removeClass(REVERSE);

		// 隐藏状态标记
		this.display = false;
	};
    
    return Datalist;
}));