# RxJava 2 Disposable探秘

很多人都这样写过代码：
```java
private CompositeDisposable compositeDisposable =
    new CompositeDisposable();
@Override public void onCreate() {
  compositeDisposable.add(backendApi.loadUser()
      .subscribe(this::displayUser, this::handleError));
}
@Override public void onDestroy() {
  compositeDisposable.clear();
}
```

一个后端请求完成的时候，`Disposable`对象从方法`subscribe()`返回，并天机到了`CompositeDisposable`。在Activity即将销毁的时候里面的`Disposables`对象也会被销毁。这样什么都work。

## 什么事Disposable？
`Disposable`是一个包括两个方法的接口：
```java
public interface Disposable {
  void dispose();
  boolean isDisposed();
}
```

但是这个销毁机制如何工作呢？我们来看一个例子：
```java
TestScheduler scheduler = new TestScheduler();
TestObserver<Long> o = Observable.interval(1, SECONDS, scheduler)
  .test();
o.assertNoValues();
scheduler.advanceTimeBy(1, SECONDS);
o.assertValues(0L);
scheduler.advanceTimeBy(1, SECONDS);
o.assertValues(0L, 1L);
o.dispose(); // Dispose the connection.
scheduler.advanceTimeBy(100, SECONDS);
o.assertValues(0L, 1L);
```
在这个情况下`Observable.internal()`方法会每一秒发射一个数据。`TestScheduler`被用来模拟时间。每次Scheduler到一个时间点的时候Observable就会收到一个新的值。在调用`Disposable.dispose()`方法接触Observable和Observer两者的关系的时候Observer就不会收到任何的数据了。

总之，在Disposable（TestObserver实现了这个接口）被dispose的时候，Observer（也就是TestObserver）就不会在从Observable收到数据了。

## 深入
`test()`方法只是为了试验的简单方法。它的内部创建了一个`TestObserver`对象。然后执行了`Observable.subscribe(Observer)`语句并在最后返回了创建的`TestObserver`。如果你使用lambda表达式的话基本上是一样的，只不过创建的是`LambdaObserver`，它实现了`Observer`和`Disposable`。

所以，`Observable.subscribe(Observer)`这个方法做了什么呢？

简单来说，它调用了`subscribeActual(Observable)`方法。这个方法是Observable类的一个抽象方法。

在RxJava 2里，操作符的实现和上一个版本的不太一样。所有的Observable操作符都继承了Observable，并重写了`subscribeActual(observer)`方法。

比如`interval`就是实现了`ObservableInterval`类，而`ObservableInterval`继承了`Observable<Long>`。同时需要注意到Observable只有一个方法可以重写，`subscrib eActual(Observer)`，这个方法也是所有魔法实际实现的地方。

## Observer
Obsever只是一个接口，里面有四个方法。其中三个和RxJava 1的一样。

  * `onNext(T)` 给observer发射数据。
  * `onError(Throwable)` 给observer发射错误。
  * `onComplete()` 告诉observer没有数据可以发射。

另外的一个是`onSubscribe(Disposable)`。

`onSubscribe`这个方法里disposable作为参数传递进来，并用来销毁Observable和Observer之间的联系。Observer也会自己检查是否已经被dispose了。

## dispose举例
我们来看一下