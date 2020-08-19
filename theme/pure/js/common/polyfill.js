/**
 * @description 一些兼容IE浏览器的原生方法合集，
 *              大多数方法源自开源项目
 * @author zhangxinxu(.com)
 * @created 2019-07-08
 */
/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.2.20171210
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ('document' in self) {
    // Full polyfill for browsers with no classList support
    // Including IE < Edge missing SVGElement.classList
    if (!('classList' in document.createElement('_')) || document.createElementNS && !('classList' in document.createElementNS('http://www.w3.org/2000/svg', 'g'))
    ) {

        (function (view) {

            'use strict';

            if (!('Element' in view)) {
                return;
            }

            var classListProp = 'classList';
            var protoProp = 'prototype';
            var elemCtrProto = view.Element[protoProp];
            var objCtr = Object;
            var strTrim = String[protoProp].trim || function () {
                return this.replace(/^\s+|\s+$/g, '');
            };
            var arrIndexOf = Array[protoProp].indexOf || function (item) {
                var i = 0;
                var len = this.length;
                for (; i < len; i++) {
                    if (i in this && this[i] === item) {
                        return i;
                    }
                }
                return -1;
            };
            // Vendors: please allow content code to instantiate DOMExceptions
            var DOMEx = function (type, message) {
                this.name = type;
                this.code = DOMException[type];
                this.message = message;
            };
            var checkTokenAndGetIndex = function (classList, token) {
                if (token === '') {
                    throw new DOMEx('SYNTAX_ERR', 'The token must not be empty.');
                }
                if (/\s/.test(token)) {
                    throw new DOMEx('INVALID_CHARACTER_ERR', 'The token must not contain space characters.');
                }
                return arrIndexOf.call(classList, token);
            };
            var ClassList = function (elem) {
                var trimmedClasses = strTrim.call(elem.getAttribute('class') || '');
                var classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [];
                var i = 0;
                var len = classes.length;
                for (; i < len; i++) {
                    this.push(classes[i]);
                }
                this._updateClassName = function () {
                    elem.setAttribute('class', this.toString());
                };
            };
            var classListProto = ClassList[protoProp] = [];
            var classListGetter = function () {
                return new ClassList(this);
            };
            // Most DOMException implementations don't allow calling DOMException's toString()
            // on non-DOMExceptions. Error's toString() is sufficient here.
            DOMEx[protoProp] = Error[protoProp];
            classListProto.item = function (i) {
                return this[i] || null;
            };
            classListProto.contains = function (token) {
                return ~checkTokenAndGetIndex(this, token + '');
            };
            classListProto.add = function () {
                var tokens = arguments;
                var i = 0;
                var l = tokens.length;
                var token;
                var updated = false;

                do {
                    token = tokens[i] + '';
                    if (!~checkTokenAndGetIndex(this, token)) {
                        this.push(token);
                        updated = true;
                    }
                }
                while (++i < l);

                if (updated) {
                    this._updateClassName();
                }
            };
            classListProto.remove = function () {
                var tokens = arguments;
                var i = 0;
                var l = tokens.length;
                var token;
                var updated = false;
                var index;

                do {
                    token = tokens[i] + '';
                    index = checkTokenAndGetIndex(this, token);
                    while (~index) {
                        this.splice(index, 1);
                        updated = true;
                        index = checkTokenAndGetIndex(this, token);
                    }
                }
                while (++i < l);

                if (updated) {
                    this._updateClassName();
                }
            };
            classListProto.toggle = function (token, force) {
                var result = this.contains(token);
                var method = result ? force !== true && 'remove' : force !== false && 'add';

                if (method) {
                    this[method](token);
                }

                if (force === true || force === false) {
                    return force;
                }

                return !result;
            };
            classListProto.replace = function (token, replacementToken) {
                var index = checkTokenAndGetIndex(token + '');
                if (~index) {
                    this.splice(index, 1, replacementToken);
                    this._updateClassName();
                }
            };
            classListProto.toString = function () {
                return this.join(' ');
            };

            if (objCtr.defineProperty) {
                var classListPropDesc = {
                    get: classListGetter,
                    enumerable: true,
                    configurable: true
                };
                try {
                    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                } catch (ex) {
                    // IE 8 doesn't support enumerable:true
                    // adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
                    // modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
                    if (ex.number === undefined || ex.number === -0x7FF5EC54) {
                        classListPropDesc.enumerable = false;
                        objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
                    }
                }
            } else if (objCtr[protoProp].__defineGetter__) {
                elemCtrProto.__defineGetter__(classListProp, classListGetter);
            }

        }(self));
    }

    // There is full or partial native classList support, so just check if we need
    // to normalize the add/remove and toggle APIs.

    (function () {
        'use strict';

        var testElement = document.createElement('_');

        testElement.classList.add('c1', 'c2');

        // Polyfill for IE 10/11 and Firefox <26, where classList.add and
        // classList.remove exist but support only one argument at a time.
        if (!testElement.classList.contains('c2')) {
            var createMethod = function (method) {
                var original = DOMTokenList.prototype[method];

                DOMTokenList.prototype[method] = function (token) {
                    var i;
                    var len = arguments.length;

                    for (i = 0; i < len; i++) {
                        token = arguments[i];
                        original.call(this, token);
                    }
                };
            };
            createMethod('add');
            createMethod('remove');
        }

        testElement.classList.toggle('c3', false);

        // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
        // support the second argument.
        if (testElement.classList.contains('c3')) {
            var _toggle = DOMTokenList.prototype.toggle;

            DOMTokenList.prototype.toggle = function (token, force) {
                if (1 in arguments && !this.contains(token) === !force) {
                    return force;
                }

                return _toggle.call(this, token);
            };

        }

        // replace() polyfill
        if (!('replace' in document.createElement('_').classList)) {
            DOMTokenList.prototype.replace = function (token, replacementToken) {
                var tokens = this.toString().split(' ');
                var index = tokens.indexOf(token + '');
                if (index * 1) {
                    tokens = tokens.slice(index);
                    this.remove.apply(this, tokens);
                    this.add(replacementToken);
                    this.add.apply(this, tokens.slice(1));
                }
            };
        }

        testElement = null;
    }());
}

/**
 * IE 11 - Edge 38 event.target是SVGElementInstance元素问题修复
 * @param  {[type]} [description]
 * @return {[type]} [description]
 */
if (window.SVGElementInstance) {
    SVGElementInstance.prototype.getAttribute = function (attributeName) {
        if (this.correspondingUseElement) {
            return this.correspondingUseElement.getAttribute(attributeName);
        }
    };
}

/**
 * URL() and URLSearchParams() polyfill
 */

(function (global) {

    /**
     * Polyfill URLSearchParams
     *
     * Inspired from : https://github.com/WebReflection/url-search-params/blob/master/src/url-search-params.js
     */

    var checkIfIteratorIsSupported = function () {
        try {
            return !!Symbol.iterator;
        } catch (error) {
            return false;
        }
    };


    var iteratorSupported = checkIfIteratorIsSupported();

    var createIterator = function (items) {
        var iterator = {
            next: function () {
                var value = items.shift();
                return {
                    done: value === void 0,
                    value: value
                };
            }
        };

        if (iteratorSupported) {
            iterator[Symbol.iterator] = function () {
                return iterator;
            };
        }

        return iterator;
    };

    /**
     * Search param name and values should be encoded according to https://url.spec.whatwg.org/#urlencoded-serializing
     * encodeURIComponent() produces the same result except encoding spaces as `%20` instead of `+`.
     */
    var serializeParam = function (value) {
        return encodeURIComponent(value).replace(/%20/g, '+');
    };

    var deserializeParam = function (value) {
        return decodeURIComponent(String(value).replace(/\+/g, ' '));
    };

    var polyfillURLSearchParams = function () {

        var URLSearchParams = function (searchString) {
            Object.defineProperty(this, '_entries', {
                writable: true,
                value: {}
            });
            var typeofSearchString = typeof searchString;

            if (typeofSearchString === 'undefined') {
                // do nothing
            } else if (typeofSearchString === 'string') {
                if (searchString !== '') {
                    this._fromString(searchString);
                }
            } else if (searchString instanceof URLSearchParams) {
                var _this = this;
                searchString.forEach(function (value, name) {
                    _this.append(name, value);
                });
            } else if ((searchString !== null) && (typeofSearchString === 'object')) {
                if (Object.prototype.toString.call(searchString) === '[object Array]') {
                    for (var i = 0; i < searchString.length; i++) {
                        var entry = searchString[i];
                        if ((Object.prototype.toString.call(entry) === '[object Array]') || (entry.length !== 2)) {
                            this.append(entry[0], entry[1]);
                        } else {
                            throw new TypeError('Expected [string, any] as entry at index ' + i + ' of URLSearchParams\'s input');
                        }
                    }
                } else if (searchString instanceof FormData && searchString._data) {
                    for (var keyData in searchString._data) {
                        if (searchString._data.hasOwnProperty(keyData)) {
                            this.append(keyData, searchString._data[keyData]);
                        }
                    }
                } else {
                    for (var key in searchString) {
                        if (searchString.hasOwnProperty(key)) {
                            this.append(key, searchString[key]);
                        }
                    }
                }
            } else {
                throw new TypeError('Unsupported input\'s type for URLSearchParams');
            }
        };

        var proto = URLSearchParams.prototype;

        proto.append = function (name, value) {
            if (name in this._entries) {
                this._entries[name].push(String(value));
            } else {
                this._entries[name] = [String(value)];
            }
        };

        proto['delete'] = function (name) {
            delete this._entries[name];
        };

        proto.get = function (name) {
            return (name in this._entries) ? this._entries[name][0] : null;
        };

        proto.getAll = function (name) {
            return (name in this._entries) ? this._entries[name].slice(0) : [];
        };

        proto.has = function (name) {
            return (name in this._entries);
        };

        proto.set = function (name, value) {
            this._entries[name] = [String(value)];
        };

        proto.forEach = function (callback, thisArg) {
            var entries;
            for (var name in this._entries) {
                if (this._entries.hasOwnProperty(name)) {
                    entries = this._entries[name];
                    for (var i = 0; i < entries.length; i++) {
                        callback.call(thisArg, entries[i], name, this);
                    }
                }
            }
        };

        proto.keys = function () {
            var items = [];
            this.forEach(function (value, name) {
                items.push(name);
            });
            return createIterator(items);
        };

        proto.values = function () {
            var items = [];
            this.forEach(function (value) {
                items.push(value);
            });
            return createIterator(items);
        };

        proto.entries = function () {
            var items = [];
            this.forEach(function (value, name) {
                items.push([name, value]);
            });
            return createIterator(items);
        };

        if (iteratorSupported) {
            proto[Symbol.iterator] = proto.entries;
        }

        proto.toString = function () {
            var searchArray = [];
            this.forEach(function (value, name) {
                searchArray.push(serializeParam(name) + '=' + serializeParam(value));
            });
            return searchArray.join('&');
        };


        global.URLSearchParams = URLSearchParams;
    };

    var checkIfURLSearchParamsSupported = function () {
        try {
            var URLSearchParams = global.URLSearchParams;

            return (new URLSearchParams('?a=1').toString() === 'a=1') && (typeof URLSearchParams.prototype.set === 'function');
        } catch (e) {
            return false;
        }
    };

    if (!checkIfURLSearchParamsSupported()) {
        polyfillURLSearchParams();
    }

    var proto = global.URLSearchParams.prototype;

    if (typeof proto.sort !== 'function') {
        proto.sort = function () {
            var _this = this;
            var items = [];
            this.forEach(function (value, name) {
                items.push([name, value]);
                if (!_this._entries) {
                    _this['delete'](name);
                }
            });
            items.sort(function (a, b) {
                if (a[0] < b[0]) {
                    return -1;
                } else if (a[0] > b[0]) {
                    return +1;
                }

                return 0;
            });
            // force reset because IE keeps keys index
            if (_this._entries) {
                _this._entries = {};
            }
            for (var i = 0; i < items.length; i++) {
                this.append(items[i][0], items[i][1]);
            }
        };
    }

    if (typeof proto._fromString !== 'function') {
        Object.defineProperty(proto, '_fromString', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: function (searchString) {
                if (this._entries) {
                    this._entries = {};
                } else {
                    var keys = [];
                    this.forEach(function (value, name) {
                        keys.push(name);
                    });
                    for (var i = 0; i < keys.length; i++) {
                        this['delete'](keys[i]);
                    }
                }

                searchString = searchString.replace(/^\?/, '');
                var attributes = searchString.split('&');
                var attribute;
                for (var ii = 0; ii < attributes.length; ii++) {
                    attribute = attributes[ii].split('=');
                    this.append(
                        deserializeParam(attribute[0]),
                        (attribute.length > 1) ? deserializeParam(attribute[1]) : ''
                    );
                }
            }
        });
    }

    // HTMLAnchorElement

})(
    (typeof global !== 'undefined') ? global
        : ((typeof window !== 'undefined') ? window
            : ((typeof self !== 'undefined') ? self : this))
);

(function (global) {

    /**
     * Polyfill URL
     *
     * Inspired from : https://github.com/arv/DOM-URL-Polyfill/blob/master/src/url.js
     */

    var checkIfURLIsSupported = function () {
        try {
            var u = new global.URL('b', 'http://a');
            u.pathname = 'c%20d';
            return (u.href === 'http://a/c%20d') && u.searchParams;
        } catch (e) {
            return false;
        }
    };


    var polyfillURL = function () {
        var _URL = global.URL;

        var URL = function (url, base) {
            if (typeof url !== 'string') url = String(url);

            // Only create another document if the base is different from current location.
            var doc = document;
            var baseElement;
            if (base && (global.location === void 0 || base !== global.location.href)) {
                doc = document.implementation.createHTMLDocument('');
                baseElement = doc.createElement('base');
                baseElement.href = base;
                doc.head.appendChild(baseElement);
                try {
                    if (baseElement.href.indexOf(base) !== 0) throw new Error(baseElement.href);
                } catch (err) {
                    throw new Error('URL unable to set base ' + base + ' due to ' + err);
                }
            }

            var anchorElement = doc.createElement('a');
            anchorElement.href = url;
            if (baseElement) {
                doc.body.appendChild(anchorElement);
                // force href to refresh
                anchorElement.href = anchorElement.href;
            }

            if (anchorElement.protocol === ':' || !/:/.test(anchorElement.href)) {
                throw new TypeError('Invalid URL');
            }

            Object.defineProperty(this, '_anchorElement', {
                value: anchorElement
            });


            // create a linked searchParams which reflect its changes on URL
            var searchParams = new global.URLSearchParams(this.search);
            var enableSearchUpdate = true;
            var enableSearchParamsUpdate = true;
            var _this = this;
            ['append', 'delete', 'set'].forEach(function (methodName) {
                var method = searchParams[methodName];
                searchParams[methodName] = function () {
                    method.apply(searchParams, arguments);
                    if (enableSearchUpdate) {
                        enableSearchParamsUpdate = false;
                        _this.search = searchParams.toString();
                        enableSearchParamsUpdate = true;
                    }
                };
            });

            Object.defineProperty(this, 'searchParams', {
                value: searchParams,
                enumerable: true
            });

            var search = void 0;
            Object.defineProperty(this, '_updateSearchParams', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: function () {
                    if (this.search !== search) {
                        search = this.search;
                        if (enableSearchParamsUpdate) {
                            enableSearchUpdate = false;
                            this.searchParams._fromString(this.search);
                            enableSearchUpdate = true;
                        }
                    }
                }
            });
        };

        var proto = URL.prototype;

        var linkURLWithAnchorAttribute = function (attributeName) {
            Object.defineProperty(proto, attributeName, {
                get: function () {
                    return this._anchorElement[attributeName];
                },
                set: function (value) {
                    this._anchorElement[attributeName] = value;
                },
                enumerable: true
            });
        };

        ['hash', 'host', 'hostname', 'port', 'protocol']
            .forEach(function (attributeName) {
                linkURLWithAnchorAttribute(attributeName);
            });

        Object.defineProperty(proto, 'search', {
            get: function () {
                return this._anchorElement['search'];
            },
            set: function (value) {
                this._anchorElement['search'] = value;
                this._updateSearchParams();
            },
            enumerable: true
        });

        Object.defineProperties(proto, {

            'toString': {
                get: function () {
                    var _this = this;
                    return function () {
                        return _this.href;
                    };
                }
            },

            'href': {
                get: function () {
                    return this._anchorElement.href.replace(/\?$/, '');
                },
                set: function (value) {
                    this._anchorElement.href = value;
                    this._updateSearchParams();
                },
                enumerable: true
            },

            'pathname': {
                get: function () {
                    return this._anchorElement.pathname.replace(/(^\/?)/, '/');
                },
                set: function (value) {
                    this._anchorElement.pathname = value;
                },
                enumerable: true
            },

            'origin': {
                get: function () {
                    // get expected port from protocol
                    var expectedPort = {
                        'http:': 80,
                        'https:': 443,
                        'ftp:': 21
                    }[this._anchorElement.protocol];
                    // add port to origin if, expected port is different than actual port
                    // and it is not empty f.e http://foo:8080
                    // 8080 != 80 && 8080 != ''
                    var addPortToOrigin = this._anchorElement.port != expectedPort &&
                        this._anchorElement.port !== '';

                    return this._anchorElement.protocol +
                        '//' +
                        this._anchorElement.hostname +
                        (addPortToOrigin ? (':' + this._anchorElement.port) : '');
                },
                enumerable: true
            },

            'password': {
                // TODO
                get: function () {
                    return '';
                },
                set: function (value) {
                },
                enumerable: true
            },

            'username': {
                // TODO
                get: function () {
                    return '';
                },
                set: function (value) {
                },
                enumerable: true
            }
        });

        URL.createObjectURL = function (blob) {
            return _URL.createObjectURL.apply(_URL, arguments);
        };

        URL.revokeObjectURL = function (url) {
            return _URL.revokeObjectURL.apply(_URL, arguments);
        };

        global.URL = URL;

    };

    if (!checkIfURLIsSupported()) {
        polyfillURL();
    }

    if ((global.location !== void 0) && !('origin' in global.location)) {
        var getOrigin = function () {
            return global.location.protocol + '//' + global.location.hostname + (global.location.port ? (':' + global.location.port) : '');
        };

        try {
            Object.defineProperty(global.location, 'origin', {
                get: getOrigin,
                enumerable: true
            });
        } catch (e) {
            setInterval(function () {
                global.location.origin = getOrigin();
            }, 100);
        }
    }

})(
    (typeof global !== 'undefined') ? global
        : ((typeof window !== 'undefined') ? window
            : ((typeof self !== 'undefined') ? self : this))
);


/*
 * @preserve FormData polyfill for IE < 10. See https://developer.mozilla.org/en/docs/Web/API/FormData and http://caniuse.com/#search=formdata
 *
 * @author ShirtlessKirk copyright 2015
 * @license WTFPL (http://www.wtfpl.net/txt/copying)
 */
/*global define: false, module: false */
/*jslint bitwise: true, continue: true, nomen: true */
(function formDataModule(global, definition) { // non-exporting module magic dance
    'use strict';

    var
        amd = 'amd',
        exports = 'exports'; // keeps the method names for CommonJS / AMD from being compiled to single character variable

    if (typeof define === 'function' && define[amd]) {
        define(function definer() {
            return definition(global);
        });
    } else if (typeof module === 'function' && module[exports]) {
        module[exports] = definition(global);
    } else {
        definition(global);
    }
}((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
: ((typeof self !== 'undefined') ? self : this)), function formDataPartialPolyfill(global) { // partial polyfill
    'use strict';

    var formDataPrototype,
        math = Math,
        method,
        methods,
        xhrSend,
        xmlHttpRequestPrototype;

    function has (key) {
        return this._data.hasOwnProperty(key);
    }

    function append (key, value) {
        var
            self = this;

        if (!has.call(self, key)) {
            self._data[key] = [];
        }

        self._data[key].push(value);
    }

    function deleteFn (key) {
        delete this._data[key];
    }

    function getAll (key) {
        return this._data[key] || null;
    }

    function get (key) {
        var
            values = getAll.call(this, key);

        return values ? values[0] : null;
    }

    function set (key, value) {
        this._data[key] = [value];
    }

    function createBoundary () {
        // for XHR
        var random = math.random;
        var salt = (random() * math.pow(10, ((random() * 12) | 0) + 1));
        var hash = (random() * salt).toString(36);

        return '----------------FormData-' + hash;
    }

    function parseContents (children) {
        var
            child,
            counter,
            counter2,
            length,
            length2,
            name,
            option,
            self = this;

        for (counter = 0, length = children.length; counter < length; counter += 1) {
            child = children[counter];
            name = child.name || child.id;
            if (!name || child.disabled) {
                continue;
            }

            switch (child.type) {
                case 'checkbox':
                    if (child.checked) {
                        self.append(name, child.value || 'on');
                    }

                    break;

                // x/y coordinates or origin if missing
                case 'image':
                    self.append(name + '.x', child.x || 0);
                    self.append(name + '.y', child.y || 0);

                    break;

                case 'radio':
                    if (child.checked) {
                        // using .set as only one can be valid (uses last one if more discovered)
                        self.set(name, child.value);
                    }

                    break;

                case 'select-one':
                    if (child.selectedIndex !== -1) {
                        self.append(name, child.options[child.selectedIndex].value);
                    }

                    break;

                case 'select-multiple':
                    for (counter2 = 0, length2 = child.options.length; counter2 < length2; counter2 += 1) {
                        option = child.options[counter2];
                        if (option.selected) {
                            self.append(name, option.value);
                        }
                    }

                    break;

                case 'file':
                case 'reset':
                case 'submit':
                    break;

                default: // hidden, text, textarea, password
                    self.append(name, child.value);
            }
        }
    }

    function toString () {
        var
            self = this,
            body = [],
            data = self._data,
            key,
            prefix = '--';

        for (key in data) {
            if (data.hasOwnProperty(key)) {
                body.push(prefix + self._boundary); // boundaries are prefixed with '--'
                // only form fields for now, files can wait / probably can't be done
                body.push('Content-Disposition: form-data; name="' + key + '"\r\n'); // two linebreaks between definition and content
                body.push(data[key]);
            }
        }

        if (body.length) {
            return body.join('\r\n') + '\r\n' + prefix + self._boundary + prefix; // form content ends with '--'
        }

        return '';
    }

    /**
     * [FormData description]
     * @contructor
     * @param {?HTMLForm} form HTML <form> element to populate the object (optional)
     */
    function FormData (form) {
        var
            self = this;

        if (!(self instanceof FormData)) {
            return new FormData(form);
        }

        if (form && (!form.tagName || form.tagName !== 'FORM')) { // not a form
            return;
        }

        self._boundary = createBoundary();
        self._data = {};

        if (!form) { // nothing to parse, we're done here
            return;
        }

        parseContents.call(self, form.children);
    }

    function send (data) {
        var
            self = this;

        if (data instanceof FormData) {
            self.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + data._boundary);

            return xhrSend.call(self, data.toString());
        }

        return xhrSend.call(self, data || null);
    }

    methods = {
        append: append,
        get: get,
        getAll: getAll,
        has: has,
        set: set,
        toString: toString
    };

    formDataPrototype = FormData.prototype;
    for (method in methods) {
        if (methods.hasOwnProperty(method)) {
            formDataPrototype[method] = methods[method];
        }
    }

    formDataPrototype['delete'] = deleteFn;

    // IE9
    if (!global.FormData) {

        xmlHttpRequestPrototype = global.XMLHttpRequest.prototype;
        xhrSend = xmlHttpRequestPrototype.send;
        xmlHttpRequestPrototype.send = send;

        global.FormData = FormData;
    } else if (!new global.FormData().getAll) {
        var fd = global.FormData;

        global.FormData = function (form) {
            if (form && form.tagName == 'FORM' && form.method.toLowerCase() == 'get') {
                global.FormData = FormData;
                return FormData(form);
            }
            // post请求还是使用原生FormData
            global.FormData = fd;
            return fd(form);
        };
    }
}));

/**
 * closest polyfill
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
                              Element.prototype.webkitMatchesSelector;
}

if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        var el = this;

        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);

        return null;
    };
}

/**
 * NodeList forEach support
 */
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

/**
 * hasAttribute polyfill
 */
(function (prototype) {
    prototype.hasAttribute = prototype.hasAttribute || function (name) {
        return !!(this.attributes[name] &&
                  this.attributes[name].specified);
    };
})(Element.prototype);

/**
 * before() polyfill
 */
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('before')) {
            return;
        }
        Object.defineProperty(item, 'before', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function before () {
                var argArr = Array.prototype.slice.call(arguments);
                var docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.parentNode.insertBefore(docFrag, this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/**
 * after() polyfill
 */
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('after')) {
            return;
        }
        Object.defineProperty(item, 'after', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function after () {
                var argArr = Array.prototype.slice.call(arguments);
                var docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.parentNode.insertBefore(docFrag, this.nextSibling);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/**
 * replaceWith() polyfill
 */
(function () {
    var ReplaceWith = function (Ele) {
        var parent = this.parentNode;
        var i = arguments.length;
        var firstIsNode = +(parent && typeof Ele === 'object');
        if (!parent) return;

        while (i-- > firstIsNode) {
            if (parent && typeof arguments[i] !== 'object') {
                arguments[i] = document.createTextNode(arguments[i]);
            } if (!parent && arguments[i].parentNode) {
                arguments[i].parentNode.removeChild(arguments[i]);
                continue;
            }
            parent.insertBefore(this.previousSibling, arguments[i]);
        }
        if (firstIsNode) parent.replaceChild(this, Ele);
    };

    if (!Element.prototype.replaceWith) {
        Element.prototype.replaceWith = ReplaceWith;
    }

    if (!CharacterData.prototype.replaceWith) {
        CharacterData.prototype.replaceWith = ReplaceWith;
    }
    if (!DocumentType.prototype.replaceWith) {
        CharacterData.prototype.replaceWith = ReplaceWith;
    }
})();

/**
 * append() polyfill
 */
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('append')) {
            return;
        }
        Object.defineProperty(item, 'append', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function append() {
                var argArr = Array.prototype.slice.call(arguments);
                var docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.appendChild(docFrag);
            }
        });
    });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);

/**
 * prepend() polyfill
 */
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('prepend')) {
            return;
        }
        Object.defineProperty(item, 'prepend', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function prepend() {
                var argArr = Array.prototype.slice.call(arguments);
                var docFrag = document.createDocumentFragment();

                argArr.forEach(function (argItem) {
                    var isNode = argItem instanceof Node;
                    docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
                });

                this.insertBefore(docFrag, this.firstChild);
            }
        });
    });
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);

/**
 * remove() polyfill
 */
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('remove')) {
            return;
        }
        Object.defineProperty(item, 'remove', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                if (this.parentNode === null) {
                    return;
                }
                this.parentNode.removeChild(this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);


/**
 * document.scrollingElement的polyfill
 * @type {[type]}
 */
/*! https://mths.be/scrollingelement v1.5.2 by @diegoperini & @mathias | MIT license */
if (!('scrollingElement' in document)) (function () {

    function computeStyle(element) {
        if (window.getComputedStyle) {
            // Support Firefox < 4 which throws on a single parameter.
            return getComputedStyle(element, null);
        }
        // Support Internet Explorer < 9.
        return element.currentStyle;
    }

    function isBodyElement(element) {
        // The `instanceof` check gives the correct result for e.g. `body` in a
        // non-HTML namespace.
        if (window.HTMLBodyElement) {
            return element instanceof HTMLBodyElement;
        }
        // Fall back to a `tagName` check for old browsers.
        return /body/i.test(element.tagName);
    }

    function getNextBodyElement(frameset) {
        // We use this function to be correct per spec in case `document.body` is
        // a `frameset` but there exists a later `body`. Since `document.body` is
        // a `frameset`, we know the root is an `html`, and there was no `body`
        // before the `frameset`, so we just need to look at siblings after the
        // `frameset`.
        var current = frameset;
        while (current = current.nextSibling) {
            if (current.nodeType == 1 && isBodyElement(current)) {
                return current;
            }
        }
        // No `body` found.
        return null;
    }

    // Note: standards mode / quirks mode can be toggled at runtime via
    // `document.write`.
    var isCompliantCached;
    var isCompliant = function () {
        var isStandardsMode = /^CSS1/.test(document.compatMode);
        if (!isStandardsMode) {
            // In quirks mode, the result is equivalent to the non-compliant
            // standards mode behavior.
            return false;
        }
        if (isCompliantCached === void 0) {
            // When called for the first time, check whether the browser is
            // standard-compliant, and cache the result.
            var iframe = document.createElement('iframe');
            iframe.style.height = '1px';
            (document.body || document.documentElement || document).appendChild(iframe);
            var doc = iframe.contentWindow.document;
            doc.write('<!DOCTYPE html><div style="height:9999em">x</div>');
            doc.close();
            isCompliantCached = doc.documentElement.scrollHeight > doc.body.scrollHeight;
            iframe.parentNode.removeChild(iframe);
        }
        return isCompliantCached;
    };

    function isRendered(style) {
        return style.display != 'none' && !(style.visibility == 'collapse' &&
            /^table-(.+-group|row|column)$/.test(style.display));
    }

    function isScrollable(body) {
        // A `body` element is scrollable if `body` and `html` both have
        // non-`visible` overflow and are both being rendered.
        var bodyStyle = computeStyle(body);
        var htmlStyle = computeStyle(document.documentElement);
        return bodyStyle.overflow != 'visible' && htmlStyle.overflow != 'visible' &&
            isRendered(bodyStyle) && isRendered(htmlStyle);
    }

    var scrollingElement = function () {
        if (isCompliant()) {
            return document.documentElement;
        }
        var body = document.body;
        // Note: `document.body` could be a `frameset` element, or `null`.
        // `tagName` is uppercase in HTML, but lowercase in XML.
        var isFrameset = body && !/body/i.test(body.tagName);
        body = isFrameset ? getNextBodyElement(body) : body;
        // If `body` is itself scrollable, it is not the `scrollingElement`.
        return body && isScrollable(body) ? null : body;
    };

    if (Object.defineProperty) {
        // Support modern browsers that lack a native implementation.
        Object.defineProperty(document, 'scrollingElement', {
            'get': scrollingElement
        });
    } else if (document.__defineGetter__) {
        // Support Firefox ≤ 3.6.9, Safari ≤ 4.1.3.
        document.__defineGetter__('scrollingElement', scrollingElement);
    } else {
        // IE ≤ 4 lacks `attachEvent`, so it only gets this one assignment. IE ≤ 7
        // gets it too, but the value is updated later (see `propertychange`).
        document.scrollingElement = scrollingElement();
        document.attachEvent && document.attachEvent('onpropertychange', function () {
            // This is for IE ≤ 7 only.
            // A `propertychange` event fires when `<body>` is parsed because
            // `document.activeElement` then changes.
            if (window.event.propertyName == 'activeElement') {
                document.scrollingElement = scrollingElement();
            }
        });
    }
}());

/**
 * Object.assign polyfill
 * @param  {String} typeof Object.assign ! [description]
 * @return {[type]}        [description]
 */
if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, 'assign', {
        value: function assign (target) {
            // .length of function is 2
            'use strict';
            if (target === null) {
                // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource !== null) {
                    // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}

// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
(function (global) {
    'use strict';
    if (!global.console) {
        global.console = {};
    }
    var con = global.console;
    var prop, method;
    var dummy = function () {};
    var properties = ['memory'];
    var methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
     'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
     'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn,timeLog,trace').split(',');
    while (prop = properties.pop()) if (!con[prop]) con[prop] = {};
    while (method = methods.pop()) if (!con[method]) con[method] = dummy;
    // Using `this` for web workers & supports Browserify / Webpack.
})((typeof global !== 'undefined') ? global
: ((typeof window !== 'undefined') ? window
: ((typeof self !== 'undefined') ? self : this)));


/**
 * CustomEvent constructor polyfill for IE
 * @return {[type]} [description]
 */
(function () {
    if (typeof window.CustomEvent === 'function') {
        //If not IE
        return false;
    }

    var CustomEvent = function (event, params) {
        params = params || {
            bubbles: false,
            cancelable: false,
            detail: undefined
        };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

/**
 * 字符串repeat for IE and some mobile
 * @param  {[type]} !String.prototype.repeat [description]
 * @return {[type]}                          [description]
 */
if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        'use strict';
        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }
        // 确保 count 是一个 31 位的整数。这样我们就可以使用如下优化的算法。
        // 当前（2014年8月），绝大多数浏览器都不能支持 1 << 28 长的字符串，所以：
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }
        var rpt = '';
        for (;;) {
            if ((count & 1) == 1) {
                rpt += str;
            }
            count >>>= 1;
            if (count == 0) {
                break;
            }
            str += str;
        }
        return rpt;
    };
}


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function () {
    var lastTime = 0;

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

/**
 * @description resize polyfill for IE/Edge
 * @author zhangxinxu(.com)
 */
if (typeof window.getComputedStyle(document.body).resize == 'undefined' && window.HTMLTextAreaElement) {
    HTMLTextAreaElement.prototype.setResize = function () {
        // 元素
        var textarea = this;
        var target = textarea.data && textarea.data.resize;
        var resize = null;
        // 文本域的id
        var id = textarea.id;
        if (!id) {
            id = ('r' + Math.random()).replace('0.', '');
            textarea.id = id;
        }
        // 获取resize属性值
        var attrResize = textarea.getAttribute('resize');

        if (typeof attrResize == 'string' && attrResize != 'vertical' && attrResize != 'horizontal') {
            attrResize = 'both';
        }
        if (typeof attrResize != 'string') {
            return;
        }

        // 创建模拟拉伸的基本元素
        if (!target) {
            target = document.createElement('span');
            resize = document.createElement('label');
            resize.setAttribute('for', id);
            target.appendChild(resize);
            // 一些固定的样式设置
            target.style.position = 'relative';
            target.style.verticalAlign = window.getComputedStyle(textarea).verticalAlign;

            resize.style.position = 'absolute';
            resize.style.width = '17px';
            resize.style.height = '17px';
            resize.style.background = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M765.558 510.004a93.65 93.65 0 1 0 191.665 0 93.65 93.65 0 1 0-191.665 0zM765.558 821.46a93.65 93.65 0 1 0 191.665 0 93.65 93.65 0 1 0-191.665 0zM422.15700000000004 821.46a93.65 93.65 0 1 0 191.665 0 93.65 93.65 0 1 0-191.665 0zM422.15700000000004 510.004a93.65 93.65 0 1 0 191.665 0 93.65 93.65 0 1 0-191.665 0zM765.558 202.54a93.65 93.65 0 1 0 191.665 0 93.65 93.65 0 1 0-191.665 0zM66.77700000000002 821.46a93.65 93.65 0 1 0 191.665 0 93.65 93.65 0 1 0-191.665 0z' fill='%23BFBFBF'/%3E%3C/svg%3E\") no-repeat center";
            resize.style.bottom = '0';
            resize.style.right = '0';
            resize.style.backgroundSize = '12px 12px';
            // 在textarea元素后面显示
            textarea.insertAdjacentElement('afterend', target);
            textarea.data = textarea.data || {};
            textarea.data.resize = target;

            // 事件
            var store = {};
            resize.addEventListener('mousedown', function (event) {
                store.resizing = true;
                store.startX = event.pageX;
                store.startY = event.pageY;
                // 此时textarea的尺寸
                store.offsetWidth = textarea.offsetWidth;
                store.offsetHeight = textarea.offsetHeight;

                event.preventDefault();
            });

            document.addEventListener('mousemove', function (event) {
                if (!store.resizing) {
                    return;
                }
                event.preventDefault();

                var currentX = event.pageX;
                var currentY = event.pageY;

                var moveX = currentX - store.startX;
                var moveY = currentY - store.startY;

                var currentWidth = store.offsetWidth + moveX;
                var currentHeight = store.offsetHeight + moveY;

                if (currentWidth < 40) {
                    currentWidth = 40;
                }
                if (currentHeight < 40) {
                    currentHeight = 40;
                }

                // 尺寸设置
                if (attrResize == 'both' || attrResize == 'horizontal') {
                    textarea.style.width = currentWidth + 'px';
                    if (target.style.display == 'block') {
                        target.style.width = currentWidth + 'px';
                    }
                }
                if (attrResize == 'both' || attrResize == 'vertical') {
                    textarea.style.height = currentHeight + 'px';
                    if (/inline/.test(styleDisplay)) {
                        target.style.height = currentHeight + 'px';
                    }
                }
            });

            document.addEventListener('mouseup', function () {
                if (store.resizing) {
                    store.resizing = false;
                }
            });
        }

        // 样式的控制与处理
        var styleDisplay = window.getComputedStyle(textarea).display;
        if (styleDisplay == 'none') {
            target.style.display = 'none';
        } else if (/inline/.test(styleDisplay)) {
            target.style.display = 'inline-block';
            target.style.height = textarea.offsetHeight + 'px';
        } else {
            target.style.display = 'block';
            target.style.width = textarea.offsetWidth + 'px';
        }
    };

    HTMLTextAreaElement.prototype.initResize = function () {
        // 避免重复初始化
        if (this.isInitResize) {
            return;
        }
        this.setResize();

        // 更新与处理
        this.addEventListener('DOMAttrModified', function () {
            this.setResize();
        }, false);

        this.isInitResize = true;
    };

    window.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('textarea[resize]').forEach(function (textarea) {
            textarea.initResize();
        });

        // 插入内容时候的自动初始化
        document.body.addEventListener('DOMNodeInserted', function (event) {
            // 插入的元素
            var target = event.target;
            // 非元素节点不处理
            if (target.nodeType != 1) {
                return;
            }

            if (target.matches('textarea[resize]') && (!target.data || !target.data.resize)) {
                target.initResize();
            }
        });
    });
}

/**
 * @description placeholder polyfill for IE9
 *              only support one line
 *              no consideration of settings placeholder attr
 * @author      zhangxinxu(.com)
 * @created     2019-08-09
 */
if (!('placeholder' in document.createElement('input')) && window.HTMLTextAreaElement) {
    HTMLTextAreaElement.prototype.setPlaceholder = HTMLInputElement.prototype.setPlaceholder = function () {

        var control = this;

        var placeholder = control.getAttribute('placeholder');

        if (!placeholder) {
            control.style.backgroundPosition = '-2999px -2999px';
            return;
        }

        // 获取此时control的字体和字号
        var stylesControl = window.getComputedStyle(control);

        // 实现原理：创建一个offset screen canvas，并把placeholder绘制在上面

        // 一些样式
        var fontSize = stylesControl.fontSize;
        var fontFamily = stylesControl.fontFamily;
        var lineHeight = parseInt(stylesControl.lineHeight) || 20;

        // 起始坐标
        var x = parseInt(stylesControl.paddingLeft) || 0;
        var y = parseInt(stylesControl.paddingTop) || 0;

        // 尺寸
        var width = control.clientWidth;
        var height = control.offsetHeight;

        // 如果隐藏，则不处理
        var display = stylesControl.display;
        if (display == 'none' || width == 0) {
            return;
        }

        // canvas的创建
        control.data = control.data || {};
        // 先判断有没有缓存住
        var canvas = control.data.placeholder;
        // 如果没有，创建
        if (!canvas) {
            canvas = document.createElement('canvas');
            // 存储canvas对象
            control.data.placeholder = canvas;
        }

        // 如果尺寸没变化，placeholder也没变化，则不处理
        if (canvas.placeholder == placeholder && canvas.width == width) {
            return;
        }

        var context = canvas.getContext('2d');
        if (canvas.width) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        // 记住占位符内容
        canvas.placeholder = placeholder;

        // 尺寸变化
        canvas.width = width;
        canvas.height = height;

        // 设置样式
        context.fillStyle = '#a2a9b6';
        context.font = [fontSize, fontFamily].join(' ');
        context.textBaseline = 'top';

        // 字符分隔为数组
        var arrText = placeholder.split('');
        var line = '';
        var maxWidth = width - x * 2;

        for (var n = 0; n < arrText.length; n++) {
            var testLine = line + arrText[n];
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = arrText[n];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);

        var backgroundImage = canvas.toDataURL();
        control.style.backgroundRepeat = 'no-repeat';
        control.style.backgroundImage = 'url(' + backgroundImage + ')';
    };

    HTMLTextAreaElement.prototype.initPlaceholder = HTMLInputElement.prototype.initPlaceholder = function () {
        // 避免重复初始化
        if (this.isInitPlaceholder) {
            return;
        }

        this.setPlaceholder();

        // 更新与处理
        this.addEventListener('DOMAttrModified', function () {
            this.setPlaceholder();
        }, false);

        this.addEventListener('focus', function () {
            this.style.backgroundPosition = '-2999px -2999px';
        });
        this.addEventListener('blur', function () {
            if (this.value.trim() == '') {
                this.style.backgroundPosition = '';
            }
        });

        this.isInitPlaceholder = true;
    };

    window.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('textarea[placeholder], input[placeholder]').forEach(function (control) {
            control.initPlaceholder();
        });

        // 插入内容时候的自动初始化
        document.body.addEventListener('DOMNodeInserted', function (event) {
            // 插入的Node节点
            var target = event.target;

            // 非元素节点不处理
            if (target.nodeType != 1) {
                return;
            }

            if (/^textarea|input$/i.test(target.tagName) && target.matches('[placeholder]')  && (!target.data || !target.data.placeholder)) {
                target.initPlaceholder();
            }
        });
    });
}

/*
 * @preserve FormData polyfill for IE < 10. See https://developer.mozilla.org/en/docs/Web/API/FormData and http://caniuse.com/#search=formdata
 *
 * @author ShirtlessKirk copyright 2015
 * @license WTFPL (http://www.wtfpl.net/txt/copying)
 */
/*global define: false, module: false */
/*jslint bitwise: true, continue: true, nomen: true */
(function formDataModule(global, definition) { // non-exporting module magic dance
    'use strict';
    var
        amd = 'amd',
        exports = 'exports'; // keeps the method names for CommonJS / AMD from being compiled to single character variable

    if (typeof define === 'function' && define[amd]) {
        define(function definer() {
            return definition(global);
        });
    } else if (typeof module === 'function' && module[exports]) {
        module[exports] = definition(global);
    } else {
        definition(global);
    }
}((
    (typeof global !== 'undefined') ? global
        : ((typeof window !== 'undefined') ? window
            : ((typeof self !== 'undefined') ? self : this))
), function formDataPartialPolyfill(global) { // partial polyfill
    'use strict';

    var
        formDataPrototype,
        math = Math,
        method,
        methods,
        xhrSend,
        xmlHttpRequestPrototype;

    function has (key) {
        return this._data.hasOwnProperty(key);
    }

    function append (key, value) {
        var
            self = this;

        if (!has.call(self, key)) {
            self._data[key] = [];
        }

        self._data[key].push(value);
    }

    function deleteFn (key) {
        delete this._data[key];
    }

    function getAll (key) {
        return this._data[key] || null;
    }

    function get (key) {
        var
            values = getAll.call(this, key);

        return values ? values[0] : null;
    }

    function set (key, value) {
        this._data[key] = [value];
    }

    function createBoundary () {
        // for XHR
        var random = math.random;
        var salt = (random() * math.pow(10, ((random() * 12) | 0) + 1));
        var hash = (random() * salt).toString(36);

        return '----------------FormData-' + hash;
    }

    function parseContents (children) {
        var
            child,
            counter,
            counter2,
            length,
            length2,
            name,
            option,
            self = this;

        for (counter = 0, length = children.length; counter < length; counter += 1) {
            child = children[counter];
            name = child.name || child.id;
            if (!name || child.disabled) {
                continue;
            }

            switch (child.type) {
                case 'checkbox':
                    if (child.checked) {
                        self.append(name, child.value || 'on');
                    }

                    break;

                // x/y coordinates or origin if missing
                case 'image':
                    self.append(name + '.x', child.x || 0);
                    self.append(name + '.y', child.y || 0);

                    break;

                case 'radio':
                    if (child.checked) {
                        // using .set as only one can be valid (uses last one if more discovered)
                        self.set(name, child.value);
                    }

                    break;

                case 'select-one':
                    if (child.selectedIndex !== -1) {
                        self.append(name, child.options[child.selectedIndex].value);
                    }

                    break;

                case 'select-multiple':
                    for (counter2 = 0, length2 = child.options.length; counter2 < length2; counter2 += 1) {
                        option = child.options[counter2];
                        if (option.selected) {
                            self.append(name, option.value);
                        }
                    }

                    break;

                case 'file':
                case 'reset':
                case 'submit':
                    break;

                default: // hidden, text, textarea, password
                    self.append(name, child.value);
            }
        }
    }

    function toString () {
        var
            self = this,
            body = [],
            data = self._data,
            key,
            prefix = '--';

        for (key in data) {
            if (data.hasOwnProperty(key)) {
                body.push(prefix + self._boundary); // boundaries are prefixed with '--'
                // only form fields for now, files can wait / probably can't be done
                body.push('Content-Disposition: form-data; name="' + key + '"\r\n'); // two linebreaks between definition and content
                body.push(data[key]);
            }
        }

        if (body.length) {
            return body.join('\r\n') + '\r\n' + prefix + self._boundary + prefix; // form content ends with '--'
        }

        return '';
    }

    /**
     * [FormData description]
     * @contructor
     * @param {?HTMLForm} form HTML <form> element to populate the object (optional)
     */
    function FormData (form) {
        var
            self = this;

        if (!(self instanceof FormData)) {
            return new FormData(form);
        }

        if (form && (!form.tagName || form.tagName !== 'FORM')) { // not a form
            return;
        }

        self._boundary = createBoundary();
        self._data = {};

        if (!form) { // nothing to parse, we're done here
            return;
        }

        parseContents.call(self, form.children);
    }

    function send (data) {
        var
            self = this;

        if (data instanceof FormData) {
            self.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + data._boundary);

            return xhrSend.call(self, data.toString());
        }

        return xhrSend.call(self, data || null);
    }

    if (!!global.FormData) { // nothing to do...
        return;
    }

    xmlHttpRequestPrototype = global.XMLHttpRequest.prototype;
    xhrSend = xmlHttpRequestPrototype.send;
    xmlHttpRequestPrototype.send = send;

    methods = {
        append: append,
        get: get,
        getAll: getAll,
        has: has,
        set: set,
        toString: toString
    };

    formDataPrototype = FormData.prototype;
    for (method in methods) {
        if (methods.hasOwnProperty(method)) {
            formDataPrototype[method] = methods[method];
        }
    }

    formDataPrototype['delete'] = deleteFn;

    global.FormData = FormData;
}));

/*
 * <progress> polyfill
 * Don't forget to also include progress-polyfill.css!
 * @author Lea Verou http://leaverou.me
 */

(function () {

    // Test browser support first
    if ('position' in document.createElement('progress')) {
        return;
    }

    /**
     * Private functions
     */

    // Smoothen out differences between Object.defineProperty
    // and __defineGetter__/__defineSetter__
    var defineProperty;
    var supportsEtters = true;

    if (Object.defineProperty) {
        // Changed to fix issue #3 https://github.com/LeaVerou/HTML5-Progress-polyfill/issues/3
        defineProperty = function (o, property, etters) {
            etters.enumerable = true;
            etters.configurable = true;

            try {
                Object.defineProperty(o, property, etters);
            } catch (e) {
                if (e.number === -0x7FF5EC54) {
                    etters.enumerable = false;
                    Object.defineProperty(o, property, etters);
                }
            }
        };
    } else if ('__defineSetter__' in document.body) {
        defineProperty = function (o, property, etters) {
            o.__defineGetter__(property, etters.get);

            if (etters.set) {
                o.__defineSetter__(property, etters.set);
            }
        };
    } else {
        // Fallback to regular properties if getters/setters are not supported
        defineProperty = function (o, property, etters) {
            o[property] = etters.get.call(o);
        };
        supportsEtters = false;
    }

    var arr;

    try {
        [].slice.apply(document.images);

        arr = function (collection) {
            return [].slice.apply(collection);
        };
    } catch (e) {
        arr = function (collection) {
            var ret = [];
            var len = collection.length;

            for (var i = 0; i < len; i++) {
                ret[i] = collection[i];
            }

            return ret;
        };
    }

    // Does the browser use attributes as properties? (IE8- bug)
    var attrsAsProps = (function () {
        var e = document.createElement('div');
        e.foo = 'bar';
        return e.getAttribute('foo') === 'bar';
    })();

    var self = window.ProgressPolyfill = {
        DOMInterface: {
            max: {
                get: function () {
                    return parseFloat(this.getAttribute('aria-valuemax')) || 1;
                },

                set: function (value) {
                    this.setAttribute('aria-valuemax', value);

                    if (!attrsAsProps) {
                        this.setAttribute('max', value);
                    }

                    self.redraw(this);
                }
            },

            value: {
                get: function () {
                    return parseFloat(this.getAttribute('aria-valuenow')) || 0;
                },

                set: function (value) {
                    value = Math.min(value, this.max);
                    this.setAttribute('aria-valuenow', value);

                    if (!attrsAsProps) {
                        this.setAttribute('value', value);
                    }

                    self.redraw(this);
                }
            },

            position: {
                get: function () {
                    return this.hasAttribute('aria-valuenow') ? this.value / this.max : -1;
                }
            },

            labels: {
                get: function () {
                    var label = this.parentNode;

                    while (label && !/^label$/i.test(label.nodeName)) {
                        label = label.parentNode;
                    }

                    var labels = label ? [label] : [];

                    if (this.id && document.querySelectorAll) {
                        var forLabels = arr(document.querySelectorAll('label[for="' + this.id + '"]'));

                        if (forLabels.length) {
                            labels = labels.concat(forLabels);
                        }
                    }

                    return labels;
                }
            }
        },

        redraw: function redraw (progress) {
            if (!self.isInited(progress)) {
                self.init(progress);
            } else if (!attrsAsProps) {
                progress.setAttribute('aria-valuemax', parseFloat(progress.getAttribute('max')) || 1);

                if (progress.hasAttribute('value')) {
                    progress.setAttribute('aria-valuenow', parseFloat(progress.getAttribute('value')) || 0);
                } else {
                    progress.removeAttribute('aria-valuenow');
                }
            }

            if (progress.position !== -1) {
                progress.style.paddingRight = progress.offsetWidth * (1 - progress.position) + 'px';
            }
        },

        isInited: function (progress) {
            return progress.getAttribute('role') === 'progressbar';
        },

        init: function (progress) {
            if (self.isInited(progress)) {
                // Already init-ed
                return;
            }

            // Add ARIA
            progress.setAttribute('role', 'progressbar');
            progress.setAttribute('aria-valuemin', '0');
            progress.setAttribute('aria-valuemax', parseFloat(progress.getAttribute('max')) || 1);

            if (progress.hasAttribute('value')) {
                progress.setAttribute('aria-valuenow', parseFloat(progress.getAttribute('value')) || 0);
            }

            // We can't add them on a prototype, as it's the same for all unknown elements
            for (var attribute in self.DOMInterface) {
                defineProperty(progress, attribute, {
                    get: self.DOMInterface[attribute].get,
                    set: self.DOMInterface[attribute].set
                });
            }

            self.redraw(progress);
        },

        // Live NodeList, will update automatically
        progresses: document.getElementsByTagName('progress')
    };

    for (var i = self.progresses.length - 1; i >= 0; i--) {
        self.init(self.progresses[i]);
    }

    // Take care of future ones too, if supported
    if (document.addEventListener) {
        document.addEventListener('DOMAttrModified', function (evt) {
            var node = evt.target;
            var attribute = evt.attrName;

            if (/^progress$/i.test(node.nodeName) && (attribute === 'max' || attribute === 'value')) {
                self.redraw(node);
            }
        }, false);

        document.addEventListener('DOMNodeInserted', function (evt) {
            var node = evt.target;

            if (/^progress$/i.test(node.nodeName)) {
                self.init(node);
            }
        }, false);
    }
})();
