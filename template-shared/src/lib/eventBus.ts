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
    console.log(`[EventBus] Subscribed to "${event}". Total listeners:`, this.listeners.get(event)!.size);

    return () => {
      this.listeners.get(event)?.delete(callback as EventCallback);
      console.log(`[EventBus] Unsubscribed from "${event}".`);
    };
  }

  publish<T>(event: string, data?: T): void {
    console.log(`[EventBus] Publishing "${event}" with data:`, data);
    const callbacks = this.listeners.get(event);
    if (callbacks && callbacks.size > 0) {
      console.log(`[EventBus] Dispatching to ${callbacks.size} listener(s)...`);
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${event}":`, error);
        }
      });
    } else {
      console.warn(`[EventBus] No listeners found for "${event}"!`);
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

const GLOBAL_EVENT_BUS_KEY = '__MFE_EVENT_BUS__';

export const eventBus: EventBusInstance =
  typeof window !== 'undefined'
    ? ((window as any)[GLOBAL_EVENT_BUS_KEY] =
        (window as any)[GLOBAL_EVENT_BUS_KEY] || new EventBus())
    : new EventBus();

export const MFE_EVENTS = {
  NAVIGATE_TO: 'mfe:navigate',
  NAVIGATION_COMPLETE: 'mfe:navigation_complete',

  USER_LOGGED_IN: 'auth:logged_in',
  USER_LOGGED_OUT: 'auth:logged_out',
  SESSION_EXPIRED: 'auth:session_expired',
  TOKEN_REFRESHED: 'auth:token_refreshed',
  PERMISSIONS_UPDATED: 'auth:permissions_updated',

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
