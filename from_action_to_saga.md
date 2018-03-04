# Redux：从action到saga

## 前端应用消失的部分
一个现代的、使用了**redux**的前端应用架构可以这样描述：
1. 一个存储了应用不可变状态（state）的store
2. 状态（state）可以被绘制在组件里（html或者其他的东西）。这个绘制方法通常是简单而且可测试的（并不总是如此）纯方法。
```js
const render = (state) => components
```
3. 组件可以给store分发action
4. 使用reducer这种纯方法来根据就的状态返回新的状态
```js
const reducer = (oldState, action) => newState
```
5. 从一再来一次

这看起来容易理解。但是当需要处理异步的action（在函数式编程里称为副作用）的时候事情就没有这么简单了。

为了解决这个问题，redux建议使用中间件（尤其是**thunk**）。基本上，如果你需要出发副作用（side effects），使用一种特定的action生成方法：一种返回一个方法的方法，可以实现任意的异步访问并分发任意你想要的action。

使用这个方式会很快导致action生成方法变得复杂并难以测试。这个时候就需要redux-saga了。在redux-saga里saga就是一个可声明的组织良好的副作用实现方式（超时，API调用等等。。）所以不用再用redux-thunk中间件来写，我们用saga来发出action并yield副作用。

## 这样不复杂？action creator这样的写法不是更简单？
虽然看起来是这样的，但是NO！

我们来看看如何写一个action creator来获取后端数据并分发到redux store。
```js
function loadTodos() {
  return dispatch => {
    dispatch({ type: 'FETCH_TOTOS' });
    fetch('/todos').then(todos => {
      dispatch({ type: 'FETCH_TODOS', payload: todos });
    });
  }
}
```
这是最简单的thunk action creator了，并且如你所见，唯一测试这个代码的方法是模拟获取数据的方法。

我们来看看用saga代替action creator获取todo数据的方法：
```js
import { call, put } from 'redux-saga';

function* loadTodos() {
  yield put({ type: 'FETCH_TODOS' });
  const todos = yield call(fetch, '/todos');
  yield put({ type: 'FETCH_TODOS', payload: todos });
}
```
正如你所见一个saga就是一个生成副作用（side effects）的generator。我（作者）更加倾向于把整个generator叫做纯generator，因为它不会实际执行副作用，只会生成一个要执行的副作用的描述。在上面的例子中我用了两种副作用：
* 一个put副作用，它会给redux store分发一个action。
* 一个call副作用，它会执行一个异步的方法（promise，cps后者其他的saga）。

现在，测试这个saga就非常的容易了：
```js
import { call, put } from 'redux-saga';

const mySaga = loadTodos();
const myTodos = [{ message: 'text', done: false }];
mySaga.next();
expect(mySaga.next().value).toEqual(put({ type: 'FETCH_TOTOS' }));
expect(mySaga.next().value).toEqual(call(fetch, '/todos'));
expect(mySaga.next().value).toEqual(put({ type: 'FETCH_TODOS', payload: myTodos }));
```

## 触发一个saga
thunk的action creator在分发它返回的方法的时候就会触发。saga不同，它们就像是运行在后台的守护任务（daemon task）一样有自己的运行逻辑（by **Yasine Elouafi** redux-saga的作者）。

所以，我们来看看如何在redux应用里添加saga。
```js
import { createStore, applyMiddleware } from 'redux';
import sagaMiddleware from 'redux-saga';

const createStoreWithSaga = applyMiddleware(
  sagaMiddleware([loadTodos])
)(createStore);

let store = createStoreWithSaga(reducer, initialState);
```

## 绑定saga
一个saga本身就是一个副作用，就如同redux的reducer一样，绑定saga非常简单（但是很好的理解**ES6的generator**是非常有必要的）。

在之前的例子里，`loadTodos` saga在一开始就会触发。但是，如果我们想要每次一个action分发到store的时候触发saga要怎么做呢？看代码：
```js
import { fork, take } from 'redux-saga';

function* loadTodos() {
  yield put({ type: 'FETCHING_TODOS' });
  const todos = yield call(fetch, '/todos');
  yield put({ type: 'FETCHED_TODOS', payload: todos });
}

function* watchTodos() {
  while(yield take('FETCH_TODOS')) {
    yield fork(loadTodos);
  }
}

// 我们需要更新saga常量 createStoreWithSaga = applyMiddleware(
  sagaMiddleware([watchTodos])
)(createStore);
```
上例用到了两个特殊的effect：
* `take` effect，它会等待分发redux action的时候执行
* `fork` effect, 它会触发另外一个effect，在子effect开始之前就会执行

## 结语
给前端应用添加redux和redux-saga的流程是这样的：
1. store持有一个应用的state。
2. state会被绘制到组件上（html或者其他的什么）。它是一个简单可测试的方法：
```js
const render = (state) => components
```
3. 组件会触发修改store的action。
4. state使用reducer这样的纯方法来修改的。
```js
const reducer = (oldState, action) => newState
```
5. 也许某些effect会被一个action或者其他的effect触发。
```js
function* saga() { yield effect; }
```
6. 从1开始。


原文链接：https://riad.blog/2015/12/28/redux-nowadays-from-actions-creators-to-sagas/