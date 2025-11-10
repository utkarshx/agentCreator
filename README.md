# Agent Creator - Turborepo ✅

A monorepo for creating AI agents using visual node-based editing with Codebolt SDK integration.

**Migration Complete!** The project has been successfully converted from a single frontend application to a Turborepo monorepo structure.

## Packages

- **`@agent-creator/frontend`** - React frontend with LiteGraph for visual node editing
- **`@agent-creator/shared-nodes`** - Shared node definitions and metadata
- **`@agent-creator/backend`** - Express backend for executing AI agents

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies for all packages
npm install

# Or with yarn
yarn install
```

### Development

```bash
# Start all packages in development mode
npm run dev

# Or run individual packages
npm run dev --filter=@agent-creator/frontend
npm run dev --filter=@agent-creator/backend
```

### Building

```bash
# Build all packages
npm run build

# Build individual packages
npm run build --filter=@agent-creator/shared-nodes
npm run build --filter=@agent-creator/frontend
npm run build --filter=@agent-creator/backend
```

## Architecture

### Frontend (Port 3000)
- React application with LiteGraph for visual node editing
- Node palette with drag-and-drop interface
- Real-time agent execution and results display

### Shared Nodes
- Base node classes extending LiteGraph's LGraphNode
- Node metadata and registration utilities
- AI Agent node definitions

### Backend (Port 3001)
- Express server for graph execution
- Codebolt SDK integration
- Real agent execution with MCP tools

## AI Agent Nodes

The system includes these AI agent nodes:

1. **UserMessage** - Creates UserMessage from input
2. **SystemPrompt** - Creates SystemPrompt from YAML
3. **MCPTools** - Fetches tools from MCP servers
4. **TaskInstruction** - Creates task with tools and message
5. **Agent** - Creates Agent instance
6. **AgentRun** - Executes agent and returns results

## Usage

1. Start the development servers
2. Open the frontend (http://localhost:3000)
3. Add AI agent nodes from the palette
4. Connect nodes: UserMessage → TaskInstruction → Agent → AgentRun
5. Enter a message and click "Execute Graph"
6. View AI agent responses in the results panel

## Development Workflow

```bash
# Work on shared nodes
cd packages/shared-nodes
npm run dev

# Work on frontend
cd packages/frontend
npm run dev

# Work on backend
cd packages/backend
npm run dev
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, LiteGraph
- **Backend**: Express, TypeScript, Node.js
- **Shared**: TypeScript, LiteGraph
- **Build**: Turborepo, TypeScript
- **AI**: Codebolt SDK (@codebolt/codeboltjs, @codebolt/utils)