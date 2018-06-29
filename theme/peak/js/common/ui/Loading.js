/**
 * @Loading.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-23
 * @Log: 2017-09-19 loading类名的添加基于标签，而非类名
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Loading = factory();
    }
}(this, function () {
    var joiner = '-';
    var CL = 'ui-loading';
    var CL_ICON = CL + joiner + 'icon';
    var CL_BUTTON_LOADING = 'loading';

    /**
     * 是否正在loading
     * 避免在业务代码中暴露类名
     * 1. 容器loading
     * 2. 按钮loading
     */

    $.fn.isLoading = function() {
        var container = $(this).eq(0);
        // 如果是label或者focusable元素
        if (container.is('a,label,input,button')) {
            return container.hasClass(CL_BUTTON_LOADING);
        }
        // 作为容器处理
        // 通过尺寸判断loading是否显示
        var icon = container.find('.' + CL_ICON);
        if (icon.length && icon.is(':visible')) {
            return true;
        }

        return false;
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

            if (container.is('a,label,input,button')) {
                container.addClass(CL_BUTTON_LOADING);
            } else {
                container.data('loading', new Loading(container, options));
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

            if (container.is('a,label,input,button')) {
                container.removeClass(CL_BUTTON_LOADING);

                return;
            }

            // IE10+的游戏
            if (typeof history.pushState == 'function') {
                if (time > 0) {
                    // 获得并存储当前的高度值
                    var height = container.height();
                    // var minHeight = container.css('min-height');
                    // 以下行为瞬间执行，用户无感知
                    container.css({
                        // 高度设为auto, 用来获得此时的真实高度
                        height: 'auto',
                        webkitTransition: 'none',
                        // iOS safari下，'auto'也会触发transition过渡，因此，还原成'none'
                        transition: 'none',
                        // 动画自然
                        overflow: 'hidden'
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

    /**
     * 显示loading态的实例方法
     * @param {Object} el      jQuery元素，可以是容器，也可以是按钮等元素
     * @param {Object} options 可选参数
     */
    var Loading = function(el, options) {
        var defaults = {
            // 是否是蓝色背景
            primary: false,
            // 是否是小菊花
            small: false,
            // loading是当前容器，还是append在当前容器中
            create: false
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
        var container = el;
        var loading = null;
        var icon = null;

        // 一般情况下，我们会直接在原始HTML就显示loading相关的HTML代码
        // 此时，我们其实什么都可以不用做
        // 我们只需要关心容器内没有loading的情况

        // 当然，也存在需要append创建的情况，如table中的loading等
        this._create = function() {
            var container = this.el.container;
            loading = container.find('.' + CL), icon = container.find('.' + CL_ICON);

            if (params.create == true && loading.length == 0) {
                // 如果是ol,ul元素，则loading元素使用li标签
                if (container.is('ul,ol')) {
                    loading = $('<li></li>').addClass(CL);
                } else {
                    loading = $('<div></div>').addClass(CL);
                }
                container.append(loading);
            } else if (params.create == false) {
                loading = container;
            }

            if (icon.length == 0) {
                // 生成loading元素
                icon = (params.small ? $('<s></s>') : $('<i></i>')).addClass(CL_ICON);

                // 容器状态
                loading.empty().addClass(CL).append(icon);

                // 是否是蓝色背景
                if (params.primary) {
                    loading.addClass(CL + joiner + 'primary') ;
                }
                // ↑ 至此 loading效果已经出现
            }

            icon.attr({
                'aria-busy': 'true',
                'aria-label': '正在加载中'
            });

            // 标记position状态，避免冲突
            container.attr('data-position', container.css('position'));

            this.el.loading = loading;
            this.el.icon = icon;
        };

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
        var el = this.el;
        var container = el.container;
        var loading = el.loading;

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
        var el = this.el;
        var container = el.container;
        var loading = el.loading;
        var icon = el.icon;

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
        var el = this.el;
        var container = el.container;

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
}));
