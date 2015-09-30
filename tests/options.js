import test from 'tape';
import { omit } from 'lodash/object';

import Options from '../lib/options';

test('Options', t => {

  t.test('Options#setOption(), Options#getOption()', t => {
    const OPTION = 'testOption';
    const VALUE = 'testValue';

    const before = new Options();
    const after = before.setOption(OPTION, VALUE);

    t.notEqual(
      before, after,
      'should create a copy'
    );

    t.notEqual(
      before._options, after._options,
      'should have a different options object'
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

  t.test('Options#extend()', t => {

    const OPTION = 'testOption';
    const VALUE = 'testValue';

    const methods = {
      a: function() {},
      b: function() {},
      c: function() {},
    }

    const parent = new Options()
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

  t.test('Options#asMutable(), Options#asImmutable()', t => {

    const OPTION = 'OPTION';
    const VALUE_A = 'VALUE_A';
    const VALUE_B = 'VALUE_B';

    const options = new Options({ a: 'a', b: 'b' });

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
      options._options, mutable._options,
      'mutable copy has a different `_options` instance'
    )

    t.deepEqual(
      omit(options._options, 'isMutable'),
      omit(mutable._options, 'isMutable'),
      'mutable copy has the same options set (other than `isMutable`)'
    )

    t.equal(
      mutable, mutable.asMutable(),
      '`asMutable` is a no-op on a mutable instance'
    );

    const withOption = mutable.setOption(OPTION, VALUE_A);

    t.equal(
      mutable, withOption,
      '`setOption` on a mutable instance does not return a copy'
    );

    t.equal(
      withOption.getOption(OPTION), VALUE_A,
      '`setOption` correctly sets value on mutable instance'
    );

    const immutable = mutable.asImmutable();

    t.equal(
      mutable, immutable,
      '`asImmutable` returns the same instance'
    );

    const immutableWithOption = immutable.setOption(OPTION, VALUE_B);

    t.notEqual(
      immutable, immutableWithOption,
      '`setOption` returns a copy on an immutable instance that was ' +
      'previously mutable...'
    );

    t.equal(
      immutableWithOption.getOption(OPTION), VALUE_B,
      '...new instance is set correctly...'
    );

    t.equal(
      immutable.getOption(OPTION), VALUE_A,
      '...previous instance remains unchanged.'
    );

    t.end();
  });

  t.test('Options#withMutations()', t => {

    const OPTION = 'OPTION';
    const VALUE = 'VALUE';
    
    const options = new Options();

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

      mutatedOnce = scopedMutable.setOption(OPTION, VALUE);

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

    const mutable = new Options().asMutable();

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

  t.end();
});
