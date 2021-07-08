/**
 * @Table.js
 * @author   zhangxinxu
 * @version
 * @created  15-06-28
 * @edited   17-07-18 非模块化使用支持
 *           19-12-03 ES5原生语法支持
 *           21-01-08 Web Components
**/
import '../ui/Drop.js';
import '../ui/Pagination.js';
import Validate from '../ui/Validate.js';

const Table = (function () {

    /**
     * 项目表格组件
     */

    let CHECKED = 'checked';
    let SELECTED = 'selected';

    // 一些元素类名
    let CL = {
        empty: 'table-null-x',
        // 错误
        error: 'table-error-x',
        // 分页容器类名
        page: 'table-page',
        // 复选框选择器
        checkbox: '[type="checkbox"]'
    };

    class Table extends HTMLTableElement {
        static get defaultKeyMap () {
            return {
                key: '',
                total: 'total',
                per: 'per',
                current: 'current'
            };
        }

        // 滚动到顶部缓动实现
        // rate表示缓动速率，默认是2
        static scrollTopTo (top, callback) {
            let scrollTop = document.scrollingElement.scrollTop;
            let rate = 2;

            let funTop = function () {
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
        }

        constructor () {
            super();

            this.params = this.params || {};
            this.element = this.element || {};

            // 内置的固定参数
            this.params.parse = (data) => {
                // 如果有模板，按照模板和内置的ES6模板字符串语法进行渲染
                if (this.params.template) {
                    return this.params.template.interpolate(data);
                }

                return '';
            };

            // 其他参数的设置
            this.params.ajax = {};
            this.params.form = {};
            this.params.list = [15, 30, 50];
            this.params.page = {
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
                keyMap: Table.defaultKeyMap
            };
        }

        setParams (options) {
            options = options || {};

            // 分页数据中的keyMap也是一个可选参数对象
            // 为了支持嵌套合并，这里提前处理下
            let objPageOption = options.page;
            if (objPageOption) {
                objPageOption.keyMap = Object.assign({}, this.params.page.keyMap || Table.defaultKeyMap, objPageOption.keyMap || {});
            }

            this.params = Object.assign(this.params, options);

            return this;
        }

        /**
         * 列表解决方案中的事件处理
         * @return {[type]} [description]
         */
        events () {
            // 实例暴露的参数
            let objParams = this.params;
            let objElement = this.element;

            // 一些事件
            // 单复选框选中效果
            this.addEventListener('click', function (event) {
                let eleCheckbox = event.target;

                if (!eleCheckbox || eleCheckbox.type != 'checkbox') {
                    return;
                }

                let eleTr = eleCheckbox.closest('tr');

                // 如果不是第一td中的checkbox，忽略
                if (eleTr.querySelector(':first-child ' + CL.checkbox) !== eleCheckbox) {
                    return;
                }

                // 获取所有的td标签中的复选框
                // 需要tr单元行显示，需要第一个子元素，需要可用
                let eleAllTdCheckbox = [];

                this.querySelectorAll('tr').forEach(function (tr) {
                    if (tr.clientWidth == 0) {
                        return;
                    }
                    // 所有非禁用复选框
                    let eleTdCheckbox = tr.querySelector('td:first-child ' + CL.checkbox + ':enabled');
                    if (eleTdCheckbox) {
                        eleAllTdCheckbox.push(eleTdCheckbox);
                    }
                });

                // 全选和非全选标志量
                let isAllChecked = false;
                let isAllUnchecked = false;
                // 全选
                let eleTh = eleCheckbox.closest('th');
                // 点击的是全选复选框
                if (eleTh) {
                    isAllChecked = eleCheckbox[CHECKED];
                    isAllUnchecked = !isAllChecked;
                    // 下面所有的td复选框同步
                    eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                        eleTdCheckbox[CHECKED] = isAllChecked;
                    });
                } else {
                    let numLengthChecked = [].slice.call(eleAllTdCheckbox).filter(function (eleTdCheckbox) {
                        return eleTdCheckbox[CHECKED];
                    }).length;
                    // 是否取消全选
                    isAllChecked = (eleAllTdCheckbox.length == numLengthChecked);
                    // 是否全部非选
                    isAllUnchecked = (numLengthChecked == 0);
                }
                // 改变全选复选框的状态
                let eleThCheckbox = this.querySelector('th:first-child ' + CL.checkbox);
                if (eleThCheckbox) {
                    eleThCheckbox[CHECKED] = isAllChecked;
                }

                // 根据复选框状态决定表格行样式
                eleAllTdCheckbox.forEach(function (eleTdCheckbox) {
                    eleTdCheckbox.closest('tr').classList[eleTdCheckbox[CHECKED] ? 'add' : 'remove'](SELECTED);
                });

                // 回调
                this.dispatchEvent(new CustomEvent('check', {
                    detail: {
                        isAllChecked: isAllChecked,
                        isAllUnchecked: isAllUnchecked,
                        target: eleCheckbox,
                        allEnabledCheckbox: eleAllTdCheckbox
                    }
                }));
            });

            // 点击列表，只有不是a元素或者是复选框本身，选中当前复选框
            this.addEventListener('click', function (event) {
                let eleTarget = event.target;
                let eleCheckbox = null;

                if (eleTarget && /^(?:a|input|textarea|tbody|i|select|label|th)$/i.test(eleTarget.tagName) == false) {
                    eleCheckbox = eleTarget.closest('tr') && eleTarget.closest('tr').querySelector('td:first-child ' + CL.checkbox + ':enabled');
                    if (eleCheckbox) {
                        eleCheckbox.click();
                    }
                }
            });

            // 分页选择的事件处理
            let elePagination = this.element.pagination;
            if (elePagination) {
                elePagination.addEventListener('change', event => {
                    let numCurrent = event.detail.current;
                    // 更新分页
                    objParams.page.current = numCurrent;
                    // 显示小loading
                    elePagination.loading = true;
                    // ajax再次
                    this.ajax();
                });
            }

            // 切换每页数目的dropList
            // 求得当前选中的分页数
            // 优先本地存储
            let strStoreId = this.id;
            let numCurrentPer = objParams.page.per;
            let elePer = objElement.drop;

            // 触发分页数量的下拉元素
            if (elePer && elePer.list) {
                if (strStoreId && localStorage[strStoreId]) {
                    numCurrentPer = localStorage[strStoreId];
                    objParams.page.per = Number(numCurrentPer);
                }
                // 赋值
                elePer.textContent = numCurrentPer;

                // 下拉
                elePer.list(() => {
                    return objParams.list.map(function (number) {
                        return {
                            value: number
                        };
                    });
                }, {
                    width: 60,
                    onSelect: (data) => {
                        let numPerNew = data.value;

                        // 记住当前选择的分页数
                        if (strStoreId) {
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
                    }
                });
            }

            // 关联表单的行为处理
            let eleForm = this.form;
            if (eleForm) {
                new Validate(eleForm, () => {
                    objParams.page.current = 1;
                    this.ajax({
                        data: this.params.form.data || {}
                    });
                }, {
                    validate: () => {
                        return this.params.form.validate || [];
                    }
                });
            }
        }

        /**
         * 列表数据请求
         * @param  {[type]} options [description]
         * @return {[type]}         [description]
         */
        ajax (options) {
            options = options || {};

            // 暴露的参数和元素
            let objParams = this.params;
            let objElement = this.element;

            // 避免重复请求
            if (this.getAttribute('aria-busy') == 'true') {
                return this;
            }

            // 列表容器元素
            let eleContainer = this.parentElement;
            let eleTbody = this.querySelector('tbody');
            let eleForm = this.form;

            // ajax请求参数
            // 可以从4处获取
            // 1. options直接传参
            // 2. this.setParams()传参，此参数可以多次使用，只要不被重置
            // 3. 关联form元素中的参数
            // 4. <table>元素上data-*获取，但是只能获取url参数
            // 以上优先级越往后越低

            // eleForm元素与参数获取
            let objAjaxForm = {
                data: {}
            };
            if (eleForm) {
                let strAttrAction = eleForm.getAttribute('action');
                if (strAttrAction) {
                    objAjaxForm.url = strAttrAction;
                }
                eleForm.querySelectorAll('input[name]:enabled, select[name]:enabled, textarea[name]:enabled').forEach(ele => {
                    if (/^(?:submit|image|file)$/.test(ele.type)) {
                        return;
                    }
                    objAjaxForm.data[ele.name] = ele.value;
                });
            }

            let objAjax = Object.assign({}, this.dataset, objAjaxForm, objParams.ajax, options);

            // ajax地址是必需项
            if (!objAjax.url) {
                this.element.pagination.loading = false;
                return this;
            }

            // 补充协议头
            if (/^\/\//.test(objAjax.url)) {
                objAjax.url = location.protocol + objAjax.url;
            }

            // 1. ajax发送的data数据走合并策略
            let data = options.data || {};
            let dataForm = objAjaxForm.data;
            let dataOptions = objParams.ajax.data || {};

            if (typeof dataOptions == 'function') {
                dataOptions = dataOptions() || {};
            }
            if (typeof dataForm == 'function') {
                dataForm = dataForm() || {};
            }
            if (typeof data == 'function') {
                data = data() || {};
            }

            // 发送给后台的分页数据的键值对
            let dataPage = {};
            let objKeyMap = objParams.page.keyMap;

            if (objKeyMap) {
                dataPage[objKeyMap['current']] = objParams.page.current;
                dataPage[objKeyMap['per']] = objParams.page.per;
            }

            // current和per数据的更新
            let objDataSend = Object.assign({}, dataPage, dataForm, dataOptions, data);

            if (objKeyMap) {
                objParams.page.current = objDataSend[objKeyMap['current']];
                objParams.page.per = objDataSend[objKeyMap['per']];
            }

            // 2. url get请求地址合并
            let objAjaxParams = new URLSearchParams(objDataSend);
            // URL处理
            let strUrlAjax = objAjax.url;

            // 查询字符串的处理
            let strUrlSearch = '?';
            if (strUrlAjax.split('?').length > 1) {
                strUrlSearch = strUrlSearch + strUrlAjax.split('?')[1] + '&';
            }

            // URL拼接
            strUrlAjax = strUrlAjax.split('?')[0] + strUrlSearch + objAjaxParams.toString();

            // 3. 回调方法的处理
            // ajax发生错误的处理
            let funError = (content) => {
                let eleError = objElement.error || eleContainer.querySelector('.' + CL.error);

                if (!eleError) {
                    eleError = document.createElement('div');
                    eleError.className = CL.error;
                    // 创建的错误元素插到列表的后面
                    this.insertAdjacentElement('afterend', eleError);

                    objElement.error = eleError;
                }
                eleError.style.display = 'flex';
                eleError.innerHTML = content || '数据没有获取成功';

                if (typeof objAjax.error == 'function') {
                    objAjax.error();
                }
            };
            // 请求完成的事件处理
            let funComplete = () => {
                // 请求结束标志量
                this.removeAttribute('aria-busy');
                // 去除中间的大loading
                if (objElement.loading) {
                    objElement.loading.style.display = 'none';
                }

                // 去掉分页的小loading
                if (objElement.pagination) {
                    objElement.pagination.loading = false;
                }
                if (typeof objAjax.complete == 'function') {
                    objAjax.complete();
                }

                // 列表内容呈现
                this.show();
            };

            // 执行Ajax请求的方法
            let funAjax = () => {
                let xhr = new XMLHttpRequest();

                xhr.open('GET', strUrlAjax);

                xhr.onload = () => {
                    let json = {};

                    try {
                        json = JSON.parse(xhr.responseText) || {};
                    } catch (event) {
                        funError('解析异常，请稍后重试');
                        return;
                    }

                    // 出错处理
                    // 0认为是成功
                    // 关键字支持code或者error
                    // { code: 0 } 或 { error: 0 } 都认为成功
                    if (json.code !== 0 && json.error !== 0) {
                        funError(json.msg || '返回数据格式不符合要求');

                        return;
                    }

                    let strHtml = objParams.parse(json);

                    // 如果解析后无数据，显示空提示信息
                    eleTbody.innerHTML = strHtml || '';

                    let eleEmpty = objElement.empty;

                    if (!strHtml || !strHtml.trim()) {
                        if (!eleEmpty) {
                            eleEmpty = document.querySelector('.' + CL.empty) || document.createElement('div');
                            eleEmpty.className = CL.empty;
                            // 插入到列表元素后面
                            this.insertAdjacentElement('afterend', eleEmpty);

                            objElement.empty = eleEmpty;
                        }
                        eleEmpty.style.display = 'flex';
                    }

                    // 获得后端返回的分页总数
                    let jsonKey = objKeyMap.key;
                    // 总数目
                    let numTotal;

                    if (jsonKey) {
                        numTotal = json.data[jsonKey][objKeyMap['total']];
                    } else {
                        numTotal = json.data[objKeyMap['total']];
                    }

                    // 修改总数值并显示
                    if (numTotal || numTotal == 0) {
                        eleContainer.querySelectorAll('output[data-type="total"]').forEach(function (eleTotal) {
                            eleTotal.innerHTML = numTotal;
                        });

                        objParams.page.total = numTotal;
                    }

                    this.page();

                    if (typeof objAjax.success == 'function') {
                        objAjax.success(json);
                    }
                };

                xhr.onerror = () => {
                    funError('网络异常，数据没有获取成功，您可以稍后重试！');

                };

                xhr.onloadend = () => {
                    funComplete();
                };

                xhr.send();

                // 标记输入框忙碌状态
                this.setAttribute('aria-busy', 'true');
            };

            // 滚动到表格上边缘
            let numScrollTop = window.pageYOffset;

            // loading元素
            let eleLoading = objElement.loading;
            if (!eleLoading) {
                eleLoading = document.createElement('ui-loading');
                eleLoading.setAttribute('rows', 15);
                // 插入到列表元素后面
                this.insertAdjacentElement('afterend', eleLoading);

                objElement.loading = eleLoading;
            }

            // 显示loading
            eleLoading.style.paddingBottom = '';

            if (window.getComputedStyle(eleLoading).display == 'none') {
                let eleThead = this.querySelector('thead');

                eleLoading.style.height = (this.clientHeight - (eleThead ? eleThead.clientHeight : 0)) + 'px';

                if (eleTbody.innerHTML.trim() == '') {
                    eleLoading.style.height = '';
                }
            }

            // 微调圈圈的位置
            let numDistance = parseFloat(eleLoading.style.height) - window.innerHeight;

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
            let objBound = this.getBoundingClientRect();
            // 第一次不定位
            if (!this.isFirstAjax && objBound.top < 0) {
                numScrollTop = objBound.top + numScrollTop;
                Table.scrollTopTo(numScrollTop, funAjax);
            } else if (!this.isFirstAjax && objBound.top > window.innerHeight) {
                numScrollTop = numScrollTop - objBound.top;
                Table.scrollTopTo(numScrollTop, funAjax);
            } else {
                funAjax();

                this.isFirstAjax = false;
            }

            return this;
        }

        /**
         * 分页的处理
         * @param  {[type]} total [description]
         * @return {[type]}       [description]
         */
        page (total) {
            let objPage = this.params.page;

            // 分页元素
            let elePagination = this.element.pagination;

            // 显示分页
            if (!elePagination) {
                return;
            }

            // 分页数据的设置
            let objParamPage = {
                total: total || objPage.total,
                current: objPage.current,
                per: objPage.per,
                mode: objPage.mode || 'long'
            };

            // 分页数据赋值
            for (let key in objParamPage) {
                elePagination[key] = objParamPage[key];
            }
        }

        /**
         * 列表请求完毕显示的方法
         * @return {[type]} [description]
         */
        show () {
            // 显示loading
            if (this.element.loading) {
                this.element.loading.style.paddingBottom = '';
            }

            //没有全选
            let eleThCheckbox = this.querySelector('th:first-child ' + CL.checkbox);
            if (eleThCheckbox) {
                eleThCheckbox[CHECKED] = false;
            }

            // 显示的回调
            this.dispatchEvent(new CustomEvent('show', {
                detail: {
                    type: 'ui-table'
                }
            }));

            return this;
        }

        // 元素进入页面时候的生命周期函数执行
        connectedCallback () {
            // 获得数据
            let eleTbody = this.querySelector('tbody');
            if (!eleTbody) {
                eleTbody = document.createElement('tbody');
                this.append(eleTbody);
            }

            // 模板元素
            let eleTemplate = this.querySelector('template');
            if (eleTemplate) {
                this.params.template = eleTemplate.innerHTML;
            }

            // 分页元素
            let elePagination = this.parentElement.querySelector('ui-pagination');
            if (elePagination) {
                this.element.pagination = elePagination;

                // 设置分页的参数
                this.setParams({
                    page: {
                        current: elePagination.current,
                        total: elePagination.total,
                        per: elePagination.per
                    }
                });
            } else {
                // 创建一个分页元素
                elePagination = document.createElement('ui-pagination');
                this.element.pagination = elePagination;
                // 分页内容显示
                let elePage = this.parentElement.querySelector('.' + CL.page);
                if (elePage) {
                    elePage.appendChild(elePagination);
                }
            }

            // loading元素
            let eleLoading = this.parentElement.querySelector('ui-loading');
            if (eleLoading) {
                this.element.loading = eleLoading;
            }

            // 下拉列表，切换分页元素
            let eleDrop = this.parentElement.querySelector('ui-drop[data-type="per"]');
            if (eleDrop) {
                this.element.drop = eleDrop;
            }

            // 为了动态呈现的列表可以先设置参数，后执行，这里延后
            setTimeout(() => {
                // 事件绑定和处理
                this.events();

                // 基于tbody内容决定首次交互的行为
                if (eleTbody.textContent.trim() == '') {
                    this.isFirstAjax = true;
                    this.ajax();
                } else {
                    // 认为是列表第一页直出，
                    // 这样的交互可以有更好体验
                    this.page();
                }
            }, 1);

            // 全局事件
            this.dispatchEvent(new CustomEvent('connected', {
                detail: {
                    type: 'ui-table'
                }
            }));

            this.dispatchEvent(new CustomEvent('DOMContentLoaded'));
        }
    }

    if (!('').interpolate) {
        // 字符串转模板字符串 https://www.zhangxinxu.com/wordpress/2020/10/es6-html-template-literal/
        String.prototype.interpolate = function (params) {
            const names = Object.keys(params);
            const vals = Object.values(params);
            return new Function(...names, `return \`${(function (str) {
                return str.replace(/&(lt|gt|amp|quot);/ig, function (all, t) {
                    return ({
                        'lt': '<',
                        'gt': '>',
                        'amp': '&',
                        'quot': '"'
                    })[t];
                });
            })(this)}\`;`)(...vals);
        };
    }

    return Table;
})();

// 给<table>元素扩展form属性
Object.defineProperty(HTMLTableElement.prototype, 'form', {
    get () {
        let attrForm = this.getAttribute('form');
        if (!attrForm) {
            return null;
        }
        return document.getElementById(attrForm);
    }
});

if (!customElements.get('ui-table')) {
    customElements.define('ui-table', Table, {
        extends: 'table'
    });
}
