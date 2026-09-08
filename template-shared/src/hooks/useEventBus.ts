import { useEffect, useCallback, useRef } from 'react';
import { eventBus, MFE_EVENTS, type EventCallback, type MFEEventType } from '../lib/eventBus';

export const useEventBus = () => {
  const subscriptionsRef = useRef<Array<() => void>>([]);

  const subscribe = useCallback(
    <T>(event: MFEEventType | string, callback: EventCallback<T>): (() => void) => {
      const unsubscribe = eventBus.subscribe(event, callback);
      subscriptionsRef.current.push(unsubscribe);
      return unsubscribe;
    },
    []
  );

  const publish = useCallback(<T>(event: MFEEventType | string, data?: T): void => {
    eventBus.publish(event, data);
  }, []);

  const once = useCallback(
    <T>(event: MFEEventType | string, callback: EventCallback<T>): (() => void) => {
      const unsubscribe = eventBus.once(event, callback);
      subscriptionsRef.current.push(unsubscribe);
      return unsubscribe;
    },
    []
  );

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((unsub) => unsub());
      subscriptionsRef.current = [];
    };
  }, []);

  return {
    subscribe,
    publish,
    once,
    events: MFE_EVENTS,
  };
};

export const useEventSubscription = <T>(
  event: MFEEventType | string,
  callback: EventCallback<T>,
  deps: React.DependencyList = []
) => {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(event, callback);
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
};
