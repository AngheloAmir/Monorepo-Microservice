# Monorepo Microservice Architecture

Welcome to the Monorepo Microservice project. This repository uses **Turborepo** to manage a scalable architecture comprising multiple backends, frontends, and shared libraries.

## 🚀 Getting Started

### Prerequisites
*   **Node.js v25+**: As of this writting, the MAIN TOOL is tested using Node.js v25
*   **NPM**: Used for workspace management.

### Installation
Run the following command in the root directory. This will install dependencies for **all** workspaces (backend, frontend, shared tools, and the management dashboard).

```bash
npm install
```

### Running the Management Tool
We have a custom GUI to help you manage, build, and deploy your microservices.

```bash
# Start the Management Dashboard (Development Mode)
npm run devtool

# OR Start in Production Mode
npm run starttool
```


## 🛠 Tech Stack For the Main Tool
*   **Build System**: [Turborepo](https://turbo.build/) (High-performance build orchestration)
*   **Runtime**: Node.js v25 (the main tool is tested in this version)
*   **Database ORM**: [Prisma](https://www.prisma.io/) (Type-safe database access)


## 📂 Project Structure

| Folder | Description |
| :--- | :--- |
| **`_tool/`** | A custom System Management GUI. Use this to create repos, run terminals, and view CI/CD pipelines. |
| **`backend/`** | Contains your microservices (e.g., `NodeJS` service). |
| **`frontend/`** | Contains your client-side applications (e.g., `MyReactApp`). |
| **`shared/`** | **CRITICAL**: Contains code shared across apps to ensure consistency. |
| `shared/models` | Database schemas (Prisma), Interfaces, and Types. |
| `shared/config` | Environment variables, secrets, and API URL constants. |
| `shared/routes` | API Route path constants (e.g., `/api/v1/login`). |
| `shared/components` | Reusable UI components (Buttons, Cards, etc). |

---

## 📦 Using Shared Modules

**Strict Rule:** Do **NOT** duplicate code. If logic, types, or UI components are used in more than one place, they **MUST** live in `shared/`.

### Why?
1.  **Single Source of Truth**: Changing a Database model in `shared/models` automatically warns you of breaking changes in both Frontend and Backend.
2.  **Consistency**: Used `API_ROUTES` ensures your Frontend fetch calls always match your Backend endpoints.
3.  **Efficiency**: Fix a bug in `@monorepo/components` and it is fixed in every frontend application instantly.

### How to use?
For a detailed guide on implementing and importing these modules, please read the **[Shared Module Tutorial](./shared/tutorial.md)**.

```bash
# Example: Migrating the database from the shared folder
npm run db:migrate -w @monorepo/models
```
