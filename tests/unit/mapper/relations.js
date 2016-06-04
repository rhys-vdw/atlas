import test from 'tape';
import Mapper from '../../../lib/mapper';
import Atlas from '../../../lib/atlas';
import { related } from '../../../lib/related';

test('Mapper#relations', t => {

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

test('Mapper#with(ALL)', t => {

  const relations = [];
  const Records = Mapper.table('records').relations({
    a: m => relations[0] = m.belongsTo(Records),
    b: m => relations[1] = m.belongsTo(Records),
    c: m => relations[2] = m.belongsTo(Records),
    d: m => relations[3] = m.belongsTo(Records),
  }).with(related.ALL);

  const relatedInstances = Records.requireState('related');

  t.equal(relatedInstances[0].name(), 'a');
  t.equal(relatedInstances[1].name(), 'b');
  t.equal(relatedInstances[2].name(), 'c');
  t.equal(relatedInstances[3].name(), 'd');

  t.equal(relatedInstances[0].getRelation(Records), relations[0]);
  t.equal(relatedInstances[1].getRelation(Records), relations[1]);
  t.equal(relatedInstances[2].getRelation(Records), relations[2]);
  t.equal(relatedInstances[3].getRelation(Records), relations[3]);

  t.end();
});

test('Mapper#with(NONE)', t => {

  const relations = [];
  const Records = Mapper.table('records').relations({
    a: m => relations[0] = m.belongsTo(Records),
    b: m => relations[1] = m.belongsTo(Records),
    c: m => relations[2] = m.belongsTo(Records),
    d: m => relations[3] = m.belongsTo(Records),
  }).with('a', 'b', 'c', 'd');

  const relatedInstances = Records.with(related.NONE).requireState('related');

  t.deepEqual(relatedInstances, []);

  t.end();
});

test('Mapper#load(ALL)', t => {

  const relations = [];
  const Records = Mapper.table('records').relations({
    a: m => relations[0] = m.belongsTo(Records),
    b: m => relations[1] = m.belongsTo(Records),
  });

  const { relatedList } = Records.load(related.ALL);

  t.equal(relatedList[0].name(), 'a');
  t.equal(relatedList[1].name(), 'b');

  t.equal(relatedList[0].getRelation(Records), relations[0]);
  t.equal(relatedList[1].getRelation(Records), relations[1]);

  t.end();
});

test('Mapper#load(NONE)', t => {

  const relations = [];
  const Records = Mapper.table('records').relations({
    a: m => relations[0] = m.belongsTo(Records),
    b: m => relations[1] = m.belongsTo(Records),
  });

  const { relatedList } = Records.load(related.NONE);

  t.deepEqual(relatedList, []);
  t.end();
});
