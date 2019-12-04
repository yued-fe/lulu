/**
 * @Select.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-18
 * @edit:    07-06-15  rewrite
 * @edit:    09-08-28  native js rewrite
**/

(function (global, factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Select = factory();
    }
}(this, function () {

    /**
     * 模拟下拉框效果
     * 针对所有浏览器进行处理
     * 基于原生的<select>元素生成
     *
     */

    // 常量变量
    var SELECT = 'select';
    var SELECTED = 'selected';
    var DISABLED = 'disabled';
    var ACTIVE = 'active';
    var REVERSE = 'reverse';
    var MULTIPLE = 'multiple';

    // 样式类名统一处理
    var CL = {
        add: function () {
            return ['ui', SELECT].concat([].slice.call(arguments)).join('-');
        },
        toString: function () {
            return 'ui-' + SELECT;
        }
    };

    /**
     * 基于原生下拉框生成的下拉组件
     * @param {Object} element 原生select元素
     */
    var Select = function (element) {
        if (!element) {
            return this;
        }

        var eleSelect = element;

        // 避免重复初始化
        if (eleSelect.data && eleSelect.data.select) {
            return;
        }
        // eleSelect元素的尺寸
        this.offsetWidth = eleSelect.offsetWidth;
        this.offsetHeight = eleSelect.offsetHeight;

        // 构造元素
        // 1. 得到关联id
        var strId = eleSelect.id;
        if (!strId) {
            strId = ('lulu_' + Math.random()).replace('0.', '');
        } else {
            strId = 'lulu_' + strId;
        }
        this.id = strId;

        // 2. 是否多选
        var isMultiple = (typeof eleSelect.getAttribute(MULTIPLE) == 'string');
        this.multiple = isMultiple;

        // 3. 创建下拉组合框元素
        var eleCombobox = document.createElement('div');
        eleCombobox.setAttribute('role', 'combobox');

        // 4. 创建下拉点击按钮元素
        var eleButton = document.createElement('a');
        if (!eleSelect[DISABLED]) {
            eleButton.setAttribute('href', 'javascript:');
        }
        eleButton.setAttribute('data-target', strId);
        // 下面3个aria无障碍访问需要
        eleButton.setAttribute('role', 'button');
        eleButton.setAttribute('aria-expanded', 'false');
        eleButton.setAttribute('aria-owns', strId);
        // 样式类名
        eleButton.classList.add(CL.add('button'));

        // 5. 创建下拉列表元素
        var eleDatalist = document.createElement('div');
        eleDatalist.id = strId;
        eleDatalist.setAttribute('role', 'listbox');
        eleDatalist.setAttribute('aria-expanded', 'true');
        eleDatalist.classList.add(CL.add('datalist'));

        // 6. 元素组装
        // multiple没有button
        if (isMultiple == false) {
            eleCombobox.appendChild(eleButton);
            eleCombobox.appendChild(eleDatalist);
            // 插入到下拉框的后面
            eleSelect.style.display = 'none';
            eleSelect.insertAdjacentElement('afterend', eleCombobox);
        } else {
            eleCombobox.appendChild(eleDatalist);
            // 绝对定位隐藏，以便可以响应键盘focus
            eleSelect.style.position = 'absolute';
            eleSelect.style.zIndex = 1;
            eleSelect.insertAdjacentElement('afterend', eleCombobox);
            // 视觉列表不参与设置为不可访问
            eleDatalist.setAttribute('aria-hidden', 'true');
        }
        // 暴露给其他方法
        this.element = {
            select: eleSelect,
            combobox: eleCombobox,
            button: eleButton,
            datalist: eleDatalist
        };

        // 刷新内容
        this.refresh();

        // 事件绑定
        this.events();

        // 存储
        if (!eleSelect.data) {
            eleSelect.data = {
                select: this
            };
        } else {
            eleSelect.data.select = this;
        }
    };

    /**
     * 下拉相关的事件处理
     * @return {[type]} [description]
     */
    Select.prototype.events = function () {
        // 各个元素
        var objElement = this.element;
        // 主要的几个元素
        var eleSelect = objElement.select;
        var eleCombobox = objElement.combobox;
        var eleButton = objElement.button;
        var eleDatalist = objElement.datalist;

        // 单选下拉框的事件
        if (this.multiple == false) {
            // 点击按钮
            eleButton.addEventListener('click', function () {
                if (eleSelect[DISABLED]) {
                    return false;
                }

                // 显示与隐藏
                eleCombobox.classList.toggle(ACTIVE);

                if (eleCombobox.classList.contains(ACTIVE)) {
                    // 边界判断
                    var isOverflow = eleDatalist.getBoundingClientRect().bottom + window.pageYOffset > Math.max(document.body.clientHeight, window.innerHeight);
                    eleCombobox.classList[isOverflow ? 'add' : 'remove'](REVERSE);
                    // aria状态
                    eleButton.setAttribute('aria-expanded', 'true');

                    // 滚动与定位
                    var arrDataScrollTop = eleCombobox.dataScrollTop;
                    var eleDatalistSelected = eleDatalist.querySelector('.' + SELECTED);
                    // 严格验证
                    if (arrDataScrollTop && arrDataScrollTop[1] == eleDatalistSelected.getAttribute('data-index') && arrDataScrollTop[2] == eleDatalistSelected.innerText) {
                        eleDatalist.scrollTop = arrDataScrollTop[0];
                        // 重置
                        delete eleCombobox.dataScrollTop;
                    }
                } else {
                    eleCombobox.classList.remove(REVERSE);
                    // aria状态
                    eleButton.setAttribute('aria-expanded', 'false');
                }
            });

            // 点击列表项
            eleDatalist.addEventListener('click', function (event) {
                var target = event.target;
                if (!target || !target.closest('a[data-index]')) {
                    return;
                }
                // 点击的列表元素
                var eleList = target;
                // 对应的下拉<option>元素
                var eleOption = null;
                // 是否当前点击列表禁用
                var isDisabled = eleList.classList.contains(DISABLED);
                // 获取索引
                var indexOption = eleList.getAttribute('data-index');
                // 存储可能的滚动定位需要的数据
                var scrollTop = eleDatalist.scrollTop;
                eleCombobox.dataScrollTop = [scrollTop, indexOption, eleList.innerText];

                // 修改下拉选中项
                if (isDisabled == false) {
                    eleOption = eleSelect[indexOption];
                    if (eleOption) {
                        eleOption[SELECTED] = true;
                    }
                }
                // 下拉收起
                eleCombobox.classList.remove(ACTIVE);
                eleButton.setAttribute('aria-expanded', 'false');
                // focus
                eleButton.focus();
                eleButton.blur();

                if (isDisabled == false) {
                    // 更新下拉框
                    this.refresh();
                    // 回调处理
                    // 触发change事件
                    eleSelect.dispatchEvent(new CustomEvent('change', {
                        'bubbles': true
                    }));
                }
            }.bind(this));

            // 点击页面空白要隐藏
            document.addEventListener('mouseup', function (event) {
                var target = event.target;
                if (!target) {
                    return;
                }
                if (eleCombobox.classList.contains(ACTIVE) && eleCombobox != target && eleCombobox.contains(target) == false) {
                    eleCombobox.classList.remove(ACTIVE);
                    eleCombobox.classList.remove(REVERSE);
                }
            });

            // disabled状态变化与键盘访问
            var funSyncDisabled = function () {
                if (eleSelect[DISABLED]) {
                    eleButton.removeAttribute('href');
                } else {
                    eleButton.href = 'javascript:';
                }
            };
            // 禁用状态变化检测
            if (window.MutationObserver) {
                var observerSelect = new MutationObserver(function (mutationsList) {
                    mutationsList.forEach(function (mutation) {
                        if (mutation.type == 'attributes') {
                            funSyncDisabled();
                        }
                    });
                });

                observerSelect.observe(eleSelect, {
                    attributes: true,
                    attributeFilter: [DISABLED]
                });
            } else {
                eleSelect.addEventListener('DOMAttrModified', function (event) {
                    if (event.attrName == DISABLED) {
                        funSyncDisabled();
                    }
                });
            }
        } else {
            // 下拉多选
            // 键盘交互UI同步
            eleSelect.addEventListener('change', function () {
                // 更新下拉框
                this.refresh();
            }.bind(this));
            // 滚动同步
            eleSelect.addEventListener('scroll', function () {
                eleDatalist.scrollTop = eleSelect.scrollTop;
            });
            // hover穿透
            eleSelect.addEventListener('mousedown', function () {
                eleSelect.setAttribute('data-active', 'true');
            });
            eleSelect.addEventListener('mousemove', function (event) {
                if (eleSelect.getAttribute('data-active')) {
                    this.refresh();

                    return;
                }
                var clientY = event.clientY;
                // 当前坐标元素
                // 最好方法是使用
                // document.elementsFromPoint
                // IE10+是document.msElementFromPoint
                // 但IE8, IE9浏览器并不支持
                // 所以这里采用其他方法实现
                // 判断列表的y位置和clientY做比较
                var eleListAll = eleDatalist.querySelectorAll('a');
                for (var indexList = 0; indexList < eleListAll.length; indexList++) {
                    var eleList = eleListAll[indexList];
                    // hover状态先还原
                    eleList.removeAttribute('href');
                    // 然后开始寻找匹配的列表元素
                    // 进行比对
                    var beginY = eleList.getBoundingClientRect().top;
                    var endY = beginY + eleList.clientHeight;
                    // 如果在区间范围
                    if (clientY >= beginY && clientY <= endY) {
                        if (eleList.classList.contains(SELECTED) == false) {
                            eleList.href = 'javascript:';
                        }
                        // 退出循环
                        // forEach无法中断，因此这里使用了for循环
                        break;
                    }
                }
            }.bind(this));

            eleSelect.addEventListener('mouseout', function () {
                var eleListAllWithHref = eleDatalist.querySelectorAll('a[href]');
                eleListAllWithHref.forEach(function (eleList) {
                    eleList.removeAttribute('href');
                });
            });

            document.addEventListener('mouseup', function () {
                eleSelect.removeAttribute('data-active');
            });
        }
    };

    /**
     * 把下拉元素变成数据，格式为：
     * [{
        html: '选项1',
        value: '1',
        selected: false,
        className: 'a'
     }, {
        html: '选项2',
        value: '2',
        selected: true,
        className: 'b'
     }]
    * @return 数组
    */
    Select.prototype.getData = function () {
        var eleSelect = this.element.select;

        var eleOptions = eleSelect.querySelectorAll('option');

        if (eleOptions.length == 0) {
            return [{
                html: ''
            }];
        }

        return [].slice.call(eleOptions).map(function (option) {
            return {
                html: option.innerHTML,
                value: option.value,
                selected: option.selected,
                disabled: option.disabled,
                className: option.className
            };
        });
    };

    /**
     * 下拉刷新方法
     * @param  {Array} data 根据数组数据显示下拉内容
     * @return {Object}     返回当前实例对象
     */
    Select.prototype.refresh = function (data) {
        // 实例id
        var id = this.id;
        // 是否多选
        var isMultiple = this.multiple;
        // 各个元素
        var objElement = this.element;
        // 主要的几个元素
        var eleSelect = objElement.select;
        var eleCombobox = objElement.combobox;
        var eleButton = objElement.button;
        var eleDatalist = objElement.datalist;

        // 获取当下下拉框的数据和状态
        data = data || this.getData();

        // 下拉组合框元素的UI和尺寸
        eleCombobox.className = (eleSelect.className + ' ' + CL).trim();
        eleCombobox.style.width = this.offsetWidth + 'px';

        // 多选，高度需要同步，因为选项高度不确定
        if (isMultiple) {
            eleCombobox.style.height = this.offsetHeight + 'px';
        } else {
            // 按钮元素中的文案
            eleButton.innerHTML = '<span class="' + CL.add('text') + '">' + (function () {
                var htmlSelected = '';

                data.forEach(function (obj) {
                    if (obj.selected) {
                        htmlSelected = obj.html;
                    }
                });

                return htmlSelected || data[0].html;
            })() + '</span><i class="' + CL.add('icon') + '" aria-hidden="true"></i>';
        }

        // 列表内容的刷新
        eleDatalist.innerHTML = data.map(function (obj, index) {
            var arrCl = [CL.add('datalist', 'li'), obj.className];

            if (obj[SELECTED]) {
                arrCl.push(SELECTED);
            }
            if (obj[DISABLED]) {
                arrCl.push(DISABLED);
            }

            // 复选模式列表不参与无障碍访问识别，因此HTML相对简单
            if (isMultiple) {
                return '<a class="' + arrCl.join(' ') + '" data-index=' + index + '>' + obj.html + '</a>';
            }

            return '<a ' + (obj[DISABLED] ? '' : 'href="javascript:" ') + 'class="' + arrCl.join(' ') + '" data-index=' + index + ' data-target="' + id + '" role="option" aria-selected="' + obj[SELECTED] + '">' + obj.html + '</a>';
        }).join('');

        return this;
    };

    /**
     * 删除方法
     * @return {[type]} [description]
     */
    Select.prototype.remove = function () {
        // 主元素
        var eleCombobox = this.element.combobox;

        if (eleCombobox) {
            eleCombobox.remove();
        }
    };

    // 重新定义select元素的value方法
    Object.defineProperty(HTMLSelectElement.prototype, 'value', {
        configurable: true,
        enumerable: true,
        writeable: true,
        get: function () {
            var arrValue = [];
            this.querySelectorAll('option').forEach(function (eleOption) {
                if (eleOption[SELECTED] == true) {
                    arrValue.push(eleOption.value);
                }
            });

            return arrValue.join();
        },
        set: function (value) {
            var isOptionMatch = false;
            // 是否多选框
            var isMultiple = (typeof this.getAttribute('multiple') == 'string');
            if (isMultiple) {
                value = value.split(',');
            } else {
                value = [value.toString()];
            }

            this.querySelectorAll('option').forEach(function (eleOption) {
                // 单选框模式下，如果多个值匹配，让第一个选中
                // 如果没有下面这句，会最后一个匹配的选中
                if (isMultiple == false && isOptionMatch == true) {
                    return;
                }
                if (value.indexOf(eleOption.value) != -1) {
                    eleOption[SELECTED] = isOptionMatch = true;
                } else if (isMultiple) {
                    eleOption[SELECTED] = false;
                }
            });

            // 如果包含匹配的值，则重新刷新
            if (isOptionMatch == true) {
                this.refresh();
            }
        }
    });

    HTMLSelectElement.prototype.refresh = function () {
        if (this.data && this.data.select) {
            this.data.select.refresh();
        } else {
            new Select(this);
        }
    };

    var funAutoInitAndWatching = function () {
        // 如果没有开启自动初始化，则返回
        if (window.autoInit === false) {
            return;
        }
        document.querySelectorAll('select').forEach(function (eleSelect) {
            if (window.getComputedStyle(eleSelect).opacity != '1') {
                eleSelect.refresh();
            }
        });

        // 如果没有开启观察，不监听DOM变化
        if (window.watching === false) {
            return;
        }

        var funSyncRefresh = function (node, action) {
            if (node.nodeType != 1) {
                return;
            }

            if (node.tagName == 'SELECT') {
                if (action == 'remove') {
                    node.data.select[action]();
                } else {
                    node[action]();
                }
            } else if (node.tagName == 'OPTION') {
                var eleSelect = node.parentElement;
                if (!eleSelect) {
                    // 可以认为是观察者模式的删除
                    if (this.target && this.target.tagName == 'SELECT') {
                        this.target.refresh();
                    }
                } else if (eleSelect.data && eleSelect.data.select) {
                    setTimeout(function () {
                        eleSelect.refresh();
                    }, 16);
                }
            }
        };

        // DOM Insert自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    var nodeAdded = mutation.addedNodes;
                    var nodeRemoved = mutation.removedNodes;

                    if (nodeAdded.length) {
                        nodeAdded.forEach(function (eleAdd) {
                            funSyncRefresh.call(mutation, eleAdd, 'refresh');
                        });
                    }
                    if (nodeRemoved.length) {
                        nodeRemoved.forEach(function (eleRemove) {
                            funSyncRefresh.call(mutation, eleRemove, 'remove');
                        });
                    }
                });
            });

            observerSelect.observe(document.body, {
                childList: true,
                subtree: true
            });
        } else {
            document.body.addEventListener('DOMNodeInserted', function (event) {
                // 插入节点
                funSyncRefresh(event.target, 'refresh');
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

    return Select;
}));
