(function () {
  const MODE = "local";

  const MARQUEE = {
    enabled: false,
    message: "This is a development environment",
  };

  const ALLOWED_DOMAINS = ["localhost"];

  const MICROSERVICE_PORTS = {
    auth: 5139,
  };

  const API_URLS = {
    local: `http://localhost:${MICROSERVICE_PORTS.auth}/api`,
  };

  const MFE_ROUTES = {
    childMfe: "http://localhost:5006/remoteEntry.js",
    mfeHallo: "http://localhost:5007/remoteEntry.js",
  };

  const _actualEnv = {
    MODE: MODE,
    API_BASE_URL: API_URLS[MODE] || API_URLS.local,
    MARQUEE: MARQUEE,
    ALLOWED_DOMAINS: ALLOWED_DOMAINS,
    APP_NAME: "Template MFE Shell",
    VERSION: "1.0.0",

    getApiUrl(serviceName) {
      const port = MICROSERVICE_PORTS[serviceName] || 5000;
      return `http://localhost:${port}/api`;
    },

    getMfeUrl(mfeName) {
      return MFE_ROUTES[mfeName] || null;
    },

    MFE_ROUTES: MFE_ROUTES,
  };

  Object.defineProperty(window, '_env', {
    get() {
      return _actualEnv;
    }
  });

  Object.freeze(window._env);

  console.log("[ENV] Mode:", MODE);
})();
