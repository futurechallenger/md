# 创建你自己的虚拟DOM
要写你自己的虚拟DOM，有两件事你必须知道。你甚至都不用翻看React的源代码，或者其他的基于虚拟DOM的代码。他们代码量都太大，太复杂。然而要实现一个虚拟DOM的主要部分只需要大约50行的代码。50行代码！！

下面就是那两个你要知道的事情：
* 虚拟DOM和真实DOM的有某种对应关系
* 我们在虚拟DOM树的更改会生成另外一个虚拟DOM树。我们会用一种算法来比较两个树有哪些不同，然后对真实的DOM做最小的更改。

下面我们就来看看这两条是如何实现的。

## 生成虚拟DOM树
首先我们需要在内存里存储我们的DOM树。只要使用js就可以达到这个目的。假设我们有这样的一个树：
```html
<ul class="list">
  <li>item 1</li>
  <li>item 2</li>
</ur>
```
看起来非常简单对吧。我们怎么用js的对象来对应到这个树呢？
```js
{ type: 'ul', props: {'class': 'list}, children: [
  {type: 'li', props: {}, children: ['item 1']},
  {type: 'li', props: {}, children: ['item 2']}
]}
```
这里我们会注意到两件事：
* 我们使用这样的对象来对应到真实的DOM上：`{type: '...', props: {...}, children: [...]}`。
* DOM的文本节点会对应到js的字符串上。
但是如果用这个方法来对应到巨大的DOM树的话那将是非常困难的。所以我们来写一个helper方法，这样结构上也就容易理解一些：
```js
function h(type, props, ...children) {
  return {type, props, children};
}
```
现在我们可以这样生成一个虚拟DOM树：
```js
h('ul', {'class': 'list'},
  h('li', {}, 'item 1'),
  h('li', {}, 'item 2'),
)
```
这样看起来就清晰了很多。但是我们还可以做的更好。你应该听说过JSX对吧。是的，我们也要用那种方式。但是，这个应该如何下手呢？

如果你读过Babel的[JSX文档](https://babeljs.io/docs/plugins/transform-react-jsx/)的话，你就会知道这些都是Babel的功劳。Babel会把下面的代码转码：
```js
<ul className="list">
  <li>item 1</li>
  <li>item 2</li>
</ul>
```
转码为：
```js
React.createElement('ul', {className: 'list'}),
 React.createElement('li', {}, 'item 1'),
 React.createElement('li', {}, 'item 2')
);
```
你注意到多相似了吗？如果把`React.createElement(...)`体换成我们自己的`h`方法的话，那我们也已使用类似于JSX的语法。我们只需要在我们的文件最顶端加这么一句话：
```js
/** @jsx h */
<ul className="list">
  <li>item 1</li> 
  <li>item 2</li>
</ul>
```
这一行`/** @jsx h */`就是在告诉Babel“大兄弟，按照jsx的方式转码，但是不要用`React.createElement`, 使用`h`。你可以使用任意的东西来代替h。

那么把上面我们说的总结一下，我们会这样写我们的虚拟DOM：
```js
/** @jsx h */
const a = {
  <ul className="list">
    <li>item 1</li>
    <li>item 2</li>
  </ul>
};
```
然后Babel就会转码成这样：
```js
const a = {
  h('ul', {className: 'list'},
    h('li', {}, 'item 1'),
    h('li', {}, 'item 2'),
  )
};
```
当方法`h`执行的时候，它就会返回js的对象--我们的虚拟DOM树。
```js
const a = (
  { type: ‘ul’, props: { className: ‘list’ }, children: [
    { type: ‘li’, props: {}, children: [‘item 1’] },
    { type: ‘li’, props: {}, children: [‘item 2’] }
  ] }
);
```
在[JSFiddle里运行一下试试](https://jsfiddle.net/deathmood/5qyLubt4/?utm_source=website&utm_medium=embed&utm_campaign=5qyLubt4)。

## 应用我们的DOM展示
现在我们的DOM树用纯的JS对象来代表了。很酷了。但是我们需要根据这些创建实际的DOM。因为我们不能只是把虚拟节点转换后直接加载DOM里。

首先我们来定义一些假设和一些术语：
* 实际的DOM都会使用`$`开头的变量来表示。所以`$parent`是一个实际的DOM。
* 虚拟DOM使用node变量表示
* 和React一样，你只可以有一个根节点。其他的节点都在某个根节点里。

我们来写一个方法：`createElement()`，这个方法可以接收一个虚拟节点之后返回一个真实的DOM节点。先不考虑`props`和`children`，这个之后会有介绍。
```js
function createElement(node) {
  if(typeof node === 'string') {
    return document.createTextNode(node);
  }
  return document.createElement(node.type);
}
```
因为我们不仅需要处理文本节点（js的字符串），还要处理各种元素（element）。这些元素都是想js的对象一样的：
```js
{ type: '-', props: {...}, children: [...]}
```
我们可以用这个结构来处理文本节点和各种element了。

那么子节点如何处理呢，他们也基本是文本节点或者各种元素。这些子节点也可以用`createElement()`方法来处理。父节点和子节点都使用这个方法，看到了么？其实这就是递归处理了。我们可以调用`createElement`方法来创建子节点，然后用`appendChild`方法来把他们添加到根节点上。
```js
function createElement(node) {
  if(typeof node === 'string') {
    return document.createTextNode(node);
  }
  const $el = document.createElement(node.type);
  node.children
    .map(createElement)
    .forEach($el.appendChild.bind($el));
   return $el;
}
```
看起来还不错，我们先不考虑节点的`props`。要理解虚拟节点的概念并不需要这些东西却会增加很多的复杂度。

## 处理修改
我们可以把虚拟节点转化为真实的DOM了。现在该考虑比较我们的虚拟树了。基本上我们需要写一点算法了。虚拟树的比较需要用到这个算法，比较之后只做必要的修改。

如何比较树的不同？
* 如果新节点的子节点增加了，那么我们就需要调用`appendChild`方法来添加。
```js
//new 
<ul>
  <li>item 1</li>
  <li>item 2</li>
</ul>
 
//old
<ul>
  <li>item 1</li>
</ul>
```
* 新节点比旧节点的子节点少，那么就需要调用`removeChild`方法来删除掉多余的子节点。
```js
//new
<ul>
  <li>item 1</li>
</ul>

//old
<ul>
  <li>item 1</li>
  <li>item 2</li>  // 这个要被删掉
</ul>
```
* 新旧节点的某个子节点不同，也就是某个节点上发生了修改。那么，我们就调用`replaceChild`方法。
```js
//new
<div>
  <p>hi there!</p>
  <p>hello</p>
</div>


//old
<div>
  <p>hi there!</p>
  <button>click it</button>   //发生了修改，变成了new里的<p />节点
</div>
```
* 各节点都一样。那么我们就需要做进一步的比较
```js
//new
<ul>
  <li>item 1</li>
  <li> //*
    <span>hello</span>
    <span>hi!</span> 
  </li>
</ul>

//old
<ul>
  <li>item 1</li>
  <li> //*
    <span>hello</span>
    <div>hi!</div>
  </li>
</ul>
```
加醒的两个节点可以看到都是`<li>`，是相等的。但是它的子节点里面却有不同的节点。

我们来写一个方法`updateElement`，它接收三个参数：`$parent`、`newNode`和`oldNode`。`$parent`是真的DOM元素。它是我们虚拟节点的父节点。现在我们来看看如何处理上面提到的全部问题。

## 没有旧节点
这个问题很简单：
```js
function updateElement($parent, newNode, oldNode) {
  if(!oldNode) {
    $parent.appendChild(
      createElement(newNode)
    );
  }
}
```

## 没有新节点
如果当前没有新的虚拟节点，我们就应该把它从真的DOM里删除掉。但是，如何做到呢？我们知道父节点（作为参数传入了方法），那么我们就可以调用`$parent.removeChild`方法，并传入真DOM的引用。但是我们无法得到它，如果我们知道的节点在父节点的位置，就可以用`$parent.childNodes[index]`来获取它的引用。`index`就是节点的位置。

假设`index`也作为参数传入了我们的方法，我们的方法就可以这么写：
```js
function updateElement($parent, newNode, oldNode, index = 0) {
  if(!oldNode) {
    $parent.appendChild(
      createElement(newNode);
    );
  } else if(!newNode) {
    $parent.removeChild(
      $parent.childNodes[index];
    );
  }
}
```

## 节点改变
首先写一个方法来比较两个节点（新的和旧的）来区分节点是否发生了改变。要记住，节点可以是文本节点，也可以是元素（element）：
```js
function changed(node1, node2) {
  return typeof node1 !== typeof node2 ||
    typeof node1 === 'string' && node1 !== node2 ||
    node1.type !== node2.type;
}
```
现在有了当前节点的`index`了，index就是当前节点在父节点的位置。这样可以很容易用新创建的节点来代替当前节点了。

```js
function updateElement($parent, newNode, oldNode, index = 0) {
  if(!oldNode) {
    $parent.appendChild(
      createElement(newNode);
    );
  } else if(!newNode) {
    $parent.removeChild(
      $parent.childNOdes[index];
    );
  } else if(chianged(newNode, oldNode)) {
    $parent.replaceChild(
      createElement(newNode),
      $parent.childNodes[index]
    );
  }
}
```

## 对比子节点的不同
最后，需要遍历新旧节点的子节点，并比较他们。可以在每个节点上都使用`updateElement`方法。是的，递归。

但是在开始代码之前需要考虑一些问题：
* 只有在节点是一个元素（element）的时候再去比较子节点（文本节点不可能有子节点）。
* 当前节点作为父节点传入方法中。
* 我们要一个一个的比较子节点，即使会遇到`undefined`的情况。没有关系，我们的方法可以处理。
* `index`，当前节点在直接父节点中的位置。

```js
function updateElement($parent, newNode, oldNode, index = 0) {
  if(!oldNode) {
    $parent.appendChild(
      createElement(newNode);
    );
  } else if(!newNode) {
    $parent.removeChild(
      $parent.childNodes[index]
    );
  } else if(changed(newNode, oldNode)) {
    $parent.replaceChild(
      createElement(newNode),
      $parent,childNodes[index]
    );
  } else if(newNode.type) {
    const newLength = newNode.children.length;
    const oldLength = oldNode.children.length;
    for (let i = 0; i < newLength || i < oldLength; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      );
    }
  }
}
```

在[JSFiddle](https://jsfiddle.net/deathmood/0htedLra/?utm_source=website&utm_medium=embed&utm_campaign=0htedLra)里看看代码把！

## 结语
祝贺你！我们搞定了。我们写出了虚拟节点的实现。从上面的例子中你已经可以理解虚拟节点的概念了，也大体可以知道React是如何运作的了。

当时还有很多需要讲述的内容，其中包括：
* 设置节点的属性（props）和比较、更新他们
* 处理事件，在元素上添加事件监听器
* 让我们的节点像React的Component那样运作
* 获取实际DOM的引用
* 虚拟节点和其他的库一起使用来修改真实的DOM，这些库有jQuery等其他的类似的库。
* 更多。。

原文地址：https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060


