# React Native填坑之旅 -- 处理原生模块之百度地图

## 回顾基础
### 原生模块
#### Android
1. 创建一个类继承`ReactContextBaseJavaModule`类: `public class GeoLocationModule extends ReactContextBaseJavaModule`。

2. 不要忘记定义一个参数为`ReactApplicationContext`的构造函数：
```java
public class GeoLocationModule extends ReactContextBaseJavaModule {
  public GeoLocationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }
}
```

3. 还有必须实现`getName`方法。这个方法返回的名字会在js模块里用到。
```java
public class GeoLocationModule extends ReactContextBaseJavaModule {
  public GeoLocationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "GeoLocationModule";
  }
}
```
在js里这样用：
```javascript
import { NativeModules } from "react-native";
const theModule = NativeModules.GeoLocationModule
```

4. 导出方法（回调和Promise）
具体的这里就不多说，各位读者可以直接看[文档](https://facebook.github.io/react-native/docs/native-modules-android.html)。

#### 

## 在UI组件

### 在UI组件中处理事件
这部分属于高级部分。有些文档里没有的。

在UI组件中，向js层发出事件的方法和原生模块发出事件是一样的。
```java

```

### UI组件中export方法

## 最后