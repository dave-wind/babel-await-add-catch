const core = require('@babel/core');
let types = require("@babel/types");
const template = require("babel-template");


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

function getScopeDeclaration(path) {
    let declaration = [];
    // visitor
    path.traverse({
        ThisExpression(path) {
            declaration.push(path);
        }
    });
    return declaration;
}

let addTryExpressionByAwait = {
    visitor: {
        AwaitExpression(path) {
            console.log('-------------');
            const isTryExpression = path.findParent(p => p.isTryStatement());

            // 当父节点已经存在
            if (isTryExpression) {
                return false;
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
                            // if (refItem.node.name == variableDeclaration) {

                            // }
                            refItem.node.name = '$_' + variableDeclaration;
                        })
                    }
                }
            }

            const tempStrName = variableDeclaration ? "HAS_VAR" : "NO_VAR";
            const temp = template(tempObject[tempStrName]);

            let tempArgumentObj = {
                AWAIT_FUNC: node,
                CATCH_ERROR: types.stringLiteral(awaitFuncName + ' catch error----')
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

            // path.parentPath.parentPath.replaceWith(
            //     types.tryStatement(
            //         types.blockStatement(
            //             [
            //                 types.expressionStatement(
            //                     types.assignmentExpression(
            //                         '=',
            //                         types.identifier('_' + awaitName),
            //                         types.awaitExpression(
            //                             types.callExpression(
            //                                 types.identifier(awaitFuncName),
            //                                 []
            //                             )
            //                         )
            //                     )
            //                 )
            //             ]
            //         )
            //     )
            // );
        }
    }
};


let sourceCode = `
async function demo() {
    var b = 1
	const result = await handlePromise();
	return result + b;
}
`;

let targetSource = core.transform(sourceCode, {
    plugins: [addTryExpressionByAwait]
});

console.log(targetSource.code)