# React Native填坑之旅 -- FlatList

在React Native里有很多种方法来创建可滚动的list。比如，ScrollView和ListView。他们都各有优缺点。但是在React Native 0.43里增加了两种行的list view。一个是`FlatList`, 一个是`SectionList`。今天我们就来详细了解一下`FlatList`。

如果你熟悉RN之前的ListView的话你会发现FlatList的API更加的简单，只需要给它一列数据，然后根据每一项数据绘制行就可以。

[源代码在github上。](https://github.com/futurechallenger/react-native-tutorial/blob/master/js/message/MessageContainer.js)代码中使用的是RN 0.49.5。

## 基本使用方法
基本上你只要给`FlatList`的两个props指定值就可以了，一个是`data`，一个是`renderItem`。数据源一般就是一个数组，而`renderItem`就是每一行的绘制方法。绘制行的时候只需要获取当前的数据项就可以。

正式开始之前，我们看下代码是什么样子的。
```js
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
} from 'react-native';

import MessageCell from './MessageCell';

const { width, height } = Dimensions.get('window');
const SCREEN_WIDTH = width;

export default class MessageContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      error: false,
      page: 1,
      refreshing: false,
      loading: false,
      data: {},
    };
  }

  componentDidMount() {
    this.requestData();
  }

  requestData = () => {
    const url = 'Some rest api url address';
    fetch(url).then(res => {    
      return res.json()
    }).then(res => {
      this.setState({
        data: [...this.state.data, ...res],
      });
    }).catch(err => {
      this.setState({ error: err, loading: false, refreshing: false});
    });
  };

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch', backgroundColor: 'white' }}>
        <Text>Message</Text>
        <FlatList
          data={[{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }]}
          renderItem={({ item }) => (
            <MessageCell item={item} />
          )} />
      </View>
    );
  }
}
```
首先import必要的组件：`import { FlatList } from 'react-native';`。当然还有其他的一些组件。render方法里就可以写绘制的代码了:
```js
render() {
    return (
      <View style={...}>
        <Text>Message</Text>
        <FlatList
          data={this.state.data}
          renderItem={({ item }) => (
            <MessageCell item={item} />
          )} />
      </View>
    );
  }
```=
`data`是从github的API上请求来的数据，json数据被解析之后填充到了`this.state.data`里。就像这样：`data: [...this.state.data, ...res]`。每个元素是一个只有一个key键值的对象。`renderItem`方法里会根据每一个item返回一个`MessageCell`组件。这个组件会根据传入的数据呈现不同的内容。

## 每行需要一个key
React Native为了很快的达到重绘改变了的一组组件，规定要给这一组组件里的每一个都设置一个**key**。FlatList的每一行也都需要一个key。

我们可以直接设置一个key。比如，每个元素的返回json里都有一个`id`属性，正好就可以用来作为每一行的key值。FlatList还有另外的一个设置方式.使用`keyExtractor`。
```js
  render() {
    return (
      <View style={styles.container}>
        <Text>Message</Text>
        <FlatList
          ...
          keyExtractor={item => item.id} />
      </View>
    );
```

### 分割线 - seperator
我们的APP本身在显示message的时候没有明显的分割线，而是用一块一块的方式显示的。如果只是简单的一条线分割两行，那么只需要设置行组件的`boderBottom`相关的属性就可以了。
如设置行组件的borderBottom：
```js

<View style={ borderTopWidth: 0, borderBottomWidth: 1, borderBottomColor: 'grey' }>
  // content...
</View>
``
如果你一定要一个分割线的话可以使用FlatList的`ItemSeperatorComponent` prop。如：
```js
  renderSeparator = () => {
    return (
        <View
        style={{
        height: 1,
        width: "86%",
        backgroundColor: "#CED0CE",
        marginLeft: "14%"
        }}
        />
    );
  };
```
使用seperator：
```js
render() {
  return (
    <List containerStyle={{ borderTopWidth: 0, borderBottomWidth: 0 }}>
      <FlatList
        ...
        ItemSeparatorComponent={this.renderSeparator}
      />
    </List>
  );
}
```
在FlatList里使用prop `ItemSeparatorComponent`就可以。

注意：**list的顶部和底部的分割组件是不绘制的**。

## 下拉刷新和上拉加载更多
自从这两个交互的方式自从发明出来之后就基本上是每一个应用里list的标配了。我们来看看FlatList如何添加这两个功能的。
```js
  render() {
    return (
      <View style={styles.container}>
        <Text>Message</Text>
        <FlatList
          ...
          refreshing={this.state.refreshing}
          onRefresh={this.handleRefresh}
          onEndReached={this.handleLoadMore}
          onEndReachedThreshold={0} />
      </View>
    );
  }
```
FlatList的几个props：
refreshing：表明list是否在refresh的状态。
onRefresh：开始refresh的事件。在这个方法里开始设置refresh的时候组件的state，并在`setState`方法的回调里开始请求后端的数据。
onEndReached: 上拉加载跟个多的事件。在这里设置加载更多对应的组件状态，并在`setState`方法的回调里请求后端数据。
onEndReachedThreshold：这个值是触发`onEndReached`方法的阈值。值是RN的逻辑像素。

下面看一下下拉刷新的方法。上拉加载更多基本类似，各位可以参考代码。
```js
  handleRefresh = () => {
    this.setState({
      page: 1,
      refreshing: true,
      loading: false,
      data: [],
    }, () => {
      this.requestData();
    });
  }
```
请求github的API的方法是：
```js
  requestData = () => {
    const url = 'https://api.github.com/users/[your github name]/repos';
    fetch(url).then(res => {
      console.log('started fetch');
      return res.json()
    }).then(res => {
      this.setState({
        data: [...this.state.data, ...res], 
        error: res.error || null,
        laoding: false,
        refreshing: false,
      });
    }).catch(err => {
      console.log('==> fetch error', err);
      this.setState({ error: err, loading: false, refreshing: false});
    });
  }
```
在下拉刷新开始请求后端的数据的时候首先设置组件状态。给组件的state设置初始值。

下拉刷新的话，每次都会清空已经存在的数据，并在之后给他设置为获得的第一页（或者）最新的数据，所以`page:1`。接下来要开始刷新，那么表示刷新的小菊花就需要转起来，所以refreshing的值设为true。loading在这个时候是不存在的，所以为false。

在`setState`方法的回调里开始请求后端的数据。数据返回之后，下拉刷新或者加载更多的状态都不存在。如果请求数据的时候有错，那么我们要处理错误。所以秦秋网络数据的方法为：
```js
  requestData = () => {
    const url = 'https://api.github.com/users/futurechallenger/repos';
    fetch(url).then(res => {
      console.log('started fetch');
      return res.json()
    }).then(res => {
      this.setState({
        data: [...this.state.data, ...res], 
        error: res.error || null,
        laoding: false,
        refreshing: false,
      });
    }).catch(err => {
      console.log('==> fetch error', err);
      this.setState({ error: err, loading: false, refreshing: false});
    });
  }
```
在返回的数据转化为json格式之后，合成data。这个时候refreshing和loading都已经完成，值都设置为false。数据是累加的：`data: [...this.state.data, ...res],`，所以每次在下拉刷新的时候`this.setState({data: []})`，在上拉加载更多的时候可以留着data不置空。

## List的header和footer
这个非常的简单，只要直接看代码就可以明白了。和使用prop `renderItem`一样的，header和footer都有对应的prop来绘制。
```js
  // Header
  renderHeader = () => {
    return <SearchBar placeholder="Type Here..." lightTheme round />;
  };

  // Footer
  renderFooter = () => {
    if (!this.state.loading) return null;

    return (
      <View
        style={{
          paddingVertical: 20,
          borderTopWidth: 1,
          borderColor: "#CED0CE"
        }}
      >
        <ActivityIndicator animating size="large" />
      </View>
    );
  };
```
然后这么用：
```js
render() {
  return (
    <List containerStyle={{ borderTopWidth: 0, borderBottomWidth: 0 }}>
      <FlatList
        ...
        ListHeaderComponent={this.renderHeader}
        ListFooterComponent={this.renderFooter}
      />
    </List>
  );
}
```

希望这些对你们有用。