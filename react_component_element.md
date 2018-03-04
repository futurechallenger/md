## React Component vs React Element

有这样的一个问题：
```javascript
// 方法定义
function add(x, y) {
	return x + y
}

// 方法调用
add(1, 2)

// 组件定义
class Icon extends Component {}

// 组件调用？？？？？？
<Icon />
```
最后的一句`<Icon />`用专业的词概括是什么操作，组件调用还是什么？

有答“组件声明”的，有答“组件调用的”，有“组件初始化”的，还有“使用一个组件”的。没有一个统一的称呼。造成这样局面的原因是很多时候我们都没有去详细的了解过JSX和React实际操作之间的抽象层。现在我们就深入研究一下这部分知识。

我们来看看最基础的问题，什么是React？React就是一个用来写界面的库。不管React和React的生态有多复杂，最核心的功能就是用来写界面的。那么我们来看看`Element`，很简单，但是一个*React element*描述的就是你想要在界面上看到的。再深入一点，一个*React element*就是一个代表了DOM节点的对象。注意，一个React element并不是在界面上实际绘制的东西，而是这些内容的代表。由于JavaScript对象是轻量级的，React可以任意的创建和销毁这些element对象，而且不用担心太大的消耗。另外，React可以分析这些对象，把当前的对象和之前的对象对比，找出发生的改变，然后根据实际发生的改变来更新实际的DOM。

为了创建一个DOM节点的代表对象（也就是React element），我们可以使用React的`createElement`方法。
```javascript
const element = React.createElement(
	'div',
	{id: 'login-btn'},
	'Login'
)
```
`createElement`方法传入了三个参数。第一个是标签名称字符串（div、span等），第二个是给element设置的属性，第三个是内容或者是子的React element。本例中的“Login”就是element的内容。上面的`createElement`方法调用后会返回一个这样的对象：
```javascript
{
	type: 'div’，
	props: {
		children: 'Login',
		id: 'login-btn'
	}
}
```
当这个对象绘制为DOM（使用`ReactDOM.render`方法）的时候，我们就会有一个新的DOM节点：
```html
<div id='login-btn'>Login</div>
```
有一个很有意思的地方，我们在学React的时候首先注意到的就是component（组件）。“Components（组件）是React的构建块”。注意，我们是以element开始本文的。而且你一旦理解了element，理解component也就是水到渠成的事了。一个component就是一个方法或者一个类，可以接受一定的输入，之后返回一个React element。
```javascript
function Button({onLogin}) {
	return React.createElement(
		'div',
		{id: 'login-btn', onClick: onLogin},
		'Login'
	)
}
```
在上面的定义中，我们有一个`Button`组件（component）。接收一个`onLogin`输入并返回一个React element。注意，`Button`组件接收的`onLogin`方法是它的`prop`。然后把这个方法通过`createElement`方法的第二个参数传入到了实际的DOM里。

### 更深入一点
目前，我们只接触到了使用HTML元素来创建React element，比如“div”、“span”等。其实，你也可以把其他的React component（组件）作为第一个参数传入`createElement`方法。
```javascript
const element = React.createElement(
	User,
	{name: 'Uncle Charlie'},
	null
)
```
然而，不同于一般的HTML标签名称，React如果发现第一个参数是*class*或者*function*类型的话，它就会检查传入的参数要绘制的是一个什么element，传入必要的props。之后React会一直检查，直到没有方法或者类作为第一个参数传入`createElement`。我们来看看下面的例子：
```javascript
function Button({addFriend}) {
	return React.createElement(
		'button',
		{onClick: addFriend},
		'Add Friend'
	)
}

function User({name, addFriend}) {
	return React.createElement(
		'div',
		null,
		React.createElement(
			'p',
			null,
			name
		),
		React.createElement(Button, {addFriend})
	)
}
```

上面的例子里有两个component（组件）。一个Button，一个User。User“代表”了一个*div*，div里面有两个子节点：一个包含用户名的“p”和一个*Button*组件。现在我们看看上面的例子的具体的调用过程。
```javascript
function Button({addFriend}) {
	return {
		type: 'button',
		props: {
			onClick: addFriend,
			children: 'Add Friend'
		}
	}
}

function User({name, addFreind}) {
	return {
		type: 'div',
		props: {
			children: [
				{
					type: 'p',
					props: {
						children: name
					}
				},
				{
					type: Button,
					props: {
						addFriend
					}
				}
			]
		}
	}
}
```

在上面的代码里你会看到四种不同的属性：“button”，“div”，“p”和`Button`。当React看到一个element是function和类类型的话，它就会检查element会返回什么element，并传入对应的props。在这个过程结束之后，React就拥有了一个代表DOM树的对象的数。上面的例子最后的结构是这样的：
```javascript
{
  type: 'div',
  props: {
    children: [
      {
        type: 'p',
        props: {
          children: 'Tyler McGinnis'
        }
      },
      {
        type: 'button',
        props: {
          onClick: addFriend,
          children: 'Add Friend'
        }
      }
    ]
  }
}
```
上面叙述的整个过程叫做**Reconciliation**（这个不知道怎么翻译，应该叫和谐？）。在React里，每次调用`setState`方法或`ReactDOM.render`方法被调用的时候都会触发这个过程。

那么我们来看看最开始的问题：
```javascript
// 方法定义
function add(x, y) {
	return x + y
}

// 方法调用
add(1, 2)

// 组件定义
class Icon extends Component {}

// 组件调用？？？？？？
<Icon />
```
现在我们已经有了回答这个问题的全部知识，除了一点点以外。有个地方，你可能觉得奇怪在使用React的时候，从来没有用过`createElement`方法来创建element。你是用了JSX。我（作者）最开始的时候说：“主要原因是从来没有去详细的了解过JSX和React实际操作之间的抽象层”。这个抽象层就是JSX会被Babel转码为`React.createElement`方法的调用。

看看我们前面的例子：
```javascript
function Button({addFriend}) {
	return React.createElement(
		'button',
		{onClick: addFriend},
		'Add Friend'
	)
}

function User({ name, addFriend }) {
  return React.createElement(
    "div",
    null,
    React.createElement(
      "p",
      null,
      name
    ),
    React.createElement(Button, { addFriend })
  )
}
```
写成JSX的样子是这样的：
```javascript

function Button({addFriend}) {
	return (
		<button onClick={addFriend}>Add Friend</button>
	)
}

function User({name, addFriend}) {
	return (
		<div>
			<p>{name}</p>
			<Button addFriend={addFriend} />
		</div>
	)
}
```

所以，最后我们应该怎么回答前面的问题呢？`<Icon />`叫做什么？

应该叫做“创建element”，应为JSX最后会转码为`createElement`方法的调用：
```javascript
React.createElement(Icon, null)
```
前面的例子都是“创建一个React element”。

```javascript
React.createElement(
  'div',
  { className: 'container' },
  'Hello!'
)

<div className='container'>Hello!</div>

<Hello />
```



