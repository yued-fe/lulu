/*
 * @Select.js
 * @author liuwentao
 * @version
 * @Created: 2020-06-09
 * @edit: 2020-06-09
**/

class Select extends HTMLSelectElement {

    static get observedAttributes () {
        return ['multiple', 'disabled', 'width'];
    }

    constructor () {
        super();

        // 关联的元素们
        if (!this.element) {
            this.element = {
                button: null,
                combobox: null,
                datalist: null
            };
        }
        // 尺寸和属性变化的观察器
        this.observer = null;
        this.resizeObserver = null;

        // 重置原生的属性
        this.setProperty();
    }

    static addClass () {
        return ['ui', 'select'].concat([].slice.call(arguments)).join('-');
    }

    get multiple () {
        return this.hasAttribute('multiple');
    }

    render () {
        this.create();
        this.refresh();
        this.events();
    }

    remove () {
        if (this.parentElement) {
            this.parentElement.removeChild(this);
        }
        if (this.element.combobox) {
            this.element.combobox.remove();
        }
    }

    getData () {
        const options = this.options;
        return options.length
            ? [].slice.call(options).map(option => ({
                html: option.innerHTML,
                value: option.value,
                selected: option.selected,
                disabled: option.disabled,
                className: option.className
            }))
            : [{html: ''}];
    }

    // 获取<select>元素原始状态下的尺寸
    get width () {
        let strAttrWidth = this.getAttribute('width');
        // 如果是纯数字，则px为单位
        if (strAttrWidth && Number(strAttrWidth) === parseFloat(strAttrWidth)) {
            strAttrWidth = strAttrWidth + 'px';
        }
        return strAttrWidth;
    }
    set width (value) {
        if (/\d/.test(value) == false) {
            return;
        }
        this.setAttribute('width', value);
    }

    getWidth () {
        return this.style.width || this.width || this.offsetWidth + 'px';
    }
    setWidth () {
        if (this.element.combobox) {
            const width = this.getWidth();
            // 创建的下拉的尺寸设置
            this.element.combobox.style.width = width;

            this.style.transform = '';

            if (width.lastIndexOf('%') !== -1 && this.originPosition != 'absolute' && this.originPosition != 'fixed') {
                // 如果是百分比宽度
                // 同时原下拉框不是绝对定位
                // 则有可能尺寸不不对的，通过水平缩放调整下
                // 避免水平滚动的出现
                this.style.transform = `scaleX(${ this.parentElement.clientWidth * parseFloat(width) * 0.01 / this.offsetWidth })`;
            }
        }
    }

    create () {
        // 防止多次重复创建
        if (this.element && this.element.combobox) {
            return;
        }

        const strId = ('lulu_' + (this.id || Math.random())).replace('0.', '');

        // 创建的列表元素需要的类名
        const BUTTON_CLASS = Select.addClass('button');
        const DATALIST_CLASS = Select.addClass('datalist');

        // 原始下拉的定位属性
        let strOriginPosition = window.getComputedStyle(this).position;
        this.originPosition = strOriginPosition;

        // 直接插入对应的片段内容
        this.insertAdjacentHTML('afterend', `<div role="combobox" style="width: ${this.getWidth()}">
           ${!this.multiple ? `<a
                class="${BUTTON_CLASS}"
                data-target="${strId}"
                aria-owns="${strId}"
                aria-expanded="false"
                style="display: ${this.multiple ? 'none' : 'block'}"
                ${!this.disabled ? 'href="javascript:;" ' : ''}
                role="button"
            /></a>` : '' }
           <div id="${strId}" role="listbox" aria-expanded="false" class="${DATALIST_CLASS}" ${!this.multiple ? 'aria-hidden="true"' : ''}></div>
        </div>`);

        let eleCombobox = this.nextElementSibling;

        // 元素暴露出去
        Object.assign(this.element, {
            combobox: eleCombobox,
            button: eleCombobox.querySelector(`.${BUTTON_CLASS}`),
            datalist: eleCombobox.querySelector(`.${DATALIST_CLASS}`)
        });

        // 原始下拉框的层级和位置
        // 变成绝对定位，不占据任何空间
        if (strOriginPosition != 'fixed') {
            this.style.position = 'absolute';
        }

        this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
    }

    /**
     * 下拉内容的刷新
     * @param {Array} data 刷新列表数组项，可选
     */
    refresh (data) {
        // 是否多选
        const isMultiple = this.multiple;
        // 主要的几个元素
        const eleSelect = this;
        // 几个创建元素
        const eleCombobox = this.element.combobox;
        const eleButton = this.element.button;
        const eleDatalist = this.element.datalist;
        // id
        const strId = eleDatalist.id;

        // 获取当下下拉框的数据和状态
        data = data || this.getData();

        // 下拉组合框元素的样式
        // 把原<select>的样式复制过来，这样，类似 margin 等样式可以继承过来
        // 布局会更稳定
        eleCombobox.className = (`${eleSelect.className} ${Select.addClass()}`).trim();

        // 多选，高度需要同步，因为选项高度不确定
        // eleSelect.style.height 性能很高，offsetHeight会触发重绘，因此优先 style 对象 获取
        if (isMultiple) {
            eleCombobox.style.height = eleSelect.style.height || (eleSelect.offsetHeight + 'px');
        } else {
            // 按钮元素中的文案
            const strHtmlSelected = eleSelect[eleSelect.selectedIndex].innerHTML;
            // 按钮赋值
            eleButton.innerHTML = `<span class="${Select.addClass('text')}">${strHtmlSelected}</span><i class="${Select.addClass('icon')}" aria-hidden="true"></i>`;
        }
        // 列表内容的刷新
        eleDatalist.innerHTML = data.map((obj, index) => {
            const arrCl = [Select.addClass('datalist', 'li'), obj.className];
            if (obj.selected) arrCl.push('selected');
            if (obj.disabled) arrCl.push('disabled');
            // 复选模式列表不参与无障碍访问识别，因此HTML相对简单
            return `${
                isMultiple
                    ? `<a class="${arrCl.join(' ')}" data-index=${index}>${obj.html}</a>`
                    : `<a
                        ${obj.disabled ? '' : ' href="javascript:" '}
                        class="${arrCl.join(' ')}"
                        data-index=${index}
                        data-target="${strId}"
                        role="option"
                        aria-selected="${obj.selected}"
                    >${obj.html}</a>`
            }`;
        }).join('');
    }

    /**
     * 下拉的事件处理
     */
    events () {
        if (this.multiple) {
            this.createMultipleEvent();
        } else {
            this.createNormalEvent();
        }
    }

    /**
     * 单选下拉框的事件
     */
    createNormalEvent () {
        // 点击页面空白要隐藏
        // 测试表明，这里优化下可以提高40~50%性能
        // 原本是绑定对应元素上，现在改成委托
        if (!document.isSelectMouseEvent) {
            document.addEventListener('click', (event) => {
                var target = event.target;
                if (!target || !target.closest) {
                    return;
                }
                // 获取下拉元素是关键，因为存储了实例对象
                // 元素什么的都可以直接匹配
                const eleCombobox = target.closest('.' + Select.addClass());
                const eleSelect = eleCombobox && eleCombobox.previousElementSibling;

                if (!eleSelect || !eleSelect.element) {
                    return;
                }

                const objElement = eleSelect.element;
                const eleButton = objElement.button;
                const eleDatalist = objElement.datalist;

                // 下面判断点击的是按钮还是列表了
                if (eleButton.contains(target)) {
                    if (eleSelect.disabled) return false;
                    // 显示与隐藏
                    eleCombobox.classList.toggle('active');
                    if (eleCombobox.classList.contains('active')) {
                        // 边界判断
                        var isOverflow = eleDatalist.getBoundingClientRect().bottom + window.pageYOffset > Math.max(document.body.clientHeight, window.innerHeight);
                        eleCombobox.classList[isOverflow ? 'add' : 'remove']('reverse');
                        // aria状态
                        eleButton.setAttribute('aria-expanded', 'true');
                        // 滚动与定位
                        var arrDataScrollTop = eleCombobox.dataScrollTop;
                        var eleDatalistSelected = eleDatalist.querySelector('.selected');
                        // 严格验证
                        if (arrDataScrollTop && arrDataScrollTop[1] === eleDatalistSelected.getAttribute('data-index') && arrDataScrollTop[2] === eleDatalistSelected.innerText) {
                            eleDatalist.scrollTop = arrDataScrollTop[0];
                            // 重置
                            delete eleCombobox.dataScrollTop;
                        }
                    } else {
                        eleCombobox.classList.remove('reverse');
                        // aria状态
                        eleButton.setAttribute('aria-expanded', 'false');
                    }
                } else if (eleDatalist.contains(target)) {
                    // 点击的列表元素
                    var eleList = target;
                    // 对应的下拉<option>元素
                    var eleOption = null;
                    // 是否当前点击列表禁用
                    var isDisabled = eleList.classList.contains('disabled');
                    // 获取索引
                    var indexOption = eleList.getAttribute('data-index');
                    // 存储可能的滚动定位需要的数据
                    var scrollTop = eleDatalist.scrollTop;
                    eleCombobox.dataScrollTop = [scrollTop, indexOption, eleList.innerText];

                    // 修改下拉选中项
                    if (!isDisabled) {
                        eleOption = eleSelect[indexOption];
                        if (eleOption) {
                            eleOption.selected = true;
                        }
                    }
                    // 下拉收起
                    eleCombobox.classList.remove('active');
                    eleButton.setAttribute('aria-expanded', 'false');
                    // focus
                    eleButton.focus();
                    eleButton.blur();

                    if (!isDisabled) {
                        // 更新下拉框
                        eleSelect.refresh();
                        // 回调处理
                        // 触发change事件
                        eleSelect.dispatchEvent(new CustomEvent('change', {
                            'bubbles': true
                        }));
                    }
                }
            });

            // 点击空白隐藏处理
            document.addEventListener('mouseup', (event) => {
                var target = event.target;
                if (!target) {
                    return;
                }
                // 识别此时的combobox
                const eleCombobox = document.querySelector('select+.ui-select.active');
                if (eleCombobox && !eleCombobox.contains(target)) {
                    eleCombobox.classList.remove('active');
                    eleCombobox.classList.remove('reverse');
                }
            });

            // 防止事件2次绑定
            document.isSelectMouseEvent = true;
        }
    }

    /**
     * 多选下拉的事件处理
     */
    createMultipleEvent () {
        const eleDatalist = this.element.datalist;

        // 下拉多选
        // 键盘交互UI同步
        this.addEventListener('change', () => {
            this.refresh();
        });
        // 滚动同步
        this.addEventListener('scroll', () => {
            eleDatalist.scrollTop = this.scrollTop;
        });
        // hover穿透
        this.addEventListener('mousedown', () => {
            this.setAttribute('data-active', 'true');
        });
        this.addEventListener('mousemove', (event) => {
            if (this.getAttribute('data-active')) {
                this.refresh();
                return;
            }

            // 当前坐标元素
            var clientY = event.clientY;
            var clientX = event.clientX;

            // 匹配当前坐标的页面元素
            var elesFromPoint = document.elementsFromPoint(clientX, clientY);

            // 识别哪几个列表元素匹配坐标元素
            var eleListAll = eleDatalist.querySelectorAll('a');
            for (var indexList = 0; indexList < eleListAll.length; indexList++) {
                var eleList = eleListAll[indexList];
                // hover状态先还原
                eleList.removeAttribute('href');
                // 然后开始寻找匹配的列表元素
                if ([...elesFromPoint].includes(eleList)) {
                    if (!eleList.classList.contains('selected') && !eleList.classList.contains('disabled')) {
                        eleList.href = 'javascript:';
                    }
                    // 退出循环
                    // forEach无法中断，因此这里使用了for循环
                    break;
                }
            }
        });
        this.addEventListener('mouseout', () => {
            var eleListAllWithHref = eleDatalist.querySelectorAll('a[href]');
            eleListAllWithHref.forEach(function (eleList) {
                eleList.removeAttribute('href');
            });
        });
        document.addEventListener('mouseup', () => {
            this.removeAttribute('data-active');
        });
    }

    /**
     * 重置原生的属性s
     */
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

    /**
     * <select>属性变化时候的处理
     * @param {String} name 变化的属性名称
     */
    attributeChangedCallback (name) {
        const eleButton = this.element.button;

        if (name === 'disabled') {
            if (!eleButton) return;
            if (this.disabled) {
                eleButton.removeAttribute('href');
            } else {
                eleButton.setAttribute('href', 'javascript:;');
            }
        } else if (name === 'multiple') {
            if (this.element.combobox) {
                this.element.combobox.remove();
                this.render();
            }
        } else if (name == 'width') {
            this.setWidth();
        }
    }

    /**
     * is="ui-select" 元素载入到页面后
     */
    connectedCallback () {
        // 观察
        this.observer = new MutationObserver((mutationsList) => {
            let isRefresh = true;
            mutationsList.forEach(mutation => {
                if (mutation.type == 'attributes' && mutation.target.hasAttribute('selected')) {
                    // setAttribute('selected') 并不一定能真正改变selected状态
                    // 因此这里重新设置一次
                    mutation.target.selected = true;
                    // 上面代码就会自动触发刷新，无需再执行一次
                    isRefresh = false;
                }
            });
            if (isRefresh) {
                this.refresh();
            }
        });
        this.resizeObserver = new ResizeObserver(() => {
            this.setWidth();
        });
        this.observer.observe(this, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['selected']
        });
        this.resizeObserver.observe(this);

        // 全局事件
        this.dispatchEvent(new CustomEvent('connected', {
            detail: {
                type: 'ui-select'
            }
        }));

        // 渲染
        this.render();
    }

    /**
     * is="ui-select" 元素从页面移除后
     */
    disconnectedCallback () {
        this.remove();
        this.observer.disconnect();
        this.resizeObserver.disconnect();
    }
}

// option.selected 观察
const propOptionSelected = Object.getOwnPropertyDescriptor(HTMLOptionElement.prototype, 'selected');
Object.defineProperty(HTMLOptionElement.prototype, 'selected', {
    ...propOptionSelected,
    set (value) {
        propOptionSelected.set.call(this, value);

        // 重新渲染
        if (this.parentElement && this.parentElement.refresh) {
            this.parentElement.refresh();
        }
    }
});

// 自定义元素注册
if (!customElements.get('ui-select')) {
    customElements.define('ui-select', Select, {
        extends: 'select'
    });
}
