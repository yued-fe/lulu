/**
 * @Scrollbar.js
 * @author xunxuzhang
 * @version
 * Created: 15-07-15
 */

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Scrollbar = factory();
    }
}(this, function () {
    /**
     * 模拟滚动条效果，基于原生的scroll实现
     * 针对所有浏览器
     * UI交互仿iOS系统滚动条，黑黑细细长长，
     * 默认不显示，scroll显示，scroll提示，数秒隐藏，不占据内容区域的宽度
     * 支持jQuery调用和new构造实例调用
     * eg.
     * $().scroll(options);
     * or
     * new scroll($(), options);
     */

    // 一些类名
    var CL = 'ui-scroll', prefixScroll = CL + '-';
    // 定时器
    var timer;
    
    $.fn.scrollbar = function(options) {
        return $(this).each(function() {
            $(this).data('scrollbar', new Scrollbar($(this), options));
        });
    };

    var Scrollbar = function(el, options) {
        var defaults = {
            damping: 15,             // 滚动时候的阻尼大小，越大越快
            autoRefresh: true        // 滚动条的高度是否自动根据容器内容变化而刷新
        };
        
        var params = $.extend({}, defaults, options || {});

        // 创建滚动元素
        // box是辅助定位的盒子
        var box = $('<div></div>').addClass(prefixScroll + 'x');
        // track是槽，是容器
        var track = $('<div></div>').addClass(prefixScroll + 'track').hide();
        // thumb是黑色的条条
        var thumb = $('<a></a>').addClass(prefixScroll + 'thumb');
        // 合体
        box.append(track.append(thumb));
        // 容器做点什么
        el.after(box);

        var self = this, element = el.get(0);

        // 一些事件
        // 1. 滚动
        var _scroll = function(event) {
            event = event || window.event;

            var top = element.scrollTop;
            
            var delta = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3; 
            if (delta > 0) { 
                // scroll up
                element.scrollTop -= params.damping;
            } else {
                element.scrollTop += params.damping;
            }
            self.position().show();

            if (element.scrollTop != top) {
                if (event.preventDefault) event.preventDefault();
                event.returnValue = false;  
            }

            el.trigger('scroll');
        };


        var eventType = typeof document.mozHidden == "undefined" ? "mousewheel": "DOMMouseScroll";
        if (window.addEventListener) {
            el.get(0).addEventListener(eventType, _scroll);
            track.get(0).addEventListener(eventType, _scroll);
        } else {
            el.get(0).attachEvent("on" + eventType, _scroll);
        }

        // 2. hover
        track.hover(function() {
            self.show();
            clearTimeout(timer);
        }, function() {
            if (typeof dataThumb.scrollTop != "number") {
                self.show();
            }
        }).click(function(event) {
            if (event.target && /track/.test(event.target.className)) {
                if (event.clientY > thumb.offset().top - $(window).scrollTop()) {
                    // move down
                    element.scrollTop += params.damping * 2;
                } else {
                    element.scrollTop -= params.damping * 2;
                }
                self.position().show();

                el.trigger('scroll');
            }
        });

        // 3. 拖拽
        var dataThumb = {};
        // ① 按下
        thumb.mousedown(function(event) {
            dataThumb.scrollTop = element.scrollTop;
            dataThumb.y = event.clientY;
            track.addClass("active");
            event.preventDefault();
        });
        // ② 拖
        $(document).mousemove(function(event) {
            var y = event.clientY;
                
            if (typeof dataThumb.scrollTop == "number") {
                var move = y - dataThumb.y;
                
                element.scrollTop = dataThumb.scrollTop + element.scrollHeight * move / element.clientHeight;
                self.position();

                el.trigger('scroll');

                event.preventDefault();
            }   
        });
        // ③ 抬起
        $(document).mouseup(function() {
            if (typeof dataThumb.scrollTop == "number") {
                self.show();
            }
            dataThumb.scrollTop = null;
            track.removeClass("active");
        });

        // 暴露一些数据给实例对象
        this.el = {
            container: el,
            box: box,
            track: track,
            thumb: thumb
        };

        // 初始显示下
        this.refresh().show();

        if (params.autoRefresh) {
            setInterval(function() {
                self.refresh();
            }, 17);
        }

        return this;
    };

    Scrollbar.prototype.size = function() {
        if (this.display == false) return this;

        var container = this.el.container,
        box = this.el.box,
        track = this.el.track,
        thumb = this.el.thumb;

        var element = container.get(0);

        // 滚动条的尺寸
        var clientHeight = element.clientHeight, scrollHeight = element.scrollHeight;

        if (clientHeight < scrollHeight) {
            element.setAttribute("scrollable", ""); 
        } else {
            this.hide();
            element.removeAttribute("scrollable");
        }
        
        // height/position of track
        track.css({
            right: container.innerWidth() * -1 + parseInt(container.css('borderLeftWidth')) * -1,
            bottom: parseInt(container.css('marginBottom')) + parseInt(container.css('borderBottomWidth')),
            height: container.innerHeight() - (track.outerHeight() - track.height())
        });
        // height of thumb
        thumb.height(Math.min(clientHeight/scrollHeight, 1) * 100 + "%");

        return this;
    };

    Scrollbar.prototype.position = function() {
        var container = this.el.container,
        thumb = this.el.thumb;

        var element = container.get(0);

        // top value according to scrollTop
        var scrollTop = element.scrollTop, scrollHeight = element.scrollHeight;
        
        thumb.css('top', 100 * (scrollTop / scrollHeight) + "%");

        // 滚动条的位置
        return this;
    };


    Scrollbar.prototype.refresh = function() {
        // 滚动条刷新
        this.size().position();
        return this;
    };


    Scrollbar.prototype.show = function() {
        var self = this;
        
        clearTimeout(timer);

        // 滚动条显示
        if (typeof this.el.container.attr('scrollable') == 'string') {
            this.el.track.show();
            this.display = true;

            timer = setTimeout(function() {
                self.hide();
            }, 2000);
        }

        return this;
    };

    Scrollbar.prototype.hide = function() {
        var self = this;
        // 滚动条隐藏
        this.el.track.fadeOut('fast', function() {
            self.display = false;
        });
    };


    return Scrollbar;
}));
