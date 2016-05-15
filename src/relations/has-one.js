import { isArray, keyBy, head } from 'lodash';
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

  of(...records) {
    const { Self, Other, selfKey, otherRef } = this;

    const id = Self.identifyBy(selfKey, ...records);
    const isSingle = !isArray(id) ||
      isComposite(selfKey) && !isComposite(head(id));

    return Other.withMutations(mapper => {
      mapper.targetBy(otherRef, id);
      if (isSingle) {
        mapper.defaultAttribute(otherRef, id);
      }
    });
  }

  mapRelated(records, related) {
    if (!isArray(records)) {
      return related || null;
    }

    const { Self, Other, selfKey, otherRef } = this;

    const relatedById = keyBy(related, record =>
      Other.identifyBy(otherRef, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfKey, record);
      return relatedById[id] || null;
    });
  }

}
