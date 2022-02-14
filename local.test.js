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
            console.log('---------------');
            const isTryExpression = path.findParent(p => p.isTryStatement());
            // 
            if (isTryExpression) {
                return false;
            }
            let node = path.node;
            const awaitFuncName = node.argument.callee.name;
            const thisEnvFn = path.findParent(path => path.isFunction() || path.isArrowFunctionExpression());

            // 获取 声明 await 函数的 变量
            const declarIdPath = path.getSibling('id');

            const variableDeclaration = declarIdPath && declarIdPath.node ? "_" + declarIdPath.node.name : '';
            // 删除
            // path.parentPath.remove();

            // 创建变量 在函数体内 第一行
            if (variableDeclaration && !thisEnvFn.scope.hasBinding(variableDeclaration)) {
                thisEnvFn.scope.push({
                    id: types.identifier(variableDeclaration),
                    init: null
                });
            }

            const tempStrName = variableDeclaration ? "HAS_VAR" : "NO_VAR";
            const temp = template(tempObject[tempStrName]);

            let tempArgumentObj = {
                AWAIT_FUNC: node,
                CATCH_ERROR: types.stringLiteral(awaitFuncName + ' catch error----')
            }

            // 增加 模版key
            if (tempStrName == "HAS_VAR") {
                tempArgumentObj.AWAIT_NAME = types.identifier(variableDeclaration);
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
	const result = await handlePromise();
	return result;
}
`;

let targetSource = core.transform(sourceCode, {
    plugins: [addTryExpressionByAwait]
});

console.log(targetSource.code)