# Shared Contracts Layer Guide

## Overview

The Optropic Platform uses a **shared contracts layer** (`@optropic/shared`) to maintain consistency between frontend and backend. This package contains:

- **Zod Schemas**: Runtime validation and type inference
- **TypeScript Types**: Type-safe interfaces derived from schemas
- **Constants**: Shared values like API versions
- **Validation Utilities**: Version sync checking

---

## 📁 Package Structure

```
packages/shared/
├── src/
│   ├── schemas/           # Zod schema definitions
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   ├── analytics.ts
│   │   ├── keys.ts
│   │   ├── notifications.ts
│   │   └── index.ts
│   ├── constants/         # Shared constants
│   │   ├── versions.ts
│   │   └── index.ts
│   ├── types/             # TypeScript type exports
│   │   └── index.ts
│   └── index.ts           # Main entry point
├── dist/                  # Compiled output
├── package.json
└── tsconfig.json
```

---

## 🚀 Usage

### Backend (tRPC Procedures)

Import schemas directly in your tRPC procedures:

```typescript
import { AuthLoginSchema, CreateProjectSchema } from "@optropic/shared";
import { baseProcedure } from "~/server/trpc/main";

export const login = baseProcedure
  .input(AuthLoginSchema)
  .mutation(async ({ input }) => {
    // input is fully typed: { email: string, password: string }
    // ...
  });
```

### Frontend (React Components)

Use types derived from schemas:

```typescript
import type { AuthLoginInput, Project } from "@optropic/shared";
import { trpc } from "@/lib/trpc";

const LoginForm = () => {
  const loginMutation = trpc.auth.login.useMutation();

  const handleSubmit = (data: AuthLoginInput) => {
    loginMutation.mutate(data);
  };

  // ...
};
```

---

## 📦 Available Schemas

### Authentication (`auth.ts`)

```typescript
import {
  AuthLoginSchema,
  AuthTokenResponseSchema,
  RefreshTokenSchema,
  CurrentUserSchema,
} from "@optropic/shared";
```

**Types:**
- `AuthLoginInput`
- `AuthTokenResponse`
- `RefreshTokenInput`
- `RefreshTokenResponse`
- `CurrentUser`

### Projects (`project.ts`)

```typescript
import {
  CreateProjectSchema,
  ProjectSchema,
  GetProjectsSchema,
} from "@optropic/shared";
```

**Types:**
- `CreateProjectInput`
- `Project`
- `GetProjectsInput`

### Analytics (`analytics.ts`)

```typescript
import {
  AnalyticsOverviewSchema,
  GetProjectAnalyticsSchema,
  DetectAnomaliesSchema,
  GetTimeSeriesSchema,
  GetComparativeSchema,
} from "@optropic/shared";
```

**Types:**
- `AnalyticsOverview`
- `ProjectAnalytics`
- `Anomaly`
- `TimeSeriesDataPoint`
- `ComparativeAnalytics`

### Keys (`keys.ts`)

```typescript
import {
  GenerateKeySchema,
  KeySchema,
  ListKeysSchema,
  RotateKeySchema,
  RevokeKeySchema,
  GetActiveKeysSchema,
  KeyTypeSchema,
} from "@optropic/shared";
```

**Types:**
- `GenerateKeyInput`
- `Key`
- `KeyType`
- `RotateKeyInput`
- `RevokeKeyInput`

### Notifications (`notifications.ts`)

```typescript
import {
  NotificationSchema,
  GetNotificationsSchema,
  MarkNotificationReadSchema,
  NotificationTypeSchema,
} from "@optropic/shared";
```

**Types:**
- `Notification`
- `NotificationType`
- `GetNotificationsInput`
- `MarkNotificationReadInput`

---

## 🔄 Version Synchronization

### Constants

```typescript
import {
  API_VERSION,
  FRONTEND_MIN_VERSION,
  BACKEND_MIN_VERSION,
  validateVersionSync,
} from "@optropic/shared";
```

### Environment Variables

Add to `.env`:

```bash
API_VERSION=3.0.0
VITE_API_VERSION=3.0.0
```

### Middleware Validation

The platform automatically validates version compatibility:

```typescript
import { validateVersionHeaders } from "~/server/middleware/versionSync";

// In tRPC context or middleware
validateVersionHeaders({
  "x-frontend-version": "3.0.0",
  "x-backend-version": "3.0.0",
});
```

If versions are incompatible, the API returns:

```json
{
  "error": {
    "code": "PRECONDITION_FAILED",
    "message": "Frontend–Backend Version Sync Warning: Version mismatch..."
  }
}
```

---

## 🧪 Testing

### Schema Validation Tests

Run automated schema tests:

```bash
npm run test:schemas
```

Example test:

```typescript
import { AuthLoginSchema } from "@optropic/shared";

test("validates login input", () => {
  const result = AuthLoginSchema.safeParse({
    email: "user@example.com",
    password: "password123",
  });

  expect(result.success).toBe(true);
});
```

### Integration Tests

Ensure backend returns data matching schemas:

```typescript
import { ProjectSchema } from "@optropic/shared";

test("createProject returns valid schema", async () => {
  const result = await trpc.projects.create.mutate({
    name: "Test",
    token: "...",
  });

  const validation = ProjectSchema.safeParse(result);
  expect(validation.success).toBe(true);
});
```

---

## 🛠️ Development Workflow

### 1. Adding a New Schema

Create schema in `packages/shared/src/schemas/`:

```typescript
// packages/shared/src/schemas/example.ts
import { z } from "zod";

export const ExampleSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type Example = z.infer<typeof ExampleSchema>;
```

Export from `packages/shared/src/schemas/index.ts`:

```typescript
export * from "./example";
```

### 2. Build Shared Package

```bash
npm run shared:build
```

Or watch mode during development:

```bash
npm run shared:dev
```

### 3. Use in Backend

```typescript
import { ExampleSchema } from "@optropic/shared";

export const exampleRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const data = await db.example.findUnique({
        where: { id: input.id },
      });

      return ExampleSchema.parse(data);
    }),
});
```

### 4. Use in Frontend

```typescript
import type { Example } from "@optropic/shared";

const ExampleComponent = () => {
  const { data } = trpc.example.get.useQuery({ id: 1 });
  const example: Example | undefined = data;

  return <div>{example?.name}</div>;
};
```

### 5. Run Tests

```bash
# Test schemas
npm run test:schemas

# Test all
npm test

# Type checking
npm run typecheck
```

---

## 📝 Best Practices

### 1. Always Use Shared Schemas

❌ **Don't:**
```typescript
.input(z.object({ email: z.string(), password: z.string() }))
```

✅ **Do:**
```typescript
import { AuthLoginSchema } from "@optropic/shared";
.input(AuthLoginSchema)
```

### 2. Validate Backend Responses

Always validate data before returning:

```typescript
import { ProjectSchema } from "@optropic/shared";

const project = await db.project.create({ data });
return ProjectSchema.parse(project); // Validates at runtime
```

### 3. Use Inferred Types

Let TypeScript infer types from schemas:

```typescript
import type { AuthLoginInput } from "@optropic/shared";

// Type is automatically: { email: string, password: string }
const handleLogin = (input: AuthLoginInput) => {
  // ...
};
```

### 4. Keep Schemas Synchronized

When updating a schema:

1. Update schema in `packages/shared/src/schemas/`
2. Run `npm run shared:build`
3. Update backend procedures
4. Update frontend types/components
5. Run `npm test` to verify

### 5. Version Bumping

When making breaking changes:

1. Update `API_VERSION` in `packages/shared/src/constants/versions.ts`
2. Update `FRONTEND_MIN_VERSION` if frontend must update
3. Update `BACKEND_MIN_VERSION` if backend must update
4. Update `.env.example`
5. Document migration in CHANGELOG

---

## 🔧 Build Scripts

### Package Scripts

```json
{
  "shared:build": "cd packages/shared && npm run build",
  "shared:dev": "cd packages/shared && npm run dev",
  "test:schemas": "vitest --run src/test/schemas"
}
```

### CI/CD Validation

Add to your CI pipeline:

```yaml
- name: Build Shared Package
  run: npm run shared:build

- name: Validate Schema Tests
  run: npm run test:schemas

- name: Type Check
  run: npm run typecheck

- name: Build Application
  run: npm run build
```

---

## 🐛 Troubleshooting

### "Cannot find module '@optropic/shared'"

**Solution:**
```bash
npm install
npm run shared:build
```

### "Type mismatch" errors

**Solution:**
1. Rebuild shared package: `npm run shared:build`
2. Restart TypeScript server in IDE
3. Clear build cache: `rm -rf .vinxi node_modules/.cache`

### Schema validation failing

**Solution:**
1. Check schema definition matches data structure
2. Run validation tests: `npm run test:schemas`
3. Add logging to see actual vs expected:
   ```typescript
   const result = MySchema.safeParse(data);
   if (!result.success) {
     console.error("Validation errors:", result.error);
   }
   ```

### Version mismatch warnings

**Solution:**
1. Check environment variables:
   ```bash
   grep API_VERSION .env
   ```
2. Ensure frontend and backend versions align
3. Update version constants if needed

---

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev)
- [tRPC Documentation](https://trpc.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## ✅ Quick Checklist

Before committing changes:

- [ ] Shared schemas build successfully (`npm run shared:build`)
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Schema validation tests updated (`npm run test:schemas`)
- [ ] Version constants updated if breaking changes
- [ ] Documentation updated (this file)
- [ ] No type errors in IDE

---

## 🎯 Summary

The shared contracts layer provides:

✅ **Type Safety**: End-to-end TypeScript types
✅ **Runtime Validation**: Zod schema validation
✅ **Version Control**: Automatic version sync checking
✅ **Single Source of Truth**: One schema, used everywhere
✅ **Maintainability**: Easy to update and test

**Key Principle**: Update once in `@optropic/shared`, use everywhere!
