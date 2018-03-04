# React Native填坑之旅 -- 使用iOS原生视图（高德地图）
在开发React Native的App的时候，你会遇到很多情况是原生的视图组件已经开发好了的。有的是系统的SDK提供的，有的是第三方试图组件，总之你的APP可以直接使用的原生视图是很多的。React Native提供了一套完善的机制，你可以非常简单的用来包装已有的原生视图。

下面就用高德地图作为例子讲解如何包装原生视图。高德地图本身不仅有视图需要展示，还有一些和React Native交互的部分。比如给Js代码发送事件，接受Js发送的方法调用等。

### 简单实现
基本山只需要三步就可以达到目的：
1. 创建`RCTViewManager`的子类
2. 在源文件里添加`RCT_EXPORT_MODULE()`宏的调用
3. 实现`- (UIView *)view`方法

看看代码：
```objective-c
//.h
#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>

@interface GDMapViewManager : RCTViewManager

@end

//.m
#import "GDMapViewManager.h"
#import "GDMapView.h"
#import <MAMapKit/MAMapKit.h>
#import <AMapFoundationKit/AMapFoundationKit.h>

@implementation GDMapViewManager

RCT_EXPORT_MODULE()

- (UIView *)view {
  MAMapView *mapView = [[MAMapView alloc] init];
  mapView.showsUserLocation = YES;	// 显示用户位置蓝点
  mapView.userTrackingMode = MAUserTrackingModeFollow;
  
  return mapView;
}

@end

// index.ios.js
// import from `react` & `react native`...

import { requireNativeComponent } from 'react-native'

const GDMapView = requireNativeComponent('GDMapView', null)

export default class mobike extends Component {
  render() {
    return (
      <View style={styles.container}>
        <GDMapView style={{ flex: 1, }} />
      </View>
    );
  }
}

// styles...
```

### 属性
要导出属性：
```javascript
RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
```
这里导出的属性是高德地图的内置属性，表示是否在地图上显示指南针。可以如此使用：
```javascript
<GDMapView style={{ flex: 1, }} showsCompass={true} />
```

如果是我们自定义的属性，而不是高德地图内置的属性该如何导出呢？来看一个例子：
```javascript
RCT_CUSTOM_VIEW_PROPERTY(center, CLLocationCoordinate2D, GDMapView) {
  [view setCenterCoordinate:json ? [RCTConvert CLLocationCoordinate2D:json] : defaultView.centerCoordinate];
}
```
写这个属性是因为出过来的参数是json串，只有最初是的类型`NSString`、`int`之类的可用，其他类型的都需要转化。比如这里要用的`CLLocationCoordinate2D`这个类型。所以我们需要判断js传过来的json是否为空，并在不为空的时候转化成`CLLocationCoordinate2D`对象。如果js传过来的json为空的话则使用`defaultView.centerCoordinate`来填充。

### 处理用户发出的事件
处理直接或者间接的从用户发出的事件。比如，用户对地图的各种操作都会生成对应的事件需要原生代码来处理。

要实现这部分功能基本只需要两步：
1. 在视图部分添加一个属性：`@property (nonatomic, copy) RCTBubblingEventBlock onChange;`
2. 在视图Manager部分暴露出这个属性：`RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)`

之后在相对应的地方调用就可以了，如：
```JavaScript
- (void)mapView:(GDMapView *)mapView regionDidChangeAnimated:(BOOL)animated
{
  if (!mapView.onChange) {
    return;
  }

  MACoordinateRegion region = mapView.region;
  mapView.onChange(@{
    @"region": @{
      @"latitude": @(region.center.latitude),
      @"longitude": @(region.center.longitude),
      @"latitudeDelta": @(region.span.latitudeDelta),
      @"longitudeDelta": @(region.span.longitudeDelta),
    }
  });
}
```

### 建立对应的Js组件
上文的方式使用原生组件会显得凌乱，不易控制。最好的方式就是建立一个对应的Js组件。
```javascript
import React from 'react';
import {
requireNativeComponent
} from 'react-native';

export default class MapView extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <GDMapView {...this.props} />
    )
  }
}

MapView.propTypes = {
  marker: React.PropTypes.object,
  markers: React.PropTypes.array,
  zoom: React.PropTypes.number,
  centerCoordinate: React.PropTypes.object,
  showScale: React.PropTypes.bool,
  showsCompass: React.PropTypes.bool,
};

var GDMapView = requireNativeComponent('GDMapView', MapView);
```
之后就可以这样使用了：
```javascript
<MapView
    style={{ flex: 1, marginTop: 20, }}
    marker={marker} showsCompass={false}
    markers={markers}
    zoom={10}
    centerCoordinate={{ latitude: 39.909520, longitude: 116.336170 }}
    showScale={false} />
```

注意，给Js组件定义`PropTypes`是必须的。而且我这里的定义还是有点模糊。官网的比较细致，列在这里：
```javascript
MapView.propTypes = {
  region: React.PropTypes.shape({
    /**
     * Coordinates for the center of the map.
     */
    latitude: React.PropTypes.number.isRequired,
    longitude: React.PropTypes.number.isRequired,

    /**
     * Distance between the minimum and the maximum latitude/longitude
     * to be displayed.
     */
    latitudeDelta: React.PropTypes.number.isRequired,
    longitudeDelta: React.PropTypes.number.isRequired,
  }),
};
```
官网的例子对`region`这prop定义的相当的细致，不是一个`React.PropTypes.object就过去了的。

还有一些属性，你不想它们作为对应Js组件的API的一部分。所以，需要隐藏起来。那么你可以在绑定原生组件和Js组件的时候指定它们不作为API的一部分。如：
```javascript
const GDMapView = requireNativeComponent('GDMapView', MapView, {
  nativeOnly: { onChange: true }
});
```

#### 在对应的组件里处理事件
1. 在本组件内绑定原生组件的`onChange`事件，如这里的`_onChange()`方法。
2. 在绑定好的方法里（如`_onChange()`方法内）调用外部传入的事件处理方法（如`this.props.onRegionChange`）

当然，你不会忘了给`this.props.onRegionChange`写`PropTypes`的。
```javascript
export default class MapView extends React.Component {
  constructor(props) {
    super(props)

    this._onChange = this._onChange.bind(this);
  }

  _onChange(event) {
    if(!this.props.onRegionChange) {
      return;
    }

    this.props.onRegionChange(event.NativeEvent.region)
  }

  render() {
    return (
      <GDMapView {...this.props} onChange={this._onChange} />
    )
  }
}

MapView.propTypes = {
  //...
  onRegionChange: React.PropTypes.func,
};

const GDMapView = requireNativeComponent('GDMapView', MapView, {
  nativeOnly: { onChange: true }
});
```

##填坑完毕
到这里你可以在React Natie里愉快的使用原生组件了。

后面我们来探讨一下在Android里如何处理这些问题。

xcodebuild -project haoqix.xcodeproj -target haoqix -showBuildSettings | grep PROJECT_DIR

