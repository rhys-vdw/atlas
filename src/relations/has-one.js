import { isArray } from 'lodash/lang';
import { indexBy } from 'lodash/collection';
import { first } from 'lodash/array';
import * as DefaultColumn from '../naming/default-column';
import { isComposite, keysCompatible } from '../arguments';

export default class HasOne {
  constructor(Self, Other, { selfKey, otherRef } = {}) {
    if (selfKey == null) {
      selfKey = Self.requireState('idAttribute');
    }

    if (otherRef == null) {
      otherRef = DefaultColumn.mapperAttributeRef(Self, selfKey);
    }

    if (!keysCompatible(selfKey, otherRef)) throw new TypeError(
      `Mismatched key types. selfKey=${selfKey} otherRef=${otherRef}`
    );

    this.Self = Self;
    this.Other = Other;
    this.selfKey = selfKey;
    this.otherRef = otherRef;
  }

  toMapper(...targetIds) {
    const { Self, Other, selfKey, otherRef } = this;

    const id = Self.identifyBy(selfKey, ...targetIds);
    const isSingle = !isArray(id) ||
      isComposite(selfKey) && !isComposite(first(id));

    return Other.withMutations(mapper => {
      mapper.targetBy(otherRef, id);
      if (isSingle) {
        mapper.defaultAttribute(otherRef, id);
      }
    });
  }

  assignRelated(records, relationName, related) {
    const { Self, Other, selfKey, otherRef } = this;

    if (!isArray(records)) {
      return Self.setRelated(records, relationName, related);
    }

    const relatedById = indexBy(related, record =>
      Other.identifyBy(otherRef, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfKey, record);
      const related = relatedById[id] || null;
      return Self.setRelated(record, relationName, related);
    });
  }

}
