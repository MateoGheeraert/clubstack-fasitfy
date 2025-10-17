import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { TaskService } from "./task.service.js";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  getTasksQuerySchema,
  taskParamsSchema,
} from "./task.schema.js";

export default async function taskRoutes(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // Create a new task (Admin or Moderator in organization)
  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Create a new task (Admin/Moderator in organization)",
        body: createTaskSchema,
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
        const user = request.user as { id: string };

        // Check if requester is admin/moderator in the organization
        const userOrg = await fastify.prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: body.organizationId,
            },
          },
        });

        if (
          !userOrg ||
          (userOrg.role !== "ADMIN" && userOrg.role !== "MODERATOR")
        ) {
          return reply
            .code(403)
            .send({ error: "Only admins and moderators can create tasks" });
        }

        const task = await taskService.createTask(body);
        reply.code(201).send(task);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "USER_NOT_IN_ORGANIZATION") {
          return reply
            .code(400)
            .send({ error: "User is not a member of this organization" });
        }
        throw error;
      }
    }
  );

  // Get all tasks with filters (Admin sees all, users see only their own)
  fastify.get(
    "/",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Get all tasks with filters",
        querystring: getTasksQuerySchema,
      },
    },
    async (request, reply) => {
      const user = request.user as { id: string };
      const query = request.query as {
        status?: string;
        userId?: string;
        organizationId?: string;
        page?: number;
        limit?: number;
      };

      const result = await taskService.getTasks(query, user.id);
      reply.send(result);
    }
  );

  // Get my tasks (shortcut for current user's tasks)
  fastify.get(
    "/my",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Get current user's tasks",
        querystring: {
          type: "object",
          properties: {
            status: { type: "string" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { id: string };
      const filters = request.query as {
        status?: string;
        organizationId?: string;
        page?: number;
        limit?: number;
      };

      const result = await taskService.getMyTasks(user.id, filters);
      reply.send(result);
    }
  );

  // Get all tasks for an organization (with optional user filter)
  fastify.get(
    "/organization/:organizationId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary:
          "Get all tasks for an organization (optionally filtered by user)",
        params: {
          type: "object",
          required: ["organizationId"],
          properties: {
            organizationId: { type: "string" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            userId: { type: "string" },
            status: { type: "string" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { organizationId } = request.params as { organizationId: string };
        const user = request.user as { id: string };
        const filters = request.query as {
          userId?: string;
          status?: string;
          page?: number;
          limit?: number;
        };

        // Check if user is a member of this organization
        const userOrg = await fastify.prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: organizationId,
            },
          },
        });

        if (!userOrg) {
          return reply.code(403).send({
            error: "You don't have access to this organization",
          });
        }

        // Get tasks for this organization with optional user filter
        const result = await taskService.getTasks(
          {
            organizationId,
            userId: filters.userId,
            status: filters.status,
            page: filters.page,
            limit: filters.limit,
          },
          user.id
        );

        reply.send(result);
      } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({
            error: "You don't have access to this organization",
          });
        }
        throw error;
      }
    }
  );

  // Get task by ID
  fastify.get(
    "/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Get task by ID",
        params: taskParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string };

        const task = await taskService.getTaskById(id, user.id);
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({ error: "You don't have access to this task" });
        }
        throw error;
      }
    }
  );

  // Update task details
  fastify.patch(
    "/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Update task details",
        params: taskParamsSchema,
        body: updateTaskSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          title?: string;
          description?: string;
        };
        const user = request.user as { id: string };

        const task = await taskService.updateTask(id, body, user.id);
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({
            error:
              "You can only update your own tasks or must be an admin/moderator",
          });
        }
        throw error;
      }
    }
  );

  // Update task status
  fastify.patch(
    "/:id/status",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Update task status",
        params: taskParamsSchema,
        body: updateTaskStatusSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };
        const user = request.user as { id: string };

        const task = await taskService.updateTaskStatus(id, status, user.id);
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({
              error:
                "You can only update status of your own tasks or must be an admin/moderator",
            });
        }
        throw error;
      }
    }
  );

  // Assign task to user (Admin/Moderator in organization)
  fastify.patch(
    "/:id/assign",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Assign task to user (Admin/Moderator in organization)",
        params: taskParamsSchema,
        body: assignTaskSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId } = request.body as { userId: string };
        const user = request.user as { id: string };

        const task = await taskService.assignTask(id, userId, user.id);
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "USER_NOT_IN_ORGANIZATION") {
          return reply
            .code(400)
            .send({ error: "User is not in the organization" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({ error: "Only admins/moderators can assign tasks" });
        }
        throw error;
      }
    }
  );

  // Delete task
  fastify.delete(
    "/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Delete task",
        params: taskParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string };

        const result = await taskService.deleteTask(id, user.id);
        reply.send(result);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({
              error:
                "You can only delete your own tasks or must be an admin/moderator",
            });
        }
        throw error;
      }
    }
  );
}
