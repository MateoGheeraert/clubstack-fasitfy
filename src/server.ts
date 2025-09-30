import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import prismaPlugin from "./plugins/prisma";
import jwtPlugin from "./plugins/jwt";
import authPlugin from "./plugins/auth";

import authRoutes from "./routes/authentication/auth.routes";
import adminRoutes from "./routes/admin/admin.routes";
import userRoutes from "./routes/user/user.routes";
import taskRoutes from "./routes/task/task.routes";
import accountRoutes from "./routes/account/account.routes";
import organizationRoutes from "./routes/organization/organization.routes";
import transactionRoutes from "./routes/transaction/transaction.routes";
import activityRoutes from "./routes/activity/activity.routes";

async function buildApp() {
  const app = Fastify({ logger: true });

  // CORS (open for dev)
  await app.register(cors, { origin: true, credentials: true });
  // Prisma, JWT & Auth
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);

  // OpenAPI/Swagger
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: { title: "Fastify RBAC API", version: "1.0.0" },
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
    },
  });
  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });

  // Routes (registered as plugins so Swagger sees them)
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(userRoutes, { prefix: "/user" });
  await app.register(adminRoutes, { prefix: "/admin" });
  await app.register(taskRoutes, { prefix: "/tasks" });
  await app.register(accountRoutes, { prefix: "/accounts" });
  await app.register(organizationRoutes, { prefix: "/organizations" });
  await app.register(transactionRoutes, { prefix: "/transactions" });
  await app.register(activityRoutes, { prefix: "/activities" });

  app.get("/", async () => ({ ok: true }));
  return app;
}

async function start() {
  try {
    const app = await buildApp();
    const port = Number(process.env.PORT || 3000);
    await app.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    // If err is thrown before app exists, fallback to console
    err instanceof Error
      ? console.error(err)
      : console.error("Unknown error", err);
    process.exit(1);
  }
}

start();

export { buildApp }; // exported for potential testing
