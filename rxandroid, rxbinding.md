# Android和RxJava 2

## 什么是RxJava
RxJava是一个用于编写响应式风格的代价的库。RxJava把全部的数据都被看做是流（Stream），比如变量、属性、缓存以及捕捉到的用户事件等。每个流里发射的数据可以使一个值也可以是一个错误或者一个“已完成”的标志，虽然你不一定需要处理后两个。你要做的就是准备一个可以发射数据的流，然后和处理流发射的数据的消费者绑定在一起。RxJava中包含了很多的处理流的操作符，开发者调用起来非常的方便。

数据发射流和消费者的组合就是观察者模式的一种体现。RxJava就是对观察者模式的一个扩展。在RxJava里`Observable`发射数据，`Observer`订阅`Observable`，并接受数据、错误或者已完成标志位。从一个开阔的角度讲，使用RxJava的时候一般只要以下几步：
* 创建一个`Observable`
* 给Observable填充要发射的数据
* 创建一个`Observer`
* 关联Observable和Observer
* 给Observer里填充消费数据的方法

## 为什么要用RxJava
RxJava并不好学，但是我们为什么还要花时间研究这玩意？

### 更加简练、易读的代码
纠缠在一起的代码，会给后来的维护者带来极大的困扰，即使是本来开发这些代码的人。一旦出现错误，捉虫子的过程将非常痛苦。

RxJava极大的简化你的代码，尤其是你需要处理根据输入数据或者事件来决定你下一步要做什么的情况下。在这个情况下你只需要创建一个Obervable一个Observer，然后关联两者。这样的代码步骤明确，也很容易读懂。

### 让多线程变得简单
现在的Android应用多数情况下需要处理多个线程的问题。至少你的用户可以在你处理任何的任务的时候依然可以从应用界面上获得反馈。比如，网络请求，下载文件等。使用RxJava你就不需要在`new Thread(() -> {// something to do})`了，也不需要`AsyncTask`或者线程池之类的了。只需要告诉Observable订阅在哪个线程，观察在哪个线程（返回结果后运行的线程）。而且，RxJava还提供了多种`Schedulers`，专门供你处理不同的问题是调配线程。如，`observable.subscribeOn(Schedulers.io())`。如：
```kotlin
val observable = Observable.create(object : ObservableOnSubscribe<String> {
    override fun subscribe(e: ObservableEmitter<String>?) {
        e?.onNext("hello world")
    }
})

observable.subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe(object : Observer<String> {
            override fun onComplete() {
                TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
            }

            override fun onSubscribe(d: Disposable?) {
                TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
            }

            override fun onNext(t: String?) {
                TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
            }

            override fun onError(e: Throwable?) {
                TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
            }

        })
```
只需要非常短的一段代码就可以指定工作线程和主线程的任务如何分配和切换：`observable.subscribeOn(Schedulers.io()).observeOn(AndroidSchedulers.mainThread())`。subscribeOn`语句指定工作线程，observeOn指定了工作线程得到值之后回到哪个线程，这里当然是主线程。

### 灵活性
你可以任意指定你的observable里数据的生产方式，之后RxJava里有很多的操作符供你选择。你可以之生产一个数据流，也可以生产多个数据流然后把这两个数据流组合到一起，你还可以使用这些操作符的链式操作。这些都让代码比以往基本单任务的方式更加具有灵活性。

## 给项目中添加RxJava
非常简单，直接上gradle文件:
```groovy
compile "io.reactivex.rxjava2:rxjava:2.1.0"
```
然后点击屏幕左上方的`sync now`。

## 开始RxJava之旅
大略的了解已经足够了。现在就开始写响应式的代码的。就按照上面说的创建一个响应式的典型步骤来编写代码。

### 创建一个Observable
前文说过，RxJava是对观察者的一个扩展。有两点：一是在RxJava里，`Observable`--subscribe-->`Observer`。另一个是数据流不仅发射数据，还会发射错误或者已完成标志（这两个可以忽略）。每次`Observable`发射一个数据，与之关联的Observer就会收到通知。一旦全部数据都发射完毕，它就会调用：
* `onComplete`： 如果全部数据都成功的发射。
* `onError`:如果发射数据的过程中发生异常。
下面看一个例子：
```kotlin
val observable = Observable.create(ObservableOnSubscribe<Int> { e ->
      for (i: Int in 0..3) {
        e?.onNext(i)
      }
      e?.onComplete()
    })
```
这个例子比较详细，基本罗列了所有上面讲的内容。所以，不要被巨大的代码量吓到，这些比你设计开发中用到的代码量要多一些。

### 创建一个Observer
`Observer`通过Observable的`subscribe`方法关联到一起。一旦一个`Observer`被`Observable`订阅了，Observer就会对Observable发出的数据作出回应。
* `onNext`：处理Observable发出的数据
* `onError`：发生了错误
* `onComplete`：Observable已经完成全部数据的发射
下面是一个例子：
```kotlin
  observable.subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe(object : Observer<Int> {
          override fun onComplete() {
            TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
          }

          override fun onSubscribe(d: Disposable?) {
            TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
          }

          override fun onNext(t: Int?) {
            TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
          }

          override fun onError(e: Throwable?) {
            TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
          }
        })
```

### 使用更少的代码来创建Observable
前文我们说过，RxJava提供了很多的操作符。使用这些操作符可以大量的减少开发代码量。下面我们就来看看有哪些常用的操作符：
#### 1. Observable.just()
你可以使用`just()`方法把任意的对象转化为一个Observable。
```kotlin
val demoObservable = Observable.just("Hello World!")
```

#### 2. Observable.from()
`from()`操作符允许你把一个集合转化为一个observable流。你可以使用`fromArray()`，把一个数组转化为一个Observable。使用`fromCallable`把一个`Callable`转化为Observable。还有`fromIterable()`操作符可以使用，等。

#### 3. Observable.range()
这个操作符会发出一组连续的数字。第一个参数是初始值，第二个参数指定你要发射的数字的个数。比如：
```kotlin
val observable = Observable.range(0, 5)
```

#### 4. Observable.interval()
这个操作符发射一组递增的数字，每次发射都会间隔你指定的时间间隔。
```kotlin
var observable = Observable.interval(100, TimeUnit.SECONDS)
```

#### 5. Observable.empty()
这个操作符会创建一个没有任何可以发射的数据的Observable，但是会正常结束。
```kotlin
val observable = Observable.empty()
```

## 最后
本文中，我们介绍了一些RxJava的基础概念。

你会学到如何创建Observable和Observer，以及如何订阅。我们也简单的介绍了一些操作符，这样你可以快速的创建不同的Observable。

后面我们还会介绍更多的操作符。使用这些操作符你可以实现多线程操作等更加有用的操作。


参考：https://code.tutsplus.com/tutorials/getting-started-with-rxjava-20-for-android--cms-28345