import { assign } from 'lodash/object';
import { reduce } from 'lodash/array';
import { pluck } from 'lodash/collection';

import Mapper from './base';
import RecordAdapter from './record-adapter';
import Identification from './identification';
import Retrieval from './retrieval';
import Persistence from './persistence';
import Forge from './forge';
import KeyConversion from './key-conversion';
import Destruction from './key-conversion';

const mixins = [
  RecordAdapter,
  Identification,
  Retrieval,
  Persistence,
  Forge,
  KeyConversion,
  Destruction
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
