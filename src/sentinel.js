export const sentinel = (sentinel) => (Constructor) => {
  Constructor.sentinel = sentinel;
  Constructor.prototype[sentinel] = true;
};

export const instanceWithSentinel = (Constructor) => (maybeMatch) =>
  !!(maybeMatch && maybeMatch[Constructor.sentinel]);
