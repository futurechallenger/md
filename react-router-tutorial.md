React-router v4教程

在这个教程里，我们会从一个例子React应用开始学习react-router-dom。其中你会学习如何使用`Link`、`NavLink`等来实现跳转，`Switch`和`exact`实现排他路由和浏览器路径历史。

也许学习react-router最好的办法就是用react-router-dom v4来写一个多页的react应用。这个react应用会包含登录、注册、首页、联系人等页面。但是，首先让我们来看一下react router v4的概念，以及它与v3有什么不同的地方。

## React router v4 vs v3
v4是react router的一次重写，所以和v3有很多不同的地方。主要有：
* 在react router v4里，路由不再是集中在一起的。它成了应用布局、UI的一部分。
* 浏览器用的router在`react-router-dom`里。所以，浏览器里使用的时候只需要import `react-router-dom`就可以。
* 新的概念`BrowerRouter`和`HashRouter`。他们各自服务于不同的情景下。详见下文。
* 不在使用`{props.children}`来处理嵌套的路由。
* v4的路由默认不再排他，会有多个匹配。而v3是默认排他的，只会有一个匹配被使用。

`react-router-dom`是react-router中用于浏览器的。`react-router`被分为一下几部分：
* **react-router**是浏览器和原生应用的通用部分。
* **react-router-dom**是用于浏览器的。
* **react-router-native**是用于原生应用的。

## React-router vs react-router-dom vs react-router-native
`react-router`是核心部分。`react-router-dom`提供了浏览器使用需要的定制组件。`react-router-native`则专门提供了在原生移动应用中需要用到的部分。所以，如果在本例中实现浏览器开发就只需要安装`react-router-dom`。

## 安装
如上所说，我们使用react开发web应用，所以只需要安装`react-router-dom`。
```javascript
  npm install react-router-dom --save
```

## 理解和使用react-router
* `BrowserRouter`，这是对`Router`接口的实现。使得页面和浏览器的history保持一致。如：`window.location`。
* `HashRouter`，和上面的一样，只是使用的是url的hash部分，比如：`window.location.hash`。
* `MemoryRouter`，
* `NativeRouter`，处理react native内的路由。
* `StaticRouter`，处理静态路由，和v3一样。

### BrowserRouter vs HashRouter
在react-router的各种router中，`<BrowserRouter>`和`<HashRouter>`是可以在浏览器中使用的。如果你使用的是一个非静态的站点、要处理各种不同的url那么你就需要使用`BrowserRouter`。相反的如果你的server只处理静态的url，那么就使用`HashRouter`。

## 理解和使用Route
<Route>组件是react router v4里最有用的组件。背后的使用哲学也很简单，无论何时你需要在匹配某个路径的时候绘制一个组件，那么就可以使用`Route`组件。

`Route`组件可以使用如下的属性：
* path属性，字符串类型，它的值就是用来匹配url的。
* component属性，它的值是一个组件。在`path`匹配成功之后会绘制这个组件。
* exact属性，这个属性用来指明这个路由是不是排他的匹配。
* strict属性，  这个属性指明路径只匹配以斜线结尾的路径。

还有其他的一些属性，可以用来代替`component`属性。
* render属性，一个返回React组件的方法。传说中的[rencer-prop](https://reactjs.org/docs/render-props.html)就是从这里来的。
* children属性，返回一个React组件的方法。只不过这个总是会绘制，即使没有匹配的路径的时候。

多数的时候是用`component`属性就可以满足。但是，某些情况下你不得不使用`render`或`children`属性。
* match
* location
* history

如：
使用组件：
```javascript
<Route exact path="/" component={HomePage} />
```
使用`render`属性实现内联绘制：
```javascript
<Route path="/" render={()=><div>HomePage</div>} />
```

来看哥更复杂的：
```javascript
const FadingRoute = ({ component, ...rest }) => (
  <Route {...rest} render={(props) => (
    <FadeIn>
      <componnet {...props} />
    </FadeIn>
  )} />
)

<FadingRoute path="/cool" component={Something} />
```

使用`children`：
```javascript
<ul>
  <ListItemLink to="/somewhere" />
  <LinkItemLink to="/somewhere-else" />
</ul>

const ListItemLink = ({to, ...rest}) => (
  <Route path={to} children={({math}) => (
    <li className={match ? 'active' : ''}>
      <Link to={to} {...rest} />
    </li>
  )} />
)
```

更多关于react-router v4如何匹配路径的内容，请移步[这里](https://github.com/pillarjs/path-to-regexp)。

## URL / Path / Route的参数
通常情况下，我们都会在路径里添加参数。这样方便在不同的组件之间传递一些必要的数据。那么我们如何才能获取到这些传递的参数，并传递给组件中呢？我们只需要在路径的最后加上`/:param`。如：
```javascript
<Route path="/:param1" component={HomePage} />

const HomePage = ({match}) => (
  <div>
    <h1> parameter => {match.params.param1}
  </div>
);
```

一旦有路径可以匹配成功，那么就会穿件一个拥有如下属性的对象，并传入绘制的组件里：
* url: 匹配的url。
* path：就是path。
* isExact：如果`path`和当前的`widnow.location`的path部分完全相同的话。
* params：在URL里包含的参数。

## 理解并使用Link
`Link`是react router v4特有的一个组件。是用来代替上一版的anchor link。使用`Link`可以在React应用的不同页面之间跳转。与unclor会重新加载整个页面不同，`Link`只会重新加载页面里和当前url可以匹配的部分。

`Link`组件需要用到`to`属性，这个属性的值就是react router要跳转到的地址。如：
```javascript
import { Link } from 'react-router-dom';

const Nav = () => (
  <Link to '/'>Home</Link>
);
```
当被点击的时候，会跳转到路径：`/`。

`to`属性的值可以是一个字符串，也可以是一个location（pathname, hash, state和search）对象。比如：
```javascript
<Link to{{
  pathname: '/me',
  search: '?sort=asc',
  hash: '#hash',
  state: { fromHome: true }
}} />
```

`Link`也可以使用`replace`属性，如果点击的话，那么history里的当前领会被replace。

### <Link>和<NavLink>
`NavLink`是`Link`的一个子类，在Link组件的基础上增加了绘制组件的样式，比如：
```javascript

<NavLink to="/me" activeStyle={{SomeStyle}} activeClassName="selected">
  My Profile
</NavLink>
```

## 使用react router dom实现你的第一个demo
现在我们用react router dom来实现第一个demo。

首先，引入必要的组件。比如：`Route`和`BrowserRouter`。
```javascript
import { BrowserRouter, Route } from 'react-router-dom';
```

接下来，我们创建一些组件和一些Html标签。同时我们用react router v4里的`Link`和`NavLink`组件。
```javascript
const BaseLayout = () => (
  <div className="base">
    <header>
      <p>React Router v4 Browser Example</p>
      <nav>
        <ul>
          <li><Link ="/">Home</Link></li>
          <li><Link ="/about">About</Link></li>
          <li><Link ="/me">Profile</Link></li>
          <li><Link ="/login">Login</Link></li>
          <li><Link ="/register">Register</Link></li>
          <li><Link ="/contact">Contact</Link></li>
        </ul>
      </nav>
    </header>
    <div className="container">
      <Route path="/" exact component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/me" component={ProfilePage} />
    </div>
    <footer>
      React Router v4 Browser Example (c) 2017
    </footer>
  </div>
);
```

然后我们来创建需要的组件：
```javascript
const HomePage = () => <div>This is a Home Page</div>
const LoginPage = () => <div>This is a Login Page</div>
const RegisterPage = () => <div>This is a Register Page</div>
const ProfilePage = () => <div>This is a Profile Page</div>
const AboutPage = () => <div>This is a About Page</div>
const ContactPage = () => <div>This is a Contact Page</div>
```

最后，写`App`组件。
```javascript
const App = () => (
  <BrowserRouter>
    <BaseLayout />
  </BrowserRouter>
)

render(<App />, document.getElementById('root'));
```

如你所见，react router v4的组件还非常的易用的。

## 理解和使用非排他的路由
在上例中，我们在`HomePage`组件的路由里使用了属性`exact`。
```javascript
<Route path="/" exact component={HomePage} />
```
这是因为v4中的路由默认都是非排他的，这一点和v3的实现思路截然不同。如果没有`exact`属性，`HomePage`组件和其他的组件就会同事绘制在页面上。

如，当用户点了登录连接以后，`"/"`和`"/login"`都满足匹配条件，对应的登录组件和Home组件就会同时出现在界面上。但是，这不是我们期待的结果，所以我们要给`"/"`path加上`exact`属性。

现在我们来看看非排他的路由有什么优点。假如我们有一个子菜单组件需要显示在profile页面出现的时候也出现。我们可以简单的修改`BasicLayout`来实现。
```javascript
const BaseLayout = () =>  (
  <div className="base">
    <header>
      <p>React Router v4 Browser Example</p>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li>
            <Link to="/me">Profile</Link>
            <Route path="/me" component={ProfileMenu} />
          </li>
          {/*略*/}
        </ul>
      </nav>
    </header>
  </div>
);
```
这样我们就会看到对应于`"/me"`路径的组件都绘制出来了。这就是非排他路由的好处。

## 理解排他路由
排他路由是react router v3的默认实现。只有第一个匹配的路由对应的组件会被绘制。这一点也可以用react router v4的`Switch`组件来实现。在`Switch`组件中，只有第一个匹配的路由`<Route>`或者`<Redirect>`会被绘制：
```javascript
import { Switch, Route } from 'react-router';

<Switch>
  <Route exact path="/" component={HomePage} />
  <Route path="/about" component={AboutPage} />
  <Route path="me" component={ProfilePage} />
  <Route component={NotFound} />
</Switch>
```

## 浏览器历史
react router v4中，提供了一个`history`对象。这个对象包含了多个api，可以用来操作浏览器历史等。

你也可以在React应用里使用`history`对象的方法：
```javascript
history.push("/my-path")
history.replace("/my-path")
```
用另外的方法可以写成：
```javascript
<Link to="/my-path" />
<Redirect to="my-path" />
```

## 使用<Redirect>组件实现重定向
无论何时你要重定向到另外一个地址的时候，都可以使用`Redirect`组件：
```javascript
<Redirect to {{
  pathname: '/register',
  search: '?utm=something',
  state: { referrer: someplage.com }
}}>
```

或者，更为简单的：
```javascript
<Redirect to="register" />
```

## 最后
react router v4让开发react应用变得更加的简单。让react应用内的页面跳转更加简单。你只需要声明一个`BrowserRouter`或者`HashRouter`，然后在它的内部放上一系列的`Route`组件，这些主键只要包含`path`和`component`属性。无论何时有了匹配的路由，那么它就会进行非排他的绘制（所有匹配的路由都会绘制）。你也可以把`Route`放在`Switch`组件里来实现排他的绘制（只有第一个匹配的路由会被绘制）。你可以在路径中传递参数，`match`对象会保留这些参数。最后，所有在web中使用的路由组件都包含在`react-router-dom`中。只需要引入`react-router-dom`就可以使用。