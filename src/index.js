
const template = require("babel-template");
const { isObject, defaultOptions, computeOptions, matchesFile, toArray } = require('./api');
// 模版控制 可维护
let tempObject = {
    HAS_VAR: `
        try {
            AWAIT_NAME = AWAIT_FUNC
        } catch (e) {
            console.log(CATCH_ERROR,e)
        }
    `,
    NO_VAR: `
        try {
            AWAIT_FUNC
        } catch (e) {
            console.log(CATCH_ERROR,e)
        }
    `
}

module.exports = function ({ types }) {
    const visitor = {
        AwaitExpression(path) {

            // typeof options == object 
            if (this.opts && !isObject(this.opts)) {
                return console.error(
                    '[babel-await-add-catch]: options need to be an object.'
                );
            }

            const isTryExpression = path.findParent(p => p.isTryStatement());

            // 当父路径已经存在
            if (isTryExpression) {
                return false;
            }

            if (this.opts.exclude) {
                const exclude = toArray(this.opts.exclude);
                this.opts.exclude = exclude.concat(defaultOptions.exclude);
            }

            // 插件选项
            const options = computeOptions(defaultOptions, this.opts);

            const filename = this.filename || this.file.opts.filename || 'unknown'; // 作用域内 可以访问到文件Name 即编译的目标文件

            // 选项内 排除的文件不编译
            if (Array.isArray(options.exclude) && options.exclude.length && matchesFile(options.exclude, filename)) {
                return;
            }
            // 只 编译 included 文件
            if (Array.isArray(options.include) && options.include.length && !matchesFile(options.include, filename)) {
                return;
            }

            let node = path.node;
            const awaitFuncName = node.argument.callee.name;

            /**
             *@description 向顶层找父路径节点 (函数声明 || 箭头函数 || 函数表达式)
             */
            const thisEnvFn = path.findParent(p => p.node.async && (p.isFunctionDeclaration() || p.isArrowFunctionExpression() || p.isFunctionExpression()));

            // 获取 声明 await 函数的 变量
            const declarIdPath = path.getSibling('id');

            const variableDeclaration = declarIdPath && declarIdPath.node ? declarIdPath.node.name : '';

            // 当申明过变量 且 作用域内 不存在该变量
            if (variableDeclaration && !thisEnvFn.scope.hasBinding('$_' + variableDeclaration)) {

                thisEnvFn.scope.push({
                    id: types.identifier('$_' + variableDeclaration),
                    init: null
                });

                for (let i in thisEnvFn.scope.bindings) {
                    let item = path.scope.bindings[i]

                    // 匹配作用域变量 进行替换
                    if (item.identifier.name == variableDeclaration) {
                        // 替换对应的引用
                        item.referencePaths.forEach(function (refItem) {
                            refItem.node.name = '$_' + variableDeclaration;
                        })
                    }
                }
            }

            const tempStrName = variableDeclaration ? "HAS_VAR" : "NO_VAR";
            const temp = template(tempObject[tempStrName]);

            let tempArgumentObj = {
                AWAIT_FUNC: node,
                CATCH_ERROR: types.stringLiteral(awaitFuncName + ' ' + options.customLog)
            }

            // 增加 模版key
            if (tempStrName == "HAS_VAR") {
                tempArgumentObj.AWAIT_NAME = types.identifier('$_' + variableDeclaration);
                // 根据 ast 语法树 结构 分析得来 路径问题
                path.parentPath.parentPath.replaceWith(
                    temp(tempArgumentObj)
                );
            } else {
                path.parentPath.replaceWith(
                    temp(tempArgumentObj)
                );
            }
        }
    }
    return {
        name: 'babel-await-add-catch',
        visitor
    }
}