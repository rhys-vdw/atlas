import { inspect } from 'util';
import {
  keyBy, keys as objectKeys, flatten, isArray, isEmpty, isFunction,
  isString, groupBy
} from 'lodash';
import Mapper from './mapper';
import EagerLoader from '../eager-loader';
import { ALL, NONE } from '../constants';
import { mapperAttributeRef } from '../naming/default-column';
import { isComposite } from '../arguments';

export default {

  /**
   * @method Mapper#one
   * @summary
   *
   * Set the key attribute for a "one-to-many" or "one-to-one" relation.
   *
   * @param {string|string[]} [attribute]
   * @returns {Mapper}
   */
  one(relationAttribute) {
    return this.withMutations(mapper =>
      mapper.single().setState({ relationAttribute })
    );
  },

  /**
   * @method Mapper#many
   * @summary
   *
   * Set the key attribute for a "many-to-many" or "many-to-one" relation.
   *
   * @param {string|string[]} [attribute]
   * @returns {Mapper}
   */
  many(relationAttribute) {
    return this.withMutations(mapper =>
      mapper.all().setState({ relationAttribute })
    );
  },

  /**
   * @method Mapper#to
   * @summary
   *
   * Create a relation.
   *
   * @param {Mapper} Other
   *   The mapper representing the relation table.
   * @returns {Mapper} The new relation.
   */
  to(Other) {

    const selfAttribute = this.getRelationAttribute(Other);
    const otherAttribute = Other.getRelationAttribute(this);

    return Other.setState({
      relationAttribute: otherAttribute,
      relationOther: this.setState({ relationAttribute: selfAttribute })
    });
  },

  of(...records) {

    const Other = this.requireState('relationOther');
    const selfAttribute = this.getRelationAttribute();
    const otherAttribute = Other.getRelationAttribute();

    // Get all the IDs.
    const id = Other.identifyBy(otherAttribute, ...records);

    if (!isArray(id)) {
      return this.where(selfAttribute, id);
    }

    // An array is not necessarily more than one target. If this has a
    // composite key then that might be a composite key value...
    if (isComposite(selfAttribute) && isComposite(id[0])) {
      return this.where(selfAttribute, id);
    }

    // Special case for single relations that have multiple targets.
    // The mapper may actually be a 'many-to-*' relation masquerading as
    // a 'one-to-*' eg:
    //
    // const userLatestMessage = User
    //   .relation('messages')
    //   .orderBy('received_at', 'desc')
    //   .as('latest_message')
    //   .one();
    //
    // userLatestMessage.of(samantha, anna).fetch().then(messages =>
    //   // ...
    // )
    //
    // Since the query actually fetches multiple rows the query must be marked
    // 'distinct'.
    //
    // TODO:
    //
    // For now the `distinct` clause will cause the query to fail due to
    // conflicts. Something more intelligent is required to generate:
    //
    // select * from messages inner join (
    //   select user_id, max(received_at) from messages
    //   where messages.user_id in (1, 2)
    //   group by user_id
    // ) as sub on sub.user_id = messages.id
    //
    // See issue #80
    //
    if (this.state.isSingle) {
      return this.withMutations(mapper => {
        mapper
          .all()
          .distinct(selfAttribute)
          .whereIn(selfAttribute, id);
      });
    }

    // Simple *-to-one
    return isArray(id) && !isComposite(id[0])
      ? this.whereIn(selfAttribute, id)
      : this.where(selfAttribute, id);
  },

  getRelationAttribute(Other) {
    return (
      this.state.relationAttribute ||
      this.getDefaultRelationAttribute(Other)
    );
  },

  getDefaultRelationAttribute(Other) {

    // Many-to-one.
    if (!this.state.isSingle && Other.state.isSingle) {
      const attribute = Other.requireState('idAttribute');
      return this.columnToAttribute(mapperAttributeRef(Other, attribute));
    }

    // Many-to-many, one-to-one, one-to-many.
    return this.requireState('idAttribute');
  },

  // TODO: This should delegate to a single/plural 'mapRelated' variant
  //       function. it's a bit confusing as it is (and expensive).
  mapRelated(parentRecords, selfRecords) {

    // Handle (parent, child) mapping
    if (!isArray(parentRecords)) {
      return selfRecords || this.none();
    }

    const { isSingle, isRequired } = this.state;
    const Parent = this.requireState('relationOther');
    const selfAttribute = this.getRelationAttribute();
    const parentAttribute = Parent.getRelationAttribute();

    const keyFn = isSingle ? keyBy : groupBy;

    const selfRecordsById = keyFn(selfRecords, record =>
      this.identifyBy(selfAttribute, record)
    );

    return parentRecords.map(parentRecord => {
      const id = Parent.identifyBy(parentAttribute, parentRecord);
      const selfRecord = selfRecordsById[id];
      // TODO: Use a proper `RequirementFailedError` for this and all other
      // required triggered errors.
      if (isRequired && isEmpty(selfRecord)) throw new Error(
        `Failed to retrieve relation "${this.getName()}" with where ` +
        `${parentAttribute} is ${id}`
      );
      return selfRecord || this.none();
    });
  },

}
