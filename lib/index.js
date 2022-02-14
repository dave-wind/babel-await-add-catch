"use strict";

const template = require("babel-template"); // 模版控制 可维护


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
};

module.exports = function ({
  types
}) {
  const visitor = {
    AwaitExpression(path) {
      const isTryExpression = path.findParent(p => p.isTryStatement());

      if (isTryExpression) {
        return false;
      }

      let node = path.node;
      const awaitFuncName = node.argument.callee.name;
      const thisEnvFn = path.findParent(path => path.isFunction() || path.isArrowFunctionExpression()); // 获取 声明 await 函数的 变量

      const declarIdPath = path.getSibling('id');
      const variableDeclaration = declarIdPath && declarIdPath.node ? declarIdPath.node.name : ''; // 删除
      // path.parentPath.remove();
      // 当申明过变量 且 作用域内 不存在该变量

      if (variableDeclaration && !thisEnvFn.scope.hasBinding('_' + variableDeclaration)) {
        thisEnvFn.scope.push({
          id: types.identifier('_' + variableDeclaration),
          init: null
        });
      }

      const tempStrName = variableDeclaration ? "HAS_VAR" : "NO_VAR";
      const temp = template(tempObject[tempStrName]);
      let tempArgumentObj = {
        AWAIT_FUNC: node,
        CATCH_ERROR: types.stringLiteral(awaitFuncName + ' catch error----')
      }; // 增加 模版key

      if (tempStrName == "HAS_VAR") {
        tempArgumentObj.AWAIT_NAME = types.identifier('_' + variableDeclaration); // 根据 ast 语法树 结构 分析得来 路径问题

        path.parentPath.parentPath.replaceWith(temp(tempArgumentObj));
      } else {
        path.parentPath.replaceWith(temp(tempArgumentObj));
      }
    }

  };
  return {
    name: 'babel-await-add-catch',
    visitor
  };
};