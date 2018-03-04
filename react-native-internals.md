## React Native如何Bridge（桥接）原生代码

本文假设你已经有一定的React Native基础，并且想要了解React Native的JS和原生代码之间是如何交互的。

### React Native的工作线程
* `shadow queue`：布局在这个线程工作
* `main thread`：UIKit在这里工作
* `Javascript thread`：Js代码在这里工作

另外每一个原生模块都有自己的一个工作`GCD queue`，除非你明确指定它的工作队列

```
*shadow queue*实际是一个GCD queue，而不是一个线程。
```

### 原生模块
如果你还不知道如何创建原声模块，我建议你看看官方[文档](https://facebook.github.io/react-native/docs/native-modules-ios.html)。

下面是一个叫做`Person`的原生模块，既可以被js调用，也可以调用js代码。
```objc
@interface Person : NSObject <RCTBridgeModule>
@end

@implementation Logger

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(greet:(NSString *)name)
{
  NSLog(@"Hi, %@!", name);
  [_bridge.eventDispatcher sendAppEventWithName:@"greeted"
                                           body:@{ @"name": name }];
}

@end
```

下面，我们主要看看代码里用到的两个宏定义：`RCT_EXPORT_MODULE`和`RCT_EXPORT_METHOD`。看看他们是如何工作的。

#### RCT_EXPORT_MODULE([js_name])
这个宏的功能就和它名字说的一样，到处一个模块。但是*export*是什么意思呢？它的意思是让React Native的bridge（桥接）感知到原生模块。

它的定义其实非常的简单：
```objc
#define RCT_EXPORT_MODULE(js_name) \
  RCT_EXTERN void RCTRegisterModule(Class); \
  + (NSString \*)moduleName { return @#js_name; } \
  + (void)load { RCTRegisterModule(self); }
```

它的作用：
* 首先它声明了`RCTRegisterModule`为`extern`方法，也就是说这个方法的实现在编译的时候不可知，而在link的时候才可知。
* 声明了一个方法`moduleName`，这个方法返回可选的宏定义参数`js_name`，一般是你希望有一个专门的模块名称，而不是默认的ObjC类名的时候使用。
* 最后，声明了一个`load`方法（当app被加载进内存的时候，load方法也会被调用）。在这个方法里调用`RCTRegisterModule`方法来让RN的bridge感知到这个模块。

#### RCT_EXPORT_METHOD(method)
这个宏更有意思，它并给你的模块添加任何实际的方法。它创建了一个新的方法，这个新的方法基本上是这样的：
```objc
+ (NSArray *)__rct_export__120
{
	return @[@"", @"log: (NSString *)message"];
}
```
这个被`load`方法生成的方法的名称由前缀（`__rct_export__`）和一个可选的`js_name`（现在是空的）和声明的行号（比如12）和`__COUNTER__`宏拼接在一起组成。

这个新生成的方法的作用就是返回一个数组，这个数组包含一个可选的`js_name`（在本例中是空的）和方法的签名。签名说的那一堆是为了避免方法崩溃。

```
即使是这么复杂的生成算法，如果你使用了*category*的话也难免会有两个方法的名称是一样的。不过这个概率非常低，并且也不会产生什么不可控的行为。虽然Xcode会这么警告。
```


### Runtime
这一步只做一件事，那就是给React Native的桥接模块提供信息。这样它就可以找到原生模块里export出来的全部信息：*modules*和*methods*，而且这些全部发生在load的时候。

下图是React Native桥接的依赖图
![]()

#### 初始化模块
方法`RCTRegisterModule`方法就是用来把类添加到一个数组里，这样React Native桥接器实例创建之后可以找到这个模块。它会遍历模块数组，创建每个模块的实例，并在桥接器里保存它的引用，并且每个模块的实例也会保留桥接器的实例。并且该方法还会检查模块是否指定了运行的队列，如果没有指定那么就运行在一个新建的队列上，与其他队列分割。
```objective-c
NSMutableDictionary *modulesByName; // = ...
for (Class moduleClass in RCTGetModuleClasses()) {
  // ...
  module = [moduleClass new];
  if ([module respondsToSelector:@selector(setBridge:)]) {
    module.bridge = self;
  }
  modulesByName[moduleName] = module;
  // ...
}
```

#### 配置原生模块
一旦在后台线程里有了模块实例，我们就列出每个模块的全部方法，之后调用`__rct_export__`开始的方法，这样我们就有一个该方法签名的字符串。这样我们后续就可以获得参数的实际类型。在运行时，我们只会知道参数的类型是`id`，按照上面的方法就可以获得参数的实际类型，比如本例的是`NSString*`。
```objective-c
unsigned int methodCount;
Method *methods = class_copyMethodList(moduleClass, &methodCount);
for (unsigned int i = 0; i < methodCount; i++) {
  Method method = methods[i];
  SEL selector = method_getName(method);
  if ([NSStringFromSelector(selector) hasPrefix:@"__rct_export__"]) {
    IMP imp = method_getImplementation(method);
    NSArray *entries = ((NSArray *(*)(id, SEL))imp)(_moduleClass, selector);
    //...
    [moduleMethods addObject:/* Object representing the method */];
  }
}
```


#### 初始化Javascript执行器
JavaScript执行器有一个`setUp`方法。用这个方法可以执行很多耗费资源的任务，比如在后台线程里初始化`JavaScriptCore`。由于只有active的执行器才可以接受到`setUp`的调用，所以也节约了很多的资源。
```objective-c
JSGlobalContextRef ctx = JSGlobalContextCreate(NULL);
_context = [[RCTJavaScriptContext alloc] initWithJSContext:ctx];
```

#### 注入Json配置
模块的配置都是Json形式的，如：
```javascript
{
  "remoteModuleConfig": {
    "Logger": {
      "constants": { /* If we had exported constants... */ },
      "moduleID": 1,
      "methods": {
        "requestPermissions": {
          "type": "remote",
          "methodID": 1
        }
      }
    }
  }
}
```

这些都作为全局变量存储在JavaScript VM里，因此当桥接器的Js侧代码初始化完毕的时候它可以用这些信息来创建原生模块。

#### 加载JavaScript代码
可以获得代码的地方只有两个，在开发的时候从packager下载代码，在产品环境下从磁盘加载代码。

#### 执行JavaScript代码
一旦所有的准备工作就绪，我们就可以把App的代码都加载到JavaScript Core里解析，执行。在最开始执行的时候，所有的CommonJS模块都会被注册（现在你写的是ES6的模块，不是CommonJS，但是最后会转码为ES5），并require入口文件。

```javascript
JSValueRef jsError = NULL;
JSStringRef execJSString = JSStringCreateWithCFString((__bridge CFStringRef)script);
JSStringRef jsURL = JSStringCreateWithCFString((__bridge CFStringRef)sourceURL.absoluteString);
JSValueRef result = JSEvaluateScript(strongSelf->_context.ctx, execJSString, NULL, jsURL, 0, &jsError);
JSStringRelease(jsURL);
JSStringRelease(execJSString);
```

#### JavaScript模块
这个时候，上例中的原生模块就可以在`NativeModules`对象里调用了。
```javascript
var { NativeModules } = require('react-native');
var { Person } = NativeModules;

Person.greet('Tadeu');
```
当你调用一个原生模块的方法的时候，它会在一个队列里执行。其中包含模块名、方法名和调用这个方法需要的全部参数。在JavaScript执行结束的时候原生代码继续执行。



### 调用周期
下面看看如果我们调用上面的代码会发生什么：
![]()
代码的调用从Js开始，之后开始原生代码的执行。Js传入的回调会通过桥接器（原生模块使用`_bridge`实例调用`enqueueJSCall:args:`）传回到JS代码。

**注意**：你如果看过文档，或者亲自实践过的话你就会知道也有从原生模块调用JS的情况。这个是用vSYNC实现的。但是这些为了改善启动时间被删除了。

### 参数类型
从原生调用JS的情况更简单一些，参数是做为JSON例的一个数组传递的。但是从JS到原生的调用里，我们需要原生的类型。但是，如上文所述，对于类的对象（结构体的对象），运行时并不能通过`NSMethodSignature`给我们足够的信息，我们只有字符串类型。

我们使用正则表达式从方法的签名里提取类型，然后我们使用`RCTConvert`工具类来实际转化参数的类型。这个工具类会把JSON里的数据转化成我们需要的类型。

我们使用`objc_msgSend`来动态调用方法。如果是struct的话，则使用`NSInvocation`来调用。

一旦我们得到了全部参数的类型，我们使用另外一个`NSInvocation`来调用目标模块的方法，并传入全部的参数。比如：
```javascript
// If you had the following method in a given module, e.g. `MyModule`
RCT_EXPORT_METHOD(methodWithArray:(NSArray *) size:(CGRect)size) {}

// And called it from JS, like:
require('NativeModules').MyModule.method(['a', 1], {
  x: 0,
  y: 0,
  width: 200,
  height: 100
});

// The JS queue sent to native would then look like the following:
// ** Remember that it's a queue of calls, so all the fields are arrays **
@[
  @[ @0 ], // module IDs
  @[ @1 ], // method IDs
  @[       // arguments
    @[
      @[@"a", @1],
      @{ @"x": @0, @"y": @0, @"width": @200, @"height": @100 }
    ]
  ]
];

// This would convert into the following calls (pseudo code)
NSInvocation call
call[args][0] = GetModuleForId(@0)
call[args][1] = GetMethodForId(@1)
call[args][2] = obj_msgSend(RCTConvert, NSArray, @[@"a", @1])
call[args][3] = NSInvocation(RCTConvert, CGRect, @{ @"x": @0, ... })
call()
```

### 线程
默认情况下，每一个模块都有自己的`GCD queue`。除非在模块中通过`-methodQueue`方法指定模块要运行的队列。有一个例外是`View Managers`（就是继承了`RCTViewManager`）的类，会默认运行在*Shadow Queue*里。

目前的线程规则是这样的：
* `-init`和`-setBridge:`保证会在*main thread*里执行
* 所有导出的方法都会在目标队列里执行
* 如果你实现了`RCTInvalidating`协议，`invalidate`也会在目标队列里执行
* `-dealloc`方法在哪个线程执行被调用

当JS执行一堆的方法之后，这些方法会根据目标队列分组，之后被并行分发：
```javascript
// group `calls` by `queue` in `buckets`
for (id queue in buckets) {
  dispatch_block_t block = ^{
    NSOrderedSet *calls = [buckets objectForKey:queue];
    for (NSNumber *indexObj in calls) {
      // Actually call
    }
  };

  if (queue == RCTJSThread) {
    [_javaScriptExecutor executeBlockOnJavaScriptQueue:block];
  } else if (queue) {
    dispatch_async(queue, block);
  }
}
```


### 总结
本文还只是对桥接器如何工作的一个简单描述。希望对各位能有所帮助。







