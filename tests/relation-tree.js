import _ from 'lodash';
import test from 'tape';

import RelationTree, {
  isRelationTree,
  fromString,
  normalize
} from '../lib/relation-tree';

test('RelationTree', (t) => {

  t.test('isRelationTree', (t) => {
    var tree = new RelationTree();
    t.ok(RelationTree.isRelationTree(tree),
      'correctly identifies a RelationTree'
    );

    t.end();
  });

  t.test('fromString', (t) => {

    const initializerFn = function() {};

    const tests = {
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
        output: { test: { recursions: 1 } }
      },
      'default recursive depth "test^"': {
        input: ['test^'],
        output: { test: { recursions: 1 } }
      },
      'infinite recursion "test^Infinity"': {
        input: ['test^Infinity'],
        output: { test: { recursions: Infinity } }
      },
      'recursion with further nesting "test^2.other"': {
        input: ['test^2.other'],
        output: { test: { recursions: 2, nested: { other: {} } } }
      }
    }

    _.each(tests, (item, message) => {
      t.deepEqualDefined(
        fromString(...item.input),
        item.output,
        message
      );
    })

    t.throws(() => fromString(), TypeError,
      'Throws `TypeError` without argument'
    );

    t.throws(() => fromString(5), TypeError,
      'Throws `TypeError` with non-string argument'
    );

    t.end();
  });

  t.test('normalize', (t) => {

    const initializerFnA = function() {};
    const initializerFnB = function() {};

    const tests = {
      'with no arguments': {
        input: [],
        output: {}
      },
      'with nested empty arrays and objects': {
        input: [[[[{}, {}], {}],[]]],
        output: {}
      },
      'with single string relation': {
        input: ['test'],
        output: { test: {} }
      },
      'with single string in array': {
        input: [['test']],
        output: { test: {} }
      },
      'with two strings': {
        input: ['a', 'b'],
        output: { a: {}, b: {} }
      },
      'with an array of two strings': {
        input: [['a', 'b']],
        output: { a: {}, b: {} }
      },
      'an object {[relation]: initializer}': {
        input: [{a: initializerFnA, b: initializerFnB}],
        output: {
          a: { initializer: initializerFnA },
          b: { initializer: initializerFnB }
        }
      },
      'an array with single string and an object': {
        input: ['a', {b: initializerFnB}],
        output: {
          a: {}, b: { initializer: initializerFnB }
        }
      },
      'two relations from a common child': {
        input: ['a.b', 'a.c'],
        output: {
          a: { nested: { b: {}, c: {} } }
        }
      },
      'two relations from a common child, one with initializer': {
        input: ['a.b', {'a.c': initializerFnA}],
        output: {
          a: { nested: { b: {}, c: { initializer: initializerFnA } } }
        }
      },
      'merges two `RelationTree` instances': {
        input: [fromString('a.b'), fromString('a.c')],
        output: {
          a: { nested: { b: {}, c: {} } }
        }
      }
    };

    _.each(tests, (item, message) => {
      t.deepEqualDefined(
        normalize(...item.input),
        item.output,
        message
      );
    })

    t.end();

  });
});
