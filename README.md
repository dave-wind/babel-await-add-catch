### Babel-Await-Add-Catch
> Babel plugin helps automatically add try catch and console when encountering await

#### Install
```js
 npm install babel-await-add-catch --D
```

#### Use
```js
Via .babelrc.js or babel.config.js or babel-loader:

{
  "plugins": [["babel-await-add-catch", options]]
}


babel.config.js:

module.exports = {
    "plugins": [
        [
            require('babel-await-add-catch'),
            {
                "exclude": ['exclude'],
                "include": ['index','index2'],
                "customLog": 'My name is Dave Jones'
            }
        ]
    ]
};

```

#### options
> options need to be an object.
```js
{
    "exclude": [], // default: ["node_modules"]  // 不被编译的文件
     "include": [], // babel 编译 需要的 js文件
     "customLog": '' // default： "catch error---"  // 自定义log string 
}
```

#### Example
> From
```js
const demo = async () => {
    var dddd = 2;
    var b = await handlePromise();
    return dddd + b;
}
```
> To
```js
const demo = async () => {
  var $_b;
  var dddd = 2;

  try {
    $_b = await handlePromise();
  } catch (e) {
    console.log("handlePromise catch error---", e);
  }

  return dddd + $_b;
};

```
#### 实现思路 
> 见 issues
