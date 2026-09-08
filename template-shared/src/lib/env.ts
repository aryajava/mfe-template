export const getApiUrl = (serviceName: string): string => {
  if (typeof window !== "undefined" && (window as any)._env?.getApiUrl) {
    const url = (window as any)._env.getApiUrl(serviceName);
    if (url) return url;
  }

  console.warn(
    `window._env.getApiUrl not found - using fallback for ${serviceName}`,
  );

  const fallbackPorts: Record<string, number> = {
    auth: 5139,
    workflow: 5224,
    rules: 5227,
    dedup: 5084,
    portfolio: 5091,
    screening: 5291,
    partnership: 5062,
    common: 5062,
  };

  const port = fallbackPorts[serviceName] || 5000;
  return `http://localhost:${port}/api`;
};

export const getAllApiUrls = (): Record<string, string> => {
  if (typeof window !== "undefined" && (window as any)._env?.API_URLS) {
    return (window as any)._env.API_URLS;
  }

  return {
    auth: getApiUrl("auth"),
    workflow: getApiUrl("workflow"),
    rules: getApiUrl("rules"),
    dedup: getApiUrl("dedup"),
    portfolio: getApiUrl("portfolio"),
    screening: getApiUrl("screening"),
    partnership: getApiUrl("partnership"),
    common: getApiUrl("common"),
  };
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && (window as any)._env?.API_BASE_URL) {
    return (window as any)._env.API_BASE_URL;
  }

  console.warn("window._env not found - using fallback API URL");
  return "http://localhost:5139/api";
};

export const getEnvMode = (): string => {
  if (typeof window !== "undefined" && (window as any)._env?.MODE) {
    return (window as any)._env.MODE;
  }
  return "local";
};

export const getEnvConfig = (): Record<string, any> => {
  if (typeof window !== "undefined" && (window as any)._env) {
    return (window as any)._env;
  }
  return {
    MODE: "local",
    API_BASE_URL: "http://localhost:5000/api",
  };
};
