/**
 * @Enhance.js
 * @author zhangxinxu
 * @version
 * @Created: 17-06-14
 * @descrption 对整个组件体系进行功能增强，理论上不调用本JS，基本功能不影响，但没有理由不引用本JS
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Refresh = factory();
    }
}(this, function (require) {
    // require
    if (typeof require == 'function') {
        require('common/ui/Keyboard');
    } else if (!window.Keyboard && window.console) {
        window.console.warn('you may forget include Keyboard.js');
    }

    /**
     * 动态最大zIndex值
     * @return 返回当前jQuery元素
     */
    $.fn.zIndex = function () {
        return $(this).each(function() {
            var target = this;
            var zIndex = $(this).css('z-index');
            var newZIndex = 19;

            // 只对<body>子元素进行层级最大化计算处理
            $('body').children().each(function() {
                var ele = this;
                var el = $(ele);
                var z = el.css('zIndex') * 1;

                if (z && ele !== target[0] && el.css('display') !== 'none' && el.width() * el.height() > 0) {
                    newZIndex = Math.max(z, newZIndex);
                }
            });

            if (zIndex != newZIndex) {
                $(this).css('z-index', newZIndex);
            }
        });
    };

    /**
     * UI组件刷新使用更好记的统一的API
     * @return 返回当前jQuery元素
     */
    $.fn.refresh = function () {
        return $(this).each(function() {
            var el = $(this);
            // 如果是下拉框
            if (el.is('select') && el.selectMatch) {
                el.selectMatch();
                // 如果是单复选框
            } else if (/^radio|checkbox$/i.test(el.attr('type')) && el.propMatch) {
                el.propMatch();
            } else if (el.attr('placeholder') && el.placeholder) {
                // 占位符
                el.placeholder();
            } else if (el.data('pagination')) {
                // 占位符
                el.data('pagination').show();
            }
        });
    };

    /**
     * 按钮disabled和enabled控制
     * @return 返回当前jQuery元素
     */
    $.fn.disabled = function () {
        return $(this).each(function() {
            var el = $(this);
            // 如果是下拉框
            if (el.is(':input')) {
                el.attr('disabled', 'disabled');
            } else if (el.is('a')) {
                el.data('href', el.attr('href'));
                el.removeAttr('href');
                el.attr('aria-disabled', 'true');
            } else {
                // span, div这类标签
                var tabindex = el.attr('tabindex');
                if (tabindex) {
                    // 存储设置的tabindex值
                    el.data('tabindex', tabindex);
                    el.removeAttr('tabindex');
                }
            }
            el.addClass('disabled');
        });
    };

    $.fn.enabled = function () {
        return $(this).each(function() {
            var el = $(this);
            // 如果是下拉框
            if (el.is(':input')) {
                el.removeAttr('disabled');
            } else if (el.is('a')) {
                el.attr('href', el.data('href') || 'javascript:');
                el.attr('aria-disabled', 'false');
            } else {
                var tabindex = el.data('tabindex');
                if (tabindex) {
                    el.attr('tabindex', tabindex);
                }
            }
            el.removeClass('disabled');
        });
    };

    $.fn.isDisabled = function () {
        var el = $(this).eq(0);
        // 如果是下拉框
        if (el.is(':input')) {
            return el.prop('disabled');
        }
        return el.hasClass('disabled');
    };

    return function (el) {
        el.refresh();
    };
}));
