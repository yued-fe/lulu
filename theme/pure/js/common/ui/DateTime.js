/**
 * @DateTime.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-03
 * @editd:   19-11-12
 */

/* global module */
(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Follow = require('./Follow');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.DateTime = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Follow = (this || self).Follow;
    if (typeof require == 'function' && !Follow) {
        Follow = require('common/ui/Follow');
    } else if (!Follow) {
        window.console.error('need Follow.js');
        return {};
    }

    // 样式类名统一处理
    var CL = {
        toString: function () {
            return 'ui-datetime';
        }
    };
    ['date', 'range', 'day', 'year', 'month', 'hour', 'minute'].forEach(function (key) {
        CL[key] = function () {
            return ['ui', key].concat([].slice.call(arguments)).join('-');
        };
    });


    var SELECTED = 'selected';
    var ACTIVE = 'active';

    var regDate = /-|\//g;

    // 拓展方法之字符串变时间对象
    String.prototype.toDate = function () {
        var year, month, day;
        var arrDate = this.split(regDate);
        year = arrDate[0] * 1;
        month = arrDate[1] || 1;
        day = arrDate[2] || 1;
        // 年份需要是数值字符串
        if (!year) {
            return new Date();
        }

        return new Date(year, month - 1, day);
    };

    // 日期对象变成年月日数组
    Date.prototype.toArray = function () {
        var year = this.getFullYear();
        var month = this.getMonth() + 1;
        var date = this.getDate();
        if (month < 10) {
            month = '0' + month;
        }
        if (date < 10) {
            date = '0' + date;
        }

        return [year, month, date];
    };

    /**
     * 日期，时间选择器
     * 基于HTML5时间类输入框
     * @example new DateTime(trigger, options);
     * @trigger 触发的元素，可以是文本框也可以是文本框容器(父级)
     * @options 可选参数
     */
    var DateTime = function (element, options) {
        var eleTrigger = element;
        if (typeof element == 'string') {
            eleTrigger = document.querySelector(element);
        }

        if (!eleTrigger || eleTrigger.hasAttribute('is-visible')) {
            return this;
        }

        // 默认参数
        var defaults = {
            // 文本框初始值，优先从文本框获取。
            value: '',
            // 浮层面板类型，可以是'date'(2015-01-01), 'year'(2015), 'month'(2015-01), 'time'(12:00), 'date-range'(2015-01-01 至 2015-06-01)
            type: 'auto',
            // 时间范围最小值，优先从文本框获取。'auto'表示无最小限制。
            min: 'auto',
            // 时间范围最大值，优先从文本框获取。'auto'表示无最大限制。
            max: 'auto',
            onShow: function () {},
            onHide: function () {}
        };

        // 参数合并
        var objParams = Object.assign({}, defaults, options || {});

        // 容器元素
        var eleContainer = null;

        // 找到文本输入框
        var eleInput = null;
        if (eleTrigger.getAttribute('type')) {
            eleInput = eleTrigger;
            eleTrigger = eleInput.parentElement;
        } else {
            eleInput = eleTrigger.querySelector('input');
        }
        // 如果没有时间类输入框，则认为不是点击展开模式
        // 而是直接显示在容器中
        if (!eleInput) {
            eleInput = document.createElement('input');

            if (objParams.min != 'auto') {
                eleInput.setAttribute('min', objParams.min);
            }
            if (objParams.max != 'auto') {
                eleInput.setAttribute('max', objParams.max);
            }
            if (objParams.type != 'auto') {
                eleInput.setAttribute('type', objParams.type);
            }

            eleContainer = eleTrigger;
        }

        // 避免重复初始化
        if (eleInput.data && eleInput.data.dateTime) {
            return eleInput.data.dateTime;
        }

        // readonly
        eleInput.setAttribute('readonly', 'readonly');

        // 时间选择的类型
        var strType = objParams.type;
        if (strType == 'auto') {
            strType = eleInput.getAttribute('type') || 'date';
        }

        // 插入下拉箭头
        var strId = eleInput.id;
        if (!strId) {
            // 如果没有id, 创建随机id
            // 下拉箭头需要
            strId = ('lulu_' + Math.random()).replace('0.', '');
            eleInput.id = strId;
        }
        // 下拉元素
        var eleLabel = document.createElement('label');
        eleLabel.classList.add(CL.date('arrow'));

        // 插入到文本框的后面
        if (getComputedStyle(eleTrigger).position != 'static') {
            eleInput.insertAdjacentElement('afterend', eleLabel);
        } else {
            eleTrigger = eleInput;
        }

        // 初始值
        var strInitValue = eleInput.value;
        if (strInitValue == '' && objParams.value) {
            strInitValue = eleInput.value = objParams.value;
        }

        // 初始值转换成时间值
        switch (strType) {
            case 'date': case 'year': case 'month': {
                // 日期
                var objInitDate = strInitValue.toDate();
                var arrDate = objInitDate.toArray();

                // 一开始的赋值
                if (strInitValue == '') {
                    // 赋值今日
                    if (strType == 'date') {
                        eleInput.value = arrDate.join('-');
                    } else if (strType == 'year') {
                        eleInput.value = arrDate[0];
                    } else if (strType == 'month') {
                        eleInput.value = arrDate.slice(0, 2).join('-');
                    }
                }

                // eg. [2015,07,20]
                this[SELECTED] = arrDate;

                break;
            }
            case 'time': case 'hour': case 'minute': {
                var arrTime = strInitValue.split(':');
                // 时间
                var strHour = arrTime[0];
                var strMinute = arrTime[1];
                // 这里的处理情况如下
                // 1. 空值
                // 2. 小时数不是数值
                // 3. 小时数不在0~24之间
                // 以上均认为时间是00:00
                if (strInitValue == '' || !(strHour < 24 && strHour > 0)) {
                    strHour = '00';
                    strMinute = '00';
                } else {
                    // 分钟无论如何都要是正常值
                    if (!(strMinute > 0 && strMinute < 60) || strType == 'hour') {
                        strMinute = '00';
                    } else if (strMinute.length == 1) {
                        strMinute = '0' + strMinute;
                    }
                    // 补0是必要的
                    if (strHour.length == 1) {
                        strHour = '0' + strHour;
                    }
                }
                eleInput.value = [strHour, strMinute].join(':');

                this[SELECTED] = [strHour, strMinute];

                break;
            }
            case 'date-range': case 'month-range': {
                // 日期范围
                var objBeginDate = new Date();
                var objEndDate = new Date();
                // 前后时间字符串
                var arrRange = strInitValue.split(' ');
                // 有如下一些情况：
                // 1. 空，则选择范围就是今日
                // 2. 只有一个时间，则选择范围只这个时间到今天这个范围
                // 3. 其他就是正常的
                if (strInitValue != '' && arrRange.length == 1) {
                    var someDate = arrRange[0].toDate();
                    if (someDate.getTime() > objBeginDate.getTime()) {
                        objEndDate = someDate;
                    } else {
                        objBeginDate = someDate;
                    }
                } else {
                    objBeginDate = arrRange[0].toDate();
                    objEndDate = arrRange[arrRange.length - 1].toDate();
                }
                // 赋值
                var arrBegin = objBeginDate.toArray();
                var arrEnd = objEndDate.toArray();

                if (strType == 'date-range') {
                    eleInput.value = arrBegin.join('-') + ' 至 ' + arrEnd.join('-');
                } else {
                    eleInput.value = arrBegin.slice(0, 2).join('-') + ' 至 ' + arrEnd.slice(0, 2).join('-');
                }

                // 存储
                this[SELECTED] = [arrBegin, arrEnd];

                break;
            }
        }

        // 容器元素的创建
        if (!eleContainer) {
            eleContainer = document.createElement('div');
            eleContainer.classList.add(CL.date('container'));

            // keyboard键盘无障碍访问需要
            var strRandId = ('lulu_' + Math.random()).replace('0.', '');
            eleContainer.setAttribute('id', strRandId);
            eleContainer.classList.add('ESC');
            eleInput.setAttribute('data-target', strRandId);
            // 记录input的id
            eleContainer.setAttribute('data-id', strId);
        }


        // 暴露的一些数据
        this.element = {
            container: eleContainer,
            trigger: eleTrigger,
            input: eleInput
        };

        this.params = {
            type: strType,
            // 最大小值的处理在各个种类的面板中执行
            // 以便支持动态时间修改
            // 例如，选择A时间，然后设置B时间的min值为A时间
            // 这里先占个位
            max: objParams.max,
            min: objParams.min
        };

        // 回调方法
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };


        // IE9+ 前后分页图标使用内联SVG, 以便支持retina屏幕
        this.svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"/></svg>';

        this.events();

        if (!eleInput.data) {
            eleInput.data = {};
        }
        eleInput.data.dateTime = this;

        // 如果是静态模式，则实例对象暴露在容器元素上
        if (eleContainer == eleTrigger) {
            eleContainer.data = {
                dateTime: this
            };

            // 同时显示
            this.show();
        }

        return this;
    };


    /**
     * 事件
     * @return {[type]} [description]
     */
    DateTime.prototype.events = function () {
        var objElement = this.element;
        // 具体元素们
        var eleContainer = objElement.container;
        var eleTrigger = objElement.trigger;
        var eleInput = objElement.input;

        // 点击容器的事件处理
        eleContainer.addEventListener('click', function (event) {
            // IE可能是文件节点
            if (event.target.nodeType != 1 || !event.target.closest) {
                return;
            }

            var eleClicked = event.target.closest('a, button');
            if (!eleClicked) {
                return;
            }
            // 各个分支中可能会用到的变量
            var numYear = 0;
            var numMonth = 0;
            // var numDate = 0;
            var numHour = 0;
            var numDay = 0;
            // 日期范围
            var arrRange = [];
            // 根据选中状态决定新的状态
            var dataRange;
            // 按钮类型
            var strTypeButton = '';

            // 各种事件
            switch (eleContainer.getAttribute('data-type')) {
                case 'date': {
                    // 日期选择主体
                    // 1. 前后月份选择
                    if (/prev|next/.test(eleClicked.className)) {
                        numMonth = eleClicked.getAttribute('data-month');

                        // 设置选择月份
                        // 这样可以获得目标月份对应的日期数据
                        // 就是下面this.getMonthDay做的事情
                        this[SELECTED][1] = numMonth * 1;

                        // 日期和月份要匹配，例如，不能出现4月31日
                        // arrMonthDay是一个数组，当前年份12个月每月最大的天数
                        var arrMonthDay = this.getMonthDay(this[SELECTED]);

                        // 切分月份
                        // 日期正常是不会变化的
                        // 但是类似31号这样的日子不是每个月都有的
                        // 因此，需要边界判断
                        // 下面这段逻辑就是做这个事情的

                        // 1. 当前月份最大多少天
                        var numDayMax = (function () {
                            if (numMonth - 1 < 0) {
                                return arrMonthDay[11];
                            } else if (numMonth > arrMonthDay.length) {
                                return arrMonthDay[0];
                            }

                            return arrMonthDay[numMonth - 1];
                        })();

                        // 2. 之前选择的天数
                        numDay = this[SELECTED][2];
                        // 之前记住的日期
                        var numDayOverflow = eleContainer.dataDayOverflow;
                        // 例如，我们超出日期是31日，如果月份可以满足31日，使用31日
                        if (numDayOverflow) {
                            this[SELECTED][2] = Math.min(numDayOverflow, numDayMax);
                        } else if (this[SELECTED][2] > numDayMax) {
                            this[SELECTED][2] = numDayMax;

                            // 这里是对体验的升级，
                            // 虽然下月份变成了30号，但是再回来时候，原来的31号变成了30号
                            // 不完美，我们需要处理下
                            // 通过一个变量记住，点击item项的时候，移除
                            // 且只在第一次的时候记住
                            // 因为28,29,30,31都可能出现，每次记忆会混乱
                            eleContainer.dataDayOverflow = numDay;
                        }

                        // 更新选择的月日数据
                        this[SELECTED] = this[SELECTED].join('-').toDate().toArray();

                        // 刷新
                        this.date();

                        // 如果在时间范围内
                        if (eleContainer.querySelector('.' + SELECTED + '[href]')) {
                            this.value();
                        }
                    } else if (/item/.test(eleClicked.className)) {
                        // 选择某日期啦
                        numDay = eleClicked.innerHTML;

                        // 含有非数字，认为是今天
                        if (/\D/.test(numDay)) {
                            // 今天
                            this[SELECTED] = new Date().toArray();
                        } else {
                            if (numDay < 10) {
                                numDay = '0' + numDay;
                            }
                            // 修改全局
                            this[SELECTED][2] = numDay;
                        }

                        // 赋值
                        this.value();
                        // 隐藏
                        this.hide();

                        delete eleContainer.dataDayOverflow;
                    } else if (eleClicked.getAttribute('data-type') == 'month') {
                        // 切换到年份选择
                        this.month();
                    }
                    break;
                }
                case 'date-range': {
                    // 区域选择
                    // 1. 前后月份选择
                    if (/prev|next/.test(eleClicked.className)) {
                        numMonth = eleClicked.getAttribute('data-month') * 1;

                        arrRange = eleContainer.dataDate || this[SELECTED][0];

                        // 跟其他面板不同，这里只刷新，点击确定再赋值
                        eleContainer.dataDate = new Date(arrRange[0], numMonth - 1, 1).toArray();
                        // 之前arrRange[2]存在跨多月风险，尤其31号的日子
                        // 刷新
                        this['date-range']();
                    } else if (/item/.test(eleClicked.className)) {
                        // 选择某日期
                        // 获得选中的年月日
                        numYear = eleClicked.getAttribute('data-year');
                        numMonth = eleClicked.getAttribute('data-month');
                        numDay = eleClicked.innerHTML;

                        // 位数不足补全
                        if (numMonth < 10) {
                            numMonth = '0' + numMonth;
                        }
                        if (numDay < 10) {
                            numDay = '0' + numDay;
                        }
                        // 根据选中状态决定新的状态
                        dataRange = this[SELECTED];
                        if (dataRange[0].join() == dataRange[1].join()) {
                            // 如果之前前后日期一样，说明只选中了一个日期
                            // 根据前后顺序改变其中一个日期
                            if (numYear + numMonth + numDay > dataRange[0].join('')) {
                                // 新时间靠后
                                dataRange[1] = [numYear, numMonth, numDay];
                            } else {
                                dataRange[0] = [numYear, numMonth, numDay];
                            }
                        } else {
                            // 如果前后时间不一样，说明现在有范围
                            // 则取消范围，变成单选
                            dataRange = [[numYear, numMonth, numDay], [numYear, numMonth, numDay]];
                        }
                        this[SELECTED] = dataRange;

                        this['date-range']();
                    } else if (/button/.test(eleClicked.className)) {
                        strTypeButton = eleClicked.getAttribute('data-type');
                        if (strTypeButton == 'primary') {
                            // 点击确定按钮
                            // 赋值
                            this.value();
                            // 修改存储值
                            this.dataRangeSelected = this[SELECTED];
                            // 关闭浮层
                            this.hide();
                        } else if (strTypeButton == 'normal') {
                            // 重置选中值
                            if (this.dataRangeSelected) {
                                this[SELECTED] = this.dataRangeSelected;
                            }
                            // 关闭浮层
                            this.hide();
                        }
                    }
                    break;
                }
                case 'month-range': {
                    // 区域选择
                    // 1. 前后年份选择
                    if (/prev|next/.test(eleClicked.className)) {
                        numYear = eleClicked.getAttribute('data-year') * 1;

                        arrRange = eleContainer.dataDate || this[SELECTED][0];

                        // 跟其他面板不同，这里只刷新，点击确定再赋值
                        eleContainer.dataDate = new Date(numYear, arrRange[1], 1).toArray();
                        // 刷新
                        this['month-range']();
                    } else if (/item/.test(eleClicked.className)) {
                        // 选择某日期
                        // 获得选中的年月日
                        numYear = eleClicked.getAttribute('data-year');
                        numMonth = eleClicked.getAttribute('data-value');
                        numDay = '01';
                        // 根据选中状态决定新的状态
                        dataRange = this[SELECTED];
                        if (dataRange[0].join() == dataRange[1].join()) {
                            // 如果之前前后日期一样，说明只选中了一个日期
                            // 根据前后顺序改变其中一个日期
                            if (numYear + numMonth + numDay > dataRange[0].join('')) {
                                // 新时间靠后
                                dataRange[1] = [numYear, numMonth, numDay];
                            } else {
                                dataRange[0] = [numYear, numMonth, numDay];
                            }
                        } else {
                            // 如果前后时间不一样，说明现在有范围
                            // 则取消范围，变成单选
                            dataRange = [[numYear, numMonth, numDay], [numYear, numMonth, numDay]];
                        }
                        this[SELECTED] = dataRange;
                        this['month-range']();
                    } else if (/button/.test(eleClicked.className)) {
                        strTypeButton = eleClicked.getAttribute('data-type');
                        if (strTypeButton == 'primary') {
                            // 点击确定按钮
                            // 赋值
                            this.value();
                            // 修改存储值
                            this.dataRangeSelected = this[SELECTED];
                            // 关闭浮层
                            this.hide();
                        } else if (strTypeButton == 'normal') {
                            // 重置选中值
                            if (this.dataRangeSelected) {
                                this[SELECTED] = this.dataRangeSelected;
                            }
                            // 关闭浮层
                            this.hide();
                        }
                    }

                    break;
                }
                case 'month': {
                    // 选择月份，可能从年份，也可能从日期过来
                    // 1. 前后年份
                    if (/prev|next/.test(eleClicked.className)) {
                        numYear = eleClicked.getAttribute('data-year');
                        // 修改当前选中的年份数
                        this[SELECTED][0] = numYear * 1;
                        // 刷新
                        this.month();
                        // 文本框赋值
                        // 如果在区域内状态
                        if (eleContainer.querySelector('.' + SELECTED + '[href]')) {
                            this.value();
                        }
                    } else if (/item/.test(eleClicked.className)) {
                        // value实际上是月份两位数值
                        var value = eleClicked.getAttribute('data-value');
                        if (value) {
                            this[SELECTED][1] = value;
                        } else {
                            // 今月，只改变年月为今年和今月
                            var arrToday = new Date().toArray();
                            this[SELECTED][0] = arrToday[0];
                            this[SELECTED][1] = arrToday[1];
                        }

                        // 赋值
                        this.value();

                        // 根据是否是月份输入框，决定是面板切换，还是关闭
                        if (this.params.type == 'month') {
                            // 隐藏
                            this.hide();
                        } else {
                            this.date();
                        }
                    } else if (eleClicked.getAttribute('data-type') == 'year') {
                        // 切换到年份选择
                        this.year();
                    }
                    break;
                }
                case 'year': {
                    // 选择年份，可能从月份过来，也可能直接打开
                    // 1. 前后12年翻页
                    if (/prev|next/.test(eleClicked.className)) {
                        numYear = eleClicked.getAttribute('data-year');
                        // 修改当前选中的年份数
                        this[SELECTED][0] = numYear * 1;
                        // 刷新
                        this.year();
                        // 文本框赋值
                        // 如果在区域内状态
                        if (eleContainer.querySelector('.' + SELECTED + '[href]')) {
                            this.value();
                        }
                    }  else if (/item/.test(eleClicked.className)) {
                        if (eleClicked.innerHTML == '今年') {
                            this[SELECTED][0] = new Date().getFullYear();
                        } else {
                            this[SELECTED][0] = eleClicked.innerHTML * 1;
                        }

                        // 赋值
                        this.value();
                        // 如果是年份选择输入框
                        if (this.params.type == 'year') {
                            // 隐藏
                            this.hide();
                        } else {
                            // 回到月份面板
                            this.month();
                        }
                    }

                    break;
                }
                case 'minute': {
                    // 选择分钟，可以是minute类型，或者time类型, 但不包括hour类型
                    // 1. 前后翻页
                    if (/prev|next/.test(eleClicked.className)) {
                        numHour = eleClicked.getAttribute('data-hour');
                        if (numHour.length == 1) {
                            numHour = '0' + numHour;
                        }
                        // 修改当前选中的小时数
                        this[SELECTED][0] = numHour;

                        // 刷新
                        this.minute();
                        // 文本框赋值
                        // 如果在区域内状态
                        if (eleContainer.querySelector('.' + SELECTED + '[href]'))    {
                            this.value();
                        }
                    } else if (/item/.test(eleClicked.className)) {
                        // 确定选择时间
                        this[SELECTED] = eleClicked.innerHTML.split(':');
                        this.value();
                        this.hide();
                    } else if (eleClicked.getAttribute('data-type') == 'hour') {
                        // 切换到小时选择
                        this.hour();
                    }

                    break;
                }
                case 'hour': {
                    if (/item/.test(eleClicked.className)) {
                        // 修改选中的小时
                        this[SELECTED][0] = eleClicked.innerHTML.split(':')[0];
                        // 赋值
                        this.value();

                        // 如果是从分钟模式切换过来，则切换回去，否则，直接隐藏
                        if (this.params.type == 'hour') {
                            this.hide();
                        } else {
                            this.minute();
                        }
                    }
                    break;
                }
            }
        }.bind(this));

        // 显隐控制
        eleTrigger.addEventListener('click', function (event) {
            event.preventDefault();

            // 显隐控制
            if (!this.display) {
                this.show();
            } else {
                this.hide();
            }
        }.bind(this));

        // 输入框元素行为
        eleInput.addEventListener('keydown', function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                this.click();
            }
        });

        // 时间范围选择点击页面空白区域不会隐藏
        document.addEventListener('mouseup', function (event) {
            // 点击页面空白区域，隐藏
            var eleTarget = event.target;

            if (eleTarget && eleTrigger.contains(eleTarget) == false && eleContainer.contains(eleTarget) == false) {
                this.hide();
            }
        }.bind(this));
    };

    /**
     * 输入框的值根据日期类型进行格式化
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.format = function () {
        // 根据当前value值修改实例对象缓存的选中值
        // 特殊情况一般不处理
        var strType = this.params.type;
        var eleInput = this.element.input;

        // 此时输入框初始值
        var strInitValue = eleInput && eleInput.value.trim();
        if (!strInitValue) {
            return this;
        }

        switch (strType) {
            case 'date': case 'year': case 'month': {
                // 日期
                var objInitDate = strInitValue.toDate();
                var arrDate = objInitDate.toArray();
                // eg. [2015,07,20]
                this[SELECTED] = arrDate;

                break;
            }
            case 'time': case 'hour': case 'minute': {
                var arrTime = strInitValue.split(':');
                // 时间
                var numHour = arrTime[0];
                var numMinute = arrTime[1];
                // 补0
                if (arrTime.length == 2) {
                    // 分钟无论如何都要是正常值
                    if (!(numMinute > 0 && numMinute < 60) || strType == 'hour') {
                        numMinute = '00';
                    } else if (numMinute.length == 1) {
                        numMinute = '0' + numMinute;
                    }
                    // 补0是必要的
                    if (numHour.length == 1) {
                        numHour = '0' + numHour;
                    }

                    eleInput.value = [numHour, numMinute].join(':');

                    this[SELECTED] = [numHour, numMinute];
                }

                break;
            }
            case 'date-range': case 'month-range': {
                // 日期范围
                var objBeginDate = new Date();
                var objEndDate = new Date();
                // 前后时间字符串
                var arrRange = strInitValue.split(' ');
                if (arrRange.length == 3) {
                    objBeginDate = arrRange[0].toDate();
                    objEndDate = arrRange[arrRange.length - 1].toDate();
                    // 存储
                    this[SELECTED] = [objBeginDate.toArray(), objEndDate.toArray()];
                }
                break;
            }
        }

        return this;
    };

    /**
     * 赋值
     * @return {Object} 返回当前输入框的值
     */
    DateTime.prototype.value = function () {
        var eleInput = this.element.input;
        var arrSelected = this[SELECTED];
        var strValue = eleInput.value;

        switch (this.params.type) {
            case 'date': {
                eleInput.value = arrSelected.join('-');
                break;
            }
            case 'month': {
                eleInput.value = arrSelected.slice(0, 2).join('-');
                break;
            }
            case 'year': {
                eleInput.value = arrSelected[0];
                break;
            }
            case 'date-range': {
                eleInput.value = arrSelected[0].join('-') + ' 至 ' + arrSelected[1].join('-');
                break;
            }
            case 'month-range': {
                eleInput.value = arrSelected[0].slice(0, 2).join('-') + ' 至 ' + arrSelected[1].slice(0, 2).join('-');
                break;
            }
            case 'time':  case 'minute': {
                eleInput.value = arrSelected.join(':');
                break;
            }
            case 'hour': {
                eleInput.value = arrSelected[0] + ':00';
                break;
            }
        }

        if (eleInput.value != strValue) {
            eleInput.dispatchEvent(new CustomEvent('change', {
                'bubbles': true
            }));
        }

        return eleInput.value;
    };

    /**
     * 返回日历HTML字符串等数据的私有方法
    // 因date和range浮层主结构类似，因此这里公用下
     * @param  {Array} arrDate 格式化为数组的日期
     * @return {Object}     返回包含需要的数据的对象，生成的HTML字符内容以及最大最小月份等
     */
    Object.defineProperty(DateTime.prototype, 'getCalendarData', {
        value: function (arrDate) {
            var strHtml = '';
            // 根据当前日期数据返回
            // eg. [2015,'02', 23]

            // 文本框元素比较常用，使用局部变量，一是节约文件大小，二是性能更好！
            var eleInput = this.element.input;

            // 类型
            var strType = this.params.type;

            // 最大日期和最小日期
            var numMin = eleInput.getAttribute('min') || this.params.min;
            var numMax = eleInput.getAttribute('max') || this.params.max;
            // 这里使用日期对象(时间戳)做比对

            var arrMapMinMax = [numMin, numMax].map(function (minMax, index) {
                if (typeof minMax == 'string' && /^\d{8}$/.test(minMax.replace(regDate, '')) == true) {
                    // 这里对字符串进行比较简单的合法性判别
                    // 自己人使用不会乱来的
                    minMax = minMax.toDate();
                } else if (typeof minMax != 'object' || !minMax.getTime) {
                    minMax = index ? new Date(9999, 0, 1) : new Date(0, 0, 1);
                }

                return minMax;
            });

            numMin = arrMapMinMax[0];
            numMax = arrMapMinMax[1];

            var arrChinese = ['日', '一', '二', '三', '四', '五', '六'];
            var arrMonthDay = this.getMonthDay(arrDate);

            // 目前日期对象
            var currentDate = arrDate.join('-').toDate();

            // 3 星期几七大罪
            strHtml = strHtml + '<div class="' + CL.day('x') + '">' + (function () {
                var strHtmlDay = '';
                arrChinese.forEach(function (strChineseDay, indexDay) {
                    strHtmlDay = strHtmlDay + '<span class="' + CL.day('item') + ' col' + indexDay + '">' + strChineseDay + '</span>';
                });

                return strHtmlDay;
            })() + '</div>';

            // 4. 日期详细
            //  4.1 首先算出今月1号是星期几
            var objNewDate = arrDate.join('-').toDate();
            var numDayFirst = 0;
            // 设置为1号
            objNewDate.setDate(1);

            if (objNewDate.getDate() == 2) {
                objNewDate.setDate(0);
            }
            // 每月的第一天是星期几
            numDayFirst = objNewDate.getDay();
            // 上个月是几月份
            var numLastMonth = objNewDate.getMonth() - 1;
            if (numLastMonth < 0) {
                numLastMonth = 11;
            }

            var strHtmlData = 'data-year="' + arrDate[0] + '" data-month="' + (objNewDate.getMonth() + 1) + '"';
            var strHtmlYearMonthData = 'data-date=';
            var strHtmlFullData = '';

            strHtml = strHtml + '<div class="' + CL.date('body') + '">' + (function () {
                var strHtmlDate = '';
                var strClass = '';

                // 列表生成
                for (var tr = 0; tr < 6; tr++) {
                    strHtmlDate = strHtmlDate + '<div class="' + CL.date('tr') + '">';

                    // 日期遍历
                    for (var td = 0; td < 7; td++) {
                        // 类名
                        strClass = CL.date('item') + ' col' + td;

                        // 今天
                        var numYearNow = arrDate[0];
                        var numMonthNow = objNewDate.getMonth() + 1;
                        var numDayNow;
                        var objDateNow;

                        // 由于range选择和date选择UI上有比较大大差异
                        // 为了可读性以及后期维护
                        // 这里就不耦合在一起，而是分开处理
                        if (strType == 'date') {
                            // 第一行上个月一些日期补全
                            if (tr == 0 && td < numDayFirst) {
                                // 当前日子
                                numDayNow = arrMonthDay[numLastMonth] - numDayFirst + td + 1;
                                // 当前日期
                                objDateNow = new Date(numYearNow, numLastMonth, numDayNow);
                                // 完整data-date属性及其值
                                strHtmlFullData = strHtmlYearMonthData + objDateNow.toArray().join('-');
                                // HTML拼接
                                strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                            } else {
                                // 当前日子
                                numDayNow = tr * 7 + td - numDayFirst + 1;
                                // 如果没有超过这个月末
                                if (numDayNow <= arrMonthDay[objNewDate.getMonth()]) {
                                    // 这个日子对应的时间对象
                                    objDateNow = new Date(numYearNow, objNewDate.getMonth(), numDayNow);
                                    // 完整data-date属性及其值
                                    strHtmlFullData = strHtmlYearMonthData + objDateNow.toArray().join('-');
                                    // 如果日子匹配
                                    if (currentDate.getDate() == numDayNow) {
                                        strClass = strClass + ' ' + SELECTED;
                                    }
                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = strHtmlDate + '<a href="javascript:;" ' + strHtmlData + ' class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</a>';
                                    } else {
                                        strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                                    }
                                } else {
                                    numDayNow = numDayNow - arrMonthDay[objNewDate.getMonth()];
                                    // 更新strHtmlFullData
                                    strHtmlFullData = strHtmlYearMonthData + new Date(numYearNow, numMonthNow, numDayNow).toArray().join('-');
                                    // 日期字符拼接
                                    strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                                }
                            }
                        } else if (strType == 'date-range') {
                            // 非当前月部分使用空格补全
                            if (tr == 0 && td < numDayFirst) {
                                strHtmlDate = strHtmlDate + '<span class="' + strClass + '"></span>';
                            } else {
                                numDayNow = tr * 7 + td - numDayFirst + 1;
                                // 如果没有超过这个月末
                                if (numDayNow <= arrMonthDay[objNewDate.getMonth()]) {
                                    // 这个日子对应的时间对象
                                    objDateNow = new Date(numYearNow, objNewDate.getMonth(), numDayNow);

                                    // 完整data-date属性及其值
                                    strHtmlFullData = strHtmlYearMonthData + objDateNow.toArray().join('-');

                                    // range选择的匹配规则如下：
                                    // 1. 获得已经选中到时间范围
                                    // 2. 起始时间和结束时间是方框表示
                                    // 3. 之间的时间是选中表示
                                    var dateBegin = this[SELECTED][0].join('-').toDate();
                                    var dateEnd = this[SELECTED][1].join('-').toDate();

                                    // 各个时间的时间戳
                                    var timeNow = objDateNow.getTime();
                                    var timeBegin = dateBegin.getTime();
                                    var timeEnd = dateEnd.getTime();

                                    if (timeNow >= timeBegin && timeNow <= timeEnd) {
                                        // 在时间范围之内
                                        strClass = strClass + ' ' + SELECTED;
                                        // 跟开始时间一样
                                        if (timeNow == timeBegin) {
                                            strClass = strClass + ' ' + CL.date('begin');
                                        }
                                        // 跟结束时间一样
                                        if (timeNow == timeEnd) {
                                            strClass = strClass + ' ' + CL.date('end');
                                        }
                                        // 今月的第一天还是最后一天
                                        if (numDayNow == 1) {
                                            strClass = strClass + ' ' + CL.date('first');
                                        } else if (numDayNow == arrMonthDay[objNewDate.getMonth()]) {
                                            strClass = strClass + ' ' + CL.date('last');
                                        }
                                    }

                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = strHtmlDate + '<a href="javascript:;" ' + strHtmlData + ' class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</a>';
                                    } else {
                                        strHtmlDate = strHtmlDate + '<span class="' + strClass + '" ' + strHtmlFullData + '>' + numDayNow + '</span>';
                                    }
                                } else {
                                    strHtmlDate = strHtmlDate + '<span class="' + strClass + '"></span>';
                                }
                            }
                        }
                    }
                    strHtmlDate += '</div>';
                }

                return strHtmlDate;
            }).call(this) + '</div>';

            return {
                monthDay: arrMonthDay,
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }
    });

    /**
     * 月份组装
     * @param  {Array} arrDate 数组化的日期表示值
     * @return {Object}        返回的是后续方法需要的数据的纯对象，包括组装的HTML字符数据，月份最大和最小值。
     */
    Object.defineProperty(DateTime.prototype, 'getMonthData', {
        value: function (arrDate) {
            // 文本框元素
            var eleInput = this.element.input;

            // 最大月份和最小月份
            var numMin = eleInput.getAttribute('min') || this.params.min;
            var numMax = eleInput.getAttribute('max') || this.params.max;

            // 这里使用年月组合做比对
            var arrMapMinMax = [numMin, numMax].map(function (minMax, index) {
                if (typeof minMax == 'object' && minMax.getTime) {
                    minMax = minMax.toArray().slice(0, 2).join('');
                } else if (typeof minMax == 'string' && /\D/.test(minMax.replace(regDate, '')) == false) {
                    // 这里对字符串进行比较简单的合法性判别
                    // 自己人使用不会乱来的
                    minMax = minMax.replace(regDate, '').slice(0, 6);
                } else {
                    minMax = index ? '999912' : '000000';
                }

                return minMax;
            });

            numMin = arrMapMinMax[0];
            numMax = arrMapMinMax[1];

            var arrChinese = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

            // 年份
            var numYear = arrDate[0] * 1;

            // 类型
            var strType = this.params.type;

            var strHtml = '<div class="' + CL.month('body') + '">' + (function () {
                var strHtmlDate = '';
                var strClass = '';
                var strMonth = '';

                for (var i = 1; i <= 12; i += 1) {
                    // 合法格式字符串
                    if (i < 10) {
                        strMonth = '0' + i;
                    } else {
                        strMonth = i + '';
                    }

                    // 基本类名
                    strClass = CL.date('item');

                    if (strType == 'month') {
                        if (i == arrDate[1]) {
                            // 选中态的类名
                            strClass = strClass + ' ' + SELECTED;
                        }
                    } else if (strType == 'month-range') {
                        // range选择的匹配规则如下：
                        // 1. 获得已经选中到时间范围
                        // 2. 起始时间和结束时间是选中表示
                        // 3. 之间的时间也是选中表示
                        var strBegin = this[SELECTED][0].slice(0, 2).join('');
                        var strEnd = this[SELECTED][1].slice(0, 2).join('');
                        var strNow = numYear + strMonth;
                        if (strNow >= strBegin && strNow <= strEnd)  {
                            strClass = strClass + ' ' + SELECTED;
                        }
                    }
                    // 是否在范围以内
                    if (numYear + strMonth >= numMin && numYear + strMonth <= numMax) {
                        strHtmlDate = strHtmlDate + '<a href="javascript:" class="' + strClass + '" data-year="' + numYear + '" data-value="' + strMonth + '">' + arrChinese[i - 1] + '月</a>';
                    } else {
                        strHtmlDate = strHtmlDate + '<span class="' + strClass + '" data-value="' + strMonth + '">' + arrChinese[i - 1] + '月</span>';
                    }
                }

                return strHtmlDate;
            }).call(this) +
            '</div>';

            return {
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }
    });

    /**
     * 当前日期下这一年每月最大的日期数目
     * @param  {Array} date 格式化为数组的日期
     * @return {Array}      返回这一年每月最大的日期数目
     */
    Object.defineProperty(DateTime.prototype, 'getMonthDay', {
        value: function (date) {
            var arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                arrDate = date.toArray();
            }

            var arrMonthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            // 如果是闰年
            if (((arrDate[0] % 4 == 0) && (arrDate[0] % 100 != 0)) || (arrDate[0] % 400 == 0)) {
                arrMonthDay[1] = 29;
            }

            return arrMonthDay;
        }
    });


    /**
     * 上个月同日期
     * @param  {Array} date 格式化为数组的日期
     * @return {Object}     返回Date类型对象
     */
    Object.defineProperty(DateTime.prototype, 'getDatePrevMonth', {
        value: function (date) {
            // add on 2016-03-31
            // 原先的加减月份的跨月计算是有些问题的
            // 因为例如31号的下一月，系统会自动变成下下个月的1号
            var arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            var numMonth = arrDate[1] * 1;
            var arrMonthDay = this.getMonthDay(arrDate);

            if (numMonth == 1) {
                // 上个月是前一年的12月
                // 12月有31号，无压力
                return [arrDate[0] - 1, 12, arrDate[2]].join('-').toDate();
            }

            // 其他月份不跨年
            // 如果上一个月的最后1天小于本月的最后1天
            // 嘿嘿嘿嘿
            // 年不变，月减一，日期下个月
            if (arrMonthDay[numMonth - 2] < arrDate[2]) {
                return [arrDate[0], numMonth - 1, arrMonthDay[numMonth - 2]].join('-').toDate();
            }

            // 年不变，月减一，日期不变
            return [arrDate[0], numMonth - 1, arrDate[2]].join('-').toDate();
        }
    });


    /**
     * 下个月同日期
     * @param  {Array} date 格式化为数组的日期
     * @return {Object}     返回Date类型对象
     */
    Object.defineProperty(DateTime.prototype, 'getDateNextMonth', {
        value: function (date) {
            var arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            var numMonth = arrDate[1] * 1;
            var arrMonthDay = this.getMonthDay(arrDate);

            if (numMonth == 12) {
                // 下个月跨年了
                // 1月份也有31天，无压力
                return [arrDate[0] + 1, 1, arrDate[2]].join('-').toDate();
            }

            // 其他月份不跨年
            // 如果下个月最后1天小于本月最后1天，例如，3月31日
            if (arrMonthDay[numMonth] < arrDate[2]) {
                return [arrDate[0], numMonth + 1, arrMonthDay[numMonth]].join('-').toDate();
            }

            // 其他时候正常
            return [arrDate[0], numMonth + 1, arrDate[2]].join('-').toDate();
        }
    });

    /**
     * 选择日期
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.date = function () {
        var eleContainer = this.element.container;


        var arrDate = this[SELECTED];

        // 上一个月
        var numPrevMonth = arrDate[1] - 1;
        // 下一个月
        var numNextMonth = arrDate[1] * 1 + 1;

        var objCalender = this.getCalendarData(arrDate);

        // 选择日期的完整HTML代码
        // 1. 日期专属类名容器
        var strHtml = '<div class="' + CL.date('x') + '">';
        // 2. 头部月份切换
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';
        // 根据前后月份是否在范围之外，决定使用的标签类型
        // span标签则是禁用态，本组件全部都是如此
        // 2.1 上个月
        // datePrevMonth指上个月日期
        var datePrevMonth = this.getDatePrevMonth(arrDate);
        // numPrevMonth指上个月
        var numPrevMonthGet = datePrevMonth.getMonth();
        var numPrevYearGet = datePrevMonth.getFullYear();

        // add on 2015-12-01
        // 原来的判断逻辑有问题
        // 只要上个月份的最大日期比最小限制大就可以了
        if (new Date(numPrevYearGet, numPrevMonthGet, objCalender.monthDay[numPrevMonthGet]) >= objCalender.min && datePrevMonth <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-month="' + numPrevMonth + '" role="button" aria-label="上一月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '" aria-label="上一月">' + this.svg + '</span>';
        }

        // 2.2 下个月
        var objDateNextMonth = this.getDateNextMonth(arrDate);
        var numNextMonthGet = objDateNextMonth.getMonth();
        var numNextYearGet = objDateNextMonth.getFullYear();
        //if (objDateNextMonth >= objCalender.min && objDateNextMonth <= objCalender.max) {
        // add on 2015-12-01
        // 经反馈，如果当前日期是30号，但是最大日期是下月1号，则下个月不能进入
        // 这是有问题的
        // 原因是此时的objDateNextMonth > objCalender.max
        // 因此判断应该从月初
        if (objDateNextMonth >= objCalender.min && new Date(numNextYearGet, numNextMonthGet, 1) <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-month="' + numNextMonth + '" role="button" aria-label="下一月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '" aria-label="下一月">' + this.svg + '</span>';
        }

        //   头部月份公用结束
        strHtml = strHtml + '<a href="javascript:" class="' + CL.date('switch') + '" data-type="month" role="button" aria-label="快速切换月份">' + arrDate.slice(0, 2).join('-') + '</a>\
        </div>';

        // 3. 主体内容来自getCalendarData()方法
        strHtml += objCalender.html;

        // 今天
        // 首先，今天要在时间范围内
        if (new Date() >= objCalender.min && new Date() <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('item') + ' ' + CL.date('now') + '" role="button">今天</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('item') + ' ' + CL.date('now') + '">今天</span>';
        }

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'date');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择日期范围
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype['date-range'] = function () {
        var eleContainer = this.element.container;


        // 选择的日期范围数组
        var arrDates = this[SELECTED];
        // 当前起始日期
        // 默认（第一次）打开使用选中日期
        // 如果有，使用面板存储月份
        // 因为range选择不是即时更新文本框
        var arrDate = eleContainer.dataDate || arrDates[0];
        eleContainer.dataDate = arrDate;
        // 前一个月
        var numPrevMonth = arrDate[1] - 1;
        // 后一个月
        var numNextMonth = arrDate[1] * 1 + 1;

        // 含时间范围和对应月份日历HTML的对象
        var objCalender = this.getCalendarData(arrDate);

        // 选择时间范围完整HTML代码
        // 1. 同样的，range容器
        var strHtml = '<div class="' + CL.range('x') + '">';
        // 2. 头部
        strHtml = strHtml + '<div class="' + CL.date('head') + '">\
            <div class="' + CL.date('half') + '">';
        //  2.1 上一个月箭头
        var datePrevMonth = new Date(arrDate[0], numPrevMonth - 1, arrDate[2]);
        if (datePrevMonth >= objCalender.min && datePrevMonth <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-month="' + numPrevMonth + '" aria-label="上一个月，当前' + arrDate[1] + '月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '">' + this.svg + '</span>';
        }
        // 今月月份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + new Date(arrDate[0], numPrevMonth, arrDate[2]).toArray().slice(0, 2).join('-') + '</span>\
        </div>\
        <div class="' + CL.date('half') + '">';

        // 2.2 下下个月
        var objDateNextMonth = new Date(arrDate[0], arrDate[1], 1);
        var objDateAfterMonth = new Date(arrDate[0], numNextMonth, arrDate[2]);

        // 例如是3月31日
        // 此时 arrDate[1] '03'
        // numNextMonth 是 4

        // 此时原来的实现是由bug的
        // 因为下个月没有4月31日，于是，就会变成5月
        // 因此arrDate[2]应使用1代替

        // 下个月的当前日期在合理范围之内，则使用该月
        if (objDateAfterMonth >= objCalender.min && objDateAfterMonth <= objCalender.max) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-month="' + numNextMonth + '" aria-label="下一个月，当前' + numNextMonth + '月">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        }

        // 下月月份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + objDateNextMonth.toArray().slice(0, 2).join('-') + '</span>\
        </div>';

        // 头部闭合
        strHtml += '</div>';

        // 3. 两个主体列表
        // 这里要嵌套一层range特有的body
        strHtml = strHtml + '<div class="' + CL.range('body') + ' ' + CL.range('date', 'body') + '">' +
        // 根据getCalendarData()方法创建两个月份日历
            '<div class="' + CL.date('half') + '">' + objCalender.html + '</div>' +
            '<div class="' + CL.date('half') + '">' + this.getCalendarData(objDateNextMonth.toArray()).html + '</div>' +
        // 主体标签闭合
        '</div>';

        // 4. 确定与取消按钮
        strHtml = strHtml + '<div class="' + CL.range('footer') + '">' +
            '<button class="ui-button" data-type="primary">确定</button>' +
            '<button class="ui-button" data-type="normal">取消</button>' +
        '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'date-range');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择月份
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.month = function () {
        var eleContainer = this.element.container;

        // 当前选择日期
        var arrDate = this[SELECTED];
        // 对应的月份数据
        var objMonth = this.getMonthData(arrDate);

        // 返回的最大值最小值
        var numMin = objMonth.min;
        var numMax = objMonth.max;

        // 选择月份的完整HTML代码
        // 1. month专属类名容器
        var strHtml = '<div class="' + CL.month('x') + '">';
        // 2. 月份切换的头部
        var numYear = arrDate[0] * 1;
        //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
        //    例如，假设今年是2015年，则头部年份范围是2009-2020
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';
        //    2.1 是否还有上一年
        if (numYear - 1 >= Math.floor(numMin / 100) && numYear - 1 <= Math.floor(numMax / 100)) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-year="' + (numYear - 1) + '" role="button" aria-label="上一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '" aria-label="上一年">' + this.svg + '</span>';
        }
        // 2.2 是否还有下一年
        if (numYear + 1 >= Math.floor(numMin / 100) && numYear + 1 <= Math.floor(numMax / 100)) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-year="' + (numYear + 1) + '" role="button" aria-label="下一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        }
        // 头部结束
        strHtml = strHtml + '<a href="javascript:" class="' + CL.date('switch') + '" data-type="year" role="button" aria-label="快速切换年份">' + numYear + '</a>\
        </div>';
        // 3. 月份切换主体列表
        strHtml += objMonth.html;

        // 今月
        // 首先，今月要在时间范围内
        var objThisYearMonth = new Date().toArray().slice(0, 2).join('');
        if (objThisYearMonth >= numMin && objThisYearMonth <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('item') + ' ' + CL.date('now') + '">今月</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('item') + ' ' + CL.date('now') + '">今月</span>';
        }

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'month');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择月份范围
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype['month-range'] = function () {
        var eleContainer = this.element.container;

        // 当前选择日期
        var arrDates = this[SELECTED];
        // 当前起始日期
        // 默认（第一次）打开使用选中日期
        // 如果有，使用面板存储月份
        // 因为range选择不是即时更新文本框
        var arrDate = eleContainer.dataDate || arrDates[0];
        eleContainer.dataDate = arrDate;
        // 前一年
        var numPrevYear = arrDate[0] * 1 - 1;
        // 后一个年
        var numNextYear = arrDate[0] * 1 + 1;

        // 含时间范围和对应月份日历HTML的对象
        var objMonth = this.getMonthData(arrDate);
        // 最大年份
        var numMaxYear = objMonth.max.slice(0, 4);
        var numMinYear = objMonth.min.slice(0, 4);

        // 选择时间范围完整HTML代码
        // 1. 同样的，range容器
        var strHtml = '<div class="' + CL.range('x') + '">';
        // 2. 头部
        strHtml = strHtml + '<div class="' + CL.date('head') + '">\
            <div class="' + CL.date('half') + '">';
        //  2.1 上一年箭头
        if (numPrevYear >= numMinYear && numPrevYear <= numMaxYear) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-year="' + numPrevYear + '" role="button" aria-label="上一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '" aria-label="上一年">' + this.svg + '</span>';
        }
        // 今年年份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + arrDate[0] + '</span>\
        </div>\
        <div class="' + CL.date('half') + '">';

        // 2.2 下一年
        if (numNextYear >= numMinYear && numNextYear < numMaxYear) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-year="' + numNextYear + '" role="button" aria-label="下一年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '" aria-label="下一年">' + this.svg + '</span>';
        }

        // 下月月份显示
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + numNextYear + '</span>\
        </div>';

        // 头部闭合
        strHtml += '</div>';

        // 3. 两个主体列表
        // 这里要嵌套一层range特有的body
        strHtml = strHtml + '<div class="' + CL.range('body') + ' ' + CL.range('month', 'body') + '">' +
        // 根据getCalendarData()方法创建两个月份日历
            '<div class="' + CL.date('half') + '">' + objMonth.html + '</div>' +
            '<div class="' + CL.date('half') + '">' + this.getMonthData([numNextYear, arrDate[1], arrDate[2]]).html + '</div>' +
        // 主体标签闭合
        '</div>';

        // 4. 确定与取消按钮
        strHtml = strHtml + '<div class="' + CL.range('footer') + '">' +
            '<button class="ui-button" data-type="primary">确定</button>' +
            '<button class="ui-button" data-type="normal">取消</button>' +
        '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'month-range');
        eleContainer.innerHTML = strHtml;

        return this;
    };


    /**
     * 选择年份
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.year = function () {
        // 元素
        var eleInput = this.element.input;
        var eleContainer = this.element.container;

        // 当前选择日期
        var arrDate = this[SELECTED];

        // 最小年份和最大年份
        var numMin = eleInput.getAttribute('min') || this.params.min;
        var numMax = eleInput.getAttribute('max') || this.params.max;

        // 用户可能使用时间对象
        if (typeof numMin == 'object' && numMin.getFullYear) {
            numMin = numMin.getFullYear();
        } else if (typeof numMin == 'string' && /\D/.test(numMin.replace(regDate, '')) == false) {
            // 这里对字符串进行比较简单的合法性判别
            // 自己人使用不会乱来的
            numMin = numMin.toDate().getFullYear();
        } else {
            numMin = 0;
        }
        if (typeof numMax == 'object' && numMax.getFullYear) {
            numMax = numMax.getFullYear();
        } else if (typeof numMax == 'string' && /\D/.test(numMax.replace(regDate, '')) == false) {
            numMax = numMax.toDate().getFullYear();
        } else {
            numMax = 9999;
        }

        // 选择年份的完整HTML代码
        // 1. 同样的，year专属类名容器
        var strHtml = '<div class="' + CL.year('x') + '">';
        // 2. 头部的年份切换，一切就是12年
        //    有必要先知道当前的年份
        var numYear = arrDate[0];
        //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
        //    例如，假设今年是2015年，则头部年份范围是2009-2020
        //    左右切换是没有限制的
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';
        //    年份不是你想翻就能翻到
        //    2.1 上一个12年
        if (numYear - 12 >= numMin && numYear - 12 <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-year="' + (numYear - 12) + '" role="button" aria-label="上一个12年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '">' + this.svg + '</span>';
        }
        //    2.2 下一个12年
        if (numYear + 12 >= numMin && numYear + 12 <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-year="' + (numYear + 12) + '" role="button" aria-label="下一个12年">' + this.svg + '</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        }
        // year选择是顶级类别，一定是不可点击的
        strHtml = strHtml + '<span class="' + CL.date('switch') + '">' + [numYear - 6, numYear + 5].join('-') + '</span></div>';

        // 3. 年份选择的主体
        strHtml = strHtml + '<div class="' + CL.year('body') + '">' + (function () {
            var strHtmlDate = '';
            var strClass = '';

            for (var indexYear = numYear - 6; indexYear < numYear + 6; indexYear += 1) {
                // 选中态的类名
                strClass = CL.date('item');

                if (indexYear == numYear) {
                    strClass = strClass + ' ' + SELECTED;
                }

                // 是否在范围以内
                if (indexYear >= numMin && indexYear <= numMax) {
                    strHtmlDate = strHtmlDate + '<a href="javascript:" class="' + strClass + '">' + indexYear + '</a>';
                } else {
                    strHtmlDate = strHtmlDate + '<span class="' + strClass + '">' + indexYear + '</span>';
                }
            }

            return strHtmlDate;
        })() + '</div>';

        // 今年
        // 首先，今年要在时间范围内
        var numThisYear = new Date().getFullYear();
        if (numThisYear >= numMin && numThisYear <= numMax) {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('item') + ' ' + CL.date('now') + '" role="button">今年</a>';
        } else {
            strHtml = strHtml + '<span class="' + CL.date('item') + ' ' + CL.date('now') + '">今年</span>';
        }

        // 头部标签闭合
        strHtml += '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'year');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择小时
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.hour = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleInput = this.element.input;

        // 当前选择时间
        var arrTime = this[SELECTED];

        // 时间选择的小时间隔，默认是1小时
        var numStep = eleInput.getAttribute('step') * 1;
        if (this.params.type != 'hour' || !numStep || numStep < 1) {
            numStep = 1;
        } else {
            numStep = Math.round(numStep);
        }

        // 最小时间，和最大时间
        // 这里只比较小时
        var numMin = (eleInput.getAttribute('min') || this.params.min.toString()).split(':')[0];
        var numMax = (eleInput.getAttribute('max') || this.params.max.toString()).split(':')[0];

        if (/\D/.test(numMin)) {
            numMin = 0;
        } else {
            numMin *= 1;
        }
        if (/\D/.test(numMax)) {
            numMax = 24;
        } else {
            numMax *= 1;
        }

        // 选择小时的完整HTML
        // 1. 同样的，专有容器
        var strHtml = '<div class="' + CL.hour('x') + '">';
        // 2. 小时没有头部切换，直接列表们
        strHtml = strHtml + '<div class="' + CL.hour('body') + '">' + (function () {
            var strHtmlTime = '';
            var strHour = '';
            var strClass = '';
            // 遍历24小时
            for (var indexHour = 0; indexHour < 24; indexHour += numStep) {
                strHour = indexHour + '';
                if (strHour.length == 1) {
                    strHour = '0' + strHour;
                }

                // 选中态的类名
                strClass = CL.date('item');
                if (strHour == arrTime[0]) {
                    strClass = strClass + ' ' + SELECTED;
                }

                // 是否在范围以内
                if (strHour >= numMin && strHour <= numMax) {
                    strHtmlTime = strHtmlTime + '<a href="javascript:" class="' + strClass + '">' + strHour + ':00</a>';
                } else {
                    strHtmlTime = strHtmlTime + '<span class="' + strClass + '">' + strHour + ':00</span>';
                }
            }

            return strHtmlTime;
        })() + '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'hour');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 选择分钟
     * @return {Object} 返回当前实例对象
     */
    DateTime.prototype.minute = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleInput = this.element.input;

        // 当前选择时间
        var arrTime = this[SELECTED];

        // 分钟时间间隔, 默认为5分钟
        var numStep = eleInput.getAttribute('step') * 1 || 5;

        // 最小时间，和最大时间
        // 跟小时不同，这里必须符合00:00格式
        // 由于格式固定，我们直接去除':'后的值进行比较
        // 例如：10:20 → 1020
        var numMin = eleInput.getAttribute('min') || (this.params.min + '');
        var numMax = eleInput.getAttribute('max') || (this.params.max + '');

        if (numMin == 'auto' || /\D/.test(numMin.replace(':', '')) || numMin.split(':').length != 2) {
            numMin = 0;
        } else {
            numMin = numMin.replace(':', '') * 1;
        }
        if (numMax == 'auto' || /\D/.test(numMax.replace(':', '')) || numMax.split(':').length != 2) {
            numMax = 2359;
        } else {
            numMax = numMax.replace(':', '') * 1;
        }

        // 选择分钟的完整HTML
        // 1. 外部的容器，含有专有容器类名，可以重置内部的一些样式
        var strHtml = '<div class="' + CL.minute('x') + '" data-step="' + numStep + '">';
        // 2. 头部小时的左右切换
        var hour = arrTime[0] * 1;
        //   首先是公共部分
        strHtml = strHtml + '<div class="' + CL.date('head') + '">';


        //   2.1 可不可往前翻
        if (hour <= Math.floor(numMin / 100)) {
            strHtml = strHtml + '<span class="' + CL.date('prev') + '">' + this.svg + '</span>';
        } else {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('prev') + '" data-hour="' + (hour - 1) + '" role="button" aria-label="上一个小时">' + this.svg + '</a>';
        }
        // 2.2 可不可以往后翻
        if (hour >= Math.floor(numMax / 100)) {
            strHtml = strHtml + '<span class="' + CL.date('next') + '">' + this.svg + '</span>';
        } else {
            strHtml = strHtml + '<a href="javascript:" class="' + CL.date('next') + '" data-hour="' + (hour + 1) + '" role="button" aria-label="下一个小时">' + this.svg + '</a>';
        }

        // 头部结束的公共html部分
        strHtml = strHtml + '<a href="javascript:" class="' + CL.date('switch') + '" data-type="hour">' + arrTime[0] + ':00</a></div>';

        // 3. 分钟主体
        strHtml = strHtml + '<div class="' + CL.minute('body') + '">' + (function () {
            var strHtmlTime = '';
            var strMinute = '';
            var strClass = '';
            // 遍历60分钟
            for (var indexMinute = 0; indexMinute < 60; indexMinute += numStep) {
                strMinute = indexMinute + '';
                if (strMinute.length == 1) {
                    strMinute = '0' + strMinute;
                }

                // 基本样式
                strClass = CL.date('item');

                // 是否在时间范围内
                if ((arrTime[0] + strMinute) * 1 >= numMin && (arrTime[0] + strMinute) * 1 <= numMax) {
                    // 选中态
                    if (strMinute == arrTime[1]) {
                        strClass = strClass + ' ' + SELECTED;
                    }
                    strHtmlTime = strHtmlTime + '<a href="javascript:" class="' + strClass + '">' + [arrTime[0], strMinute].join(':') + '</a>';
                } else {
                    strHtmlTime = strHtmlTime + '<span class="' + strClass + '">' + [arrTime[0], strMinute].join(':') + '</span>';
                }
            }

            return strHtmlTime;
        })() + '</div>';

        // 容器闭合标签
        strHtml += '</div>';

        // 设置当前时间选择类型
        eleContainer.setAttribute('data-type', 'minute');
        eleContainer.innerHTML = strHtml;

        return this;
    };

    /**
     * 日期选择面板的显示
     * @return {Object} 当前实例对象
     */
    DateTime.prototype.show = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleTrigger = this.element.trigger;
        var eleInput = this.element.input;

        if (eleInput.disabled) {
            return this;
        }

        // 根据value更新SELECTED
        this.format();

        // 不同的类名显示不同的内容
        if (this.params.type == 'time') {
            this.minute();
        } else if (this.params.type == 'date-range') {
            // 存储当前日期范围数据，以便取消的时候可以正确还原
            if (!this.dataRangeSelected) {
                this.dataRangeSelected = this[SELECTED];
            }
            this['date-range']();
        } else if (this.params.type == 'month-range') {
            // 存储当前日期范围数据，以便取消的时候可以正确还原
            if (!this.dataRangeSelected) {
                this.dataRangeSelected = this[SELECTED];
            }
            this['month-range']();
        } else if (this[this.params.type]) {
            this[this.params.type]();
        } else {
            this.date();
        }

        // 如果面板对象在内存中，非文档中，则载入
        if (document.body.contains(eleContainer) == false) {
            document.body.appendChild(eleContainer);
        }

        if (eleTrigger != eleContainer) {
            eleContainer.style.display = 'block';
            eleTrigger.classList.add(ACTIVE);

            new Follow(eleTrigger, eleContainer, {
                position: '4-1'
            });

            // 如果屏幕外，则偏移
            // 3是阴影的距离
            var numLeft = parseFloat(eleContainer.style.left);
            var numWidth = eleContainer.offsetWidth;
            if (numLeft + numWidth + 3 > screen.width) {
                eleContainer.style.left = Math.max(screen.width - numWidth - 3, 0) + 'px';
            }
        }

        // 显示回调
        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this, eleInput, eleContainer);
        }

        // 改变显示与隐藏的标志量
        this.display = true;

        return this;
    };

    /**
     * 日期选择面板的隐藏
     * @return {Object} 当前实例对象
     */
    DateTime.prototype.hide = function () {
        // 元素
        var eleContainer = this.element.container;
        var eleTrigger = this.element.trigger;
        var eleInput = this.element.input;

        if (this.display == true && eleTrigger != eleContainer) {
            eleContainer.style.display = 'none';
            eleTrigger.classList.remove(ACTIVE);

            // 焦点位置还原
            eleInput.focus();
            eleInput.blur();

            // 隐藏回调
            if (typeof this.callback.hide == 'function') {
                this.callback.hide.call(this, eleInput, eleContainer);
            }
        }

        // 改变显示与隐藏的标志量
        this.display = false;

        return this;
    };

    var funAutoInitAndWatching = function () {
        // 如果没有开启自动初始化，则返回
        if (window.autoInit === false) {
            return;
        }

        var strSelector = 'input[type^="date"],input[type^="year"],input[type^="month"],input[type^="time"],input[type^="hour"],input[type^="minute"]';

        var funSyncRefresh = function (nodes, action) {
            if (!nodes) {
                return;
            }

            if (nodes.matches && nodes.querySelector) {
                if (nodes.matches(strSelector)) {
                    nodes = [nodes];
                } else {
                    nodes = nodes.querySelectorAll(strSelector);
                }
            }

            if (!nodes.forEach) {
                return;
            }

            nodes.forEach(function (node) {
                if (node.matches) {
                    if (action == 'remove' && node.data && node.data.dateTime) {
                        node.data.dateTime.element.container.remove();
                    } else if (!node.data || !node.data.color) {
                        new DateTime(node);
                    }
                }
            });
        };

        funSyncRefresh(document.querySelectorAll(strSelector));

        // 如果没有开启观察，不监听DOM变化
        if (window.watching === false) {
            return;
        }

        // DOM Insert自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (eleAdd) {
                        funSyncRefresh.call(mutation, eleAdd);
                    });
                    mutation.removedNodes.forEach(function (eleRemove) {
                        funSyncRefresh.call(mutation, eleRemove, 'remove');
                    });
                });
            });

            observerSelect.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.body.addEventListener('DOMNodeInserted', function (event) {
                // 插入节点
                funSyncRefresh(event.target);
            });
            document.body.addEventListener('DOMNodeRemoved', function (event) {
                // 删除节点
                // 这里方法执行的时候，元素还在页面上
                funSyncRefresh(event.target, 'remove');
            });
        }
    };

    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }

    return DateTime;
}));
