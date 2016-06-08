import test from 'tape';
import Mapper from '../../../lib/mapper';
import Atlas from '../../../lib/atlas';
import EagerLoader from '../../../lib/eager-loader';

const { ALL, NONE } = Atlas;

test('Mapper#relations', t => {

  const createRelation = () => Mapper.as('thing');
  const Owner = Mapper.table('owners').relations({
    thingAlias: createRelation
  });

  t.notEqual(Owner, Mapper, 'copies immutable Mapper');

  t.deepEqual(
    Owner.requireState('relations'),
    { thingAlias: createRelation },
    'Correctly assigns relations'
  );

  t.equal(
    Owner.getRelation('thingAlias').getName(),
    'thingAlias',
    'aliases relation'
  );

  t.end();
});

test('Mapper#with(ALL)', t => {

  const Records = Mapper.table('records').relations({
    a: self => self.belongsTo(Records),
    b: self => self.belongsTo(Records),
  }).with(ALL);

  const related = Records.requireState('related');

  t.deepEqual(related, ['a', 'b']);

  t.equal(Records.getRelation('a').getName(), 'a');
  t.equal(Records.getRelation('b').getName(), 'b');

  t.end();
});

test('Mapper#with(NONE)', t => {

  const relations = [];
  const Records = Mapper.table('records').relations({
    a: self => self.belongsTo(Records),
    b: self => self.belongsTo(Records),
    c: self => self.belongsTo(Records),
    d: self => self.belongsTo(Records),
  }).with(ALL);

  const related = Records.with(NONE).requireState('related');

  t.deepEqual(related, []);

  t.end();
});

test('Mapper#load()', t => {
  const eagerLoader = Mapper.load();
  t.ok(
    eagerLoader instanceof EagerLoader,
    'returns an instance of `EagerLoader'
  );
});

test('Mapper#load(ALL)', t => {

  const Records = Mapper.table('records').relations({
    a: self => self.belongsTo(Records),
    b: self => self.belongsTo(Records),
  });

  const eagerLoader = Records.load(ALL);

  t.equal(eagerLoader.relations[0].getName(), 'a');
  t.equal(eagerLoader.relations[1].getName(), 'b');

  t.end();
});

test.only('Mapper#load(NONE)', t => {

  const Records = Mapper.table('records').relations({
    a: m => m.belongsTo(Records),
    b: m => m.belongsTo(Records),
  });

  const { relations } = Records.load(NONE);

  t.deepEqual(relations, []);
  t.end();
});
