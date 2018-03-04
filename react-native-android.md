# React Native填坑之旅--于Android模块通信

使用*Toast*作为例子。实现的功能是可以在JavaScript里写`ToastAndroid.show('Awesome', ToastAndroid.SHORT)`来显示一个Toast通知。


## 创建一个原生模块

创建一个类，继承`ReactContextBaseJavaModule`。
```java
public class ToastModule extends ReactContextBaseJavaModule {

  private static final String DURATION_SHORT_KEY = "SHORT";
  private static final String DURATION_LONG_KEY = "LONG";

  public ToastModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }
}
```

之后需要实现一个方法`getName`。
```java
  @Override
  public String getName() {
    return "AnotherToastAndroid"; // 不能返回ToastAndroid，这个会报错，或者需要手动指定覆盖RN已有的实现。
  }
```
这个方法必须实现。它的返回值是React Native的js部分调用模块时的名称。另外，如果这个方法返回的字符串包含**RCT**的话，那么RCT会被去掉。也就是，如果`getName`返回的是`RCTToastAndroid`的话，在js调用的时候还是使用`ToastAndroid`。

接下来实现`show`方法。
```java
  @ReactMethod
  public void show(String message, int duration) {
    Toast.makeText(getReactApplicationContext(), message, duration).show();
  }
```
**注意：**模块要导出方法给js使用，那么这个方法上必须使用`@ReactMethod`注解！并且返回值必须为`void`。如果要返回值的话，需要使用回调方法或者注册事件。这些下文会讲到。

### 方法的参数类型
在导出给js的方法中添加参数的时候，只能使用部分类型(java -> javascript)：
```java
Boolean -> Bool
Integer -> Number
Double -> Number
Float -> Number
String -> String
Callback -> function
ReadableMap -> Object
ReadableArray -> Array
```

## 注册模块
注册模块之后就可以使用。如果你的App里没有Package类，那就自己创建一个。比如本例，就可以创建名为`ToastReactPackage`的Package类，该类实现`ReactPackage`接口。
```java
public class ToastReactPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    return null;
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return null;
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return null;
  }
}
```
类中每个方法的名称已经明确的表明了其本身的作用。我们这里导出的是一个模块，所以需要实现`createNativeModules`方法。其他的方法只要返回一个空列表就可以。最后的`ToastReactPackage`类的实现是：
```java
public class ToastReactPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new ToastModule(reactContext));

    return modules;
  }

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
```
最后在`MainApplication`的`getPackages`方法里注册Package。
```java
public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new ToastReactPackage() // 这一句用来注册我们的AnotherToastAndroid模块
      );
    }
  };
```

在React Native中使用模块。
```java
import {
  //...
  NativeModules,
  PixelRatio,
} from 'react-native';

let AnotherToastAndroid = NativeModules.AnotherToastAndroid;

export default class mobike extends Component {
  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={() => {
          AnotherToastAndroid.show('Another Toast', AnotherToastAndroid.LONG);
        }}>
          <Text style={{ textAlign: 'center', }}>
            Show Toast
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}
```
不直接相关的内容就隐藏掉了。使用的时候只要在import中引入`NativeModules`，之后在`let AnotherToastAndroid = NativeModules.AnotherToastAndroid;`提取我们的原生模块。这个模块的名字就是在Android模块`getName`方法里返回的名称`AnotherToastAndroid`。

之后在TouchableOpacity的`onPress`事件中调用`AnotherToastAndroid`的`show`方法。

至此，我们之前说的功能就都实现了。

## 返回常量
前面的内容要运行起来还差这个一环。返回常量，你看到js代码里有这样的调用：
```javascript
AnotherToastAndroid.show('Another Toast', AnotherToastAndroid.LONG);
```
有这么一句：`AnotherToastAndroid.LONG`。要使用LONG，还有没有用到的SHORT常量，需要原生模块返回这样的常量。
```java
  @Nullable
  @Override
  public Map<String, Object> getConstants() {
//    return super.getConstants();
    final Map<String, Object> constants = new HashMap<>();
    constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
    constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
    return constants;
  }
```
方法`getConstants`是类`ReactContextBaseJavaModule`的一个可选方法，专门用来返回常量。返回的内容就是字典`Map<String, Object>`。

现在Demo可以运行起来了。

## 回调方法
前文说道，要返回值给js就需要用回调方法。现在看看在原生里如何实现这一点：
```java
  @ReactMethod
  public void currentThreadName(Callback errorCallback, Callback successCallback) {
    try {
      String tn = Thread.currentThread().getName();
      successCallback.invoke(tn);
    } catch(Exception e) {
      errorCallback.invoke(e.getMessage());
    }
  }
```
在Toast模块里加了一个获取当前线程的方法。Android的这个导出回调方法看起来还是有点奇怪。本来应该是一个回调返回两个参数：一个error，一个结果。这里用了两个`Callback`，可能也是条件限制吧。

看看js如何使用：
```javascript
  <Button
    style={{ marginTop: 10, }}
    title='use callback'
    pressHandler={
      () => {
        AnotherToastAndroid.currentThreadName((msg) => console.log(`error message ${msg}`)
          , (threadName) => {
            Alert.alert('Thread Name', `thread nane: ${threadName}`, null);
          });
      }}
  />
```

## Promise
回调缺点很明显。所以多数的时候都会选择使用*Promise*。再加上现在流行的`async-await`就更多的人使用Promise了。
```java
  @ReactMethod
  public void currentThreadNameByPromise(Promise promise) {
    try {
      String tn = Thread.currentThread().getName();
      promise.resolve(tn);
    } catch (Exception e) {
      promise.reject("Thread Error", e);
    }
  }
```

来看看如何使用Promise的：
```javascript
  <Button
    style={{ marginTop: 10, }}
    title='use Promise'
    pressHandler={
      () => {
        AnotherToastAndroid.currentThreadNameByPromise().then((threadName) =>
          Alert.alert('Thread Name', `thread nane: ${threadName}`, null)
        ).catch(err => Alert.alert('Thread Name', `get thread nane error: ${err.message}`, null));
      }}
  />
```

这些知识在一般的使用中就足够了，如果需要更复杂的内容可以查看[官方文档](https://facebook.github.io/react-native/docs/native-modules-android.html)。我也会在之后补齐这部分的内容。