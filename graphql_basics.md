## Graphql入门

GraphQL是一个查询语言，由Facebook开发，用于替换RESTful API。服务端可以用任何的语言实现。具体的你可以查看Facebook关于[GraphQL的文档](https://github.com/facebook/graphql)和[各种语言的实现](https://github.com/chentsulin/awesome-graphql)

### GraphQL的小历史
早在2012年，Facebook认为人们只有在离开PC的时候才会用智能手机，很快他们就发现这个认识是多么的错误！于是Facebook把注意力从Web移到了智能终端上。在那个时候，他们严重的依赖于RESTful API。大量的并发请求和对补充数据的二次请求给他们造成了很大的麻烦，尤其是响应时间。一个解决方案是设计足够多的资源来满足单次的请求。但是，这造成了服务端的扩展和维护困难。

在寻找更好的解决方案的过程中，Facebook的工程师发现开发人员不应该先入为主的把数据看成RESTful一样的集合。如何更好地存储和获取数据不应该是他们要主要考虑的内容。他们应该更多的考虑数据的关系，网状的关系。

在这个情况下GraphQL应运而生。

### GraphQL工作机制
一个GraphQL查询可以包含一个或者多个操作（operation），类似于一个RESTful API。操作（operation）可以使两种类型：查询（Query）或者修改（mutation）。我们看一个例子：
```javascript
query {
  client(id: 1) {
    id 
    name
  }
}
```
你的第一印象：“这个不是JSON？”。还真不是！就如我们之前说的，GraphQL设计的中心是为客户端服务。GraphQL的设计者希望可以写一个和期待的返回数据schema差不多的查询。

注意上面的例子有三个不同的部分组成:
* `client`是查询的operation
* `(id: 1)`包含了传入给Query的参数
* 查询包含`id`和`name`字段，这些字段也是我们希望查询可以返回的

我们看看server会给这个查询返回什么：
```javascript
{
  "data": {
    "client": {
      "id": "1",
      "name": "Uncle Charlie"
    }
  }
}
```

就如我们期望的，server会返回一个JSON串。这个JSON的schema和查询的基本一致。

我们再看看另一个例子：
```javascript
query {
  products(product_category_id: 1, order: "price DESC") {
    name 
    shell_size
    manufacturer
    price
  }
}
```

这次我们查询`products`，并传入两个参数：`product_category_id`用于过滤，一个指明按照`price`字段降序排列。查询中包含的字段是：`name`、`shell_size`、`manufacturer`和`price`）。

你可能已经猜到返回的结果是什么样子的了：
```javascript
{
  "data": {
    "products": [
      {
        "name": "Mapex Black Panther Velvetone 5-pc Drum Shell Kit",
        "shell_size": "22\"x18\" Bass Drum, 10\"x8\" & 12\"x9\" Toms, 14\"x14\" & 16\"x16\" Floor Toms",
        "manufacturer": "Mapex",
        "price": 2949.09
      },
      {
        "name": "Pearl MCX Masters Natural Birdseye Maple 4pc Shell Pack with 22\" Kick",
        "shell_size": "22x18\" Virgin Bass Drum 10x8\" Rack Tom 12x9\" Rack Tom 16x16\" Floor Tom",
        "manufacturer": "Pearl",
        "price": 1768.33
      }
    ]
  }
}
```

从这几个初级的例子里你可以看出来GraphQL允许客户端明确指定它要的是什么，避免了数据后去的冗余或者不足。和RESTful API对比一下，每一个客户端都会对应很多个RESTful API或者一个API要服务很多个客户端。所以说GraphQL是很好的查询语言。所有的operation、参数和所有可以查询的字段都需要在GraphQL server上定义、实现。

GraphQL还解决了另外一个问题。假设我们要查询`product_categories`和相关的`products`。在一个RESTful server上你可以实现一个API，返回全部的数据。但是，大多数的情况下，客户端会先请求`product_categories`之后在其他的请求中获取相关的某些`products`。

我们看看使用GraphQL可以怎么做：
```javascript
query {
  product_categories {
    name 
    products {
      name 
      price
    }
  }
}
```
我们这一次没有使用参数。在查询中我们指定了我么需要每一个`product_category`的`name`，还有所有的这个类别下的产品，每个产品的字段也都分别指定。返回的结果：
```javascript
{
  "data": {
    "product_categories": [
      {
        "name": "Acoustic Drums",
        "products": [
          {
            "name": "Mapex Black Panther Velvetone 5-pc Drum Shell Kit",
            "price": 2949.09
          },
          {
            "name": "Pearl MCX Masters Natural Birdseye Maple 4pc Shell Pack with 22\" Kick",
            "price": 1768.33
          }
        ]
      },
      {
        "name": "Cymbals",
        "products": [
          {
            "name": "Sabian 18\" HHX Evolution Crash Cymbal - Brilliant",
            "price": 319
          },
          {
            "name": "Zildjian 20\" K Custom Dry Light Ride Cymbal",
            "price": 396.99
          },
          {
            "name": "Zildjian 13\" K Custom Dark Hi Hat Cymbals",
            "price": 414.95
          }
        ]
      }
    ]
  }
}
```
查询的嵌套没有限制，全看我们的查询和server的实现。比如西面的例子完全合法：
```javascript
{
  purchases(client_id: 1) {
    date
    quantity
    total
    product {
      name
      price
      product_category {
        name
      }
    }
    client {
      name
      dob
    }
  }
}
```
这里我们请求server返回某个客户的`purchases`。查询里不仅指定了`purchase`的字段，还指定了相关的`product`，`product_category`的名称。

GraphQL有非常重要的一个特点：[**强类型**](http://graphql.org/docs/api-reference-type-system)。

```
每一个GraphQL server都要定义类型系统。查询实在这个类型系统的上下文中执行的。
```
也就是说，你可以查询值类型：`Int`, `Float`, `String`, `Boolean`和`ID`。

而上例中的`purchase`里的字段，`product`、`client`和`product_category`都是**对象类型**（Object Type）的。这些类型都需要我们自己定义。

由于GraphQL查询都是结构化的，信息也是类树结构展示的。*值类型*（Scalar Type）的可以理解为叶子，对象类型（Object Type）可以理解为树干。

### 操作（Operation）和字段别名
在GraphQL查询中可以为Operation里的字段指定别名。比如查询里指定了字段`cymbal_size`，但是客户端只能接受`diameter`。另外查询的返回结果都包含在以operation名称为key的对象里，所以这个名称也可以设置一个别名：
```javascript
{
  my_product: product(id: 3) {
    id 
    name
    diameter: cymbal_size
  }
}
```
返回的数据：
```javascript
{
  "data": {
    "my_product": {
      "id": "3",
      "name": "Zildjian 13\" K Custom Dark Hi Hat Cymbals",
      "diameter": "13\""
    }
  }
}
```

### Fragments

现在，客户端APP要获取另个分开的list： `drum sets`和`cymbals`。在GraphQL里你不会被限制在一个operation里。同时我们也可以像设置字段别名那样设置返回结果的别名：
```javascript
query {
  drumsets: product(product_category_id: 1) {
    id
    name
    manufacturer
    price
    pieces
    shell_size
    shell_type
  }

  cymbals: products(product_category_id: 2) {
    id
    name
    manufacturer
    price
    cymbal_size
  }
}
```
你可能已经注意到，在查询的两个对象中都包含了字段：`id`、`name`、`manufacturer`、`price`。

为了避免重复字段，我们可以使用GraphQL提供的**Fragments**。我们来把重复的字段都提出来，放到一个fragment里：
```javascript
query {
  drumsets: products(product_category_id: 1) {
    ...ProductCommonFields
    prices
    shell_size
    shell_type
  }

  cymbals: products(product_category_id: 2) {
    ...ProductCommonFields
    cymbal_size
  }
}

fragment ProductCommonFields on Product {
  id
  name
  manufacturer
  price
}
```
要使用一个*Fragment*就使用操作符：`...`。

### 变量（Variable）

我们要减少查询语句中的重复，我们来看看另外的一个例子该如何处理：
```javascript
client(id: 1) {
  name
  dob
}

purchasses(client_id: 1) {
  date
  quantity
  total
  product {
    name 
    price
    product_category {
      name
    }
  }
  client {
    name 
    dob 
  }
}
```
我们使用两个operation查询server，并且每个都包含了`client_id`参数。如果可以把这个集中到一起就非常好了。我们可以使用GraphQL的**变量**来实现这个效果。我们来添加一个`clientID`变量。

```javascript
query($clientId: Int) {
  client(id: $clientId) {
    name
    dob
  }

  purchases(client_id: $clientId) {
    date
    quantity
    total
    product {
      name
      price
      product_category {
        name
      }
    }
    client {
      name
      dob
    }
  }
}
```
我们在operation的前面定义了变量，然后我们就可以在整个查询中使用这个变量了。 **为了使用变量的定义，我们需要在查询的时候附带变量值的JSON**。
```javascript
{
  "clientId": 1
}
```

当然，我们也可以指定一个默认值：
```javascript
query ($date: String = "2017/01/28") {
  purchases(date: $date) {
    date
    quantity
    total
  }
}
```

### Mutation（修改）
GraphQL不仅可以用来查询数据，也可以创建、更新和销毁数据。当然和查询一样，这些也需要server端有对应的实现。增、删、改一类的operation在GraphQL里统称为Muration（修改）。我们就通过几个例子来演示一下mutation。
```javascript
mutation {
  create_client (
    name: "查理大叔"
    dob: "2017/01/28"
  ) {
    id 
    name
    dob
  }
}
```
我们现在指定operation的类型为**mutation**，而不是**query**。在`create_client`操作里我们传入了创建一个`client`需要的数据，并最终返回一个查询集合：
```javascript
{
  "data": {
    "create_client": {
      "id": "5",
      "name": "查理大叔",
      "dob": "2017/01/28"
    }
  }
}
```

上面的数据有一点错误，生日不对。下面就来用更新来fix这个错误：
```javascript
mutation {
  update_client (
    id: 5
    dob: "1990/01/01"
  ) {
    id
    name
    dob
  }
}
```
最后，如果我们要删除这个数据可以这样：
```javascript
mutation {
  destroy_client(id: 5) {
    name 
    dob
  }
}
```
**注意：**`create_client`、`update_client`和`destroy_client`这些operation都是在GraphQL server实现好的。如果有什么方法可以知道GraphQL server都实现了什么方法不是很好，是的有GraphQL的*doc*可以查看。

### 定义说明
GraphQL的一个非常好的特性就是，它会根据已经定义好的类型系统来自动生成出一个说明文档。这样你就不用一次一次的翻看代码，而直接查看文档来了解operation的全部实现细节。如果你用的是`express-graphql`, 并设置`graphiql`为`true`的话，那么就会生成一个web的调试界面。在最右侧可以直接使用doc：
```javascript
app.use('/mobile/egoods', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
  pretty: IS_DEVELOPMENT,
}))
```

或者，也可以使用对于应定义好的schema的查询，如：
```javascript
{
  __schema {
    queryType {
      name 
      fields {
        name
      }
    }
  }
}
```
结果为：
```javascript
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query",
        "fields": [
          {
            "name": "client"
          },
          {
            "name": "clients"
          },
          {
            "name": "product"
          },
          {
            "name": "product_categories"
          },
          {
            "name": "product_category"
          },
          {
            "name": "products"
          }
        ]
      }
    }
  }
}
```
对于`mutation`类型的操作也是一样的:
```javascript
{
  __schema {
    mutationType {
      name
      fields {
        name
      }
    } 
  }
}
```
查询的结果为：
```javascript
{
  "data": {
    "__schema": {
      "mutationType": {
        "name": "Mutation",
        "fields": [
          {
            "name": "create_client"
          },
          {
            "name": "destroy_client"
          },
          {
            "name": "update_client"
          }
        ]
      }
    }
  }
}
```
就像上文展示的一样，你还可以查询很多其他的内容。比如：
```javascript
{
  __schema {
    queryType {
      name
      fields {
        name
        args {
          name
        }
      }
    }
  }
}
```
我们来简单的看看结果是什么样的：
```javascript
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query",
        "fields": [
          {
            "name": "clients",
            "args": [
              {
                "name": "ids"
              },
              {
                "name": "name"
              },
              {
                "name": "dob"
              }
            ]
          },
          {
            ...
          },
          {
            "name": "products",
            "args": [
              {
                "name": "ids"
              },
              {
                "name": "product_category_id"
              },
              {
                "name": "order"
              },
              {
                "name": "limit"
              }
            ]
          }
        ]
      }
    }
  }
}
```
你会看到server实现了一个`clients`的查询operation，参数为`ids`、`name`和`dob`。第二个操作是`products`，在这里的参数是`ids`、`product_category_id`和`order`、`limit`。

### 最后
GraphQL可以让我们定义更加便捷的查询Server。如果你有兴趣学习的话，我强烈的建议你可以读一读[GraphQL的定义说明](http://facebook.github.io/graphql/)，然后试着自己实现一个GraphQL server。











