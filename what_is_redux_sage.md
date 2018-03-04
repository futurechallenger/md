# 初识Redux-Saga
[Redus-saga](https://redux-saga.js.org/)是一个redux的中间件，主要用来简便而优雅的处理redux应用里的副作用（side effect相对于pure function这类概念而言的）。它之所以可以做到这一点主要是使用了ES6里的一个语法：[Generator](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/function*)。使用Generator可以像写同步的代码一样编写异步代码，这样更加容易测试。

在我们更深入之前，“saga”这个名字在计算机科学的历史上早已存在，并不是只用于javascript里的。Saga可以简要的概括为一种处理长时间运行的事务，并且这种事务会有副作用或者失败的可能。每一个我们希望完成的事务，都需要一个反事务在出错的时候把事务恢复到当前事务发生之前的样子。如果有兴趣了解更多Sage，我（作者）推荐你看看Caitie McCaffrey的这段[演讲](https://youtu.be/xDuwrtwYHu8),演讲的题目是《实践Saga模式》。另外可以参阅Roman Liutikov的博客，叫做[《Saga模式的迷惑之处》](https://medium.com/@roman01la/confusion-about-saga-pattern-bbaac56e622)。


## 我们为什么要用Redux-saga
现在我们可以创建一个新的react-redux应用，我们会使用[redux-thunk](https://github.com/gaearon/redux-thunk)和redux-saga处理异步的action。所以我们为什么要用redux-saga呢？

正如文档里所说：
```
与redux-thunk相反，你不会跌入回调地狱，你可以很容易的测试你的异步流程而且action一直保持pure（纯的状态）。
```
我们来对比一下saga和thunk的用法来更深入的理解上面那句话的内容。假设场景为：用户点击按钮，发出一个http请求来获取数据。
Redux thunk的写法：
```js
import {
  API_BUTTON_CLICK,
  API_BUTTON_CLICK_SUCCESS,
  API_BUTTON_CLICK_ERROR,
} from './actions/consts';
import { getDataFromAPI } from './api';

const getDataStarted = () => ({type: API_BUTTON_CLICK});
const getDataSuccess = data => ({type: API_BUTTON_CLICK_SUCESS, payload: data});
const getDataError = message => ({type: API_BUTTON_CLICK_ERROR, payload: message});

const getDataFromAPI = () => {
  return dispatch => {
    dispatch(getDataStarted());

    getDataFromAPI()
      .then(data => {
        dispatch(getUserSucess(data));
      }).fail(err => {
        dispatch(getDataError(err.message));
      })
  }
}
```
这里我们有一个叫做`getDataFromAPI()`的方法来创建action。当用户点击按钮开始了异步流程的时候“
* 首先触发一个action让我们的store知道我们要发起一个异步请求（`dispatch(getDataStarted()`)了。
* 接着我们实际发出了API请求，这个请求会返回一个promise。
* 然后我们会在成功接受到请求数据的时候触发成功的action，有错误的时候触发错误的action。

Redux saga的写法：
```js
import { call, put, takeEvery } from 'redux-saga/effects';
import {
	API_BUTTON_CLICK,
	API_BUTTON_CLICK_SUCCESS,
	API_BUTTON_CLICK_ERROR,
} from './actoins/consts';
import { getDataFromAPI } from './api';

export function* apiSideEffect(action) {
	try{
		const data = yield call(getDataFromaAPI);
		yield put({ type: API_BUTTON_CLICK_SUCESS, payload: data});
	} catch(e) {
		yield put({type: API_BUTTON_CLICK_ERROR, payload: e.message});
	}
}

// the 'watcher' -on every `API_BUTTON_CLICK` action, run our side effect 
export function* apiSaga() {
	yield takeEvery(API_BUTTON_CLICK, apiSideEffect);
}	
```
流程基本上都是一样的，只是代码看起来略有不同：
* 与thunk例子不同的是，我们没有使用`dispatch`而是用了`put`（我们可以认为两者是等价的）。
* 我们有一个监听方法一直监听着“start”方法。它只会在按钮点击之后触发一个类型为`API_BUTTON_CLICK`的redux action。
* 我们用redux-saga的`call` effect（专有名词，效果的意思。与side effect的effect同意）来从异步的方法（promise，不同的saga等）里面获取数据。

非常简单，对吧。在某些按钮的点击事件里，我们会请求某些终端来获取数据。如果成功了，就发起一个新的，payload就是数据的action。否则就发出一个带有error消息的action。

同时，需要注意认真的理解上面的例子非常重要。不是说thunk的例子难以理解，但是我们却摆脱了返回方法或者promise链的麻烦。我们还可以只简单用一个try-catch来处理任何的异步错误。然后`put`（或者`dispatch`)一个action来通知reducer。

其次，更重要的是，我们的saga side effect（saga副作用）是纯的（pure）。这是因为`call(getDataFromAPI)`并不实际执行API请求，它只是返回一个纯对象：`{type: 'CALL', func, args}`。实际的请求已经由redux-saga中间件执行，并且会把返回值带到generator里（所以需要用`yeild`关键字）或者抛出一个异常，如果有的话。

掌握了以上概念以后，你就会明白下面的测试为什么这么简单：
```js
import { call, put } from 'redux-saga/effects';

import { API_BUTTON_CLICK_SUCCESS, } from './actions/consts';
import { getDataFromAPI } from './api';

it('apiSideEffect - fetches data from API and dispatches a success action', () => {
	const generator = apiSideEffect();

	expect(generator.next().value).toEqual(call(getDataFromAPI));

	expect(generator.next().value).toEqual(put({type: API_BUTTON_CLICK_SUCCESS }));

	expect(generator.next()).toEqual({done: true, value: undefined});
});
```
然而上面的测试代码有一点点小问题。我们需要模拟`getDataFromAPI`方法的调用，其他在上面语句块的方法也需要模拟出来。这也许不是什么大的工作量，但是随着我们的action数量的增长，复杂度也会增加，类似上面的测试最好避免。

本文希望讲清楚redux-saga三个要点。我们不会再遇到回调地狱，我们的action是纯的，而且我们的异步流程很容易测试。如果你要学到更多，下面的资源会有帮助：
* [使用redux-saga处理异步操作](https://medium.freecodecamp.com/async-operations-using-redux-saga-2ba02ae077b3)
* [现代Redux：从action到saga](https://riad.blog/2015/12/28/redux-nowadays-from-actions-creators-to-sagas/)
* [掌握saga中复杂的异步工作流](http://konkle.us/master-complex-redux-workflows-with-sagas/)

原文地址：https://engineering.universe.com/what-is-redux-saga-c1252fc2f4d1

