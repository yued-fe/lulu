/**
 * @Pagination.js
 * @author zhangxinxu
 * @version
 * @Created: 15-06-26
 * @edit:    19-09-10 native js rewrite
 */

/* global module */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global.Pagination = factory();
    }
    // eslint-disable-next-line
}((typeof global !== 'undefined') ? global
    // eslint-disable-next-line
    : ((typeof window !== 'undefined') ? window
        : ((typeof self !== 'undefined') ? self : this)), function () {

    /**
     * 分页组件
     * 支持new实例构造
     * eg new Pagination(element, options);
     **/
    // ui类名
    // 类名变量
    var CL = {
        add: function () {
            return ['ui-page'].concat([].slice.call(arguments)).join('-');
        },
        join: function () {
            return CL + ' ' + this.add.apply(this, arguments);
        },
        toString: function () {
            return 'ui-page';
        }
    };

    /**
     * Ajax分页组件
     * @param {[type]} element [description]
     * @param {[type]} options [description]
     */
    var Pagination = function (element, options) {
        // 默认参数
        var defaults = {
            // 总的数据量
            total: 0,
            // 当前的页码
            current: 1,
            // 每页显示的数目
            per: 15,
            // short 长分页还是短分页
            mode: 'long',
            // href也可以是动态Function
            href: null,
            onClick: function () {}
        };

        // 元素的获取与判断
        var elePagination = element;

        if (typeof element == 'string') {
            elePagination = document.querySelector(element);
        }

        // 如果分页容器元素不存在，隐藏
        if (elePagination) {
            // 参数还可以取自element元素
            var objParamsFromElement = {};
            for (var keyParam in defaults) {
                var strAttr = element.getAttribute(keyParam);
                if (typeof strAttr != 'string') {
                    strAttr = elePagination.dataset[keyParam];
                }
                if (typeof strAttr == 'string') {
                    objParamsFromElement[keyParam] = strAttr;
                }
            }

            // 避如果已经初始化
            if (elePagination.data && elePagination.data.pagination) {
                return elePagination.data.pagination;
            }
        }

        // 可选参数整合
        var objParams = Object.assign({}, defaults, objParamsFromElement, options || {});

        // 数据的暴露
        this.params = Object.assign({}, objParams);

        // onClick作为callback暴露
        delete this.params.onClick;
        // 回调暴露
        this.callback = {
            click: objParams.onClick
        };
        // 元素暴露
        this.element = {
            container: elePagination,
            pagination: elePagination
        };

        // 前后分页使用的内联SVG代码
        this.svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><path d="M85.876,100.5l49.537-50.526c4.089-4.215,4.089-11.049,0-15.262 c-4.089-4.218-10.719-4.218-14.808,0L63.586,92.868c-4.089,4.215-4.089,11.049,0,15.264l57.018,58.156 c4.089,4.215,10.719,4.215,14.808,0c4.089-4.215,4.089-11.049,0-15.262L85.876,100.5z"/></svg>';

        if (!elePagination) {
            return this;
        }

        // 事件
        this.events();

        // 呈现
        this.show();

        // 存储
        if (!elePagination.data) {
            elePagination.data = {};
        }
        elePagination.data.pagination = this;

        // 自定义元素的属性
        Object.keys(this.params).forEach(function (keyParam) {
            Object.defineProperty(elePagination, keyParam, {
                writeable: true,
                enumerable: true,
                get: function () {
                    return this.getAttribute(keyParam) || (function () {
                        if (this.data && this.data.pagination) {
                            return this.data.pagination.params[keyParam] || null;
                        }
                        return null;
                    })();
                },
                set: function (value) {
                    this.setAttribute(keyParam, value);
                    // 模板属性变化了，重渲染
                    if (this.data && this.data.pagination) {
                        this.data.pagination.params[keyParam] = value;
                        this.data.pagination.show();
                    }
                }
            });
        });
    };

    /**
     * 分页相关的事件处理
     * @return {[type]} [description]
     */
    Pagination.prototype.events = function () {
        var elePagination = this.element.pagination;

        // 委托点击事件
        elePagination.addEventListener('click', function (event) {
            // 一些元素
            var eleTarget = event.target;
            // 目标点击元素
            var eleClicked = eleTarget.closest('a');

            // 未获取到元素返回
            if (!eleClicked) {
                return;
            }

            var numCurrent = eleClicked.getAttribute('data-page');
            // 改变全局暴露的current值
            this.params.current = numCurrent * 1;

            // 外部的 HTML 属性也同步
            if (elePagination.hasAttribute('current')) {
                elePagination.setAttribute('current', numCurrent);
            } else if (elePagination.hasAttribute('data-current')) {
                elePagination.setAttribute('data-current', numCurrent);
            }

            // 当前的类名，onClick回调可以准确识别点击DOM元素
            var strClassName = eleClicked.className;

            // 分页刷新
            this.show();

            // 此时由于HTML刷新，原来的eleClicked元素已经不复存在
            // 因此需要重新获取一遍
            if (/prev/.test(strClassName)) {
                eleClicked = elePagination.querySelector('.' + CL.add('prev'));
            } else if (/next/.test(strClassName)) {
                eleClicked = elePagination.querySelector('.' + CL.add('next'));
            } else {
                eleClicked = elePagination.querySelector('.' + CL.add('current'));
            }

            // aria以及键盘访问
            if (eleClicked) {
                eleClicked.focus();

                if (window.isKeyEvent == false) {
                    eleClicked.blur();
                }

                if (/^javascript/.test(eleClicked.href)) {
                    event.preventDefault();
                }
            }

            this.callback.click.call(this, eleClicked, this.params.current);

            // 触发自定义事件
            elePagination.dispatchEvent(new CustomEvent('change'));
        }.bind(this));
    };

    /**
     * 创建分页字符串的方法
     * @param  {Object} params  分页相关的数据对象
     * @param  {String} mode 分页的类型
     * @return {String}      返回拼接好的HTML字符串
     */
    Pagination.prototype.create = function () {
        var objParams = this.params;

        // 分页一些数据
        var numTotal = objParams.total * 1 || 0;
        var numCurrent = objParams.current * 1 || 1;
        var numPer = objParams.per * 1 || 1;

        // href的支持与处理
        var strOrFunHref = objParams.href || 'javascript:';

        var funHref = function (index) {
            if (typeof strOrFunHref == 'function') {
                return strOrFunHref(index);
            }
            return strOrFunHref.toString().replace('${current}', index);
        };

        // 计算总页数
        var numPageSize = Math.ceil(numTotal / numPer) || 1;

        // 分页HTML内容
        var strHtmlPage = '';

        // 1. 首先是通用的前后翻页
        if (numCurrent > 1) {
            strHtmlPage = strHtmlPage + '<a href="' +  funHref(numCurrent - 1) + '" class="' +  CL.join('prev') + '" data-page="' +  (numCurrent - 1) + '" aria-label="上一页，当前第' +  numCurrent + '页">' +  this.svg + '</a>';
        } else {
            // 当前是第一页，自然不能往前翻页
            strHtmlPage = strHtmlPage + '<span class="' + CL.join('prev') + '">' +  this.svg + '</span>';
        }

        // 2. 中间部分
        // 短分页和长分页
        var numVisible = 6;
        if (objParams.mode == 'long') {
            var funLong = function (numStart) {
                if (numStart == numCurrent) {
                    strHtmlPage = strHtmlPage + '<span class="' +  CL.join('current') + '" aria-label="第' +  numStart + '页，共' +  numPageSize + '页" aria-selected="true" role="option">' +  numStart + '</span>';
                } else {
                    strHtmlPage = strHtmlPage + '<a href="' +  funHref(numStart) + '" class="' +  CL + '" data-page="' +  numStart + '" aria-label="第' +  numStart + '页，共' +  numPageSize + '页">' +  numStart + '</a>';
                }
            };


            /**
             * 为了保证体验，在分页数量大的时候，要保证总条目数为7个
                假设页码总数20，规则如下
                当前是1: 则 1-5,... 20
                 2: 则 1-5,...,20
                 3: 则 1-5,...,20
                 4: 则 1-5,...,20
                 5: 则 1...456,...,20
                 ...

                 参见下面的else if的处理
             */
            if (numPageSize <= numVisible) {
                // 如果页面不大于6个，全部显示
                for (var start = 1; start <= numPageSize; start++) {
                    funLong(start);
                }
            } else if (numCurrent < numPageSize * 0.5 && numCurrent < numVisible - 1) {
                // 至少保证current的前后有数据
                if (numCurrent < numVisible - 1) {
                    for (start = 1; start < numVisible; start++) {
                        funLong(start);
                    }
                }
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                funLong(numPageSize);
            } else if (numCurrent > numPageSize * 0.5 && numCurrent > numPageSize - numVisible + 2) {
                funLong(1);
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                for (start = numPageSize - numVisible + 2; start <= numPageSize; start++) {
                    funLong(start);
                }
            } else {
                // 前后两处打点
                funLong(1);
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                funLong(numCurrent - 1);
                funLong(numCurrent);
                funLong(numCurrent + 1);
                strHtmlPage = strHtmlPage + '<span class="' +  CL.join('ellipsis') + '">...</span>';
                funLong(numPageSize);
            }

        } else if (objParams.mode == 'short') {
            strHtmlPage = strHtmlPage + '<span class="' +  CL.join('text') + '" aria-label="第' +  numCurrent + '页，共' +  numPageSize + '页" role="option">' +  [numCurrent, numPageSize].join('/') + '</span>';
        }

        // 3. 往后翻页
        if (numCurrent < numPageSize) {
            strHtmlPage = strHtmlPage + '<a href="' +  funHref(numCurrent + 1) + '" class="' +  CL.join('next') + '" data-page="' +  (numCurrent + 1) + '" aria-label="下一页，当前第' +  numCurrent + '页">' +  this.svg + '</a>';
        } else {
            strHtmlPage = strHtmlPage + '<span class="' +  CL.join('next') + '">' +  this.svg + '</span>';
        }

        return '<div class="' +  CL.add('x') + '">' + strHtmlPage + '</div>';
    };

    /**
     * 分页显示（也是刷新方法）
     * @return {Object} 返回当前实例
     */
    Pagination.prototype.show = function () {
        // 数据合法性处理
        var objParams = this.params;

        objParams.total = Math.max(objParams.total, 0);
        objParams.per = Math.max(objParams.per, 0);

        // current合法性处理
        var numMaxCurrent = Math.ceil(objParams.total / objParams.per);
        if (objParams.current > numMaxCurrent) {
            objParams.current = numMaxCurrent;
        } else if (objParams.current < 1) {
            objParams.current = 1;
        }

        // 更新分页的HTML内容
        this.element.pagination.innerHTML = this.create();

        return this;
    };

    /**
     * 分页数据刷新，根据元素属性变化
     * @return {[type]} [description]
     */
    Pagination.prototype.refresh = function () {
        var objParams = this.params;
        // 元素
        var elePagination = this.element.pagination;

        for (var keyParam in objParams) {
            if (elePagination.hasAttribute(keyParam)) {
                this.params[keyParam] = elePagination.getAttribute(keyParam);
            }
        }

        this.show();
    };

    /**
     * 支持自定义的<ui-pagination>元素
     * @return {[type]}   [description]
     */
    var funAutoInitAndWatching = function () {
        var strSelector = 'ui-pagination, [is-pagination]';
        // 遍历页面上所有的<ui-pagination>元素
        document.querySelectorAll(strSelector).forEach(function (elePagination) {
            new Pagination(elePagination);
        });

        if (window.watching === false) {
            return;
        }
        // 同步更新分页内容的方法
        var funSyncRefresh = function (node) {
            if (node.nodeType != 1 || node.matches(strSelector) == false) {
                return;
            }
            // 元素
            var elePagination = node;
            // 实例对象
            var objPagination = elePagination.data && elePagination.data.pagination;
            // 有则刷新无则初始化
            if (!objPagination) {
                new Pagination(elePagination);
            } else {
                // 更新
                objPagination.refresh();
            }
        };

        // DOM Insert检测自动初始化
        // IE11+使用MutationObserver
        // IE9-IE10使用Mutation Events
        if (window.MutationObserver) {
            var observerSelect = new MutationObserver(function (mutationsList) {
                mutationsList.forEach(function (mutation) {
                    if (mutation.type == 'childList') {
                        mutation.addedNodes.forEach(function (eleAdd) {
                            if (eleAdd.matches && eleAdd.matches(strSelector)) {
                                funSyncRefresh(eleAdd);
                            } else if (eleAdd.querySelector) {
                                eleAdd.querySelectorAll(strSelector).forEach(function (elePagination) {
                                    funSyncRefresh(elePagination);
                                });
                            }
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
                funSyncRefresh(event.target);
            });
        }
    };

    // 监听-免初始绑定
    if (document.readyState != 'loading') {
        funAutoInitAndWatching();
    } else {
        window.addEventListener('DOMContentLoaded', funAutoInitAndWatching);
    }

    return Pagination;
}));
