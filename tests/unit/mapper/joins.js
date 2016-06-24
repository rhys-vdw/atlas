import test from 'tape';
import Mapper from '../../../lib/mapper';
import CamelCase from '../../../lib/plugins/CamelCase';

test('Mapper#pivotAttributes()', t => {
  const WithPivot = Mapper
    .pivotAttributes(['a', 'b'])
    .pivotAttributes('c');

  t.deepEqual(
    WithPivot.requireState('pivotAttributes'),
    ['a', 'b', 'c'],
    `is additive`
  );

  const ToDedupe = Mapper
    .pivotAttributes(['a', 'a'])
    .pivotAttributes(['a']);

  t.deepEqual(
    ToDedupe.requireState('pivotAttributes'),
    ['a'],
    `deduplicates`
  );

  t.end();
});

test('Mapper#omitPivot()', t => {
  const Omitted = Mapper.omitPivot();

  t.equal(Mapper.requireState('omitPivot'), false, 'defaults to false');
  t.equal(Omitted.requireState('omitPivot'), true, 'can be set to true');

  t.end();
});

test('Mapper#join - simple join', t => {

  const Others = Mapper.table('others').idAttribute('o_id');
  const Selves = Mapper.table('selves').idAttribute('s_id');

  const Relation = Selves.one().to(Others.many());
  const Joined = Selves.join(Relation);

  t.queriesEqual(
    Joined.prepareFetch().toQueryBuilder(), `
      select "selves".* from "selves"
      inner join "others" on "selves"."s_id" = "others"."self_s_id"
    `, 'performs simple join when target has no statements'
  );

  const WithPivot = Selves.join(Relation.pivotAttributes('a', 'b', 'c'));

  t.queriesEqual(
    WithPivot.prepareFetch().toQueryBuilder(), `
      select
        "others"."a" as "_others_a",
        "others"."b" as "_others_b",
        "others"."c" as "_others_c",
        "selves".*
      from
        "selves"
      inner join
        "others" on "selves"."s_id" = "others"."self_s_id"
    `, 'selects pivot attributes'
  );

  t.queriesEqual(
    WithPivot.omitPivot().prepareFetch().toQueryBuilder(), `
      select "selves".* from "selves"
      inner join "others" on "selves"."s_id" = "others"."self_s_id"
    `, 'pivot attributes can be omitted with `.omitPivot()`'
  );

  t.end();
});

test('Mapper#join - respects `attributeToColumn`', t => {

  const CamelMapper = Mapper.extend(CamelCase());
  const Others = CamelMapper.table('others').idAttribute('otherId');
  const Selves = CamelMapper.table('selves').idAttribute('selfId');

  const Relation = Selves.one().to(
    Others.many().pivotAttributes('someValue')
  );
  const Joined = Selves.join(Relation);

  t.queriesEqual(
    Joined.prepareFetch().toQueryBuilder(), `
      select
        "others"."some_value" as "_others_some_value",
        "selves".*
      from
        "selves"
      inner join
        "others" on "selves"."self_id" = "others"."self_self_id"
    `, 'selects pivot attributes'
  );

  t.end();
});


test('Mapper#join - simple join with composite keys', t => {

  const Others = Mapper.table('others').idAttribute(['id_a', 'id_b']);
  const Selves = Mapper.table('selves').idAttribute('s_id');

  const Relation = Selves.many().to(Others.one());
  const Joined = Selves.join(Relation);

  t.queriesEqual(
    Joined.prepareFetch().toQueryBuilder(), `
      select "selves".* from "selves"
      inner join "others" on
        "selves"."other_id_a" = "others"."id_a"
      and
        "selves"."other_id_b" = "others"."id_b"
    `, 'performs simple join when target has no statements'
  );

  t.end();
});

test('Mapper#join - simple self join', t => {

  const People = Mapper.table('people');

  const Relation = People.one().to(People.many('mother_id')).as('children');
  const Joined = People.join(Relation.pivotAttributes('a'));

  t.queriesEqual(
    Joined.prepareFetch().toQueryBuilder(), `
      select "children"."a" as "_children_a", "people".* from "people"
      inner join "people" as "children"
      on "people"."id" = "children"."mother_id"
    `, 'aliases join table when joining self'
  );

  t.end();
});

test('Mapper#join - complex join', t => {

  const Others = Mapper.table('others').idAttribute('o_id')
    .where('thing', '>', 5);
  const Selves = Mapper.table('selves').idAttribute('s_id');

  const Relation = Selves.one().to(Others);
  const Joined = Selves.join(Relation);

  t.queriesEqual(
    Joined.prepareFetch().toQueryBuilder(), `
      select "selves".* from "selves"
      inner join (
        select "others".* from "others"
        where "others"."thing" > 5
      ) as "others" on "selves"."s_id" = "others"."self_s_id"
    `, 'performs simple join when target has no statements'
  );

  t.end();
});

test('Mapper#joinRelation - complex join with join attributes', t => {

  const Selves = Mapper.table('selves').idAttribute('s_id');
  const Others = Mapper.table('others').idAttribute('o_id')
    .where('thing', '>', 5);

  const Relation = Selves.one().to(Others.pivotAttributes('a', 'b', 'c'));
  const Joined = Selves.join(Relation);

  t.queriesEqual(
    Joined.prepareFetch().toQueryBuilder(), `
      select
        "others"."a" as "_others_a",
        "others"."b" as "_others_b",
        "others"."c" as "_others_c",
        "selves".*
      from
        "selves"
      inner join (
        select "others".* from "others"
        where "others"."thing" > 5
      ) as "others" on "selves"."s_id" = "others"."self_s_id"
    `, 'selects joined attributes'
  );

  t.end();
});
