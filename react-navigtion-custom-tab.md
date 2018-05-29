## 自定义react-navigation的TabBarComponent

在某些情况下，默认的react-navigation的tab bar无法满足开发者的要求。这个时候就需要自定义一个tab bar了。本文就基于react-navigtion v2来演示如何实现一个自定义tab bar。

这里主要处理的是再android里，当界面中有输入框，唤起软键盘的时候位于底部的tab bar也会浮动到键盘的上方。这显然不是我们需要的。所以，需要用自定义的tab bar来解决这个问题。

### Keyboard模块
问题是，有键盘的时候tabbar会被顶起来，键盘消失的时候tab bar也会恢复到正常的位置。
那么处理这个问题的最好办法就是，当键盘唤起的时候让tab bar不可见，当键盘消失当时候再让tab bar显示出来。

这就需要用到`Keyboard`了。
```javascript
import { Keyboard } from 'react-native';
```
`Keyboard`模块专门用来处理键盘事件。通过这个模块我们就可以得知键盘要唤起，还是要消失。

```javascript
import React, { Component } from 'react';
import { Keyboard, TextInput } from 'react-native';

class Example extends Component {
  componentDidMount () {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount () {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow () {
    alert('Keyboard Shown');
  }

  _keyboardDidHide () {
    alert('Keyboard Hidden');
  }

  render() {
    return (
      <TextInput
        onSubmitEditing={Keyboard.dismiss}
      />
    );
  }
}
```
在`componentDidMount`的时候绑定键盘的两个事件：
1. keyboardDidShow, 键盘即将出现
2. keyboardDidHide, 键盘即将隐藏

通过`Keyboard`模块绑定了这两个事件之后就可以在绑定的回调里让tab bar显示和隐藏了。

### 自定义tab bar
在react-navigation v2中，要实现自定义的tab bar非常简单：
```javascript
import {
  createBottomTabNavigator,
  createStackNavigator,
} from 'react-navigation';

class DetailsScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Details!</Text>
      </View>
    );
  }
}

class HomeScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* other code from before here */}
        <Button
          title="Go to Details"
          onPress={() => this.props.navigation.navigate('Details')}
        />
      </View>
    );
  }
}

class SettingsScreen extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* other code from before here */}
        <Button
          title="Go to Details"
          onPress={() => this.props.navigation.navigate('Details')}
        />
      </View>
    );
  }
}

const HomeStack = createStackNavigator({
  Home: HomeScreen,
  Details: DetailsScreen,
});

const SettingsStack = createStackNavigator({
  Settings: SettingsScreen,
  Details: DetailsScreen,
});

export default createBottomTabNavigator(
  {
    Home: HomeStack,
    Settings: SettingsStack,
  },
  {
    /* Other configuration remains unchanged */
  }
);
```
这里创建了一个每一个tab项都是一个stack navigator的tab bar。这里当然使用的是默认的tab bar。方法`createBottomTabNavigator`会返回一个在底部的tab bar。

我们来添加一个自定义的tab bar：
```javascript
// ...略...

export default createBottomTabNavigator(
  {
    Home: HomeStack,
    Settings: SettingsStack,
  },
  {
    tabBarComponent: CustomTabComponent,
  }
);
```
`CustomTabView`就是自定义的tab bar。

当程序运行起来以后，react-navigation会把tab bar所需要的内容（tab的label、icon、navigate到什么地方等都通过prop的方式传进来）。但是，我们这里并不打算做其他的定制，所以可以通过一个简单的方式把这些tab bar的item都绘制出来。

这就需要用到`react-navigation-tabs`。这个包提供了tab bar的所有默认的实现。包括上面提到的props的解析都有。看下代码：
```javascript
import React from 'react';
import { Keyboard } from 'react-native';
import { BottomTabBar } from 'react-navigation-tabs';

type Prop = {};
type State = { visible: boolean };

export default class CustomTabComponent extends React.Component<Prop, State> {
  state: State = { visible: true };

  componentDidMount() {
    this.kbShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardWillShow);
    this.kbHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardWillHide);
  }

  keyboardWillShow = () => {
    console.log('keyboardwillshow');
    this.setState({ visible: false });
  };

  keyboardWillHide = () => {
    console.log('keyboardwillhide');
    this.setState({ visible: true });
  };

  componentWillUnmount() {
    this.kbShowListener.remove();
    this.kbHideListener.remove();
  }

  render() {
    return this.state.visible && <BottomTabBar {...this.props} />;
  }
}
```
在keyboard显示的时候隐藏tab bar：
```js
  keyboardWillShow = () => {
    this.setState({ visible: false });
  };
```

在键盘隐藏的时候显示tab bar：
```js
  keyboardWillHide = () => {
    this.setState({ visible: true });
  };
```

显示出全部的tab item：
```js
  render() {
    return this.state.visible && <BottomTabBar {...this.props} />;
  }
```

## 最后

处理软键盘导致的tab bar上浮这个问题就完美解决了。其他的很多时候软键盘的出现都会导致类似的问题。基本上都可以通过绑定`Keyboard`模块的方式来解决。

对于tab bar本身有定制需要的，则可以通过自定义tab bar实现。正好本文解决了软键盘对tab bar的影响，也开是了一个解决自定义tab bar的门。有深度定义tab bar的同学，就需要解析从react-navigation传过来的props了。