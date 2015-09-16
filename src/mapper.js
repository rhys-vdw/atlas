import { assign } from 'lodash/object';
import { reduce } from 'lodash/array';
import { pluck } from 'lodash/collection';

import Mapper from './mapper-base';
import RecordAdapter from './mapper-record-adapter';
import Identification from './mapper-identification';
import Retrieval from './mapper-retrieval';
import Persistence from './mapper-persistence';

const mixins = [
  RecordAdapter,
  Identification,
  Retrieval,
  Persistence
];

assign(
  Mapper.prototype,
  ...pluck(mixins, 'methods')
);

export default Mapper;

const defaultOptions = assign(
  {},
  ...pluck(mixins, 'defaultOptions')
);

const instance = new Mapper(defaultOptions);

export { defaultOptions, instance };
