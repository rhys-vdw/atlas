import 'babel-polyfill';

import SouceMapSupport from 'source-map-support';
SouceMapSupport.install();

import 'tape-catch';
import './custom-tests';
export { default as default } from 'tape';
