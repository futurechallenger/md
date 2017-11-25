很高兴我们可以继续分享编写虚拟DOM的知识。这次我们要讲解的是产品级的内容，其中包括：设置和DOM一致性、以及事件的处理。

## 使用Babel
在继续之前，我们需要弥补前一篇文章中没有详细讲解的内容。假设有一个没有任何属性（props）的节点：
```js
<div></div>
```
Babel，在处理这个节点的时候会把节点的**props**属性设置为“null”，因为它没有任何的属性。因此我们会得到这样的结果：
```js
function h(type, props, ...children) {
	return {type, props: props || {}, children};
}
```

## 设置props
设置props非常简单，记得DOM显示吗？我们把props作为简单的js对象来存储，所以这样的标签：
```js
<ul className="list", style="list-style: none;"></ul>
```
内存里就会有这样的对象：
```js
{
	type: 'ul',
	props: {className: 'list', style: 'list-style:none;'}
}
```
因此每一个props的字段就是一个**属性名**，这个字段的值就是属性值。所以，我们只要把这些值给真正的DOM节点设置了就可以了。我们写一个方法包装一个**setAttribute()**方法：
```js
function setProp($target, name, value) {
	$target.setAttribute(name, value);
}
```
那么现在我们知道如何设置属性了（prop）--我们之后可以全部都设置上，只要遍历prop对象的属性就可以：
```js
function setProps($target, props) {
	Object.keys(props).forEach(name => {
		setProp($target, name, props[name]);
	})
}
```
还记得**createElement()**方法么？我们只需要在真正的DOM节点创建之后调用**setProp**方法给它设置即可：
```js
function createElement(node) {
	if(typeof node === 'string) {
		return document.createTextNode(node);
	}
	const $el = document.createElement(node.type);
	setProps($el, node.props);
	node.children
		.map(createElement)
		.forEach($el.appendChild.bind($el));
	return $el;
}
```
但是，这还没有完。我们忘记了一些小细节。首先，‘class’是js的保留字。所以不能把它用作属性名称。我们会使用‘className’：
```js
<nav className="navbar light">
	<ul></ul>
</nav>
```
但是在真正的DOM里并没有‘className’，所以我们应该在**setProp**方法里处理这个问题。

另外一个事情是，设置布尔型的属性的时候最好使用布尔值：
```js
<input type="checkbox" checked={false} />
```
在这个例子里，我并不希望这个'checked'属性值设置在真正的DOM节点上。但是事实上这个值足够设置DOM节点了，当然这同时还需要给对应的虚拟DOM节点也设置这个值：
```js
function setBooleanProp($target, name, value) {
	if(value) {
		$target.setAttribute(name, value);
		$target.[name] = true;
	} else {
		$target[name] = false;
	}
}
```
现在我们就来看看如何自定义属性。这次完全是我们自己的实现，因此后面我们会有不同作用的属性，并且不是全都要在DOM节点上显示的。所以要写一个方法来检查这个属性是不是自定义的。现在它是空的，所以我们还没有任何的自定义属性：
```js
function isCustomProp(name) {
	return false;
}
```
下面就是我们完整的`setProp()`方法，把所有的问题都处理了：
```js
function setProp($target, name, value) {
	if(isCustomProp(name)) {
		return;
	} else if(name === 'className') {
		$target.setAttribute('class', value);
	} else if(typeof value === 'boolean') {
		setBooleanProp($target, name, value);
	} else {
		$target.setAttribute(name, value);
	}
}
```
现在在[JSFiddle](https://jsfiddle.net/deathmood/st5cyz16/?utm_source=website&utm_medium=embed&utm_campaign=st5cyz16)里面试试吧.

## 属性区分（Diff Props）
现在我们已经可以使用prop来创建元素了，现在要处理的就是如何区分元素的props了。最终要么是**设置**属性，要么是**删除**它。我们已经有方法可以设置属性了，现在来写一个方法来删除它们吧。事实上这非常简单：
```js
function removeBooleanProp($target, name) {
	$target.removeAttribute(name);
	$target[name] = false;
}

function removeProp($target, name, value) {
	if(isCustomProp(name)) {
		return;
	} else if(name === 'className') {
		$target.removeAttribute('class');
	} else if(typeof === 'boolean') {
		removeBooleanProp($target, name);
	} else {
		$target.removeAttribute(name);
	}
}
```
我们再来写一个`updateProp()`方法来比较两个属性--就的和新的，并根据比较的结果来更新DOM元素的属性：
* 在DOM里没有这个属性的话，就删除掉
```js
	new									    old 
<nav></nav>		<nav className='navbar'></nav>
```
* 在新的节点里包含了某个属性，那么就需要在DOM上设置这个属性
```js
	new																			old
<nav style='background: blue'></nav>   <nav></nav>
```
* 某个属性在新的和旧的节点里都存在，那么我们就需要比较他们的值。如果他们不相等我们就需要根据结果给新的节点设置属性值了。
```js
	new																					old 
<nav className='navbar default'></nav>   <nav className='navbar'></nav>
```
* 在其他情况下，属性并没有改变我们什么都不需要做。

下面这个方法就是专门处理prop的：
```js
function updateProp($target, naem, newVal, oldVal) {
	if(!newVal) {
		removeProp($target, name, oldVal);
	} else if(!oldVal || newVal != oldVal) {
		setProp($target, name, newVal);
	}
}
```
是不是很简单？但是一个节点会有不止一个属性--所以我们要写一个方法可以遍历全部的属性，然后调用`updateProp()`方法来一对一对的处理：
```js
function updateProps($target, newProps, oldProps = {}) {
	const props = Object.assign({}, newProps, oldProps);
	Object.leys(props).forEach(name => {
		updateProp($target, name, newProps[name], oldProps[name]);
	});
}
```
这里需要注意我们创建的组合对象。它包含了新、旧节点的属性。因此，在遍历的时候我们会遇到`undefined`，不过这没有关系，我们的方法可以处理这个问题。

最后一件事就是把这个方法放到我们的`updateElement()`方法里。我们应该放在哪里呢？如果节点本身没有改变，那么它的子节点呢？这个问题我们也需要处理。所以我们把那个方法放在最后一个`if`语句块里。
```js
function updateElement($parent, newNode, oldNode, index=0) {
	if() {
		...
	}	else if(newNode.type) {
		updateProps(
			$parent.childNodes[index],
			newNode.props,
			oldNode.props,
		);

		...
	}
}
```
接着在[这里测试](https://jsfiddle.net/deathmood/urhpk7os/?utm_source=website&utm_medium=embed&utm_campaign=urhpk7os)一下吧。

## 事件
当然一个动态的应用是免不了会有事件的。我们可以使用`querySelector()`来处理节点，然后用`addEventListener()`来给节点添加事件的listener。但是，这样没啥意思。我们要像React一样来处理事件。
```js
<button onClick={() => alert('hi')}></button>
```
这样看起来就像那么回事儿了。你看到了，我们是用了`props`来声明一个事件监听器的。我们的属性名都是`on`开头的。
```js
function isEventProp(name) {
	return /^on/.test(name);
}
```
我们来写一个方法，从属性里获取事件名称。记住事件的名称都是以`on`为前缀的。
```js
function extractEventName(name) {
	return name.slice(2).toLowerCase();
}
```
看起来，如果我们在属性里声明了事件，那么我们就需要在`setProps()`或者`updateProps()`方法里处理。但是如何处理方法的不同呢？

你不能用相等操作符来比较两个方法。当然你可以用`toString()`方法，然后比较两个方法。但是有个问题，方法里可能会包含**native code**，这就给比较带来了问题。
```js
"function () { [native code] }"
```
当然我们可以使用时间冒泡的方式来处理。我们可以写我们自己的事件处理管理器，这个管理器会附加到`body`或者绘制我们节点的容器节点上。因此，我们可以在每次更新的时候添加一次事件处理器，这样也不会造成多大的资源浪费。

但是，我们不会这么做。因为这样会增加很多的问题，而且事实上我们的时间处理器不会频繁的改变。所以，我们只要在创建我们的节点的时候添加一次事件监听器就可以。那么不会在`setProps`方法里设置事件属性。我们自己处理添加事件的问题。怎么实现呢？记得我们的方法可以检测自定义的属性吗？现在它不会是空的了：
```js
function isCustomProp(name) {
	return isEventProp(name);
}
```
当我们知道了一个真的DOM节点的时候添加事件监听器，这时属性对象也非常清晰的。
```js
function addEventListeners($target, props) {
	Object.keys(props).forEach(name => {
		if(isEventProp(name)){
			$target.addEventListener(
				exteactEventName(name),
				props[name]
			);
		}
	}); 
}
```
把上面的代码加入到`createElement`方法里：
```js
function createElement(node) {
	if(typeof node === 'string') {
		return document.createTextNode('node');
	}
	const $el = document.createElement(node.type);
	setProps($el, node.props);
	addEventListeners($el, node.props);
	node.children
		.map(createElement)
		.forEach($el.appendChild.bind($el));
	return $el;
}
```

## 再次添加事件
如果你必须要再次添加事件监听器呢？我们来简单理解处理一下这个问题。只是这样的话性能会受到印象。我们会引入一个自定义属性：`forceUpdate`。记住，我们怎么检查节点的更改的：
```js
function changed(node1, node2) {
	return typeof node1 ~== typeof node2 ||
				 typeof node1 === 'string' && node1 !== node2 ||
				 node1.type !== node2.type ||
				 node.props.forceUpdate;
}
```
如果`forceUpdate`为true的话，节点就会整个的重新创建并且新的事件监听器也会被添加进去。整个属性也不是不应该加到实际的DOM节点的，所以需要处理一下：
```js
function isCustomProp(name) {
	return isEventProp(name) || name === 'forceUpdate';
}
```
这基本就是全部了。是的，整个解决的方法会影响性能，但是很简单。

## 结语
这就基本是全部了。希望你觉得有趣。如果你知道更简单的解决方法处理事件处理器的不同的方法的话，能分享到评论里就太感谢了。























