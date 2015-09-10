
// Extend Test here.

var Test = require('tape/lib/test');
var _ = require('lodash');

function omitUndefined(object) {
  if (!_.isObject(object)) return object;
  return _(object).omit(_.isUndefined).mapValues(omitUndefined).value();
}

Test.prototype.deepEqualDefined = function(a, b, msg) {
  this.deepEqual(omitUndefined(a), omitUndefined(b), msg);
}

require('./relation-tree');
