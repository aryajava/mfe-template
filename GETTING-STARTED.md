# Template MFE - Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

```bash
npm install -g pnpm
```

## Project Structure

```
template/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Defines all packages
├── start.ps1                 # Windows quick start
├── start.sh                  # Linux/Mac quick start
│
├── template-shared/          # Shared library (@template/shared)
│   └── src/
│       ├── components/ui/    # Button, Card, Input, etc.
│       ├── components/common/ # LoadingSpinner, ErrorFallback
│       ├── contexts/         # SharedContext, LoadingContext
│       ├── hooks/            # useAuth, useEventBus
│       ├── lib/              # utils, eventBus, api client, env
│       └── types/            # Common types
│
├── template-shell/           # Host app - port 5000
│   ├── webpack.config.cjs    # Module Federation host
│   ├── env.js                # Runtime environment config
│   └── src/
│       ├── routes/routes.tsx # Static routes (add your MFEs here)
│       ├── components/       # Layout, LazyMFE, ErrorBoundary
│       └── pages/            # Login, Dashboard, NotFound
│
└── template-mfe-child/       # Remote MFE - port 5006
    ├── webpack.config.cjs    # Module Federation remote (exposes ./Module)
    └── src/
        ├── Module.tsx        # Federation entry point
        ├── App.tsx           # Standalone mode routes
        └── pages/            # Your pages go here
```

## Quick Start

### Option 1: One command

```bash
cd template
pnpm install
pnpm start
```

### Option 2: PowerShell (Windows)

```bash
.\start.ps1
```

### Option 3: Step by step

```bash
# Install all dependencies
pnpm install

# Start shell and child MFE concurrently
pnpm dev
```

Then open:
- **Shell:** http://localhost:5000
- **Child MFE (standalone):** http://localhost:5006

## How It Works

### Shell (Host)

The shell is the main application that:
- Provides the login page and authentication
- Renders the sidebar layout
- Loads child MFEs dynamically via **Module Federation**
- Manages shared dependencies (React, React Router, etc.)

Routes are defined statically in `template-shell/src/routes/routes.tsx`:

```tsx
<Route
  path="/child/*"
  element={
    <MFEErrorBoundary mfeName="Child MFE">
      <LazyMFE
        scope="childMFE"
        module="./Module"
        url="http://localhost:5006/remoteEntry.js"
        basePath="/child"
      />
    </MFEErrorBoundary>
  }
/>
```

### Child MFE (Remote)

Each child MFE:
- Exposes a `Module` component via Module Federation
- Works standalone (via `App.tsx` + `bootstrap.tsx`)
- Works when loaded by the shell (via `Module.tsx`)
- Shares React/React Router with the shell (singleton)

### Shared Library

`@template/shared` provides:
- **UI components:** Button, Card, Input, Label, etc.
- **Common components:** LoadingSpinner, ErrorFallback
- **Contexts:** SharedContext (auth + query client), LoadingContext
- **Hooks:** useAuth, useEventBus
- **Utilities:** cn(), formatDate, formatCurrency, debounce
- **Infrastructure:** eventBus, api client, env helpers

Webpack aliases resolve `@template/shared` to source during dev, so no build step needed.

## Environment Configuration

Edit `template-shell/env.js` to configure:

```js
const MICROSERVICE_PORTS = {
  auth: 5139,
};

const MFE_ROUTES = {
  childMfe: "http://localhost:5006/remoteEntry.js",
};
```

For production, update the URLs to point to your deployed MFEs.

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm start` | Install + start all MFEs |
| `pnpm dev` | Start shell + child concurrently |
| `pnpm dev:shell` | Start shell only |
| `pnpm dev:child` | Start child MFE only |
| `pnpm build` | Production build all |
| `pnpm build:shared` | Build shared library |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm clean` | Remove dist/node_modules/cache |
