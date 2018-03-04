## 如何在NodeJS项目中优雅的使用ES6

NodeJs最近的版本都开始支持ES6（ES2015）的新特性了，设置已经支持了async／await这样的更高级的特性。只是在使用的时候需要在node后面加上参数：`--harmony`。但是，即使如此node也还是没有支持全部的ES6特性。所以这个时候就需要用到[Babel](https://babeljs.io/)了。

### 现在开始Babel
在开始使用Babel之前，假设
1. 你已经安装了nodejs，并且已经熟悉了Js。
2. 你也可以使用*npm*安装各种依赖包。
3. 而且你也对ES6（后来改为ES2015）有一定程度的熟悉。

同时假设你已经安装了[**yarn**](https://yarnpkg.com/)，并且也熟悉了yarn。Yarn最大的优点就是它比*npm*要快很多，因为yarn只把需要的库下载一次，之后用到的时候直接使用本地缓存的版本。npm每次都会下载这些库。这简直就是浪费生命。如果你还没有安装yarn，也没有关系，下面也会有npm的使用方法。

接下来开始安装配置Babel。安装babel-cli
```
yarn add babel-cli --dev   // npm install --save-dev babel-cli
```
安装babel的presets。
```
yarn add babel-preset-es2015 --dev    // npm install --save-dev babel-preset-es2015
```
这个时候你就可以使用ES2015的特性了。但是，这还不够，比如我不想用`Promise`我想用更加方便的`async/await`语法。只有es2015这个preset是不够的。

#### Babel的plugin和preset
Babel本身不处理语言特性的转码。这些功能都是由**plugin**和**preset**实现的（preset也是一个plugin的集合）。如上文所述，要使用es2015的内容就需要安装*babel-preset-es2015*这个preset。要使用async/await那么就需要安装对应的preset或者插件。为了简单我们安装preset：`babel-preset-stage-0`。preset *stage-0*包含了async/await相关的插件: *babel-plugin-syntax-async-functions*、*babel-plugin-transform-regenerator*。
```
yarn add babel-preset-stage-0 --dev // npm install --save-dev babel-preset-stage-0
```
这样还是不能在项目中使用es7的async/await了。还需要更多的配置，有两种方法可以达到目的：
1. 使用`babel-polyfill`。有一个不好地地方，`babel-polyfill`会污染global对象，所以不适合于library之类的使用。仅适合于web app使用。
2. 使用babel运行时转码工具，`transform-runtime`插件。使用这个方法正好弥补了上面的方法的不足之处。它是尤其适合于library一类的项目使用。

分别介绍这两种方法。
安装`babel-polyfill`:
```
yarn add babel-polyfill --dev // npm install --save-dev babel-polyfill
```
之后，在你的项目的入口文件的最上方引入`babel-polyfill`。比如我现在有一个Express的Web App，那么的入口文件就是开启这个app的*index.js*文件。在这个文件的最上方引入polyfill，`require('babel-polyfill')`。或者你的入口文件已经是ES2015的写法了，那么就直接import，`import 'babel-polyfill'`。

使用`transform-runtime`也非常简单。安装：
```
yarn add babel-plugin-transform-runtime --dev // npm install --save-dev babel-plugin-transform-runtime
```
另外还需要安装`babel-runtime`:
```
yarn add babel-runtime  // npm install --save babel-runtime
```
之后在*.babelrc*文件中添加如下的配置，两个二选其一即可：
```javascript
// without options
{
  "plugins": ["transform-runtime"]
}

// with options
{
  "plugins": [
    ["transform-runtime", {
      "helpers": false, // defaults to true
      "polyfill": false, // defaults to true
      "regenerator": true, // defaults to true
      "moduleName": "babel-runtime" // defaults to "babel-runtime"
    }]
  ]
}
```
剩下的就是欢畅的使用*async/await*了。

另外如果要使用`Object.assing`这样的方法的话，也可以使用插件：`babel-plugin-transform-object-assign`，如果要使用解构赋值可以使用插件：`babel-plugin-transform-object-rest-spread`。当然这些都包含在了*stage-0*这个preset中。

现在就开始写ES2015的代码吧。在项目中安装ExpressJs，创建一个*index.js*文件。我们来试着创建一个小小的web app作为练习：
```javascript
import Express from 'express'

let app = Express()

app.get('/', (req, res) => {
  res.send('hello world')
})

app.listen(8080, () => console.log('server is running at http://localhost:8080'))
```
运行命令：
```javascript
./node_modules/.bin/babel-node index.js --preset es2015, stage-0
```
使用命令*babel-node**就可以让代码运行起来，后面的参数指定了在转义js代码的时候使用的preset和plugin。

Babel官方推荐的方法是时候用*.babelrc*文件，这一方式可以更加灵活。在项目的更目录上创建*.babelrc*文件，在里面添加你安装的preset和plugin的描述：
```javascript
{
    "presets": ["es2015", "stage-0"]
}
```
这样可以直接使用*babel-node*来执行代码，或者使用命令*babel*来转义代码。如：
```javascript
babel -w code/ -d build/
```
**babel**命令会从配置文件中读取配置，来变异*code/*目录下的文件，并把转义之后的JavaScript文件导出到*build/*目录下。还有命令行里的参数*-w*，这个命令参数指定的是**watch**，每次code目录的文件修改后都会触发babel命令的再次执行。

#### 在文件中使用Source Maps
上面看起来很不错了。但是还有一个问题，在你调试代码的时候，你调试的实际是**babel**命令转码之后的js，不是原来你编写的源代码所在的文件。调试的不是源文件，多少会有些不便。比如下面的文件会抛出一个异常：
```javascript
async function errorAsyncFunc() {
  try{
    throw new Error('Async function error')
  } catch(e) {
    throw e
  }
}

errorAsyncFunc()
```
在转码命令中加一个`--source-maps`可以解决这个问题：
```javascript
babel code/ -d build/ --source-maps
```

最后在*package.json*里添加scripts节点：
```javascript
"scripts": {
  "build": "babel src -d build --source-maps",
  "start": "node build/index.js"
},
```
接下来：
```
npm run build
```

### Gulp出场
上文讲述了如何使用Babel实现ES201x的开发。但是在正式的开发中，上面的这些配置还略显不足，尤其是你的项目包括web端、server端，尤其web端不仅处理ES201x的代码还需要处理。所以需要Gulp出场。

这玩意儿看起来很复杂，你定义了编译的过程。其实掌握了以后很好用，尤其是可以自动处理很多东西，节约大把时间。要使用Gulp，必须先安装NodeJS。这个基本是标配。然后你会用到它的命令行工具。

#### 安装Gulp
在最新发布的Gulp里有一点调整。gulp-cli从gulp分离出来作为单独的一部分使用。所以，如果你已经安装过gulp之前的版本需要先删除：
```
npm rm --global gulp
```
**安装gulp-cli**
```
yarn global add gulp-cli  // npm install --global gulp-cli
```
**在--dev模式下安装gulp**
```
yarn add gulp --dev     // npm install --save-dev gulp
```

#### 创建gulp配置文件
就像Babel要用*.babelrc*作为配置文件一样，gulp也需要一个配置文件。这个配置文件就是*gulpfile.js*, 但是和babel同用的情况下把*gulpfile.js*重命名为*gulp.babel.js*：
```
mv "gulpfile.js" "gulpfile.babel.js"
```

`gulp`的使用还是很简单的，主要就是在*gulpfile.babel.js*文件中添加各种task。在这些task中一定要添加一个叫做**default**的task，gulp命令的执行起点就是从这里开始。

假设有这么一个场景：

1. 使用eslint检查代码，发现代码风格和潜在的错误。
2. 自动实现ES201x -> ES5的代码转码，并把转码后的代码放在指定目录下。
3. 在转码的时候添加sourcemaps。

以上这些“任务”都是用gulp自动实现。该如何配置呢？

#### gulp和eslint
要在gulp中使用各种请他的类似于eslint这样的功能的时候需要使用在gulp上的对应的插件。没错，gulp的设计思路和gulp基本一样：插件机制。

那么我们就需要首先下载[eslint的插件](https://github.com/adametry/gulp-eslint)：
```
yarn add --dev gulp-eslint    // npm install --save-dev gulp-eslint
```
在开始编写我们的第一个task之前, 做最后的准备工作。首先需要配置*.eslintrc*文件。eslint会根据这个文件定义的规则检查代码的风格。我们不准备大批的配置规则，这样非常耗时间而且也照顾不到很多我们项目已经保留下来的编码风格。所以，airbnb的一套规则拿来使用时最好的办法。

##### 安装eslint
```
yarn add --dev eslint  // npm install --save-dev eslint
```
然后你可以运行命令来初始化配置：`./node_modules/.bin/eslint --init`。你也可以忽略这个命令，直接创建一个*.eslintrc*的文件。

##### 安装eslint的airbnb扩展
要使用airbnb的一套规则就需要安装他们的eslint扩展：
```
yarn add eslint-config-airbnb --dev  // npm install --save-dev eslint-config-airbnb
```
命令执行之后会提示有些依赖项没有安装，分别是`eslint-plugin-import@^2.2.0`、`eslint-plugin-import@^2.2.0`、`eslint-plugin-jsx-a11y@^3.0.2`。依次安装这些依赖项就好。

##### .eslintrc
```javascript
{
  "env": {
    "es6": true
  },
  "rules": {
    "semi": "off",
    "import/no-extraneous-dependencies": ["error", {
      "devDependencies": true, 
      "optionalDependencies": false, 
      "peerDependencies": false
    }]
    ,"quotes": ["error", "single", {"allowTemplateLiterals": true}]
  },
  "extends": "airbnb"
}
```
`env`指定环境是支持es6的，rules指定的是一些补充内容，比如字符串使用单引号还是双引号等。这个是根据个人喜好配置的，你可以选择添加你需要的规则。最后是`extends`，这里配置airbnb就用上了airbnb的一套eslint编码检查规则。

##### gulp-eslint插件用起来

```javascript
import gulp from 'gulp'
import eslint from 'gulp-eslint

// 配置需要处理的文件目录和转码之后文件的存放目录
const paramConfig = {
  source: 'src/**/*.js',
  dest: 'build',
}
```
引入相关模块之后开始写任务：
```javascript
gulp.task('lint', () => {
  // eslint配置，使用配置的文件目录。排除node_modules下的全部文件。
  return gulp.src([paramConfig.source, '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.result(result => {
      console.log(`ESLint result: ${result.filePath}`);
      console.log(`# Messages: ${result.messages.length}`);
      console.log(`# Warnings: ${result.warningCount}`);
      console.log(`# Errors: ${result.errorCount}`);
    }))
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
})
```
如前文所述，*default*任务是必须：
```javascript
gulp.task('default', ['lint'], function () {
    // lint任务成功执行之后执行这个方法
});
```

跳转到项目的目录下，运行gulp命令。会得到如下的输出：
```
$ gulp
[21:43:01] Requiring external module babel-register
[21:43:01] Using gulpfile ~/Documents/test-polyfill/gulpfile.babel.js
[21:43:01] Starting 'lint'...
[21:43:02] Starting 'babel-sourcemaps'...
ESLint result: ~/Documents/test-polyfill/src/index.js
# Messages: 0
# Warnings: 0
# Errors: 0
ESLint result: ~/Documents/test-polyfill/src/test.js
# Messages: 0
# Warnings: 0
# Errors: 0
[21:43:02] Finished 'lint' after 605 ms
[21:43:02] Finished 'babel-sourcemaps' after 653 ms
[21:43:02] Starting 'default'...
gulp default task!
[21:43:02] Finished 'default' after 98 μs
```

#### gulp和babel
这次同时处理babel和sourcemaps的问题。
首先安装插件：
```
yarn add --dev gulp-babel   // npm install --save-dev gulp-babel
```

`import` gulp-babel插件：
```javascript
import babel from 'gulp-babel'
import sourcemaps from 'gulp-sourcemaps'
```

添加任务：
```javascript
gulp.task('babel-sourcemaps', () => {
  return gulp.src(paramConfig.source)  
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paramConfig.dest))
})
```
 修改*default*任务：
 ```javascript
gulp.task('default', ['lint', 'babel-sourcemaps'], () => {
  console.log('gulp default task!')
})
 ```

如果你不想用sourcemaps的话，可以这么写：
 ```javascript
gulp.task('babel', () => {
  return gulp.src(paramConfig.source)
    .pipe(babel())
    .pipe(gulp.dest(paramConfig.dest))
})
 ```


### 把gulp放在npm命令体系下

`babel`老早就配置好了，现在和配置好了gulp。gulp每次输入命令基本上就是手动执行。现在应该让这个命令半自动执行了。

修改*package.json*文件，在其中添加`scripts`节点：
```javascript
  "scripts": {
    "build": "gulp",
    "start": "node build/index.js"
  },
```

如此一来，很多的命令都可以像gulp一样放在npm的scripts里执行。比如，现在可以在命令行李输入如下命令来实现`lint`和`babel`转码：
```
npm run build
```

开始执行：
```
npm start
```

### 总结
使用bebel可以提前使用最新的JavaScript语言特性，这样编写很多代码的时候会变得简洁高效。并且babel转码之后生成的代码也是非常规范的ES5写法，同时是在严格模式下的。所以，我们在写ES201x代码的时候不需要再添加`'use strict';`标识。

使用gulp又可以使很多不大不小但是很费时间的事自动处理。

把这两者结合在一起会让你的项目开发效率提升很多。所以，看到这里你不觉得你应该赶快在项目里使用这些技术，让开发进入快车道吗！！！？？？



