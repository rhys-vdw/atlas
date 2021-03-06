import testDestruction from './destruction';
import testEagerLoading from './eager-loading';
import testRetrieval from './retrieval';
import testBelongsTo from './relations-belongs-to';
import testBelongsToMany from './relations-belongs-to-many';
import testHasMany from './relations-has-many';
import testHasOne from './relations-has-one';

export default function(atlas) {
  testDestruction(atlas);
  testEagerLoading(atlas);
  testRetrieval(atlas);
  testBelongsTo(atlas);
  testBelongsToMany(atlas);
  testHasMany(atlas);
  testHasOne(atlas);
}
