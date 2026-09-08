import React, { useEffect, useState, Suspense, type ComponentType } from 'react';
import { PageLoader } from '@template/shared';

interface LazyMFEProps {
  scope: string;
  module: string;
  url: string;
  version?: string;
  fallback?: React.ReactNode;
  basePath?: string;
  subRoute?: string;
}

interface ComponentWrapper {
  component: ComponentType<any> | null;
}

interface RemoteContainer {
  init: (shareScope: any) => Promise<void>;
  get: (module: string) => Promise<() => any>;
  _initialized?: boolean;
}

const componentCache = new Map<string, ComponentType<any>>();

export const LazyMFE: React.FC<LazyMFEProps> = ({
  scope, module, url, version, fallback, basePath, subRoute
}) => {
  const cacheKey = version ? `${scope}::${module}::${version}` : `${scope}::${module}`;
  const [componentWrapper, setComponentWrapper] = useState<ComponentWrapper>({
    component: componentCache.get(cacheKey) || null
  });
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!componentCache.has(cacheKey));

  useEffect(() => {
    const cachedComponent = componentCache.get(cacheKey);
    setComponentWrapper({ component: cachedComponent || null });
    setLoading(!cachedComponent);
    setError(null);
  }, [cacheKey]);

  useEffect(() => {
    if (componentCache.has(cacheKey)) return;

    const loadComponent = async () => {
      try {
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        const versionedUrl = (() => {
          if (isDev) {
            const timestamp = Date.now();
            return url.includes('?') ? `${url}&_t=${timestamp}` : `${url}?_t=${timestamp}`;
          } else if (version) {
            return url.includes('?') ? `${url}&v=${version}` : `${url}?v=${version}`;
          }
          return url;
        })();

        const container = await loadRemoteContainer(scope, versionedUrl, version);
        const factory = await container.get(module);
        const Module = factory();

        let Component;
        if (typeof Module === 'function') Component = Module;
        else if (Module?.default) Component = Module.default;
        else if (Module?.__esModule && Module?.Module) Component = Module.Module;
        else {
          const componentKey = Object.keys(Module || {}).find(key => typeof Module[key] === 'function');
          if (componentKey) Component = Module[componentKey];
          else throw new Error(`No valid React component found in ${scope}/${module}`);
        }

        componentCache.set(cacheKey, Component);
        setComponentWrapper({ component: Component });
        setLoading(false);
      } catch (err) {
        console.error(`[LazyMFE] Failed to load ${scope}/${module}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    };

    loadComponent();
  }, [scope, module, url, version, cacheKey]);

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">{scope} Not Available</h3>
          <p className="text-sm text-yellow-800 mb-4">The module is not running or failed to load.</p>
          <div className="text-xs text-yellow-700 bg-yellow-100 rounded p-3">
            <p className="font-medium mb-1">For Developers:</p>
            <p>This micro-frontend may not be running. Check if the dev server is started on the correct port.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !componentWrapper.component) {
    return <>{fallback || <PageLoader />}</>;
  }

  const Component = componentWrapper.component;

  return (
    <Suspense fallback={fallback || <PageLoader />}>
      <Component basePath={basePath} subRoute={subRoute} />
    </Suspense>
  );
};

async function loadRemoteContainer(scope: string, url: string, version?: string): Promise<RemoteContainer> {
  const containerKey = version ? `${scope}_v${version}` : scope;

  if ((window as any)[containerKey]) {
    return (window as any)[containerKey];
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load remote entry for ${scope} from ${url}`));
    document.head.appendChild(script);
  });

  const container = (window as any)[scope];
  if (!container) throw new Error(`Container ${scope} not found after loading ${url}`);

  if (!container._initialized) {
    const shareScope = (window as any).__webpack_share_scopes__?.default;
    if (!shareScope) throw new Error('[LazyMFE] Share scope not initialized');

    if (!shareScope['react'] || !shareScope['react-dom']) {
      throw new Error('Required React dependencies not shared');
    }

    await container.init(shareScope);
    container._initialized = true;
  }

  (window as any)[containerKey] = container;
  return container;
}
