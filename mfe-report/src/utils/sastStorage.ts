const PREFIX = 'sast_';

export const storage = {
  store: (key: string, value: string): void => {
    try {
      localStorage.setItem(`${PREFIX}${key}`, value);
    } catch {}
  },
  retrieve: (key: string): string | null => {
    try {
      return localStorage.getItem(`${PREFIX}${key}`) || localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
      localStorage.removeItem(key);
    } catch {}
  },
};
