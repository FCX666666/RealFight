/*!
 * Vue.js v2.6.11
 * (c) 2014-2019 Evan You
 * Released under the MIT License.
 */
/*  */

/**
 * 
 * vm.$options.parent       等同于 vm.$parent 也就是父vm 也就是当前正在创建的组件的vm
 * vm.$parent               父vm(非抽象)
 * vm.$children             子vm数组
 * vm.$vnode                组件当前对应的 placeholder-vnode  - 占位
 * vm.$options._parentVnode 等同于vm.$vnode - 占位
 * vm._vnode.parent         等同于vm.$vnode - 占位
 * vm._vnode.children       子vnode数组
 * vm._vnode                组件当前对应的vnode  - 渲染vnode
 * 
 * _render() => vm.$options.render  将render函数转换成vnode
 * _update() => vm.__patch__    将vnode转换成真实的dom元素
 * 
 */



var emptyObject = Object.freeze({});

// These helpers produce better VM code in JS engines due to their
// explicitness and function inlining.
function isUndef(v) {
  return v === undefined || v === null
}

function isDef(v) {
  return v !== undefined && v !== null
}

function isTrue(v) {
  return v === true
}

function isFalse(v) {
  return v === false
}

/**
 * Check if value is primitive.
 */
function isPrimitive(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value, e.g., [object Object].
 */
var _toString = Object.prototype.toString;

function toRawType(value) {
  return _toString.call(value).slice(8, -1) // Object.prototype.toString.call('sss').slice(8,-1) => String
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
function isPlainObject(obj) {
  return _toString.call(obj) === '[object Object]'
}

function isRegExp(v) {
  return _toString.call(v) === '[object RegExp]'
}

/**
 * Check if val is a valid array index.
 * 检查是不是可用的数组index 整数 大于0 
 */
function isValidArrayIndex(val) {
  var n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

function isPromise(val) {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}

/**
 * Convert a value to a string that is actually rendered.
 */
function toString(val) {
  return val == null ?
    '' :
    Array.isArray(val) || (isPlainObject(val) && val.toString === _toString) ?
    JSON.stringify(val, null, 2) :
    String(val)
}

/**
 * Convert an input value to a number for persistence.
 * If the conversion fails, return original string.
 */
function toNumber(val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

/**
 * // 通过传入的字串 ,返回一个函数,持有一个闭包,闭包中创建了一个map 
 * 包含若干个{key:Boolean}其中的key对应当前传入的字符串的每一项,用来检测用户传入的字串在不在map中  
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap(
  str,
  expectsLowerCase
) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ?
    function (val) {
      return map[val.toLowerCase()];
    } :
    function (val) {
      return map[val];
    }
}

/**
 * Check if a tag is a built-in tag.
 */
var isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if an attribute is a reserved attribute.
 */
var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array.
 */
function remove(arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether an object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;

function hasOwn(obj, key) {
  return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 */
function cached(fn) { // 维持一个闭包 闭包里面保存当前方法执行后的结果
  var cache = Object.create(null);
  return (function cachedFn(str) {
    var hit = cache[str];
    return hit || (cache[str] = fn(str))
  })
}

/**
 * a-b => aB
 * Camelize a hyphen-delimited string. 
 */
var camelizeRE = /-(\w)/g; // -加字母
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) {
    return c ? c.toUpperCase() : '';
  })
});

/**
 * aB => AB
 * Capitalize a string. 
 */
var capitalize = cached(function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
});

/**
 * zhangSan => zhang-san
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /\B([A-Z])/g; // 非单词边界加上A-Z的任意字母
var hyphenate = cached(function (str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
});

/**
 * Simple bind polyfill for environments that do not support it,
 * e.g., PhantomJS 1.x. Technically, we don't need this anymore
 * since native bind is now performant enough in most browsers.
 * But removing it would mean breaking code that was able to run in
 * PhantomJS 1.x, so this must be kept for backward compatibility.
 */

/* istanbul ignore next */
function polyfillBind(fn, ctx) { // polyfill for bind
  function boundFn(a) {
    var l = arguments.length;
    return l ?
      l > 1 ?
      fn.apply(ctx, arguments) :
      fn.call(ctx, a) :
      fn.call(ctx)
  }

  boundFn._length = fn.length;
  return boundFn
}

function nativeBind(fn, ctx) {
  return fn.bind(ctx)
}

var bind = Function.prototype.bind ?
  nativeBind :
  polyfillBind;

/**
 * 类数组转数组
 * Convert an Array-like object to a real Array.
 */
function toArray(list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret
}

/**
 * 第二个对象属性继承到第一个参数
 * Mix properties into target object.
 */
function extend(to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}

/**
 * 把多个对象合并成一个对象
 * Merge an Array of Objects into a single Object.
 */
function toObject(arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

/* eslint-disable no-unused-vars */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
 */
function noop(a, b, c) {}

/**
 * Always return false.
 */
var no = function (a, b, c) {
  return false;
};

/* eslint-enable no-unused-vars */

/**
 * Return the same value.
 */
var identity = function (_) {
  return _;
};

/**
 * [style klass model]
 * Generate a string containing static keys from compiler modules.
 */
function genStaticKeys(modules) {
  return modules.reduce(function (keys, m) {
    return keys.concat(m.staticKeys || []) // 获取各个模块的staticKeys 进行字符串拼接
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
function looseEqual(a, b) {
  if (a === b) {
    return true
  }
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      var isArrayA = Array.isArray(a);
      var isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every(function (e, i) {
          return looseEqual(e, b[i])
        })
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(function (key) {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

/**
 * Return the first index at which a loosely equal value can be
 * found in the array (if value is a plain object, the array must
 * contain an object of the same shape), or -1 if it is not present.
 */
function looseIndexOf(arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) {
      return i
    }
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
function once(fn) {
  var called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  }
}

var SSR_ATTR = 'data-server-rendered';

var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];

var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
];

/*  */



var config = ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  productionTip: process.env.NODE_ENV !== 'production',

  /**
   * Whether to enable devtools
   */
  devtools: process.env.NODE_ENV !== 'production',

  /**
   * Whether to record perf
   */
  performance: false,

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Perform updates asynchronously. Intended to be used by Vue Test Utils
   * This will significantly reduce performance if set to false.
   */
  async: true,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
});

/*  */

/**
 * unicode letters used for parsing html tags, component names and property paths.
 * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
 * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
 */
var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

/**
 * Check if a string starts with $ or _
 */
function isReserved(str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property. 可写可配置的
 */
function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Parse simple path.
 */
var bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));

/**
 * 根据调用路径解析成调用表达式并得到返回值
 */
function parsePath(path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.'); // a.b.c => [a,b,c]
  return function (obj) { // 返回一个方法
    for (var i = 0; i < segments.length; i++) {
      if (!obj) {
        return
      }
      // obj = obj[a] 也就是说 通过循环的过程去获取obj上的方法 在将来将从vm上边去拿属性  
      // 所以a.b.c 就相当于 vm[a][b][c] => vm.a.b.c 直到最终的循环完毕或者某各环节已经不是对象了
      // 在这个过程中会触发响应式的值的getter 在这之前呢 创建 new watcher的时候wathcer栈定已经是当前的user-wathcer了 
      // 在getter触发的过程中呢会将当前Dep.target 也就是栈顶元素也就是把当前user-wathcer push 到 当前 响应式属性的subs中去
      // 这样 在数据变化的过程中 不光可以通知render-wathcer去更新 也可以通知user-watcher去出发回调
      obj = obj[segments[i]];

    }
    return obj
  }
}

/*  */

// can we use __proto__? 判断浏览器环境
var hasProto = '__proto__' in {};

// Browser environment sniffing 判断当前运行环境
var inBrowser = typeof window !== 'undefined';
var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
var isPhantomJS = UA && /phantomjs/.test(UA);
var isFF = UA && UA.match(/firefox\/(\d+)/);

// Firefox has a "watch" function on Object.prototype...
var nativeWatch = ({}).watch; // 检测ff的原生watch方法

var supportsPassive = false; // 根据一个简单的事件去判断当前是否支持passive
if (inBrowser) {
  try {
    var opts = {};
    Object.defineProperty(opts, 'passive', ({
      get: function get() {
        /* istanbul ignore next */
        supportsPassive = true;
      }
    })); // https://github.com/facebook/flow/issues/285
    window.addEventListener('test-passive', null, opts); // 如果浏览器支持passive就会去调用opts.passive
  } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
var _isServer; // 判断是不是ssr
var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

// detect devtools
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

/* istanbul ignore next */
function isNative(Ctor) { // 检测native方法
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

var hasSymbol = // 检测symbol和reflect支持
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

// set polyfill
var _Set;
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = /*@__PURE__*/ (function () {
    function Set() {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has(key) {
      return this.set[key] === true
    };
    Set.prototype.add = function add(key) {
      this.set[key] = true;
    };
    Set.prototype.clear = function clear() {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

/*  */
 // 简单定义了几个报错工具方法  后面会根据具体环境进行二次赋值
var warn = noop;
var tip = noop;
var generateComponentTrace = (noop); // work around flow check
var formatComponentName = (noop);

if (process.env.NODE_ENV !== 'production') { // 添加部分工具方法
  var hasConsole = typeof console !== 'undefined';
  /**
   * 以单词开头
   * 以-开头加单词
   * 以_开头加单词
   */
  var classifyRE = /(?:^|[-_])(\w)/g;
  var classify = function (str) {
    return str
      .replace(classifyRE, function (c) {
        return c.toUpperCase();
      })
      .replace(/[-_]/g, '');
  };

  warn = function (msg, vm) {
    var trace = vm ? generateComponentTrace(vm) : '';

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace);
    } else if (hasConsole && (!config.silent)) {
      console.error(("[Vue warn]: " + msg + trace));
    }
  };

  tip = function (msg, vm) {
    if (hasConsole && (!config.silent)) {
      console.warn("[Vue tip]: " + msg + (
        vm ? generateComponentTrace(vm) : ''
      ));
    }
  };

  formatComponentName = function (vm, includeFile) {
    if (vm.$root === vm) {
      return '<Root>'
    }
    var options = typeof vm === 'function' && vm.cid != null ?
      vm.options :
      vm._isVue ?
      vm.$options || vm.constructor.options :
      vm;
    var name = options.name || options._componentTag;
    var file = options.__file;
    if (!name && file) {
      var match = file.match(/([^/\\]+)\.vue$/);
      name = match && match[1];
    }

    return (
      (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
      (file && includeFile !== false ? (" at " + file) : '')
    )
  };


  /**
   * String.prototype.repeat.call(str,n)
   */
  var repeat = function (str, n) {
    var res = '';
    while (n) {
      if (n % 2 === 1) {
        res += str;
      }
      if (n > 1) {
        str += str;
      }
      n >>= 1; // n = n >> 1
    }
    return res
  };

  /**
   * 组件堆栈信息
   */
  generateComponentTrace = function (vm) {
    if (vm._isVue && vm.$parent) {
      var tree = [];
      var currentRecursiveSequence = 0;
      while (vm) {
        if (tree.length > 0) {
          var last = tree[tree.length - 1];
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++;
            vm = vm.$parent;
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence];
            currentRecursiveSequence = 0;
          }
        }
        tree.push(vm);
        vm = vm.$parent;
      }
      return '\n\nfound in\n\n' + tree
        .map(function (vm, i) {
          return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm) ?
            ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)") :
            formatComponentName(vm)));
        })
        .join('\n')
    } else {
      return ("\n\n(found in " + (formatComponentName(vm)) + ")")
    }
  };
}

/*  */

var uid = 0; // 全局的uid 唯一标记当前依赖对象

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep() {
  this.id = uid++;
  this.subs = []; // 订阅的watcher
};

Dep.prototype.addSub = function addSub(sub) {
  this.subs.push(sub); // 添加订阅者
};

Dep.prototype.removeSub = function removeSub(sub) {
  remove(this.subs, sub); // 删除订阅者
};

Dep.prototype.depend = function depend() {
  // 在当前的render computed user-watcher添加当前dep对象 (渲染 计算属性watcher)
  if (Dep.target) {
    Dep.target.addDep(this); // 依赖收集  实际上就是Dep.target把自身添加到this.deps中去
  }
};

/**
 * 派发更新 依次触发每个watcher的run方法去更新视图或者数据
 */
Dep.prototype.notify = function notify() {
  // stabilize the subscriber list first
  // 浅拷贝一层订阅者 也就是watcher数组
  var subs = this.subs.slice();
  if (process.env.NODE_ENV !== 'production' && !config.async) {
    // subs aren't sorted in scheduler if not running async
    // we need to sort them now to make sure they fire in correct
    // order
    subs.sort(function (a, b) {
      return a.id - b.id;
    });
  }
  // 遍历当前dep所有相关watcher依次更新视图 或者某些计算属性或者用户传入的cb
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null; // 当前vm对应的render-watcher或者user-wathcher 始终指向targetstack的栈顶元素
var targetStack = []; // 维护一个watcher栈  在深度遍历组件渲染的过程中保存watcher

// 入栈
function pushTarget(target) { // target:Wathcer
  targetStack.push(target);
  Dep.target = target;
}

//出栈
function popTarget() {
  targetStack.pop();
  Dep.target = targetStack[targetStack.length - 1];
}

/* Vnode */
/**
 * 
 * @param {String} tag 元素的标签 可能是自定义标签也可能是内置标签  可能是组件的展位vnode 也可能是渲染vnode 还能是普通节点的vnode
 * @param {*} data vnodedata  一般是vue-loader或者vue-template-compiler解析出来的数据对象 当然vue内置的编译器也可以解析
 * @param {*} children 子节点vnode数组 
 * @param {*} text 文本内容
 * @param {*} elm dom节点
 * @param {*} context vm
 * @param {*} componentOptions 组件传入的数据 props attrs listeners（其实就是站位节点所在的父元素定一个emit需要出发的方法）
 * @param {*} asyncFactory 异步工厂函数 如果传入就带表当前是一个异步组件的站位节点
 */
var VNode = function VNode(
  tag, 
  data,
  children,
  text,
  elm,
  context,
  componentOptions,
  asyncFactory
) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
  this.elm = elm;
  this.ns = undefined;
  this.context = context;
  this.fnContext = undefined;
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
};

//为老版本vue做兼容性处理
var prototypeAccessors = {
  child: {
    configurable: true
  }
};

// DEPRECATED: alias for componentInstance for backwards compat.
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
  return this.componentInstance
};

Object.defineProperties(VNode.prototype, prototypeAccessors);

// 创建一个空的vnode 是个注释节点 可以有字体
var createEmptyVNode = function (text) {
  if (text === void 0) text = '';

  var node = new VNode();
  node.text = text;
  node.isComment = true;
  return node
};

// 创建文本vnode
function createTextVNode(val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone  克隆节点
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode(vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.asyncMeta = vnode.asyncMeta;
  cloned.isCloned = true;
  return cloned
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

// 为了数组的响应式操作添加中间层 通过原型链
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator() {
    var args = [],
      len = arguments.length;
    while (len--) args[len] = arguments[len]; // 类数组转数组

    var result = original.apply(this, args); // 执行数组原始的方法
    var ob = this.__ob__; // 获取当前数组对象的ob 以更新视图
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args; // 对于push unshift两个方法 入参全部是比需要注册响应式的内容
        break
      case 'splice':
        inserted = args.slice(2); // 取角标2到结尾的所有入参 实际上就是插入的新数据
        break
    }
    if (inserted) { // 为当前插入的数组注册观察者 防止新元素的响应式失败
      ob.observeArray(inserted);
    }
    // notify change
    ob.dep.notify(); // 更新视图或者用户watcher
    return result // 返回操作后的数据
  });
});

/*  */
// 数组原型属性 为polyfill作准备 不用关心
var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * In some cases we may want to disable observation inside a component's
 * update computation. 在一些情况不需要为对象类型的属性注册响应式
 */
var shouldObserve = true;

// 控制当前允不允许重新new observer
function toggleObserving(value) {
  shouldObserve = value;
}

/**
 * 其实只是通过new ob 的形式去深度遍历对象类型或者数组类型的值去注册响应式 
 * 附加到每个被观察对象的__ob__。
 * 附加后，观察者将目标对象的属性键转换为getter/setter，实现收集依赖项并分派更新
 * @param {*} value 需要被观察的对象
 * 
 * observer -- 每个observer本身（ 实例属性）拥有一个 dep
 * observer.value-- observer观察的对象的每个属性值都创建一个闭包保存的 dep
 */
var Observer = function Observer(value) {
  this.value = value; // 需要注册ob的值 ob.value => value
  this.dep = new Dep(); // 为当前ob添加依赖对象dep,dep中持有订阅当前观察者的watcher
  this.vmCount = 0; // 记录当前ob观察的vm数量
  def(value, '__ob__', this); // 为value对象添加ob value.__ob__ => ob
  if (Array.isArray(value)) { // 检查是不是Array类型
    if (hasProto) { // 检查当前浏览器是否支持__proto__ 
      protoAugment(value, arrayMethods); // 如果当前传入的对象是数组类型 就直接通过__proto__指向数组拦截层对象 (可以使操作数据对象时候可以达到响应式的效果)
    } else {
      copyAugment(value, arrayMethods, arrayKeys);
    }
    // 为数组元素注册观察者
    this.observeArray(value);
  } else {
    // 最终 每个value对象都将走到这里
    // 为当前observe(val)传入对象的每个属性创建响应式
    this.walk(value);
  }
};

/**
 * Walk through all properties and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 * 
 * 把对象的每一个属性都转化成getter setter存取的方式
 * 并在getter和setter中去进行依赖收集和dom更新
 * 把每一个属性都定义成响应式
 */
Observer.prototype.walk = function walk(obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive$$1(obj, keys[i]);
  }
};

/**
 * Observe a list of Array items. 为数组中的元素注册响应式 如果数组元素不是对象 就什么都不做 
 */
Observer.prototype.observeArray = function observeArray(items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment(target, src) { // 写死_proto_
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment(target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
/**
 * 尝试为一个值创建一个观察者实例，如果观察成功，返回新的观察者，如果值已经有一个观察者，则返回现有的观察者。
 * @param {Object} value 接受对象|primitive  虽然primitive会直接return 
 * @param {Boolean} asRootData 是不是作为vm._data传进来的 
 */
function observe(value, asRootData) {
  // 如果传入的需要观察的值不是一个对象或者是数组 或者是一个Vnode类型的对象 都会直接return
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  // 首先检查当前对象包不包含自己的__ob__ 如果有直接返回当前对象的__ob__
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve && // 当前状态是不是可观察的 （）
    !isServerRendering() && // 是不是服务器端渲染的
    (Array.isArray(value) || isPlainObject(value)) && // 检测当前value值必须是严格对象或者是数组才会为其注册外层ob，然后添加dep。
    Object.isExtensible(value) && // 查看当前对象是不是可扩展的
    !value._isVue // 最后检测当前值不是vue实例 避免去观察vm
  ) {
    // 直接new ob 最后返回ob
    ob = new Observer(value);
  }
  if (asRootData && ob) { // 如果当前是作为rootdata传进来 也就是说当前传入vm._data
    ob.vmCount++;
  }
  return ob
}

/**
 * 把obj[key]转化成响应式的属性
 * Define a reactive property on an Object.
 * 不断去循环为每个属性创建响应式 ，大致分为两种情况
 * 1.如果属性值是非primitive类型的 为当前属性值对应的对象注册一个observer并拿到它 在注册oberver的时候又会递归调用defineReactive去为对象创建响应式 实际上是个深度遍历的过程
 * 2.如果是一个primitive类型 就直接为该属性创建getter setter 准备进行依赖手机和dom更新
 * 在整个响应式定义过程中 
 * 1.经过defineReactive处理的属性值都将拥有一个闭包的dep
 * 2.对于非primitive会注册observer，在这个observer上边会持有一个实例属性dep
 * @param {*} obj 某个属性对象或者是 data props 等需要设置响应式的属性的对象
 * @param {*} key 属性对应的key
 * @param {*} val 属性值
 * @param {*} customSetter 
 * @param {*} shallow 浅层的响应式
 */
function defineReactive$$1(
  obj, // obj 本身有自己的__ob__ => __ob__.value 指向obj本身 __ob__.dep指向当前ob持有的dep
  key,
  val,
  customSetter,
  shallow
) {
  // 定义响应式添加依赖对象Dep，当前依赖对象供当前对象的值使用
  var dep = new Dep();

  // 首先获取到当前属性的descriptor 查看当前属性是不是可配置的 如果false 直接return
  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  var setter = property && property.set;
  // new Observer()=> this.walk(value) 执行会进入这里面
  // 其他场景val都是有值的
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key];
  }

  // 如果未传入shallow或者传入false就去拿到val对应的observer
  // 这里拿到的是val.__ob__ 如果是primitive值返回值为undefined
  // 如果当前不允许new Observer 返回值也是undefined
  var childOb = !shallow && observe(val);
  // 每一个getter setter 都会持有一个闭包变量dep
  // 对象的每一个属性都有自己的dep
  // 调用时机:在vue-loader或者用户传入的render函数中
  /**
   * 
   * _c(
   *    "div", // tag
   *    { attrs: { id: "app" } }, // vnodedata
   *    [ // children vnode
   *      // 注意 当页面上存在 {{isShow}} 会被渲染成_vm.isShow 传入进来 
   *      // 此时data props method computed已经初始化到了当前vm上去
   *      // 此时将会触发此处的getter 并传入页面中需要初始化的isShow值
   *      _vm._v(" " + _vm._s(_vm.isShow) + " "), 
   *      _c(
   *          "button", 
   *          { on: { click: _vm.show } }, 
   *          [_vm._v("click")]
   *        ),
   *      _c(
   *          "main-tab-bar",
   *          { attrs: { cool: "i" } }
   *        )
   *    ],
   *    1)
   */
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter() {
      var value = getter ? getter.call(obj) : val;
      // Dep.target一直指向targetStack的栈顶元素
      // 用到的所有属性 包括渲染时 初始化计算属性和watcher时
      // 都将添加到watcher.newDeps中去
      // 相应的,属性dep中也存储了用到的地方的wathcer
      // 依赖收集过程中是一个双向保存引用的过程
      if (Dep.target) {
        dep.depend(); // 核心:收集依赖 将当前属性对应的dep添加到Dep.target  这里的dep是为了响应当前val的变化 如果是对象 只有对象被删除 被替换的情况下才会出发watcher去更新视图
        if (childOb) { // 判断当前val本身是否为对象或数组类型 如果是的话就拥有自己的ob  就会拿到其__ob__ 完成深层的响应式
          // 拿到当前val对应的__ob__.dep传入到当前Dep.target的依赖数组中去 所有的dep 都将被添加到当前的渲染Watcher中去
          // 如此一来就完成了深层的依赖收集
          // 这里的dep会在 Vue.del Vue.set 和使用数据响应方法时使用
          childOb.dep.depend(); // 这里的dep是为了数组和对象准备的 为了在更新对象或者数组后update用的  主要针对为对象添加新的属性 通过数组原型方法操作数据
          if (Array.isArray(value)) { // 如果是数组 对数组元素进行依次依赖收集(如果数组元素仍是对象)
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter(newVal) {
      var value = getter ? getter.call(obj) : val; // 首先拿到旧值 为了判断到底需不需要更新
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter();
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) {
        return
      }
      if (setter) {
        setter.call(obj, newVal); // 设置
      } else {
        val = newVal;
      }
      // 以防传入对象之后无法响应式 直接为传入的newVal注册__ob__
      childOb = !shallow && observe(newVal);
      dep.notify(); // 视图更新
    }
  });
}

/**
 * Vue.set this.$set 的方法本体 设置一个可以响应式的属性 使得在data中未声明的属性可以有响应式
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist. 
 */
function set(target, key, val) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) { // 是数组就通过数组封装方法去响应式
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }
  if (key in target && !(key in Object.prototype)) { // 如果当前key已经在目标对象中了 直接修改就可以了 他本来就是响应式的了
    target[key] = val;
    return val
  }
  var ob = (target).__ob__; // 拿到对象的ob
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }
  if (!ob) { // 如果没有ob 也就是target就是非响应式的 也就无法为下一层注册响应式了 直接返回值
    target[key] = val;
    return val
  }
  defineReactive$$1(ob.value, key, val); // 为当前ob.value（也就是target）注册响应式
  ob.dep.notify(); // 设置完之后更新一次视图
  return val
}

/**
 * Delete a property and trigger change if necessary.
 * 删除一个属性
 */
function del(target, key) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) { // 数组方法
    target.splice(key, 1);
    return
  }
  var ob = (target).__ob__; // ob
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }
  if (!hasOwn(target, key)) { // 如果不是自身的属性 直接返回
    return
  }
  delete target[key]; // 删除属性
  if (!ob) { // 没有ob 无法更新
    return
  }
  ob.dep.notify();//  更新视图
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 * 收集数组每个对象元素的依赖 因为不能通过getter拦截访问去收集依赖 而primitive值不需要去添加依赖  因为每次操作完数组后都会进行一次视图更新
 * obeserveArray()的时候已经为每个数组元素(非primitive)添加了__ob__ 需要为__ob__depend递归进行依赖收集
 */
function dependArray(value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/*  */

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 * 
 * 从全局配置中获取options合并策略
 */
var strats = config.optionMergeStrategies;

/**
 * Options with restrictions
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        "option \"" + key + "\" can only be used during instance " +
        'creation with the `new` keyword.'
      );
    }
    return defaultStrat(parent, child)
  };
}

/**
 * Helper that recursively merges two data objects together.
 * 合并data
 */
function mergeData(to, from) {
  if (!from) {
    return to
  }
  var key, toVal, fromVal;

  var keys = hasSymbol ?
    Reflect.ownKeys(from) :
    Object.keys(from);

  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    // in case the object is already observed...
    if (key === '__ob__') { // 跳过注册响应式的对象
      continue
    }
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal); // 设置当前属性为响应式
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal) // 如果仍是严格对象 进行深层合并
    ) {
      mergeData(toVal, fromVal);
    }
  }
  return to
}

/**
 * Data 合并data对象或者data方法
 */
function mergeDataOrFn(
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn() {
      return mergeData( // 合并data 
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn() {
      // instance merge
      var instanceData = typeof childVal === 'function' ?
        childVal.call(vm, vm) :
        childVal;
      var defaultData = typeof parentVal === 'function' ?
        parentVal.call(vm, vm) :
        parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

strats.data = function ( // data合并策略
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      );

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
};

/**
 * Hooks and props are merged as arrays.
 */
function mergeHook( // 生命周期钩子函数最终会合并成数组 进行相同名字的合并
  parentVal, // [created(){}]
  childVal // created(){} | [created(){}]
) {
  var res = childVal ? // 判断当前子钩子有没有 如果没有直接返回父的对应钩子函数
    parentVal ? // 如果有判断父钩子有没有 如果父值也有对应的钩子 就通过concat进行合并 父在前 子在后
    parentVal.concat(childVal) :
    Array.isArray(childVal) ? // 如果父没有钩子在来判断当前子值是不是数组类型 （需要是数组类型） 如果不是就进行一次标准化
    childVal : [childVal] :
    parentVal;
  return res ?
    dedupeHooks(res) : // 如果当前res存在 就进行一次去重
    res
}

function dedupeHooks(hooks) { // 消除重复钩子方法
  var res = [];
  for (var i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i]);
    }
  }
  return res
}

LIFECYCLE_HOOKS.forEach(function (hook) { // 每个生命周期钩子的合并策略都一样
  strats[hook] = mergeHook;
});

/**
 * 合并资源
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets(
  parentVal,
  childVal,
  vm,
  key
) {
  var res = Object.create(parentVal || null);
  if (childVal) { // 如果有子资源 简单复制过来
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm);
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});

/**
 * user-watcher的合并
 * 
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (
  parentVal,
  childVal,
  vm,
  key
) {
  // work around Firefox's Object.prototype.watch...
  // 消除FF的wacher
  if (parentVal === nativeWatch) {
    parentVal = undefined;
  }
  if (childVal === nativeWatch) {
    childVal = undefined;
  }
  /* istanbul ignore if */
  if (!childVal) { // 如果不存在 就直接返回一个原型连对象回去
    return Object.create(parentVal || null)
  }

  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm);
  }

  if (!parentVal) { // 如果不存在 直接返回子
    return childVal
  }
  var ret = {};
  extend(ret, parentVal); // 简单复制
  for (var key$1 in childVal) {//遍历子的属性
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) { // 如果父子都在切父不是数组 就把父的封装到一个数组中去
      parent = [parent];
    }
    ret[key$1] = parent ? // 如果父存在就父在前子在后链接数组
      parent.concat(child) : // 返回一个新的数组
      Array.isArray(child) ? child : [child]; // 如果父不存在就把子封装到一个数组中去
  }
  return ret // 返回值中的每一个watch都是一个数组类型的
};

/**
 * 其他对象类型的哈希map合并策略
 * Other object hashes.
 */
strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    if (childVal && process.env.NODE_ENV !== 'production') {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) {
      return childVal
    }
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) {
      extend(ret, childVal); // 以子为主
    }
    return ret
  };
strats.provide = mergeDataOrFn; // 等同于data

/**
 * Default strategy.
 */
var defaultStrat = function (parentVal, childVal) { // 默认策略是子有取子 子没有取父
  return childVal === undefined ?
    parentVal :
    childVal
};

/**
 * 验证组件名的合法性
 * Validate component names
 */
function checkComponents(options) {
  for (var key in options.components) {
    validateComponentName(key);
  }
}

function validateComponentName(name) {
  if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    );
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    );
  }
}

/**
 * 确认所有的props都转化成对象类型的语法  在用户输入之后进行标准化 方便render时候调用
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps(options, vm) {
  var props = options.props;
  if (!props) {
    return
  }
  var res = {};
  var i, val, name;
  if (Array.isArray(props)) { // 允许用户传入数组 遍历进行标准化
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') { // props属性必须用字符串来描述
        name = camelize(val);
        res[name] = {
          type: null // 类型默认null
        };
      } else if (process.env.NODE_ENV !== 'production') {
        warn('props must be strings when using array syntax.');
      }
    }
  } else if (isPlainObject(props)) { // 如果已经传入了严格对象
    for (var key in props) {
      val = props[key];
      name = camelize(key);
      res[name] = isPlainObject(val) ? // 如果是严格对象 取val 如果不是就把val作为类型传入
        val : {
          type: val
        };
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      "Invalid value for option \"props\": expected an Array or an Object, " +
      "but got " + (toRawType(props)) + ".",
      vm
    );
  }
  options.props = res;
}

/**
 * 标准化injection
 * Normalize all injections into Object-based format
 */
function normalizeInject(options, vm) {
  var inject = options.inject;
  if (!inject) {
    return
  }
  var normalized = options.inject = {};
  if (Array.isArray(inject)) {
    for (var i = 0; i < inject.length; i++) {
      normalized[inject[i]] = {
        from: inject[i]
      };
    }
  } else if (isPlainObject(inject)) {
    for (var key in inject) {
      var val = inject[key];
      normalized[key] = isPlainObject(val) ?
        extend({
          from: key
        }, val) : {
          from: val
        };
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      "Invalid value for option \"inject\": expected an Array or an Object, " +
      "but got " + (toRawType(inject)) + ".",
      vm
    );
  }
}

/**
 * 标准化指令
 * Normalize raw function directives into object format.
 */
function normalizeDirectives(options) {
  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def$$1 = dirs[key];
      if (typeof def$$1 === 'function') {
        dirs[key] = {
          bind: def$$1,
          update: def$$1
        };
      }
    }
  }
}

/**
 * 检测静态资源必须均为对象类型 否则报错
 * @param {*} name 
 * @param {*} value 
 * @param {*} vm 
 */
function assertObjectType(name, value, vm) {
  if (!isPlainObject(value)) {
    warn(
      "Invalid value for option \"" + name + "\": expected an Object, " +
      "but got " + (toRawType(value)) + ".",
      vm
    );
  }
}

/**
 * 核心方法 合并opts
 * 以用来创建vm实例
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions( // 对于不同的属性合并策略不同
  parent, // 基础opts
  child, // 用户传入的opts
  vm
) {
  if (process.env.NODE_ENV !== 'production') {
    checkComponents(child);
  }

  if (typeof child === 'function') {
    child = child.options;
  }
  // 进行属性的normalize操作
  normalizeProps(child, vm);
  normalizeInject(child, vm);
  normalizeDirectives(child);

  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property. 
  // 在子选项上应用extends和mixin，但前提是它是一个原始选项对象，而不是另一个mergeOptions调用的结果。
  // 只有合并过的选项具有_base属性。在mergeOpts之后会从父级opts将_base继承过来
  if (!child._base) { // 先递归把 extends 和 mixins 合并到 parent 上
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm);
    }
    if (child.mixins) { // 如果子opts还有mixins 递归进行合并 合并后的opts作为opts
      for (var i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm);
      }
    }
  }

  var options = {};
  var key;
  // 然后遍历 parent，调用 mergeField，
  for (key in parent) { // 对于Vue（或者其他构造器，或者合并过mixin、extends的opts）的key 全部都继承到新的opts中去
    mergeField(key);
  }
  for (key in child) { //然后再遍历 child，如果 key 不在 parent 的自身属性上，则调用 mergeField。
    if (!hasOwn(parent, key)) { // 对于用户传入的opts，检查Vue.options是否具有该属性，如果没有该属性，进行合并。 为了避免用户传入components、directives等属性发生覆盖
      mergeField(key);
    }
  }

  function mergeField(key) { // 合并字段 合并的字段如下（不全 子opts还有很多可扩展）
    //components directives filters _base beforeCreate destroyed data methods name props render staticRenderFns _compiled _scopeId beforeDestroy __file _Ctor
    var strat = strats[key] || defaultStrat; // 首先读取全局配置 可以根据不同的key 采取不同的合并策略 
    options[key] = strat(parent[key], child[key], vm, key); // _base就是从这里继承而来的
  }
  return options
}

/**
 * Resolve an asset. 获取一个资源
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
function resolveAsset(
  options,
  type,
  id,
  warnMissing
) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  var assets = options[type];
  // check local registration variations first
  if (hasOwn(assets, id)) { // 现在本地环境下寻找当前的资源
    return assets[id]
  }
  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { // 尝试寻找camel格式的id对对应的资源
    return assets[camelizedId]
  }
  var PascalCaseId = capitalize(camelizedId); // 常使寻找pascal格式的id对应的资源
  if (hasOwn(assets, PascalCaseId)) {
    return assets[PascalCaseId]
  }
  // fallback to prototype chain
  // 总体的思路就是先查局部在查全局
  // 实际上获取的全局资源 
  // 那么全局的资源是如何挂到原型链上呢 ? 在使用Vue.component的时候通过 this.options._base.extend() 去链接
  // 如果在当前option找不到当前对应的资源 就去原型链中查找 按照 id > camel > pascal格式的优先级去寻找当前资源
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}

/*  */


/**
 *  进行初始化 对每一个定义在组件中的props进行初始化
 * 策略：
 * 1. 判断当前key在不在props中如果不在，就看hyp化的key在不在props中
 * 2. 如果在props中找不到当前key 就对当前attrs进行相同操作，查找props的值
 * 
 * @param {*} key 
 * @param {*} propOptions 
 * @param {*} propsData 
 * @param {*} vm 
 */
function validateProp(
  key,
  propOptions,
  propsData,
  vm
) {
  var prop = propOptions[key];
  // 判断当前key值是不是在propsData本身的属性 首先判断占位节点的绑定进来的对象中包不包含当前key
  var absent = !hasOwn(propsData, key);
  // 拿到value值 有可能是原型链上的属性 setter
  var value = propsData[key];
  // boolean casting
  // 首先判断当前传入的prop是不是布尔类型的 
  var booleanIndex = getTypeIndex(Boolean, prop.type);
  if (booleanIndex > -1) { // 如过当前prop.type是布尔类型或者传入了个数组中包含prop.type props = { name:{type:[Boolean,String]} }
    if (absent && !hasOwn(prop, 'default')) { // 如果传入的props 每个default 就直接赋值为false
      value = false;
    } else if (value === '' || value === hyphenate(key)) { 
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      // 如果设置了当前prop的类型数组中包含String 就进行优先级判别  Boolean的优先级是高于String的
      // 如果类型数组中没有找到String 就直接返回true
      // 如果找到了String 就比较String 和Boolean 的index 如果Boolean的index小于String 直接返回true 否则字符串传了啥就返回啥
      var stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    // skip validation for weex recycle-list child component props
    !(false)
  ) {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}

/**
 * 获取用户传入的props默认值
 * Get the default value of a prop.
 */
function getPropDefaultValue(vm, prop, key) {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  // warn against non-factory defaults for Object & Array
  if (process.env.NODE_ENV !== 'production' && isObject(def)) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function' ?
    def.call(vm) :
    def
}

/**
 * prop.validator
 * Assert whether a prop is valid.
 */
function assertProp(
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }

  if (!valid) {
    warn(
      getInvalidTypeMessage(name, value, expectedTypes),
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

/**
 * 独立的单词 ： String|Number|Boolean|Function|Symbol 五个之一 前后不能有任何东西
 */
var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

function assertType(value, type) {
  var valid;
  var expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    var t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}

/**
 * 构造器类型检查
 * for ex :
 *    getType(function Some(){}) => "Some"
 */
function getType(fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ''
}


function isSameType(a, b) {
  return getType(a) === getType(b)
}

/**
 * @param type {Function} 一个强制类型
 * @param expectedTypes {Function | Array} 在使用props时传入的类型
 * @returns i {number}  得到首个对应类型的index 没有找到 返回-1
 */
function getTypeIndex(type, expectedTypes) {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (var i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

// 基于validator的验证信息
function getInvalidTypeMessage(name, value, expectedTypes) {
  var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
    " Expected " + (expectedTypes.map(capitalize).join(', '));
  var expectedType = expectedTypes[0];
  var receivedType = toRawType(value);
  var expectedValue = styleValue(value, expectedType);
  var receivedValue = styleValue(value, receivedType);
  // check if we need to specify expected value
  if (expectedTypes.length === 1 &&
    isExplicable(expectedType) &&
    !isBoolean(expectedType, receivedType)) {
    message += " with value " + expectedValue;
  }
  message += ", got " + receivedType + " ";
  // check if we need to specify received value
  if (isExplicable(receivedType)) {
    message += "with value " + receivedValue + ".";
  }
  return message
}

// 返回类型转换后的value
function styleValue(value, type) {
  if (type === 'String') {
    return ("\"" + value + "\"")
  } else if (type === 'Number') {
    return ("" + (Number(value)))
  } else {
    return ("" + value)
  }
}

function isExplicable(value) {
  var explicitTypes = ['string', 'number', 'boolean'];
  return explicitTypes.some(function (elem) {
    return value.toLowerCase() === elem;
  })
}

function isBoolean() {
  var args = [],
    len = arguments.length;
  while (len--) args[len] = arguments[len];

  return args.some(function (elem) {
    return elem.toLowerCase() === 'boolean';
  })
}

/*  */

// 错误处理
function handleError(err, vm, info) {
  // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
  // See: https://github.com/vuejs/vuex/issues/1505
  pushTarget();
  try {
    if (vm) {
      var cur = vm;
      while ((cur = cur.$parent)) {
        var hooks = cur.$options.errorCaptured;
        if (hooks) {
          for (var i = 0; i < hooks.length; i++) {
            try {
              var capture = hooks[i].call(cur, err, vm, info) === false;
              if (capture) {
                return
              }
            } catch (e) {
              globalHandleError(e, cur, 'errorCaptured hook');
            }
          }
        }
      }
    }
    globalHandleError(err, vm, info);
  } finally {
    popTarget();
  }
}

// 拥有错误处理机制的函数执行器
function invokeWithErrorHandling(
  handler,
  context,
  args,
  vm,
  info
) {
  var res;
  try {
    res = args ? handler.apply(context, args) : handler.call(context);
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch(function (e) {
        return handleError(e, vm, info + " (Promise/async)");
      });
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      res._handled = true;
    }
  } catch (e) {
    handleError(e, vm, info);
  }
  return res
}

function globalHandleError(err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      // if the user intentionally throws the original error in the handler,
      // do not log it twice
      if (e !== err) {
        logError(e, null, 'config.errorHandler');
      }
    }
  }
  logError(err, vm, info);
}

function logError(err, vm, info) {
  if (process.env.NODE_ENV !== 'production') {
    warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err);
  } else {
    throw err
  }
}

/*  */

var isUsingMicroTask = false;

var callbacks = [];
var pending = false;

// 依次执行callbacks中的方法
function flushCallbacks() {
  pending = false; // 此时要执行所有回调 后续入栈的方法不必在等待了
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).
var timerFunc;

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) { // 有promise用promise 
  var p = Promise.resolve();
  timerFunc = function () {
    p.then(flushCallbacks);
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) {
      setTimeout(noop);
    }
  };
  isUsingMicroTask = true;
} else if (!isIE && typeof MutationObserver !== 'undefined' && ( // 没有promise 用mutationobserver
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  // 设置一段看似无聊的代码 其实意在直接触发mutationObserver的异步机制
  var counter = 1;
  var observer = new MutationObserver(flushCallbacks);
  var textNode = document.createTextNode(String(counter));
  observer.observe(textNode, {
    characterData: true
  });
  timerFunc = function () { // 直接改变text.data就会触发flushCallbacks
    counter = (counter + 1) % 2;
    textNode.data = String(counter);
  };
  isUsingMicroTask = true;
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) { // 一下两种都是宏任务
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = function () {
    setImmediate(flushCallbacks);
  };
} else {
  // Fallback to setTimeout.
  timerFunc = function () {
    setTimeout(flushCallbacks, 0);
  };
}

/**
 * 将传入的方法放到下一个时间循环去执行
 * 因为watcher.run都放到了queuewatcher中去执行了
 * 需要获取dom后的操作就需要写进nextclick中去
 * @param {*} cb 
 * @param {*} ctx 
 */
function nextTick(cb, ctx) {
  var _resolve;
  callbacks.push(function () { // 添加到全局cb数组中去 等待执行
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) { // 如果不是在等待过程中就执行方法
    pending = true;
    timerFunc();
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') { // 如果没传cb 直接返回一个promise 可以在then中传入下一个循环要做的事情 
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}

/*  */

var mark;
var measure;

// performace 
if (process.env.NODE_ENV !== 'production') {
  var perf = inBrowser && window.performance;
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    mark = function (tag) {
      return perf.mark(tag);
    };
    measure = function (name, startTag, endTag) {
      perf.measure(name, startTag, endTag);
      perf.clearMarks(startTag);
      perf.clearMarks(endTag);
      // perf.clearMeasures(name)
    };
  }
}

/* not type checking this file because flow doesn't play well with Proxy */

var initProxy; // 初始化代理  在开发环境下 在生产环境下不实用代理

if (process.env.NODE_ENV !== 'production') {
  var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  );

  var warnNonPresent = function (target, key) {
    warn(
      "Property or method \"" + key + "\" is not defined on the instance but " +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    );
  };

  var warnReservedPrefix = function (target, key) {
    warn(
      "Property \"" + key + "\" must be accessed with \"$data." + key + "\" because " +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals. ' +
      'See: https://vuejs.org/v2/api/#data',
      target
    );
  };

  var hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy);

  if (hasProxy) {
    var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
    config.keyCodes = new Proxy(config.keyCodes, {
      set: function set(target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
          return false
        } else {
          target[key] = value;
          return true
        }
      }
    });
  }

  var hasHandler = {
    // has陷阱在检测属性在不在当前target时候触发
    has: function has(target, key) {
      var has = key in target;
      var isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data));
      if (!has && !isAllowed) {
        if (key in target.$data) {
          warnReservedPrefix(target, key);
        } else {
          warnNonPresent(target, key);
        }
      }
      return has || !isAllowed
    }
  };

  var getHandler = {
    get: function get(target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) {
          warnReservedPrefix(target, key);
        } else {
          warnNonPresent(target, key);
        }
      }
      return target[key]
    }
  };

  initProxy = function initProxy(vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      var options = vm.$options;
      var handlers = options.render && options.render._withStripped ?
        getHandler :
        hasHandler;
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
}

/*  */

var seenObjects = new _Set();

/**
 * 深层的依赖收集
 * 递归地遍历一个对象以唤起所有 getter，以便对象内的每个嵌套属性 作为“深层”依赖关系收集。
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
function traverse(val) {
  _traverse(val, seenObjects); // seenobjects 就是一个set集合
  seenObjects.clear();
}

function _traverse(val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return // 排除特殊情况 
  }
  if (val.__ob__) { 
    // 往set集合中添加没有添加过的depid 
    // 前提是当前属性是对于那个类型且注册了响应式 
    // 对于为注册响应式的对象是忽略记录的
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) { // 是数组就递归调用去添加depid
    i = val.length;
    while (i--) {
      _traverse(val[i], seen); // 通过val[i]去出发val属性中的getter去进行深层的依赖收集
    }
  } else { // 递归尚未添加depid的对象中的属性
    keys = Object.keys(val);
    i = keys.length;
    while (i--) {
      _traverse(val[keys[i]], seen); // 触发getter去收集依赖
    }
  }
}

/*  */

/**
 * 把编译阶段添加的解释符解析出来
 * 最后返回一个对象 标记当前方法的特性
 */
var normalizeEvent = cached(function (name) {
  var passive = name.charAt(0) === '&';
  name = passive ? name.slice(1) : name;
  var once$$1 = name.charAt(0) === '~'; // Prefixed last, checked first
  name = once$$1 ? name.slice(1) : name;
  var capture = name.charAt(0) === '!';
  name = capture ? name.slice(1) : name;
  return {
    name: name,
    once: once$$1,
    capture: capture,
    passive: passive
  }
});

/** 
 * 封装一层新的函数去一次调用数组中的每个函数
 * 返回一个invoker 是一个封装层的函数
 * 真正执行的函数在involer.fns的函数数组内 
 * 在调用前不断操作这个数组 方便快捷
 */
function createFnInvoker(fns, vm) {
  function invoker() {
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
    }
  }
  invoker.fns = fns;
  return invoker
}

/**
 * 供原生dom事件使用 也供用户事件调用
 * @param {*} on 
 * @param {*} oldOn 
 * @param {*} add 
 * @param {*} remove$$1 
 * @param {*} createOnceHandler 
 * @param {*} vm 
 */
function updateListeners(
  on, 
  oldOn,
  add,
  remove$$1,
  createOnceHandler,
  vm
) {
  var name, def$$1, cur, old, event;
  for (name in on) {
    def$$1 = cur = on[name];
    old = oldOn[name];
    // event = > {
    //   name: name,
    //   once: once$$1,
    //   capture: capture,
    //   passive: passive
    // }
    event = normalizeEvent(name); // 将会返回一个对象 包裹当前对象触发的方式 
    if (isUndef(cur)) { // 在没有当前事件定义的情况下
      process.env.NODE_ENV !== 'production' && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) { // 如果当前遍历事件对象还没有添加封装好的事件执行器
        // 创建事件回调函数
        cur = on[name] = createFnInvoker(cur, vm);
      }
      if (isTrue(event.once)) { // 如果是只调用一次 就创建执行一次的函数
        cur = on[name] = createOnceHandler(event.name, cur, event.capture);
      }
      add(event.name, cur, event.capture, event.passive, event.params);
    } else if (cur !== old) { // 当老的方法存在的时候 就直接用新的方法数组替代旧的就可以了
      old.fns = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) { // 最后遍历老事件去移除这个事件
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}

/*  */

/**
 * 合并vnode生命钩子函数 
 * 将hook合并到vnode的当前生命周期去执行
 * @param {*} def 
 * @param {*} hookKey 
 * @param {*} hook 
 */
function mergeVNodeHook(def, hookKey, hook) {
  if (def instanceof VNode) { // 如果传入了一个vnode 就拿出data.hook
    def = def.data.hook || (def.data.hook = {});
  }
  var invoker;
  var oldHook = def[hookKey];

  function wrappedHook() {
    // 执行一次钩子函数 然后从数组中移除 避免反复执行和内存泄漏
    hook.apply(this, arguments);
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    remove(invoker.fns, wrappedHook);
  }

  if (isUndef(oldHook)) {// 没有旧钩子 就直接添加一个新的进去
    // no existing hook
    invoker = createFnInvoker([wrappedHook]);
  } else {
    /* istanbul ignore if */
    if (isDef(oldHook.fns) && isTrue(oldHook.merged)) { //合并过后就肯定是个数组 直接添加进去
      // already a merged invoker
      invoker = oldHook;
      invoker.fns.push(wrappedHook);
    } else {
      // existing plain hook 第一次就创建一个数组搁进去
      invoker = createFnInvoker([oldHook, wrappedHook]);
    }
  }

  invoker.merged = true;
  def[hookKey] = invoker;
}


/**
 * 
 * @param {VnodeData} data vnode数据对象 vue-loader编译之后的结果
 * @param {ComponentnsConstructor} Ctor 组件构造器 
 * @param {String} tag 组件name或者使用组建的名称
 * @returns {Object} 返回props结果 优先获取props的内容 如果未找到 会在attrs中进行查找
 */
function extractPropsFromVNodeData(
  data,
  Ctor,
  tag
) {
  // we are only extracting raw values here. 提取
  // validation and default values are handled in the child
  // component itself. 验证和默认值是在自组件中完成的
  var propOptions = Ctor.options.props;
  if (isUndef(propOptions)) {
    return
  }
  var res = {};
  var attrs = data.attrs;
  var props = data.props;
  if (isDef(attrs) || isDef(props)) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      if (process.env.NODE_ENV !== 'production') {
        var keyInLowerCase = key.toLowerCase();
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            "Prop \"" + keyInLowerCase + "\" is passed to component " +
            (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
            " \"" + key + "\". " +
            "Note that HTML attributes are case-insensitive and camelCased " +
            "props need to use their kebab-case equivalents when using in-DOM " +
            "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
          );
        }
      }
      // 首先在props查找 如果没有就会在attrs进行查找 
      // v-bind或者：或者不带：都会编译到attrs
      // 只要是定义在组件的props属性中的,会在占位节点attr和props进行查找,合并到props中去
      // props优先级更高 就算是没有带：的attrs也可能会添加到res.props中去
      checkProp(res, props, key, altKey, true) ||
        checkProp(res, attrs, key, altKey, false);
    }
  }
  return res
}
/**
 * 
 * @param {*} res propsData
 * @param {*} hash attr 或者 props
 * @param {*} key key
 * @param {*} altKey 短横连接的key
 * @param {*} preserve props-true attr-false
 */
function checkProp(
  res,
  hash,
  key,
  altKey,
  preserve
) {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) { // 首先获取key 
      res[key] = hash[key];
      if (!preserve) { // vnodedata.attrs上的当前属性
        delete hash[key];
      }
      return true
    } else if (hasOwn(hash, altKey)) { // 第二优先级获取 hyphenated key 
      // 这里也就表明在组件内部定义props可以定义为camel 在组占位处可以用使用hyphenated 的形式去绑定值也同样可以取到 但是如果绑定俩 就被高优先级的覆盖
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true // 取到了就返回true
    }
  }
  return false
}

/*  */

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time. 模板编译器试图通过在编译时静态分析模板来尽量减少规范化的需要。
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed: 对于纯HTML标记，可以完全跳过规范化，因为生成的render函数保证返回Array<VNode>。有两种情况需要额外规范化：

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.  
// 当children包含组件的vnode时-因为函数式组件可能返回数组而不是单个根。在这种情况下，只需要一个简单的规范化-如果任何子元素是数组，
// 我们就用Array.prototype.concat去进行一层的扁平化, 它保证只有1级深，因为函数式组件已经对自己的children 进行标准化。
// simpleNormalizeChildren 方法调用场景是 render 函数是编译生成的。
// 理论上编译生成的 children 都已经是 VNode 类型的，但这里有一个例外，就是 functional component 函数式组件返回的是一个数组而不是一个根节点，
// 所以会通过 Array.prototype.concat 方法把整个 children 数组打平，让它的深度只有一层。
function simpleNormalizeChildren(children) {
  for (var i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children) // apply 第二个参数接受一个数组,将作为方法的参数一次传入, 
      // 相当于 [].concat(children[0],children[1],children[2])
    }
  }
  return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
// 调用场景有 2 种，一个场景是 render 函数是用户手写的，当 children 只有一个节点的时候，
// Vue.js 从接口层面允许用户把 children 写成基础类型用来创建单个简单的文本节点，这种情况会调用 createTextVNode 创建一个文本节点的 VNode；
// 另一个场景是当编译 slot、v-for 的时候会产生嵌套数组的情况，会调用 normalizeArrayChildren 方法
function normalizeChildren(children) {
  return isPrimitive(children) ? [createTextVNode(children)] : // 对于primitive值  直接创建文本vnode
    Array.isArray(children) ?
    normalizeArrayChildren(children) :
    undefined
}

/**
 * 是不是文本节点
 * @param {*} node 
 */
function isTextNode(node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

// normalizeArrayChildren 接收 2 个参数，children 表示要规范的子节点，nestedIndex 表示嵌套的索引，因为单个 child 可能是一个数组类型。 
// normalizeArrayChildren 主要的逻辑就是遍历 children，获得单个节点 c，然后对 c 的类型判断，如果是一个数组类型，则递归调用 normalizeArrayChildren;
// 如果是基础类型，则通过 createTextVNode 方法转换成 VNode 类型；否则就已经是 VNode 类型了，如果 children 是一个列表并且列表还存在嵌套的情况，
// 则根据 nestedIndex 去更新它的 key。这里需要注意一点，在遍历的过程中，对这 3 种情况都做了如下处理：如果存在两个连续的 text 节点，会把它们合并成一个 text 节点。
// 经过对 children 的规范化，children 变成了一个类型为 VNode 的 Array。
function normalizeArrayChildren(children, nestedIndex) {
  var res = [];
  var i, c, lastIndex, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (isUndef(c) || typeof c === 'boolean') {
      continue
    }
    lastIndex = res.length - 1;
    last = res[lastIndex];
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]).text);
          c.shift();
        }
        res.push.apply(res, c);
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) && // 对于v-for的节点没有绑定key  就默认赋于一个key __vlist
          isDef(nestedIndex)) {
          c.key = "__vlist" + nestedIndex + "_" + i + "__";
        }
        res.push(c);
      }
    }
  }
  return res
}

/*  */

/**
 * 初始化provide属性
 * @param {*} vm 
 */
function initProvide(vm) {
  var provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === 'function' ?
      provide.call(vm) :
      provide;
  }
}

/**
 * 初始化inject
 */
function initInjections(vm) {
  var result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false); // 在注册响应式的时候不需要为对象类型注册深层的响应式
    Object.keys(result).forEach(function (key) { // inject也是不推荐用户去修改的 也是会被上层组件重新渲染时候覆盖
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        defineReactive$$1(vm, key, result[key], function () {
          warn(
            "Avoid mutating an injected value directly since the changes will be " +
            "overwritten whenever the provided component re-renders. " +
            "injection being mutated: \"" + key + "\"",
            vm
          );
        });
      } else {
        defineReactive$$1(vm, key, result[key]); // 定义响应式
      }
    });
    toggleObserving(true);
  }
}

/**
 * 获得注入值
 * @param {*} inject  opts.injection
 * @param {*} vm 
 */
function resolveInject(inject, vm) {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    var result = Object.create(null);
    var keys = hasSymbol ?
      Reflect.ownKeys(inject) :
      Object.keys(inject);

    for (var i = 0; i < keys.length; i++) { // 遍历inject中的keys
      var key = keys[i];
      // #6574 in case the inject object is observed...
      if (key === '__ob__') { // 跳过该属性
        continue
      }
      var provideKey = inject[key].from; // 拿到提供的组件中的当前需要属性的名字
      var source = vm;
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) { // 获取值
          result[key] = source._provided[provideKey];
          break
        }
        source = source.$parent; // 不断遍历父组件树 去拿值
      }
      if (!source) {
        if ('default' in inject[key]) { // 如果没有获取到值就去拿当前组件设置的默认值
          var provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function' ?
            provideDefault.call(vm) : // 支持一个方法
            provideDefault;
        } else if (process.env.NODE_ENV !== 'production') { // 找也没找到 也没有设置默认值 报错
          warn(("Injection \"" + key + "\" not found"), vm);
        }
      }
    }
    return result
  }
}

/*  */



/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 * 遍历父组件中编译来的所有孩子vnode数组 不只是slot内的元素
 * 提取插槽资源
 */
function resolveSlots(
  children,
  context
) {
  if (!children || !children.length) {
    return {}
  }
  var slots = {};
  for (var i = 0, l = children.length; i < l; i++) { // 遍历孩子vnode
    var child = children[i];
    var data = child.data; // vnodedata
    // remove slot attribute if the node is resolved as a Vue slot node ？？why
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot;
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    // 判断当前vnode的上下文是不是父组件的上下文  或者是函数组件上下文是不是父组件上下文
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null // 并且vnodedata不为空
    ) {
      var name = data.slot; // 当前vnode的child 如果是具名插槽的话就会有name
      var slot = (slots[name] || (slots[name] = [])); // 为当前插槽定义一个数组 根据vnodedata.slot
      if (child.tag === 'template') {
        // 如果当前标签是一个template 就把其children-vnode 
        // 通过apply添加到当前数组中去 利用了apply的技巧 因为apply会将数组拆成单个参数传入到目标数组中去 
        // 因为push方法支持任意多个参数的添加
        slot.push.apply(slot, child.children || []); 
      } else {
        slot.push(child); // 如果不是template 就直接把当前vnode添加到数组中去
      }
    } else { // 除了具名插槽  所有其他内容都将被放到默认插槽数组中去
      (slots.default || (slots.default = [])).push(child);
    }
  }
  // ignore slots that contains only whitespace 忽略空插槽节点
  for (var name$1 in slots) {
    if (slots[name$1].every(isWhitespace)) {
      delete slots[name$1];
    }
  }
  return slots
}

// 判断无意义的vnode
function isWhitespace(node) {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

/*  */
// 标准化作用域插槽 
/**
 * 
 * @param {*} slots vnodedata.slotScope
 * @param {*} normalSlots 普通slots
 * @param {*} prevSlots 上次resolve到的作用域插槽
 */
function normalizeScopedSlots(
  slots, 
  normalSlots,
  prevSlots
) {
  var res;
  var hasNormalSlots = Object.keys(normalSlots).length > 0;
  var isStable = slots ? !!slots.$stable : !hasNormalSlots;
  var key = slots && slots.$key;
  if (!slots) {
    res = {};
  } else if (slots._normalized) {
    // fast path 1: child component re-render only, parent did not change
    return slots._normalized
  } else if (
    isStable &&
    prevSlots &&
    prevSlots !== emptyObject &&
    key === prevSlots.$key &&
    !hasNormalSlots &&
    !prevSlots.$hasNormal
  ) {
    // fast path 2: stable scoped slots w/ no normal slots to proxy,
    // only need to normalize once
    return prevSlots
  } else {
    res = {};
    for (var key$1 in slots) {// 遍历scopedslot
      if (slots[key$1] && key$1[0] !== '$') {
        // 获取作用域插槽的时候使用getter去获取
        res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
      }
    }
  }
  // expose normal slots on scopedSlots 把作用插槽上的正常插槽也以方法的方式暴露出去
  for (var key$2 in normalSlots) {
    if (!(key$2 in res)) {
      res[key$2] = proxyNormalSlot(normalSlots, key$2);
    }
  }
  // avoriaz seems to mock a non-extensible $scopedSlots object
  // and when that is passed down this would cause an error
  if (slots && Object.isExtensible(slots)) { // 为 avoriaz 做处理
    (slots)._normalized = res; // 保存一份标准化后的作用域插槽
  }
  def(res, '$stable', isStable);
  def(res, '$key', key);
  def(res, '$hasNormal', hasNormalSlots);
  return res
}

// 封装一个getter 用于获取作用域插槽返回的vnode
function normalizeScopedSlot(normalSlots, key, fn) {
  var normalized = function () {
    var res = arguments.length ? fn.apply(null, arguments) : fn({});
    res = res && typeof res === 'object' && !Array.isArray(res) ? [res] // single vnode
      :
      normalizeChildren(res);
    return res && (
        res.length === 0 ||
        (res.length === 1 && res[0].isComment) // #9658
      ) ? undefined :
      res
  };
  // this is a slot using the new v-slot syntax without scope. although it is
  // compiled as a scoped slot, render fn users would expect it to be present
  // on this.$slots because the usage is semantically a normal slot.
  if (fn.proxy) {
    Object.defineProperty(normalSlots, key, {
      get: normalized,
      enumerable: true,
      configurable: true
    });
  }
  return normalized
}

function proxyNormalSlot(slots, key) {
  return function () {
    return slots[key];
  }
}

/*  */

/**
 * Runtime helper for rendering v-for lists.
 * 渲染v-for
 */
function renderList(
  val,
  render
) {
  var ret, i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length);
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i);
    }
  } else if (typeof val === 'number') {
    ret = new Array(val);
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i);
    }
  } else if (isObject(val)) {
    if (hasSymbol && val[Symbol.iterator]) {
      ret = [];
      var iterator = val[Symbol.iterator]();
      var result = iterator.next();
      while (!result.done) {
        ret.push(render(result.value, ret.length));
        result = iterator.next();
      }
    } else {
      keys = Object.keys(val);
      ret = new Array(keys.length);
      for (i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        ret[i] = render(val[key], key, i);
      }
    }
  }
  if (!isDef(ret)) {
    ret = [];
  }
  (ret)._isVList = true;
  return ret
}

/*  */

/**
 * Runtime helper for rendering <slot> 运行时渲染插槽
 */
function renderSlot(
  name,
  fallback, // 如果父组件没有传入内容 将会使用fallback的内容进行渲染
  props,
  bindObject
) {
  // 拿到作用域插槽方法
  var scopedSlotFn = this.$scopedSlots[name];
  var nodes;
  if (scopedSlotFn) { // scoped slot 作用域插槽
    props = props || {};
    if (bindObject) {
      if (process.env.NODE_ENV !== 'production' && !isObject(bindObject)) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        );
      }
      // 合并绑定的属性
      props = extend(extend({}, bindObject), props);
    }
    // 把作用域插槽vnode的获得延迟到当前子组件的作用域  所以能获得子组件的数据  所以就达到了使用子组件的数据 采用不同的方式去渲染
    // 也是可以使用解构的原因
    // 与普通插槽不同的原因是 同时函数传递的方式将父组件插槽中的vnode创建，延迟到子组件的渲染上下文中去，所以也就使用了子组件的数据
    nodes = scopedSlotFn(props) || fallback;
  } else {
    // 实际上slot就是把父组件的已经render好的vnode数组拿过来了
    // 因为插槽的内容和数据都是在父组件中渲染好的 所以拿过来的vnode也是基于父组件的
    // 就达到了父组件中定义插槽内容 子组件中去渲染插槽内容 数据源是父组件
    // 这里的 fallback 就是在编译阶段传入的 children 也就是插槽没有传入内容 就展示默认内容
    nodes = this.$slots[name] || fallback; 
  }

  var target = props && props.slot;
  if (target) {
    return this.$createElement('template', {
      slot: target
    }, nodes)
  } else {
    return nodes // 返回这个vnode 作为在子组件的render
  }
}

/*  */

/**
 * Runtime helper for resolving filters
 * 过滤器
 */
function resolveFilter(id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}

/*  */

// 检查键盘事件码
function isKeyNotMatch(expect, actual) {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

/**
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */
function checkKeyCodes(
  eventKeyCode,
  key,
  builtInKeyCode,
  eventKeyName,
  builtInKeyName
) {
  var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
}

/*  */

/**
 * 将v-bind的写法转化成vnodedata 对象
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
function bindObjectProps(
  data,
  tag,
  value,
  asProp,
  isSync
) {
  if (value) {
    if (!isObject(value)) {
      process.env.NODE_ENV !== 'production' && warn(
        'v-bind without argument expects an Object or Array value',
        this
      );
    } else {
      if (Array.isArray(value)) { // 数组转换成对象
        value = toObject(value);
      }
      var hash; // map
      var loop = function (key) {
        if (
          key === 'class' ||
          key === 'style' ||
          isReservedAttribute(key) // 判断是不是保留字
        ) {
          hash = data;
        } else {
          var type = data.attrs && data.attrs.type;
          hash = asProp || config.mustUseProp(tag, type, key) ?
            data.domProps || (data.domProps = {}) : // 是dom属性
            data.attrs || (data.attrs = {}); // 其他attr属性
        }
        var camelizedKey = camelize(key);
        var hyphenatedKey = hyphenate(key);
        if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) { // 如果camel和短横链接的值都不在哈希表中
          hash[key] = value[key]; // 就
          if (isSync) {
            var on = data.on || (data.on = {});
            on[("update:" + key)] = function ($event) {
              value[key] = $event;
            };
          }
        }
      };

      for (var key in value) loop(key);
    }
  }
  return data
}

/*  */

/**
 * Runtime helper for rendering static trees.
 * 渲染静态树
 */
function renderStatic(
  index,
  isInFor
) {
  var cached = this._staticTrees || (this._staticTrees = []);
  var tree = cached[index];
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  if (tree && !isInFor) { // 如果存在且没有用v-for就复用这个vnode树
    return tree
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates  为了函数式组件
  );
  markStatic(tree, ("__static__" + index), false);
  return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
function markOnce(
  tree,
  index,
  key
) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}

/**
 * 标记静态树
 * @param {*} tree 
 * @param {*} key 
 * @param {*} isOnce 
 */
function markStatic(
  tree,
  key,
  isOnce
) {
  if (Array.isArray(tree)) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') { // 标记静态节点
        markStaticNode(tree[i], (key + "_" + i), isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}

/**
 * 标记静态节点或者是v-once的静态节点
 */
function markStaticNode(node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}

/*  */

/**
 * 把v-on内的绑定方法标准化到vnodedata中去
 */
function bindObjectListeners(data, value) {
  if (value) {
    if (!isPlainObject(value)) {
      process.env.NODE_ENV !== 'production' && warn(
        'v-on without argument expects an Object value',
        this
      );
    } else {
      var on = data.on = data.on ? extend({}, data.on) : {};
      for (var key in value) {
        var existing = on[key];
        var ours = value[key];
        on[key] = existing ? [].concat(existing, ours) : ours;
      }
    }
  }
  return data
}

/*  */
// 获得作用域插槽 供runtime使用
function resolveScopedSlots(
  fns, // see flow/vnode
  res,
  // the following are added in 2.6
  hasDynamicKeys,
  contentHashKey
) {
  res = res || {
    $stable: !hasDynamicKeys
  };
  for (var i = 0; i < fns.length; i++) {
    var slot = fns[i];
    if (Array.isArray(slot)) { // 对于数组递归
      resolveScopedSlots(slot, res, hasDynamicKeys);
    } else if (slot) {
      // marker for reverse proxying v-slot without scope on this.$slots
      if (slot.proxy) {
        slot.fn.proxy = true;
      }
      res[slot.key] = slot.fn;
    }
  }
  if (contentHashKey) {
    (res).$key = contentHashKey;
  }
  return res
}

/*  */
// 绑定动态的key
function bindDynamicKeys(baseObj, values) {
  for (var i = 0; i < values.length; i += 2) {
    var key = values[i];
    if (typeof key === 'string' && key) {
      baseObj[values[i]] = values[i + 1]; // 把数组的第2n项赋值给2n-1项  vue内部利用了一个简单的数据解构  前一个是key 后一个是value 类似于元组
    } else if (process.env.NODE_ENV !== 'production' && key !== '' && key !== null) {
      // null is a special value for explicitly removing a binding
      warn(
        ("Invalid value for dynamic directive argument (expected string or null): " + key),
        this
      );
    }
  }
  return baseObj
}

// helper to dynamically append modifier runtime markers to event names.
// ensure only append when value is already string, otherwise it will be cast
// to string and cause the type check to miss.
// 动态的在运行时添加方法标记符 就像 ～ & 之类的
function prependModifier(value, symbol) {
  return typeof value === 'string' ? symbol + value : value
}

/*  */

function installRenderHelpers(target) {
  target._o = markOnce;
  target._n = toNumber;
  target._s = toString;
  target._l = renderList;
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode;
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
  target._d = bindDynamicKeys;
  target._p = prependModifier;
}

/*  */
/**
 * 函数组件渲染作用域
 * @param {*} data  vnodedata
 * @param {*} props 合并后的属性 包含data.attrs data.props
 * @param {*} children 子vnode
 * @param {*} parent 站位节点所在的上下文
 * @param {*} Ctor 
 */
function FunctionalRenderContext(
  data,
  props,
  children,
  parent,
  Ctor
) {
  var this$1 = this;

  var options = Ctor.options;
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  // 获取一个特殊的上下文呢，这对于插槽命名检查是必要的
  var contextVm;
  if (hasOwn(parent, '_uid')) { // 如果占位节点上下文有uid
    contextVm = Object.create(parent); // 原型连继承
    // $flow-disable-line
    contextVm._original = parent;
  } else { // 函数组件嵌套
    // the context vm passed in is a functional context as well.
    // in this case we want to make sure we are able to get a hold to the
    // real context instance.
    contextVm = parent;
    // $flow-disable-line
    parent = parent._original;
  }
  var isCompiled = isTrue(options._compiled);
  var needNormalization = !isCompiled;

  this.data = data;
  this.props = props;
  this.children = children;
  this.parent = parent;
  this.listeners = data.on || emptyObject;
  this.injections = resolveInject(options.inject, parent);
  this.slots = function () {
    if (!this$1.$slots) {
      normalizeScopedSlots(
        data.scopedSlots,
        this$1.$slots = resolveSlots(children, parent)
      );
    }
    return this$1.$slots
  };

  Object.defineProperty(this, 'scopedSlots', ({
    enumerable: true,
    get: function get() {
      return normalizeScopedSlots(data.scopedSlots, this.slots())
    }
  }));

  // support for compiled functional template
  if (isCompiled) { // 如果是编译过了 vue-loader？
    // exposing $options for renderStatic()
    this.$options = options;
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots();
    this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
  }

  if (options._scopeId) { // 设置render函数 没有找到_scopeId的赋值  应该是vue-loader或者template-compiler编译来
    this._c = function (a, b, c, d) {
      var vnode = createElement(contextVm, a, b, c, d, needNormalization);
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId;
        vnode.fnContext = parent;
      }
      return vnode
    };
  } else {
    this._c = function (a, b, c, d) {
      return createElement(contextVm, a, b, c, d, needNormalization);
    };
  }
}

installRenderHelpers(FunctionalRenderContext.prototype);

/**
 * 创建函数式组件的vnode
 * @param {*} Ctor  组件构造器
 * @param {*} propsData props：{}
 * @param {*} data  vnodedata
 * @param {*} contextVm 当前站位节点所在的作用域
 * @param {*} children 子vnode数组
 */
function createFunctionalComponent(
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {
  var options = Ctor.options; // 合并供的opts
  var props = {};
  var propOptions = options.props;
  if (isDef(propOptions)) {
    for (var key in propOptions) { // 得到对应的属性值
      props[key] = validateProp(key, propOptions, propsData || emptyObject);
    }
  } else {
    // 把camel化的值添加到props
    // 需要注意的是 无论是attrs和props都作为属性合并到props中去
    if (isDef(data.attrs)) { 
      mergeProps(props, data.attrs);
    }
    if (isDef(data.props)) {
      mergeProps(props, data.props);
    }
  }

  // 获得函数式组件渲染上下文
  var renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  );

  // 直接执行render
  var vnode = options.render.call(null, renderContext._c, renderContext);

  // 最后返回函数式组件的vnode
  if (vnode instanceof VNode) { // 如果是一个vnode
    // 添加fnoptions和fncontext
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
  } else if (Array.isArray(vnode)) { // 如果是vnode数组
    var vnodes = normalizeChildren(vnode) || [];
    var res = new Array(vnodes.length);
    for (var i = 0; i < vnodes.length; i++) { // 遍历
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
    }
    return res
  }
}

// 克隆函数式渲染后的结果并标记
function cloneAndMarkFunctionalResult(vnode, data, contextVm, options, renderContext) {
  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  var clone = cloneVNode(vnode);
  clone.fnContext = contextVm;
  clone.fnOptions = options;
  if (process.env.NODE_ENV !== 'production') {
    (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
  }
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot;
  }
  return clone
}

// 简单合并props
function mergeProps(to, from) {
  for (var key in from) {
    to[camelize(key)] = from[key];
  }
}

/*  */

/*  */

/*  */

/*  */

// Vue.js 使用的 Virtual DOM 参考的是开源库 snabbdom，它的一个特点是在 VNode 的 patch 流程中对外暴露了各种时机的钩子函数，
// 方便做一些额外的事情，Vue.js 也是充分利用这一点，在初始化一个 Component 类型的 VNode 的过程中实现了几个钩子函数：
// inline hooks to be invoked on component VNodes during patch
var componentVNodeHooks = {
  // init 钩子通过 createComponentInstanceForVnode 创建一个 Vue 的实例，
  // 然后调用 $mount 方法挂载子组件
  init: function init(vnode, hydrating) {
    if (
      vnode.componentInstance && // keep-alive内部的组件在首次渲染的时候是没有组件实例的 需要按照常规初始化流程去生成vm实例
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) { // 对于已经keepalive的组件 执行不一样的初始化过程  直接执行prepatch  跳过 创建实例的过程和mount的过程
      // kept-alive components, treat as a patch
      var mountedNode = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      var child = vnode.componentInstance = createComponentInstanceForVnode( // 创建当前组件的vm实例
        vnode,
        activeInstance
      );
      // 由于组件初始化的时候是不传 el 的，因此组件是自己接管了 $mount 的过程，
      // hydrating 为 true 一般是服务端渲染的情况，
      // 如果只考虑客户端渲染，所以这里 $mount 相当于执行 child.$mount(undefined, false)
      // 它最终会调用 mountComponent 方法，进而执行 vm._render() 方法：
      child.$mount(hydrating ? vnode.elm : undefined, hydrating); // 拿到组件的实例挂载到vnode.elm(elm是html中真实的dom节点)上去
    }
  },

  /**
   * 执行prepatch 这个过程同样也是递归的 会不断的更新子组件 不断的进行diff操作
   * 整个prepatch也是深度遍历的的过程，当子组件patch完之后 才会进行当前组件的patch 
   * 而自组件的patch都是在父级组件的prepatch中完成的
   * @param {*} oldVnode 老vnode
   * @param {*} vnode  新vnode
   */
  prepatch: function prepatch(oldVnode, vnode) {
    // 组件配置option 记录了占位节点 props attrs等信息 （vue-loader）一次编译 多次使用 ？？
    var options = vnode.componentOptions;
    // 获取老的vm并赋值给新的vnode 执行更新自组件操作  
    var child = vnode.componentInstance = oldVnode.componentInstance;
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    );
  },

  // insertvnodequeue会依次执行所有的数组内的vnode 的 inset钩子函数 
  insert: function insert(vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) { //如果是keepalive  就执行activated钩子
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */ );
      }
    }
  },

  // 销毁vnode 
  destroy: function destroy(vnode) {
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) { // 在非keepalive的条件下 直接执行销毁
        componentInstance.$destroy();
      } else { // 否则去执行keepalive的deactivete钩子
        deactivateChildComponent(componentInstance, true /* direct */ );
      }
    }
  }
};

var hooksToMerge = Object.keys(componentVNodeHooks);

/**
 * 主要做了三件事:
 * 构造子类构造函数，安装组件钩子函数和实例化 vnode
 */
function createComponent(
  Ctor, // 导入的App对象 export default {} 其实就是通过ES6语法导出的对象 其中template已经转化成render函数了（通过vue-loader）
  data, // vnodedata
  context, // vm 当前占位节点所在的上下文vm 
  children, // 子节点
  tag // 标签名
) {
  if (isUndef(Ctor)) {
    return
  }

  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor // 普通选项对象：将其转换为组件构造器构造函数
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor); // 实际上相当于是拿到了一些基础的options和一些策略函数
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(("Invalid Component definition: " + (String(Ctor))), context);
    }
    return
  }

  // async component
  var asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {}; // vnodedata

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  // 解析构造函数选项，以防在创建组件构造函数后应用全局mixin
  resolveConstructorOptions(Ctor);

  // transform component v-model data into props & events 解析带有v-model的组件 把语法糖解析
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // extract props 提取props 也就是子组件定义过的props:{}对象中的属性
  var propsData = extractPropsFromVNodeData(data, Ctor, tag);

  // functional component 判断是不是函数时组件 如果是直接创建函数式组件
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as 提取方法,data.on应该被处理为子组件$emit出来的方法而不是原生native的方法
  // child component listeners instead of DOM listeners data.on将保存到组件的占位vnode的componentsOptions 
  var listeners = data.on;
  // replace with listeners with .native modifier // 将包含.native修饰符的方法添加到当前组件的vnodedata.on 作为当前组件的native方法 原生dom事件
  // so it gets processed during parent component patch. // nativeOn 将保留在当前组件的vnodedata中
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    var slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }
  // 为站为节点添加组件钩子
  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // 最后一步非常简单，通过 new VNode 实例化一个 vnode 并返回。
  // 需要注意的是和普通元素节点的 vnode 不同，组件的 vnode 是****没有 children**** 的(因为是占位节点)，这点很关键
  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context, { // components options
      Ctor: Ctor,
      propsData: propsData, // 组件中props定义的属性 可能来自站位节点的props或者attrs
      listeners: listeners, // 这个listener是子组件emit要触发的方法
      tag: tag,
      children: children //当前vnode的孩子vnode数组
    },
    asyncFactory
  );

  return vnode
}

/**
 * 创建站位节点的vm实例
 * @param {*} vnode 父级vnode 也就是占位节点
 * @param {*} parent 当前站位节点所在的vm  也就是父级vm
 */
function createComponentInstanceForVnode(
  vnode, // we know it's MountedComponentVNode but flow doesn't  已经挂载过得vnode 当前活跃的vm的对应的vnode
  parent // activeInstance in lifecycle state 生命周期中活跃的vm实例
) {
  var options = {
    _isComponent: true,
    _parentVnode: vnode,
    parent: parent
  };
  // check inline-template render functions
  var inlineTemplate = vnode.data.inlineTemplate;
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }
  return new vnode.componentOptions.Ctor(options) // 创建当前组件对应的vm实例
}

// 整个 installComponentHooks 的过程就是把 componentVNodeHooks 的钩子函数合并到 data.hook 中，
// 在 VNode 执行 patch 的过程中执行相关的钩子函数，具体的执行我们稍后在介绍 patch 过程中会详细介绍。
// 这里要注意的是合并策略，在合并过程中，如果某个时机的钩子已经存在 data.hook 中，那么通过执行 mergeHook 函数做合并，在最终执行的时候，依次执行这两个钩子函数即可。
function installComponentHooks(data) {
  var hooks = data.hook || (data.hook = {});
  for (var i = 0; i < hooksToMerge.length; i++) {
    var key = hooksToMerge[i];
    var existing = hooks[key];
    var toMerge = componentVNodeHooks[key];
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
    }
  }
}

// 简单合并 
function mergeHook$1(f1, f2) {
  var merged = function (a, b) {
    // flow complains about extra args which is why we use any
    f1(a, b);
    f2(a, b);
  };
  merged._merged = true;
  return merged
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
/**
 * 转换组件内定义的model：{} 语法糖到vnodedata上去
 */
function transformModel(options, data) {
  // 在组件内部定义的props.model = {props:'',event:'' }
  // 实际上就是v-model绑定的内部的变量名是什么  :value="modelVal" 默认
  // 当绑定的变量变化时候通过哪个方法回传回去 @input="modelVal = payload" 默认
  var prop = (options.model && options.model.prop) || 'value';
  var event = (options.model && options.model.event) || 'input';
  //为当前vnodedata的attrs（html 属性集合）中添加当前属性prop复制给当前data.model
  (data.attrs || (data.attrs = {}))[prop] = data.model.value;
  var on = data.on || (data.on = {});
  var existing = on[event];
  var callback = data.model.callback;
  // 为用户定义的方法 添加响应式回调
  // 也就是内部emit出来的方法
  if (isDef(existing)) {
    if (
      Array.isArray(existing) ?
      existing.indexOf(callback) === -1 :
      existing !== callback
    ) {
      on[event] = [callback].concat(existing);
    }
  } else {
    on[event] = callback;
  }
}

/*  */

var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
// createElement 方法实际上是对 _createElement 方法的封装，
// 它允许传入的参数更加灵活，在处理这些参数后，调用真正创建 VNode 的函数 _createElement：
function createElement(
  context, // 当前渲染上下文 用当前上下文去渲染组件占位节点和常规节点 
  tag, // 这里的tag 就是当前 h=>h(App)的App的对象内容
  data,
  children,
  normalizationType,
  alwaysNormalize // 用户手写的render此参数是true, vue-loader解析成的render,此参数就会false 
) {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType) // 标准化后开始真正的createElemnt
}

// 这正式开始创建vnode
function _createElement(
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (isDef(data) && isDef((data).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if (process.env.NODE_ENV !== 'production' &&
    isDef(data) && isDef(data.key) && !isPrimitive(data.key)
  ) {
    {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {};
    data.scopedSlots = {
      default: children[0]
    };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) { // 如果是用户传入的render函数 始终进行复杂的递归式的children标准化
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) { // 否则进行简单的,单层的,扁平初始化操作
    children = simpleNormalizeChildren(children);
  }

  // 处理好子节点的标准化后 最终子节点都是会vnode类型的数组
  var vnode, ns;
  if (typeof tag === 'string') { //先对 tag 做判断，如果是 string 类型，则接着判断如果是内置的一些节点，则直接创建一个普通 VNode，
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) { //判断当前标签是不是内置标签 
      // platform built-in elements
      if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
        warn(
          ("The .native modifier for v-on is only valid on components but it was used on <" + tag + ">."),
          context
        );
      }
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // 如果是为已注册的组件名，则通过 createComponent 创建一个组件类型的 VNode，
      // 如果不是内置标签就再判断有没有 vnodedata  最后获取子组件构造器 这里的Ctor 实际上还是一个options 还没有转换成组件构造器
      // component 根据子组件构造器去创建组建的vnode 在构造区间的过程中会把Options通过baseCtor.extend转化成组件构造器
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      // 否则创建一个未知的标签的 VNode。 
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else { // 如果是 tag 一个 Component 类型，则直接调用 createComponent 创建一个组件类型的 VNode 节点。
    // direct component options / constructor 是个对象 或者是个 Ctor
    vnode = createComponent(tag, data, context, children);
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) {
      applyNS(vnode, ns);
    }
    if (isDef(data)) {
      registerDeepBindings(data);
    }
    return vnode
  } else {
    return createEmptyVNode()
  }
}

// 处理带有namespace的元素？ 
function applyNS(vnode, ns, force) {
  vnode.ns = ns;
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined;
    force = true;
  }
  if (isDef(vnode.children)) {
    for (var i = 0, l = vnode.children.length; i < l; i++) {
      var child = vnode.children[i];
      if (isDef(child.tag) && (
          isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force);
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
// 当深度绑定（如：style和）时，必须确保父级重新渲染 :class 用于插槽节点
function registerDeepBindings(data) {
  if (isObject(data.style)) {
    traverse(data.style);
  }
  if (isObject(data.class)) {
    traverse(data.class);
  }
}

/*  */

// 初始化渲染相关函数
function initRender(vm) {
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
  var options = vm.$options;
  var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
  var renderContext = parentVnode && parentVnode.context;
  // _renderChildren 是父组件的子元素vnode数组
  // renderContext 实际上就是父组件的vm
  // 通过这两者得到自组件的$slots  因为插槽内容是在父组件中定义的 所以会在父组件中通过render函数得到
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;
  //将createElement 绑定到此实例，以便在其中获得适当的render context。
  // args顺序：tag、data、children、normalizationType、alwaysNoMalize
  // 内部版本由从template编译的render使用
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = function (a, b, c, d) {
    return createElement(vm, a, b, c, d, false);
  };
  // normalization is always applied for the public version, used in
  // user-written render functions. 用于用户外部调用的render函数
  vm.$createElement = function (a, b, c, d) {
    return createElement(vm, a, b, c, d, true);
  };

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  var parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    defineReactive$$1(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
      !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
    }, true);
    defineReactive$$1(vm, '$listeners', options._parentListeners || emptyObject, function () {
      !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
    }, true);
  } else {
    // $attrs 指向站位节点的属性
    defineReactive$$1(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true);
    // $listeners 指向站位节点绑定的方法
    defineReactive$$1(vm, '$listeners', options._parentListeners || emptyObject, null, true);
  }
}

// 全局变量 记录当前正在渲染的vm实例
var currentRenderingInstance = null;

// 安装渲染的相关工具方法
function renderMixin(Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype);

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  // 调用render函数
  Vue.prototype._render = function () {
    var vm = this;
    var {
      render,
      _parentVnode
    } = vm.$options // 获得render方法和占位vnode
    // var ref = vm.$options; // webpack + babel 会将解构表达式重新解析为ref的形式
    // var render = ref.render;
    // var _parentVnode = ref._parentVnode;

    if (_parentVnode) { // 如果存在站为节点 就去解析站位节点的部分参数 进行标准化
      vm.$scopedSlots = normalizeScopedSlots(
        _parentVnode.data.scopedSlots,
        vm.$slots,
        vm.$scopedSlots
      );
    }

    // set parent vnode. this allows render functions to have access 设置父vnode。
    // to the data on the placeholder node. 允许渲染函数访问占位符(_parentVnode)节点上的数据
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      // maintain 维护
      // 不需要维护堆栈，因为所有渲染fn都是彼此独立调用的。当父组件patch完毕时，将调用嵌套组件的render fn。
      // There's no need to maintain a stack because all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm;
      vnode = render.call(vm._renderProxy, vm.$createElement); // 此处的render函数就是vue-loader或者compiler解析后的render函数 (就是抽象的由字符串拼接的render函数)
    } catch (e) {
      handleError(e, vm, "render");
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && vm.$options.renderError) {
        try {
          vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
        } catch (e) {
          handleError(e, vm, "renderError");
          vnode = vm._vnode;
        }
      } else {
        vnode = vm._vnode;
      }
    } finally {
      currentRenderingInstance = null; // 至此 当前组建的的所有子组件节点(占位节点)和内置元素节点都渲染完成
    }
    // if the returned array contains only a single node, allow it
    if (Array.isArray(vnode) && vnode.length === 1) {
      vnode = vnode[0];
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent 再次将占位符节点赋值给当前vnode.parent   
    vnode.parent = _parentVnode;
    // 这里的vnode返回给 vm._update() 使用， update会进行 vm._vnode = vnode，将真正组件的vnode赋值给_vnode ,所以vm.vnode.parent就是占位符节点
    return vnode
  };
}

/*  */

/**
 * 获取组件的构造器
 */
function ensureCtor(comp, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default;
  }
  return isObject(comp) ?
    base.extend(comp) :
    comp
}

// 创建一部组件占位节点
function createAsyncPlaceholder(
  factory,
  data,
  context,
  children,
  tag
) {
  var node = createEmptyVNode();
  node.asyncFactory = factory;
  node.asyncMeta = {
    data: data,
    context: context,
    children: children,
    tag: tag
  };
  return node
}

/**
 * 获取异步组件或者异步组件的占位节点构造器
 * 传入工厂函数和组件_base
 */
function resolveAsyncComponent(
  factory,
  baseCtor
) {
  // 判断高阶组件选项
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }

  // 判断异步组件是否已经决议过了 如果决议过了 直接将当前异步组件的构造器返回
  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  // 确定当前异步组件的渲染的vm
  var owner = currentRenderingInstance;
  if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
    // already pending
    // 保存当前异步组件所有使用的地方
    factory.owners.push(owner);
  }

  // 判断高阶组件的loading
  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }

  // 第一次渲染异步组件进入
  if (owner && !isDef(factory.owners)) {
    var owners = factory.owners = [owner];
    var sync = true;
    var timerLoading = null;
    var timerTimeout = null;
    (owner).$on('hook:destroyed', function () {
      return remove(owners, owner);
    });

    // 强制刷新拥有异步组建的组件重新渲染 将异步获取到的组件构造器渲染到页面上去
    var forceRender = function (renderCompleted) {
      for (var i = 0, l = owners.length; i < l; i++) {
        (owners[i]).$forceUpdate();
      }

      if (renderCompleted) {
        owners.length = 0;
        if (timerLoading !== null) {
          clearTimeout(timerLoading);
          timerLoading = null;
        }
        if (timerTimeout !== null) {
          clearTimeout(timerTimeout);
          timerTimeout = null;
        }
      }
    };

    var resolve = once(function (res) {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor);
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender(true);
      } else {
        owners.length = 0;
      }
    });

    var reject = once(function (reason) {
      process.env.NODE_ENV !== 'production' && warn(
        "Failed to resolve async component: " + (String(factory)) +
        (reason ? ("\nReason: " + reason) : '')
      );
      if (isDef(factory.errorComp)) {
        factory.error = true;
        forceRender(true);
      }
    });

    // 直接执行传入的工厂函数  等待工厂函数内部执行resolve方法
    var res = factory(resolve, reject);

    // 处理函数
    // 处理promise
    // 处理严格对象类型的高阶异步组件
    if (isObject(res)) {
      if (isPromise(res)) {
        // () => Promise
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject);
        }
      } else if (isPromise(res.component)) {
        res.component.then(resolve, reject);

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor);
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor);
          if (res.delay === 0) {
            factory.loading = true;
          } else {
            timerLoading = setTimeout(function () {
              timerLoading = null;
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true;
                forceRender(false);
              }
            }, res.delay || 200);
          }
        }

        if (isDef(res.timeout)) {
          timerTimeout = setTimeout(function () {
            timerTimeout = null;
            if (isUndef(factory.resolved)) {
              reject(
                process.env.NODE_ENV !== 'production' ?
                ("timeout (" + (res.timeout) + "ms)") :
                null
              );
            }
          }, res.timeout);
        }
      }
    }

    sync = false;
    // return in case resolved synchronously
    return factory.loading ?
      factory.loadingComp :
      factory.resolved
  }
}

/*  */

//是不是异步组件站位节点
function isAsyncPlaceholder(node) {
  return node.isComment && node.asyncFactory
}

/*  */
// 拿到第一个组件节点
function getFirstComponentChild(children) {
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}

/*  */

/*  */
// 初始化事件管理中心
function initEvents(vm) {
  vm._events = Object.create(null); 
  vm._hasHookEvent = false;
  // init parent attached events 查看当前vm.$options是不是从站位节点上继承来了listeners 这些listener就是用户emit触发的方法 如果有 为当前vm执行更新侦听器
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

// 当前更新的组件vm 用于事件中心相关操作
var target;

// 自定义时间的add方法
function add(event, fn) {
  target.$on(event, fn);
}

function remove$1(event, fn) {
  target.$off(event, fn);
}

//返回一个 执行一次就关闭的方法
function createOnceHandler(event, fn) {
  var _target = target;
  return function onceHandler() {
    var res = fn.apply(null, arguments);
    if (res !== null) {
      _target.$off(event, onceHandler);
    }
  }
}

// 更新组件事件
function updateComponentListeners( // 更新组件的额事件侦听器（从站位节点上取到了 也就是子组件$emit触发的方法）
  vm,
  listeners,
  oldListeners // 在初始化事件调度中心的时候这个参数是false
) {
  target = vm;
  // add = $on remove$1 = $off createOnceHandler = $once 初始化的时候oldlisteners是undefined 
  updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
  target = undefined;
}

// 添加事件的工具方法
function eventsMixin(Vue) {
  /**
   * 以hook:开头
   */
  var hookRE = /^hook:/;
  // 添加自定义事件
  Vue.prototype.$on = function (event, fn) {
    var vm = this;
    if (Array.isArray(event)) { // 如果是个数组 遍历执行
      for (var i = 0, l = event.length; i < l; i++) {
        vm.$on(event[i], fn);
      }
    } else {
      // $on只不过是简单的通过数组保存需要触发的方法
      // 在$emit的时候去触发他们
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };

  Vue.prototype.$once = function (event, fn) {
    var vm = this;

    function on() {
      vm.$off(event, on);
      fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm
  };

  Vue.prototype.$off = function (event, fn) {
    var vm = this;
    // all
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
        vm.$off(event[i$1], fn);
      }
      return vm
    }
    // specific event
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null;
      return vm
    }
    // specific handler
    var cb;
    var i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break
      }
    }
    return vm
  };

  // 触发事件
  Vue.prototype.$emit = function (event) {
    var vm = this;
    if (process.env.NODE_ENV !== 'production') {
      var lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          "Event \"" + lowerCaseEvent + "\" is emitted in component " +
          (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
          "Note that HTML attributes are case-insensitive and you cannot use " +
          "v-on to listen to camelCase events when using in-DOM templates. " +
          "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
        );
      }
    }
    var cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      var args = toArray(arguments, 1);
      var info = "event handler for \"" + event + "\"";
      for (var i = 0, l = cbs.length; i < l; i++) {
        invokeWithErrorHandling(cbs[i], vm, args, vm, info);
      }
    }
    return vm
  };
}

/*  */

// 当前活跃的实例
var activeInstance = null;
// 是不是正在更新组件的标志服
var isUpdatingChildComponent = false;

// 设置当前活跃的vm 返回一个方法用来回退上一个vm
function setActiveInstance(vm) {
  var prevActiveInstance = activeInstance;
  activeInstance = vm;
  return function () {
    activeInstance = prevActiveInstance;
  }
}

// 初始化生命周期
function initLifecycle(vm) { 
  var options = vm.$options;

  // locate first non-abstract parent 确定第一个非抽象父节点 忽略一些keepalive等等的组件
  var parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) { // 如果当前父节点的opts配置了当前节点是抽象的并且还拥有父vm，向上一层，继续判断，直到得到第一个非抽象节点。
      parent = parent.$parent;
    }
    parent.$children.push(vm); //  vm之间互相添加依赖
  }

  vm.$parent = parent; //  父子vm之间互相添加依赖
  vm.$root = parent ? parent.$root : vm;

  vm.$children = []; // 同时初始化子vm的$children
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}

// 添加生命周期相关方法 都是很核心的方法
function lifecycleMixin(Vue) {
  // Vue 的 _update 是实例的一个私有方法，它被调用的时机有 2 个，一个是首次渲染，一个是数据更新的时候；
  // _update 方法的作用是把 VNode 渲染成真实的 DOM，
  // _update 的核心就是调用 vm.__patch__ 方法，这个方法实际上在不同的平台，比如 web 和 weex 上的定义是不一样的，因此在 web 平台中它的定义在 src/platforms/web/runtime/index.js 中
  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    var prevEl = vm.$el;
    var prevVnode = vm._vnode; // 首先拿到上次的vnode结果 作为patch时候的参数 如果是首次渲染 此项为空
    // 这个 activeInstance 作用就是保持当前上下文的 Vue 实例，它是全局变量，
    // 调用 createComponentInstanceForVnode 方法的时候获取会获取这个 活跃的vm实例，并且作为创建子vm的参数传入的。
    // 实际上 JavaScript 是一个单线程，Vue 整个初始化是一个深度遍历的过程，在实例化子组件的过程中，
    // 它需要知道当前上下文的 Vue 实例是什么，并把它作为子组件的父 Vue 实例。
    // 子组件的实例化过程先会调用 initInternalComponent(vm, options) 合并 options，把 parent 存储在 vm.$options 中，
    // 在 $mount 之前会调用 initLifecycle(vm) 方法：完成$parent 和 $children 的双向引用赋值
    var restoreActiveInstance = setActiveInstance(vm);
    vm._vnode = vnode; // 赋予新的vnode或者初始化vnode (渲染vnode)
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      // 首次渲染，所以在执行 patch 函数的时候，传入的 vm.$el 对应的是例子中 id 为 app 的 真实DOM 对象，
      // 这个也就是我们在 index.html 模板中写的 <div id="app">， vm.$el 的赋值是在 mountComponent 函数做的
      // vnode 对应的是调用 render 函数的返回值，hydrating 在非服务端渲染情况下为 false，removeOnly 为 false。
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */ );
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    // 在 vm._update 的过程中，把当前的 vm 赋值给 activeInstance，返回一个闭包函数  restoreActiveInstance,执行它返回上一次的 activeInstance。
    // 实际上， restoreActiveInstance()返回值 和当前的 vm 是一个父子关系，当一个 vm 实例完成它的所有子树的 patch过程后,
    // activeInstance 会重新赋值为它的父实例，保证了 createComponentInstanceForVnode 整个深度遍历过程中，
    // 在实例化子组件的时候能传入当前子组件的父 vm，并在 _init 的过程中，通过 vm.$parent 把这个父子关系保留。
    restoreActiveInstance();
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

  // 触发当前组件的渲染watcher去进行一次视图渲染 
  Vue.prototype.$forceUpdate = function () {
    var vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  };

  // 销毁
  Vue.prototype.$destroy = function () {
    var vm = this;
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy');
    vm._isBeingDestroyed = true;
    // remove self from parent
    var parent = vm.$parent;
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm);
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown();
    }
    var i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }
    // call the last hook...
    vm._isDestroyed = true;
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);
    // fire destroyed hook
    callHook(vm, 'destroyed');
    // turn off all instance listeners.
    vm.$off();
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null;
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null;
    }
  };
}

/**
 * mountComponent 核心就是先实例化一个 render-Watcher，
 * 在它的回调函数中会调用 updateComponent 方法，
 * 在此方法中调用 vm._render 方法先生成虚拟 Node，最终调用 vm._update 更新 DOM。
 * 
 * 设计两个钩子函数： beforeMount mounted （new Watcher() 的前后）
 * 在执行 vm._render() 函数渲染 VNode 之前，执行了 beforeMount 钩子函数，
 * 在执行完 vm._update() 把 VNode patch 到真实 DOM 后，执行 mounted 钩子。
 */
function mountComponent(
  vm,
  el,
  hydrating
) {
  vm.$el = el; // $el
  if (!vm.$options.render) { // 再次判断render函数情况 以判断该当前运行环境
    vm.$options.render = createEmptyVNode;
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        );
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        );
      }
    }
  }
  callHook(vm, 'beforeMount'); // 执行挂载前钩子

  var updateComponent;
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = function () {
      var name = vm._name;
      var id = vm._uid;
      var startTag = "vue-perf-start:" + id;
      var endTag = "vue-perf-end:" + id;

      mark(startTag);
      var vnode = vm._render(); // 拿到当前vm对应的渲染vnode
      mark(endTag);
      measure(("vue " + name + " render"), startTag, endTag);

      mark(startTag);
      vm._update(vnode, hydrating); // 更新vnode到页面上去
      mark(endTag);
      measure(("vue " + name + " patch"), startTag, endTag);
    };
  } else {
    updateComponent = function () {
      vm._update(vm._render(), hydrating);
    };
  }


  // Watcher 在这里起到两个作用，
  // 1. 初始化的时候会执行updateComponent回调函数
  // 2. 当 vm 实例中的监测的数据发生变化的时候执行回调函数
  // we set this to vm._watcher inside the watcher's constructor 我们在观察者的构造函数中设置为vm._watcher，
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child 因为观察者的初始补丁可能调用$forceUpdate（例如在子组件的挂载钩子中）
  // component's mounted hook), which relies on vm._watcher being already defined 这依赖于已经定义的vm._watcher
  new Watcher(vm, updateComponent, noop, { // watcher
    before: function before() {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate'); // 执行一次更新前钩子
      }
    }
  }, true /* isRenderWatcher */ ); // isRenderWatcher 这个标志位只有在挂载组件的时候才会true
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  // vm.$vnode 如果为 null，则表明这不是一次组件的初始化过程，而是我们通过外部 new Vue 初始化过程。
  if (vm.$vnode == null) { //  vm.$vnode 表示 Vue 实例的父虚拟 Node，所以它为 Null 则表示当前是根 Vue 的实例 也就是用户newvue的过程
    vm._isMounted = true; // 函数最后判断为根节点的时候设置 vm._isMounted 为 true， 表示这个实例已经挂载了，同时执行 mounted 钩子函数。 
    callHook(vm, 'mounted'); // 执行一次 new vue 上的挂载钩子
  }
  return vm
}

/**
 * 更新子组件状态 
 * @param {*} vm 仍是上次渲染的时候创建的组件vm实例（初始化的时候会创建vm实例或者不是samevnode的时候会再次createElm进行组件实例的创建 这个vm可能是这两种情况下的结果）
 * @param {*} propsData 父子组件通信依赖的props
 * @param {*} listeners 自组件emit需要出发的方法
 * @param {*} parentVnode 新的占位节点 也就是 _render出来的vnode
 * @param {*} renderChildren 子节点vnode数组
 */
function updateChildComponent(
  vm,
  propsData,
  listeners,
  parentVnode,
  renderChildren
) {
  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = true;
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren.
  // 确定当前组件是否拥有slot  需要在覆盖opts._renderChildren之前做
  // check if there are dynamic scopedSlots (hand-written or compiled but with
  // dynamic slot names). Static scoped slots compiled from template has the
  // "$stable" marker.
  // 判断是不是存在动态的作用域插槽 静态作用域插槽包含$stable标志
  var newScopedSlots = parentVnode.data.scopedSlots;
  var oldScopedSlots = vm.$scopedSlots;
  var hasDynamicScopedSlot = !!(
    (newScopedSlots && !newScopedSlots.$stable) ||
    (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
    (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key)
  );

  // Any static slot children from the parent may have changed during parent's
  // update. Dynamic scoped slots may also have changed. In such cases, a forced
  // update is necessary to ensure correctness.
  // 确定一些需要进行一次强制刷新的情况 动态作用域插槽 
  var needsForceUpdate = !!(
    renderChildren || // has new static slots
    vm.$options._renderChildren || // has old static slots
    hasDynamicScopedSlot
  );

  // 连续三次更新站位节点
  vm.$options._parentVnode = parentVnode;
  vm.$vnode = parentVnode; // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode;
  }
  vm.$options._renderChildren = renderChildren;

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render 更新组件的状态和方法
  vm.$attrs = parentVnode.data.attrs || emptyObject;
  vm.$listeners = listeners || emptyObject;


  // update props 更新props 同时让子组件re-render
  if (propsData && vm.$options.props) {
    toggleObserving(false); // 当前props对象类型的值不会进行依赖收集
    var props = vm._props; // 新老vnode的instance都是上次渲染 new出来的 vm实例 也就是子组件的vm实例 
    var propKeys = vm.$options._propKeys || [];
    for (var i = 0; i < propKeys.length; i++) {
      var key = propKeys[i];
      var propOptions = vm.$options.props; // 把用户定义的props拿过来
      // 在初始化props属性的过程会进行initprops的过程 会把所有的props定义成响应式的 并收集依赖
      // 将会进入 prop-setter 进行重新赋值 继而出发dep.notify() 然后出发自组件的重新渲染 _c() 
      props[key] = validateProp(key, propOptions, propsData, vm);
    }
    toggleObserving(true);
    // keep a copy of raw propsData
    vm.$options.propsData = propsData;
  }

  // update listeners
  listeners = listeners || emptyObject;
  var oldListeners = vm.$options._parentListeners;
  vm.$options._parentListeners = listeners;
  updateComponentListeners(vm, listeners, oldListeners);

  // resolve slots + force update if has children
  if (needsForceUpdate) { 
    // 当在作用域插槽的情况下 进行一次强制更新  触发父子组件渲染  
    // 因为作用域插槽的情况下 数据是在子组件的上下文中（初始化）渲染的 所以只收集了子组件的渲染watcher 
    // 所以无法通过数据更新进而更新父组件
    // 由此通过父组件的强制更新一次dom 进行一次页面更新  （实际上是出发了子组件的render-watcher去update）
    vm.$slots = resolveSlots(renderChildren, parentVnode.context);
    vm.$forceUpdate();
  }

  if (process.env.NODE_ENV !== 'production') {
    isUpdatingChildComponent = false;
  }
}

// 判断当前vm是不是在不活跃的树中 想上查找
function isInInactiveTree(vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) {
      return true
    }
  }
  return false
}

// 使子组件重新活跃 调用钩子
function activateChildComponent(vm, direct) {
  if (direct) {
    vm._directInactive = false;
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false;
    for (var i = 0; i < vm.$children.length; i++) {
      // 找到子组件中需要调用active的地方 
      activateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'activated');
  }
}

// 使子组件不活跃 调用钩子
function deactivateChildComponent(vm, direct) {
  if (direct) {
    vm._directInactive = true;
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true;
    for (var i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'deactivated');
  }
}

/**
 * 源码中最终执行生命周期的函数都是调用 callHook 方法
 * 根据传入的字符串 hook，去拿到 vm.$options[hook] 对应的回调函数数组，
 * 然后遍历执行，执行的时候把 vm 作为函数执行的上下文。
 * Vue.js 合并 options 的过程，各个阶段的生命周期的函数也被合并到 vm.$options 里，并且是一个数组。
 * 因此 callhook 函数的功能就是调用某个生命周期钩子注册的所有回调函数。
 */
function callHook(vm, hook) {
  // #7573 disable dep collection when invoking lifecycle hooks 
  // 在执行声明钩子的时候取消收集依赖。入栈一个undefined 在执行完钩子之后再出栈
  pushTarget();
  var handlers = vm.$options[hook];
  var info = hook + " hook";
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info);
    }
  }
  if (vm._hasHookEvent) {
    // 这里执行hook钩子  可以通过emit(hook:updated)的方式去执行钩子
    vm.$emit('hook:' + hook);
  }
  popTarget();
}

/*  */

var MAX_UPDATE_COUNT = 100;

var queue = [];
var activatedChildren = [];
var has = {};
var circular = {};
var waiting = false;
var flushing = false;
var index = 0;

/**
 * Reset the scheduler's state.
 * 初始化任务栈状态
 */
function resetSchedulerState() {
  index = queue.length = activatedChildren.length = 0;
  has = {};
  if (process.env.NODE_ENV !== 'production') {
    circular = {};
  }
  waiting = flushing = false;
}

// Async edge case #6566 requires saving the timestamp when event listeners are
// attached. However, calling performance.now() has a perf overhead especially
// if the page has thousands of event listeners. Instead, we take a timestamp
// every time the scheduler flushes and use that for all event listeners
// attached during that flush.
var currentFlushTimestamp = 0;

// Async edge case fix requires storing an event listener's attach timestamp.
var getNow = Date.now;

// Determine what event timestamp the browser is using. Annoyingly, the
// timestamp can either be hi-res (relative to page load) or low-res
// (relative to UNIX epoch), so in order to compare time we have to use the
// same timestamp type when saving the flush timestamp.
// All IE versions use low-res event timestamps, and have problematic clock
// implementations (#9632)
if (inBrowser && !isIE) {
  var performance = window.performance;
  if (
    performance &&
    typeof performance.now === 'function' &&
    getNow() > document.createEvent('Event').timeStamp
  ) {
    // if the event timestamp, although evaluated AFTER the Date.now(), is
    // smaller than it, it means the event is using a hi-res timestamp,
    // and we need to use the hi-res version for event listener timestamps as
    // well.
    getNow = function () {
      return performance.now();
    };
  }
}

/**
 * 去把wathcer数组进行排序并完成dom更新
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue() {
  currentFlushTimestamp = getNow(); // 获取当前flush时间戳
  flushing = true; // 标记当前正在清空watcher队列
  var watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child) 组件更新是从父到子 保证父的watcher在前边 子的watcher在后边（id 顺序）
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher) 用户自定义的watch:{} 或者 vm.$watch() 会创建user-watcher 这些需要在render-watcher前边
  //    可是为什么user-wathcer的id号一定比render-wathcer小呢？ 因为在渲染当前组件（$mount）之前已经执行了initWatch 这时候user-watcher已经new出来了 id肯定要比当前组建的渲染wathcer要小 所以这种排序是可靠的
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped. 如果当前组件的销毁是在父组件的watcher中执行的，就可以通过执行父组件watcher
  queue.sort(function (a, b) {
    return a.id - b.id;
  });

  // do not cache length because more watchers might be pushed 
  // as we run existing watchers 
  // 需要不断的获取queue.length 因为可能会在queueWatcher的过程中不断添加wathcer 所以不能缓存 就像 len = queue.length
  // 在不断添加的过程中 只会在queue当前循环到的位置之后添加 所以不会影响前边的
  for (index = 0; index < queue.length; index++) { // 不断遍历全局的index 将会影响queueWatcher的添加
    watcher = queue[index];
    if (watcher.before) { //更新前回调 hook:beforeUpdate
      watcher.before();
    }
    id = watcher.id;
    has[id] = null; // 将哈希表中的当前id置空 也就说说明当前queue已经执行了当前wathcer
    // run
    watcher.run();
    // in dev build, check and stop circular updates. 防止循环调用 导致无限循环的bug
    // 主要针对在 user-watcher 中再次启动 user-wathcer
    // 如下代码 设置一个user-watcher 在msg变化时又会去改变msg 继而再去触发watcher 出现了死循环
    // vue在这里做了循环层级限制。 默认100层。
    /**
     * watch:{
     *  msg (){
     *    this.msg = Math.random()
     *  }
     * }
     */
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1; // 每次重复执行当前watcher就会记录一次 直到超过 MAX_UPDATE_COUNT
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user ?
            ("in watcher with expression \"" + (watcher.expression) + "\"") :
            "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();

  // 初始化
  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue); // 执行 hook:activated 钩子
  callUpdatedHooks(updatedQueue); // 执行 hook:updated 钩子

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }
}

/**
 * 执行updated钩子
 */
function callUpdatedHooks(queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    //  判断当前队列中的watcer的vm中的_watcher === 当前wathcer本身 就代表 当前wathcer是组建的渲染wathcer 于是执行更新后个钩子方法
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated');
    }
  }
}

/**
 * 在整个树patch完之后执行actived钩子
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
function queueActivatedComponent(vm) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false;
  activatedChildren.push(vm);
}

// active钩子
function callActivatedHooks(queue) {
  for (var i = 0; i < queue.length; i++) {
    queue[i]._inactive = true;
    activateChildComponent(queue[i], true /* true */ );
  }
}

/**
 * 把不同类型watcher添加到watcher栈中去  等待执行run方法
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
function queueWatcher(watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true; // 每次添加的时候都会讲哈希表中的当前watcher.id 进行标记 防止循环
    if (!flushing) { // 如果当前没有正在执行watcher任务队列 
      queue.push(watcher); //watcher 入队
    } else { // 正在执行watcher任务队列
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      // 在queue中找到当前watcher应该在的位置 不断对比id和当前queue中的元素的id 吧当前wathcer插到对应位置 依然按照wathcer.id的顺序
      // 假设当前queue正在flushing queue.length = 5 > watcher.id = 3 
      // 开始循环 首先判断当前wathcer的id是不是已经过号了 比如当前执行的wathcer.update已经是4了 但是传入的3说明已经更新过id <= 3的watcher了 就算插入也不会执行了 没有意义了 所以直接插入到队尾
      // 当wathcer的id大于队列的wathcer中最大的id 理所应当应该插入在queue的队尾
      // 其他情况 需要查找到当前还未执行的队列部分并把当前的watcher插入到合适的位置 等待flush
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      // 插入！
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) { // 请空任务队列 同步或者异步 仅执行一次
      waiting = true;

      // config.async 是可以全局配置的 用来指定当前dom的更新策略 默认是异步更新 生产环境下只能异步更新
      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue();
        return
      }
      // 在下一个事件循环去执行dom更新 依次执行wathcer中的update方法
      nextTick(flushSchedulerQueue);
    }
  }
}

/*  */



var uid$2 = 0; // 每个wathcer的唯一ID  在更新wathcer的过程中会根据这个id进行排序 以便完成父=》子顺序更新

/**
 *
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher(
  vm,
  expOrFn,
  cb,
  options, // 创建watcher的时候需要传入opts
  isRenderWatcher
) {
  this.vm = vm;
  if (isRenderWatcher) { // 如果是挂在组件时候创建的watch 保存watcher本身引用到 vm._watcher 
    vm._watcher = this;
  }
  vm._watchers.push(this) // 压栈watcher
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
    this.before = options.before;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$2; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers  computed-watcher初始化的时候就是true 在render方法中调用到computedGetters的时候就会去执行一次wathcer的evaluate 去更新dom
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression = process.env.NODE_ENV !== 'production' ?
    expOrFn.toString() :
    '';
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn; // 如果当前传入的是个function 则在数据变化后触发这个方法
  } else {
    this.getter = parsePath(expOrFn); // 否则通过表达式去解析方法 得到一个闭包函数 执行后得到当前vm中的对应值
    if (!this.getter) {
      this.getter = noop;
      process.env.NODE_ENV !== 'production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy ? // 这里会把watcher更新后的返回值返回到watcher.value属性上
    undefined :
    this.get();
};

/**
 *  new Wacther()最终会触发这个get方法
 * 1. 设置当前依赖目标 Dep.target 为当前watcher 可能是用户watcher 也可能是计算属性为watcher
 * 2. 然后去执行当前vm对应的_render()=>_update()
 * 3. 执行完vnode和dom初始化后,Dep.target 退回到targetStack栈顶元素
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get() {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm);
  } catch (e) {
    if (this.user) {
      handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
    } else {
      throw e
    }
  } finally {
    // 通过主动的摸一下每个属性 去出发深度的依赖收集 太妙了。。
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {// 对于用户想要深度监听的 就通过递归去触发一遍深度的依赖收集
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value
};

/**
 * Add a dependency to this directive.
 * watcher中会持有很多个dep对象(对应很多个响应式属性)
 * 每个dep对象将对应一个响应式的属性 props 或者 data 
 * 也可能一个属性的dep被添加多次? 由于在页面上引用多次 就会编译出多个当前属性的引用 
 * 于是出发了多个getter 但是在addDep的过程中进行了做去重
 * 
 */
Watcher.prototype.addDep = function addDep(dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) { // 判断当前watch的deps添加过了没有 
    // 将当前dep.id和dep本身的引用全部添加到watcher的引用数组中去
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) { // 如果当前当前watcher 的dep中没有当前dep.id
      // 每个dep(属性)里面也会拥有多个watcher 可能存在一个属性被多个watcher订阅 
      // 比如一个属性即被渲染到页面 所以将有一个render-watcher去订阅这个dep
      // 用户又监听这个属性的变化 将有一个user-wathcer去订阅这个dep
      // 计算属性中也订阅了这个属性的变化 这是一个lazy-wathcer
      dep.addSub(this); // 当前watcher添加到dep中去 (双向持有引用)
    }
  }
};

/**
 * 清除掉无用的依赖
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps() {
  var i = this.deps.length;
  while (i--) {
    var dep = this.deps[i];
    if (!this.newDepIds.has(dep.id)) {// 新传入的依赖项中没有当前id 就在dep中删除当前wathcer  防止触发无用的watcher.update
      dep.removeSub(this);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;  
  this.newDepIds.clear();// 新旧depid依赖交换 然后把新的清空 等待下次依赖更新

  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0; // 新旧dep交换 
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 * 更新视图或者更新依赖 或者通过queuewatcher去缓存run方法
 */
Watcher.prototype.update = function update() {
  /* istanbul ignore else */
  if (this.lazy) {
    // 这里注意：lazywathcer的update方法只是把dirty编为true 并没有真的去触发wathcer的run方法
    // 等到渲染页面的时候才会去触发计算属性的evaluate
    // 在更新 computedGetter
    this.dirty = true;
  } else if (this.sync) { // 判断当前是同步 仅仅在开发环境下可用 如果是 直接执行wathcer.run
    this.run();
  } else {
    queueWatcher(this);
  }
};

/**
 * 执行视图更新
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run() {
  if (this.active) {
    // 数据已经通过用户的操作修改过了 通过触发watcher的run方法 继而触发get方法触发 _render() => _update()
    // 这里同样会执行user-wathcer 判断当前值和旧值相不相等 
    // 判断val是不是个对象
    // 判断是不是深度监听
    // 三者满足其一 就去设置新旧值 如果是用户wathcer 就会触发回调
     // value可能是vnode 也可能是计算属性或者是用户定义的值
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep // 深度监听就直接进行数据更新而不进行深层的比对
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) { // 判断是不是 user-watcher  在值变了之后调用回调
        try {
          this.cb.call(this.vm, value, oldValue); // 这里是调用的用户的回调watcher 会传入新值和旧值
        } catch (e) {
          handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

/**
 * 为lazy的watcher准备
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate() {
  // lazy的watcher在需要的时候继续更新 执行一次wathcer的getter
  // 压栈当前lazy-wathcer 再去执行计算属性中的语句 
  // 如果计算属性中的语句有响应式属性 会触发当前属性的getter 
  // 并把当前lazy-watcher添加到当前属性的dep.subs中去
  this.value = this.get();
  this.dirty = false;
};

/**
 * 当前watcher所在的dep 全部重新依赖搜集
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend() {
  var i = this.deps.length;
  while (i--) {
    this.deps[i].depend();
  }
};

/**
 * 把当前watcher从所有的订阅者列表中删除
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown() {
  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) { // 如果当前没有执行$destory() 就去吧当前watcher删了从其vm的_watchers列表中
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
    }
    this.active = false;
  }
};

/*  */

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

// 代理
function proxy(target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}
/**
 * 初始化props data computed watch
 * @param {*} vm 
 */
function initState(vm) {
  vm._watchers = [];
  var opts = vm.$options;
  if (opts.props) {
    initProps(vm, opts.props);
  }
  if (opts.methods) {
    initMethods(vm, opts.methods);
  }
  if (opts.data) { // 为data递归添加了__ob__ 在创建__ob__的过程中会defrective方法进行响应式转换
    initData(vm);
  } else {
    observe(vm._data = {}, true /* asRootData */ ); // 传入vm._data asRootData = true
  }
  if (opts.computed) { // 初始化computed
    initComputed(vm, opts.computed);
  }
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

/**
 * 1.代理this._props.key => this.key
 * 2.设置props为响应式
 * @param {*} vm 
 * @param {*} propsOptions export.default.props
 */
function initProps(vm, propsOptions) {
  var propsData = vm.$options.propsData || {}; // 组件占位节点传入的props 
  var props = vm._props = {}; // 组件options上的_props (将会被vm自身代理)
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存propskeys到数组中去 就可以使用数组的遍历 而不用使用对象的动态枚举
  var keys = vm.$options._propKeys = [];
  var isRoot = !vm.$parent;
  // root instance props should be converted
  // 如果不是根组件的话就不去为当前props中的对象类型的变量创建 Observer
  if (!isRoot) {
    toggleObserving(false);
  }
  var loop = function (key) {
    keys.push(key);
    // 对每个props值进行类型匹配和转换
    var value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      var hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)) {
        warn(
          ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive$$1(props, key, value, function () {
        if (!isRoot && !isUpdatingChildComponent) { 
          // 如果当前是根组件并且不进行警告 避免根组件渲染的时候会调用setter
          // 如果当前是在更新自组件的时候 不会发出警告 更新自组件的过程中不可避免的会调用setter重新发起试图渲染
          // 除此之外是用户在调用prop-setter 这是不被推荐的 所以需要警告用会被覆盖
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    } else {
      defineReactive$$1(props, key, value);
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, "_props", key);
    }
  };

  for (var key in propsOptions) loop(key);
  toggleObserving(true);
}

/**
 * 为用户定义的data中的数据注册响应式
 * @param {*} vm 
 */
function initData(vm) {
  var data = vm.$options.data;
  // 首先判断data是不是function 如果是 执行函数  如果不是 直接返回data 
  // (如果是非function类型的额将会导致所有的使用该组件的地方相互影响 - 引用传递)
  data = vm._data = typeof data === 'function' ?
    getData(data, vm) :
    data || {};
  if (!isPlainObject(data)) {
    data = {};
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  while (i--) { // 检查props中和method中有没有对当前data中的key进行定义
    var key = keys[i];
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) { // 最后判断是不是保留字 - 以$ _ 开头的属性 , 然后进行代理
      proxy(vm, "_data", key);
    }
  }
  // observe data 递归注册响应式 
  observe(data, true /* asRootData */ );
}

// 执行data(){}
function getData(data, vm) {
  // #7573 disable dep collection when invoking data getters
  pushTarget();
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, "data()");
    return {}
  } finally {
    popTarget();
  }
}

// 对于计算属性的watcher是lazy的 
var computedWatcherOptions = {
  lazy: true
};

/**
 * 创建计算属性相关watcher
 * @param {*} vm 
 * @param {*} computed 
 */
function initComputed(vm, computed) {
  // $flow-disable-line
  // 首先为当前vm创建一个哈希表保存计算属性的watcher
  var watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  var isSSR = isServerRendering();

  for (var key in computed) { // 遍历
    var userDef = computed[key]; // 首先进行标准化 computed:{ name(){} } => computed: {name: { get(){  } }}
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher( // 为每一个计算属性创建watcher 并保存到哈希表中
        vm,
        getter || noop,
        noop,
        computedWatcherOptions // 计算属性的watcher都是lazy的  {lazy: true} 所以new出来的watcher.val === undefined
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    // 组件定义的计算属性已在组件原型上定义。我们只需要定义在实例化时定义的计算属性。 计算属性可能在组件原型上定义
    if (!(key in vm)) { // 如果当前key不在vm及其原型链上 就定义它
      defineComputed(vm, key, userDef);
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}

/**
 * 定义计算属性
 * @param {*} target vm
 * @param {*} key 计算属性名
 * @param {*} userDef 用户定义的方法
 */
function defineComputed(
  target,
  key,
  userDef
) {
  var shouldCache = !isServerRendering(); // 如果不是SSR
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache ?
      createComputedGetter(key) : // 非SSR进入
      createGetterInvoker(userDef); // SSR进入
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get ?
      shouldCache && userDef.cache !== false ?
      createComputedGetter(key) :
      createGetterInvoker(userDef.get) :
      noop;
    sharedPropertyDefinition.set = userDef.set || noop;
  }
  if (process.env.NODE_ENV !== 'production' &&
    sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        ("Computed property \"" + key + "\" was assigned to but it has no setter."),
        this
      );
    };
  }
  // 为vm[computed-key]创建getter setter
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

/**
 * 创建读取计算属性的getter 在读取计算属性是将读取里面的方法
 * @param {*} key 
 */
function createComputedGetter(key) {
  return function computedGetter() {
    // 首先拿到哈希表中对应的watcher
    var watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) { // 判断计算结果值变了没有
        // computed的watcher中的getter中的所有响应式的值的dep都将添加到watcher.deps中
        watcher.evaluate(); // 变了就进行一次evaluate 初始化的时候也要执行一次计算
      }
      if (Dep.target) { // 判断该当前上下文的watcher 可能是别的computed-watcher 也可能是render-watcher
        // this.depids 中收集了当前wathcer订阅了哪几个dep的id（属性的更新）
        // 当前watcher中的dep列表进行全部重新依赖收集 
        // 特别注意：在执行完watcher.evaluate之后，Dep.target指向的当前计算属性被使用的watcher之中，可能是其他计算属性，user-watcher，或者是render-wathcer
        // 循环watcher.deps中的每一个dep去进行依赖收集 这样做的目的是把当前计算属性中用到的响应式属性和当前计算属性的环境watcher建立关系
        // 这样computed内部属性变化的时候就会通知到computed所在的watcher去检查更新 这时候就会再次进入到这个方法 调用watcher.evaluate 获取计算属性的结果然后返回
        watcher.depend(); 
      }
      return watcher.value // 返回最新的计算属性值
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this)
  }
}

/**
 * 仅仅做了一次this的硬绑定
 * @param {*} vm 
 * @param {*} methods 
 */
function initMethods(vm, methods) {
  var props = vm.$options.props;
  for (var key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof methods[key] !== 'function') {
        warn(
          "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
          "Did you reference the function correctly?",
          vm
        );
      }
      if (props && hasOwn(props, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a prop."),
          vm
        );
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
          "Avoid defining component methods that start with _ or $."
        );
      }
    }
    // 这里的bind极其重要 始终将当前method绑定在当前组件的作用域中  也就是当前组件实例
    // 也就是说 当前组件的method中的this始终指向vm本身 也就是父组件的vm
    // 这么做也就对应了vue中的编码规范 函数和属性定义在哪里 运行作用域就在哪里
    // 在父子组件`通信`的过程中 其实本就不存在通信这一说法 当组件在初始化的时候 从占位节点上拿到的非native方法会在创建组件实例的时候
    // 传递到子组件的事件中心中去 当子组件 $emit一个方法的时候就会 触发到事件中心的对应方法或者方法数组
    // 从原理上讲 子组件实际上为自己派发了一个事件 而不是为父组件派发了一个事件 只不过触发了在自身属性 _event中心的中的方法
    // 但是为什么会让使用者有一种组件通信的错觉呢？ 其根本原因就在这个bind方法 
    // 这个bind方法把父组件的vm作为运行作用域硬绑定到了当前方法上边去
    // 于是 ： 这个方法定义在父组件 运行在父组件 却保存在子组件 妙不可言 ！！！
    // $on=>add  $once=>addOnce  $off=>remove  $emit=>invoke
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
  }
}

/**
 * 为每一个watch中的属性值创建user-watcher
 * 如果为当前属性传入的值是个数组
 * 这把当前这个数组遍历去创建user-watcher
 * @param {*} vm 
 * @param {*} watch option.watch
 */
function initWatch(vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

/**
 * 创建watcher 供用户传入的wathcer和this.$watch()使用
 * @param {*} vm 
 * @param {*} expOrFn 表达式 或者 方法
 * @param {*} handler 监听到变化后需要回调的方法
 * @param {*} options 
 */
function createWatcher(
  vm,
  expOrFn,
  handler,
  options
) {
  if (isPlainObject(handler)) { // 如果传入的hadler是一个对象 如{ handler:[] } 就做一层简单的标准化 允许用户将options的参数提前 方面使用
    options = handler;
    handler = handler.handler;
  }
  // 如果当前传入的是个字符串，就去vm中拿到对应属性  就如 watch:{ a,'methodName' } 如果出现了字符串 就去找这个方法 相当于 this.methodName
  // 其实watch 不过是对于 $watch 的一层简单封装
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options)
}

/**
 * 定义一些状态相关的方法
 * props
 * data
 * watch
 * ps:这个方法名 确认不是模仿react？ 好好叫响应式数据不香吗
 */
function stateMixin(Vue) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  var dataDef = {};
  dataDef.get = function () {
    return this._data
  };
  var propsDef = {};
  propsDef.get = function () {
    return this._props
  };
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    };
    propsDef.set = function () {
      warn("$props is readonly.", this);
    };
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);
  Object.defineProperty(Vue.prototype, '$props', propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    // situation 1 :$watch('a.b.c', function (newVal, oldVal) {},{deep:true})
    // situation 2 :$watch('a.b.c', {handler:function (newVal, oldVal) {}，deep:true}) 
    if (isPlainObject(cb)) { // 如果传入的cb不是function而是严格对象的话 就扔到 createWatcher()去做一次标准化 做完还会回到这个方法 就像第二种方法
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {};
    options.user = true; // 标志当前是user-watcher
    // 直接为当前的 expOrFn 去创建一个watcher
    var watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) { // 判断当前immediate传了没  传了就立即执行一次回调函数 newVal没传 仅仅传入初始化的val
      try {
        cb.call(vm, watcher.value);
      } catch (error) {
        handleError(error, vm, ("callback for immediate watcher \"" + (watcher.expression) + "\""));
      }
    }
    return function unwatchFn() { // 返回一个关闭watcher的方法
      watcher.teardown();
    }
  };
}

/*  */

var uid$3 = 0;
// 梦开始的地方 初始化vm实例
function initMixin(Vue) {
  Vue.prototype._init = function (options) { // new Vue(opts)
    var vm = this;
    // a uid
    vm._uid = uid$3++;

    var startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = "vue-perf-start:" + (vm._uid);
      endTag = "vue-perf-end:" + (vm._uid);
      mark(startTag);
    }

    // a flag to avoid this being observed 避免被观察
    vm._isVue = true;

    // merge options
    /**
     * 对于 options 的合并有 2 种方式，
     * 1.内部子组件初始化过程通过 initInternalComponent 方式
     * 2.外部初始化 Vue 通过 mergeOptions 
     * 1比2的过程要快，合并完的结果保留在 vm.$options 中。
     * 
     * 
     *  纵观一些库、框架的设计几乎都是类似的，自身定义了一些默认配置，同时又可以在初始化阶段传入一些定义配置，
     * 然后去 merge 默认配置，来达到定制化不同需求的目的。
     * 在 Vue 的场景下，会对 merge 的过程做一些精细化控制
     */
    if (options && options._isComponent) { // 初始化组件opts
      // 优化内部组件实例化，因为动态选项合并非常慢，并且没有任何内部组件opts需要特殊处理。
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 初始化内部组件 传入组件的vm 和 opts
      initInternalComponent(vm, options);
      /**
      * 合并后的 opts
      * vm.$options = {
         parent: Vue ,
         propsData: undefined,
         _componentTag: undefined,
         _parentVnode: VNode,
         _renderChildren:undefined,
         __proto__: {
           components: { },
           directives: { },
           filters: { },
           _base: function Vue(options) {
               //...
           },
           _Ctor: {},
           created: [
             function created() {
               console.log('parent created')
             }, function created() {
               console.log('child created')
             }
           ],
           mounted: [
             function mounted() {
               console.log('child mounted')
             }
           ],
           data() {
             return {
               msg: 'Hello Vue'
             }
           },
           template: '<div>{{msg}}</div>'
         }
       }
      */
    } else { // 外部调用 new Vue(opts)
      vm.$options = mergeOptions( // 不同字段合并策略不同 把构造器上的options拿过来进行merge操作
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
      /**
       * 合并后的opts
       * vm.$options = {
          components: { },
          created: [
            function created() {
              console.log('parent created')
            }
          ],
          directives: { },
          filters: { },
          _base: function Vue(options) {
            // ...
          },
          el: "#app",
          render: function (h) {
            //...
          }
        }
       * 
       */

    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm);
    } else {
      vm._renderProxy = vm; // 生产环境下渲染代理就是vm本身
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm); //初始化生命周期， 
    initEvents(vm); // 初始化事件中心
    initRender(vm); //初始化渲染，
    // 可以看到 beforeCreate 和 created 的钩子调用是在 initState 的前后，initState 的作用是初始化 props、data、methods、watch、computed 等属性
    // 那么显然 beforeCreate 的钩子函数中就不能获取到 props、data 中定义的值，也不能调用 methods 中定义的函数。
    // created 钩子是最先可以使用provide和props data methods computed中的属性的钩子 
    // 如果需要做的操作不需要这些数据 就可以直接在beforeCreated中去执行 比如说不带这些参数的接口啊 获取sessonStorage中的数据啊 等等方式
    // created和beforeCreate 钩子调用过程中都还没有执行$mount 既没有vnode也米有dom 
    // 所以也不能够访问 DOM， vue-router 和 vuex 都混合了 beforeCreate 钩子函数。
    callHook(vm, 'beforeCreate');
    initInjections(vm); // resolve injections before data/props
    initState(vm); // 初始化 data、props、computed、watcher 
    initProvide(vm); // resolve provide after data/props
    callHook(vm, 'created');

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      // 除了初始化 一般都是undefined 
      // 在初始化的最后，检测到如果有 el 属性，则调用 vm.$mount 方法挂载 vm，挂载的目标就是把模板渲染成最终的 DOM， 
      vm.$mount(vm.$options.el);
    }
  };
}

/**
 * initInternalComponent主要做了两件事情： 
 * 1.组件$options原型指到构造器原型上去，可以直接访问属性
 * 2.把组件依赖于父组件的props、listeners也挂载到options上，方便子组件调用。
 * 
 */
function initInternalComponent(vm, options) { // 组件vm 及组件特异性的opts
  // vue 在初始化组件的时候会首先得到组件的vnode 这个过程中会去创建组件的Ctor
  // 取到组件Ctor的opts 这个opts是 Vue 构造器和组件构造器(Vue.extend(opts)传入)的opts合并后的opts 
  // 然后吧组件Ctor的opts 挂到vm.$options.__proto__ （原型链继承）
  var opts = vm.$options = Object.create(vm.constructor.options); // 直接把构造器的options继承过来
  // doing this because it's faster than dynamic enumeration. 这样做是因为它比动态枚举快。


  // 假设<cpn :name="zs" @hel-lo="hello"/>
  // vm.$vnode（_parentVnode）是未经过 _render 函数处理的 vnode， 
  // vm._vnode 是经过 render处理过的，
  var parentVnode = options._parentVnode;
  opts.parent = options.parent; // 父组件vue实例 parent就是组件的根实例，
  opts._parentVnode = parentVnode; // 父组件vnode _parentVnode是<cpn/>生成的一个Vnode对象。 是未经过渲染的站位节点的vnode对象

  var vnodeComponentOptions = parentVnode.componentOptions; // 把父组件里的vnode上的四个属性挂载到我们的$options上，提供给子组件去使用

  opts.propsData = vnodeComponentOptions.propsData; // 还是用那个例子来说，propsData就是根据:name="zs"生成的，
  opts._parentListeners = vnodeComponentOptions.listeners; // 而_parentListeners就是根据 @hel-lo="hello" 生成的，值是hello这个定义在父组件中的方法 是用户自定义的方法。
  opts._renderChildren = vnodeComponentOptions.children; // 这里的renderchildren会作为$slots传入到子组件上
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) { // 如果传入了render 就赋值
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}
//获取最新的构造函数，以防在创建组件构造函数后应用全局mixin
function resolveConstructorOptions(Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = resolveConstructorOptions(Ctor.super);
    var cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) { 
      // 判断当前构造器的父构造器(父构造器就是创建组件Ctor是赋值上去的)options是否发生了变化
      // 如果没变说明当前构造器已经是最新的了 否则检测更新成最新的
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}

// 获取改变了的opts
function resolveModifiedOptions(Ctor) {
  var modified;
  var latest = Ctor.options;
  var sealed = Ctor.sealedOptions;
  for (var key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) {
        modified = {};
      }
      modified[key] = latest[key];
    }
  }
  return modified
}

function Vue(options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}
initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

/*  */

// 初始化插件安装方法 会传入vue构造器
function initUse(Vue) {
  Vue.use = function (plugin) {
    var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    var args = toArray(arguments, 1); // 保存后续参数
    args.unshift(this);//传入构造器
    if (typeof plugin.install === 'function') { // 支持传入对象
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') { // 支持传入方法
      plugin.apply(null, args);
    }
    installedPlugins.push(plugin);
    return this
  };
}

/*  */
// 初始化mixin
function initMixin$1(Vue) {
  Vue.mixin = function (mixin) { // 通过 mergeOption s往Vue去扩展一些东西
    // 合并mixin上的属性到Vue.options上去，之后再去new Vue时候会再次将已通过Vue.mixin扩充过得Vue构造器的opts与用户传入的options进行mergeOptions合并到实例vm.$options
    this.options = mergeOptions(this.options, mixin);
    return this
  };
}

/*  */
// 初始化构造器
function initExtend(Vue) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   * 创建组件构造器 由于创建子组件vm
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    var name = extendOptions.name || Super.options.name;
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name);
    }

    var Sub = function VueComponent(options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions( // 将大Vue的opts合并到子构造器的opts上去
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps$1(Sub);
    }
    if (Sub.options.computed) {
      initComputed$1(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
}

// 代理_props
function initProps$1(Comp) {
  var props = Comp.options.props;
  for (var key in props) {
    proxy(Comp.prototype, "_props", key);
  }
}

// 父组件提前定义计算属性并代理到圆形上边
function initComputed$1(Comp) {
  var computed = Comp.options.computed;
  for (var key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}

/*  */

// 为Vue.options添加一些静态资源 包括:component directive filter
function initAssetRegisters(Vue) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(function (type) {
    Vue[type] = function (
      id,
      definition
    ) {
      if (!definition) { // 如果第二个组件构造器没有传 就直接从Vue.options中去找到当前组件构造器 如果没有就是undefined
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id);
        }
        if (type === 'component' && isPlainObject(definition)) { // Vue.component()
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition); // 通过Vue.extend()去构建一个当前{}的组件构造器 把Vue的全局组件继承过来
        }
        if (type === 'directive' && typeof definition === 'function') { // Vue.directive
          definition = {
            bind: definition,
            update: definition
          };
        }
        // 全局注册
        this.options[type + 's'][id] = definition; // 注意 this指向Vue,实际上全局注册的过滤器和组件和指令都是在Vue.options中进行全局拓展
        return definition
      }
    };
  });
}

/*  */



function getComponentName(opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}

// 根据用户传入的字符串或是正则表达式或是数组 分情况进行判断
function matches(pattern, name) { 
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

// 供内置组件keepalive使用
// 用于处理不需要缓存的组件
function pruneCache(keepAliveInstance, filter) {
  var cache = keepAliveInstance.cache;
  var keys = keepAliveInstance.keys;
  var _vnode = keepAliveInstance._vnode;
  for (var key in cache) {
    var cachedNode = cache[key];
    if (cachedNode) {
      var name = getComponentName(cachedNode.componentOptions);
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
}

// 销毁不必要的实例
function pruneCacheEntry(
  cache,
  key,
  keys,
  current
) {
  var cached$$1 = cache[key];
  if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
    cached$$1.componentInstance.$destroy();
  }
  cache[key] = null;
  remove(keys, key);
}

var patternTypes = [String, RegExp, Array];

// 内置组件 keepalive
var KeepAlive = {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes, // 包含的缓存组件
    exclude: patternTypes, // 不需要缓存的组件
    max: [String, Number] // 
  },

  created: function created() { 
    this.cache = Object.create(null); // 缓存vnode
    this.keys = []; // 保留缓存对应的key值
  },

  destroyed: function destroyed() { // 递归清除所有实例
    for (var key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys);
    }
  },

  mounted: function mounted() {
    var this$1 = this;

    // 侦听props的变化并作出对应的缓存清除
    this.$watch('include', function (val) {
      pruneCache(this$1, function (name) {
        return matches(val, name);
      });
    });
    this.$watch('exclude', function (val) {
      pruneCache(this$1, function (name) {
        return !matches(val, name);
      });
    });
  },

  render: function render() {
    var slot = this.$slots.default; // 当前默认插槽内容
    var vnode = getFirstComponentChild(slot); // 拿到插槽中第一个组件(占位)节点
    var componentOptions = vnode && vnode.componentOptions; // 拿到组件相关配置
    if (componentOptions) {
      // check pattern
      var name = getComponentName(componentOptions); // 获取组件名称 name或者是tag名字
      var ref = this;
      var include = ref.include;
      var exclude = ref.exclude; // 拿到需要包含和需要排除的组件
      if (
        // not included 不再included中
        (include && (!name || !matches(include, name))) ||
        // excluded 或者在excluded中 
        (exclude && name && matches(exclude, name))
      ) {
        return vnode // 两种情况下是不需要缓存 直接返回vnode
      }

      var ref$1 = this;
      var cache = ref$1.cache;
      var keys = ref$1.keys;
      var key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ?
        componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '') :
        vnode.key;
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance;
        // make current key freshest
        remove(keys, key); // 每次都把最新使用的key放到最活跃的地方 也就是 数组的最后一位 反之  数组的第一位是最不活跃的 也是当超出缓存个数后最先删除的元素
        keys.push(key);
      } else {
        cache[key] = vnode;
        keys.push(key);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode); // 删除掉最不常访问元素 也是最经典的缓存管理策略
        }
      }

      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0])
  }
};

var builtInComponents = {
  KeepAlive: KeepAlive
};

/*  */

// 初始化全局api
function initGlobalAPI(Vue) {
  // config
  var configDef = {};
  configDef.get = function () {
    return config;
  };
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }
  Object.defineProperty(Vue, 'config', configDef); // 提供全局访问的config 用以配置Vue.config

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn: warn,
    extend: extend,
    mergeOptions: mergeOptions,
    defineReactive: defineReactive$$1
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  // 2.6 explicit observable API
  Vue.observable = function (obj) {
    observe(obj);
    return obj
  };

  Vue.options = Object.create(null);
  ASSET_TYPES.forEach(function (type) {
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  // 用于标识“基本”构造函数，以便在Weex的多实例场景中扩展所有纯对象组件。
  Vue.options._base = Vue;

  // 这里就把内置组件 keepalive注册到了function Vue的opts上去  供全局调用
  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin$1(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}

initGlobalAPI(Vue);

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
});

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get: function get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
});

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
});

Vue.version = '2.6.11';

/*  */

// these are reserved for web because they are directly compiled away
// during template compilation
var isReservedAttr = makeMap('style,class');

// attributes that should be using props for binding
var acceptValue = makeMap('input,textarea,option,select,progress');
var mustUseProp = function (tag, type, attr) {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
};

var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

var isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only');

var convertEnumeratedValue = function (key, value) {
  return isFalsyAttrValue(value) || value === 'false' ?
    'false'
    // allow arbitrary string value for contenteditable
    :
    key === 'contenteditable' && isValidContentEditableValue(value) ?
    value :
    'true'
};

var isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
);

var xlinkNS = 'http://www.w3.org/1999/xlink';

var isXlink = function (name) {
  return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
};

var getXlinkProp = function (name) {
  return isXlink(name) ? name.slice(6, name.length) : ''
};

var isFalsyAttrValue = function (val) {
  return val == null || val === false
};

/*  */

function genClassForVnode(vnode) {
  var data = vnode.data;
  var parentNode = vnode;
  var childNode = vnode;
  while (isDef(childNode.componentInstance)) {
    childNode = childNode.componentInstance._vnode;
    if (childNode && childNode.data) {
      data = mergeClassData(childNode.data, data);
    }
  }
  while (isDef(parentNode = parentNode.parent)) {
    if (parentNode && parentNode.data) {
      data = mergeClassData(data, parentNode.data);
    }
  }
  return renderClass(data.staticClass, data.class)
}

function mergeClassData(child, parent) {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: isDef(child.class) ? [child.class, parent.class] : parent.class
  }
}

function renderClass(
  staticClass,
  dynamicClass
) {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

function concat(a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function stringifyClass(value) {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  /* istanbul ignore next */
  return ''
}

function stringifyArray(value) {
  var res = '';
  var stringified;
  for (var i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) {
        res += ' ';
      }
      res += stringified;
    }
  }
  return res
}

function stringifyObject(value) {
  var res = '';
  for (var key in value) {
    if (value[key]) {
      if (res) {
        res += ' ';
      }
      res += key;
    }
  }
  return res
}

/*  */

var namespaceMap = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};

var isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template,blockquote,iframe,tfoot'
);

// this map is intentionally selective, only covering SVG elements that may
// contain child elements.
var isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
);

var isPreTag = function (tag) {
  return tag === 'pre';
};

var isReservedTag = function (tag) {
  return isHTMLTag(tag) || isSVG(tag)
};

function getTagNamespace(tag) {
  if (isSVG(tag)) {
    return 'svg'
  }
  // basic support for MathML
  // note it doesn't support other MathML elements being component roots
  if (tag === 'math') {
    return 'math'
  }
}

var unknownElementCache = Object.create(null);

function isUnknownElement(tag) {
  /* istanbul ignore if */
  if (!inBrowser) {
    return true
  }
  if (isReservedTag(tag)) {
    return false
  }
  tag = tag.toLowerCase();
  /* istanbul ignore if */
  if (unknownElementCache[tag] != null) {
    return unknownElementCache[tag]
  }
  var el = document.createElement(tag);
  if (tag.indexOf('-') > -1) {
    // http://stackoverflow.com/a/28210364/1070244
    return (unknownElementCache[tag] = (
      el.constructor === window.HTMLUnknownElement ||
      el.constructor === window.HTMLElement
    ))
  } else {
    return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
  }
}

var isTextInputType = makeMap('text,number,password,search,email,tel,url');

/*  */

/**
 * Query an element selector if it's not an element already.
 */
function query(el) {
  if (typeof el === 'string') {
    var selected = document.querySelector(el);
    if (!selected) {
      process.env.NODE_ENV !== 'production' && warn(
        'Cannot find element: ' + el
      );
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}

/*  */

function createElement$1(tagName, vnode) {
  var elm = document.createElement(tagName);
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
    elm.setAttribute('multiple', 'multiple');
  }
  return elm
}

function createElementNS(namespace, tagName) {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

function createTextNode(text) {
  return document.createTextNode(text)
}

function createComment(text) {
  return document.createComment(text)
}

function insertBefore(parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode);
}

function removeChild(node, child) {
  node.removeChild(child);
}

function appendChild(node, child) {
  node.appendChild(child);
}

function parentNode(node) {
  return node.parentNode
}

function nextSibling(node) {
  return node.nextSibling
}

function tagName(node) {
  return node.tagName
}

function setTextContent(node, text) {
  node.textContent = text;
}

function setStyleScope(node, scopeId) {
  node.setAttribute(scopeId, '');
}

var nodeOps = /*#__PURE__*/ Object.freeze({
  createElement: createElement$1,
  createElementNS: createElementNS,
  createTextNode: createTextNode,
  createComment: createComment,
  insertBefore: insertBefore,
  removeChild: removeChild,
  appendChild: appendChild,
  parentNode: parentNode,
  nextSibling: nextSibling,
  tagName: tagName,
  setTextContent: setTextContent,
  setStyleScope: setStyleScope
});

/*  */

var ref = {
  create: function create(_, vnode) {
    registerRef(vnode);
  },
  update: function update(oldVnode, vnode) {
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true);
      registerRef(vnode);
    }
  },
  destroy: function destroy(vnode) {
    registerRef(vnode, true);
  }
};

/**
 * 处理组件中的$ref  更新ref数组
 * @param {*} vnode 
 * @param {*} isRemoval 
 */
function registerRef(vnode, isRemoval) {
  var key = vnode.data.ref;
  if (!isDef(key)) {
    return
  }

  var vm = vnode.context; // 实际上就是父级的vm
  var ref = vnode.componentInstance || vnode.elm;
  var refs = vm.$refs;
  if (isRemoval) { // 判断如果是在删除val 就直接遍历去置空
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) { // 对于v-for 作为数组处理
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref; // 否则直接赋值
    }
  }
}

/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/paldepind/snabbdom/blob/master/LICENSE
 *
 * modified by Evan You (@yyx990803)
 *
 * Not type-checking this because this file is perf-critical and the cost
 * of making flow understand it is not worth it.
 */

var emptyNode = new VNode('', {}, []);

// patch的各个时机调用的钩子函数
var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

/**
 * 来判断两个vnode是不是一种vnode
 * 1.首先判断key是不是想等 必要条件
 * 2.1判断tag是不是相同 是不是都是或者都不是注释节点 判断两个vnode都有vnodedata 如果两个节点都是input 判断是不是同为文字输入节点或者input.type相等
 * 2.2判断如果是异步占位节点vnode 判断异步工厂函数是不是相同
 * 
 * 满足 1+2.1 || 1+2.2  就代表是相同的vnode  
 * @param {*} a 
 * @param {*} b 
 */
function sameVnode(a, b) {
  return (
    a.key === b.key && ( // 这里的key 就是v-for的key 如果都是undefined 或者 值相等 （primitive） 对象值将永远不相等
      (
        a.tag === b.tag && // tag isComment a和b的data都定义了 
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b) // 
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}

function sameInputType(a, b) {
  if (a.tag !== 'input') {
    return true
  }
  var i;
  var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
  var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
  return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}

/**
 * 构建一个hash表
 * 当前vnode的key作为键
 * 当前vnode做值
 * @param {*} children vnode列表
 * @param {*} beginIdx 
 * @param {*} endIdx 
 */
function createKeyToOldIdx(children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) {
      map[key] = i;
    }
  }
  return map
}

// 800 行去创建patch方法
function createPatchFunction(backend) {
  var i, j;
  var cbs = {};

  var modules = backend.modules;
  var nodeOps = backend.nodeOps;

  /**
   * ['create', 'activate', 'update', 'remove', 'destroy']
   */
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      // 模块包括  [attrs,klass,events,domProps,style,transition,ref,directive];
      // 判断当前modules有没有定义当前hook modules对应dom-patch的每个模块 
      if (isDef(modules[j][hooks[i]])) { 
        // 如果有的话 就把当前模块的钩子添加到对应的时机中去 
        // 这里的push会把不同modules不同类型的方法添加到一个数组中去，到对应的时机统一执行
        // 就比如transition和klass 都有create 所以在执行create钩子的时候这俩钩子会依次执行
        cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
  }

  function emptyNodeAt(elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  // 在listener都执行完毕之后 删除dom节点  用在transition中是在动画结束之后执行删除节点操作
  function createRmCb(childElm, listeners) {
    function remove$$1() {
      if (--remove$$1.listeners === 0) { // 每次执行都先--
        removeNode(childElm);
      }
    }
    remove$$1.listeners = listeners;
    return remove$$1
  }

  function removeNode(el) {
    var parent = nodeOps.parentNode(el);
    // element may have already been removed due to v-html / v-text
    if (isDef(parent)) {
      nodeOps.removeChild(parent, el);
    }
  }

  function isUnknownElement$$1(vnode, inVPre) {
    return (
      !inVPre &&
      !vnode.ns &&
      !(
        config.ignoredElements.length &&
        config.ignoredElements.some(function (ignore) {
          return isRegExp(ignore) ?
            ignore.test(vnode.tag) :
            ignore === vnode.tag
        })
      ) &&
      config.isUnknownElement(vnode.tag)
    )
  }

  var creatingElmInVPre = 0;

  /**
   * createElm 的作用是通过虚拟节点创建真实的 DOM 并插入到它的父节点中。
   * 在整个patch过程中 并不是所有的vnode都会吊用这个方法，共分为两种场景
   * 1.在初始化组件的时候或者新老vnode不相同情况下会进入这个方法
   * 2.如果新老节点是samevnode  就不会创建新的elm而是去通过patch进行children的选择性的createElm 性能更佳
   * 也就是说 在patch的过程中并没有问当前组件创建新的vm实例 拿到的vm还是老的vm
   * @param {*} vnode 
   * @param {*} insertedVnodeQueue 
   * @param {*} parentElm 
   * @param {*} refElm 
   * @param {*} nested 
   * @param {*} ownerArray 
   * @param {*} index 
   */
  function createElm(
    vnode, // 当前组件的vnode
    insertedVnodeQueue, // 当前vnode待插入的子节点队列 先子后父
    parentElm, // 需要插入的目标位置的父节点
    refElm, // 需要插入的目标位置的兄弟节点
    nested, // 如果是creatChildren 调用的创建组件dom为true
    ownerArray, // 父组件中持有的子组件的引用数组 
    index // 当前vnode对应的index with ownerArray
  ) {
    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // This vnode was used in a previous render!
      // now it's used as a new node, overwriting its elm would cause
      // potential patch errors down the road when it's used as an insertion
      // reference node. Instead, we clone the node on-demand before creating
      // associated DOM element for it.
      // 这个vnode是在以前的渲染中使用的！
      // 现在它被用作一个新节点，当它被用作插入引用节点时，覆盖它的elm将导致潜在的补丁错误。
      // 相反，我们先按需克隆节点，然后再为其创建相关的DOM元素。
      vnode = ownerArray[index] = cloneVNode(vnode);
    }

    vnode.isRootInsert = !nested; // for transition enter check
    // createComponent 方法目的是尝试创建子组件
    // 这里会判断 createComponent(vnode, insertedVnodeQueue, parentElm, refElm) 的返回值，如果为 true 则直接结束，
    // 注意，这里传入的 vnode 是组件渲染的 vnode，也就是vm._vnode，
    // 如果组件的根节点是个普通元素，那么 vm._vnode 也是普通的 vnode，
    // 接下来的过程就是一个循环的过程了，先创建一个父节点占位符，然后再遍历所有子 VNode 递归调用 createElm，在遍历的过程中，
    // 如果遇到子 VNode 是一个组件的 VNode，这样通过一个递归的方式就可以完整地构建了整个组件树。
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (isDef(tag)) { //   // 接下来判断 vnode 是否包含 tag，如果包含，
      if (process.env.NODE_ENV !== 'production') { // 简单对 tag 的合法性在非生产环境下做校验，看是否是一个合法标签；
        if (data && data.pre) {
          creatingElmInVPre++;
        }
        if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
          warn(
            'Unknown custom element: <' + tag + '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
            vnode.context
          );
        }
      }
      //然后再去调用平台 DOM 的操作去创建一个占位符元素。
      vnode.elm = vnode.ns ?
        nodeOps.createElementNS(vnode.ns, tag) :
        nodeOps.createElement(tag, vnode); // 创建dom元素
      setScope(vnode);

      /* istanbul ignore if */
      { // 这里这个奇怪的{} 也是因为打包工具导致的
        // 创建子节点 会循环每个子节点去调用createElm()
        // insertedVnodeQueue 这个数组会将所有层级的子组件的vnode都拿到!
        createChildren(vnode, children, insertedVnodeQueue); // 创建完当前vnode对应的所有dom元素
        if (isDef(data)) {
          // 在insert之前 接着再调用 invokeCreateHooks 方法执行所有的 vnode-create 的钩子并把 vnode push 到 组件根vnode insertedVnodeQueue 中。
          invokeCreateHooks(vnode, insertedVnodeQueue); // 执行各种钩子 更新attr 之类的
        }
        // 最后调用 insert 方法把 DOM 插入到父节点中，因为是递归调用，
        // 子元素会优先调用 insert，所以整个 vnode 树节点的插入顺序是先子后父。
        insert(parentElm, vnode.elm, refElm); // 自底向上的插入真实dom节点!
      }

      if (process.env.NODE_ENV !== 'production' && data && data.pre) {
        creatingElmInVPre--;
      }
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }
  }

  // 创建组件vm
  function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
    var i = vnode.data; // 组件类型的vnode 才会有vnodedata 接着去初始化组件
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive; //  keep-alive第一个children的data.keepAlive
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */ ); // 这里调用了组件的init方法 会进入下一个组件创建的循环
      }
      // 在调用init hook之后，如果vnode是一个子组件，那么它应该已经创建了一个子实例并挂载了它。
      // 子组件还设置了占位符vnode的elm。在这种情况下，只需返回元素就可以了。
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) { // 判断该当前组建的vm实例有么有 如果当前组件创建完毕 肯定是有的
        initComponent(vnode, insertedVnodeQueue); // 初始化 并传入当前vnode需要插入的vnode列表
        insert(parentElm, vnode.elm, refElm); // dom 插入
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }

  /**
   * 
   * @param {*} vnode 
   * @param {*} insertedVnodeQueue 当前根组件需要插入的组件数组 通过不断递归去把子vnode添加到数组中去
   */
  function initComponent(vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
      vnode.data.pendingInsert = null;
    }
    vnode.elm = vnode.componentInstance.$el; // $el赋值给elm
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
      setScope(vnode);
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode);
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode);
    }
  }

  function reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
    var i;
    // hack for #4339: a reactivated component with inner transition
    // does not trigger because the inner node's created hooks are not called
    // again. It's not ideal to involve module-specific logic in here but
    // there doesn't seem to be a better way to do it.
    var innerNode = vnode; // 以下内容处理keep-alive过渡的问题
    while (innerNode.componentInstance) {
      innerNode = innerNode.componentInstance._vnode;
      if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
        for (i = 0; i < cbs.activate.length; ++i) {
          cbs.activate[i](emptyNode, innerNode);
        }
        insertedVnodeQueue.push(innerNode);
        break
      }
    }
    // unlike a newly created component,
    // a reactivated keep-alive component doesn't insert itself
    insert(parentElm, vnode.elm, refElm);
  }

  // 插入到dom中去 
  function insert(parent, elm, ref$$1) {
    if (isDef(parent)) {
      if (isDef(ref$$1)) {
        if (nodeOps.parentNode(ref$$1) === parent) {
          nodeOps.insertBefore(parent, elm, ref$$1);
        }
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  // createChildren遍历子vnode节点，递归调用 createElm，
  // 这里要注意的一点是在遍历过程中会把 vnode.elm 作为父容器的 DOM 节点占位符传入。
  function createChildren(vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      if (process.env.NODE_ENV !== 'production') {
        checkDuplicateKeys(children);
      }
      for (var i = 0; i < children.length; ++i) {
        // 循环创建子组件 ! 核心!
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
    }
  }

  /**
   * 判断当前的组建是不是可挂载的
   * 1.首先判断当前的vnode存不存在componentInstance 如果存在 就代表当前vnode是一个组建的占位vnode
   * 2.vnode继续赋值为当前组建的vm对应的渲染vnode  =>_vnode 然后继续判断当前vnode是不是还拥有vm 知道当前vnode是一个渲染vnode render-vnode是没有componentsInstance
   * 渲染的vnode是可以patch的 而占位节点是不能patch的
   * @param {*} vnode 
   */
  function isPatchable(vnode) {
    while (vnode.componentInstance) { // 组件占位vnode拥有componentInstance 如果是组件的占位节点vnode 进行循环
      vnode = vnode.componentInstance._vnode; // 找到组建的渲染vnode
    }
    return isDef(vnode.tag) // 判断当前渲染vnode是不是又tag  如果又 当前vnode就是可挂载的
  }

  /**
   * 依次执行创建组件的各个必要的钩子函数 处理 class style listender ref directive等等属性
   * @param {*} vnode 
   * @param {*} insertedVnodeQueue 
   */
  function invokeCreateHooks(vnode, insertedVnodeQueue) {
    for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
      cbs.create[i$1](emptyNode, vnode); // 执行当前模块对应的钩子
    }
    i = vnode.data.hook; // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) {
        i.create(emptyNode, vnode); // 执行当前vnode的钩子
      }
      if (isDef(i.insert)) {
        insertedVnodeQueue.push(vnode);
      }
    }
  }

  // set scope id attribute for scoped CSS.
  // this is implemented as a special case to avoid the overhead
  // of going through the normal attribute patching process.
  //为scoped-css设置作用域id属性。这是作为一种特殊情况来实现的，以避免执行常规属性 patch 过程的开销。
  function setScope(vnode) {
    var i;
    if (isDef(i = vnode.fnScopeId)) {
      nodeOps.setStyleScope(vnode.elm, i);
    } else {
      var ancestor = vnode; // ancestor 祖先
      while (ancestor) {
        if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
          nodeOps.setStyleScope(vnode.elm, i);
        }
        ancestor = ancestor.parent;
      }
    }
    // for slot content they should also get the scopeId from the host instance.
    if (isDef(i = activeInstance) &&
      i !== vnode.context &&
      i !== vnode.fnContext &&
      isDef(i = i.$options._scopeId)
    ) {
      nodeOps.setStyleScope(vnode.elm, i);
    }
  }

  function addVnodes(parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
    }
  }

  /**
   * 递归调用vnode.data上边的destroy钩子函数
   * @param {*} vnode 
   */
  function invokeDestroyHook(vnode) {
    var i, j;
    var data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) {
        i(vnode);
      }
      for (i = 0; i < cbs.destroy.length; ++i) {
        cbs.destroy[i](vnode);
      }
    }
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.length; ++j) {
        invokeDestroyHook(vnode.children[j]);
      }
    }
  }

  /**
   * 删除vnode
   * @param {*} vnodes 要删除的vnode数组
   * @param {*} startIdx 开始
   * @param {*} endIdx 结尾
   */
  function removeVnodes(vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var ch = vnodes[startIdx]; // 依次遍历从start-end的vnode
      if (isDef(ch)) {
        if (isDef(ch.tag)) { // 如果vnode存在且tag存在 说明是一个组建的vnode
          removeAndInvokeRemoveHook(ch);
          invokeDestroyHook(ch);
        } else { // Text node // 如果不具备tag 就说明是textnode 直接执行removeNode
          removeNode(ch.elm);
        }
      }
    }
  }

  /**
   * 删除dom元素并执行删除钩子
   * @param {*} vnode 
   * @param {*} rm 
   */
  function removeAndInvokeRemoveHook(vnode, rm) {
    if (isDef(rm) || isDef(vnode.data)) {
      var i;
      var listeners = cbs.remove.length + 1;
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners;
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners);
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm);
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm);
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm);
      } else {
        rm();
      }
    } else {
      removeNode(vnode.elm);
    }
  }

  function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    var oldStartIdx = 0;
    var newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    var canMove = !removeOnly;

    if (process.env.NODE_ENV !== 'production') {
      checkDuplicateKeys(newCh);
    }

    /**
     * 
     * 整个diff过程是一个不断while循环的过程 在循环过程中通过不同的case进行判断 
     * 通过不同情况的判断选择出最优的节点移动方式
     * 每经过一个while循环 old/new start idx++，相反的 old/new end idx --
     * 当oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx的情况下会不断的进行while循环进行diff操作节点位置操作
     * 在整个diff过程中 是同级比较的 没有跨层级进行diff 比较的vnode的父节点是同一个。
     
          +-->                                       <--+

      old start idx                                old end idx
          +----+         +----+         +----+       +----+
          |    |         |    |         |    |       |    |
          |    |         |    |         |    |       |    |
          +----+         +----+         +----+       +----+


          +----+         +----+         +----+       +----+       +----+
          |    |         |    |         |    |       |    |       |    |
          |    |         |    |         |    |       |    |       |    |
          +----+         +----+         +----+       +----+       +----+
      new start idx                                             new end idx

           +-->                                                    <--+

     */
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {   // case 1 ： 旧的列表中 oldstartvnode不存在 直接 ++ 后移一位
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) { // case 2 : 旧的列表中 oldendvnode不存在 直接 -- 前移一位
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) { // case 3 ：判断新旧start vnode是不是相同的 如果是相同的 直接对这两个相同的vnode进行陈层的patchVnode操作
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) { // case 4 ： 如果 旧end 和 新end相同 ，对这两个节点进行深度的patchVnode操作
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // case 5 :如果旧start和新end是相同的节点 第一步对这两个节点进行深层的patchvnode， 把子节点都patch完毕，第二步把旧start插入到旧end后边 也就是和新vnode保持一致
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // case 6 ：如果旧end和新start相同 第一步：深层patch 第二步：把旧end添加到旧start前边
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else { // case 7 ： 在不满足上述情况下 又分为2种子情况
        if (isUndef(oldKeyToIdx)) { // 在oldkeytoidx不存在的情况下去构建一个哈希表
          oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        }
        idxInOld = isDef(newStartVnode.key) ? // 判断当前新start的key存不存在 
          oldKeyToIdx[newStartVnode.key] ://  如果存在 就去旧哈希表中寻找
          findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx); // 否则通过samenode去查找
        if (isUndef(idxInOld)) { // 在通过寻找过后 没有在旧的vnode列表中查找到新的vnode节点 迫不得已 去创建dom元素并插入到到dom树中
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
        } else {
          vnodeToMove = oldCh[idxInOld]; // 拿到需要移动的vnode节点
          if (sameVnode(vnodeToMove, newStartVnode)) { // 判断是不是相同的vnode节点 （不存在同为undefined的情况 因为已经在find的过程中对同为undefined的情况进行了判断 这里针对两个vnode虽然key相同 但实际上不是严格相同的vnode进行筛选）
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
            oldCh[idxInOld] = undefined;
            // 在每次插入的过程中都是在通过旧vnode的元素进行定位和插入 以保证最小改动 这里直接把当前找到的vnode插入到旧start（其实不一定是start 因为idx一直在变）前边
            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
          } else {
            //虽然通过key找到了旧vnode 数组中对应的当前元素 但是这两个vnode并不是严格相等的 所以直接按照未找到当前节点的策略进行 去创建一个新的节点 无法通过节点的移动去提高性能
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
          }
        }
        newStartVnode = newCh[++newStartIdx]; //当前新节点已经插入了 ++ 
      }
    }
    if (oldStartIdx > oldEndIdx) { // 这个case下 代表 旧节点比新节点少 就需要添加新节点进去
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm; // 确定插入位置
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue); // 遍历插入
    } else if (newStartIdx > newEndIdx) { // 代表新节点比旧节点少 去删除就节点中不想要的节点
      removeVnodes(oldCh, oldStartIdx, oldEndIdx);
    }
  }

  /**
   * 检查当前子vnode数组中的元素绑定的key值是不是含有重复的 以免引起部分错误  key作为唯一表示一个节点的标志 是不能重复的 否则将造成
   * @param {*} children 子vnode数组
   */
  function checkDuplicateKeys(children) {
    var seenKeys = {};
    for (var i = 0; i < children.length; i++) {
      var vnode = children[i];
      var key = vnode.key;
      if (isDef(key)) {
        if (seenKeys[key]) {
          warn(
            ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
            vnode.context
          );
        } else {
          seenKeys[key] = true;
        }
      }
    }
  }

  /**
   * 通过samenode进行查找
   * 找到旧列表中匹配的的vnode节点
   * 主要是应对新旧vnode的key同时为undefined的情况
   * @param {*} node 
   * @param {*} oldCh 
   * @param {*} start 
   * @param {*} end 
   */
  function findIdxInOld(node, oldCh, start, end) {
    for (var i = start; i < end; i++) {
      var c = oldCh[i];
      if (isDef(c) && sameVnode(node, c)) {
        return i
      }
    }
  }

  /**
   * patch
   * @param {*} oldVnode 上次渲染的vnode
   * @param {*} vnode 当前vnode
   * @param {*} insertedVnodeQueue 待插入的vnode数组
   * @param {*} ownerArray 
   * @param {*} index 
   * @param {*} removeOnly 
   */
  function patchVnode(
    oldVnode, // 上次渲染的vnode
    vnode, // 当前组件的vnode
    insertedVnodeQueue, // 从子组件到父组件的vnode数组
    ownerArray,
    index,
    removeOnly
  ) {
    if (oldVnode === vnode) { // 严格相等直接返回
      return
    }

    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // clone reused vnode
      vnode = ownerArray[index] = cloneVNode(vnode);
    }

    var elm = vnode.elm = oldVnode.elm;

    // 判断是不是上次的vnode是不是异步组件占位节点vnode
    // 如果是 并且异步组件已经得到了 直接进行注水进行渲染
    // 如果异步组件还未得到 只是将当前占位符标志为true
    if (isTrue(oldVnode.isAsyncPlaceholder)) {
      if (isDef(vnode.asyncFactory.resolved)) {
        hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
      } else {
        vnode.isAsyncPlaceholder = true;
      }
      return
    }

    // reuse element for static trees.
    // note we only do this if the vnode is cloned -
    // if the new node is not cloned it means the render functions have been
    // reset by the hot-reload-api and we need to do a proper re-render.
    // 复用element 因为是静态的vnode 
    // 注意仅仅但vnode是克隆出来的时候才会进行这个操做
    if (isTrue(vnode.isStatic) &&
      isTrue(oldVnode.isStatic) &&
      vnode.key === oldVnode.key &&
      (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
      vnode.componentInstance = oldVnode.componentInstance;
      return
    }

    var i;
    var data = vnode.data;
    // 判断vnodedata是不是存在 去data上边取钩子函数并执行prepatch方法
    // 如果存在vnodedata 就说明当前patch的是一个组件的vnode 就需要去执行prepatch方法进行自组件的props更新之类的过程
    // 在将props的更新传递下去的过程就要出发子组件的render函数 继而重新渲染 再继续执行就将执行到子组件的patch方法 
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode);
    }

    var oldCh = oldVnode.children;
    var ch = vnode.children;
    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) {
        cbs.update[i](oldVnode, vnode);
      }
      if (isDef(i = data.hook) && isDef(i = i.update)) {
        i(oldVnode, vnode);
      }
    }
    if (isUndef(vnode.text)) { //如果当前vnode不是text节点
      if (isDef(oldCh) && isDef(ch)) { // 判断当前新老vnode是不是拥有children
        if (oldCh !== ch) { 
          // 如果新旧节点不同 就会更新children 最最核心的内容 是diff算法中最核心的部分
          // 会再次执行vnode的patch操作 是一个递归的规程。
          updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
        }
      } else if (isDef(ch)) { // 如果新的children存在 老的vnode没有children节点的情况
        if (process.env.NODE_ENV !== 'production') {
          checkDuplicateKeys(ch);
        }
        if (isDef(oldVnode.text)) { // 判断当前老节点是不是文本节点 如果是 把老节点文本清空
          nodeOps.setTextContent(elm, '');
        }
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue); // 添加节点到当前dom节点中去
      } else if (isDef(oldCh)) { // 如果只有老得节点没有新的节点 就要把老得vnode都删除掉就可以了。
        removeVnodes(oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) { // 如果既没有老得vnode也米有新的vnode 判断当前vnode是不是文本节点 就直接把当前文本置空 
        nodeOps.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) { // 如果是文本节点 查看当前节点的文本是不是变了 然后更新文本内容
      nodeOps.setTextContent(elm, vnode.text);
    }
    if (isDef(data)) { // 在当前vnodepatch完毕之后执行postpatch钩子
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) {
        i(oldVnode, vnode);
      }
    }
  }

  /**
   *  延迟组件根节点的插入钩子，在元素真正插入后调用它们
   * @param {*} vnode 
   * @param {*} queue 
   * @param {*} initial 
   */
  function invokeInsertHook(vnode, queue, initial) { 
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue;
    } else {
      for (var i = 0; i < queue.length; ++i) {
        // insertedVnodeQueue 的添加顺序是先子后父，所以对于同步渲染的子组件而言，mounted 钩子函数的执行顺序也是先子后父。
        queue[i].data.hook.insert(queue[i]);
      }
    }
  }

  var hydrationBailed = false;
  // list of modules that can skip create hook during hydration because they
  // are already rendered on the client or has no need for initialization
  // Note: style is excluded because it relies on initial clone for future
  // deep updates (#7063).
  var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

  // Note: this is a browser-only function so we can assume elms are DOM nodes.
  /**
   * 注水 异步组件渲染或者ssr 不太确定
   * @param {*} elm 
   * @param {*} vnode 
   * @param {*} insertedVnodeQueue 
   * @param {*} inVPre 
   */
  function hydrate(elm, vnode, insertedVnodeQueue, inVPre) {
    var i;
    var tag = vnode.tag;
    var data = vnode.data;
    var children = vnode.children;
    inVPre = inVPre || (data && data.pre);
    vnode.elm = elm;

    // 判读当前传入的节点如果是一个占位节点 就直接返回true
    if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
      vnode.isAsyncPlaceholder = true;
      return true
    }
    // assert node match
    if (process.env.NODE_ENV !== 'production') {
      if (!assertNodeMatch(elm, vnode, inVPre)) {
        return false
      }
    }
    // 判断传入的vnodedata  如果存在 去通过vnode去初始化组件
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) {
        i(vnode, true /* hydrating */ );
      }
      // 组件初始化完毕之后就会拥有componentsInstance属性 也就是vm
      // 再去初始化内部组件
      if (isDef(i = vnode.componentInstance)) {
        // child component. it should have hydrated its own tree.
        initComponent(vnode, insertedVnodeQueue);
        return true
      }
    }
    if (isDef(tag)) {
      if (isDef(children)) {
        // empty element, allow client to pick up and populate children
        if (!elm.hasChildNodes()) {
          createChildren(vnode, children, insertedVnodeQueue);
        } else {
          // v-html and domProps: innerHTML
          if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
            if (i !== elm.innerHTML) {
              /* istanbul ignore if */
              if (process.env.NODE_ENV !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('server innerHTML: ', i);
                console.warn('client innerHTML: ', elm.innerHTML);
              }
              return false
            }
          } else {
            // iterate and compare children lists
            var childrenMatch = true;
            var childNode = elm.firstChild;
            for (var i$1 = 0; i$1 < children.length; i$1++) {
              if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                childrenMatch = false;
                break
              }
              childNode = childNode.nextSibling;
            }
            // if childNode is not null, it means the actual childNodes list is
            // longer than the virtual children list.
            if (!childrenMatch || childNode) {
              /* istanbul ignore if */
              if (process.env.NODE_ENV !== 'production' &&
                typeof console !== 'undefined' &&
                !hydrationBailed
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
              }
              return false
            }
          }
        }
      }
      if (isDef(data)) {
        var fullInvoke = false;
        for (var key in data) {
          if (!isRenderedModule(key)) {
            fullInvoke = true;
            invokeCreateHooks(vnode, insertedVnodeQueue);
            break
          }
        }
        if (!fullInvoke && data['class']) {
          // ensure collecting deps for deep class bindings for future updates
          traverse(data['class']);
        }
      }
    } else if (elm.data !== vnode.text) {
      elm.data = vnode.text;
    }
    return true
  }

  function assertNodeMatch(node, vnode, inVPre) {
    if (isDef(vnode.tag)) {
      return vnode.tag.indexOf('vue-component') === 0 || (
        !isUnknownElement$$1(vnode, inVPre) &&
        vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
      )
    } else {
      return node.nodeType === (vnode.isComment ? 8 : 3)
    }
  }

  /**
   * patch 方法本身，它接收 4个参数，
   * oldVnode 表示旧的 VNode 节点，它也可以不存在或者是一个 DOM 对象；
   * vnode 表示执行 _render 后返回的 VNode 的节点；
   * hydrating 表示是否是服务端渲染；
   * removeOnly 是给 transition-group 用的
   */
  return function patch(oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) { // 删除节点 
      if (isDef(oldVnode)) {
        invokeDestroyHook(oldVnode);
      }
      return
    }

    var isInitialPatch = false;
    var insertedVnodeQueue = [];

    if (isUndef(oldVnode)) { // 进行初始化操作
      // 空挂载（可能是组件），创建新的根元素, 创建组件oldVnode就是undefined, 传入两个参数去创建elm
      // empty mount (likely as component), create new root element
      isInitialPatch = true;
      createElm(vnode, insertedVnodeQueue);
    } else {
      var isRealElement = isDef(oldVnode.nodeType);
      if (!isRealElement && sameVnode(oldVnode, vnode)) { // 如果是相同的vnode 就会进行patch
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
      } else { // 如果不是相同的vnode 就会创建新的dom
        if (isRealElement) { // 判断老节点是不是真的dom节点
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          // 挂载到一个真实的DOM元素
          // 检查这是否是 SSR 的上下文，以便是否可以成功地执行注水。
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR);
            hydrating = true;
          }
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true);
              return oldVnode
            } else if (process.env.NODE_ENV !== 'production') {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              );
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          // 把真实element节点替换成vnode 并把真实的节点保存到vnode.elm
          oldVnode = emptyNodeAt(oldVnode);
        }

        // 保存老节点和父节点
        // replacing existing element
        var oldElm = oldVnode.elm;
        var parentElm = nodeOps.parentNode(oldElm);

        // create new node 真实的dom
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        );

        // 递归更新占位节点
        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          // 获取占位符节点
          var ancestor = vnode.parent;
          // 判断该当前节点是不是可patch的 （渲染vnode而不是站位vnode）
          var patchable = isPatchable(vnode);
          while (ancestor) { // 判断该vnode是否拥有占位符节点 如果没有占位符节点 就什么都不做
            for (var i = 0; i < cbs.destroy.length; ++i) { // 在当前情况下 会把之前的节点进行销毁 执行钩子
              cbs.destroy[i](ancestor);
            }
            ancestor.elm = vnode.elm; // 当前新的dom实例指向每一级占位符vnode的elm上
            if (patchable) { // 判断当前组建的渲染vnode是不是patchable的
              for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                cbs.create[i$1](emptyNode, ancestor);// 如果是patchable的 就肯定会执行到组建渲染并挂载
              }
              // #6513
              // invoke insert hooks that may have been merged by create hooks.
              // e.g. for directives that uses the "inserted" hook.
              // 执行插入钩子是因为可能包含已经合并的插入钩子函数 就像指令可能会添加insert钩子函数
              var insert = ancestor.data.hook.insert;
              if (insert.merged) { // 拿到insert钩子函数数组 判读当前钩子函数是不是已经合并过了
                // index 从1开始是为了避免重复执行组建挂载钩子
                // start at index 1 to avoid re-invoking component mounted hook
                for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                  insert.fns[i$2]();
                }
              }
            } else {
              registerRef(ancestor);
            }
            ancestor = ancestor.parent; // 一直向上遍历 直到ancestor时占位符节点为止 （占位符节点就没有parent属性了）
          }
        }

        // 删除老节点 oldvnode
        // destroy old node
        if (isDef(parentElm)) { // 判断要删除的节点是否有父级dom节点
          removeVnodes([oldVnode], 0, 0);
        } else if (isDef(oldVnode.tag)) { // 没有就直接执行钩子
          invokeDestroyHook(oldVnode);
        }
      }
    }

    // 组件的 VNode patch 到 DOM 后，会执行 invokeInsertHook 函数，把 insertedVnodeQueue 里保存的钩子函数依次执行一遍，
    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm
  }
}

/*  */

var directives = {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives(vnode) {
    updateDirectives(vnode, emptyNode);
  }
};

// 更新指令
function updateDirectives(oldVnode, vnode) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}

// 根据新旧vnode 进行指令的更新
function _update(oldVnode, vnode) {
  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  // vnode.data.directives 
  var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

  var dirsWithInsert = [];
  var dirsWithPostpatch = [];

  var key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // new directive, bind
      callHook$1(dir, 'bind', vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value;
      dir.oldArg = oldDir.arg;
      callHook$1(dir, 'update', vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) { // 如果又插入的新指令 就在vnode insert之后执行指令insert钩子
    var callInsert = function () {
      for (var i = 0; i < dirsWithInsert.length; i++) {
        callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', function () {
      for (var i = 0; i < dirsWithPostpatch.length; i++) {
        callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}

var emptyModifiers = Object.create(null);

/**
 * 对指令进行一次标准化 
 */
function normalizeDirectives$1(
  dirs,
  vm
) {
  var res = Object.create(null);
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  // $flow-disable-line
  return res
}

function getRawDirName(dir) {
  return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
}

function callHook$1(dir, hook, vnode, oldVnode, isDestroy) {
  var fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
    }
  }
}

var baseModules = [
  ref,
  directives
];

/*  */
// 调用dom方法去更新真是dom的属性值
function updateAttrs(oldVnode, vnode) {
  var opts = vnode.componentOptions;
  if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
    return
  }
  if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
    return
  }
  var key, cur, old;
  var elm = vnode.elm;
  var oldAttrs = oldVnode.data.attrs || {};
  var attrs = vnode.data.attrs || {};
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(attrs.__ob__)) {
    attrs = vnode.data.attrs = extend({}, attrs);
  }

  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      setAttr(elm, key, cur);
    }
  }
  // #4391: in IE9, setting type can reset value for input[type=radio]
  // #6666: IE/Edge forces progress value down to 1 before setting a max
  /* istanbul ignore if */
  if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
    setAttr(elm, 'value', attrs.value);
  }
  for (key in oldAttrs) {
    if (isUndef(attrs[key])) {
      if (isXlink(key)) {
        elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else if (!isEnumeratedAttr(key)) {
        elm.removeAttribute(key);
      }
    }
  }
}

// 为dom节点更新属性值
function setAttr(el, key, value) {
  if (el.tagName.indexOf('-') > -1) {
    baseSetAttr(el, key, value);
  } else if (isBooleanAttr(key)) {
    // set attribute for blank value
    // e.g. <option disabled>Select one</option>
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // technically allowfullscreen is a boolean attribute for <iframe>,
      // but Flash expects a value of "true" when used on <embed> tag
      value = key === 'allowfullscreen' && el.tagName === 'EMBED' ?
        'true' :
        key;
      el.setAttribute(key, value);
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, convertEnumeratedValue(key, value));
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    baseSetAttr(el, key, value);
  }
}

function baseSetAttr(el, key, value) {
  if (isFalsyAttrValue(value)) {
    el.removeAttribute(key);
  } else {
    // #7138: IE10 & 11 fires input event when setting placeholder on
    // <textarea>... block the first input event and remove the blocker
    // immediately.
    /* istanbul ignore if */
    if (
      isIE && !isIE9 &&
      el.tagName === 'TEXTAREA' &&
      key === 'placeholder' && value !== '' && !el.__ieph
    ) {
      var blocker = function (e) {
        e.stopImmediatePropagation();
        el.removeEventListener('input', blocker);
      };
      el.addEventListener('input', blocker);
      // $flow-disable-line
      el.__ieph = true; /* IE placeholder patched */
    }
    el.setAttribute(key, value);
  }
}

var attrs = {
  create: updateAttrs,
  update: updateAttrs
};

/*  */
// 更新class类
function updateClass(oldVnode, vnode) {
  var el = vnode.elm;
  var data = vnode.data;
  var oldData = oldVnode.data;
  if (
    isUndef(data.staticClass) &&
    isUndef(data.class) && (
      isUndef(oldData) || (
        isUndef(oldData.staticClass) &&
        isUndef(oldData.class)
      )
    )
  ) {
    return
  }

  var cls = genClassForVnode(vnode);

  // handle transition classes
  var transitionClass = el._transitionClasses;
  if (isDef(transitionClass)) {
    cls = concat(cls, stringifyClass(transitionClass));
  }

  // set the class
  if (cls !== el._prevClass) {
    el.setAttribute('class', cls);
    el._prevClass = cls;
  }
}

var klass = {
  create: updateClass,
  update: updateClass
};

/*  */

/**
 * 字母 数字 下划线 . + - _ $ ] 
 */
var validDivisionCharRE = /[\w).+\-_$\]]/;
/**
 * 解析过滤器并声称过滤器相关代码
 * @param {*} exp 
 */
function parseFilters(exp) {
  var inSingle = false;
  var inDouble = false;
  var inTemplateString = false;
  var inRegex = false;
  var curly = 0;
  var square = 0;
  var paren = 0;
  var lastFilterIndex = 0;
  var c, prev, i, expression, filters;

  for (i = 0; i < exp.length; i++) {
    prev = c;
    c = exp.charCodeAt(i);
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) {
        inSingle = false;
      }
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) {
        inDouble = false;
      }
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) {
        inTemplateString = false;
      }
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) {
        inRegex = false;
      }
    } else if (
      c === 0x7C && // pipe
      exp.charCodeAt(i + 1) !== 0x7C &&
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren
    ) {
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1;
        expression = exp.slice(0, i).trim();
      } else {
        pushFilter();
      }
    } else {
      switch (c) {
        case 0x22:
          inDouble = true;
          break // "
        case 0x27:
          inSingle = true;
          break // '
        case 0x60:
          inTemplateString = true;
          break // `
        case 0x28:
          paren++;
          break // (
        case 0x29:
          paren--;
          break // )
        case 0x5B:
          square++;
          break // [
        case 0x5D:
          square--;
          break // ]
        case 0x7B:
          curly++;
          break // {
        case 0x7D:
          curly--;
          break // }
      }
      if (c === 0x2f) { // /
        var j = i - 1;
        var p = (void 0);
        // find first non-whitespace prev char
        for (; j >= 0; j--) {
          p = exp.charAt(j);
          if (p !== ' ') {
            break
          }
        }
        if (!p || !validDivisionCharRE.test(p)) {
          inRegex = true;
        }
      }
    }
  }

  if (expression === undefined) {
    expression = exp.slice(0, i).trim();
  } else if (lastFilterIndex !== 0) {
    pushFilter();
  }

  function pushFilter() {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
    lastFilterIndex = i + 1;
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i]);
    }
  }

  return expression
}

/**
 * 封装过滤器代码字符串
 */ 
function wrapFilter(exp, filter) {
  var i = filter.indexOf('(');
  if (i < 0) {
    // _f: resolveFilter
    return ("_f(\"" + filter + "\")(" + exp + ")")
  } else {
    var name = filter.slice(0, i);
    var args = filter.slice(i + 1);
    return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
  }
}

/*  */



/* eslint-disable no-unused-vars */
function baseWarn(msg, range) {
  console.error(("[Vue compiler]: " + msg));
}
/* eslint-enable no-unused-vars */

/**
 * 提取多模块内的方法  合并到一个数组中去
 */
function pluckModuleFunction(
  modules,
  key
) {
  return modules ?
    modules.map(function (m) { // 首先把各个模块内的当前key方法构建成一个数组
      return m[key];
    }).filter(function (_) { // 过滤空值
      return _;
    }) : []
}

function addProp(el, name, value, range, dynamic) {
  (el.props || (el.props = [])).push(rangeSetItem({
    name: name,
    value: value,
    dynamic: dynamic
  }, range));
  el.plain = false;
}

function addAttr(el, name, value, range, dynamic) {
  var attrs = dynamic ?
    (el.dynamicAttrs || (el.dynamicAttrs = [])) :
    (el.attrs || (el.attrs = []));
  attrs.push(rangeSetItem({
    name: name,
    value: value,
    dynamic: dynamic
  }, range));
  el.plain = false;
}

// add a raw attr (use this in preTransforms)
// 添加一个属性给当前ast节点
function addRawAttr(el, name, value, range) {
  el.attrsMap[name] = value;
  el.attrsList.push(rangeSetItem({
    name: name,
    value: value
  }, range));
}

// 为当前指令的ast添加一个指令属性对象
function addDirective(
  el,
  name,
  rawName,
  value,
  arg,
  isDynamicArg,
  modifiers,
  range
) {
  (el.directives || (el.directives = [])).push(rangeSetItem({
    name: name,
    rawName: rawName,
    value: value,
    arg: arg,
    isDynamicArg: isDynamicArg,
    modifiers: modifiers
  }, range));
  el.plain = false;
}

function prependModifierMarker(symbol, name, dynamic) {
  return dynamic ?
    ("_p(" + name + ",\"" + symbol + "\")") :
    symbol + name // mark the event as captured
}


/**
 * 
 * @param {*} el ast
 * @param {*} name 事件名
 * @param {*} value 方法名
 * @param {*} modifiers 修饰符
 * @param {*} important 是不是优先调用当前方法
 * @param {*} warn 警告方法
 * @param {*} range 
 * @param {*} dynamic 是不是动态方法
 */
function addHandler(
  el,
  name,
  value,
  modifiers,
  important,
  warn,
  range,
  dynamic
) {
  modifiers = modifiers || emptyObject;
  // warn prevent and passive modifier
  /* istanbul ignore if */
  if (
    process.env.NODE_ENV !== 'production' && warn &&
    modifiers.prevent && modifiers.passive
  ) {
    warn(
      'passive and prevent can\'t be used together. ' +
      'Passive handler can\'t prevent default event.',
      range
    );
  }

  // normalize click.right and click.middle since they don't actually fire
  // this is technically browser-specific, but at least for now browsers are
  // the only target envs that have right/middle clicks.
  if (modifiers.right) {
    if (dynamic) {
      name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
    } else if (name === 'click') {
      name = 'contextmenu';
      delete modifiers.right;
    }
  } else if (modifiers.middle) {
    if (dynamic) {
      name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
    } else if (name === 'click') {
      name = 'mouseup';
    }
  }

  // check capture modifier
  if (modifiers.capture) {
    delete modifiers.capture;
    name = prependModifierMarker('!', name, dynamic);
  }
  if (modifiers.once) {
    delete modifiers.once;
    name = prependModifierMarker('~', name, dynamic);
  }
  /* istanbul ignore if */
  if (modifiers.passive) {
    delete modifiers.passive;
    name = prependModifierMarker('&', name, dynamic);
  }

  var events;
  if (modifiers.native) {
    delete modifiers.native;
    events = el.nativeEvents || (el.nativeEvents = {});
  } else {
    events = el.events || (el.events = {});
  }

  var newHandler = rangeSetItem({
    value: value.trim(),
    dynamic: dynamic
  }, range);
  if (modifiers !== emptyObject) {
    newHandler.modifiers = modifiers;
  }

  var handlers = events[name];
  /* istanbul ignore if */
  if (Array.isArray(handlers)) { // 如果当前事件对应的方法是数组 可以通过传入的important来控制优先级
    important ? handlers.unshift(newHandler) : handlers.push(newHandler);
  } else if (handlers) {
    events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
  } else {
    events[name] = newHandler;
  }

  el.plain = false;
}

function getRawBindingAttr(
  el,
  name
) {
  return el.rawAttrsMap[':' + name] ||
    el.rawAttrsMap['v-bind:' + name] ||
    el.rawAttrsMap[name]
}

/**
 * 获取动态绑定的属性 通过v-bind 或者:
 * @param {*} el 
 * @param {*} name 
 * @param {*} getStatic  // 当且仅当传入false禁止获取静态值作为绑定值
 */
function getBindingAttr(
  el,
  name,
  getStatic
) {
  var dynamicValue =
    getAndRemoveAttr(el, ':' + name) ||
    getAndRemoveAttr(el, 'v-bind:' + name);
  if (dynamicValue != null) {
    return parseFilters(dynamicValue)
  } else if (getStatic !== false) { // 如果没有动态绑定的当前属性 就去获取静态属性给当前ast  主要是为了string类型可以省略冒号？
    var staticValue = getAndRemoveAttr(el, name);
    if (staticValue != null) {
      return JSON.stringify(staticValue)
    }
  }
}

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.
/**
 * 
 * @param {*} el ast
 * @param {*} name key v-for v-if之类的
 * @param {*} removeFromMap 是否删除
 */
function getAndRemoveAttr(
  el,
  name,
  removeFromMap
) {
  var val;
  if ((val = el.attrsMap[name]) != null) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
      if (list[i].name === name) {
        list.splice(i, 1);
        break
      }
    }
  }
  if (removeFromMap) {
    delete el.attrsMap[name];
  }
  return val
}

function getAndRemoveAttrByRegex(
  el,
  name
) {
  var list = el.attrsList;
  for (var i = 0, l = list.length; i < l; i++) {
    var attr = list[i];
    if (name.test(attr.name)) {
      list.splice(i, 1);
      return attr
    }
  }
}

// 为item设置 rang值 如果没有 直接返回item
function rangeSetItem(
  item,
  range
) {
  if (range) {
    if (range.start != null) {
      item.start = range.start;
    }
    if (range.end != null) {
      item.end = range.end;
    }
  }
  return item
}

/*  */

/**
 * Cross-platform code generation for component v-model
 */
function genComponentModel(
  el,
  value,
  modifiers
) {
  var ref = modifiers || {};
  var number = ref.number;
  var trim = ref.trim;

  var baseValueExpression = '$$v';
  var valueExpression = baseValueExpression;
  if (trim) {
    valueExpression =
      "(typeof " + baseValueExpression + " === 'string'" +
      "? " + baseValueExpression + ".trim()" +
      ": " + baseValueExpression + ")";
  }
  if (number) {
    valueExpression = "_n(" + valueExpression + ")";
  }
  var assignment = genAssignmentCode(value, valueExpression);

  el.model = {
    value: ("(" + value + ")"),
    expression: JSON.stringify(value),
    callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
  };
}

/**
 * Cross-platform codegen helper for generating v-model value assignment code.
 * 解析v-model并返回字符串代码  
 * 如果v-model解析出来了key 就通过$set方法去做赋值
 * 否则直接将value和assignment用=做链接
 */
function genAssignmentCode(
  value,
  assignment
) {
  var res = parseModel(value);
  if (res.key === null) {
    return (value + "=" + assignment)
  } else {
    return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
  }
}

/**
 * Parse a v-model expression into a base path and a final key segment.
 * Handles both dot-path and possible square brackets.
 *
 * Possible cases:
 *
 * - test
 * - test[key]
 * - test[test1[key]]
 * - test["a"][key]
 * - xxx.test[a[a].test1[key]]
 * - test.xxx.a["asa"][test1[key]]
 *
 */

var len, str, chr, index$1, expressionPos, expressionEndPos;



function parseModel(val) {
  // Fix https://github.com/vuejs/vue/pull/7730
  // allow v-model="obj.val " (trailing whitespace)
  val = val.trim();
  len = val.length;

  if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
    index$1 = val.lastIndexOf('.');
    if (index$1 > -1) {
      return {
        exp: val.slice(0, index$1),
        key: '"' + val.slice(index$1 + 1) + '"'
      }
    } else {
      return {
        exp: val,
        key: null
      }
    }
  }

  str = val;
  index$1 = expressionPos = expressionEndPos = 0;

  while (!eof()) {
    chr = next();
    /* istanbul ignore if */
    if (isStringStart(chr)) {
      parseString(chr);
    } else if (chr === 0x5B) {
      parseBracket(chr);
    }
  }

  return {
    exp: val.slice(0, expressionPos),
    key: val.slice(expressionPos + 1, expressionEndPos)
  }
}

function next() {
  return str.charCodeAt(++index$1)
}

function eof() {
  return index$1 >= len
}

function isStringStart(chr) {
  return chr === 0x22 || chr === 0x27
}

function parseBracket(chr) {
  var inBracket = 1;
  expressionPos = index$1;
  while (!eof()) {
    chr = next();
    if (isStringStart(chr)) {
      parseString(chr);
      continue
    }
    if (chr === 0x5B) {
      inBracket++;
    }
    if (chr === 0x5D) {
      inBracket--;
    }
    if (inBracket === 0) {
      expressionEndPos = index$1;
      break
    }
  }
}

function parseString(chr) {
  var stringQuote = chr;
  while (!eof()) {
    chr = next();
    if (chr === stringQuote) {
      break
    }
  }
}

/*  */

var warn$1;

// in some cases, the event used has to be determined at runtime
// so we used some reserved tokens during compile.
var RANGE_TOKEN = '__r';
var CHECKBOX_RADIO_TOKEN = '__c';

/**
 * 根据ast树生成对应的代码
 */
function model(
  el,
  dir,
  _warn
) {
  warn$1 = _warn;
  var value = dir.value;
  var modifiers = dir.modifiers;
  var tag = el.tag;
  var type = el.attrsMap.type;

  // 首先判断当前input是不是文件类型的 因为file类型的input是只读的
  if (process.env.NODE_ENV !== 'production') {
    // inputs with type="file" are read only and setting the input's
    // value will throw an error.
    if (tag === 'input' && type === 'file') {
      warn$1(
        "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
        "File inputs are read only. Use a v-on:change listener instead.",
        el.rawAttrsMap['v-model']
      );
    }
  }

  if (el.component) {
    genComponentModel(el, value, modifiers);
    // component v-model doesn't need extra runtime
    return false
  } else if (tag === 'select') {
    genSelect(el, value, modifiers);
  } else if (tag === 'input' && type === 'checkbox') {
    genCheckboxModel(el, value, modifiers);
  } else if (tag === 'input' && type === 'radio') {
    genRadioModel(el, value, modifiers);
  } else if (tag === 'input' || tag === 'textarea') { // 处理默认input 
    genDefaultModel(el, value, modifiers);
  } else if (!config.isReservedTag(tag)) { // 如果不是保留字标签 就说明是一个组件
    genComponentModel(el, value, modifiers); // 组件的v-model不需要运行时 生成组件的v-model代码
    // component v-model doesn't need extra runtime
    return false
  } else if (process.env.NODE_ENV !== 'production') {
    warn$1(
      "<" + (el.tag) + " v-model=\"" + value + "\">: " +
      "v-model is not supported on this element type. " +
      'If you are working with contenteditable, it\'s recommended to ' +
      'wrap a library dedicated for that purpose inside a custom component.',
      el.rawAttrsMap['v-model']
    );
  }

  // ensure runtime directive metadata
  return true
}

function genCheckboxModel(
  el,
  value,
  modifiers
) {
  var number = modifiers && modifiers.number;
  var valueBinding = getBindingAttr(el, 'value') || 'null';
  var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
  var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
  addProp(el, 'checked',
    "Array.isArray(" + value + ")" +
    "?_i(" + value + "," + valueBinding + ")>-1" + (
      trueValueBinding === 'true' ?
      (":(" + value + ")") :
      (":_q(" + value + "," + trueValueBinding + ")")
    )
  );
  addHandler(el, 'change',
    "var $$a=" + value + "," +
    '$$el=$event.target,' +
    "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
    'if(Array.isArray($$a)){' +
    "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
    '$$i=_i($$a,$$v);' +
    "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
    "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
    "}else{" + (genAssignmentCode(value, '$$c')) + "}",
    null, true
  );
}

function genRadioModel(
  el,
  value,
  modifiers
) {
  var number = modifiers && modifiers.number;
  var valueBinding = getBindingAttr(el, 'value') || 'null';
  valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
  addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
  addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
}

function genSelect(
  el,
  value,
  modifiers
) {
  var number = modifiers && modifiers.number;
  var selectedVal = "Array.prototype.filter" +
    ".call($event.target.options,function(o){return o.selected})" +
    ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
    "return " + (number ? '_n(val)' : 'val') + "})";

  var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
  var code = "var $$selectedVal = " + selectedVal + ";";
  code = code + " " + (genAssignmentCode(value, assignment));
  addHandler(el, 'change', code, null, true);
}

function genDefaultModel(
  el,
  value,
  modifiers
) {
  var type = el.attrsMap.type;

  // 首先排除v-bind 和v-model混用的情况 避免发生错误
  // warn if v-bind:value conflicts with v-model
  // except for inputs with v-bind:type
  if (process.env.NODE_ENV !== 'production') {
    var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
    var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
    if (value$1 && !typeBinding) {
      var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
      warn$1(
        binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
        'because the latter already expands to a value binding internally',
        el.rawAttrsMap[binding]
      );
    }
  }

  var ref = modifiers || {};
  var lazy = ref.lazy;
  var number = ref.number;
  var trim = ref.trim;
  var needCompositionGuard = !lazy && type !== 'range';
  var event = lazy ?
    'change' :
    type === 'range' ?
    RANGE_TOKEN :
    'input';

  var valueExpression = '$event.target.value';
  if (trim) {
    valueExpression = "$event.target.value.trim()";
  }
  if (number) {
    valueExpression = "_n(" + valueExpression + ")";
  }

  var code = genAssignmentCode(value, valueExpression);
  if (needCompositionGuard) { // 设置拼音时不触发赋值操作
    code = "if($event.target.composing)return;" + code;
  }

   // v-model 实际上是v-bind的语法糖
  // 实际上是添加了 :value="modelVal"
  addProp(el, 'value', ("(" + value + ")"));
  // 然后为当前元素添加事件响应方法 @event="modelVal = $event.target.value"
  addHandler(el, event, code, null, true);
  if (trim || number) {
    addHandler(el, 'blur', '$forceUpdate()');
  }
}

/*  */

// normalize v-model event tokens that can only be determined at runtime.
// it's important to place the event as the first in the array because
// the whole point is ensuring the v-model callback gets called before
// user-attached handlers.
// 标准化v-model 事件标记，只能在运行时下确认
function normalizeEvents(on) {
  /* istanbul ignore if */
  if (isDef(on[RANGE_TOKEN])) {
    // IE input[type=range] only supports `change` event
    var event = isIE ? 'change' : 'input';
    on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
    delete on[RANGE_TOKEN];
  }
  // This was originally intended to fix #4521 but no longer necessary
  // after 2.5. Keeping it for backwards compat with generated code from < 2.4
  /* istanbul ignore if */
  if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
    on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
    delete on[CHECKBOX_RADIO_TOKEN];
  }
}

var target$1;

function createOnceHandler$1(event, handler, capture) {
  var _target = target$1; // save current target element in closure
  return function onceHandler() {
    var res = handler.apply(null, arguments);
    if (res !== null) {
      remove$2(event, onceHandler, capture, _target);
    }
  }
}

// #9446: Firefox <= 53 (in particular, ESR 52) has incorrect Event.timeStamp
// implementation and does not fire microtasks in between event propagation, so
// safe to exclude.
var useMicrotaskFix = isUsingMicroTask && !(isFF && Number(isFF[1]) <= 53);

/**
 * 为 dom 添加事件
 */
function add$1(
  name,
  handler,
  capture,
  passive
) {
  // async edge case #6566: inner click event triggers patch, event handler
  // attached to outer element during patch, and triggered again. This
  // happens because browsers fire microtask ticks between event propagation.
  // the solution is simple: we save the timestamp when a handler is attached,
  // and the handler would only fire if the event passed to it was fired
  // AFTER it was attached.
  if (useMicrotaskFix) {
    var attachedTimestamp = currentFlushTimestamp;
    var original = handler;
    handler = original._wrapper = function (e) {
      if (
        // no bubbling, should always fire.
        // this is just a safety net in case event.timeStamp is unreliable in
        // certain weird environments...
        e.target === e.currentTarget ||
        // event is fired after handler attachment
        e.timeStamp >= attachedTimestamp ||
        // bail for environments that have buggy event.timeStamp implementations
        // #9462 iOS 9 bug: event.timeStamp is 0 after history.pushState
        // #9681 QtWebEngine event.timeStamp is negative value
        e.timeStamp <= 0 ||
        // #9448 bail if event is fired in another document in a multi-page
        // electron/nw.js app, since event.timeStamp will be using a different
        // starting reference
        e.target.ownerDocument !== document
      ) {
        return original.apply(this, arguments)
      }
    };
  }
  // dom-api 为当前元素添加事件
  target$1.addEventListener(
    name,
    handler, // 当事件触发的时候 会触发到 createFnInvoker创建好的封装函数
    supportsPassive ? {
      capture: capture,
      passive: passive
    } :
    capture
  );
}

function remove$2(
  name,
  handler,
  capture,
  _target
) {
  (_target || target$1).removeEventListener(
    name,
    handler._wrapper || handler,
    capture
  );
}

/**
 * 更新dom的事件钩子 会在初始化的时候触发 或者在更新的时候触发
 */
function updateDOMListeners(oldVnode, vnode) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  normalizeEvents(on); // 主要是处理v-model
  updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
  target$1 = undefined;
}

var events = {
  // 对于事件  只会在created和update钩子时候做处理
  // 调用时机是在初始化和更新组件的时候
  create: updateDOMListeners,
  update: updateDOMListeners
};

/*  */

var svgContainer;

function updateDOMProps(oldVnode, vnode) {
  if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
    return
  }
  var key, cur;
  var elm = vnode.elm;
  var oldProps = oldVnode.data.domProps || {};
  var props = vnode.data.domProps || {};
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(props.__ob__)) {
    props = vnode.data.domProps = extend({}, props);
  }

  for (key in oldProps) {
    if (!(key in props)) {
      elm[key] = '';
    }
  }

  for (key in props) {
    cur = props[key];
    // ignore children if the node has textContent or innerHTML,
    // as these will throw away existing DOM nodes and cause removal errors
    // on subsequent patches (#3360)
    if (key === 'textContent' || key === 'innerHTML') {
      if (vnode.children) {
        vnode.children.length = 0;
      }
      if (cur === oldProps[key]) {
        continue
      }
      // #6601 work around Chrome version <= 55 bug where single textNode
      // replaced by innerHTML/textContent retains its parentNode property
      if (elm.childNodes.length === 1) {
        elm.removeChild(elm.childNodes[0]);
      }
    }

    if (key === 'value' && elm.tagName !== 'PROGRESS') {
      // store value as _value as well since
      // non-string values will be stringified
      elm._value = cur;
      // avoid resetting cursor position when value is the same
      var strCur = isUndef(cur) ? '' : String(cur);
      if (shouldUpdateValue(elm, strCur)) {
        elm.value = strCur;
      }
    } else if (key === 'innerHTML' && isSVG(elm.tagName) && isUndef(elm.innerHTML)) {
      // IE doesn't support innerHTML for SVG elements
      svgContainer = svgContainer || document.createElement('div');
      svgContainer.innerHTML = "<svg>" + cur + "</svg>";
      var svg = svgContainer.firstChild;
      while (elm.firstChild) {
        elm.removeChild(elm.firstChild);
      }
      while (svg.firstChild) {
        elm.appendChild(svg.firstChild);
      }
    } else if (
      // skip the update if old and new VDOM state is the same.
      // `value` is handled separately because the DOM value may be temporarily
      // out of sync with VDOM state due to focus, composition and modifiers.
      // This  #4521 by skipping the unnecesarry `checked` update.
      cur !== oldProps[key]
    ) {
      // some property updates can throw
      // e.g. `value` on <progress> w/ non-finite value
      try {
        elm[key] = cur;
      } catch (e) {}
    }
  }
}

// check platforms/web/util/attrs.js acceptValue


function shouldUpdateValue(elm, checkVal) {
  return (!elm.composing && (
    elm.tagName === 'OPTION' ||
    isNotInFocusAndDirty(elm, checkVal) ||
    isDirtyWithModifiers(elm, checkVal)
  ))
}

function isNotInFocusAndDirty(elm, checkVal) {
  // return true when textbox (.number and .trim) loses focus and its value is
  // not equal to the updated value
  var notInFocus = true;
  // #6157
  // work around IE bug when accessing document.activeElement in an iframe
  try {
    notInFocus = document.activeElement !== elm;
  } catch (e) {}
  return notInFocus && elm.value !== checkVal
}

function isDirtyWithModifiers(elm, newVal) {
  var value = elm.value;
  var modifiers = elm._vModifiers; // injected by v-model runtime
  if (isDef(modifiers)) {
    if (modifiers.number) {
      return toNumber(value) !== toNumber(newVal)
    }
    if (modifiers.trim) {
      return value.trim() !== newVal.trim()
    }
  }
  return value !== newVal
}

var domProps = {
  create: updateDOMProps,
  update: updateDOMProps
};

/*  */

/**
 * 解析style文本到一个style对象
 */
var parseStyleText = cached(function (cssText) {
  var res = {};
  var listDelimiter = /;(?![^(]*\))/g;
  var propertyDelimiter = /:(.+)/;
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter);
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return res
});

// merge static and dynamic style data on the same vnode
function normalizeStyleData(data) {
  var style = normalizeStyleBinding(data.style);
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle ?
    extend(data.staticStyle, style) :
    style
}

// normalize possible array / string values into Object
function normalizeStyleBinding(bindingStyle) {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
function getStyle(vnode, checkChild) {
  var res = {};
  var styleData;

  if (checkChild) {
    var childNode = vnode;
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode;
      if (
        childNode && childNode.data &&
        (styleData = normalizeStyleData(childNode.data))
      ) {
        extend(res, styleData);
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData);
  }

  var parentNode = vnode;
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData);
    }
  }
  return res
}

/*  */

/**
 * --开头 定义css变量
 */
var cssVarRE = /^--/;
/**
 *  0个或者多个空格加!important结尾
 */
var importantRE = /\s*!important$/;
var setProp = function (el, name, val) {
  /* istanbul ignore if */
  if (cssVarRE.test(name)) {
    el.style.setProperty(name, val);
  } else if (importantRE.test(val)) {
    el.style.setProperty(hyphenate(name), val.replace(importantRE, ''), 'important');
  } else {
    var normalizedName = normalize(name);
    if (Array.isArray(val)) {
      // Support values array created by autoprefixer, e.g.
      // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
      // Set them one by one, and the browser will only set those it can recognize
      for (var i = 0, len = val.length; i < len; i++) {
        el.style[normalizedName] = val[i];
      }
    } else {
      el.style[normalizedName] = val;
    }
  }
};

var vendorNames = ['Webkit', 'Moz', 'ms'];

var emptyStyle;
var normalize = cached(function (prop) {
  emptyStyle = emptyStyle || document.createElement('div').style;
  prop = camelize(prop);
  if (prop !== 'filter' && (prop in emptyStyle)) {
    return prop
  }
  var capName = prop.charAt(0).toUpperCase() + prop.slice(1);
  for (var i = 0; i < vendorNames.length; i++) {
    var name = vendorNames[i] + capName;
    if (name in emptyStyle) {
      return name
    }
  }
});

function updateStyle(oldVnode, vnode) {
  var data = vnode.data;
  var oldData = oldVnode.data;

  if (isUndef(data.staticStyle) && isUndef(data.style) &&
    isUndef(oldData.staticStyle) && isUndef(oldData.style)
  ) {
    return
  }

  var cur, name;
  var el = vnode.elm;
  var oldStaticStyle = oldData.staticStyle;
  var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};

  // if static style exists, stylebinding already merged into it when doing normalizeStyleData
  var oldStyle = oldStaticStyle || oldStyleBinding;

  var style = normalizeStyleBinding(vnode.data.style) || {};

  // store normalized style under a different key for next diff
  // make sure to clone it if it's reactive, since the user likely wants
  // to mutate it.
  vnode.data.normalizedStyle = isDef(style.__ob__) ?
    extend({}, style) :
    style;

  var newStyle = getStyle(vnode, true);

  for (name in oldStyle) {
    if (isUndef(newStyle[name])) {
      setProp(el, name, '');
    }
  }
  for (name in newStyle) {
    cur = newStyle[name];
    if (cur !== oldStyle[name]) {
      // ie9 setting to null has no effect, must use empty string
      setProp(el, name, cur == null ? '' : cur);
    }
  }
}

var style = {
  create: updateStyle,
  update: updateStyle
};

/*  */

/**
 * 一个或者多个空格
 */
var whitespaceRE = /\s+/;

/**
 * Add class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function addClass(el, cls) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(whitespaceRE).forEach(function (c) {
        return el.classList.add(c);
      });
    } else {
      el.classList.add(cls);
    }
  } else {
    var cur = " " + (el.getAttribute('class') || '') + " ";
    if (cur.indexOf(' ' + cls + ' ') < 0) {
      el.setAttribute('class', (cur + cls).trim());
    }
  }
}

/**
 * Remove class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function removeClass(el, cls) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(whitespaceRE).forEach(function (c) {
        return el.classList.remove(c);
      });
    } else {
      el.classList.remove(cls);
    }
    if (!el.classList.length) {
      el.removeAttribute('class');
    }
  } else {
    var cur = " " + (el.getAttribute('class') || '') + " ";
    var tar = ' ' + cls + ' ';
    while (cur.indexOf(tar) >= 0) {
      cur = cur.replace(tar, ' ');
    }
    cur = cur.trim();
    if (cur) {
      el.setAttribute('class', cur);
    } else {
      el.removeAttribute('class');
    }
  }
}

/*  */
// 获取transtion相关资源 添加到一个对象中并将该对象返回
function resolveTransition(def$$1) {
  if (!def$$1) {
    return
  }
  /* istanbul ignore else */
  if (typeof def$$1 === 'object') {
    var res = {};
    if (def$$1.css !== false) {
      extend(res, autoCssTransition(def$$1.name || 'v')); // 如果没有name就是v
    }
    extend(res, def$$1);
    return res
  } else if (typeof def$$1 === 'string') {
    return autoCssTransition(def$$1)
  }
}

var autoCssTransition = cached(function (name) {
  return {
    enterClass: (name + "-enter"),
    enterToClass: (name + "-enter-to"),
    enterActiveClass: (name + "-enter-active"),
    leaveClass: (name + "-leave"),
    leaveToClass: (name + "-leave-to"),
    leaveActiveClass: (name + "-leave-active")
  }
});

var hasTransition = inBrowser && !isIE9;
var TRANSITION = 'transition';
var ANIMATION = 'animation';

// Transition property/event sniffing
var transitionProp = 'transition';
var transitionEndEvent = 'transitionend';
var animationProp = 'animation';
var animationEndEvent = 'animationend';
if (hasTransition) {
  /* istanbul ignore if */
  if (window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined
  ) {
    transitionProp = 'WebkitTransition';
    transitionEndEvent = 'webkitTransitionEnd';
  }
  if (window.onanimationend === undefined &&
    window.onwebkitanimationend !== undefined
  ) {
    animationProp = 'WebkitAnimation';
    animationEndEvent = 'webkitAnimationEnd';
  }
}

// binding to window is necessary to make hot reload work in IE in strict mode
var raf = inBrowser ?
  window.requestAnimationFrame ?
  window.requestAnimationFrame.bind(window) :
  setTimeout :
  /* istanbul ignore next */
  function (fn) {
    return fn();
  };

function nextFrame(fn) {
  raf(function () {
    raf(fn);
  });
}

function addTransitionClass(el, cls) {
  var transitionClasses = el._transitionClasses || (el._transitionClasses = []);
  if (transitionClasses.indexOf(cls) < 0) {
    transitionClasses.push(cls);
    addClass(el, cls);
  }
}

function removeTransitionClass(el, cls) {
  if (el._transitionClasses) {
    remove(el._transitionClasses, cls);
  }
  removeClass(el, cls);
}

function whenTransitionEnds(
  el, // elememnt
  expectedType, // transtion或者animation
  cb // 回调
) {
  var ref = getTransitionInfo(el, expectedType);
  var type = ref.type;
  var timeout = ref.timeout;
  var propCount = ref.propCount;
  if (!type) {
    return cb()
  }
  var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
  var ended = 0; // 每完成一个属性的过渡 就会++
  var end = function () { // 删除事件并触发回调
    el.removeEventListener(event, onEnd);
    cb();
  };
  var onEnd = function (e) {
    if (e.target === el) {
      if (++ended >= propCount) { // 当所有属性都完成了过渡或者动画就去触发回调
        end();
      }
    }
  };
  setTimeout(function () {
    if (ended < propCount) {
      end(); // 在动画过渡时间之后立即判断是不是所有属性还没有过渡完成 如果是 直接执行结束 防止有部分属性永远不会过渡完成
    }
  }, timeout + 1);
  el.addEventListener(event, onEnd); // 添加事件回调 
}

/**
 * 单词边界加上transform或者all再加上,或者结束
 */
var transformRE = /\b(transform|all)(,|$)/;

/**
 * 获取元素的过渡相关信息
 * @param {*} el 
 * @param {*} expectedType 类型
 */
function getTransitionInfo(el, expectedType) {
  var styles = window.getComputedStyle(el); // 根据原生api去获取计算后的style样式值
  // JSDOM may return undefined for transition properties
  var transitionDelays = (styles[transitionProp + 'Delay'] || '').split(', ');
  var transitionDurations = (styles[transitionProp + 'Duration'] || '').split(', ');
  var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  var animationDelays = (styles[animationProp + 'Delay'] || '').split(', ');
  var animationDurations = (styles[animationProp + 'Duration'] || '').split(', ');
  var animationTimeout = getTimeout(animationDelays, animationDurations);

  var type; // 动画类型
  var timeout = 0; // 回调延迟
  var propCount = 0; // 动画属性名
  /* istanbul ignore if */
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout); // 取最大时间
    type = timeout > 0 ?
      transitionTimeout > animationTimeout ?
      TRANSITION :
      ANIMATION :
      null;
    propCount = type ?
      type === TRANSITION ?
      transitionDurations.length :
      animationDurations.length :
      0;
  }
  var hasTransform =
    type === TRANSITION &&
    transformRE.test(styles[transitionProp + 'Property']); // 判断动画效果的属性是否包含transform
  return {
    type: type,
    timeout: timeout,
    propCount: propCount,
    hasTransform: hasTransform
  }
}

function getTimeout(delays, durations) {
  /* istanbul ignore next */
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }

  return Math.max.apply(null, durations.map(function (d, i) { // 获取最大时间
    return toMs(d) + toMs(delays[i])
  }))
}

// Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
// in a locale-dependent way, using a comma instead of a dot.
// If comma is not replaced with a dot, the input will be rounded down (i.e. acting
// as a floor function) causing unexpected behaviors
function toMs(s) {
  return Number(s.slice(0, -1).replace(',', '.')) * 1000
}

/*  */

//在模块钩子 create activate 中会调用
function enter(vnode, toggleDisplay) {
  var el = vnode.elm;

  // call leave callback now
  if (isDef(el._leaveCb)) {
    el._leaveCb.cancelled = true; // 再来开过程中进行enter钩子就代表取消离开
    el._leaveCb();
  }

  //获取过渡相关资源
  var data = resolveTransition(vnode.data.transition);

  if (isUndef(data)) {
    return
  }

  /* istanbul ignore if */
  if (isDef(el._enterCb) || el.nodeType !== 1) { // 对于已经在进行进入动画和非节点类型的节点不作处理
    return
  }

  // 赋值
  var css = data.css;
  var type = data.type;
  var enterClass = data.enterClass;
  var enterToClass = data.enterToClass;
  var enterActiveClass = data.enterActiveClass;
  var appearClass = data.appearClass;
  var appearToClass = data.appearToClass;
  var appearActiveClass = data.appearActiveClass;
  var beforeEnter = data.beforeEnter;
  var enter = data.enter;
  var afterEnter = data.afterEnter;
  var enterCancelled = data.enterCancelled;
  var beforeAppear = data.beforeAppear;
  var appear = data.appear;
  var afterAppear = data.afterAppear;
  var appearCancelled = data.appearCancelled;
  var duration = data.duration;

  // activeInstance will always be the <transition> component managing this
  // transition. One edge case to check is when the <transition> is placed
  // as the root node of a child component. In that case we need to check
  // <transition>'s parent for appear check.
  var context = activeInstance;
  var transitionNode = activeInstance.$vnode;
  while (transitionNode && transitionNode.parent) { // 判断当前transition是组件的根节点 也就是$vnode站位节点存在 就继续向上着寻找 直到当前节点不是组件根节点为止
    context = transitionNode.context;
    transitionNode = transitionNode.parent;
  }

  // 判断当前是不是已经挂载过了或者作为根节点插入的  判断是不是初次渲染
  var isAppear = !context._isMounted || !vnode.isRootInsert;

  if (isAppear && !appear && appear !== '') { // 没传入appear且初次渲染的时候就直接return
    return
  }

  // class类赋值
  var startClass = isAppear && appearClass ?
    appearClass :
    enterClass;
  var activeClass = isAppear && appearActiveClass ?
    appearActiveClass :
    enterActiveClass;
  var toClass = isAppear && appearToClass ?
    appearToClass :
    enterToClass;

  var beforeEnterHook = isAppear ?
    (beforeAppear || beforeEnter) :
    beforeEnter;
  var enterHook = isAppear ?
    (typeof appear === 'function' ? appear : enter) :
    enter;
  var afterEnterHook = isAppear ?
    (afterAppear || afterEnter) :
    afterEnter;
  var enterCancelledHook = isAppear ?
    (appearCancelled || enterCancelled) :
    enterCancelled;

    // 提取duration属性绑定的的值
  var explicitEnterDuration = toNumber(
    isObject(duration) ?
    duration.enter :
    duration
  );

  if (process.env.NODE_ENV !== 'production' && explicitEnterDuration != null) {
    checkDuration(explicitEnterDuration, 'enter', vnode);
  }

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl = getHookArgumentsLength(enterHook); // 根据入参长度判断当前用户是不是需要手动出发过度下一阶段的方法

  // 为当前元素添加进入的回调 且只执行一次
  var cb = el._enterCb = once(function () {
    if (expectsCSS) { // 判断当前是不是可使用css 如果是 尝试移除transition类
      removeTransitionClass(el, toClass);
      removeTransitionClass(el, activeClass);
    }
    if (cb.cancelled) {// 被取消的情况下
      if (expectsCSS) {
        removeTransitionClass(el, startClass);
      }
      enterCancelledHook && enterCancelledHook(el); // 执行被取消钩子
    } else {
      afterEnterHook && afterEnterHook(el); // 没被取消就完成进入后钩子
    }
    el._enterCb = null; // 置空
  });

  if (!vnode.data.show) {
    // remove pending leave element on enter by injecting an insert hook
    mergeVNodeHook(vnode, 'insert', function () { // 在insert时机下去回调当前函数  
      var parent = el.parentNode;
      var pendingNode = parent && parent._pending && parent._pending[vnode.key];
      if (pendingNode &&
        pendingNode.tag === vnode.tag &&
        pendingNode.elm._leaveCb
      ) {
        pendingNode.elm._leaveCb();
      }
      enterHook && enterHook(el, cb);
    });
  }

  // start enter transition
  beforeEnterHook && beforeEnterHook(el); // 直接执行进入前钩子
  if (expectsCSS) {
    addTransitionClass(el, startClass); // 添加开始态
    addTransitionClass(el, activeClass);// 添加活跃态
    nextFrame(function () { // 然后在下一个动画帧去移除开始态
      removeTransitionClass(el, startClass);
      if (!cb.cancelled) { // 如果回调被取消了 就需要定时去出发回调方法
        addTransitionClass(el, toClass); // 就添加toclass
        if (!userWantsControl) { // 用户不想主动控制的情况下
          if (isValidDuration(explicitEnterDuration)) {
            setTimeout(cb, explicitEnterDuration); // 一段时间后触发回调
          } else { // 添加过渡结束之后执行回调
            whenTransitionEnds(el, type, cb);
          }
        }
      }
    });
  }

  if (vnode.data.show) {
    toggleDisplay && toggleDisplay();
    enterHook && enterHook(el, cb);
  }

  if (!expectsCSS && !userWantsControl) { // 在用户禁止css的时候并且没有主动去结束动画及效果 就直接在这里执行回调
    cb();
  }
}

// 元素渐出动画效果
function leave(vnode, rm) {
  var el = vnode.elm;

  // call enter callback now
  if (isDef(el._enterCb)) { // 在渲染过程中进行leave就代表取消了enter过程
    el._enterCb.cancelled = true;
    el._enterCb();
  }

  // 获取transition数据
  var data = resolveTransition(vnode.data.transition);
  if (isUndef(data) || el.nodeType !== 1) {
    return rm()
  }

  /* istanbul ignore if */
  if (isDef(el._leaveCb)) { // 为定义离开回调 直接return
    return
  }

  var css = data.css;
  var type = data.type;
  var leaveClass = data.leaveClass;
  var leaveToClass = data.leaveToClass;
  var leaveActiveClass = data.leaveActiveClass;
  var beforeLeave = data.beforeLeave;
  var leave = data.leave;
  var afterLeave = data.afterLeave;
  var leaveCancelled = data.leaveCancelled;
  var delayLeave = data.delayLeave;
  var duration = data.duration;

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl = getHookArgumentsLength(leave);

  // 获取离开时间
  var explicitLeaveDuration = toNumber(
    isObject(duration) ?
    duration.leave :
    duration
  );

  if (process.env.NODE_ENV !== 'production' && isDef(explicitLeaveDuration)) {
    checkDuration(explicitLeaveDuration, 'leave', vnode);
  }

  var cb = el._leaveCb = once(function () {
    if (el.parentNode && el.parentNode._pending) {
      el.parentNode._pending[vnode.key] = null;
    }
    if (expectsCSS) {
      removeTransitionClass(el, leaveToClass);
      removeTransitionClass(el, leaveActiveClass);
    }
    if (cb.cancelled) { // 在执行leave的过程中执行了enter
      if (expectsCSS) {
        removeTransitionClass(el, leaveClass); // 删除离开样式
      }
      leaveCancelled && leaveCancelled(el); // 执行取消离开钩子
    } else {
      rm(); // 执行dom删除操作
      afterLeave && afterLeave(el); // 执行动画结束后操作
    }
    el._leaveCb = null; // 置空
  });

  if (delayLeave) { // 如果有延迟离开函数 就在延迟后执行离开动画（用户入口）
    delayLeave(performLeave);
  } else {
    performLeave(); // 否则直接开始离开动画执行
  }

  function performLeave() {
    // the delayed leave may have already been cancelled
    if (cb.cancelled) {
      return
    }
    // record leaving element 记录竟在leave的vnode  往站位节点添加一个哈希表 标记当前正在过渡的vnode
    if (!vnode.data.show && el.parentNode) {
      (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
    }
    beforeLeave && beforeLeave(el); // 执行beforeleave钩子
    if (expectsCSS) { // 如果允许css
      addTransitionClass(el, leaveClass); // 添加开始态
      addTransitionClass(el, leaveActiveClass); // 添加过渡类
      nextFrame(function () {
        removeTransitionClass(el, leaveClass); // 在下个动画帧删除开始态
        if (!cb.cancelled) {
          addTransitionClass(el, leaveToClass);// 添加离开终态
          if (!userWantsControl) {
            if (isValidDuration(explicitLeaveDuration)) {
              setTimeout(cb, explicitLeaveDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }
    leave && leave(el, cb); // 如果传入了leave  调用leave
    if (!expectsCSS && !userWantsControl) { 
      cb();
    }
  }
}

// only used in dev mode
function checkDuration(val, name, vnode) {
  if (typeof val !== 'number') {
    warn(
      "<transition> explicit " + name + " duration is not a valid number - " +
      "got " + (JSON.stringify(val)) + ".",
      vnode.context
    );
  } else if (isNaN(val)) {
    warn(
      "<transition> explicit " + name + " duration is NaN - " +
      'the duration expression might be incorrect.',
      vnode.context
    );
  }
}

function isValidDuration(val) {
  return typeof val === 'number' && !isNaN(val)
}

/**
 * Normalize a transition hook's argument length. The hook may be:
 * - a merged hook (invoker) with the original in .fns
 * - a wrapped component method (check ._length)
 * - a plain function (.length)
 */
function getHookArgumentsLength(fn) {
  if (isUndef(fn)) {
    return false
  }
  var invokerFns = fn.fns;
  if (isDef(invokerFns)) {
    // invoker
    return getHookArgumentsLength(
      Array.isArray(invokerFns) ?
      invokerFns[0] :
      invokerFns
    )
  } else {
    return (fn._length || fn.length) > 1
  }
}

function _enter(_, vnode) {
  if (vnode.data.show !== true) {
    enter(vnode);
  }
}

var transition = inBrowser ? {
  create: _enter,
  activate: _enter,
  remove: function remove$$1(vnode, rm) {
    /* istanbul ignore else */
    if (vnode.data.show !== true) {
      leave(vnode, rm);
    } else {
      rm();
    }
  }
} : {};

var platformModules = [
  attrs,
  klass,
  events,
  domProps,
  style,
  transition
];

/*  */

// the directive module should be applied last, after all
// built-in modules have been applied.
var modules = platformModules.concat(baseModules);

// createPatchFunction 内部定义了一系列的辅助方法，最终返回了一个 patch 方法，这个方法就赋值给了 vm._update 函数里调用的 vm.__patch__。
// 为何 Vue.js 源码绕了这么一大圈，把相关代码分散到各个目录(src vuejs系统entry目录而不是build目录)。
// 因为patch 是平台相关的，在 Web 和 Weex 环境，它们把虚拟 DOM 映射到 “平台 DOM” 的方法是不同的，并且对 “DOM” 包括的属性模块创建和更新也不尽相同。
// 因此每个平台都有各自的 nodeOps 和 modules，它们的代码需要托管在 src/platforms 这个大目录下。
// 而不同平台的 patch 的主要逻辑部分是相同的(像是响应式原理啊 diff算法 对render函数的normalize 只不过因为平台的原因导致执行相同操作的代码不同了,所以需要特异性配置)是相同的，
// 所以这部分公共的部分托管在 core 这个大目录下。差异化部分只需要通过参数来区别，这里用到了一个函数柯里化(相当于设置了局部function内的环境变量)的技巧，
// 通过 createPatchFunction 把差异化参数提前确定下来(固化)，这样不用每次调用 patch 的时候都传递 nodeOps 和 modules 了。

// nodeOps 表示对 “平台 DOM” 的一些操作方法，modules 表示平台的一些模块，它们会在整个 patch 过程的不同阶段执行相应的钩子函数。
var patch = createPatchFunction({
  nodeOps: nodeOps, // 节点的crud操作
  modules: modules // klass ref style transition ... 
});

/**
 * Not type checking this file because flow doesn't like attaching
 * properties to Elements.
 */

/* istanbul ignore if */
if (isIE9) {
  // http://www.matts411.com/post/internet-explorer-9-oninput/
  document.addEventListener('selectionchange', function () {
    var el = document.activeElement;
    if (el && el.vmodel) {
      trigger(el, 'input');
    }
  });
}

var directive = {
  inserted: function inserted(el, binding, vnode, oldVnode) {
    if (vnode.tag === 'select') {
      // #6903
      if (oldVnode.elm && !oldVnode.elm._vOptions) {
        mergeVNodeHook(vnode, 'postpatch', function () {
          directive.componentUpdated(el, binding, vnode);
        }); 
      } else {
        setSelected(el, binding, vnode.context);
      }
      el._vOptions = [].map.call(el.options, getValue);
    } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
       // 如果是文本输入类的输入框
      el._vModifiers = binding.modifiers;
      if (!binding.modifiers.lazy) {
        // 为输入法设置的事件 也是v-model 和 v-bind+@input的方式对输入框处理呈现不同的处理方式的根本原因
        el.addEventListener('compositionstart', onCompositionStart);
        el.addEventListener('compositionend', onCompositionEnd);
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        el.addEventListener('change', onCompositionEnd);
        /* istanbul ignore if */
        if (isIE9) {
          el.vmodel = true;
        }
      }
    }
  },

  componentUpdated: function componentUpdated(el, binding, vnode) {
    if (vnode.tag === 'select') {
      setSelected(el, binding, vnode.context);
      // in case the options rendered by v-for have changed,
      // it's possible that the value is out-of-sync with the rendered options.
      // detect such cases and filter out values that no longer has a matching
      // option in the DOM.
      var prevOptions = el._vOptions;
      var curOptions = el._vOptions = [].map.call(el.options, getValue);
      if (curOptions.some(function (o, i) {
          return !looseEqual(o, prevOptions[i]);
        })) {
        // trigger change event if
        // no matching option found for at least one value
        var needReset = el.multiple ?
          binding.value.some(function (v) {
            return hasNoMatchingOption(v, curOptions);
          }) :
          binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
        if (needReset) {
          trigger(el, 'change');
        }
      }
    }
  }
};

function setSelected(el, binding, vm) {
  actuallySetSelected(el, binding, vm);
  /* istanbul ignore if */
  if (isIE || isEdge) {
    setTimeout(function () {
      actuallySetSelected(el, binding, vm);
    }, 0);
  }
}

function actuallySetSelected(el, binding, vm) {
  var value = binding.value;
  var isMultiple = el.multiple;
  if (isMultiple && !Array.isArray(value)) {
    process.env.NODE_ENV !== 'production' && warn(
      "<select multiple v-model=\"" + (binding.expression) + "\"> " +
      "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
      vm
    );
    return
  }
  var selected, option;
  for (var i = 0, l = el.options.length; i < l; i++) {
    option = el.options[i];
    if (isMultiple) {
      selected = looseIndexOf(value, getValue(option)) > -1;
      if (option.selected !== selected) {
        option.selected = selected;
      }
    } else {
      if (looseEqual(getValue(option), value)) {
        if (el.selectedIndex !== i) {
          el.selectedIndex = i;
        }
        return
      }
    }
  }
  if (!isMultiple) {
    el.selectedIndex = -1;
  }
}

function hasNoMatchingOption(value, options) {
  return options.every(function (o) {
    return !looseEqual(o, value);
  })
}

function getValue(option) {
  return '_value' in option ?
    option._value :
    option.value
}

// 设置在进行拼音时的标志  一边在拼音的时候不触发input事件 
function onCompositionStart(e) {
  e.target.composing = true;
}

// 在停止拼音的时候将标志符设置为false  这样在拼音结束之后就可以通过手动触发input事件去更新input框的数据
function onCompositionEnd(e) {
  // prevent triggering an input event for no reason
  if (!e.target.composing) {
    return
  }
  e.target.composing = false;
  trigger(e.target, 'input');
}

function trigger(el, type) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(type, true, true);
  el.dispatchEvent(e);
}

/*  */

// recursively search for possible transition defined inside the component root
function locateNode(vnode) {
  return vnode.componentInstance && (!vnode.data || !vnode.data.transition) ?
    locateNode(vnode.componentInstance._vnode) :
    vnode
}

var show = {
  bind: function bind(el, ref, vnode) {
    var value = ref.value;

    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    var originalDisplay = el.__vOriginalDisplay =
      el.style.display === 'none' ? '' : el.style.display;
    if (value && transition$$1) {
      vnode.data.show = true;
      enter(vnode, function () {
        el.style.display = originalDisplay;
      });
    } else {
      el.style.display = value ? originalDisplay : 'none';
    }
  },

  update: function update(el, ref, vnode) {
    var value = ref.value;
    var oldValue = ref.oldValue;

    /* istanbul ignore if */
    if (!value === !oldValue) {
      return
    }
    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    if (transition$$1) {
      vnode.data.show = true;
      if (value) {
        enter(vnode, function () {
          el.style.display = el.__vOriginalDisplay;
        });
      } else {
        leave(vnode, function () {
          el.style.display = 'none';
        });
      }
    } else {
      el.style.display = value ? el.__vOriginalDisplay : 'none';
    }
  },

  unbind: function unbind(
    el,
    binding,
    vnode,
    oldVnode,
    isDestroy
  ) {
    if (!isDestroy) {
      el.style.display = el.__vOriginalDisplay;
    }
  }
};

var platformDirectives = {
  model: directive,
  show: show
};

/*  */

/**
 * transition 组件的props属性
 */
var transitionProps = {
  // string，用于自动生成 CSS 过渡类名  没传默认v
  name: String, 
  // boolean，是否在初始渲染时使用过渡。默认为 false
  appear: Boolean,
  // boolean，是否使用 CSS 过渡类。默认为 true。如果设置为 false，
  // 将只通过组件事件触发注册的 JavaScript 钩子。
  css: Boolean, 
  //string，控制离开/进入过渡的时间序列。有效的模式有 "out-in" 和 "in-out"；默认同时进行
  mode: String, 
  //string，指定过渡事件类型，侦听过渡何时结束。有效值为 "transition" 和 "animation"。
  //默认 Vue.js 将自动检测出持续时间长的为过渡事件类型。
  type: String,

  // 样式
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String,


  //- number | { enter: number, leave: number } 指定过渡的持续时间。
  //默认情况下，Vue 会等待过渡所在根元素的第一个 transitionend 或 animationend 事件
  duration: [Number, String, Object]
};

// in case the child is also an abstract component, e.g. <keep-alive>
// we want to recursively retrieve the real component to be rendered
// 获取真实的child  有可能抽象节点的孩子还是抽象节点
function getRealChild(vnode) {
  var compOptions = vnode && vnode.componentOptions;
  if (compOptions && compOptions.Ctor.options.abstract) {
    return getRealChild(getFirstComponentChild(compOptions.children))
  } else {
    return vnode
  }
}

// 简单提取transition vnodedata 传入组件vm
function extractTransitionData(comp) {
  var data = {};
  var options = comp.$options;
  // props
  for (var key in options.propsData) {
    data[key] = comp[key];
  }
  // events.
  // extract listeners and pass them directly to the transition methods
  var listeners = options._parentListeners;
  for (var key$1 in listeners) {
    data[camelize(key$1)] = listeners[key$1];
  }
  return data
}

// 如果当前vnode的tag是 数字-keep-alive 就创建占位节点vnode
function placeholder(h, rawChild) {
  if (/\d-keep-alive$/.test(rawChild.tag)) {
    return h('keep-alive', {
      props: rawChild.componentOptions.propsData
    })
  }
}

// 判断父级节点中有没有transition属性 
function hasParentTransition(vnode) {
  while ((vnode = vnode.parent)) {
    if (vnode.data.transition) {
      return true
    }
  }
}
// 判断新老vnode是不是同一个节点
function isSameChild(child, oldChild) {
  return oldChild.key === child.key && oldChild.tag === child.tag
}

// 过滤文本节点（文本节点没有tag） 和异步组件站位节点
var isNotTextNode = function (c) {
  return c.tag || isAsyncPlaceholder(c);
};

// 判断是不是v-show
var isVShowDirective = function (d) {
  return d.name === 'show';
};

var Transition = {
  name: 'transition',
  props: transitionProps,
  abstract: true,

  render: function render(h) {
    var this$1 = this;
    // 抽象组件第一步都是先把子节点都拿出来
    // 也就是说在抽象组件就是为了父组件插槽传入的东西赋予一些功能
    // 像是缓存 - keepalive
    // 或是动画效果 - transition
    var children = this.$slots.default;
    if (!children) {
      return
    }

    // filter out text nodes (possible whitespaces)
    // 过滤文本节点
    children = children.filter(isNotTextNode);
    /* istanbul ignore if */
    if (!children.length) {
      return
    }

    // warn multiple elements
    // 提示 如果当前transition传入了多节点 弹出提示 建议只有一个子节点
    if (process.env.NODE_ENV !== 'production' && children.length > 1) {
      warn(
        '<transition> can only be used on a single element. Use ' +
        '<transition-group> for lists.',
        this.$parent
      );
    }

    // 获取当前动画模式
    var mode = this.mode;

    // warn invalid mode
    if (process.env.NODE_ENV !== 'production' &&
      mode && mode !== 'in-out' && mode !== 'out-in'
    ) {
      warn(
        'invalid <transition> mode: ' + mode,
        this.$parent
      );
    }

    // 获取需要添加动画的节点vnode
    var rawChild = children[0];

    // if this is a component root node and the component's
    // parent container node also has transition, skip.
    // 如果当前vnode的站位节点的父级中已经有了transition 直接跳过 返回当前vnode
    if (hasParentTransition(this.$vnode)) {
      return rawChild
    }

    // apply transition data to child
    // use getRealChild() to ignore abstract components e.g. keep-alive
    // 对于抽象的节点 需要获取到当前真实的非抽象节点
    var child = getRealChild(rawChild);
    /* istanbul ignore if */
    if (!child) {
      return rawChild
    }

    // 判断是不是离开状态 直接返回占位节点 （undefined）
    if (this._leaving) {
      return placeholder(h, rawChild)
    }

    // ensure a key that is unique to the vnode type and to this transition
    // component instance. This key will be used to remove pending leaving nodes
    // during entering.
    // 确保vnode类型和这个transition组件实例的键是唯一的。
    // 这个key将用于在enter期间删除挂起的离开节点。
    var id = "__transition-" + (this._uid) + "-";
    child.key = child.key == null ?
      child.isComment ? // 如果是注释节点
      id + 'comment' :
      id + child.tag :
      isPrimitive(child.key) ? // 判断是不是primitive值
      (String(child.key).indexOf(id) === 0 ? child.key : id + child.key) :
      child.key; // 如果有key  直接返回

      // 重要步骤：在transition的render过程中实际上就是为其子vnode添加transition属性
      // 这样一来子vnode在执行patch的过程中就能在对应的时机添加对应的class类
      // 最终完成样式过渡 其添加的属性都是从transition的vm中提取出来的 
      // 提取的内容就是我们为transitin添加的类名和一些组件事件
    var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
    var oldRawChild = this._vnode; // 当前vm对应的渲染vnode
    var oldChild = getRealChild(oldRawChild);// 获取渲染vnode的真实子节点

    // mark v-show
    // so that the transition module can hand over the control to the directive
    // 以便 transition 可以将控制权移交给指令
    if (child.data.directives && child.data.directives.some(isVShowDirective)) {
      child.data.show = true;
    }

    if (
      oldChild &&
      oldChild.data && // 旧节点存在 去替换他
      !isSameChild(child, oldChild) &&
      !isAsyncPlaceholder(oldChild) && // 并且新旧节点不是相同且旧节点不是站位节点
      // #6687 component root is a comment node
      !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
    ) {
      // replace old child transition data with fresh one
      // important for dynamic transitions!
      // 用新的transition去替换老的是动态转换的重要步骤
      var oldData = oldChild.data.transition = extend({}, data);
      // handle transition mode
      if (mode === 'out-in') { // 现出后入
        // return placeholder node and queue update when leave finishes
        this._leaving = true; // 将当前节点状态置为正在离开
        mergeVNodeHook(oldData, 'afterLeave', function () { // 合并钩子
          this$1._leaving = false; // 状态变化
          this$1.$forceUpdate(); // 在离开后强制更新视图
        });
        return placeholder(h, rawChild) // undefined
      } else if (mode === 'in-out') { // 先入后出
        if (isAsyncPlaceholder(child)) {
          return oldRawChild
        }
        var delayedLeave;
        var performLeave = function () { 
          delayedLeave();
        };
        mergeVNodeHook(data, 'afterEnter', performLeave); // 进入之后开始渲染离开动画
        mergeVNodeHook(data, 'enterCancelled', performLeave); // 进入被中断也渲染离开动画
        mergeVNodeHook(oldData, 'delayLeave', function (leave) { // 旧钩子离开后添加delayedleave方法
          delayedLeave = leave;
        });
      }
    }

    return rawChild
  }
};

/*  */

var props = extend({
  tag: String,
  moveClass: String
}, transitionProps);

delete props.mode;

var TransitionGroup = {
  props: props,

  beforeMount: function beforeMount() {
    var this$1 = this;

    var update = this._update;
    this._update = function (vnode, hydrating) {
      var restoreActiveInstance = setActiveInstance(this$1);
      // force removing pass
      this$1.__patch__(
        this$1._vnode, // 旧vnode
        this$1.kept, // 需要保留的vnode重新构建的一个vnode
        false, // hydrating
        true // removeOnly (!important, avoids unnecessary moves)
      );
      this$1._vnode = this$1.kept;
      restoreActiveInstance();
      update.call(this$1, vnode, hydrating);
    };
  },

  render: function render(h) {
    var tag = this.tag || this.$vnode.data.tag || 'span';
    var map = Object.create(null);
    var prevChildren = this.prevChildren = this.children;
    var rawChildren = this.$slots.default || [];
    var children = this.children = [];
    var transitionData = extractTransitionData(this);

    for (var i = 0; i < rawChildren.length; i++) {
      var c = rawChildren[i];
      if (c.tag) {
        if (c.key != null && String(c.key).indexOf('__vlist') !== 0) { // transition-group的每个child都必须有key属性 并且对于v-for的没有赋予key值（会被默认赋值为__vlist）的情况下也要排除
          children.push(c);
          map[c.key] = c;
          (c.data || (c.data = {})).transition = transitionData; // 为每一个子元素都添加过渡数据
        } else if (process.env.NODE_ENV !== 'production') {
          var opts = c.componentOptions;
          var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
          warn(("<transition-group> children must be keyed: <" + name + ">"));
        }
      }
    }

    if (prevChildren) { // 上次设置过渡的子数组
      var kept = [];
      var removed = [];
      for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
        var c$1 = prevChildren[i$1];
        c$1.data.transition = transitionData;
        c$1.data.pos = c$1.elm.getBoundingClientRect(); // 为了move动画作准备
        if (map[c$1.key]) { // 遍历 获得需要删除的和需要留下的key
          kept.push(c$1);
        } else {
          removed.push(c$1);
        }
      }
      this.kept = h(tag, null, kept); // 生成一个vnode
      this.removed = removed; //保存需要删除的
    }

    return h(tag, null, children) // 返回vnode
  },

  updated: function updated() {
    var children = this.prevChildren;
    var moveClass = this.moveClass || ((this.name || 'v') + '-move');
    if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
      return
    }

    // we divide the work into three loops to avoid mixing DOM reads and writes
    // in each iteration - which helps prevent layout thrashing.
    // 把所有需要的工作切分到三个循环中去 避免dom的混读混写 避免dom的抖动和变化
    children.forEach(callPendingCbs); // 执行钩子
    children.forEach(recordPosition); // 获取为止
    children.forEach(applyTranslation); // 移动元素

    // force reflow to put everything in position 
    // 触发页面重绘 因为上一步让元素translate需要重绘
    // 一个dom技巧 通过获取offsetheight触发页面重绘
    // assign to this to avoid being removed in tree-shaking
    // $flow-disable-line 避免tree-shaking去删除掉没有使用的变量
    this._reflow = document.body.offsetHeight;

    children.forEach(function (c) {
      if (c.data.moved) { // 如果当前child移动了
        var el = c.elm;
        var s = el.style;
        addTransitionClass(el, moveClass); // 添加移动样式
        s.transform = s.WebkitTransform = s.transitionDuration = ''; // 移除故意偏移的样式 也就是开始动画
        el.addEventListener(transitionEndEvent, el._moveCb = function cb(e) { // 在过渡结束后执行回调
          if (e && e.target !== el) {
            return
          }
          if (!e || /transform$/.test(e.propertyName)) { // 判断是不是transform属性变化
            el.removeEventListener(transitionEndEvent, cb); // 移除
            el._moveCb = null;
            removeTransitionClass(el, moveClass); //去除move样式
          }
        });
      }
    });
  },

  methods: {
    hasMove: function hasMove(el, moveClass) {
      /* istanbul ignore if */
      if (!hasTransition) {
        return false
      }
      /* istanbul ignore if */
      if (this._hasMove) {
        return this._hasMove
      }
      // Detect whether an element with the move class applied has
      // CSS transitions. Since the element may be inside an entering
      // transition at this very moment, we make a clone of it and remove
      // all other transition classes applied to ensure only the move class
      // is applied.
      // 这里这段代码看上去很奇怪 但实际上是为了检测当前添加的moveclass是不是包含transform属性
      var clone = el.cloneNode(); // 首先克隆一个dom节点
      if (el._transitionClasses) { // 移除上边所有的cls类 以防止在检测过程中造成干扰
        el._transitionClasses.forEach(function (cls) {
          removeClass(clone, cls);
        });
      }
      addClass(clone, moveClass); // 添加moveclass
      clone.style.display = 'none'; // 只是为了检测所以并不需要展示在页面上
      this.$el.appendChild(clone); // 添加当前节点到vm.$el上 就可以通过window.computedStyle()去计算class属性了
      var info = getTransitionInfo(clone); // 通过computedStyle去计算属性 从而判断包不包含transform属性
      this.$el.removeChild(clone); // 获得数据后删除节点
      return (this._hasMove = info.hasTransform) // 返回检测结果并缓存
    }
  }
};

// 执行等待执行的钩子
function callPendingCbs(c) {
  /* istanbul ignore if */
  if (c.elm._moveCb) {
    c.elm._moveCb();
  }
  /* istanbul ignore if */
  if (c.elm._enterCb) {
    c.elm._enterCb();
  }
}

function recordPosition(c) {
  c.data.newPos = c.elm.getBoundingClientRect();
}

function applyTranslation(c) {
  var oldPos = c.data.pos;
  var newPos = c.data.newPos;
  var dx = oldPos.left - newPos.left;
  var dy = oldPos.top - newPos.top;
  if (dx || dy) {
    c.data.moved = true;
    var s = c.elm.style; // 先让当前dom回到上次的位置 然后移除这个偏移量 就会回到他应该在的位置 也就有了动画效果
    s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
    s.transitionDuration = '0s'; // 瞬间回到上次的位置
  }
}

var platformComponents = {
  Transition: Transition,
  TransitionGroup: TransitionGroup
};

/*  */

// install platform specific utils
Vue.config.mustUseProp = mustUseProp;
Vue.config.isReservedTag = isReservedTag;
Vue.config.isReservedAttr = isReservedAttr;
Vue.config.getTagNamespace = getTagNamespace;
Vue.config.isUnknownElement = isUnknownElement;

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives);
extend(Vue.options.components, platformComponents);

// install platform patch function
// 在 web 平台上，是否是服务端渲染也会对这个方法产生影响。
// 因为在服务端渲染中，没有真实的浏览器 DOM 环境，所以不需要把 VNode 最终转换成 DOM，因此是一个空函数，而在浏览器端渲染中，它指向了 patch 方法，
Vue.prototype.__patch__ = inBrowser ? patch : noop;

// public mount method
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating) // 挂载当前vm到el上去
};

// devtools global hook
/* istanbul ignore next */
if (inBrowser) {
  setTimeout(function () {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue);
      } else if (
        process.env.NODE_ENV !== 'production' &&
        process.env.NODE_ENV !== 'test'
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        );
      }
    }
    if (process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      config.productionTip !== false &&
      typeof console !== 'undefined'
    ) {
      console[console.info ? 'info' : 'log'](
        "You are running Vue in development mode.\n" +
        "Make sure to turn on production mode when deploying for production.\n" +
        "See more tips at https://vuejs.org/guide/deployment.html"
      );
    }
  }, 0);
}

/*  */

/**
 * {{任意字符一个或多个}}
 * {{\n一个或多个}}
 * {{\r\n一个或多个}}
 */
var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
/**
 * 正则内置符号
 * -.*+?${}()|[]/\\
 * 通过一个正则将字面量正则表达式转化成new Regex的形式 
 * 例如 /(a|b)[1-10]/ 通过下边replace方法转化成 "\/\(a\|b\)\[1\-10\]\/g" 在所有内置符号前边都加一个\
 * $&就表示匹配到的内容本身 (a|b)[1-10] 中的 ( 替换成\( 所以$&就匹配了(本身
 */
var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

var buildRegex = cached(function (delimiters) {
  var open = delimiters[0].replace(regexEscapeRE, '\\$&');
  var close = delimiters[1].replace(regexEscapeRE, '\\$&');
  return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
});

/**
 * 解析文本
 * text：字符串
 * deli：分隔符
 */
function parseText(
  text,
  delimiters
) {
  // 解析{{}}
  var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
  if (!tagRE.test(text)) {
    return
  }
  var tokens = [];
  var rawTokens = [];
  var lastIndex = tagRE.lastIndex = 0;
  var match, index, tokenValue;
  while ((match = tagRE.exec(text))) {
    index = match.index;
    // push text token
    if (index > lastIndex) {
      rawTokens.push(tokenValue = text.slice(lastIndex, index));
      tokens.push(JSON.stringify(tokenValue));
    }
    // tag token
    var exp = parseFilters(match[1].trim());
    tokens.push(("_s(" + exp + ")"));
    rawTokens.push({
      '@binding': exp
    });
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) {
    rawTokens.push(tokenValue = text.slice(lastIndex));
    tokens.push(JSON.stringify(tokenValue));
  }
  return {
    expression: tokens.join('+'),
    tokens: rawTokens
  }
}

/*  */
/**
 * 为ast添加静态class和动态bind的class 属性
 * @param {*} el 
 * @param {*} options 
 */
function transformNode(el, options) {
  var warn = options.warn || baseWarn;
  var staticClass = getAndRemoveAttr(el, 'class');
  if (process.env.NODE_ENV !== 'production' && staticClass) {
    var res = parseText(staticClass, options.delimiters);
    if (res) {
      warn(
        "class=\"" + staticClass + "\": " +
        'Interpolation inside attributes has been removed. ' +
        'Use v-bind or the colon shorthand instead. For example, ' +
        'instead of <div class="{{ val }}">, use <div :class="val">.',
        el.rawAttrsMap['class']
      );
    }
  }
  if (staticClass) {
    el.staticClass = JSON.stringify(staticClass);
  }
  // class 的静态和动态是明确分离的 如果传入字符串不加冒号是不会被解析为vue的变量的
  var classBinding = getBindingAttr(el, 'class', false /* getStatic */ );
  if (classBinding) {
    el.classBinding = classBinding;
  }
}

/**
 * 根据ast生成render时候需要的vnodedata
 * @param {*} el 
 */
function genData(el) {
  var data = '';
  if (el.staticClass) {
    data += "staticClass:" + (el.staticClass) + ",";
  }
  if (el.classBinding) {
    data += "class:" + (el.classBinding) + ",";
  }
  return data
}

// 包括了在编译阶段需要的工具方法 
var klass$1 = {
  staticKeys: ['staticClass'],
  transformNode: transformNode, // 生成class相关代码
  genData: genData // 生成vnodedata
};

/*  */

/**
 * 生成静态的style和动态绑定的style 和class机制完全一致
 * @param {*} el 
 * @param {*} options 
 */
function transformNode$1(el, options) {
  var warn = options.warn || baseWarn;
  var staticStyle = getAndRemoveAttr(el, 'style');
  if (staticStyle) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      var res = parseText(staticStyle, options.delimiters);
      if (res) { // 如果通过{{}}语法解析到了对应的值 则警告 
              // 这种语法在某个元素的属性上 这在vue中是不合法的
        warn(
          "style=\"" + staticStyle + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div style="{{ val }}">, use <div :style="val">.',
          el.rawAttrsMap['style']
        );
      }
    }
    el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
  }

  var styleBinding = getBindingAttr(el, 'style', false /* getStatic */ );
  if (styleBinding) {
    el.styleBinding = styleBinding;
  }
}

// 生成style代码
function genData$1(el) {
  var data = '';
  if (el.staticStyle) {
    data += "staticStyle:" + (el.staticStyle) + ",";
  }
  if (el.styleBinding) {
    data += "style:(" + (el.styleBinding) + "),";
  }
  return data
}

var style$1 = {
  staticKeys: ['staticStyle'],
  transformNode: transformNode$1,
  genData: genData$1
};

/*  */

var decoder;

var he = {
  decode: function decode(html) {
    decoder = decoder || document.createElement('div');
    decoder.innerHTML = html;
    return decoder.textContent
  }
};

/*  */

var isUnaryTag = makeMap(
  'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
  'link,meta,param,source,track,wbr'
);

// Elements that you can, intentionally, leave open
// (and which close themselves)
var canBeLeftOpenTag = makeMap(
  'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
);

// HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
// Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
var isNonPhrasingTag = makeMap(
  'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
  'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
  'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
  'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
  'title,tr,track'
);

/**
 * Not type-checking this file because it's mostly vendor code.
 */

// Regular Expressions for parsing tags and attributes
var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
var startTagOpen = new RegExp(("^<" + qnameCapture));
var startTagClose = /^\s*(\/?)>/;
var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
var doctype = /^<!DOCTYPE [^>]+>/i;
// #7298: escape - to avoid being passed as HTML comment when inlined in page
var comment = /^<!\--/;
var conditionalComment = /^<!\[/;

// Special Elements (can contain anything)
var isPlainTextElement = makeMap('script,style,textarea', true);
var reCache = {};

var decodingMap = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&amp;': '&',
  '&#10;': '\n',
  '&#9;': '\t',
  '&#39;': "'"
};
var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

// #5992
var isIgnoreNewlineTag = makeMap('pre,textarea', true);
var shouldIgnoreFirstNewline = function (tag, html) {
  return tag && isIgnoreNewlineTag(tag) && html[0] === '\n';
};

function decodeAttr(value, shouldDecodeNewlines) {
  var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
  return value.replace(re, function (match) {
    return decodingMap[match];
  })
}

/**
 * 解析html
 * @param {*} html  template模版
 * @param {*} options 配置
 */
function parseHTML(html, options) {
  var stack = [];
  var expectHTML = options.expectHTML;
  var isUnaryTag$$1 = options.isUnaryTag || no;
  var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no;
  var index = 0; // 当前解析到的索引
  var last, lastTag; // 上次解析的文本和上次解析的标签
  while (html) {
    last = html;
    // Make sure we're not in a plaintext content element like script/style
    if (!lastTag || !isPlainTextElement(lastTag)) {
      var textEnd = html.indexOf('<');
      if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) { // 注释节点的判断
          var commentEnd = html.indexOf('-->');

          if (commentEnd >= 0) {
            if (options.shouldKeepComment) { // 判断最终是否需要保留注释节点 如果保留去创建一个注释节点的ast
              options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
            }
            advance(commentEnd + 3);
            continue
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) { // 判断当前针对某些特殊情况做的注释 例如 <![if ie 8]>
          var conditionalEnd = html.indexOf(']>');

          if (conditionalEnd >= 0) {
            advance(conditionalEnd + 2);
            continue
          }
        }

        // Doctype:
        var doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
          advance(doctypeMatch[0].length);
          continue
        }

        // End tag:
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          var curIndex = index;
          advance(endTagMatch[0].length);
          parseEndTag(endTagMatch[1], curIndex, index);
          continue
        }

        // Start tag:
        var startTagMatch = parseStartTag();
        if (startTagMatch) {
          handleStartTag(startTagMatch);
          if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
            advance(1);
          }
          continue
        }
      }

      var text = (void 0),
        rest = (void 0),
        next = (void 0);
      if (textEnd >= 0) {
        rest = html.slice(textEnd);
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1);
          if (next < 0) {
            break
          }
          textEnd += next;
          rest = html.slice(textEnd);
        }
        text = html.substring(0, textEnd);
      }

      if (textEnd < 0) {
        text = html;
      }

      if (text) {
        advance(text.length);
      }

      if (options.chars && text) {
        options.chars(text, index - text.length, index);
      }
    } else {
      var endTagLength = 0;
      var stackedTag = lastTag.toLowerCase();
      var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
      var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
        endTagLength = endTag.length;
        if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
          text = text
            .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
            .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
        }
        if (shouldIgnoreFirstNewline(stackedTag, text)) {
          text = text.slice(1);
        }
        if (options.chars) {
          options.chars(text);
        }
        return ''
      });
      index += html.length - rest$1.length;
      html = rest$1;
      parseEndTag(stackedTag, index - endTagLength, index);
    }

    if (html === last) {
      options.chars && options.chars(html);
      if (process.env.NODE_ENV !== 'production' && !stack.length && options.warn) {
        options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), {
          start: index + html.length
        });
      }
      break
    }
  }

  // Clean up any remaining tags
  parseEndTag();

  /**
   * 修改 index 并保留还没有解析的文本 需要不断通过调用advance去向后移动索引 不端去解析标签
   */
  function advance(n) {
    index += n;
    html = html.substring(n);
  }

  /**
   * 解析开始标签
   */
  function parseStartTag() {
    var start = html.match(startTagOpen);
    if (start) {
      var match = {
        tagName: start[1],
        attrs: [],
        start: index
      };
      advance(start[0].length);
      var end, attr;
      while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
        attr.start = index;
        advance(attr[0].length);
        attr.end = index;
        match.attrs.push(attr);
      }
      if (end) {
        match.unarySlash = end[1];
        advance(end[0].length);
        match.end = index;
        return match
      }
    }
  }

  function handleStartTag(match) {
    var tagName = match.tagName;
    var unarySlash = match.unarySlash;

    if (expectHTML) {
      if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
        parseEndTag(lastTag);
      }
      if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
        parseEndTag(tagName);
      }
    }

    var unary = isUnaryTag$$1(tagName) || !!unarySlash;

    var l = match.attrs.length;
    var attrs = new Array(l);
    for (var i = 0; i < l; i++) {
      var args = match.attrs[i];
      var value = args[3] || args[4] || args[5] || '';
      var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href' ?
        options.shouldDecodeNewlinesForHref :
        options.shouldDecodeNewlines;
      attrs[i] = {
        name: args[1],
        value: decodeAttr(value, shouldDecodeNewlines)
      };
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        attrs[i].start = args.start + args[0].match(/^\s*/).length;
        attrs[i].end = args.end;
      }
    }

    if (!unary) {
      stack.push({
        tag: tagName,
        lowerCasedTag: tagName.toLowerCase(),
        attrs: attrs,
        start: match.start,
        end: match.end
      });
      lastTag = tagName;
    }

    if (options.start) {
      options.start(tagName, attrs, unary, match.start, match.end);
    }
  }

  function parseEndTag(tagName, start, end) {
    var pos, lowerCasedTagName;
    if (start == null) {
      start = index;
    }
    if (end == null) {
      end = index;
    }

    // Find the closest opened tag of the same type
    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase();
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0;
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (var i = stack.length - 1; i >= pos; i--) {
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            ("tag <" + (stack[i].tag) + "> has no matching end tag."), {
              start: stack[i].start,
              end: stack[i].end
            }
          );
        }
        if (options.end) {
          options.end(stack[i].tag, start, end);
        }
      }

      // Remove the open elements from the stack
      stack.length = pos;
      lastTag = pos && stack[pos - 1].tag;
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end);
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end);
      }
      if (options.end) {
        options.end(tagName, start, end);
      }
    }
  }
}

/*  */

var onRE = /^@|^v-on:/; // 以每一项开头 v-on:click
var dirRE = /^v-|^@|^:|^#/; // 以每一项开头  v-bind   
var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/; // any in|of any    i in 
/**
 * ,结尾  
 * ,加上除了,}]的任意字符结尾 
 * ,加上除了,}]的任意字符再加上,结尾 
 * ,加上除了,}]的任意字符再加上,再加上加上除了,}]结尾    
 *  这个正则至多匹配两个逗号 例如 ,a,v | ,a | , | , a ,| , ,  
 */
var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
var stripParensRE = /^\(|\)$/g; // 以‘(’开头 或者 以‘)’结尾
var dynamicArgRE = /^\[.*\]$/; // [ 任意字符除了空格 ]

var argRE = /:(.*)$/; // :加上除了换行符的任意字符
var bindRE = /^:|^\.|^v-bind:/; // 以: . v-bind三者之一开头
/**
 * ‘.native.prevent = ’ 将匹配到[".native", ".prevent = "]
 * .加上除了.]的任意字符一次或者多次且后边跟着除了]的任意字符0到多次
 */
var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;

/**
 * 以v-slot开头然后直接结尾
 * 以v-slot开头然后加:不一定结尾
 * 以#开头
 */
var slotRE = /^v-slot(:|$)|^#/;

var lineBreakRE = /[\r\n]/; // 换行
var whitespaceRE$1 = /\s+/g; // 空格

/**
 * 空格 换行符 "'<>/= 中的任意一个
 */
var invalidAttributeRE = /[\s"'<>\/=]/;

var decodeHTMLCached = cached(he.decode);

var emptySlotScopeToken = "_empty_";

// configurable state
var warn$2;
var delimiters;
var transforms;
var preTransforms;
var postTransforms;
var platformIsPreTag;
var platformMustUseProp;
var platformGetTagNamespace;
var maybeComponent;

// 创建一个基本的ast节点
function createASTElement(
  tag,
  attrs,
  parent
) {
  return {
    type: 1,
    tag: tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent: parent,
    children: []
  }
}

/**
 * Convert HTML string to AST.
 * 将html标签转化成抽象语法树
 */
function parse(
  template,
  options
) {
  // *********  解析options ********
  warn$2 = options.warn || baseWarn;

  platformIsPreTag = options.isPreTag || no;
  platformMustUseProp = options.mustUseProp || no;
  platformGetTagNamespace = options.getTagNamespace || no;
  var isReservedTag = options.isReservedTag || no;
  maybeComponent = function (el) {
    return !!el.component || !isReservedTag(el.tag);
  };

  // 将class model style的同类型方法都合并到一个数组中去 方便一次调用 也更容易模块化
  transforms = pluckModuleFunction(options.modules, 'transformNode');
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

  delimiters = options.delimiters;

  var stack = [];
  var preserveWhitespace = options.preserveWhitespace !== false;
  var whitespaceOption = options.whitespace;

  // ************* end **********
  var root;
  var currentParent;
  var inVPre = false;
  var inPre = false;
  var warned = false;

  function warnOnce(msg, range) {
    if (!warned) {
      warned = true;
      warn$2(msg, range);
    }
  }

  function closeElement(element) {
    trimEndingWhitespace(element);
    if (!inVPre && !element.processed) {
      element = processElement(element, options);
    }
    // tree management
    if (!stack.length && element !== root) {
      // allow root elements with v-if, v-else-if and v-else
      if (root.if && (element.elseif || element.else)) {
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(element);
        }
        addIfCondition(root, {
          exp: element.elseif,
          block: element
        });
      } else if (process.env.NODE_ENV !== 'production') {
        warnOnce(
          "Component template should contain exactly one root element. " +
          "If you are using v-if on multiple elements, " +
          "use v-else-if to chain them instead.", {
            start: element.start
          }
        );
      }
    }
    if (currentParent && !element.forbidden) {
      if (element.elseif || element.else) {
        processIfConditions(element, currentParent);
      } else {
        if (element.slotScope) {
          // scoped slot
          // keep it in the children list so that v-else(-if) conditions can
          // find it as the prev node.
          var name = element.slotTarget || '"default"';
          (currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
        }
        currentParent.children.push(element);
        element.parent = currentParent;
      }
    }

    // final children cleanup
    // filter out scoped slots
    element.children = element.children.filter(function (c) {
      return !(c).slotScope;
    });
    // remove trailing whitespace node again
    trimEndingWhitespace(element);

    // check pre state
    if (element.pre) {
      inVPre = false;
    }
    if (platformIsPreTag(element.tag)) {
      inPre = false;
    }
    // apply post-transforms
    for (var i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options);
    }
  }

  function trimEndingWhitespace(el) {
    // remove trailing whitespace node
    if (!inPre) {
      var lastNode;
      while (
        (lastNode = el.children[el.children.length - 1]) &&
        lastNode.type === 3 &&
        lastNode.text === ' '
      ) {
        el.children.pop();
      }
    }
  }

  function checkRootConstraints(el) {
    if (el.tag === 'slot' || el.tag === 'template') {
      warnOnce(
        "Cannot use <" + (el.tag) + "> as component root element because it may " +
        'contain multiple nodes.', {
          start: el.start
        }
      );
    }
    if (el.attrsMap.hasOwnProperty('v-for')) {
      warnOnce(
        'Cannot use v-for on stateful component root element because ' +
        'it renders multiple elements.',
        el.rawAttrsMap['v-for']
      );
    }
  }

  parseHTML(template, {
    warn: warn$2,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    start: function start(tag, attrs, unary, start$1, end) {
      // check namespace.
      // inherit parent ns if there is one
      var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs);
      }

      var element = createASTElement(tag, attrs, currentParent);
      if (ns) {
        element.ns = ns;
      }

      if (process.env.NODE_ENV !== 'production') {
        if (options.outputSourceRange) {
          element.start = start$1;
          element.end = end;
          element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
            cumulated[attr.name] = attr;
            return cumulated
          }, {});
        }
        attrs.forEach(function (attr) {
          if (invalidAttributeRE.test(attr.name)) {
            warn$2(
              "Invalid dynamic argument expression: attribute names cannot contain " +
              "spaces, quotes, <, >, / or =.", {
                start: attr.start + attr.name.indexOf("["),
                end: attr.start + attr.name.length
              }
            );
          }
        });
      }

      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forbidden = true;
        process.env.NODE_ENV !== 'production' && warn$2(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          "<" + tag + ">" + ', as they will not be parsed.', {
            start: element.start
          }
        );
      }

      // apply pre-transforms
      for (var i = 0; i < preTransforms.length; i++) {
        element = preTransforms[i](element, options) || element;
      }

      if (!inVPre) {
        processPre(element);
        if (element.pre) {
          inVPre = true;
        }
      }
      if (platformIsPreTag(element.tag)) {
        inPre = true;
      }
      if (inVPre) {
        processRawAttrs(element);
      } else if (!element.processed) {
        // structural directives
        processFor(element);
        processIf(element);
        processOnce(element);
      }

      if (!root) {
        root = element;
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(root); // 检查是不是slot或者template节点
        }
      }

      if (!unary) {
        currentParent = element;
        stack.push(element);
      } else {
        closeElement(element);
      }
    },

    end: function end(tag, start, end$1) {
      var element = stack[stack.length - 1];
      // pop stack
      stack.length -= 1;
      currentParent = stack[stack.length - 1];
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        element.end = end$1;
      }
      closeElement(element);
    },

    chars: function chars(text, start, end) {
      if (!currentParent) {
        if (process.env.NODE_ENV !== 'production') {
          if (text === template) {
            warnOnce(
              'Component template requires a root element, rather than just text.', {
                start: start
              }
            );
          } else if ((text = text.trim())) {
            warnOnce(
              ("text \"" + text + "\" outside root element will be ignored."), {
                start: start
              }
            );
          }
        }
        return
      }
      // IE textarea placeholder bug
      /* istanbul ignore if */
      if (isIE &&
        currentParent.tag === 'textarea' &&
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }
      var children = currentParent.children;
      if (inPre || text.trim()) {
        text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
      } else if (!children.length) {
        // remove the whitespace-only node right after an opening tag
        text = '';
      } else if (whitespaceOption) {
        if (whitespaceOption === 'condense') {
          // in condense mode, remove the whitespace node if it contains
          // line break, otherwise condense to a single space
          text = lineBreakRE.test(text) ? '' : ' ';
        } else {
          text = ' ';
        }
      } else {
        text = preserveWhitespace ? ' ' : '';
      }
      if (text) {
        if (!inPre && whitespaceOption === 'condense') {
          // condense consecutive whitespaces into single space
          text = text.replace(whitespaceRE$1, ' ');
        }
        var res;
        var child;
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          child = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text: text
          };
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          child = {
            type: 3,
            text: text
          };
        }
        if (child) {
          if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
            child.start = start;
            child.end = end;
          }
          children.push(child);
        }
      }
    },
    comment: function comment(text, start, end) {
      // adding anyting as a sibling to the root node is forbidden
      // comments should still be allowed, but ignored
      if (currentParent) {
        var child = {
          type: 3,
          text: text,
          isComment: true
        };
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          child.start = start;
          child.end = end;
        }
        currentParent.children.push(child);
      }
    }
  });
  return root
}

function processPre(el) {
  if (getAndRemoveAttr(el, 'v-pre') != null) {
    el.pre = true;
  }
}

function processRawAttrs(el) {
  var list = el.attrsList;
  var len = list.length;
  if (len) {
    var attrs = el.attrs = new Array(len);
    for (var i = 0; i < len; i++) {
      attrs[i] = {
        name: list[i].name,
        value: JSON.stringify(list[i].value)
      };
      if (list[i].start != null) {
        attrs[i].start = list[i].start;
        attrs[i].end = list[i].end;
      }
    }
  } else if (!el.pre) {
    // non root node in pre blocks with no attributes
    el.plain = true;
  }
}

// 处理元素的属性  像是 v-model slot  把属性从字符串上拿到并形成对象 也就是ast上边属性 供代码生成阶段使用
function processElement(
  element,
  options
) {
  processKey(element);

  // determine whether this is a plain element after
  // removing structural attributes
  element.plain = (
    !element.key &&
    !element.scopedSlots &&
    !element.attrsList.length
  );

  processRef(element);
  processSlotContent(element); // 处理父组件中的 slot='name' ｜ v-slot 默认插槽  ｜ v-slot:name 具名插槽 ｜ 
  processSlotOutlet(element); // 处理子组件中的 <slot name='name' />
  processComponent(element); // 处理 :is :inline-template  inline这个属性是vue官方不推荐的写法
  for (var i = 0; i < transforms.length; i++) {
    element = transforms[i](element, options) || element; // 通过提取出来的对应模块上的transform方法进行处理 在web下只处理了v-model
  }
  processAttrs(element); // 处理一般属性到ast树上 
  return element
}

function processKey(el) {
  var exp = getBindingAttr(el, 'key');
  if (exp) {
    if (process.env.NODE_ENV !== 'production') {
      if (el.tag === 'template') {
        warn$2(
          "<template> cannot be keyed. Place the key on real elements instead.",
          getRawBindingAttr(el, 'key')
        );
      }
      if (el.for) {
        var iterator = el.iterator2 || el.iterator1;
        var parent = el.parent;
        if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
          warn$2(
            "Do not use v-for index as key on <transition-group> children, " +
            "this is the same as not using keys.",
            getRawBindingAttr(el, 'key'),
            true /* tip */
          );
        }
      }
    }
    el.key = exp;
  }
}

// 处理ref属性
function processRef(el) {
  var ref = getBindingAttr(el, 'ref');
  if (ref) {
    el.ref = ref;
    el.refInFor = checkInFor(el);
  }
}

/**
 * 处理v-for的语句内容 添加一个
 * @param {*} el   AST element
 * 
 */
function processFor(el) {
  var exp;
  if ((exp = getAndRemoveAttr(el, 'v-for'))) {
    var res = parseFor(exp); // 得到v-for解析后的对象
    if (res) {
      extend(el, res); // 扩展到ast上
    } else if (process.env.NODE_ENV !== 'production') {
      warn$2(
        ("Invalid v-for expression: " + exp),
        el.rawAttrsMap['v-for']
      );
    }
  }
}


/**
 * 解析for
 * @param {*} exp 
 */
function parseFor(exp) {
  // 返回匹配内容的数组  
  // [0] 是完成匹配的内容 [1][2]则是对应的捕获组 
  // 由于foraliasre中忽略了中间 in/of的一组 所以[1]对应的是item index key 
  // [2]对应的就是object
  var inMatch = exp.match(forAliasRE);  // (item,index,key) in|of object
  if (!inMatch) {
    return
  }
  var res = {};
  res.for = inMatch[2].trim(); // object
  var alias = inMatch[1].trim().replace(stripParensRE, '');  // 去除括号 得到 item index key
  var iteratorMatch = alias.match(forIteratorRE); 
  if (iteratorMatch) { // 判断需不需要索引或者key
    res.alias = alias.replace(forIteratorRE, '').trim(); // 匹配到 item  也就是别名
    res.iterator1 = iteratorMatch[1].trim(); // 匹配到索引 
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim(); // 如果是对象 允许传入第三个值 为 key
    }
  } else { // 直接将值拿过来
    res.alias = alias;
  }
  return res
}

/**
 * 处理v-if
 */
function processIf(el) {
  var exp = getAndRemoveAttr(el, 'v-if');
  if (exp) { // 判断if语句
    el.if = exp;
    addIfCondition(el, {
      exp: exp,
      block: el
    });
  } else { // 如果没有v-if就去处理v-else  v-else-if
    if (getAndRemoveAttr(el, 'v-else') != null) {
      el.else = true;
    }
    var elseif = getAndRemoveAttr(el, 'v-else-if');
    if (elseif) {
      el.elseif = elseif;
    }
  }
}

function processIfConditions(el, parent) {
  var prev = findPrevElement(parent.children);
  if (prev && prev.if) {
    addIfCondition(prev, {
      exp: el.elseif,
      block: el
    });
  } else if (process.env.NODE_ENV !== 'production') {
    warn$2(
      "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
      "used on element <" + (el.tag) + "> without corresponding v-if.",
      el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
    );
  }
}

function findPrevElement(children) {
  var i = children.length;
  while (i--) {
    if (children[i].type === 1) {
      return children[i]
    } else {
      if (process.env.NODE_ENV !== 'production' && children[i].text !== ' ') {
        warn$2(
          "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
          "will be ignored.",
          children[i]
        );
      }
      children.pop();
    }
  }
}

/**
 * 向ast的vif判断条件数组中添加当前表达式
 * @param {*} el 
 * @param {*} condition v-if 的表达式
 */
function addIfCondition(el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = [];
  }
  el.ifConditions.push(condition);
}

/**
 * 处理 v-once
 * @param {*} el 
 */
function processOnce(el) {
  var once$$1 = getAndRemoveAttr(el, 'v-once');
  if (once$$1 != null) {
    el.once = true;
  }
}

// handle content being passed to a component as slot,
// e.g. <template slot="xxx">, <div slot-scope="xxx">
function processSlotContent(el) {
  var slotScope;
  if (el.tag === 'template') { // 作用域插槽相关
    slotScope = getAndRemoveAttr(el, 'scope');
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && slotScope) {
      warn$2(
        "the \"scope\" attribute for scoped slots have been deprecated and " +
        "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
        "can also be used on plain elements in addition to <template> to " +
        "denote scoped slots.",
        el.rawAttrsMap['scope'],
        true
      );
    }
    el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
  } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && el.attrsMap['v-for']) {
      warn$2(
        "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
        "(v-for takes higher priority). Use a wrapper <template> for the " +
        "scoped slot to make it clearer.",
        el.rawAttrsMap['slot-scope'],
        true
      );
    }
    el.slotScope = slotScope;
  }

  // slot="xxx"
  var slotTarget = getBindingAttr(el, 'slot');
  if (slotTarget) {
    el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
    el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);
    // preserve slot as an attribute for native shadow DOM compat
    // only for non-scoped slots.
    if (el.tag !== 'template' && !el.slotScope) {
      addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
    }
  }

  // 2.6 v-slot syntax
  {
    if (el.tag === 'template') {
      // v-slot on <template>
      var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
      if (slotBinding) {
        if (process.env.NODE_ENV !== 'production') {
          if (el.slotTarget || el.slotScope) {
            warn$2(
              "Unexpected mixed usage of different slot syntaxes.",
              el
            );
          }
          if (el.parent && !maybeComponent(el.parent)) {
            warn$2(
              "<template v-slot> can only appear at the root level inside " +
              "the receiving component",
              el
            );
          }
        }
        var ref = getSlotName(slotBinding);
        var name = ref.name;
        var dynamic = ref.dynamic;
        el.slotTarget = name;
        el.slotTargetDynamic = dynamic;
        el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
      }
    } else {
      // v-slot on component, denotes default slot
      var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
      if (slotBinding$1) {
        if (process.env.NODE_ENV !== 'production') {
          if (!maybeComponent(el)) {
            warn$2(
              "v-slot can only be used on components or <template>.",
              slotBinding$1
            );
          }
          if (el.slotScope || el.slotTarget) {
            warn$2(
              "Unexpected mixed usage of different slot syntaxes.",
              el
            );
          }
          if (el.scopedSlots) {
            warn$2(
              "To avoid scope ambiguity, the default slot should also use " +
              "<template> syntax when there are other named slots.",
              slotBinding$1
            );
          }
        }
        // add the component's children to its default slot
        var slots = el.scopedSlots || (el.scopedSlots = {});
        var ref$1 = getSlotName(slotBinding$1);
        var name$1 = ref$1.name;
        var dynamic$1 = ref$1.dynamic;
        var slotContainer = slots[name$1] = createASTElement('template', [], el);
        slotContainer.slotTarget = name$1;
        slotContainer.slotTargetDynamic = dynamic$1;
        slotContainer.children = el.children.filter(function (c) {
          if (!c.slotScope) {
            c.parent = slotContainer;
            return true
          }
        });
        slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
        // remove children as they are returned from scopedSlots now
        el.children = [];
        // mark el non-plain so data gets generated
        el.plain = false;
      }
    }
  }
}

// 根据v-slot语法获取插槽名字
function getSlotName(binding) {
  var name = binding.name.replace(slotRE, '');
  if (!name) {
    if (binding.name[0] !== '#') {
      name = 'default';
    } else if (process.env.NODE_ENV !== 'production') {
      warn$2(
        "v-slot shorthand syntax requires a slot name.",
        binding
      );
    }
  }
  return dynamicArgRE.test(name)
    // dynamic [name]
    ?
    {
      name: name.slice(1, -1),
      dynamic: true
    }
    // static name
    :
    {
      name: ("\"" + name + "\""),
      dynamic: false
    }
}

// handle <slot/> outlets <slot name='name' />
function processSlotOutlet(el) {
  if (el.tag === 'slot') {
    el.slotName = getBindingAttr(el, 'name');
    if (process.env.NODE_ENV !== 'production' && el.key) {
      warn$2(
        "`key` does not work on <slot> because slots are abstract outlets " +
        "and can possibly expand into multiple elements. " +
        "Use the key on a wrapping element instead.",
        getRawBindingAttr(el, 'key')
      );
    }
  }
}

/**
 * 处理组件相关ast属性 
 * 为当前ast添加component 属性和 inlinetemplate属性
 * @param {*} el 
 */
function processComponent(el) {
  var binding;
  if ((binding = getBindingAttr(el, 'is'))) {
    el.component = binding;
  }
  if (getAndRemoveAttr(el, 'inline-template') != null) {
    el.inlineTemplate = true;
  }
}

/**
 * 处理定义在模版上的属性  像是 v-on v-bind  @ : 等等
 * @param {*} el 
 */
function processAttrs(el) {
  var list = el.attrsList;
  var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
  for (i = 0, l = list.length; i < l; i++) {
    name = rawName = list[i].name;
    value = list[i].value;
    if (dirRE.test(name)) { // 指令
      // mark element as dynamic
      el.hasBindings = true;
      // modifiers
      modifiers = parseModifiers(name.replace(dirRE, ''));
      // support .foo shorthand syntax for the .prop modifier
      if (modifiers) {
        name = name.replace(modifierRE, '');
      }
      if (bindRE.test(name)) { // v-bind
        name = name.replace(bindRE, '');
        value = parseFilters(value);
        isDynamic = dynamicArgRE.test(name);
        if (isDynamic) {
          name = name.slice(1, -1);
        }
        if (
          process.env.NODE_ENV !== 'production' &&
          value.trim().length === 0
        ) {
          warn$2(
            ("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
          );
        }
        if (modifiers) {
          if (modifiers.prop && !isDynamic) {
            name = camelize(name);
            if (name === 'innerHtml') {
              name = 'innerHTML';
            }
          }
          if (modifiers.camel && !isDynamic) {
            name = camelize(name);
          }
          if (modifiers.sync) {
            syncGen = genAssignmentCode(value, "$event");
            if (!isDynamic) {
              addHandler(
                el,
                ("update:" + (camelize(name))),
                syncGen,
                null,
                false,
                warn$2,
                list[i]
              );
              if (hyphenate(name) !== camelize(name)) {
                addHandler(
                  el,
                  ("update:" + (hyphenate(name))),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i]
                );
              }
            } else {
              // handler w/ dynamic event name
              addHandler(
                el,
                ("\"update:\"+(" + name + ")"),
                syncGen,
                null,
                false,
                warn$2,
                list[i],
                true // dynamic
              );
            }
          }
        }
        if ((modifiers && modifiers.prop) || (
            !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
          )) {
          addProp(el, name, value, list[i], isDynamic);
        } else {
          addAttr(el, name, value, list[i], isDynamic);
        }
      } else if (onRE.test(name)) { // v-on
        name = name.replace(onRE, '');
        isDynamic = dynamicArgRE.test(name);
        if (isDynamic) {
          name = name.slice(1, -1);
        }
        addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
      } else { // normal directives v-model会走这里
        name = name.replace(dirRE, '');
        // parse arg
        var argMatch = name.match(argRE);
        var arg = argMatch && argMatch[1];
        isDynamic = false;
        if (arg) {
          name = name.slice(0, -(arg.length + 1));
          if (dynamicArgRE.test(arg)) {
            arg = arg.slice(1, -1);
            isDynamic = true;
          }
        }
        addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
        if (process.env.NODE_ENV !== 'production' && name === 'model') {
          checkForAliasModel(el, value);
        }
      }
    } else {
      // literal attribute
      if (process.env.NODE_ENV !== 'production') {
        var res = parseText(value, delimiters);
        if (res) {
          warn$2(
            name + "=\"" + value + "\": " +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div id="{{ val }}">, use <div :id="val">.',
            list[i]
          );
        }
      }
      addAttr(el, name, JSON.stringify(value), list[i]);
      // #6887 firefox doesn't update muted state if set via attribute
      // even immediately after element creation
      if (!el.component &&
        name === 'muted' &&
        platformMustUseProp(el.tag, el.attrsMap.type, name)) {
        addProp(el, name, 'true', list[i]);
      }
    }
  }
}

/**
 * 检查el及其所有父级元素上存不存在v-for属性
 */
function checkInFor(el) {
  var parent = el;
  while (parent) {
    if (parent.for !== undefined) {
      return true
    }
    parent = parent.parent;
  }
  return false
}

function parseModifiers(name) {
  var match = name.match(modifierRE);
  if (match) {
    var ret = {};
    match.forEach(function (m) {
      ret[m.slice(1)] = true;
    });
    return ret
  }
}

function makeAttrsMap(attrs) {
  var map = {};
  for (var i = 0, l = attrs.length; i < l; i++) {
    if (
      process.env.NODE_ENV !== 'production' &&
      map[attrs[i].name] && !isIE && !isEdge
    ) {
      warn$2('duplicate attribute: ' + attrs[i].name, attrs[i]);
    }
    map[attrs[i].name] = attrs[i].value;
  }
  return map
}

// for script (e.g. type="x/template") or style, do not decode content
function isTextTag(el) {
  return el.tag === 'script' || el.tag === 'style'
}

function isForbiddenTag(el) {
  return (
    el.tag === 'style' ||
    (el.tag === 'script' && (
      !el.attrsMap.type ||
      el.attrsMap.type === 'text/javascript'
    ))
  )
}

var ieNSBug = /^xmlns:NS\d+/;
var ieNSPrefix = /^NS\d+:/;

/* istanbul ignore next */
function guardIESVGBug(attrs) {
  var res = [];
  for (var i = 0; i < attrs.length; i++) {
    var attr = attrs[i];
    if (!ieNSBug.test(attr.name)) {
      attr.name = attr.name.replace(ieNSPrefix, '');
      res.push(attr);
    }
  }
  return res
}

function checkForAliasModel(el, value) {
  var _el = el;
  while (_el) {
    if (_el.for && _el.alias === value) {
      warn$2(
        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
        "You are binding v-model directly to a v-for iteration alias. " +
        "This will not be able to modify the v-for source array because " +
        "writing to the alias is like modifying a function local variable. " +
        "Consider using an array of objects and use v-model on an object property instead.",
        el.rawAttrsMap['v-model']
      );
    }
    _el = _el.parent;
  }
}

/*  */

/**
 * 根据ast生成对应的代码 为v-model做准备
 * @param {*} el 
 * @param {*} options 
 */
function preTransformNode(el, options) {
  if (el.tag === 'input') { // 如果是输入框类型
    var map = el.attrsMap; // 获得属性map
    if (!map['v-model']) { // 如果没有v-model
      return
    }

    var typeBinding; 
    // 获取动态绑定的type类型 
    if (map[':type'] || map['v-bind:type']) {
      typeBinding = getBindingAttr(el, 'type');
    }
    // 如果既没有定义type 也没有动态type 就去v-bind对象上寻找type类型
    if (!map.type && !typeBinding && map['v-bind']) {
      typeBinding = "(" + (map['v-bind']) + ").type";
    }

    // 如果存在动态绑定的type
    if (typeBinding) {
      // 获取v-if并生成代码
      var ifCondition = getAndRemoveAttr(el, 'v-if', true);
      var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
      // 判断当前是否包含v-else 
      var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
      // 获取v-else-if对应的值
      var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
      // 1. checkbox 克隆一个ast姐弟哪去构建checkbox
      var branch0 = cloneASTElement(el);
      // process for on the main node
      processFor(branch0);
      addRawAttr(branch0, 'type', 'checkbox');
      processElement(branch0, options);
      branch0.processed = true; // prevent it from double-processed
      // 为当前ast创建条件 最终会把用户传入的v-if和当前绑定值的判断进行合并操作
      branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
      // 添加if判断条件语句到if条件数组中去
      addIfCondition(branch0, {
        exp: branch0.if,
        block: branch0 // 在当前case block是branch0
      });
      // 2. add radio else-if condition 构建radio 完全和checkbox一套逻辑
      var branch1 = cloneASTElement(el);
      getAndRemoveAttr(branch1, 'v-for', true);
      addRawAttr(branch1, 'type', 'radio');
      processElement(branch1, options);
      addIfCondition(branch0, {
        exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
        block: branch1 // 在radio 
      });
      // 3. other 构建出了radio和checkbox之外的类型
      var branch2 = cloneASTElement(el);
      getAndRemoveAttr(branch2, 'v-for', true);
      addRawAttr(branch2, ':type', typeBinding);
      processElement(branch2, options);
      addIfCondition(branch0, {
        exp: ifCondition,
        block: branch2
      });

      if (hasElse) { // 添加必要的判断条件
        branch0.else = true;
      } else if (elseIfCondition) {
        branch0.elseif = elseIfCondition;
      }

      return branch0 // 最后返回克隆的ast
    }
  }
}

// 克隆一个ast节点 
// 通过传入tag ast的属性列表的副本和父级ast节点
function cloneASTElement(el) {
  return createASTElement(el.tag, el.attrsList.slice(), el.parent)
}

var model$1 = {
  preTransformNode: preTransformNode
};

var modules$1 = [
  klass$1,
  style$1,
  model$1
];

/*  */

function text(el, dir) {
  if (dir.value) {
    addProp(el, 'textContent', ("_s(" + (dir.value) + ")"), dir);
  }
}

/*  */

function html(el, dir) {
  if (dir.value) {
    addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"), dir);
  }
}

var directives$1 = {
  model: model,
  text: text,
  html: html
};

/*  */

var baseOptions = {
  expectHTML: true,
  modules: modules$1,
  directives: directives$1,
  isPreTag: isPreTag,
  isUnaryTag: isUnaryTag,
  mustUseProp: mustUseProp,
  canBeLeftOpenTag: canBeLeftOpenTag,
  isReservedTag: isReservedTag,
  getTagNamespace: getTagNamespace,
  staticKeys: genStaticKeys(modules$1) // web 下包括 model style class
};

/*  */

var isStaticKey;
var isPlatformReservedTag;

var genStaticKeysCached = cached(genStaticKeys$1);

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 * 
 * 对ast进行静态标记 在render过程中可以避免编译第一次编译后就一直不变的内容
 */
function optimize(root, options) {
  if (!root) {
    return
  }
  isStaticKey = genStaticKeysCached(options.staticKeys || '');
  isPlatformReservedTag = options.isReservedTag || no;
  // 两次过滤都是一个深度遍历的过程 不断递归 让整个ast的每个节点都做一遍过滤
  // first pass: mark all non-static nodes.  第一次过滤 简单标记静态节点
  markStatic$1(root);
  // second pass: mark static roots.  第二次过滤 详细过滤 对于一些特殊情况的节点和子节点类型进行条件判断 主要针对只包含一个文本/注释节点的ast进行过滤 
  markStaticRoots(root, false);
}

function genStaticKeys$1(keys) {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
    (keys ? ',' + keys : '')
  )
}

/**
 * 
 */
function markStatic$1(node) {
  node.static = isStatic(node); // 判断当前节点是不是静态的
  if (node.type === 1) {
    // do not make component slot content static. this avoids  不要将组件 slot节点设置为静态的  这将造成
    // 1. components not able to mutate slot nodes  组件不能计算插槽节点
    // 2. static slot content fails for hot-reloading 静态节点会让热加载失效
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return
    }
    for (var i = 0, l = node.children.length; i < l; i++) {
      var child = node.children[i];
      markStatic$1(child); // 递归进行静态节点的标记
      if (!child.static) { // 当子节点不是静态的时候 父节点肯定也不可能是静态的
        node.static = false;
      }
    }
    if (node.ifConditions) { // 判断包含v-if的情况
      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
        var block = node.ifConditions[i$1].block;
        markStatic$1(block);
        if (!block.static) {
          node.static = false;
        }
      }
    }
  }
}

/**
 * 
 * @param {*} node 
 * @param {*} isInFor 判断是不是在v-for里面
 */
function markStaticRoots(node, isInFor) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor;
    }
    // For a node to qualify as a static root, it should have children that 
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    if (node.static && node.children.length && !( // 对于某些情况下 子节点只有一个元素 并且这个节点是一个文本节点或者是一个注释节点 就不把当前标记为一个静态的root 性能测试的结果
        node.children.length === 1 &&
        node.children[0].type === 3
      )) {
      node.staticRoot = true;
      return
    } else {
      node.staticRoot = false;
    }
    if (node.children) {
      for (var i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for);
      }
    }
    if (node.ifConditions) {
      for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
        markStaticRoots(node.ifConditions[i$1].block, isInFor);
      }
    }
  }
}

/**
 * 判断当前ast是不是静态的
 * @param {*} node 
 */
function isStatic(node) {
  if (node.type === 2) { // expression
    return false
  }
  if (node.type === 3) { // text
    return true
  }
  return !!(node.pre || (
    !node.hasBindings && // no dynamic bindings
    !node.if && !node.for && // not v-if or v-for or v-else
    !isBuiltInTag(node.tag) && // not a built-in
    isPlatformReservedTag(node.tag) && // not a component
    !isDirectChildOfTemplateFor(node) &&
    Object.keys(node).every(isStaticKey)
  ))
}

function isDirectChildOfTemplateFor(node) {
  while (node.parent) {
    node = node.parent;
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}

/*  */

/**
 * fucntion word (
 * function $ ( 
 * word =>
 * $ =>
 * _ =>
 * (除了右括号的任意字符一次到多次并禁止贪婪) =>
 * 
 */
var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;

/**
 * (除了右括号的任意字符一次到多次并禁止贪婪)加上分号或者不加分号
 */
var fnInvokeRE = /\([^)]*?\);*$/;
/**
 * 字母_$加上字母数字下划线$然后加上.加上字母_$加上字母数字下划线         a$1.a$2
 * 字母_$加上字母数字下划线$然后加上['加上除了单引号的字符零到多个加上']   a$1['123']
 * 字母_$加上字母数字下划线$然后加上["加上除了单引号的字符零到多个加上"]   a$1["123"]
 * 字母_$加上字母数字下划线$然后加上[数字一个到多个]                    a$1[123]
 * 字母_$加上字母数字下划线$然后加上[字母_$]                          a$1[a$1]
 * 字母_$加上字母数字下划线$然后加上[字母_$加上字母或者$]               a$1[a$1a$$]
 */
var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

// KeyboardEvent.keyCode aliases
var keyCodes = {
  esc: 27,
  tab: 9,
  enter: 13,
  space: 32,
  up: 38,
  left: 37,
  right: 39,
  down: 40,
  'delete': [8, 46]
};

// KeyboardEvent.key aliases
var keyNames = {
  // #7880: IE11 and Edge use `Esc` for Escape key name.
  esc: ['Esc', 'Escape'],
  tab: 'Tab',
  enter: 'Enter',
  // #9112: IE11 uses `Spacebar` for Space key name.
  space: [' ', 'Spacebar'],
  // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
  up: ['Up', 'ArrowUp'],
  left: ['Left', 'ArrowLeft'],
  right: ['Right', 'ArrowRight'],
  down: ['Down', 'ArrowDown'],
  // #9112: IE11 uses `Del` for Delete key name.
  'delete': ['Backspace', 'Delete', 'Del']
};

// #4868: modifiers that prevent the execution of the listener
// need to explicitly return null so that we can determine whether to remove
// the listener for .once
var genGuard = function (condition) {
  return ("if(" + condition + ")return null;");
};

// 对修饰符的代码进行添加 省了用户去加
var modifierCode = {
  stop: '$event.stopPropagation();',
  prevent: '$event.preventDefault();',
  self: genGuard("$event.target !== $event.currentTarget"),
  ctrl: genGuard("!$event.ctrlKey"),
  shift: genGuard("!$event.shiftKey"),
  alt: genGuard("!$event.altKey"),
  meta: genGuard("!$event.metaKey"),
  left: genGuard("'button' in $event && $event.button !== 0"),
  middle: genGuard("'button' in $event && $event.button !== 1"),
  right: genGuard("'button' in $event && $event.button !== 2")
};

/**
 * 生成事件相关代码  添加了对动态绑定方法名的功能
 */
function genHandlers(
  events,
  isNative
) {
  var prefix = isNative ? 'nativeOn:' : 'on:';
  var staticHandlers = "";
  var dynamicHandlers = "";
  for (var name in events) {
    var handlerCode = genHandler(events[name]);
    if (events[name] && events[name].dynamic) {
      dynamicHandlers += name + "," + handlerCode + ",";
    } else {
      staticHandlers += "\"" + name + "\":" + handlerCode + ",";
    }
  }
  staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";
  if (dynamicHandlers) {
    return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
  } else {
    return prefix + staticHandlers
  }
}

function genHandler(handler) {
  if (!handler) {
    return 'function(){}'
  }

  if (Array.isArray(handler)) {
    return ("[" + (handler.map(function (handler) {
      return genHandler(handler);
    }).join(',')) + "]")
  }

  var isMethodPath = simplePathRE.test(handler.value);
  // 判断是不是函数体 method 不带括号的
  var isFunctionExpression = fnExpRE.test(handler.value);
   // 判断是不是函数体执行 后边带括号的  @click="method(xxx)"
  var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));

  if (!handler.modifiers) {
    if (isMethodPath || isFunctionExpression) {
      return handler.value // 如果是 show  没有括号就会直接返回show这个方法名
    }
    // 这里会为传入的函数包裹一层新的函数，而这个新的函数内部持有一个$event，所以可以通过在我们定义的函数内部使用$event
    // "function($event){return show(1)}"
    return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
  } else {
    var code = '';
    var genModifierCode = '';
    var keys = [];
    for (var key in handler.modifiers) {
      if (modifierCode[key]) {
        genModifierCode += modifierCode[key];
        // left/right
        if (keyCodes[key]) {
          keys.push(key);
        }
      } else if (key === 'exact') {
        var modifiers = (handler.modifiers);
        genModifierCode += genGuard(
          ['ctrl', 'shift', 'alt', 'meta']
          .filter(function (keyModifier) {
            return !modifiers[keyModifier];
          })
          .map(function (keyModifier) {
            return ("$event." + keyModifier + "Key");
          })
          .join('||')
        );
      } else {
        keys.push(key);
      }
    }
    if (keys.length) {
      code += genKeyFilter(keys);
    }
    // Make sure modifiers like prevent and stop get executed after key filtering
    if (genModifierCode) {
      code += genModifierCode;
    }
    var handlerCode = isMethodPath ?
      ("return " + (handler.value) + "($event)") :
      isFunctionExpression ?
      ("return (" + (handler.value) + ")($event)") :
      isFunctionInvocation ?
      ("return " + (handler.value)) :
      handler.value;
    return ("function($event){" + code + handlerCode + "}")
  }
}

function genKeyFilter(keys) {
  return (
    // make sure the key filters only apply to KeyboardEvents
    // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
    // key events that do not have keyCode property...
    "if(!$event.type.indexOf('key')&&" +
    (keys.map(genFilterCode).join('&&')) + ")return null;"
  )
}

function genFilterCode(key) {
  var keyVal = parseInt(key, 10);
  if (keyVal) {
    return ("$event.keyCode!==" + keyVal)
  }
  var keyCode = keyCodes[key];
  var keyName = keyNames[key];
  return (
    "_k($event.keyCode," +
    (JSON.stringify(key)) + "," +
    (JSON.stringify(keyCode)) + "," +
    "$event.key," +
    "" + (JSON.stringify(keyName)) +
    ")"
  )
}

/*  */

function on(el, dir) {
  if (process.env.NODE_ENV !== 'production' && dir.modifiers) {
    warn("v-on without argument does not support modifiers.");
  }
  el.wrapListeners = function (code) {
    return ("_g(" + code + "," + (dir.value) + ")");
  };
}

/*  */

function bind$1(el, dir) {
  el.wrapData = function (code) {
    return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
  };
}

/*  */

var baseDirectives = {
  on: on,
  bind: bind$1,
  cloak: noop
};

/*  */

var CodegenState = function CodegenState(options) {
  this.options = options;
  this.warn = options.warn || baseWarn;
  this.transforms = pluckModuleFunction(options.modules, 'transformCode');
  this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
  this.directives = extend(extend({}, baseDirectives), options.directives);
  var isReservedTag = options.isReservedTag || no;
  this.maybeComponent = function (el) {
    return !!el.component || !isReservedTag(el.tag);
  };
  this.onceId = 0;
  this.staticRenderFns = [];
  this.pre = false;
};



/**
 * 生成vue的render函数
 * @param {*} ast 
 * @param {*} options 
 */
function generate(
  ast,
  options
) {
  var state = new CodegenState(options);
  var code = ast ? genElement(ast, state) : '_c("div")';
  return {
    render: ("with(this){return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
}

/**
 * 对于不同的情况进行不同的代码生成
 * @param {*} el 
 * @param {*} state 
 */
function genElement(el, state) {
  if (el.parent) {
    el.pre = el.pre || el.parent.pre;
  }

  if (el.staticRoot && !el.staticProcessed) {
    return genStatic(el, state)
  } else if (el.once && !el.onceProcessed) {
    return genOnce(el, state)
  } else if (el.for && !el.forProcessed) {
    return genFor(el, state)
  } else if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
    return genChildren(el, state) || 'void 0'
  } else if (el.tag === 'slot') {
    return genSlot(el, state)
  } else {
    // component or element
    var code;
    if (el.component) {
      code = genComponent(el.component, el, state);
    } else {
      var data;
      if (!el.plain || (el.pre && state.maybeComponent(el))) {
        data = genData$2(el, state);
      }

      var children = el.inlineTemplate ? null : genChildren(el, state, true);
      code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
    }
    // module transforms
    for (var i = 0; i < state.transforms.length; i++) {
      code = state.transforms[i](el, code);
    }
    return code
  }
}

// hoist static sub-trees out
function genStatic(el, state) {
  el.staticProcessed = true;
  // Some elements (templates) need to behave differently inside of a v-pre
  // node.  All pre nodes are static roots, so we can use this as a location to
  // wrap a state change and reset it upon exiting the pre node.
  var originalPreState = state.pre;
  if (el.pre) {
    state.pre = el.pre;
  }
  state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
  state.pre = originalPreState;
  return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
}

// v-once
function genOnce(el, state) {
  el.onceProcessed = true;
  if (el.if && !el.ifProcessed) {
    return genIf(el, state)
  } else if (el.staticInFor) {
    var key = '';
    var parent = el.parent;
    while (parent) {
      if (parent.for) {
        key = parent.key;
        break
      }
      parent = parent.parent;
    }
    if (!key) {
      process.env.NODE_ENV !== 'production' && state.warn(
        "v-once can only be used inside v-for that is keyed. ",
        el.rawAttrsMap['v-once']
      );
      return genElement(el, state)
    }
    return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
  } else {
    return genStatic(el, state)
  }
}

function genIf(
  el,
  state,
  altGen,
  altEmpty
) {
  el.ifProcessed = true; // avoid recursion 避免递归调用
  return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
}

function genIfConditions(
  conditions,
  state,
  altGen,
  altEmpty
) {
  if (!conditions.length) {// 如果没有条件 就直接返回一个空节点
    return altEmpty || '_e() '
  }

  var condition = conditions.shift();
  if (condition.exp) {
    return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
  } else {
    return ("" + (genTernaryExp(condition.block)))
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp(el) {
    return altGen ?
      altGen(el, state) :
      el.once ?
      genOnce(el, state) :
      genElement(el, state)
  }
}

function genFor(
  el,
  state,
  altGen,
  altHelper
) {
  var exp = el.for;
  var alias = el.alias;
  var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
  var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

  if (process.env.NODE_ENV !== 'production' &&
    state.maybeComponent(el) &&
    el.tag !== 'slot' &&
    el.tag !== 'template' &&
    !el.key
  ) {
    state.warn(
      "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
      "v-for should have explicit keys. " +
      "See https://vuejs.org/guide/list.html#key for more info.",
      el.rawAttrsMap['v-for'],
      true /* tip */
    );
  }

  el.forProcessed = true; // avoid recursion
  return (altHelper || '_l') + "((" + exp + ")," +
    "function(" + alias + iterator1 + iterator2 + "){" +
    "return " + ((altGen || genElement)(el, state)) +
    '})'
}

// 构建vnodedata对象字符串
function genData$2(el, state) {
  var data = '{';

  // directives first.  优先生成指令 因为指令可能会改变ast的其他属性
  // directives may mutate the el's other properties before they are generated.
  var dirs = genDirectives(el, state);
  if (dirs) {
    data += dirs + ',';
  }

  // key
  if (el.key) {
    data += "key:" + (el.key) + ",";
  }
  // ref
  if (el.ref) {
    data += "ref:" + (el.ref) + ",";
  }
  if (el.refInFor) {
    data += "refInFor:true,";
  }
  // pre
  if (el.pre) {
    data += "pre:true,";
  }
  // record original tag name for components using "is" attribute
  if (el.component) {
    data += "tag:\"" + (el.tag) + "\",";
  }
  // module data generation functions
  for (var i = 0; i < state.dataGenFns.length; i++) {
    data += state.dataGenFns[i](el);
  }
  // attributes
  if (el.attrs) {
    data += "attrs:" + (genProps(el.attrs)) + ",";
  }
  // DOM props
  if (el.props) {
    data += "domProps:" + (genProps(el.props)) + ",";
  }
  // event handlers
  if (el.events) {
    data += (genHandlers(el.events, false)) + ",";
  }
  if (el.nativeEvents) {
    data += (genHandlers(el.nativeEvents, true)) + ",";
  }
  // slot target
  // only for non-scoped slots
  if (el.slotTarget && !el.slotScope) {
    data += "slot:" + (el.slotTarget) + ",";
  }
  // scoped slots
  if (el.scopedSlots) {
    data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
  }
  // component v-model
  if (el.model) {
    data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
  }
  // inline-template
  if (el.inlineTemplate) {
    var inlineTemplate = genInlineTemplate(el, state);
    if (inlineTemplate) {
      data += inlineTemplate + ",";
    }
  }
  data = data.replace(/,$/, '') + '}';
  // v-bind dynamic argument wrap
  // v-bind with dynamic arguments must be applied using the same v-bind object
  // merge helper so that class/style/mustUseProp attrs are handled correctly.
  if (el.dynamicAttrs) {
    data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
  }
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data);
  }
  // v-on data wrap
  if (el.wrapListeners) {
    data = el.wrapListeners(data);
  }
  return data
}

/**
 * 根据ast生成指令代码
 */
function genDirectives(el, state) {
  var dirs = el.directives;
  if (!dirs) {
    return
  }
  var res = 'directives:[';
  var hasRuntime = false;
  var i, l, dir, needRuntime;
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i];
    needRuntime = true;
    var gen = state.directives[dir.name]; // 拿到state对象中定义的平台相关的model()方法
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, state.warn);
    }
    if (needRuntime) {
      hasRuntime = true;
      res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate(el, state) {
  var ast = el.children[0];
  if (process.env.NODE_ENV !== 'production' && (
      el.children.length !== 1 || ast.type !== 1
    )) {
    state.warn(
      'Inline-template components must have exactly one child element.', {
        start: el.start
      }
    );
  }
  if (ast && ast.type === 1) {
    var inlineRenderFns = generate(ast, state.options);
    return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) {
      return ("function(){" + code + "}");
    }).join(',')) + "]}")
  }
}

// 生成作用域插槽代码
function genScopedSlots(
  el,
  slots,
  state
) {
  // by default scoped slots are considered "stable", this allows child
  // components with only scoped slots to skip forced updates from parent.
  // but in some cases we have to bail-out of this optimization
  // for example if the slot contains dynamic names, has v-if or v-for on them...
  var needsForceUpdate = el.for || Object.keys(slots).some(function (key) {
    var slot = slots[key];
    return (
      slot.slotTargetDynamic ||
      slot.if ||
      slot.for ||
      containsSlotChild(slot) // is passing down slot from parent which may be dynamic
    )
  });

  // #9534: if a component with scoped slots is inside a conditional branch,
  // it's possible for the same component to be reused but with different
  // compiled slot content. To avoid that, we generate a unique key based on
  // the generated code of all the slot contents.
  var needsKey = !!el.if;

  // OR when it is inside another scoped slot or v-for (the reactivity may be
  // disconnected due to the intermediate scope variable)
  // #9438, #9506
  // TODO: this can be further optimized by properly analyzing in-scope bindings
  // and skip force updating ones that do not actually use scope variables.
  if (!needsForceUpdate) {
    var parent = el.parent;
    while (parent) {
      if (
        (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
        parent.for
      ) {
        needsForceUpdate = true;
        break
      }
      if (parent.if) {
        needsKey = true;
      }
      parent = parent.parent;
    }
  }

  var generatedSlots = Object.keys(slots)
    .map(function (key) {
      return genScopedSlot(slots[key], state);
    })
    .join(',');

  return ("scopedSlots:_u([" + generatedSlots + "]" + (needsForceUpdate ? ",null,true" : "") + (!needsForceUpdate && needsKey ? (",null,false," + (hash(generatedSlots))) : "") + ")")
}

function hash(str) {
  var hash = 5381;
  var i = str.length;
  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }
  return hash >>> 0
}

function containsSlotChild(el) {
  if (el.type === 1) {
    if (el.tag === 'slot') {
      return true
    }
    return el.children.some(containsSlotChild)
  }
  return false
}

function genScopedSlot(
  el,
  state
) {
  var isLegacySyntax = el.attrsMap['slot-scope'];
  if (el.if && !el.ifProcessed && !isLegacySyntax) {
    return genIf(el, state, genScopedSlot, "null")
  }
  if (el.for && !el.forProcessed) {
    return genFor(el, state, genScopedSlot)
  }
  var slotScope = el.slotScope === emptySlotScopeToken ?
    "" :
    String(el.slotScope);
    // 这里生成了一个方法 这里将slotScope 把 当前作用域插槽数据接受对象传入 所以可以通过方法的参数解构来获取数据对象中的属性 
  var fn = "function(" + slotScope + "){" +
    "return " + (el.tag === 'template' ?
      el.if && isLegacySyntax ?
      ("(" + (el.if) + ")?" + (genChildren(el, state) || 'undefined') + ":undefined") :
      genChildren(el, state) || 'undefined' :
      genElement(el, state)) + "}";
  // reverse proxy v-slot without scope on this.$slots
  var reverseProxy = slotScope ? "" : ",proxy:true";
  return ("{key:" + (el.slotTarget || "\"default\"") + ",fn:" + fn + reverseProxy + "}")
}

function genChildren(
  el,
  state,
  checkSkip,
  altGenElement,
  altGenNode
) {
  var children = el.children;
  if (children.length) {
    var el$1 = children[0];
    // optimize single v-for
    if (children.length === 1 &&
      el$1.for &&
      el$1.tag !== 'template' &&
      el$1.tag !== 'slot'
    ) {
      var normalizationType = checkSkip ?
        state.maybeComponent(el$1) ? ",1" : ",0" :
        "";
      return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
    }
    var normalizationType$1 = checkSkip ?
      getNormalizationType(children, state.maybeComponent) :
      0;
    var gen = altGenNode || genNode;
    return ("[" + (children.map(function (c) {
      return gen(c, state);
    }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
  }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
function getNormalizationType(
  children,
  maybeComponent
) {
  var res = 0;
  for (var i = 0; i < children.length; i++) {
    var el = children[i];
    if (el.type !== 1) {
      continue
    }
    if (needsNormalization(el) ||
      (el.ifConditions && el.ifConditions.some(function (c) {
        return needsNormalization(c.block);
      }))) {
      res = 2;
      break
    }
    if (maybeComponent(el) ||
      (el.ifConditions && el.ifConditions.some(function (c) {
        return maybeComponent(c.block);
      }))) {
      res = 1;
    }
  }
  return res
}

function needsNormalization(el) {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function genNode(node, state) {
  if (node.type === 1) {
    return genElement(node, state)
  } else if (node.type === 3 && node.isComment) {
    return genComment(node)
  } else {
    return genText(node)
  }
}

function genText(text) {
  return ("_v(" + (text.type === 2 ?
    text.expression // no need for () because already wrapped in _s()
    :
    transformSpecialNewlines(JSON.stringify(text.text))) + ")")
}

function genComment(comment) {
  return ("_e(" + (JSON.stringify(comment.text)) + ")")
}

// 生成插槽代码 组成_t的代码块
function genSlot(el, state) {
  var slotName = el.slotName || '"default"';
  var children = genChildren(el, state); // 作为插槽节点默认内容的渲染 也就是使用插槽但是没有传入内容的时候展示
  var res = "_t(" + slotName + (children ? ("," + children) : '');
  var attrs = el.attrs || el.dynamicAttrs ?
    genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) {
      return ({
        // slot props are camelized
        name: camelize(attr.name),
        value: attr.value,
        dynamic: attr.dynamic
      });
    })) :
    null;
  var bind$$1 = el.attrsMap['v-bind'];
  if ((attrs || bind$$1) && !children) {
    res += ",null";
  }
  if (attrs) {
    res += "," + attrs;
  }
  if (bind$$1) {
    res += (attrs ? '' : ',null') + "," + bind$$1;
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent(
  componentName,
  el,
  state
) {
  var children = el.inlineTemplate ? null : genChildren(el, state, true);
  return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
}

function genProps(props) {
  var staticProps = "";
  var dynamicProps = "";
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    var value = transformSpecialNewlines(prop.value);
    if (prop.dynamic) {
      dynamicProps += (prop.name) + "," + value + ",";
    } else {
      staticProps += "\"" + (prop.name) + "\":" + value + ",";
    }
  }
  staticProps = "{" + (staticProps.slice(0, -1)) + "}";
  if (dynamicProps) {
    return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
  } else {
    return staticProps
  }
}

// #3895, #4268
function transformSpecialNewlines(text) {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/*  */



// these keywords should not appear inside expressions, but operators like
// typeof, instanceof and in are allowed
var prohibitedKeywordRE = new RegExp('\\b' + (
  'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
  'super,throw,while,yield,delete,export,import,return,switch,default,' +
  'extends,finally,continue,debugger,function,arguments'
).split(',').join('\\b|\\b') + '\\b');

// these unary operators should not be used as property/method names
var unaryOperatorsRE = new RegExp('\\b' + (
  'delete,typeof,void'
).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

// strip strings in expressions 匹配字符串语法
/**
 * '除了单引号和双反斜杠的任意字符'
 * '双反斜杠加上任意字符'
 * 双引号和``同单引号
 * `除了单引号和双反斜杠的任意字符${
 * `双反斜杠加上任意字符${
 * }除了单引号和双反斜杠的任意字符`
 * }双反斜杠加上任意字符`
 */
var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

// detect problematic expressions in a template
function detectErrors(ast, warn) {
  if (ast) {
    checkNode(ast, warn);
  }
}

function checkNode(node, warn) {
  if (node.type === 1) {
    for (var name in node.attrsMap) {
      if (dirRE.test(name)) {
        var value = node.attrsMap[name];
        if (value) {
          var range = node.rawAttrsMap[name];
          if (name === 'v-for') {
            checkFor(node, ("v-for=\"" + value + "\""), warn, range);
          } else if (name === 'v-slot' || name[0] === '#') {
            checkFunctionParameterExpression(value, (name + "=\"" + value + "\""), warn, range);
          } else if (onRE.test(name)) {
            checkEvent(value, (name + "=\"" + value + "\""), warn, range);
          } else {
            checkExpression(value, (name + "=\"" + value + "\""), warn, range);
          }
        }
      }
    }
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        checkNode(node.children[i], warn);
      }
    }
  } else if (node.type === 2) {
    checkExpression(node.expression, node.text, warn, node);
  }
}

function checkEvent(exp, text, warn, range) {
  var stripped = exp.replace(stripStringRE, '');
  var keywordMatch = stripped.match(unaryOperatorsRE);
  if (keywordMatch && stripped.charAt(keywordMatch.index - 1) !== '$') {
    warn(
      "avoid using JavaScript unary operator as property name: " +
      "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim()),
      range
    );
  }
  checkExpression(exp, text, warn, range);
}

function checkFor(node, text, warn, range) {
  checkExpression(node.for || '', text, warn, range);
  checkIdentifier(node.alias, 'v-for alias', text, warn, range);
  checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range);
  checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range);
}

function checkIdentifier(
  ident,
  type,
  text,
  warn,
  range
) {
  if (typeof ident === 'string') {
    try {
      new Function(("var " + ident + "=_"));
    } catch (e) {
      warn(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())), range);
    }
  }
}

function checkExpression(exp, text, warn, range) {
  try {
    new Function(("return " + exp));
  } catch (e) {
    var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
    if (keywordMatch) {
      warn(
        "avoid using JavaScript keyword as property name: " +
        "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim()),
        range
      );
    } else {
      warn(
        "invalid expression: " + (e.message) + " in\n\n" +
        "    " + exp + "\n\n" +
        "  Raw expression: " + (text.trim()) + "\n",
        range
      );
    }
  }
}

function checkFunctionParameterExpression(exp, text, warn, range) {
  try {
    new Function(exp, '');
  } catch (e) {
    warn(
      "invalid function parameter expression: " + (e.message) + " in\n\n" +
      "    " + exp + "\n\n" +
      "  Raw expression: " + (text.trim()) + "\n",
      range
    );
  }
}

/*  */

var range = 2;

function generateCodeFrame(
  source,
  start,
  end
) {
  if (start === void 0) start = 0;
  if (end === void 0) end = source.length;

  var lines = source.split(/\r?\n/);
  var count = 0;
  var res = [];
  for (var i = 0; i < lines.length; i++) {
    count += lines[i].length + 1;
    if (count >= start) {
      for (var j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length) {
          continue
        }
        res.push(("" + (j + 1) + (repeat$1(" ", 3 - String(j + 1).length)) + "|  " + (lines[j])));
        var lineLength = lines[j].length;
        if (j === i) {
          // push underline
          var pad = start - (count - lineLength) + 1;
          var length = end > count ? lineLength - pad : end - start;
          res.push("   |  " + repeat$1(" ", pad) + repeat$1("^", length));
        } else if (j > i) {
          if (end > count) {
            var length$1 = Math.min(end - count, lineLength);
            res.push("   |  " + repeat$1("^", length$1));
          }
          count += lineLength + 1;
        }
      }
      break
    }
  }
  return res.join('\n')
}

function repeat$1(str, n) {
  var result = '';
  if (n > 0) {
    while (true) { // eslint-disable-line
      if (n & 1) {
        result += str;
      }
      n >>>= 1;
      if (n <= 0) {
        break
      }
      str += str;
    }
  }
  return result
}

/*  */



function createFunction(code, errors) {
  try {
    return new Function(code)
  } catch (err) {
    errors.push({
      err: err,
      code: code
    });
    return noop
  }
}

/**
 * 真正去创建编译器的方法
 * @param {*} compile 
 */
function createCompileToFunctionFn(compile) { 
  var cache = Object.create(null);

  /**
   * 把模版编译为render函数
   * 调用处理后的编译器 继而调用核心编译器
   */
  return function compileToFunctions(
    template, // template
    options, // 编译配置
    vm // 正在编译的render对应的vm
  ) {
    options = extend({}, options);
    var warn$$1 = options.warn || warn;
    delete options.warn;

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      // detect possible CSP restriction
      try {
        new Function('return 1');
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn$$1(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          );
        }
      }
    }

    // check cache
    var key = options.delimiters ?
      String(options.delimiters) + template :
      template;
    if (cache[key]) { // 查看缓存中是不是已经存在编译后的模版render函数了 如果有直接取出来
      return cache[key]
    }

    // compile 执行编译
    var compiled = compile(template, options);

    // check compilation errors/tips
    if (process.env.NODE_ENV !== 'production') {
      if (compiled.errors && compiled.errors.length) {
        if (options.outputSourceRange) {
          compiled.errors.forEach(function (e) {
            warn$$1(
              "Error compiling template:\n\n" + (e.msg) + "\n\n" +
              generateCodeFrame(template, e.start, e.end),
              vm
            );
          });
        } else {
          warn$$1(
            "Error compiling template:\n\n" + template + "\n\n" +
            compiled.errors.map(function (e) {
              return ("- " + e);
            }).join('\n') + '\n',
            vm
          );
        }
      }
      if (compiled.tips && compiled.tips.length) {
        if (options.outputSourceRange) {
          compiled.tips.forEach(function (e) {
            return tip(e.msg, vm);
          });
        } else {
          compiled.tips.forEach(function (msg) {
            return tip(msg, vm);
          });
        }
      }
    }

    // turn code into functions
    var res = {};
    var fnGenErrors = [];
    res.render = createFunction(compiled.render, fnGenErrors);
    res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
      return createFunction(code, fnGenErrors)
    });

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn$$1(
          "Failed to generate render function:\n\n" +
          fnGenErrors.map(function (ref) {
            var err = ref.err;
            var code = ref.code;

            return ((err.toString()) + " in\n\n" + code + "\n");
          }).join('\n'),
          vm
        );
      }
    }

    return (cache[key] = res)
  }
}

/*  */
/**
 * 构造编译器工厂  返回一个工厂函数 用于创建编译器 只是简单将编译器进行封装到一个严格对象返回
 * @param {*} baseCompile 基础编译器 核心编译步骤 会在编译器被调用的时候调用
 * @returns {Object}  返回一个工厂函数  接受编译器的配置 并返回一个对象包裹最终的编译器
 */
function createCompilerCreator(baseCompile) {
  return function createCompiler(baseOptions) {
    function compile( // 封装过的编译器  处理了各种错误提示并将用户传入的options和基础的option合并  合并之后再去调用核心编译器
      template,
      options
    ) {
      var finalOptions = Object.create(baseOptions);
      var errors = [];
      var tips = [];

      var warn = function (msg, range, tip) {
        (tip ? tips : errors).push(msg);
      };

      if (options) {
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          var leadingSpaceLength = template.match(/^\s*/)[0].length;

          warn = function (msg, range, tip) {
            var data = {
              msg: msg
            };
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength;
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength;
              }
            }
            (tip ? tips : errors).push(data);
          };
        }
        // merge custom modules
        if (options.modules) { // 将baseoptions和用户的配置modules进行合并 数组合并
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules);
        }
        // merge custom directives 合并 directives 严格对象
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          );
        }
        // copy other options
        for (var key in options) { // 除此之外 直接根据key值进行赋值
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key];
          }
        }
      }

      finalOptions.warn = warn;

      // 通过合并后的配置，通过基础编译器进行模版编译 最终返回编译结果
      var compiled = baseCompile(template.trim(), finalOptions);
      if (process.env.NODE_ENV !== 'production') {
        detectErrors(compiled.ast, warn);
      }
      compiled.errors = errors;
      compiled.tips = tips;
      return compiled
    }

    return {
      compile: compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}

/*  */

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
// 创建编译器 传入基础编译器 定义核心编译步骤 从繁杂的环境配置中进行抽离
var createCompiler = createCompilerCreator(function baseCompile(
  template,
  options
) {
  // 解析成抽象语法树
  var ast = parse(template.trim(), options);

  if (options.optimize !== false) {
    // 优化抽象语法树
    optimize(ast, options);
  }
  // 通过语法书去生成静态的字符串代码
  var code = generate(ast, options);
  return {
    ast: ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
});

/*  */
// createCompilerCreator => createcompiler => createCompileToFunctionFn => compileToFunctions => compile => baseCompile => 真正开始编译步骤 「parse optimize generate」
var ref$1 = createCompiler(baseOptions);
var compile = ref$1.compile;
var compileToFunctions = ref$1.compileToFunctions;

/*  */

// check whether current browser encodes a char inside attribute values
var div;

function getShouldDecode(href) {
  div = div || document.createElement('div');
  div.innerHTML = href ? "<a href=\"\n\"/>" : "<div a=\"\n\"/>";
  return div.innerHTML.indexOf('&#10;') > 0
}

// #3663: IE encodes newlines inside attribute values while other browsers don't
var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
// #6828: chrome encodes content in a[href]
var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

/*  */

var idToTemplate = cached(function (id) { // 缓存方法
  var el = query(id);
  return el && el.innerHTML // 查找el的内部所有内容
});

var mount = Vue.prototype.$mount;
//这段代码首先缓存了原型上的 $mount 方法，再重新定义该方法。
// 最后，调用原先原型上的 $mount 方法挂载。
// 缓存了原本的$mount方法到mount 然后暴露给用户一个新的$mount 默认不注水  
// return mountComponent(this, el, hydrating)
Vue.prototype.$mount = function ( // 缓存了原本的$mount方法到mount 然后暴露给用户一个新的$mount 默认不注水  return mountComponent(this, el, hydrating)
  el,
  hydrating
) {
  el = el && query(el);

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) { // 首先，对 el 做限制，Vue 不能挂载在 body、html 这样的根节点上。
    process.env.NODE_ENV !== 'production' && warn(
      "Do not mount Vue to <html> or <body> - mount to normal elements instead."
    );
    return this
  }

  var options = this.$options;
  // resolve template/el and convert to render function 将 template 和 el 元素编译成渲染函数
  if (!options.render) { // 如果没有定义 render 方法，则会把 el 或者 template 字符串转换成 render 方法。
    var template = options.template;
    if (template) {
      if (typeof template === 'string') { // 判断 如果是字符串进行查找
        if (template.charAt(0) === '#') {
          template = idToTemplate(template);
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              ("Template element not found or is empty: " + (options.template)),
              this
            );
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML;
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this);
        }
        return this
      }
    } else if (el) { // 如果没有传入template 就直接获取el.outerHTML作template 最终这个template还会挂载到el上去
      template = getOuterHTML(el);
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile');
      }
      // 在 Vue 2.0 版本中，所有 Vue 的组件的渲染最终都需要 render 方法，
      // 无论是用单文件 .vue 方式开发组件，还是写了 el 或者 template 属性，最终都会转换成 render 方法，
      // 这个过程是 Vue 的一个“在线编译”的过程，它是调用 compileToFunctions 方法实现的，
      var ref = compileToFunctions(template, { // 得到render 和 静态render并挂到options 相当于是做了一次normalize
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines: shouldDecodeNewlines,
        shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this);
      var render = ref.render;
      var staticRenderFns = ref.staticRenderFns;
      options.render = render;
      options.staticRenderFns = staticRenderFns;

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end');
        measure(("vue " + (this._name) + " compile"), 'compile', 'compile end');
      }
    }
  }
  return mount.call(this, el, hydrating) // 完成渲染函数的编译之后 执行挂载 将当前vm挂载到el上去
};

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */

/**
 * 
 * 
 * <div id="test">
     <span style="color:red">test1</span> test2
   </div>
   <a href="javascript:alert(test.innerHTML)">innerHTML内容</a>
   <a href="javascript:alert(test.innerText)">inerHTML内容</a>
   <a href="javascript:alert(test.outerHTML)">outerHTML内容</a> 
 * test.innerHTML:
     　　也就是从对象的起始位置到终止位置的全部内容,包括Html标签。
     　　上例中的test.innerHTML的值也就是“<span style="color:red">test1</span> test2 ”。
   test.innerText:
     　　从起始位置到终止位置的内容, 但它去除Html标签
     　　上例中的text.innerTest的值也就是“test1 test2”, 其中span标签去除了。
   test.outerHTML:
     　　除了包含innerHTML的全部内容外, 还包含对象标签本身。
     　　上例中的text.outerHTML的值也就是<div id="test"><span style="color:red">test1</span> test2</div>

 */
function getOuterHTML(el) {
  if (el.outerHTML) {
    return el.outerHTML
  } else { // shim 实际上也是获得el本身的html的所有内容
    var container = document.createElement('div');
    container.appendChild(el.cloneNode(true));
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions;

export default Vue;
