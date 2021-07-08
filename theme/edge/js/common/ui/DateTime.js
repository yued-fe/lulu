/**
 * @DateTime.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-03
 * @edited:   19-11-12
 * @edited:    20-07-27 edit by wanghao
 */

import './Follow.js';

/**
 * 日期，时间选择器
 * 基于HTML5时间类输入框
 * @example is="ui-datetime"
 * @trigger 触发的元素，可以是文本框也可以是文本框容器(父级)
 * @options 可选参数
 */
const DateTime = (() => {
    // 样式类名统一处理
    const CL = {
        toString: () => 'ui-datetime'
    };
    ['date', 'range', 'day', 'year', 'month', 'hour', 'minute', 'time'].forEach((key) => {
        CL[key] = (...args) => ['ui', key, ...args].join('-');
    });

    const SELECTED = 'selected';
    const ACTIVE = 'active';
    const regDate = /-|\//g;

    // 拓展方法之字符串变时间对象
    String.prototype.toDate = function () {
        let year, month, day;
        const arrDate = this.replace(/年|月|日/g, '-').split(regDate);
        // 字符串变数值
        year = arrDate[0] * 1;
        month = arrDate[1] || 1;
        day = arrDate[2] || 1;
        // 年份需要是数值字符串
        if (!year) {
            return new Date();
        }

        return new Date(year, month - 1, day);
    };

    String.prototype.toTime = function () {
        let arrTime = this.trim().split(':').map((hm, index) => {
            if (!hm || /\D/.test(hm))  {
                return '';
            }

            if (hm < 0) {
                return '00';
            } else if (index === 0) {
                if (hm > 23) {
                    hm = '23';
                }
            } else if (hm > 59) {
                hm = '59';
            }

            return hm.padStart(2, '0');
        }).filter(_ => _).slice(0, 3);

        // 至少有时分
        if (arrTime.length == 1) {
            arrTime.push('00');
        }

        return arrTime;
    };

    // 日期对象变成年月日数组
    Date.prototype.toArray = function () {
        let year = this.getFullYear();
        let month = this.getMonth() + 1;
        let date = this.getDate();
        if (month < 10) {
            month = `0${month}`;
        }
        if (date < 10) {
            date = `0${date}`;
        }

        return [year, month, date];
    };


    class Component extends HTMLInputElement {
        constructor () {
            super();
        }

        minMaxConvert (value) {
            // 直接设置为数值
            if (typeof value == 'number' && Number.isInteger(value)) {
                // 认为是时间戳
                if (value > 10000000) {
                    value = new Date(value);
                } else if (value < 9999) {
                    // 认为是年份
                    value = String(value);
                }
            }

            let arrDate = [];

            // value可以是Date对象
            if (value.toArray) {
                arrDate = value.toArray();
            } else if (typeof value == 'string') {
                arrDate = value.toDate().toArray();
            }

            let strType = this.getAttribute('type') || 'date';

            // 赋值
            if (strType == 'date' || strType == 'date-range') {
                value = arrDate.join('-');
            } else if (strType == 'year') {
                value = arrDate[0];
            } else if (strType == 'month' || strType == 'month-range') {
                value = arrDate.slice(0, 2).join('-');
            } else  {
                if (value.toArray) {
                    // 其他日期类型转换成 时:分 模式
                    value = value.getHours() + ':' + value.getMinutes();
                }
                // 补0的处理
                let arrHourMin = value.toTime();

                if (!arrHourMin[0]) {
                    return '';
                }

                value = arrHourMin.join(':');
            }

            return value;
        }

        get min () {
            let strAttrMin = this.getAttribute('min') || '';
            if (strAttrMin) {
                return this.minMaxConvert(strAttrMin).toString();
            }
            return strAttrMin;
        }

        set min (value) {
            if (!value) {
                this.removeAttribute('min');
                return;
            }

            this.setAttribute('min', this.minMaxConvert(value));
        }

        get max () {
            let strAttrMax = this.getAttribute('max') || '';
            if (strAttrMax) {
                return this.minMaxConvert(strAttrMax).toString();
            }
            return strAttrMax;
        }

        set max (value) {
            if (!value) {
                this.removeAttribute('max');
                return;
            }

            this.setAttribute('max', this.minMaxConvert(value));
        }
        get step () {
            let strStep = this.getAttribute('step');
            let strType = this.params.type;
            let numStep = Number(strStep);
            if (strStep && /^\d+$/.test(strStep)) {
                if (strType == 'time') {
                    if (strStep > 60) {
                        if (strStep % 60 != 0 || strStep / 60 > 30) {
                            numStep = 1;
                        }
                    } else if (numStep > 30) {
                        numStep = 1;
                    }
                } else if (strType == 'hour') {
                    if (numStep > 12) {
                        numStep = 1;
                    }
                } else if (strType == 'minute' && numStep > 30) {
                    numStep = 1;
                }

                return numStep;
            }
            return '';
        }

        set step (value) {
            if (!value) {
                this.removeAttribute('step');
                return;
            }

            this.setAttribute('step', value);
        }

        /**
         * 事件
         * @return {[type]} [description]
         */
        events () {
            // 具体元素们
            const eleContainer = this.element.target;

            // 点击容器的事件处理
            eleContainer.addEventListener('click', (event) => {
                // IE可能是文件节点
                if (event.target.nodeType != 1 || !event.target.closest) {
                    return;
                }

                const eleClicked = event.target.closest('a, button');
                if (!eleClicked) {
                    return;
                }
                // 各个分支中可能会用到的变量
                let numYear = 0;
                let numMonth = 0;
                // var numDate = 0;
                let numHour = 0;
                let numDay = 0;
                // 日期范围
                let arrRange = [];
                // 根据选中状态决定新的状态
                let dataRange;
                // 按钮类型
                let strTypeButton = '';

                // 各种事件
                switch (eleContainer.dataset.type) {
                    case 'date': {
                        // 日期选择主体
                        // 1. 前后月份选择
                        if (/prev|next/.test(eleClicked.className)) {
                            numMonth = eleClicked.dataset.month;

                            // 设置选择月份
                            // 这样可以获得目标月份对应的日期数据
                            // 就是下面this.getMonthDay做的事情
                            this[SELECTED][1] = numMonth * 1;

                            // 日期和月份要匹配，例如，不能出现4月31日
                            // arrMonthDay是一个数组，当前年份12个月每月最大的天数
                            const arrMonthDay = this.getMonthDay(this[SELECTED]);

                            // 切分月份
                            // 日期正常是不会变化的
                            // 但是类似31号这样的日子不是每个月都有的
                            // 因此，需要边界判断
                            // 下面这段逻辑就是做这个事情的

                            // 1. 当前月份最大多少天
                            const numDayMax = (() => {
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
                            const numDayOverflow = eleContainer.dataDayOverflow;
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
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
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
                                    numDay = `0${numDay}`;
                                }
                                // 修改全局
                                this[SELECTED][2] = numDay;
                            }

                            // 赋值
                            this.setValue();
                            // 隐藏
                            this.hide();

                            delete eleContainer.dataDayOverflow;
                        } else if (eleClicked.dataset.type == 'month') {
                            // 切换到年份选择
                            this.month();
                        }
                        break;
                    }
                    case 'date-range': {
                        // 区域选择
                        // 1. 前后月份选择
                        if (/prev|next/.test(eleClicked.className)) {
                            numMonth = eleClicked.dataset.month * 1;

                            arrRange = eleContainer.dataDate || this[SELECTED][0];

                            // 跟其他面板不同，这里只刷新，点击确定再赋值
                            eleContainer.dataDate = new Date(arrRange[0], numMonth - 1, 1).toArray();
                            // 之前arrRange[2]存在跨多月风险，尤其31号的日子
                            // 刷新
                            this['date-range']();
                        } else if (/item/.test(eleClicked.className)) {
                            // 选择某日期
                            // 获得选中的年月日
                            numYear = eleClicked.dataset.year;
                            numMonth = eleClicked.dataset.month;
                            numDay = eleClicked.innerHTML;

                            // 位数不足补全
                            if (numMonth < 10) {
                                numMonth = `0${numMonth}`;
                            }
                            if (numDay < 10) {
                                numDay = `0${numDay}`;
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
                            strTypeButton = eleClicked.dataset.type;
                            if (strTypeButton == 'primary') {
                                // 点击确定按钮
                                // 赋值
                                this.setValue();
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
                            numYear = eleClicked.dataset.year * 1;

                            arrRange = eleContainer.dataDate || this[SELECTED][0];

                            // 跟其他面板不同，这里只刷新，点击确定再赋值
                            eleContainer.dataDate = new Date(numYear, arrRange[1], 1).toArray();
                            // 刷新
                            this['month-range']();
                        } else if (/item/.test(eleClicked.className)) {
                            // 选择某日期
                            // 获得选中的年月日
                            numYear = eleClicked.dataset.year;
                            numMonth = eleClicked.dataset.value;
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
                            strTypeButton = eleClicked.dataset.type;
                            if (strTypeButton == 'primary') {
                                // 点击确定按钮
                                // 赋值
                                this.setValue();
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
                            numYear = eleClicked.dataset.year;
                            // 修改当前选中的年份数
                            this[SELECTED][0] = numYear * 1;
                            // 刷新
                            this.month();
                            // 文本框赋值
                            // 如果在区域内状态
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
                            }
                        } else if (/item/.test(eleClicked.className)) {
                            // value实际上是月份两位数值
                            const value = eleClicked.dataset.value;
                            if (value) {
                                this[SELECTED][1] = value;
                            } else {
                                // 今月，只改变年月为今年和今月
                                const arrToday = new Date().toArray();
                                this[SELECTED][0] = arrToday[0];
                                this[SELECTED][1] = arrToday[1];
                            }

                            // 赋值
                            this.setValue();

                            // 根据是否是月份输入框，决定是面板切换，还是关闭
                            if (this.params.type == 'month') {
                                // 隐藏
                                this.hide();
                            } else {
                                this.date();
                            }
                        } else if (eleClicked.dataset.type == 'year') {
                            // 切换到年份选择
                            this.year();
                        }
                        break;
                    }
                    case 'year': {
                        // 选择年份，可能从月份过来，也可能直接打开
                        // 1. 前后12年翻页
                        if (/prev|next/.test(eleClicked.className)) {
                            numYear = eleClicked.dataset.year;
                            // 修改当前选中的年份数
                            this[SELECTED][0] = numYear * 1;
                            // 刷新
                            this.year();
                            // 文本框赋值
                            // 如果在区域内状态
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
                            }
                        } else if (/item/.test(eleClicked.className)) {
                            if (eleClicked.innerHTML == '今年') {
                                this[SELECTED][0] = new Date().getFullYear();
                            } else {
                                this[SELECTED][0] = eleClicked.innerHTML * 1;
                            }

                            // 赋值
                            this.setValue();
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
                    case 'time': {
                        if (eleClicked.tagName == 'BUTTON' && eleClicked.classList.contains(SELECTED) == false) {
                            let strTypeButton = eleClicked.parentElement.dataset.type;
                            let numIndexButton = eleClicked.dataset.index;
                            if (strTypeButton == 'ampm') {
                                if (numIndexButton == '0') {
                                    this[SELECTED][0] -= 12;
                                } else {
                                    this[SELECTED][0] = Number(this[SELECTED][0]) + 12;
                                }
                                this[SELECTED][0] = String(this[SELECTED][0]).padStart(2, '0');
                            } else if (strTypeButton == 'hour') {
                                this[SELECTED][0] = numIndexButton.padStart(2, '0');
                            } else if (strTypeButton == 'minute') {
                                this[SELECTED][1] = numIndexButton.padStart(2, '0');
                            } else if (strTypeButton == 'second') {
                                this[SELECTED][2] = numIndexButton.padStart(2, '0');
                            }

                            this.setValue();
                            this.time();
                        }
                        break;
                    }
                    case 'minute': {
                        // 选择分钟，可以是minute类型，或者time类型, 但不包括hour类型
                        // 1. 前后翻页
                        if (/prev|next/.test(eleClicked.className)) {
                            numHour = eleClicked.getAttribute('data-hour');
                            if (numHour.length == 1) {
                                numHour = `0${numHour}`;
                            }
                            // 修改当前选中的小时数
                            this[SELECTED][0] = numHour;

                            // 刷新
                            this.minute();
                            // 文本框赋值
                            // 如果在区域内状态
                            if (eleContainer.querySelector(`.${SELECTED}[href]`)) {
                                this.setValue();
                            }
                        } else if (/item/.test(eleClicked.className)) {
                            // 确定选择时间
                            this[SELECTED] = eleClicked.innerHTML.split(':');
                            this.setValue();
                            this.hide();
                        } else if (eleClicked.dataset.type == 'hour') {
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
                            this.setValue();

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
            });

            // 显隐控制
            this.addEventListener('click', (event) => {
                event.preventDefault();

                // 显隐控制
                if (!this.display) {
                    this.show();
                } else {
                    this.hide();
                }
            });

            // 输入框元素行为
            this.addEventListener('keydown', (event) => {
                if (event.code == 'Enter') {
                    event.preventDefault();
                    this.click();
                }
            });

            // 时间范围选择点击页面空白区域不会隐藏
            document.addEventListener('mouseup', (event) => {
                // 点击页面空白区域，隐藏
                const eleTarget = event.target;

                if (eleTarget && eleTarget != this && eleContainer.contains(eleTarget) == false) {
                    if (this.display) {
                        this.hide();
                    }
                }
            });

            // time类型的上下左右快捷键处理
            document.addEventListener('keydown', event => {
                if (eleContainer.dataset.type == 'time' && this.display == true && eleContainer.contains(document.activeElement)) {
                    if (/^arrow/i.test(event.key)) {
                        event.preventDefault();
                        // 所有列选中元素
                        let eleButtonSelected = [...eleContainer.querySelectorAll('.' + SELECTED)];
                        let numIndexButton = eleButtonSelected.findIndex(item => item == event.target);
                        // 当前列所有可点击元素
                        let eleButtonClickable = [...event.target.parentElement.querySelectorAll('button:enabled:not([data-visibility="false"])')];
                        let numIndexButtonClickable = eleButtonClickable.findIndex(item => item == event.target);
                        // 上下左右快捷键的处理
                        if (event.key == 'ArrowLeft') {
                            numIndexButton--;
                            if (eleButtonSelected[numIndexButton]) {
                                eleButtonSelected[numIndexButton].focus();
                            }
                        } else if (event.key == 'ArrowRight') {
                            numIndexButton++;
                            if (eleButtonSelected[numIndexButton]) {
                                eleButtonSelected[numIndexButton].focus();
                            }
                        } else if (event.key == 'ArrowUp') {
                            let eleButtonPrev = eleButtonClickable[numIndexButtonClickable - 1];
                            if (!eleButtonPrev) {
                                eleButtonPrev = eleButtonClickable[eleButtonClickable.length - 1];
                            }
                            if (eleButtonPrev) {
                                eleButtonPrev.click();
                                eleButtonPrev.focus();
                            }
                        } else if (event.key == 'ArrowDown') {
                            let eleButtonNext = eleButtonClickable[numIndexButtonClickable + 1];
                            if (!eleButtonNext) {
                                eleButtonNext = eleButtonClickable[0];
                            }
                            if (eleButtonNext) {
                                eleButtonNext.click();
                                eleButtonNext.focus();
                            }
                        }
                    }

                    if (event.key == 'Enter') {
                        this.hide();
                    }
                }
            });

            // 窗口尺寸变化与重定位
            window.addEventListener('resize', () => {
                if (this.display) {
                    this.position();
                }
            });

            return this;
        }

        /**
         * 输入框的值根据日期类型进行格式化
         * @return {Object} 返回当前DOM对象
         */
        format () {
            // 根据当前value值修改DOM元素对象缓存的选中值
            // 特殊情况一般不处理
            const strType = this.params.type;

            // 此时输入框初始值
            const strInitValue = this.value.trim();

            if (!strInitValue) {
                return this;
            }

            switch (strType) {
                case 'date': case 'year': case 'month': {
                    // 日期
                    const objInitDate = strInitValue.toDate();
                    const arrDate = objInitDate.toArray();
                    // eg. [2015,07,20]
                    this[SELECTED] = arrDate;

                    break;
                }
                case 'time': case 'hour': case 'minute': {
                    const arrTime = strInitValue.toTime();
                    // 补0
                    if (arrTime.length > 1) {
                        this[SELECTED] = [...arrTime];
                    }

                    break;
                }
                case 'date-range': case 'month-range': {
                    // 日期范围
                    let objBeginDate = new Date();
                    let objEndDate = new Date();
                    // 前后时间字符串
                    const arrRange = strInitValue.split(' ');
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
        }

        /**
         * 赋值
         * @return {Object} 返回当前输入框的值
         */
        setValue () {
            const arrSelected = this[SELECTED];
            const strValue = this.value;

            switch (this.params.type) {
                case 'date': {
                    this.value = arrSelected.join('-');
                    break;
                }
                case 'month': {
                    this.value = arrSelected.slice(0, 2).join('-');
                    break;
                }
                case 'year': {
                    this.value = arrSelected[0];
                    break;
                }
                case 'date-range': {
                    this.value = `${arrSelected[0].join('-')} 至 ${arrSelected[1].join('-')}`;
                    break;
                }
                case 'month-range': {
                    this.value = `${arrSelected[0].slice(0, 2).join('-')} 至 ${arrSelected[1].slice(0, 2).join('-')}`;
                    break;
                }
                case 'time': case 'minute': {
                    this.value = arrSelected.join(':');
                    break;
                }
                case 'hour': {
                    this.value = `${arrSelected[0]}:00`;
                    break;
                }
            }

            if (this.value != strValue) {
                this.dispatchEvent(new CustomEvent('change', {
                    'bubbles': true
                }));
            }

            return this.value;
        }

        /**
         * 返回日历HTML字符串等数据的私有方法
         * 因date和range浮层主结构类似，因此这里公用下
         * @param  {Array} arrDate 格式化为数组的日期
         * @return {Object}     返回包含需要的数据的对象，生成的HTML字符内容以及最大最小月份等
         */
        getCalendarData (arrDate) {
            let strHtml = '';
            // 根据当前日期数据返回
            // eg. [2015,'02', 23]

            // 类型
            const strType = this.params.type;

            // 最大日期和最小日期
            let numMin = (this.min || '0001-01-01').toDate();
            let numMax = (this.max || '9999-00-01').toDate();

            const arrChinese = ['日', '一', '二', '三', '四', '五', '六'];
            const arrMonthDay = this.getMonthDay(arrDate);

            // 目前日期对象
            const currentDate = arrDate.join('-').toDate();

            const getStrHtmlDay = () => {
                let strHtmlDay = '';
                arrChinese.forEach((strChineseDay, indexDay) => {
                    strHtmlDay = `${strHtmlDay}<span class="${CL.day('item')} col${indexDay}">${strChineseDay}</span>`;
                });
                return strHtmlDay;
            };

            // 3 星期几七大罪
            strHtml = `<div class="${CL.day('x')}">${getStrHtmlDay()}</div>`;

            // 4. 日期详细
            //  4.1 首先算出今月1号是星期几
            const objNewDate = arrDate.join('-').toDate();
            let numDayFirst = 0;
            // 设置为1号
            objNewDate.setDate(1);

            if (objNewDate.getDate() == 2) {
                objNewDate.setDate(0);
            }
            // 每月的第一天是星期几
            numDayFirst = objNewDate.getDay();
            // 上个月是几月份
            let numLastMonth = objNewDate.getMonth() - 1;
            if (numLastMonth < 0) {
                numLastMonth = 11;
            }

            const strHtmlData = `data-year="${arrDate[0]}" data-month="${objNewDate.getMonth() + 1}"`;
            const strHtmlYearMonthData = 'data-date=';
            let strHtmlFullData = '';

            const getStrHtmlDate = () => {
                let strHtmlDate = '';
                let strClass = '';

                // 列表生成
                for (let tr = 0; tr < 6; tr++) {
                    strHtmlDate = `${strHtmlDate}<div class="${CL.date('tr')}">`;

                    // 日期遍历
                    for (let td = 0; td < 7; td++) {
                        // 类名
                        strClass = `${CL.date('item')} col${td}`;

                        // 今天
                        const numYearNow = arrDate[0];
                        const numMonthNow = objNewDate.getMonth() + 1;
                        let numDayNow;
                        let objDateNow;

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
                                strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
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
                                        strClass = `${strClass} ${SELECTED}`;
                                    }
                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = `${strHtmlDate}<a href="javascript:;" ${strHtmlData} class="${strClass}" ${strHtmlFullData}>${numDayNow}</a>`;
                                    } else {
                                        strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
                                    }
                                } else {
                                    numDayNow = numDayNow - arrMonthDay[objNewDate.getMonth()];
                                    // 更新strHtmlFullData
                                    strHtmlFullData = strHtmlYearMonthData + new Date(numYearNow, numMonthNow, numDayNow).toArray().join('-');
                                    // 日期字符拼接
                                    strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
                                }
                            }
                        } else if (strType == 'date-range') {
                            // 非当前月部分使用空格补全
                            if (tr == 0 && td < numDayFirst) {
                                strHtmlDate = `${strHtmlDate}<span class="${strClass}"></span>`;
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
                                    const dateBegin = this[SELECTED][0].join('-').toDate();
                                    const dateEnd = this[SELECTED][1].join('-').toDate();

                                    // 各个时间的时间戳
                                    const timeNow = objDateNow.getTime();
                                    const timeBegin = dateBegin.getTime();
                                    const timeEnd = dateEnd.getTime();

                                    if (timeNow >= timeBegin && timeNow <= timeEnd) {
                                        // 在时间范围之内
                                        strClass = `${strClass} ${SELECTED}`;
                                        // 跟开始时间一样
                                        if (timeNow == timeBegin) {
                                            strClass = `${strClass} ${CL.date('begin')}`;
                                        }
                                        // 跟结束时间一样
                                        if (timeNow == timeEnd) {
                                            strClass = `${strClass} ${CL.date('end')}`;
                                        }
                                        // 今月的第一天还是最后一天
                                        if (numDayNow == 1) {
                                            strClass = `${strClass} ${CL.date('first')}`;
                                        } else if (numDayNow == arrMonthDay[objNewDate.getMonth()]) {
                                            strClass = `${strClass} ${CL.date('last')}`;
                                        }
                                    }

                                    // 如果在日期范围内
                                    // 直接使用时间对象 Date 类作比较
                                    if (objDateNow >= numMin && objDateNow <= numMax) {
                                        strHtmlDate = `${strHtmlDate}<a href="javascript:;" ${strHtmlData} class="${strClass}" ${strHtmlFullData}>${numDayNow}</a>`;
                                    } else {
                                        strHtmlDate = `${strHtmlDate}<span class="${strClass}" ${strHtmlFullData}>${numDayNow}</span>`;
                                    }
                                } else {
                                    strHtmlDate = `${strHtmlDate}<span class="${strClass}"></span>`;
                                }
                            }
                        }
                    }
                    strHtmlDate += '</div>';
                }

                return strHtmlDate;
            };

            strHtml = `${strHtml}<div class="${CL.date('body')}">${getStrHtmlDate()}</div>`;

            return {
                monthDay: arrMonthDay,
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }

        /**
         * 月份组装
         * @param  {Array} arrDate 数组化的日期表示值
         * @return {Object}        返回的是后续方法需要的数据的纯对象，包括组装的HTML字符数据，月份最大和最小值。
         */
        getMonthData (arrDate) {
            // 最大月份和最小月份
            let numMin = (this.min || '000000').replace(regDate, '').slice(0, 6);
            let numMax = (this.max || '999912').replace(regDate, '').slice(0, 6);

            const arrChinese = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

            // 年份
            const numYear = arrDate[0] * 1;

            // 类型
            const strType = this.params.type;

            const getStrHtmlDate = () => {
                let strHtmlDate = '';
                let strClass = '';
                let strMonth = '';

                for (let i = 1; i <= 12; i += 1) {
                    // 合法格式字符串
                    if (i < 10) {
                        strMonth = `0${i}`;
                    } else {
                        strMonth = `${i}`;
                    }

                    // 基本类名
                    strClass = CL.date('item');

                    if (strType == 'month') {
                        if (i == arrDate[1]) {
                            // 选中态的类名
                            strClass = `${strClass} ${SELECTED}`;
                        }
                    } else if (strType == 'month-range') {
                        // range选择的匹配规则如下：
                        // 1. 获得已经选中到时间范围
                        // 2. 起始时间和结束时间是选中表示
                        // 3. 之间的时间也是选中表示
                        const strBegin = this[SELECTED][0].slice(0, 2).join('');
                        const strEnd = this[SELECTED][1].slice(0, 2).join('');
                        const strNow = numYear + strMonth;
                        if (strNow >= strBegin && strNow <= strEnd) {
                            strClass = `${strClass} ${SELECTED}`;
                        }
                    }
                    // 是否在范围以内
                    if (numYear + strMonth >= numMin && numYear + strMonth <= numMax) {
                        strHtmlDate = `${strHtmlDate}<a href="javascript:" class="${strClass}" data-year="${numYear}" data-value="${strMonth}">${arrChinese[i - 1]}月</a>`;
                    } else {
                        strHtmlDate = `${strHtmlDate}<span class="${strClass}" data-value="${strMonth}">${arrChinese[i - 1]}月</span>`;
                    }
                }

                return strHtmlDate;
            };

            const strHtml = `<div class="${CL.month('body')}">${getStrHtmlDate()}</div>`;

            return {
                html: strHtml,
                min: numMin,
                max: numMax
            };
        }

        /**
         * 当前日期下这一年每月最大的日期数目
         * @param  {Array} date 格式化为数组的日期
         * @return {Array}      返回这一年每月最大的日期数目
         */
        getMonthDay (date) {
            let arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                arrDate = date.toArray();
            }

            const arrMonthDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            // 如果是闰年
            if (((arrDate[0] % 4 == 0) && (arrDate[0] % 100 != 0)) || (arrDate[0] % 400 == 0)) {
                arrMonthDay[1] = 29;
            }

            return arrMonthDay;
        }

        /**
         * 上个月同日期
         * @param  {Array} date 格式化为数组的日期
         * @return {Object}     返回Date类型对象
         */
        getDatePrevMonth (date) {
            // add on 2016-03-31
            // 原先的加减月份的跨月计算是有些问题的
            // 因为例如31号的下一月，系统会自动变成下下个月的1号
            let arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            const numMonth = arrDate[1] * 1;
            const arrMonthDay = this.getMonthDay(arrDate);

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

        /**
         * 下个月同日期
         * @param  {Array} date 格式化为数组的日期
         * @return {Object}     返回Date类型对象
         */
        getDateNextMonth (date) {
            let arrDate = date;
            // 如果不是数组
            if (typeof date != 'object' && !date.map) {
                // 日期数组化
                arrDate = date.toArray();
            }

            const numMonth = arrDate[1] * 1;
            const arrMonthDay = this.getMonthDay(arrDate);

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

        /**
         * 选择日期
         * @return {Object} 返回当前DOM对象
         */
        date () {
            const eleContainer = this.element.target;

            const arrDate = this[SELECTED];

            // 上一个月
            const numPrevMonth = arrDate[1] - 1;
            // 下一个月
            const numNextMonth = arrDate[1] * 1 + 1;

            const objCalender = this.getCalendarData(arrDate);

            // 选择日期的完整HTML代码
            // 1. 日期专属类名容器
            let strHtml = `<div class="${CL.date('x')}">`;
            // 2. 头部月份切换
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;
            // 根据前后月份是否在范围之外，决定使用的标签类型
            // span标签则是禁用态，本组件全部都是如此
            // 2.1 上个月
            // datePrevMonth指上个月日期
            const datePrevMonth = this.getDatePrevMonth(arrDate);
            // numPrevMonth指上个月
            const numPrevMonthGet = datePrevMonth.getMonth();
            const numPrevYearGet = datePrevMonth.getFullYear();
            const datePrevMonthLastDay = new Date(numPrevYearGet, numPrevMonthGet, objCalender.monthDay[numPrevMonthGet]);

            // 上个月份的最大日期比最小限制大
            // 或者没有最小限制
            // 或者
            if (datePrevMonthLastDay >= objCalender.min) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-month="${numPrevMonth}" role="button" aria-label="上一月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}" aria-label="上一月"></span>`;
            }

            // 2.2 下个月
            const objDateNextMonth = this.getDateNextMonth(arrDate);
            const numNextMonthGet = objDateNextMonth.getMonth();
            const numNextYearGet = objDateNextMonth.getFullYear();

            if (new Date(numNextYearGet, numNextMonthGet, 1) <= objCalender.max) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-month="${numNextMonth}" role="button" aria-label="下一月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}" aria-label="下一月"></span>`;
            }

            // 头部月份公用结束
            strHtml = `${strHtml}<a href="javascript:" class="${CL.date('switch')}" data-type="month" role="button" aria-label="快速切换月份">${arrDate.slice(0, 2).join('-')}</a></div>`;

            // 3. 主体内容来自getCalendarData()方法
            strHtml += objCalender.html;

            // 今天
            // 首先，今天要在时间范围内
            if (new Date() >= objCalender.min && new Date() <= objCalender.max) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('item')} ${CL.date('now')}" role="button">今天</a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('item')} ${CL.date('now')}">今天</span>`;
            }

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'date';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择日期范围
         * @return {Object} 返回当前DOM对象
         */
        ['date-range'] () {
            const eleContainer = this.element.target;

            // 选择的日期范围数组
            const arrDates = this[SELECTED];
            // 当前起始日期
            // 默认（第一次）打开使用选中日期
            // 如果有，使用面板存储月份
            // 因为range选择不是即时更新文本框
            const arrDate = eleContainer.dataDate || arrDates[0];
            eleContainer.dataDate = arrDate;
            // 前一个月
            const numPrevMonth = arrDate[1] - 1;
            // 后一个月
            const numNextMonth = arrDate[1] * 1 + 1;

            // 含时间范围和对应月份日历HTML的对象
            const objCalender = this.getCalendarData(arrDate);

            // 选择时间范围完整HTML代码
            // 1. 同样的，range容器
            let strHtml = `<div class="${CL.range('x')}">`;
            // 2. 头部
            strHtml = `${strHtml}<div class="${CL.date('head')}"><div class="${CL.date('half')}">`;
            //  2.1 上一个月箭头
            const datePrevMonthLastDay = new Date(arrDate[0], numPrevMonth - 1, objCalender.monthDay[numPrevMonth]);
            // 上个月的最后1天大于min最小限制
            if (datePrevMonthLastDay >= objCalender.min) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-month="${numPrevMonth}" aria-label="上一个月，当前${arrDate[1]}月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}"></span>`;
            }
            // 今月月份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${new Date(arrDate[0], numPrevMonth, arrDate[2]).toArray().slice(0, 2).join('-')}</span></div><div class="${CL.date('half')}">`;

            // 2.2 下下个月
            const objDateNextMonth = new Date(arrDate[0], arrDate[1], 1);
            const objDateAfterMonth = new Date(arrDate[0], numNextMonth, arrDate[2]);

            // 下个月的当前日期在合理范围之内，则使用该月
            if (objDateAfterMonth <= objCalender.max) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-month="${numNextMonth}" aria-label="下一个月，当前${numNextMonth}月"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            }

            // 下月月份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${objDateNextMonth.toArray().slice(0, 2).join('-')}</span></div>`;

            // 头部闭合
            strHtml += '</div>';

            // 3. 两个主体列表
            // 这里要嵌套一层range特有的body
            // 根据getCalendarData()方法创建两个月份日历
            // 主体标签闭合
            strHtml = `${strHtml}<div class="${CL.range('body')} ${CL.range('date', 'body')}">\
            <div class="${CL.date('half')}">${objCalender.html}</div>\
            <div class="${CL.date('half')}">${this.getCalendarData(objDateNextMonth.toArray()).html}</div>\
            </div>`;

            // 4. 确定与取消按钮
            strHtml = `${strHtml}<div class="${CL.range('footer')}">\
            <button class="ui-button" data-type="primary">确定</button>\
            <button class="ui-button" data-type="normal">取消</button>\
            </div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'date-range';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择月份
         * @return {Object} 返回当前DOM对象
         */
        month () {
            const eleContainer = this.element.target;

            // 当前选择日期
            const arrDate = this[SELECTED];
            // 对应的月份数据
            const objMonth = this.getMonthData(arrDate);

            // 返回的最大值最小值
            const numMin = objMonth.min;
            const numMax = objMonth.max;

            // 选择月份的完整HTML代码
            // 1. month专属类名容器
            let strHtml = `<div class="${CL.month('x')}">`;
            // 2. 月份切换的头部
            const numYear = arrDate[0] * 1;
            //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
            //    例如，假设今年是2015年，则头部年份范围是2009-2020
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;
            //    2.1 是否还有上一年
            if (numYear - 1 >= Math.floor(numMin / 100) && numYear - 1 <= Math.floor(numMax / 100)) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-year="${numYear - 1}" role="button" aria-label="上一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}" aria-label="上一年"></span>`;
            }
            // 2.2 是否还有下一年
            if (numYear + 1 >= Math.floor(numMin / 100) && numYear + 1 <= Math.floor(numMax / 100)) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-year="${numYear + 1}" role="button" aria-label="下一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            }
            // 头部结束
            strHtml = `${strHtml}<a href="javascript:" class="${CL.date('switch')}" data-type="year" role="button" aria-label="快速切换年份">${numYear}</a>\
            </div>`;
            // 3. 月份切换主体列表
            strHtml += objMonth.html;

            // 今月
            // 首先，今月要在时间范围内
            const objThisYearMonth = new Date().toArray().slice(0, 2).join('');
            if (objThisYearMonth >= numMin && objThisYearMonth <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('item')} ${CL.date('now')}">今月</a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('item')} ${CL.date('now')}">今月</span>`;
            }

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'month';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择月份范围
         * @return {Object} 返回当前DOM对象
         */
        ['month-range'] () {
            const eleContainer = this.element.target;

            // 当前选择日期
            const arrDates = this[SELECTED];
            // 当前起始日期
            // 默认（第一次）打开使用选中日期
            // 如果有，使用面板存储月份
            // 因为range选择不是即时更新文本框
            const arrDate = eleContainer.dataDate || arrDates[0];
            eleContainer.dataDate = arrDate;
            // 前一年
            const numPrevYear = arrDate[0] * 1 - 1;
            // 后一个年
            const numNextYear = arrDate[0] * 1 + 1;

            // 含时间范围和对应月份日历HTML的对象
            const objMonth = this.getMonthData(arrDate);
            // 最大年份
            const numMaxYear = objMonth.max.slice(0, 4);
            const numMinYear = objMonth.min.slice(0, 4);

            // 选择时间范围完整HTML代码
            // 1. 同样的，range容器
            let strHtml = `<div class="${CL.range('x')}">`;
            // 2. 头部
            strHtml = `${strHtml}<div class="${CL.date('head')}">\
            <div class="${CL.date('half')}">`;
            //  2.1 上一年箭头
            if (numPrevYear >= numMinYear && numPrevYear <= numMaxYear) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-year="${numPrevYear}" role="button" aria-label="上一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}" aria-label="上一年"></span>`;
            }
            // 今年年份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${arrDate[0]}</span>\
            </div>\
            <div class="${CL.date('half')}">`;

            // 2.2 下一年
            if (numNextYear >= numMinYear && numNextYear < numMaxYear) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-year="${numNextYear}" role="button" aria-label="下一年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}" aria-label="下一年"></span>`;
            }

            // 下月月份显示
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${numNextYear}</span>\
            </div>`;

            // 头部闭合
            strHtml += '</div>';

            // 3. 两个主体列表
            // 这里要嵌套一层range特有的body
            // 根据getCalendarData()方法创建两个月份日历
            // 主体标签闭合
            strHtml = `${strHtml}<div class="${CL.range('body')} ${CL.range('month', 'body')}">\
            <div class="${CL.date('half')}">${objMonth.html}</div>\
            <div class="${CL.date('half')}">${this.getMonthData([numNextYear, arrDate[1], arrDate[2]]).html}</div>\
            </div>`;

            // 4. 确定与取消按钮
            strHtml = `${strHtml}<div class="${CL.range('footer')}">\
            <button class="ui-button" data-type="primary">确定</button>\
            <button class="ui-button" data-type="normal">取消</button>\
            </div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'month-range';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择年份
         * @return {Object} 返回当前DOM对象
         */
        year () {
            // 元素
            const eleContainer = this.element.target;

            // 当前选择日期
            const arrDate = this[SELECTED];

            // 最小年份和最大年份
            let numMin = this.min || 0;
            let numMax = this.max || 9999;

            // 选择年份的完整HTML代码
            // 1. 同样的，year专属类名容器
            let strHtml = `<div class="${CL.year('x')}">`;
            // 2. 头部的年份切换，一切就是12年
            //    有必要先知道当前的年份
            const numYear = arrDate[0];
            //    为什么呢？因为年份的范围是当前年份前面6个，后面5个
            //    例如，假设今年是2015年，则头部年份范围是2009-2020
            //    左右切换是没有限制的
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;
            //    年份不是你想翻就能翻到
            //    2.1 上一个12年
            if (numYear - 12 >= numMin && numYear - 12 <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-year="${numYear - 12}" role="button" aria-label="上一个12年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('prev')}"></span>`;
            }
            //    2.2 下一个12年
            if (numYear + 12 >= numMin && numYear + 12 <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-year="${numYear + 12}" role="button" aria-label="下一个12年"></a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            }
            // year选择是顶级类别，一定是不可点击的
            strHtml = `${strHtml}<span class="${CL.date('switch')}">${[numYear - 6, numYear + 5].join('-')}</span></div>`;

            const getStrHtmlDate = () => {
                let strHtmlDate = '';
                let strClass = '';

                for (let indexYear = numYear - 6; indexYear < numYear + 6; indexYear += 1) {
                    // 选中态的类名
                    strClass = CL.date('item');

                    if (indexYear == numYear) {
                        strClass = `${strClass} ${SELECTED}`;
                    }

                    // 是否在范围以内
                    if (indexYear >= numMin && indexYear <= numMax) {
                        strHtmlDate = `${strHtmlDate}<a href="javascript:" class="${strClass}">${indexYear}</a>`;
                    } else {
                        strHtmlDate = `${strHtmlDate}<span class="${strClass}">${indexYear}</span>`;
                    }
                }

                return strHtmlDate;
            };
            // 3. 年份选择的主体
            strHtml = `${strHtml}<div class="${CL.year('body')}">${getStrHtmlDate()}</div>`;

            // 今年
            // 首先，今年要在时间范围内
            const numThisYear = new Date().getFullYear();
            if (numThisYear >= numMin && numThisYear <= numMax) {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('item')} ${CL.date('now')}" role="button">今年</a>`;
            } else {
                strHtml = `${strHtml}<span class="${CL.date('item')} ${CL.date('now')}">今年</span>`;
            }

            // 头部标签闭合
            strHtml += '</div>';

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'year';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择小时
         * @return {Object} 返回当前DOM对象
         */
        hour () {
            // 元素
            const eleContainer = this.element.target;

            // 当前选择时间
            const arrTime = this[SELECTED];

            // 时间选择的小时间隔，默认是1小时
            let numStep = this.step || 1;

            // 最小时间，和最大时间
            // 这里只比较小时
            let numMin = Number(this.min.split(':')[0]) || 0;
            let numMax = Number(this.max.split(':')[0]);
            if (isNaN(numMax) || !this.max) {
                numMax = 24;
            }

            // 选择小时的完整HTML
            // 1. 同样的，专有容器
            let strHtml = `<div class="${CL.hour('x')}">`;

            const getStrHtmlTime = () => {
                let strHtmlTime = '';
                let strHour = '';
                let strClass = '';
                // 遍历24小时
                for (let indexHour = 0; indexHour < 24; indexHour += numStep) {
                    strHour = String(indexHour).padStart(2, '0');

                    // 选中态的类名
                    strClass = CL.date('item');
                    if (strHour == arrTime[0]) {
                        strClass = `${strClass} ${SELECTED}`;
                    }

                    // 是否在范围以内
                    if (indexHour >= numMin && indexHour <= numMax) {
                        strHtmlTime = `${strHtmlTime}<a href="javascript:" class="${strClass}">${strHour}:00</a>`;
                    } else {
                        strHtmlTime = `${strHtmlTime}<span class="${strClass}">${strHour}:00</span>`;
                    }
                }

                return strHtmlTime;
            };
            // 2. 小时没有头部切换，直接列表们
            strHtml = `${strHtml}<div class="${CL.hour('body')}">${getStrHtmlTime()}</div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'hour';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 选择时间，多垂直列表选择模式，支持到时分秒
         * step如果设置，则可以选择秒
         */
        time () {
            // 元素
            const eleContainer = this.element.target;

            // 当前选择时间
            const arrTime = this[SELECTED];
            let numHourSelected = Number(arrTime[0]);
            let numMinuteSelected = Number(arrTime[1]);
            let numSecondSelected = Number(arrTime[2]);

            // 时间间隔, 默认为1秒或者1分钟
            let numStep = this.step * 1 || 1;
            if (numStep > 60) {
                numStep = Math.floor(numStep / 60);
            }

            let strMin = this.min || '00:00:00';
            let strMax = this.max || '23:59:59';

            let numMinHour = Number(strMin.split(':')[0]) || 0;
            let numMinMinute = Number(strMin.split(':')[1]) || 0;
            let numMinSecond = Number(strMin.split(':')[2]) || 0;

            let numMaxHour = Number(strMax.split(':')[0]);
            if (isNaN(numMaxHour)) {
                numMaxHour = 23;
            }
            let numMaxMinute = Number(strMax.split(':')[1]);
            let numMaxSecond = Number(strMax.split(':')[2]);
            if (isNaN(numMaxMinute)) {
                numMaxMinute = 59;
            }
            if (isNaN(numMaxSecond)) {
                numMaxSecond = 59;
            }

            let arrAmpm = [];
            if (this.datetimeformat != 'H:mm') {
                // pm
                arrAmpm = [0, 1].map(index => {
                    if (index == 0) {
                        return  {
                            value: '上午',
                            selected: numHourSelected <= 11
                        };
                    }
                    return  {
                        value: '下午',
                        selected: numHourSelected > 11
                    };
                });
            }

            // 小时的范围
            let arrHours = Array(24).fill().map((empty, index) => {
                let disabled = false;
                if (index < numMinHour || index > numMaxHour) {
                    disabled = true;
                }
                // 是否隐藏
                let visibility = true;
                // 是否选中
                let selected = false;

                let value = String(index).padStart(2, '0');

                if (this.datetimeformat != 'H:mm') {
                    if ((index > 11 && arrAmpm[0].selected) || (index <= 11 && arrAmpm[1].selected)) {
                        visibility = false;
                    }

                    if (index >= 12) {
                        value = String(index - 12).padStart(2, '0');
                    }
                    if (value == '00') {
                        value = '12';
                    }
                }

                if (index == numHourSelected) {
                    selected = true;
                }

                return {
                    value: value,
                    disabled: disabled,
                    selected: selected,
                    visibility: visibility
                };
            });

            // 小时和分钟的禁用态处理
            let arrMinutes = Array(60).fill().map((empty, index) => {
                // 是否禁用
                let disabled = false;
                // 是否不可见
                let visibility = true;
                // 是否选中
                let selected = false;

                if (numHourSelected == numMinHour && index < numMinMinute) {
                    disabled = true;
                } else if (numHourSelected == numMaxHour && index > numMaxMinute) {
                    disabled = true;
                }
                // step的处理
                if (arrTime.length == 2 && index % numStep != 0) {
                    visibility = false;
                }

                if (index == numMinuteSelected) {
                    selected = true;
                }

                return {
                    value: String(index).padStart(2, '0'),
                    disabled: disabled,
                    visibility: visibility,
                    selected: selected
                };
            });

            let arrSeconds = Array(60).fill().map((empty, index) => {
                // 是否禁用
                let disabled = false;
                // 是否不可见
                let visibility = true;
                // 是否选中
                let selected = false;

                if (numHourSelected == numMinHour && numMinuteSelected == numMinMinute && index < numMinSecond) {
                    disabled = true;
                } else if (numHourSelected == numMaxHour && numMinuteSelected == numMaxMinute && index > numMaxSecond) {
                    disabled = true;
                }
                // step的处理
                if (arrTime.length == 3 && index % numStep != 0) {
                    visibility = false;
                }

                if (index == numSecondSelected) {
                    selected = true;
                }

                return {
                    value: String(index).padStart(2, '0'),
                    disabled: disabled,
                    visibility: visibility,
                    selected: selected
                };
            });

            if (eleContainer.innerHTML) {
                // 如果有内容，基于DOM比对
                [...eleContainer.querySelectorAll('button')].forEach(function (button) {
                    // 所有样式先还原
                    button.classList.remove(SELECTED);
                    button.disabled = false;
                    button.dataset.visibility = 'true';
                    // 按钮再所在分组的索引值
                    let numIndexButton = button.dataset.index;
                    // 再分别匹配处理
                    let strButtonType = button.parentElement.dataset.type;
                    if (strButtonType == 'ampm') {
                        if (arrAmpm[numIndexButton].selected) {
                            button.classList.add(SELECTED);
                        }
                    } else {
                        // 时分秒可以统一处理
                        let objTypeData = {
                            hour: arrHours,
                            minute: arrMinutes,
                            second: arrSeconds
                        };
                        let objDataMatch = objTypeData[strButtonType][numIndexButton];
                        if (objDataMatch.selected) {
                            button.classList.add(SELECTED);
                        }
                        if (objDataMatch.disabled) {
                            button.disabled = true;
                        }
                        if (objDataMatch.visibility == false) {
                            button.dataset.visibility = 'false';
                        }
                    }
                });

                return this;
            }

            // 选择时间的完整HTML
            // 1. 外部的容器，含有专有容器类名，可以重置内部的一些样式
            let strHtml = `<div class="${CL.time('x')}" data-step="${numStep}">`;

            // 上午下午
            if (this.datetimeformat != 'H:mm') {
                strHtml = strHtml + `<div class="${CL.time('col')}" data-type="ampm">
                    ${arrAmpm.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' selected' : ''}" data-index="${index}">${obj.value}</button>`).join('')}
                </div>`;
            }
            // 时分秒
            strHtml = strHtml + `<div class="${CL.time('col')}" data-type="hour">
                ${arrHours.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' ' + SELECTED : ''}" data-index="${index}"${obj.disabled ? ' disabled' : ''} data-visibility="${obj.visibility}">${obj.value}</button>`).join('')}
            </div>`;
            strHtml = strHtml + `<div class="${CL.time('col')}" data-type="minute">
                ${arrMinutes.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' ' + SELECTED : ''}" data-index="${index}"${obj.disabled ? ' disabled' : ''} data-visibility="${obj.visibility}">${obj.value}</button>`).join('')}
            </div>`;

            if (arrTime.length == 3) {
                strHtml = strHtml + `<div class="${CL.time('col')}" data-type="second">
                    ${arrSeconds.map((obj, index) => `<button class="${CL.time('item')}${obj.selected ? ' ' + SELECTED : ''}" data-index="${index}"${obj.disabled ? ' disabled' : ''} data-visibility="${obj.visibility}">${obj.value}</button>`).join('')}
                </div>`;
            }

            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'time';
            eleContainer.innerHTML = strHtml;
        }

        /**
         * 选择分钟
         * @return {Object} 返回当前DOM对象
         */
        minute () {
            // 元素
            const eleContainer = this.element.target;

            // 当前选择时间
            const arrTime = this[SELECTED];

            // 分钟时间间隔, 默认为5分钟
            const numStep = this.step * 1 || 1;

            // 最小时间，和最大时间
            // 跟小时不同，这里必须符合00:00格式
            // 由于格式固定，我们直接去除':'后的值进行比较
            // 例如：10:20 → 1020
            let numMin = (this.min || '0').replace(':', '') * 1;
            let numMax = (this.max || '2359').replace(':', '') * 1;

            // 选择分钟的完整HTML
            // 1. 外部的容器，含有专有容器类名，可以重置内部的一些样式
            let strHtml = `<div class="${CL.minute('x')}" data-step="${numStep}">`;
            // 2. 头部小时的左右切换
            const hour = arrTime[0] * 1;
            //   首先是公共部分
            strHtml = `${strHtml}<div class="${CL.date('head')}">`;

            //   2.1 可不可往前翻
            if (hour <= Math.floor(numMin / 100)) {
                strHtml = `${strHtml}<span class="${CL.date('prev')}"></span>`;
            } else {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('prev')}" data-hour="${hour - 1}" role="button" aria-label="上一个小时"></a>`;
            }
            // 2.2 可不可以往后翻
            if (hour >= Math.floor(numMax / 100)) {
                strHtml = `${strHtml}<span class="${CL.date('next')}"></span>`;
            } else {
                strHtml = `${strHtml}<a href="javascript:" class="${CL.date('next')}" data-hour="${hour + 1}" role="button" aria-label="下一个小时"></a>`;
            }

            // 头部结束的公共html部分
            strHtml = `${strHtml}<a href="javascript:" class="${CL.date('switch')}" data-type="hour">${arrTime[0]}:00</a></div>`;

            const getStrHtmlTime = () => {
                let strHtmlTime = '';
                let strMinute = '';
                let strClass = '';
                // 遍历60分钟
                for (let indexMinute = 0; indexMinute < 60; indexMinute += numStep) {
                    strMinute = `${indexMinute}`;
                    if (strMinute.length == 1) {
                        strMinute = `0${strMinute}`;
                    }

                    // 基本样式
                    strClass = CL.date('item');

                    // 是否在时间范围内
                    if ((arrTime[0] + strMinute) * 1 >= numMin && (arrTime[0] + strMinute) * 1 <= numMax) {
                        // 选中态
                        if (strMinute == arrTime[1]) {
                            strClass = `${strClass} ${SELECTED}`;
                        }
                        strHtmlTime = `${strHtmlTime}<a href="javascript:" class="${strClass}">${[arrTime[0], strMinute].join(':')}</a>`;
                    } else {
                        strHtmlTime = `${strHtmlTime}<span class="${strClass}">${[arrTime[0], strMinute].join(':')}</span>`;
                    }
                }

                return strHtmlTime;
            };
            // 3. 分钟主体
            strHtml = `${strHtml}<div class="${CL.minute('body')}">${getStrHtmlTime()}</div>`;

            // 容器闭合标签
            strHtml += '</div>';

            // 设置当前时间选择类型
            eleContainer.dataset.type = 'minute';
            eleContainer.innerHTML = strHtml;

            return this;
        }

        /**
         * 面板的定位
         * @return 当前DOM元素对象
         */
        position () {
            // 定位
            this.follow();

            return this;
        }

        /**
         * 日期选择面板的显示
         * @return {Object} 当前DOM元素对象
         */
        show () {
            // 元素
            const eleContainer = this.element.target;

            if (this.disabled) {
                return this;
            }

            // 根据value更新SELECTED
            this.format();

            // 不同的类名显示不同的内容
            if (this.params.type == 'date-range') {
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
                // DOM准备完毕
                this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
            }

            eleContainer.style.display = 'inline-block';
            this.classList.add(ACTIVE);

            // 定位
            this.position();

            // 改变显示与隐藏的标志量
            this.display = true;

            // 选中的元素进入视区
            if (this.params.type == 'time') {
                [...eleContainer.querySelectorAll('.' + SELECTED)].forEach((item, index) => {
                    if (item.scrollIntoViewIfNeeded) {
                        item.scrollIntoViewIfNeeded();
                    } else if (item.offsetTop - 5 > item.parentElement.scrollTop + item.parentElement.clientHeight || item.offsetTop - 5 < item.parentElement.scrollTop) {
                        // firefox尚未支持scrollIntoViewIfNeeded()
                        item.parentElement.scrollTop = item.offsetTop - 5;
                    }
                    if (index == 0) {
                        item.focus({
                            preventScroll: true
                        });
                    }
                });
            }

            // 触发自定义事件 - show
            this.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-datetime'
                }
            }));

            return this;
        }

        /**
         * 日期选择面板的隐藏
         * @return {Object} 当前DOM元素对象
         */
        hide () {
            // 元素
            const eleContainer = this.element.target;

            if (this.display == true) {
                eleContainer.style.display = 'none';
                this.classList.remove(ACTIVE);

                // 焦点位置还原
                if (document.activeElement == document.body || eleContainer.contains(document.activeElement)) {
                    this.focus();
                    this.blur();
                }
            }

            // 改变显示与隐藏的标志量
            this.display = false;

            // 触发自定义事件 - hide
            this.dispatchEvent(new CustomEvent('hide', {
                detail: {
                    type: 'ui-datetime'
                }
            }));

            return this;
        }

        // 自定义组件进入页面时候
        connectedCallback () {
            // 普通文本类型变成日期类型
            let strType = this.getAttribute('type');
            if (['date', 'year', 'month', 'time', 'hour', 'minute', 'date-range', 'month-range'].includes(strType) == false) {
                strType = 'date';

                // 移除type属性可以和CSS中设置的尺寸的选择器匹配
                if (strType) {
                    this.removeAttribute('type');
                }
            }
            // 关联的参数
            this.params = this.params || {};
            // 输入框应用的时间选择类型
            this.params.type = strType;

            // 容器元素
            let eleContainer = null;

            // readonly 文本输入框不可直接修改
            this.setAttribute('readonly', 'readonly');
            this.toggleAttribute('required', true);

            let strId = this.id;
            if (!strId) {
                // 如果没有id, 创建随机id
                strId = `lulu_${String(Math.random()).replace('0.', '')}`;
                this.id = strId;
            }

            // 初始值
            let strInitValue = this.getAttribute('value') || this.value;

            // 初始值转换成时间值
            switch (strType) {
                case 'date': case 'year': case 'month': {
                    // 日期
                    const objInitDate = strInitValue.toDate();
                    const arrDate = objInitDate.toArray();

                    // 赋值
                    if (strType == 'date') {
                        this.value = arrDate.join('-');
                    } else if (strType == 'year') {
                        this.value = arrDate[0];
                    } else if (strType == 'month') {
                        this.value = arrDate.slice(0, 2).join('-');
                    }

                    // eg. [2015,07,20]
                    this[SELECTED] = arrDate;

                    break;
                }
                case 'time': {
                    const arrTime = strInitValue.toTime();
                    // 当前时分秒
                    let dateCurrent = new Date();
                    let numHour = dateCurrent.getHours();
                    let numMinute = dateCurrent.getMinutes();
                    let numSecond = dateCurrent.getSeconds();
                    // 时间
                    let strHour = String(arrTime[0] || numHour).padStart(2, '0');
                    let strMinute = String(arrTime[1] || numMinute).padStart(2, '0');
                    let strSecond = String(arrTime[2] || numSecond).padStart(2, '0');

                    // 如果有设置合理的step值，且类型是time，则支持秒
                    let numStep = this.step;

                    if (strType == 'time' && ((!numStep && arrTime[2]) || (numStep > 0 && numStep <= 30))) {
                        this.value = [strHour, strMinute, strSecond].join(':');
                    } else {
                        this.value = [strHour, strMinute].join(':');
                    }

                    // 下面语句无效
                    // this.datetimeformat = 'H:mm';

                    this[SELECTED] = [strHour, strMinute, strSecond];

                    break;
                }
                case 'hour': case 'minute': {
                    const arrTime = strInitValue.toTime();
                    // 当前时分秒
                    let dateCurrent = new Date();
                    let numHour = dateCurrent.getHours();
                    let numMinute = dateCurrent.getMinutes();
                    // 时间
                    let strHour = String(arrTime[0] || numHour).padStart(2, '0');
                    let strMinute = String(arrTime[1] || numMinute).padStart(2, '0');

                    if (!arrTime[0] && strType == 'hour') {
                        strMinute = '00';
                    }

                    this.value = [strHour, strMinute].join(':');

                    this[SELECTED] = [strHour, strMinute];

                    break;
                }
                case 'date-range': case 'month-range': {
                    // 日期范围
                    let objBeginDate = new Date();
                    let objEndDate = new Date();
                    // 前后时间字符串
                    const arrRange = strInitValue.split(' ');
                    // 有如下一些情况：
                    // 1. 空，则选择范围就是今日
                    // 2. 只有一个时间，则选择范围只这个时间到今天这个范围
                    // 3. 其他就是正常的
                    if (strInitValue != '' && arrRange.length == 1) {
                        const someDate = arrRange[0].toDate();
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
                    const arrBegin = objBeginDate.toArray();
                    const arrEnd = objEndDate.toArray();

                    if (strType == 'date-range') {
                        this.value = `${arrBegin.join('-')} 至 ${arrEnd.join('-')}`;
                    } else {
                        this.value = `${arrBegin.slice(0, 2).join('-')} 至 ${arrEnd.slice(0, 2).join('-')}`;
                    }

                    // 存储
                    this[SELECTED] = [arrBegin, arrEnd];

                    break;
                }
            }

            // time时间类型的是H:mm还是ah:mm的判断
            if (/time/.test(strType)) {
                // 默认是24小时类型，不支持time类型输入框的浏览器会使用此类型，例如Safari
                this.datetimeformat = 'H:mm';
                // 根据尺寸判断
                let eleInputTmp = document.createElement('input');
                eleInputTmp.setAttribute('type', 'time');
                eleInputTmp.value = '00:00';
                document.body.append(eleInputTmp);
                // 默认不可见
                eleInputTmp.style.position = 'absolute';
                eleInputTmp.style.left = '-999px';
                eleInputTmp.style.fontFamily = 'revert';
                // 如果浏览器不支持time类型输入框，例如Safari，则使用H:mm格式
                if (eleInputTmp.type == 'time') {
                    eleInputTmp.style.fontSize = '20px';
                    // 获取此时输入框的尺寸
                    let numWidthOrigin = eleInputTmp.clientWidth;
                    // 修改尺寸
                    eleInputTmp.style.fontSize = '30px';
                    // 比较前后尺寸变化的差异
                    let numDiffWidth = eleInputTmp.clientWidth - numWidthOrigin;
                    // 可以判断输入框字符个数
                    let numLetters = Math.ceil(numDiffWidth / 10);
                    if (numLetters >= 5) {
                        this.datetimeformat = 'ah:mm';
                    }
                    eleInputTmp.remove();
                }
            }

            // 容器元素的创建
            if (!eleContainer) {
                eleContainer = document.createElement('div');
                eleContainer.classList.add(CL.date('container'));

                // keyboard键盘无障碍访问需要
                const strRandId = `lulu_${String(Math.random()).replace('0.', '')}`;
                eleContainer.setAttribute('id', strRandId);
                eleContainer.classList.add('ESC');
                this.setAttribute('data-target', strRandId);
                // 记录input的id
                eleContainer.setAttribute('data-id', strId);
            }

            // 暴露的一些数据
            // 关联的元素
            this.element = this.element || {};
            this.element.target = eleContainer;

            this.events();

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-datetime'
                }
            }));
        }
    }

    return Component;
})();

if (!customElements.get('ui-datetime')) {
    customElements.define('ui-datetime', DateTime, {
        extends: 'input'
    });
}
