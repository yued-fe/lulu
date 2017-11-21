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
        var Drop = require('common/ui/Drop');
    } else if (!$().drop) {
        if (window.console) {
            window.console.error('need Drop.js');
        }

        return {};
    }

    Drop = Drop || window.Drop;

    // 一些变量
    var prefixGlobal = 'ui-';
    var joiner = '-';
    var prefixDropPanel = 'ui-dropanel-';
    // var SELECTED = 'selected';
    // var DISABLED = 'disabled';

    // 关闭SVG
    var svg = window.addEventListener ? '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M116.152,99.999l36.482-36.486c2.881-2.881,2.881-7.54,0-10.42 l-5.215-5.215c-2.871-2.881-7.539-2.881-10.42,0l-36.484,36.484L64.031,47.877c-2.881-2.881-7.549-2.881-10.43,0l-5.205,5.215 c-2.881,2.881-2.881,7.54,0,10.42l36.482,36.486l-36.482,36.482c-2.881,2.881-2.881,7.549,0,10.43l5.205,5.215 c2.881,2.871,7.549,2.871,10.43,0l36.484-36.488L137,152.126c2.881,2.871,7.549,2.871,10.42,0l5.215-5.215 c2.881-2.881,2.881-7.549,0-10.43L116.152,99.999z"/></svg>' : '';

    // 支持jQuery包装器调用
    $.fn.dropPanel = function (options) {
        return $(this).each(function() {
            var dropPanel = $(this).data('dropPanel');
            if (!dropPanel) {
                $(this).data('dropPanel', new DropPanel($(this), options));
            }
        });
    };

    /*
    * 下拉面板
    * @param {Object} trigger 触发下拉的按钮元素
    * @param {Object} option  面板数据以及下拉参数，例如：
    *｛
    *    title: '删除评论',
    *    content: '删除后，您的粉丝在文章中将无法看到该评论。',
    *    buttons: [{}, {}]
    * ｝
     */
    var DropPanel = function(trigger, options) {
        var defaults = {
            title: '',
            content: '',
            buttons: [{}, {}],
            width: 'auto',
            eventType: 'click',
            selector: '',
            offsets: {
                x: 0,
                y: 0
            },
            position: '4-1',
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
            href: 'javascript:;',
            role: 'button',
            'aria-label': '关闭'
        }).html(svg).addClass(prefixDropPanel + 'close');

        el.content = $('<div></div>').addClass(prefixDropPanel + 'content').html(params.content);
        // footer
        el.footer = $('<div></div>').addClass(prefixDropPanel + 'footer');
        // 按钮
        $.each(params.buttons, function(i, btn) {
            // 避免btn为null等值报错
            btn = btn || {};

            // 按钮的默认参数
            var type = i ? (btn.type || '') : (btn.type || 'warning');
            var value = i ? (btn.value || '取消') : (btn.value || '确定');
            var events = btn.events || {
                click: function() {
                    drop.hide();
                }
            };

            if ($.isFunction(events)) {
                events = {
                    click: events
                };
            }

            // 按钮的类名值
            var cl = prefixGlobal + 'button';
            if (type) {
                cl = cl + ' ' + cl + joiner + type;
            }

            if (!btn['for']) {
                el['button' + i] = $('<a href="javascript:" class="' + cl + '" role="button">' + value + '</a>');
            } else {
                el['button' + i] = $('<label for="' + btn['for'] + '" class="' + cl + '" role="button">' + value + '</label>');
            }

            $.each(events, function (eventType, fn) {
                el['button' + i].bind(eventType, {
                    drop: drop
                }, fn);
            });

            el.footer.append(el['button' + i]);
        });

        // 组装
        target.append(el.title).append(el.close).append(el.content).append(el.footer);

        // 基于drop的面板显隐效果
        var drop = new Drop(trigger, target, {
            eventType: params.eventType,
            offsets: params.offsets,
            // 实现点击或hover事件的委托实现
            selector: params.selector,
            position: params.position,
            onShow: params.onShow,
            onHide: params.onHide
        });

        // 事件
        el.close.click(function() {
            drop.hide();
        });
        // 按钮
        $.each(params.buttons, function(i, btn) {
            // 避免btn为null等值报错
            btn = btn || {};

            var events = btn.events || {
                click: function() {
                    drop.hide();
                }
            };

            if ($.isFunction(events)) {
                events = {
                    click: events
                };
            }

            // 事件遍历
            $.each(events, function (eventType, fn) {
                el['button' + i].bind(eventType, {
                    drop: drop
                }, fn);
            });
        });

        // 元素暴露
        for (var key in el) {
            drop.el[key] = el[key];
        }

        return drop;
    };

    return DropPanel;
}));
