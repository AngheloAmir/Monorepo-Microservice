# Turborepo Integration & Features Reference

This document serves as a reference for the Turborepo integration in this monorepo, covering the setup details, core features, and strategies for CI/CD and GUI integration.

## 1. Integration Setup (Current Implementation)

To introduce Turborepo without affecting your existing folder structure or breaking the root dependencies, the following setup was implemented:

### Isolated Installation
- **Location**: `_tool/turborepo/package.json`
- **Purpose**: Checks the `turbo` binary and its dependencies are isolated here. This prevents cluttering the root `package.json` with dev dependencies.
- **Workspace**: Added `_tool/turborepo` to the root `workspaces` list so it can be linked.

### Configuration (`turbo.json`)
A `turbo.json` file was created at the root. This is the brain of the operation, defining how tasks relate to one another.

- **Pipeline/Tasks**:
  - `build`: Depends on `^build` (build dependencies first). Output cached.
  - `dev`: Persistent task (no caching), run in parallel.
  - `lint` & `test`: Standard downstream tasks.
  
*(Note: We used the modern `tasks` key instead of the deprecated `pipeline` key).*

### Compatibility
- **Package Manager**: Added `"packageManager": "npm@11.6.2"` to the root `package.json`. This is required by newer Turborepo versions to deterministically manage lockfiles.

---

## 2. Core Features of Turborepo

Turborepo acts as a high-performance build engine. Its primary mantra is **"Never do the same work twice."**

### 1. Incremental Execution (Caching)
- **How it works**: Turbo remembers the inputs (source code) and outputs (logs, build files) of every task.
- **Benefit**: If you run `turbo run build` twice without changing code, the second run completes in milliseconds by replaying logs and restoring files from the cache.

### 2. Parallel Execution
- **How it works**: Turbo analyzes the dependency graph. Independent tasks (e.g., linting `frontend` while building `backend`) run simultaneously on available CPU cores.
- **Benefit**: Drastically reduces build times compared to serial execution.

### 3. Task Pipelines & Graph Management
- **How it works**: Defined in `dependsOn`. `^build` ensures dependencies are built before the consumer.
- **Benefit**: Removes the need for complex shell scripts with `&&` chains.

### 4. Filtering (`--filter`)
- **How it works**: Scopes commands to specific parts of the monorepo.
- **Example**: `turbo run build --filter=frontend/*` only builds the frontend and its dependencies.

---

## 3. CI/CD & GUI Integration Strategies

Since you manage this repo with a custom GUI tool, you can leverage Turbo as the underlying engine to power advanced workflows.

### A. Smart "Diff" Builds (The "Changed" Filter)
Execute tasks *only* on packages that have changed since the last commit or reference branch.

**Command:**
```bash
# Build only packages changed compared to the 'master' branch
npx turbo run build --filter="[master...]"
```

**Workflow**:
1. You edit `backend/node-service`.
2. CI/GUI runs the command above.
3. Turbo rebuilds `node-service` but skips unchanged packages like `database` or `shared`.

### B. Docker Deployments (Pruning)
Create a lightweight subset of your monorepo for a specific application's Docker build.

**Command:**
```bash
npx turbo prune --scope=my-backend-service --docker
```
**Workflow**:
1. Generates an `out` folder containing *only* the source code and internal packages needed for `my-backend-service`.
2. COPY this `out` folder into your Docker container instead of the massive root monorepo.
3. Result: Faster Docker builds and smaller images.

### C. Visualizing the Pipeline
Your GUI can generate a visual graph of dependencies and tasks.

**Command:**
```bash
npx turbo run build --graph=graph.html
```

### D. GUI Implementation Tips
If adding a "Deployment" tab to your GUI:
1. **Status Check**: Run `npx turbo run build --dry-run` to parse what *would* execute.
2. **Visual Feedback**: Capture `stdout`. Look for `[CACHE HIT]` to show users which steps were instant.
3. **Selective Deploy**: Use `--filter` heavily to allow users to "Deploy Backend" or "Test Frontend" independently.


npx turbo run build --dry-run