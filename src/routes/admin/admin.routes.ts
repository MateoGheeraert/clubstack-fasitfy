import { FastifyPluginAsync } from "fastify";
import { Role } from "@prisma/client";
import { AdminService } from "./admin.service";
import {
  adminUserListResponse,
  adminCreateTaskSchema,
  adminReassignTaskSchema,
  adminTasksQuerySchema,
  taskParamsSchema,
} from "./admin.schema";

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  const adminService = new AdminService(fastify.prisma);

  // User management
  // NOTE: Admin endpoints now require manual role checking per organization
  // TODO: Implement proper role-based access control
  fastify.get(
    "/users",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["admin"],
        security: [{ bearerAuth: [] }],
        summary: "List all users (requires admin privileges)",
        response: adminUserListResponse,
      },
    },
    async () => {
      return adminService.listUsers();
    }
  );

  // Task management endpoints for admins

  // Get all tasks (admin view with all filters)
  fastify.get(
    "/tasks",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["admin"],
        security: [{ bearerAuth: [] }],
        summary: "Get all tasks across all users (requires admin privileges)",
        querystring: adminTasksQuerySchema,
      },
    },
    async (request, reply) => {
      const query = request.query as {
        status?: string;
        userId?: string;
        page?: number;
        limit?: number;
      };

      const result = await adminService.getAllTasks(query);
      reply.send(result);
    }
  );

  // Create task and assign to user
  fastify.post(
    "/tasks",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["admin"],
        security: [{ bearerAuth: [] }],
        summary: "Create task and assign to user (requires admin privileges)",
        body: adminCreateTaskSchema,
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          title: string;
          description?: string;
          userId: string;
          organizationId: string;
        };

        const task = await adminService.createTaskForUser(body);
        reply.code(201).send(task);
      } catch (error: any) {
        if (error.message === "USER_NOT_FOUND") {
          return reply.code(400).send({ error: "User not found" });
        }
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "USER_NOT_IN_ORGANIZATION") {
          return reply
            .code(400)
            .send({ error: "User is not in the organization" });
        }
        throw error;
      }
    }
  );

  // Reassign task to different user
  fastify.patch(
    "/tasks/:id/reassign",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["admin"],
        security: [{ bearerAuth: [] }],
        summary: "Reassign task to different user (ADMIN only)",
        params: taskParamsSchema,
        body: adminReassignTaskSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId } = request.body as { userId: string };

        const task = await adminService.reassignTask(id, userId);
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "USER_NOT_FOUND") {
          return reply.code(400).send({ error: "User not found" });
        }
        throw error;
      }
    }
  );

  // Force delete any task
  fastify.delete(
    "/tasks/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["admin"],
        security: [{ bearerAuth: [] }],
        summary: "Force delete any task (ADMIN only)",
        params: taskParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await adminService.deleteAnyTask(id);
        reply.send(result);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        throw error;
      }
    }
  );

  // Get task statistics dashboard
  fastify.get(
    "/tasks/statistics",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["admin"],
        security: [{ bearerAuth: [] }],
        summary: "Get task statistics dashboard (ADMIN only)",
      },
    },
    async (request, reply) => {
      const stats = await adminService.getTaskStatistics();
      reply.send(stats);
    }
  );
};

export default adminRoutes;
