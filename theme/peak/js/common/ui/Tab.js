/**
 * @Tab.js
 * @author zhangxinxu
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
     *     callback: function() {}
     *  });

     * 或者包装器用法
     * $('#container > a').tab({
     *   callback: function() {}
     * });
     */

    var STATE = 'checked';

    $.fn.eqAttr = function(key) {
        key = key || 'data-rel';
        // 获得属性对应的值
        var value = $(this).attr(key);
        if (!value) return $();

        // 设置管理

        // 当作id来处理
        var target = $('#' + value);
        if (target.length) {
            return target;
        }
        // 否则当作className处理

        return $('.' + value);
    };

    // 根据属性获得对应的元素
    $.fn.tab = function(options) {
        if (!$(this).data('tab')) {
            $(this).data('tab', new Tab($(this), options));
        }
    };

    $.queryString = function(key, value, str) {
        // 有则替换，无则加勉
        var href = (str || location.href).split('#')[0];
        var root = '';
        var hash = location.hash;
        // 查询数组
        var arrQuery = href.split('?');
        var arrMap = [];
        if (arrQuery.length > 1) {
            if (arrQuery[1] != '') {
                arrMap = $.grep(arrQuery[1].split('&'), function(query) {
                    return query.split('=')[0] != key;
                });
            }
            root = arrQuery[0] + '?' + arrMap.join('&') + '&';
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
            // 'auto' 表示根据选项卡上的状态类名，如.checked获取index值
            index: 'auto',
            // 是否使用HTML5 history在URL上标记当前选项卡位置，for IE10+
            history: true,
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
            $(this).data('index', index).attr({
                role: 'tab',
                'aria-selected': 'false'
            });

            $(this).eqAttr().attr('role', 'tabpanel');
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
                    // 一开始加载的时候回调也能正常进行
                    params.callback.call(this, this, $(), $(), $());
                }

                return;
            }

            // 选项卡样式变变变
            // 类名变化
            var targetTab = $(this).addClass(STATE);
            // 要移除类名的选项卡
            var resetTab = el.eq(indexTab).removeClass(STATE);

            // 面板的变化
            var targetPanel = targetTab.eqAttr().addClass(STATE);
            var resetPanel = resetTab.eqAttr().removeClass(STATE);

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
            el.eq(indexTab).attr({
                'aria-selected': 'true'
            }).trigger(params.eventType);
        });

        // 暴露的属性或方法，供外部调用
        this.el = {
            tab: el
        };
        this.params = params;

        if (el.length > 1 && el[0].parentNode == el[1].parentNode) {
            el.parent().attr('role', 'tablist');
        }
    };

    return Tab;
}));
