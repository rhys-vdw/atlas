import test from 'tape-catch';
import { each } from 'lodash/collection';
import { noop } from 'lodash/utility';

import Knex from 'knex';
import Mapper from '../lib/mapper';

const knex = Knex({});

test('Mapper', t => {

  t.test('constructor', t => {

    const mapper = new Mapper();

    t.equal(mapper._mutable, false, 'is immutable');
    t.equal(mapper._query, null, 'query is null');
    t.ok(mapper._options.isEmpty(), 'no options');

    t.end();
  });

  t.test('setOption, getOption', t => {
    const OPTION = 'testOption';
    const VALUE = 'testValue';

    const before = new Mapper();
    const after = before.setOption(OPTION, VALUE);

    t.notEqual(
      before, after,
      'should copy Mapper'
    );

    t.equal(
      after, after.setOption(OPTION, VALUE),
      'should not copy when reassigning the same value'
    );

    t.equal(
      after.getOption(OPTION), VALUE,
      'should be retrievable via `getOption`'
    );

    t.throws(
      () => before.getOption(OPTION),
      'should leave original unchanged (throws on `getOption`)'
    );

    t.end();
  });

  t.test('getOptions', t => {

    const mapper = new Mapper()
      .setOption('a', 'a')
      .setOption('b', 'b')
      .setOption('c', 'c')
      .setOption('d', 'd');

    t.deepEqual(
      mapper.getOptions('a', 'b', 'd'),
      { a: 'a', b: 'b', d: 'd' },
      'can retrieve with varargs syntax'
    );

    t.deepEqual(
      mapper.getOptions(['a', 'c']),
      { a: 'a', c: 'c' },
      'can retrieve with array syntax'
    );

    t.end();
  });

  t.test('extend', t => {

    const OPTION = 'testOption';
    const VALUE = 'testValue';

    const methods = {
      a: function() {},
      b: function() {},
      c: function() {},
    }

    const parent = new Mapper()
      .setOption(OPTION, VALUE);

    const child = parent.extend(methods);

    t.notEqual(
      child.constructor, parent.constructor,
      'child and parent have different classes'
    );

    t.ok(
      child instanceof parent.constructor,
      'child is an instance of parent type'
    );

    t.ok(
      child.a === methods.a &&
      child.b === methods.b &&
      child.c === methods.c,
      'child has assigned methods'
    );

    t.equal(
      child.getOption(OPTION), VALUE,
      'child has parent options'
    );

    t.end();
  });

  t.test('asMutable, asImmutable', t => {

    const OPTION = 'testOption';
    const VALUE_A = 'testValueA';
    const VALUE_B = 'testValueB';

    const mapper = new Mapper();

    t.equal(
      mapper, mapper.asImmutable(),
      '`asImmutable` is a no-op on an immutable instance'
    );

    const mutable = mapper.asMutable();

    t.notEqual(
      mapper, mutable,
      '`asMutable` creates a copy of a mutable instance'
    );

    t.equal(
      mutable, mutable.asMutable(),
      '`asMutable` is a no-op on a mutable instance'
    );

    const mutated = mutable.setOption(OPTION, VALUE_A);

    t.equal(
      mutable, mutated,
      '`setOption` on a mutable instance does not return a copy'
    );

    t.equal(
      mutated.getOption(OPTION), VALUE_A,
      '`setOption` correctly sets value on mutable instance'
    );

    const immutable = mutable.asImmutable();

    t.equal(
      mutable, immutable,
      '`asImmutable` returns the same instance'
    );

    const immutableCopy = immutable.setOption(OPTION, VALUE_B);

    t.notEqual(
      immutable, immutableCopy,
      '`setOption` returns a copy on an immutable instance that was ' +
      'previously mutable...'
    );

    t.equal(
      immutableCopy.getOption(OPTION), VALUE_B,
      '...new instance is set correctly...'
    );

    t.equal(
      immutable.getOption(OPTION), VALUE_A,
      '...previous instance remains unchanged.'
    );

    t.end();
  });

  t.test('withMutations', t => {

    const OPTION = 'OPTION';
    const VALUE = 'VALUE';
    
    const mapper = new Mapper();

    t.equal(
      mapper, mapper.withMutations(),
      'returns self with no arguments'
    );

    t.equal(
      mapper, mapper.withMutations({}),
      'returns self with an empty initializer object'
    );

    let mutatedOnce = null;

    const result = mapper.withMutations(scopedMutable => {

      mutatedOnce = scopedMutable.setOption(OPTION_A, VALUE_A);

      t.equal(
        mutatedOnce, scopedMutable,
        'callback argument is mutable'
      );

    });

    t.equal(
      mutatedOnce, result,
      'mutated instance is returned from `withMutations`'
    );

    t.equal(
      result._mutable, false,
      'returned mutated instance is no longer mutable'
    );

    const mutable = new Mapper().asMutable();

    const alreadyMutableResult = mutable.withMutations(alreadyMutable => {
      t.equal(
        mutable, alreadyMutable,
        'callback is original instance if already mutable'
      );
    });

    t.equal(
      mutable, alreadyMutableResult,
      'returned instance is original instance if already mutable'
    );

    t.equal(
      alreadyMutableResult._mutable, true,
      'returned instance retains its original mutability'
    );

    t.end();
  });

  t.end();
});
