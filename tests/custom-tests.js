/* eslint no-console: 0 */
/* allow console here because there are some issues below. */

import { Test } from 'tape';
import _, { isObject, isString } from 'lodash';
import { map, keys } from 'lodash';
import deepEqual from 'deep-equal';
import Promise from 'bluebird';

function omitUndefined(object) {
  if (!isObject(object)) return object;
  return _(object).omit(_.isUndefined).mapValues(omitUndefined).value();
}

function compactWhitespace(string) {
  return string
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
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

function testPromise(promise) {
  if (promise == null || !('then' in promise)) {
    return Promise.reject(
      new TypeError(`promise was not 'thenable', got: ${promise}`)
    );
  }
  return promise;
}

Test.prototype.resolvesTo = function(promise, expected, message, extra) {

  if (!message) {
    message = 'resolves promise';
  }

  let passed = false;
  let actual;
  let error;

  return testPromise(promise).then(result => {
    passed = result === expected;
    actual = result;
  }).catch(err => {
    error = err;
    actual = err;
  }).finally(() => {
    this._assert(error == null && passed, {
      message,
      operator: 'resolvesTo',
      actual,
      expected,
      error,
      extra
    });
  });
};

Test.prototype.resolvesToDeep = function(promise, expected, message, extra) {

  if (!message) {
    message = 'resolves promise';
  }

  let passed = false;
  let actual;
  let error;

  return testPromise(promise).then(result => {
    passed = deepEqual(result, expected);
    actual = result;
  }).catch(err => {
    error = err;
    actual = error.toString();
  }).finally(() => {
    this._assert(error == null && passed, {
      message,
      operator: 'resolvesToDeep',
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

  let caughtPromise = null;
  if (ErrorType) {
    caughtPromise = testPromise(promise).catch(ErrorType, error => {
      caught = error;
      passed = true;
    });
  } else {
    caughtPromise = testPromise(promise).catch(error => {
      caught = error;
      passed = true;
    });
  }

  return caughtPromise.then(result => {
    this._assert(passed, {
      message,
      operator: 'rejects',
      actual: caught ? caught.toString() : result,
      expected: ErrorType || Error,
      error: !passed && caught,
      extra
    });
  });
};


Test.prototype.databaseTest = function(name, knex, tables, testCallback) {

  const createTables = map(tables, (createTable, name) =>
    knex.schema.createTable(name, createTable)
  );

  const dropTables = map(keys(tables), table =>
    knex.schema.dropTable(table)
  );

  this.test(name, t => {

    Promise.all(createTables)
    .then(    () => testCallback(t))
    .finally( () => Promise.all(dropTables))
    .then(    () => t.end())
    .catch(error => t.end(error));

  });
};

