export default {
  async fetch(request, env) {
    // Simply pass through to the static assets
    return env.ASSETS.fetch(request);
  },
};
