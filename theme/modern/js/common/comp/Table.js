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
