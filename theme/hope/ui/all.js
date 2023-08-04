/*JS 合集*/
(async () => {
    if (!CSS.supports('overflow-anchor:auto') || !CSS.supports('offset:none')) {
        await import('./safari-polyfill.js');
    }


    class UiButton extends HTMLButtonElement {
        static get observedAttributes () {
            return ['color', 'height', 'radius', 'width'];
        }

        constructor () {
            super();

            this.render();
        }

        get color () {
            return this.getAttribute('color');
        }

        set color (val) {
            this.setAttribute('color', val);
        }

        get radius () {
            let radius = this.getAttribute('radius');
            if (!isNaN(radius) && !isNaN(parseFloat(radius))) {
                radius = radius + 'px';
            }
            return radius;
        }

        set radius (val) {
            this.setAttribute('radius', val);
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        renderAttribute (name, keep) {
            if (typeof this[name] == 'string') {
                this.style.setProperty('--ui-button-' + name, this[name]);
            } else if (!keep) {
                this.style.removeProperty('--ui-button-' + name);
            }
        }

        render () {
            UiButton.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.render(name);
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-button'
                }
            }));

            this.isConnectedCallback = true;
        }
    }
    
    if (!customElements.get('ui-button')) {
        customElements.define('ui-button', UiButton, {
            extends: 'button'
        });
    }





    class UiCheckbox extends HTMLInputElement {
        static get observedAttributes () {
            return ['extends', 'checked', 'disabled'];
        }

        get extends () {
            return this.hasAttribute('extends');
        }

        set extends (val) {
            this.toggleAttribute('extends', val);
        }

        render () {
            if (!this.extends) {
                return;
            }
            [...this.labels].forEach(label => {
                label.classList[this.checked ? 'add' : 'remove']('active');
                label.classList[this.disabled ? 'add' : 'remove']('disabled');
                label.setAttribute('role', 'button');
            });
        }

        attributeChangedCallback () {
            this.render();
        }

        constructor () {
            super();

            // 事件处理
            this.addEventListener('change', () => {
                this.render();
            });

            this.render();

            const propChecked = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
            Object.defineProperty(UiCheckbox.prototype, 'checked', {
                ...propChecked,
                set (value) {
                    // 赋值
                    propChecked.set.call(this, value);
                    // 触发渲染
                    this.render();
                }
            });
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-checkbox'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-checkbox')) {
        customElements.define('ui-checkbox', UiCheckbox, {
            extends: 'input'
        });
    }





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

        
        getAmpmData () {
            const strEmpty = '<ui-scroll-snap-item></ui-scroll-snap-item>';

            let hour = this[SELECTED][0];

            let indexMatch = 1;
            if (hour * 1 < 12) {
                indexMatch = 0;
            }

            return strEmpty + `<ui-scroll-snap-item${indexMatch === 0 ? ' selected' : ''}>上午</ui-scroll-snap-item><ui-scroll-snap-item${indexMatch === 1 ? ' selected' : ''}>下午</ui-scroll-snap-item>` + strEmpty;
        }
        
        date () {
            this.month();

            this.day();

            return this;
        }

        
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

        
        show () {
            // 触发自定义事件 - show
            this.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-datetime'
                }
            }));

            return this;
        }

        
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


const Dialog = (() => {

    // 类名前缀
    const DIALOG = 'dialog';

    // 处理类名
    const CL = {
        add: (...arg) => `ui-${DIALOG}-${arg.join('-')}`,
        toString: (value) => `ui-${value || DIALOG}`
    };

    
    class Component {
        constructor (options = {}) {
            // 最终参数
            const objParams = {
                title: '',
                // 不同类别的内容类型
                content: '',
                // 弹框的宽度
                width: 'auto',
                // 弹框高度
                height: 'auto',
                // 不同类别的默认按钮
                buttons: [],
                // 弹框显示、隐藏、移除的回调
                onShow: function () {
                },
                onHide: function () {
                },
                onRemove: function () {
                },
                ...options
            };

            if (objParams.buttons.length && typeof objParams.close == 'undefined') {
                objParams.close = false;
            }

            // 各个元素创建
            // 容器-含半透明遮罩背景
            const dialog = document.createElement(DIALOG);
            dialog.setAttribute('is', 'ui-dialog');

            // MutationObserver是一个异步的过程，因此
            // 元素样式的设置在'DOMContentLoaded'事件之后完成
            dialog.addEventListener('DOMContentLoaded', () => {
                // 务必有传参
                // 否则不会对初始元素进行处理
                if (JSON.stringify(options) != '"{}"') {
                    // 改变参数，会自动触发DOM元素内容的变化
                    dialog.setParams({
                        title: objParams.title,
                        width: objParams.width,
                        height: objParams.height,
                        content: objParams.content,
                        buttons: objParams.buttons,
                        close: objParams.close
                    });

                    // 回调处理
                    if (typeof options.onShow == 'function') {
                        dialog.addEventListener('show', function (event) {
                            options.onShow.call(dialog, event);
                        });
                    }
                    if (typeof options.onHide == 'function') {
                        dialog.addEventListener('hide', function (event) {
                            options.onHide.call(dialog, event);
                        });
                    }
                    if (typeof options.onRemove == 'function') {
                        dialog.addEventListener('remove', function (event) {
                            options.onRemove.call(dialog, event);
                        });
                    }
                }

                // 显示
                dialog.show();
            });

            // 插入的细节
            // 1. 插在所有dialog的前面
            // 2. 如果没有，则放在页面后面
            const eleExistDialog = document.querySelector('body > ' +  DIALOG);

            if (eleExistDialog) {
                eleExistDialog.insertAdjacentElement('beforebegin', dialog);
            } else {
                document.body.appendChild(dialog);
            }

            // 注册当前<dialog>元素
            // 为了可以立即使用alert()、confirm()方法，
            // 在这里提前注册了
            funDialogRegist(dialog);

            return dialog;
        }
    }

    // 对不支持<dialog>元素的浏览器进行polyfill
    // 仅polyfill部分主要功能
    let DialogPolyfill = function (dialog) {
        this.element = {
            dialog: dialog
        };
        // aria支持
        if (!dialog.hasAttribute('role')) {
            dialog.setAttribute('role', 'dialog');
        }
        // 内置方法
        dialog.show = this.show.bind(this);
        dialog.showModal = this.showModal.bind(this);
        dialog.close = this.close.bind(this);
        // 自定义方法
        dialog.zIndex = this.zIndex.bind(this);

        Object.defineProperty(dialog, 'open', {
            set: this.setOpen.bind(this),
            get: dialog.hasAttribute.bind(dialog, 'open')
        });
    };

    DialogPolyfill.prototype = {
        get dialog () {
            return this.element.dialog;
        },
        show () {
            this.setOpen(true);
            // 层级最高
            this.zIndex();
        },
        showModal () {
            this.setOpen(true);
        },
        close () {
            this.setOpen(false);
            // 原生<dialog>就有close事件
            this.dialog.dispatchEvent(new CustomEvent('close', {
                bubbles: false,
                cancelable: false
            }));
        },
        setOpen (value) {
            if (value) {
                this.dialog.setAttribute('open', '');
            } else {
                this.dialog.removeAttribute('open');
            }
        },

        
        zIndex () {
            var dialog = this.dialog;
            // 返回eleTarget才是的样式计算对象
            const objStyleTarget = window.getComputedStyle(dialog);
            // 此时元素的层级
            const numZIndexTarget = objStyleTarget.zIndex;
            // 用来对比的层级，也是最小层级
            let numZIndexNew = 19;

            // 只对<body>子元素进行层级最大化计算处理
            document.body.childNodes.forEach(function (eleChild) {
                if (eleChild.nodeType !== 1) {
                    return;
                }

                const objStyleChild = window.getComputedStyle(eleChild);

                const numZIndexChild = objStyleChild.zIndex * 1;

                if (numZIndexChild && (dialog !== eleChild && objStyleChild.display !== 'none')) {
                    numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
                }
            });

            if (numZIndexNew !== numZIndexTarget) {
                dialog.style.zIndex = numZIndexNew;
            }
        }
    };

    // 对弹框元素进行方法注册
    let funDialogRegist = function (dialog) {
        if (dialog.hide && dialog.button) {
            // 已经注册过
            return;
        }
        if ('open' in document.createElement('dialog') == false) {
            new DialogPolyfill(dialog);
        }

        // 自定义的方法支持
        // 全新的remove和show方法
        // 新增hide, alert, confirm等方法
        if (dialog.getAttribute('is') == 'ui-dialog') {
            Object.defineProperties(dialog, {
                setParams: {
                    value: function (options) {
                        Object.assign(this.params, options || {});

                        return this.params;
                    }
                },

                
                button: {
                    value: function () {
                        const objParams = this.params;
                        const objElement = this.element;

                        // 清除之前的按钮内容和数据
                        objElement.footer.innerHTML = '';
                        // 元素数据清除
                        for (const keyElement in objElement) {
                            if (/^button/.test(keyElement)) {
                                delete objElement[keyElement];
                            }
                        }

                        // 是否单按钮
                        const isOnlyButton = (objParams.buttons.length === 1);

                        // 按钮默认的文字填充
                        let arrDefultFill = ['取消', '确定'];
                        let indexMainButton = 1;
                        // 根据 events 参数，确定哪个是确定
                        if (objParams.buttons.length === 2 && objParams.buttons[0].events && !objParams.buttons[1].events) {
                            arrDefultFill = arrDefultFill.reverse();
                            indexMainButton = 0;
                        }

                        // 按钮元素创建
                        objParams.buttons.forEach(function (objButton, numIndex) {
                            // objButton可能是null等
                            objButton = objButton || {};

                            // 按钮类型和值的处理
                            let strType = objButton.type;
                            let strValue = objButton.value;

                            if (!strType && (isOnlyButton || numIndex === indexMainButton)) {
                                strType = 'primary';
                            }

                            if (!strValue) {
                                if (isOnlyButton) {
                                    strValue = '确定';
                                } else {
                                    strValue = arrDefultFill[numIndex];
                                }                                
                            }

                            // 表单特性的支持
                            let eleButton = document.createElement('button');
                            if (objButton['for']) {
                                eleButton = document.createElement('label');
                                eleButton.setAttribute('for', objButton['for']);
                            } else if (objButton.form) {
                                eleButton.setAttribute('form', objButton.form);
                                if (strType == 'reset') {
                                    eleButton.type = strType;
                                } else {
                                    eleButton.type = 'submit';
                                }
                            }
                            // 自定义的类名
                            if (objButton.className) {
                                eleButton.className = objButton.className;
                            }
                            // 按钮样式
                            eleButton.setAttribute('is', 'ui-button');
                            // 无底色无线框按钮
                            eleButton.setAttribute('blank', '')

                            if (strType) {
                                let strAttrType = eleButton.hasAttribute('form') ? 'data-type' : 'type';
                                eleButton.setAttribute(strAttrType, strType);
                            }
                            // 按钮是否禁用
                            eleButton.disabled = Boolean(objButton.disabled);
                            // 按钮内容
                            eleButton.innerHTML = strValue;

                            // 插入分隔线
                            if (numIndex) {
                                let eleHr = document.createElement('hr');
                                eleHr.setAttribute('v', '');
                                objElement.footer.append(eleHr);
                            }

                            // 放在底部元素中
                            objElement.footer.appendChild(eleButton);

                            // 对外暴露
                            objElement['button' + numIndex] = eleButton;
                        });

                        // 按钮事件
                        // 底部确定取消按钮
                        objParams.buttons.forEach((objButton, numIndex) => {
                            // objButton可能是null等
                            objButton = objButton || {};

                            const eleButton = objElement['button' + numIndex];

                            if (!eleButton || objButton['for'] || objButton.form) {
                                return;
                            }

                            let objEvents = objButton.events || {
                                click: () => {
                                    this[this.closeMode]();
                                }
                            };

                            if (typeof objEvents === 'function') {
                                objEvents = {
                                    click: objEvents
                                };
                            }

                            for (const strEventType in objEvents) {
                                eleButton.addEventListener(strEventType, (event) => {
                                    // 把实例对象传入
                                    event.dialog = this;
                                    // 事件执行
                                    objEvents[strEventType](event);
                                });
                            }
                        });

                        // 和关闭按钮的关系
                        if (objElement.close && typeof objParams.close == 'undefined') {
                            objElement.close.style.display = objParams.buttons.length ? 'none' : '';
                        }

                        return this;
                    }
                },

                
                events: {
                    value: function () {
                        const objElement = this.element;

                        this.addEventListener('animationend', function (event) {
                            if (event.target.tagName.toLowerCase() === DIALOG) {
                                this.classList.remove(CL.add('animation'));
                            }
                        });

                        // 关闭弹框按钮
                        const eleClose = objElement.close;
                        if (eleClose) {
                            eleClose.addEventListener('click', () => {
                                // 关闭弹框
                                this[this.closeMode]();
                            });
                        }

                        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

                        return this;
                    }
                },

                
                alert: {
                    value: function (content, options) {
                        if (!content) {
                            return;
                        }

                        let strContent = content;

                        // alert框的默认参数
                        const defaults = {
                            title: '',
                            // 类型, 'remind', 'success', 'warning', danger', 或者任意 'custom'
                            type: 'remind',
                            buttons: [{}],
                            close: false
                        };
                        // 最终参数
                        const objParams = {
                            ...defaults,
                            ...options
                        };

                        if (objParams.type === 'fail') {
                            objParams.type = 'danger';
                        }

                        if (objParams.buttons.length) {
                            if (!objParams.buttons[0].type) {
                                objParams.buttons[0].type = objParams.type;
                                // 如果是自定义类型，则使用'primary'作为按钮类型
                                if (/^(?:remind|primary|success|safe|warn|warning|danger|error)$/.test(objParams.type) === false) {
                                    objParams.buttons[0].type = defaults.type;
                                }
                            }
                            if (!objParams.buttons[0].value) {
                                objParams.buttons[0].value = '确定';
                            }
                            
                        }

                        let nodes = new DOMParser().parseFromString(strContent, 'text/html').body.childNodes;

                        if (nodes.length == 1) {
                            // 如果是纯文本
                            if (nodes[0].nodeType === 3) {
                                strContent = '<p class="' + CL.add('wrap') + '">' + strContent + '</p>';
                            }
                        } else {
                            strContent = '<div class="' + CL.add('wrap') + '">' + strContent + '</div>';
                        }

                        // 主体内容更新
                        strContent = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('alert') + '">' + strContent + '</div>';

                        this.setParams({
                            width: 'auto',
                            title: objParams.title,
                            buttons: objParams.buttons,
                            content: strContent
                        });

                        this.type = 'alert';

                        this.show();

                        return this;
                    }
                },

                
                confirm: {
                    value: function (content, options) {
                        if (!content) {
                            return;
                        }

                        let strContent = content;

                        // confirm框的默认参数
                        const defaults = {
                            title: '',
                            type: 'danger',
                            buttons: [{}, {}],
                            close: false
                        };

                        // 最终参数
                        const objParams = {
                            ...defaults,
                            ...options
                        };

                        if (objParams.type === 'error' || objParams.type === 'fail') {
                            objParams.type = 'danger';
                        }
                        if (objParams.type === 'primary') {
                            objParams.type = 'remind';
                        }

                        // danger 类型的按钮可缺省
                        // events 所在的按钮作为确认按钮
                        if (objParams.buttons.length === 2) {
                            if (objParams.buttons[0].events && !objParams.buttons[1].events) {
                                // 参数两个对象调换顺序
                                objParams.buttons = objParams.buttons.reverse();
                            }

                            if (!objParams.buttons[1].type) {
                                objParams.buttons[1].type = objParams.type;
                                // 如果是自定义类型，则使用'danger'作为按钮类型
                                if (/^(?:remind|primary|success|safe|warn|warning|danger|error)$/.test(objParams.type) === false) {
                                    objParams.buttons[1].type = defaults.type;
                                }
                            }   
                        }

                        let nodes = new DOMParser().parseFromString(strContent, 'text/html').body.childNodes;

                        if (nodes.length == 1) {
                            // 如果是纯文本
                            if (nodes[0].nodeType === Node.TEXT_NODE) {
                                strContent = '<p class="' + CL.add('wrap') + '">' + strContent + '</p>';
                            }
                        } else {
                            strContent = '<div class="' + CL.add('wrap') + '">' + strContent + '</div>';
                        }

                        // 主体内容设置
                        strContent = '<div class="' + CL.add(objParams.type) + ' ' + CL.add('confirm') + '">' + strContent + '</div>';

                        // 参数对外
                        this.setParams({
                            width: 'auto',
                            title: objParams.title,
                            buttons: objParams.buttons,
                            content: strContent
                        });

                        this.type = 'confirm';

                        this.show();

                        return this;
                    }
                },

                
                loading: {
                    value: function () {
                        const objElement = this.element;
                        const eleDialog = objElement.dialog;

                        this.params.content = '<ui-loading rows="10" size="3"></ui-loading>';
                        // 显示loading样式
                        eleDialog.classList.add(CL.add('loading'));
                        // 点击隐藏，防止假死
                        // 10s 过期时间
                        setTimeout(() => {
                            if (/loading/.test(eleDialog.className)) {
                                eleDialog.addEventListener('click', () => {
                                    if (/loading/.test(eleDialog.className)) {
                                        this.remove();
                                    }
                                });
                            }                            
                        }, 10000);

                        this.show();

                        return this;
                    }
                },

                
                content: {
                    get () {
                        return this.params.content;
                    },
                    set (content) {
                        // 让直接设置content时候可以和params.content数据保持一致
                        if (content != this.params.content) {
                            this.params.content = content;
                            return;
                        }

                        let eleBody = this.element.body;
                        let eleDialog = this.element.dialog;
                        // 去除可能的loading类名
                        eleDialog.classList.remove(CL.add('loading'));
                        // content可以是函数
                        if (typeof content == 'function') {
                            content = content();
                        } else if (typeof content == 'string' && /^#?\w+(?:[-_]\w+)*$/i.test(content)) {
                            // 如果是字符串
                            // 如果是选择器，仅支持ID选择器
                            let eleMatch = document.querySelector(content);
                            if (eleMatch) {
                                if (eleMatch.matches('textarea')) {
                                    content = eleMatch.value;
                                } else if (eleMatch.matches('script')) {
                                    content = eleMatch.innerHTML;
                                } else {
                                    content = eleMatch;
                                }
                            }
                        }

                        // 基于内容的数据类型，使用不同的默认的弹框关闭方式
                        this.closeMode = typeof content == 'string' ? 'remove' : 'hide';

                        // 是隐藏模式，则eleBody里面的内容保护出来
                        // 主要是使用content语法替换内容时候用到，这段代码一般不会执行到
                        if (this.closeMode == 'hide' && eleBody.innerHTML) {
                            let eleProtect = document.createElement('div');
                            eleProtect.setAttribute('hidden', '');
                            // 遍历并转移
                            eleBody.childNodes.forEach(node => {
                                eleProtect.appendChild(node);
                            });
                            // 保护到页面中
                            document.body.appendChild(eleProtect);
                        }

                        // 清空主内容区域的内容
                        eleBody.innerHTML = '';

                        if (this.closeMode == 'remove') {
                            eleBody.innerHTML = content;
                        } else {
                            let eleContentParent = content.parentElement;
                            let isParentHidden = eleContentParent && eleContentParent.matches('div[hidden]');
                            // 弹框中显示
                            eleBody.appendChild(content);
                            // 如果原父级是隐藏div，该div删除
                            if (isParentHidden && eleContentParent.innerHTML.trim() === '') {
                                eleContentParent.remove();
                            }
                            // 如果content是隐藏的则显示
                            if (content.nodeType === 1 && getComputedStyle(content).display == 'none') {
                                content.removeAttribute('hidden');
                                content.style.display = '';
                                // 如果此时元素的display状态还是none，则设置为浏览器初始display值
                                if (getComputedStyle(content).display == 'none') {
                                    content.style.display = 'revert';
                                }
                            }
                        }
                    }
                },

                
                scrollbar: {
                    value: function () {
                        const eleAllDialog = document.querySelectorAll('dialog[is="ui-dialog"]');

                        // 是否有显示的弹框
                        const isDisplayed = [].slice.call(eleAllDialog).some(function (eleDialog) {
                            return window.getComputedStyle(eleDialog).display !== 'none';
                        });

                        document.documentElement.style.overflow = '';
                        document.body.style.borderRight = '';

                        let widthScrollbar = window.innerWidth - document.documentElement.clientWidth;

                        // 因为去掉了滚动条，所以宽度需要偏移，保证页面内容没有晃动
                        if (isDisplayed) {
                            // 所有PC浏览器都滚动锁定
                            document.documentElement.style.overflow = 'hidden';
                            document.body.style.borderRight = widthScrollbar + 'px solid transparent';
                        }

                        return this;
                    }
                },

                
                tabindex: {
                    value: function () {
                        var eleDialog = this.element.dialog;
                        var eleLastActiveElement = this.lastActiveElement;

                        if (this.open == true) {
                            var eleActiveElement = document.activeElement;
                            if (this.type == 'alert' || this.type == 'confirm') {
                                if (this.element.button0 != eleActiveElement) {
                                    this.lastActiveElement = eleActiveElement;
                                }
                                this.element.button0.focus();
                            } else if (eleDialog) {
                                if (eleDialog != eleActiveElement) {
                                    this.lastActiveElement = eleActiveElement;
                                }
                                // 键盘索引起始位置变为在弹框元素上
                                eleDialog.focus();
                            }
                        } else if (eleLastActiveElement && eleLastActiveElement.tagName.toLowerCase() != 'body') {
                            // 键盘焦点元素还原
                            eleLastActiveElement.focus();
                            eleLastActiveElement.blur();
                            this.lastActiveElement = null;
                        }

                        return this;
                    }
                },

                
                show: {
                    value: function () {
                        if (this.open !== true) {
                            this.classList.add(CL.add('animation'));
                        }

                        // 弹框显示
                        this.open = true;

                        // 面板显示
                        if (this.zIndex) {
                            this.zIndex();
                        }

                        if (this.element.close && typeof this.params.close != 'undefined') {
                            this.element.close.style.display = this.params.close ? '' : 'none';
                        }

                        this.dispatchEvent(new CustomEvent('show', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                },

                
                hide: {
                    value: function () {
                        this.close();

                        this.dispatchEvent(new CustomEvent('hide', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                },

                
                remove: {
                    value: function () {
                        this.open = false;

                        this.parentElement.removeChild(this);

                        this.dispatchEvent(new CustomEvent('remove', {
                            detail: {
                                type: 'ui-dialog'
                            }
                        }));

                        return this;
                    }
                }
            });

            // 暴露的参数
            // 并观察参数变化
            dialog.params = new Proxy(dialog.params || {}, {
                get (target, prop) {
                    return target[prop];
                },
                set (target, prop, value) {
                    if (!dialog.element) {
                        return false;
                    }
                    // 赋值
                    target[prop] = value;

                    // 拦截
                    if (prop == 'title' && dialog.element.title) {
                        dialog.element.title.innerHTML = value;
                    } else if (prop == 'content') {
                        dialog.content = value;
                    } else if (prop == 'buttons') {
                        dialog.button();
                    } else if (dialog.element.dialog && (prop == 'width' || prop == 'height')) {
                        let eleDialog = dialog.element.dialog;
                        eleDialog.classList.remove(CL.add('stretch'));
                        // 纯数值认为是px长度
                        if (value !== '' && Number(value) == value) {
                            eleDialog.style[prop] = value + 'px';
                        } else if (prop == 'height' && value == 'stretch') {
                            eleDialog.classList.add(CL.add(value));
                        } else {
                            if (value == 'auto') {
                                value = '';
                            }
                            eleDialog.style[prop] = value;
                        }
                    }

                    return true;
                }
            });

            // 弹框主要元素的创建
            // 1. 主体
            const eleDialog = document.createElement('div');
            eleDialog.classList.add(CL);
            // 使该元素也可以被focus
            eleDialog.setAttribute('tabindex', '-1');

            // 2. 标题
            const eleTitle = document.createElement('h4');
            eleTitle.classList.add(CL.add('title'));
            eleTitle.innerHTML = dialog.title;
            dialog.removeAttribute('title');

            // 3. 关闭按钮
            // 关闭按钮元素创建
            const eleClose = document.createElement('button');
            eleClose.textContent = '关闭';
            eleClose.classList.add(CL.add('close'));

            // 4. 主体内容元素
            const eleBody = document.createElement('div');
            eleBody.classList.add(CL.add('body'));

            // 5. 底部元素
            const eleFooter = document.createElement('div');
            eleFooter.classList.add(CL.add('footer'));

            // 暴露元素
            dialog.element = Object.assign(dialog.element || {}, {
                dialog: eleDialog,
                close: eleClose,
                title: eleTitle,
                body: eleBody,
                footer: eleFooter
            });

            // 下面是主体元素的创建
            // 如果默认弹框里面就有内容
            // 则内容认为是主体内容，记录下来
            let nodesOriginDialog = [...dialog.childNodes];

            // 原始节点放在eleBody主体内容元素中
            if (nodesOriginDialog.length) {
                nodesOriginDialog.forEach(node => {
                    eleBody.append(node);
                });
            }

            // 元素插入
            // 组装
            eleDialog.append(eleClose, eleTitle, eleBody, eleFooter);
            dialog.append(eleDialog);

            // 观察open属性变化
            var moDialogOpen = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(mutation => {
                    let eleDialog = mutation.target;
                    if (mutation.type == 'attributes') {
                        // 滚动条状态变化
                        eleDialog.scrollbar();
                        // 焦点变化
                        eleDialog.tabindex();
                    }
                });
            });
            moDialogOpen.observe(dialog, {
                attributes: true,
                attributeFilter: ['open']
            });

            // 默认模式是关闭
            dialog.closeMode = 'hide';
            // 事件
            dialog.events();
        }

        // 回调
        dialog.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-dialog'
            }
        }));

        // 设置定义完毕标志量
        dialog.setAttribute('defined', '');

        dialog.isConnectedCallback = true;
    };

    // 弹框观察并注册
    let funDialogInitAndWatching = function () {
        const elesDialog = document.querySelectorAll('dialog');
        elesDialog.forEach(item => {
            funDialogRegist(item);
        });
        // 观察Dialog元素载入页面
        var observerTips = new MutationObserver(function (mutationsList) {
            // 此时不检测DOM变化
            mutationsList.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (eleAdd) {
                    if (eleAdd.matches && eleAdd.matches('dialog')) {
                        funDialogRegist(eleAdd);
                    } else if (eleAdd.querySelector) {
                        eleAdd.querySelectorAll('dialog').forEach(item => {
                            funDialogRegist(item);
                        });
                    }
                });
            });
        });

        observerTips.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // 如果浏览器不支持<dialog>，则对出现在页面上的<dialog>元素进行注册
    if (document.readyState != 'loading') {
        funDialogInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funDialogInitAndWatching);
    }

    return Component;
})();


// 为了直接使用
window.Dialog = Dialog;

// 可以 import



class Drop extends HTMLElement {

    static get observedAttributes () {
        return ['open', 'target'];
    }

    static get defaults () {
        return {
            eventtype: 'click',
            position: '7-5'
        };
    }

    
    constructor (eleTrigger, eleTarget, options) {
        super();

        // 参数的处理
        options = options || {};
        this.params = this.params || {};
        // 观察参数变化
        this.params = new Proxy(this.params, {
            get: (params, prop) => {
                if (!prop) {
                    return;
                }
                prop = prop.toLowerCase();

                let value = params[prop];
                let eleTrigger = this.element.trigger;

                if (typeof value == 'undefined') {
                    value = eleTrigger.getAttribute(prop) || eleTrigger.dataset[prop];

                    if (prop == 'width') {
                        if (eleTrigger !== this) {
                            value = eleTrigger.dataset[prop];
                        } else {
                            value = eleTrigger.getAttribute(prop);
                        }
                    }

                    // 部分参数如果没有，则使用默认的参数值
                    if (typeof value == 'undefined' && Drop.defaults[prop]) {
                        value = Drop.defaults[prop];
                    }
                }

                return value;
            },
            set: (params, prop, value) => {
                params[prop.toLowerCase()] = value;
                return true;
            }
        });

        let objElement = this.element || {};

        // trigger和target元素的设置与获取
        this.element = new Proxy(objElement, {
            get: (target, prop) => {
                if (prop == 'target') {
                    let strIdTarget = this.getAttribute('target');
                    let eleTarget = target[prop];
                    if (!eleTarget && strIdTarget) {
                        eleTarget = document.getElementById(strIdTarget);
                    }
                    return eleTarget;
                }

                if (prop == 'trigger') {
                    return target[prop] || this;
                }

                return target[prop];
            },
            set: (target, prop, value) => {
                if (typeof value == 'string') {
                    value = document.getElementById(value) || document.querySelector(value);
                }
                // 只有当value是节点元素时候才赋值
                if (value && typeof value.nodeType != 'number') {
                    return false;
                }

                // 元素赋值
                target[prop] = value;

                // target元素设置时候同时需要赋值
                if (prop == 'target' && value) {
                    let eleTarget = value;
                    let strId = eleTarget.id;
                    if (!strId) {
                        strId = ('lulu_' + Math.random()).replace('0.', '');
                        eleTarget.id = strId;
                    }

                    let eleTrigger = this.element.trigger;

                    // 如果用户直接使用this.element.target赋值，则需要同步target属性值
                    if (eleTrigger == this) {
                        // 此if判断可以避免死循环
                        if (this.target != strId) {
                            this.target = strId;
                        }
                    } else if (eleTrigger) {
                        let strAttrTarget = eleTrigger.dataset.target;
                        if (strAttrTarget && document.querySelector('datalist[id="' + strAttrTarget + '"]')) {
                            // 如果匹配的是<datalist>元素
                            eleTrigger.setAttribute('data-target2', strId);
                        } else {
                            eleTrigger.setAttribute('data-target', strId);
                        }
                    }
                }

                return true;
            }
        });

        // 开始参数设置
        // eleTrigger, eleTarget, options均可缺省
        [...arguments].forEach(function (argument) {
            if (typeof argument == 'object' && argument && !argument.tagName) {
                options = argument;
            }
        });

        if (eleTrigger) {
            this.element.trigger = eleTrigger;
        }

        // 此时的eleTrigger一定是元素，之前可能是选择器
        eleTrigger = this.element.trigger;
        // target的处理
        if (eleTrigger) {
            // target元素
            if (eleTarget && eleTarget !== options) {
                this.element.target = eleTarget;
            } else if (!eleTarget && eleTrigger.dataset && eleTrigger.dataset.target) {
                this.element.target = eleTrigger.dataset.target;
            }
        }

        // 参数设置
        this.setParams(options);

        // 如果默认open为true，则显示
        if (this.open) {
            if (document.readyState != 'loading') {
                this.show();
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    this.show();
                });
            }
        }

        if (eleTrigger !== this) {
            // 隐藏<ui-drop>元素细节
            this.addEventListener('connected', function () {
                this.remove();
            });

            eleTrigger['ui-drop'] = this;

            document.body.append(this);
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (v) {
        // 设置属性
        this.setAttribute('for', v);
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get open () {
        return this.hasAttribute('open');
    }
    set open (value) {
        this.toggleAttribute('open', value);
    }

    // 设置参数方法
    setParams (options) {
        options = options || {};
        // 显示与隐藏的回调
        let funCallShow = options.onShow;
        let funCallHide = options.onHide;
        if (typeof funCallShow == 'function') {
            this.addEventListener('show', function (event) {
                funCallShow.call(this, event);
            });

            delete options.onShow;
        }
        if (typeof funCallHide == 'function') {
            this.addEventListener('hide', function (event) {
                funCallHide.call(this, event);
            });

            delete options.onHide;
        }
        // 参数合并
        Object.assign(this.params, options || {});
    }

    
    events (isIgnoreTarget) {
        // 元素
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 如果没有target 并且不是无视没有target，返回
        if (!eleTarget && !isIgnoreTarget) {
            return;
        }

        if (eleTarget && eleTarget.matches('datalist')) {
            return;
        }

        // 参数
        const objParams = this.params;

        // 获取匹配选择器的eleTrigger子元素
        const funGetClosestChild = (element) => {
            if (!objParams.selector) {
                return null;
            }

            const eleClosestSelector = element.closest(objParams.selector);
            if (eleTrigger.contains(eleClosestSelector) == false) {
                return null;
            }

            return eleClosestSelector;
        };

        // 根据不同事件类型进行逻辑处理
        switch (objParams.eventType) {
            // 默认值，直接显示
            case 'null': {
                break;
            }

            // 点击或者右键
            case 'click': {
                if (!eleTrigger.isBindDropEvents || eleTrigger.isBindDropEvents !== objParams.eventType) {
                    eleTrigger.addEventListener(objParams.eventType, event => {
                        event.preventDefault();
                        // aria支持
                        // 获得委托的选择器匹配元素
                        const eleClosestSelector = funGetClosestChild(event.target);

                        if (eleClosestSelector) {
                            // 改变trigger元素
                            this.element.trigger = eleClosestSelector;
                        }

                        // 点击即显示
                        if (!objParams.selector || eleClosestSelector) {
                            // 连续右键点击保持显示，非显隐切换
                            if (objParams.eventType == 'contextmenu') {
                                objParams.position = [event.pageX, event.pageY];
                                this.show();

                                return;
                            }

                            if (!this.open) {
                                this.show();
                            } else {
                                this.hide();
                            }
                        }
                    });
                }

                break;
            }

            default: {
                break;
            }
        }

        // 点击页面空白区域隐藏
        if (objParams.eventType != 'null' && !eleTrigger.isBindDocMouseUp) {
            document.addEventListener('mouseup', event => {
                let eleClicked = event && event.target;

                if (!eleClicked || !this.open) {
                    return;
                }

                // 因为trigger和target可能动态变化
                // 因此这里再次获取一遍
                let eleTrigger = this.element.trigger;
                let eleTarget = this.element.target;

                if (eleTrigger.contains(eleClicked) == false && (!eleTarget || eleTarget.contains(eleClicked) == false)) {
                    this.hide();
                }
            });

            eleTrigger.isBindDocMouseUp = true;
        }

        eleTrigger.isBindDropEvents = objParams.eventType || true;

        // 窗体尺寸改变生活的重定位
        window.addEventListener('resize', () => {
            this.position();
        });

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    
    position () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 下拉必须是显示状态才执行定位处理
        if (this.open && eleTarget && window.getComputedStyle(eleTrigger).display != 'none') {
            eleTrigger.follow(eleTarget, {
                offsets: this.params.offsets,
                position: this.params.position,
                edgeAdjust: this.params.edgeAdjust
            });
        }

        return this;
    }

    
    show () {
        // target需要在页面中
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 如果target在内存中，append到页面上
        if (eleTarget && document.body.contains(eleTarget) == false) {
            document.body.appendChild(eleTarget);
        }

        if (eleTarget) {
            // 进行定位
            eleTarget.style.position = 'absolute';
            eleTarget.style.display = 'inline';
            eleTarget.style.outline = 'none';
            // 焦点转移
            eleTarget.tabIndex = -1;
            // 焦点转移到浮层元素上
            eleTarget.focus({
                preventScroll: true
            });

            // 标记target此时对应的trigger元素
            eleTarget.element = eleTarget.element || {};
            eleTarget.element.trigger = this;
        }
        // aria
        eleTrigger.setAttribute('aria-expanded', 'true');

        // 改变显示标志量
        if (!this.open) {
            this.open = true;
        }

        // 定位
        this.position();

        // 触发自定义事件 - show
        this.dispatchEvent(new CustomEvent('show'));

        // 如果trigger元素非<ui-drop>元素，则也触发一下，同时传递show事件来源
        // 因为一个普通的HTML元素可能会LuLu ui不同的组件触发'show'事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }

    
    hide () {
        let eleTrigger = this.element.trigger;
        let eleTarget = this.element.target;

        // 隐藏下拉面板
        if (eleTarget) {
            eleTarget.style.display = 'none';
            eleTarget.classList.remove('ESC');
            // 取消target元素上的trigger关联
            // 因为一个target元素可以关联多个trigger
            if (eleTarget.element) {
                delete eleTarget.element.trigger;
            }
        }

        // aria
        eleTrigger.setAttribute('aria-expanded', 'false');

        if (window.isKeyEvent) {
            eleTrigger.focus();
        }

        // 更改显示标志量
        if (this.open) {
            this.open = false;
        }

        // 触发自定义事件 - hide
        this.dispatchEvent(new CustomEvent('hide'));

        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('hide', {
                detail: {
                    type: 'ui-drop'
                }
            }));
        }

        return this;
    }

    
    connectedCallback () {
        let eleTarget = this.element.target;
        let eleTrigger = this.element.trigger;

        // 默认的aria状态设置
        if (eleTrigger.open) {
            eleTrigger.setAttribute('aria-expanded', 'true');
        } else {
            eleTrigger.setAttribute('aria-expanded', 'false');
        }

        // 页面中的<ui-drop>元素如果没有target
        // 强制绑定事件，这样<ui-drop>元素可以实现open切换效果
        if (!eleTarget) {
            this.events(eleTrigger === this);
        } else if (eleTarget.matches('datalist')) {
            setTimeout(() => {
                if (this.list) {
                    this.list(eleTarget);
                }
            }, 1);            
        } else {
            this.events();
        }

        // 无障碍访问设置
        if (!this.querySelector('a, button') && !this.closest('a, button')) {
            this.tabIndex = 0;
            this.role = 'button';
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-drop'
            }
        }));

        if (eleTrigger != this && eleTrigger.hasAttribute('is-drop')) {
            eleTrigger.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-drop'
                }
            }));

            // 设置定义完毕标志量
            eleTrigger.setAttribute('defined', '');
        }

        this.isConnectedCallback = true;
    }

    // open属性变化的时候
    attributeChangedCallback (name, oldValue, newValue) {
        if (name == 'target') {
            let eleTarget = document.getElementById(newValue);
            if (eleTarget) {
                this.element.target = eleTarget;
            }
        } else if (name == 'open') {
            let strAriaExpanded = this.element.trigger.getAttribute('aria-expanded');
            if (this.open && strAriaExpanded == 'false') {
                this.show();
            } else if (!this.open && strAriaExpanded == 'true') {
                this.hide();
            }
        }
    }
}

window.Drop = Drop;

if (!customElements.get('ui-drop')) {
    customElements.define('ui-drop', Drop);
}

// 给 HTML 元素扩展 drop 方法
HTMLElement.prototype.drop = function (eleTarget, options) {
    if (!this.matches('ui-drop, [is-drop]') && !this['ui-drop']) {
        this['ui-drop'] = new Drop(this, eleTarget, options);
    }

    return this;
};


const initAllIsDropAttrAction = (ele) => {
    const eleDrops = ele || document.querySelectorAll('[is-drop]');
    eleDrops.forEach(eleTrigger => {
        let eleTargetId = eleTrigger.getAttribute('is-drop');
        if (eleTargetId && !eleTrigger.dataset.target) {
            eleTrigger.dataset.target = eleTargetId;
        }
        // 基于data-target获取元素
        eleTargetId = eleTrigger.dataset.target;
        let eleTarget = eleTargetId && document.getElementById(eleTargetId);
        if (eleTarget) {
            eleTrigger['ui-drop'] = new Drop(eleTrigger, eleTarget);
        }
    });
};


const autoInitAndWatchingIsDropAttr = () => {
    // 先实例化已有is-drop属性的DOM节点，再监听后续的节点变化
    initAllIsDropAttrAction();

    const observer = new MutationObserver(mutationsList => {
        mutationsList.forEach(mutation => {
            mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                if (!eleAdd.tagName) {
                    return;
                }
                if (eleAdd.hasAttribute('is-drop')) {
                    initAllIsDropAttrAction([eleAdd]);
                } else {
                    initAllIsDropAttrAction(eleAdd.querySelectorAll('[is-drop]'));
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

if (document.readyState != 'loading') {
    autoInitAndWatchingIsDropAttr();
} else {
    window.addEventListener('DOMContentLoaded', autoInitAndWatchingIsDropAttr);
}





Drop.prototype.list = function (eleTrigger, data, options) {
    // datalist 元素的 option 转为列表数据
    const funGetDataByOption = function (option) {
        let obj = {
            id: option.id || option.value,
            value: option.innerHTML || option.value,
            className: option.className,
            disabled: option.disabled,
            label: option.label,
            accessKey: option.accessKey
        };
        // disabled处理
        let eleOptgroup = option.closest('optgroup');
        if (eleOptgroup && eleOptgroup.disabled) {
            obj.disabled = true;
        }
        // href 属性处理
        if (option.hasAttribute('href')) {
            obj.href = option.getAttribute('href');
        }

        return obj;
    };
    // 基于类型进行参数判断
    [...arguments].forEach(argument => {
        const strTypeArgument = typeof argument;
        if (strTypeArgument === 'string') {
            eleTrigger = document.getElementById(argument) || document.querySelector(argument);
        } else if (strTypeArgument === 'function') {
            data = argument;
        } else if (strTypeArgument === 'object') {
            if (typeof argument.nodeType === 'number') {
                // 支持从原生的列表元素中获取数据信息
                if (argument.matches('datalist')) {
                    data = function () {
                        // 所有分组元素
                        let eleOptgroups = argument.querySelectorAll('optgroup');
                        // 如果有任意一个分组元素设置了label，那么就是标题分组
                        // 如果只是optgroup标签包括，那么使用分隔线分隔
                        let isSubTitle = !!argument.querySelector('optgroup[label]');

                        // 如果有分组
                        if (eleOptgroups.length) {
                            let arrData = [];

                            eleOptgroups.forEach(optgroup => {
                                if (isSubTitle) {
                                    arrData.push({
                                        id: '-1',
                                        value: optgroup.label,
                                        disabled: optgroup.disabled,
                                        className: optgroup.className,
                                        heading: true
                                    });
                                } else {
                                    // 分隔线
                                    arrData.push({});
                                }

                                optgroup.querySelectorAll('option').forEach(option => {
                                    arrData.push(funGetDataByOption(option));
                                });
                            });

                            return arrData;
                        }

                        return [...argument.querySelectorAll('option')].map((option, index) => {
                            let objOption = funGetDataByOption(option);
                            if (!objOption.value) {
                                return {};
                            }
                            if (!objOption.id) {
                                objOption.id = index;
                            }

                            return objOption;
                        });
                    };
                    if (eleTrigger == argument) {
                        eleTrigger = null;
                    }
                } else {
                    eleTrigger = argument;
                }
            } else if (argument.map) {
                data = argument;
            } else {
                options = argument;
            }
        }
    });

    if (eleTrigger && typeof eleTrigger.nodeType !== 'number') {
        eleTrigger = null;
    }
    eleTrigger = eleTrigger || this.element.trigger;

    // 触发元素和数据是必须项
    if (!eleTrigger) {
        return this;
    }

    if (!data) {
        data = [];
    }

    const defaults = {
        // 触发元素显示的事件，‘null’直接显示；‘hover’是hover方法；‘click’是点击显示；其他为手动显示与隐藏。
        eventType: 'click',
        offsets: {
            x: 0,
            y: 0
        },
        position: '4-1',
        selector: '',
        width: '',
        onShow: () => {},
        onHide: () => {},
        // this为当前点击的列表元素，支持两个参数，第一个参数为列表元素对应的数据(纯对象)，第二个是当前实例对象
        onSelect: () => {}
    };

    // 参数处理
    const objParams = {};
    options = options || {};

    Object.keys(defaults).forEach(prop => {
        objParams[prop] = options[prop] || this.params[prop] || defaults[prop];
    });

    // 一些常量
    const SELECTED = 'selected';
    const DISABLED = 'disabled';
    // ui类名
    // 类名变量
    // 样式类名统一处理

    const CL = {
        add: function () {
            return ['ui-droplist'].concat([].slice.call(arguments)).join('-');
        },
        toString: () => {
            return 'ui-droplist';
        }
    };

    // trigger元素赋值的方法
    let strMethod = 'innerHTML';
    if (eleTrigger.matches('input')) {
        strMethod = 'value';
    }

    // target元素创建
    let eleTarget = document.createElement('div');
    eleTarget.setAttribute('role', 'listbox');
    eleTarget.setAttribute('tabindex', '-1');

    // 宽度处理
    if (/^\d+$/.test(objParams.width)) {
        eleTarget.style.width = objParams.width + 'px';
    } else {
        eleTarget.style.width = objParams.width;
    }
    eleTarget.className = CL.add('x');

    // 存储原始参数值
    this.data = data;

    // 列表渲染需要的数组项
    let arrListData = data;

    // 索引值内容的匹配
    let funGetMatchIndex = (arr) => {
        // 初始的匹配和默认索引值获取（如果没有设置selected选项）
        // 匹配的索引值
        let strMatchIndex = '-1';
        // 是否默认包含选中项
        let isSomeItemSelected = false;

        // 遍历数据
        // 目的是获得匹配索引，和改变默认值（如果有设置selected选项）
        // 由于数据可能无限嵌套，因此走递归
        let funRecursion = (arrData, arrIndex) => {
            if (!arrData || !arrData.length) {
                return;
            }

            arrData.forEach((objData, numIndex) => {
                // 此时数组项的索引深度
                const arrCurrentIndex = arrIndex.concat(numIndex);

                // 多级数据结构
                if (objData && objData.data) {
                    funRecursion(objData.data, arrCurrentIndex);
                    return;
                }

                if (objData && objData[SELECTED] && !objData[DISABLED] && objData.value) {

                    eleTrigger[strMethod] = objData.value;

                    // 找到设置了selected的选项，并记住索引
                    strMatchIndex = arrCurrentIndex.join('-');
                }

                // 修改全局判断，这样，eleTrigger无需
                // 再根据本身内容确定默认的选中项了
                if (objData && objData[SELECTED]) {
                    isSomeItemSelected = true;
                }
            });
        };

        funRecursion(arr, []);

        // 此时trigger元素内部的内容
        const strTrigger = (eleTrigger[strMethod] || '').trim();

        // 根据eleTrigger的内容信息确定哪个数据是selected
        // 遍历数据
        if (isSomeItemSelected == false && strTrigger) {
            funRecursion = (arrData, arrIndex) => {
                if (!arrData || !arrData.length) {
                    return;
                }

                arrData.forEach((objData, numIndex) => {
                    // 此时数组项的索引深度
                    const arrCurrentIndex = arrIndex.concat(numIndex);

                    // 多级数据结构
                    if (objData && objData.data) {
                        funRecursion(objData.data, arrCurrentIndex);
                        return;
                    }
                    // 如果有匹配，设置为选中
                    if (typeof objData.value === 'string' && objData.value.trim() == strTrigger) {
                        strMatchIndex = arrCurrentIndex.join('-');

                        // 设置为选中
                        objData[SELECTED] = true;
                    }
                });
            };

            funRecursion(arr, []);
        }

        return strMatchIndex;
    };

    let strMatchIndex = -1;

    if (typeof data !== 'function' && data.length && data.map) {
        strMatchIndex = funGetMatchIndex(arrListData);
    }

    // 列表绘制渲染方法
    // 每次show的时候都执行刷新
    const funRender = (eleTarget, arrListData) => {
        if (typeof arrListData === 'function') {
            arrListData = arrListData();
            // 重新获取索引值，只有data是function类型的时候才执行
            strMatchIndex = funGetMatchIndex(arrListData);
        }

        // 没有数据时候的处理
        if (!arrListData || !arrListData.length) {
            arrListData = [{
                value: '没有数据',
                disabled: true
            }];
        } else {
            arrListData = arrListData.map(arrData => {
                if (typeof arrData == 'string' && arrData !== '-') {
                    return {
                        value: arrData
                    };
                }
                return arrData;
            });
        }

        // 是否包含选中项
        let isSomeItemSelected = arrListData.some(objData => {
            return objData && objData[SELECTED];
        });

        // 列表数据更新
        eleTarget.innerHTML = (() => {
            let strHtml = '';

            const funStep = (arrData, arrIndex) => {

                let strHtmlStep = '';

                arrData.forEach((objData, numIndex) => {
                    // 为空数据作为分隔线
                    if (objData == '-' || objData === null || JSON.stringify(objData) == '{}') {
                        strHtmlStep += '<hr class="' + CL.add('hr') + '">';
                        return;
                    }

                    // 此时数组项的索引深度
                    const arrCurrentIndex = arrIndex.concat(numIndex);

                    // 一些属性值
                    let strAttrHref = objData.href;
                    if (typeof strAttrHref != 'string') {
                        strAttrHref = 'javascript:';
                    } else if (!strAttrHref) {
                        strAttrHref = location.href.split('#')[0];
                    }

                    // target属性
                    let strAttrTarget = '';
                    if (objData.target) {
                        strAttrTarget = ' target="' + objData.target + '"';
                    }

                    // 是否包含子项
                    let strAttrSublist = '';
                    if (objData.data) {
                        strAttrSublist = ' data-sublist';
                    }

                    // label标记
                    let strAttrLabel = '';
                    if (objData.label) {
                        strAttrLabel = ' aria-label="' + objData.label + '"';
                    }

                    // accesskey快捷访问
                    let strAttrAccess = '';
                    if (objData.accessKey) {
                        strAttrAccess = ` accesskey="${objData.accessKey}"`;
                    }

                    // 如果数据不含选中项，使用存储的索引值进行匹配
                    if (isSomeItemSelected == false && strMatchIndex == arrCurrentIndex.join('-')) {
                        objData[SELECTED] = true;
                    }

                    // 类名
                    let strAttrClass = CL.add('li') + ' ' + objData.className;
                    if (objData[SELECTED]) {
                        strAttrClass = strAttrClass + ' ' + SELECTED;
                    }

                    strAttrClass = strAttrClass.trim();

                    // 如果是标题元素
                    if (objData.heading == true) {
                        if (objData.disabled) {
                            strAttrClass += ' disabled';
                        }
                        strHtmlStep += '<div class="' + strAttrClass + '"' + strAttrLabel + ' role="heading">' + objData.value + '</div>';
                        return;
                    }

                    // 禁用态和非禁用使用标签区分
                    // 如果想要支持多级，data-index值可以"1-2"这样
                    if (objData[DISABLED] != true) {
                        strHtmlStep += '<a href="' + strAttrHref + '"' + strAttrTarget + strAttrLabel + strAttrAccess + ' class="' + strAttrClass + '" data-index="' + arrCurrentIndex.join('-') + '" role="option" aria-selected="' + (objData[SELECTED] || 'false') + '" ' + strAttrSublist + '>' + objData.value + '</a>';

                        if (objData.data) {
                            strHtmlStep += '<div class="' + CL.add('xx') + '"><div class="' + CL.add('x') + '" role="listbox">' + funStep(objData.data, arrCurrentIndex) + '</div></div>';
                        }
                    } else {
                        strHtmlStep += '<span class="' + strAttrClass + '"' + strAttrLabel + strAttrAccess + '>' + objData.value + '</span>';
                    }
                });

                return strHtmlStep;
            };

            strHtml += funStep(arrListData, []);

            return strHtml;
        })();

        // 存储在DOM对象上，给回调使用
        eleTarget.listData = arrListData;
    };

    // 重新初始化 drop
    this.setParams({
        eventType: objParams.eventType,
        offsets: objParams.offsets,
        selector: objParams.selector,
        position: objParams.position,
        onShow: function () {
            funRender.call(this, eleTarget, this.data);
            objParams.onShow.apply(this, arguments);
        },
        onHide: objParams.onHide
    });

    this.element.trigger = eleTrigger;
    this.element.target = eleTarget;

    // 新的事件
    this.events();

    // 绑定事件
    eleTarget.addEventListener('click', event => {
        // IE可能是文件节点
        if (event.target.nodeType != 1 || !event.target.closest) {
            return;
        }
        // 目标点击元素
        const eleClicked = event.target.closest('a');

        // 未获取到元素返回
        if (!eleClicked) {
            return;
        }

        // 当前列表显示使用的数据
        const arrListData = eleTarget.listData;

        // 如果是多级嵌套列表，这里需要额外处理
        const strIndex = eleClicked.getAttribute('data-index');

        if (!strIndex) {
            return;
        }

        // 根据点击的元素索引获取对应的数据对象
        let objItemData = null;
        strIndex.split('-').forEach(numIndex => {
            if (objItemData === null) {
                objItemData = arrListData[numIndex];
            } else if (objItemData.data) {
                objItemData = objItemData.data[numIndex];
            } else {
                objItemData = objItemData[numIndex];
            }
        });

        // 如果这里返回，说明数据有问题
        // 或者代码逻辑有bug
        if (!objItemData) {
            return;
        }

        // 点击包含下级数据的列表
        if (typeof eleClicked.getAttribute('data-sublist') === 'string') {
            eleClicked.classList.add(SELECTED);

            // 此时显示的下级列表元素
            const eleSubTarget = eleClicked.nextElementSibling.querySelector('.' + CL.add('x'));

            if (!eleSubTarget) {
                return;
            }
            // 偏移还原
            // 否则会A/B重定位
            eleSubTarget.style.transform = '';
            eleSubTarget.classList.remove('reverse');

            // 此时偏移
            const objBounding = eleSubTarget.getBoundingClientRect();
            // 水平方向是方向变化，这里使用document.documentElement宽度判断
            // 因为window.innerWidth包括滚动条宽度，可能会导致水平滚动条出现
            // 交给CSS控制
            if (objBounding.right > document.documentElement.clientWidth) {
                eleSubTarget.classList.add('reverse');
            }

            // 垂直方向偏移
            let offsetTop = 0;

            if (objBounding.bottom > window.innerHeight) {
                offsetTop = window.innerHeight - objBounding.bottom;
            }

            eleSubTarget.style.transform = 'translateY(' + offsetTop + 'px)';

            return;
        }

        // 改变选中索引
        if (strIndex != strMatchIndex) {
            let objLastItemData = null;

            if (strMatchIndex != '-1') {
                strMatchIndex.split('-').forEach(numIndex => {
                    if (objLastItemData === null) {
                        objLastItemData = arrListData[numIndex];
                    } else if (objLastItemData.data) {
                        objLastItemData = objLastItemData.data[numIndex];
                    } else {
                        objLastItemData = objLastItemData[numIndex];
                    }
                });

                if (objLastItemData) {
                    delete objLastItemData[SELECTED];
                }
            }

            // 设置为true
            objItemData[SELECTED] = true;

            // 更新匹配索引
            strMatchIndex = strIndex;
        }

        // 触发用户自定义选择事件
        (this.params.onSelect || objParams.onSelect).call(this, objItemData, eleClicked);

        // 触发自定义事件 - select
        this.dispatchEvent(new CustomEvent('select', {
            detail: {
                data: objItemData,
                target: eleClicked
            }
        }));

        // 如果trigger元素非<ui-drop>元素，则也触发一下，同时传递select事件来源
        // 如果是在Vue中，可以使用@select绑定选择事件
        if (eleTrigger != this) {
            eleTrigger.dispatchEvent(new CustomEvent('select', {
                detail: {
                    type: 'ui-drop',
                    data: objItemData,
                    target: eleClicked
                }
            }));
        }

        // 不是鼠标右击事件，也不是委托模式更新
        if (objParams.eventType != 'contextmenu' && objParams.selector == '' && !objItemData.href) {
            eleTrigger[strMethod] = objItemData.value;
        }
        // 隐藏
        this.hide();
    });

    // hover时候次级列表也显示
    eleTarget.addEventListener('mouseover', event => {
        // IE可能是文件节点
        if (event.target.nodeType != 1 || !event.target.closest) {
            return;
        }
        const eleHovered = event.target.closest('a');

        if (!eleHovered) {
            return;
        }

        const eleItemSublist = eleHovered.parentElement.querySelector('.' + SELECTED + '[data-sublist]');

        if (eleItemSublist && eleItemSublist != eleHovered) {
            eleItemSublist.classList.remove(SELECTED);
        }
        if (eleHovered.classList.contains(SELECTED) == false && typeof eleHovered.getAttribute('data-sublist') === 'string') {
            eleHovered.click();
        }
    });

    return this;
};



class ErrorTip {
    static allHide (exclude) {
        ErrorTip.collectionErrorTip.forEach(obj => {
            if (exclude != obj) {
                obj.hide();
            }
        });
    }

    constructor (element, content, options) {
        const defaults = {
            unique: true,
            onShow: () => {},
            onHide: () => {}
        };

        // 参数
        const objParams = {
            ...defaults,
            ...options
        };

        // 显示字符内容的处理
        let strContent = content;

        // 支持Function类型
        if (typeof strContent == 'function') {
            strContent = strContent();
        }
        if (typeof strContent != 'string') {
            return this;
        }

        // 一些元素
        const eleTrigger = element;

        let objErrorTip = eleTrigger.data && eleTrigger.data.errorTip;
        // 如果当前元素之前有过出错提示实例，则重复使用，无需再构造
        if (objErrorTip) {
            objErrorTip.content = strContent;
            objErrorTip.callback = {
                show: objParams.onShow,
                hide: objParams.onHide
            };
            objErrorTip.element.tips.trigger = eleTrigger;
            objErrorTip.show();

            return this;
        }

        // eleTips指的是红色出错提示元素
        let eleTips;
        // 为了单出错提示模式下，所有的红色都能取消的处理
        // 所有提示过的实例对象合在一起隐藏
        let collectionErrorTip = ErrorTip.collectionErrorTip;
        // 全局的出错实例
        const objUniqueErrorTip = collectionErrorTip[collectionErrorTip.length - 1];

        // 如果是唯一模式，则看看全局出错的对象
        if (objParams.unique == true && objUniqueErrorTip) {
            // window.errorTip存储的是唯一的红色提示元素
            // 改变存储的触发元素
            eleTips = objUniqueErrorTip.element.tips;
        } else if (objParams.unique == false && eleTrigger.data && eleTrigger.data.errorTip) {
            eleTips = eleTrigger.data.errorTip.element.tips;
        } else {
            eleTips = this.create();
        }

        // 如果是唯一模式，全局存储
        if (objParams.unique == true && collectionErrorTip.includes(this) == false) {
            collectionErrorTip.push(this);
        }

        // 更新提示元素对应的触发元素
        eleTips.trigger = eleTrigger;

        this.element = {
            trigger: eleTrigger,
            tips: eleTips
        };
        this.callback = {
            show: objParams.onShow,
            hide: objParams.onHide
        };

        this.params = {
            unique: objParams.unique
        };

        // 暴露在外
        this.content = strContent;

        // 在DOM对象上暴露对应的实例对象
        if (!eleTrigger.data) {
            eleTrigger.data = {};
        }
        eleTrigger.data.errorTip = this;

        // 显示
        this.show();
    }

    
    create () {
        // 首次
        let eleTips = document.createElement('div');
        eleTips.className = 'ui-tips-x ui-tips-error';
        document.body.appendChild(eleTips);

        // 事件
        this.events(eleTips);

        return eleTips;
    }

    
    events (eleTips) {
        // 任何键盘操作，点击，或者拉伸都会隐藏错误提示框
        document.addEventListener('keydown', (event) => {
            // ctrl/shift键不隐藏
            if (!/Control|Shift/i.test(event.code)) {
                ErrorTip.allHide(this);
                this.hide();
            }
        });

        document.addEventListener('mousedown', (event) => {
            const eleActiveElement = document.activeElement;

            const eleActiveTrigger = eleTips.trigger;
            const eleTarget = event.target;

            // 如果点击的就是触发的元素，且处于激活态，则忽略
            if (eleActiveElement && eleActiveTrigger && eleActiveElement == eleTarget &&
                eleActiveElement == eleActiveTrigger &&
                // 这个与Datalist.js关联
                !eleActiveTrigger.getAttribute('data-focus')
            ) {
                return;
            }

            ErrorTip.allHide(this);
            this.hide();
        });

        window.addEventListener('resize', () => {
            ErrorTip.allHide(this);
            this.hide();
        });
    }

    
    show () {
        const objElement = this.element;
        // 触发元素和提示元素
        const eleTips = objElement.tips;
        const eleTrigger = objElement.trigger;

        // 修改content内容
        eleTips.innerHTML = this.content;

        // 提示元素显示
        eleTips.style.display = '';

        // 定位
        eleTrigger.follow(eleTips, {
            // trigger-target
            position: '5-7',
            // 边界溢出不自动修正
            edgeAdjust: false
        });

        // aria无障碍访问增强
        eleTrigger.setAttribute('aria-label', '错误提示：' + this.content);
        // 两个重要标志类名
        eleTrigger.toggleAttribute('is-error', true);
        eleTrigger.classList.add('valided');

        this.display = true;

        // 显示的回调
        if (this.callback && this.callback.show) {
            this.callback.show.call(this, eleTrigger, eleTips);
        }

        // 触发自定义的 show 事件
        eleTrigger.dispatchEvent(new CustomEvent('show', {
            detail: {
                type: 'ui-errortip',
                content: this.content
            }
        }));
    }

    
    hide () {
        // 避免重复隐藏执行
        if (!this.display) {
            return;
        }

        const eleTips = this.element.tips;
        const eleTrigger = this.element.trigger;

        eleTrigger.removeAttribute('aria-label');
        eleTrigger.removeAttribute('is-error');

        eleTips.style.display = 'none';

        this.display = false;

        // 隐藏的回调
        if (this.callback && this.callback.hide) {
            this.callback.hide.call(this, eleTrigger, eleTips);
        }

        // 触发自定义的 hide 事件
        eleTrigger.dispatchEvent(new CustomEvent('hide', {
            detail: {
                type: 'ui-errortip'
            }
        }));
    }
}

ErrorTip.collectionErrorTip = [];

window.ErrorTip = ErrorTip;


HTMLElement.prototype.errorTip = function (content, options = {}) {
    new ErrorTip(this, content, options);

    return this;
};





HTMLElement.prototype.follow = function (eleTarget, options) {
    // 默认参数值
    let defaults  = {
        offsets: {
            x: 0,
            y: 0
        },
        safeArea: [0, 0, 0, 0],
        // eleTrigger-eleTarget
        position: '4-1',
        // 边缘位置自动调整
        edgeAdjust: true
    };

    // 判断第一个参数是否是DOM元素，不是的话判断是否是对象，是对象则将第一个参数当作options
    if (eleTarget && Object.prototype.toString.call(eleTarget) === '[object Object]') {
        options = eleTarget;
        eleTarget = null;
    }

    for (var keyOption in (options || (options = {}))) {
        if (typeof options[keyOption] == 'undefined') {
            delete options[keyOption];
        }
    }

    let objParams = Object.assign({}, defaults, options);

    // eleTarget 非必须，可 eleTrigger 元素 html 属性指定
    if (!eleTarget) {
        let strTarget = this.getAttribute('is-follow') || this.dataset.target;
        if (!strTarget) {
            return;
        }
        eleTarget = document.getElementById(strTarget) || document.querySelector('.' + strTarget) || document.querySelector(strTarget);
        if (!eleTarget) {
            return;
        }
    }

    // 合法的位置关系数据
    let arrLegalPosition = ['4-1', '1-4', '5-7', '2-3', '2-1', '6-8', '3-4', '4-3', '8-6', '1-2', '7-5', '3-2'];

    // eleTrigger 元素属性指定 options，传入的 options 参数优先级更高
    // offsets
    let dataOffsets = this.dataset.offsets;
    let arrOffsets = [];
    if (objParams.offsets.map && objParams.offsets.length) {
        arrOffsets = objParams.offsets;
    } else if (typeof objParams.offsets == 'string') {
        arrOffsets = objParams.offsets.trim().split(/,\s*|\s+/);
    }
    if (dataOffsets && !options.offsets) {
        arrOffsets = dataOffsets.trim().split(/,\s*|\s+/);
    }

    // 如果arrOffsets有值
    if (arrOffsets.length) {
        objParams.offsets = {};
        objParams.offsets.x = arrOffsets[0];
        objParams.offsets.y = arrOffsets[1] || arrOffsets[0];
    }

    let dataOffsetX = this.dataset.offsetX;
    let dataOffsetY = this.dataset.offsetY;

    if (dataOffsetX) {
        objParams.offsets.x = dataOffsetX;
    }
    if (dataOffsetY) {
        objParams.offsets.y = dataOffsetY;
    }

    // 转数值
    objParams.offsets.x *= 1;
    objParams.offsets.y *= 1;

    // position
    let dataPosition = this.dataset.position;
    let dataAlign = this.dataset.align;
    // data-align是否符合合法位置关系
    let isDataAlignMatch = arrLegalPosition.some((strLegalPosition) => {
        return strLegalPosition === dataAlign;
    });
    // 若没有设置 data-position，设置了 data-align 也行，若都设置了以 data-position 的值为准
    if (!dataPosition && dataAlign && isDataAlignMatch) {
        dataPosition = dataAlign;
    }
    if (dataPosition && (!options || !options.position)) {
        objParams.position = dataPosition;
    }

    // edge-adjust
    let dataEdgeAdjust = this.dataset.edgeAdjust || objParams.edgeAdjust;
    // data-edge-adjust 字符串为 0、none、false 认为是 false，其他都是 true
    let isEdgeAdjust = !((dataEdgeAdjust === '0') || (dataEdgeAdjust === 'none') || (dataEdgeAdjust === 'false') || (dataEdgeAdjust === false));
    if (typeof dataEdgeAdjust == 'string' && typeof objParams.edgeAdjust != 'boolean') {
        objParams.edgeAdjust = isEdgeAdjust;
    }

    // 先绝对定位，以便获取更准确的尺寸
    let strOriginPosition = eleTarget.style.position;
    if (strOriginPosition != 'absolute') {
        eleTarget.style.position = 'absolute';
    }

    // 触发元素和目标元素的坐标数据
    let objBoundTrigger = this.getBoundingClientRect();
    let objBoundTarget = eleTarget.getBoundingClientRect();

    // 如果目标元素隐藏，则不处理
    if (objBoundTarget.width * objBoundTarget.height === 0) {
        eleTarget.style.position = strOriginPosition || '';
        window.console.warn((eleTarget.id ? 'id为' + eleTarget.id + '的' : '') + '目前元素尺寸为0，无法定位');
        return;
    }

    // 页面的水平和垂直滚动距离
    let numScrollTop = window.pageYOffset;
    let numScrollLeft = window.pageXOffset;

    // 浏览器窗口的尺寸
    let numWinWidth = window.innerWidth;
    let numWinHeight = window.innerHeight;

    // 如果trigger元素全部都在屏幕外，则不进行边缘调整
    if ((objBoundTrigger.left < 0 && objBoundTrigger.right < 0) || (objBoundTrigger.top < 0 && objBoundTrigger.bottom < 0) || (objBoundTrigger.left > numWinWidth && objBoundTrigger.right > numWinWidth) || (objBoundTrigger.top > numWinHeight && objBoundTrigger.bottom > numWinHeight)) {
        objParams.edgeAdjust = isEdgeAdjust = false;
    }

    // target的包含块祖先元素，也就是定位元素
    let eleOffsetParent = eleTarget.offsetParent;
    let objBoundOffsetParent = eleOffsetParent.getBoundingClientRect();

    // 暴露给实例
    const element = {
        follow: eleTarget
    };

    this.element = this.element ? Object.assign(this.element, element) : element;
    this.params = this.params ? Object.assign(this.params, objParams) : objParams;

    // 参数中设置的偏移位置
    let objOffsets = objParams.offsets;
    // target元素所在的offset偏移
    let numOffsetTop = objBoundOffsetParent.top + numScrollTop;
    let numOffsetLeft = objBoundOffsetParent.left + numScrollLeft;

    // 如果是body元素，同时没有设置定位属性的话，忽略
    // 因为此时margin有值或者margin重叠时候会有定位bug
    if (eleOffsetParent === document.body && window.getComputedStyle(eleOffsetParent).position === 'static') {
        numOffsetTop = 0;
        numOffsetLeft = 0;
    }

    // 直接嫁接在offsets对象上，可以大大简化后续处理的逻辑
    // 减去包含块元素的偏移位置，这样的objOffsets尺寸是精准的定位尺寸
    // objOffsets.x -= numOffsetLeft;
    // objOffsets.y -= numOffsetTop;

    // 这是指定位置
    // 支持具体坐标值
    let strPosition = objParams.position;

    // 最终定位的left/top坐标
    let numTargetLeft, numTargetTop;

    // eleTarget元素zIndex实时最大化
    let zIndex = function () {
        // 返回eleTarget才是的样式计算对象
        let objStyleTarget = window.getComputedStyle(eleTarget);
        // 此时元素的层级
        let numZIndexTarget = Number(objStyleTarget.zIndex);
        // 用来对比的层级，也是最小层级
        let numZIndexNew = 19;

        // 只对同级子元素进行层级最大化计算处理
        eleOffsetParent.childNodes.forEach((eleChild) => {
            if (eleChild.nodeType !== 1) return;

            let objStyleChild = window.getComputedStyle(eleChild);

            let numZIndexChild = objStyleChild.zIndex * 1;

            if (numZIndexChild && eleTarget !== eleChild && objStyleChild.display !== 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew !== numZIndexTarget) {
            eleTarget.style.zIndex = numZIndexNew;
        }
    };

    // 如果直接指定了坐标
    if (typeof strPosition !== 'string' && strPosition.length === 2) {
        let arrPosition = strPosition;

        numTargetLeft = arrPosition[0] + objOffsets.x;
        numTargetTop = arrPosition[1] + objOffsets.y;

        // 边缘检测
        if (objParams.edgeAdjust === true) {
            if (numTargetLeft + objBoundTarget.width > numWinWidth + numScrollLeft) {
                numTargetLeft = numWinWidth + numScrollLeft - objBoundTarget.width - objOffsets.x;
            }
            if (numTargetTop + objBoundTarget.height > numWinHeight + numScrollTop) {
                numTargetTop = numWinHeight + numScrollTop - objBoundTarget.height - objOffsets.y;
            }
        }
        // 浮动框的定位与显示
        eleTarget.style.left = `${ numTargetLeft }px`;
        eleTarget.style.top = `${ numTargetTop }px`;
        // 记住定位标识码
        eleTarget.dataset.align = '3-1';

        // z-index自动最高
        zIndex();

        return;
    }


    // 是否对齐匹配的标志量
    // 遍历，以确定设定的对齐是否有匹配
    let isAlignMatch = arrLegalPosition.some((strLegalPosition) => {
        return strLegalPosition === strPosition;
    });

    // 如果没有匹配的对齐方式，使用默认的对齐方式
    if (isAlignMatch === false) {
        strPosition = defaults.position;
    }

    // 自动调整距离边缘的安全距离
    let arrSafeArea = this.dataset.safeArea || getComputedStyle(eleTarget).getPropertyValue('--safe-area') || objParams.safeArea;
    // 字符串转数组
    if (typeof arrSafeArea == 'string') {
        arrSafeArea = arrSafeArea.trim().split(/(?:,\s*|\s+)/);
    }
    arrSafeArea = arrSafeArea.map(function (val) {
        return parseFloat(val) || 0;
    });
    // 数量的处理
    if (arrSafeArea.length == 1) {
        arrSafeArea = arrSafeArea.concat(arrSafeArea[0], arrSafeArea[0], arrSafeArea[0]);
    } else if (arrSafeArea.length == 2) {
        arrSafeArea.push(arrSafeArea[0]);
        arrSafeArea.push(arrSafeArea[1]);
    } else if (arrSafeArea.length == 3) {
        arrSafeArea.push(arrSafeArea[1]);
    }

    // 是否超出边界的判断
    // 只考虑在视区的情况，页面的滚动距离不处理
    const objIsOverflow = {
        // 键使用trigger-target方位表示
        // 例如'left-right'表示trigger元素的左边缘和target元素右边缘对齐时候是否溢出
        'left-right': objBoundTarget.width + objOffsets.x + arrSafeArea[3] > objBoundTrigger.left,
        'top-bottom': objBoundTrigger.top - (objBoundTarget.height + objOffsets.y + arrSafeArea[0]) < 0,
        'right-left': objBoundTrigger.right + objBoundTarget.width + objOffsets.x + arrSafeArea[1] > numWinWidth,
        'bottom-top': objBoundTrigger.bottom + objBoundTarget.height + objOffsets.y + arrSafeArea[2] > numWinHeight,
        // 新增4个方位
        'right-right': objBoundTarget.width + objOffsets.x + arrSafeArea[3] > objBoundTrigger.right,
        'left-left': objBoundTrigger.left + objBoundTarget.width + objOffsets.x + arrSafeArea[1] > numWinWidth,
        'bottom-bottom': objBoundTarget.height + objOffsets.y + arrSafeArea[0] > objBoundTrigger.bottom,
        'top-top': objBoundTrigger.top + objBoundTarget.height + objOffsets.y + arrSafeArea[2] > numWinHeight
    };

    let strDirection = 'bottom';

    var funGetPosition = () => {
        // 定位的处理
        // 有别于之前的逻辑
        // 直接枚举处理，覆盖所有的情况，之前是方位调整比较粗放
        switch (strPosition) {
            case '1-4': case '5-7': case '2-3': {
                // 如果在上方显示
                // top坐标是确定的
                numTargetTop = objBoundTrigger.top - objBoundTarget.height;
                // left坐标确定
                if (strPosition === '1-4') {
                    numTargetLeft = objBoundTrigger.left;
                } else if (strPosition === '5-7') {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width) / 2;
                } else {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width);
                }

                strDirection = 'top';

                // 如果上方超出，则看看下方有没有空间
                if (isEdgeAdjust && objIsOverflow['top-bottom']) {
                    if (!objIsOverflow['bottom-top']) {
                        strPosition = ({
                            '1-4': '4-1',
                            '5-7': '7-5',
                            '2-3': '3-2'
                        })[strPosition];
                        // 再执行一次
                        funGetPosition();
                    } else if (!objIsOverflow['left-right'] || !objIsOverflow['right-left']) {
                        // 上下无空间，但是左侧或右侧有空间
                        // 随便给个水平方向就好
                        strPosition = ({
                            '1-4': '2-1',
                            '5-7': '6-8',
                            '2-3': '3-4'
                        })[strPosition];
                        funGetPosition();
                    }
                }

                break;
            }
            case '2-1': case '6-8': case '3-4': {
                // left坐标固定
                numTargetLeft = objBoundTrigger.right;
                // top坐标确定
                if (strPosition === '2-1') {
                    numTargetTop = objBoundTrigger.top;
                } else if (strPosition === '6-8') {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height) / 2;
                } else {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height);
                }

                strDirection = 'right';

                // 如果右侧超出，则看看左方有没有空间
                if (isEdgeAdjust && objIsOverflow['right-left']) {
                    if (!objIsOverflow['left-right']) {
                        strPosition = ({
                            '2-1': '1-2',
                            '6-8': '8-6',
                            '3-4': '4-3'
                        })[strPosition];
                        // 再执行一次
                        funGetPosition();
                    } else if (!objIsOverflow['top-bottom'] || !objIsOverflow['bottom-top']) {
                        strPosition = ({
                            '2-1': '1-4',
                            '6-8': '5-7',
                            '3-4': '2-3'
                        })[strPosition];
                        // 再执行一次
                        funGetPosition();
                    }
                }

                break;
            }
            case '4-1': case '7-5': case '3-2': {
                // top坐标是确定的
                numTargetTop = objBoundTrigger.bottom;
                // left坐标确定
                if (strPosition === '4-1') {
                    numTargetLeft = objBoundTrigger.left;
                } else if (strPosition === '7-5') {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width) / 2;
                } else {
                    numTargetLeft = objBoundTrigger.left - (objBoundTarget.width - objBoundTrigger.width);
                }

                strDirection = 'bottom';

                // 如果下方超出，则看看上方有没有空间
                if (isEdgeAdjust && objIsOverflow['bottom-top']) {
                    if (!objIsOverflow['top-bottom']) {
                        strPosition = ({
                            '4-1': '1-4',
                            '7-5': '5-7',
                            '3-2': '2-3'
                        })[strPosition];
                        // 再执行一次
                        funGetPosition();
                    } else if (!objIsOverflow['left-right'] || !objIsOverflow['right-left']) {
                        // 上下无空间，但是左侧或右侧有空间
                        // 随便给个水平方向就好
                        strPosition = ({
                            '4-1': '2-1',
                            '7-5': '6-8',
                            '3-2': '3-4'
                        })[strPosition];
                        funGetPosition();
                    }
                }

                break;
            }
            case '1-2': case '8-6': case '4-3': {
                // left坐标固定
                numTargetLeft = objBoundTrigger.left - objBoundTarget.width;

                // top坐标确定
                if (strPosition === '1-2') {
                    numTargetTop = objBoundTrigger.top;
                } else if (strPosition === '8-6') {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height) / 2;
                } else {
                    numTargetTop = objBoundTrigger.top - (objBoundTarget.height - objBoundTrigger.height);
                }

                strDirection = 'left';

                // 如果左侧超出，则看看右侧有没有空间
                if (isEdgeAdjust && objIsOverflow['left-right']) {
                    if (!objIsOverflow['right-left']) {
                        strPosition = ({
                            '1-2': '2-1',
                            '8-6': '6-8',
                            '4-3': '3-4'
                        })[strPosition];
                        // 再执行一次
                        funGetPosition();
                    } else if (!objIsOverflow['top-bottom'] || !objIsOverflow['bottom-top']) {
                        strPosition = ({
                            '1-2': '1-4',
                            '8-6': '5-7',
                            '4-3': '2-3'
                        })[strPosition];
                        // 再执行一次
                        funGetPosition();
                    }
                }

                break;
            }
        }
    };

    funGetPosition();

    numTargetLeft = numTargetLeft + objOffsets.x - numOffsetLeft;
    numTargetTop = numTargetTop + objOffsets.y - numOffsetTop;

    // 边界溢出，当前方位的安全举例处理
    if (isEdgeAdjust) {
        // 水平方向的微调
        if (strDirection == 'top') {
            numTargetTop = numTargetTop - arrSafeArea[2];
        } else if (strDirection == 'bottom') {
            numTargetTop = numTargetTop + arrSafeArea[0];
        } else if (strDirection == 'left') {
            numTargetLeft = numTargetLeft - arrSafeArea[1];
        } else {
            numTargetLeft = numTargetLeft + arrSafeArea[3];
        }
    }

    // 加上滚动距离
    numTargetTop += numScrollTop;
    numTargetLeft += numScrollLeft;

    //浮动框显示
    eleTarget.style.left = `${ Math.round(numTargetLeft) }px`;
    eleTarget.style.top = `${ Math.round(numTargetTop) }px`;

    // // 此时的eleTarget位置
    objBoundTarget = eleTarget.getBoundingClientRect();
    // 对立分享水平方向的微调
    if (isEdgeAdjust) {
        if (strDirection == 'top' || strDirection == 'bottom') {
            if (objBoundTarget.left < arrSafeArea[3]) {
                numTargetLeft = numTargetLeft + (arrSafeArea[3] - objBoundTarget.left);
            } else if (objBoundTarget.right + arrSafeArea[1] > numWinWidth) {
                numTargetLeft = numTargetLeft - (objBoundTarget.right + arrSafeArea[1] - numWinWidth);
            }
        } else if (objBoundTarget.top < arrSafeArea[0]) {
            numTargetTop += arrSafeArea[0] - objBoundTarget.top;
        } else if (objBoundTarget.bottom + arrSafeArea[2] > numWinHeight) {
            numTargetTop -= (objBoundTarget.bottom + arrSafeArea[2] - numWinHeight);
        }

        //浮动框显示
        eleTarget.style.left = `${ Math.round(numTargetLeft) }px`;
        eleTarget.style.top = `${ Math.round(numTargetTop) }px`;
    }

    eleTarget.dataset.align = strPosition;
    eleTarget.dataset.direction = strDirection;

    // z-index自动最高
    zIndex();

    if (!eleTarget.zIndex) {
        eleTarget.zIndex = zIndex;
    }
};

[NodeList.prototype, HTMLCollection.prototype].forEach(prop => {
    prop.follow = function () {
        [...this].forEach(node => {
            if (node.nodeType === 1) {
                node.follow.apply(node, this.arguments);
            }
        });
    };
});


 class UiFloat extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }

    constructor () {
        super();

        if (arguments.length) {
            UiFloat.custom.apply(this, arguments);
        }
    }

    get type () {
        return this.getAttribute('type');
    }

    get time () {
        let strTime = this.getAttribute('time');
        if (!isNaN(strTime) && !isNaN(parseFloat(strTime))) {
            return Number(strTime);
        }

        return 3000;
    }

    set type (value) {
        this.setAttribute('type', value);
    }

    set time (value) {
        this.setAttribute('time', value);
    }

    get open () {
        return this.hasAttribute('open');
    }

    set open (value) {
        this.toggleAttribute('open', value);
    }

    connectedCallback () {
        if (!this.closeMode) {
            this.closeMode = 'hide';
        }

        // 点击组件本身或按键盘 esc/enter 键即可关闭组件
        this.addEventListener('click', () => {
            // 移除元素
            this[this.closeMode]();
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-float'
            }
        }));

        this.isConnectedCallback = true;
    }

    attributeChangedCallback (name, oldValue, newValue) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open' && typeof oldValue !== typeof newValue) {
            if (typeof newValue === 'string') {
                clearTimeout(this.timer);
                if (this.time) {
                    this.timer = setTimeout(() => {
                        this[this.closeMode]();
                        this.position();
                    }, this.time);
                }

                this.setAttribute('data-tid', this.timer);

                // 组件的 z-index 层级计算
                this.zIndex();

                // 组件的定位，不同的提示位置不重叠
                this.position();
            }
        }
    }

    zIndex () {
        // 只对<body>子元素进行层级最大化计算处理，这里float默认的z-index值是19
        var numZIndexNew = 19;
        this.parentElement && [...this.parentElement.childNodes].forEach(function (eleChild) {
            if (eleChild.nodeType != 1) {
                return;
            }
            var objStyleChild = window.getComputedStyle(eleChild);
            var numZIndexChild = objStyleChild.zIndex * 1;
            if (numZIndexChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });
        this.style.zIndex = numZIndexNew;
    }

    // 定位处理
    position () {}

    // 调用方法处理
    static custom (text = '', type, time) {
        // 如果是静态方法执行
        // 创建ui-float自定义元素
        if (!this.matches || !this.matches('ui-float')) {
            return UiFloat.custom.apply(document.createElement('ui-float'), arguments);
        }

        if (typeof text == 'object') {
            type = text;
            text = '';
        }

        if (typeof text != 'string') {
            return this;
        }

        this.closeMode = 'remove';

        // 如果传入的类型是object形式
        if (type && typeof type === 'object') {
            UiFloat.custom.call(this, text, type.type, type.time);
            return;
        }
        // 如果type的类型是number，则赋值给time
        if (typeof type === 'number') {
            UiFloat.custom.call(this, text, time, type);
            return;
        }

        if (time || time === 0) {
            this.time = time;
        }

        if (type) {
            this.type = type;
        }

        this.innerHTML = text;

        // append 内存中创建的 <ui-float> 元素
        if (!this.parentElement) {
            document.body.appendChild(this);

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }

        this.show();

        return this;
    }
    remove () {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
        this.open = false;
    }
    show () {
        if (this.time > 0) {
            this.open = true;
        }
    }
    hide () {
        this.open = false;
    }
}

if (!customElements.get('ui-float')) {
    customElements.define('ui-float', UiFloat);
}

// 将该方法定义为 window 全局使用的方法
window.UiFloat = UiFloat;




// 将该方法定义为 window 全局使用的方法
window.FollowText = function (text, arg1, arg2) {
    const ele = document.createElement('ui-float');
    
    // 参数类型的处理
    var type, pos;

    [arg1, arg2].forEach(function (arg) {
        if (typeof arg == 'string') {
            type = arg;
        } else if (typeof arg == 'object') {
            pos = arg;
        }
    });

    if (!pos) {
        pos = {
            x: -100,
            y: -100
        };
    }

    // text 类型是必须的
    type = [type || pos.type || '', 'text'].join(' ');

    var x = pos.pageX || pos.x;
    var y = pos.pageY || pos.y;

    if (typeof x != 'number') {
        x = window.innerWidth / 2;
    }
    if (typeof y != 'number') {
        y = window.pageYOffset + window.innerHeight / 2;
    }

    // 内容写入
    ele.innerHTML = text || '';
    // 提示类型
    ele.type = type
    // 页面中显示
    ele.open = true;
    document.body.append(ele);
    // 事件处理
    ele.addEventListener('animationend', function() {
        document.body.removeChild(ele);
    });
    // 定位
    ele.style.left = (x - ele.clientWidth / 2) + 'px';
    ele.style.top = (y - ele.clientHeight) + 'px';

    return ele;
};

FollowText.success = function (text, event) {
    return this.custom(text, 'success', event);
}
FollowText.error = function (text, event) {
    return this.custom(text, 'error', event);
}
FollowText.warning = function (text, event) {
    return this.custom(text, 'warning', event);
}
FollowText.custom = function () {
    return FollowText(...arguments);
}




 
    // 表单
    class Form extends HTMLFormElement {
        constructor () {
            super();

            this.element = this.element || {};
            this.params = this.params || {
                // 验证成功之后，请求发送前的条件约束
                // avoidSend: function () {}
            };
            // 回调方法们
            this.callback = this.callback || {};

            Object.defineProperty(this.params, 'validate', {
                set (value) {
                    if (this.validate) {
                        this.validate.setCustomValidity(value);
                    }
                }
            });

            return this;
        }

        
        ajax () {
            // 回调
            // optionCallback可以是对象也可以直接是成功回调
            
            let optionCallback = this.callback;
            optionCallback = optionCallback || function () {};
            if (typeof optionCallback == 'function') {
                optionCallback = {
                    success: optionCallback
                };
            }
            // 元素
            let eleButton = null;
            let eleSubmit = this.element.submit;

            // 我们肉眼所见的按钮，进行一些状态控制
            eleButton = eleSubmit.id && document.querySelector('label[for=' + eleSubmit.id + ']');
            if (!eleButton) {
                eleButton = eleSubmit;
            }
            this.element.button = eleButton;

            // 请求地址
            let strUrl = this.action.split('#')[0] || location.href.split('#')[0];
            // 请求类型
            let strMethod = this.method || 'POST';
            let strEnctype = this.enctype;

            // 提交数据
            // 1. 菊花转起来
            eleButton.loading = true;
            // 2. 提交按钮禁用
            eleSubmit.setAttribute('disabled', 'disabled');

            // 3. 数据
            let objFormData = new FormData(this);
            // 支持外部传入额外的请求参数
            if (this.params.data) {
                Object.keys(this.params.data).forEach(key => {
                    objFormData.append(key, this.params.data[key]);
                });
            }

            // 请求类型不同，数据地址也不一样
            let strSearchParams = new URLSearchParams(objFormData).toString();

            if (strMethod.toLowerCase() == 'get') {
                if (strUrl.split('?').length > 1) {
                    strUrl = strUrl + '&' + strSearchParams;
                } else {
                    strUrl = strUrl + '?' + strSearchParams;
                }
            }

            // 4. 请求走起来
            let xhr = new XMLHttpRequest();
            xhr.open(strMethod, strUrl);

            if (optionCallback.beforeSend) {
                optionCallback.beforeSend.call(this, xhr, objFormData);
            }

            // 请求结束
            xhr.onload = () => {
                let json = {};

                try {
                    json = JSON.parse(xhr.responseText);
                } catch (event) {
                    new LightTip('返回数据解析出错。', 'error');
                    // 回调
                    if (optionCallback.error) {
                        optionCallback.error.call(this, event);
                    }

                    // 触发出错自定义事件
                    this.dispatchEvent(new CustomEvent('error', {
                        detail: {
                            data: {
                                code: -1,
                                msg: '解析出错'
                            }
                        }
                    }));

                    return;
                }

                if (json && (json.code === 0 || json.error === 0)) {
                    // 成功回调
                    if (optionCallback.success) {
                        optionCallback.success.call(this, json);
                    } else {
                        // 如果没有成功回调，组件自己提示成功
                        new LightTip(json.msg || '操作成功。', 'success');
                        // 表单重置
                        this.reset();
                    }

                    // 支持绑定success事件
                    this.dispatchEvent(new CustomEvent('success', {
                        detail: {
                            data: json
                        }
                    }));
                } else {
                    new LightTip((json && json.msg) || '返回数据格式不符合要求。', 'error');

                    // 失败回调
                    if (optionCallback.error) {
                        optionCallback.error.call(this, json);
                    }

                    // 触发出错自定义事件
                    this.dispatchEvent(new CustomEvent('error', {
                        detail: {
                            data: json
                        }
                    }));
                }
            };

            // 请求错误
            xhr.onerror = () => {
                new LightTip('网络异常，刚才的操作没有成功，您可以稍后重试。', 'error');
                // 回调
                if (optionCallback.error) {
                    optionCallback.error.apply(this, arguments);
                }
                // 触发出错自定义事件
                this.dispatchEvent(new CustomEvent('error', {
                    detail: {
                        code: -1,
                        msg: '网络异常'
                    }
                }));
            };

            // 请求结束，无论成功还是失败
            xhr.onloadend = () => {
                // 菊花关闭
                eleButton.loading = false;
                // 表单恢复提交
                eleSubmit.removeAttribute('disabled');
                // 回调
                if (optionCallback.complete) {
                    optionCallback.complete.apply(this, arguments);
                }

                // 支持绑定complete事件
                this.dispatchEvent(new CustomEvent('complete'));
            };

            if (strEnctype && strEnctype.toLowerCase() === 'application/x-www-form-urlencoded') {
                xhr.send(strSearchParams);
            } else {
                xhr.send(objFormData);
            }
        }

        connectedCallback () {
            // 表单提交按钮元素的获取
            let eleSubmit = [...this.elements].filter(function (control) {
                return control.type && /^(?:submit|image)$/i.test(control.type);
            })[0] || this.querySelector('button:nth-last-of-type(1)');

            if (!eleSubmit) {
                eleSubmit = (() => {
                    let ele = document.createElement('button');
                    ele.type = 'submit';
                    ele.setAttribute('hidden', '');
                    this.appendChild(ele);

                    return ele;
                })();
            }

            this.element.submit = eleSubmit;

            // 绑定表单验证
            this.validate = new Validate(this, () => {
                let funAvoidSend = this.params.avoidSend || this.callback.avoidSend;
                // 验证成功之后
                if (!funAvoidSend || !funAvoidSend(this)) {
                    this.ajax();
                }
            }, this.params.validate || {});

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-form'
                }
            }));

            this.isConnectedCallback = true;

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    if (!customElements.get('ui-form')) {
        customElements.define('ui-form', Form, {
            extends: 'form'
        });
    }



    class UiInput extends HTMLInputElement {
        static get observedAttributes () {
            return ['height', 'radius', 'width', 'label', 'font', 'minLength', 'maxLength'];
        }

        get label () {
            return this.getAttribute('label');
        }

        set label (val) {
            this.setAttribute('label', val);
            this.setAttribute('aria-label', val);
            if (!this.placeholder) {
                this.placeholder = val;
            }
        }

        get radius () {
            let radius = this.getAttribute('radius');
            if (!isNaN(radius) && !isNaN(parseFloat(radius))) {
                radius = radius + 'px';
            }
            return radius;
        }

        set radius (val) {
            this.setAttribute('radius', val);
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        // 标签背景的显示
        setLabel () {
            this.style.setProperty('--ui-' + this.tagName.toLowerCase() + '-image-label', `url("data:image/svg+xml,%3Csvg width='500' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='0%25' y='50%25' font-size='16' font-family='system-ui, sans-serif' fill='${encodeURIComponent(getComputedStyle(this).getPropertyValue('--ui-fill'))}' dominant-baseline='central'%3E${this.label}%3C/text%3E%3C/svg%3E")`);
            if (!this.placeholder) {
                this.placeholder = this.label;
            }
        }

        // 计数效果的显示
        count () {
            let numMin = this.minLength;
            let numMax = this.maxLength;

            if (numMin <= 0) {
                numMin = 0;
            }
            if (numMax <= 0) {
                numMax = this._maxLength || 0;
            } else {
                this._maxLength = numMax;
                this.removeAttribute('maxlength');
            }

            let tag = this.tagName.toLowerCase();

            // 如果没有最长最短文字限制
            if (!numMax && !numMin) {
                this.removeAttribute('_maxlength');
                this.style.removeProperty(`--ui-${tag}-image-count`);
                return;
            }

            // maxlength 会限制输入，移除
            this.setAttribute('_maxlength', numMax);

            // 确定字符显示内容
            let strRange = (numMin || '0') + '-' + numMax;
            if (!numMax) {
                strRange = numMin + '-?';
            } else if (!numMin) {
                strRange = numMax;
            }

            // 根据输入的字符确定内容的颜色
            let numLenValue = this.value.trim().length;
            // 获取颜色
            let strColorDefault = encodeURIComponent(getComputedStyle(this).getPropertyValue('--ui-gray'));
            let strColorLength = strColorDefault;
            if ((numMin && numLenValue < numMin) || (numMax && numLenValue > numMax)) {
                strColorLength = encodeURIComponent(getComputedStyle(this).getPropertyValue('--ui-red'));
            }

            // 设置背景图像
            this.style.setProperty('--ui-' + tag + '-image-count', `url("data:image/svg+xml,%3Csvg width='500' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='100%25' y='14' font-size='12' text-anchor='end' font-family='system-ui, sans-serif' fill='${strColorDefault}'%3E%3Ctspan fill='${strColorLength}'%3E${numLenValue}%3C/tspan%3E%3Ctspan%3E/${strRange}%3C/tspan%3E%3C/text%3E%3C/svg%3E")`);
            // 设置字符个数，方便 padding 定位
            this.style.setProperty('--ui-char-numbers', String(numLenValue).length + 1 + String(strRange).length);
        }

        renderAttribute (name, keep) {
            if (!name) {
                return;
            }

            if (/length$/i.test(name) && this[name]) {
                this.count();
                return;
            }

            let tag = this.tagName.toLowerCase();

            if (this.hasAttribute(name) && (typeof this[name] == 'string' || typeof this[name] == 'number')) {
                if (name == 'label') {
                    this.setLabel();
                } else {
                    this.style.setProperty('--ui-' + tag + '-' + name, this[name]);
                }
            } else if (!keep) {
                this.style.removeProperty('--ui-' + tag + '-' + name);
            }
        }

        render () {
            UiInput.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.renderAttribute(name);
        }

        constructor () {
            super();

            this.render();

            // 事件处理
            this.addEventListener('focus', function () {
                if (this.label) {
                    setTimeout(() => {
                        this.setLabel();
                    }, 16);
                }
            });
            this.addEventListener('blur', function () {
                if (this.label) {
                    setTimeout(() => {
                        this.setLabel();
                    }, 16);
                }
            });
            // 计数处理
            this.addEventListener('input', () => {
                this.count();
            });
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-input'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-input')) {
        customElements.define('ui-input', UiInput, {
            extends: 'input'
        });
    }

    window.UiInput = UiInput;

    

// flex 布局
class UiFlex extends HTMLElement {
    static get observedAttributes () {
        return ['gap'];
    }
    constructor () {
        super();
    }

    get gap () {
        return this.getAttribute('gap') || '0';
    }

    set gap (val) {
        this.setAttribute('gap', val);
    }

    render (attrs) {
        if (!attrs) {
            attrs = UiFlex.observedAttributes;
        } else if (typeof attrs == 'string') {
            attrs = [attrs];
        }
        if (attrs.forEach) {
            attrs.forEach(attr => {
                let val = this[attr];
                if (!isNaN(val) && !isNaN(parseFloat(val))) {
                    val = val + 'rem';
                }
                this.style.setProperty('--ui-' + attr, val);
            });
        }
    }

    attributeChangedCallback (name) {
        this.render(name);
    }

    connectedCallback () {
        this.render();
    }
}

if (!customElements.get('ui-flex')) {
    customElements.define('ui-flex', UiFlex);
}


class UiGrid extends HTMLElement {
    static get observedAttributes () {
        return ['gap', 'size', 'space'];
    }
    constructor () {
        super();
    }

    get gap () {
        return this.getAttribute('gap') || '0';
    }

    set gap (val) {
        this.setAttribute('gap', val);
    }

    get size () {
        return this.getAttribute('size') || '6';
    }

    set size (val) {
        this.setAttribute('size', val);
    }

    get space () {
        return this.getAttribute('space') || '0';
    }

    set space (val) {
        this.setAttribute('space', val);
    }

    render (attrs) {
        if (!attrs) {
            attrs = UiGrid.observedAttributes;
        } else if (typeof attrs == 'string') {
            attrs = [attrs];
        }
        if (attrs.forEach) {
            attrs.forEach(attr => {
                let val = this[attr];
                if (!isNaN(val) && !isNaN(parseFloat(val))) {
                    val = val + 'rem';
                }
                if (attr == 'size' && this.hasAttribute('repeat')) {
                    this.style.setProperty('--ui-repeat-size', val);
                } else {
                    this.style.setProperty('--ui-' + attr, val);
                }
            });
        }
    }

    attributeChangedCallback (name) {
        this.render(name);
    }
};

if (!customElements.get('ui-grid')) {
    customElements.define('ui-grid', UiGrid);
}





// 列表项布局
class UiListItem extends HTMLElement {
    static get observedAttributes () {
        return ['value', 'checked', 'name', 'disabled', 'type', 'space'];
    }

    constructor () {
        super();

        let type = this.type;

        if (!type) {
            return this;
        }

        let element = this.querySelector(`:scope > [type="${type}"]`);

        // 如果元素不存在，创建
        if (!element) {
            element = document.createElement('input');
            if (typeof this.name == 'string') {
                element.name = this.name;
            }
            if (typeof this.value == 'string') {
                element.value = this.value;
            }
            element.type = type;
            element.checked = this.checked;
            element.disabled = this.disabled;

            // change 事件传递
            element.addEventListener('change', () => {
                this.dispatchEvent(new CustomEvent('change'));
            });

            // 插入
            this.insertAdjacentElement('beforeend', element);
        }
    }

    get type () {
        return this.getAttribute('type');
    }

    set type (val) {
        this.setAttribute('type', val);
    }

    get name () {
        return this.getAttribute('name');
    }

    get value () {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            return element.value;
        }

        return this.getAttribute('value');
    }

    set value (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.value = val;
        }

        this.setAttribute('value', val);
    }

    set name (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.name = val;
        }
        this.setAttribute('name', val);
    }

    get checked () {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            return element.checked;
        }

        return this.hasAttribute('checked');
    }

    set checked (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.checked = val;
        }

        this.toggleAttribute('checked', val);
    }

    get disabled () {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            return element.disabled;
        }

        return this.hasAttribute('disabled');
    }

    set disabled (val) {
        let type = this.type;
        let element = type && this.querySelector(`:scope > [type="${type}"]`);

        if (element) {
            element.disabled = val;
        }

        this.toggleAttribute('disabled', val);
    }

    get space () {
        let space = this.getAttribute('space');
        if (space === '') {
            space = '.75rem 1rem';
        }
        return space || '0';
    }

    set space (val) {
        this.setAttribute('space', val);
    }

    render (name) {
        if (name == 'space') {
            let val = this.space;
            if (val) {
                if (!isNaN(val) && !isNaN(parseFloat(val))) {
                    val = val + 'rem';
                }
                this.style.setProperty('--ui-' + name, val);
            } else {
                this.style.removeProperty('--ui-' + name);
            }
        }
    }

    attributeChangedCallback (name) {
        this.render(name);
    }

    connectedCallback () {
        this.render('space');
    }
}

if (!customElements.get('ui-list-item')) {
    customElements.define('ui-list-item', UiListItem);
}



class UiLightTip extends UiFloat {
    // 定位处理
    position () {
        var elesOpen = [...document.querySelectorAll('ui-lighttip[open]')];
        // 基于 data-tid 排序
        var elesOpenSort = elesOpen.sort(function (eleA, eleB) {
            return (eleA.getAttribute('data-tid') || 0) - (eleB.getAttribute('data-tid') || 0);
        });
        // 确定提示内容
        var objMatchText = {};
        var numIndex = -1;

        elesOpenSort.forEach((ele) => {
            let strText = ele.textContent;
            if (typeof objMatchText[strText] == 'undefined') {
                numIndex++;
                objMatchText[strText] = numIndex;
            }
            ele.style.setProperty('--ui-sort-index', objMatchText[strText]);
        });
    }

    // success
    static success (text, time = 3000) {
        return this.custom(text, 'success', time);
    }
    // error
    static error (text, time = 3000) {
        return this.custom(text, 'error', time);
    }
    // normal
    static normal (text, time = 3000) {
        return this.custom(text, 'normal', time);
    }
    // normal
    static custom (text, type, time) {
        return new window.LightTip(text, type, time);
    }
}

// 将该方法定义为 window 全局使用的方法
window.LightTip = function (text, arg1, arg2) {
    if (!text) {
        return;
    }

    // 参数处理
    var type, time;

    [arg1, arg2].forEach(function (arg) {
        if (typeof arg == 'number') {
            time = arg;
        } else if (typeof arg == 'string') {
            type = arg;
        } else if (typeof arg == 'object') {
            type = arg.type;
            time = arg.time
        }
    });

    const ele = document.createElement('ui-lighttip');

    if (typeof time == 'number') {
        ele.time = time;
    }
    if (type) {
        ele.type = type;
    }
    ele.innerHTML = text;
    document.body.append(ele);
    ele.open = true;

    return ele;
};

if (!customElements.get('ui-lighttip')) {
    customElements.define('ui-lighttip', UiLightTip);
}





(() => {

    

    let CL = 'ui-loading';
    Object.defineProperty(HTMLElement.prototype, 'loading', {
        configurable: true,
        enumerable: true,
        get () {
            return !!(this.classList.contains(CL) || this.matches(CL));
        },
        set (flag) {
            let action = 'remove';
            if (flag) {
                action = 'add';
                if (this.loading) {
                    return flag;
                }
            }
            let strClassButton = 'ui-button';
            if (this.classList.contains(strClassButton) || this.getAttribute('is') == strClassButton) {
                this.classList[action]('loading');
            } else {
                this.classList[action](CL);
            }
        }
    });

    // loading 的分段展示
    let eleLoading = null;
    let timerLoading = null;

    // 定义 document 全局 loading 加载效果
    Object.defineProperty(document, 'loading', {
        get () {
            return Boolean(eleLoading && eleLoading.isConnected);
        },
        set (value) {

            let html = function (con) {
                return con && '<ui-loading-text>' + con + '<ui-dot>...</ui-dot></ui-loading-text>';
            }

            if (value || value === '') {
                if (eleLoading) {
                    document.body.append(eleLoading);
                    // 这里需要设置open属性
                    eleLoading.open = true;
                } else {
                    eleLoading = new Toast('1', 0);
                    eleLoading.loading = true;
                }
                // loading 文字显示
                let numIndex = 0;
                let arrTips = ['正在加载中', '仍在加载中', '即将加载完毕'];
                if (typeof value == 'string') {
                    arrTips = [value];
                } else if (Array.isArray(value)) {
                    arrTips = value;
                }

                // 显示提示的内容
                eleLoading.innerHTML = html(arrTips[numIndex]);

                // 清除之前的定时器（如果有）
                clearInterval(timerLoading);

                // 步阶显示提示内容
                timerLoading = setInterval(() => {
                    numIndex++;
                    eleLoading.innerHTML = html(arrTips[numIndex] || arrTips[numIndex - 1]);
                    if (numIndex >= arrTips.length - 1) {
                        clearInterval(timerLoading);
                    }
                }, 6000);
            } else if (eleLoading) {
                eleLoading.remove();
                clearInterval(timerLoading);
            }
        }
    });
})();

// <ui-loading> 自定义组件实现
class UiLoading extends HTMLElement {
    static get observedAttributes () {
        return ['rows', 'size', 'color'];
    }

    constructor () {
        super();
    }

    get size () {
        return this.getAttribute('size');
    }
    set size (value) {
        this.setAttribute('size', value);
    }

    get rows () {
        return this.getAttribute('rows');
    }
    set rows (value) {
        this.setAttribute('rows', value);
    }

    get color () {
        return this.getAttribute('color');
    }
    set color (value) {
        this.setAttribute('color', value);
    }

    render (attrs) {
        if (!attrs) {
            attrs = this.observedAttributes || [];
        } else if (typeof attrs == 'string') {
            attrs = [attrs];
        }
        if (attrs.forEach) {
            attrs.forEach(attr => {
                let val = this[attr];
                if (val === null) {
                    this.style.removeProperty('--ui-' + attr);
                } else {
                    this.style.setProperty('--ui-' + attr, val);
                }                
            });
        }
    }

    attributeChangedCallback (name) {
        this.render(name);
    }

    connectedCallback () {
        this.render();
    }
}

customElements.define('ui-loading', UiLoading);


class UiOverlay extends HTMLElement {
    static get observedAttributes () {
        return ['open', 'opacity', 'color'];
    }
    constructor () {
        super();
    }

    get mode () {
        return this.getAttribute('mode') || 'hide';
    }

    set mode (value) {
        this.setAttribute('mode', value);
    }

    get open () {
        return this.hasAttribute('open');
    }

    set open (value) {
        this.toggleAttribute('open', value);
    }

    get fade () {
        return this.hasAttribute('fade');
    }

    set fade (value) {
        this.toggleAttribute('fade', value);
    }

    get opacity () {
        return this.getAttribute('opacity');
    }

    set opacity (value) {
        this.setAttribute('opacity', value);
    }

    get color () {
        return this.getAttribute('color');
    }

    set color (value) {
        this.setAttribute('color', value);
    }

    get touch () {
        return this.getAttribute('touch');
    }

    set touch (value) {
        this.setAttribute('touch', value);
    }

    renderAttribute (name, keep) {
        if (name == 'open') {
            return;
        }
        if (typeof this[name] == 'string') {
            this.style.setProperty('--ui-overlay-' + name, this[name]);
        } else if (!keep) {
            this.style.removeProperty('--ui-overlay-' + name);
        }
    }

    render () {
        UiOverlay.observedAttributes.forEach(attr => {
            this.renderAttribute(attr, true);
        });

        // 可点击性
        if (this[this.mode]) {
            // 自定义元素设置 tabIndex=0 代表改元素可聚焦，并可通过键盘导航来聚焦到该元素
            this.setAttribute('tabIndex', 0);
            this.setAttribute('role', 'button');
        } else {
            this.removeAttribute('tabIndex');
            this.removeAttribute('role');
        }
    }

    attributeChangedCallback (name) {
        this.renderAttribute(name);
    }

    zIndex () {
        // 只对同级元素进行层级最大化计算处理
        var numZIndexNew = 19;
        this.parentElement && [...this.parentElement.childNodes].forEach((eleChild) => {
            if (eleChild.nodeType != 1 || eleChild === this || eleChild.parentElement.zIndex) {
                return;
            }
            var objStyleChild = window.getComputedStyle(eleChild);
            var numZIndexChild = objStyleChild.zIndex * 1;
            if (numZIndexChild && objStyleChild.display != 'none') {
                numZIndexNew = Math.max(numZIndexChild + 1, numZIndexNew);
            }
        });

        if (numZIndexNew > getComputedStyle(this).zIndex) {
            this.style.zIndex = numZIndexNew;
        }
    }

    attributeChangedCallback (name) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open') {
            // 组件的 z-index 层级计算
            if (this.open) {
                this.zIndex();
                this.render();
            }
        }
    }

    connectedCallback () {
        // 属性与样式渲染
        this.render();

        // 点击组件本身或按键盘 esc/enter 键即可关闭组件
        this.addEventListener('click', () => {
            if (this[this.mode]) {
                // 模式方法
                this[this.mode]();
            }
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-overlay'
            }
        }));

        this.isConnectedCallback = true;
    }

    remove () {
        if (this.fade) {
            this.addEventListener('animationend', () => {
                if (this.parentElement) {
                    this.parentElement.removeChild(this);
                }
            });
        } else {
            if (this.parentElement) {
                this.parentElement.removeChild(this);
            }
        }
        
        this.open = false;

        this.dispatchEvent(new CustomEvent('remove'));
    }
    show () {
        this.open = true;

        // 从内存中取出
        if (document.body.contains(this) == false) {
            document.body.append(this);
        }

        this.dispatchEvent(new CustomEvent('show'));
    }
    hide () {
        this.open = false;

        this.dispatchEvent(new CustomEvent('hide'));
    }
}

if (!customElements.get('ui-overlay')) {
    customElements.define('ui-overlay', UiOverlay);
}

// 将该方法定义为 window 全局使用的方法
window.Overlay = function (options) {
    options = options || {};

    var defaults = {
        fade: true,
        mode: 'remove',
        open: true,
        touch: 'none'
    };

    var params = Object.assign({}, defaults, options);

    // 创建 <ui-overlay> 元素
    let overlay = new UiOverlay();

    // 参数赋予
    for (let key in params) {
        overlay[key] = params[key];
    }

    // 插入到页面
    document.body.append(overlay);

    return overlay;
};



class UiPagination extends HTMLElement {

    static get observedAttributes () {
        return ['per', 'total', 'current', 'loading'];
    }

    constructor ({per, total, current, loading, href, container = null} = {}) {
        super();

        const isLink = href || this.href;
        const el = isLink ? 'a' : 'button';
        if (per) {
            this.per = per;
        }
        if (total) {
            this.total = total;
        }
        if (current) {
            this.setAttribute('current', current);
        }
        this.loading = loading;
        this.innerHTML = `<fieldset class="ui-page-wrap">
            <${el} class="ui-page-item ui-page-prev">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
            <div class="ui-page"></div>
            <${el} class="ui-page-item ui-page-next">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"></path></svg>
            </${el}>
        </fieldset>`;
        // trigger元素的获取
        this.element = new Proxy(this.element || {}, {
            get: (target, prop) => {
                if (prop == 'trigger') {
                    return this.htmlFor && document.getElementById(this.htmlFor);
                }

                return target[prop];
            },
            set (target, prop, value) {
                // 赋值
                target[prop] = value;

                return true;
            }
        });

        // 如果存在容器，就append进去
        if (typeof container == 'string') {
            container = document.querySelector(container);
        }
        if (container) {
            container.append(this);
        }
    }

    get per () {
        return Number(this.getAttribute('per')) || 15;
    }

    get simple () {
        return this.getAttribute('mode') === 'short';
    }

    get total () {
        return Number(this.getAttribute('total')) || 0;
    }

    get current () {
        return Number(this.getAttribute('current')) || 1;
    }

    get loading () {
        return this.getAttribute('loading') !== null;
    }

    get href () {
        //?page=1
        return this.getAttribute('href');
    }

    set current (value) {
        this.setAttribute('current', Math.min(Math.max(1, value), this.count));
    }

    set per (value) {
        this.setAttribute('per', value);
    }

    set total (value) {
        this.setAttribute('total', value);
    }

    set loading (value) {
        if (!value) {
            this.removeAttribute('loading');
        } else {
            this.setAttribute('loading', '');
        }
    }

    get htmlFor () {
        return this.getAttribute('for');
    }
    set htmlFor (value) {
        this.setAttribute('for', value);
    }

    // 渲染方法
    render (per, total) {
        let elePage = this.element.page;
        if (!elePage) {
            return;
        }

        // 如果是链接，使用 <a> 元素
        // 否则，使用 <button> 元素
        const item = this.href ? 'a' : 'button';
        this.count = Math.ceil(total / per) || 1;
        const current = Math.min(Math.max(1, this.current), this.count);

        // 如果是简单分页模式
        if (this.simple) {
            elePage.innerHTML = `<div class="ui-page-simple ui-page-item" >${current} / ${this.count}</div>`;
        } else {
            // 生成一个长度为count，且最大长度为10的数组 [undefined,undefined,undefined,undefined,undefined,...]
            const arr = Array.from({length: this.count}).splice(0, 7);
            // 将数组映射成每一页的节点
            const html = arr.map((el, index) => {
                return `<${item} class="ui-page-item" data-current="${index + 1}" aria-label="第${index + 1}页，共${this.count}页">${index + 1}</${item}>`;
            }).join('');
            elePage.innerHTML = html;
        }

        // 存在同时改变多个自定义元素属性的情况，此时应该执行一次
        clearTimeout(this.timerRender);
        this.timerRender = setTimeout(() => {
            this.updatePage(current);
        });
    }

    updatePage (current = this.current) {
        // 元素获取
        let elePage = this.element.page;
        let elePrev = this.element.prev;
        let eleNext = this.element.next;

        if (current == 1) {
            elePrev.setAttribute('disabled', true);
            elePrev.setAttribute('aria-label', '已经是第一页了');
            elePrev.removeAttribute('href');
        } else {
            elePrev.removeAttribute('disabled');
            elePrev.setAttribute('aria-label', `上一页，当前第${current}页`);
            elePrev.href = this.href ? this.href.replace(/\${current}/g, current - 1) : 'javascript:;';
        }
        if (current == this.count) {
            eleNext.setAttribute('disabled', true);
            eleNext.setAttribute('aria-label', '已经是最后一页了');
            eleNext.removeAttribute('href');
        } else {
            eleNext.removeAttribute('disabled');
            eleNext.setAttribute('aria-label', `下一页，当前第${current}页`);
            eleNext.href = this.href ? this.href.replace(/\${current}/g, current + 1) : 'javascript:;';
        }
        if (this.simple) {
            elePage.querySelector('.ui-page-simple').textContent = current + ' / ' + this.count;
        } else if (this.count > 7) {
            let place = [];
            switch (current) {
                case 1:
                case 2:
                case 3:
                case 4:
                    place = [1, 2, 3, 4, 5, 'next', this.count];
                    break;
                case this.count:
                case this.count - 1:
                case this.count - 2:
                case this.count - 3:
                    place = [1, 'pre', this.count - 4, this.count - 3, this.count - 2, this.count - 1, this.count];
                    break;
                default:
                    place = [1, 'pre', current - 1, current, current + 1, 'next', this.count];
                    break;
            }
            elePage.querySelectorAll('.ui-page-item').forEach((el, i) => {
                if (typeof place[i] === 'number') {
                    el.dataset.current = place[i];
                    el.textContent = place[i];
                    el.disabled = false;
                    el.href = 'javascript:;';
                    if (place[i] == current) {
                        el.setAttribute('current', '');
                    } else {
                        el.removeAttribute('current');
                    }
                    el.removeAttribute('disabled');
                    el.setAttribute('aria-label', `第${place[i]}页，共${this.count}页`);
                    if (this.href) {
                        el.href = this.href.replace(/\${current}/g, el.dataset.current);
                    }
                } else {
                    el.textContent = '...';
                    el.removeAttribute('current');
                    el.removeAttribute('data-current');
                    el.removeAttribute('aria-label');
                    el.setAttribute('disabled', true);
                    el.removeAttribute('href');
                }
            });
        } else {
            elePage.querySelectorAll('.ui-page-item').forEach((el) => {
                if (el.dataset.current == current) {
                    el.setAttribute('current', '');
                } else {
                    el.removeAttribute('current');
                }
                if (this.href) {
                    el.href = this.href.replace(/\${current}/g, el.dataset.current);
                }
            });
        }
    }


    connectedCallback () {
        // 一些元素内容
        let eleWrap = this.querySelector('fieldset');
        if (!eleWrap) {
            return;
        }

        // 前后按钮和分页主体元素
        let elePage = eleWrap.querySelector('.ui-page');
        let elePrev = eleWrap.firstElementChild;
        let eleNext = eleWrap.lastElementChild;

        // 全局暴露
        this.element.wrap = eleWrap;
        this.element.page = elePage;
        this.element.prev = elePrev;
        this.element.next = eleNext;
        
        // 开启渲染
        this.render(this.per, this.total);

        // 事件的处理
        elePage.addEventListener('click', (ev) => {
            const item = ev.target.closest('.ui-page-item');
            if (item) {
                this.nativeClick = true;
                this.current = Number(item.dataset.current);
            }
        });

        elePrev.addEventListener('click', () => {
            this.nativeClick = true;
            this.current--;
        });
        eleNext.addEventListener('click', () => {
            this.nativeClick = true;
            this.current++;
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-pagination'
            }
        }));

        this.isConnectedCallback = true;

        // 分页内容准备完毕
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if (!this.element || oldValue === newValue) {
            return;
        }
        let eleTrigger = this.element.trigger;
        let eleWrap = this.element.wrap;

        if (name == 'per') {
            this.render(newValue, this.total);
            // 普通元素分页数据per数据同步
            if (eleTrigger) {
                eleTrigger.dataset.per = newValue;
            }
        } else if (name == 'total') {
            this.render(this.per, newValue);
            // 普通元素分页数据total数据同步
            if (eleTrigger) {
                eleTrigger.dataset.total = newValue;
            }
        } else if (name == 'loading') {
            eleWrap.disabled = newValue !== null;

            // 普通元素分页数据loading状态同步
            if (eleTrigger) {
                eleTrigger.dataset.loading = newValue !== null;
            }
        } else if (name == 'current' && oldValue !== newValue) {
            // 一定程度上避免冗余的渲染
            clearTimeout(this.timerRender);
            this.timerRender = setTimeout(() => {
                this.updatePage(Number(newValue));
            });

            // 普通元素分页数据信息的实时同步
            if (eleTrigger) {
                eleTrigger.dataset.current = newValue;
            }
            if (this.nativeClick) {
                this.nativeClick = false;
                this.dispatchEvent(new CustomEvent('change', {
                    detail: {
                        current: Number(newValue),
                        per: this.per,
                        total: this.total
                    }
                }));

                if (eleTrigger && eleTrigger != this) {
                    eleTrigger.dispatchEvent(new CustomEvent('change', {
                        detail: {
                            current: Number(newValue),
                            per: this.per,
                            total: this.total
                        }
                    }));
                }
            }
        }
    }
}

if (!customElements.get('ui-pagination')) {
    customElements.define('ui-pagination', UiPagination);
}

window.Pagination = UiPagination;

// 给 HTML 元素扩展 pagination 方法
HTMLElement.prototype.pagination = function (options) {
    if (this.matches('ui-pagination') || this['ui-pagination']) {
        return this;
    }

    const {
        total = 0,
        current = 1,
        per = 15,
        href = null,
        loading = false
    } = this.dataset;

    let objParams = Object.assign({}, {
        per,
        total,
        href,
        loading
    }, options || {});

    const pagination = new Pagination(objParams);

    const strId = this.id || ('lulu_' + Math.random()).replace('0.', '');
    this.innerHTML = '';
    this.id = strId;
    this['ui-pagination'] = pagination;
    pagination.htmlFor = strId;
    pagination.setAttribute('current', current);
    // 删除自定义元素，隐藏不必要的细节
    pagination.addEventListener('connected', () => {
        // 所有普通元素也触发 connected 生命周期事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-pagination'
            }
        }));

        // 原分页从页面中删除
        pagination.remove();

        // DOM 执行完毕
        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    });
    document.body.append(pagination);

    this.append.apply(this, [...pagination.children]);

    // 设置定义完毕标志量
    this.setAttribute('defined', '');

    return this;
};

(function () {
    const initAllPagination = (ele) => {
        const elePaginations = ele || document.querySelectorAll('[is-pagination]');

        elePaginations.forEach(item => {
            item.pagination();
        });
    };

    
    const autoInitAndWatchingIsPaginationAttr = () => {
        // 先实例化已有is-pagination属性的DOM节点，再监听后续的节点变化
        initAllPagination();
        const observer = new MutationObserver(mutationsList => {
            mutationsList.forEach(mutation => {
                mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                    if (!eleAdd.tagName) {
                        return;
                    }
                    if (eleAdd.hasAttribute('is-pagination')) {
                        initAllPagination([eleAdd]);
                    } else {
                        initAllPagination(eleAdd.querySelectorAll('[is-pagination]'));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState != 'loading') {
        autoInitAndWatchingIsPaginationAttr();
    } else {
        window.addEventListener('DOMContentLoaded', autoInitAndWatchingIsPaginationAttr);
    }
})();




class UiPopup extends HTMLElement {
    static get observedAttributes () {
        return ['open', 'height', 'width', 'radius', 'background', 'close-icon'];
    }
    constructor (params) {
        super();

        // 元素
        if (!this.element) {
            this.element = {};
        }
        // 这个是必须的，即使不在文档中
        this.element.overlay = new UiOverlay();
        // 创建容器元素
        let eleContainer = document.createElement('ui-popup-container');
        this.element.container = eleContainer;
        // 创建关闭按钮
        let eleClose = document.createElement('button');
        eleClose.setAttribute('part', 'close');
        eleClose.textContent = '关闭';
        eleClose.addEventListener('click', () => {
            if (this[this.mode]) {
                this[this.mode]();
            } else {
                this.hide();
            }
        });
        this.element.close = eleClose;
        // 写入内容
        if (this.childNodes.length) {
            this.content = this.childNodes;
        }
        this.append(eleContainer);
        // 设置参数
        this.setParams(params);
    }

    get mode () {
        return this.getAttribute('mode') || 'hide';
    }

    set mode (value) {
        this.setAttribute('mode', value);
    }

    get open () {
        return this.hasAttribute('open');
    }

    set open (value) {
        this.toggleAttribute('open', value);
    }

    get transition () {
        return this.hasAttribute('transition');
    }

    set transition (value) {
        this.toggleAttribute('transition', value);
    }

    get background () {
        return this.getAttribute('background');
    }

    set background (value) {
        this.setAttribute('background', value);
    }

    get position () {
        return this.getAttribute('position') || 'bottom';
    }

    set position (value) {
        this.setAttribute('position', value);
    }

    get overlay () {
        return this.hasAttribute('overlay');
    }

    set overlay (value) {
        this.toggleAttribute('overlay', Boolean(value));
    }

    get content () {
        return this.originContent;
    }

    get closeIcon () {
        return this.getAttribute('close-icon');
    }

    set closeIcon (value) {
        this.setAttribute('close-icon', value);
    }

    get closeable () {
        return this.hasAttribute('close-icon');
    }

    set closeable (value) {
        this.toggleAttribute('close-icon', Boolean(value));
    }

    set content (content) {
        // 给 popup.content 获取用
        this.originContent = content;

        let eleContainer = this.element.container;
        let eleClose = this.element.close;
        // content可以是函数
        if (typeof content == 'function') {
            content = content();
        } else if (typeof content == 'string' && /^#?\w+(?:[-_]\w+)*$/i.test(content)) {
            // 如果是字符串
            // 如果是选择器，仅支持ID选择器
            let eleMatch = document.querySelector(content);
            if (eleMatch) {
                if (eleMatch.matches('textarea')) {
                    content = eleMatch.value;
                } else if (eleMatch.matches('script')) {
                    content = eleMatch.innerHTML;
                } else if (eleMatch.matches('template')) {
                    content = document.importNode(eleMatch.content, true);
                } else {
                    content = eleMatch;
                }
            }
        }

        // 关闭方式的确认
        if (!this.hasAttribute('mode') && !this.isConnectedCallback) {
            // 基于内容的数据类型，使用不同的默认的弹框关闭方式
            this.mode = typeof content == 'string' ? 'remove' : 'hide';
        }

        // 清空内容
        if (eleContainer.contains(eleClose)) {
            eleClose.remove();
        }
        eleContainer.innerHTML = '';

        if (this.closeable) {
            eleContainer.prepend(eleClose);
        }

        // 如果是字符串内容
        if (typeof content == 'string') {
            eleContainer.insertAdjacentHTML('afterbegin', content);
        } else if (content.length && !content.tagName) {
            content.owner = this;
            // 节点列表或者元素合集
            [...content].forEach(node => {
                if (typeof node == 'string') {
                    eleContainer.insertAdjacentHTML('afterbegin', node);
                } else {
                    eleContainer.appendChild(node);
                }                
            });
        } else if (typeof content.nodeType == 'number') {
            content.owner = this;
            eleContainer.append(content);

            // 元素显示方法
            var funVisible = () => {
                if (content.removeAttribute) {
                    content.removeAttribute('hidden');
                    if (content.style && content.style.display == 'none') {
                        content.style.display = '';
                    }
                    // 如果此时元素的display状态还是none，则设置为浏览器初始display值
                    if (getComputedStyle(content).display == 'none') {
                        content.style.display = 'revert';
                    }
                }
                // 移除事件
                this.removeEventListener('connected', funVisible);
            };

            // 如果是 Element 元素，保证显示
            if (this.isConnectedCallback) {
                funVisible();
            } else {
                this.addEventListener('connected', funVisible);
            } 
        }
    }

    get radius () {
        let radius = this.getAttribute('radius');
        if (!isNaN(radius) && !isNaN(parseFloat(radius))) {
            radius = radius + 'px';
        }
        return radius;
    }

    set radius (val) {
        if (val === true || val === false) {
            this.toggleAttribute('radius', val);
            return;
        }
        this.setAttribute('radius', val);
    }

    get height () {
        let height = this.getAttribute('height');
        if (!isNaN(height) && !isNaN(parseFloat(height))) {
            height = height + 'px';
        }
        return height;
    }

    set height (val) {
        this.setAttribute('height', val);
    }

    get width () {
        let width = this.getAttribute('width');
        if (!isNaN(width) && !isNaN(parseFloat(width))) {
            width = width + 'px';
        }
        return width;
    }

    set width (val) {
        this.setAttribute('width', val);
    }

    // 参数批量设置
    setParams (params) {
        if (!params || !Object.keys(params).length) {
            return;
        }
        // 参数赋予
        for (let key in params) {
            if (typeof params[key] == 'function') {
                this.addEventListener(key.toLowerCase().replace(/^on/, ''), () => {
                    params[key]();
                });
            } else {
                this[key] = params[key];
            }
        }

        // overlay 的处理
        let eleOverlay = this.element && this.element.overlay;
        if (typeof params.overlay == 'string') {
            this.setAttribute('overlay', params.overlay);
        } else if (typeof params.overlay == 'object' && eleOverlay) {
            for (let keyOverlay in params.overlay) {
                eleOverlay[keyOverlay] = params.overlay[keyOverlay];
            }
        }

        // 样式的处理
        let eleContainer = this.element && this.element.container;
        if (typeof params.style == 'object' && eleContainer) {
            for (let keyStyle in params.style) {
                if (typeof keyStyle == 'string') {
                    // setProperty 不支持驼峰命名属性，转换成短横线方式
                    let strKeyStyle = keyStyle.replace(/([a-z])([A-Z])/, function (_, $1, $2) {
                        return [$1, $2.toLowerCase()].join('-');
                    });

                    eleContainer.style.setProperty(strKeyStyle, params.style[keyStyle]);
                }
            }
        }
    }

    renderAttribute (name, keep) {
        if (!name || name == 'open') {
            return;
        }

        let attrName = name.replace(/\-(\w)/g, (_, $1) => {
            return $1.toUpperCase();
        });

        if (attrName == 'closeIcon' && this[attrName] && /^(?:#|\.)?(?:\w|-)+$/.test(this[attrName].replace(/\s/g, ''))) {
            // 如果是选择器
            // 这里算是针对特殊功能的冗余处理
            if (/^(?:#|\.)(?:\w|-)+$/.test(this[attrName].replace(/\s/g, ''))) {
                let eleMatch = this.querySelector(this[attrName]);
                if (eleMatch && !eleMatch.isBindClose) {
                    this.element.close.style.display = 'none';
                    eleMatch.addEventListener('click', () => {
                        this.element.close.click();
                    });
                    eleMatch.isBindClose = true;
                }
            }
            return;
        }

        if (this[attrName]) {
            this.style.setProperty('--ui-popup-' + name, this[attrName]);
        } else if (!keep) {
            this.style.removeProperty('--ui-popup-' + name);
        }
    }

    render () {
        UiPopup.observedAttributes.forEach(attr => {
            this.renderAttribute(attr, true);
        });
    }

    attributeChangedCallback (name) {
        this.renderAttribute(name);
    }

    zIndex () {
        // 只对同级元素进行层级最大化计算处理
        // 这里使用了 overlay 中的方法
        this.element.overlay.zIndex.call(this);
    }

    attributeChangedCallback (name) {
        // 让按钮或者之前的触发元素重新获取焦点，便于继续操作
        if (name == 'open') {
            // 组件的 z-index 层级计算
            if (this.open) {
                this.zIndex();
                this.render();
            }
            // 覆盖层的显隐状态和弹出层一致
            this.element.overlay.open = this.open;
        }
    }

    connectedCallback () {
        // 属性与样式渲染
        this.render();

        // 是否显示覆盖层
        let eleOverlay = this.element.overlay;
        if (this.overlay) {
            // 是否显示
            eleOverlay.open = this.open;
            // 是否有动画
            eleOverlay.fade = this.transition;
            // 是否滚动锁定
            if (this.touch) {
                eleOverlay.touch = this.touch;
            }
            // 其他参数设置
            let strOverlay = this.getAttribute('overlay');
            // 字符串参数应用到覆盖层上，例如
            // overlay="color: #fff0" => <ui-overlay color="#fff0">
            strOverlay.trim().replace(/\{|\}/g, '').split(',').forEach(parts => {
                if (/:/.test(parts)) {
                    eleOverlay[parts.split(':')[0].trim()] = parts.split(':')[1].trim();
                }
            });
            // 无障碍访问提示
            eleOverlay.setAttribute('aria-label', '弹出层后方的覆盖层' + (eleOverlay[eleOverlay.mode] ? '，点击关闭弹出层': ''));
            // 载入
            this.prepend(eleOverlay);
            // 如果没有指定模式
            // 或者都是默认的模式
            // 则将覆盖层的隐藏行为冒泡到弹出层
            if (!eleOverlay.hasAttribute('mode') || /^(?:hide|remove)$/.test(eleOverlay.mode)) {
                eleOverlay.mode = 'bubbling';
                eleOverlay.bubbling = () => {
                    if (this[this.mode]) {
                        this[this.mode]();
                    }
                }
            }
        }

        // 是否显示关闭按钮
        let eleClose = this.element.close;
        if (this.closeable && this.contains(eleClose) == false) {
            this.element.container.prepend(eleClose);
        }

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-popup'
            }
        }));

        this.isConnectedCallback = true;
    }

    remove () {
        let eleContainer = this.element.container;

        if (this.transition) {
            const funRemove = () => {
                if (this.parentElement) {
                    this.parentElement.removeChild(this);
                }
                eleContainer.removeEventListener('transitionend', funRemove);
            };
            eleContainer.addEventListener('transitionend', funRemove);
        } else if (this.parentElement) {
            this.parentElement.removeChild(this);
        }

        this.open = false;

        this.dispatchEvent(new CustomEvent('remove'));
    }

    show () {
        // 从内存中取出
        if (document.body.contains(this) == false) {
            document.body.append(this);
            // 让过渡效果有效
            if (this.transition) {
                this.offsetHeight;
            }
        }

        this.open = true;

        this.dispatchEvent(new CustomEvent('show'));
    }

    hide () {
        this.open = false;

        this.dispatchEvent(new CustomEvent('hide'));
    }
}

if (!customElements.get('ui-popup')) {
    customElements.define('ui-popup', UiPopup);
}

// 将该方法定义为 window 全局使用的方法
window.Popup = function (content, options) {
    // content 参数可选
    // 如果是纯对象，非严格判断，
    // 和 content 支持的其他类型区分即可
    if (typeof content == 'object' && !content.nodeName && !content.forEach) {
        options = content;
    }
    options = options || {};

    var defaults = {
        transition: true,
        overlay: {}
    };

    var params = Object.assign({}, defaults, options);

    // 默认禁止滚动
    if (typeof params.overlay.touch == 'undefined') {
        params.overlay.touch = 'none';
    }

    // 创建 <ui-popup> 元素
    let popup = new UiPopup();

    // 写入内容
    if (content) {
        popup.content = content;
    }

    // 提前 open=true 会影响 transition 动画的执行
    let isOpen = params.open;
    if (isOpen === true) {
        delete params.open;
    }

    // 设置参数
    popup.setParams(params);

    if (isOpen !== false) {
        setTimeout(() => {
            popup.show();
        }, 1);
    }    

    return popup;
};




    class UiProgress extends HTMLProgressElement {
        static get observedAttributes () {
            return ['color', 'height', 'radius', 'width', 'value', 'label'];
        }

        get color () {
            return this.getAttribute('color');
        }

        set color (val) {
            this.setAttribute('color', val);
        }

        get label () {
            return this.getAttribute('label');
        }

        set label (val) {
            this.setAttribute('label', val);
        }

        get radius () {
            let radius = this.getAttribute('radius');
            if (!isNaN(radius) && !isNaN(parseFloat(radius))) {
                radius = radius + 'px';
            }
            return radius;
        }

        set radius (val) {
            this.setAttribute('radius', val);
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        // 进度条进度信息显示
        setLabel () {
            let label = this.label;

            if (!label && label !== '') {
                return;
            }

            this.style.setProperty('--ui-progress-offset', Math.round(this.getBoundingClientRect().width * (this.value / this.max)));
            this.style.setProperty('--ui-progress-percent', Math.round((this.value / this.max) * 100) + '%');

            if (label == 'true' || label === '') {
                this.style.setProperty('--ui-progress-label', `'${Math.round((this.value / this.max) * 100) + '%'}'`);
                
            } else {
                // 自定义语法
                this.style.setProperty('--ui-progress-label', `'${new Function(...['max', 'value'], `return \`${label}\`;`)(...[this.max, this.value])}'`);
            }

            // 模拟 label 效果
            let eleLabel = this.element.label;
            if (eleLabel) {
                // 样式同步
                eleLabel.setAttribute('style', this.getAttribute('style'));
                eleLabel.className = this.className;
                // 尺寸和偏移处理
                // 按钮的尺寸和位置
                let objBoundSelect = this.getBoundingClientRect();
                // 尺寸设置
                eleLabel.style.width = objBoundSelect.width + 'px';
                eleLabel.style.height = objBoundSelect.height + 'px';
                // 偏移对比
                let objBoundTrigger = eleLabel.getBoundingClientRect();
                let objStyleTrigger = getComputedStyle(eleLabel);
                // 目前的偏移
                let numOffsetX = objStyleTrigger.getPropertyValue('--ui-offset-x') || 0;
                let numOffsetY = objStyleTrigger.getPropertyValue('--ui-offset-y') || 0;

                // 偏移误差
                let numDistanceX = objBoundSelect.left - objBoundTrigger.left;
                let numDistanceY = objBoundSelect.top - objBoundTrigger.top;

                // 设置新的偏移值
                eleLabel.style.setProperty('--ui-offset-x', Number(numOffsetX) + numDistanceX);
                eleLabel.style.setProperty('--ui-offset-y', Number(numOffsetY) + numDistanceY);
            }
        }

        renderAttribute (name, keep) {
            if (name === 'value' || name == 'label') {
                this.setLabel();
                return;
            }
            if (typeof this[name] == 'string') {
                this.style.setProperty('--ui-progress-' + name, this[name]);
            } else if (!keep) {
                this.style.removeProperty('--ui-progress-' + name);
            }
        }

        render () {
            UiProgress.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.render(name);
        }

        constructor () {
            super();

            if (!this.element) {
                this.element = {};
            }

            this.render();

            const propValue = Object.getOwnPropertyDescriptor(HTMLProgressElement.prototype, 'value');
            Object.defineProperty(UiProgress.prototype, 'value', {
                ...propValue,
                set (value) {
                    // 赋值
                    propValue.set.call(this, value);
                    // 触发渲染
                    this.renderAttribute('value');
                }
            });

            // Safari/Firefox 不支持伪元素，创建元素代替
            if (this.hasAttribute('label') && (CSS.supports('-moz-appearance:none') || !CSS.supports('text-align-last:justify'))) {
                let eleLabel = document.createElement('label');
                if (this.id) {
                    eleLabel.setAttribute('for', this.id);
                }
                eleLabel.setAttribute('is', 'ui-progress');
                // 暴露
                this.element.label = eleLabel;
            }

            // 观察尺寸变化
            let objResizeObserver = new ResizeObserver(() => {
                this.setLabel();
            });
            // 观察文本域元素
            objResizeObserver.observe(this);
        }

        connectedCallback () {
            // 插入到页面中
            let eleLabel = this.element.label;
            if (eleLabel) {
                this.insertAdjacentElement('beforebegin', eleLabel);
                // 定位和层级
                // 是否是静态定位
                if (getComputedStyle(eleLabel).position == 'static') {
                    eleLabel.style.position = 'absolute';
                }
                // 层级高一个
                let numZIndex = getComputedStyle(this).zIndex;
                if (typeof numZIndex == 'number') {
                    eleLabel.style.zIndex = numZIndex + 1;
                }

                this.setLabel();
            }

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-progress'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-progress')) {
        customElements.define('ui-progress', UiProgress, {
            extends: 'progress'
        });
    }



    class UiRadio extends HTMLInputElement {
        static get observedAttributes () {
            return ['extends', 'checked', 'disabled'];
        }

        get extends () {
            return this.hasAttribute('extends');
        }

        set extends (val) {
            this.toggleAttribute('extends', val);
        }

        render () {
            if (!this.extends) {
                return;
            }
            document.querySelectorAll(`[is="ui-radio"][extends][name="${this.name}"]`).forEach(radio => {
                [...radio.labels].forEach(label => {
                    label.classList[radio.checked ? 'add' : 'remove']('active');
                    label.classList[radio.disabled ? 'add' : 'remove']('disabled');
                    label.setAttribute('role', "button");
                });
            });
        }

        attributeChangedCallback () {
            this.render();
        }

        constructor () {
            super();

            // 事件处理
            this.addEventListener('change', () => {
                this.render();
            });

            this.render();

            const propChecked = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked');
            Object.defineProperty(UiRadio.prototype, 'checked', {
                ...propChecked,
                set (value) {
                    // 赋值
                    propChecked.set.call(this, value);
                    // 触发渲染
                    this.render();
                }
            });
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-radio'
                }
            }));

            this.isConnectedCallback = true;
        }
    }
    
    if (!customElements.get('ui-radio')) {
        customElements.define('ui-radio', UiRadio, {
            extends: 'input'
        });
    }



    class UiRange extends HTMLInputElement {

        static get observedAttributes () {
            return ['max', 'min', 'step', 'disabled'].concat(UiRange.observedUIAttributes);
        }

        static get observedUIAttributes () {
            return ['color', 'width', 'height', 'size'];
        }

        constructor () {
            super();

            this.originTips = this.getAttribute('tips');

            if (!this.element) {
                this.element = {};
            }
        }

        get defaultrange () {
            return this.getAttribute('range') || `${this.getAttribute('from') || this.min || 0}, ${this.getAttribute('to') || this.max || 100}`;
        }

        set multiple (value) {
            return this.toggleAttribute('multiple', value);
        }

        get multiple () {
            return this.getAttribute('multiple') !== null;
        }

        get from () {
            if (this.element.brother) {
                return Math.min(this.value, this.element.brother.value);
            }
            return '';
        }

        get to () {
            if (this.element.brother) {
                return Math.max(this.value, this.element.brother.value);
            }
            return '';
        }

        get range () {
            if (this.multiple) {
                return this.from + ',' + this.to;
            }
            return '';
        }

        get isFrom () {
            // 是否为起始range
            if (this.element.brother) {
                return this.value - this.element.brother.value < 0;
            }
            return false;
        }

        set from (v) {
            if (this.element.brother) {
                if (this.isFrom) {
                    this.value = v;
                } else {
                    this.element.brother.value = v;
                }
            }
        }

        set to (v) {
            if (this.element.brother) {
                if (!this.isFrom) {
                    this.value = v;
                } else {
                    this.element.brother.value = v;
                }
            }
        }

        set range (v) {
            if (this.multiple) {
                const [from, to] = v.split(',');
                this.to = to;
                this.from = from;
            }
        }

        set tips (value) {
            if (!value) {
                this.removeAttribute('tips');
                return;
            }

            if (!this.originTips) {
                this.originTips = value;
            }

            this.setAttribute('tips', value);
        }

        get tips () {
            const originTips = this.originTips;
            if (!originTips) {
                return null;
            }

            // 值
            return `${new Function(...['value'], `return \`${originTips}\`;`)(...[this.value])}`;
        }

        get color () {
            return this.getAttribute('color');
        }

        set color (val) {
            this.setAttribute('color', val);
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get size () {
            let size = this.getAttribute('size');
            if (!isNaN(size) && !isNaN(parseFloat(size))) {
                size = size + 'px';
            }
            return size;
        }

        set size (val) {
            this.setAttribute('size', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        setMultiple () {
            let eleBrother = this.element.brother;
            // 按钮的尺寸和位置
            let objBoundRange = this.getBoundingClientRect();
            // 尺寸设置
            eleBrother.style.width = objBoundRange.width + 'px';
            eleBrother.style.height = objBoundRange.height + 'px';
            // 偏移对比
            let objBoundTrigger = eleBrother.getBoundingClientRect();
            let objStyleTrigger = getComputedStyle(eleBrother);
            // 目前的偏移
            let numOffsetX = objStyleTrigger.getPropertyValue('--ui-offset-x') || 0;
            let numOffsetY = objStyleTrigger.getPropertyValue('--ui-offset-y') || 0;

            // 偏移误差
            let numDistanceX = objBoundRange.left - objBoundTrigger.left;
            let numDistanceY = objBoundRange.top - objBoundTrigger.top;

            console.log(objBoundRange.left, objBoundTrigger.left);

            // 设置新的偏移值
            eleBrother.style.setProperty('--ui-offset-x', Number(numOffsetX) + numDistanceX);
            eleBrother.style.setProperty('--ui-offset-y', Number(numOffsetY) + numDistanceY);
        }

        connectedCallback () {
            // 一些事件
            this.addEventListener('input', this.renderPosition);
            this.addEventListener('touchstart', this.stopPropagation);

            let eleBrother = this.element.brother;

            // 使组件 [is="ui-range"] 一直存在
            if (this.getAttribute('is') === null) {
                this.setAttribute('is', 'ui-range');
            }

            // 区间选择
            if (this.multiple && !eleBrother && this.getAttribute('rel') !== 'brother') {
                eleBrother = this.cloneNode(false);
                eleBrother.removeAttribute('id');
                eleBrother.originTips = this.originTips;
                eleBrother.element = {
                    brother: this
                };
                this.element.brother = eleBrother;
                // 载入到页面中
                this.before(eleBrother);
                // 初始化一个前后关系
                eleBrother.setAttribute('rel', 'brother');
                // 范围
                this.range = this.defaultrange;

                // 尺寸观察
                // 观察尺寸变化
                let objResizeObserver = new ResizeObserver(() => {
                    // 尺寸和偏移处理
                    this.setMultiple();
                });
                // 观察文本域元素
                objResizeObserver.observe(this);
            }            

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-range'
                }
            }));

            this.isConnectedCallback = true;

            this.render();

            if (eleBrother && eleBrother.getAttribute('rel') == 'brother') {
                // 默认先计算下尺寸和位置
                this.setMultiple();
            }

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }

        disconnectedCallback () {
            this.removeEventListener('input', this.renderPosition);
            this.removeEventListener('touchstart', this.stopPropagation);

            if (this.element.brother && !this.exchange) {
                this.element.brother.remove();
            }
        }

        stopPropagation (ev) {
            ev.stopPropagation();
        }

        attributeChangedCallback (name, oldValue, newValue) {
            if (oldValue !== newValue) {
                if (name === 'disabled' && this.element.brother) {
                    this.element.brother.disabled = newValue !== null;
                } else if (['color', 'width', 'height'].includes(name)) {
                    this.renderAttribute(name);
                } else {
                    this.renderPosition();
                }
            }
        }

        renderAttribute (name, keep) {
            if (this[name] || typeof this[name] == 'string') {
                this.style.setProperty('--ui-range-' + name, this[name]);
                // 关键字值不处理
                if (name == 'size' && /^[a-z]+$/i.test(String(this[name]))) {
                    this.style.removeProperty('--ui-range-' + name);
                }
            } else if (!keep) {
                this.style.removeProperty('--ui-range-' + name);
            }
        }

        renderPosition () {
            const max = this.max || 100;
            const min = this.min || 0;
            this.style.setProperty('--percent', (this.value - min) / (max - min));

            this.tips = this.tips;

            this.style.setProperty('--from', this.from);
            this.style.setProperty('--to', this.to);

            const eleBrother = this.element.brother;

            if (eleBrother) {
                eleBrother.style.setProperty('--from', this.from);
                eleBrother.style.setProperty('--to', this.to);
            }
        }

        render () {
            this.renderPosition();
            UiRange.observedUIAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        addEventListener (...par) {
            document.addEventListener.apply(this, par);
            if (this.element.brother) {
                document.addEventListener.apply(this.element.brother, par);
            }
        }
    }

    const props = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(UiRange.prototype, 'value', {
        ...props,
        set (v) {
            props.set.call(this, v);
            // 重新渲染
            this.renderPosition();
        }
    });

    if (!customElements.get('ui-range')) {
        customElements.define('ui-range', UiRange, {
            extends: 'input'
        });
    }


// ui tab custom HTML
class UiRel extends HTMLElement {
    static get observedAttributes () {
        return ['open'];
    }

    constructor () {
        super();

        // 事件
        this.events();
    }

    get name () {
        return this.getAttribute('name');
    }
    set name (value) {
        this.setAttribute('name', value);
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get open () {
        return this.hasAttribute('open');
    }
    set open (value) {
        this.toggleAttribute('open', value);
    }

    get disabled () {
        return this.hasAttribute('disabled');
    }

    set disabled (val) {
        this.toggleAttribute('disabled', val);
    }

    onSwitch () {

    }

    switch () {
        let strName = this.name;
        let strTag = this.tagName.toLowerCase();
        let eleGroup = [];
        // 对应选项卡显示的处理
        if (strName) {
            eleGroup = document.querySelectorAll(strTag + '[name="' + strName + '"]');

            if (!this.open) {
                eleGroup.forEach(tab => {
                    if (tab.open) {
                        tab.open = false;
                    }
                });
                this.open = true;
            }
        } else {
            this.open = !this.open;
        }
    }

    // 初始化tab事件
    events () {
        // 点击切换
        this.addEventListener('click', (event) => {
            if (/^(:?javas|#)/.test(event.target.getAttribute('href'))) {
                event.preventDefault();
            }
            if (!this.disabled) {
                this.switch();
            }            
        }, false);
    }

    // ui-tab元素在页面出现的时候
    connectedCallback () {
        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: this.tagName.toLowerCase()
            }
        }));

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    
    attributeChangedCallback (name, newValue, oldValue) {
        if (name === 'open' && typeof newValue != typeof oldValue) {
            const eleTarget = document.getElementById(this.target);
            if (eleTarget) {
                eleTarget.classList[this.open ? 'add' : 'remove']('active');
            }

            // 当前元素的标签类型，因为可能是 ui-rel，也可能是 ui-tab
            let strTag = this.tagName.toLowerCase();

            if (this.open) {                
                this.setAttribute('aria-selected', 'true');
                this.dispatchEvent(new CustomEvent('show', {
                    detail: {
                        type: strTag
                    }
                }));
            } else {
                this.setAttribute('aria-selected', 'false');
                this.dispatchEvent(new CustomEvent('hide', {
                    detail: {
                        type: strTag
                    }
                }));
            }

            // 无论选项卡切换还是隐藏，都会触发switch事件
            this.dispatchEvent(new CustomEvent('switch'));
            // 对外预留的钩子
            this.onSwitch();
        }
    }
}

// 定义 <ui-rel>
if (!customElements.get('ui-rel')) {
    customElements.define('ui-rel', UiRel);
}

// 暴露对外



// ui tab custom HTML
class UiTab extends UiRel {
    get history () {
        return this.hasAttribute('history');
    }
    set history (value) {
        this.toggleAttribute('history', value);
    }

    // 自动切换
    onSwitch () {
        let eleTarget = document.getElementById(this.target);

        // 自动播放
        const location = window.location;

        let strName = this.name;

        // 历史记录的处理
        if (this.history == true && strName && /tab\d{10,16}/.test(strName) == false && this.open) {
            if (!eleTarget) {
                return;
            }
            let strId = eleTarget.id;

            // url地址查询键值对替换
            const objURLParams = new URLSearchParams(location.search);
            // 改变查询键值，有则替换，无则新增
            objURLParams.set(strName, strId);

            // hash优化，去除重复的hash
            let strHash = location.hash;
            if (strId == strHash) {
                location.hash = strHash = '';
            }

            // 改变当前URL
            window.history.replaceState(null, document.title, location.href.split('?')[0] + '?' + objURLParams.toString() + strHash);
        }
    }

    // ui-tab元素在页面出现的时候
    connectedCallback () {
        if (!this.closest('a, button') && !this.querySelector('a, button')) {
            this.setAttribute('tabindex', '0');
        }

        // 无障碍设置
        this.setAttribute('role', 'tab');

        let eleTarget = document.getElementById(this.target);
        if (eleTarget) {
            eleTarget.setAttribute('role', 'tabpanel');
        }

        // URL查询看看能不能获取到记录的选项卡状态信息
        let objURLParams = new URLSearchParams(window.location.search);
        objURLParams.forEach((value, key) => {
            if (eleTarget && this.name == key && eleTarget.id == value && !this.open) {
                this.click();
            }
        });

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-tab'
            }
        }));

        this.isConnectedCallback = true;

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }
}


// 定义ui-tab
if (!customElements.get('ui-tab')) {
    customElements.define('ui-tab', UiTab);
}


class UiTabs extends HTMLElement {
    constructor () {
        super();

        // this.addEventListener('switch', event => {
        //     let eleTarget = event.target;
        //     let eleTab = eleTarget && eleTarget.closest('ui-tab');
        //     if (eleTab && !eleTab.disabled) {
        //         this.setVar(eleTab);

        //         // 触发事件
        //         this.dispatchEvent(new CustomEvent('switch'));
        //     }
        // });

        this.setAttribute('role', 'tablist');

        // 尺寸变化时候，位置重新调整
        let ro = new ResizeObserver(() => {
            this.setVar(this.selectedTab);
        });
        ro.observe(this);
    }

    get selectedTab () {
        return this.querySelector('ui-tab[open]');
    }

    set selectedTab (tab) {
        if (tab && tab.switch) {
            tab.switch();
        }
    }

    get selectedIndex () {
        return [...this.tabs].indexOf(this.selectedTab);
    }

    set selectedIndex (index) {
        this.selectedTab = this.tabs[index];
    }

    get tabs () {
        return this.querySelectorAll('ui-tab');
    }

    set tabs(vals) {
        if (vals) {
            this.append.apply(this, [...vals]);
        }
    }

    setVar (tab) {
        let numLeftTab = tab.offsetLeft;
        let numWidthTab = tab.clientWidth;
        // 获取标签里面文字内容的宽度
        let div = document.createElement('div');
        div.style.position = 'absolute';
        div.textContent = tab.textContent;
        tab.append(div);
        let numWidthText = div.clientWidth;

        // 设置变量尺寸和偏移
        this.style.setProperty('--ui-tab-width', numWidthText);
        this.style.setProperty('--ui-tab-left', numLeftTab + (numWidthTab - numWidthText) / 2);

        // 用完就扔掉
        div.remove();

        // 进入视区中心位置
        let numWidthTabs = this.offsetWidth;
        let numScrollLeft = this.scrollLeft;
        // 无论在什么位置，都往中心靠
        // 如果可以滚动，会定位
        // 如果滚动不了，反正没有任何反应
        this.scrollLeft = this.scrollLeft + (numLeftTab - numScrollLeft - numWidthTabs / 2 + numWidthTab / 2);
    }

    connectedCallback () {
        // 如果内部的 <ui-tab> 元素没有 name，自动添加 name
        let eleTabs = this.tabs;
        if (eleTabs.length && !this.querySelector('ui-tab[name]')) {
            let strName = this.id || 'lu_' + setTimeout(0);
            eleTabs.forEach(tab => {
                tab.name = strName;

                if (tab.open) {
                    this.setVar(tab);
                }

                tab.addEventListener('show', () => {
                    this.setVar(tab);
                    // 触发事件
                    this.dispatchEvent(new CustomEvent('switch'));
                });
            });
        }
    }
}

if (!customElements.get('ui-tabs')) {
    customElements.define('ui-tabs', UiTabs);
}

// 只有type=module的时候可以用，否则会报错


class uiScrollSnapCell extends HTMLElement {   
    constructor () {
        super();

        this.element = this.element || {};
    }

    create () {
        // 按钮的尺寸，布局计算的处理
        let eleButtons = this.element.buttons;
        let numWidthButton = 0;
        let numLengthButton = eleButtons.length;
        if (numLengthButton) {
            [...eleButtons].reverse().forEach((button, index) => {
                let offsetWidth = button.offsetWidth;
                button.style.setProperty('--ui-offset-width', numWidthButton);
                button.style.setProperty('--ui-offset-index', index + 1);
                // 宽度增加
                numWidthButton = numWidthButton + offsetWidth;
            });

            // 创建占据空间的元素
            let eleCell = document.createElement('ui-cell');
            eleButtons[0].insertAdjacentElement('beforebegin', eleCell);
            this.style.setProperty('--ui-cell-width', numWidthButton + 'px');
            // 暴露在外
            this.space = this.cell = eleCell;

            this.addEventListener('scroll', () => {
                this.style.setProperty('--ui-offset-percent', (this.scrollLeft / numWidthButton).toFixed(2));
            });
        }
    }

    connectedCallback () {

        // 获取按钮元素
        this.element.buttons = this.querySelectorAll(':scope > button');

        this.create();
    }
}

if (!customElements.get('ui-scroll-snap-cell')) {
    customElements.define('ui-scroll-snap-cell', uiScrollSnapCell);
}


class uiScrollSnap extends HTMLElement {
    constructor () {
        super();

        this.events();
    }

    static get observedAttributes () {
        return ['loop', 'type', 'stop', 'align', 'padding'];
    }

    set type (value) {
        this.setAttribute('type', value);
    }

    get type () {
        let type = 'both';
        if (this.closest('ui-scroll-snap-swipe')) {
            type = 'x mandatory';
        }
        return this.getAttribute('type') || type;
    }

    set stop (value) {
        this.setAttribute('stop', value);
    }

    get stop () {
        return this.getAttribute('stop') || 'normal';
    }

    set loop (value) {
        this.toggleAttribute('loop', value);
    }

    get loop () {
        return this.hasAttribute('loop');
    }

    set align (value) {
        if (value == 'center') {
            value = 'centre';
        }
        this.setAttribute('align', value);
    }

    get align () {
        let align = this.getAttribute('align');
        if (align !== 'start' || align !== 'end') {
            align = 'center';
        }
        return align;
    }

    appendItemForScroll () {
        if (this.isAppendItem) {
            return;
        }
        let eleOriginItems = this.items;
        // 方向
        let type = this.type;

        // 循环滚动不支持双向
        // 要么垂直滚动，要么水平滚动
        var size = 'height';
        var scroll = 'top';

        if (type.split(/\s/).includes('x')) {
            size = 'width';
            scroll = 'left';
        }

        // 首字母大写
        let sizeUpper = size.replace(/^[a-z]/, function (matches) {
            return matches.toUpperCase();
        });
        let scrollUpper = scroll.replace(/^[a-z]/, function (matches) {
            return matches.toUpperCase();
        });

        // 此时的 items
        let clientSize = this['client' + sizeUpper];
        let scrollSize = this['scroll' + sizeUpper];

        // 如果滚动尺寸不足，没有必要无限滚动，不处理
        if (scrollSize <= clientSize) {
            return;
        }

        // 如果滚动位置不足
        let eleFragmentAfter = document.createDocumentFragment();
        let eleFragmentBefore = document.createDocumentFragment();

        [...eleOriginItems].forEach(item => {
            let cloneItem1 = item.cloneNode(true);
            let cloneItem2 = item.cloneNode(true);

            // 去除 selected 状态
            cloneItem1.removeAttribute('selected');
            cloneItem2.removeAttribute('selected');

            // DOM 片段组装
            eleFragmentAfter.appendChild(cloneItem1);
            eleFragmentBefore.appendChild(cloneItem2);
        });

        this.prepend(eleFragmentBefore);
        this.append(eleFragmentAfter);

        // 第一个和最后一个元素
        let eleCurrentItem = this.querySelectorAll('ui-scroll-snap-item');
        let lastItem = eleCurrentItem[eleCurrentItem.length - 1];

        // 定位
        let offset = eleOriginItems[0]['offset' + scrollUpper] - this['offset' + scrollUpper];
        this['scroll' + scrollUpper] = offset;

        // 判断滚动的方向
        let lastScroll = offset;

        // 滚动事件
        this.addEventListener('scroll', () => {
            let scrollValue = this['scroll' + scrollUpper];

            // 尺寸重新
            clientSize = this['client' + sizeUpper];
            scrollSize = this['scroll' + sizeUpper];

            if (scrollValue < lastScroll && scrollValue == 0) {
                if (this.onScrollStart) {
                    this.onScrollStart(eleCurrentItem, eleOriginItems, offset);
                }
                this.style.scrollBehavior = 'auto';
                this['scroll' + scrollUpper] = offset;
            } else if (scrollValue > lastScroll && scrollValue >= (scrollSize - clientSize - 1)) {
                if (this.onScrollEnd) {
                    this.onScrollEnd(eleCurrentItem, eleOriginItems, offset);
                }
                this.style.scrollBehavior = 'auto';
                // 偏移一整个原始 items 的高度
                this['scroll' + scrollUpper] -= (lastItem['offset' + scrollUpper] - eleOriginItems[eleOriginItems.length - 1]['offset' + scrollUpper]);
            }

            lastScroll = this['scroll' + scrollUpper];

            // 移除 selected 元素
            let eleItemSelected = this.querySelector('ui-scroll-snap-item[selected]');
            if (eleItemSelected) {
                eleItemSelected.selected = false;
            }

            // 还原是否平滑滚动
            setTimeout(() => {
                this.style.scrollBehavior = '';
            }, 1);
        });

        if (this.onScrollInited) {
            this.onScrollInited(eleCurrentItem, eleOriginItems, offset);
        }

        this.isAppendItem = true;
    }

    // 滚动事件处理
    events () {
        // 元素匹配偏移值
        let numOffsetMatch = 5;

        // 滚动事件执行
        this.addEventListener('scroll', () => {
            clearTimeout(this.timerScroll);
            this.timerScroll = setTimeout(() => {
                // 方向
                let type = this.type;

                // 循环滚动不支持双向
                // 要么垂直滚动，要么水平滚动
                var size = 'height';
                var dir = 'top';

                if (type.split(/\s/).includes('x')) {
                    size = 'width';
                    dir = 'left';
                }
                // 容器相关计算点
                let boundSnap = this.getBoundingClientRect();

                // 100毫秒内滚动事件没触发，认为停止滚动了
                // 对列表元素进行位置检测
                [].slice.call(this.children).forEach((eleList, index) => {
                    // 对齐方式
                    let align = eleList.align || this.align;

                    // 容器对比位置
                    let pointSnap = boundSnap[dir] + boundSnap[size] / 2;
                    if (align == 'start') {
                        pointSnap = boundSnap[dir];
                    } else if (align == 'end') {
                        pointSnap = boundSnap[dir] + boundSnap[size];
                    }
                    // 列表的尺寸和定位
                    let boundList = eleList.getBoundingClientRect();
                    // 列表元素对比点
                    let pointList = boundList[dir] + boundList[size] / 2;
                    if (align == 'start') {
                        pointList = boundList[dir];
                    } else if (align == 'end') {
                        pointList = boundList[dir] + boundSnap[size];
                    }

                    // 如果和目标距离小于指定偏移
                    if (Math.abs(pointList - pointSnap) < numOffsetMatch) {
                        // 添加标志类名
                        eleList.selected = true;
                        // 触发事件
                        this.dispatchEvent(new CustomEvent('scrollEnd', {
                            detail: {
                                index: index,
                                item: eleList
                            }
                        }));
                    } else {
                        eleList.selected = false;
                    }
                });
            }, 100);
        });
    }

    attributeChangedCallback (name) {
        if (name === 'loop' && this.loop) {
            this.appendItemForScroll();
        }
    }

    connectedCallback () {
        this.items = this.querySelectorAll('ui-scroll-snap-item');

        if (this.loop) {
            this.appendItemForScroll();
        }
    }
}

if (!customElements.get('ui-scroll-snap')) {
    customElements.define('ui-scroll-snap', uiScrollSnap);
}

class uiScrollSnapItem extends HTMLElement {
    static get observedAttributes () {
        return ['margin', 'align'];
    }
    constructor () {
        super();

        this.addEventListener('click', function () {
            let href = this.href;
            if (href) {
                location.href = href;
            }
        });
    }
    set align (value) {
        this.setAttribute('type', value);
    }

    get align () {
        return getComputedStyle(this).scrollSnapAlign || 'center';
    }

    set selected (value) {
        this.toggleAttribute('selected', value);
    }

    get selected () {
        return this.hasAttribute('selected');
    }

    set disabled (value) {
        this.toggleAttribute('disabled', value);
    }

    get disabled () {
        return this.hasAttribute('disabled');
    }

    get href () {
        return this.getAttribute('href');
    }

    set href (value) {
        this.setAttribute('href', value);
    }

    // 选中元素的重定位
    position () {
        const eleSnap = this.snap;
        // 定位
        if (eleSnap && this.selected) {
            let align = this.align;

            // 方向
            let type = eleSnap.type;

            // 循环滚动不支持双向
            // 要么垂直滚动，要么水平滚动
            var size = 'height';
            var dir = 'top';
            var scrollDir = 'scrollTop';

            if (type.split(/\s/).includes('x')) {
                size = 'width';
                dir = 'left';
                scrollDir = 'scrollLeft';
            }

            // 定位
            let scrollDistance = eleSnap[scrollDir];

            // 偏移定位距离
            let scrollOffset = 0;

            // 计算应该偏移的距离
            let boundSnap = eleSnap.getBoundingClientRect();
            let boundList = this.getBoundingClientRect();

            // 默认是居中定位
            scrollOffset = (boundSnap[dir] + boundSnap[size] / 2) - (boundList[dir] + boundList[size] / 2);

            if (align == 'start') {
                scrollOffset = boundSnap[dir] - boundList[dir];
            } else if (align == 'end') {
                scrollOffset = (boundSnap[dir] + boundSnap[size]) - (boundList[dir] + boundList[size]);
            }

            eleSnap[scrollDir] = scrollDistance - scrollOffset;
        }
    }

    connectedCallback () {
        this.snap = this.closest('ui-scroll-snap');

        if (!this.snap) {
            return this;
        }

        this.position();

        // 如果有链接行为
        if (this.hasAttribute('href')) {
            this.setAttribute('role', 'link');
        }
    }
}

if (!customElements.get('ui-scroll-snap-item')) {
    customElements.define('ui-scroll-snap-item', uiScrollSnapItem);
}



class uiScrollSnapSwipe extends HTMLElement {
    constructor () {
        super();
    }

    get snap () {
        return this.querySelector('ui-scroll-snap');
    }

    set snap (val) {
        this.append(val);
    }

    get autoplay () {
        let strAttrAutoplay = this.getAttribute('autoplay');
        if (typeof strAttrAutoplay !== 'string') {
            return false;
        }
        if (/^\d+$/.test(strAttrAutoplay)) {
            return strAttrAutoplay * 1;
        }

        return 3000;
    }
    set autoplay (value) {
        if (!value && value !== '') {
            this.removeAttribute('autoplay');
        } else {
            this.setAttribute('autoplay', value);
        }
    }

    create () {
        // 创建点点点元素
        let eleControl = this.querySelector('ui-swipe-control');

        if (!eleControl) {
            eleControl = document.createElement('ui-swipe-control');
            this.append(eleControl);
        }
        // 清空
        eleControl.innerHTML = '';
        
        // 根据 item 数量 创建圈圈数量
        let eleSnap = this.snap;
        let eleSnapItems = eleSnap.querySelectorAll('ui-scroll-snap-item');

        // 元素创建
        let eleControlItems = [...eleSnapItems].map(ele => {
            let eleItem = document.createElement('ui-swipe-control-item');
            if (ele.selected) {
                eleItem.setAttribute('selected', '');
            }

            eleControl.append(eleItem);

            return eleItem;
        });

        // 元素暴露
        this.control = eleControl;
        this.controlItems = eleControlItems;

        // 事件处理
        eleSnap.addEventListener('scrollEnd', (event) => {
            let detail = event.detail;
            // 改变选中的点点
            eleControlItems.forEach((item, index) => {
                if (detail.index % eleSnapItems.length === index) {
                    item.setAttribute('selected', '');
                } else {
                    item.removeAttribute('selected');
                }
            });

            // 继续自动播放
            this.autoSwipe();
        });

        eleSnap.addEventListener('scroll', () => {
            clearTimeout(this.timer);
        });

        if (!eleControl.querySelector('[selected]')) {
            eleControlItems[0].toggleAttribute('selected');
        }
    }

    // 自动切换
    autoSwipe () {
        // 自动播放时间
        let numTimeAutoplay = this.autoplay;
        // snap 主体元素
        let eleSnap = this.snap;
        // 子项
        let eleSnapItems = eleSnap.querySelectorAll('ui-scroll-snap-item');

        if (numTimeAutoplay && eleSnapItems.length) {
            clearTimeout(this.timer);
            // 当前选中元素
            let indexItem = [...eleSnapItems].findIndex(item => {
                return item.hasAttribute('selected');
            });
            indexItem++;
            if (indexItem >= eleSnapItems.length) {
                indexItem = 0;
            }
            this.timer = setTimeout(() => {
                eleSnapItems[indexItem].selected = true;
                eleSnapItems[indexItem].position();
                // 自动播放
                this.autoSwipe();
            }, numTimeAutoplay);
        }
    }

    connectedCallback () {
        let eleSnap = this.snap;
        if (eleSnap) {
            // 设置必要的 swipe 切换属性
            eleSnap.type = 'x mandatory';
            // 元素创建
            this.create();
            // 设置为无限循环切换
            eleSnap.loop = true;
            // 每次只滚一个
            eleSnap.stop = true;
            // 自动切换
            this.autoSwipe();
        }
    }
}

if (!customElements.get('ui-scroll-snap-swipe')) {
    customElements.define('ui-scroll-snap-swipe', uiScrollSnapSwipe);
}



class uiScrollSnapTab extends HTMLElement {
    constructor () {
        super();
    }

    // 目标元素的设置与获取
    get target () {
        return this.getAttribute('target');
    }
    set target (value) {
        this.setAttribute('target', value);
    }

    get snap () {
        let target = this.target;

        if (target) {
            return document.getElementById(target);
        }

        return this.querySelector('ui-scroll-snap');
    }

    set snap (val) {
        this.append(val);
    }

    events () {
        let eleSnap = this.snap;
        let eleTabs = this.querySelector('ui-tabs');
        let eleSnapItems = eleSnap && eleSnap.items;

        if (eleSnap && !eleSnap.isEventBind) {
            // 设置必要的切换属性
            eleSnap.type = 'x mandatory';
            eleSnap.toggleAttribute('smooth', true);
            eleSnap.stop = true;
            // 滚动结束时候的选项卡处理
            eleSnap.addEventListener('scrollEnd', (event) => {
                let indexTab = event.detail && event.detail.index;
                if (typeof indexTab == 'number' && eleTabs) {
                    eleTabs.selectedIndex = indexTab;
                }
            });

            // 元素创建
            eleSnap.isEventBind = true;
        }

        if (eleTabs && !eleTabs.isEventBind) {
            eleTabs.addEventListener('switch', () => {
                let selectedIndex = eleTabs.selectedIndex;
                // 对于的面板元素定位
                if (eleSnapItems && eleSnapItems[selectedIndex]) {
                    eleSnapItems[selectedIndex].selected = true;
                    eleSnapItems[selectedIndex].position();
                }

                // 触发切换事件处理
                this.dispatchEvent(new CustomEvent('switch', {
                    detail: {
                        index: selectedIndex
                    }
                }));
            });

            eleTabs.isEventBind = true;
        }
    }

    connectedCallback () {
        this.events();
    }
}

if (!customElements.get('ui-scroll-snap-tab')) {
    customElements.define('ui-scroll-snap-tab', uiScrollSnapTab);
}




    class UiSelect extends HTMLSelectElement {

        static get observedAttributes () {
            return ['width', 'height', 'radius', 'open', 'color'];
        }

        constructor () {
            super();

            // 关联的元素们
            if (!this.element) {
                this.element = {
                    trigger: null,
                    popup: null
                };
            }
            // 尺寸变化的观察器
            this.resizeObserver = null;
            this.intersectionObserver = null;

            // 重置原生的属性
            this.setProperty();
        }

        set popup (value) {
            this.toggleAttribute('popup', Boolean(value));

            // 弹出选择层的动态处理
            if (!this.element.popup) {
                this.create();
                this.events();
            }
        }
        get popup () {
            return this.hasAttribute('popup');
        }

        set open (value) {
            this.toggleAttribute('open', Boolean(value));
        }
        get open () {
            return this.hasAttribute('open');
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        get font () {
            let fontSize = this.getAttribute('font');
            if (!isNaN(fontSize) && !isNaN(parseFloat(fontSize))) {
                fontSize = fontSize + 'px';
            }
            return fontSize;
        }

        set font (val) {
            this.setAttribute('font', val);
        }

        get color () {
            return this.getAttribute('color');
        }

        set color (val) {
            this.setAttribute('color', val);
        }

        get radius () {
            let radius = this.getAttribute('radius');
            if (!isNaN(radius) && !isNaN(parseFloat(radius))) {
                radius = radius + 'px';
            }
            return radius;
        }

        set radius (val) {
            this.setAttribute('radius', val);
        }

        // 创建必要的元素
        create () {
            // trigger 元素
            if (!this.element.trigger && this.hasAttribute('trigger')) {
                this.element.trigger = document.getElementById(this.getAttribute('trigger'));
            }

            if (!this.element.trigger) {
                // 浮在原生下拉框上的元素
                let eleTrigger = document.createElement('ui-select');
                eleTrigger.setAttribute('is', 'ui-select');

                // 插入到前面
                this.insertAdjacentElement('beforebegin', eleTrigger);

                // 是否是静态定位
                if (getComputedStyle(eleTrigger).position == 'static') {
                    eleTrigger.style.position = 'absolute';
                }
                // 层级高一个
                let numZIndex = getComputedStyle(this).zIndex;
                if (typeof numZIndex == 'number') {
                    eleTrigger.style.zIndex = numZIndex + 1;
                }

                // 和下拉元素关联
                this.element.trigger = eleTrigger;

                // 尺寸和定位
                this.resize();
            }

            // popup 元素创建
            if (!this.element.popup) {
                this.element.popup = new UiPopup({
                    transition: true,
                    overlay: {
                        touch: 'none'
                    },
                    radius: true,
                    width: 'calc(100% - 2rem)',
                    style: {
                        maxHeight: 'calc(100% - 10rem)'
                    }
                });
            }

            // DOM 创建完毕的事件
            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }

        
        refresh () {
            // 主要的几个元素
            let elePopup = this.element.popup;
            if (!elePopup) {
                return;
            }

            if (!this.options.length) {
                elePopup.content = '<div class="ui-select-empty">没有选项</div>';
                return;
            }

            // <select> 元素隐射
            // <optgroup> -> <ui-list>
            // <option> -> <ui-list-item>

            // 单选还是复选
            let type = 'radio';
            const isMutiple = this.multiple;
            if (isMutiple) {
                type = 'checkbox';
            }

            // 随机 name 值
            let name = ('n' + Math.random()).replace('0.', '');

            // 索引值
            let index = -1;

            // 最终的内容
            let funGetItem = (option) => {
                let eleList = document.createElement('ui-list-item');
                eleList.className = option.className;
                eleList.setAttribute('space', '');
                // 索引值递增
                // 作用是，当所有 option 都没有 value 的时候，通过
                // index 值进行选中匹配
                index++;
                // 里面的选择框
                eleList.innerHTML = `<input
                    type="${type}"
                    name="${name}"
                    value="${option.value}"
                    ${option.selected ? 'checked' : ''}
                    ${option.disabled ? 'disabled' : ''}
                    data-index="${index}"
                >${option.innerHTML}`;

                return eleList;
            };

            // 放在 form 元素中
            let eleForm = document.createElement('form');
            // 遍历处理
            [...this.children].forEach((child) => {
                let eleList = null;
                if (child.matches('optgroup')) {
                    eleList = document.createElement('ui-list');
                    if (child.label) {
                        eleList.setAttribute('label', child.label);
                    }
                    if (child.disabled) {
                        eleList.setAttribute('disabled', '');
                    }
                    eleList.className = child.className;
                    // 子元素处理
                    child.querySelectorAll('option').forEach(option => {
                        // 禁用覆盖到子元素
                        if (child.disabled) {
                            option.disabled = true;
                        }
                        eleList.appendChild(funGetItem(option));
                    });
                } else if (child.matches('option')) {
                    eleList = funGetItem(child);
                }

                eleForm.appendChild(eleList);
            });

            // 多选增加确定按钮
            if (isMutiple) {
                let eleListBtn = document.createElement('ui-flex');
                eleListBtn.innerHTML = `<button type="reset" is="ui-button" blank>重置</button>
                <hr v>
                <button type="button" is="ui-button" data-type="primary" blank>确定</button>`;
                eleForm.append(eleListBtn);
            }

            // 内容显示
            elePopup.content = eleForm
        }

        
        events () {
            const eleTrigger = this.element.trigger;
            const elePopup = this.element.popup;

            if (eleTrigger && elePopup) {
                eleTrigger.addEventListener('click', () => {
                    elePopup.show();
                });
                elePopup.addEventListener('show', () => {
                    this.refresh();
                });

                // 弹出层的列表选中处理
                const eleContainer = elePopup.element.container;
                eleContainer.addEventListener('click', event => {
                    let eleTarget = event.target;
                    if (!eleTarget || !eleTarget.type) {
                        return;
                    }

                    // 重置，原设想这里代码是不需要的
                    // 但是 click 执行比 reset 重置要快，
                    // 所以这里插了这个处理
                    if (eleTarget.type == 'reset') {
                        eleTarget.closest('form').reset();
                    }

                    if (eleTarget.type === 'radio') {
                        if (eleTarget.value) {
                            this.value = eleTarget.value;
                        } else {
                            this.selectedIndex = Number(eleTarget.dataset.index);
                        }
                    } else if (this.multiple) {
                        this.value = [...eleContainer.querySelectorAll(`[type="checkbox"]:checked`)].map(checkbox => {
                            return checkbox.value;
                        }).join();
                    }

                    // 触发元素的内容替换
                    let arrTextSelected = [];                    
                    [...this.options].forEach(option => {
                        if (option.selected)  {
                            arrTextSelected.push(option.innerHTML);
                        }
                    });
                    let nodeText = document.createTextNode(arrTextSelected.join() || eleTrigger.originText || '');
                    let isNodeText = [...eleTrigger.childNodes].some(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            node.parentNode.replaceChild(nodeText, node);
                            return true;
                        }
                        return false;
                    });
                    // 如果没有文本节点
                    if (!isNodeText) {
                        eleTrigger.prepend(nodeText);
                    }
                    // 隐藏弹出层
                    if (eleTarget.type != 'checkbox') {
                        elePopup.remove();
                    }                    
                });

                // 如果 trigger 元素非自主创建
                // 则定位什么的都不做观察处理
                if (eleTrigger.matches('ui-select[is="ui-select"]')) {
                    // 尺寸变化同步变化
                    this.resizeObserver = new ResizeObserver(() => {
                        this.resize();
                    });
                    this.resizeObserver.observe(this);

                    // 位置变化时候也跟踪
                    // 发生在进入视区和离开视区
                    this.intersectionObserver = new IntersectionObserver(() => {
                        this.resize();
                    });
                    this.intersectionObserver.observe(this);
                }
                eleTrigger.originText = eleTrigger.textContent;
            }
        }

        
        resize () {
            const objElement = this.element;
            let eleTrigger = objElement.trigger;

            if (!eleTrigger) {
                return;
            }

            // 按钮的尺寸和位置
            let objBoundSelect = this.getBoundingClientRect();
            // 尺寸设置
            eleTrigger.style.width = objBoundSelect.width + 'px';
            eleTrigger.style.height = objBoundSelect.height + 'px';
            // 偏移对比
            let objBoundTrigger = eleTrigger.getBoundingClientRect();
            let objStyleTrigger = getComputedStyle(eleTrigger);
            // 目前的偏移
            let numOffsetX = objStyleTrigger.getPropertyValue('--ui-offset-x') || 0;
            let numOffsetY = objStyleTrigger.getPropertyValue('--ui-offset-y') || 0;

            // 偏移误差
            let numDistanceX = objBoundSelect.left - objBoundTrigger.left;
            let numDistanceY = objBoundSelect.top - objBoundTrigger.top;

            // 设置新的偏移值
            eleTrigger.style.setProperty('--ui-offset-x', Number(numOffsetX) + numDistanceX);
            eleTrigger.style.setProperty('--ui-offset-y', Number(numOffsetY) + numDistanceY);
        }

        
        setProperty () {
            Object.defineProperty(this, 'value', {
                configurable: true,
                enumerable: true,
                writeable: true,
                get: () => {
                    let valArr = [];
                    [].slice.call(this.options).forEach((option) => {
                        if (option.selected) {
                            valArr.push(option.value);
                        }
                    });
                    return valArr.join();
                },
                set: (value) => {
                    let isMatch = false;
                    value = this.multiple ? value.split(',') : [value.toString()];
                    [].slice.call(this.options).forEach((option) => {
                        // 单选框模式下，如果多个值匹配，让第一个选中
                        // 如果没有下面这句，会最后一个匹配的选中
                        if (!this.multiple && isMatch) return;
                        if (value.indexOf(option.value) !== -1) {
                            option.selected = isMatch = true;
                        } else if (this.multiple) {
                            option.selected = false;
                        }
                    });

                    // 触发 change 事件
                    this.dispatchEvent(new CustomEvent('change'));
                }
            });

            const props = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');
            Object.defineProperty(HTMLSelectElement.prototype, 'selectedIndex', {
                ...props,
                set (v) {
                    if (this.options[v]) {
                        this.options[v].selected = true;
                    }
                }
            });
        }

        
        renderAttribute (name, keep) {
            if (typeof this[name] == 'string') {
                this.style.setProperty('--ui-select-' + name, this[name]);
            } else if (!keep) {
                this.style.removeProperty('--ui-select-' + name);
            }
        }

        render () {
            UiSelect.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        attributeChangedCallback (name) {
            this.render(name);
        }

        
        connectedCallback () {
            // 渲染
            if (this.popup) {
                this.create();
                this.events();
            }

            this.render();

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-select'
                }
            }));

            this.isConnectedCallback = true;
        }

        
        disconnectedCallback () {
            if (this.element.trigger) {
                this.element.trigger.remove();
            }
            if (this.element.popup) {
                this.element.popup.remove();
            }

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
        }
    }


    // 自定义元素注册
    if (!customElements.get('ui-select')) {
        customElements.define('ui-select', UiSelect, {
            extends: 'select'
        });
    }



    const INPUT = new UiInput();

    class UiTextarea extends HTMLTextAreaElement {
        static get observedAttributes () {
            return ['rows', 'height', 'width', 'label', 'font', 'minLength', 'maxLength'];
        }

        get label () {
            return this.getAttribute('label');
        }

        set label (val) {
            this.setAttribute('label', val);
            this.setAttribute('aria-label', val);
            if (!this.placeholder) {
                this.placeholder = val;
            }
        }

        get height () {
            let height = this.getAttribute('height');
            if (!isNaN(height) && !isNaN(parseFloat(height))) {
                height = height + 'px';
            }
            return height;
        }

        set height (val) {
            this.setAttribute('height', val);
        }

        get width () {
            let width = this.getAttribute('width');
            if (!isNaN(width) && !isNaN(parseFloat(width))) {
                width = width + 'px';
            }
            return width;
        }

        set width (val) {
            this.setAttribute('width', val);
        }

        count () {
            INPUT.count.call(this);
        }

        setLabel () {
            INPUT.setLabel.call(this);
        }

        attributeChangedCallback (name) {
            this.renderAttribute(name);
        }

        renderAttribute (name, keep) {
            INPUT.renderAttribute.call(this, name, keep);
        }

        render () {
            UiTextarea.observedAttributes.forEach(attr => {
                this.renderAttribute(attr, true);
            });
        }

        constructor () {
            super();

            this.render();

            // 事件处理
            this.addEventListener('focus', function () {
                if (this.label) {
                    setTimeout(() => {
                        this.setLabel();
                    }, 16);
                }
            });
            this.addEventListener('blur', function () {
                if (this.label) {
                    setTimeout(() => {
                        this.setLabel();
                    }, 16);
                }
            });

            // 计数处理
            this.addEventListener('input', () => {
                this.count();
            });

            // 高度自动
            if (this.height == 'auto') {
                this.addEventListener('input', function () {
                    let borderHeight = parseFloat(getComputedStyle(this).borderTopWidth) + parseFloat(getComputedStyle(this).borderBottomWidth);

                    if (!borderHeight) {
                        borderHeight = 0;
                    }

                    this.height = 'auto';
                    if (this.scrollHeight + borderHeight > this.offsetHeight) {
                        this.height = this.scrollHeight + borderHeight;
                    }
                });
            }
        }

        connectedCallback () {
            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-textarea'
                }
            }));

            this.isConnectedCallback = true;
        }
    }

    if (!customElements.get('ui-textarea')) {
        customElements.define('ui-textarea', UiTextarea, {
            extends: 'textarea'
        });
    }



class UiToast extends UiFloat {
    // 定位处理
    setParams (text, arg1, arg2) {
        if (!text) {
            return;
        }
    
        // 参数处理
        var type, time;
    
        [arg1, arg2].forEach(function (arg) {
            if (typeof arg == 'number') {
                time = arg;
            } else if (typeof arg == 'string') {
                type = arg;
            } else if (typeof arg == 'object') {
                type = arg.type;
                time = arg.time
            }
        });

        if (typeof time == 'number') {
            this.time = time;
        }

        if (type) {
            this.type = type;
        }
    
        this.innerHTML = text;
    }

    // success
    static success (text, time = 3000) {
        return this.custom(text, 'success', time);
    }
    // error
    static error (text, time = 3000) {
        return this.custom(text, 'error', time);
    }
    // warning
    static warning (text, time = 3000) {
        return this.custom(text, 'warning', time);
    }
    // normal
    static custom (text, type, time) {
        if (UiToast.toast) {
            UiToast.toast.setParams(text, type, time);
            UiToast.toast.show();            
        } else {
            UiToast.toast = new window.Toast(text, type, time);
        }

        return UiToast.toast;
    }
}

// 将该方法定义为 window 全局使用的方法
window.Toast = function () {
    const ele = document.createElement('ui-toast');
    ele.setParams(...arguments);
    document.body.append(ele);
    ele.open = true;

    return ele;
};

if (!customElements.get('ui-toast')) {
    customElements.define('ui-toast', UiToast);
}






const Validate = (() => {
    // 全角转半角方法
    window.DBC2SBC = (str) => {
        let result = '';
        let i, code;
        for (i = 0; i < str.length; i++) {
            code = str.charCodeAt(i);
            if (code >= 65281 && code <= 65373) {
                result += String.fromCharCode(str.charCodeAt(i) - 65248);
            } else if (code == 12288) {
                result += String.fromCharCode(str.charCodeAt(i) - 12288 + 32);
            } else {
                result += str.charAt(i);
            }
        }

        return result;
    };

    // 滚动到顶部缓动实现
    // rate表示缓动速率，默认是2
    window.scrollTopTo = (top, callback) => {
        let scrollTop = document.scrollingElement.scrollTop;
        const rate = 2;

        const funTop = () => {
            scrollTop = scrollTop + (top - scrollTop) / rate;

            // 临界判断，终止动画
            if (Math.abs(scrollTop - top) <= 1) {
                document.scrollingElement.scrollTop = top;
                callback && callback();
                return;
            }
            document.scrollingElement.scrollTop = scrollTop;
            // 动画gogogo!
            requestAnimationFrame(funTop);
        };
        funTop();
    };

    // 一些全局的属性和方法
    document.validate = (function () {
        return {
            reg: {
                email: '^[a-z0-9._%-]+@([a-z0-9-]+\\.)+[a-z]{2,4}$',
                number: '^\\-?\\d+(\\.\\d+)?$',
                url: "^(http|https)\\:\\/\\/[a-z0-9\\-\\.]+\\.[a-z]{2,3}(:[a-z0-9]*)?\\/?([a-z0-9\\-\\._\\:\\?\\,\\'\\/\\\\\\+&amp;%\\$#\\=~])*$",
                tel: '^1\\d{10}$',
                zipcode: '^\\d{6}$',
                date: '^\\d{4}\\-(0\\d|1[0-2])\\-([0-2]\\d|3[0-1])$',
                time: '^[0-2]\\d\\:[0-5]\\d$',
                hour: '^[0-2]\\d\\:00$',
                minute: '^[0-2]\\d\\:[0-5]\\d$'
            },

            name: {
                email: '邮箱',
                tel: '手机号码',
                url: '网址',
                zipcode: '邮编',
                password: '密码',
                number: '数值',
                range: '数值',
                date: '日期',
                year: '年份',
                month: '月份',
                hour: '小时',
                minute: '分钟',
                time: '时间',
                datetime: '日期时间'
            },

            // 选中某范围文字内容的拓展方法
            selectRange (element, start, end) {
                if (!element) {
                    return;
                }
                if (element.createTextRange) {
                    const objRange = element.createTextRange();
                    objRange.collapse(true);
                    objRange.moveEnd('character', end);
                    objRange.moveStart('character', start);
                    objRange.select();
                } else if (element.focus) {
                    element.focus();
                    element.setSelectionRange(start, end);
                }
            },

            // 电话号码过滤成符合要求的号码，省去用户自己处理
            // 例如我们从某个地方复制电话号码，可能是短横线相连
            // 或者前面带+86
            getTel (tel) {
                let strTel = tel || '';
                strTel = strTel.replace('+86', '');
                // 如果此时剩余所有数字正好11位
                if (strTel.match(/\d/) && strTel.match(/\d/g).length == 11) {
                    strTel = strTel.replace(/\D/g, '');
                }
                return strTel;
            },

            // 获得字符长度
            // @element  Object   input/textarea表单控件元素
            // @max  Number   返回满足最大值时候的真实字符长度
            getLength (element, max) {
                if (element.type == 'password') {
                    return max ? max : element.value.length;
                }

                return element.value.length;
            },

            // 获得并重置type
            getType (element) {
                // 控件的类型
                // 这里不能直接element.type获取，否则，类似email类型直接就是text类型
                // 但是，有些元素的type是隐式的，例如textarea，因此element.type还是需要的
                const strAttrType = element.getAttribute('type');
                let strType = strAttrType || element.type || '';

                if (strType == 'select-one') {
                    strType = 'select';
                }

                return strType;
            },

            
            getReportText (element) {
                const defaultPrompt = {
                    name: this.name,
                    badInput: '值无效',
                    customError: '包含错误',
                    patternMismatch: {
                        pattern: '内容格式不符合要求',
                        multiple: '某项内容格式不符合要求'
                    },
                    valueMissing: {
                        radio: '请选择一个选项',
                        checkbox: '如果要继续，请选中此框',
                        select: '请选择列表中的一项',
                        'select-one': '请选择列表中的一项',
                        empty: '请填写此字段'
                    },
                    rangeOverflow: '值偏大',
                    rangeUnderflow: '值偏小',
                    stepMismatch: '值不在间隔要求范围内',
                    tooLong: '内容长度偏大',
                    tooShort: '内容长度偏小',
                    typeMismatch: '值和输入框类型不匹配'
                };

                if (!element) {
                    return '';
                }

                // 验证信息
                const objValidateState = element.validity;

                // 如果没有错误，没有任何返回
                if (objValidateState.valid == true) {
                    return '';
                }

                // 最终的提示文字
                let strFinalText = '';

                // 元素的id, type等
                const strId = element.id;
                const strType = this.getType(element);

                // 元素上自定义的提示信息
                // 元素存储的提示信息，主要是自定义方法返回的自定义提示
                const customValidate = element.customValidate || {};
                const optionPrompt = customValidate.report || {};

                // 错误提示关键字
                const strName = defaultPrompt.name[strType] || (function () {
                    if (!customValidate.label || !strId || /checkbox|radio/.test(strType)) {
                        return;
                    }
                    let strTextLabel = '';
                    // 从label动态获取提示数据
                    document.querySelectorAll('label[for="' + strId + '"]').forEach(function (eleLabel) {
                        const eleLabelClone = eleLabel.cloneNode(true);
                        // 只使用裸露的文字作为提示关键字
                        [].slice.call(eleLabelClone.children).forEach(function (eleChild) {
                            eleChild.remove();
                        });

                        // 去除数字和冒号
                        const strLabelCloneText = eleLabelClone.innerHTML.trim().replace(/\d/g, '').replace('：', '');
                        // 内容最长的那个元素作为提示文字
                        if (strLabelCloneText.length > strTextLabel.length) {
                            strTextLabel = strLabelCloneText;
                        }
                    });
                    // 提示关键字显然不会小于2个字
                    // 不会是纯数字
                    if (strTextLabel.length >= 2) {
                        return strTextLabel;
                    }
                })();

                // 开始一个一个确认提示
                if (objValidateState.valueMissing) {
                    strFinalText = optionPrompt.valueMissing;
                    // 如果没有对应的自定义提示
                    if (!strFinalText) {
                        // 则使用默认的提示：
                        // 1. 根据类型关键字组装的提示
                        if (strType && strName) {
                            if (strType != 'select') {
                                strFinalText = strName + '不能为空';
                            } else {
                                strFinalText = '您尚未选择' + strName;
                            }
                        } else {
                            // 2. 默认的missing几个错误提示
                            strFinalText = defaultPrompt.valueMissing[strType];
                        }

                        strFinalText = strFinalText || defaultPrompt.valueMissing.empty;
                    }
                } else if (objValidateState.patternMismatch) {
                    // 首先，优先使用自定义提示是一样的
                    strFinalText = optionPrompt.patternMismatch;

                    if (!strFinalText) {
                        // 然后确定是否是多值
                        const isMultiple = element.hasAttribute('multiple') && element.value.split(',').length > 1;

                        strFinalText = defaultPrompt.patternMismatch[isMultiple ? 'multiple' : 'pattern'];
                        // 然后
                        if (strType && strName) {
                            // 1. 试试关键字提示
                            strFinalText = strName + strFinalText;
                        }
                    }
                } else if (objValidateState.badInput) {
                    // 优先使用自定义提示是一样的
                    strFinalText = optionPrompt.badInput;

                    if (!strFinalText) {
                        strFinalText = (strName || '') + defaultPrompt.badInput;
                    }
                } else if (objValidateState.typeMismatch) {
                    // 优先使用自定义提示是一样的
                    strFinalText = optionPrompt.typeMismatch;

                    if (!strFinalText) {
                        strFinalText = defaultPrompt.typeMismatch;
                        if (strName) {
                            strFinalText = strFinalText.replace('输入框', strName);
                        }
                    }
                } else if (objValidateState.rangeUnderflow || objValidateState.rangeOverflow) {
                    // 先看看有没有自定义的提示
                    strFinalText = optionPrompt.rangeUnderflow || optionPrompt.rangeOverflow;

                    if (!strFinalText && strType && strName) {
                        let strMin = element.getAttribute('min');
                        let strMax = element.getAttribute('max');

                        if (strType == 'month-range') {
                            strMin = strMin.slice(0, 7);
                            strMax = strMax.slice(0, 7);
                        }

                        const strTextBigger = '必须要大于或等于' + strMin;
                        const strTextSmall = '必须要小于或等于' + strMax;

                        // 同时范围超出，一定是日期范围
                        if (objValidateState.rangeUnderflow && objValidateState.rangeOverflow) {
                            strFinalText = '起始日期' + strTextBigger + '，结束日期' + strTextSmall;
                        } else if (objValidateState.rangeUnderflow) {
                            strFinalText = strName + strTextBigger;
                            // 如果是日期范围
                            if (strType.slice(-6) == '-range') {
                                strFinalText = '起始日期' + strTextBigger;
                            }
                        } else {
                            strFinalText = strName + strTextSmall;
                            // 如果是日期范围
                            if (strType.slice(-6) == '-range') {
                                strFinalText = '结束日期' + strTextSmall;
                            }
                        }
                    }

                    strFinalText = strFinalText || '值不在要求的范围内';
                } else if (objValidateState.stepMismatch) {
                    // 优先使用自定义提示是一样的
                    strFinalText = optionPrompt.stepMismatch;

                    if (!strFinalText) {
                        const numMin = element.getAttribute('min') * 1;
                        const numMax = element.getAttribute('max') * 1;
                        const numStep = element.getAttribute('step') * 1 || 1;

                        if (strType == 'number' || strType == 'range') {
                            strFinalText = '请输入有效的值。两个最接近的有效值是' + (function () {
                                const numValue = element.value.trim() * 1;
                                let numClosest = numMin;
                                for (let start = numMin; start < numMax; start += numStep) {
                                    if (start < numValue && (start + numStep) > numValue) {
                                        numClosest = start;
                                        break;
                                    }
                                }

                                return [numClosest, numClosest + numStep].join('和');
                            })();
                        } else {
                            strFinalText = '请' + (element.hasAttribute('readonly') ? '选择' : '输入') + '有效的值。' + (strName || '') + '间隔是' + numStep;
                        }
                    }

                    strFinalText = strFinalText || defaultPrompt.stepMismatch;
                } else if (objValidateState.tooLong || objValidateState.tooShort) {
                    // 输入内容太多或太少
                    const strAttrLang = element.getAttribute('lang');
                    let strTextCharLength = '';

                    if (/zh/i.test(strAttrLang)) {
                        strTextCharLength = '个汉字(2字母=1汉字)';
                    } else if (/en/i.test(strAttrLang)) {
                        strTextCharLength = '个字符(1汉字=2字符)';
                    }

                    if (objValidateState.tooLong) {
                        // 先看看有没有自定义的提示
                        strFinalText = optionPrompt.tooLong;

                        if (!strFinalText) {
                            const strMaxLength = element.maxlength || element.getAttribute('maxlength');

                            strFinalText = (strName || '') + '内容长度不能大于' + strMaxLength.replace(/\D/g, '') + strTextCharLength;
                        }
                    } else {
                        // 先看看有没有自定义的提示
                        strFinalText = optionPrompt.tooShort;
                        if (!strFinalText) {
                            const strMinLength = element.getAttribute('minlength');

                            strFinalText = '内容长度不能小于' + strMinLength + strTextCharLength;
                        }
                    }
                } else if (objValidateState.customError) {
                    // 先看看有没有自定义的提示
                    strFinalText = optionPrompt.customError || defaultPrompt.customError;
                }

                if (typeof strFinalText == 'function') {
                    strFinalText = strFinalText.call(element, element);
                }

                return strFinalText;
            },

            

            
            getMissingState (element) {
                const objValidateState = {
                    valueMissing: false
                };

                // 主要针对required必填或必选属性的验证
                if (!element || element.disabled) {
                    return objValidateState;
                }

                // 类型
                const strType = this.getType(element);

                // 此时的值才是准确的值（浏览器可能会忽略文本框中的值，例如number类型输入框中的不合法数值）
                let strValue = element.value;

                if (element.hasAttribute('required')) {
                    // 根据控件类型进行验证
                    // 1. 单复选框比较特殊，先处理下
                    if (strType == 'radio') {
                        // 单选框，只需验证是否必选，同一name单选组只有要一个设置required即可
                        let eleRadios = [element];
                        const eleForm = element.closest('form') || element.parentElement.parentElement;

                        if (element.name && eleForm) {
                            eleRadios = eleForm.querySelectorAll('input[type="radio"][name="' + element.name + '"]');
                        }

                        // 如果单选框们没有一个选中，则认为无视了required属性
                        const isAtLeastOneRadioChecked = [].slice.call(eleRadios).some(function (eleRadio) {
                            return eleRadio.checked;
                        });

                        if (isAtLeastOneRadioChecked == false) {
                            // 没有一个单选框选中
                            objValidateState.valueMissing = true;
                        }

                        return objValidateState;
                    } else if (strType == 'checkbox') {
                        // 复选框是每一个都必须选中
                        if (element.checked == false) {
                            objValidateState.valueMissing = true;
                        }

                        return objValidateState;
                    } else if (strType != 'password') {
                        strValue = strValue.trim();
                    }

                    if (strValue == '') {
                        // 重新赋值
                        element.value = '';

                        // 返回验证结果
                        objValidateState.valueMissing = true;
                    }
                }

                return objValidateState;
            },

            
            isMissing (element) {
                return this.getMissingState(element).valueMissing;
            },

            
            getMismatchState (element, regex, params) {
                const objValidateState = {
                    patternMismatch: false,
                    typeMismatch: false
                };

                // 禁用元素不参与验证
                if (!element || element.disabled) {
                    return false;
                }

                // 原始值和处理值
                const strInputValue = element.value;
                let strDealValue = strInputValue;

                // 类型
                const strType = this.getType(element);

                // 特殊控件不参与验证
                if (/^radio|checkbox|select$/i.test(strType)) {
                    return objValidateState;
                }

                // 全角半角以及前后空格的处理
                // 适用于type=url/email/tel/zipcode/number/date/time等
                if (strType != 'password') {
                    strDealValue = strInputValue.trim();
                }
                if (/^text|textarea|password$/i.test(strType) == false) {
                    strDealValue = window.DBC2SBC(strDealValue);
                }
                if (strType == 'tel') {
                    strDealValue = this.getTel(strDealValue);
                }

                // 文本框值改变，重新赋值
                // 即时验证的时候，不赋值，否则，无法输入空格
                if (document.validate.focusable !== false && document.validate.focusable !== 0 && strDealValue != strInputValue) {
                    element.value = strDealValue;
                }

                // 如果没有值，则认为通过，没有错误
                if (strDealValue == '') {
                    return objValidateState;
                }

                // 获取正则表达式，pattern属性获取优先，然后通过type类型匹配。
                // 注意，不处理为空的情况
                regex = regex ||
                    (function () {
                        return element.getAttribute('pattern');
                    })() ||
                    (function () {
                        // 文本框类型处理，可能有管道符——多类型重叠，如手机或邮箱
                        return strType && strType.split('|').map(function (strTypeSplit) {
                            const regMatch = document.validate.reg[strTypeSplit];
                            if (regMatch) {
                                return regMatch;
                            }
                        }).join('|');
                    })();

                // 如果没有正则匹配的表达式，就没有验证的说法，认为出错为false
                if (!regex) {
                    return objValidateState;
                }

                // multiple多数据的处理
                const isMultiple = element.hasAttribute('multiple');
                const regNew = new RegExp(regex, params || 'i');

                // 正则验证标志量
                let isAllPass = true;

                // number,range等类型下multiple是无效的
                if (isMultiple && /^number|range$/i.test(strType) == false) {
                    strDealValue.split(',').forEach(function (partValue) {
                        partValue = partValue.trim();
                        if (isAllPass && !regNew.test(partValue)) {
                            isAllPass = false;
                        }
                    });
                } else {
                    isAllPass = regNew.test(strDealValue);
                }

                // 根据pattern判断类型
                if (isAllPass == false) {
                    if (element.hasAttribute('pattern')) {
                        objValidateState.patternMismatch = true;
                    } else {
                        objValidateState.typeMismatch = true;
                    }
                }

                return objValidateState;
            },


            
            isMismatch (element, regex, params) {
                const objValidateState = this.getMismatchState(element, regex, params);

                return objValidateState.patternMismatch || objValidateState.typeMismatch;
            },

            
            getRangeState (element) {
                const objValidateState = {
                    badInput: false,
                    rangeOverflow: false,
                    rangeUnderflow: false,
                    stepMismatch: false
                };

                // 是否数值或日期范围超出
                if (!element || element.disabled) {
                    return objValidateState;
                }

                // 类型和值
                const strType = this.getType(element);
                let strValue = element.value.trim();

                if (/radio|checkbox|select|textarea/i.test(strType) || strValue == '') {
                    return objValidateState;
                }

                let strAttrMin = element.getAttribute('min');
                let strAttrMax = element.getAttribute('max');
                const strAttrStep = Number(element.getAttribute('step')) || 1;


                if ((strType == 'number' || strType == 'range') && !/[-+]?[0-9]/.test(strValue)) {
                    objValidateState.badInput = true;
                }

                if (strType.slice(-6) != '-range') {
                    if (strValue == '0' || Number(strValue) == strValue) {
                        strValue = strValue * 1;
                    }
                    if (strAttrMin && strValue < strAttrMin) {
                        objValidateState.rangeUnderflow = true;
                    }
                    if (strAttrMax && strValue > strAttrMax) {
                        objValidateState.rangeOverflow = true;
                    }

                    // number, range类型的范围
                    if ((strType == 'number' || strType == 'range') && strAttrStep && strAttrMin &&
                        !/^\d+$/.test(Math.abs(strValue - strAttrMin) / strAttrStep)
                    ) {
                        objValidateState.stepMismatch = true;
                    }
                    // hour, minute, time类型的范围
                    if ((strType == 'hour' || strType == 'minute' || strType == 'time') && strAttrMin && strAttrStep) {
                        const minuteValue = strValue.split(':')[1];
                        const minuteMin = strAttrMin.split(':')[1];

                        if (strType == 'hour' && (minuteValue != minuteMin || (strValue.split(':')[0] - strAttrMin.split(':')[0]) % strAttrStep != 0)) {
                            // 小时，则是分钟要一致，小时数正好step
                            objValidateState.stepMismatch = true;
                        } else if ((minuteValue - minuteMin) % strAttrStep !== 0) {
                            objValidateState.stepMismatch = true;
                        }
                    }
                } else {
                    // 时间范围
                    const arrSplitValue = strValue.split(' ');

                    // 防止month-range时候，min/max设置的是完整时间，
                    // 如2017-07-07，而不是2017-07
                    if (strType == 'month-range') {
                        strAttrMin = strAttrMin && strAttrMin.slice(0, 7);
                        strAttrMax = strAttrMax && strAttrMax.slice(0, 7);
                    }

                    if (arrSplitValue.length == 3) {
                        if (strAttrMin && arrSplitValue[0] < strAttrMin) {
                            objValidateState.rangeUnderflow = true;
                        }
                        if (strAttrMax && arrSplitValue[2] > strAttrMax) {
                            objValidateState.rangeOverflow = true;
                        }
                    }
                }

                return objValidateState;
            },


            
            isOut (element) {
                const objValidateState = this.getRangeState(element);

                return objValidateState.badInput || objValidateState.rangeOverflow || objValidateState.rangeUnderflow || objValidateState.stepMismatch;
            },

            
            getLengthState (element) {
                const objValidateState = {
                    tooLong: false,
                    tooShort: false
                };
                // 是否内容长度溢出的判断
                if (!element || element.disabled || /^radio|checkbox|select$/i.test(element.type)) {
                    return objValidateState;
                }

                //  大小限制
                const strAttrMinLength = element.getAttribute('minlength');
                let strAttrMaxLength = element.maxlength || element.getAttribute('maxlength');
                // 值
                const strValue = element.value;

                if (strValue == '') {
                    return objValidateState;
                }

                const numLength = this.getLength(element);

                if (strAttrMinLength && numLength < strAttrMinLength) {
                    objValidateState.tooShort = true;
                }

                if (strAttrMaxLength) {
                    strAttrMaxLength = strAttrMaxLength.replace(/\D/g, '');
                    if (numLength > strAttrMaxLength) {
                        objValidateState.tooLong = true;
                    }
                }

                return objValidateState;
            },

            
            isOverflow (element) {
                const objValidateState = this.getLengthState(element);
                return objValidateState.tooLong || objValidateState.tooShort;
            },

            
            getCustomState (element) {
                const objValidateState = {
                    customError: false
                };
                const customValidate = element.customValidate;

                if (customValidate && typeof customValidate.method == 'function') {
                    const dataResult = customValidate.method.call(customValidate.owner, element);
                    if (dataResult) {
                        objValidateState.customError = true;
                        // 记住自定义提示内容
                        if (typeof dataResult == 'object' && dataResult.customError) {
                            this.setCustomValidity(element, dataResult.customError);
                        } else {
                            this.setCustomValidity(element, dataResult);
                        }
                    }
                }

                return objValidateState;
            },

            
            setCustomValidity (element, content) {
                if (!content) {
                    return;
                }
                if (!element.customValidate) {
                    element.customValidate = {
                        report: {}
                    };
                }
                if (!element.customValidate.report) {
                    element.customValidate.report = {};
                }

                element.customValidate.report.customError = content;
            },

            
            checkValidity (element) {
                // 1. 元素不存在不验证
                // 2. 禁用态表单元素不参与验证
                if (!element || element.disabled) {
                    return true;
                }

                // 3. 提交、重置等元素不参与验证
                const strType = element.getAttribute('type') || element.type;
                const strTag = element.tagName.toLowerCase();

                if (/^button|submit|reset|file|image$/.test(strType) == true || strTag == 'button') {
                    return true;
                }

                if (element.matches('input, select, textarea') == false && element.children) {
                    element = element.querySelectorAll('input, select, textarea');
                }

                if (element.nodeType == 1) {
                    return this.getValidity(element).valid;
                }

                if (element.length) {
                    return [].slice.call(element).every(function (ele) {
                        return this.checkValidity(ele);
                    }.bind(this));
                }

                return true;
            },

            
            getValidity (element) {
                // 性能优化
                // 如果值不变，且之前已经验证过，
                // 且不是单复选框，则直接返回
                // 避免同一元素短时间多次验证
                if (element.lastValidateState && element.lastValue === element.value && /radio|checkbox/.test(element.type) == false) {
                    return element.lastValidateState;
                }

                // 浏览器原生的状态
                let objValidateState = {
                    badInput: false,
                    customError: false,
                    patternMismatch: false,
                    rangeOverflow: false,
                    rangeUnderflow: false,
                    stepMismatch: false,
                    tooLong: false,
                    tooShort: false,
                    typeMismatch: false,
                    valid: true,
                    valueMissing: false
                };

                // 但是，不足以满足实际需求
                objValidateState = Object.assign({},
                    objValidateState,
                    this.getMissingState(element),
                    this.getMismatchState(element),
                    this.getRangeState(element),
                    this.getLengthState(element),
                    this.getCustomState(element)
                );

                let isSomeInvalid = false;

                for (let keyValidate in objValidateState) {
                    if (keyValidate != 'valid' && objValidateState[keyValidate] == true) {
                        isSomeInvalid = true;
                    }
                }

                objValidateState.valid = !isSomeInvalid;

                element.lastValue = element.value;
                element.lastValidateState = objValidateState;

                setTimeout(function () {
                    delete element.lastValidateState;
                }, 1);

                return objValidateState;
            },

            
            reportValidity (element, content) {
                // 验证并设置结果状态
                content = content || this.getReportText(element);

                // 提示
                this.errorTip(element, content);

                // 认为是成功，隐藏提示
                if (content === '' && element.data && element.data.errorTip) {
                    element.data.errorTip.hide();
                }

                const isPass = !content;

                this.styleError(element, isPass);

                // 根据提示内容判断验证结果
                return isPass;
            },

            
            styleError (element, valid) {
                // 是否有错
                if (!element) {
                    return this;
                }

                if (typeof valid == 'undefined') {
                    valid = element.validity.valid;
                } else {
                    // 触发验证通过与否的自定义事件
                    element.dispatchEvent(new CustomEvent(valid ? 'valid' : 'invalid'));
                }

                // 获取提示应该显示的元素
                const eleTarget = this.getTarget(element);

                if (!eleTarget) {
                    return valid;
                }

                const eleForm = element.form || element.closest('form') || (element.customValidate && element.customValidate.owner);

                if (element.type == 'radio' && element.name && eleForm) {
                    // 单选框组是整体去除高亮
                    eleForm.querySelectorAll('input[type=radio][name=' + element.name + ']').forEach(function (eleRadio) {
                        const eleTargetRadio = this.getTarget(eleRadio);

                        if (valid) {
                            eleTargetRadio.removeAttribute('is-error');
                            eleTargetRadio.removeAttribute('aria-label');
                        } else {
                            eleTargetRadio.setAttribute('is-error', '');
                        }
                    }.bind(this));
                } else if (valid) {
                    eleTarget.removeAttribute('is-error');
                    eleTarget.removeAttribute('aria-label');
                } else {
                    eleTarget.setAttribute('is-error', '');
                }

                return valid;
            },

            
            errorTip (element, content) {
                const eleTarget = this.getTarget(element);

                if (!eleTarget || !content) {
                    return this;
                }

                // 如果元素隐藏，也不提示
                const objStyle = window.getComputedStyle(eleTarget);

                if (objStyle.display == 'none' || objStyle.visibility == 'hidden') {
                    return this;
                }

                // 出错显示逻辑
                const funShow = function () {
                    const eleControl = document.validate.errorTip.control;
                    const eleTipTarget = document.validate.errorTip.target;

                    eleTipTarget.errorTip(content, {
                        onShow (eleTrigger, eleTips) {
                            // 如果tips宽度比较小，居左定位
                            // 否则，使用默认的居中
                            const numOffsetX = 0.5 * (eleTips.clientWidth - eleTipTarget.clientWidth);

                            if (numOffsetX < 0) {
                                eleTips.style.marginLeft = 0.5 * (eleTips.clientWidth - eleTipTarget.clientWidth) + 'px';
                            } else {
                                eleTips.style.marginLeft = 0;
                            }

                            // 使提示出现时候不会闪
                            if (document.validate.focusable === false) {
                                eleTips.classList.add('none');
                            } else {
                                eleTips.classList.remove('none');
                            }
                        },
                        onHide (eleTrigger, eleTips) {
                            const eleForm = eleControl.form || eleControl.closest('form');

                            if (!eleForm || !eleForm.isImmediated) {
                                return;
                            }

                            // margin偏移还原，否则其他的出错提示会有定位问题
                            eleTips.style.marginLeft = '';

                            // 即时验证的时候，如果出错了，提示隐藏时候，红色仍然保留
                            document.validate.styleError(eleControl);
                        }
                    });

                    // 即时验证不需要focus与选中
                    // input输入的时候focusable是false
                    // focus时候focusable是0
                    if (document.validate.focusable === false || document.validate.focusable === 0) {
                        return;
                    }

                    // focus状态还原
                    document.validate.focusable = null;

                    if (!document.validate.getType(eleControl)) {
                        return;
                    }

                    // 如果是内容超出，选中超出的文字内容
                    if (content.indexOf('内容长度') != -1 && content.indexOf('大') != -1) {
                        const strValue = eleControl.value;
                        const numLength = strValue.length;
                        // var lang = element.getAttribute('lang');
                        // 中文和英文计算字符个数的比例
                        // var numRatioCh = 1;
                        // var numRatioEn = 1;
                        // if (/zh/i.test(lang)) {
                        //     // 1个英文半个字符
                        //     numRatioEn = 0.5;
                        // } else if (/en/i.test(lang)) {
                        //     // 1个中文2个字符
                        //     numRatioCh = 2;
                        // }
                        // 获得最大长度的索引位置
                        const strAttrMaxLength = eleControl.maxlength || eleControl.getAttribute('maxlength').replace(/\D/g, '');

                        if (numLength && strAttrMaxLength) {
                            document.validate.selectRange(element, document.validate.getLength(element, strAttrMaxLength), numLength);
                        }
                    } else if (eleControl.focus && eleControl.select) {
                        eleControl.focus();
                        eleControl.select();
                    }
                };

                document.validate.errorTip.control = element;
                document.validate.errorTip.target = eleTarget;

                // 1. 首先，确保el在屏幕内，且需要预留tips的显示的足够距离，这里使用50像素
                const objRect = eleTarget.getBoundingClientRect();
                let numScrollTop = -1;
                if (objRect.top < 50) {
                    numScrollTop = window.pageYOffset - (50 - objRect.top);
                } else if (objRect.bottom > window.innerHeight) {
                    numScrollTop = window.pageYOffset + (objRect.bottom - window.innerHeight);
                }

                if (numScrollTop >= 0) {
                    window.scrollTopTo(numScrollTop, funShow);
                } else {
                    funShow();
                }

                return this;
            },

            
            getTarget (element) {
                if (!element) {
                    return null;
                }

                let eleTarget = element;

                // 根据原生控件元素，确定真实的自定义控件元素
                // 这里的很多处理跟其他表单UI组件想耦合、关联
                const strType = element.getAttribute('type') || element.type;
                const strId = element.id;
                const strTag = element.tagName.toLowerCase();

                const objStyle = window.getComputedStyle(element);

                // 1. 单复选框
                if (strType == 'radio') {
                    if (objStyle.opacity != '1') {
                        eleTarget = element.parentElement.querySelector('label.ui-radio[for="' + strId + '"]');
                    }
                } else if (strType == 'checkbox') {
                    if (objStyle.opacity != '1') {
                        eleTarget = element.parentElement.querySelector('label.ui-checkbox[for="' + strId + '"]');
                    }
                    // 下拉框
                } else if (strType == 'select' || strTag == 'select') {
                    if (objStyle.opacity != '1') {
                        eleTarget = element.nextElementSibling;
                    }
                    // range范围选择框
                } else if (strType == 'range') {
                    if (objStyle.display == 'none') {
                        eleTarget = element.nextElementSibling;
                    }
                    // 隐藏元素的目标提示元素的转移
                } else if (strType == 'hidden' || objStyle.display == 'none' || objStyle.visibility == 'hidden') {
                    const eleTargetRel = document.getElementById(eleTarget.getAttribute('data-target')) || element.dataTarget;
                    if (eleTargetRel) {
                        eleTarget = document.validate.getTarget(eleTargetRel);
                    }
                } else if (strType == 'textarea' || strTag == 'textarea') {
                    if (element.classList.contains('ui-textarea') == false && element.parentElement.querySelector('.ui-textarea')) {
                        eleTarget = element.parentElement.querySelector('.ui-textarea');
                    }
                } else if (strTag == 'input') {
                    if (element.classList.contains('ui-input') == false && element.parentElement.querySelector('.ui-input')) {
                        eleTarget = element.parentElement.querySelector('.ui-input');
                    }
                }

                return eleTarget;
            }
        };
    })();

    // 重置原生的validity属性和checkValidity方法
    [HTMLInputElement.prototype, HTMLSelectElement.prototype, HTMLTextAreaElement.prototype].forEach(function (prop) {
        Object.defineProperty(prop, 'validity', {
            get () {
                return document.validate.getValidity(this);
            },
            configurable: true
        });

        Object.defineProperty(prop, 'validationMessage', {
            get () {
                return document.validate.getReportText(this);
            },
            configurable: true
        });

        Object.defineProperty(prop, 'checkValidity', {
            value () {
                return this.validity.valid;
            },
            configurable: true
        });

        Object.defineProperty(prop, 'reportValidity', {
            value (content) {
                return document.validate.reportValidity(this, content);
            },
            configurable: true
        });

        Object.defineProperty(prop, 'setCustomValidity', {
            value (content) {
                if (!content) {
                    return;
                }

                // 浏览器原生的状态
                const arrValidateKey = [
                    'badInput',
                    'customError',
                    'patternMismatch',
                    'rangeOverflow',
                    'rangeUnderflow',
                    'stepMismatch',
                    'tooLong',
                    'tooShort',
                    'typeMismatch',
                    'valueMissing'
                ];

                if (!this.customValidate) {
                    this.customValidate = {};
                }
                if (!this.customValidate.report) {
                    this.customValidate.report = {};
                }

                // 如果content是字符串，则重置所有提示
                if (typeof content == 'string') {
                    arrValidateKey.forEach(function (key) {
                        this.customValidate.report[key] = content;
                    });
                } else if (typeof content == 'object') {
                    Object.assign(this.customValidate.report, content);
                }
            },
            configurable: true
        });
    });

    // 表单元素的checkValidity()方法支持
    Object.defineProperty(HTMLFormElement.prototype, 'checkValidity', {
        value () {
            return document.validate.checkValidity(this);
        },
        configurable: true
    });

    class Component {

        
        constructor (element, callback, options) {
            if (typeof element == 'string') {
                element = document.getElementById(element) || document.querySelector(element);
            }
            // el一般指的是form元素
            if (!element) {
                return this;
            }

            const eleForm = element;

            if (eleForm.data && eleForm.data.validate) {
                return eleForm.data.validate;
            }

            // 干掉浏览器默认的验证
            eleForm.setAttribute('novalidate', 'novalidate');

            const defaults = {
                // 提交时候是全部出错红色高亮，还是仅第一个，默认是全部
                multiple: true,
                // 是否开启即时验证
                immediate: true,
                // 是否利用label关联元素的innerHTML作为提示关键字
                label: true,
                // 自定义验证提示与数据
                validate: [
                    // 下面为结构示意
                    
                ]
            };

            if (typeof callback == 'object') {
                options = callback;
                // 下一行其实去掉也没什么事，
                // 放着是防止以后有什么新逻辑，
                // 没有这一行可能会导致报错
                callback = null;
            }

            const objParams = Object.assign({}, defaults, options || {});

            // 还原禁用的提交和关闭按钮
            eleForm.querySelectorAll('[type="submit"]:disabled, [type="image"]:disabled').forEach(function (eleSubmit) {
                eleSubmit.disabled = false;
            });

            // 干掉默认的提交
            eleForm.addEventListener('submit', (event) => {
                if (this.stopValidate) {
                    return;
                }
                event.preventDefault();

                if (this.checkValidity()) {
                    if (typeof callback == 'function') {
                        callback.call(this, eleForm);
                    }
                    eleForm.dispatchEvent(new CustomEvent('valid'));
                }

                return false;
            });

            // 暴露的数据
            this.element = {
                form: eleForm
            };

            this.params = {
                multiple: objParams.multiple,
                immediate: objParams.immediate,
                label: objParams.label
            };

            // 设置自定义验证
            this.setCustomValidity(objParams.validate);

            // 表单重置的计数处理
            this.count();

            // 手机号过滤等增强体验功能
            this.enhance();

            if (!eleForm.data) {
                eleForm.data = {};
            }

            eleForm.data.validate = this;

            return this;
        }

        
        setCustomValidity (validate) {
            // 自定义的验证绑定
            let dataValidate = validate || this.dataValidate;
            if (!dataValidate || !this.element || !this.element.form) {
                return this;
            }
            if (typeof dataValidate == 'function') {
                dataValidate = dataValidate();
            }
            // 确保是数组
            if (dataValidate && !dataValidate.forEach && dataValidate.id) {
                dataValidate = [dataValidate];
            }

            // 是否从<label>元素寻找提示关键字
            const isLabel = this.params.label;

            // 遍历元素并匹配
            let eleFormCollection = this.element.form.elements || this.element.form.querySelectorAll('input, textarea, select');

            if (!eleFormCollection.length) {
                return this;
            }

            [...eleFormCollection].forEach(eleInput => {
                const strId = eleInput.id;

                // 是否使用自定义的验证和提示
                let customValidate = {
                    label: isLabel,
                    owner: this
                };

                if (strId && dataValidate && dataValidate.length) {
                    dataValidate.forEach(function (objValidate) {
                        if (objValidate.id == strId) {
                            // 最终的提示文字，是否借助label元素
                            objValidate.label = isLabel;
                            // 实例对象存储
                            objValidate.owner = this;
                            // 自定义验证参数
                            customValidate = objValidate;
                        }
                    }.bind(this));
                }

                // 记住上一次的值
                // 只在初次记住
                if (!this.element.form.data || !this.element.form.data.validate) {
                    eleInput.lastValue = eleInput.value || '';
                }

                // 绑定在元素上
                eleInput.customValidate = customValidate;
            });

            this.dataValidate = validate;
        }

        
        count () {
            // 即时验证
            const eleForm = this.element.form;

            // reset事件不会自动计数处理
            eleForm.addEventListener('reset', function () {
                this.querySelectorAll('input, textarea').forEach(function (element) {
                    if (element.count) {
                        setTimeout(() => {
                            element.count();
                        }, 1);
                    }
                });
            });

            return this;
        }

        
        enhance () {
            const eleForm = this.element.form;

            eleForm.querySelectorAll('input, textarea').forEach(function (element) {
                // 输入框类型
                const strAttrType = document.validate.getType(element);

                // 手机号码粘贴的优化处理
                if (/^checkbox|radio|range$/i.test(strAttrType) == false) {
                    ['paste', 'drop'].forEach(eventType => {
                        element.addEventListener(eventType, function (event) {
                            // 剪切板数据对象
                            // 输入框类型
                            const type = this.getAttribute('type') || this.type;
                            // 剪切板数据对象
                            const objPassData = event.clipboardData || event.dataTransfer;
                            // 粘贴或拖拽内容
                            let strPassText = '';
                            // 剪切板对象可以获取
                            if (!objPassData) {
                                return;
                            }
                            // 获取选中的文本内容
                            let textSelected = this.value.slice(element.selectionStart, element.selectionEnd);

                            // 只有输入框没有数据，或全选状态才处理
                            if (this.value.trim() == '' || textSelected === this.value) {
                                // 阻止冒泡和默认粘贴行为
                                event.preventDefault();
                                event.stopPropagation();
                                // 获取粘贴数据
                                strPassText = objPassData.getData('text') || '';
                                // 进行如下处理
                                // 除非是password，其他都过滤前后空格
                                if (type != 'password') {
                                    strPassText = strPassText.trim();
                                }
                                // 邮箱处理，可能会使用#代替@避免被爬虫抓取
                                if (type == 'email') {
                                    strPassText = strPassText.replace('#', '@');
                                } else if (type == 'tel') {
                                    // 手机号处理
                                    strPassText = document.validate.getTel(strPassText);
                                }

                                // 插入
                                this.value = strPassText;

                                // 触发input事件
                                element.dispatchEvent(new CustomEvent('input'));
                            }
                        });
                    });
                }
            });
        }

        
        immediate () {
            // 即时验证
            const eleForm = this.element.form;

            if (eleForm.isImmediated) {
                return this;
            }

            // 下面三个是不同事件的验证提示
            const funReportValidity = (event) => {
                if (this.params.immediate == false) {
                    return;
                }
                this.reportValidity(event.target);
            };

            const funReportFocus = (event) => {
                if (this.params.immediate) {
                    setTimeout(function () {
                        document.validate.focusable = 0;

                        this.reportValidity(event.target);
                    }.bind(this), 20);
                }
            };

            const funReportInput = (event) => {
                if (this.params.immediate == false) {
                    return;
                }

                document.validate.focusable = false;
                this.reportValidity(event.target);
                event.target.lastValue = event.target.value;
            };

            eleForm.querySelectorAll('input, select, textarea').forEach(function (element) {
                // type类型筛选
                let strType = element.type;
                let strAttrType = element.getAttribute('type');
                // 给每个控件绑定即时验证
                if (strType == 'button' || strType == 'submit' || strType == 'reset' || strType == 'file' || strType == 'image') {
                    return;
                }

                // 不同类别不同事件
                if (strType == 'radio' || strType == 'checkbox') {
                    element.addEventListener('click', funReportValidity);
                } else if (/select/.test(strType) || /range|date|time|hour|minute|hidden/.test(strAttrType)) {
                    element.addEventListener('change', funReportValidity);
                } else {
                    // 输入
                    element.addEventListener('focus', funReportFocus);
                    element.addEventListener('input', funReportInput);
                }
            });

            eleForm.isImmediated = true;

            // 如果表单重置，移除所有的即时验证绑定
            const funRemoveValidate = function () {
                [...eleForm.elements].forEach(element => {
                    // type类型筛选
                    let strType = element.type;
                    // 给每个控件绑定即时验证
                    if (['button', 'submit', 'reset', 'file', 'image'].includes(strType)) {
                        return;
                    }

                    let strAttrType = element.getAttribute('type');
                    // 不同类别不同事件
                    if (strType == 'radio' || strType == 'checkbox') {
                        element.removeEventListener('click', funReportValidity);
                    } else if (/select/.test(strType) || /range|date|time|hour|minute|hidden/.test(strAttrType)) {
                        element.removeEventListener('change', funReportValidity);
                    } else {
                        // 输入
                        element.removeEventListener('focus', funReportFocus);
                        element.removeEventListener('input', funReportInput);
                    }
                });

                [...eleForm.querySelectorAll('.valided')].forEach(element => {
                    element.classList.remove('valided');
                });
                [...eleForm.querySelectorAll('[is-error]')].forEach(element => {
                    // 因此可能的提错误示
                    let objErrorTip = element.data && element.data.errorTip;
                    if (objErrorTip) {
                        objErrorTip.hide();
                    }

                    element.removeAttribute('is-error');
                });

                eleForm.isImmediated = false;

                eleForm.removeEventListener('reset', funRemoveValidate);
            };
            eleForm.addEventListener('reset', funRemoveValidate);

            return this;
        }

        
        checkValidity () {
            const eleForm = this.element.form;

            let isAllPass = true;

            document.validate.focusable = true;

            eleForm.querySelectorAll('input, select, textarea').forEach(element => {
                // 还没有出现不合法的验证
                if (isAllPass == true || this.params.multiple) {
                    // multiple参数为true的时候，其他都要标红，但提示仅出现在第一个错误元素上
                    const isPass = element.validity.valid;

                    if (isAllPass == true && isPass == false) {
                        // reportValidity方法也会执行styleError
                        // 因此 styleError 这句在 else 中执行
                        this.reportValidity(element);
                        isAllPass = false;
                    } else {
                        document.validate.styleError(element, isPass);
                    }
                }
            });

            // 当有过一次提交之后，开启即时验证
            if (!eleForm.isImmediated && this.params.immediate) {
                this.immediate();
            }

            return isAllPass;
        }

        
        reportValidity (element, content) {
            if (element) {
                document.validate.reportValidity(element, content);
            }
        }
    }

    return Component;
})();

// 为了直接使用
window.Validate = Validate;


HTMLFormElement.prototype.validate = function () {
    new Validate(this);

    return this;
};

// 观察is-validate属性，并认为绑定验证
(function () {
    const initAllValidate = (ele) => {
        const eleValidates = ele || document.querySelectorAll('[is-validate]');

        eleValidates.forEach(item => {
            item.validate();
            item.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-validate'
                }
            }));
            item.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        });
    };

    
    const autoInitAndWatchingValidate = () => {
        // 先实例化已有is-validate属性的DOM节点，再监听后续的节点变化
        initAllValidate();
        const observer = new MutationObserver(mutationsList => {
            mutationsList.forEach(mutation => {
                mutation.addedNodes && mutation.addedNodes.forEach(eleAdd => {
                    if (!eleAdd.tagName) {
                        return;
                    }
                    if (eleAdd.hasAttribute('is-validate')) {
                        initAllValidate([eleAdd]);
                    } else {
                        initAllValidate(eleAdd.querySelectorAll('[is-validate]'));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState != 'loading') {
        autoInitAndWatchingValidate();
    } else {
        window.addEventListener('DOMContentLoaded', autoInitAndWatchingValidate);
    }
})();

})();