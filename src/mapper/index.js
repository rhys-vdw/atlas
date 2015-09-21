import _, { assign } from 'lodash';

import Mapper from './base';
import RecordAdapter from './record-adapter';
import Identification from './identification';
import Retrieval from './retrieval';
import Persistence from './persistence';
import Forge from './forge';
import KeyConversion from './key-conversion';
import Destruction from './destruction';
import Plurality from './plurality';
import Where from './where';

const mixins = [
  RecordAdapter,
  Identification,
  Retrieval,
  Persistence,
  Forge,
  KeyConversion,
  Destruction,
  Plurality,
  Where
];

const combine = (mixins, property) =>
  _(mixins).pluck(property).reduce(assign, {});

const methods = combine(mixins, 'methods');
const options = combine(mixins, 'options');

assign(Mapper.prototype, methods);

export default new Mapper(options);

export { Mapper as constructor, options };
