import test from 'tape';
import Mapper from '../../../lib/mapper';
import Atlas from '../../../lib/atlas';

test('Mapper - relations unit test', t => {
  t.test('Mapper#relations', t => {

    const atlas = Atlas();
    const Things = Mapper.table('things');
    const ownedThing = o => o.hasOne(Things)
    const Owner = Mapper.table('owners').relations({
      hasThing: ownedThing
    });

    t.notEqual(Owner, Mapper, 'copies immutable Mapper');

    t.deepEqual(
      Owner.requireState('relations'),
      { hasThing: ownedThing },
      'Correctly assigns relations'
    );

    const hasThing = Owner.getRelation('hasThing');

    t.equal(hasThing.Self, Owner, 'correctly assigned self');

    t.end();
  });
});
