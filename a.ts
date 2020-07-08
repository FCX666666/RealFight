//混合类型接口 不是用来实现的 而是用来断言的 （ts中的接口实现的目的也是这样  只是类型约束）
//因为ts解析到js，在js中function 本身也是一个类  js类作为方法可以执行 作为类又可以赋值  而混合接口匹配的就是这种类（函数）
//这个接口规定了一个即是对象又是函数的实例
interface CounterInterface {
  (param: number[]): string,
  time: number
  reset(p: number[]): string
}

function getCount(): CounterInterface {
  let counter = function (p: number[]) {
      return p.join('*')
  } as CounterInterface
  counter.time = 1
  counter.reset = (param) => {
      return param + 'nice'
  }
  return counter
}
console.log(getCount()([1, 2, 3]));
console.log(getCount().reset([1, 2, 3]));
console.log(getCount().time);