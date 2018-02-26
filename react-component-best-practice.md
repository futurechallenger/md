当我刚开始写React的时候，我看过很多写组件的方法。一百篇教程就有一百种写法。虽然React本身已经成熟了，但是如何使用它似乎还没有一个“正确”的方法。所以我（作者）把我们团队这些年来总结的使用React的经验总结在这里。希望这篇文字对你有用，不管你是初学者还是老手。

开始前：
* 我们使用ES6、ES7语法
* 如果你不是很清楚展示组件和容器组件的区别，建议您从阅读这篇[文章][1]开始
* 如果您有任何的建议、疑问都清在评论里留言

## 基于类的组件

现在开发React组件一般都用的是基于类的组件。下面我们就来一行一样的编写我们的组件：
```js
import React, { Component } from 'react';
import { observer } from 'mobx-react';

import ExpandableForm from './ExpandableForm';
import './styles/ProfileContainer.css';
```
我很喜欢[css in javascript]。但是，这个写样式的方法还是太新了。所以我们在每个组件里引入css文件。而且本地引入的import和全局的import会用一个空行来分割。

## 初始化State
```js
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import ExpandableForm from './ExpandableForm'
import './styles/ProfileContainer.css'

export default class ProfileContainer extends Component {
  state = { expanded: false }
```
您可以使用了老方法在`constructor`里初始化`state`。更多相关可以看[这里][2]。但是我们选择更加清晰的方法。
同时，我们确保在类前面加上了`export default`。（译者注：虽然这个在使用了redux的时候不一定对）。

## propTypes and defaultProps

```js
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { string, object } from 'prop-types'

import ExpandableForm from './ExpandableForm'
import './styles/ProfileContainer.css'

export default class ProfileContainer extends Component {
  state = { expanded: false }
 
  static propTypes = {
    model: object.isRequired,
    title: string
  }
 
  static defaultProps = {
    model: {
      id: 0
    },
    title: 'Your Name'
  }

  // ...
}
```
`propTypes`和`defaultProps`是静态属性。尽可能在组件类的的前面定义，让其他的开发人员读代码的时候可以立刻注意到。他们可以起到文档的作用。

如果你使用了React 15.3.0或者更高的版本，那么需要另外引入`prop-types`包，而不是使用`React.PropTypes`。更多内容移步[这里][3]。

你所有的组件都应该有**prop types**。

## 方法
```js
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { string, object } from 'prop-types'

import ExpandableForm from './ExpandableForm'
import './styles/ProfileContainer.css'

export default class ProfileContainer extends Component {
  state = { expanded: false }
 
  static propTypes = {
    model: object.isRequired,
    title: string
  }
 
  static defaultProps = {
    model: {
      id: 0
    },
    title: 'Your Name'
  }
  handleSubmit = (e) => {
    e.preventDefault()
    this.props.model.save()
  }
  
  handleNameChange = (e) => {
    this.props.model.changeName(e.target.value)
  }
  
  handleExpand = (e) => {
    e.preventDefault()
    this.setState({ expanded: !this.state.expanded })
  }

  // ...

}
```
在类组件里，当你把方法传递给子组件的时候，需要确保他们被调用的时候使用的是正确的**this**。一般都会在传给子组件的时候这么做：`this.handleSubmit.bind(this)`。

使用ES6的箭头方法就简单多了。它会自动维护正确的上下文（`this`）。

## 给setState传入一个方法

在上面的例子里有这么一行：
```js
this.setState({ expanded: !this.state.expanded });
```
`setState`其实是异步的！React为了提高性能，会把多次调用的`setState`放在一起调用。所以，调用了`setState`之后state不一定会立刻就发生改变。

所以，调用`setState`的时候，你不能依赖于当前的state值。因为i根本不知道它是值会是神马。

解决方法：给`setState`传入一个方法，把调用前的state值作为参数传入这个方法。看看例子：
```js
this.setState(prevState => ({ expanded: !prevState.expanded }))
```

感谢[Austin Wood][4]的帮助。

## 拆解组件


[1]:https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0#.kuvqndiqq
[2]:https://stackoverflow.com/questions/35662932/react-constructor-es6-vs-es7
[3]:https://github.com/facebook/prop-types
[4]:https://medium.com/@indiesquidge
[css in javascript]: https://medium.freecodecamp.org/a-5-minute-intro-to-styled-components-41f40eb7cd55