/**
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
