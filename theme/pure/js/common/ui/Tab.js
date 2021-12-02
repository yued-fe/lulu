/**
 * @Tab.js
 * @author zhangxinxu
 * @version
 * @created: 15-06-12
 * @edit:    19-09-21 native js rewrite by lennonover
 * @review   19-09-25 by zhangxinxu
 */
/* global module */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Tab = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 可定制的极简选项卡切换效果
     * 状态类名使用.active
     * @使用示例
     *  new Tab(document.querySelectorAll('#tabView > a'), {
     *     onSwitch: function() {}
     *  });
     */

    var STATE = 'active';

    var CL = {
        add: function () {
            return ['ui-tab'].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-tab';
        }
    };

    var Tab = function (elements, options) {
        // 元素的获取与判断
        var eleTabs = elements;
        // 如果元素没有，打道回府
        if (!eleTabs) {
            return;
        }
        if (typeof elements == 'string') {
            eleTabs = document.querySelectorAll(elements);
        }
        // 参数获取
        options = options || {};

        if (typeof options == 'function') {
            options = {
                onSwitch: options
            };
        }

        var defaults = {
            // 事件名称，还可以是mouseenter或者mouseover
            eventType: 'click',
            // 'auto' 表示根据选项卡上的状态类名获取index值
            index: 'auto',
            // 是否使用HTML5 history在URL上标记当前选项卡位置，for IE10+
            history: true,
            // tab 切换时 滑动效果
            slide: false,
            // 自动播放，0 或 false 表示不自动播放，单位毫秒
            autoplay: 0,
            // 发生状态变化时候的回调
            onSwitch: function () {}
        };

        // 参数合并
        var objParams = Object.assign({}, defaults, options);

        // 很重要的索引
        var numIndexTab = objParams.index;

        // 所有对应的面板元素
        var elePanels = [];

        // 首先，获得索引值
        eleTabs.forEach(function (eleTab, index) {
            if (typeof numIndexTab != 'number' && eleTab.classList.contains(STATE)) {
                numIndexTab = index;
            }
            eleTab.setAttribute('data-index', index);
            eleTab.setAttribute('role', 'tab');
            eleTab.setAttribute('aria-selected', 'false');

            // 乘机获取所有对应的面板元素
            var elePanel = this.getPanel(eleTab);
            elePanels.push(elePanel);

            if (elePanel) {
                elePanel.setAttribute('role', 'tabpanel');
            }
        }.bind(this));

        // 如果没有匹配的选项卡索引，认为第一个选中
        if (typeof numIndexTab != 'number') {
            numIndexTab = 0;
        }

        // 暴露元素
        this.element = {
            tabs: eleTabs,
            tab: eleTabs[numIndexTab],
            panels: elePanels,
            panel: elePanels[numIndexTab]
        };
        // 参数暴露
        objParams.index = numIndexTab;
        this.params = objParams;
        // 回调暴露
        this.callback = {
            switch: objParams.onSwitch
        };
        // 事件绑定
        this.events();

        // 默认就来一发
        // 以便回调可以触发
        // 为了等业务事件绑定，这里的触发设置在DOM准备结束之后
        window.addEventListener('DOMContentLoaded', function () {
            eleTabs[numIndexTab].dispatchEvent(new CustomEvent(objParams.eventType));
            objParams.onSwitch.call(this, eleTabs[numIndexTab], elePanels[numIndexTab], null, null);
        }.bind(this));

        // 设置父元素的无障碍访问信息
        if (eleTabs.length > 1 && eleTabs[0].parentElement == eleTabs[1].parentElement) {
            eleTabs[0].parentElement.setAttribute('role', 'tablist');
        }
    };

    /**
     * 基于tab元素获取panel元素的方法
     * @param  {[type]} eleTab [description]
     * @return {[type]}        [description]
     */
    Tab.prototype.getPanel = function (eleTab) {
        if (!eleTab) {
            eleTab = this.element.tab;
        }
        // 获得属性对应的值
        var strAttr = eleTab.getAttribute('data-rel') || eleTab.getAttribute('href');

        if (!strAttr) {
            return null;
        }

        // 如果是href的锚点匹配
        if (/^#/.test(strAttr)) {
            return document.querySelector(strAttr);
        }

        // 如果是data-rel设置
        return document.querySelector('#' + strAttr) || document.querySelector('.' + strAttr);
    };

    /**
     * 播放的处理
     * @return {[type]} [description]
     */
    Tab.prototype.show = function (eleTab) {
        // 一些必须的暴露的参数
        var numIndexTab = this.index;
        var eleTabs = this.element.tabs;
        var objParams = this.params;

        // 对应选项卡显示的处理
        eleTab = eleTab || this.element.tab;
        if (!eleTab) {
            return;
        }
        var elePanel = this.getPanel(eleTab);
        var eleParent = eleTab.parentElement;

        // 改变当前选中tab与panel元素
        this.element.tab = eleTab;
        this.element.panel = elePanel;

        var strHref = eleTab.getAttribute('href');

        // 需要非选中状态才行执行切换
        if (eleTab.classList.contains(STATE)) {
            return;
        }

        // 选中元素的索引值
        numIndexTab = eleParent.querySelector('.' + STATE).getAttribute('data-index');
        // 选项卡样式变变变
        // 类名变化
        eleTab.classList.add(STATE);

        // 要移除类名的选项卡和选项面板
        var eleResetTab = eleTabs[numIndexTab];
        var eleResetPanel = this.getPanel(eleResetTab);
        // 类名移除
        eleResetTab.classList.remove(STATE);

        // 面板的变化
        elePanel.classList.add(STATE);
        eleResetPanel.classList.remove(STATE);
        // 索引参数变化
        numIndexTab = eleTab.getAttribute('data-index');
        this.params.index = numIndexTab * 1;

        // line 滑动效果 IE10+
        var eleLine;
        // 需要参数配合
        if (objParams.slide == true && history.pushState) {
            eleLine = eleParent.querySelector('.' + CL.add('line'));
            if (!eleLine) {
                eleLine = document.createElement('i');
                eleLine.className = CL.add('line');
                eleParent.insertBefore(eleLine, eleTabs[0]);
            }
            eleLine.style.display = 'block';
            eleLine.style.width = eleTab.clientWidth + 'px';
            eleLine.style.left = eleTab.offsetLeft + 'px';
        }
        // 回调方法
        this.callback.switch.call(this, eleTab, eleResetTab, elePanel, eleResetPanel);

        // 历史记录的处理
        if (/^(:?javas|#)/.test(strHref)) {
            var strAttr = (eleTab.getAttribute('data-rel') || strHref || '').replace(/^#/, '');

            if (objParams.history == true) {
                // url地址查询键值对替换
                var objURLParams = new URLSearchParams(location.search);
                // 改变查询键值，有则替换，无则新增
                objURLParams.set('tab', strAttr);

                // hash优化，去除重复的hash
                var strHash = location.hash;
                if (strHref == strHash) {
                    location.hash = strHash = '';
                }
                // 改变当前URL
                if (history.replaceState) {
                    history.replaceState(null, document.title, location.href.split('?')[0] + '?' + objURLParams.toString() + strHash);
                } else {
                    location.replace('#tab=' + strAttr);
                }
            }
        }
    };

    /**
     * 相关事件
     * @return {[type]} [description]
     */
    Tab.prototype.events = function () {
        // 获得选项卡对应的面板元素
        // 各个元素
        var objElement = this.element;
        var eleTabs = objElement.tabs;
        var objParams = this.params;

        // 单个监听事件，综合考虑不做委托
        eleTabs.forEach(function (eleTab) {
            eleTab.addEventListener(objParams.eventType, function (event) {
                if (/^(:?javas|#)/.test(event.target.getAttribute('href'))) {
                    event.preventDefault();
                }
                this.show(event.target);
            }.bind(this), false);
        }.bind(this));

        // 定时播放
        if (objParams.autoplay && objParams.autoplay > 0) {
            this.timerSlide = setInterval(function () {
                this.show(eleTabs[this.params.index + 1] || eleTabs[0]);
            }.bind(this), objParams.autoplay);

            // 鼠标经过停止自动播放
            eleTabs.forEach(function (eleTab) {
                var elePanel = this.getPanel(eleTab);

                [eleTab, elePanel].forEach(function (eleTarget) {
                    if (!eleTarget) {
                        return;
                    }
                    eleTarget.addEventListener('mouseenter', function () {
                        clearInterval(this.timerSlide);
                    }.bind(this), false);
                    eleTarget.addEventListener('mouseleave', function () {
                        this.timerSlide = setInterval(function () {
                            this.show(eleTabs[this.params.index + 1] || eleTabs[0]);
                        }.bind(this), objParams.autoplay);
                    }.bind(this), false);
                }.bind(this));
            }.bind(this));
        }
    };

    return Tab;
}));
