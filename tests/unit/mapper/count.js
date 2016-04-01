import test from 'tape';
import Mapper from '../../../lib/mapper';
import { hasMany } from '../../../lib/relations/index.js';

test('Mapper - count', t => {

  t.test('Mapper#count()', t => {

    const Things = Mapper.table('things');

    t.queriesEqual(
      Things.prepareCount().toQueryBuilder(),
      `select count(*) from "things"`
    );

    t.queriesEqual(
      Things.where('some_column', '>', 5).prepareCount().toQueryBuilder(),
      `select count(*) from "things" where "things"."some_column" > 5`
    );

    t.end();
  });

  t.test('Mapper#count(attribute)', t => {

    const Things = Mapper.table('things');

    t.queriesEqual(
      Things.prepareCount('some_column').toQueryBuilder(),
      `select count("things"."some_column") from "things"`
    );

    t.end();
  });

  t.test('Mapper.getRelation().of().count()', t => {

    const Parent = Mapper.table('parents').relations({
      children: hasMany(Mapper.table('children'))
    });

    const bob = { id: 5, name: 'Bob' };

    const BobsChildren = Parent.getRelation('children').of(bob);

    t.queriesEqual(
      BobsChildren.prepareCount('pet_id').toQueryBuilder(), `
        select count("children"."pet_id")
        from "children"
        where "children"."parent_id" = 5
      `
    );

    t.end();
  });
});
