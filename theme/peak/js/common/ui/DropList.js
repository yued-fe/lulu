/**
 * @DropList.js
 * @author xinxuzhang
 * @version
 * Created: 15-06-30
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
            window.console.error('need Drop.js');
        }

        return {};
    }


    // 一些变量
    var prefixDropList = 'ui-droplist-';
    var SELECTED = 'selected';
    var DISABLED = 'disabled';

    // 支持jQuery调用的语法处理
    $.fn.dropList = function (data, options) {
        return $(this).each(function() {
            var dropList = $(this).data('dropList');
            if (!dropList) {
                $(this).data('dropList', new DropList($(this), data, options));
            }
        });
    };

    /**
     * 下拉列表
    * @trigger 触发下拉的按钮元素
    * @data

    * 也可以是Function函数，表示数据是动态呈现的
     * @param {Object} trigger         jQuery包装器元素
     * @param {Array|Function} data
     *     下拉列表数据，数组，例如：
            [{
                id: 1,
                value: '所有评论',
                selected: true
            }, {
                id: 2,
                value: '未审核评论',
                disabled: true
            }, {
                id: 3,
                value: '通过评论'
            }]
            也可以是Function函数，表示数据是动态呈现的。
     * @param {Object} options          可选参数
     */
    var DropList = function(trigger, data, options) {
        var defaults = {
            // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏。
            eventType: 'click',
            offsets: {
                x: 0,
                y: 0
            },
            position: '4-1',
            selector: '',
            width: '',
            onShow: $.noop,
            onHide: $.noop,
            // this为当前点击的列表元素，支持两个参数，第一个参数为列表元素对应的数据(纯对象)，第二个是当前实例对象
            onSelect: $.noop
        };

        var params = $.extend({}, defaults, options || {});

        // 列表元素
        var target = $('<div></div>').addClass(prefixDropList + 'x').css('width', params.width).attr({
            role: 'listbox'
        });

        if (trigger.length == 0) {
            return;
        }

        // 下拉三角
        var arrow = trigger.find('.' + prefixDropList + 'arrow');

        // 下拉三角元素的HTML代码
        var htmlArrow = arrow.length ? arrow.get(0).outerHTML : '';

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
            var hasSelected = false;
            var matchIndex = -1;
            // 遍历数据
            $.each(data, function(index, obj) {
                if (obj.selected) {
                    trigger.html(obj.value + htmlArrow);
                    hasSelected = true;
                }
                if ($.trim(obj.value) == htmlLeft) {
                    matchIndex = index;
                }
            });

            // 选中项标示
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
                if (obj[SELECTED]) {
                    clSelected = ' ' + SELECTED;
                }

                // 禁用态和非禁用使用标签区分
                if (obj[DISABLED] != true) {
                    html = html + '<a href="' + (obj.href || 'javascript:') + '" class="' + prefixDropList + 'li' + clSelected + '" data-index="' + index + '" role="option" aria-selected="' + (obj[SELECTED] || 'false') + '" data-target="' + target.attr('id') + '">' + obj.value + '</a>';
                } else {
                    html = html + '<span class="' + prefixDropList + 'li">' + obj.value + '</span>';
                }
            });

            return html;
        };

        // 下拉面板
        trigger.drop(target, {
            eventType: params.eventType,
            offsets: params.offsets,
            selector: params.selector,
            position: params.position,
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
                if ($.isArray(data) && /^javas/.test($(this).attr('href'))) {
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
