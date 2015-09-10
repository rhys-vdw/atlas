import _ from 'lodash';
import test from 'tape';

import RelationTree, {
  isRelationTree,
  fromString,
  compile,
  normalize,
  renestRecursives
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
      'throws `TypeError` without argument'
    );

    t.throws(() => fromString(5), TypeError,
      'throws `TypeError` with non-string argument'
    );

    t.end();
  });

  t.test('compile', (t) => {

    const initializerFnA = function() {};
    const initializerFnB = function() {};

    const tests = {
      'with no arguments': {
        input: [],
        output: {}
      },
      'with nested empty arrays, empty objects and `null` values': {
        input: [[[[{}, {}], {}],[null, null]]],
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
      },
      'merges recursive relations': {
        input: ['a^.b', 'a^.c^2'],
        output: {
          a: { recursions: 1, nested: { b: {}, c: { recursions: 2 } } }
        }
      }
    };

    _.each(tests, (item, message) => {
      t.deepEqualDefined(
        compile(...item.input),
        item.output,
        message
      );
    })

    t.end();
  });

  t.test('renestRecursives', (t) => {

    const tests = {
      'simple recursive': {
        input: [fromString('a^')],
        output: {
          a: { recursions: 1, nested: { a: { recursions: 0 } } }
        }
      },
      'infinite recursive': {
        input: [fromString('a^Infinity')],
        output: {
          a: { recursions: Infinity, nested: { a: { recursions: Infinity } } }
        }
      },
      'two sibling recursives': {
        input: [compile('a^3', 'b^99')],
        output: {
          a: { recursions: 3, nested: { a: { recursions: 2 } } },
          b: { recursions: 99, nested: { b: { recursions: 98 } } },
        }
      },
      'preserve nesting after recursive': {
        input: [fromString('a^2.b^2')],
        output: {
          a: {
            recursions: 2,
            nested: {
              a: {
                recursions: 1,
                nested: { b: { recursions: 2 } }
              }
            }
          }
        }
      },
      'do not renest recursives with recursion count 0': {
        input: [fromString('a^0')],
        output: {
          a: { recursions: 0 }
        }
      },
      'do not renest recursives that are already nested': {
        input: [
          new RelationTree({
            a: { recursions: 2, nested: { a: { recursions: 1 } } }
          })
        ],
        output: {
          a: { recursions: 2, nested: { a: { recursions: 1 } } }
        }
      }
    };

    _.each(tests, (item, message) => {
      t.deepEqualDefined(
        renestRecursives(...item.input),
        item.output,
        message
      );
    })

    const invalidRecursiveTree = new RelationTree({
      a: { recursions: 1, nested: { a: { recursions: 1 } } }
    })

    t.throws(() => renestRecursives(invalidRecursiveTree),
      'throws when given an invalid recursive tree'
    );

    t.end();
  });

  t.test('normalize', (t) => {

    const initializerFnA = function() {};
    const initializerFnB = function() {};

    const tests = {
      'normalizes a complex expression': {
        input: [
          'a.b',
          {'a.c.d': initializerFnA},
          {e: initializerFnB },
          'f^5'
        ],
        output: {
          a: {
            nested: {
              b: {},
              c: { nested: { d: { initializer: initializerFnA } } }
            }
          },
          e: { initializer: initializerFnB },
          f: {
            recursions: 5,
            nested: {
              f: { recursions: 4 }
            }
          }
        }
      }
    }

    _.each(tests, (item, message) => {
      t.deepEqualDefined(
        normalize(...item.input),
        item.output,
        message
      );
    })

    const normalized = normalize('a.b.c', 'a.c.d');

    t.equal(normalized, normalize(normalized),
      'does nothing to an already normalized tree'
    );

    t.end();
  });
});
