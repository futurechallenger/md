# 什么是 decorator，什么时候用 decorator

在学习 ES2015+的时候，转码已经非常的普遍。很多人都已经在实践中使用过了新的语言特性，或者至少是在教程里学习过。这些新特性之中经常让人挠头的莫属 decorator（装饰器，后文也不会翻译）了。

由于在 Angular2+的广泛使用，decorator 变得流行。在 Angular 里，由于有 TypeScript 所以用上了 decorator。但是在 javascript 里，decorator 还在 stage-2，也就是说会和 js 的更新一起发布。我们来看一下 decorator 是什么，如何使用它来让你的代码更加的简洁易懂。

## 什么是 decorator

它最简单的形式是一段代码的包装，也就是说装饰这段代码。这个概念也叫做高阶方法。这个模式已经使用的非常的多了，比如：

```javascript
function doSomething(name) {
  console.log("Hello " + name);
}

function loggingDecorator(wrapped) {
  return function() {
    console.log("Starting...");
    const result = wrapped.apply(this, arguments);
    console.log("Finished");

    return result;
  };
}

const wrapped = loggingDecorator(doSomething);
```

这个例子生成了一个新的方法，在`wrapped`变量中，可以和`doSomething`一样被调用，并且行为也完全一致。唯一不同的地方是它会在被调用后输出一些日志。如：

```javascript
doSomething('Graham');

// Hello, Graham

wrapped('Graham);

// Starting...
// Hello, Graham
// Finished
```

## 如何使用 decorator

Decorator 的语法稍微有点特殊，它以**@**开始，放在需要装饰的代码上方。

```
在写作的时候decorator已经进入了 Stage 2，也就是说基本上不会变了，但是还是可能会发生改变的。
```

理论上你可以在同一代码上使用任意多的 decorator，他们会以你声明的顺序执行。比如：

```javascript
@log()
@immutable()
class Example {
  @time("demo")
  doSomething() {
    // ...
  }
}
```

上例中定义了另一个`Example`类，并且在里面使用了三个 decorator。两个作用在类上，一个作用在属性上：

- `@log`可以访问类
- `@immutable`可以让类只读 -- 也许它在新的实例上调用了`Object.freeze`
- `@time`会记录一个方法执行使用了多长时间，并输出日志

目前，使用 decorator 需要转码工具的支持。因为还没有浏览器和 node 的版本支持 decorator。如果你使用的是 Babel，只要使用[transform-decorators-legacy plugin](https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy)就可以。注意里面的
`legacy`这个词，这个是 babel 为了支持 es5 的方式实现 decorator，也许最后会和语言标准有些不同。

## 什么时候使用 decorator

高阶方法在 javascript 中已经使用的非常多了，但是它还是很难作用于其他的代码段（比如类和类的属性）上，至少写起来非常的别扭。

Decorator 支持类和属性，很好的解决了上面的问题。以后的 javascript 标准里也许会赋予 decorator 更多的作用，处理很多之前没法优雅的处理的代码。

## Decorator 的不同类型

目前的 decorator 还只支持类和类的成员，包括：属性、方法、getter 和 setter。

Decorator 的实质是一个放回方法的方法，并且会在里面以某种方式处理被装饰的代码段。这些 decorator 代码会在程序开始的时候运行一次，并且被装饰的代码会被 decorator 返回的值替换。

### 类成员 decorator

属性 decorator 作用在一个类成员上，无论是属性、方法、或者 getter 和 setter。这个 decorator 方法在调用的时候会传入三个参数：

- `target`: 成员所在的类
- `name`: 类成员的名字
- `descriptor`: 类成员的 descriptor。这个是在`Object.defineProperty`里使用的对象。

这里使用经典的例子`@readonly`。它是这么实现的：

```javascript
function readonly(target, name, descriptor) {
  descriptor.writeabgle = false;
  return descriptor;
}
```

这里在属性的 descriptor 里更新了`writable`的值为 false。

这个 decorator 是这么使用在类成员上的：

```javascript
class Example {
  a() {}

  @readonly
  b() {}
}

const e = new Example();
e.a = 1;
e.b = 2; // TypeError: Cannot assign to readonly property 'b' of object '#<Example>'
```

我们来看一个更有难度的例子。我们可以用不同的功能来取代被装饰的方法。比如，把所有的输入和输出都打印出来。

```javascript
function log(target, name, descriptor) {
  const original = descriptor.value;
  if (typeof original === "function") {
    descriptor.value = function(...args) {
      console.log(`Arguments: ${args}`);
      try {
        const result = original.apply(this, args);
        console.log(`Result: ${result}`);
        return result;
      } catch (e) {
        console.log(`Error: ${e}`);
        throw e;
      }
    };
  }

  return descriptor;
}
```

原来的方法基本就完全被取代了，我们在里面加上了日志打印输入、输出。

注意我们用了`...`操作符来自动把输入的参数转化为一个数组，这样比之前处理`arguments`的写法简单了很多。

运行之后会得到：

```javascript
class Example {
  @log
  sum(a, b) {
    return a + b;
  }
}

const e = new Example();

e.sum(1, 2);

// Arguments: 1,2
// Result: 3
```

你看到我们需要用一个有趣的语法来执行 decorator 方法。这一点可以单独写一篇文章来叙述了。简单来说`apply`方法可以让你指定所执行的方法的`this`和参数。

我们也可以让 decorator 接收参数。比如，我们可以这样重写`log` decorator。

```javascript
function log(name) {
  return function decorator(t, n, descriptor) {
    const original = descriptor.value;
    if (typeof original === "function") {
      descriptor.value = function(...args) {
        console.log(`Arguments for ${name}: ${args}`);

        try {
          const result = original.apply(this, args);
        } catch (e) {}
      };
    }

    return descriptor;
  };
}
```

这就更加的复杂了，但是分解开来看你会发现：

- 一个方法只接收一个参数的方法。 `log`只接收一个`name`参数。
- 这个方法返回了一个方法，这个方法才是 decorator

这个之前所些的`log` decorator 基本是一样的，只是它使用了外部方法传入的`name`参数。

使用的时候是这样的:

```javascript
class Example {
  @log("some tag")
  sum(a, b) {
    return a + b;
  }
}

const e = new Example();

e.sum(1, 2);
// Arguments for some tag: 1,2
// Result from some tag: 3
```

这样使用的结果是我们可以用某些 tag 来区分开不同的 log。

这样的写法可以运行是因为`log('some tag')`方法会被 javascript 运行时立即执行，然后把`log`方法的返回结果作为`sum`方法的 decorator。

### 类 decorator

类 decorator 会修饰整个类。Decorator 方法接收构造器方法作为唯一的参数。

注意类 decorator 作用域构造器方法，不是这个类的实例。也就是说如果你想修改类的实例等话你要自己写构造方法的包装函数。

一般来说，类 decorator 不如类成员 decorator 有用。因为你在这里可以实现的，都可以通过同样的方法调用一个方法来实现。总之，无论做什么你都需要在最后返回新的构造方法来代替就的构造方法。

我们来改造一下前面的`log`方法，让它来处理构造方法。

```javascript
function log(Class) {
  return (...args) => {
    console.log(args);
    return new Class(...args);
  };
}
```

这里我们接受一个类作为参数，然后返回一个新的方法。这个方法会被作为构造方法使用。它只是简单的把参数打印到 console 里，返回一个类的实例。

比如：

```javascript
@log
class Example {
  constructor(name, age) {}
}

const e = new Example("Graham", 12);
// ['Graham', 12]
console.log(e);
// Example {}
```

我们可以看到构造 Example 类的时候就会有参数的日志输出出来。Decorator 之后的类输出的实例也还是 Example 的实例。这正是我们要的效果。

给类 decorator 传入参数的办法和前面的类成员的 decorator 的方法是一样的：

```javascript
function log(name) {
  return function decorator(Class) {
    return (...args) => {
      console.log(`Arguments for ${name}: args`);
      return new Class(...args);
    };
  };
}

@log("Demo")
class Example {
  constructor(name, age) {}
}

const e = new Example("Graham", 12);
// Arguments for Demo: args
console.log(e);
// Example {}
```

## 真实的例子

### Core Decorators

有一个很不错的库叫做[Core Decorators](https://www.npmjs.com/package/core-decorators)。这个库提供了很多有用的 decorator，并且已经在使用中了。这个库里常用到的功能有 timing、警告、只读等工具方法。

### React

React 库使用了很多高阶组件。高阶组件其实就是 React 的组件，只不过写成了一个方法，并且包装了另外的一个组件。

尤其是在和 react-redux 库一起使用的时候，要写很多次的`connect`方法：

```javascript
class MyComponent extends React.Component {}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyComponent);
```

然而，这些都可以用 decorator 来代替：

```javascript
@connect(
  mapStateToProps,
  mapDispatchToProps
)
export default class MyComponent extends React.Component {}
```

### MobX

MobX 库广泛的使用了 decorator，这样你很容易的把字段标记为 Observable 或者 Computed，把类标记为 Observer。

## 总结

类成员 decorator 提供了很好的方法来包装类里的代码。这样你可以非常容易的把通用的工具类代码作用的类或者类成员上。
