
// Extend Test here.

import { Test } from 'tape';
import _, { isObject } from 'lodash';

function omitUndefined(object) {
  if (!isObject(object)) return object;
  return _(object).omit(_.isUndefined).mapValues(omitUndefined).value();
}

Test.prototype.deepEqualDefined = function(a, b, msg) {
  this.deepEqual(omitUndefined(a), omitUndefined(b), msg);
}

require('./relation-tree');
require('./mapper');
