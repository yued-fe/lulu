/**
 * @Table.js
 * @author   zhangxinxu
 * @version
 * @created  15-06-28
 * @edited   17-07-18 非模块化使用支持
 *           19-12-03 ES5原生语法支持
**/

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        global.Drop = require('../ui/Drop');
        global.Pagination = require('../ui/Pagination');
        global.Loading = require('../ui/Loading');
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Table = factory();
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : this)), function (require) {
    var Drop = this.Drop;
    var Pagination = this.Pagination;
    var Loading = this.Loading;

    if (typeof require == 'function') {
        if (!Pagination) {
            Pagination = require('common/ui/Pagination');
        }
        if (!Drop) {
            Drop = require('common/ui/Drop');
        }
        // 加载动效
        if (!Loading) {
            Loading = require('common/ui/Loading');
        }
    } else if (!Loading) {
        window.console.warn('suggest include Loading.js');
    }

    // 滚动到顶部缓动实现
    // rate表示缓动速率，默认是2
    window.scrollTopTo = function (top, callback) {
        var scrollTop = document.scrollingElement.scrollTop;
        var rate = 2;

        var funTop = function () {
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

    /**
     * 项目表格组件
     * @使用示例
     *  new Table($('#table'), {});
     */

    var LOADING = 'loading';

    var CHECKED = 'checked';
    var SELECTED = 'selected';

    // 一些元素类名
    var CL = {
        empty: 'table-null-x',
        // 错误
        error: 'table-error-x',
        // 加载
        loading: 'ui-loading',
        // 下面是分页相关的：
        //   总数据量
        total: 'table-page-total',
        //   每页系那是数目
        per: 'table-page-per',
        //   分页左侧容器
        data: 'table-page-data',
        //   分页列表（右侧）容器
        page: 'table-page',
        // 复选框选择器
        checkbox: '[type="checkbox"]'
    };

    // 表格
    var Table = function (element, options) {
        if (typeof element == 'string') {
            element = document.querySelector(element);
        }

        if (!element) {
            return this;
        }

        if (element.data && element.data.table) {
            return element.data.table;
        }

        var defaultPageOptions = {
            // 总数据量
            total: 0,
            // 每页显示数目
            per: 15,
            // 当前的页数
            current: 1,

            // 与后台交互时候UI分页需要的参数和后台分页参数对应关系
            // 下面注释的是起点个人中心的接口对应关系
            // 其中key表示后台分页数据在那个接口名称下，例如，下面注释内容表示的JSON数据结构是：
            // {
            //     "code": 0,
            //     "data": {
            //         "pageInfo": {
            //             "pageIndex": 1,
            //             "pageSize": 20,
            //             "pageMax": 6,
            //             "totalCount": 113
            //          }
            //     }
            // }
            // keyMap: {
            //     key: 'pageInfo',
            //     total: 'totalCount',
            //     per: 'pageSize',
            //     current: 'pageIndex'
            // }
            // 下面这里未注释的是默认设定
            keyMap: {
                key: '',
                total: 'total',
                per: 'per',
                current: 'current'
            }
        };

        // 默认参数
        var defaults = {
            // 请求列表数据的Ajax参数
            // 默认dataType为'json'
            ajaxOptions: { },
            // 分页数目下拉内容
            pageList: [15, 30, 50],
            // 一般情况下，pageOptions参数都是使用默认值
            // 就算有分页字段名称调整，也建议修改defaultPageOptions中的关键字
            pageOptions: defaultPageOptions,
            // 对请求的JSON数据进行处理，并返回
            parse: function (data) {
                if (typeof data == 'string') {
                    return data;
                }

                return '';
            },
            // 列表内容显示的回调
            onShow: function () {},
            // 点击分页的回调
            // 如果存在，会替换本组件内置的分页Ajax处理
            // 经过N多年实践，此参数使用场景不多
            onPage: null,
            // 点击复选框的回调
            onCheck: function () {}
        };

        // 参数合并
        var objParams = Object.assign({}, defaults, options || {});

        // 分页合并
        if (options.pageOptions) {
            objParams.pageOptions = Object.assign({}, defaultPageOptions, options.pageOptions);
        }

        // 表格元素
        var eleTable = element;
        // 容器元素
        var eleContainer = eleTable.parentElement;
        // 空元素
        var eleEmpty = eleContainer.querySelector('.' + CL.empty);
        // loading元素
        var eleLoading = eleContainer.querySelector(CL.loading + ', .' + CL.loading);

        // 分页相关的元素
        var eleTotal = eleContainer.querySelector('.' + CL.total);
        var elePer = eleContainer.querySelector('.' + CL.per);
        var eleData = eleContainer.querySelector('.' + CL.data);
        var elePage = eleContainer.querySelector('.' + CL.page);

        // 元素之类
        this.element = {
            container: eleContainer,
            table: eleTable,
            empty: eleEmpty,
            loading: eleLoading,
            total: eleTotal,
            per: elePer,
            data: eleData,
            page: elePage
        };

        // 回调之类
        this.callback = {
            parse: objParams.parse,
            page: objParams.onPage,
            check: objParams.onCheck,
            show: objParams.onShow
        };

        // 数据之类
        this.params = {
            page: objParams.pageOptions,
            ajax: objParams.ajaxOptions,
            list: objParams.pageList
        };

        // ajax数据
        this.events();

        // 获得数据
        var eleTbody = eleTable.querySelector('tbody');
        if (!eleTbody) {
            window.console.error('<tbody>元素必需');
            return;
        }

        if (eleTbody.textContent.trim() == '') {
            this.isFirstAjax = true;
            this.ajax();
        } else {
            // 认为是列表第一页直出，
            // 这样的交互可以有更好体验
            this.page();
        }

        // 存储实例
        if (!eleTable.data) {
            eleTable.data = {};
        }
        eleTable.data.table = this;
    };


    /**
     * 列表解决方案中的事件处理
     * @return {[type]} [description]
     */
    Table.prototype.events = function () {
        // 实例暴露的参数
        var objParams = this.params;
        var objElement = this.element;
        var objCallback = this.callback;

        // 一些事件
        // 单复选框选中效果
        var eleTable = objElement.table;

        eleTable.addEventListener('click', function (event) {
            var eleCheckbox = event.target;

            if (!eleCheckbox || eleCheckbox.type != 'checkbox') {
                return;
            }

            var eleTr = eleCheckbox.closest('tr');

            // 如果不是第一td中的checkbox，忽略
            if (eleTr.querySelector(':first-child ' + CL.checkbox) !== eleCheckbox) {
                return;
            }

            // 获取所有的td标签中的复选框
            // 需要tr单元行显示，需要第一个子元素，需要可用
            var eleAllTdCheckbox = [];

            eleTable.querySelectorAll('tr').forEach(function (tr) {
                if (tr.clientWidth == 0) {
                    return;
                }

                var eleTdCheckbox = tr.querySelector('td:first-child ' + CL.checkbox + ':enabled');
                if (eleTdCheckbox) {
                    eleAllTdCheckbox.push(eleTdCheckbox);
                }
            });

            // 全选和非全选标志量
            var isAllChecked = false;
            var isAllUnchecked = false;
            // 全选
            var eleTh = eleCheckbox.closest('th');
            // 点击的是全选复选框
            if (eleTh) {
                isAllChecked = eleCheckbox[CHECKED];
                isAllUnchecked = !isAllChecked;
                // 下面所有的td复选框同步
                eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                    eleTdCheckbox[CHECKED] = isAllChecked;
                });
            } else {
                var numLengthChecked = [].slice.call(eleAllTdCheckbox).filter(function (eleTdCheckbox) {
                    return eleTdCheckbox[CHECKED];
                }).length;
                // 是否取消全选
                isAllChecked = (eleAllTdCheckbox.length == numLengthChecked);
                // 是否全部非选
                isAllUnchecked = (numLengthChecked == 0);
            }
            // 改变全选复选框的状态
            var eleThCheckbox = eleTable.querySelector('th:first-child ' + CL.checkbox);
            if (eleThCheckbox) {
                eleThCheckbox[CHECKED] = isAllChecked;
            }

            // 根据复选框状态决定表格行样式
            eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                eleTdCheckbox.closest('tr').classList[eleTdCheckbox[CHECKED] ? 'add' : 'remove'](SELECTED);
            });

            // 回调
            objCallback.check.call(this, isAllChecked, isAllUnchecked, eleCheckbox, eleAllTdCheckbox);

        }.bind(this));

        // 点击列表，只有不是a元素或者是复选框本事，选中当前复选框
        eleTable.addEventListener('click', function (event) {
            var eleTarget = event.target;
            var eleCheckbox = null;

            if (eleTarget && /^(?:a|input|textarea|tbody|i|select|label|th)$/i.test(eleTarget.tagName) == false) {
                eleCheckbox = eleTarget.closest('tr') && eleTarget.closest('tr').querySelector('td:first-child ' + CL.checkbox + ':enabled');
                if (eleCheckbox) {
                    eleCheckbox.click();
                }
            }
        });

        // 切换每页数目的dropList
        // 求得当前选中的分页数
        // 优先本地存储
        var strStoreId = eleTable.id;
        var numCurrentPer = objParams.page.per;
        var elePer = objElement.per;

        if (elePer) {
            if (strStoreId && window.localStorage && localStorage[strStoreId]) {
                numCurrentPer = localStorage[strStoreId];
                objParams.page.per = numCurrentPer;
            }
            // 赋值
            elePer.innerHTML = numCurrentPer;

            if (!Drop) {
                window.console.error('need Drop.js');
                return;
            }

            // 下拉
            this.dropList = new Drop(elePer).list(objParams.list.map(function (number) {
                return {
                    value: number
                };
            }), {
                width: 60,
                onSelect: function (data) {
                    var numPerNew = data.value;

                    // 记住当前选择的分页数
                    if (window.localStorage && strStoreId) {
                        localStorage[strStoreId] = numPerNew;
                    }

                    // 如果分页有变
                    if (objParams.page.per != numPerNew) {
                        // 改变分页数目
                        objParams.page.per = numPerNew;
                        // 当前页重置为1
                        objParams.page.current = 1;
                        // 重新刷新
                        this.ajax();
                    }
                }.bind(this)
            });
        }
    };


    /**
     * 列表数据请求
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    Table.prototype.ajax = function (options) {
        options = options || {};

        // 暴露的参数和元素
        var objParams = this.params;
        var objElement = this.element;
        var objCallback = this.callback;

        // 列表元素
        var eleTable = objElement.table;
        var eleContainer = objElement.container;

        // 避免重复请求
        if (eleTable.getAttribute('aria-busy') == 'true') {
            return this;
        }

        // 列表容器元素
        var eleTbody = eleTable.querySelector('tbody');

        // ajax请求参数
        var objAjax = Object.assign({}, objParams.ajax, options);

        // ajax地址是必需项
        if (!objAjax.url) {
            return this;
        }

        if (/^\/\//.test(objAjax.url)) {
            objAjax.url = location.protocol + objAjax.url;
        }

        // 1. ajax发送的data数据走合并策略
        var data = options.data || {};
        var dataOptions = objParams.ajax.data || {};

        if (typeof dataOptions == 'function') {
            dataOptions = dataOptions() || {};
        }

        // 发送给后台的分页数据的键值对
        var dataPage = {};
        var objKeyMap = objParams.page.keyMap;

        if (objKeyMap) {
            dataPage[objKeyMap['current']] = objParams.page.current;
            dataPage[objKeyMap['per']] = objParams.page.per;
        }

        // current和per数据的更新
        var objDataSend = Object.assign({}, dataPage, dataOptions, data);

        if (objKeyMap) {
            objParams.page.current = objDataSend[objKeyMap['current']];
            objParams.page.per = objDataSend[objKeyMap['per']];
        }

        // 2. url get请求地址合并
        var objAjaxParams = new URLSearchParams(objDataSend);
        // URL处理
        var strUrlAjax = objAjax.url;

        // 查询字符串的处理
        var strUrlSearch = '?';
        if (strUrlAjax.split('?').length > 1) {
            strUrlSearch = strUrlSearch + strUrlAjax.split('?')[1];
        }

        // URL拼接
        strUrlAjax = strUrlAjax.split('?')[0] + strUrlSearch + '&' + objAjaxParams.toString();

        // 3. 回调方法的处理
        // ajax发生错误的处理
        var funError = function (content) {
            var eleError = eleContainer.querySelector('.' + CL.error);

            if (!eleError) {
                eleError = document.createElement('div');
                eleError.className = CL.error;
                // 创建的错误元素插到列表的后面
                eleTable.insertAdjacentElement('afterend', eleError);

                objElement.error = eleError;
            }
            eleError.style.display = 'block';
            eleError.innerHTML = content || '数据没有获取成功';

            if (typeof objAjax.error == 'function') {
                objAjax.error();
            }
        };
        // 请求完成的事件处理
        var funComplete = function () {
            // 请求结束标志量
            eleTable.removeAttribute('aria-busy');
            // 去除中间的大loading
            if (objElement.loading) {
                objElement.loading.style.display = 'none';
            }

            // 去掉分页的小loading
            if (this.pagination) {
                var elePageLoading = this.pagination.element.container.querySelector('.' + LOADING);
                if (elePageLoading) {
                    elePageLoading.classList.remove(LOADING);
                }
            }
            if (typeof objAjax.complete == 'function') {
                objAjax.complete();
            }

            // 呈现与动画
            this.show();
        };

        // 执行Ajax请求的方法
        var funAjax = function () {
            // IE9不支持跨域
            if (!history.pushState && /\/\//.test(strUrlAjax) && strUrlAjax.split('//')[1].split('/')[0] != location.host) {
                funComplete.call(this);
                funError('当前浏览器不支持跨域数据请求');
                return;
            }

            // 请求执行
            var xhr = new XMLHttpRequest();
            // 使用GET方法拉取列表数据
            xhr.open('GET', strUrlAjax);
            // 请求完毕后的处理
            xhr.onload = function () {
                var json = {};

                try {
                    json = JSON.parse(xhr.responseText) || {};
                } catch (event) {
                    funComplete.call(this);
                    funError('解析异常，请稍后重试');
                    return;
                }

                // 出错处理
                // 0认为是成功
                // 关键字支持code或者error
                // { code: 0 } 或 { error: 0 } 都认为成功
                if (json.code !== 0 && json.error !== 0) {
                    funComplete.call(this);
                    funError(json.msg || '返回数据格式不符合要求');
                    return;
                }

                var strHtml = objCallback.parse(json);

                // 如果解析后无数据，显示空提示信息
                if (history.pushState) {
                    eleTbody.innerHTML = strHtml || '';
                } else {
                    // IE9 tbody不能直接innerHTML
                    var eleTemp = document.createElement('div');
                    eleTemp.innerHTML = '<table><tbody>' + (strHtml || '') + '</tbody></table>';

                    eleTbody.parentNode.replaceChild(eleTemp.firstChild.firstChild, eleTbody);
                }

                // 内容为空的处理
                var eleEmpty = objElement.empty;
                if (!strHtml || !strHtml.trim()) {
                    if (!eleEmpty) {
                        eleEmpty = document.createElement('div');
                        eleEmpty.className = CL.empty;
                        // 插入到列表元素后面
                        eleTable.insertAdjacentElement('afterend', eleEmpty);

                        objElement.empty = eleEmpty;
                    }
                    eleEmpty.style.display = 'block';
                }

                // 获得后端返回的分页总数
                var jsonKey = objKeyMap.key;
                // 总数目
                var numTotal;

                if (jsonKey) {
                    numTotal = json.data[jsonKey][objKeyMap['total']];
                } else {
                    numTotal = json.data[objKeyMap['total']];
                }

                // 修改总数值并显示
                if (numTotal || numTotal == 0) {
                    if (objElement.total) {
                        objElement.total.innerHTML = numTotal;
                    }

                    objParams.page.total = numTotal;
                }

                // 左侧切换分页数目元素显示
                if (objElement.data) {
                    objElement.data.style.display = 'block';
                }

                this.page();

                if (typeof objAjax.success == 'function') {
                    objAjax.success(json);
                }

                funComplete.call(this);
            }.bind(this);
            // 请求网络异常处理
            xhr.onerror = function () {
                funError('网络异常，数据没有获取成功，您可以稍后重试！');
                // 因为IE9不支持oncomplate，
                // 所以在onload和onerror方法中处理了
                funComplete.call(this);
            }.bind(this);

            xhr.send();

            // 标记输入框忙碌状态
            eleTable.setAttribute('aria-busy', 'true');
        };

        // 滚动到表格上边缘
        var numScrollTop = window.pageYOffset;

        // loading元素
        var eleLoading = objElement.loading;
        if (!eleLoading) {
            eleLoading = document.createElement('div');
            eleLoading.className = CL.loading;
            // 插入到列表元素后面
            eleTable.insertAdjacentElement('afterend', eleLoading);

            objElement.loading = eleLoading;
        }

        // 显示loading
        eleLoading.style.paddingBottom = '';

        if (window.getComputedStyle(eleLoading).display == 'none') {
            var eleThead = eleTable.querySelector('thead');

            eleLoading.style.height = (eleTable.clientHeight - (eleThead ? eleThead.clientHeight : 0)) + 'px';

            if (eleTbody.innerHTML.trim() == '') {
                eleLoading.style.height = '';
            }
        }

        // 微调圈圈的位置
        var numDistance = parseFloat(eleLoading.style.height) - window.innerHeight;

        // loading尺寸比浏览器窗口还大
        // 微调未知，使在窗体居中位置
        if (numDistance > 0) {
            eleLoading.style.paddingBottom = numDistance + 'px';
        }

        // loading显示
        eleLoading.style.display = 'block';

        // 其他元素隐藏
        if (objElement.empty) {
            objElement.empty.style.display = 'none';
        }
        if (objElement.error) {
            objElement.error.style.display = 'none';
        }

        eleTbody.innerHTML = '';

        // 请求走起
        // 判断是否需要先滚动
        var objBound = eleTable.getBoundingClientRect();
        // 第一次不定位
        if (!this.isFirstAjax && objBound.top < 0) {
            numScrollTop = objBound.top + numScrollTop;
            window.scrollTopTo(numScrollTop, function () {
                funAjax.call(this);
            }.bind(this));
        } else if (!this.isFirstAjax && objBound.top > window.innerHeight) {
            numScrollTop = numScrollTop - objBound.top;
            window.scrollTopTo(numScrollTop, function () {
                funAjax.call(this);
            }.bind(this));
        } else {
            funAjax.call(this);

            this.isFirstAjax = false;
        }

        return this;
    };

    /**
     * 分页的处理
     * @param  {[type]} total [description]
     * @return {[type]}       [description]
     */
    Table.prototype.page = function (total) {
        if (!this.element.page) {
            return this;
        }
        if (!Pagination) {
            window.console.error('need Pagination.js');
            return this;
        }
        var objPage = this.params.page;

        // 显示分页
        if (this.pagination) {
            this.pagination.params = Object.assign(this.pagination.params, objPage);
            this.pagination.show();
        } else {
            this.pagination = new Pagination(this.element.page, {
                total: total || objPage.total,
                current: objPage.current,
                per: objPage.per,
                mode: objPage.mode || 'long',
                onClick: function (eleClicked, numCurrent) {
                    // 更新分页
                    objPage.current = numCurrent;
                    // 自定义分页事件
                    if (typeof this.callback.page == 'function') {
                        this.callback.page.call(this, eleClicked, numCurrent);
                    } else {
                        // 显示小loading
                        eleClicked.classList.add(LOADING);

                        // ajax再次
                        this.ajax();
                    }
                }.bind(this)
            });
        }
    };

    /**
     * 列表请求完毕显示的方法
     * @return {[type]} [description]
     */
    Table.prototype.show = function () {
        // 显示loading
        if (this.element.loading) {
            this.element.loading.style.paddingBottom = '';
        }

        //没有全选
        var eleThCheckbox = this.element.table.querySelector('th:first-child ' + CL.checkbox);
        if (eleThCheckbox) {
            eleThCheckbox[CHECKED] = false;
        }

        // 列表显示的回调
        if (typeof this.callback.show == 'function') {
            this.callback.show.call(this);
        }

        return this;
    };

    return Table;
}));
