import test from 'tape';
import Mapper from '../../../lib/mapper';
import { hasMany, belongsTo } from '../../../lib/relations';
import CamelCase from './helpers/camel-case';

test('== Mapper - joins ==', t => {

  t.test('Mapper#pivotAttributes()', t => {
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

  t.test('Mapper#omitPivot()', t => {
    const Omitted = Mapper.omitPivot();

    t.equal(Mapper.requireState('omitPivot'), false, 'defaults to false');
    t.equal(Omitted.requireState('omitPivot'), true, 'can be set to true');

    t.end();
  });

  t.test('Mapper#joinRelation - simple join', t => {

    const Other = Mapper.table('others').idAttribute('o_id');
    const Self = Mapper.table('selves').idAttribute('s_id');

    const Joined = Self.relations({
      others: hasMany(Other)
    }).joinRelation('others');

    t.queriesEqual(
      Joined.prepareFetch().toQueryBuilder(), `
        select "selves".* from "selves"
        inner join "others" on "selves"."s_id" = "others"."self_s_id"
      `, 'performs simple join when target has no statements'
    );

    const WithPivot = Joined.pivotAttributes('a', 'b', 'c');

    t.queriesEqual(
      WithPivot.prepareFetch().toQueryBuilder(), `
        select
          "others"."a" as "_pivot_a",
          "others"."b" as "_pivot_b",
          "others"."c" as "_pivot_c",
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

  t.test('Mapper#joinRelation - respects `attributeToColumn`', t => {

    const CamelMapper = Mapper.extend(CamelCase());
    const Other = CamelMapper.table('others').idAttribute('otherId');
    const Self = CamelMapper.table('selves').idAttribute('selfId');

    const Joined = Self.relations({
      others: hasMany(Other)
    }).joinRelation('others').pivotAttributes('someValue');

    t.queriesEqual(
      Joined.prepareFetch().toQueryBuilder(), `
        select
          "others"."some_value" as "_pivot_some_value",
          "selves".*
        from
          "selves"
        inner join
          "others" on "selves"."self_id" = "others"."self_self_id"
      `, 'selects pivot attributes'
    );

    t.end();
  });


  t.test('Mapper#joinRelation - simple join with composite keys', st => {

    const Other = Mapper.table('others').idAttribute(['id_a', 'id_b']);
    const Self = Mapper.table('selves').idAttribute('s_id');

    const Joined = Self.relations({
      others: belongsTo(Other),
    }).joinRelation('others');

    st.queriesEqual(
      Joined.prepareFetch().toQueryBuilder(), `
        select "selves".* from "selves"
        inner join "others" on
          "selves"."other_id_a" = "others"."id_a"
        and
          "selves"."other_id_b" = "others"."id_b"
      `, 'performs simple join when target has no statements'
    );

    st.end();
  });

  t.test('Mapper#joinRelation - simple self join', t => {

    const People = Mapper.table('people');

    const Joined = People.relations({
      children: hasMany(People, { otherRef: 'mother_id' })
    }).joinRelation('children').pivotAttributes('a');

    t.queriesEqual(
      Joined.prepareFetch().toQueryBuilder(), `
        select "pivot"."a" as "_pivot_a", "people".* from "people"
        inner join "people" as "pivot" on "people"."id" = "pivot"."mother_id"
      `, 'aliases join table when joining self'
    );

    t.end();
  });

  t.test('Mapper#joinRelation - complex join', t => {

    const Other = Mapper.table('others').idAttribute('o_id')
      .where('thing', '>', 5);

    const Self = Mapper.table('selves').idAttribute('s_id');

    const Joined = Self.relations({
      others: hasMany(Other)
    }).joinRelation('others');

    t.queriesEqual(
      Joined.prepareFetch().toQueryBuilder(), `
        select "selves".* from "selves"
        inner join (
          select "others".* from "others"
          where "others"."thing" > 5
        ) as "pivot" on "selves"."s_id" = "pivot"."self_s_id"
      `, 'performs simple join when target has no statements'
    );

    const WithPivot = Joined.pivotAttributes('a', 'b', 'c');

    t.queriesEqual(
      WithPivot.prepareFetch().toQueryBuilder(), `
        select
          "pivot"."a" as "_pivot_a",
          "pivot"."b" as "_pivot_b",
          "pivot"."c" as "_pivot_c",
          "selves".*
        from
          "selves"
        inner join (
          select "others".* from "others"
          where "others"."thing" > 5
        ) as "pivot" on "selves"."s_id" = "pivot"."self_s_id"
      `, 'selects pivot attributes'
    );

    t.end();
  });
});
