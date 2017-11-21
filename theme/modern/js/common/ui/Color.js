/**
 * @Color.js
 * @author xunxuzhang
 * @version
 * Created: 16-06-03
 */
(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Color = factory();
    }
}(this, function (require, exports, module) {
    if (typeof require == 'function') {
        require('common/ui/Drop');
    } else if (!$().drop) {
        if (window.console) {
            console.error('need Drop.js');
        }
        return {};
    }

    /**
     * 基于HTML原生color颜色选择
     * 兼容IE7+
     * type=color Hex format
     */
    
    var CL = 'ui-color', colorPrefix = CL + '-', defaultValue = '#000000';

    // 其他变量
    var ACTIVE = 'active', BGCOLOR = 'background-color';

    /* 一些颜色间的相互转换的公用方法 */

    // hsl颜色转换成十六进制颜色
    $.hslToHex = function (h, s, l) {
        var r, g, b;
    
        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
    
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
    
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)].map(function(rgb) {
            rgb = rgb.toString(16);
            if (rgb.length == 1) {
                return "0" + rgb;
            }
            return rgb;
        }).join("");
    };
    // 16进制颜色转换成hsl颜色表示
    $.hexToHsl = function (hex) {
        var r = parseInt("0x" + hex.slice(0,2)) / 255, 
            g = parseInt("0x" + hex.slice(2,4)) / 255, 
            b = parseInt("0x" + hex.slice(4,6)) / 255;
    
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
    
        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
    
        return [h, s, l];
    };

    // rgb/rgba颜色转hex
    $.rgbToHex = function(rgb) {
        if (!rgb) {
            return defaultValue;
        }
        var arr = [];
        if (/^#[0-9A-F]{6}$/i.test(rgb)) {
            return rgb;
        }
        if (/^#[0-9A-F]{3}$/i.test(rgb)) {
            arr = rgb.split('');
            return arr[0] + arr[1] + arr[1] + arr[2] + arr[2] + arr[3] + arr[3];
        }
        // 如果是rgb(a)色值
        arr = rgb.match(/^rgb(?:a)?\((\d+),\s*(\d+),\s*(\d+)/i);
        var hex = function(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }
        if (arr.length == 4) {
            return "#" + hex(arr[1]) + hex(arr[2]) + hex(arr[3]);
        }
        
        return defaultValue;
    };


    /* 包装器方法 */
    $.fn.color = function(options) {
        return $(this).each(function() {
            if (!$(this).data('color')) {
                $(this).data('color', new Color($(this), options));
            }            
        });
    };


    var Color = function(el, options) {
        var self = this;
        // 参数
        var defaults = {
            offsets: {
                x: 0,
                y: 0
            },
            edgeAdjust: false,
            position: '7-5',
            onShow: $.noop,
            onHide: $.noop
        };
        var params = $.extend({}, defaults, options || {});

        // el需要是原生的type=color的输入框
        if (!el) {
            return;
        }
        if (!el.size) {
            el = $(el);
        }
        var ele = el[0];

        // 一些默认的属性值
        var id = ele.id;
        
        if (!id) {
            // 创建随机id
            id = 'C' + (Math.random() + '').split('.')[1];
            ele.id = id;
        }

        // 只读
        el.prop('readonly', true).on('click', function(event) {
            // 阻止默认的颜色选择出现
            event.preventDefault();
        });

        // 元素构建
        // track是替换输入框的色块元素的轨道
        var track = $('<label></label>').addClass(colorPrefix + 'track').attr('for', id);
        // thumb是替换输入框的色块元素的色块区域
        var thumb = $('<span></span>').addClass(colorPrefix + 'thumb');
        // 前置插入
        el.before(track.append(thumb));

        // 浮层容器
        var container = $('<div></div>').addClass(colorPrefix + 'container');

        // 浮层显隐与定位
        track.drop(container, {
            eventType: 'click',
            offsets: params.offsets,
            edgeAdjust: params.edgeAdjust,
            position: params.position,
            onShow: function() {
                self.show();

                if (params.edgeAdjust == false) {
                    var rect = container[0].getBoundingClientRect();
                    if (rect.left < 3) {
                        container.css('margin-left', -1 * rect.left + 3);
                    } else if (rect.right - $(window).width() > 3) {
                        container.css('margin-left', $(window).width() - rect.right - 3);
                    }
                }
            },
            onHide: function() {
                self.hide();
                container.css('margin-left', '0');
            }
        });

        self.drop = track.data('drop');

        this.el = {
            input: el,
            container: container,
            track: track,
            thumb: thumb
        };

        this.callback = {
            show: params.onShow,
            hide: params.onHide
        };

        // 初始化
        this.value(ele.value);

        return this;
    };

    /**
    * 输入框的赋值和取值，同时会更改对应的UI 
    * @param value  HEX颜色值，例如'#000000'。可缺省，表示取值
    */ 
    Color.prototype.value = function(value) {
        var self = this;
        // 元素
        var input = self.el.input, thumb = self.el.thumb;
        // 目前的颜色值
        var oldvalue = input.val();
        // 取值还是赋值
        if (typeof value == 'string') {
            // 使用hex值
            value = $.rgbToHex(value);
            // 赋值
            input.val(value);
            // 按钮上的色块值
            thumb.css(BGCOLOR, value);

            // 面板上的值，各种定位的匹配
            self.match();
        } else {
            // 取值
            // 如果默认无值，使用颜色作为色值，一般出现在初始化的时候
            if (!oldvalue) {
                oldvalue = defaultValue;
                // 赋值
                input.val(oldvalue);
                // 按钮上的色块值
                thumb.css(BGCOLOR, oldvalue);
            }
            return oldvalue;
        }

        if (oldvalue && value != oldvalue) {
            input.trigger('change');
        }

        return this;
    };

    /**
    * container内HTML的创建
    */
    Color.prototype.create = function() {
        var self = this;
        // 元素
        var container = self.el.container;

        // switch button
        var convert = '<a href="javascript:" class="'+ colorPrefix +'switch">更多</a>';
        // current color
        var current = '<div class="'+ colorPrefix +'current">\
            <i class="'+ colorPrefix +'current-square colorCurrent"></i>\
            #<input class="'+ colorPrefix +'current-input">\
        </div>';
        // body
        var body = '<div class="'+ colorPrefix +'body">'+
            (function() {
                // basic color picker
                var html = '<div class="'+ colorPrefix +'basic colorBasicX">';
                // color left
                html = html + '<div class="'+ colorPrefix +'basic-l">'+ (function() {
                    return $.map(["0", "3", "6", "9", "C", "F", "F00", "018001", "0501ff", "FF0", "0FF", "800180"], function(color) {
                        color = color.toUpperCase();
                        if (color.length == 1) {
                            color = color + color + color + color + color + color;
                        } else if (color.length == 3) {
                            color = color.replace(/\w/g, function(matchs) {
                                return matchs + matchs;
                            });
                        }
                        
                        return '<a class="'+ colorPrefix +'lump" data-color="'+ color +'" style="'+ BGCOLOR +':#'+ color +'"></a>';
                    }).join('');
                })() +'</div>';
                // color main
                html = html + '<div class="'+ colorPrefix +'basic-r">' + (function() {
                    var arrBasic = ["0", "3", "6", "9", "C", "F"];
                    htmlR = '';
                    $.each(arrBasic, function(i, r) {
                        htmlR += '<div class="'+ colorPrefix +'lump-group">';
                        $.each(arrBasic, function(j, g) {
                            $.each(arrBasic, function(k, b) {
                                var color = r + r + g + g + b + b;
                                htmlR = htmlR + '<a class="'+ colorPrefix +'lump" data-color="'+ color +'" style="'+ BGCOLOR +':#'+ color +'"></a>';
                            }); 
                        });
                        htmlR += '</div>';
                    });
                    return htmlR;
                })() +'</div>';
                
                return html + '</div>';
            })() + 
            (function() {
                // more color picker
                var html = '<div class="'+ colorPrefix +'more colorMoreX">';
                // color left
                html = html + '<div class="'+ colorPrefix +'more-l">\
                <a class="'+ colorPrefix +'cover-white"></a><div class="'+ colorPrefix +'circle colorCircle"></div>\
                <svg>\
                    <defs>\
                        <linearGradient x1="0" y1="0" x2="1" y2="0" id="colorGradient">\
                            <stop offset="0%" stop-color="#ff0000"></stop>\
                            <stop offset="16.66%" stop-color="#ffff00"></stop>\
                            <stop offset="33.33%" stop-color="#00ff00"></stop>\
                            <stop offset="50%" stop-color="#00ffff"></stop>\
                            <stop offset="66.66%" stop-color="#0000ff"></stop>\
                            <stop offset="83.33%" stop-color="#ff00ff"></stop>\
                            <stop offset="100%" stop-color="#ff0000"></stop>\
                        </linearGradient>\
                    </defs>\
                    <rect x="0" y="0" width="180" height="100" fill="url(#colorGradient)"></rect>\
                </svg></div><div class="'+ colorPrefix +'more-r">\
                    <div class="'+ colorPrefix +'more-fill colorFill">\
                        <a href="javascript:" class="'+ colorPrefix +'more-cover"></a>\
                        <svg>\
                        <defs>\
                            <linearGradient x1="0" y1="0" x2="0" y2="1" id="colorGradient2">\
                                <stop offset="0%" stop-color="#ffffff"></stop>\
                                <stop offset="50%" stop-color="rgba(255,255,255,0)"></stop>\
                                <stop offset="50%" stop-color="rgba(0,0,0,0)"></stop>\
                                <stop offset="100%" stop-color="#000000"></stop>\
                            </linearGradient>\
                        </defs>\
                        <rect x="0" y="0" width="16" height="100" fill="url(#colorGradient2)"></rect>\
                    </svg>\
                    </div>\
                    <a href="javascript:" class="'+ colorPrefix +'more-arrow colorArrow"></a>\
                </div>';
                
                return html + '</div>';
            })()            
        +'</div>';
        // footer
        var footer = '<div class="'+ colorPrefix +'footer">\
            <a href="javascript:" class="'+ colorPrefix +'btn-cancel">取消</a><a href="javascript:" class="'+ colorPrefix +'btn-ensure">确定</a>\
        </div>';
        // append
        container.html(convert + current + body + footer);

        // 一些元素
        $.extend(self.el, {
            field: container.find('input'),
            basic: container.find('.colorBasicX'),
            more: container.find('.colorMoreX'),
            circle: container.find('.colorCircle'),
            fill: container.find('.colorFill'),
            arrow: container.find('.colorArrow'),
            current: container.find('.colorCurrent')
        });

        // 事件
        self.events();

        return self;
    };

    /**
    * container内的一些事件
    */
    Color.prototype.events = function() {
        var self = this;
        // 元素
        var input = self.el.input, container = self.el.container;
        // 更多元素
        // 元素
        var circle = self.el.circle,
            fill = self.el.fill,
            arrow = self.el.arrow;
        // 面板内部唯一的输入框元素
        var elInput = self.el.field;

        container.delegate('a', 'click', function(event) {
            // 元素
            var ele = this, el = $(ele);
            
            // 选择的颜色值
            var value = '';
            // 当前类名
            var cl = ele.className;
            // 按钮分类别处理
            if (/cancel/.test(cl)) {
               // 1. 取消按钮
               self.hide();
            } else if (/ensure/.test(cl)) {
                // 2. 确定按钮
                // 赋值
                value = elInput.val();
                if (value) {
                    self.value('#' + value);
                }
                self.hide();
            } else if (/lump/.test(cl)) {
                // 3. 小色块
                value = el.attr('data-color');
                elInput.val(value);
                self.match();
            } else if (/switch/.test(cl)) {
                // 4. 面板类名切换按钮
                if (ele.innerHTML == "更多") {
                    self.el.more.show();
                    self.el.basic.hide();
                    ele.innerHTML = "基本";
                } else {
                    self.el.more.hide();
                    self.el.basic.show();
                    ele.innerHTML = "更多";
                }
                // 面板的色块啊，圆和尖角位置匹配
                self.match();
            } else if (/cover/.test(cl)) {
                // 5. 渐变色的覆盖层
                // offsetLeft, offsetTop
                var rect = ele.getBoundingClientRect(), offsetLeft = event.pageX - rect.left, offsetTop = event.pageY - $(document).scrollTop() - rect.top;

                // width, height
                var width = ele.clientWidth, height = ele.clientHeight;
                
                // color
                var colorH , colorS, colorL;

                if (circle.length && fill.length && arrow.length) {
                    if (/white/.test(cl) == true) {                       
                        colorH = offsetLeft / width;
                        colorS = 1 - offsetTop / height;
                        colorL = 1 - arrow.css('top').replace("px", "") / arrow.parent().height();
                        
                        circle.css({
                            left: offsetLeft,
                            top: offsetTop
                        });

                        var hsl = "hsl("+ [360 * colorH, 100 * colorS + "%", "50%"].join() +")";

                        circle.css(BGCOLOR, hsl);
                        //fill.css(BGCOLOR, "hsl("+ [360 * colorH, 100 * colorS + "%", "50%"].join() +")");
                    } else { 
                        arrow.css('top', offsetTop);
                    }

                    // 赋值
                    elInput.val(self._getHSL().replace('#', ''));
                    self.match();
                }
            }
        });       

        // 输入框事件
        var field = self.el.field;

        field.on('input', function() {
            var value = this.value;
            if (/^[0-9A-F]{6}$/i.test(value)) {
                self.match();
            } else if (/^[0-9A-F]{3}$/i.test(value)) {
                self.match($.rgbToHex('#' + value).replace('#', ''));
            }
        }).on('keyup', function(event) {
            if (event.keyCode == 13) {
                var value = elInput.val(), oldvalue = value;
                if (value) {
                    value = $.rgbToHex('#' + value);
                    if (value != oldvalue) {
                        // 支持输入#000
                        elInput.val(value);
                    }
                    self.value('#' + value);
                }
                self.hide();
            }
        });
        
        // IE7,IE8
        if (![].map) {
            field[0].attachEvent('onpropertychange', function(event) {
                event = event || window.event;
                if (event && event.propertyName == 'value') {
                    field.trigger('input');
                }
            });
        } else {
            // 滑块拖动事件
            var oPosArrow = {};
            arrow.on('mousedown', function(event) {
                oPosArrow.pageY = event.pageY;
                oPosArrow.top = arrow.css('top').replace("px", "") * 1;
                
                event.preventDefault();
            });

            document.addEventListener("mousemove", function(event) {                
                if (typeof oPosArrow.top == "number") {
                    var top = oPosArrow.top + (event.pageY - oPosArrow.pageY), maxTop = arrow.parent().height();
                    if (top < 0) {
                        top = 0;
                    } else if (top > maxTop) {
                        top = maxTop;
                    }
                    arrow.css('top', top);
                    // 赋值，此次赋值，无需重定位
                    elInput.val(self._getHSL().replace('#', ''));
                    self.match(false);
                }
            });
            document.addEventListener("mouseup", function() {
                oPosArrow.top = null;
            });
        }

        

        return self;
    };

    /**
    * 根据坐标位置获得hsl值
    */
    Color.prototype._getHSL = function() {
        var self = this;

        // 需要的元素
        var circle = self.el.circle, arrow = self.el.arrow;

        if (circle.length * arrow.length == 0) {
            return self;
        }

        var colorH, colorS, colorL;
        // get color
        // hsl color
        if (circle[0].style.left) {
            colorH = circle.css('left').replace("px", "") / circle.parent().width()
        } else {
            colorH = 0;
        }                       
        if (circle[0].style.top) {
            colorS = 1 - circle.css('top').replace("px", "") / circle.parent().height();
        } else {
            colorS = 1;
        }
        if (arrow[0].style.top) {
            colorL = 1 - arrow.css('top').replace("px", "") / arrow.parent().height();
        } else {
            colorL = 0;
        }

        return "#" + $.hslToHex(colorH, colorS, colorL);
    };

    /**
    * 面板的色块啊，圆和尖角位置匹配
    */ 
    Color.prototype.match = function(value) {
        var self = this;

        // 首先要面板显示
        if (self.display != true) {
            return this;
        }

        // 一些元素
        var container = self.el.container, 
            current = self.el.current,
            circle, fill, arrow,
            input = self.el.input;

        var el = self.el.field;

        // 重定位
        var rePosition = true;
        if (value === false) {
            rePosition = value;
        }

        // 当前的颜色值
        var value = value || el.val();
        if (value == '') {
            // 如果输入框没有值
            // 使用之前一个合法的颜色值作为现在值
            value = $.rgbToHex(current.css(BGCOLOR)).replace('#', '');
            el.val(value);
        }
        value = value.replace('#', '');
        
        // 色块值示意
        current.css(BGCOLOR, '#' + value);

        // 当前是基本色面板还是任意色面板
        if (self.el.more.css('display') == 'none') {
            // 1. 基本色
            // 所有当前高亮的元素不高亮
            container.find('.' + ACTIVE).removeClass(ACTIVE);
            // 所有颜色一致的高亮
            container.find("a[data-color='"+ value.toUpperCase() +"']").addClass(ACTIVE);
        } else {
            circle = self.el.circle;
            fill = self.el.fill;
            arrow = self.el.arrow;

            // to HSL
            var arrHSL = $.hexToHsl(value);
            // hsl value
            var colorH = arrHSL[0], colorS = arrHSL[1], colorL = arrHSL[2];

            // 滑块和尖角的颜色和位置
            var hsl = "hsl("+ [360 * colorH, 100 * colorS + "%", "50%"].join() +")";
            if (value != '000000') {
                circle.css(BGCOLOR, hsl);
                fill.css(BGCOLOR, hsl);
            }
            
            if (rePosition == true) {
                if (colorL != 0) {
                    circle.css({
                        left: circle.parent().width() * colorH,
                        top:  circle.parent().height() * (1 - colorS)
                    });
                }
                
                arrow.css('top', arrow.parent().height() * (1 - colorL)); 
            }           
        }

        return this;
    };

    /**
    * 面板显示
    */ 
    Color.prototype.show = function() {
        var self = this;
        // 元素
        var container = self.el.container, body = $('body');
        // z-index自动最高
        var zIndex = container.css('zIndex') * 1 || 21, maxIndex = zIndex;
        body.children().each(function() {
            var z;
            if ($(this).hasClass(CL) == false && (z = $(this).css('zIndex') * 1)) {
                maxIndex = Math.max(z, maxIndex);
            }
        });
        if (zIndex < maxIndex) {
            container.css('zIndex', maxIndex + 1);
        }

        // 输入框赋值
        if (container.html() == '') {
            self.create();
        }

        // 面板显示
        if (self.drop.display == false) {
            self.drop.show();
        }
        self.display = self.drop.display;

        // 面板UI匹配
        var current = self.el.current;
        if (!current.attr('style')) {
            current.css(BGCOLOR, self.el.input.val());
        }
        self.match();

        // onShow callback
        if ($.isFunction(this.callback.show)) {
            this.callback.show.call(this, this.el.track, container);
        }

        return this;
    };

    Color.prototype.hide = function() {
        var self = this;
        // 面板隐藏
        if (self.drop.display == true) {
            self.drop.hide();
        }
        self.display = self.drop.display;

        // onShow callback
        if ($.isFunction(this.callback.hide)) {
            this.callback.hide.call(this, this.el.trigger, this.el.container);
        }

        return this;
    };

    return Color;
}));