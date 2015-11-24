import { assign } from 'lodash/object';
import { isArray } from 'lodash/lang';
import { groupBy } from 'lodash/collection';
import { first } from 'lodash/array';

import Mapper from '../mapper';
import { mapperAttributeRef } from '../naming/default-column';
import * as DefaultTable from '../naming/table';
import { isComposite, assertKeysCompatible } from '../arguments';
import { hasMany } from './index';

export default class BelongsToMany {
  constructor(Self, Other, Pivot = null, {
    selfKey, otherKey,
    pivotSelfRef, pivotOtherRef, pivotTable, pivotName = 'pivot'
  } = {}) {

    if (selfKey == null) {
      selfKey = Self.getOption('idAttribute');
    }

    if (pivotSelfRef == null) pivotSelfRef = Self.attributeToColumn(
      mapperAttributeRef(Self, selfKey)
    );

    assertKeysCompatible({ selfKey, pivotSelfRef });

    if (otherKey == null) {
      otherKey = Other.getOption('idAttribute');
    }

    if (pivotOtherRef == null) pivotOtherRef = Other.attributeToColumn(
      mapperAttributeRef(Other, otherKey)
    );

    assertKeysCompatible({ otherKey, pivotOtherRef });

    if (Pivot == null) {
      Pivot = Mapper
        .table(pivotTable || DefaultTable.pivot(Other, Self))
        .idAttribute(pivotSelfRef, pivotOtherRef);
    }

    assign(this, {
      Self, Other, Pivot,
      selfKey, otherKey, pivotSelfRef, pivotOtherRef, pivotName,
      selfAttribute: selfKey, otherAttribute: pivotSelfRef
    });
  }

  toMapper(...targetIds) {
    const {
      Self, Other, Pivot,
      selfKey, otherKey, pivotSelfRef, pivotOtherRef, pivotName
    } = this;

    const id = Self.identifyBy(selfKey, ...targetIds);
    const isSingle = !isArray(id) ||
      isComposite(selfKey) && !isComposite(first(id));

    const ConstrainedPivot = isSingle
      ? Pivot.where(pivotSelfRef, id)
      : Pivot.whereIn(pivotSelfRef, id);

    const pivotRelation = hasMany(
      ConstrainedPivot,
      { selfKey: otherKey, otherRef: pivotOtherRef }
    );

    return Other.withMutations(other =>
      other
        .relations({ [pivotName]: pivotRelation })
        .joinRelation(pivotName)
        .pivotAttributes(pivotSelfRef, pivotOtherRef)
    );
  }

  assignRelated(records, relationName, related) {
    const { Self, Other, selfKey, otherRef } = this;

    if (!isArray(records)) {
      return Self.setRelated(records, relationName, related);
    }

    const relatedById = groupBy(related, record =>
      Other.identifyBy(otherRef, record)
    );

    return records.map(record => {
      const id = Self.identifyBy(selfKey, record);
      const related = relatedById[id] || [];
      return Self.setRelated(record, relationName, related);
    });
  }

}
