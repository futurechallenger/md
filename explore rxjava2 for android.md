## Exploring RxJava 2 for Android

  这篇文章是根据Jake Wharton在GOTO CopenHagen 2016上的讲话整理的。

下一个版本（2.0）的RxJava还在开发中。虽然observable、订阅管理和背压（backpressure）都完全重写了，但是operator基本没有任何的变化。在本文中你将学到如何让你的库和应用迁移到RxJava 2上，以及如何处理RxJava的两个版本。

### 为什么要用响应式编程
为什么响应式编程突然间流行起来。除非你可以一开始就把app定义为同步的模式，否则的话只要有一个异步的处理就会把你习惯的传统的编程方式打破。“打破”并不是说你的app运行不了，而是说你会面对异步带来的复杂度增加。

下面的一个例子可以很好的说明这个问题：
```java
interface UserManager {
	User getUser();
	void setName(String name);
	void setAge(int age);
}

UserManager um = new UserManager();
System.out.println(um.getUser());

um.setName("Jane Doe");
System.out.println(um.getUser());

```
这个简单的例子里包含一个user对象，且可以调用setter来改变它。如果我们只用同步、单线程的方式来处理我们可以信赖我们要得到的结果：创建一个实例，打印user，修改它的属性，再次打印user。

当需要用异步的方式来处理的时候。比如，我们要显示的是server端对user的修改。上例中后面的两个方法就需要异步处理。我们该如何修改代码来适应这个改变呢？

你可以做的就是什么都不做。你可以假设异步调用server端的修改是成功的，并且你可以在本地修改user。这样打印出来的就是server端的修改。很明显这样的修改不是好主意。网络是不稳定的，server端也可能返回一个错误，这个时候你就需要在本地处理这些问题了。

我们可以很简单的处理这个问题。比如，在server端的异步请求成功后调用一个runnable。现在就是响应式编程了。
```java
interface UserManager {
	User getUser();
	void setName(String name, Runnable callback);A
	void setAge(int age, Runnable callback);B
}
UserManager um = new UserManager();
System.out.println(um.getUser());

um.setName("Jane Doe", new Runnable() {
	@Override public void run() {
		System.out.println(um.getUser());
	}
});
```
然而我们并没有处理可能发生的问题，比如网络请求失败的时候。也许我们创建自己的监听器，这样当一个错误发生的时候我们就可以处理这个错误。
```java
UserManager um = new UserManager();
System.out.println(um.getUser());

um.setName("Jane Doe", new UserManager.Listener() {
	@Override public void success() {
		System.out.println(um.getUser());
	}

	@Override public void failure(IOException e) {
		// TODO show the error...
	}
});
```
我们可以把错误通知给user。我们可以自动重试。这些办法都可以用，并且这是大多数人处理异步问题的方式。

问题出现的地方是，如果你要处理更多的时候。你需要支持多个调用：比如在app里填写一个form的时候，需要改变user的多个属性。或者有多个异步的调用，如一个异步调用成功之后需要调用另外的一个的时候。
```java
public final class UserActivity extends Activity {
	private final UserManager um = new UserManager();

	@Override protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
	
		setContentView(R.layout.user);
		TextView tv = (TextView) findViewById(R.id.user_name);
		tv.setText(um.getUser().toString());

		um.setName("Jane Doe", new UserManager.Listener() {
		@Override public void success() {
			tv.setText(um.getUser().toString());
		}
		@Override public void failure(IOException e) {
			// TODO show the error...
			}
		});
	}
}
```
有一点需要注意，我们是在Android的范围内讨论问题。所以还有很多其他的问题需要考虑。比如，在我们`success`的回调里我们还要把数据传递到UI里。但是Android的Activity是有生命周期的，随时可能被回收。如果这个异步调用返回的时候UI已经销毁了，你就会遇到问题。

有一些其他的方式来处理上面的问题。我们可以在修改视图之前检查一下视图的状态。我们也可以创建一个匿名类型，虽然这回短时的造成内存泄漏，因为它要持有Activity的引用。如果Activity已经消失，那么这个回调还是会在background发生。

最后一件事是我们还没有定义这些回调运行在哪个线程上。也许我们的回调运行在子线程上，那么我们就有责任在主线程上修改UI。
```java
public final class UserActivity extends Activity {
	private final UserManager um = new UserManager();

	@Override protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		setContentView(R.layout.user);
		TextView tv = (TextView) findViewById(R.id.user_name);
		tv.setText(um.getUser().toString());

		um.setName("Jane Doe", new UserManager.Listener() {
			@Override public void success() {
				runOnUiThread(new Runnable() {
					@Override public void run() {
						if (isDestroyed()) {
							tv.setText(um.getUser().toString());
						}
					}
				});
			}
			@Override public void failure(IOException e) {
				// TODO show the error...
			}
		});
	}
}
```
我们在activity中添加了很多和这段代码的初衷不相关的其他代码，比如开始一个异步的任务，并处理这个回调的结果。我们还没有处理用户的输入，处理按钮点击和多字段输入等情况。开始的代码只是一个情况的说明，当你面对一个真正的app的时候，所有的这些问题是叠加在一起的。

### 响应式思考
从某种方式来说，app里的任何事都是异步的。我们有网络请求，发送一个请求，过很久才会返回。我们不能因此而阻塞了UI线程。因此只能在后台的线程来处理它。我们有文件系统，还包括数据库的读写，甚至于`SharedPreferences`也会阻塞主线程。

user也是一个异步的数据。我们在UI里显示数据，并且UI会用按钮点击或者修改输入框的方式做出响应。这些都是异步方式发生的。我们不能同步的拉去user数据，只能等待数据返回。

很多人认为可以写一个单线程的App，任何的task都运行在主线程上。但是，UI本身就是异步的。处理时不时接受的异步数据，同时还要处理app的各种不同状态。做这些的时候还不能阻塞主线程。这就是app更加复杂的根源。

### 网络请求
很难找到一个app没有网络请求的。你还要处理文件和数据库，这些也是异步的。最后UI也成为了一个异步的源。所以，Android的每一个方面都是异步的，还是坚持以往的单线程同步的编程方式上最后伤害的就是你自己。

我们应该考虑一种模型，我们的代码处在中间层，作为各种状态的仲裁人。而不是理顺全部的异步处理。我们可以让UI直接订阅数据库，并在数据发生更改的时候做出相应。我们可以在按钮点击的时候来修改网络请求或者数据库，而不是收到一个按钮点击之后分发点击事件。

类似的，当网络请求返回的时候，要是能更新数据就更好了。我们知道当数据更新的时候，UI也跟着自动更新，这样就可以删除被动更新界面的代码。如果Android做某些异步task的时候，比如旋转，UI可以自动更新就好了，最好是可以自动可以开始一些background任务。

最后，我们就可以删除很多维护各种状态的代码。

### RxJava
这就是为什么我们要开发RxJava。而且它也是Android上实际的响应式库。它也是Android上第一个可以用于响应式编程的库。RxJava 2支持Android所支持的我全部版本的java。

它主要做三个方面的事：
* 代表了数据源的类集合
* 监听数据源的类集合
* 修改和组织数据的方法集合

这些数据源只有在开始监听的时候才开始执行，如果你取消监听则会同时取消正在执行的任务。网络请求可以抽象为一个单个的任务，但是一个按钮点击流去可以是无限的，只要你的UI在那，即使你只订阅了按钮的点击事件。而且，按钮的点击流也可以是空的，也可以是永不停止的。这些都对传统的观察者模式造成了冲击。我们有生成数据的，有一个数据是如何定义的约定，我们想做的只是监听它。我们想要加一个监听器，在数据发生改变的时候得到通知。

### Flowable于Observable
这两个主要的类型都会出现在RxJava 2中。这两个类型都会用于给同样的类型（可以包含0到n个元素）建模。为什么同一个数据类型需要两种类型呢？

这是因为背压（backpressure）这个问题。“我”（作者）并不想阐述太多背压的内容，虽然它可以让数据变慢。我们所处的系统只含有有限的资源，但是如果你不能快速的处理背压的话，它会导致就给你发送数据的数据源变慢。

在RxJava 1中，系统的每一个类型都有背压，但是在RxJava 2，我们有两种类型。由于每一个类型都有也要处理的背压，但是不是所有的数据源都实现了他，所以你最终会遇到crash。这是因为背压必须处理。在RxJava 2中，你可以知道你所采用的类型系统是否支持背压。

比如，如果我们有一个touch event作为数据源，这个是我们无法变慢的，我们不能告诉用户说慢些点，知道我们把上次事件获得的变化在界面上绘制完成之后再点击第二次。我们只能用其他的方式来处理，比如disable按钮或者显示其他的界面来让它变慢，但是点击之后的事件发送并不能变慢。

你可以和数据库做对比。比如我们要获得一个大是结果集，我们也许只想在某个时候获取这个结果集的某些row。一个数据库可以很好的体现一个问题：它拥有游标的概念。但是touch event流和数据库的概念不同。因为，并没有什么方法可以减慢用户的手指。在RxJava 1中，你可以看到这两种类型都做为`Observable`使用，所以在运行时你要处理背压的问题，最终会得到一个异常或者你的app崩溃。
```java
Observable<MotionEvent> events
	= RxView.touches(paintView);

Observable<Row> rows
	= db.createQuery("SELECT * …");

MissingBackpressureException
```
因为两个不同的类型，所以他们暴露了背压。因为他们对同样的数据类型建模，所以在把数据传入回调的问题上使用的是同样的方式。两个数据源的监听接口看起来也很接近。第一个方法叫做`onNext`，这个方法也是数据发送的方法。只要`Observable`后者`Flowable`生成的数据不止一个，那么生成一个数据就会调用一次这个方法。这样你就可以处理每个元素。
```java
Observable<MotionEvent> Flowable<Row>
interface Subscriber<T> {
	void onNext(T t);
	void onComplete();
	void onError(Throwable t);
	void onSubscribe(Subscription s);
}

interface Disposable {
	void dispose();
}

interface Observer<T> {
	void onNext(T t);
	void onComplete();
	void onError(Throwable t);
	void onSubscribe(Disposable d);
}

interface Subscription {
	void cancel();
	void request(long r);
}
```
这可以使无穷的。乳沟你监听了一个按钮的点击，那么`onNext`方法在每次用户的点击下都会被调用。对于有限的数据源来说，我们会有两个终结事件，一个是`complete`，一个是`error`, complete表示成功，error表示错误。`onComplete`和`onError`被叫做终结事件是因为这两个方法被调用后`onNext`方法将不会再被调用。有一点不同的地方放就在于方法`onSubscribe`。

如果你知道RxJava 1，那么下面将的就是你需要注意的了：当你订阅了一个Observable或者一个Flowable，那么你就创建了一个资源。而资源都是需要在使用之后回收的。这个`onSubscribe`回调会在开始监听一个Observable或Flowable的时候立刻被调用，并且会根据订阅的类型返回给你两个类型中的一个类型。

对于Observable来说，你可以调用`dispose`方法，也就是说我已经用完了这个资源，我不需要任何回调了。如果我们有一个网络请求呢？这会取消网络请求。如果你监听了一个按钮点击的无穷流，那么调用`dispose`方法就是说你不想再接受点击事件。并且会`onSet`视图的监听器。这些对于Flowable类型也是一样的。虽然它有一个不同的名字，使用上也是一样的。它有一个`cancel`方法和`dispose`方法的作用是一样的。不同之处它有另外一个叫做`request`的方法，而且这也是背压在API中现身的地方。这个request方法告诉Flowable类型你需要更多的元素。

### 响应流
  ...是一个提供了一个标准的，没有阻塞背压的异步流处理措施。

我准备讲一下为什么disposable和subscription类型的命名如此不同，为什么他们的方法，一个叫做dispose；一个叫做cancel，而不是一个继承另一个再加上reqeust方法。原因是有这么一个叫做响应流（reactive stream）的概念。它是其他附属出现的源头。

我们会使用subscriber类型和subscription类型作为中间人。这些其实是响应流的一部分，并且这也是为什么他们有不同的名字。
```java
interface Publisher<T> {
	void subscribe(Subscriber<? super T> s);
}

interface Subscriber<T> {
	void onNext(T t);
	void onComplete();
	void onError(Throwable t);
	void onSubscribe(Subscription s);
}

interface Subscription {
	void request(long n);
	void cancel();
}

interface Processor<T, R> extends Subscriber<T>, Publisher<R> {
}
```
下面有一个例子：
```java

interface UserManager {
	User getUser();
	void setName(String name);
	void setAge(int age);
}

interface UserManager {
	Observable<User> getUser();
	void setName(String name);
	void setAge(int age);
}
```
现在来看一个例子，里面有user manager的两个定义。之前我们从类里获取用户并显示在界面上是再不能正确了。现在我们把这个模型考虑成用户的一个观察者，一个user对象的数据源。只要user发生改变就会发出通知，接着就可以响应变化并把变化的数据显示出来。这个时候也不用考虑系统里发生的各种事件里什么时候才是显示user改变的最佳时机。

RxJava里的observable有三种子集。一个是Single，这个类型包含一个item，或者包含一个error。这个不像是一个流，而更像是单个的异步源。而且它不包含背压。比如你调用一个方法，返回一个类型的实例或者抛出一个异常。Single也是同样的概念。你订阅了一个Single，要不返回一个数据，要不接受到一个error。不同之处在于它是响应式的。

第二个是Completable。他就像是一个返回为void的方法。他会成功完成，或者抛出一个异常。这就好比是一个响应式的Runnable。Completable包含了一组可以运行的代码，要么成功要么失败。

最后一个是Maybe，这个类型在RxJava 2里才有。他要么有一个item，errors或者也可能一个item都没有。它可以被认为是一个optional。一个返回optional值的方法，如果不抛出异常的话它总会返回什么。但是返回的optional值可能有值也可能没有值。

```java
interface UserManager {
	Observable<User> getUser();
	void setName(String name);
	void setAge(int age);
}

interface UserManager {
	Observable<User> getUser();
	Completable setName(String name);
	Completable setAge(int age);
}
```
如果`setName`方法和`setAge`方法的调用是异步的，他们要不成功要么失败，他们并不真的返回数据。所以completable类型最适合他们。

### 创建源（Source）
这个例子用来显示如何创建源，如何把已经存在的响应式源整合到一起。
```java
Flowable.just("Hello");
Flowable.just("Hello", "World");

Observable.just("Hello");
Observable.just("Hello", "World");

Maybe.just("Hello");
Single.just("Hello");
``` 
这些类型都有静态方法可以用来创建。你也可以从单值上创建，也可以从一个数组或者任何可遍历的类型上创建。但是有两个方法估计会是最常用的，不管是同步的还是异步的。
```java
OkHttpClient client = // …
Request request = // …

Observable.fromCallable(new Callable<String>() {
	@Override public String call() throws Exception {Y
		return client.newCall(request).execute();Z
	}
});
```

第一个是`fromCallable`.这个方法用来处理只返回一个值的同步行为。这个方法的一大好处是允许你从callable上抛出一个异常。如果有个网络请求，并且它会抛出一个I/O异常。如果它抛出一个异常的话我们就可以捕获一个error。如果这个请求成功的话我们就可以从`onNext`方法上获得想要的结果。
```java
Flowable.fromCallable(() -> "Hello");

Observable.fromCallable(() -> "Hello");

Maybe.fromCallable(() -> "Hello");
Maybe.fromAction(() -> System.out.println("Hello"));
Maybe.fromRunnable(() -> System.out.println("Hello"))

Single.fromCallable(() -> "Hello");

Completable.fromCallable(() -> "Ignored!");
Completable.fromAction(() -> System.out.println("Hello"));
Completable.fromRunnable(() -> System.out.println("Hello"));
```
在全部的五个类型上都可以调用`fromCallable`方法。

在`Maybe`类型和`Completable`类型上有两个另外的方法会经常用到。这两个类型都不返回值。只是一个runnable，只是这个runnable是响应式的。
```java
Observable.create(new ObservableOnSubscribe<String>() {
	@Override
	public void subscribe(ObservableEmitter<String> e) throws Exception {
		e.onNext("Hello");
		e.onComplete();
	}
});
```
创建observable最好用的方法是`create`。我们会传入一个回调，它会在有一个新的subscriber的时候调用。
```java
Observable.create(e -> {
	e.onNext("Hello");
	e.onNext("World");
	e.onComplete();
});
```
不同于`fromCallable`，`create`方法可以多次调用`onNext`。另外一个好处是我们现在可以对异步数据建模。如果我发出一个http请求，可以调用`onNext`方法来完成异步调用。另外的一个好处是你可以处理unscubscribe的情况。
```java
OkHttpClient client = // …
Request request = // …

Observable.create(e -> {
	Call call = client.newCall(request);
	e.setCancelation(() -> call.cancel());
	call.enqueue(new Callback() {
		@Override public void onResponse(Response r) throws IOException {
			e.onNext(r.body().string());
			e.onComplete();
		}A
		@Override public void onFailure(IOException e) {
			e.onError(e);
		}
	});
});
```
如果停止监听http请求的话，那就没有什么理由继续执行了。我们就可以添加一个取消的操作来取消http请求并且回收资源。

```java
Flowable.create(e -> { … });

Observable.create(e -> { … });

Maybe.create(e -> { … });

Single.create(e -> { … });

Completable.create(e -> { … });
```

### 监听源

```java
Flowable<String>

interface Subscriber<T> {
	void onNext(T t);
	void onComplete();
	void onError(Throwable t);
	void onSubscribe(Subscription s);
}

interface Subscription {
	void cancel();
	void request(long r);
}

Observable<String> 

interface Observer<T> {
	void onNext(T t);
	void onComplete();
	void onError(Throwable t);
void onSubscribe(Disposable d);
}

interface Disposable {
	void dispose();
}
```
当你订阅一个Observable的时候你不会直接使用这些接口，`subscribe`方法调用后开始监听。那么如何unsubscribe呢？
```java
Observable<String> o = Observable.just("Hello");

o.subscribe(new DisposableObserver<String>() {
	@Override public void onNext(String s) { … }
	@Override public void onComplete() { … }
	@Override public void onError(Throwable t) { … }
});
```
我们有一个类型叫做`DisposableObserver`，这个类型自动处理了很多事，你只需要关心Observable本身。那么应该如何dispose呢？
```java
Observable<String> o = Observable.just("Hello");

o.subscribe(new DisposableObserver<String>() {
	@Override public void onNext(String s) { … }
	@Override public void onComplete() { … }
	@Override public void onError(Throwable t) { … }
});
```
它实现了`disposable`，所以你可以调用dispose方法，并且它会将这个方法沿着调用链一直上传。在RxJava 2有一个新的方法叫做`subscribeWith`。它返回一个对象，你可以在它上面调用dispose方法。
```java
Observable<String> o = Observable.just("Hello");
o.subscribeWith(new DisposableObserver<String>() { … });

Maybe<String> m = Maybe.just("Hello");
m.subscribeWith(new DisposableMaybeObserver<String>() { … });

Single<String> s = Single.just("Hello");
s.subscribeWith(new DisposableSingleObserver<String>() { … });

Completable c = Completable.completed();
c.subscribeWith(new DisposableCompletableObserver<String>() { … });
```
上面的四个类型都是非背压的。那么对于背压类型如何处理呢：
```java
Flowable<String> f = Flowable.just("Hello");
Disposable d1 = f.subscribeWith(new DisposableSubscriber<String>() { … });

Observable<String> o = Observable.just("Hello");
Disposable d2 = o.subscribeWith(new DisposableObserver<String>() { … });

Maybe<String> m = Maybe.just("Hello");
Disposable d3 = m.subscribeWith(new DisposableMaybeObserver<String>() { … });

Single<String> s = Single.just("Hello");
Disposable d4 = s.subscribeWith(new DisposableSingleObserver<String>() { … });

Completable c = Completable.completed();
Disposable d5 = c.subscribeWith(new DisposableCompletableObserver<String>() { … });
```
背压类型有些不同。你可以这么类比，比如你不会打开一个没有关闭方法的文件，获取一个没有关闭方法的游标。

### 操作符
操作符做以下三件事：
* 操作或组合数据
* 操作线程
* 操作数据的发射

比如：
```java
Observable<String> greeting = Observable.just("Hello");
Observable<String> yelling = greeting.map(s -> s.toUppercase());
```
发出一个string，得到一个新的string。

在响应式的世界里，我们有一个Observable并且通过operator来实现一个操作。在这个例子里，`map`是一个操作符，我们可以获取到发射的数据并在上面做某些处理来创建一个新的数据。
```java
Observable<User> user = um.getUser();
Observable<User> mainThreadUser =
user.observeOn(AndroidSchedulers.mainThread());
```
我想要在另外的一个线程上监听数据的发射。这样user数据会在后台线程里，但是要在主线程上处理user数据。那么`observeOn`就是我们需要的操作符了。因为我们改变了线程，那么你应用这些操作符的顺序就很关键了。
```java
OkHttpClient client = // …
Request request = // …

Observable<Response> response = Observable.fromCallable(() -> {
	return client.newCall(request).execute();
});
Observable<Response> backgroundResponse =
	response.subscribeOn(Schedulers.io());
```
如果我们发出了一个网络请求，而且这个网络请求会同步的完成。那么，我们肯定不希望它发生在主线程上。我们可以使用操作符来修改我们在哪里订阅Observable，也就是请求最终在哪里执行。当我们订阅了后台的返回，他就会改在后台线程里执行。I/O只是一个你可以使用的线程池，它会在线程池里执行并最终通知监听者发生的改变。
```java
OkHttpClient client = // …
Request request = // …

Observable<Response> response = Observable.fromCallable(() -> {
		return client.newCall(request).execute();
	})
	.subscribeOn(Schedulers.io())
	.map(response -> response.body().string()) // Ok!
	.observeOn(AndroidSchedulers.mainThread());
```
由于我们在`observeOn`后面使用了`map`操作符，它就会在Android的主线程上执行。我们不希望在主线程上处理http返回，我们希望处理玩http response之后再返回到主线程上。

### 其他操作符
还有其他的操作符可以处理Observable并返回一个其他的类型。一个操作符是`first()`，它会返回一个list的第一个元素，一个Single类型的对象。在RxJava 1中这个方法会返回一个只发射一个元素的Observable。如果这个Observable为空的话，会返回一个错误。因为我们知道一个single要不有一个元素要么就是error。

其他的操作符比如`firstElement()`会返回一个Maybe类型的对象。当observable为空的时候，maybe类型的对象可以完成而不会抛出异常。如果你只关心成功或者失败的话，那么completable类型的对象绝对是你想要的。这些flowable也都存在。

### 开始使用响应式编程
如果我们想要让我们最开始的例子变成响应式的，我们可以订阅user并且说：“我们想要在主线程上得到通知，然后我想要在UI里显示出来”。任何时候user发生了改变，这个代买就会自动执行，我们可以自动在界面上看到更新。我们不用在担心管理我们自己了。
```java
// onCreate
disposables.add(um.getUser()
	.observeOn(AndroidSchedulers.mainThread())
	.subscribeWith(new DisposableObserver<User>() {
		@Override public void onNext(User user) {
			tv.setText(user.toString());
		}
		@Override public void onComplete() { /* ignored */ }
		@Override public void onError(Throwable t) { /* crash or show */ }
	}));

// onDestroy
disposables.dispose();
```
然而，我们一定要记住管理返回的disposable，因为我们在Android的世界里，当Activity消失的时候我们想要这些代码也停止运行。在`onDestroy`方法里，我们dispose这些disposable。
```java
disposables.add(um.setName("Jane Doe")
	.subscribeOn(Schedulers.io())
	.observeOn(AndroidSchedulers.mainThread())
	.subscribeWith(new DisposableCompletableObserver() {
		@Override public void onComplete() {
			// success! re-enable editing
		}
		@Override public void onError(Throwable t) {
			// retry or show
		}
	}));
```

### 结论
RxJava 2要处理的是Android里的异步问题。无论是网络请求还是Android本身，一个数据库或者甚至于是一个事件。并且编写响应这些源的改变的代码，而不是编写应对改变，管理状态的代码。
```java
class RxJavaInterop {
	static <T> Flowable<T> toV2Flowable(rx.Observable<T> o) { … }
	static <T> Observable<T> toV2Observable(rx.Observable<T> o) { … }
	static <T> Maybe<T> toV2Maybe(rx.Single<T> s) { … }
	static <T> Maybe<T> toV2Maybe(rx.Completable c) { … }
	static <T> Single<T> toV2Single(rx.Single<T> s) { … }
	static Completable toV2Completable(rx.Completable c) { … }

	static <T> rx.Observable<T> toV1Observable(Publisher<T> p) { … }
	static <T> rx.Observable<T> toV1Observable(Observable<T> o, …) { … }
	static <T> rx.Single<T> toV1Single(Single<T> o) { … }
	static <T> rx.Single<T> toV1Single(Maybe<T> m) { … }
	static rx.Completable toV1Completable(Completable c) { … }
	static rx.Completable toV1Completable(Maybe<T> m) { … }
}
```
如果你使用的是RxJava 1，有一个[interop对象](https://github.com/akarnokd/RxJava2Interop)可以使用。你可以在两个版本的类型之间转换。

RxJava 2并不是什么新的知识。响应式编程在哪个维度上来说并不算新。Android本身就是一个高度响应式的世界，知识我们被教育成使用一些顺序执行的，更加容易描述的方式来编写代码。

响应式编程允许我们来用一个更加合理的、异步的方式来对Android开发建模。拥抱源的异步，而不是我们自己去维护各种状态。让Android app的开发真正的响应式起来吧。


原文：https://news.realm.io/news/gotocph-jake-wharton-exploring-rxjava2-android/
视频：https://www.youtube.com/watch?v=htIXKI5gOQU&feature=youtu.be