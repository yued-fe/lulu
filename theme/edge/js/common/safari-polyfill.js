/* eslint-disable */
class AnyClass extends HTMLBRElement {
  constructor () {
    super();

    this.someMethod = true;
  }
}

if (!customElements.get('any-class')) {
  customElements.define('any-class', AnyClass, {
    extends: 'br'
  });
}

// support build-in custom element
// so return
const isSupportBuildIn = document.createElement('br', {
  is: 'any-class'
}).someMethod;

// https://github.com/WebReflection/custom-elements-builtin
(function () {
  'use strict';

  if (isSupportBuildIn) {
    return;
  }

  var attributesObserver = (whenDefined, MutationObserver) => {

    const attributeChanged = records => {
      for (let i = 0, {length} = records; i < length; i++)
        dispatch(records[i]);
    };

    const dispatch = ({target, attributeName, oldValue}) => {
      target.attributeChangedCallback(
        attributeName,
        oldValue,
        target.getAttribute(attributeName)
      );
    };

    return (target, is) => {
      const {observedAttributes: attributeFilter} = target.constructor;
      if (attributeFilter) {
        whenDefined(is).then(() => {
          new MutationObserver(attributeChanged).observe(target, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter
          });
          for (let i = 0, {length} = attributeFilter; i < length; i++) {
            if (target.hasAttribute(attributeFilter[i]))
              dispatch({target, attributeName: attributeFilter[i], oldValue: null});
          }
        });
      }
      return target;
    };
  };

  const {keys} = Object;

  const expando = element => {
    const key = keys(element);
    const value = [];
    const {length} = key;
    for (let i = 0; i < length; i++) {
      value[i] = element[key[i]];
      delete element[key[i]];
    }
    return () => {
      for (let i = 0; i < length; i++)
        element[key[i]] = value[i];
    };
  };

  const {document, MutationObserver, Set, WeakMap} = self;

  const elements = element => 'querySelectorAll' in element;
  const {filter} = [];

  var qsaObserver = options => {
    const live = new WeakMap;
    const callback = records => {
      const {query} = options;
      if (query.length) {
        for (let i = 0, {length} = records; i < length; i++) {
          loop(filter.call(records[i].addedNodes, elements), true, query);
          loop(filter.call(records[i].removedNodes, elements), false, query);
        }
      }
    };
    const drop = elements => {
      for (let i = 0, {length} = elements; i < length; i++)
        live.delete(elements[i]);
    };
    const flush = () => {
      callback(observer.takeRecords());
    };
    const loop = (elements, connected, query, set = new Set) => {
      for (let selectors, element, i = 0, {length} = elements; i < length; i++) {
        // guard against repeated elements within nested querySelectorAll results
        if (!set.has(element = elements[i])) {
          set.add(element);
          if (connected) {
            for (let q, m = matches(element), i = 0, {length} = query; i < length; i++) {
              if (m.call(element, q = query[i])) {
                if (!live.has(element))
                  live.set(element, new Set);
                selectors = live.get(element);
                // guard against selectors that were handled already
                if (!selectors.has(q)) {
                  selectors.add(q);
                  options.handle(element, connected, q);
                }
              }
            }
          }
          // guard against elements that never became live
          else if (live.has(element)) {
            selectors = live.get(element);
            live.delete(element);
            selectors.forEach(q => {
              options.handle(element, connected, q);
            });
          }
          loop(querySelectorAll(element), connected, query, set);
        }
      }
    };
    const matches = element => (
      element.matches ||
      element.webkitMatchesSelector ||
      element.msMatchesSelector
    );
    const parse = (elements, connected = true) => {
      loop(elements, connected, options.query);
    };
    const querySelectorAll = root => query.length ?
                              root.querySelectorAll(query) : query;
    const observer = new MutationObserver(callback);
    const root = options.root || document;
    const {query} = options;
    observer.observe(root, {childList: true, subtree: true});
    parse(querySelectorAll(root));
    return {drop, flush, observer, parse};
  };

  const {
    customElements, document: document$1,
    Element, MutationObserver: MutationObserver$1, Object: Object$1, Promise,
    Map, Set: Set$1, WeakMap: WeakMap$1, Reflect
  } = self;

  const {attachShadow} = Element.prototype;
  const {createElement} = document$1;
  const {define, get} = customElements;
  const {construct} = Reflect || {construct(HTMLElement) {
    return HTMLElement.call(this);
  }};

  const {defineProperty, keys: keys$1, getOwnPropertyNames, setPrototypeOf} = Object$1;

  const shadowRoots = new WeakMap$1;
  const shadows = new Set$1;

  const classes = new Map;
  const defined = new Map;
  const prototypes = new Map;
  const registry = new Map;

  const shadowed = [];
  const query = [];

  const getCE = is => registry.get(is) || get.call(customElements, is);

  const handle = (element, connected, selector) => {
    const proto = prototypes.get(selector);
    if (connected && !proto.isPrototypeOf(element)) {
      const redefine = expando(element);
      override = setPrototypeOf(element, proto);
      try { new proto.constructor; }
      finally {
        override = null;
        redefine();
      }
    }
    const method = `${connected ? '' : 'dis'}connectedCallback`;
    if (method in proto)
      element[method]();
  };

  const {parse} = qsaObserver({query, handle});

  const {parse: parseShadowed} = qsaObserver({
    query: shadowed,
    handle(element, connected) {
      if (shadowRoots.has(element)) {
        if (connected)
          shadows.add(element);
        else
          shadows.delete(element);
        if (query.length)
          parseShadow.call(query, element);
      }
    }
  });

  const whenDefined = name => {
    if (!defined.has(name)) {
      let _, $ = new Promise($ => { _ = $; });
      defined.set(name, {$, _});
    }
    return defined.get(name).$;
  };

  const augment = attributesObserver(whenDefined, MutationObserver$1);

  let override = null;

  getOwnPropertyNames(self)
    .filter(k => /^HTML/.test(k))
    .forEach(k => {
      const HTMLElement = self[k];
      function HTMLBuiltIn() {
        const {constructor} = this;
        if (!classes.has(constructor))
          throw new TypeError('Illegal constructor');
        const {is, tag} = classes.get(constructor);
        if (is) {
          if (override)
            return augment(override, is);
          const element = createElement.call(document$1, tag);
          element.setAttribute('is', is);
          return augment(setPrototypeOf(element, constructor.prototype), is);
        }
        else
          return construct.call(this, HTMLElement, [], constructor);
      }
      setPrototypeOf(HTMLBuiltIn, HTMLElement);
      defineProperty(
        HTMLBuiltIn.prototype = HTMLElement.prototype,
        'constructor',
        {value: HTMLBuiltIn}
      );
      defineProperty(self, k, {value: HTMLBuiltIn});
    });

  defineProperty(document$1, 'createElement', {
    configurable: true,
    value(name, options) {
      const is = options && options.is;
      if (is) {
        const Class = registry.get(is);
        if (Class && classes.get(Class).tag === name)
          return new Class;
      }
      const element = createElement.call(document$1, name);
      if (is)
        element.setAttribute('is', is);
      return element;
    }
  });

  if (attachShadow)
    defineProperty(Element.prototype, 'attachShadow', {
      configurable: true,
      value() {
        const root = attachShadow.apply(this, arguments);
        const {parse} = qsaObserver({query, root, handle});
        shadowRoots.set(this, {root, parse});
        return root;
      }
    });

  defineProperty(customElements, 'get', {
    configurable: true,
    value: getCE
  });

  defineProperty(customElements, 'whenDefined', {
    configurable: true,
    value: whenDefined
  });

  defineProperty(customElements, 'define', {
    configurable: true,
    value(is, Class, options) {
      if (getCE(is))
        throw new Error(`'${is}' has already been defined as a custom element`);
      let selector;
      const tag = options && options.extends;
      classes.set(Class, tag ? {is, tag} : {is: '', tag: is});
      if (tag) {
        selector = `${tag}[is="${is}"]`;
        prototypes.set(selector, Class.prototype);
        registry.set(is, Class);
        query.push(selector);
      }
      else {
        define.apply(customElements, arguments);
        shadowed.push(selector = is);
      }
      whenDefined(is).then(() => {
        if (tag) {
          parse(document$1.querySelectorAll(selector));
          shadows.forEach(parseShadow, [selector]);
        }
        else
          parseShadowed(document$1.querySelectorAll(selector));
      });
      defined.get(is)._(Class);
    }
  });

  function parseShadow(element) {
    const {parse, root} = shadowRoots.get(element);
    parse(root.querySelectorAll(this), element.isConnected);
  }

}());
