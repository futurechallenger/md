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



