/**
 * @Range.js
 * @author zhangxinxu
 * @version
 * Created: 15-07-20
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Range = factory();
    }
}(this, function (require) {
    if (typeof require == 'function') {
        require('common/ui/Tips');
    } else if (!$().tips) {
        if (window.console) {
            window.console.error('need Tips.js');
        }

        return {};
    }

    /**
     * 基于HTML原生range范围选择框的模拟选择框效果
     * 兼容IE7+
     * min/max/step
     */

    var CL = 'ui-range';
    var rangePrefix = CL + '-';

    // jQuery链式调用支持
    $.fn.range = function(options) {
        return $(this).each(function() {
            if (!$(this).data('range')) {
                $(this).data('range', new Range($(this), options));
            }
        });
    };

    /**
     * range滑块效果
     * @param {Object} el      原生的type为range的input元素
     * @param {Object} options 可选参数
     */
    var Range = function(el, options) {
        var self = this;

        // el就是type类型为range的input元素
        var defaults = {
            reverse: false,
            tips: function(value) {
                return value;
            }
        };

        var params = $.extend({}, defaults, options || {});

        // 一些属性值获取
        var min = el.attr('min') || 0;
        var max = el.attr('max') || 100;
        var step = el.attr('step') || 1;

        // 一些元素的创建
        // 容器元素有一个类名直接取自input元素，宽度啊，margin什么的，直接就交给CSS了
        var container = $('<div></div>').attr('class', el.attr('class')).addClass(CL);
        // 轨道元素
        var track = $('<div></div>').addClass(rangePrefix + 'track');
        // 中间的圈圈
        var thumb = $('<a></a>').addClass(rangePrefix + 'thumb').attr({
            href: 'javascript:',
            'aria-valuenow': el.val(),
            'aria-valuemax': max,
            'aria-valuemin': min,
            role: 'slider',
            draggable: 'false'
        });

        // 前置插入
        el.before(container);
        // 如果元素没宽度，则使用el计算的宽度
        if (container.width() == 0) {
            container.width(el.width());
        }
        // 组装
        track.append(thumb);
        container.append(track);

        // 事件
        container.click(function(event) {
            var target = event && event.target;
            if (target && target != thumb.get(0)) {
                // 根据点击的位置在圈圈的左侧还是右侧判断选择值的增减
                var distance = event.clientX - (thumb.offset().left - $(window).scrollLeft()) - thumb.width() / 2;

                // 根据点击的距离，判断值
                self.value(el.val() * 1 + (max - min) * distance / $(this).width());
            }
        });

        // 键盘支持，左右
        thumb.on('keydown', function (event) {
            var value = el.val() * 1;
            if (event.keyCode == 37 || event.keyCode == 39) {
                event.preventDefault();

                if (event.keyCode == 37) {
                    // left
                    value = Math.max(min, value - step);
                } else if (event.keyCode == 39) {
                    // right
                    value = Math.min(max, value + step * 1);
                }
                self.value(value);
            }
        });

        // 拖动
        var posThumb = {};
        thumb.mousedown(function(event) {
            posThumb.x = event.clientX;
            posThumb.value = el.val() * 1;

            // 黑色提示
            if ($.isFunction(params.tips)) {
                if (self.tips) {
                    self.tips.show(params.tips.call(el, posThumb.value));
                } else {
                    thumb.tips({
                        eventType: 'null',
                        content: params.tips(posThumb.value)
                    });
                    self.tips = thumb.data('tips');
                }
            }

            $(this).addClass('active');
        });

        if (params.reverse) {
            thumb.addClass('reverse');
        }

        $(document).mousemove(function(event) {
            if (typeof posThumb.x == 'number') {
                var distance = event.clientX - posThumb.x;

                // 根据移动的距离，判断值
                self.value(posThumb.value + (max - min) * distance / container.width());

                if (self.tips) {
                    self.tips.show(params.tips.call(el, el.val()));
                }

                event.preventDefault();
            }
        });
        $(document).mouseup(function() {
            posThumb.x = null;
            posThumb.value = null;
            thumb.removeClass('active');
            if (self.tips) {
                self.tips.hide();
            }
        });

        // 全局
        this.num = {
            min: +min,
            max: +max,
            step: +step
        };

        this.el = {
            input: el,
            container: container,
            track: track,
            thumb: thumb
        };

        this.obj = {};

        // 初始化
        this.value();

        return this;
    };

    /**
     * range输入框赋值与定位
     * @param  {String} value 需要赋予的值
     * @return {Object}       返回当前实例对象
     */
    Range.prototype.value = function(value) {
        var input = this.el.input;
        var oldvalue = input.val();
        // 一些值
        var max = this.num.max;
        var min = this.num.min;
        var step = this.num.step;

        if (!value && value !== 0) {
            oldvalue = value;
            value = $.trim(input.val());
        }
        // 区域范围判断以及值是否合法的判断
        if (value > max || (max - value) < step / 2) {
            value = max;
        } else if (value == '' || value < min || (value - min) < step / 2) {
            value = min;
        } else {
            // 寻找最近的合法value值
            value = min + Math.round((value - min) / step) * step;
        }

        input.val(value);

        this.position();

        if (value != oldvalue) {
            input.trigger('change');
        }

        return this;

    };

    /**
     * 根据range的值确定UI滑块的位置
     * @return {Object}       返回当前实例对象
     */
    Range.prototype.position = function() {
        var input = this.el.input;
        var value = input.val();

        // 一些值
        var max = this.num.max;
        var min = this.num.min;
        // var step = this.num.step;
        // 计算百分比
        this.el.track.css('borderLeftWidth', this.el.container.width() * (value - min) / (max - min));
        // aria同步
        this.el.thumb.attr('aria-valuenow', value);

        return this;
    };

    return Range;
}));
