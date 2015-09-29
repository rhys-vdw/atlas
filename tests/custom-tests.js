import { Test } from 'tape';
import _, { isObject, isString } from 'lodash';
import deepEqual from 'deep-equal';

function omitUndefined(object) {
  if (!isObject(object)) return object;
  return _(object).omit(_.isUndefined).mapValues(omitUndefined).value();
};

function compactWhitespace(string) {
  return string
    .replace(/\s+/g, ' ')
    .replace(/^\s+/g, '')
    .replace(/\s+$/g, '');
}

Test.prototype.deepEqualDefined = function(a, b, msg) {
  this.deepEqual(omitUndefined(a), omitUndefined(b), msg);
};

Test.prototype.queriesEqual = function(a, b, message = 'query as expected') {
  this.equal(
    compactWhitespace(a.toString()),
    compactWhitespace(b.toString()),
    message
  );
};

Test.prototype.resolvesTo = function(promise, expected, message, extra) {

  if (!message) {
    message = 'resolves promise';
  }

  let passed = false;
  let actual;
  let error;

  Promise.resolve(promise)
  .then(result => {
    passed = deepEqual(result, expected);
    actual = result;
  }).catch(err => {
    // TOOD: work out how to get tape to display error.
    console.error('error caught!', err);
    error = err;
  }).then(() => {
    this._assert(passed, {
      message,
      operator: 'resolvesTo',
      actual,
      expected,
      error,
      extra
    });
  });

};

Test.prototype.rejects = function(promise, ErrorType, message, extra) {
  if (isString(ErrorType)) {
    message = ErrorType;
    ErrorType = null;
  }

  if (!message) {
    message = 'rejects promise';
  }

  let passed = false;
  let caught = null;

  if (ErrorType) {
    promise = promise.catch(ErrorType, (error) => {
      caught = error;
      passed = true;
    });
  }

  promise.catch((error) => {
    caught = error;
    passed = true;
  }).then(() => {
    this._assert(passed, {
      message,
      operator: 'rejects',
      actual: caught,
      expected: ErrorType || Error,
      error: !passed && caught,
      extra
    });
  });
};


