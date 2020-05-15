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
}));/**
 * @Follow.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-25
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Follow = factory();
    }
}(this, function () {
	/**
     * 绝对定位元素的定位效果
	 * 针对所有浏览器
	 * 自动含边界判断
	 * 可用在DropDown, Tips等组件上
	 * 支持链式调用和模块化调用
	 * @example
	 * $().follow(trigger, options);
	 * new Follow(trigger, target, options);
	 
	 * 文档见：http://www.zhangxinxu.com/wordpress/?p=1328 position()方法
    **/
	
    $.fn.follow = function(trigger, options) {
		var defaults  = {
			offsets: {
				x: 0,
				y: 0	
			},
			position: "4-1", //trigger-target
			edgeAdjust: true //边缘位置自动调整
		};	
		
		var params = $.extend({}, defaults, options || {});
		
		return $(this).each(function() {
			var target = $(this);
			
			if (trigger.length == 0) {
				return;
			}
			var pos, tri_h = 0, tri_w = 0, tri_l, tri_t, tar_l, tar_t, cor_l, cor_t,
				tar_h = target.data("height"), tar_w = target.data("width"),
				st = $(window).scrollTop(), sl = $(window).scrollLeft(),
				
				off_x = parseInt(params.offsets.x, 10) || 0, off_y = parseInt(params.offsets.y, 10) || 0,
				mousePos = this.cacheData;

			//缓存目标对象高度，宽度，提高鼠标跟随时显示性能，元素隐藏时缓存清除
			if (!tar_h) {
				tar_h = target.outerHeight();
			}
			if (!tar_w) {
				tar_w = target.outerWidth();
			}
			
			pos = trigger.offset();
			tri_h = trigger.outerHeight();
			tri_w = trigger.outerWidth();
			tri_l = pos.left;
			tri_t = pos.top;
			
			var funMouseL = function() {
				if (tri_l < 0) {
					tri_l = 0;
				} else if (tri_l + tri_h > $(window).width()) {
					tri_l = $(window).width() - tri_w;	
				}
			}, funMouseT = function() {
				if (tri_t < 0) {
					tri_t = 0;
				} else if (tri_t + tri_h > $(document).height()) {
					tri_t = $(document).height() - tri_h;
				}
			};			
			
			var arrLegalPos = ["4-1", "1-4", "5-7", "2-3", "2-1", "6-8", "3-4", "4-3", "8-6", "1-2", "7-5", "3-2"],
				align = params.position, 
				alignMatch = false, 
				strDirect;
				
			$.each(arrLegalPos, function(i, n) {
				if (n === align) {
					alignMatch = true;	
					return;
				}
			});
			
			// 如果没有匹配的对齐方式，使用默认的对齐方式
			if (!alignMatch) {
				align = defaults.position;
			}
			
			var funDirect = function(a) {
				var dir = "bottom";
				//确定方向
				switch (a) {
					case "1-4": case "5-7": case "2-3": {
						dir = "top";
						break;
					}
					case "2-1": case "6-8": case "3-4": {
						dir = "right";
						break;
					}
					case "1-2": case "8-6": case "4-3": {
						dir = "left";
						break;
					}
					case "4-1": case "7-5": case "3-2": {
						dir = "bottom";
						break;
					}
				}
				return dir;
			};
			
			//居中判断
			var funCenterJudge = function(a) {
				if (a === "5-7" || a === "6-8" || a === "8-6" || a === "7-5") {
					return true;
				}
				return false;
			};
			
			var funJudge = function(dir) {
				var totalHeight = 0, totalWidth = 0;
				if (dir === "right") {
					totalWidth = tri_l + tri_w + tar_w + off_x;
					if (totalWidth > $(window).width()) {
						return false;	
					}
				} else if (dir === "bottom") {
					totalHeight = tri_t + tri_h + tar_h + off_y;
					if (totalHeight > st + $(window).height()) {
						return false;	
					}
				} else if (dir === "top") {
					totalHeight = tar_h + off_y;
					if (totalHeight > tri_t - st) {
						return false;	
					} 
				} else if (dir === "left") {
					totalWidth = tar_w + off_x;
					if (totalWidth > tri_l) {
						return false;	
					}
				}
				return true;
			};
			//此时的方向
			strDirect = funDirect(align);

			//边缘过界判断
			if (params.edgeAdjust) {
				//根据位置是否溢出显示界面重新判定定位
				if (funJudge(strDirect)) {
					//该方向不溢出
					(function() {
						if (funCenterJudge(align)) { return; }
						var obj = {
							top: {
								right: "2-3",
								left: "1-4"	
							},
							right: {
								top: "2-1",
								bottom: "3-4"
							},
							bottom: {
								right: "3-2",
								left: "4-1"	
							},
							left: {
								top: "1-2",
								bottom: "4-3"	
							}
						};
						var o = obj[strDirect], name;
						if (o) {
							for (name in o) {
								if (!funJudge(name)) {
									align = o[name];
								}
							}
						}
					})();
				} else {
					//该方向溢出
					(function() {
						if (funCenterJudge(align)) { 
							var center = {
								"5-7": "7-5",
								"7-5": "5-7",
								"6-8": "8-6",
								"8-6": "6-8"
							};
							align = center[align];
						} else {
							var obj = {
								top: {
									left: "3-2",
									right: "4-1"	
								},
								right: {
									bottom: "1-2",
									top: "4-3"
								},
								bottom: {
									left: "2-3",
									right: "1-4"
								},
								left: {
									bottom: "2-1",
									top: "3-4"
								}
							};
							var o = obj[strDirect], arr = [];
							for (name in o) {
								arr.push(name);
							}
							if (funJudge(arr[0]) || !funJudge(arr[1])) {
								align = o[arr[0]];
							} else {
								align = o[arr[1]];	
							}
						}
					})();
				}
			}


			
			// 是否变换了方向
			var strNewDirect = funDirect(align), strFirst = align.split("-")[0];
			
			//确定left, top值
			switch (strNewDirect) {
				case "top": {
					tar_t = tri_t - tar_h;
					if (strFirst == "1") {
						tar_l = tri_l;	
					} else if (strFirst === "5") {
						tar_l = tri_l - (tar_w - tri_w) / 2;
					} else {
						tar_l = tri_l - (tar_w - tri_w);
					}
					break;
				}
				case "right": {
					tar_l = tri_l + tri_w ;
					if (strFirst == "2") {
						tar_t = tri_t;	
					} else if (strFirst === "6") {
						tar_t = tri_t - (tar_h - tri_h) / 2;
					} else {
						tar_t = tri_t - (tar_h - tri_h);
					}
					break;
				}
				case "bottom": {
					tar_t = tri_t + tri_h;
					if (strFirst == "4") {
						tar_l = tri_l;	
					} else if (strFirst === "7") {
						tar_l = tri_l - (tar_w - tri_w) / 2;
					} else {
						tar_l = tri_l - (tar_w - tri_w);
					}
					break;
				}
				case "left": {
					tar_l = tri_l - tar_w;
					if (strFirst == "2") {
						tar_t = tri_t;	
					} else if (strFirst === "6") {
						tar_t = tri_t - (tar_w - tri_w) / 2;
					} else {
						tar_t = tri_t - (tar_h - tri_h);
					}
					break;
				}
			}


			if (params.edgeAdjust && funCenterJudge(align)) {
				var winWidth = $(window).width(), winHeight = $(window).height();
				// 是居中定位
				// 变更的不是方向，而是offset大小
				// 偏移处理
				if (align == '7-5' || align == '5-7') {
					// 左右是否超出
					if (tar_l - sl < 0.5 * winWidth) {
						// 左半边，判断左边缘
						if (tar_l - sl < 0) {
							tar_l = sl;
						}
					} else if (tar_l - sl + tar_w > winWidth) {
						tar_l = winWidth + sl - tar_w;
					}
				} else {
					// 上下是否超出
					if (tar_t - st < 0.5 * winHeight) {
						// 左半边，判断左边缘
						if (tar_t - st < 0) {
							tar_t = st;
						}
					} else if (tar_t - st + tar_h > winHeight) {
						tar_t = winHeight + st - tar_h;
					}
				}				
			}
			
			if (strNewDirect == "top" || strNewDirect == "left") {
				tar_l = tar_l - off_x;
				tar_t = tar_t - off_y;
			} else {
				tar_l = tar_l + off_x;
				tar_t = tar_t + off_y;
			}

			//浮动框显示
			target.css({
				position: "absolute",
				left: Math.round(tar_l),
				top:  Math.round(tar_t)
			}).attr('data-align', align);

			// 层级
			// z-index自动最高
			var zIndex = target.css('zIndex') * 1 || 19, maxIndex = zIndex;
			$('body').children().each(function() {
				var z, ele = this, el = $(ele);
				if (ele !== target[0] && el.css('display') !== 'none' && (z = el.css('zIndex') * 1)) {
					maxIndex = Math.max(z, maxIndex);
				}
			});
			if (zIndex < maxIndex) {
				target.css('zIndex', maxIndex + 1);
			}
		});
	};
	
	var Follow = function(trigger, target, options) {
		target.follow(trigger, options);
	};
	
	Follow.prototype.hide = function() {
		target.remove();
	};
	
	return Follow;	
}));/**
 * @Tab.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-12
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Tab = factory();
    }
}(this, function () {
	/**
     * 定制级极简的选项卡
	 * 选项卡效果本质上就是单选框切换效果
	 * 因此，状态类名使用.checked
     * @使用示例
     *  new Tab($('#container > a'), {
	 *	   callback: function() {}
	 *	});

	 * 或者包装器用法
	 * $('#container > a').tab({
	 *   callback: function() {}
	 * });
     */
	 
	var STATE = 'checked';

	$.fn.eqAttr = function(key) {
		key = key || "data-rel";
		// 获得属性对应的值
		var value = $(this).attr(key);
		if (!value) return $();
		// 当作id来处理
		var target = $("#" + value);
		if (target.length) return target;
		// 否则当作className处理
		return $("." + value);
	};
	
	// 根据属性获得对应的元素
	$.fn.tab = function(options) {
		if (!$(this).data('tab')) {
			$(this).data('tab', new Tab($(this), options));
		}
	};

	$.queryString = function(key, value, str) {
		// 有则替换，无则加勉
		var href = (str || location.href).split('#')[0], root = '', hash = location.hash;
		// 查询数组
		var arr_query = href.split('?'), arr_map = [];
		if (arr_query.length > 1) {		
			if (arr_query[1] != '') {
				arr_map = $.grep(arr_query[1].split('&'), function(query) {
					return query.split('=')[0] != key;
				});
			}
			root = arr_query[0] + '?' + arr_map.join('&') + '&';
			root = root.replace('?&', '?');
		} else {
			root = href + '?';
		}
		return root + key + '=' + value + hash;
	};
	
	
    var Tab = function(el, options) {
		// 选项卡元素，点击主体
		el = $(el);
		// 如果元素没有，打道回府
		if (el.length == 0) return;
		
		// 下面3语句参数获取
		options = options || {};
		var defaults = {
			eventType: 'click',
			index: 'auto',   // 'auto' 表示根据选项卡上的状态类名，如.checked获取index值
			history: true,   // 是否使用HTML5 history在URL上标记当前选项卡位置，for IE10+
			callback: $.noop
		};
		var params = $.extend({}, defaults, options);
		
		// 很重要的索引
		var indexTab = params.index;
		// 首先，获得索引值
		el.each(function(index) {
			if (typeof indexTab != 'number' && $(this).hasClass(STATE)) {
				indexTab = index;
			}
			$(this).data('index', index);
		});
		
		if (typeof indexTab != 'number') {
			indexTab = 0;
		}
		
		
		// 获得选项卡对应的面板元素
		// 两种情况
		// 1. 直接切换
		// 2. ajax并载入
		
		// 目前先第一种
		// 则直接就是页面元素
		// 事件gogogo
		el.on(params.eventType, function(event) {			
			if ($(this).hasClass(STATE)) {
				if (event.isTrigger) {
					// 让可能不匹配的content面板的checked状态同步
					// 一般出现在选项卡查询关键字变化后
					// 因为项目原因，内部面板默认display跟nav不匹配
					// 后注释是因为发现体验比较差
					/*el.each(function() {
						$(this).eqAttr().removeClass(STATE);
					});
					$(this).eqAttr().addClass(STATE);*/

					params.callback.call(this, this, $(), $(), $());
				}
				return;	
			}
			
			// 选项卡样式变变变
			// 类名变化
			var targetTab = $(this).addClass(STATE),
			// 要移除类名的选项卡
			resetTab = el.eq(indexTab).removeClass(STATE);
			
			// 面板的变化
			var targetPanel = targetTab.eqAttr().addClass(STATE),
			resetPanel = resetTab.eqAttr().removeClass(STATE);
			
			// 索引参数变化
			indexTab = targetTab.data('index');
			
			// 回调方法
			params.callback.call(this, targetTab, resetTab, targetPanel, resetPanel);
			
			if (/^(:?javas|#)/.test(this.getAttribute('href'))) {
				var rel = targetTab.attr('data-rel');
				if (params.history && history.replaceState) {
					history.replaceState(null, document.title, $.queryString('targetTab', rel));
				} else if (params.history) {
					location.hash = '#targetTab=' + rel;
				}
				event.preventDefault();
			}
		});
		
		// 默认就来一发
		$(function() {
			el.eq(indexTab).trigger(params.eventType);
		});
				
		// 暴露的属性或方法，供外部调用
		this.el = {
			tab: el	
		};
		this.params = params;
	};
	
	return Tab;
}));
/**
 * @Select.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-18
 *
**/

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        factory().init();
    }
}(this, function () {
	/**
     * 模拟下拉框效果
	 * 只针对all浏览器进行处理
	 * 基于原生的<select>元素生成
	 *
     */
	
	/*
	 * 支持jQuery API调用
	 * @example
	 * $('select').selectMatch();
	 * 如果不依赖seajs，则载入改JS就会页面所有下拉UI初始化
	*/
	
	$.fn.selectMatch = function(options) {
		// 常量变量
		var SELECT = 'select', SELECTED = 'selected', DISABLED = 'disabled',  ACTIVE = 'active', REVERSE = 'reverse';

		// 默认参数
		var defaults = {
			prefix: 'ui-',    // 一些UI样式类名的前缀
			trigger: ['change']     // 触发原始下拉框的事件，默认只触发change事件
		};
		// 参数合并
		var params = $.extend({}, defaults, options || {});
		
		// 通用前缀
		var PREFIX = params.prefix + SELECT, joiner = params.prefix.replace(/[a-z]/gi, '');
		
		// 根据下拉框获得相关数据的私有方法
		var _get = function(el) {
			var selectedIndex = 0, htmlOptions = '';
			
			// 遍历下拉框的options选项
			el.find('option').each(function(index) {
				var arrCl = [PREFIX + joiner + 'datalist'+ joiner +'li', this.className];
				
				if (this[SELECTED]) {
					selectedIndex = index;
					arrCl.push(SELECTED); 
				}
				if (this[DISABLED]) {
					arrCl.push(DISABLED); 
				}
				
				htmlOptions = htmlOptions + '<a href="javascript:" class="'+ arrCl.join(' ') +'" data-index='+ index +'>'+ this.innerHTML +'</a>';
			});
			
			return {
				index: selectedIndex,
				html: htmlOptions
			}
		}

		return $(this).each(function(index, element) {
            var sel = $(this).hide().data(SELECT);
			if (!sel) {
				// 如果没有关联的模拟下拉元素生成
				// 创建新的模拟下拉元素
				sel = $('<div></div>').on('click', 'a._', function() {
					if ($(element).prop(DISABLED)) return false;
					// 显示与隐藏
					sel.toggleClass(ACTIVE);
					// 边界判断
					if (sel.hasClass(ACTIVE)) {
						var ul = sel.children('div[id]'), 
						overflow = ul.offset().top + ul.outerHeight() > Math.max($(document.body).height(), $(window).height());
						sel[overflow? 'addClass': 'removeClass'](REVERSE);

						// 滚动与定位
						var arrData = sel.data('scrollTop'), selected = ul.find('.' + SELECTED);
						// 严格验证
						if (arrData && arrData[1] == selected.attr('data-index') && arrData[2] == selected.text()) {
							ul.scrollTop(arrData[0]);
							// 重置
							sel.removeData('scrollTop');
						}						
					} else {
						sel.removeClass(REVERSE);
					}
				}).on('click', 'a[data-index]', function(event, istrigger) {
					var indexOption = $(this).attr('data-index'),
						scrollTop = $(this).parent().scrollTop();	
					// 下拉收起
					sel.removeClass(ACTIVE);
					// 存储可能的滚动定位需要的数据
					sel.data('scrollTop', [scrollTop, indexOption, $(this).text()]);
					// 修改下拉选中项
					$(element).find('option').eq(indexOption).get(0)[SELECTED] = true;
					// 更新下拉框
					$(element).selectMatch(params);
					// 回调处理
                    $.each(params.trigger, function(i, eventType) {
						$(element).trigger(eventType, [istrigger]);	
					});
				});
				// 存储对象
				$(this).data(SELECT, sel);
				// 载入元素
				$(this).after(sel);
				
				// 点击页面空白要隐藏
				$(document).mouseup(function(event) {
					var target = event.target;
					if (target && sel.hasClass(ACTIVE) && sel.get(0) !== target && sel.get(0).contains(target) == false) {
						sel.removeClass(ACTIVE).removeClass(REVERSE);
					}
				});
			}
			
			// 根据当前下拉元素，重新刷新
			// 0. 获得我们需要的一些数据
			var data = _get($(this)), option = $(this).find('option').eq(data.index);
			// 1. 与select元素匹配的类名, 以及宽度
			sel.attr('class', element.className + ' ' + PREFIX).width($(this).outerWidth());
			// 2. 全新的按钮元素
			var id = ('id_' + Math.random()).replace('0.', '');
			var button = '<a href="javascript:" class="'+ PREFIX + joiner + 'button _" data-target="'+ id +'">'+ 
				'<span class="'+ PREFIX + joiner + 'text">' + option.html() + '</span>'+
				'<i class="'+ PREFIX + joiner + 'icon"></i></a>';
			// 3. 全新的列表
			var datalist = '<div id="'+ id +'" class="'+ PREFIX + joiner + 'datalist">'+ data.html +'</div>';
			
			// 4. 刷新
			sel.html(button + datalist);
        });
	};
	
    return {
		init: function(el, options) {
			el = el || $('select');
			el.selectMatch(options);
		}
	};
}));
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
/**
 * @DropList.js
 * @author xinxuzhang
 * @version
 * Created: 15-06-30
 * 2017-03-13 使也支持委托
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.DropList = factory();
    }
}(this, function (require) {
	// require
	if (typeof require == 'function') {
		require('common/ui/Drop');
	} else if (!$().drop) {
		if (window.console) {
			console.error('need Drop.js');
		}
		return {};
	}

	/*
	* 下拉列表
	* @trigger 触发下拉的按钮元素
	* @data 下拉列表数据，数组，例如：
	* [{
	* 	id: 1,
	* 	value: '所有评论',
	* 	selected: true
	* }, {
	* 	id: 2,
	* 	value: '未审核评论',
	* 	disabled: true
	* }, {
	* 	id: 3,
	* 	value: '通过评论'
	* }]

	* 也可以是Function函数，表示数据是动态呈现的
	 */
	
	var prefixDropList = 'ui-droplist-', SELECTED = 'selected', DISABLED = 'disabled'; 

	var DropList = function(trigger, data, options) {
		var defaults = {
			eventType: 'click',        // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏
			offsets: {
				x: 0,
				y: 0
			},
			selector: '',
			width: '',
			onShow: $.noop,
			onHide: $.noop,
			onSelect: $.noop           // this为当前点击的列表元素，支持两个参数，第一个参数为列表元素对应的数据(纯对象)，第二个是当前实例对象
		};

		var params = $.extend({}, defaults, options || {});

		// 列表元素
		var target = $('<div></div>').addClass(prefixDropList + 'x').css('width', params.width);

		// 下拉三角
		var arrow = trigger.find('.' + prefixDropList + 'arrow');

		// 下拉三角元素的HTML代码
		var htmlArrow = arrow.length? arrow.get(0).outerHTML: '';

		//  trigger除去三角以外的HTML代码
		var htmlLeft = $.trim(trigger.html().replace(htmlArrow, ''));

		// 创建列表
		// 不管怎样，data需要是个有数据的数组
		// 如果不符合条件，我们只能反馈没有数据
		if ($.isArray(data) && data.length == 0) {
			data = [{
				value: '没有数据',
				disabled: true
			}];
		} else if ($.isArray(data) && params.selector == '') {
		// 1. 如果列表数据含有selected: true, 则自动重置trigger里面的内容
		// 2. 如果列表数据没有selected: true, 则根据trigger的内容信息确定哪个数据是selected
			var hasSelected = false, matchIndex = -1;
			$.each(data, function(index, obj) {
				if (obj.selected) {
					trigger.html(obj.value + htmlArrow);
					hasSelected = true;
				}
				if ($.trim(obj.value) == htmlLeft) {
					matchIndex = index;
				}
			});

			if (hasSelected == false && matchIndex != -1) {
				data[matchIndex].selected = true;
			}
		}

		// 根据data组装列表
		var _get = function(arr) {
			var html = '';
			$.each(arr, function(index, obj) {
				// 选中列表的类名
				var clSelected = '';
				if (obj[SELECTED]) clSelected = ' ' + SELECTED;

				// 禁用态和非禁用使用标签区分
				if (obj[DISABLED] != true) {
					html = html + '<a href="javascript:;" class="'+ prefixDropList +'li'+ clSelected +'" data-index="'+ index +'">'+ obj.value +'</a>';
				} else {
					html = html + '<span class="'+ prefixDropList +'li">'+ obj.value +'</span>';
				}
			});
			return html;
		};

		// 下拉面板
		trigger.drop(target, {
			eventType: params.eventType,
			offsets: params.offsets,
			selector: params.selector,
			onShow: function() {
				var _data = this.data;
				if ($.isFunction(data)) {
					_data = data();
					// 更新
					drop.data = _data;
				}
				target.html(_get(_data));
				params.onShow.apply(this, [trigger, target]);
			},
			onHide: params.onHide
		});

		var drop = trigger.data('drop');

		drop.data = data;

		// 列表元素内容，事件
		target.delegate('a', 'click', function() {
			var index = $(this).attr('data-index') * 1;
			if ($(this).hasClass(SELECTED) == false) {
				// 除去所有的selected
				if ($.isArray(data)) {
					$.each(data, function(i, obj) {
						if (obj[SELECTED]) {
							obj[SELECTED] = null;
						}
						if (i == index) {
							obj[SELECTED] = true;
						}
					});
					// 缓存新的数据
					drop.data = data;

					trigger.html($(this).html() + htmlArrow);
				}
				
				params.onSelect.call(this, drop.data[index], drop);
			}

			drop.hide();
		});

		return drop;
	};
	
	return DropList;
}));
/**
 * @DropPanel.js
 * @author xinxuzhang
 * @version
 * Created: 15-07-01
 */
(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.DropPanel = factory();
    }
}(this, function (require) {
	// require
	if (typeof require == 'function') {
		require('common/ui/Drop');
	} else if (!$().drop) {
		if (window.console) {
			console.error('need Drop.js');
		}
		return {};
	}

	/*
	* 下拉面板
	* @trigger 触发下拉的按钮元素
	* @options 面板数据以及下拉参数，例如：
	*｛
	*    title: '删除评论',
	*    content: '删除后，您的粉丝在文章中将无法看到该评论。',
	*    buttons: [{}, {}]
	* ｝
	 */
	
	var prefixGlobal = 'ui-', joiner = '-', prefixDropPanel = 'ui-dropanel-', SELECTED = 'selected', DISABLED = 'disabled'; 

	// 关闭SVG
	var svg = window.addEventListener? '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>': '';

	var DropPanel = function(trigger, options) {
		var defaults = {
			title: '',
			content: '',
			buttons: [{}, {}],
			width: 'auto',


			eventType: 'click',        // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏
			offsets: {
				x: 0,
				y: 0
			},
			onShow: $.noop,
			onHide: $.noop
		};

		var params = $.extend({}, defaults, options || {});

		// 面板容器		
		var target = $('<div></div>').addClass(prefixDropPanel + 'x');
		if (/\d/.test(params.width)) {
			target.width(params.width);
		}

		// 创建轻弹框面板的各个元素
		var el = {};
		// title
		el.title = $('<h5></h5>').addClass(prefixDropPanel + 'title').html(params.title);
		// close button
		el.close = $('<a></a>').attr({
			href: 'javascript:;'
		}).html(svg).addClass(prefixDropPanel + 'close').click(function() {
			drop.hide();
		});

		el.content = $('<div></div>').addClass(prefixDropPanel + 'content').html(params.content);
		// footer
		el.footer = $('<div></div>').addClass(prefixDropPanel + 'footer');
		// 按钮
		$.each(params.buttons, function(i, btn) {
			// 避免btn为null等值报错
			btn = btn || {};
			
			// 按钮的默认参数
			var type = i? (btn.type || ''): (btn.type || 'warning'), 
				value = i? (btn.value || '取消'): (btn.value || '确定'), 
				events = btn.events || {
					click: function() {
						drop.hide();
					}	
				};
			
			// 按钮的类名值
			var cl = prefixGlobal +'button';
			if (type) cl = cl + ' ' + cl + joiner + type;

			el.footer.append(el['button' + i] = 
				$('<a href="javascript:;" class="'+ cl +'">'+ value + '</a>').bind(events)
			);	
		});

		// 组装
		target.append(el.title).append(el.close).append(el.content).append(el.footer);

		// 基于drop的面板显隐效果
		trigger.drop(target, {
			eventType: params.eventType,
			offsets: params.offsets,
			onShow: params.onShow,
			onHide: params.onHide
		});

		var drop = trigger.data('drop');

		for (key in el) {
			drop.el[key] = el[key];
		}

		return drop;
	};

	return DropPanel;
}));
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
/**
 * @Range.js
 * @author xunxuzhang
 * @version
 * Created: 15-07-20
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Range = factory();
    }
}(this, function (require) {
    if (typeof require == 'function') {
        require('common/ui/Tips');
    } else if (!$().tips) {
        if (window.console) {
            console.error('need Tips.js');
        }
        return {};
    }

    /**
     * 基于HTML原生range范围选择框的模拟选择框效果
     * 兼容IE7+
     * min/max/step
     */
    
    var CL = 'ui-range', rangePrefix = CL + '-';

    $.fn.range = function(options) {
        return $(this).each(function() {
            if (!$(this).data('range')) {
                $(this).data('range', new Range($(this), options));
            }
        });
    };


    var Range = function(el, options) {
        var self = this;

        // el就是type类型为range的input元素
        var defaults = {
            tips: function(value) {
                return value;
            }
        };

        var params = $.extend({}, defaults, options || {});

        // 一些属性值获取
        var min = el.attr('min') || 0, max = el.attr('max') || 100, step = el.attr('step') || 1;

        // 一些元素的创建
        // 容器元素有一个类名直接取自input元素，宽度啊，margin什么的，直接就交给CSS了
        var container = $('<div></div>').attr('class', el.attr('class')).addClass(CL);
        // 轨道元素
        var track = $('<div></div>').addClass(rangePrefix + 'track');
        // 中间的圈圈
        var thumb = $('<a></a>').addClass(rangePrefix + 'thumb');

        // 前置插入
        el.before(container);
        // 如果元素没宽度，则使用el计算的宽度
        if (container.width() == 0) {
            container.width(el.width());
        }
        // 组装
        track.append(thumb);
        container.append(track);
        

        // 事件
        container.click(function(event) {
            var target = event && event.target;
            if (target && target != thumb.get(0)) {
                // 根据点击的位置在圈圈的左侧还是右侧判断选择值的增减
                var distance = event.clientX - (thumb.offset().left - $(window).scrollLeft()) - thumb.width() / 2;

                // 根据点击的距离，判断值
                self.value(el.val() * 1 + (max - min) * distance / $(this).width());
            }
        });

        // 拖动
        var posThumb = {};
        thumb.mousedown(function(event) {
            posThumb.x = event.clientX;
            posThumb.value = el.val() * 1;

            // 黑色提示
            if ($.isFunction(params.tips)) {
                if (self.tips) {
                    self.tips.show(params.tips.call(el, posThumb.value));
                } else {
                    thumb.tips({
                        eventType: 'null',
                        content: params.tips(posThumb.value)
                    });
                    self.tips = thumb.data('tips');
                }
            }

            $(this).addClass('active');
        });
        $(document).mousemove(function(event) {
            if (typeof posThumb.x == 'number') {
                var distance = event.clientX - posThumb.x;

                // 根据移动的距离，判断值
                self.value(posThumb.value + (max - min) * distance / container.width());

                if (self.tips) { self.tips.show(params.tips.call(el, el.val())); }

                event.preventDefault();
            }
        });
        $(document).mouseup(function(event) {
            posThumb.x = null;
            posThumb.value = null;
            thumb.removeClass('active');
            if (self.tips) { self.tips.hide(); }
        });

        // 全局
        this.num = {
            min: +min,
            max: +max,
            step: +step
        };

        this.el = {
            input: el,
            container: container,
            track: track,
            thumb: thumb
        };

        this.obj = {};

        // 初始化
        this.value();

        return this;
    };

    Range.prototype.value = function(value) {
        var input = this.el.input, oldvalue = input.val();
        // 一些值
        var max = this.num.max, min = this.num.min, step = this.num.step;

        if (!value) {
            oldvalue = value;
            value = $.trim(input.val());
        }
        // 区域范围判断以及值是否合法的判断
        if (value > max || (max - value) < step / 2) {
            value = max;
        } else if (value == '' || value < min || (value - min) < step / 2) {
            value = min;
        } else {
            // 寻找最近的合法value值
            value = min + Math.round((value - min) / step) * step;
        }

        input.val(value);

        this.position();

        if (value != oldvalue) {
            input.trigger('change');
        }

        return this;

    };

    Range.prototype.position = function() {
        var input = this.el.input, value = input.val();

        // 一些值
        var max = this.num.max, min = this.num.min, step = this.num.step;
        // 计算百分比
        this.el.track.css('borderLeftWidth', this.el.container.width() * (value - min) / (max - min));

        return this;
    };


    return Range;
}));
/**
 * @Color.js
 * @author xunxuzhang
 * @version
 * Created: 16-06-03
 */
(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Color = factory();
    }
}(this, function (require, exports, module) {
    if (typeof require == 'function') {
        require('common/ui/Drop');
    } else if (!$().drop) {
        if (window.console) {
            console.error('need Drop.js');
        }
        return {};
    }

    /**
     * 基于HTML原生color颜色选择
     * 兼容IE7+
     * type=color Hex format
     */
    
    var CL = 'ui-color', colorPrefix = CL + '-', defaultValue = '#000000';

    // 其他变量
    var ACTIVE = 'active', BGCOLOR = 'background-color';

    /* 一些颜色间的相互转换的公用方法 */

    // hsl颜色转换成十六进制颜色
    $.hslToHex = function (h, s, l) {
        var r, g, b;
    
        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
    
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
    
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)].map(function(rgb) {
            rgb = rgb.toString(16);
            if (rgb.length == 1) {
                return "0" + rgb;
            }
            return rgb;
        }).join("");
    };
    // 16进制颜色转换成hsl颜色表示
    $.hexToHsl = function (hex) {
        var r = parseInt("0x" + hex.slice(0,2)) / 255, 
            g = parseInt("0x" + hex.slice(2,4)) / 255, 
            b = parseInt("0x" + hex.slice(4,6)) / 255;
    
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
    
        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
    
        return [h, s, l];
    };

    // rgb/rgba颜色转hex
    $.rgbToHex = function(rgb) {
        if (!rgb) {
            return defaultValue;
        }
        var arr = [];
        if (/^#[0-9A-F]{6}$/i.test(rgb)) {
            return rgb;
        }
        if (/^#[0-9A-F]{3}$/i.test(rgb)) {
            arr = rgb.split('');
            return arr[0] + arr[1] + arr[1] + arr[2] + arr[2] + arr[3] + arr[3];
        }
        // 如果是rgb(a)色值
        arr = rgb.match(/^rgb(?:a)?\((\d+),\s*(\d+),\s*(\d+)/i);
        var hex = function(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        if (arr.length == 4) {
            return "#" + hex(arr[1]) + hex(arr[2]) + hex(arr[3]);
        }
        
        return defaultValue;
    };


    /* 包装器方法 */
    $.fn.color = function(options) {
        return $(this).each(function() {
            if (!$(this).data('color')) {
                $(this).data('color', new Color($(this), options));
            }            
        });
    };


    var Color = function(el, options) {
        var self = this;
        // 参数
        var defaults = {
            offsets: {
                x: 0,
                y: 0
            },
            edgeAdjust: false,
            position: '7-5',
            onShow: $.noop,
            onHide: $.noop
        };
        var params = $.extend({}, defaults, options || {});

        // el需要是原生的type=color的输入框
        if (!el) {
            return;
        }
        if (!el.size) {
            el = $(el);
        }
        var ele = el[0];

        // 一些默认的属性值
        var id = ele.id;
        
        if (!id) {
            // 创建随机id
            id = 'C' + (Math.random() + '').split('.')[1];
            ele.id = id;
        }

        // 只读
        el.prop('readonly', true).on('click', function(event) {
            // 阻止默认的颜色选择出现
            event.preventDefault();
        });

        // 元素构建
        // track是替换输入框的色块元素的轨道
        var track = $('<label></label>').addClass(colorPrefix + 'track').attr('for', id);
        // thumb是替换输入框的色块元素的色块区域
        var thumb = $('<span></span>').addClass(colorPrefix + 'thumb');
        // 前置插入
        el.before(track.append(thumb));

        // 浮层容器
        var container = $('<div></div>').addClass(colorPrefix + 'container');

        // 浮层显隐与定位
        track.drop(container, {
            eventType: 'click',
            offsets: params.offsets,
            edgeAdjust: params.edgeAdjust,
            position: params.position,
            onShow: function() {
                self.show();

                if (params.edgeAdjust == false) {
                    var rect = container[0].getBoundingClientRect();
                    if (rect.left < 3) {
                        container.css('margin-left', -1 * rect.left + 3);
                    } else if (rect.right - $(window).width() > 3) {
                        container.css('margin-left', $(window).width() - rect.right - 3);
                    }
                }
            },
            onHide: function() {
                self.hide();
                container.css('margin-left', '0');
            }
        });

        self.drop = track.data('drop');

        this.el = {
            input: el,
            container: container,
            track: track,
            thumb: thumb
        };

        this.callback = {
            show: params.onShow,
            hide: params.onHide
        };

        // 初始化
        this.value(ele.value);

        return this;
    };

    /**
    * 输入框的赋值和取值，同时会更改对应的UI 
    * @param value  HEX颜色值，例如'#000000'。可缺省，表示取值
    */ 
    Color.prototype.value = function(value) {
        var self = this;
        // 元素
        var input = self.el.input, thumb = self.el.thumb;
        // 目前的颜色值
        var oldvalue = input.val();
        // 取值还是赋值
        if (typeof value == 'string') {
            // 使用hex值
            value = $.rgbToHex(value);
            // 赋值
            input.val(value);
            // 按钮上的色块值
            thumb.css(BGCOLOR, value);

            // 面板上的值，各种定位的匹配
            self.match();
        } else {
            // 取值
            // 如果默认无值，使用颜色作为色值，一般出现在初始化的时候
            if (!oldvalue) {
                oldvalue = defaultValue;
                // 赋值
                input.val(oldvalue);
                // 按钮上的色块值
                thumb.css(BGCOLOR, oldvalue);
            }
            return oldvalue;
        }

        if (oldvalue && value != oldvalue) {
            input.trigger('change');
        }

        return this;
    };

    /**
    * container内HTML的创建
    */
    Color.prototype.create = function() {
        var self = this;
        // 元素
        var container = self.el.container;

        // switch button
        var convert = '<a href="javascript:" class="'+ colorPrefix +'switch">更多</a>';
        // current color
        var current = '<div class="'+ colorPrefix +'current">\
            <i class="'+ colorPrefix +'current-square colorCurrent"></i>\
            #<input class="'+ colorPrefix +'current-input">\
        </div>';
        // body
        var body = '<div class="'+ colorPrefix +'body">'+
            (function() {
                // basic color picker
                var html = '<div class="'+ colorPrefix +'basic colorBasicX">';
                // color left
                html = html + '<div class="'+ colorPrefix +'basic-l">'+ (function() {
                    return $.map(["0", "3", "6", "9", "C", "F", "F00", "018001", "0501ff", "FF0", "0FF", "800180"], function(color) {
                        color = color.toUpperCase();
                        if (color.length == 1) {
                            color = color + color + color + color + color + color;
                        } else if (color.length == 3) {
                            color = color.replace(/\w/g, function(matchs) {
                                return matchs + matchs;
                            });
                        }
                        
                        return '<a class="'+ colorPrefix +'lump" data-color="'+ color +'" style="'+ BGCOLOR +':#'+ color +'"></a>';
                    }).join('');
                })() +'</div>';
                // color main
                html = html + '<div class="'+ colorPrefix +'basic-r">' + (function() {
                    var arrBasic = ["0", "3", "6", "9", "C", "F"];
                    htmlR = '';
                    $.each(arrBasic, function(i, r) {
                        htmlR += '<div class="'+ colorPrefix +'lump-group">';
                        $.each(arrBasic, function(j, g) {
                            $.each(arrBasic, function(k, b) {
                                var color = r + r + g + g + b + b;
                                htmlR = htmlR + '<a class="'+ colorPrefix +'lump" data-color="'+ color +'" style="'+ BGCOLOR +':#'+ color +'"></a>';
                            }); 
                        });
                        htmlR += '</div>';
                    });
                    return htmlR;
                })() +'</div>';
                
                return html + '</div>';
            })() + 
            (function() {
                // more color picker
                var html = '<div class="'+ colorPrefix +'more colorMoreX">';
                // color left
                html = html + '<div class="'+ colorPrefix +'more-l">\
                <a class="'+ colorPrefix +'cover-white"></a><div class="'+ colorPrefix +'circle colorCircle"></div>\
                <svg>\
                    <defs>\
                        <linearGradient x1="0" y1="0" x2="1" y2="0" id="colorGradient">\
                            <stop offset="0%" stop-color="#ff0000"></stop>\
                            <stop offset="16.66%" stop-color="#ffff00"></stop>\
                            <stop offset="33.33%" stop-color="#00ff00"></stop>\
                            <stop offset="50%" stop-color="#00ffff"></stop>\
                            <stop offset="66.66%" stop-color="#0000ff"></stop>\
                            <stop offset="83.33%" stop-color="#ff00ff"></stop>\
                            <stop offset="100%" stop-color="#ff0000"></stop>\
                        </linearGradient>\
                    </defs>\
                    <rect x="0" y="0" width="180" height="100" fill="url(#colorGradient)"></rect>\
                </svg></div><div class="'+ colorPrefix +'more-r">\
                    <div class="'+ colorPrefix +'more-fill colorFill">\
                        <a href="javascript:" class="'+ colorPrefix +'more-cover"></a>\
                        <svg>\
                        <defs>\
                            <linearGradient x1="0" y1="0" x2="0" y2="1" id="colorGradient2">\
                                <stop offset="0%" stop-color="#ffffff"></stop>\
                                <stop offset="50%" stop-color="rgba(255,255,255,0)"></stop>\
                                <stop offset="50%" stop-color="rgba(0,0,0,0)"></stop>\
                                <stop offset="100%" stop-color="#000000"></stop>\
                            </linearGradient>\
                        </defs>\
                        <rect x="0" y="0" width="16" height="100" fill="url(#colorGradient2)"></rect>\
                    </svg>\
                    </div>\
                    <a href="javascript:" class="'+ colorPrefix +'more-arrow colorArrow"></a>\
                </div>';
                
                return html + '</div>';
            })()            
        +'</div>';
        // footer
        var footer = '<div class="'+ colorPrefix +'footer">\
            <a href="javascript:" class="'+ colorPrefix +'btn-cancel">取消</a><a href="javascript:" class="'+ colorPrefix +'btn-ensure">确定</a>\
        </div>';
        // append
        container.html(convert + current + body + footer);

        // 一些元素
        $.extend(self.el, {
            field: container.find('input'),
            basic: container.find('.colorBasicX'),
            more: container.find('.colorMoreX'),
            circle: container.find('.colorCircle'),
            fill: container.find('.colorFill'),
            arrow: container.find('.colorArrow'),
            current: container.find('.colorCurrent')
        });

        // 事件
        self.events();

        return self;
    };

    /**
    * container内的一些事件
    */
    Color.prototype.events = function() {
        var self = this;
        // 元素
        var input = self.el.input, container = self.el.container;
        // 更多元素
        // 元素
        var circle = self.el.circle,
            fill = self.el.fill,
            arrow = self.el.arrow;
        // 面板内部唯一的输入框元素
        var elInput = self.el.field;

        container.delegate('a', 'click', function(event) {
            // 元素
            var ele = this, el = $(ele);
            
            // 选择的颜色值
            var value = '';
            // 当前类名
            var cl = ele.className;
            // 按钮分类别处理
            if (/cancel/.test(cl)) {
               // 1. 取消按钮
               self.hide();
            } else if (/ensure/.test(cl)) {
                // 2. 确定按钮
                // 赋值
                value = elInput.val();
                if (value) {
                    self.value('#' + value);
                }
                self.hide();
            } else if (/lump/.test(cl)) {
                // 3. 小色块
                value = el.attr('data-color');
                elInput.val(value);
                self.match();
            } else if (/switch/.test(cl)) {
                // 4. 面板类名切换按钮
                if (ele.innerHTML == "更多") {
                    self.el.more.show();
                    self.el.basic.hide();
                    ele.innerHTML = "基本";
                } else {
                    self.el.more.hide();
                    self.el.basic.show();
                    ele.innerHTML = "更多";
                }
                // 面板的色块啊，圆和尖角位置匹配
                self.match();
            } else if (/cover/.test(cl)) {
                // 5. 渐变色的覆盖层
                // offsetLeft, offsetTop
                var rect = ele.getBoundingClientRect(), offsetLeft = event.pageX - rect.left, offsetTop = event.pageY - $(document).scrollTop() - rect.top;

                // width, height
                var width = ele.clientWidth, height = ele.clientHeight;
                
                // color
                var colorH , colorS, colorL;

                if (circle.length && fill.length && arrow.length) {
                    if (/white/.test(cl) == true) {                       
                        colorH = offsetLeft / width;
                        colorS = 1 - offsetTop / height;
                        colorL = 1 - arrow.css('top').replace("px", "") / arrow.parent().height();
                        
                        circle.css({
                            left: offsetLeft,
                            top: offsetTop
                        });

                        var hsl = "hsl("+ [360 * colorH, 100 * colorS + "%", "50%"].join() +")";

                        circle.css(BGCOLOR, hsl);
                        //fill.css(BGCOLOR, "hsl("+ [360 * colorH, 100 * colorS + "%", "50%"].join() +")");
                    } else { 
                        arrow.css('top', offsetTop);
                    }

                    // 赋值
                    elInput.val(self._getHSL().replace('#', ''));
                    self.match();
                }
            }
        });       

        // 输入框事件
        var field = self.el.field;

        field.on('input', function() {
            var value = this.value;
            if (/^[0-9A-F]{6}$/i.test(value)) {
                self.match();
            } else if (/^[0-9A-F]{3}$/i.test(value)) {
                self.match($.rgbToHex('#' + value).replace('#', ''));
            }
        }).on('keyup', function(event) {
            if (event.keyCode == 13) {
                var value = elInput.val(), oldvalue = value;
                if (value) {
                    value = $.rgbToHex('#' + value);
                    if (value != oldvalue) {
                        // 支持输入#000
                        elInput.val(value);
                    }
                    self.value('#' + value);
                }
                self.hide();
            }
        });
        
        // IE7,IE8
        if (![].map) {
            field[0].attachEvent('onpropertychange', function(event) {
                event = event || window.event;
                if (event && event.propertyName == 'value') {
                    field.trigger('input');
                }
            });
        } else {
            // 滑块拖动事件
            var oPosArrow = {};
            arrow.on('mousedown', function(event) {
                oPosArrow.pageY = event.pageY;
                oPosArrow.top = arrow.css('top').replace("px", "") * 1;
                
                event.preventDefault();
            });

            document.addEventListener("mousemove", function(event) {                
                if (typeof oPosArrow.top == "number") {
                    var top = oPosArrow.top + (event.pageY - oPosArrow.pageY), maxTop = arrow.parent().height();
                    if (top < 0) {
                        top = 0;
                    } else if (top > maxTop) {
                        top = maxTop;
                    }
                    arrow.css('top', top);
                    // 赋值，此次赋值，无需重定位
                    elInput.val(self._getHSL().replace('#', ''));
                    self.match(false);
                }
            });
            document.addEventListener("mouseup", function() {
                oPosArrow.top = null;
            });
        }

        

        return self;
    };

    /**
    * 根据坐标位置获得hsl值
    */
    Color.prototype._getHSL = function() {
        var self = this;

        // 需要的元素
        var circle = self.el.circle, arrow = self.el.arrow;

        if (circle.length * arrow.length == 0) {
            return self;
        }

        var colorH, colorS, colorL;
        // get color
        // hsl color
        if (circle[0].style.left) {
            colorH = circle.css('left').replace("px", "") / circle.parent().width()
        } else {
            colorH = 0;
        }                       
        if (circle[0].style.top) {
            colorS = 1 - circle.css('top').replace("px", "") / circle.parent().height();
        } else {
            colorS = 1;
        }
        if (arrow[0].style.top) {
            colorL = 1 - arrow.css('top').replace("px", "") / arrow.parent().height();
        } else {
            colorL = 0;
        }

        return "#" + $.hslToHex(colorH, colorS, colorL);
    };

    /**
    * 面板的色块啊，圆和尖角位置匹配
    */ 
    Color.prototype.match = function(value) {
        var self = this;

        // 首先要面板显示
        if (self.display != true) {
            return this;
        }

        // 一些元素
        var container = self.el.container, 
            current = self.el.current,
            circle, fill, arrow,
            input = self.el.input;

        var el = self.el.field;

        // 重定位
        var rePosition = true;
        if (value === false) {
            rePosition = value;
        }

        // 当前的颜色值
        var value = value || el.val();
        if (value == '') {
            // 如果输入框没有值
            // 使用之前一个合法的颜色值作为现在值
            value = $.rgbToHex(current.css(BGCOLOR)).replace('#', '');
            el.val(value);
        }
        value = value.replace('#', '');
        
        // 色块值示意
        current.css(BGCOLOR, '#' + value);

        // 当前是基本色面板还是任意色面板
        if (self.el.more.css('display') == 'none') {
            // 1. 基本色
            // 所有当前高亮的元素不高亮
            container.find('.' + ACTIVE).removeClass(ACTIVE);
            // 所有颜色一致的高亮
            container.find("a[data-color='"+ value.toUpperCase() +"']").addClass(ACTIVE);
        } else {
            circle = self.el.circle;
            fill = self.el.fill;
            arrow = self.el.arrow;

            // to HSL
            var arrHSL = $.hexToHsl(value);
            // hsl value
            var colorH = arrHSL[0], colorS = arrHSL[1], colorL = arrHSL[2];

            // 滑块和尖角的颜色和位置
            var hsl = "hsl("+ [360 * colorH, 100 * colorS + "%", "50%"].join() +")";
            if (value != '000000') {
                circle.css(BGCOLOR, hsl);
                fill.css(BGCOLOR, hsl);
            }
            
            if (rePosition == true) {
                if (colorL != 0) {
                    circle.css({
                        left: circle.parent().width() * colorH,
                        top:  circle.parent().height() * (1 - colorS)
                    });
                }
                
                arrow.css('top', arrow.parent().height() * (1 - colorL)); 
            }           
        }

        return this;
    };

    /**
    * 面板显示
    */ 
    Color.prototype.show = function() {
        var self = this;
        // 元素
        var container = self.el.container, body = $('body');
        // z-index自动最高
        var zIndex = container.css('zIndex') * 1 || 21, maxIndex = zIndex;
        body.children().each(function() {
            var z;
            if ($(this).hasClass(CL) == false && (z = $(this).css('zIndex') * 1)) {
                maxIndex = Math.max(z, maxIndex);
            }
        });
        if (zIndex < maxIndex) {
            container.css('zIndex', maxIndex + 1);
        }

        // 输入框赋值
        if (container.html() == '') {
            self.create();
        }

        // 面板显示
        if (self.drop.display == false) {
            self.drop.show();
        }
        self.display = self.drop.display;

        // 面板UI匹配
        var current = self.el.current;
        if (!current.attr('style')) {
            current.css(BGCOLOR, self.el.input.val());
        }
        self.match();

        // onShow callback
        if ($.isFunction(this.callback.show)) {
            this.callback.show.call(this, this.el.track, container);
        }

        return this;
    };

    Color.prototype.hide = function() {
        var self = this;
        // 面板隐藏
        if (self.drop.display == true) {
            self.drop.hide();
        }
        self.display = self.drop.display;

        // onShow callback
        if ($.isFunction(this.callback.hide)) {
            this.callback.hide.call(this, this.el.trigger, this.el.container);
        }

        return this;
    };

    return Color;
}));/**
 * @Loading.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-23
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Loading = factory();
    }
}(this, function () {
	var CL = 'ui-loading', CL_ICON = 'ui-loading-icon', 
		CL_BUTTON = 'ui-button', CL_BUTTON_LOADING = 'ui-button-loading', 
		joiner = '-';
	

	/**
     * 是否正在loading
     * 避免在业务代码中暴露类名
     * 1. 容器loading
     * 2. 按钮loading
     */

	$.fn.isLoading = function() {
		var container = $(this).eq(0);
		if (container.hasClass(CL_BUTTON) == false) {
			// 作为容器处理
			// 通过尺寸判断loading是否显示
			var icon = container.find('.' + CL_ICON);
			if (icon.length && icon.is(':visible')) {
				return true;
			}
			return false;
		} else {
			return container.hasClass(CL_BUTTON_LOADING);
		}
	};

	/**
     * 显示loading效果
	 * 配合CSS实现尺寸和透明度变化的动效
	 * 可用在任何Ajax异步操作呈现上，如：
	 * 1. 表格的分页请求；
	 * 2. ajax弹框呈现
	 * 支持jQuery 包装器调用和模块化调用
     */
	
	$.fn.loading = function(options) {		
		return $(this).each(function() {
			var container = $(this);
			if (container.hasClass(CL_BUTTON) == false) {
				container.data('loading', new Loading(container, options));
			} else {
				container.addClass(CL_BUTTON_LOADING);
			}
		});		
	};
	

	/**
     * unloading实际上是一个动画展示方法
	 * 会隐藏append进入的loading元素
    */
	$.fn.unloading = function(param) {
		var time = param || 0;
		if (typeof param != 'number') {
			time = 200;
		} 
		if (typeof param == 'undefined') {
			param = time;
		}

		return $(this).each(function(index, element) {
			var container = $(this);

			if (container.hasClass(CL_BUTTON)) {
				container.removeClass(CL_BUTTON_LOADING);
				return;
			}

            // IE10+的游戏
			if (typeof history.pushState == "function") {
				if (time > 0) {
					// 获得并存储当前的高度值
					var height = container.height(), minHeight = container.css('min-height');
					// 以下行为瞬间执行，用户无感知						
					container.css({
						height: 'auto',                // 高度设为auto, 用来获得此时的真实高度
						webkitTransition: 'none',
						transition: 'none',            // iOS safari下，'auto'也会触发transition过渡，因此，还原成'none'
						overflow: 'hidden'             // 动画自然
					});
					// 此时高度
					var targetHeight = container.height();
					// 高度还原
					container.height(height);
					// 移除动画
					container.removeClass(CL + joiner + 'animation');
					// 触发重绘
					element.offsetWidth = element.offsetWidth;
					
					// 动画效果
					// 触发动画效果
					if (param !== false) {
						container.addClass(CL + joiner + 'animation');
					}

					// 添加过渡效果
					// 过渡效果
					container.css({
						webkitTransition: 'height ' + time + 'ms',
						transition: 'height ' + time + 'ms'
					});

					setTimeout(function () {
						container.css('overflow', '');
					}, time);
	
					// 终极尺寸
					container.height(targetHeight);
				} else {
					// 过渡效果
					container.css({
						webkitTransition: 'none',
						transition: 'none'
					});
					
					container.height('auto').removeClass(CL);	
				}
			} else {
				container.height('auto');	
			}
        });
	};
	
	var Loading = function(el, options) {
		var defaults = {
			primary: false,       // 是否是蓝色背景
			small: false,         // 是否是小菊花
			create: false         // loading是当前容器，还是append在当前容器中	
		};
		
		var params = $.extend({}, defaults, options || {});

		// container是容器
		// loading是里面旋转的loading元素
		// 示意结构如下
		/* <div class='ui-loading'>        <!-- 默认状态与结构 -->
 			  <i class='ui-loading-icon'>
			  
			<div class='ui-loading'>
 			  <s class='ui-loading-icon'>  <!-- 小尺寸图标 -->
			  
			<div class='ui-loading ui-loading-primary'> <!-- 容器背景色是项目蓝 -->
 			  <i class='ui-loading-icon'>
		*/
		var container = el, loading = null, icon = null;
		
		// 一般情况下，我们会直接在原始HTML就显示loading相关的HTML代码
		// 此时，我们其实什么都可以不用做
		// 我们只需要关心容器内没有loading的情况

		// 当然，也存在需要append创建的情况，如table中的loading等
		this._create = function() {
			var container = this.el.container;
			loading = container.find('.' + CL), icon = container.find('.' + CL_ICON);

			if (params.create == true && loading.size() == 0) {
				container.append(loading = $('<div></div>').addClass(CL));
			} else if (params.create == false) {
				loading = container;
			}

			if (icon.size() == 0) {
				// 生成loading元素
				icon = (params.small? $('<s></s>'): $('<i></i>')).addClass(CL_ICON);
				
				// 容器状态
				loading.empty().addClass(CL).append(icon);
				
				
				// 是否是蓝色背景
				if (params.primary) {
					loading.addClass(CL + joiner + 'primary') ;
				}
				// ↑ 至此 loading效果已经出现			
			}

			this.el.loading = loading;
			this.el.icon = icon;
		}				

		// 元素存储
		this.el = {
			container: container,
			loading: loading,
			icon: icon
		};

		this.show();	

		return this;
	};
	
	Loading.prototype.show = function() {
		var el = this.el;
		
		if (!el.loading || !el.icon) {
			this._create();
		}

		el.loading.show();

		this.display = true;

		return this;
	};

	Loading.prototype.hide = function() {
		// 需要判别loading和container是不是一个元素
		// 如果是，则隐藏图标
		var el = this.el, container = el.container, loading = el.loading;
		if (loading) {
			if (container.get(0) != loading.get(0)) {
				loading.hide();
			} else if (container.find('.' + CL_ICON).length) {
				loading.empty();
				this.el.icon = null;
			}
		}
		this.display = false;

		return this;
	};

	Loading.prototype.remove = function() {
		// remove方法移除元素以及类名，是比较彻底的清除
		// 如果是，则移除图标
		var el = this.el, container = el.container, loading = el.loading, icon = el.icon;

		if (loading && icon) {
			if (container.get(0) == loading.get(0)) {
				loading.removeClass(CL);
				icon.remove();
			} else {
				loading.remove();			
			}

			this.el.loading = null;
			this.el.icon = null;
		}

		this.display = false;

		return this;
	};	

	Loading.prototype.end = function(time) {
		var el = this.el, container = el.container;
		if (container) {
			container.unloading(time);
			// 标记当前的菊花态
			if (container.find('.' + CL_ICON).length == 0) {
				this.el.icon = null;
			}			
		}

		this.display = false;

		return this;
	};
	
    return Loading;
}));/**
 * @Dialog.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-18
 * 17-03-13 按钮events可以直接是function类型
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Dialog = factory();
    }
}(this, function (require) {
	// require
	if (typeof require == 'function') {
		require('common/ui/Loading');
	} else if (!$().loading) {
		if (window.console) {
			console.error('need Loading.js');
		}
		return {};
	}

	/**
     * 弹框组件
	 * IE9+基于HTML5 <dialog>元素创建
	 * 本透明遮罩层和弹框在一个元素内
	 * @example
	 * var myDialog = new Dialog();
	 * $(button).click(function() {
		   myDialog.show();
	   });
     */	
	
	// 类名前缀
	var prefixGlobal = 'ui-', prefixDialog = 'ui-dialog-', joiner = '-';

	// 关闭SVG
	var svg = window.addEventListener? '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>': '';
	
	// Is it webkit
	var isWebkit = 'WebkitAppearance' in document.documentElement.style || typeof document.webkitHidden != "undefined";

    var Dialog = function(options) {
		var defaults = {
			title: '',
			// 不同类别的内容类型
			content: '',
			// 弹框的宽度
			width: 'auto',
			// 不同类别的默认按钮
			buttons: [],
			// 弹框显示、隐藏、移除的回调
			onShow: $.noop,
			onHide: $.noop,
			onRemove: $.noop
		};
		// 最终参数
		var params = $.extend({}, defaults, options || {});
		
		var el = {};
		this.el = el;
		// 存储一些参数
		this.width = this.width;
		this.callback = {
			show: params.onShow,
			hide: params.onHide,
			remove: params.onRemove
		};
		// 各个元素创建
		// 容器-含半透明遮罩背景
		el.container = window.addEventListener? 
			$('<dialog class="'+ prefixDialog +'container"></dialog>'):
			$('<div class="'+ prefixDialog +'container"></div>');

		if (history.pushState) {
			el.container.get(0).addEventListener(isWebkit? 'webkitAnimationEnd': 'animationend', function(event) {
				if (event.target.tagName.toLowerCase() == 'dialog') {
					this.classList.remove(prefixDialog + 'animation');
				}
			});
		}

		// 弹框主体
		el.dialog = $('<div class="'+ prefixGlobal +'dialog"></div>').css('width', params.width);
		// 标题
		el.title = $('<div class="'+ prefixDialog +'title"></div>').html(params.title);
		// 关闭按钮
		el.close = $('<a href="javascript:" class="'+ prefixDialog +'close"></a>').html(svg).click($.proxy( function(event) {
			this[this.closeMode]();
			event.preventDefault();
		}, this));
		// 主体
		var content = params.content;
		// content可以是函数
		if ($.isFunction(content)) {
			content = content();
		}

		if (!content.size) {
			this.closeMode = 'remove';
		} else {
			this.closeMode = 'hide';
		}

		el.body = $('<div class="'+ prefixDialog +'body"></div>')[content.size? 'append': 'html'](content);
		// 底部
		el.footer = $('<div class="'+ prefixDialog +'footer"></div>');
		// 按钮
		this.button(params.buttons);
				
		// 组装
		el.container.append(el.dialog.append(el.close).append(el.title).append(el.body).append(el.footer));
		
		// IE7 额外辅助元素
		if (!document.querySelector) {
			el.container.append('<i class="'+ prefixDialog +'after"></i>');
		}

		// zIndex动态计算
		// 所有dialog的前面
		var dialog = $('.' + prefixDialog +'container');
		if (dialog.size()) {
			// 页面前置
			dialog.eq(0).before(el.container.css({
				// 动态计算zIndex值
				zIndex: dialog.eq(0).css('z-index') * 1 + 1	
			}));
		} else {
			// 页面后入
			(params.container || $(document.body)).append(el.container);
		}
		
		this.display = false;
		
		if (params.content) {
			this.show();
		}

		return this;
	};
	
	Dialog.prototype.button = function(data) {
		var el = this.el, dialog = this;
		el.footer.empty();
		$.each(data, function(i, btn) {
			// 避免btn为null等值报错
			btn = btn || {};
			
			// 按钮的默认参数
			var type = i? (btn.type || ''): (btn.type || 'primary'), 
				value = i? (btn.value || '取消'): (btn.value || '确定');

			// 事件处理，如果直接function类型，则认为是点击方法

			var events = btn.events || {
				click: function() {
					dialog[dialog.closeMode]();
				}	
			};

			if ($.isFunction(events)) {
				events = {
					click: events
				};
			}
			
			// 按钮的类名值
			var cl = prefixGlobal +'button';
			if (type) cl = cl + ' ' + cl + joiner + type;

			if (!btn['for']) {
                el.footer.append(el['button' + i] =
                    $('<a href="javascript:;" class="'+ cl +'">'+ value + '</a>').bind(events)
                );
            } else {
                el.footer.append(el['button' + i] =
                    $('<label for="'+ btn['for'] +'" class="'+ cl +'">'+ value + '</label>').bind(events)
                );
            }	
		});
		
		return this;
	},
	
	Dialog.prototype.loading = function() {
		var el = this.el, dialog = this;
		if (el) {
			el.container.attr('class', [prefixDialog +'container', prefixDialog + 'loading'].join(' '));
			el.body.loading();
			this.show();
		}
		return this;
	};
	
	Dialog.prototype.unloading = function(time) {
		var el = this.el, dialog = this;
		if (el) {
			el.container.removeClass(prefixDialog + 'loading');
			el.body.unloading(time);			
		}
		return this;
	};
	
	Dialog.prototype.open = function(html, options) {
		var el = this.el, dialog = this;
		// 默认参数
		var defaults = {
			title: '',
			buttons: []
		};
		// 最终参数
		var params = $.extend({}, defaults, options || {});
		// 替换当前弹框的内容，包括按钮等
		if (el && html) {
			el.container.attr('class', [prefixDialog +'container'].join(' '));
			el.title.html(params.title);
			el.body.html(html);
			this.button(params.buttons).show();
		}
		return this;
	};
	
	Dialog.prototype.alert = function(html, options) {
		var el = this.el, dialog = this;
		// alert框的默认参数
		var defaults = {
			title: '',
			type: 'remind',  // 类型, 'remind', 'success', 'warning', 或者任意 'custom'
			buttons: [{}]
		};
		// 最终参数
		var params = $.extend({}, defaults, options || {});

		if (!params.buttons[0].type && params.type != 'remind') {
			params.buttons[0].type = params.type;
		}
		
		// 替换当前弹框的内容，包括按钮等
		if (el && html) {
			el.container.attr('class', [prefixDialog +'container', prefixDialog + 'alert'].join(' '));
			el.dialog.width('auto');
			el.title.html(params.title);
			// 如果是纯文本
            if (/<[\w\W]+>/.test(html) == false) {
                html = '<h6>' + html + '</h6>';
            }

			el.body.html('<div class="'+ prefixDialog + params.type +'">' + html + '</div>');
			this.button(params.buttons).show();

			if (el.button0) {
                el.button0.focus();
            }
		}
		return this;
	};
	
	Dialog.prototype.confirm = function(html, options) {
		var el = this.el, dialog = this;
		// confirm框的默认参数
		var defaults = {
			title: '',
			type: 'warning',
			buttons: [{
				type: 'warning'
			}, { /* 取消按钮使用默认配置 */}]
		};
		// 最终参数
		var params = $.extend({}, defaults, options || {});
		
		// warning类型的按钮可缺省
		if (params.buttons.length && !params.buttons[0].type) {
			params.buttons[0].type = 'warning';
		}
		
		// 替换当前弹框的内容，包括按钮等
		if (el && html) {
			el.container.attr('class', [prefixDialog +'container', prefixDialog + 'confirm'].join(' '));
			el.dialog.width('auto');
			el.title.html(params.title);
			// 如果是纯文本
            if (/<[\w\W]+>/.test(html) == false) {
                html = '<h6>' + html + '</h6>';
            }

			el.body.html('<div class="'+ prefixDialog + params.type +'">' + html + '</div>');
			this.button(params.buttons).show();

			if (el.button0) {
                el.button0.focus();
            }
		}	
		return this;	
	};
	
	Dialog.prototype.ajax = function(ajaxOptions, options) {
		var dialog = this, timer = new Date().getTime();
		// ajax请求的一些默认参数
		// 类似timeout等参数这里缺省了
		// url直接注释了，就是jQuery的Ajax参数
		var ajaxDefaults = {
			// url: '',              // 必须参数，请求地址
			dataType: 'JSON',
			timeout: 30000,
			error: function(xhr, status) {
				var msgSorry = '<h6>尊敬的用户，很抱歉您刚才的操作没有成功！</h6>', msgReason = '';
				
				if (status == 'timeout') {
					msgReason = '<p>主要是由于请求时间过长，数据没能成功加载，这一般是由于网速过慢导致，您可以稍后重试！</p>';	
				} else if (status == 'parsererror') {
					msgReason = '<p>原因是请求的数据含有不规范的内容。一般出现这样的问题是开发人员没有考虑周全，欢迎向我们反馈此问题！</p>';
				} else {
					msgReason = '<p>一般是网络出现了异常，如断网；或是网络临时阻塞，您可以稍后重试！如依然反复出现此问题，欢迎向我们反馈！</p>';
				}
				dialog.alert(msgSorry + msgReason, {
					type: 'warning'
				}).unloading();
			}
		};
		var ajaxParams = $.extend({}, ajaxDefaults, ajaxOptions || {});
		
		// ajax的url地址是必须参数
		if (!ajaxParams.url) return this;
		
		// 下面是弹框的一些默认参数
		var defaults = {
			title: '',
			content: function(data) {
				// 如果ajax的类型是'JSON', 此方法用来返回格式化的HTML数据
				// 如果是HTML, 默认返回HTML
				if (typeof data == 'string') {
					return data;
				} else {
				    return '<i style="display:none">看见我说明没使用\'options.content\'做JSON解析</i>';
				}
			},
			
			buttons: []	
		};
		var params = $.extend({}, defaults, options || {});
		
		// ajax走起
		// ajax success回调走合并
		var success = ajaxParams.success;
		ajaxParams.success = function(data) {
			dialog.open(params.content(data), params);
			// 移除菊花态
			// 如果时间戳小于100毫秒
			// 弹框直接打开，无动画
			if (new Date().getTime() - timer < 100) {
				dialog.unloading(0);
			} else {
				dialog.unloading();
			}

			// 这是用户设置的成功回调
			if ($.isFunction(success)) {
				success.apply(this, arguments);
			}
		};
		
		// 开始执行Ajax请求
		// 稍等……
		// 请求之前，我们还需要做一件事件
		// 开菊花
		dialog.loading();
		// ajax走起
		// 下面的定时器测试用
		setTimeout(function() {
			$.ajax(ajaxParams);
		}, 250);

		return this;
	};
	
	Dialog.prototype.scroll = function() {
		var containers = $('.' + prefixDialog + 'container'), isDisplayed = false;
		containers.each(function() {
			if ($(this).css('display') == 'block') {
				isDisplayed = true;
			}
		});


		// 因为去掉了滚动条，所以宽度需要偏移，保证页面内容没有晃动	
		if (isDisplayed) {
			var widthScrollbar = 17;
			if (this.display != true && typeof window.innerWidth == 'number') {
				widthScrollbar = window.innerWidth - document.documentElement.clientWidth;
			}
			document.documentElement.style.overflow = 'hidden';

			if (this.display != true) {
				$(document.body).css('border-right', widthScrollbar + 'px solid transparent');
			}
		} else {
			document.documentElement.style.overflow = '';
			$(document.body).css('border-right', '');
		}	
		return this;
	};

	Dialog.prototype.show = function() {
		var container = this.el.container;
		if (container) {
			// 面板显示
			container.css('display', 'block');
			if (this.display != true) {
				container.addClass(prefixDialog + 'animation')
			}
			this.scroll();
			this.display = true;
			if ($.isFunction(this.callback.show)) {
				this.callback.show.call(this, container);
			}
		}
		return this;
	};
	
	Dialog.prototype.hide = function() {
		var container = this.el.container;
		if (container) {
			container.hide();			
			this.scroll();
			this.display = false;
			if ($.isFunction(this.callback.hide)) {
				this.callback.hide.call(this, container);
			}
		}
		return this;
	};
	
	Dialog.prototype.remove = function(time) {
		var container = this.el.container;
		if (container) {
			container.remove();
			this.scroll();
			this.display = false;
			if ($.isFunction(this.callback.remove)) {
				this.callback.remove.call(this, container);
			}
		}
		return this;
	};
	
	return Dialog;
}));

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
}));/**
 * @DateTime.js
 * @author xunxuzhang
 * @version
 * Created: 15-07-03
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.DateTime = factory();
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
     * 日期，时间选择器
	 * 基于HTML5时间类输入框
	 * new DateTime(trigger, options);
	 * @trigger 触发的元素，可以是文本框也可以是文本框容器(父级)
	 * @options 可选参数
     */
	
	var prefixDate = 'ui-date-',
		prefixRange = 'ui-range-', 
		prefixDay = 'ui-day-', 
		prefixYear = 'ui-year-', 
		prefixMonth = 'ui-month-',
		prefixHour = 'ui-hour-',
		prefixMinute = 'ui-minute-';
	
	var SELECTED= 'selected', ACTIVE = 'active';
	
	var regDate = /\-|\//g;

	// 拓展方法之字符串变时间对象
	String.prototype.toDate = function() {
		var year, month, day;
		var arrDate = this.split(regDate);
		year = arrDate[0] * 1;
		month = arrDate[1] || 1;
		day = arrDate[2] || 1;
		// 年份需要是数值字符串
		if (!year) {
			return new Date();
		}
		return new Date(year, month-1, day);
	};
	// 日期对象变成年月日数组
	Date.prototype.toArray = function() {
		var year = this.getFullYear(), month = this.getMonth() + 1, date = this.getDate();
		if (month < 10) {
			month = '0' + month;
		}
		if (date < 10) {
			date = '0' + date;
		}
		return [year, month, date];
	};
	
	var DateTime = function(trigger, options) {
		if (!trigger || !trigger.length) return this;
		
		// 默认参数
		var defaults = {
			value: '',               // 文本框初始值，优先从文本框获取。
			type: 'auto',            // 浮层面板类型，可以是'date'(2015-01-01), 'year'(2015), 'month'(2015-01), 'time'(12:00), 'date-range'(2015-01-01 至 2015-06-01)
			min: 'auto',             // 时间范围最小值，优先从文本框获取。'auto'表示无最小限制。
        	max: 'auto',             // 时间范围最大值，优先从文本框获取。'auto'表示无最大限制。
        	trigger: ['change'],     // 文本框值修改时候触发的文本框事件
			onShow: $.noop,
			onHide: $.noop	
		};
		
		var params = $.extend({}, defaults, options || {});
		
		// 找到文本输入框
		var input = null;
		if (trigger.get(0).type) {
			input = trigger;
			trigger = input.parent();
		} else {
			input = trigger.find('input');	
		}
		// 如果没有时间类输入框，则byebye
		if (input.length == 0) return this;
		
		// readonly
		input.prop('readonly', true);

		// hover, active style
		input.parent().hover(function() {
			$(this).addClass('hover');
		}, function() {
			$(this).removeClass('hover');
		});
		
		// 时间选择的类型
		var type = params.type;
		if (type == 'auto') {
			type = input.attr('type') || 'date';	
		}
		//if (type == 'date') {
			// Chrome新版无法通过CSS修改连接符
			// 因此重置type
			//try {input.attr('type', '_date_')}catch(e){};	
		//}
		
		// 插入下拉箭头
		var id = input.attr('id');
		if (!id) {
			// 如果没有id, 创建随机id
			// 下拉箭头需要
			id = type + (Math.random() + '').replace('0.', '');
			input.attr('id', id);
		}
		// 下拉元素
		$('<label for="'+ id +'"></label>').addClass(prefixDate + 'arrow')
		// 插入到文本框的后面
		.insertAfter(input);
		
		// 初始值
		var initValue = input.val();
		if (initValue == '' && params.value) {
			input.val(params.value);
			initValue = params.value;
		}
		
		// 初始值转换成时间值
		switch (type) {
			case 'date': case 'year': case 'month': {
				// 日期
				var initDate = initValue.toDate(), arrDate = initDate.toArray();
				if (initValue == '') {
					// 赋值今日				
					if (type == 'date') {									
						input.val(arrDate.join('-'));
					} else if (type == 'year') {
						input.val(arrDate[0]);
					} else if (type == 'month') {
						input.val(arrDate.slice(0, 2).join('-'));
					}
				}
				
				this[SELECTED] = arrDate;  // eg. [2015,07,20]

				break;	
			}
			case 'time': case 'hour': case 'minute': {
				var arrTime = initValue.split(':');
				// 时间
				var hour = arrTime[0], minute = arrTime[1];
				// 这里的处理情况如下
				// 1. 空值
				// 2. 小时数不是数值
				// 3. 小时数不在0~24之间
				// 以上均认为时间是00:00
				if (initValue == '' || !(hour < 24 && hour > 0)) {
					hour = '00';
					minute = '00';
				} else {
					// 分钟无论如何都要是正常值
					if (!(minute > 0 && minute < 60) || type == 'hour') {
						minute = '00';
					} else if (minute.length == 1) {
						minute = '0' + minute;
					}
					// 补0是必要的
					if (hour.length == 1) {
						hour = '0' + hour;
					}				
				}
				input.val([hour, minute].join(':'));
				
				this[SELECTED] = [hour, minute];

				break;	
			}
			case 'date-range': case 'month-range': {
				// 日期范围
				var beginDate = new Date(), endDate = new Date();
				// 前后时间字符串
				var arrRange = initValue.split(' ');
				// 有如下一些情况：
				// 1. 空，则选择范围就是今日
				// 2. 只有一个时间，则选择范围只这个时间到今天这个范围
				// 3. 其他就是正常的
				if (initValue != '' && arrRange.length == 1) {
					var someDate = arrRange[0].toDate();
					if (someDate.getTime() > beginDate.getTime()) {
						endDate = someDate;
					} else {
						beginDate = someDate;
					}
				} else {
					beginDate = arrRange[0].toDate();
					endDate = arrRange[arrRange.length - 1].toDate();
				}
				// 赋值
				var arrBegin = beginDate.toArray(), arrEnd = endDate.toArray();
				if (type == 'date-range') {
					input.val(arrBegin.join('-') + ' 至 ' + arrEnd.join('-'));
				} else {
					input.val(arrBegin.slice(0,2).join('-') + ' 至 ' + arrEnd.slice(0,2).join('-'));
				}
								
				// 存储
				this[SELECTED] = [arrBegin, arrEnd];

				break;
			}

		}
		
		var self = this;

		var container = $('<div></div>').addClass(prefixDate + 'container').delegate('a', 'click', function() {
			// 各个分支中可能会用到的变量
			var year = 0, month = 0, date = 0, hour = 0;

			// 各种事件
			switch (container.attr('data-type')) {
				case 'date': {
					// 日期选择主体
					// 1. 前后月份选择
					if (/prev|next/.test(this.className)) {
						month = $(this).attr('data-month');
						self[SELECTED][1] = month * 1;

						// 日期和月份要匹配，例如，不能出现4月31日
						var monthDay = self._monthDay(self[SELECTED]);

						var day = self[SELECTED][2], 
							dayOverflow = container.data('dayOverflow'),
							dayMax = (function() {
								if (month - 1 < 0) {
									return monthDay[11];
								} else if (month > monthDay.length) {
									return monthDay[0];
								}
								return monthDay[month - 1];
							})();

						// 例如，我们超出日期是31日，如果月份可以满足31日，使用31日
						if (dayOverflow) {
							self[SELECTED][2] = Math.min(dayOverflow, dayMax);
						} else if (self[SELECTED][2] > dayMax) {
							self[SELECTED][2] = dayMax;

							// 这里是对体验的升级，
							// 虽然下月份变成了30号，但是再回来时候，原来的31号变成了30号
							// 不完美，我们需要处理下
							// 通过一个变量记住，点击item项的时候，移除
							// 且只在第一次的时候记住
							// 因为28,29,30,31都可能出现，每次记忆会混乱
							container.data('dayOverflow', day);
						}

						self[SELECTED] = self[SELECTED].join('-').toDate().toArray();

						// 刷新
						self.date();

						// 如果在时间范围内
						if (container.find('.' + SELECTED).get(0).href)	{
							self.val();
						}
					} else if (/item/.test(this.className)) {
						// 选择某日期啦
						date = this.innerHTML;
						if (/\D/.test(date)) {
							// 今天
							self[SELECTED] = new Date().toArray();
						} else {
							if (date < 10) date = '0' + date;
							// 修改全局
							self[SELECTED][2] = date;
						}
						
						// 赋值
						self.val();
						// 隐藏
						self.hide();

						container.removeData('dayOverflow');
					} else if ($(this).attr('data-type') == 'month') {
						// 切换到年份选择
						self.month();
					}
					break;
				}
				case 'date-range': {
					// 区域选择
					// 1. 前后月份选择
					if (/prev|next/.test(this.className)) {
						month = $(this).attr('data-month') * 1;

						var arrRange = self.el.container.data('date') || self[SELECTED][0];
												
						// 跟其他面板不同，这里只刷新，点击确定再赋值
						self.el.container.data('date', new Date(arrRange[0], month - 1, /*arrRange[2]*/1).toArray());
						// 之前arrRange[2]存在跨多月风险，尤其31号的日子
						// 刷新
						self['date-range']();
					} else if (/item/.test(this.className)) {
						// 选择某日期
						// 获得选中的年月日
						year = $(this).attr('data-year');
						month = $(this).attr('data-month');
						date = this.innerHTML;
						if (month < 10) month = '0' + month;
						if (date < 10) date = '0' + date;
						// 根据选中状态决定新的状态
						var range = self[SELECTED];
						if (range[0].join() == range[1].join()) {
							// 如果之前前后日期一样，说明只选中了一个日期
							// 根据前后顺序改变其中一个日期
							if (year + month + date > range[0].join('')) {
								// 新时间靠后
								range[1] = [year, month, date];
							} else {
								range[0] = [year, month, date];
							}
						} else {
							// 如果前后时间不一样，说明现在有范围
							// 则取消范围，变成单选
							range = [[year, month, date], [year, month, date]];
						}
						self[SELECTED] = range;
						self['date-range']();
					} else if (/button/.test(this.className)) {
						var typeButton = $(this).attr('data-type');
						if (typeButton == 'ensure') {
							// 点击确定按钮
							// 赋值
							self.val();
							// 修改存储值
							self._rangeSelected = self[SELECTED];
							// 关闭浮层
							self.hide();
						} else if (typeButton == 'cancel') {
							// 重置选中值
							if (self._rangeSelected) {
								self[SELECTED] = self._rangeSelected;
							}
							// 关闭浮层
							self.hide();
						}
					}
					break;
				}
				case 'month-range': {
					// 区域选择
					// 1. 前后年份选择
					if (/prev|next/.test(this.className)) {
						year = $(this).attr('data-year') * 1;

						var arrRange = self.el.container.data('date') || self[SELECTED][0];
												
						// 跟其他面板不同，这里只刷新，点击确定再赋值
						self.el.container.data('date', new Date(year, arrRange[1], 1).toArray());
						// 刷新
						self['month-range']();
					} else if (/item/.test(this.className)) {
						// 选择某日期
						// 获得选中的年月日
						year = $(this).attr('data-year');
						month = $(this).attr('data-value');
						date = '01';
						// 根据选中状态决定新的状态
						var range = self[SELECTED];
						if (range[0].join() == range[1].join()) {
							// 如果之前前后日期一样，说明只选中了一个日期
							// 根据前后顺序改变其中一个日期
							if (year + month + date > range[0].join('')) {
								// 新时间靠后
								range[1] = [year, month, date];
							} else {
								range[0] = [year, month, date];
							}
						} else {
							// 如果前后时间不一样，说明现在有范围
							// 则取消范围，变成单选
							range = [[year, month, date], [year, month, date]];
						}
						self[SELECTED] = range;
						self['month-range']();
					} else if (/button/.test(this.className)) {
						var typeButton = $(this).attr('data-type');
						if (typeButton == 'ensure') {
							// 点击确定按钮
							// 赋值
							self.val();
							// 修改存储值
							self._rangeSelected = self[SELECTED];
							// 关闭浮层
							self.hide();
						} else if (typeButton == 'cancel') {
							// 重置选中值
							if (self._rangeSelected) {
								self[SELECTED] = self._rangeSelected;
							}
							// 关闭浮层
							self.hide();
						}
					}

					break;
				}
				case 'month': {
					// 选择月份，可能从年份，也可能从日期过来
					// 1. 前后年份
					if (/prev|next/.test(this.className)) {
						year = $(this).attr('data-year');
						// 修改当前选中的年份数
						self[SELECTED][0] = year * 1;
						// 刷新
						self.month();
						// 文本框赋值
						// 如果在区域内状态
						if (container.find('.' + SELECTED).get(0).href)	{
							self.val();
						}		
					} else if (/item/.test(this.className)) {
						// value实际上是月份两位数值
						var value = $(this).attr('data-value');
						if (value) {
							self[SELECTED][1] = value;
						} else {
							// 今月，只改变年月为今年和今月
							var arrToday = new Date().toArray();
							self[SELECTED][0] = arrToday[0];
							self[SELECTED][1] = arrToday[1];
						}
			
						// 赋值
						self.val();

						// 根据是否是月份输入框，决定是面板切换，还是关闭
						if (self.type == 'month') {							
							// 隐藏
							self.hide();
						} else {
							self.date();
						}
					} else if ($(this).attr('data-type') == 'year') {
						// 切换到年份选择
						self.year();
					}
					break;
				}
				case 'year': {
					// 选择年份，可能从月份过来，也可能直接打开
					// 1. 前后12年翻页
					if (/prev|next/.test(this.className)) {
						year = $(this).attr('data-year')
						// 修改当前选中的年份数
						self[SELECTED][0] = year * 1;
						// 刷新
						self.year();
						// 文本框赋值
						// 如果在区域内状态
						if (container.find('.' + SELECTED).get(0).href)	{
							self.val();							
						}		
					}  else if (/item/.test(this.className)) {
						if (this.innerHTML == '今年') {
							self[SELECTED][0] = new Date().getFullYear();
						} else {
							self[SELECTED][0] = this.innerHTML * 1;
						}

						// 赋值
						self.val();
						// 如果是年份选择输入框
						if (self.type == 'year') {
							// 隐藏
							self.hide();
						} else {
							// 回到月份面板
							self.month();
						}
					}

					break;
				}
				case 'minute': {
					// 选择分钟，可以是minute类型，或者time类型, 但不包括hour类型
					// 1. 前后翻页
					if (/prev|next/.test(this.className)) {
						hour = $(this).attr('data-hour')
						if (hour.length == 1) {
							hour = '0' + hour;
						}
						// 修改当前选中的小时数
						self[SELECTED][0] = hour;
						
						// 刷新
						self.minute();
						// 文本框赋值
						// 如果在区域内状态
						if (container.find('.' + SELECTED).attr('href'))	{
							self.val();
						}	
					} else if (/item/.test(this.className)) {
						// 确定选择时间
						self[SELECTED] = this.innerHTML.split(':');
						self.val();
						self.hide();
					} else if ($(this).attr('data-type') == 'hour') {
						// 切换到小时选择
						self.hour();
					}
					break;
				} 
				case 'hour': {
					if (/item/.test(this.className)) {
						// 修改选中的小时
						self[SELECTED][0] = this.innerHTML.split(':')[0];
						// 赋值
						self.val();

						// 如果是从分钟模式切换过来，则切换回去，否则，直接隐藏
						if (self.type == 'hour') {
							self.hide();
						} else {
							self.minute();
						}
					}
				}
			}


		});

		this.el = {};
		this.el.container = container;
		this.el.trigger = trigger;
		this.el.input = input;
		
		this.type = type;

		// 最大小值的处理在各个种类的面板中执行
		// 以便支持动态时间修改
		// 例如，选择A时间，然后设置B时间的min值为A时间
		this.max = params.max;
		this.min = params.min;
		
		// 回调方法
		this.callback = {
			show: params.onShow,
			hide: params.onHide,
			trigger: params.trigger
		};
		
		trigger.click($.proxy(function(event) {
			if (!this.display) {
				this.show();	
			} else {
				this.hide();	
			}
			event.preventDefault();
		}, this));
		
		
		// 时间范围选择点击页面空白区域不会隐藏
		$(document).mouseup($.proxy(function(event) {
			// 点击页面空白区域，隐藏
			var target = event && event.target, container = this.el.container.get(0);
			if (target && 
				trigger.get(0) != target && trigger.get(0).contains(target) == false && 
				container != target && container.contains(target) == false
			) {
				this.hide();
			}
		}, this));
		
		// IE9+ 前后分页图标使用内联SVG, 以便支持retina屏幕
		this.svg = window.addEventListener? 
			'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"/></svg>'
			: '';
	

		return this;
		
	};

	// 赋值
	DateTime.prototype.format = function() {
		// 根据当前value值修改实例对象缓存的选中值
		// 特殊情况一般不处理
		var type = this.type;
		
		var initValue = this.el.input.val();
		if (initValue == '') return this;

		switch (type) {
			case 'date': case 'year': case 'month': {
				// 日期
				var initDate = initValue.toDate(), arrDate = initDate.toArray();
				this[SELECTED] = arrDate;  // eg. [2015,07,20]

				break;	
			}
			case 'time': case 'hour': case 'minute': {
				var arrTime = initValue.split(':');
				// 时间
				var hour = arrTime[0], minute = arrTime[1];
				// 补0
				if (arrTime.length == 2) {
					// 分钟无论如何都要是正常值
					if (!(minute > 0 && minute < 60) || type == 'hour') {
						minute = '00';
					} else if (minute.length == 1) {
						minute = '0' + minute;
					}
					// 补0是必要的
					if (hour.length == 1) {
						hour = '0' + hour;
					}

					this.el.input.val([hour, minute].join(':'));

					this[SELECTED] = [hour, minute];
				}				

				break;	
			}
			case 'date-range': case 'month-range': {
				// 日期范围
				var beginDate = new Date(), endDate = new Date();
				// 前后时间字符串
				var arrRange = initValue.split(' ');
				if (arrRange.length == 3) {					
					beginDate = arrRange[0].toDate();
					endDate = arrRange[arrRange.length - 1].toDate();
					// 存储
					this[SELECTED] = [beginDate.toArray(), endDate.toArray()];
				}				
				break;
			}
		}
		return this;
	};

	// 赋值
	DateTime.prototype.val = function() {
		var input = this.el.input, selected = this[SELECTED], value = input.val();

		switch (this.type) {
			case 'date': {
				input.val(selected.join('-'));
				break;
			}
			case 'month': {
				input.val(selected.slice(0,2).join('-'));
				break;
			}
			case 'year': {
				input.val(selected[0]);
				break;
			}
			case 'date-range': {
				input.val(selected[0].join('-') + ' 至 ' + selected[1].join('-'));
				break;
			}
			case 'month-range': {
				input.val(selected[0].slice(0,2).join('-') + ' 至 ' + selected[1].slice(0,2).join('-'));
				break;
			}
			case 'time':  case 'minute': {
				input.val(selected.join(':'));
				break;
			}
			case 'hour': {
				input.val(selected[0] + ':00');
				break;
			}
		}

		if (input.val() != value) {
			if ($.isArray(this.callback.trigger)) {
				$.each(this.callback.trigger, function(i, eventType) {
					input.trigger(eventType);
				});
			} else {
				input.trigger(this.callback.trigger);
			}
			
		}
		return this;
	};

	// 返回日历HTML字符串等数据的私有方法
	// 因date和range浮层主结构类似，因此这里公用下
	DateTime.prototype._calendar = function(date) {
		var html = '';
		// 根据当前日期数据返回
		// eg. [2015,'02', 23]
		var arrDate = date;

		// 文本框元素比较常用，使用局部变量，一是节约文件大小，二是性能更好！
		var input = this.el.input;

		// 类型
		var type = this.type;

		// 最大月份和最小月份
		var min = input.attr('min') || this.min, max = input.attr('max') || this.max;
		// 这里使用日期对象(时间戳)做比对
		var arr = $.map([min, max], function(min_max, index) {
			if (typeof min_max == 'string' && /^\d{8}$/.test(min_max.replace(regDate, '')) == true) {
				// 这里对字符串进行比较简单的合法性判别
				// 自己人使用不会乱来的
				min_max = min_max.toDate();
			} else if (typeof min_max != 'object' || !min_max.getTime) {
				min_max = index? new Date(9999,0,1): new Date(0,0,1);
			}

			return min_max;
		});
		min = arr[0];
		max = arr[1];
		
		var chinese = ['日', '一', '二', '三', '四', '五', '六'];
		var monthDay = this._monthDay(arrDate);


		// 目前日期对象
		var currentDate = arrDate.join('-').toDate();

		// 3 星期几七大罪
		html = html + '<div class="'+ prefixDay +'x">' + (function() {
			var htmlDay = '';
			$.each(chinese, function(index, value) {
				htmlDay = htmlDay + '<span class="'+ prefixDay +'item">'+ value +'</span>';
			});
			return htmlDay;
		})() +'</div>';

		// 4. 日期详细
		//  4.1 首先算出今月1号是星期几
		var newDate = arrDate.join('-').toDate(), dayFirst = 0;
		newDate.setDate(1);
		if (newDate.getDate() == 2) {
			newDate.setDate(0);
		}
		// 每月的第一天是星期几
		dayFirst = newDate.getDay();
		// 上个月是几月份
		var lastMonth = newDate.getMonth() - 1;
		if (lastMonth < 0) lastMonth = 11;

		var htmlData = 'data-year="'+ arrDate[0] +'" data-month="'+ (newDate.getMonth() + 1) +'"';

		html = html + '<div class="'+ prefixDate +'body">' + (function() {
			var htmlDate = '', cl = '';
			for (var tr=0; tr<6; tr++) {
				htmlDate = htmlDate + '<div class="'+ prefixDate +'tr">';
					for (var td=0; td<7; td++) {
						// 类名
						cl = prefixDate + 'item col' + td;

						// 由于range选择和date选择UI上有比较大大差异
						// 为了可读性以及后期维护
						// 这里就不耦合在一起，而是分开处理
						if (type == 'date') {
							// 第一行上个月一些日期补全
							if (tr == 0 && td < dayFirst) {
								htmlDate = htmlDate + '<span class="'+ cl +'">'+ (monthDay[lastMonth] - dayFirst + td + 1) +'</span>';
							} else {
								var dayNow = tr * 7 + td - dayFirst + 1;
								// 如果没有超过这个月末
								if (dayNow <= monthDay[newDate.getMonth()]) {
									// 这个日子对应的时间对象
									var dateNow = new Date(arrDate[0], newDate.getMonth(), dayNow);
									// 如果日子匹配
									if (currentDate.getDate() == dayNow) {
										cl = cl + ' ' + SELECTED;
									}
									// 如果在日期范围内
									// 直接使用时间对象 Date 类作比较
									if (dateNow >= min && dateNow <= max) {
										htmlDate = htmlDate + '<a href="javascript:;" '+ htmlData +' class="'+ cl +'">'+ dayNow +'</a>';
									} else {
										htmlDate = htmlDate + '<span class="'+ cl +'">'+ dayNow +'</span>';
									}
									
								} else {
									htmlDate = htmlDate + '<span class="'+ cl +'">'+ (dayNow - monthDay[newDate.getMonth()]) +'</span>';
								}
							}	
						} else if (type == 'date-range') {

							// 非当前月部分使用空格补全
							if (tr == 0 && td < dayFirst) {
								htmlDate = htmlDate + '<span class="'+ cl +'">&nbsp;</span>';
							} else {
								var dayNow = tr * 7 + td - dayFirst + 1;
								// 如果没有超过这个月末
								if (dayNow <= monthDay[newDate.getMonth()]) {
									// 这个日子对应的时间对象
									var dateNow = new Date(arrDate[0], newDate.getMonth(), dayNow);

									// range选择的匹配规则如下：
									// 1. 获得已经选中到时间范围
									// 2. 起始时间和结束时间是方框表示
									// 3. 之间的时间是选中表示
									var dateBegin = this[SELECTED][0].join('-').toDate(),
										dateEnd   = this[SELECTED][1].join('-').toDate();

									// 各个时间的时间戳
									var timeNow = dateNow.getTime(), timeBegin = dateBegin.getTime(), timeEnd = dateEnd.getTime();

									if (timeNow >= timeBegin && timeNow <= timeEnd) {
										// 在时间范围之内
										cl = cl + ' ' + SELECTED;
										// 跟开始时间一样
										if (timeNow == timeBegin) {
											cl = cl + ' ' + prefixDate + 'begin';
										}
										// 跟结束时间一样
										if (timeNow == timeEnd) {
											cl = cl + ' ' + prefixDate + 'end';
										}
										// 今月的第一天还是最后一天
										if (dayNow == 1) {
											cl = cl + ' ' + prefixDate + 'first';
										} else if (dayNow == monthDay[newDate.getMonth()]) {
											cl = cl + ' ' + prefixDate + 'last';
										}
									}					

									// 如果在日期范围内
									// 直接使用时间对象 Date 类作比较
									if (dateNow >= min && dateNow <= max) {
										htmlDate = htmlDate + '<a href="javascript:;" '+ htmlData +' class="'+ cl +'">'+ dayNow +'</a>';
									} else {
										htmlDate = htmlDate + '<span class="'+ cl +'">'+ dayNow +'</span>';
									}
									
								} else {
									htmlDate = htmlDate + '<span class="'+ cl +'">&nbsp;</span>';
								}
							}	
						}
					}
				htmlDate += '</div>';
			}
			return htmlDate;
		}).call(this) + '</div>';

		return {
			monthDay: monthDay,
			html: html,
			min: min,
			max: max
		};
	};

	// 当前日期下这一年每月最大的日期数目
	DateTime.prototype._monthDay = function(date) {
		var arrDate = date;
		if ($.isArray(date) == false) {
			arrDate = date.toArray();
		}

		var monthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

		// 如果是闰年
		if (((arrDate[0] % 4 == 0) && (arrDate[0] % 100 != 0)) || (arrDate[0] % 400 == 0)) {
			monthDay[1] = 29;
		}

		return monthDay;
	},
	
	// 上个月同日期
	DateTime.prototype._datePrevMonth = function(date) {
		// add on 2016-03-31 
		// 原先的加减月份的跨月计算是有些问题的
		// 因为例如31号的下一月，系统会自动变成下下个月的1号
		var arrDate = date;
		if ($.isArray(date) == false) {
			// 日期数组化
			arrDate = date.toArray();
		}

		var month = arrDate[1]*1, monthDay = this._monthDay(arrDate);

		if (month == 1) {
			// 上个月是前一年的12月
			// 12月有31号，无压力
			return [arrDate[0]-1, 12, arrDate[2]].join('-').toDate();
		}
		
		// 其他月份不跨年
		// 如果上一个月的最后1天小于本月的最后1天
		// 嘿嘿嘿嘿
		// 年不变，月减一，日期下个月
		if (monthDay[month-2] < arrDate[2]) {
			return [arrDate[0], month-1, monthDay[month-2]].join('-').toDate();
		}

		// 年不变，月减一，日期不变
		return [arrDate[0], month-1, arrDate[2]].join('-').toDate();

	},
	// 下个月
	DateTime.prototype._dateNextMonth = function(date) {
		var arrDate = date;
		if ($.isArray(date) == false) {
			// 日期数组化
			arrDate = date.toArray();
		}

		var month = arrDate[1]*1, monthDay = this._monthDay(arrDate);

		if (month == 12) {
			// 下个月跨年了
			// 1月份也有31天，无压力
			return [arrDate[0]+1, 1, arrDate[2]].join('-').toDate();
		}

		// 其他月份不跨年
		// 如果下个月最后1天小于本月最后1天，例如，3月31日
		if (monthDay[month] < arrDate[2]) {
			return [arrDate[0], month+1, monthDay[month]].join('-').toDate();
		}

		// 其他时候正常
		return [arrDate[0], month+1, arrDate[2]].join('-').toDate();
	},

	// 选择日期
	DateTime.prototype.date = function() {
		var arrDate = this[SELECTED];
		
		// 目前日期对象
		var currentDate = arrDate.join('-').toDate(),
			// 上一个月
		    prevMonth = arrDate[1] - 1 
			// 下一个月
			nextMonth = arrDate[1] * 1 + 1;

		var obj = this._calendar(arrDate);

		// 选择日期的完整HTML代码
		// 1. 日期专属类名容器
		var html = '<div class="'+ prefixDate +'x">';
		// 2. 头部月份切换
		html = html + '<div class="'+ prefixDate +'head">';
		// 根据前后月份是否在范围之外，决定使用的标签类型
		// span标签则是禁用态，本组件全部都是如此
		// 2.1 上个月
		// datePrevMonth指上个月日期
		var datePrevMonth = this._datePrevMonth(arrDate),
		// prevMonth指上个月
		prevMonthGet = datePrevMonth.getMonth(),
		prevYearGet = datePrevMonth.getFullYear();

		//if (datePrevMonth >= obj.min && datePrevMonth <= obj.max) {
			// add on 2015-12-01
			// 原来的判断逻辑有问题
			// 只要上个月份的最大日期比最小限制大就可以了
		if (new Date(prevYearGet, prevMonthGet, obj.monthDay[prevMonthGet]) >= obj.min && datePrevMonth <= obj.max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'prev" data-month="'+ prevMonth +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'prev">'+ this.svg +'</span>';
		}

		// 2.2 下个月
		var dateNextMonth = this._dateNextMonth(arrDate),
			nextMonthGet = dateNextMonth.getMonth(),
			nextYearGet = dateNextMonth.getFullYear();
		//if (dateNextMonth >= obj.min && dateNextMonth <= obj.max) {
			// add on 2015-12-01
			// 经反馈，如果当前日期是30号，但是最大日期是下月1号，则下个月不能进入
			// 这是有问题的
			// 原因是此时的dateNextMonth > obj.max
			// 因此判断应该从月初
		if (dateNextMonth >= obj.min && new Date(nextYearGet, nextMonthGet, 1) <= obj.max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'next" data-month="'+ nextMonth +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'next">'+ this.svg +'</span>';
		}

		//   头部月份公用结束 
		html = html + '<a href="javascript:" class="'+ prefixDate +'switch" data-type="month">'+ arrDate.slice(0,2).join('-') +'</a>\
		</div>';
		
		// 3. 主体内容来自_calendar()方法
		html += obj.html;

		// 今天
		// 首先，今天要在时间范围内
		if (new Date() >= obj.min && new Date() <= obj.max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'item ' + prefixDate +'now">今天</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'item ' + prefixDate +'now">今天</span>';
		}


		// 容器闭合标签
		html += '</div>';
		
		this.el.container.attr('data-type', 'date').html(html);
		
		return this;
	};

	// 选择日期范围
	DateTime.prototype['date-range'] = function() {
		var arrDates = this[SELECTED];
		// 当前起始日期
		// 默认（第一次）打开使用选中日期
		// 如果有，使用面板存储月份
		// 因为range选择不是即时更新文本框
		var arrDate = this.el.container.data('date') || arrDates[0];
		this.el.container.data('date', arrDate);
		// 前一个月
		var prevMonth = arrDate[1] - 1,
		// 后一个月
		nextMonth = arrDate[1] * 1 + 1;


		// 根据起始时间创建新的时间对象
		// var dateBegin = arrDate.join('-').toDate();

		// 含时间范围和对应月份日历HTML的对象
		var obj = this._calendar(arrDate);

		// 选择时间范围完整HTML代码
		// 1. 同样的，range容器
		var html = '<div class="'+ prefixRange +'x">';
		// 2. 头部
		html = html + '<div class="'+ prefixDate +'head">\
			<div class="'+ prefixDate +'half">';
		//  2.1 上一个月箭头
		var datePrevMonth = new Date(arrDate[0], prevMonth - 1, arrDate[2]);
		if (datePrevMonth >= obj.min && datePrevMonth <= obj.max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'prev" data-month="'+ prevMonth +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'prev">'+ this.svg +'</span>';
		}
		// 今月月份显示
		html = html + '<span class="'+ prefixDate +'switch">'+ new Date(arrDate[0], prevMonth, arrDate[2]).toArray().slice(0,2).join('-') +'</span>\
		</div>\
		<div class="'+ prefixDate +'half">';

		// 2.2 下下个月
		var dateNextMonth = new Date(arrDate[0], arrDate[1] , /*arrDate[2]*/1), dateAfterMonth = new Date(arrDate[0], nextMonth, arrDate[2]);

		// 例如是3月31日
		// 此时 arrDate[1] '03'
		// nextMonth 是 4

		// 此时原来的实现是由bug的
		// 因为下个月没有4月31日，于是，就会变成5月
		// 因此arrDate[2]应使用1代替

		// 下个月的当前日期在合理范围之内，则使用该月
		if (dateAfterMonth >= obj.min && dateAfterMonth <= obj.max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'next" data-month="'+ nextMonth +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'next">'+ this.svg +'</span>';
		}

		// 

		// 下月月份显示	
		html = html + '<span class="'+ prefixDate +'switch">'+ dateNextMonth.toArray().slice(0,2).join('-') +'</span>\
		</div>';

		// 头部闭合
		html += '</div>';

		// 3. 两个主体列表
		// 这里要嵌套一层range特有的body
		html = html + '<div class="'+ prefixRange +'body">' + 
		// 根据_calendar()方法创建两个月份日历
			'<div class="'+ prefixDate +'half">' + obj.html + '</div>' +
			'<div class="'+ prefixDate +'half">' + this._calendar(dateNextMonth.toArray()).html + '</div>' +
		// 主体标签闭合
		'</div>';

		// 4. 确定与取消按钮
		html = html + '<div class="'+ prefixRange +'footer">' +
			'<a href="javascript:;" class="ui-button ui-button-primary" data-type="ensure">确定</a>' +
			'<a href="javascript:;" class="ui-button" data-type="cancel">取消</a>' +
		'</div>';

		// 容器闭合标签
		html += '</div>';
		
		this.el.container.attr('data-type', 'date-range').html(html);
		
		return this;
	};
	

	// 月份组装
	DateTime.prototype._month = function(arrDate) {
		// 文本框元素比较常用，使用局部变量，一是节约文件大小，二是性能更好！
		var input = this.el.input;

		// 最大月份和最小月份
		var min = input.attr('min') || this.min, max = input.attr('max') || this.max;
		// 这里使用年月组合做比对
		var arr = $.map([min, max], function(min_max, index) {
			if (typeof min_max == 'object' && min_max.getTime) {
				min_max = min_max.toArray().slice(0,2).join('');
			} else if (typeof min_max == 'string' && /\D/.test(min_max.replace(regDate, '')) == false) {
				// 这里对字符串进行比较简单的合法性判别
				// 自己人使用不会乱来的
				min_max = min_max.replace(regDate, '').slice(0, 6);
			} else {
				min_max = index? '999912': '000000';
			}
			return min_max;
		});
		min = arr[0];
		max = arr[1];
		
		var chinese = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

		// 年份
		var year = arrDate[0] * 1;

		// 类型
		var type = this.type;

		var html = '<div class="'+ prefixMonth +'body">'+ (function() {
			var htmlDate = '', cl = '', month = '';
			for (var i=1; i<=12; i+=1) {
				// 合法格式字符串
				if (i < 10) {
					month = '0' + i;
				} else {
					month = i + '';
				}

				// 基本类名
				cl = prefixDate +'item';

				if (type == 'month') {					
					if (i == arrDate[1]) {
						// 选中态的类名
						cl = cl + ' ' + SELECTED;
					}
				} else if (type == 'month-range') {
					// range选择的匹配规则如下：
					// 1. 获得已经选中到时间范围
					// 2. 起始时间和结束时间是选中表示
					// 3. 之间的时间也是选中表示
					var strBegin = this[SELECTED][0].slice(0,2).join(''),
						strEnd   = this[SELECTED][1].slice(0,2).join('');
					var strNow = year + month;	
					if (strNow >= strBegin && strNow <= strEnd)	 {
						cl = cl + ' ' + SELECTED;
					}
				}
				// 是否在范围以内
				if (year + month >= min && year + month <= max) {
					htmlDate = htmlDate + '<a href="javascript:" class="'+ cl +'" data-year="'+ year +'" data-value="'+ month +'">'+ chinese[i-1] +'月</a>';	
				} else {
					htmlDate = htmlDate + '<span class="'+ cl +'" data-value="'+ month +'">'+ chinese[i-1] +'月</span>';
				}

			}
			return htmlDate;
		}).call(this) +
		'</div>';

		return {
			html: html,
			min: min,
			max: max
		};
	};

	// 选择月份
	DateTime.prototype.month = function() {
		var arrDate = this[SELECTED];

		var obj = this._month(arrDate);

		var min = obj.min, max = obj.max;

		// 选择月份的完整HTML代码
		// 1. month专属类名容器
		var html = '<div class="'+ prefixMonth +'x">';
		// 2. 月份切换的头部
		var year = arrDate[0] * 1;
		//    为什么呢？因为年份的范围是当前年份前面6个，后面5个
		//    例如，假设今年是2015年，则头部年份范围是2009-2020
		html = html + '<div class="'+ prefixDate +'head">';
		//    2.1 是否还有上一年
		if (year-1 >= Math.floor(min/100) && year-1 <= Math.floor(max/100)) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'prev" data-year="'+ (year-1) +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'prev">'+ this.svg +'</span>';
		}
		//    2.2 是否还有下一年
		if (year+1 >= Math.floor(min/100) && year+1 <= Math.floor(max/100)) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'next" data-year="'+ (year+1) +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'next">'+ this.svg +'</span>';
		}
		// 头部结束
		html = html + '<a href="javascript:" class="'+ prefixDate +'switch" data-type="year">'+ year +'</a>\
		</div>';
		// 3. 月份切换主体列表
		html = html + obj.html;

		// 今月
		// 首先，今月要在时间范围内
		var thisYearMonth = new Date().toArray().slice(0,2).join('');
		if (thisYearMonth >= min && thisYearMonth <= max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'item ' + prefixDate +'now">今月</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'item ' + prefixDate +'now">今月</span>';
		}

		// 容器闭合标签
		html += '</div>';
		
		this.el.container.attr('data-type', 'month').html(html);
		
		return this;
	};


	// 选择月份范围
	DateTime.prototype['month-range'] = function() {
		var arrDates = this[SELECTED];
		// 当前起始日期
		// 默认（第一次）打开使用选中日期
		// 如果有，使用面板存储月份
		// 因为range选择不是即时更新文本框
		var arrDate = this.el.container.data('date') || arrDates[0];
		this.el.container.data('date', arrDate);
		// 前一年
		var prevYear = arrDate[0]*1 - 1,
		// 后一个年
		nextYear = arrDate[0]*1 + 1;

		// 含时间范围和对应月份日历HTML的对象
		var obj = this._month(arrDate);
		// 最大年份
		var maxYear = obj.max.slice(0,4), minYear = obj.min.slice(0,4);

		// 选择时间范围完整HTML代码
		// 1. 同样的，range容器
		var html = '<div class="'+ prefixRange +'x">';
		// 2. 头部
		html = html + '<div class="'+ prefixDate +'head">\
			<div class="'+ prefixDate +'half">';
		//  2.1 上一年箭头
		if (prevYear >= minYear && prevYear <= maxYear) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'prev" data-year="'+ prevYear +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'prev">'+ this.svg +'</span>';
		}
		// 今年年份显示
		html = html + '<span class="'+ prefixDate +'switch">'+ arrDate[0] +'</span>\
		</div>\
		<div class="'+ prefixDate +'half">';

		// 2.2 下一年
		if (nextYear >= minYear && nextYear < maxYear) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'next" data-year="'+ nextYear +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'next">'+ this.svg +'</span>';
		}

		// 下月月份显示	
		html = html + '<span class="'+ prefixDate +'switch">'+ nextYear +'</span>\
		</div>';

		// 头部闭合
		html += '</div>';

		// 3. 两个主体列表
		// 这里要嵌套一层range特有的body
		html = html + '<div class="'+ prefixRange +'body">' + 
		// 根据_calendar()方法创建两个月份日历
			'<div class="'+ prefixDate +'half">' + obj.html + '</div>' +
			'<div class="'+ prefixDate +'half">' + this._month([nextYear, arrDate[1], arrDate[2]]).html + '</div>' +
		// 主体标签闭合
		'</div>';

		// 4. 确定与取消按钮
		html = html + '<div class="'+ prefixRange +'footer">' +
			'<a href="javascript:;" class="ui-button ui-button-primary" data-type="ensure">确定</a>' +
			'<a href="javascript:;" class="ui-button" data-type="cancel">取消</a>' +
		'</div>';

		// 容器闭合标签
		html += '</div>';
		
		this.el.container.attr('data-type', 'month-range').html(html);

		return this;
	}


	// 选择年份
	DateTime.prototype.year = function() {
		var arrDate = this[SELECTED];

		// 文本框元素比较常用，使用局部变量，一是节约文件大小，二是性能更好！
		var input = this.el.input;

		// 最小年份和最大年份
		var min = input.attr('min') || this.min, max = input.attr('max') || this.max;


		// 用户可能使用时间对象
		if (typeof min == 'object' && min.getFullYear) {
			min = min.getFullYear();
		} else if (typeof min == 'string' && /\D/.test(min.replace(regDate, '')) == false) {
			// 这里对字符串进行比较简单的合法性判别
			// 自己人使用不会乱来的
			min = min.toDate().getFullYear();
		} else {
			min = 0;
		}
		if (typeof max == 'object' && max.getFullYear) {
			max = max.getFullYear();
		} else if (typeof max == 'string' && /\D/.test(max.replace(regDate, '')) == false) {
			max = max.toDate().getFullYear();
		} else {
			max = 9999;
		}

		// 选择年份的完整HTML代码
		// 1. 同样的，year专属类名容器
		var html = '<div class="'+ prefixYear +'x">';
		// 2. 头部的年份切换，一切就是12年
		//    有必要先知道当前的年份
		var year = arrDate[0];
		//    为什么呢？因为年份的范围是当前年份前面6个，后面5个
		//    例如，假设今年是2015年，则头部年份范围是2009-2020
		//    左右切换是没有限制的
		html = html + '<div class="'+ prefixDate +'head">';
		//    年份不是你想翻就能翻到
		//    2.1 上一个12年
		if (year-12 >= min && year-12 <= max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'prev" data-year="'+ (year-12) +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'prev">'+ this.svg +'</span>';
		}
		//    2.2 下一个12年
		if (year+12 >= min && year+12 <= max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'next" data-year="'+ (year+12) +'">'+ this.svg +'</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'next">'+ this.svg +'</span>';
		}
		// year选择是顶级类别，一定是不可点击的
		html = html + '<span class="'+ prefixDate +'switch">'+ [year-6, year+5].join('-') +'</span></div>';

		// 3. 年份选择的主体
		html = html + '<div class="'+ prefixYear +'body">'+ (function() {
			var htmlDate = '', cl = '';
			for (var i=year-6; i<year+6; i+=1) {
				// 选中态的类名
				cl = prefixDate +'item';
				if (i == year) {
					cl = cl + ' ' + SELECTED;
				}

				// 是否在范围以内
				if (i >= min && i <= max) {
					htmlDate = htmlDate + '<a href="javascript:" class="'+ cl +'">'+ i +'</a>';	
				} else {
					htmlDate = htmlDate + '<span class="'+ cl +'">'+ i +'</span>';
				}
			}
			return htmlDate;
		})() +
		'</div>';

		// 今年
		// 首先，今年要在时间范围内
		var thisYear = new Date().getFullYear();
		if (thisYear >= min && thisYear <= max) {
			html = html + '<a href="javascript:" class="'+ prefixDate +'item ' + prefixDate +'now">今年</a>';
		} else {
			html = html + '<span class="'+ prefixDate +'item ' + prefixDate +'now">今年</span>';
		}
		

		// 头部标签闭合
		html += '</div>';

		// 容器闭合标签
		html += '</div>';
		
		this.el.container.attr('data-type', 'year').html(html);
		
		return this;

	};

	// 选择小时
	DateTime.prototype.hour = function() {
		var arrTime = this[SELECTED];

		// 文本框元素比较常用，使用局部变量，一是节约文件大小，二是性能更好！
		var input = this.el.input;

		// 时间选择的小时间隔，默认是1小时
		var step = input.attr('step') * 1;
		if (this.type != 'hour' || !step || step < 1) {
			step = 1;
		} else {
			step = Math.round(step);
		}

		// 最小时间，和最大时间
		// 这里只比较小时
		var min = (input.attr('min') || this.min.toString()).split(':')[0], max = (input.attr('max') || this.max.toString()).split(':')[0];

		if (/\D/.test(min)) {
			min = 0;
		} else {
			min = min * 1;
		}
		if (/\D/.test(max)) {
			max = 24;
		} else {
			max = max * 1;
		}

		// 选择小时的完整HTML
		// 1. 同样的，专有容器
		var html = '<div class="'+ prefixHour +'x">';
		// 2. 小时没有头部切换，直接列表们
		html = html + '<div class="'+ prefixHour +'body">'+ (function() {
			var htmlTime = '', hour = '', cl = '';
			for (var i=0; i<24; i+=step) {
				hour = i + '';
				if (hour.length == 1) {
					hour = '0' + hour;
				}

				// 选中态的类名
				cl = prefixDate +'item';
				if (hour == arrTime[0]) {
					cl = cl + ' ' + SELECTED;
				}

				// 是否在范围以内
				if (hour >= min && hour <= max) {
					htmlTime = htmlTime + '<a href="javascript:" class="'+ cl +'">'+ hour +':00</a>';	
				} else {
					htmlTime = htmlTime + '<span class="'+ cl +'">'+ hour +':00</span>';
				}
			}
			return htmlTime;
		})() +
		'</div>';


		// 容器闭合标签
		html += '</div>';
		
		this.el.container.attr('data-type', 'hour').html(html);
		
		return this;
	};
	// 选择分钟
	DateTime.prototype.minute = function() {
		var arrTime = this[SELECTED];
		
		// 文本框元素比较常用，使用局部变量，一是节约文件大小，二是性能更好！
		var input = this.el.input;
		// 分钟时间间隔, 默认为5分钟
		var step = input.attr('step') * 1 || 5;

		// 最小时间，和最大时间
		// 跟小时不同，这里必须符合00:00格式
		// 由于格式固定，我们直接去除':'后的值进行比较
		// 例如：10:20 → 1020
		var min = input.attr('min') || (this.min + ''), max = input.attr('max') || (this.max + '');
		if (min == 'auto' || /\D/.test(min.replace(':', '')) || min.split(':').length != 2) {
			min = 0;
		} else {
			min = min.replace(':', '') * 1;
		}
		if (max == 'auto' || /\D/.test(max.replace(':', '')) || max.split(':').length != 2) {
			max = 2359;
		} else {
			max = max.replace(':', '') * 1;
		}

		// 选择分钟的完整HTML
		// 1. 外部的容器，含有专有容器类名，可以重置内部的一些样式
		var html = '<div class="'+ prefixMinute +'x">';
		// 2. 头部小时的左右切换
		var hour = arrTime[0] * 1;
		//   首先是公共部分
		html = html + '<div class="'+ prefixDate +'head">';


		//   2.1 可不可往前翻
		if (hour <= Math.floor(min / 100)) {
			html = html + '<span class="'+ prefixDate +'prev">'+ this.svg +'</span>';
		} else {
			html = html + '<a href="javascript:" class="'+ prefixDate +'prev" data-hour="'+ (hour-1) +'">'+ this.svg +'</a>';
		}
		// 2.2 可不可以往后翻
		if (hour >= Math.floor(max / 100)) {
			html = html + '<span class="'+ prefixDate +'next">'+ this.svg +'</span>';
		} else {
			html = html + '<a href="javascript:" class="'+ prefixDate +'next" data-hour="'+ (hour+1) +'">'+ this.svg +'</a>';
		}

		// 头部结束的公共html部分
		html = html + '<a href="javascript:" class="'+ prefixDate +'switch" data-type="hour">'+ arrTime[0] +':00</a></div>';

		// 3. 分钟主体
		html = html + '<div class="'+ prefixMinute +'body">'+ (function() {
			var htmlTime = '', minute = '', cl = '';
			for (var i=0; i<60; i+=step) {
				minute = i + '';
				if (minute.length == 1) {
					minute = '0' + minute;
				}

				// 基本样式
				cl = prefixDate +'item';
				

				// 是否在时间范围内
				if ((arrTime[0] + minute) * 1 >= min && (arrTime[0] + minute) * 1<= max) {
					// 选中态
					if (minute == arrTime[1]) {
						cl = cl + ' ' + SELECTED;
					}
					htmlTime = htmlTime + '<a href="javascript:" class="'+ cl +'">'+ [arrTime[0], minute].join(':') +'</a>';
				} else {
					htmlTime = htmlTime + '<span class="'+ cl +'">'+ [arrTime[0], minute].join(':') +'</span>';
				}
			}
			return htmlTime;
		})() +
		'</div>';
		
		// 容器闭合标签
		html += '</div>';
		
		this.el.container.attr('data-type', 'minute').html(html);
		
		return this;
	};
	
	
	
	DateTime.prototype.show = function() {
		var container = this.el.container;

		// 根据value更新SELECTED
		this.format();

		// 不同的类名显示不同的内容
		if (this.type == 'time') {
			this.minute();
		} else if (this.type == 'date-range') {
			// 存储当前日期范围数据，以便取消的时候可以正确还原
			if (!this._rangeSelected) {
				this._rangeSelected = this[SELECTED];
			}
			this['date-range']();
		} else if (this.type == 'month-range') {
			// 存储当前日期范围数据，以便取消的时候可以正确还原
			if (!this._rangeSelected) {
				this._rangeSelected = this[SELECTED];
			}
			this['month-range']();
		} else if (this[this.type]) {
			this[this.type]();
		} else {
			this.date();
		}
		if ($.contains($(document.body), container) == false) {
			$(document.body).append(container);
		}
		
		container.show().follow(this.el.trigger.addClass(ACTIVE), {
			position: "4-1"	
		});
		
		if ($.isFunction(this.callback.show)) {
			this.callback.show.call(this, this.el.input, container);
		}
		this.display = true;
		
		return this;
	};
	
	DateTime.prototype.hide = function() {
		this.el.container.hide();
		this.el.trigger.removeClass(ACTIVE);
		if ($.isFunction(this.callback.hide)) {
			this.callback.hide.call(this, this.el.input, this.el.container);
		}
		this.display = false;
		return this;
	};
	
	// 下面为拓展的jQuery包装器方法
	$.fn.dateTime = function(options) {
		return $(this).each(function() {
			if (!$(this).data('dateTime')) {
				$(this).data('dateTime', new DateTime($(this), options));
			}
		});
	};

	return DateTime;
}));
/**
 * @Validate.js
 * @author xunxuzhang
 * @version
 * Created: 15-08-19
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Validate = factory();
    }
}(this, function (require) {
	if (typeof require == 'function') {
		require('common/ui/ErrorTip');
	} else if (!$().follow) {
		if (window.console) {
			console.error('need ErrorTip.js');
		}
		return {};
	}

	/**
     * 基于HTML5规范的表单验证方法
	 * 根据原生属性:type, required, min, max, minlength, maxlength, step, pattern等属性进行验证
	 * 支持new实例构造以及jQuery包装器用法，例如：
	 * new Validate(el, options);
	 * or
	 * $().validate();
	 * 很多验证规则基于其他UI组件特征
     */


    // 包装器方法
    $.fn.validate = function(callback, options) {
    	return $(this).each(function() {
    		$(this).data('validate', new Validate($(this), callback, options));
    	});
    };

    // 选中某范围文字内容的拓展方法
    $.fn.selectRange = function(start, end) {
    	var that = $(this).get(0);
		if (that.createTextRange) {
			var range = that.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', start);
			range.select();
		} else {
			that.focus();
			that.setSelectionRange(start, end);
		}
		return $(this);
    };

	// 是否含有某布尔属性方法
	$.fn.isProp = function(attr) {
		var prop = $(this).prop(attr) || $(this).attr(attr);
		if (prop || typeof prop == 'string') {
			return true;
		}
		return false;
	};

	// 全角转半角方法
    $.dbc2sbc = function(str) {
    	var result = '', i, code;
		for (i=0 ; i<str.length; i++) {
			code = str.charCodeAt(i);
			if (code >= 65281 && code <= 65373) {
				result += String.fromCharCode(str.charCodeAt(i) - 65248);
			} else if (code == 12288) {
				result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32);
			} else {
				result += str.charAt(i);
			}
		}
		return result;
    };

    // 获得并重置type
    $.getType = function(ele) {
    	// 控件的类型
		// 这里不能直接ele.type获取，否则，类似email类型直接就是text类型
		// 但是，有些元素的type是隐式的，例如textarea，因此ele.type还是需要的
		var attrType = ele.getAttribute('type');
		var type = attrType || ele.type || '';
		// 高级版本IE浏览器的向下兼容模式，会忽略email类型
		// 虽然这种情况出现的可能性很小，但是，为了万一
		// 可以使用type='email '解决此问题
		// 所以，才会有下面的正则替换，得到最精准的type类型
		type = type.toLowerCase().replace(/\W+$/, '');

		// 对于本来支持的浏览器，需要变成真实的
		if (attrType && attrType != type && $('<input type="'+ type +'">').attr("type") == type) {
			try { ele.type = type; } catch(e) { }
		}

		// 类似_date_这种干掉浏览器默认类型的处理
		return type.replace(/_/g, '');
    }

    // 获得字符长度
    // @ele  Object   input/textarea表单控件元素
    // @max  Number   返回满足最大值时候的真实字符长度
    $.getLength = function(ele, max) {
    	if (ele.type == 'password') {
    		return max? max: ele.value.length;
    	}
    	// 语言属性和trim后的值
    	var lang = ele.getAttribute('lang'), value = $.trim(ele.value);
    	if (!lang) {
    		return max? max: value.length;
    	}
    	if (value == '') return 0;

    	// 中文和英文计算字符个数的比例
    	var ratioCh = 1, ratioEn = 1;
		if (/zh/i.test(lang)) {
			// 1个英文半个字符
			ratioEn = 0.5;
		} else if (/en/i.test(lang)) {
			// 1个中文2个字符
			ratioCh = 2;
		}

    	// 下面是中文或全角等字符正则
    	if (!max) {
    		var lenOriginCh = value.replace(/[\x00-\xff]/g, '').length,
    			lenOriginEn = value.length - lenOriginCh;

    		// 根据比例返回最终长度
    		return Math.ceil(lenOriginEn * ratioEn) + Math.ceil(lenOriginCh * ratioCh);
    	} else {
    		var start = 0, lenMatch = max;
    		$.each(value.split(''), function(index, letter) {
    			if (start >= max) return;
    			if (/[\x00-\xff]/.test(letter)) {
    				// 如果字符是英文
    				start += ratioEn;
    			} else {
    				// 如果字符是英文
    				start += ratioCh;
    			}

    			if (start >= max) {
    				lenMatch = index + 1;
    			}
			});
			return lenMatch;
    	}
    };

    // 一些全局的属性和方法
    $.validate = (function() {
    	return {
    		reg: {
    			email: '^[a-z0-9._%-]+@([a-z0-9-]+\\.)+[a-z]{2,4}$',
    			number: '^\\-?\\d+(\\.\\d+)?$',
				url: "^(http|https)\\:\\/\\/[a-z0-9\\-\\.]+\\.[a-z]{2,3}(:[a-z0-9]*)?\\/?([a-z0-9\\-\\._\\:\\?\\,\\'\\/\\\\\\+&amp;%\\$#\\=~])*$",
				tel: '^1\\d{10}$',
				zipcode: '^\\d{6}$',
				date: '^\\d{4}\\-(0\\d|1[0-2])\\-([0-2]\\d|3[0-1])$',
				time: '^[0-2]\\d\\:[0-5]\\d$',
				hour: '^[0-2]\\d\\:00$',
				minute: '^[0-2]\\d\\:[0-5]\\d$',
				'date-range': '^\\d{4}(\\-\\d{2}){2}\\s至\\s\\d{4}(\\-\\d{2}){2}$',
				'month-range': '^\\d{4}\\-\\d{2}\\s至\\s\\d{4}\\-\\d{2}$'
    		},

    		prompt: function(result, ele, options) {
    			/*
				 * @result  是验证返回的结果，为纯对象
				            {
								type: '',
								error: ''
				            }
				            有对应的提示信息
				 * @ele     是当前出错的元素, 此参数可选
				            当该属性存在的时候，文字提示内容更丰富与智能
				 * @options 自定义的提示数据，优先级最高, 需要和ele参数配合使用
    			*/
    			var defaultPrompt = {
    				name: $.extend({}, {
    					email: '邮箱',
    					tel: '手机号码',
    					url: '网址',
    					zipcode: '邮编',
    					password: '密码',
    					number: '数值',
    					range: '数值',
    					date: '日期',
    					year: '年份',
    					month: '月份',
    					hour: '小时',
    					minute: '分钟',
    					time: '时间',
    					datetime: '日期时间',
    					'date-range': '日期范围',
    					'month-range': '月份范围'
    				}, $.validate.name || {}),
    				ignore: {
    					radio: '请选择一个选项',
    					checkbox: '如果要继续，请选中此框',
    					select: '请选择列表中的一项',
    					'select-one': '请选择列表中的一项',
    					empty: '请填写此字段'
	    			},
	    			unmatch: {
	    				pattern: '内容格式不符合要求',
	    				multiple: '某项内容格式不符合要求'
	    			},
	    			out: {
	    				min: '值偏小',
	    				max: '值偏大',
	    				step: '值不符合要求'
	    			},
	    			overflow: {
	    				minlength: '内容长度偏小',
	    				maxlength: '内容长度偏大'
	    			}
    			};

    			if (!result) return;

    			// 最终的提示文字

    			// 元素的id, type等
    			var text = '', id = ele.id, type = '', error = result.error;

    			if (ele) {
    				type = ele.getAttribute('type') || ele.type || '';
    				type = $.trim(type);
    				if (type == 'select-one') type = 'select';
    			}

    			// options对应的提示信息
    			options = options || {};
    			var optionsPrompt = options.prompt || options;

    			if (id && $.isArray(options)) {
    				$.each(options, function(index, obj) {
    					if (obj.id == id) {
    						optionsPrompt = obj.prompt;
    					}
    				});
    			}

    			// 错误提示关键字
    			var name = defaultPrompt.name[type] || (function() {
    				if (!options.label || !id || /checkbox|radio/.test(type)) return;
    				var text = '';
    				// 从label动态获取提示数据
    				$('label[for='+ id +']').each(function() {
    					var label = $(this).clone();
    					// 只使用裸露的文字作为提示关键字
    					label.children().remove(),
    					labelText = $.trim(label.html()).replace(/\d/g, '');
    					// 内容最长的那个元素作为提示文字
    					if (labelText.length > text.length) {
    						text = labelText;
    					}
    				});
    				// 提示关键字显然不会小于2个字
    				if (text.length >= 2) return text;
    			})();

    			switch (result.type) {
    				case 'ignore': {
    					// 自定义提示
    					text = optionsPrompt.ignore;
    					// 如果没有对应的自定义提示
    					if (!text) {
    						// 则使用默认的提示：
    						// 1. 根据类型关键字组装的提示
    						if (type && name) {
    							if (type != 'select') {
    								text = name + '不能为空';
    							} else {
    								text = defaultPrompt.ignore[type] = '您尚未选择' + name;
    							}
    						} else {
    							// 2. 默认的ignore几个错误提示
    							text = defaultPrompt.ignore[error];
    						}

    						text = text || defaultPrompt.ignore.empty;
    					}

    					break;
    				}
    				case 'unmatch': {
    					// 这里的默认错误提示没有一个和type关联
    					// 因此，逻辑跟上面的是有差异的

    					// 首先，优先使用自定义提示是一样的
    					if (!(text = optionsPrompt.unmatch)) {
    						// 然后
    						if (type && name) {
    						 	// 1. 试试关键字提示
    						 	text = name + '格式不符合要求';
    						 } else {
    						 	// 2. 宽泛的默认提示
    						 	text = defaultPrompt.unmatch[error] || defaultPrompt.unmatch.pattern;
    						 }
    						 text = text || defaultPrompt.ignore.empty;
    					}
    					break;
    				}
    				case 'out': {
    					// 先看看有没有自定义的提示
    					text = optionsPrompt.out && optionsPrompt.out[error];

    					if (!text) {
    						// out可以是range类型, date类型，number类型
	    					if (type && name) {
	    						var min = ele.getAttribute('min'),
	    							max = ele.getAttribute('max'),
	    							step = ele.getAttribute('step') * 1 || 1;

	    						if (type == 'month-range') {
	    							min = min.slice(0,7);
	    							max = max.slice(0,7);
	    						}

	    						var textBigger = '必须要大于或等于' + min, textSmaller = '必须要小于或等于' + max;

	    						if (error == 'min') {
	    							text = name + textBigger;
	    							if (type.slice(-6) == '-range') {
	    								text = '起始日期' + textBigger;
	    							}
    							} else if (error == 'max') {
    								text = name + '必须要小于或等于' + max;
    								if (type.slice(-6) == '-range') {
	    								text = '结束日期' + textSmaller;
	    							}
    							} else if (error == 'min-max') {
    								text = '起始日期' + textBigger + '，结束日期' + textSmaller;
    							} else if (error == 'step') {
    								if (type == 'number' || type == 'range') {
	    								text = '请输入有效的值。两个最接近的有效值是' + (function() {
	    									min = min * 1;
	    									max = max * 1;
	    									var value = $.trim(ele.value) * 1, closest = min;
	    									for (var start=min; start+=step; start<max) {
	    										if (start < value && (start + step) > value) {
	    											closest = start;
	    											break;
	    										}
	    									}

	    									return [closest, closest + step].join('和');
	    								})();
    								} else {
    									text = '请选择有效的值。' + name + '间隔是' + step;
    								}
    							}
	    					} else {
	    						// 纯粹使用含糊的默认提示
	    						text = defaultPrompt.out[error];
	    					}
    					}

    					text = text || defaultPrompt.out.step;
    					break;
    				}
    				case 'overflow': {
    					// 先看看有没有自定义的提示
    					text = optionsPrompt.overflow && optionsPrompt.overflow[error];
    					if (!text) {
    						var minlength = ele.getAttribute('minlength'),
	    						maxlength = ele.maxlength || ele.getAttribute('maxlength');

	    					// 关于字符个数说明
	    					var lang = ele.getAttribute('lang'), textCharLength = '';
	    					if (/zh/i.test(lang)) {
	    						textCharLength = '个汉字(2字母=1汉字)';
	    					} else if (/en/i.test(lang)) {
	    						textCharLength = '个字符(1汉字=2字符)';
	    					}

	    					if (error == 'minlength') {
	    						text ='内容长度不能小于' + minlength + textCharLength;
	    					} else if (error == 'maxlength') {
	    						text ='内容长度不能大于' + maxlength.replace(/\D/g, '') + textCharLength;
	    					}
    					}
    					text = text || defaultPrompt.overflow[error];
    					break;
    				}
    			}

    			if ($.isFunction(text)) {
    				text = text.call(ele, $(ele));
    			}

    			return text;
    		},

    		/*
			** 验证一般包括下面几个个方向：
			** 1. 是否required同时值为空
			** 2. 是否数据匹配错误(pattern, type)
			** 3. 是否超出范围(min/max/step)
			** 4. 内容超出限制(minlength, maxlength)
			** 下面的这些方法就是上面3个方向判断
			** 其中，参数ele为DOM对象
			** 返回数据规则如下：
			** 如果没有把柄，返回false;
			** 如果真的有误，则返回错误类别：{
				  type: ''
	           }
			}
    		*/

    		isIgnore: function(ele) {
    			// 主要针对required必填或必选属性的验证
    			if (!ele || ele.disabled) return false;

    			// 类型
    			var type = $.getType(ele);

    			// 此时的值才是准确的值（浏览器可能会忽略文本框中的值，例如number类型输入框中的不合法数值）
    			var el = $(ele), value = ele.value;

    			if (el.isProp('required')) {

    				// 根据控件类型进行验证
					// 1. 单复选框比较特殊，先处理下
					if (type == 'radio') {
						// 单选框，只需验证是否必选，同一name单选组只有要一个设置required即可
						var eleRadios = self, eleForm;

						if (ele.name && (eleForm = el.parents('form')).length) {
							eleRadios = eleForm.find("input[type='radio'][name='"+ ele.name +"']");
						}

						// 如果单选框们没有一个选中，则认为无视了required属性
						var atLeastOneRadioChecked = false;

						eleRadios.each(function() {
							if (atLeastOneRadioChecked == false && $(this).prop("checked")) {
								atLeastOneRadioChecked = true;
							}
						});

						if (atLeastOneRadioChecked == false) {
							// 没有一个单选框选中
							return {
								type: 'ignore',
								error: 'radio'
							}
						}
						return false;
					} else if (type == 'checkbox') {
						// 复选框是每一个都必须选中
						if (el.prop('checked') == false) {
							return {
								type: 'ignore',
								error: 'checkbox'
							}
						}
						return false;
    				} else if (/select/.test(type) && value == '') {
    					return {
							type: 'ignore',
							error: 'select'
						}
					} else if (type != 'password') {
						value = $.trim(value);
					}

					if (value == '') {
						// 重新赋值，清空可能被浏览器默认认为不合法的值
						// 但是需要是现代浏览器，低版本IE会不断触发属性改变事件
						if (history.pushState) ele.value = '';

						// 返回验证结果
						return {
							type: 'ignore',
							error: 'empty'
						};
					}
    			}

				return false;
			},
			isUnmatch: function(ele, regex, params) {
				// 禁用元素不参与验证
				if (!ele || ele.disabled) return false;

				var el = $(ele);

				// 原始值和处理值
				var inputValue = ele.value, dealValue = inputValue;

				// 类型
    			var type = $.getType(ele);

				// 特殊控件不参与验证
				if (/^radio|checkbox|select$/i.test(type)) return false;

				// 全角半角以及前后空格的处理
				// 适用于type=url/email/tel/zipcode/number/date/time等
				if (type != 'password') {
					dealValue = $.trim(inputValue);
				}
				if (/^text|textarea|password$/i.test(type) == false) {
					dealValue = $.dbc2sbc(dealValue);
				}
				//  文本框值改变，重新赋值
				// 即时验证的时候，不赋值，否则，无法输入空格
				if ($.validate.focusable !== false && $.validate.focusable !== 0 && dealValue != inputValue) {
					ele.value = dealValue;
				}

				// 如果没有值，则认为通过，没有错误
				if (dealValue == '') return false;

				// 获取正则表达式，pattern属性获取优先，然后通过type类型匹配。注意，不处理为空的情况
				regex = regex || (function() {
					return el.attr('pattern');
				})() || (function() {
					// 文本框类型处理，可能有管道符——多类型重叠，如手机或邮箱
					return type && $.map(type.split('|'), function(typeSplit) {
						var matchRegex = $.validate.reg[typeSplit];
						if (matchRegex) return matchRegex;
					}).join('|');
				})();

				// 如果没有正则匹配的表达式，就没有验证的说法，认为出错为false
				if (!regex) return false;

				// multiple多数据的处理
				var isMultiple = el.isProp('multiple'), newRegExp = new RegExp(regex, params || 'i');
				// number,range等类型下multiple是无效的
				if (isMultiple && /^number|range$/i.test(type) == false) {
					var isAllPass = true;
					$.each(dealValue.split(','), function(i, partValue) {
						partValue = $.trim(partValue);
						if (isAllPass && !newRegExp.test(partValue)) {
							isAllPass = false;
						}
					});
					// 有数据没有匹配
					if (isAllPass = false) {
						return {
							type: 'unmatch',
							error: 'multiple'
						}
					}
				} else if (newRegExp.test(dealValue) == false) {
					return {
						type: 'unmatch',
						error: 'pattern'
					};
				}
				return false;
			},

			isOut: function(ele) {
				// 是否数值或日期范围超出
				if (!ele || ele.disabled || /^radio|checkbox|select$/i.test(ele.type)) return false;

				var el = $(ele);

				var attrMin = el.attr('min'), attrMax = el.attr('max'), attrStep = Number($(ele).attr('step')) || 1;
				// 值
				var type = $.getType(ele), value = ele.value;

				if (type.slice(-6) != '-range') {
					if (value == '0' || Number(value) == value) {
						value = value * 1;
					}
					if (attrMin && value < attrMin) {
						return {
							type: 'out',
							error: 'min'
						}
					} else if (attrMax && value > attrMax) {
						return {
							type: 'out',
							error: 'max'
						}
					}

					// number, range类型的范围

					if ((type == 'number' || type == 'range') && attrStep && attrMin &&
						!/^\d+$/.test(Math.abs(value - attrMin) / attrStep)
					) {
						return {
							type: 'out',
							error: 'step'
						}
					}
					// hour, minute, time类型的范围
					if ((type == 'hour' || type == 'minute' || type == 'time') && attrMin && attrStep) {
						var minuteValue = value.split(':')[1],
							minuteMin = attrMin.split(':')[1];

						if (type == 'hour' && (minuteValue != minuteMin || (value.split(':')[0] - attrMin.split(':')[0]) % attrStep != 0)) {
							// 小时，则是分钟要一致，小时数正好step
							return {
								type: 'out',
								error: 'step'
							}
						} else if ((minuteValue - minuteMin) % attrStep !== 0) {
							return {
								type: 'out',
								error: 'step'
							}
						}
					}
				} else {
					// 时间范围
					var arrSplitValue = value.split(' '), error = [];

					// 防止month-range时候，min/max设置的是完整时间，
					// 如2017-07-07，而不是2017-07
					if (type == 'month-range') {
						attrMin = attrMin && attrMin.slice(0,7);
						attrMax = attrMax && attrMax.slice(0,7);
					}

					if (arrSplitValue.length == 3) {
						if (attrMin && arrSplitValue[0] < attrMin) {
							error.push('min');
						}
						if (attrMax && arrSplitValue[2] > attrMax) {
							error.push('max');
						}
						if (error.length) {
							return {
								type: 'out',
								error: error.join('-')
							}
						}
					}
				}
				return false;
			},

			isOverflow: function(ele) {
				// 是否内容长度溢出的判断
				if (!ele || ele.disabled || /^radio|checkbox|select$/i.test(ele.type)) return false;

				var el = $(ele);
				//  大小限制
				var attrDataMin = el.attr('minlength'),
					attrDataMax = ele.maxlength || el.attr('maxlength')
					// 值
					, value = ele.value;

				if (value == '') return false;

				var length = $.getLength(ele);

				if (attrDataMin && length < attrDataMin) {
					return {
						type: 'overflow',
						error: 'minlength'
					}
				} else if (attrDataMax && (attrDataMax = attrDataMax.replace(/\D/g, '')) && length > attrDataMax) {
					return {
						type: 'overflow',
						error: 'maxlength'
					}
				}
				return false;
			},

			isError: function(ele) {
				// 1. 元素不存在不验证
				// 2. 禁用态表单元素不参与验证
				if (!ele || ele.disabled) return false;

				// 3. 提交、重置等元素不参与验证
				var type = ele.getAttribute('type') || ele.type, tag = ele.tagName.toLowerCase();
				if (/^button|submit|reset|file|image$/.test(type) == true || tag == 'button') return false;

				return $.validate.isIgnore(ele) || $.validate.isUnmatch(ele) || $.validate.isOut(ele) || $.validate.isOverflow(ele) || false;
			},

			isAllPass: function(el, options) {
				// el可以是独立的DOM, 也可以是form元素，也可以是jQuery序列元素
				if (!el) return true;

				el = $(el);
				if (el.is('form')) {
					el = el.find(':input');
				}

				// 遍历以及验证
				var isAllPass = true;

				el.each(function() {
					var ele = this;
					// 一些属性

					// 实现现代浏览器下利用:invalid选择器即时响应效果
					var type = ele.getAttribute('type') || ele.type,
						pattern = ele.getAttribute('pattern');
					if (!pattern && type && (pattern = $.validate.reg[type])) {
						ele.setAttribute('pattern', pattern);
					}

					// 1. 采用单验证模式，所以，一旦发现isAllPass为false, 我们停止接下来的验证
					// 2. 禁用态的元素不验证
					// 3. 提交按钮、重置按钮等不验证
					if (isAllPass == false || ele.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

					var result = $.validate.isError(ele);
					if (result) {
						// 提示错误
						$.validate.errorTip(ele, $.validate.prompt(result, ele, options));
						isAllPass = false;
					}
				});

				return isAllPass;
			},

			// 计数效果
			count: function(el) {
				if (!el) return this;
				var ele;
				// 计数相关代码构建
				// el只能是单个包装器对象，其余的会忽略
				if (el.get) {
					ele = el.get(0);
				} else {
					ele = el;
					el = $(el);
				}

				// 标签名
				var tag = ele.tagName.toLowerCase();

				// 首先ele需要是表单元素
				if (tag != 'input' && tag != 'textarea') {
					return this;
				}

				// 获得限制大小
				var min = el.attr('minlength') || 0,
					max = ele.maxlength || el.attr('maxlength');

				if (!min && !max) {
					return this;
				}
				// 过滤非数值字符
				max = max.replace(/\D/g, '');

				// 类名前缀
				var clPrefix = 'ui-';
				// 其他类名
				var cl = clPrefix + tag, clBox = cl + '-x', clCount = cl + '-count';

				// 存在下面3种情况
				// 1. 普通文本框需要变身
				// 2. 缺少计数label
				// 3. HTML已经完整
				var elLabel, elMin, elMax;
				if (el.hasClass(cl)) {
					// 情况1先不支持
					return this;
				} else {
					// 情况2
					// ui-input-x
					//    input
					//    div.ui-input
					// 缺少label，也就是数值元素
					if (el.parent('.' + clBox).length == 0) {
						return this;
					}

					// 元素id必须
					var id = ele.id;
					if (!id) {
						// 没有id随机id
						id = 'id' + (Math.random() + '').replace(/\D/g, '');
						ele.id = id;
					}

					elLabel = el.parent().find('.' + clCount);
					if (elLabel.length == 0) {
						// 生成并载入计数元素
						elLabel = $('<label for="'+ id +'" class="ui-'+ tag +'-count">\
				        <span>'+ min +'</span>/<span>'+ max +'</span>\
				    </label>');
						el.parent().append(elLabel);
					} else {
						elLabel.attr('for', id);
					}
					elMin = elLabel.find('span').eq(0);
					//elMax = eleLabel.find('span').eq(1);
				}

				// 目标元素
				//var target = $.validate.getTarget(el);
				// 计数，标红方法
				var fnCount = function() {
					var length = $.getLength(ele);
					elMin.html(length);
					if (length > max) {
						elMin.addClass('red');
						// 下面注释是因为不需要即时变红，只要文字提示就可以
						// 当验证组件开启即时验证之后，会标红的
						//target.addClass('error');
					} else {
						elMin.removeClass('red');
						//target.removeClass('error');
					}
				};
				// 事件
				var flagCount = 'countBind';
				if (!el.data(flagCount)) {
					if ('oninput' in document.createElement('div')) {
						el.bind('input', function() {
							fnCount();
						});
					} else {
	    				ele.attachEvent('onpropertychange', function(event) {
							if (event && event.propertyName == "value") {
								fnCount();
							}
						});
	    			}
	    			el.data(flagCount, true);
				}

    			fnCount();

				return this;
			},

			// 显示出错信息
			errorTip: function(el, content) {
				var target = $.validate.getTarget(el);
				if (target.length == 0) return this;

				var show = function() {
					target.errorTip(content, {
						onShow: function(tips) {
							// 如果tips宽度比较小，居左定位
							// 否则，使用默认的居中
							var pffsetx = 0.5 * (tips.width() - target.width());
							if (pffsetx < 0) {
								tips.css('margin-left', 0.5 * (tips.width() - target.width()));
							} else {
								tips.css('margin-left', 0);
							}

							if ($.validate.focusable === false) {
								tips.addClass('none');
							} else {
								tips.removeClass('none');
							}
						},
						onHide: function() {
							// 前提是开启了即时验证
							if (!target.parents('form').data('immediate')) return;
							// 自定义验证方法的即时验证
							var customValidate = $.validate.el.control.data('customValidate');
							var result = customValidate && customValidate($.validate.el.control);
							if ($.validate.isError($.validate.el.control.get(0)) || (typeof result == 'string' && result.length)) {
								$.validate.el.target.addClass('error');
							}
						}
					});

					// 即时验证不需要focus与选中
					if ($.validate.focusable === false || $.validate.focusable === 0) return;
					$.validate.focusable = null;

					var el = $.validate.el.control, ele = el.get(0),
						type =ele.getAttribute('type') || ele.type;

					if (!type) return;

					// 如果是内容超出，选中超出的文字内容
					if (content.indexOf('内容长度') != -1 && content.indexOf('大') != -1) {
						var value = el.val(), length = value.length, lang = el.attr('lang');
						// 中文和英文计算字符个数的比例
				    	var ratioCh = 1, ratioEn = 1;
						if (/zh/i.test(lang)) {
							// 1个英文半个字符
							ratioEn = 0.5;
						} else if (/en/i.test(lang)) {
							// 1个中文2个字符
							ratioCh = 2;
						}
						// 获得最大长度的索引位置
						var maxlength = ele.maxlength || el.attr('maxlength').replace(/\D/g, '');

						if (length && maxlength) {
							el.selectRange($.getLength(ele, maxlength), length);
						}
					} else {
						el.select();
					}

				};

				$.validate.el = {
					control: $(el),
					target: target
				};

				// 1. 首先，确保el在屏幕内，且需要预留tips的显示的足够距离，这里使用50像素
				var rect = target.get(0).getBoundingClientRect();
				if (rect.top < 50) {
					$('html, body').animate({
						'scrollTop': $(window).scrollTop() - (50 - rect.top)
					}, 200, show);
				} else if (rect.bottom > $(window).height()) {
					$('html, body').animate({
						'scrollTop': $(window).scrollTop() + (rect.bottom - $(window).height())
					}, 200, show);
				} else {
					show();
				}

				return this;
			},

			// 获得对应展示的元素
			getTarget: function(el) {
				var ele = el;
				if (!el) return $();
				if (el.get) {
					ele = el.get(0);
				} else {
					el = $(el);
				}
				if (el.length == 0) return;

				var target = el;

				// 根据原生控件元素，确定真实的自定义控件元素
				// 这里的很多处理跟其他表单UI组件想耦合、关联
				var type = ele.getAttribute('type') || ele.type, id = ele.id, tag = ele.tagName.toLowerCase();;
				// 1. 单复选框
				if (type == 'radio') {
					target = el.parent().find('label.ui-radio[for='+ id +']');
				} else if (type == 'checkbox') {
					target = el.parent().find('label.ui-checkbox[for='+ id +']');
				// 下拉框
				} else if (type == 'select' || tag == 'select') {
					target = el.next('.ui-select');
				// range范围选择框
				} else if (type == 'range') {
					target = el.prev('.ui-range');
				} else if (type == 'hidden' || el.css('display') == 'none') {
					if (el.data('target') && el.data('target').size) {
						target = el.data('target');
					}
				} else if (type == 'textarea' || tag == 'textarea') {
					if (el.nextAll('.ui-textarea').length) {
						target = el.nextAll('.ui-textarea').eq(0);
					} else if (!document.querySelector && el.parent('.ui-textarea').length) {
						target = el.parent('.ui-textarea');
					}
				} else if (tag == 'input') {
					if (el.nextAll('.ui-input').length) {
						target = el.nextAll('.ui-input').eq(0);
					} else if (!document.querySelector && el.parent('.ui-input').length) {
						target = el.parent('.ui-input');
					}
				}
				return target;
			}
    	};
    })();

    var Validate = function(el, callback, options) {
    	// el一般指的是form元素
    	if (!el.eq) el = $();

    	callback = callback || $.noop;

    	// 干掉浏览器默认的验证
    	el.attr('novalidate', 'novalidate');

    	var defaults = {
    		multiple: true,       		// 提交时候是全部出错红色高亮，还是仅第一个，默认是全部
    		immediate: true,  			// 是否开启即时验证
    		label: false,				// 是否利用label关联元素的innerHTML作为提示关键字
    		validate: [/*{
    			id: '',
    			prompt: {
    				ignore: '',
    				unmatch: '',
    				out: {
    					min: '',
    					max: '',
    					step: ''
    				},
    				overflow: {
    					minlength: '',
    					maxlength: ''
    				}
    			},
    			method: $.noop
    		}*/],
    		onError: $.noop,
    		onSuccess: $.noop
    	};

    	var params = $.extend({}, defaults, options || {});

    	// 还原禁用的提交和关闭按钮
    	el.find(':disabled').each(function() {
			if (/^image|submit$/i.test(this.type)) {
				$(this).removeAttr('disabled');
			}
		});

    	var self = this;
    	// 干掉默认的提交
    	el.bind("submit", function(event) {
    		event.preventDefault();

    		if (self.isAllPass() && $.isFunction(callback)) {
	    		callback.call(this);
    		}

			return false;
		});


		// 暴露的数据
		this.el = {
			form: el
		};

		this.callback = {
			error: params.onError,
			success: params.onSuccess
		};

		this.data = params.validate;

		this.boo = {
			multiple: params.multiple,
			immediate: params.immediate,
			label: params.label
		};

		// 计数效果
		this.count();

		return this;
    };

    Validate.prototype.count = function() {
    	// 计数效果
    	var self = this;
    	// 即时验证
    	var form = this.el.form;
    	// 遍历计数元素
    	form.find('.ui-input-x > input, .ui-textarea-x > textarea').each(function() {
    		var ele = this, el = $(this);
    		// 对maxlength进行处理
    		var maxlength = el.attr('maxlength');
    		if (maxlength) {
    			// 给maxlength设置不合法的值，阻止默认的长度限制
    			try {
    				el.attr('maxlength', '_' + maxlength + '_');
    			} catch(e) {
    				// IE7不能设置不合法的maxlength值 %>_<%
    				el.removeAttr('maxlength')[0].maxlength = maxlength;
    			}
    		}
    		$.validate.count(el);
    	});
    };

    Validate.prototype.immediate = function() {
    	var self = this;
    	// 即时验证
    	var form = this.el.form;

    	if (form.data('immediate')) return this;

    	form.find(':input').each(function() {
    		// 元素
    		var ele = this, el = $(this);
    		// type类型筛选
    		var type = ele.type, attrType = ele.getAttribute('type');
    		// 给每个控件绑定即时验证
    		if (type == 'button' || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

    		// 不同类别不同事件
    		if (type == 'radio' || type == 'checkbox') {
    			el.on('click', function() {
    				if (self.boo.immediate == false) return;
    				var isPass = self.isPass($(this));
    				if (isPass) {
    					self.isError($(this), false);
    				}
    			});
    		} else if (/select/.test(type) || /range|date|time|hour|minute|hidden/.test(attrType)) {
    			el.on('change', function() {
    				if (self.boo.immediate == false) return;
    				var isPass = self.isPass($(this));
    				if (isPass) {
    					self.isError($(this), false);
    				}
    			});
    		} else {
    			// 输入
    			el.on({
    				focus: function(event) {
    					if (self.boo.immediate) setTimeout(function() {
    						$.validate.focusable = 0;
    						var isPass = self.isPass(el);
		    				if (isPass) {
		    					self.isError(el, false);
		    				}
    					}, 20);
    				},
    				input: function(event) {
    					if (self.boo.immediate == false) return;
    					// IE10+下有个bug
    					// focus placeholder变化时候，会触发input事件，我只能呵呵了
    					if (document.msHidden != undefined && this.value == '' && !this.lastvalue && $(this).attr('placeholder')) {
    						this.lastvalue = this.value;
    						return;
    					}

    					$.validate.focusable = false;
    					var isPass = self.isPass($(this));
	    				if (isPass) {
	    					self.isError($(this), false);
	    					if (window.errorTip) errorTip.hide();
	    				}
	    				this.lastvalue = this.value;
    				}/*,  // 有了即时验证，以及errorTip hide回调判断，不需要blur判断了，因为时机不好掌握[:\face 哭笑不得]
    				blur: function() {
    					if (!history.pushState) {
	    					setTimeout(function() {
	    						self.isError(el);
	    					}, 198);
    					}
    				}*/
    			});

    			// IE7-IE8 模拟 input
    			if ('oninput' in document.createElement('div') == false) {
    				ele.attachEvent('onpropertychange',  function(event) {
						if (event && event.propertyName == "value" && self.boo.immediate) {
							$.validate.focusable = false;
							var isPass = self.isPass($(ele));
		    				if (isPass) {
		    					self.isError($(ele), false);
		    				}
		    				$.validate.focusable = true;
						}
					});
    			}
    		}
    	});

    	form.data('immediate', true);
    	return this;
    };

    Validate.prototype.isError = function(el, isError) {
    	// 是否有错
    	if (!el || !el.get || !el.length) return this;
    	var ele = el.get(0), result = isError;
    	if (typeof isError == 'undefined' && el.is(':disabled') == false) {
    		var customValidate = el.data('customValidate');
    		result = $.validate.isError(ele) || (customValidate && customValidate(el));
    	}

    	var target = $.validate.getTarget(el);

    	if (result) {
    		// 出错
    		target.addClass('error');
    	} else {
    		if (ele.type == 'radio' && ele.name) {
    			this.el.form.find('input[type=radio][name="' + ele.name + '"]').each(function() {
    				$.validate.getTarget($(this)).removeClass('error');
    			});
    		} else {
    			target.removeClass('error');
    		}
    	}

    	return result;
    };

    Validate.prototype.isPass = function(el) {
    	if (!el || !el.get || !el.length) return this;
    	var ele = el.get(0), id = ele.id, label = this.boo.label;

    	// 是否使用自定义的验证和提示
    	var customValidate = {
    		label: label
    	};
    	if (id && this.data && this.data.length) {
    		$.each(this.data, function(index, obj) {
				if (obj.id == id) {
					// 最终的提示文字，是否借助label元素
					// 参数传递路径: here -> $.validate.isAllPass -> $.validate.prompt
					if (typeof obj.label != 'undefined') {
						obj.label = label;
					}
					// 自定义验证参数
					customValidate = obj;
				}
			});
    	}

    	var isPass = $.validate.isAllPass(el, customValidate);

    	if (isPass == true && customValidate && customValidate.method) {
    		var content = customValidate.method.call(ele, el);
    		if (typeof content == 'string' && content !== '') {
    			this.errorTip(el, content);
    			isPass = false;
    		}
    		el.data('customValidate', customValidate.method);
    	}

    	this.callback[isPass? 'success': 'error'].call(this, el);

    	return isPass;
    };

    Validate.prototype.isAllPass = function() {
    	var self = this, form = this.el.form;

    	var isAllPass = true;

		$.validate.focusable = true;

		form.find(':input').each(function() {
			if (isAllPass == true && self.isPass($(this)) == false) {
				isAllPass = false;
			}
			if (self.boo.multiple) {
				// 一次验证多个元素，只有一个出提示，其余标红
				var input = this;
				if (!form.data('immediate')) {
					// self.data是自定义的验证数据
					$.each(self.data, function(index, obj) {
						if (obj.id == input.id && obj.method) {
							$(input).data('customValidate', obj.method);
						}
					});
				}

				self.isError($(this));
			}
		});

		// 当有过一次提交之后，开启即时验证
		if (!form.data('immediate') && self.boo.immediate) {
			self.immediate();
		}

		return isAllPass;

    };

    Validate.prototype.errorTip = function(el, content) {
    	$.validate.errorTip(el, content);
    	return this;
    };


    return Validate;
}));
/**
 * @Pagination.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-26
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Pagination = factory();
    }
}(this, function () {
	/**
     * 分页组件
	 * 支持jQuery包装器调用以及new实例构造
	 * eg $().pagination(options);
	      new Pagination($(), options);
     **/	
    
    $.fn.pagination = function(options) {
    	return $(this).each(function() {
    		if (!$(this).data('pagination')) {
    			$(this).data('pagination', new Pagination($(this), options));
    		}
    	});
    };

    // 实例方法
	var Pagination = function(container, options) {
		container = container || $();
		options = options || {};

		var page = this; 
		
		// 默认参数
		var defaults = {
			length: 0,                 // 总的数据量
			current: 1,                // 当前的页码
			every: 15,                 // 每页显示的数目
			mode: 'long',              // short 长分页还是短分页

			onClick: $.noop
		};
		
		var params = $.extend({}, defaults, options);
		
		var el = {};
		this.el = el;
		
		// 存储元素
		el.container = container;
		
		// 存储数据
		var num = {};
		this.num = num;
		// 存储总数据量
		num.length = params.length;
		// 存储当前的页码
		num.current = params.current;
		// 存储每页的条目个数
		num.every = params.every;
		
		// 分页类别
		this.mode = params.mode;

		this.href = params.href;

		// 给容器委托点击事件
		container.delegate('a', 'click', function(event) {
			var current = $(this).attr('data-page');
            page.num.current = current * 1;

            var selector = '.' + $.trim(this.className).replace(/\s+/g, '.');

            // 分页刷新
            page.show();
            // 点击回调
            // 由于HTML刷新，重新获取点击的元素
            params.onClick.call(container.find(selector)[0], page, current);

			if (/^javascript/.test(this.href)) {
				event.preventDefault();
			}
		});
		
		this.show();
		return this;
		
	};
	
	// IE9+ 前后分页图标使用内联SVG, 以便支持retina屏幕
	var svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"/></svg>';
	
	
	// 创建分页字符串的方法
	Pagination.prototype.create = function(num, mode) {
		num = num || {};
		var length = num.length || 0,
		current = num.current || 1,
		every = num.every || 1;
		mode = mode || 'long';

		// a标签的href地址
		var href = this.href || 'javascript:',
		// 获得href的方法
		fnHref = function(index) {
			if (typeof href == 'string') {
				return href;
			} else if (typeof href == 'function') {
				return href(index);
			}
		};
		


		// ui类名
		var CL = 'ui-page', prefixPage = CL + '-';
		
		// 计算总页数
		var total = Math.ceil(length / every) || 1;
		
		var html = '';
		
		// 一些类名
		var clPrev = [CL, prefixPage + 'prev'].join(' '),
			clNext = [CL, prefixPage + 'next'].join(' '),
			clEll = [CL, prefixPage + 'ellipsis'].join(' '),
			clText = [CL, prefixPage + 'text'].join(' '),
			clCurrent = [CL, prefixPage + 'current'].join(' ');
		
		
		// 1. 首先是通用的前后翻页
		if (current > 1) {
			html = html + '<a href="'+ fnHref(current - 1) +'" class="'+ clPrev +'" data-page="'+ (current - 1) +'">'+ svg +'</a>';
		} else {
			// 当前是第一页，自然不能往前翻页
			html = html + '<span class="'+ clPrev +'">'+ svg +'</span>';
		}
				
		// 2. 中间部分
		// 短分页和长分页
		var visible = 6;
		if (mode == 'long') {
			var long = function(start) {
				if (start == current) {
					html = html + '<span class="'+ clCurrent +'">'+ start +'</span>';
				} else {
					html = html + '<a href="'+ fnHref(start) +'" class="'+ CL +'" data-page="'+ start +'">'+ start +'</a>';
				}
			};
			
			if (total <= visible) {
				// 如果页面不大于6个，全部显示
				for (start=1; start<=total; start++) {
					long(start);
				}	
			} else {
				// 为了保证体验，在分页数量大的时候，要保证总条目数为7个
				// 假设页码总数20，规则如下
				// 当前是1: 则 1-5,... 20
				//      2: 则 1-5,...,20
				//      3: 则 1-5,...,20
				//      4: 则 1-5,...,20
				//      5: 则 1...456,...,20
				//      ...							
				if (current < total * 0.5 && current < visible - 1) {
					// 至少保证current的前后有数据
					if (current < visible - 1) {
						for (start=1; start<visible; start++) {
							long(start);
						}
					}					
					html = html + '<span class="'+ clEll +'">...</span>';
					long(total);
				} else if (current > total * 0.5 && current > total - visible + 2) {
					long(1);
					html = html + '<span class="'+ clEll +'">...</span>';
					for (start=total-visible+2; start<=total; start++) {
						long(start);
					}
				} else {
					// 前后两处打点
					long(1);
					html = html + '<span class="'+ clEll +'">...</span>';
					long(current - 1);
					long(current);
					long(current + 1);
					html = html + '<span class="'+ clEll +'">...</span>';
					long(total);
				}
			}
		} else if (mode == 'short') {
			html = html + '<span class="'+ clText +'">'+ [current, total].join('/') +'</span>';
		}
		
		// 3. 往后翻页
		if (current < total) {
			html = html + '<a href="'+ fnHref(current + 1) +'" class="'+ clNext +'" data-page="'+ (current + 1) +'">'+ svg +'</a>';
		} else {
			html = html + '<span class="'+ clNext +'">'+ svg +'</span>';
		}
		
		return '<div class="'+ prefixPage +'x">' + html + '</div>';
	};
	
	Pagination.prototype.show = function() {
		// 数据合法性处理		
		var num = this.num;
		num.length = Math.max(num.length, 0);
		num.every = Math.max(num.every, 1);

		// current合法性处理
		var max_current = Math.ceil(num.length / num.every);
		if (num.current > max_current) {
			num.current = max_current;
		}

		num.current = Math.max(num.current, 1);
		
		if (this.el && this.el.container && this.el.container.size()) {
			// 分页刷新
			this.el.container.html(this.create(num, this.mode));	
		}
		return this;
	};
	
	return Pagination;
}));
/**
 * @Table.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-28
 */
define(function(require, exports, module) {
    //require('plugin/jquery');

    // 复选框
    if (!window.addEventListener) {
		require.async('common/ui/Checkbox');
	}
    var DropList = require('common/ui/DropList');
    var Pagination = require('common/ui/Pagination');
    var Tips = require('common/ui/Tips');
    // 加载动效
    require('common/ui/Loading');
	
	/**
     * 项目表格组件
     * @使用示例
     *  new Table($('#table'), {});
     */
	
    var LOADING = 'loading';

	var CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected', 
	   selector = '[type=checkbox]';

	// 一些元素类名
	var CL = {
		// 列表结构相关
		container: 'table-x',
		size: 'table-size',
		empty: 'table-null-x',
		// 错误
		error: 'table-error-x',
		// 加载
		loading: 'ui-loading',
		// 下面是分页相关的：
		//   总数据量
		total: 'table-num-length',
		//   每页系那是数目
		every: 'table-num-every',
		//   分页左侧容器
		data: 'table-page-data',
		//   分页列表（右侧）容器
		page: 'table-page'
	};

	// 表格
	var Table = function(el, options) {
		if (!el || !el.length) return this;

		var defaultPageOptions = {
			// 总数据量
			length: 0,
			// 每页显示数目
			every: 15,
			// 当前的页数
			current: 1
		};

		// 默认参数
		var defaults = {
			// 请求列表数据的Ajax参数，同jQuery $.ajax() 参数
			// 默认dataType为'json'
			ajaxOptions: { },
			// 分页数目下拉内容
			pageList: [15, 30, 50],
			// 一般情况下，pageoptions参数都是使用默认值
			pageOptions: defaultPageOptions,
			// 对请求的JSON数据进行处理，并返回
			parse: function(data) {
				if (typeof data == 'string') {
					return data;
				}
				return '';
			},
			events: {
				// 事件，例如
				// 'a.icon-del:click': function() { /* ... */ }
			},
			// 列表内容显示的回调
			onShow: $.noop,
			// 点击分页的回调
			// 如果存在，会替换本组件内置的分页Ajax处理
			onPage: null,
			// 点击复选框的回调
			onCheck: $.noop	
		};
		var params = $.extend({}, defaults, options || {});

		var self = this;

		// 表格列表需要的一些元素
		var container, table, size, empty, loading = $(), total, every, data, page;
		if (el.hasClass(CL.container)) {
			container = el;
		} else {
			container = el.parents('.' + CL.container);
		}

		table = container.find('table');
		size = container.find('.' + CL.size);
		empty = container.find('.' + CL.empty);
		if (params.ajaxOptions.url) {
			// 这句话2作用，1是可能没有初始的loading HTML, 2是为之后的动画做准备
			size.loading({ create: true }).unloading();
			loading = container.find('.' + CL.loading);
		}
		total = container.find('.' + CL.total);
		every = container.find('.' + CL.every);
		data = container.find('.' + CL.data);
		page = container.find('.' + CL.page);

		// 元素之类
		this.el = {
			container: container,
			size: size,
			table: table,
			empty: empty,
			loading: loading,
			total: total,
			every: every,
			data: data,
			page: page
		};

		// 回调之类
		this.callback = {
			parse: params.parse,
			page: params.onPage,
			show: params.onShow
		};

		// 数据之类
		this.num = $.extend({}, defaultPageOptions, params.pageOptions);

		// 一些事件
		// 单复选框选中效果
		table.delegate(selector, 'click', function() {
			var tdCheckbox = table.find('td ' + selector), isAllChecked = false, isAllUnchecked = false;
			// 全选
			if ($(this).parents('th').length) {
				isAllChecked = $(this).prop(CHECKED);
				isAllUnchecked = !isAllChecked;
				tdCheckbox.prop(CHECKED, isAllChecked);
			} else {
				var lengthChecked = tdCheckbox.filter(':checked').length;
				// 是否取消全选
				isAllChecked = (tdCheckbox.length == lengthChecked);
				// 是否全部非选				
				isAllUnchecked = (lengthChecked == 0);
			}
			// 改变全选复选框的状态
			table.find('th ' + selector).prop(CHECKED, isAllChecked);
			
			// IE7-IE8必须根据真实选中态初始化属性值
			if ($.fn.propMatch) {
				table.find(selector).propMatch();
			}
			
			// 根据复选框状态决定表格行样式
			tdCheckbox.each(function() {
				$(this).parents('tr')[$(this).prop(CHECKED)? 'addClass': 'removeClass'](SELECTED);	
			});
			
			// 回调
			params.onCheck.call(this, isAllChecked, isAllUnchecked, table);
		});
		
		// 点击列表，只有不是a元素或者是复选框本事，选中当前复选框
		table.on('click', function(event) {
			var target = event.target, checkbox = null;
			if (target && /^a|input|label|th$/i.test(target.tagName) == false) {
				checkbox = $(target).parents('tr').find(selector);
				if (checkbox.length && checkbox.prop(DISABLED) == false) {
					checkbox.trigger('click');
				}
			}
		});

		// 其他些事件
		$.each(params.events, function(key, value) {
			var arr_selector_type = key.split(':');
			if (arr_selector_type.length == 2 && $.isFunction(value)) {
				table.delegate(arr_selector_type[0], arr_selector_type[1], value);
			}
		});

		// 切换每页数目的dropList
		// 求得当前选中的分页数
		// 优先本地存储
		var storeId = table.attr('id'), currentEvery = params.pageOptions.every;
		if (storeId && window.localStorage && localStorage[storeId]) {
			currentEvery = localStorage[storeId];
			self.num.every = currentEvery;
		}
		// 赋值
		every.html(currentEvery);

		this.pageList = new DropList(every.parent(), $.map(params.pageList, function(number) {
			return { value: '<span class="'+ CL.every +'">' + number + '</span>' };
		}), {
        	width: 60,
        	onSelect: function() {
        		var everyNew = $(this).text();
        		if (window.localStorage && storeId) {
        			localStorage[storeId] = everyNew;
        			
        		}
        		// 如果分页有变
        		if (self.num.every != everyNew) {
        			// 改变分页数目
	        		self.num.every = everyNew;
	        		// 当前页重置为1
	        		self.num.current = 1;
	        		// 重新刷新
	        		self.ajax();
        		}
        	}
        });


		// ajax数据
		this.ajaxOptions = params.ajaxOptions;

		// 获得数据
		this.ajax();
	};
	
	Table.prototype.ajax = function(options) {
		options = options || {}
		var self = this;

		// 防止连续请求
		if (self.ajaxing == true) return this;

		// 一些存储在实例对象上的数据
		var el = this.el, callback = this.callback, num = this.num;

		// 列表容器元素
		var tbody = el.table.find('tbody');
		
		// ajax请求参数
		var ajaxParams = $.extend({ dataType: 'json' }, this.ajaxOptions, options);

		// ajax地址是必需项
		if (!ajaxParams.url) return this;

		// ajax的data数据和几个回调走的是合并策略
		var data = options.data || {}, dataOptions = {};
		if ($.isFunction(this.ajaxOptions.data)) {
			dataOptions = this.ajaxOptions.data() || {};
		}

		ajaxParams.data = $.extend({}, {
			current: num.current,
			every: num.every
		}, dataOptions, data);

		num.current = ajaxParams.data.current;
		num.every = ajaxParams.data.every;

		// 回调额合并
		var success = ajaxParams.success, error = ajaxParams.error, complete = ajaxParams.complete;
		ajaxParams.success = function(data) {
			var html = callback.parse(data);
			tbody.html(html || '');
			if (!html) {
				el.empty.show();
			}

			// 修改总数值并显示
			var total = data.total;
			if (!total && total !== 0) {
				total = data.data && data.data.total;
			}
			if (total || total == 0) {
				el.total.html(total);
				self.num.length = total;
			} else {
				// 如果ajax返回的没有列表总数值，使用之前的值
				total = num.length;
			}
			el.data.show();
			// 显示分页
			if (self.pagination) {
				self.pagination.num = self.num;
				self.pagination.show();
			} else {
				self.pagination = new Pagination(el.page, {
					length: total,
		            current: num.current,
		            every: num.every,
		            mode: num.mode || 'long',
		            onClick: function(page, current) {
						// 更新分页
		            	self.num.current = current;
		            	// 自定义分页事件
		            	if ($.isFunction(self.callback.page)) {
		            		self.callback.page.call(this, page, current);
		            	} else {
		            		// 显示小loading
			            	$(this).addClass(LOADING);
			            	
			            	// ajax再次
			            	self.ajax();
		            	}
		            }
				});
			}

			// tips效果
			el.table.find('.ui-tips').tips();

			if ($.isFunction(success)) {
				success(data);
			}
		}
		ajaxParams.error = function(xhr, status) {
			var elError = el.size.find('.' + CL.error);
			if (elError.size()) {
				elError.show();
			} else {
				elError = $('<div class="'+ CL.error +'">网络异常，数据没有获取成功，您可以稍后重试！</div>');
				el.size.append(elError);
			}
			if ($.isFunction(error)) {
				error(xhr, status);
			}
		}
		ajaxParams.complete = function() {
			// 去除中间的大loading
			el.loading.hide();
			// 去掉分页的小loading
			if (this.pagination) {
				this.pagination.el.container.find('.' + LOADING).removeClass(LOADING);
			}
			if ($.isFunction(complete)) {
				complete();
			}
			// 呈现与动画
			self.show();
			// 请求结束标志量
			self.ajaxing = false;
		}

		// 滚动到表格上边缘
		var scrollTop = $(window).scrollTop();
		if (el.table.offset().top < scrollTop) {
			scrollTop = el.container.offset().top;
			$('html, body').animate({
				scrollTop: scrollTop
			}, 'fast', function() {
				if (this == document.body) {
					self.ajaxing = true;
					$.ajax(ajaxParams);
				}
			});
		} else {
			self.ajaxing = true
			$.ajax(ajaxParams);
		}

		// 显示loading
		el.loading.css('top', '0');
		if (el.loading.css('display') == 'none') {
			el.loading.height(el.size.height() - el.table.find('thead').height());
		}

		// 微调圈圈的位置
		var distance = el.loading.height() - $(window).height();
		if (distance > 0) {
			el.loading.css('top', -0.5 * distance);
		}

		// loading显示
		el.loading.show();
		// 其他元素隐藏
		el.empty.hide();
		el.size.find('.' + CL.error).hide();
		el.table.find('tbody').empty();

		this.scrollTop = scrollTop;

		//setTimeout(function() {
			//$.ajax(ajaxParams);
		//}, 500);

		return this;
	}

	Table.prototype.show = function() {		
		this.el.size.unloading(this.el.size.data('animation'));
		// 显示loading
		this.el.loading.css('top', '0');
		// Chrome, IE10+高度变小时候，会先置顶，在变化，导致晃动，影响体验，通过记录scrollTop修正，FireFox没有此问题
		$(window).scrollTop(this.scrollTop);
		//没有全选
		var chkAll = this.el.table.find('th input' + selector);
		if (chkAll.length) {
			chkAll.prop(CHECKED, false);
			if ($.fn.propMatch) {
				chkAll.propMatch();
			}
		}

		// 列表显示的回调
		if ($.isFunction(this.callback.show)) {
			this.callback.show.call(this);
		}
		return this;
	}

	return Table;
});
/**
 * @Form.js
 * @author xinxuzhang
 * @version
 * Created: 16-03-01
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Form = factory();
    }
}(this, function (require) {
	// require
	if (typeof require == 'function') {
		 // 轻tips
		require('common/ui/LightTip');
		// 加载
		require('common/ui/Loading');
		// 验证
		var Validate = require('common/ui/Validate');

		// 一些表单UI控件
		require('common/ui/Select');
		var Radio = require('common/ui/Radio');
		var Checkbox = require('common/ui/Checkbox');

		// 表单元素的UI实例化
		// 单复选框，占位符
		Radio.init();
		Checkbox.init();

		require('common/ui/Placeholder');
	} else if (!$().validate) {
		if (window.console) {
			console.error('need Validate.js');
		}
		return {};
	} else if (!$.lightTip) {
		if (window.console) {
			console.error('need LightTip.js');
		}
		return {};
	} else if (!$().loading) {
		if (window.console) {
			console.error('need Loading.js');
		}
		return {};
	}

	/**
     * 项目表格组件
     * @使用示例
     *  new Form($('#form'), {}, {});
     */

	var DISABLED = 'disabled';	

	// 表格
	var Form = function(elForm, optionCallback, optionValidate) {
		if (!elForm || !elForm.length) return this;
		// optionCallback可以是对象也可以直接是成功回调
		/*
			optionCallback = {
				avoidSend: $.noop,    // 验证成功之后，请求发送前的条件约束
				success: $.noop,
				error: $.noop,
				complete: $.noop
			};
		*/
		optionCallback = optionCallback || $.noop;
		if ($.isFunction(optionCallback)) {
			optionCallback = {
				success: optionCallback
			};
		}
		
		optionValidate = optionValidate || {};

		var self = this;
		// 表单元素
		var form = elForm;
		// 通过submit按钮找到找到关联的我们肉眼所见的提交按钮
		var btnSubmitReal = form.find('input[type=submit]');
		// 我们肉眼所见的按钮，进行一些状态控制
		var btnSubmit = $('label[for='+ btnSubmitReal.attr('id') +']');

		
		// 占位符
		if ($().placeholder) {
			form.find('[placeholder]').placeholder();
		}
		// 下拉框
		form.find('select').each(function() {
			// 做个判断，防止重复绑定
			if (!$(this).data('select')) {
				$(this).selectMatch();
			}
		});

		// 暴露的元素
		this.el = {
			form: elForm,
			submit: btnSubmitReal,
			button: btnSubmit
		};

		this.option = {
			callback: optionCallback,
			validate: optionValidate
		};

		// 绑定表单验证
		this.validate = new Validate(form, function() {
			// 验证成功之后
			if (!optionCallback.avoidSend || !optionCallback.avoidSend()) { 
				self.ajax();
			}
		}, optionValidate);

		return this;
	}

	Form.prototype.ajax = function() {
		// 回调
		var optionCallback = this.option.callback;
		// 元素
		var form = this.el.form,
			button = this.el.button,
			submit = this.el.submit;
			
		// 提交数据
		// 1. 菊花转起来
		button.loading();
		// 2. 提交按钮禁用
		submit.attr(DISABLED, DISABLED);
		// 3. 请求走起来
		$.ajax({
			url: form.attr('action'),
			data: form.serialize(),
			type: form.attr('method'),
			dataType: 'json',
			success: function(json) {
				if (json.error == 0) {
					// 下一步
					optionCallback.success.call(form, json);
				} else {
					$.lightTip.error(json.msg || '您的操作没有成功，你可以稍后重试。');
					// 回调
					if ($.isFunction(optionCallback.error)) {
						optionCallback.error.apply(form, json);
					}
				}
			},
			error: function() {
				$.lightTip.error('网络异常，刚才的操作没有成功，您可以稍后重试。');
				// 回调
				if ($.isFunction(optionCallback.error)) {
					optionCallback.error.apply(form, arguments);
				}
			},
			complete: function() {
				// 菊花关闭
				button.unloading();
				// 表单恢复提交
				submit.removeAttr(DISABLED);
				// 回调
				if ($.isFunction(optionCallback.complete)) {
					optionCallback.complete.apply(form, arguments);
				}
			}
		});
	};

	Form.prototype.submit = function() {		
		this.el.form.trigger('submit');
		return this;
	}

	return Form;
}));