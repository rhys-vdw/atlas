import 'tape-catch';
import './custom-tests';

import './unit';
import './integration';

import test from 'tape';
test.createStream()
  //.on('data', d => console.log('thing: ', d))
  .on('end', d => console.log('END:', d));
