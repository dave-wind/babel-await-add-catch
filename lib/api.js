"use strict";

const defaultOptions = {
  customLog: 'catch error---',
  exclude: ['node_modules'],
  include: []
};

function computeOptions(defaultOptions, userOptions = {}) {
  return Object.assign({}, defaultOptions, userOptions);
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
} // 判断 执行的file文件 是否 包含 (options 选项 ex/include 内) 


function matchesFile(patterns, filename) {
  return patterns.some(pattern => filename.includes(pattern));
}

function toArray(value) {
  return !value || Array.isArray(value) ? value : [value];
}

module.exports = {
  defaultOptions,
  isObject,
  matchesFile,
  computeOptions,
  toArray
};