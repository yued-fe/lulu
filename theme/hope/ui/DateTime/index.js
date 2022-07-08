/**
 * @DateTime.js
 * @author zhangxinxu
 * @version
 * @created: 15-07-03
 * @edited:  19-11-12
 * @edited:  20-07-27 edit by wanghao
 * @edited:  22-06-? by zhangxinxu
 */

/**/import '../Popup/index.js';
/**/import '../ScrollSnap/index.js';

/**
 * 日期，时间选择器
 * 基于HTML5时间类输入框
 * @example is="ui-datetime"
 * @trigger 触发的元素，可以是文本框也可以是文本框容器(父级)
 * @options 可选参数
 */
/**/(async () => {
/**/    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
/**/        await import('../safari-polyfill.js');
/**/    }

    // 样式类名统一处理
    const CL = {
        toString: () => 'ui-datetime'
    };
    ['date', 'day', 'year', 'month', 'hour', 'minute', 'time', 'second'].forEach((key) => {
        CL[key] = (...args) => ['ui', key, ...args].join('-');
    });

    const SELECTED = 'selected';
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


    class UiDateTime extends HTMLInputElement {
        constructor () {
            super();

            // 暴露的一些数据
            // 关联的元素
            this.element = this.element || {};

            // 显示时间选项的容器
            let eleContainer = document.createElement('div');
            eleContainer.className = CL.date('container');

            // 替换
            this.element.container = eleContainer;
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

        setError () {
            let eleContainer = this.element.container;
            let strSelector = '[disabled][selected]';
            // 是否超出范围的提示
            eleContainer.toggleAttribute('is-error', eleContainer.querySelector(strSelector));
        }

        /**
         * 
         * @returns 基于当前的选择，设置列表容器的状态
        **/
        setStatus () {
            // 范围限制
            let min = this.min;
            let max = this.max;

            if (!min && !max) {
                return;
            }

            let arrMin = min.split(/\D/);
            let arrMax = max.split(/\D/);

            let eleContainer = this.element.container;
            let strSelector = '[disabled][selected]';
            
            // 当前日期
            let arrDate = this[SELECTED];

            // 类型
            let type = this.params.type;

            if (type == 'time' || type == 'hour' || type == 'minute') {
                let strMin = min || '00:00:00';
                let strMax = max || '23:59:59';

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

                // 列表容器的处理
                let eleSnapMinute = eleContainer.querySelector('ui-scroll-snap[list="minute"]');
                let eleSnapSecond = eleContainer.querySelector('ui-scroll-snap[list="second"]');

                if (!eleSnapMinute) {
                    this.setError();
                    return;
                }

                // 分钟的禁用态处理
                if (arrDate[0] < numMinHour || arrDate[0] > numMaxHour) {
                    [...eleSnapMinute.children].forEach(item => {
                        item.disabled = true;
                    });
                } else if (arrDate[0] == numMinHour) {
                    // 小于分钟的禁用
                    [...eleSnapMinute.children].forEach(item => {
                        let minute = parseInt(item.textContent);

                        if (minute < numMinMinute) {
                            item.disabled = true;
                        } else {
                            item.disabled = false;
                        } 
                    });
                } else if (arrDate[0] == numMaxHour) {
                    // 大于分钟的禁用
                    [...eleSnapMinute.children].forEach(item => {
                        let minute = parseInt(item.textContent);

                        if (minute > numMaxMinute) {
                            item.disabled = true;
                        } else {
                            item.disabled = false;
                        } 
                    });
                } else {
                    [...eleSnapMinute.children].forEach(item => {
                        item.disabled = false;
                    });
                }

                // 秒的处理
                if (!eleSnapSecond) {
                    // 是否超出范围的提示
                    this.setError();
                    return;
                }
                // 如果月份选中项同时禁用
                if (eleSnapMinute.querySelector(strSelector)) {
                    [...eleSnapSecond.children].forEach(item => {
                        item.disabled = true;
                    });
                } else if (arrDate[0] == numMinHour && Number(arrDate[1]) == Number(numMinMinute)) {
                    // 小于日期的禁用
                    [...eleSnapSecond.children].forEach(item => {
                        item.disabled = (parseInt(item.textContent) < numMinSecond);
                    });
                } else if (arrDate[0] == numMaxHour && Number(arrDate[1]) == Number(numMaxMinute)) {
                    // 小于日期的禁用
                    [...eleSnapSecond.children].forEach(item => {
                        item.disabled = (parseInt(item.textContent) > numMaxSecond);
                    });
                } else {
                    [...eleSnapSecond.children].forEach(item => {
                        item.disabled = false;
                    });
                }

                this.setError();

                return;
            }

            // 年月日选择处理
            let minYear = arrMin[0] || 0;
            let maxYear = arrMax[0] || 9999;

            let minMonth = arrMin[1] || 1;
            let maxMonth = arrMax[1] || 12;

            let minDay = arrMin[2] || 1;
            let maxDay = arrMax[2] || 31;

            let eleSnapMonth = eleContainer.querySelector('[list="month"]');
            let eleSnapDay = eleContainer.querySelector('[list="day"]');

            if (!eleSnapMonth) {
                this.setError();
                return;
            }

            // 月份的禁用与否处理
            if (arrDate[0] < minYear || arrDate[1] > maxYear) {
                [...eleSnapMonth.children].forEach(item => {
                    item.disabled = true;
                });
            } else if (arrDate[0] == minYear) {
                // 小于月份的禁用
                [...eleSnapMonth.children].forEach(item => {
                    let month = parseInt(item.textContent);

                    if (month < minMonth) {
                        item.disabled = true;
                    } else {
                        item.disabled = false;
                    } 
                });
            } else if (arrDate[0] == maxYear) {
                // 大于月份的禁用
                [...eleSnapMonth.children].forEach(item => {
                    let month = parseInt(item.textContent);

                    if (month > maxMonth) {
                        item.disabled = true;
                    } else {
                        item.disabled = false;
                    } 
                });
            } else {
                [...eleSnapMonth.children].forEach(item => {
                    item.disabled = false;
                });
            }
            
            // 如果日期禁用
            if (!eleSnapDay) {
                // 是否超出范围的提示
                this.setError();
                return;
            }
            // 如果月份选中项同时禁用
            if (eleSnapMonth.querySelector(strSelector)) {
                [...eleSnapDay.children].forEach(item => {
                    item.disabled = true;
                });
            } else if (arrDate[0] == minYear && Number(arrDate[1]) == Number(minMonth)) {
                // 小于日期的禁用
                [...eleSnapDay.children].forEach(item => {
                    let day = parseInt(item.textContent);

                    if (day < minDay) {
                        item.disabled = true;
                    } else {
                        item.disabled = false;
                    }
                });
            } else if (arrDate[0] == maxYear && Number(arrDate[1]) == Number(maxMonth)) {
                // 小于日期的禁用
                [...eleSnapDay.children].forEach(item => {
                    let day = parseInt(item.textContent);

                    if (day > maxDay) {
                        item.disabled = true;
                    } else {
                        item.disabled = false;
                    }
                });
            } else {
                [...eleSnapDay.children].forEach(item => {
                    item.disabled = false;
                });
            }

            this.setError();
        }

        /**
         * 事件
         * @return {[type]} [description]
         */
        events () {
            // 点击显示 popup 
            this.addEventListener('click', function () {
                let popup = this.element.popup;
                let type = this.params.type;
                if (popup) {
                    popup.show();
                } else {
                    popup = new Popup({
                        content: this.element.container
                    });

                    popup.addEventListener('show', () => {
                        if (this[type]) {
                            this[type]();
                        }
                        // 触发显示回调
                        this.show();
                    });

                    popup.addEventListener('hide', () => {
                        this.hide();
                    });

                    this.element.popup = popup;
                }
            });

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
                case 'time': case 'minute': {
                    this.value = arrSelected.join(':');
                    break;
                }
                case 'hour': {
                    this.value = `${arrSelected[0]}:${arrSelected[1] || '00'}`;
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
        getYearData (arrDate) {
            let year = new Date().getFullYear();
            if (arrDate && arrDate[0]) {
                year = arrDate[0] || year;
            }

            // 前后各10年
            let htmlYear = '';
            for (let start = year - 5; start <= year + 5; start++) {
                htmlYear += `<ui-scroll-snap-item${start === year ? ' selected' : ''}>${start}年</ui-scroll-snap-item>`;
            }

            return htmlYear;
        }

        /**
         * 月份组装
         * @param  {Array} arrDate 数组化的日期表示值
         * @return {Object}        返回的是后续方法需要的数据的纯对象，包括组装的HTML字符数据，月份最大和最小值。
         */
        getMonthData (arrDate) {
            let month = 0;
            if (arrDate && arrDate[1]) {
                // 返回当前月份有几天
                month = arrDate[1] - 1 || month;
            }

            // HTML 组装
            return Array(12).fill().map((_, index) => {
                return `<ui-scroll-snap-item${index === month ? ' selected' : ''}>${String(index + 1).padStart(2, '0')}月</ui-scroll-snap-item>`;
            }).join('');
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
         * 获取日期列表
         */
        getDayData (arrDate) {
            // 目前日期对象
            let currentDate = new Date();

            if (arrDate) {
                currentDate = arrDate.join('-').toDate();
            }

            // 返回当前月份有几天
            let month = currentDate.getMonth();
            let fullDate = this.getMonthDay(currentDate)[month];
            // 当前日期数量
            let date = currentDate.getDate();
            // HTML 组装
            return Array(fullDate).fill().map((_, index) => {
                return `<ui-scroll-snap-item${(index + 1) === date ? ' selected' : ''}>${String(index + 1).padStart(2, '0')}日</ui-scroll-snap-item>`;
            }).join('');
        }

        /**
         * 获取小时列表
         */
        getHourData (arrTime) {
            let numHour = new Date().getHours();
            if (arrTime) {
                numHour = Number(arrTime[0]);
            }
            
            let length = 24;
            // 上午下午12小时制
            if (this.datetimeformat == 'ah:mm') {
                length = 12;

                if (numHour > 12) {
                    numHour = numHour - 12;
                }
            }

            let strMin = this.min || '00:00:00';
            let strMax = this.max || '23:59:59';

            let numMinHour = Number(strMin.split(':')[0]) || 0;
            let numMaxHour = Number(strMax.split(':')[0]);
            if (isNaN(numMaxHour)) {
                numMaxHour = 23;
            }
            
            // HTML 组装
            return Array(length).fill().map((_, index) => {
                return `<ui-scroll-snap-item${index === numHour ? ' selected' : ''}${index < numMinHour || index > numMaxHour ? ' disabled' : ''}>${String(index).padStart(2, '0')}时</ui-scroll-snap-item>`;
            }).join('');
        }

        /**
         * 分钟是数据列表获取
         */
        getMinuteData (value) {
            let currentHour = this[SELECTED][0];
            let currentMinute = this[SELECTED][1];
            if (!currentMinute && currentMinute !== 0) {
                currentMinute = new Date().getMinutes();
            }

            // 时间间隔, 默认为1秒或者1分钟
            let numStep = this.step * 1 || 1;
            if (numStep > 60) {
                numStep = Math.floor(numStep / 60);
            }

            if (!value && numStep == 60) {
                value = '00';
            }

            const strEmpty = '<ui-scroll-snap-item></ui-scroll-snap-item>';

            if (typeof value != 'undefined') {
                return strEmpty + `<ui-scroll-snap-item selected>${String(value).padStart(2, '0')}分</ui-scroll-snap-item>`;
            }

            let length = Math.floor(60 / numStep);

            // 范围限制处理
            let strMin = this.min;
            let strMax = this.max;

            if (!strMin || strMin.split(':').length < 2) {
                strMin = '00:00:00';
            }
            if (!strMax || strMax.split(':').length < 2) {
                strMin = '23:59:59';
            }

            let arrMin = strMin.split(':');
            let arrMax = strMax.split(':');

            // HTML 组装
            let html = Array(length).fill().map((_, index) => {
                let minute = numStep * index;
                let disabled = '';
                if ((Number(currentHour) == Number(arrMin[0]) && index < arrMin[1]) || (Number(currentHour) == Number(arrMax[0]) && index > arrMax[1])) {
                    disabled = ' disabled';
                }

                return `<ui-scroll-snap-item${minute === currentMinute ? ' selected' : ''}${disabled}>${String(minute).padStart(2, '0')}分</ui-scroll-snap-item>`;
            }).join('');

            if (length < 6) {
                html = strEmpty + html + strEmpty;

                if (this.element.minute) {
                    this.element.minute.removeAttribute('loop');
                }
            }

            return html;
        }

        /**
         * 秒的数据列表获取
         */
         getSecondData () {
            let currentSecond = this[SELECTED][2];
            if (!currentSecond && currentSecond !== 0) {
                currentSecond = new Date().getSeconds();
            }

            // 时间间隔, 默认为1秒
            let numStep = this.step * 1 || 1;
            if (numStep > 60) {
                numStep = Math.floor(numStep / 60);
            }

            const strEmpty = '<ui-scroll-snap-item></ui-scroll-snap-item>';

            let length = Math.floor(60 / numStep);
            // 根据 step 值取整
            currentSecond = Math.floor(currentSecond / numStep) * numStep;

            // HTML 组装
            let html = Array(length).fill().map((_, index) => {
                let second = numStep * index;
                return `<ui-scroll-snap-item${second === currentSecond ? ' selected' : ''}>${String(second).padStart(2, '0')}秒</ui-scroll-snap-item>`;
            }).join('');

            if (length < 6) {
                html = strEmpty + html + strEmpty;

                if (this.element.second) {
                    this.element.second.removeAttribute('loop');
                }
            }

            return html;
        }

        /**
         * 秒的数据列表获取
         */
        getAmpmData () {
            const strEmpty = '<ui-scroll-snap-item></ui-scroll-snap-item>';

            let hour = this[SELECTED][0];

            let indexMatch = 1;
            if (hour * 1 < 12) {
                indexMatch = 0;
            }

            return strEmpty + `<ui-scroll-snap-item${indexMatch === 0 ? ' selected' : ''}>上午</ui-scroll-snap-item><ui-scroll-snap-item${indexMatch === 1 ? ' selected' : ''}>下午</ui-scroll-snap-item>` + strEmpty;
        }
        /**
         * 选择日期
         * @return {Object} 返回当前DOM对象
         */
        date () {
            this.month();

            this.day();

            return this;
        }

        /**
         * 选择月份
         * @return {Object} 返回当前DOM对象
         */
        month () {
            // 月份选择必须年份出马
            this.year();

            let eleScrollMonth = this.element.month;

            // 当前日期
            let arrDate = this[SELECTED];

            if (!eleScrollMonth) {
                eleScrollMonth = document.createElement('ui-scroll-snap');
                eleScrollMonth.setAttribute('type', 'y');
                eleScrollMonth.setAttribute('loop', '');
                eleScrollMonth.setAttribute('list', 'month');

                // 事件处理
                eleScrollMonth.addEventListener('scrollEnd', event => {
                    let detail = event.detail;

                    if (detail.item) {
                        arrDate[1] = detail.item.textContent.replace(/\D/g, '');
                        this[SELECTED] = arrDate;
                        this.setValue();
                        // 错误提示
                        this.setStatus();
                    }
                });

                // 内容更新
                eleScrollMonth.innerHTML = this.getMonthData();

                // 外部的列表容器元素
                let eleWrap = document.createElement('div');
                eleWrap.className = CL.month('container');
                eleWrap.append(eleScrollMonth);

                // 载入
                this.element.year.parentElement.after(eleWrap);
                // 暴露出去
                this.element.month = eleScrollMonth;
            }

            // 高亮并定位选中的列表项
            let eleSelected = eleScrollMonth.querySelector(':scope > [selected]');
            if (eleSelected) {
                eleSelected.removeAttribute('selected');
            }
            [...eleScrollMonth.children].some(item => {
                if (item.textContent.replace(/\D/g, '') == String(arrDate[1])) {
                    item.selected = true;
                    item.position();
                }
            });
        }

        /**
         * 选择日
         * @return {Object} 返回当前DOM对象
         */
        day () {
            let eleScrollDay = this.element.day;
            let eleContainer = this.element.container;

            // 当前日期
            let arrDate = this[SELECTED];

            if (!eleScrollDay) {
                eleScrollDay = document.createElement('ui-scroll-snap');
                eleScrollDay.setAttribute('type', 'y');
                eleScrollDay.setAttribute('loop', '');
                eleScrollDay.setAttribute('list', 'day');

                // 事件处理
                eleScrollDay.addEventListener('scrollEnd', event => {
                    let detail = event.detail;

                    if (detail.item) {
                        arrDate[2] = detail.item.textContent.replace(/\D/g, '');
                        this[SELECTED] = arrDate;
                        this.setValue();
                        // 错误提示
                        this.setStatus();
                    }
                });

                // 内容更新
                eleScrollDay.innerHTML = this.getDayData();

                // 外部的列表容器元素
                let eleWrap = document.createElement('div');
                eleWrap.className = CL.day('container');
                eleWrap.append(eleScrollDay);

                // 载入
                eleContainer.append(eleWrap);

                // 暴露
                this.element.day = eleScrollDay;
            }

            // 高亮并定位选中的列表项
            let eleSelected = eleScrollDay.querySelector(':scope > [selected]');
            if (eleSelected) {
                eleSelected.removeAttribute('selected');
            }
            [...eleScrollDay.children].some(item => {
                if (item.textContent.replace(/\D/g, '') == String(arrDate[2])) {
                    item.selected = true;
                    item.position();
                }
            });
            
            return this;
        }

        /**
         * 选择年份
         * @return {Object} 返回当前DOM对象
         */
        year () {
            let eleScrollYear = this.element.year;
            let eleContainer = this.element.container;

            let arrDate = this[SELECTED];

            // 范围限制
            let min = this.min;
            let max = this.max;

            let minYear = min.split(/\D/)[0] || 0;
            let maxYear = max.split(/\D/)[0] || 9999;

            if (!eleScrollYear) {
                eleScrollYear = document.createElement('ui-scroll-snap');
                eleScrollYear.setAttribute('type', 'y');
                eleScrollYear.setAttribute('loop', '');
                eleScrollYear.setAttribute('list', 'year');

                // 事件处理
                eleScrollYear.addEventListener('scrollEnd', event => {
                    let detail = event.detail;

                    if (detail.item) {
                        arrDate[0] = detail.item.textContent.replace(/\D/g, '');
                        this[SELECTED] = arrDate;
                        this.setValue();
                        // 错误提示
                        this.setStatus();
                    }
                });

                // 内容更新
                eleScrollYear.innerHTML = this.getYearData();

                // 外部的列表容器元素
                let eleWrap = document.createElement('div');
                eleWrap.className = CL.year('container');
                eleWrap.append(eleScrollYear);

                // 初始化处理
                eleScrollYear.onScrollInited = function (items, originItems) {
                    let yearStart = parseInt(originItems[0].textContent);
                    let lengthOrigin = originItems.length;
                    // 时间重新变化
                    items.forEach((item, index) => {
                        let year = yearStart - lengthOrigin + index;
                        item.textContent = year + '年';
                        // 是否禁用
                        item.disabled = (year < minYear || year > maxYear);
                    });
                };

                // 事件处理
                eleScrollYear.onScrollStart = function (items, originItems) {
                    let yearStart = parseInt(items[0].textContent);
                    let lengthOrigin = originItems.length;

                    items.forEach((item, index) => {
                        if (index < lengthOrigin) {
                            let year = yearStart - lengthOrigin + index;
                            item.textContent = year + '年';
                            // 是否禁用
                            item.disabled = (year < minYear || year > maxYear);
                        }
                    });

                    originItems.forEach((item, index) => {
                        let year = yearStart + index;
                        item.textContent = year + '年';
                        // 是否禁用
                        item.disabled = (year < minYear || year > maxYear);
                    });
                };

                eleScrollYear.onScrollEnd = function (items, originItems, offset) {
                    // 往下无限滚动
                    let yearEnd = parseInt(items[items.length - 1].textContent);
                    // 主列表项目长度
                    let lengthOrigin = originItems.length;

                    [...items].reverse().forEach(function (item, index) {
                        let year = yearEnd + lengthOrigin - index;
                        item.textContent = year + '年';
                        // 是否禁用
                        item.disabled = (year < minYear || year > maxYear);
                    });
                };

                // 载入
                eleContainer.prepend(eleWrap);

                // 暴露
                this.element.year = eleScrollYear;
            }

            // 高亮并定位选中的列表项
            let eleSelected = eleScrollYear.querySelector(':scope > [selected]');
            if (eleSelected) {
                eleSelected.removeAttribute('selected');
            }
            [...eleScrollYear.children].some(item => {
                if (item.textContent.replace(/\D/g, '') == String(arrDate[0])) {
                    item.selected = true;
                    item.position();
                }
            });
        }

        /**
         * 选择小时
         * @return {Object} 返回当前DOM对象
         */
        hour () {
            let eleScrollHour = this.element.hour;
            let eleContainer = this.element.container;

            // 当前选择时间
            let arrTime = this[SELECTED];

            if (!eleScrollHour) {
                eleScrollHour = document.createElement('ui-scroll-snap');
                eleScrollHour.setAttribute('type', 'y');
                eleScrollHour.setAttribute('loop', '');
                eleScrollHour.setAttribute('list', 'hour');

                // 事件处理
                eleScrollHour.addEventListener('scrollEnd', event => {
                    let detail = event.detail;

                    if (detail.item) {
                        arrTime[0] = detail.item.textContent.replace(/\D/g, '');
                        // 区分上午下午
                        let eleScrollAmpm = this.element.ampm;
                        let eleAmpmSelected = eleScrollAmpm && eleScrollAmpm.querySelector('[selected]');
                        if (eleAmpmSelected && eleAmpmSelected.textContent == '下午') {
                            arrTime[0] = arrTime[0] * 1 + 12;
                        }

                        this[SELECTED] = arrTime;
                        this.setValue();
                        // 错误提示
                        this.setStatus();
                    }
                });

                // 内容更新
                eleScrollHour.innerHTML = this.getHourData(arrTime);

                // 外部的列表容器元素
                let eleWrap = document.createElement('div');
                eleWrap.className = CL.hour('container');
                eleWrap.append(eleScrollHour);

                // 载入
                eleContainer.append(eleWrap);

                // 暴露
                this.element.hour = eleScrollHour;
            }

            // 高亮并定位选中的列表项
            let eleSelected = eleScrollHour.querySelector(':scope > [selected]');
            if (eleSelected) {
                eleSelected.removeAttribute('selected');
            }
            [...eleScrollHour.children].some(item => {
                if (item.textContent.replace(/\D/g, '') == String(arrTime[0])) {
                    item.selected = true;
                    item.position();
                }
            });

            // 如果是选择小时
            if (this.params.type == 'hour') {
                this.minute(arrTime[1]);
            }

            return this;
        }

        /**
         * 选择时间，多垂直列表选择模式，支持到时分秒
         * step如果设置，则可以选择秒
         */
        time () {
            // 元素
            const eleContainer = this.element.container;

            // 当前选择时间
            const arrTime = this[SELECTED];

            // 如果是 ah:mm格式
            if (this.datetimeformat != 'H:mm') {
                let eleScrollAmpm = this.element.ampm;
                if (!eleScrollAmpm) {
                    eleScrollAmpm = document.createElement('ui-scroll-snap');
                    eleScrollAmpm.setAttribute('type', 'y');
                    eleScrollAmpm.setAttribute('list', 'ampm');
                }
                // 事件处理
                eleScrollAmpm.addEventListener('scrollEnd', event => {
                    let detail = event.detail;

                    if (detail.item) {
                        if (detail.item.textContent == '上午') {
                            if (arrTime[0] >= 12) {
                                arrTime[0] -= 12;
                            }
                        } else if (arrTime[0] < 12) {
                            arrTime[0] = arrTime[0] * 1 + 12;
                        }

                        arrTime[0] = String(arrTime[0]).padStart(2, '0');

                        this[SELECTED] = arrTime;
                        this.setValue();
                        // 错误提示
                        this.setStatus();
                    }
                });

                // 内容更新
                eleScrollAmpm.innerHTML = this.getAmpmData();

                // 外部的列表容器元素
                let eleWrap = document.createElement('div');
                eleWrap.className = CL.hour('container');
                eleWrap.append(eleScrollAmpm);

                // 载入
                eleContainer.prepend(eleWrap);

                // 暴露
                this.element.ampm = eleScrollAmpm;
            }

            this.hour().minute();

            if (arrTime.length == 3) {
                this.second();
            }
        }

        /**
         * 选择分钟
         * @param value 固定的时间
         * @return {Object} 返回当前DOM对象
         */
        minute (value) {
            if (this.params.type == 'minute') {
                this.hour();
            }

            let eleScrollMinute = this.element.minute;
            let eleContainer = this.element.container;

            // 当前选择时间
            let arrTime = this[SELECTED];

            if (!eleScrollMinute) {
                eleScrollMinute = document.createElement('ui-scroll-snap');
                eleScrollMinute.setAttribute('type', 'y');
                if (typeof value == 'undefined') {
                    eleScrollMinute.setAttribute('loop', '');
                }
                eleScrollMinute.setAttribute('list', 'minute');

                // 暴露
                this.element.minute = eleScrollMinute;

                // 事件处理
                eleScrollMinute.addEventListener('scrollEnd', event => {
                    let detail = event.detail;

                    if (detail.item) {
                        arrTime[1] = detail.item.textContent.replace(/\D/g, '');

                        this[SELECTED] = arrTime;
                        this.setValue();
                        // 错误提示
                        this.setStatus();
                    }
                });

                // 内容更新
                eleScrollMinute.innerHTML = this.getMinuteData(value);

                // 外部的列表容器元素
                let eleWrap = document.createElement('div');
                eleWrap.className = CL.minute('container');
                eleWrap.append(eleScrollMinute);

                // 载入
                eleContainer.append(eleWrap);
            }

            // 高亮并定位选中的列表项
            let eleSelected = eleScrollMinute.querySelector(':scope > [selected]');
            if (eleSelected) {
                eleSelected.removeAttribute('selected');
            }
            [...eleScrollMinute.children].some(item => {
                if (item.textContent.replace(/\D/g, '') == String(arrTime[1])) {
                    item.selected = true;
                    item.position();

                    return true;
                }
            });

            return this;
        }

        /**
         * 选择秒
         * @return {Object} 返回当前DOM对象
         */
        second () {
            let eleScrollSecond = this.element.second;
            let eleContainer = this.element.container;

            // 当前选择时间
            let arrTime = this[SELECTED];

            if (!eleScrollSecond) {
                eleScrollSecond = document.createElement('ui-scroll-snap');
                eleScrollSecond.setAttribute('type', 'y');
                eleScrollSecond.setAttribute('loop', '');
                eleScrollSecond.setAttribute('list', 'second');

                // 暴露
                this.element.minute = eleScrollSecond;

                // 事件处理
                eleScrollSecond.addEventListener('scrollEnd', event => {
                    let detail = event.detail;

                    if (detail.item) {
                        arrTime[2] = detail.item.textContent.replace(/\D/g, '');
                        this[SELECTED] = arrTime;
                        this.setValue();
                        // 错误提示
                        this.setStatus();
                    }
                });

                // 内容更新
                eleScrollSecond.innerHTML = this.getSecondData();

                // 外部的列表容器元素
                let eleWrap = document.createElement('div');
                eleWrap.className = CL.second('container');
                eleWrap.append(eleScrollSecond);

                // 载入
                eleContainer.append(eleWrap);
            }

            // 高亮并定位选中的列表项
            let eleSelected = eleScrollSecond.querySelector(':scope > [selected]');
            if (eleSelected) {
                eleSelected.removeAttribute('selected');
            }
            [...eleScrollSecond.children].some(item => {
                if (item.textContent.replace(/\D/g, '') == String(arrTime[2])) {
                    item.selected = true;
                    item.position();

                    return true;
                }
            });

            return this;
        }

        /**
         * 日期选择面板的显示
         * @return {Object} 当前DOM元素对象
         */
        show () {
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
            if (['date', 'year', 'month', 'time', 'hour', 'minute'].includes(strType) == false) {
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

            // readonly 文本输入框不可直接修改
            this.setAttribute('readonly', 'readonly');
            this.toggleAttribute('required', true);

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
                        this[SELECTED] = [strHour, strMinute, strSecond];
                    } else {
                        this.value = [strHour, strMinute].join(':');
                        this[SELECTED] = [strHour, strMinute];
                    }

                    // console.log(this[SELECTED]);

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

                    this.value = [strHour, strMinute].join(':');

                    this[SELECTED] = [strHour, strMinute];

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

            this.events();

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-datetime'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-datetime')) {
        customElements.define('ui-datetime', UiDateTime, {
            extends: 'input'
        });
    }
/**/})();
