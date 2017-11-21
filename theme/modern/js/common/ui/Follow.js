/**
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
}));