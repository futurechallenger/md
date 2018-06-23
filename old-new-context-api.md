# 迁移到新的 React Context Api

随着 React 16.3.0 的发布，context api 也有了很大的更新。我已经从旧版的 api 更新到了新版。这里就分享一下我（作者）的心得体会。

## 回顾

下面是一个展示如何使用旧版 api 的例子：

```javascriptr
function Usage(props) {
  return (
    <Toggle onToggle={props.onToggle}>
      <Toggle.On>The button is on</Toggle.On>
      <Toggle.Off>The button is off</Toggle.Off>
      <div>
        <Toggle.Button />
      </div>
    </Toggle>
  )
}
```

上面的代码会返回一个复合组件`Toggle`。这个组件可以让子组件共享隐式的状态。在某些简单的情况下可以用`React.Children.map`来处理。但是，这个例子需要使用 context api 来达到在 React 的某个组件树的任意节点分享 state 的目的。

### 旧的 Context Api

这是一个旧版 context api 的应用例子：

```javascript
const TOGGLE_CONTEXT = "__toggle__";

// Toggle on
function ToggleOn({ children }, context) {
  const { on } = context[TOGGLE_CONTEXT];
  return on ? children : null;
}

ToggleOn.contextTypes = {
  [TOGGLE_CONTEXT]: PropTypes.object.isRequired
};

// Toggle off
function ToggleOff({ children }, context) {
  const { on } = context[TOGGLE_CONTEXT];
  return on ? null : children;
}

ToggleOff.contextTypes = {
  [TOGGLE_CONTEXT]: PropTypes.object.isRequired
};

// Toggle button
function ToggleButton(props, context) {
  const { on, toggle } = context[TOGGLE_CONTEXT];
  return <Switch on={on} onClick={toggle} {...props} />;
}

ToggleButton.contextTypes = {
  [TOGGLE_CONTEXT]: PropTypes.object.isRequired
};

// Toggle
class Toggle extends React.Component {
  static On = ToggleOn;
  static Off = ToggleOff;
  static Button = ToggleButton;
  static defaultProps = { onToggle: () => {} };
  static childContextTypes = {
    [TOGGLE_CONTEXT]: PropTypes.object.isRequired
  };

  state = { on: false };
  toggle = () =>
    this.setState(
      ({ on }) => ({ on: !on }),
      () => this.props.onToggle(this.state.on)
    );
  getChildContext() {
    return {
      [TOGGLE_CONTEXT]: {
        on: this.state.on,
        toggle: this.toggle,
      }
    };
  }

  render(){
    return <div>{this.props.children</div>
  }
}
```

在就的 API 里，你必须用一个字符串指定要分享的 state。然后通过`getChildContext`方法返回实际的 context。在父组件里通过`childContextTypes`来指定发出的 context 的类型，在子组件里用`contextTypes`来指定接收的 context 的类型。我(作者, 下文同)从来不喜欢这样不直接的方式, 平时也尽量不这么做。另外，还要使用静态属性，才能保证 context 值传入子组件。 我也不喜欢这样。

另一个问题是如果`shouldComponentUpdate`方法返回 false 的话，context 的值是不会变的。当然这也有变通的方法，具体可以参考这个[repo](https://github.com/ReactTraining/react-broadcast)。

## 新的 Context API

新的 context api 没有这些问题，这也是我为什么这么激动的原因。上面的例子可以更新为：

```javascript
const ToggleContext = React.createContext({
  on:false,
  toggle: () => {},
});

class Toggle extends React.Component {
  static On = ({children}) => (
    <ToggleContext.Consumer>
      {({on})=>(on ? children: null)}
    </ToggleContet.Consumer>
  )

  static Off = ({children}) => (
    <ToggleContext.Consumer>
      {({on}) => (on ? null : children)}
    </ToggleContext.Consumer>
  );

  static Button = props => (
    <ToggleContext.Consumer>
      {({on, toggle}) => (
        <Switch on={on} toggle={toggle} {...props} />
      )}
    </ToggleContext.Consumer>
  )

  toggle = () => this.setState(
    ({on}) => ({on: !on}),
    () => this.props.onToggle(this.state.on)
  );

  state = {on: false, toggle: this.toggle};

  render() {
    return (
      <ToggleContext.Provider value={}>
        {this.props.children}
      </ToggleContext.Provider>
    );
  }
}
```
旧的API的问题都没有了。现在不仅没有了不直接的字符串，还有了明显的组件：`Provider`和`Consumer`分别提供和消费context。
每一个子组件都需要用consumer子组件，就想在就api里需要有静态属性一样）。但是，两个api的这个问题都可以通过基于render props的高阶组件来解决。非常简单！

另一个通过`shouldComponentUpdate`返回false来更新的问题也解决了。新的context api会自动处理这个问题。

最后一个非常好的改变是子组件都使用了render props模式。这样在新的context api里也可以对外界暴露非常优雅的接口。

## 新api的问题
这就是在新的api里通过`Provider`的value属性给子组件消费的值，只有在你想要子组件重绘的时候才会改变。
这也就是说**在render方法里使用`value={{on: this.state.on, toggle: this.toggle}}是不被推荐的。
这是因为没次render都会传入一个新的对象，即使state本身没有改变。**因为是一个新的对象，那么所有的子组件也都会重绘。

这个影响在实际使用的时候会很大。一般来说最好是传入一个只有在state改变时才改变的值。也就是为什么说`value={this.state}`。
如果你不想传入整个state给消费者，那么你可以使用这个Ryan Florence的这个[小技巧](https://twitter.com/ryanflorence/status/981179212147998721)。

只不过这也还是会有一个小问题，我需要把`toggle`方法存入state里。这也显得很奇怪，不过这只是一个小瑕疵，不影响大局。

## 总结

新的context api绝对是React团队带来的一个非常好的改变。希望你也能和我一样的喜欢。

另外：如果你还不能用16.3.0这个版本，那么你可以添加一个polyfill来使用新的api。这个polyfill是[create-react-context](https://www.npmjs.com/package/create-react-context)。