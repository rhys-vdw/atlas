import test from 'tape';
import MockedKnex from '../mocked-knex';
import Knex from 'knex';
import mapper from '../../lib/mapper';
import { NotFoundError } from '../../lib/errors';

const knex = Knex({});

test('Mapper', t => {

  t.test('Mapper#destroy() - no arguments', t => {
    const TABLE = 'TABLE';
    const COUNT = 5;

    const mocked = MockedKnex(query => {
      t.queriesEqual(query, knex(TABLE).delete());
      return COUNT;
    });

    t.plan(2);

    t.resolvesTo(
      mapper.knex(mocked).table(TABLE).destroy(),
      COUNT,
      'resolves to deleted count'
    );
  });

  t.test('Mapper#destroy() - single ID value', t => {
    const TABLE = 'TABLE';
    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const COUNT = 1;

    const mocked = MockedKnex(query => {
      t.queriesEqual(query, knex(TABLE).whereIn(ID_ATTRIBUTE, [ID_VALUE]).delete());
      return COUNT;
    });

    t.plan(2);

    t.resolvesTo(
      mapper.knex(mocked).table(TABLE).idAttribute(ID_ATTRIBUTE).require().destroy(ID_VALUE),
      COUNT,
      'resolves to deleted count'
    );
  });

  t.test('Mapper#require().destroy() - single ID value not found', t => {
    const TABLE = 'TABLE';
    const ID_ATTRIBUTE = 'ID_ATTRIBUTE';
    const ID_VALUE = 'ID_VALUE';
    const COUNT = 0;

    const mocked = MockedKnex(query => {
      t.queriesEqual(query, knex(TABLE).whereIn(ID_ATTRIBUTE, [ID_VALUE]).delete());
      return COUNT;
    });

    t.plan(2);

    t.rejects(
      mapper.knex(mocked).table(TABLE).idAttribute(ID_ATTRIBUTE).require().destroy(ID_VALUE),
      NotFoundError
    );
  });



});
