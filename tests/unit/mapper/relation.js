import test from '../../test';
import Mapper from '../../../lib/mapper';

test('Mapper#one()', t => {

  const Record = Mapper.table('records').one();

  t.equal(
    Record.state.isSingle, true,
    'is single'
  );
  t.equal(
    Record.state.relationAttribute, undefined,
    'leave relation attribute unset'
  );

  t.end();
});

test('Mapper#one(attribute)', t => {

  const Record = Mapper.table('records').one('test_attribute');

  t.equal(
    Record.state.isSingle, true,
    'is single'
  );
  t.equal(
    Record.state.relationAttribute, 'test_attribute',
    'sets relation attribute'
  );

  t.end();
});


test('Mapper#many()', t => {

  const Record = Mapper.table('records').many();

  t.equal(
    Record.state.isSingle, false,
    'is not single'
  );
  t.equal(
    Record.state.relationAttribute, undefined,
    'leave relation attribute unset'
  );

  t.end();
});

test('Mapper#many(attribute)', t => {

  const Record = Mapper.table('records').many('test_attribute');

  t.equal(
    Record.state.isSingle, false,
    'is not single'
  );
  t.equal(
    Record.state.relationAttribute, 'test_attribute',
    'sets relation attribute'
  );

  t.end();
});

test('Mapper#getDefaultRelationAttribute', t => {

  const Lefts = Mapper.table('lefts').idAttribute('l_id');
  const Left = Lefts.single();
  const Rights = Mapper.table('rights').idAttribute('r_id');
  const Right = Rights.single();

  t.equal(
    Left.getDefaultRelationAttribute(Right), 'l_id',
    'one-to-one'
  );

  t.equal(
    Left.getDefaultRelationAttribute(Rights), 'l_id',
    'one-to-many'
  );

  t.equal(
    Lefts.getDefaultRelationAttribute(Right), 'right_r_id',
    'many-to-one'
  );

  t.equal(
    Left.getDefaultRelationAttribute(Right), 'l_id',
    'many-to-many'
  );

  t.end();
});

test('Mapper#getRelationAttribute', t => {

  const Lefts = Mapper.table('lefts').idAttribute('l_id');
  const Rights = Mapper.table('rights').idAttribute('r_id');

  t.equal(
    Lefts.many().getRelationAttribute(Rights), 'l_id',
    'gets default relation attribute if none is set'
  );

  t.equal(
    Lefts.many('custom_attr').getRelationAttribute(Rights), 'custom_attr',
    'returns set attribute (if set)'
  );

  t.end();
});
