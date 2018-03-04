# iOS的异步渲染

最近看了`YYAsyncLayer`在这里总结一下。`YYAsyncLayer`是整个`YYKit`异步渲染的基础。整个项目的Github地址在[这里](https://github.com/ibireme/YYAsyncLayer)。你可以先下载了一睹为快，也可以跟着我一步一步的了解它是怎么实现异步绘制的。

## 如何实现异步

两种方式可以实现异步。一种是使用另外的一个线程，一种是使用**RunLoop**。另外开一个线程的方法有很多，但是现在最方便的就死GCD了。

### GCD

这里介绍一些GCD里常用的方法，为了后面阅读的需要。还有`YYAsyncLayer`中用到的更加高级的用法会在下文中深入介绍。

#### 创建一个queue
```objc
dispatch_queue_t queue;
if ([UIDevice currentDevice].systemVersion.floatValue >= 8.0) {
  dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INITIATED, 0);
  queue = dispatch_queue_create("com.ibireme.yykit.render", attr);
} else {
  queue = dispatch_queue_create("com.ibireme.yykit.render", DISPATCH_QUEUE_SERIAL);
  dispatch_set_target_queue(queue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0));
}
```
如果iOS 8和以上版本的话，创建queue的方法和之前的版本的不太太一样。在iOS 8和以上的版本中创建queue需要先创建一个`dispatch_queue_attr_t`类型的实例。并作为参数传入到queue的生成方法里。

`DISPATCH_QUEUE_SERIAL`说明在这个queue内部的task是串行执行的。

[未完待续：1. 创建dispatch_queue_t的时候参数的意义]

#### dispatch_once
使用`dispatch_once`和`dispatch_once_t`的组合可以实现其中的task只被执行一次。但是有一个前提条件，看代码：
```objc
static dispatch_once_t onceToken; // 1

// 2
dispatch_once(&onceToken, ^{
  // 这里的task只被执行一次
});
```
1. 这里的`dispatch_once_t`必须是静态的。也就是要有APP一样长的生存期来保证这段时间内task只被执行一次。如果不是**static**的，那么只被执行一次是保证不了的。
2. `dispatch_once`方法在这里执行，`onceToken`在这里有一个取地址的操作。也就是`onceToken`把地址传入方法内部被初始化和赋值。

### RunLoop
```objc
CFRunLoopRef runloop = CFRunLoopGetMain();  // 1
CFRunLoopObserverRef observer;
// 2
observer = CFRunLoopObserverCreate(CFAllocatorGetDefault(),
                                    kCFRunLoopBeforeWaiting |kCFRunLoopExit,
                                    true,      // repeat
                                    0xFFFFFF,  // after CATransaction(2000000)
                                    YYRunLoopObserverCallBack, NULL);
// 3
CFRunLoopAddObserver(runloop, observer, kCFRunLoopCommonModes); 
CFRelease(observer);

[未完待续：1. runloop的详细概念。2. 创建observer的时候参数的意义。3. core animation相关的内容]
```
我们来分析一下这段代码
1. `CFRunLoopGetMain`方法返回主线程的`RunLoop`引用。后面用这个引用来添加回调。
2. 使用系统内置的c方法创建一个`RunLoop`的观察者，在创建这个观察者的时候回同时指定回调方法。
3. 给`RunLoop`实例添加观察者，之后减少一个观察者的引用。

在第二步创建观察者的时候，还指定了观察者观察的事件：`kCFRunLoopBeforeWaiting | kCFRunLoopExit`，在
`RunLoop`进入等待或者即将要退出的时候开始执行观察者。指定了观察者是否重复（true）。指定了观察者的优先级：`0xFFFFFF`，这个优先级比`CATransaction`优先级为2000000的优先级更低。这是为了确保系统的动画优先执行，之后再执行异步渲染。

`YYRunLoopObserverCallBack`就是观察者收到通知的时候要执行的回调方法。这个方法的声明是这样的：
```objc
static void YYRunLoopObserverCallBack(CFRunLoopObserverRef observer, CFRunLoopActivity activity, void *info);
```

## 渲染是怎么回事
渲染就是把我们代码里设置的代码的视图和数据结合，最后绘制成一张图呈现在用户的面前。每秒绘制60张图，用户看着就是流畅的揭秘男呈现，如果不到60帧，那么越少用户看着就会越卡。

### CALayer
在iOS中，最终我们看到的视图都是在CALayer里呈现的，在`CALayer`有一个属性叫做`contents`，这里不放别的，放的就是显示用的一张图。

我们来看看`YYAsyncLayer`类的代码：
```objc
  // 类声明
  @interface YYAsyncLayer : CALayer // 1
  /// Whether the render code is executed in background. Default is YES.
  @property BOOL displaysAsynchronously;
  @end

  //类实现的一部分代码
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();  // 2
  // ...
  dispatch_async(dispatch_get_main_queue(), ^{
      self.contents = (__bridge id)(image.CGImage); // 3
  });
```
1. `YYAsyncLayer`继承自`CALayer`。
2. `UIGraphicsGetImageFromCurrentImageContext`这是一个`CoreGraphics`的调用，是在一些绘制之后返回组成的图片。
3. 在2>中生成的图片，最终被赋值给了`CALahyer#contents`属性。

### CoreGraphics
如果说`CALayer`是一个绘制结果的展示，那么绘制的过程就要用到`CoreGraphics`了。

在正式开始以前，首先需要了解一个方法的实现。这个方法会用来绘制具体的界面上的内容：
```objc
task.display = ^(CGContextRef context, CGSize size, BOOL(^isCancelled)(void)) {
    if (isCancelled()) return;
    NSArray *lines = CreateCTLines(text, font, size.width);
    if (isCancelled()) return;
    
    for (int i = 0; i < lines.count; i++) {
        CTLineRef line = line[i];
        CGContextSetTextPosition(context, 0, i * font.pointSize * 1.5);
        CTLineDraw(line, context);
        if (isCancelled()) return;
    }
};
```
你也看到了，这其实不是一个方法而是一个block。这个block会使用传入的`CGContextRef context`参数来绘制文字。

目前了解这么多就足够了，后面会有详细的介绍。

在`YYAsyncLayer#_displayAsync`方法是如何绘制的，`_displayAsync`是一个“私有方法”。
```objc
//这里我们只讨论异步的情况
// 1
CGSize size = self.bounds.size;
BOOL opaque = self.opaque;
CGFloat scale = self.contentsScale;
CGColorRef backgroundColor = (opaque && self.backgroundColor) 
  ? CGColorRetain(self.backgroundColor) : NULL;

dispatch_async(YYAsyncLayerGetDisplayQueue(), ^{  // 2
  UIGraphicsBeginImageContextWithOptions(size, opaque, scale);
  CGContextRef context = UIGraphicsGetCurrentContext();
  // 3
  if (opaque) {
    CGContextSaveGState(context); {
      if (!backgroundColor || CGColorGetAlpha(backgroundColor) < 1) {
        CGContextSetFillColorWithColor(context, [UIColor whiteColor].CGColor);
        CGContextAddRect(context, CGRectMake(0, 0, size.width * scale, size.height * scale));
        CGContextFillPath(context);
      }
      if (backgroundColor) {
        CGContextSetFillColorWithColor(context, backgroundColor);
        CGContextAddRect(context, CGRectMake(0, 0, size.width * scale, size.height * scale));
        CGContextFillPath(context);
      }
    } CGContextRestoreGState(context);
    CGColorRelease(backgroundColor);
  }
  task.display(context, size, isCancelled);   // 4

  // 5
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  // 6
  dispatch_async(dispatch_get_main_queue(), ^{
    self.contents = (__bridge id)(image.CGImage);
  });
});
```
解释如下：
1. 准备工作，获取`size`, `opaque`, `scale`和`backgroundColor`这个四个值。这些在获取绘制的取悦的时候用到。背景色另外有处理。
2. `YYAsyncLayerGetDisplayQueue()`方法返回一个`dispatch_queue_t`实例，并在其中开始异步操作。
3. 判断`opaque`的值，如果是非透明的话处理背景色。这个时候就会用到第一步里获取到的`backgroundColor`变量的值。
4. 在*CoreGraphics*一节开始的时候讲到的绘制具体内容的block。
5. 绘制完毕，获取到`UIImage`实例。
6. 返回主线程，并给`contents`属性设置绘制的成果图片。至此异步绘制全部结束。

为了让读者更加关注异步绘制这个主题，所以省略了部分代码。生路的代码中很多事检查是否取消的。异步的绘制，尤其是在一个滚动的`UITableView`或者`UICollectionView`中随时都可能会取消，所以即使的检查是否取消并终止正在进行的绘制很有必要。这些，你会在完整的代码中看到。

### CoreAnimation不止是动画
[未完待续：core animation和run loop的关系]


## 不能无限的开辟线程
我们都知道，把阻塞主线程执行的代码放入另外的线程里保证APP可以及时的响应用户的操作。但是线程的切换也是需要额外的开销的。也就是说，线程不能无限度的开辟下去。

那么，`dispatch_queue_t`的实例也不能一直增加下去。有人会说可以用`dispatch_get_global_queue()`来获取系统的队列。没错，但是这个情况只适用于少量的任务分配。因为，系统本身也会往这个queue里添加任务的。

所以，我们需要用自己的queue，但是是有限个的。在YY里给这个数量指定的值是`16`。
```
指定为16，我也是有些疑惑的。在Android里指定线程池的大小的时候通常的值是CPU的内核个数的两倍。
```


[未完待续：1. queue和thread的关系。2. android线程池的概念，分派线程数的依据]

## 设计，把点连成线
`YYAsyncLayer`异步绘制的过程就是一个观察者执行的过程。所谓的观察者就是你设置了一个机关，当它被触发的时候可以执行你预设的东西。比如你走到一扇门前，它感应到了你的红外辐射就会打开。

async layer也是一样，它会把“感应器”放在run loop里。当run loop要闲下来的时候“感应器”的回调开始执行，告诉async layer可以开始异步渲染了。

但是异步渲染要干什么呢？我们现在就来说说异步渲染的内容从哪里来？一个需要异步渲染的view会在定义的时候就把需要异步渲染的内容通过layer保存在view的代理发送给layer。

### CALayer和UIView的关系
UIView是显示层，而显示在屏幕上的内容是由CALayer来管理的。`CALayer`的一个代理方法可以在`UIView`宿主里实现。

`YYAsyncLayer`用的就是这个方式。代理为：
```objc
@protocol YYAsyncLayerDelegate <NSObject>
@required
/// This method is called to return a new display task when the layer's contents need update.
- (YYAsyncLayerDisplayTask *)newAsyncDisplayTask;
@end
``
在实现的时候是这样的：
```objc
#pragma mark - YYTextAsyncLayerDelegate

- (YYTextAsyncLayerDisplayTask *)newAsyncDisplayTask {
  // 1
  YYAsyncLayerDisplayTask *task = [YYAsyncLayerDisplayTask new]; 

  // 2 
  task.willDisplay = ^(CALayer *layer) {
    // ...
  }

  // 3 
  task.display = ^(CGContextRef context, CGSize size, BOOL (^isCancelled)(void)) {
    // ...
  }

  // 4 
  task.didDisplay = ^(CALayer *layer, BOOL finished) {
    // ...
  }

  return task;
}
```
1. 创建了`YYAsyncLayerDisplayTask`对象
2. 设置task的`willDisplay`block回调。 3. 4.分别设置了其他的display回调block。

可见`YYAsyncLayer`的代理的实现会创建一个`YYAsyncLayerDisplayTask`的实例并返回。在这个实例中包含了layer显示顺序的回调：`willDisplay`、`display`和`didDisplay`。

### `setNeedsDisplay`
对`CALayer`实例调用`setNeedsDisplay`方法之后`CALayer`的`display`方法就会被调用。`YYAsyncLayer`重写了`display`方法：
```objc
- (void)display {
  super.contents = super.contents;
  [self _displayAsync:_displaysAsynchronously];
}
```
最终会调用`YYAsyncLayer`实例的`display`方法。`display`方法又会调用到`_displayAsync:`方法，开始异步绘制的过程。


## 总结
最后，我们把整个异步渲染的过程来串联起来。

对一个包含了`YYAsyncLayer`的view，比如`YYLable`就像[文档](https://github.com/ibireme/YYAsyncLayer)里的一样。重写`layoutSubviews`方法添加对layer的`setNeedsDisplay`方法的调用。

这样一个调用链就形成了：用户操作->[view layoutSubviews]->[view.layer setNeedsDisplay]->[layer display]->[layer _displayAsync]异步绘制开始（准确的说是`_displayAsync`方法的参数为**true**的时候开始异步绘制）。

但是这并没有用到*RunLoop*。所以代码会修改为每次调用`layoutSubviews`的时候给RunLoop提交一个异步绘制的任务：
```objc
- (void)layoutSubviews {
    [super layoutSubviews];
    [[YYTransaction transactionWithTarget:self selector:@selector(contentsNeedUpdated)] commit];
}

- (void)contentsNeedUpdated {
    // do update
    [self.layer setNeedsDisplay];
}
```
这样每次RunLoop要进入休眠或者即将退出的时候会开始异步的绘制。这个任务是从`[layer setNeedsDisplay]`开始的。