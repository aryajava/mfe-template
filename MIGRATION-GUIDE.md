# Splitting a Monolith into Micro-Frontends

A practical guide to decomposing an existing React monorepo into a Module Federation-based MFE architecture.

## When to Split

Good candidates for MFE split:
- Multiple teams working on different features
- Independent deployment needs per feature
- Large bundle size slowing down initial load
- Different release cadences per module
- Need to isolate failures (one MFE down shouldn't crash the app)

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SHELL (Host) :5000                           │
│                                                                      │
│   ┌────────────┐  ┌─────────────┐  ┌──────────────────────────────┐  │
│   │   Login    │  │  Dashboard  │  │        LazyMFE Loader        │  │
│   └────────────┘  └─────────────┘  └──────────────┬───────────────┘  │
│                                                   │                  │
│   ┌───────────────────────────────────────────────┴────────────────┐ │
│   │              Layout (Sidebar + Top Bar)                        │ │
│   └───────────────────────────────────────────────────────────────-┘ │
└──────────────────────────────────────────────────────────────────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
┌─────────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│  Child MFE A        │ │  Child MFE B    │ │  Child MFE C     │
│  (Admin) :5006      │ │  (Reports) :5007│ │  (Workflow) :5008│
│                     │ │                 │ │                  │
│  scope: adminMFE    │ │ scope: reportMFE│ │ scope: workflowMFE│
│  exposes: ./Module  │ │ exposes: ./Module│ │ exposes: ./Module│
└─────────┬───────────┘ └───────┬─────────┘ └────────┬─────────┘
          │                     │                    │
          └─────────────────────┴────────────────────┘
                                │
                     ┌──────────┴──────────┐
                     │  @template/shared   │
                     │  (shared library)   │
                     │                     │
                     │  components, hooks, │
                     │  contexts, utils,   │
                     │  types, api client  │
                     └─────────────────────┘
```

## Step-by-Step Migration

### Step 1: Identify Module Boundaries

Look at your monolith's route structure. Each top-level route group is a candidate for a child MFE.

**Before (monolith):**
```
src/
├── pages/
│   ├── admin/
│   │   ├── Users.tsx
│   │   ├── Roles.tsx
│   │   └── AuditTrail.tsx
│   ├── reports/
│   │   ├── Dashboard.tsx
│   │   └── Export.tsx
│   └── workflow/
│       ├── Inbox.tsx
│       └── Detail.tsx
└── App.tsx (all routes here)
```

**After (MFE):**
```
template-shell/          → Login, Dashboard, Layout
template-mfe-admin/      → Users, Roles, AuditTrail
template-mfe-reports/    → Dashboard, Export
template-mfe-workflow/   → Inbox, Detail
template-shared/         → Common code
```

### Step 2: Create the Shared Library

Extract code used by **2 or more** modules into `@template/shared`.

**What to extract:**

| Category | Examples |
|----------|----------|
| UI components | Button, Card, Table, Modal, Form inputs |
| Common components | LoadingSpinner, ErrorFallback, Pagination |
| Contexts | Auth context, Theme context, Loading context |
| Hooks | useAuth, usePermission, useDebounce, useEventBus |
| Utilities | API client, date formatters, validators, storage helpers |
| Types | API response types, shared interfaces |

**What NOT to extract:**
- Page-specific components (only used in one MFE)
- Domain-specific business logic
- MFE-specific API calls

### Step 3: Set Up the Shell

Create the shell project with:

1. **Module Federation host config** in `webpack.config.cjs`:

```js
new ModuleFederationPlugin({
  name: 'shell',
  filename: 'remoteEntry.js',
  remotes: {},  // loaded dynamically via LazyMFE
  shared: {
    react: { singleton: true, eager: true },
    'react-dom': { singleton: true, eager: true },
    'react-router-dom': { singleton: true, eager: true },
    '@tanstack/react-query': { singleton: true },
  },
})
```

2. **LazyMFE component** that loads remotes dynamically at runtime (already in template).

3. **Static routes** pointing to each child MFE:

```tsx
<Route
  path="/admin/*"
  element={
    <LazyMFE
      scope="adminMFE"
      module="./Module"
      url="http://localhost:5006/remoteEntry.js"
      basePath="/admin"
    />
  }
/>
```

### Step 4: Create Each Child MFE

For each module extracted from the monolith:

1. Create a new package (copy from `template-mfe-child/`)
2. Set the Module Federation config with a unique `name`:

```js
new ModuleFederationPlugin({
  name: 'adminMFE',           // unique per MFE
  filename: 'remoteEntry.js',
  exposes: {
    './Module': './src/Module.tsx',  // the entry point
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-router-dom': { singleton: true },
    '@tanstack/react-query': { singleton: true },
  },
})
```

3. Create `Module.tsx` - the component the shell will render:

```tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { SharedProvider, LoadingProvider, GlobalLoadingOverlay } from '@template/shared';
import Users from './pages/Users';
import Roles from './pages/Roles';
// ... import your pages

interface ModuleProps {
  basePath?: string;
  subRoute?: string;
}

const ModuleContent: React.FC<ModuleProps> = ({ basePath = '/admin', subRoute }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Route to the correct page based on subRoute or path
  if (subRoute === 'users' || currentPath.includes('/users')) return <Users />;
  if (subRoute === 'roles' || currentPath.includes('/roles')) return <Roles />;

  return <Users />; // default
};

const Module: React.FC<ModuleProps> = (props) => {
  return (
    <SharedProvider>
      <LoadingProvider>
        <ModuleContent {...props} />
        <GlobalLoadingOverlay />
      </LoadingProvider>
    </SharedProvider>
  );
};

export default Module;
```

4. Move your page components from the monolith into `src/pages/`
5. Move related services/API calls into `src/services/`

### Step 5: Register in the Shell

Add the new MFE to the shell's `routes/routes.tsx`:

```tsx
<Route
  path="/admin/*"
  element={
    <MFEErrorBoundary mfeName="Admin">
      <LazyMFE
        scope="adminMFE"
        module="./Module"
        url="http://localhost:5006/remoteEntry.js"
        basePath="/admin"
      />
    </MFEErrorBoundary>
  }
/>
```

And add to `env.js`:

```js
const MFE_ROUTES = {
  adminMfe: "http://localhost:5006/remoteEntry.js",
  reportMfe: "http://localhost:5007/remoteEntry.js",
  workflowMfe: "http://localhost:5008/remoteEntry.js",
};
```

### Step 6: Add to pnpm Workspace

Update `pnpm-workspace.yaml`:

```yaml
packages:
  - 'template-shared'
  - 'template-shell'
  - 'template-mfe-admin'
  - 'template-mfe-reports'
  - 'template-mfe-workflow'
```

And add a dev script in root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently --names \"shell,admin,reports,workflow\" \
      \"pnpm --filter @template/shell dev\" \
      \"pnpm --filter @template/mfe-admin dev\" \
      \"pnpm --filter @template/mfe-reports dev\" \
      \"pnpm --filter @template/mfe-workflow dev\""
  }
}
```

## Checklist

### Before extracting a module

- [ ] Identified all routes belonging to this module
- [ ] Identified all API endpoints used by this module
- [ ] Identified shared code (used by 2+ modules)
- [ ] Identified module-specific code (only used here)

### Creating the child MFE

- [ ] Copied `template-mfe-child/` as starting point
- [ ] Set unique `name` in Module Federation config
- [ ] Set correct `port` in devServer
- [ ] Created `Module.tsx` with routing logic
- [ ] Created `App.tsx` with standalone routes
- [ ] Moved page components from monolith
- [ ] Moved related services/API calls
- [ ] Replaced monolith imports with `@template/shared`

### Registering in shell

- [ ] Added route in `routes/routes.tsx`
- [ ] Added URL in `env.js` MFE_ROUTES
- [ ] Added navigation item in Layout
- [ ] Added to `pnpm-workspace.yaml`

### Testing

- [ ] Child MFE works standalone at its own port
- [ ] Child MFE works when loaded by the shell
- [ ] Shared dependencies are singletons (no duplicate React)
- [ ] Auth context flows from shell to child MFEs
- [ ] Navigation between MFEs works without full page reload
- [ ] Error boundary catches MFE loading failures

## Common Pitfalls

### 1. Duplicate React instances

**Symptom:** Hooks error, multiple React copies.

**Fix:** Ensure `singleton: true` in shared config for all MFEs, and `eager: true` in the shell.

### 2. CSS conflicts between MFEs

**Symptom:** Styles from one MFE bleed into another.

**Fix:** Use CSS modules, scoped class names, or Tailwind (which generates unique classes).

### 3. MFE fails to load

**Symptom:** Blank page or loading spinner forever.

**Fix:**
- Check the remote URL is correct and the MFE dev server is running
- Check browser console for CORS errors
- Verify the `scope` and `module` names match the remote's config

### 4. Shared state not syncing

**Symptom:** Auth state doesn't flow to child MFEs.

**Fix:** Use the `SharedProvider` pattern - the shell passes auth context down, and each child MFE wraps its content with `SharedProvider`.

### 5. Routing conflicts

**Symptom:** Child MFE routes don't match or get 404.

**Fix:**
- Shell uses `path="/admin/*"` (with `/*` to pass through)
- Child MFE routes relative to its base (not `/admin/users`, just `users`)
- Use `useLocation()` in `Module.tsx` to detect current path

## Port Convention

Use consistent ports to avoid conflicts:

| Port | Project |
|------|---------|
| 5000 | Shell |
| 5001 | (reserved) |
| 5002-5005 | (reserved for services) |
| 5006 | Child MFE 1 (admin) |
| 5007 | Child MFE 2 (reports) |
| 5008 | Child MFE 3 (workflow) |
| 5009 | Child MFE 4 |
| 5010 | Child MFE 5 |
