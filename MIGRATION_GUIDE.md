# Migration Guide: From Single Project to Turborepo

This guide explains how to migrate from the single-project structure to the new Turborepo monorepo structure.

## Overview

The project has been restructured from a single frontend project to a Turborepo monorepo with three packages:

- **`@agent-creator/frontend`** - React frontend
- **`@agent-creator/shared-nodes`** - Shared node definitions
- **`@agent-creator/backend`** - Express backend

## Key Changes

### 1. Project Structure

**Before:**
```
agentCreatorUI/
├── src/                 # Frontend source
├── backend/             # Backend code
├── shared/              # Shared nodes
├── package.json
└── vite.config.js
```

**After:**
```
agentCreator/
├── packages/
│   ├── frontend/        # Frontend package
│   ├── shared-nodes/    # Shared nodes package
│   └── backend/         # Backend package
├── scripts/             # Utility scripts
├── turbo.json          # Turborepo config
├── package.json        # Root workspace config
└── README.md
```

### 2. Package Dependencies

**Before:** Direct imports using relative paths
```javascript
// frontend/src/nodes/index.js
import { registerNodeWithMetadata } from '../../shared/nodes/index.js';
```

**After:** Workspace dependencies
```javascript
// packages/frontend/src/nodes/index.js
import { registerNodeWithMetadata } from '@agent-creator/shared-nodes';
```

### 3. Build System

**Before:** Single Vite build
```bash
npm run build
npm run dev
```

**After:** Turborepo coordinated builds
```bash
# Build all packages
npm run build

# Run specific package
npm run dev --filter=@agent-creator/frontend

# Run all packages together
npm run dev:all
```

## Migration Steps

### Step 1: Update Your Development Environment

1. **Install Yarn** (recommended for better workspace support):
   ```bash
   npm install -g yarn
   ```

2. **Install Dependencies:**
   ```bash
   cd agentCreator
   yarn install
   ```

### Step 2: Update Development Workflow

**New Development Commands:**
```bash
# Start all services (frontend + backend)
yarn dev:all

# Start only frontend
yarn dev --filter=@agent-creator/frontend

# Start only backend
yarn dev --filter=@agent-creator/backend

# Build all packages
yarn build

# Type-check all packages
yarn type-check

# Clean all build artifacts
yarn clean
```

### Step 3: Update Import Statements

If you have any custom code that imports from the old structure, update imports:

**Frontend:**
```javascript
// Before
import { BaseNode } from '../../shared/nodes/BaseNode.js';

// After
import { BaseNode } from '@agent-creator/shared-nodes';
```

**Backend:**
```javascript
// Before
import { BaseNode } from '../../shared/nodes/BaseNode.js';

// After
import { BaseNode } from '@agent-creator/shared-nodes';
```

### Step 4: Update Configuration Files

**Frontend Config:** Now in `packages/frontend/`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`

**Backend Config:** Now in `packages/backend/`
- `tsconfig.json`
- Server entry: `src/server.ts`

**Shared Nodes Config:** Now in `packages/shared-nodes/`
- `tsconfig.json`

### Step 5: Update Environment Variables

Backend environment files now go in `packages/backend/`:
- `.env`
- `.env.local`
- `.env.development.local`

### Step 6: Update Deployment Scripts

**Frontend Build Output:** `packages/frontend/dist/`
**Backend Build Output:** `packages/backend/dist/`

## Development URLs

- **Frontend:** http://localhost:3000 (unchanged)
- **Backend:** http://localhost:3001 (unchanged)

## Package Scripts

### Root Package Scripts
- `build` - Build all packages in dependency order
- `dev` - Run all packages in development mode
- `dev:all` - Run frontend and backend together with nice logging
- `lint` - Lint all packages
- `type-check` - Type-check all packages
- `clean` - Clean all build artifacts
- `format` - Format all code with Prettier

### Package-Specific Scripts

**Frontend (`packages/frontend/`):**
- `dev` - Start Vite dev server
- `build` - Build for production
- `preview` - Preview production build
- `type-check` - TypeScript type checking

**Backend (`packages/backend/`):**
- `dev` - Start server with tsx watch
- `build` - Compile TypeScript to JavaScript
- `start` - Start production server
- `type-check` - TypeScript type checking

**Shared Nodes (`packages/shared-nodes/`):**
- `dev` - Compile TypeScript in watch mode
- `build` - Compile TypeScript to JavaScript
- `type-check` - TypeScript type checking

## Troubleshooting

### Common Issues

1. **Import Errors:**
   - Make sure all imports use `@agent-creator/shared-nodes` instead of relative paths
   - Run `yarn install` to link workspace dependencies

2. **Build Failures:**
   - Check that shared-nodes package builds first: `yarn build --filter=@agent-creator/shared-nodes`
   - Then build frontend: `yarn build --filter=@agent-creator/frontend`

3. **TypeScript Errors:**
   - Ensure all TypeScript configs have proper paths configured
   - Run `yarn type-check` to identify issues

4. **Development Server Issues:**
   - Make sure ports 3000 and 3001 are available
   - Use `yarn dev:all` for coordinated startup

### Getting Help

If you encounter issues during migration:

1. Check the console output for specific error messages
2. Ensure all dependencies are installed: `yarn install`
3. Verify import paths are updated correctly
4. Try cleaning and rebuilding: `yarn clean && yarn build`

## Benefits of the New Structure

1. **Better Code Organization** - Clear separation of concerns
2. **Independent Development** - Work on packages independently
3. **Faster Builds** - Turborepo caching and incremental builds
4. **Shared Dependencies** - Common node definitions are truly shared
5. **Scalability** - Easy to add more packages in the future
6. **Type Safety** - Better TypeScript support across packages