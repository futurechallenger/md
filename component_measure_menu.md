ANTD mobile源码分析 -- popover

最近的开发中要用到很多的各式各样的组件。但是发现ant design mobile（后面简称ANTDM）里很多的资源。于是就分析一下，学习学习。

ANTDM直接使用了typescript，没有用ES2015，不过这不会是障碍，反而是学习typescript的一个好机会。基本上可以学的开源项目里比这个好的也不多。

## 目录结构
`Popover`组件在：
```
|
|--components
  |
  |--popover
```
我们要分析的组件全部都在*components*这个目录下。

在这个目录里还包含*__tests__*, *demo*和*style*。里面分别存放测试代码、实例和样式。其他的文件包括*[component name]_native.tsx*和*[component name].txs以及对应的*index.native.tsx*和*index.tsx*，方便外部引入组件。

## 计算点击组件的位置
这个是最核心的问题了！

实现React Native的弹出菜单，需要达到在界面上的某个可点击组件上点击了之后，就可以在被点击的组件紧挨着的下方出现一个菜单（其他的计算，比如弹出菜单在左下、右下，左上，右上的位置计算暂时不提）。

用户点击了哪个组件（按钮），哪个按钮的下面就出现一个菜单（View）。这就需要确定点击组件的位置。

我们看一下*index.native.tsx*这个文件。文件里基本上没几行代码，直接看`render`方法里返回的是`MenuContext`等。也就是，这个文件没实现什么pop over需要的什么东西。都在import里了：
```js
import Menu, { MenuContext, MenuOptions, MenuOption, MenuTrigger }from 'react-native-menu';
```
所以ANTDM的源码分析到此为止。

我们要跳到`react-native-menu`。我们分析代码的方式就是无限递归，一直找到实现功能的代码为止。那么我们就可以分析`react-native-menu`了。

### react-native-menu

这个项目的写法也是很不同。用的是比较老的ES5的React版本。github地址在[这里](https://github.com/jaysoo/react-native-menu)。

这个项目里很多的文件，各位可以后面慢慢看。我们来看*makeMenuContext.js*。

在这个项目里，除了*index.js*之外都是叫做*makeXXX.js*。里面都是HOC的实现方式。而且更加Trick的是HOC的前两个参数是`React`和`ReactNative`。

回到*makeMenuContext.js*，在`openMenu()`这个方法里就有实现的方式。这就是我们寻找代码递归跳出的地方。我们来看一下实现方式：
```js
openMenu(name) {
  const handle = ReactNative.findNodeHandle(this._menus[name].ref);
  UIManager.measure(handle, (x, y, w, h, px, py) => {
    this._menus[name].measurements = { x, y, w, h, px, py };

    this.setState({
      openedMenu: name,
      menuOptions: this._makeAndPositionOptions(name, this._menus[name].measurements),
      backdropWidth: this._ownMeasurements.w
    });

    this._activeMenuHooks = this._menus[name];
    this._activeMenuHooks && this._activeMenuHooks.didOpen();
  });
},
```
这里使用了`UIManager`，来自：
```js
  const {
    UIManager,
    TouchableWithoutFeedback,
    ScrollView,
    View,
    BackHandler
  } = ReactNative
```
用现代一点的写法的话就是：`import { UIManager } from 'react-native';`。

使用的时候是这么用的：
```js
  const handle = ReactNative.findNodeHandle(this._menus[name].ref);
  UIManager.measure(handle, (x, y, w, h, px, py) => {
    // x, y, width, height, pageX, pageY
  });
```
`measure()`方法的回调里得到的就是该组件对于**Screen**的位置。还有其他的`measureXXX()`方法在[这里](https://facebook.github.io/react-native/docs/direct-manipulation.html#other-native-methods)可以看到。

measure得到的x，y，w，h，px，py是这个组件的左上角坐标（x，y）和宽、高。在这个measure方法里得到的px和py与这个组件的左上角坐标值一样。

**注意**：measure的时候，只有在原生视图完成绘制之后才会返回值。

所以，如果要快点得到一个组件在screen上的坐标值的话，那么可以这样：
```js
<View onLayout={this.onLayout}>
  
</View>

// onLayout
onLayout() {
  const handle = ReactNative.findNodeHandle(this.refs.Container);
  UIManager.measure(handle, (x, y, w, h, px, py) => {
    this._ownMeasurements = {x, y, w, h, px, py};
  });
}
```

所以，在弹出菜单的组件上使用`onLayout`props得到它的位置。

**注意**：
```
they(measureXXX方法) are not available on composite components that aren't directly backed by a native view.
```
大意是，如果组合组件的最外层不是一个原生view的话，`measureXXX()`方法是没法用的！！

那么measure方法的第一个参数，也就是measure的目标组件如何获得呢？代码在这里：`const handle = ReactNative.findNodeHandle(this._menus[name].ref);`。在`findNodeHandle()`方法的参数是组件的`ref`。那么，通过组件的ref可以得到组件的handle。在通过这个`handle`就可以来measure组件，得到这个组件的位置、宽高等数据。

到这里我们就知道如何来算出触发组件的位置了。但是，这个直接使用`UIManager`的方法太复杂了。

基本上，组件可以直接调用measure方法。我们来简单的实现一下这个弹出菜单的功能。

## Reimplement
不管单词对错了。总之是重写一次。简化版的！为了篇幅足够长，我就把代码都贴出来了。哈哈~
```js
/**
 * Created by Uncle Charlie, 2018/03/01
 * @flow
 */

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

type Prop = {
  text: ?string,
  onPress: (e?: any) => void,
  styles?: { button: any, text: any },
};

export default class Button extends React.Component<Prop, {}> {
  static defaultProps = {
    text: 'Show Menu',
  };

  handlePress = () => {
    const { onPress } = this.props;

    if (!this.container) {
      console.error('container view is empty');
      return;
    }

    this.container.measure((x, y, w, h, px, py) => {
      console.log('===>measure', { x, y, w, h, px, py });
      onPress && onPress({ left: x, top: y + h });
    });
  };

  onLayout = () => {};

  render() {
    const { text, styles } = this.props;
    const wrapper =
      styles && styles.wrapper ? styles.wrapper : innerStyles.wrapper;
    return (
      <View
        style={wrapper}
        onLayout={this.onLayout}
        ref={container => (this.container = container)}
      >
        <TouchableOpacity onPress={this.handlePress}>
          <View>
            <Text>{text}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const innerStyles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'green',
  },
});
```

这个简化版的实现思路就是：
1. 点击按钮（`TouchableOpacity`）的时候measure按钮组件
2. 把measure出来的按钮组件的位置作为参数发送给父组件
3. 父组件在计算后的位置显示menu

#### measure
在measure组件之前，首先要获得这个组件的ref。
```js
  render() {
    // ...
    return (
      <View ref={container => (this.container = container)}
      >
      // ...
      </View>
    );
  }
```
得到的ref就是`this.container`。


```js
  handlePress = () => {
    const { onPress } = this.props;

    if (!this.container) {
      console.error('container view is empty');
      return;
    }

    this.container.measure((x, y, w, h, px, py) => {
      console.log('===>measure', { x, y, w, h, px, py });
      onPress && onPress({ left: x, top: y + h });
    });
  };
```
在点击按钮之后开始measure。直接在获得的ref上调用measure方法就可以：`this.container.measure`。获得measure的结果之后，调用props传过来的方法`onPress`把需要用到的数据传过去。

#### 绘制Menu
```js
renderMenu = () => {
    const { top, left, open } = this.state;
    if (!open) {
      return null;
    }

    return (
      <View
        style={{
          position: 'absolute',
          left,
          top,
          width: 100,
          height: 200,
          backgroundColor: 'rgba(52, 52, 52, 0.8)',
        }}
      >
        <Text>Menu</Text>
      </View>
    );
  };
```
我们要View显示在一个特定的位置的时候，需要在style里设置位置模式为`position: 'absolute'`，也就是启用绝对定位。

上面的`left`、和`top`就是菜单的具体位置。宽、高暂时hard code了（简化版。。。）。

这样就一个popover，超级简化版的，就完成了。全部的代码在[这里](https://github.com/futurechallenger/react-native-popover-menu-demo)。


## 最后
我们在前文中说道过一个更好的获得触发组件的位置的方式，`onLayout`。这个方法是空的。各位可以试着完成这个方法，或者全部完成这个popover组件作为练习。