# Shared Contracts Quick Reference

## 🚀 Quick Start

### Import Schemas (Backend)
```typescript
import { AuthLoginSchema, CreateProjectSchema } from "@optropic/shared";
```

### Import Types (Frontend)
```typescript
import type { AuthLoginInput, Project, AnalyticsOverview } from "@optropic/shared";
```

---

## 📦 Available Schemas

### Auth
```typescript
import {
  AuthLoginSchema,
  AuthTokenResponseSchema,
  RefreshTokenSchema,
  CurrentUserSchema,
} from "@optropic/shared";
```

### Projects
```typescript
import {
  CreateProjectSchema,
  ProjectSchema,
  GetProjectsSchema,
} from "@optropic/shared";
```

### Analytics
```typescript
import {
  AnalyticsOverviewSchema,
  GetProjectAnalyticsSchema,
  DetectAnomaliesSchema,
  GetTimeSeriesSchema,
  GetComparativeSchema,
} from "@optropic/shared";
```

### Keys
```typescript
import {
  GenerateKeySchema,
  KeySchema,
  RotateKeySchema,
  RevokeKeySchema,
  GetActiveKeysSchema,
} from "@optropic/shared";
```

### Notifications
```typescript
import {
  NotificationSchema,
  GetNotificationsSchema,
  MarkNotificationReadSchema,
} from "@optropic/shared";
```

---

## 🔧 Common Commands

```bash
# Build shared package
npm run shared:build

# Watch mode (development)
npm run shared:dev

# Test schemas
npm run test:schemas

# Type check
npm run typecheck

# Full build
npm run build

# Run all tests
npm test
```

---

## 💡 Usage Examples

### Backend (tRPC)
```typescript
import { CreateProjectSchema } from "@optropic/shared";

export const createProject = baseProcedure
  .input(CreateProjectSchema)
  .mutation(async ({ input }) => {
    // input is typed!
    const project = await db.project.create({ data: input });
    return project;
  });
```

### Frontend (React)
```typescript
import type { Project, CreateProjectInput } from "@optropic/shared";

const CreateForm = () => {
  const mutation = trpc.projects.create.useMutation();

  const handleSubmit = (data: CreateProjectInput) => {
    mutation.mutate(data);
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Validation
```typescript
import { AuthLoginSchema } from "@optropic/shared";

const result = AuthLoginSchema.safeParse(data);
if (result.success) {
  console.log("Valid:", result.data);
} else {
  console.error("Errors:", result.error);
}
```

---

## 🎯 Workflow

### Adding a New Schema

1. **Create schema file**
   ```bash
   vim packages/shared/src/schemas/newSchema.ts
   ```

2. **Define schema**
   ```typescript
   import { z } from "zod";

   export const NewSchema = z.object({
     id: z.number(),
     name: z.string(),
   });

   export type NewType = z.infer<typeof NewSchema>;
   ```

3. **Export from index**
   ```typescript
   // packages/shared/src/schemas/index.ts
   export * from "./newSchema";
   ```

4. **Build and test**
   ```bash
   npm run shared:build
   npm run test:schemas
   ```

5. **Use in backend**
   ```typescript
   import { NewSchema } from "@optropic/shared";
   ```

---

## 🐛 Troubleshooting

### Cannot find module '@optropic/shared'
```bash
npm install
npm run shared:build
```

### Type errors
```bash
npm run shared:build
# Restart TypeScript server in IDE
```

### Build fails
```bash
rm -rf .vinxi node_modules/.cache
npm install
npm run build
```

### Schema validation fails
```typescript
const result = MySchema.safeParse(data);
if (!result.success) {
  console.error("Validation errors:", result.error.issues);
}
```

---

## 📚 Documentation

- **Full Guide**: `SHARED_CONTRACTS_GUIDE.md`
- **Implementation**: `SHARED_CONTRACTS_IMPLEMENTATION.md`
- **This Reference**: `QUICK_REFERENCE.md`

---

## ✅ Checklist Before Committing

- [ ] `npm run shared:build` passes
- [ ] `npm run test:schemas` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] `npm test` passes

---

## 🎯 Key Points

1. **Always use shared schemas** - Don't inline schemas
2. **Build before using** - Run `npm run shared:build`
3. **Test your schemas** - Add tests to `src/test/schemas/`
4. **Update types** - Types are auto-generated from schemas
5. **Version carefully** - Update `API_VERSION` for breaking changes

---

## 💻 IDE Setup

### VS Code

Add to `.vscode/settings.json`:
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Path Aliases

Already configured in `tsconfig.json`:
```json
{
  "paths": {
    "@optropic/shared": ["./packages/shared/src/index.ts"],
    "@optropic/shared/*": ["./packages/shared/src/*"]
  }
}
```

---

**Need Help?** See `SHARED_CONTRACTS_GUIDE.md` for detailed documentation.
