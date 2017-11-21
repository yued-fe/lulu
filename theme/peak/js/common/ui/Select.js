/**
 * @Select.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-18
 * @edit:    07-06-15  rewrite
**/

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Select = factory();
    }
}(this, function (require) {

    if (typeof require == 'function') {
        require('common/ui/Enhance');
    }

    /**
     * 模拟下拉框效果
     * 针对所有浏览器进行处理
     * 基于原生的<select>元素生成
     *
     */

    /*
     * 支持jQuery API调用
     * @example
     * $('select').selectMatch();
     * 如果不依赖seajs，则载入改JS就会页面所有下拉UI初始化
    */

    // 常量变量
    var SELECT = 'select';
    var SELECTED = 'selected';
    var DISABLED = 'disabled';
    var ACTIVE = 'active';
    var REVERSE = 'reverse';

    // 默认参数
    var prefix = 'ui-';

    // 通用前缀
    var PREFIX = prefix + SELECT;
    var joiner = prefix.replace(/[a-z]/gi, '');

    // 支持jQuery的包装器调用处理
    $.fn.selectMatch = function() {
        return $(this).each(function() {
            var sel = $(this);
            if (!sel.data('select')) {
                new Select(sel);
            } else {
                // 刷新
                sel.data('select').refresh();
            }
        });
    };

    /**
     * 基于原生下拉框生成的下拉组件
     * @param {Object} el 原生select元素
     */
    var Select = function (el) {
        if (!el) {
            if (window.console) {
                window.console.error('Select实例方法参数缺失');
            }

            return;
        }
        if (!el.size) {
            el = $(el);
        }
        var ele = el[0];

        // 构造元素
        // 1. 得到关联id
        var id = ele.id;
        if (!id) {
            id = ('id_' + Math.random()).replace('0.', '');
        }
        this.id = id;

        // 2. 创建下拉组合框元素
        var combobox = $('<div></div>').attr({
            role: 'combobox'
        });

        // 3. 创建下拉点击按钮元素
        var button = $('<a></a>').attr({
            href: 'javascript:',
            'data-target': id,
            // 下面3个aria无障碍访问需要
            role: 'button',
            'aria-expanded': 'false',
            'aria-owns': id
        }).addClass(PREFIX + joiner + 'button');

        // 4. 创建下拉列表元素
        var datalist = $('<div></div>').attr({
            id: id,
            // for aria
            role: 'listbox',
            'aria-expanded': 'true'
        }).addClass(PREFIX + joiner + 'datalist');

        // 5. 元素组装
        combobox.append(button).append(datalist);
        el.hide().after(combobox);

        // 暴露给其他方法
        this.el = {
            sel: el,
            combobox: combobox,
            button: button,
            datalist: datalist
        };

        // 刷新内容
        this.refresh();

        // 事件绑定
        this.events();

        // 存储
        el.data('select', this);
    };


    Select.prototype.events = function () {
        var self = this;
        // 各个元素
        var el = self.el;
        // 主要的几个元素
        var sel = el.sel;
        var combobox = el.combobox;
        var button = el.button;
        var datalist = el.datalist;

        // 点击按钮
        button.on('click', function () {
            if (sel.prop(DISABLED)) {
                return false;
            }

            // 显示与隐藏
            combobox.toggleClass(ACTIVE);

            if (combobox.hasClass(ACTIVE)) {
                // 边界判断
                var overflow = datalist.offset().top + datalist.outerHeight() > Math.max($(document.body).height(), $(window).height());
                combobox[overflow ? 'addClass' : 'removeClass'](REVERSE);
                // aria状态
                button.attr('aria-expanded', 'true');

                // 滚动与定位
                var arrData = combobox.data('scrollTop');
                var selected = datalist.find('.' + SELECTED);
                // 严格验证
                if (arrData && arrData[1] == selected.attr('data-index') && arrData[2] == selected.text()) {
                    datalist.scrollTop(arrData[0]);
                    // 重置
                    combobox.removeData('scrollTop');
                }
            } else {
                combobox.removeClass(REVERSE);
                // aria状态
                button.attr('aria-expanded', 'false');
            }
        });

        // 点击列表项
        datalist.on('click', 'a[data-index]', function() {
            var indexOption = $(this).attr('data-index');
            var scrollTop = datalist.scrollTop();
            // 下拉收起
            combobox.removeClass(ACTIVE);
            button.attr('aria-expanded', 'false');
            // 存储可能的滚动定位需要的数据
            combobox.data('scrollTop', [scrollTop, indexOption, $(this).text()]);
            // 修改下拉选中项
            sel.find('option')[indexOption][SELECTED] = true;
            // 更新下拉框
            self.refresh();
            // 回调处理
            sel.trigger('change');
            // focus
            button.focus().blur();
        });

        // 点击页面空白要隐藏
        $(document).mouseup(function(event) {
            var target = event.target;
            if (target && combobox.hasClass(ACTIVE) && combobox[0] !== target && combobox[0].contains(target) == false) {
                combobox.removeClass(ACTIVE).removeClass(REVERSE);
            }
        });
    };

    /* 把下拉元素变成数据，格式为：
     * [{
        html: '选项1',
        value: '1',
        selected: false,
        className: 'a'
     }, {
        html: '选项2',
        value: '2',
        selected: true,
        className: 'b'
     }]
    * @return 数组
    */
    Select.prototype.getData = function () {
        var self = this;
        var sel = self.el.sel;

        return sel.find('option').map(function () {
            var option = this;

            return {
                html: option.innerHTML,
                value: option.value,
                selected: option.selected,
                disabled: option.disabled,
                className: option.className
            };
        });
    };

    /**
     * 下拉刷新方法
     * @param  {Array} data 根据数组数据显示下拉内容
     * @return {Object}     返回当前实例对象
     */
    Select.prototype.refresh = function (data) {
        var self = this;
        // 实例id
        var id = self.id;
        // 各个元素
        var el = self.el;
        // 主要的几个元素
        var sel = el.sel;
        var combobox = el.combobox;
        var button = el.button;
        var datalist = el.datalist;

        // 获取当下下拉框的数据和状态
        data = data || self.getData();

        // 下拉组合框元素的UI和尺寸
        combobox.attr('class', $.trim(sel[0].className + ' ' + PREFIX)).width(sel.outerWidth());
        // 按钮元素中的文案
        button.html('<span class="' + PREFIX + joiner + 'text">' + (function () {
            var htmlSelected = '';
            $.each(data, function (i, obj) {
                if (obj.selected) {
                    htmlSelected = obj.html;
                }
            });

            return htmlSelected || data[0].html;
        })() + '</span><i class="' + PREFIX + joiner + 'icon" aria-hidden="true"></i>');
        // 列表内容的刷新
        datalist.html($.map(data, function (obj, index) {
            var arrCl = [PREFIX + joiner + 'datalist' + joiner + 'li', obj.className];

            if (obj[SELECTED]) {
                arrCl.push(SELECTED);
            }
            if (obj[DISABLED]) {
                arrCl.push(DISABLED);
            }

            return '<a href="javascript:" class="' + arrCl.join(' ') + '" data-index=' + index + ' data-target="' + id + '" role="option" aria-selected="' + obj[SELECTED] + '">' + obj.html + '</a>';
        }).join(''));

        return this;
    };

    return Select;
}));
