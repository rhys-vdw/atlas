import identity from 'lodash/utility/identity';

import BelongsTo from './belongs-to';
import HasMany from './has-many';
import HasOne from './has-one';

export const belongsTo = (toMapper) => (Other, ...args) => (Self) =>
  new BelongsTo(Self, toMapper(Other), ...args);

export const hasMany = (toMapper) => (Other, ...args) => (Self) =>
  new HasMany(Self, toMapper(Other), ...args);

export const hasOne = (toMapper) => (Other, ...args) => (Self) =>
  new HasOne(Self, toMapper(Other), ...args);

export function initialize(toMapper = identity) {
  return {
    belongsTo: belongsTo(toMapper),
    hasMany: hasMany(toMapper),
    hasOne: hasOne(toMapper),
  };
}
