import React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactJSXRuntime from 'react/jsx-runtime';
import * as ReactRouterDOM from 'react-router-dom';
import * as ReactQuery from '@tanstack/react-query';

export const sharedModules = {
  react: React,
  'react-dom': ReactDOM,
  'react/jsx-runtime': ReactJSXRuntime,
  'react-router-dom': ReactRouterDOM,
  '@tanstack/react-query': ReactQuery,
};

export const initSharedDependencies = () => {
  if (!(window as any).React) (window as any).React = React;
  if (!(window as any).ReactDOM) (window as any).ReactDOM = ReactDOM;

  if (!(window as any).__webpack_share_scopes__) {
    (window as any).__webpack_share_scopes__ = { default: {} };
  }

  const scope = (window as any).__webpack_share_scopes__.default;

  const registerModule = (name: string, version: string, module: any) => {
    if (!scope[name]) {
      scope[name] = {
        [version]: {
          get: () => Promise.resolve(() => module),
          loaded: true,
          from: 'shell',
          eager: true,
        }
      };
    }
  };

  registerModule('react', '18.3.1', React);
  registerModule('react-dom', '18.3.1', ReactDOM);
  registerModule('react/jsx-runtime', '18.3.1', ReactJSXRuntime);
  registerModule('react-router-dom', '6.28.1', ReactRouterDOM);
  registerModule('@tanstack/react-query', '5.0.0', ReactQuery);

  console.log('[Shell] Module Federation dependencies initialized');
};

export const getSharedModule = (moduleName: string) => {
  return sharedModules[moduleName as keyof typeof sharedModules];
};
