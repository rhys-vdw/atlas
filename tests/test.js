import SouceMapSupport from 'source-map-support';
SouceMapSupport.install();

import 'tape-catch';
import './custom-tests';
import test from 'tape';
export default test;
