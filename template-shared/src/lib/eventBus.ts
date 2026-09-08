export type EventCallback<T = unknown> = (data: T) => void;

export interface EventBusInstance {
  subscribe: <T>(event: string, callback: EventCallback<T>) => () => void;
  publish: <T>(event: string, data?: T) => void;
  once: <T>(event: string, callback: EventCallback<T>) => () => void;
}

class EventBus implements EventBusInstance {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);

    return () => {
      this.listeners.get(event)?.delete(callback as EventCallback);
    };
  }

  publish<T>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  once<T>(event: string, callback: EventCallback<T>): () => void {
    const unsubscribe = this.subscribe<T>(event, (data) => {
      unsubscribe();
      callback(data);
    });
    return unsubscribe;
  }
}

export const eventBus = new EventBus();

export const MFE_EVENTS = {
  NAVIGATE_TO: 'mfe:navigate',
  NAVIGATION_COMPLETE: 'mfe:navigation_complete',

  USER_LOGGED_IN: 'auth:logged_in',
  USER_LOGGED_OUT: 'auth:logged_out',
  SESSION_EXPIRED: 'auth:session_expired',
  TOKEN_REFRESHED: 'auth:token_refreshed',

  DATA_UPDATED: 'data:updated',
  CACHE_INVALIDATE: 'cache:invalidate',

  NOTIFICATION_SHOW: 'ui:notification',
  MODAL_OPEN: 'ui:modal_open',
  MODAL_CLOSE: 'ui:modal_close',
  SIDEBAR_TOGGLE: 'ui:sidebar_toggle',

  MFE_ERROR: 'mfe:error',
  API_ERROR: 'api:error',
} as const;

export type MFEEventType = (typeof MFE_EVENTS)[keyof typeof MFE_EVENTS];
