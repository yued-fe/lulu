/*! (c) Andrea Giammarchi @webreflection ISC */
(function () {
  'use strict';

  var attributesObserver = (function (whenDefined, MutationObserver) {
    var attributeChanged = function attributeChanged(records) {
      for (var i = 0, length = records.length; i < length; i++) dispatch(records[i]);
    };
    var dispatch = function dispatch(_ref) {
      var target = _ref.target,
        attributeName = _ref.attributeName,
        oldValue = _ref.oldValue;
      target.attributeChangedCallback(attributeName, oldValue, target.getAttribute(attributeName));
    };
    return function (target, is) {
      var attributeFilter = target.constructor.observedAttributes;
      if (attributeFilter) {
        whenDefined(is).then(function () {
          new MutationObserver(attributeChanged).observe(target, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: attributeFilter
          });
          for (var i = 0, length = attributeFilter.length; i < length; i++) {
            if (target.hasAttribute(attributeFilter[i])) dispatch({
              target: target,
              attributeName: attributeFilter[i],
              oldValue: null
            });
          }
        });
      }
      return target;
    };
  });

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
    if (!it) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;
        var F = function () {};
        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    var normalCompletion = true,
      didErr = false,
      err;
    return {
      s: function () {
        it = it.call(o);
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  /*! (c) Andrea Giammarchi - ISC */
  var TRUE = true,
    FALSE = false,
    QSA$1 = 'querySelectorAll';

  /**
   * Start observing a generic document or root element.
   * @param {(node:Element, connected:boolean) => void} callback triggered per each dis/connected element
   * @param {Document|Element} [root=document] by default, the global document to observe
   * @param {Function} [MO=MutationObserver] by default, the global MutationObserver
   * @param {string[]} [query=['*']] the selectors to use within nodes
   * @returns {MutationObserver}
   */
  var notify = function notify(callback) {
    var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;
    var MO = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : MutationObserver;
    var query = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['*'];
    var loop = function loop(nodes, selectors, added, removed, connected, pass) {
      var _iterator = _createForOfIteratorHelper(nodes),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var node = _step.value;
          if (pass || QSA$1 in node) {
            if (connected) {
              if (!added.has(node)) {
                added.add(node);
                removed["delete"](node);
                callback(node, connected);
              }
            } else if (!removed.has(node)) {
              removed.add(node);
              added["delete"](node);
              callback(node, connected);
            }
            if (!pass) loop(node[QSA$1](selectors), selectors, added, removed, connected, TRUE);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    };
    var mo = new MO(function (records) {
      if (query.length) {
        var selectors = query.join(',');
        var added = new Set(),
          removed = new Set();
        var _iterator2 = _createForOfIteratorHelper(records),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var _step2$value = _step2.value,
              addedNodes = _step2$value.addedNodes,
              removedNodes = _step2$value.removedNodes;
            loop(removedNodes, selectors, added, removed, FALSE, FALSE);
            loop(addedNodes, selectors, added, removed, TRUE, FALSE);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }
    });
    var observe = mo.observe;
    (mo.observe = function (node) {
      return observe.call(mo, node, {
        subtree: TRUE,
        childList: TRUE
      });
    })(root);
    return mo;
  };

  var QSA = 'querySelectorAll';
  var _self$1 = self,
    document$2 = _self$1.document,
    Element$1 = _self$1.Element,
    MutationObserver$2 = _self$1.MutationObserver,
    Set$2 = _self$1.Set,
    WeakMap$1 = _self$1.WeakMap;
  var elements = function elements(element) {
    return QSA in element;
  };
  var filter = [].filter;
  var qsaObserver = (function (options) {
    var live = new WeakMap$1();
    var drop = function drop(elements) {
      for (var i = 0, length = elements.length; i < length; i++) live["delete"](elements[i]);
    };
    var flush = function flush() {
      var records = observer.takeRecords();
      for (var i = 0, length = records.length; i < length; i++) {
        parse(filter.call(records[i].removedNodes, elements), false);
        parse(filter.call(records[i].addedNodes, elements), true);
      }
    };
    var matches = function matches(element) {
      return element.matches || element.webkitMatchesSelector || element.msMatchesSelector;
    };
    var notifier = function notifier(element, connected) {
      var selectors;
      if (connected) {
        for (var q, m = matches(element), i = 0, length = query.length; i < length; i++) {
          if (m.call(element, q = query[i])) {
            if (!live.has(element)) live.set(element, new Set$2());
            selectors = live.get(element);
            if (!selectors.has(q)) {
              selectors.add(q);
              options.handle(element, connected, q);
            }
          }
        }
      } else if (live.has(element)) {
        selectors = live.get(element);
        live["delete"](element);
        selectors.forEach(function (q) {
          options.handle(element, connected, q);
        });
      }
    };
    var parse = function parse(elements) {
      var connected = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      for (var i = 0, length = elements.length; i < length; i++) notifier(elements[i], connected);
    };
    var query = options.query;
    var root = options.root || document$2;
    var observer = notify(notifier, root, MutationObserver$2, query);
    var attachShadow = Element$1.prototype.attachShadow;
    if (attachShadow) Element$1.prototype.attachShadow = function (init) {
      var shadowRoot = attachShadow.call(this, init);
      observer.observe(shadowRoot);
      return shadowRoot;
    };
    if (query.length) parse(root[QSA](query));
    return {
      drop: drop,
      flush: flush,
      observer: observer,
      parse: parse
    };
  });

  var _self = self,
    document$1 = _self.document,
    Map = _self.Map,
    MutationObserver$1 = _self.MutationObserver,
    Object$1 = _self.Object,
    Set$1 = _self.Set,
    WeakMap = _self.WeakMap,
    Element = _self.Element,
    HTMLElement = _self.HTMLElement,
    Node = _self.Node,
    Error = _self.Error,
    TypeError$1 = _self.TypeError,
    Reflect = _self.Reflect;
  var defineProperty = Object$1.defineProperty,
    keys = Object$1.keys,
    getOwnPropertyNames = Object$1.getOwnPropertyNames,
    setPrototypeOf = Object$1.setPrototypeOf;
  var legacy = !self.customElements;
  var expando = function expando(element) {
    var key = keys(element);
    var value = [];
    var ignore = new Set$1();
    var length = key.length;
    for (var i = 0; i < length; i++) {
      value[i] = element[key[i]];
      try {
        delete element[key[i]];
      } catch (SafariTP) {
        ignore.add(i);
      }
    }
    return function () {
      for (var _i = 0; _i < length; _i++) ignore.has(_i) || (element[key[_i]] = value[_i]);
    };
  };
  if (legacy) {
    var HTMLBuiltIn = function HTMLBuiltIn() {
      var constructor = this.constructor;
      if (!classes.has(constructor)) throw new TypeError$1('Illegal constructor');
      var is = classes.get(constructor);
      if (override) return augment(override, is);
      var element = createElement.call(document$1, is);
      return augment(setPrototypeOf(element, constructor.prototype), is);
    };
    var createElement = document$1.createElement;
    var classes = new Map();
    var defined = new Map();
    var prototypes = new Map();
    var registry = new Map();
    var query = [];
    var handle = function handle(element, connected, selector) {
      var proto = prototypes.get(selector);
      if (connected && !proto.isPrototypeOf(element)) {
        var redefine = expando(element);
        override = setPrototypeOf(element, proto);
        try {
          new proto.constructor();
        } finally {
          override = null;
          redefine();
        }
      }
      var method = "".concat(connected ? '' : 'dis', "connectedCallback");
      if (method in proto) element[method]();
    };
    var _qsaObserver = qsaObserver({
        query: query,
        handle: handle
      }),
      parse = _qsaObserver.parse;
    var override = null;
    var whenDefined = function whenDefined(name) {
      if (!defined.has(name)) {
        var _,
          $ = new Promise(function ($) {
            _ = $;
          });
        defined.set(name, {
          $: $,
          _: _
        });
      }
      return defined.get(name).$;
    };
    var augment = attributesObserver(whenDefined, MutationObserver$1);
    self.customElements = {
      define: function define(is, Class) {
        if (registry.has(is)) throw new Error("the name \"".concat(is, "\" has already been used with this registry"));
        classes.set(Class, is);
        prototypes.set(is, Class.prototype);
        registry.set(is, Class);
        query.push(is);
        whenDefined(is).then(function () {
          parse(document$1.querySelectorAll(is));
        });
        defined.get(is)._(Class);
      },
      get: function get(is) {
        return registry.get(is);
      },
      whenDefined: whenDefined
    };
    defineProperty(HTMLBuiltIn.prototype = HTMLElement.prototype, 'constructor', {
      value: HTMLBuiltIn
    });
    self.HTMLElement = HTMLBuiltIn;
    document$1.createElement = function (name, options) {
      var is = options && options.is;
      var Class = is ? registry.get(is) : registry.get(name);
      return Class ? new Class() : createElement.call(document$1, name);
    };
    // in case ShadowDOM is used through a polyfill, to avoid issues
    // with builtin extends within shadow roots
    if (!('isConnected' in Node.prototype)) defineProperty(Node.prototype, 'isConnected', {
      configurable: true,
      get: function get() {
        return !(this.ownerDocument.compareDocumentPosition(this) & this.DOCUMENT_POSITION_DISCONNECTED);
      }
    });
  } else {
    legacy = !self.customElements.get('extends-br');
    if (legacy) {
      try {
        var BR = function BR() {
          return self.Reflect.construct(HTMLBRElement, [], BR);
        };
        BR.prototype = HTMLLIElement.prototype;
        var is = 'extends-br';
        self.customElements.define('extends-br', BR, {
          'extends': 'br'
        });
        legacy = document$1.createElement('br', {
          is: is
        }).outerHTML.indexOf(is) < 0;
        var _self$customElements = self.customElements,
          get = _self$customElements.get,
          _whenDefined = _self$customElements.whenDefined;
        self.customElements.whenDefined = function (is) {
          var _this = this;
          return _whenDefined.call(this, is).then(function (Class) {
            return Class || get.call(_this, is);
          });
        };
      } catch (o_O) {}
    }
  }
  if (legacy) {
    var _parseShadow = function _parseShadow(element) {
      var root = shadowRoots.get(element);
      _parse(root.querySelectorAll(this), element.isConnected);
    };
    var customElements = self.customElements;
    var _createElement = document$1.createElement;
    var define = customElements.define,
      _get = customElements.get,
      upgrade = customElements.upgrade;
    var _ref = Reflect || {
        construct: function construct(HTMLElement) {
          return HTMLElement.call(this);
        }
      },
      construct = _ref.construct;
    var shadowRoots = new WeakMap();
    var shadows = new Set$1();
    var _classes = new Map();
    var _defined = new Map();
    var _prototypes = new Map();
    var _registry = new Map();
    var shadowed = [];
    var _query = [];
    var getCE = function getCE(is) {
      return _registry.get(is) || _get.call(customElements, is);
    };
    var _handle = function _handle(element, connected, selector) {
      var proto = _prototypes.get(selector);
      if (connected && !proto.isPrototypeOf(element)) {
        var redefine = expando(element);
        _override = setPrototypeOf(element, proto);
        try {
          new proto.constructor();
        } finally {
          _override = null;
          redefine();
        }
      }
      var method = "".concat(connected ? '' : 'dis', "connectedCallback");
      if (method in proto) element[method]();
    };
    var _qsaObserver2 = qsaObserver({
        query: _query,
        handle: _handle
      }),
      _parse = _qsaObserver2.parse;
    var _qsaObserver3 = qsaObserver({
        query: shadowed,
        handle: function handle(element, connected) {
          if (shadowRoots.has(element)) {
            if (connected) shadows.add(element);else shadows["delete"](element);
            if (_query.length) _parseShadow.call(_query, element);
          }
        }
      }),
      parseShadowed = _qsaObserver3.parse;
    // qsaObserver also patches attachShadow
    // be sure this runs *after* that
    var attachShadow = Element.prototype.attachShadow;
    if (attachShadow) Element.prototype.attachShadow = function (init) {
      var root = attachShadow.call(this, init);
      shadowRoots.set(this, root);
      return root;
    };
    var _whenDefined2 = function _whenDefined2(name) {
      if (!_defined.has(name)) {
        var _,
          $ = new Promise(function ($) {
            _ = $;
          });
        _defined.set(name, {
          $: $,
          _: _
        });
      }
      return _defined.get(name).$;
    };
    var _augment = attributesObserver(_whenDefined2, MutationObserver$1);
    var _override = null;
    getOwnPropertyNames(self).filter(function (k) {
      return /^HTML.*Element$/.test(k);
    }).forEach(function (k) {
      var HTMLElement = self[k];
      function HTMLBuiltIn() {
        var constructor = this.constructor;
        if (!_classes.has(constructor)) throw new TypeError$1('Illegal constructor');
        var _classes$get = _classes.get(constructor),
          is = _classes$get.is,
          tag = _classes$get.tag;
        if (is) {
          if (_override) return _augment(_override, is);
          var element = _createElement.call(document$1, tag);
          element.setAttribute('is', is);
          return _augment(setPrototypeOf(element, constructor.prototype), is);
        } else return construct.call(this, HTMLElement, [], constructor);
      }

      defineProperty(HTMLBuiltIn.prototype = HTMLElement.prototype, 'constructor', {
        value: HTMLBuiltIn
      });
      defineProperty(self, k, {
        value: HTMLBuiltIn
      });
    });
    document$1.createElement = function (name, options) {
      var is = options && options.is;
      if (is) {
        var Class = _registry.get(is);
        if (Class && _classes.get(Class).tag === name) return new Class();
      }
      var element = _createElement.call(document$1, name);
      if (is) element.setAttribute('is', is);
      return element;
    };
    customElements.get = getCE;
    customElements.whenDefined = _whenDefined2;
    customElements.upgrade = function (element) {
      var is = element.getAttribute('is');
      if (is) {
        var _constructor = _registry.get(is);
        if (_constructor) {
          _augment(setPrototypeOf(element, _constructor.prototype), is);
          // apparently unnecessary because this is handled by qsa observer
          // if (element.isConnected && element.connectedCallback)
          //   element.connectedCallback();
          return;
        }
      }
      upgrade.call(customElements, element);
    };
    customElements.define = function (is, Class, options) {
      if (getCE(is)) throw new Error("'".concat(is, "' has already been defined as a custom element"));
      var selector;
      var tag = options && options["extends"];
      _classes.set(Class, tag ? {
        is: is,
        tag: tag
      } : {
        is: '',
        tag: is
      });
      if (tag) {
        selector = "".concat(tag, "[is=\"").concat(is, "\"]");
        _prototypes.set(selector, Class.prototype);
        _registry.set(is, Class);
        _query.push(selector);
      } else {
        define.apply(customElements, arguments);
        shadowed.push(selector = is);
      }
      _whenDefined2(is).then(function () {
        if (tag) {
          _parse(document$1.querySelectorAll(selector));
          shadows.forEach(_parseShadow, [selector]);
        } else parseShadowed(document$1.querySelectorAll(selector));
      });
      _defined.get(is)._(Class);
    };
  }

})();