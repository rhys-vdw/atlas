import test from 'tape';
import { omit } from 'lodash/object';

import ImmutableBase from '../../lib/immutable-base';

test('ImmutableBase', t => {

  t.test('ImmutableBase#setState()', t => {
    const KEY = 'testKey';
    const VALUE = 'testValue';

    const before = new ImmutableBase();
    const after = before.setState({ [KEY]: VALUE });

    t.notEqual(
      before, after,
      'should create a copy'
    );

    t.notEqual(
      before.state, after.state,
      'should have a different options object'
    );

    t.equal(
      after, after.setState({ [KEY]: VALUE }),
      'should not copy when reassigning the same value'
    );

    t.equal(
      after.state[KEY], VALUE,
      'has correct state'
    );

    t.throws(
      () => before.requireState(KEY),
      'should leave original unchanged (throws on `requireState`)'
    );

    t.end();
  });

  t.test('ImmutableBase#extend()', t => {

    const KEY = 'testKey';
    const VALUE = 'testValue';

    const methods = {
      a: function() {},
      b: function() {},
      c: function() {},
    };

    const parent = new ImmutableBase()
      .setState({ [KEY]: VALUE });

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
      child.requireState(KEY), VALUE,
      'child has parent options'
    );

    t.end();
  });

  t.test('ImmutableBase#asMutable(), ImmutableBase#asImmutable()', t => {

    const KEY = 'KEY';
    const VALUE_A = 'VALUE_A';
    const VALUE_B = 'VALUE_B';

    const options = new ImmutableBase({ a: 'a', b: 'b' });

    t.equal(
      options, options.asImmutable(),
      '`asImmutable` is a no-op on an immutable instance'
    );

    const mutable = options.asMutable();

    t.notEqual(
      options, mutable,
      '`asMutable` creates a copy of an immutable instance'
    );

    t.notEqual(
      options.state, mutable.state,
      'mutable copy has a different `state` instance'
    );

    t.deepEqual(
      omit(options.state, 'isMutable'),
      omit(mutable.state, 'isMutable'),
      'mutable copy has the same options set (other than `isMutable`)'
    );

    t.equal(
      mutable, mutable.asMutable(),
      '`asMutable` is a no-op on a mutable instance'
    );

    const withOption = mutable.setState({ [KEY]: VALUE_A });

    t.equal(
      mutable, withOption,
      '`setState` on a mutable instance does not return a copy'
    );

    t.equal(
      withOption.requireState(KEY), VALUE_A,
      '`setState` correctly sets value on mutable instance'
    );

    const immutable = mutable.asImmutable();

    t.equal(
      mutable, immutable,
      '`asImmutable` returns the same instance'
    );

    const immutableWithOption = immutable.setState({ [KEY]: VALUE_B });

    t.notEqual(
      immutable, immutableWithOption,
      '`setState` returns a copy on an immutable instance that was ' +
      'previously mutable...'
    );

    t.equal(
      immutableWithOption.requireState(KEY), VALUE_B,
      '...new instance is set correctly...'
    );

    t.equal(
      immutable.requireState(KEY), VALUE_A,
      '...previous instance remains unchanged.'
    );

    t.end();
  });

  t.test('ImmutableBase#withMutations()', t => {

    const KEY = 'KEY';
    const VALUE = 'VALUE';

    const options = new ImmutableBase();

    t.equal(
      options, options.withMutations(),
      'returns self with no arguments'
    );

    t.equal(
      options, options.withMutations({}),
      'returns self with an empty initializer object'
    );

    let mutatedOnce = null;

    const result = options.withMutations(scopedMutable => {

      mutatedOnce = scopedMutable.setState({ [KEY]: VALUE });

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
      result.isMutable(), false,
      'returned mutated instance is no longer mutable'
    );

    const mutable = new ImmutableBase().asMutable();

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
      alreadyMutableResult.isMutable(), true,
      'returned instance retains its original mutability'
    );

    t.end();
  });
});
