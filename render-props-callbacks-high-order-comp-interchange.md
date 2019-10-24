# Render props、render callback 和高阶组件皆可互换

让 render-xxx 模式都可以互换。

## 基础

所有上面提到的三种模式都是为了处理 mixin 要处理的问题的。在我们继续之前，我们来看一些例子。

如果你已经掌握这两个概念，可以直接跳过这一节看后面的内容

### Render Prop

首先，我们来写一个组件来记录 count，并绘制 render prop 里的绘制都在 render 方法里调用了。

```javascript
class CounterComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  update = type => {
    if (type === "Inc") {
      this.setState(({ count }) => ({ count: count + 1 }));
    } else if (type === "Dec") {
      this.setState(({ count }) => ({ count: count - 1 }));
    }
  };

  render() {
    return this.props.render({
      ...this.state,
      ...this.props,
      update: this.update
    });
  }
}
```

注意：callback 属性也可以叫个别的名字，不一定就是 render。只不过这个模式叫做 render prop。

接下来我们需要一个组件来把需要的内容绘制到屏幕上：

```javascript
const Counter = ({ count, update }) => {
  <div>
    <button onClick={() => update("Inc")}>Inc</button>
    {count}
    <button onClick={() => update("Dec")}>Dev</button>
  </div>;
};
```

`Counter`组件接受 count 值和一个 update 方法，然后显示一个增加、一个减少按钮以及当前的 count 值。

最后我们可以用`CounterComponent`组件来给`Counter`增加一些其他的功能：

```javascript
render(
  <CounterComponent render={props => <Counter {...props} />>} />,
  document.getElementById('root')
);
```

### 高阶组件

上文讲解了 render prop 模式。现在来看看怎么使用高阶组件来达到同样的目的。

```javascript
const withCounter = Component =>
  class Hoc extends React.Component {
    constructor(props) {
      super(props);
      this.state = { count: 0 };
    }

    update = type => {
      if (type === "Inc") {
        this.setState(({ count }) => ({ count: count + 1 }));
      } else if (type === "Dec") {
        this.setState(({ count }) => ({ count: count - 1 }));
      }
    };

    render() {
      return <Component {...this.state} {}
    }
  };
```

看上面的例子，我们可以要把需要绘制的组件放到另外一个全新的组件里面去。在这个新的组件里包含了加强的 state 和 props 等内容。

```javascript
const CounterExample = withCounter(Counter);
render(<CounterExample />, document.getElementById("root"));
```

目前我们已经覆盖了基本的概念。我们可以使用不同的模式来达到相同的目的。下面我们来关注一下如何让这几个模式达到互换的目的。

## 在 render props 和高阶组件之间转换

有的时候你用的库提供了一个高级组件，但是你最喜欢的是通过*JSX*的方式来使用组件。有时会遇到一个提供了 render props 的库，但是你喜欢的是*高阶组件*。一个很有趣的事实是这些模式可以幻想转换。

我们来根据上面的例子来加一些方法可以让高阶组件和 render props 模式可以互相转换。

```javascript
fromHoc: HOC -> RenderProp
toHoc: RenderProp -> HOC
```

`toHoc`方法可以归结为：

```javascript
toHoc: Render => Comp => props => (
  <Render {...Props} render={props => <Comp {...props} />} />
);
```

你也可以看[使用 Render Props](https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce)来作为替代实现。

它会把一个 render prop 模式转化为高阶组件。

```javascript
const withCounter = toHoc(CounterComponent);
const CounterExample = withCounter(Counter);
```

从高阶组件转化为 render prop 有一点麻烦。我们需要把一个 render prop 的组件传入到高阶组件里。多亏了 Brent Jackon 的[这篇文章](https://github.com/jxnblk/refunk/blob/7a12bbda79b2423fef8d37439f9029f1aa19131b/src/component.js)。

```javascript
fromHoc: hoc => {
  class Render extends React.Component {
    render() {
      return this.props.children(this.props);
    }
  }

  return hoc(Render);
};
```

或者，使用两外一种不用 class 的方式。这次要感谢 Rodrigo Pombo 的这个[例子](https://twitter.com/pomber/status/992073195300835328)。

```javascript
fromHoc: hoc => hoc(props => props.render(props));
```

我们可以写一个轻量的 helper 方法来实现高阶组件和 renderprops 的转化。注意，我们也可以在初始化 toHoc 方法的时候使用另外的 render name，因为 render prop 可以能有一个不一样的名字，或者是一个子 prop。

```javascript
const iso = {
  fromHoc: hoc => hoc(props => props.render(props)),
  toHoc: Render => Compo => props => (
    <Render {...props} render={props => <Comp {...props} />} />
  )
};
```

## 总结

Render prop，回调绘制和高阶组件都是可以互换的。大多数的时候 render props 可以满足要求。但是你也可以通过某些方法让它在这些模式之间互相转换。

非常感谢 Brent Jackson，Kent C. Dodds 以及 Rodrigo Pombot 提供了`fromHoc`方法的实现，帮我们解决了不少的问题。
