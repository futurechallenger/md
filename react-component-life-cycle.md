## 理解React组件的生命周期

本文作者写作的时间较早，所以里面会出现很多的旧版ES5的时代的方法。不过，虽然如此并不影响读者理解组件的生命周期。反而是作者分为几种不同的触发机制来解释生命周期的各个方法，让读者更加容易理解涉及到的概念。以下是正文。

### 简介
`React`在创建组件的时候会触发组件生命周期各个方法的调用。这篇文章就分别介绍其中的各种不同的绘制触发之后调用的各个生命周期的方法。

理解组件的生命周期，你才可以在组件创建、销毁的时候执行特定的方法。甚至于，你可以决定是否更新组件，正确的处理`state`、`props`的改变。

### 生命周期
要弄清楚生命周期，首先就要区分开初次创建和`state`、`props`更改触发的组件更新，以及组件的卸载。

#### 初始化
||初始化|
--|--
|√|initial props|
|√|initial state|
|√|`componentWillMount`|
|√|`render`|
|√|`componentDidMount`|

在ES6里，**initial props**在类的`constructor`方法里作为参数传入了。**initial state**则在`constructor`方法里有开发者自行设置。如：
```javascript
class DemoComponent extends React.Component {
	constructor(props) {
    super(props)

    this.state = {
    	initialState: 'value',
    }

    this._innerMethod = this._innerMethod.bind(this)
  }
}
```
`componentWillMount`方法在`render`方法执行之前被调用。有一点需要注意，在这里设置state不会触发重绘。
`render`方法返回组件需要的标记（markup），并最终转化为正确的输出。`props`和`state`都不应该在这个方法里修改。一定要记住`render`方法必须是一个纯函数。也就是每次调用，这个方法都要返回同样的结果。

当`render`方法执行之后就开始执行`componentDidMount`方法。`DOM`元素（React Native的原生元素）可以在这个方法里取到。这时可以在这个方法里执行数据获取等操作。如果需要的话，任何的DOM操作都可以在这里执行，绝对不可以在`render`方法里执行。

#### State改变引发的绘制

`State`的修改会触发一些列的方法：

||更新state|
|--|--|
|√|`shouldComponentUpdate`|
|√|`componentWillUpdate`|
|√|`render`|
|√|`componentDidUpdate`|

`shouldComponentUpdate`方法会在`render`方法调用之前调用。在这个方法里可以控制是否绘制组件，或者直接跳过。显然，这个方法一定不会在初始化的时候调用。在这个方法里需要返回一个boolean类型的值，默认返回`true`。
```javascript
shouldComponentUpdate(nextProps, nextState) {
	return true
}
```
通过对`nextProps`和`nextState`的值的处理，可以判定接下来的重绘是否必要。
`componentWillUpdate`方法在`shouldComponentUpdate`方法返回true之后就会被调用。在和方法里任何的`this.setState`方法调用都是不允许的，因为这个方法是用来为接下来的绘制做准备的，不是用来触发重绘的。

`componentDidUpdate`方法在`render`方法之后调用。和`componentDidMount`方法类似，这个方法里也可以执行DOM操作。
```javascript
componentWillUpdate(nextProps, nextState) {
	// 为接下来的绘制做准备
}

componentDidUpdate(prevProps, prevState) {
	// 
}
```

#### Props改变引发的绘制

任何对props对象的修改也会触发生命周期方法的调用，这个过程和state的修改引发的生命周期方法基本一致，只是多了一个方法。

||更新Props|
|--|--|
|√|`componentWillRecieveProps`|
|√|`shouldComponentUpdate`|
|√|`componentWillUpdate`|
|√|`render`|
|√|`componentDidUpdate`|


`componentWillRecieveProps`只会在`props`对象发生改变并且不是初始绘制的时候调用。在这个方法里，可以根据当前的`props`和将要传入的`props`来设置`state`，但是这样并不会触发绘制。**这个方法里有个很有趣的地方，在这个方法里state的相等比较是无效的，因为state的改变不应该引起任何的props的改变。
```javascript
componentWillReceiveProps(nextProps) {
	this.setState({
		// 设置state
	})
}
```
其他的生命周期基本上和改变state引起的生命周期方法是一样的。

#### 卸载

||卸载|
|--|--|
|√|`componentWillUnmount`|

我们唯一没有触及的方法就是`componentWillUnmount`了。这个方法在组件被从DOM中移除之前调用。当你需要在组件移除前执行清理操作的时候非常有用。比如，清除`timer`之类的对象。







