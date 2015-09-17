
const options = {
  isSingle: false
}

const methods = {

  all() {
    return this.setOption('isSingle', false);
  },

  one() {
    return this.setOption('isSingle', true);
  },
}

export default { options, methods };
