import testRetrieval from './retrieval';
import testHasOne from './relations-has-one';
import testHasMany from './relations-has-many';

export default function(atlas) {
  testRetrieval(atlas);
  testHasOne(atlas);
  testHasMany(atlas);
}
