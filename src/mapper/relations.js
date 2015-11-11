import Promise from 'bluebird';
import { mapValues, reduce } from 'lodash/collection';
import { first } from 'lodash/array';
import { keys } from 'lodash/object';
import { isEmpty } from 'lodash/lang';
import RelationTree, { compile, mergeTrees, normalize } from '../relation-tree';

const options = {
  relations: {},
  withRelated: new RelationTree(),
};

const methods = {

  relations(relations) {
    return this.updateOption('relations', previous =>
      ({ ...previous, ...relations })
    );
  },

  getRelationNames() {
    return keys(this.getOption('relations'));
  },

  getRelation(name) {
    const relations = this.getOption('relations');
    if (!(name in relations)) {
      throw new TypeError(`Unknown relation '${name}'`);
    }
    return relations[name](this);
  },

  withRelated(...relations) {

    // Special case for `withRelated()`, `withRelated(true)` and
    // `withRelated(false)`.
    const allFlag = first(relations);

    // Include all relations defined on model.
    if (isEmpty(relations) || allFlag === true) {
      const relationNames = this.getRelationNames();
      return this.setOption('withRelated', compile(...relationNames));
    }

    // Include no relations.
    if (allFlag === false) {
      return this.setOption('withRelated', new RelationTree());
    }

    // Otherwise merge in tree.
    return this.updateOption('withRelated', previous =>
      mergeTrees(previous, compile(...relations))
    );
  },

  related(relationName, ...targetIds) {
    const relation = this.getRelation(relationName);
    const atlas = this.getOption('atlas');
    return relation.toMapper(atlas, ...targetIds);
  },

  loadInto: Promise.method(function(relationTree, records) {

    // This is a no-op if no relations are specified.
    if (isEmpty(relationTree)) {
      return records;
    }

    const tree = normalize(this.getOption('withRelated'));
    const atlas = this.getOption('atlas');
    const relatedPromise = mapValues(tree, (
      { initializer, nested }, relationName
    ) => this
      .getRelation(relationName)
      .toMapper(atlas, records)
      .withMutations({
        withMutations: initializer,
        withRelated: nested
      }).fetch()
    );

    return Promise.props(relatedPromise).then(relatedByName =>
      reduce(relatedByName, (acc, related, relationName) =>
        this
        .getRelation(relationName)
        .assign(atlas, relationName, records, related)
      , records)
    );
  })

};

export default { methods, options };
