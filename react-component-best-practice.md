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
    this.setState(prevState => ({ expanded: !prevState.expanded }))
  }
  
  render() {
    const {
      model,
      title
    } = this.props
    return ( 
      <ExpandableForm 
        onSubmit={this.handleSubmit} 
        expanded={this.state.expanded} 
        onExpand={this.handleExpand}>
        <div>
          <h1>{title}</h1>
          <input
            type="text"
            value={model.name}
            onChange={this.handleNameChange}
            placeholder="Your Name"/>
        </div>
      </ExpandableForm>
    )
  }
}
```
有多行的`props`的，每一个prop都应该单独占一行。就如上例一样。要达到这个目标最好的方法是使用一套工具：`Prettier`。

## 装饰器（Decorator）
```js
@observer
export default class ProfileContainer extends Component {
```
如果你了解某些库，比如*mobx*，你就可以使用上例的方式来修饰类组件。装饰器就是把类组件作为一个参数传入了一个方法。

[装饰器][5]可以编写更灵活、更有可读性的组件。如果你不想用装饰器，你可以这样：
```js
class ProfileContainer extends Component {
  // Component code
}
export default observer(ProfileContainer)
```

## 闭包
尽量避免在子组件中传入闭包，如：
```js
<input
  type="text"
  value={model.name}
  // onChange={(e) => { model.name = e.target.value }}
  // ^ Not this. Use the below:
  onChange={this.handleChange}
  placeholder="Your Name"/>
```
**注意**：如果`input`是一个React组件的话，这样自动触发它的重绘，不管其他的props是否发生了改变。

一致性检验是React最消耗资源的部分。不要把额外的工作加到这里。处理上例中的问题最好的方法是传入一个类方法，这样还会更加易读，更容易调试。如：
```js
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { string, object } from 'prop-types'
// Separate local imports from dependencies
import ExpandableForm from './ExpandableForm'
import './styles/ProfileContainer.css'

// Use decorators if needed
@observer
export default class ProfileContainer extends Component {
  state = { expanded: false }
  // Initialize state here (ES7) or in a constructor method (ES6)
 
  // Declare propTypes as static properties as early as possible
  static propTypes = {
    model: object.isRequired,
    title: string
  }

  // Default props below propTypes
  static defaultProps = {
    model: {
      id: 0
    },
    title: 'Your Name'
  }

  // Use fat arrow functions for methods to preserve context (this will thus be the component instance)
  handleSubmit = (e) => {
    e.preventDefault()
    this.props.model.save()
  }
  
  handleNameChange = (e) => {
    this.props.model.name = e.target.value
  }
  
  handleExpand = (e) => {
    e.preventDefault()
    this.setState(prevState => ({ expanded: !prevState.expanded }))
  }
  
  render() {
    // Destructure props for readability
    const {
      model,
      title
    } = this.props
    return ( 
      <ExpandableForm 
        onSubmit={this.handleSubmit} 
        expanded={this.state.expanded} 
        onExpand={this.handleExpand}>
        // Newline props if there are more than two
        <div>
          <h1>{title}</h1>
          <input
            type="text"
            value={model.name}
            // onChange={(e) => { model.name = e.target.value }}
            // Avoid creating new closures in the render method- use methods like below
            onChange={this.handleNameChange}
            placeholder="Your Name"/>
        </div>
      </ExpandableForm>
    )
  }
}
```

## 方法组件
这类组件没有state没有props，也没有方法。它们是纯组件，包含了最少的引起变化的内容。经常使用它们。

### propTypes
```js
import React from 'react'
import { observer } from 'mobx-react'
import { func, bool } from 'prop-types'
import './styles/Form.css'
ExpandableForm.propTypes = {
  onSubmit: func.isRequired,
  expanded: bool
}
// Component declaration
```
我们在组件的声明之前就定义了`propTypes`。

### 分解Props和defaultProps
```js
import React from 'react'
import { observer } from 'mobx-react'
import { func, bool } from 'prop-types'
import './styles/Form.css'

ExpandableForm.propTypes = {
  onSubmit: func.isRequired,
  expanded: bool,
  onExpand: func.isRequired
}

function ExpandableForm(props) {
  const formStyle = props.expanded ? {height: 'auto'} : {height: 0}
  return (
    <form style={formStyle} onSubmit={props.onSubmit}>
      {props.children}
      <button onClick={props.onExpand}>Expand</button>
    </form>
  )
}
```
我们的组件是一个方法。它的参数就是`props`。我们可以这样扩展这个组件：
```js
import React from 'react'
import { observer } from 'mobx-react'
import { func, bool } from 'prop-types'
import './styles/Form.css'

ExpandableForm.propTypes = {
  onSubmit: func.isRequired,
  expanded: bool,
  onExpand: func.isRequired
}

function ExpandableForm({ onExpand, expanded = false, children, onSubmit }) {
  const formStyle = expanded ? {height: 'auto'} : {height: 0}
  return (
    <form style={formStyle} onSubmit={onSubmit}>
      {children}
      <button onClick={onExpand}>Expand</button>
    </form>
  )
}
```
现在我们也可以使用默认参数来扮演默认props的角色，这样有很好的可读性。如果`expanded`没有定义，那么我们就把它设置为`false`。

但是，尽量避免使用如下的例子：
```js
const ExpandableForm = ({ onExpand, expanded, children }) => {
```
看起来很现代，但是这个方法是未命名的。

如果你的Babel配置正确，未命名的方法并不会是什么大问题。但是，如果Babel有问题的话，那么这个组件里的任何错误都显示为发生在 <<anonymous>>里的，这调试起来就非常麻烦了。

匿名方法也会引起Jest其他的问题。由于会引起各种难以理解的问题，而且也没有什么实际的好处。我们推荐使用`function`，少使用`const`。

### 装饰方法组件
由于方法组件没法使用装饰器，只能把它作为参数传入别的方法里。
```js
import React from 'react'
import { observer } from 'mobx-react'
import { func, bool } from 'prop-types'
import './styles/Form.css'

ExpandableForm.propTypes = {
  onSubmit: func.isRequired,
  expanded: bool,
  onExpand: func.isRequired
}

function ExpandableForm({ onExpand, expanded = false, children, onSubmit }) {
  const formStyle = expanded ? {height: 'auto'} : {height: 0}
  return (
    <form style={formStyle} onSubmit={onSubmit}>
      {children}
      <button onClick={onExpand}>Expand</button>
    </form>
  )
}
export default observer(ExpandableForm)
```

只能这样处理：`export default observer(ExpandableForm)`。

这就是组件的全部代码：
```js
import React from 'react'
import { observer } from 'mobx-react'
import { func, bool } from 'prop-types'
// Separate local imports from dependencies
import './styles/Form.css'

// Declare propTypes here, before the component (taking advantage of JS function hoisting)
// You want these to be as visible as possible
ExpandableForm.propTypes = {
  onSubmit: func.isRequired,
  expanded: bool,
  onExpand: func.isRequired
}

// Destructure props like so, and use default arguments as a way of setting defaultProps
function ExpandableForm({ onExpand, expanded = false, children, onSubmit }) {
  const formStyle = expanded ? { height: 'auto' } : { height: 0 }
  return (
    <form style={formStyle} onSubmit={onSubmit}>
      {children}
      <button onClick={onExpand}>Expand</button>
    </form>
  )
}

// Wrap the component instead of decorating it
export default observer(ExpandableForm)
```

## 条件判断
某些情况下，你会做很多的条件判断：
```js
<div id="lb-footer">
  {props.downloadMode && currentImage && !currentImage.video && currentImage.blogText
  ? !currentImage.submitted && !currentImage.posted
  ? <p>Please contact us for content usage</p>
    : currentImage && currentImage.selected
      ? <button onClick={props.onSelectImage} className="btn btn-selected">Deselect</button>
      : currentImage && currentImage.submitted
        ? <button className="btn btn-submitted" disabled>Submitted</button>
        : currentImage && currentImage.posted
          ? <button className="btn btn-posted" disabled>Posted</button>
          : <button onClick={props.onSelectImage} className="btn btn-unselected">Select post</button>
  }
</div>
```
这么多层的条件判断可不是什么好现象。

有第三方库[JSX-Control Statements](https://github.com/AlexGilleran/jsx-control-statements)可以解决这个问题。但是与其增加一个依赖，还不如这样来解决：
```js
<div id="lb-footer">
  {
    (() => {
      if(downloadMode && !videoSrc) {
        if(isApproved && isPosted) {
          return <p>Right click image and select "Save Image As.." to download</p>
        } else {
          return <p>Please contact us for content usage</p>
        }
      }

      // ...
    })()
  }
</div>
```
使用大括号包起来的[IIFE](https://stackoverflow.com/questions/8228281/what-is-the-function-construct-in-javascript)，然后把你的`if`表达式都放进去。返回你要返回的组件。


## 最后

再次，希望本文对你有用。如果你有什么好的意见或者建议的话请写在下面的评论里。谢谢！












[1]:https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0#.kuvqndiqq
[2]:https://stackoverflow.com/questions/35662932/react-constructor-es6-vs-es7
[3]:https://github.com/facebook/prop-types
[4]:https://medium.com/@indiesquidge
[5]:http://javascript.info/call-apply-decorators
[css in javascript]: https://medium.freecodecamp.org/a-5-minute-intro-to-styled-components-41f40eb7cd55