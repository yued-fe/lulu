/**
 * @Pagination.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-26
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

    /**
     * 分页实例方法
     * @param {Object} container 显示分页的容器元素
     * @param {Object} options   可选参数
     */
    var Pagination = function(container, options) {
        container = container || $();
        options = options || {};

        var page = this;

        // 默认参数
        var defaults = {
            // 总的数据量
            length: 0,
            // 当前的页码
            current: 1,
            // 每页显示的数目
            every: 15,
            // short 长分页还是短分页
            mode: 'long',

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

            var className = this.className;
            var elClicked;

            // 分页刷新
            page.show();
            // 点击回调
            if (/prev/.test(className)) {
                elClicked = container.find('.ui-page-prev');
            } else if (/next/.test(className)) {
                elClicked = container.find('.ui-page-next');
            } else {
                elClicked = container.find('.ui-page-current');
            }
            // 由于HTML刷新，重新获取点击的元素
            var eleClicked = elClicked[0];

            // aria以及键盘访问
            if (eleClicked) {
                eleClicked.focus();

                if (window.isKeyEvent === false) {
                    eleClicked.blur();
                }
            }

            params.onClick.call(eleClicked, page, current);

            if (/^javascript/.test(this.href)) {
                event.preventDefault();
            }
        });

        this.show();

        return this;
    };

    // IE9+ 前后分页图标使用内联SVG, 以便支持retina屏幕
    var svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"/></svg>';

    /**
     * 创建分页字符串的方法
     * @param  {Object} num  分页相关的数据对象
     * @param  {String} mode 分页的类型
     * @return {String}      返回拼接好的HTML字符串
     */
    Pagination.prototype.create = function(num, mode) {
        num = num || {};
        var length = num.length || 0;
        var current = num.current || 1;
        var every = num.every || 1;
        mode = mode || 'long';

        // a标签的href地址
        var href = this.href || 'javascript:';
        // 获得href的方法
        var fnHref = function(index) {
            if (typeof href == 'string') {
                return href;
            } else if (typeof href == 'function') {
                return href(index);
            }
        };

        // ui类名
        var CL = 'ui-page';
        var prefixPage = CL + '-';

        // 计算总页数
        var total = Math.ceil(length / every) || 1;

        var html = '';

        // 一些类名
        var clPrev = [CL, prefixPage + 'prev'].join(' ');
        var clNext = [CL, prefixPage + 'next'].join(' ');
        var clEll = [CL, prefixPage + 'ellipsis'].join(' ');
        var clText = [CL, prefixPage + 'text'].join(' ');
        var clCurrent = [CL, prefixPage + 'current'].join(' ');


        // 1. 首先是通用的前后翻页
        if (current > 1) {
            html = html + '<a href="' +  fnHref(current - 1) + '" class="' +  clPrev + '" data-page="' +  (current - 1) + '" aria-label="上一页，当前第' +  current + '页">' +  svg + '</a>';
        } else {
            // 当前是第一页，自然不能往前翻页
            html = html + '<span class="' +  clPrev + '">' +  svg + '</span>';
        }

        // 2. 中间部分
        // 短分页和长分页
        var visible = 6;
        if (mode == 'long') {
            var long = function(start) {
                if (start == current) {
                    html = html + '<span class="' +  clCurrent + '" aria-label="第' +  start + '页，共' +  total + '页" aria-selected="true" role="option">' +  start + '</span>';
                } else {
                    html = html + '<a href="' +  fnHref(start) + '" class="' +  CL + '" data-page="' +  start + '" aria-label="第' +  start + '页，共' +  total + '页">' +  start + '</a>';
                }
            };


            /**
             * 为了保证体验，在分页数量大的时候，要保证总条目数为7个
                假设页码总数20，规则如下
                当前是1: 则 1-5,... 20
                 2: 则 1-5,...,20
                 3: 则 1-5,...,20
                 4: 则 1-5,...,20
                 5: 则 1...456,...,20
                 ...

                 参见下面的else if的处理
             */
            if (total <= visible) {
                // 如果页面不大于6个，全部显示
                for (var start = 1; start <= total; start++) {
                    long(start);
                }
            } else if (current < total * 0.5 && current < visible - 1) {
                // 至少保证current的前后有数据
                if (current < visible - 1) {
                    for (start = 1; start < visible; start++) {
                        long(start);
                    }
                }
                html = html + '<span class="' +  clEll + '">...</span>';
                long(total);
            } else if (current > total * 0.5 && current > total - visible + 2) {
                long(1);
                html = html + '<span class="' +  clEll + '">...</span>';
                for (start = total - visible + 2; start <= total; start++) {
                    long(start);
                }
            } else {
                // 前后两处打点
                long(1);
                html = html + '<span class="' +  clEll + '">...</span>';
                long(current - 1);
                long(current);
                long(current + 1);
                html = html + '<span class="' +  clEll + '">...</span>';
                long(total);
            }

        } else if (mode == 'short') {
            html = html + '<span class="' +  clText + '" aria-label="第' +  current + '页，共' +  total + '页" role="option">' +  [current, total].join('/') + '</span>';
        }

        // 3. 往后翻页
        if (current < total) {
            html = html + '<a href="' +  fnHref(current + 1) + '" class="' +  clNext + '" data-page="' +  (current + 1) + '" aria-label="下一页，当前第' +  current + '页">' +  svg + '</a>';
        } else {
            html = html + '<span class="' +  clNext + '">' +  svg + '</span>';
        }

        return '<div class="' +  prefixPage + 'x">' + html + '</div>';
    };

    /**
     * 分页显示（也是刷新方法）
     * @return {Object} 返回当前实例
     */
    Pagination.prototype.show = function() {
        // 数据合法性处理
        var num = this.num;
        num.length = Math.max(num.length, 0);
        num.every = Math.max(num.every, 1);

        // current合法性处理
        var maxCurrent = Math.ceil(num.length / num.every);
        if (num.current > maxCurrent) {
            num.current = maxCurrent;
        }

        num.current = Math.max(num.current, 1);

        if (this.el && this.el.container && this.el.container.length) {
            // 分页刷新
            this.el.container.html(this.create(num, this.mode));
        }

        return this;
    };

    return Pagination;
}));
