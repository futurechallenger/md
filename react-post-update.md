# componentDidUpdate之后的绘制

`componentDidUpdate`是更新版的`componentDidMount`方法。在这里可以处理本地的UI元素，可以操作`refs`，有需要的话也可以开启另外一个绘制过程。

`componentDidUpdate`方法会传入两个参数：`prevProps`, `prevState`。这个正好和`componentWillUpdate`是相对的。这个两个参数的值就是在方法调用之前的`this.props`和`this.state`。

就如同`componentDidMount`，`componentDidUpdate`在所有的子组件都更新之后被调用。如上图，*A.0.0*的`componentDidUpdate`会先调用，然后是*A.0*的，最后才是*A*的。

## 如何使用
使用`componentDidUpdate`最一般的情况就是管理第三个的UI组件，以及和本地UI元素交互。比如你使用了Chart库之后：
```js
componentDidUpdate(prevProps, prevState) {
  // 如果数据发生变化，则更新图表
  if(prevProps.data !== this.props.data) {
    this.chart = c3.load({
      data: this.props.data
    });
  }
}
```
在数据发横变化之后，更新图表

## 其他绘制过程
我们也可以查找本地的UI元素、获取大小和css的样式等。我们可以更新子组件。这时，可以调用`this.setState`或者`forceUpdate`。但是，这样也会引起很多的其他问题。

最糟糕的问题就是在没有检查条件的情况下直接调用`setState`方法：
```js
componentDidUpdate(prevProps, prevState) {
  let height = ReactDOM.findDOMNode(this).offsetHeight;
  this.setState({
    internalHeight: height
  });
}
```

默认情况下`shouldComponentUpdate`方法返回的是`true`。所以，如果我们用了上面的方法，我们会进入无限循环的状态。

总的来说，一般不需要这么做。而且这样的重绘会造成性能问题。

