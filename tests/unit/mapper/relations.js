import test from 'tape';
import Mapper from '../../../lib/mapper';
import Atlas from '../../../lib/atlas';
import { related } from '../../../lib/related';

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
});
