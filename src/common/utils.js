const mapTag = '[object Map]';
const setTag = '[object Set]';
const arrayTag = '[object Array]';
const objectTag = '[object Object]';
const argsTag = '[object Arguments]';
const boolTag = '[object Boolean]';
const dateTag = '[object Date]';
const numberTag = '[object Number]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';
const errorTag = '[object Error]';
const regexpTag = '[object RegExp]';
const funcTag = '[object Function]';
const typesName = {
  mapTag,
  setTag,
  arrayTag,
  objectTag,
  argsTag,
  boolTag,
  dateTag,
  numberTag,
  stringTag,
  symbolTag,
  errorTag,
  regexpTag,
  funcTag
}
const canTraverse = {
  '[object Map]': true,
  '[object Set]': true,
  '[object Array]': true,
  '[object Object]': true,
  '[object Arguments]': true,
};
/**
 * 获取类型字符串
 * @param {} obj 
 */
const getType = obj => Object.prototype.toString.call(obj);
/**
 * 判断是否为对象或者方法且非null
 * @param {*} target 
 */
const isObject = target => (typeof target === 'object' || typeof target === 'function') && target !== null;

const handleRegExp = ({
  source,
  flags
}) => new target.constructor(source, flags);

const handleFunc = func => {
  // 箭头函数直接返回自身
  if (!func.prototype) return func;
  const bodyReg = /(?<={)(.|\n)+(?=})/m;
  const paramReg = /(?<=\().+(?=\)\s+{)/;
  const funcString = func.toString();
  // 分别匹配 函数参数 和 函数体
  const param = paramReg.exec(funcString);
  const body = bodyReg.exec(funcString);
  if (!body) return null;
  if (param) {
    const paramArr = param[0].split(',');
    return new Function(...paramArr, body[0]);
  } else {
    return new Function(body[0]);
  }
}

const handleNotTraverse = (target, tag) => {
  const Ctor = target.constructor;
  switch (tag) {
    case boolTag:
      return Object(Boolean.prototype.valueOf.call(target));
    case numberTag:
      return Object(Number.prototype.valueOf.call(target));
    case stringTag:
      return Object(String.prototype.valueOf.call(target));
    case symbolTag:
      return Object(Symbol.prototype.valueOf.call(target));
    case errorTag:
    case dateTag:
      return new Ctor(target);
    case regexpTag:
      return handleRegExp(target);
    case funcTag:
      return handleFunc(target);
    default:
      return new Ctor(target);
  }
}
/**
 * 深拷贝 for any type
 * @param {*} 需要拷贝的内容 
 * @param {*} map 
 */
const deepClone = (target, map = new WeakMap()) => {
  if (!isObject(target))
    return target;
  let type = getType(target);
  let cloneTarget;
  if (!canTraverse[type]) {
    // 处理不能遍历的对象
    return handleNotTraverse(target, type);
  } else {
    // 这波操作相当关键，可以保证对象的原型不丢失！
    let ctor = target.constructor;
    cloneTarget = new ctor();
  }
  //记录下已经拷贝过的对象，如果说已经拷贝过，那直接返回它行了。
  if (map.get(target)) return target;
  map.set(target, true);

  //处理Map
  if (type === mapTag) {
    target.forEach((item, key) => {
      cloneTarget.set(deepClone(key, map), deepClone(item, map));
    })
  }

  //处理Set
  if (type === setTag) {
    target.forEach(item => {
      cloneTarget.add(deepClone(item, map));
    })
  }
  // 处理数组和对象 set 和map 都不会进入这个循环
  for (let prop in target) {
    if (target.hasOwnProperty(prop)) {
      cloneTarget[prop] = deepClone(target[prop], map);
    }
  }
  return cloneTarget;
}
/**
 * 防抖器  在每次触发方法都清楚上一个计时器 开启下一个计时器
 * @param {*} func 
 * @param {*} delay 
 */
const debounce = (func, delay = 750) => {
  let timer = null
  return function (...args) {
    timer && clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay);
  }
}
/**
 * 节流器  每次触发都比较上次执行时间  如果差值大于设置值 就执行一次 否则 忽略
 * @param {*} func 
 * @param {*} delay 
 */
const throttle = (func, delay = 750) => {
  let previous = 0
  return function (...args) {
    let now = +new Date();
    if (now - previous >= delay) {
      func.apply(this, args)
      previous = now
    }
  }
}

/**
 * 日期格式化
 */
const formatDate = (date, fmt) => {
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  };
  for (let k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      let str = o[k] + '';
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? str : padLeftZero(str));
    }
  }
  return fmt;
}

const padLeftZero = str => ('00' + str).substr(str.length)

export default {
  typesName,
  isObject,
  getType,

  deepClone,

  formatDate,
  
  debounce,
  throttle,
}
