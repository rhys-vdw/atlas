import testRetrieval from './retrieval';
import testBelongsTo from './relations-belongs-to';
import testHasMany from './relations-has-many';
import testHasOne from './relations-has-one';

export default function(atlas) {
  testRetrieval(atlas);
  testBelongsTo(atlas);
  testHasMany(atlas);
  testHasOne(atlas);
}
