# Shared Module Tutorial

This guide explains how to use the shared modules (`@monorepo/*`) in your frontend and backend applications.

---

## 1. Setup

Before using any shared module, ensure it is listed in your app's `package.json` dependencies.

**In `frontend/<frontend-name>/package.json` or `backend/<backend-name>/package.json`:**
```json
"dependencies": {
  "@monorepo/components": "*",
  "@monorepo/config": "*",
  "@monorepo/models": "*",
  "@monorepo/routes": "*"
}
```
*Run `npm install` in the root directory after updating dependencies.*

---

## 2. Using Configs (`@monorepo/config`)
Use this for environment-agnostic configuration, such as API URLs and secrets.

**Backend Usage (Node.js)**
```typescript
import config from "@monorepo/config";

const secret = config.secrets.jwt;
console.log(`Using secret: ${secret}`);
```

**Frontend Usage (React)**
```typescript
import config from "@monorepo/config";

// Note: Ensure your build tool (Vite) is configured to handle process.env if accessing secrets,
// OR usually you only access public URLs in frontend code:
const apiUrl = config.dev.primaryApi;

fetch(`${apiUrl}/users`)
  .then(...)
```

---

## 3. Using Models (`@monorepo/models`)
Use this for shared Types (Interfaces) and Database Access (Prisma).

**Backend Usage (Node.js)**
*Use the Prisma Client to query the database.*
```typescript
import { PrismaClient } from "@monorepo/models";

const prisma = new PrismaClient();

app.get('/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});
```

**Database Management**
You can manage the database logic entirely from the shared folder using NPM workspace commands.

*   **Migrate Changes (Create Tables)**:
    `npm run db:migrate -w @monorepo/models`
*   **Update Client (Refresh TS Types)**:
    `npm run db:generate -w @monorepo/models`
*   **Open Database UI**:
    `npm run db:studio -w @monorepo/models`

**Frontend Usage (React)**
*Use the Types to ensure type safety when fetching data.*
```typescript
import type { User } from "@monorepo/models";

function UserList() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        // Fetching matches the backend logic
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setUsers(data));
    }, []);

    return (
        <ul>
            {users.map(user => <li key={user.id}>{user.name}</li>)}
        </ul>
    )
}
```

---

## 4. Using Routes (`@monorepo/routes`)
Use this to ensure your API paths are consistent across the entire stack.

**Backend Usage (Node.js)**
*Defining the route.*
```typescript
import express from 'express';
import { API_ROUTES } from "@monorepo/routes";

const app = express();

// Ensures endpoint matches the shared constant
app.post(API_ROUTES.LOGIN, (req, res) => {
    // Login logic
});
```

**Frontend Usage (React)**
*Calling the route.*
```typescript
import { API_ROUTES } from "@monorepo/routes";

function login() {
    fetch(API_ROUTES.LOGIN, {
        method: 'POST',
        // ...
    });
}
```

---

## 5. Using Components (`@monorepo/components`)
Use this for shared UI elements like Buttons, Cards, or Inputs.

**Frontend Usage (React Only)**
```tsx
import { Button } from "@monorepo/components";

export default function App() {
    return (
        <div>
            <h1>Welcome</h1>
            <Button variant="primary" onClick={() => alert('Clicked!')}>
                Click Me
            </Button>
        </div>
    );
}
```
