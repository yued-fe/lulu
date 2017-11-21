/**
 * @LightTip.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-25
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.LightTip = factory();
    }
}(this, function (require) {
    if (typeof require == 'function') {
        require('common/ui/Enhance');
    }

    /**
     * 顶部的请提示效果
     * 支持jQuery $全局调用以及模块化调用
     * @example
     * $.lightTip.success(message);
     * $.lightTip.error(message);
     * new LightTip().success(message);
     * new LightTip().error(message);
     **/

    // 类名变量
    var CL = 'ui-lightip';
    var prefixTips = CL + '-';

    $.lightTip = (function() {
        // 下面是两个私有方法
        var _create = function(message) {
            var elTips = $('<div class="' + CL + '"></div>').attr({
                role: 'tooltip',
                tabindex: '0'
            });

            elTips.html('<i class="' + prefixTips + 'icon">&nbsp;</i><span class="' + prefixTips + 'text">' + message + '</span>');

            // 插入到页面
            $(document.body).append(elTips);

            // 定位和层级
            elTips.css({
                left: '50%',
                marginLeft: elTips.outerWidth() * -0.5
            });
            if (elTips.zIndex) {
                elTips.zIndex();
            }

            $.lightTip.activeElement = document.activeElement;

            elTips.on('click', function () {
                _remove(elTips);
            });

            elTips.focus();

            return elTips;
        };
        var _remove = function (elTips) {
            if (elTips) {
                elTips.remove();
            }
            if ($.lightTip.activeElement) {
                $.lightTip.activeElement.focus();
                $.lightTip.activeElement.blur();
            }
        };

        return {
            success: function(message, time) {
                var lightTips = _create(message).addClass(prefixTips + 'success');
                lightTips.attr('aria-label', '操作成功');
                setTimeout(function() {
                    lightTips.fadeOut(function() {
                        _remove(lightTips);
                    });
                }, time || 3000);

                return lightTips;
            },
            error: function(message, time) {
                var lightTips = _create(message).addClass(prefixTips + 'error');
                lightTips.attr('aria-label', '操作失败');
                setTimeout(function() {
                    lightTips.fadeOut(function() {
                        _remove(lightTips);
                    });
                }, time || 3000);

                return lightTips;
            }
        };
    })();

    var LightTip = function() {
        this.el = {};

        return this;
    };

    LightTip.prototype.success = function(message, time) {
        this.el.container = $.lightTip.success(message, time);

        return this;
    };
    LightTip.prototype.error = function(message, time) {
        this.el.container = $.lightTip.error(message, time);

        return this;
    };

    return LightTip;
}));
