function createSetter(getNow) {
  return function(attributes) {
    if (!this.state.omitTimestamps) {
      return getNow();
    }
  };
}

function defaultGetNow() {
  return new Date();
}

function assignHelpers(target, attribute, verb) {

  const beforeMethod = `${verb}Before`;
  const afterMethod = `${verb}After`;

  target[beforeMethod] = function(date) {
    return this.where(attribute, '<', date);
  };

  target[afterMethod] = function(date) {
    return this.where(attribute, '>', date);
  };

  target[`${verb}Between`] = function(min, max) {
    return this.withMutations(mapper => {
      mapper
        .where(attribute, '>', min)
        .where(attribute, '<', max);
    });
  };
}

export default function Timestamps({
  createdAt = 'created_at',
  updatedAt = 'updated_at',
  getNow = defaultGetNow
}) {

  const methods = {

    initialize(mapper) {
      const setter = createSetter(getNow);

      if (createdAt != null) {
        mapper.defaultAttribute(createdAt, setter);
      }

      if (updatedAt != null) {
        mapper.strictAttribute(updatedAt, setter);
      }
    },

    omitTimestamps() {
      return this.setState({ omitTimestamps: true });
    }
  };

  if (createdAt != null) {
    assignHelpers(methods, createdAt, 'created');
  }

  if (updatedAt != null) {
    assignHelpers(methods, updatedAt, 'updated');
  }

  return methods;
}
