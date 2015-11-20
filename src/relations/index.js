import identity from 'lodash/utility/identity';
import HasOne from './has-one';
import HasMany from './has-many';

export const hasOne = (toMapper) => (Other, ...args) => (Self) =>
  new HasOne(Self, toMapper(Other), ...args);

export const hasMany = (toMapper) => (Other, ...args) => (Self) =>
  new HasMany(Self, toMapper(Other), ...args);

export function initialize(toMapper = identity) {
  return {
    hasOne: hasOne(toMapper),
    hasMany: hasMany(toMapper),
  };
}
