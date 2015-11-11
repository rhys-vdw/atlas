import identity from 'lodash/utility/identity';
import HasOne from './has-one';

export const hasOne = (toMapper) => (Other, ...args) => (Self) =>
  new HasOne(Self, toMapper(Other), ...args);

export function initialize(toMapper = identity) {
  return {
    hasOne: hasOne(toMapper)
  };
}
