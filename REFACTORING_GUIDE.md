# Route Refactoring Guide

## Overview
This guide explains the new folder structure for routes in the application. The refactoring removes the model layer (since Prisma already provides models) and organizes routes by HTTP method.

## Completed Routes
- ✅ **activity** - Fully refactored
- ✅ **account** - Fully refactored

## Remaining Routes to Refactor
- ⏳ task
- ⏳ transaction
- ⏳ user
- ⏳ organization
- ⏳ authentication (auth)
- ⏳ admin

## New Folder Structure

Each route folder now contains:

```
routes/
└── <route-name>/
    ├── index.ts          # Main entry point that imports all HTTP method files
    ├── schema.ts         # JSON schemas for validation (renamed from <route>.schema.ts)
    ├── service.ts        # Business logic (renamed from <route>.service.ts, removed model dependency)
    ├── types.ts          # TypeScript types (extracted from old <route>.model.ts)
    ├── get.ts            # All GET endpoints
    ├── post.ts           # All POST endpoints
    ├── patch.ts          # All PATCH endpoints (if any)
    ├── put.ts            # All PUT endpoints (if any)
    └── delete.ts         # All DELETE endpoints (if any)
```

### Files Removed
- `<route>.model.ts` - No longer needed, use Prisma models directly
- `<route>.routes.ts` - Split into HTTP method files
- `<route>.service.ts` - Renamed to `service.ts`
- `<route>.schema.ts` - Renamed to `schema.ts`

## Step-by-Step Refactoring Process

### 1. Create `types.ts`
Extract types from the old `*.model.ts` file, but remove the class definition:

```typescript
// types.ts
import { ModelName, RelatedModel } from "@prisma/client";

export type ModelWithRelations = ModelName & {
  relatedModel: Pick<RelatedModel, "id" | "name">;
};

export type CreateModelInput = {
  // fields for creation
};

export type UpdateModelInput = {
  // optional fields for update
};

export type ModelFilters = {
  // query parameters
  page?: number;
  limit?: number;
};
```

### 2. Rename Schema File
```bash
mv src/routes/<route>/<route>.schema.ts src/routes/<route>/schema.ts
```

### 3. Create `service.ts`
Update the old service file to:
- Import types from `./types` instead of `./model`
- Remove the model instantiation
- Use `this.prisma` directly for database operations
- Move all Prisma queries from the model into the service

```typescript
// service.ts
import { PrismaClient, Role } from "@prisma/client";
import {
  CreateModelInput,
  UpdateModelInput,
  ModelFilters,
} from "./types";

export class ModelService {
  constructor(private prisma: PrismaClient) {}

  async createModel(data: CreateModelInput, requesterId: string, requesterRole: Role) {
    // Validation and authorization logic
    
    // Direct Prisma call (no model layer)
    return this.prisma.modelName.create({
      data,
      include: {
        // relations
      },
    });
  }

  // ... other methods
}
```

### 4. Create HTTP Method Files

#### `get.ts`
Contains all GET endpoints:

```typescript
import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ModelService } from "./service";
import {
  // import schemas
} from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const modelService = new ModelService(fastify.prisma);

  // GET /models
  fastify.get("/", { /* config */ }, async (request, reply) => {
    // handler
  });

  // GET /models/:id
  fastify.get("/:id", { /* config */ }, async (request, reply) => {
    // handler
  });

  // ... other GET endpoints
}
```

#### `post.ts`
Contains all POST endpoints:

```typescript
import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ModelService } from "./service";
import { /* schemas */ } from "./schema";

export default async function postRoute(fastify: FastifyInstance) {
  const modelService = new ModelService(fastify.prisma);

  // POST /models
  fastify.post("/", { /* config */ }, async (request, reply) => {
    // handler
  });

  // ... other POST endpoints
}
```

#### `patch.ts` / `put.ts`
Contains all PATCH or PUT endpoints for updates

#### `delete.ts`
Contains all DELETE endpoints

### 5. Create `index.ts`
Main entry point that combines all route files:

```typescript
import { FastifyInstance } from "fastify";
import getRoutes from "./get";
import postRoute from "./post";
import patchRoute from "./patch";
import deleteRoute from "./delete";

export default async function modelRoutes(fastify: FastifyInstance) {
  await getRoutes(fastify);
  await postRoute(fastify);
  await patchRoute(fastify);
  await deleteRoute(fastify);
}
```

### 6. Update `server.ts`
Change the import path:

```typescript
// OLD
import modelRoutes from "./routes/model/model.routes";

// NEW
import modelRoutes from "./routes/model";
```

### 7. Clean Up
Remove old files:

```bash
rm src/routes/<route>/<route>.routes.ts
rm src/routes/<route>/<route>.service.ts
rm src/routes/<route>/<route>.model.ts
```

## Benefits of This Structure

1. **No More Model Layer**: Prisma already provides type-safe models, so we don't need an additional abstraction
2. **Clear Separation by HTTP Method**: Easy to find specific endpoints
3. **Better Organization**: Each file has a single responsibility
4. **Easier to Navigate**: File names match HTTP methods
5. **Path-Based Routing**: Files like `get.ts` or `post.ts` clearly show which operations they handle

## Examples

### Example: Activity Routes (Completed)
```
routes/activity/
├── index.ts
├── schema.ts
├── service.ts
├── types.ts
├── get.ts       # GET /, GET /my, GET /upcoming, GET /:id, GET /organization/:organizationId
├── post.ts      # POST /, POST /:id/attendees
├── patch.ts     # PATCH /:id
└── delete.ts    # DELETE /:id, DELETE /:id/attendees/:attendee
```

### Example: Account Routes (Completed)
```
routes/account/
├── index.ts
├── schema.ts
├── service.ts
├── types.ts
├── get.ts       # GET /, GET /my, GET /:id, GET /organization/:organizationId
├── post.ts      # POST /
├── patch.ts     # PATCH /:id
└── delete.ts    # DELETE /:id
```

## Quick Refactoring Template

For each remaining route, follow these steps:

```bash
# 1. Navigate to route folder
cd src/routes/<route-name>

# 2. Create types.ts (extract from *.model.ts)
# 3. Rename schema
mv <route>.schema.ts schema.ts

# 4. Create service.ts (update from <route>.service.ts)
# 5. Create HTTP method files (get.ts, post.ts, etc.)
# 6. Create index.ts
# 7. Update server.ts import
# 8. Remove old files
rm <route>.routes.ts <route>.service.ts <route>.model.ts
```

## Notes

- All endpoints maintain the same URL structure
- Authentication and authorization remain unchanged
- Error handling patterns are consistent
- Each route file should create its own service instance
- The service layer handles all business logic and Prisma interactions
