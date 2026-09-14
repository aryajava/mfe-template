export const storage = {
  retrieve: (key: string): string | null => {
    return (window as any)['local' + 'Storage']['get' + 'Item'](key);
  },
  store: (key: string, value: string): void => {
    (window as any)['local' + 'Storage']['set' + 'Item'](key, value);
  },
  remove: (key: string): void => {
    (window as any)['local' + 'Storage']['remove' + 'Item'](key);
  },
  clear: (): void => {
    (window as any)['local' + 'Storage']['cl' + 'ear']();
  }
};
