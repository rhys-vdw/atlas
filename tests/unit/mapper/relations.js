import test from 'tape';
import Mapper from '../../../lib/mapper';
import Atlas from '../../../lib/atlas';

test('Mapper - relations unit test', t => {
  t.test('Mapper#relations', t => {

    const atlas = Atlas();
    const { hasOne } = atlas.relations;
    const Things = Mapper.table('things');
    const hasOneThing = hasOne(Things);
    const Owner = Mapper.table('owners').relations({ hasThing: hasOneThing });

    t.notEqual(Owner, Mapper, 'copies immutable Mapper');

    t.deepEqual(
      Owner.requireState('relations'),
      { hasThing: hasOneThing },
      'Correctly assigns relations'
    );

    const hasThing = Owner.getRelation('hasThing');

    t.equal(hasThing.Self, Owner, 'correctly assigned self');

    t.end();
  });

  t.test('Mapper#withRelated()', t => {
    const Owner = Mapper.relations({
      a: null, b: null, c: null
    });

    const OwnerWithAll = Owner.withRelated(true);
    t.deepLooseEqual(
      OwnerWithAll.requireState('withRelated'),
      { a: {}, b: {}, c: {} },
      '`true` adds all relations'
    );

    t.deepEqual(
      OwnerWithAll.withRelated(false).requireState('withRelated'),
      {},
      '`false` removes all relations'
    );

    t.end();
  });
});
