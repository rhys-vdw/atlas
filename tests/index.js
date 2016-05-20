import 'babel-polyfill';

import SouceMapSupport from 'source-map-support';
SouceMapSupport.install();

import 'tape-catch';
import './custom-tests';

import './unit';
import './integration';
