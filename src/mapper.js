import { assign } from 'lodash/object';
import { reduce } from 'lodash/array';
import { pluck } from 'lodash/collection';

import Mapper from './mapper-base';
import MapperRecordAdapter from './mapper-record-adapter';
import MapperIdentification from './mapper-identification';
import MapperRetrieval from './mapper-retrieval';

const mixins = [
  MapperRecordAdapter,
  MapperIdentification,
  MapperRetrieval
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
