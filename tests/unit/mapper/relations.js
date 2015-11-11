import test from 'tape';
//import MockedKnex from '../mocked-knex';
import Mapper from '../../../lib/mapper';
import Atlas from '../../../lib/atlas';

test('Mapper - relations', t => {
  t.test('Mapper#relations', t => {

    const atlas = Atlas();
    const { hasOne } = atlas.relations;
    const Things = Mapper.table('things');
    const hasThingFactory = hasOne(Things);
    const Owner = Mapper.table('owners').relations({ hasThing: hasThingFactory });

    t.notEqual(Owner, Mapper, 'copies immutable Mapper');

    t.deepEqual(
      Owner.getOption('relations'),
      { hasThing: hasThingFactory },
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
      OwnerWithAll.getOption('withRelated'),
      { a: {}, b: {}, c: {} },
      '`true` adds all relations'
    );

    t.deepEqual(
      OwnerWithAll.withRelated(false).getOption('withRelated'),
      {},
      '`false` removes all relations'
    );

    t.end();
  });
});
