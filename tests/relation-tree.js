_ = require('lodash');
test = require('tape');

RelationTree = require('../lib/relation-tree');

test('RelationTree', function(t) {

  t.test('fromString', function(t) {

    initializerFn = function() {};

    tests = {
      'with single string input': {
        input: ['test'],
        output: { test: {} }
      },
      'with nested relations': {
        input: ['a.b.c.d'],
        output: { a: { nested: { b: { nested: { c: { nested: { d: {} } } } } } } }
      },
      'with an initializer': {
        input: ['test', initializerFn],
        output: { test: { initializer: initializerFn } }
      },
      'nested with an initializer': {
        input: ['a.b', initializerFn],
        output: { a: { nested: { b: { initializer: initializerFn } } } }
      },
      'simple recursive relation "test^1"': {
        input: ['test^1'],
        output: {
          test: {
            nested: {
              test: { recursions: 1 }
            }
          }
        }
      },
      'default recursive depth "test^"': {
        input: ['test^'],
        output: {
          test: {
            nested: {
              test: { recursions: 1 }
            }
          }
        }
      },
      'infinite recursion "test^Infinity"': {
        input: ['test^Infinity'],
        output: {
          test: {
            nested: {
              test: { recursions: Infinity }
            }
          }
        }
      },
      'recursion with further nesting "test^2.other"': {
        input: ['test^2.other'],
        output: {
          test: {
            nested: {
              test: { recursions: 2, nested: { other: {} } }
            }
          }
        }
      }
    }

    _.each(tests, function (item, message) {
      t.deepEqualDefined(
        RelationTree.fromString.apply(null, item.input),
        item.output,
        message
      );
    })

    t.end();
  });
});
