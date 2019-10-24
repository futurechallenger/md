#在 React Native 中使用 RxJS

先看一个例子：

```javascript
export default function DemoScreen({ interval }) {
  return (
    <View>
      <Text>{`Interval: ${interval}`}</Text>
    </View>
  );
}
```

## Interval Observable
