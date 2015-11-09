import test from 'tape';
//import MockedKnex from '../mocked-knex';
import Mapper from '../../../lib/mapper';
import HasOne from '../../../lib/relations/has-one';

test('Mapper - relations', t => {
  t.test('Mapper#relations', t => {

    const relation = new HasOne();
    const mapper = Mapper.relations({ relationName: relation });

    t.notEqual(mapper, Mapper, 'copies immutable Mapper');

    t.deepEqual(
      mapper.getOption('relations'),
      { relationName: relation },
      'Correctly assigns relations'
    );

    t.end();
  });
});
