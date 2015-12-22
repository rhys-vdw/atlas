import { isArray } from 'lodash/lang';
import { groupBy } from 'lodash/collection';
import { first } from 'lodash/array';
import { mapperAttributeRef } from '../naming/default-column';
import { isComposite, assertKeysCompatible } from '../arguments';

export default class HasMany {
  constructor(Self, Other, { selfKey, otherRef } = {}) {
    const selfAttribute = selfKey || Self.requireState('idAttribute');
    const otherAttribute = otherRef || Other.columnToAttribute(
      mapperAttributeRef(Self, selfAttribute)
    );

    assertKeysCompatible({ selfAttribute, otherAttribute });

    this.Self = Self;
    this.Other = Other;
    this.selfAttribute = selfAttribute;
    this.otherAttribute = otherAttribute;
  }

  of(...targetIds) {
    const { Self, Other, selfAttribute, otherAttribute } = this;

    const id = Self.identifyBy(selfAttribute, ...targetIds);
    const isSingle = !isArray(id) ||
      isComposite(selfAttribute) && !isComposite(first(id));

    return Other.withMutations(other => {
      if (isSingle) {
        other.where(otherAttribute, id);
        other.defaultAttribute(otherAttribute, id);
      } else {
        other.whereIn(otherAttribute, id);
      }
    });
  }

  mapRelated(records, related) {
    if (!isArray(records)) {
      return related || [];
    }

    const { Self, Other, selfAttribute, otherAttribute } = this;

    const relatedById = groupBy(related, record =>
      Other.identifyBy(otherAttribute, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfAttribute, record);
      return relatedById[id] || [];
    });
  }

}
