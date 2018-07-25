/**
 * @Table.js
 * @author xunxuzhang
 * @version
 * Created: 15-06-28
 * Edited:  17-07-18 非模块化使用支持
**/

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Table = factory();
    }
}(this, function (require) {
    if (typeof require == 'function') {
        require('common/ui/Checkbox');
        var DropList = require('common/ui/DropList');
        var Pagination = require('common/ui/Pagination');
        // 黑色提示
        require('common/ui/Tips');
        // 加载动效
        require('common/ui/Loading');
    } else if (!$().dropList) {
        if (window.console) {
            window.console.error('need DropList.js');
        }
        return {};
    } else if (!$().pagination) {
        if (window.console) {
            window.console.error('need Pagination.js');
        }
        return {};
    } else if (!$().loading) {
        if (window.console) {
            window.console.error('need Loading.js');
        }
        return {};
    }

    DropList = DropList || window.DropList;
    Pagination = Pagination || window.Pagination;

    /**
     * 项目表格组件
     * @使用示例
     *  new Table($('#table'), {});
     */

    var LOADING = 'loading';

    var CHECKED = 'checked';
    var DISABLED = 'disabled';
    var SELECTED = 'selected';
    var selector = '[type=checkbox]';

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
        if (!el || !el.length) {
            return this;
        }

        var defaultPageOptions = {
            // 总数据量
            length: 0,
            // 每页显示数目
            every: 15,
            // 当前的页数
            current: 1,

            // 与后台交互时候UI分页需要的参数和后台分页参数对应关系
            // 下面注释的是起点个人中心的接口对应关系
            // 其中key表示后台分页数据在那个接口名称下，例如，下面注释内容表示的JSON数据结构是：
            // {
            //     "code": 0,
            //     "data": {
            //         "pageInfo": {
            //             "pageIndex": 1,
            //             "pageSize": 20,
            //             "pageMax": 6,
            //             "totalCount": 113
            //          }
            //     }
            // }
            // keyMap: {
            //     key: 'pageInfo',
            //     length: 'totalCount',
            //     every: 'pageSize',
            //     current: 'pageIndex'
            // }
            // 下面这里未注释的是默认设定
            keyMap: {
                key: '',
                length: 'total',
                every: 'every',
                current: 'current'
            }
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
        var container, table, size, empty, total, every, data, page;
        var loading = $();
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
            // 如果不是第一td中的checkbox，忽略
            if ($(this).parents('tr').find(':first-child ' + selector)[0] !== this) {
                return;
            }

            var tdCheckbox = table.find('td:first-child ' + selector);
            var isAllChecked = false;
            var isAllUnchecked = false;
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
                $(this).parents('tr')[$(this).prop(CHECKED) ? 'addClass' : 'removeClass'](SELECTED);
            });

            // 回调
            params.onCheck.call(this, isAllChecked, isAllUnchecked, table);
        });

        // 点击列表，只有不是a元素或者是复选框本事，选中当前复选框
        table.on('click', function(event) {
            var target = event.target;
            var checkbox = null;

            if (target && /^a|input|label|th$/i.test(target.tagName) == false) {
                checkbox = $(target).parents('tr').find('td:first ' + selector);
                if (checkbox.length && checkbox.prop(DISABLED) == false) {
                    checkbox.trigger('click');
                }
            }
        });

        // 其他些事件
        $.each(params.events, function(key, value) {
            var arrSelectorType = key.split(':');
            if (arrSelectorType.length == 2 && $.isFunction(value)) {
                table.delegate(arrSelectorType[0], arrSelectorType[1], value);
            }
        });

        // 切换每页数目的dropList
        // 求得当前选中的分页数
        // 优先本地存储
        var storeId = table.attr('id');
        var currentEvery = params.pageOptions.every;
        if (storeId && window.localStorage && localStorage[storeId] && every.length) {
            currentEvery = localStorage[storeId];
            self.num.every = currentEvery;
        }
        // 赋值
        every.html(currentEvery);

        this.pageList = new DropList(every.parent(), $.map(params.pageList, function(number) {
            return {
                value: '<span class="' + CL.every + '">' + number + '</span>'
            };
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
        if (table.find('tbody').html() == '') {
            this.ajax();
        } else {
            this.page();
        }
    };

    Table.prototype.ajax = function(options) {
        options = options || {};
        var self = this;

        // 防止连续请求
        if (self.ajaxing == true) return this;

        // 一些存储在实例对象上的数据
        var el = this.el;
        var callback = this.callback;
        var num = this.num;

        // 列表容器元素
        var tbody = el.table.find('tbody');

        // ajax请求参数
        var ajaxParams = $.extend({
            dataType: 'json'
        }, this.ajaxOptions, options);

        // ajax地址是必需项
        if (!ajaxParams.url) return this;

        // ajax的data数据和几个回调走的是合并策略
        var data = options.data || {};
        var dataOptions = {};

        if ($.isFunction(this.ajaxOptions.data)) {
            dataOptions = this.ajaxOptions.data() || {};
        }

        // 发送给后台的分页数据的键值是
        var dataPage = {};
        var keyMap = num.keyMap;

        dataPage[keyMap['current']] = num.current;
        dataPage[keyMap['every']] = num.every;

        // current和every
        ajaxParams.data = $.extend({}, dataPage, dataOptions, data);

        num.current = ajaxParams.data[keyMap['current']];
        num.every = ajaxParams.data[keyMap['every']];

        // 回调额合并
        var success = ajaxParams.success;
        var error = ajaxParams.error;
        var complete = ajaxParams.complete;

        // ajax成功的处理
        ajaxParams.success = function(json) {
            // 出错处理
            // 0认为是成功
            // 关键字支持code或者error
            // { code: 0 } 或 { error: 0 } 都认为成功
            if ((json.hasOwnProperty('code') && json.code !== 0) || (json.hasOwnProperty('error') && json.error !== 0)) {
                ajaxParams.error(data.msg || '返回数据出现异常，请稍后重试');

                return;
            }

            var html = callback.parse(json);

            // 如果解析后无数据，显示空提示信息
            tbody.html(html || '');

            if (!$.trim(html)) {
                el.empty.show();
            }

            // 获得后端返回的分页总数
            var jsonKey = keyMap.key;
            // 总数目
            var total;

            if (jsonKey) {
                total = json.data[jsonKey][keyMap['length']];
            } else {
                total = json.data[keyMap['length']];
            }

            // 修改总数值并显示
            if (total || total == 0) {
                el.total.html(total);
                self.num.length = total;
            } else {
                // 如果ajax返回的没有列表总数值，使用之前的值
                // total = num.length;
            }

            // 左侧切换分页数目元素显示
            el.data.show();

            self.page();

            // tips效果
            el.table.find('.ui-tips').tips();

            if ($.isFunction(success)) {
                success(json);
            }
        };
        // ajax发生错误的处理
        ajaxParams.error = function(xhr, status) {
            var elError = el.size.find('.' + CL.error);
            var msg = '';
            if (typeof xhr == 'string') {
                msg = xhr;
            }
            if (elError.size()) {
                elError.show();
            } else {
                elError = $('<div class="' + CL.error + '">网络异常，数据没有获取成功，您可以稍后重试！</div>');
                el.size.append(elError);
            }
            if (msg) {
                elError.html(msg);
            }
            if ($.isFunction(error) && !msg) {
                error(xhr, status);
            }
        };
        // ajax完成的处理
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
        };

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
            self.ajaxing = true;
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

        return this;
    };

    Table.prototype.page = function (total) {
        var self = this;
        var el = self.el;
        var num = self.num;
        // 显示分页
        if (self.pagination) {
            self.pagination.num = num;
            self.pagination.show();
        } else {
            self.pagination = new Pagination(el.page, {
                length: num.length,
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
    },

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
    };

    return Table;
}));
