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

  // Create a new task (Admin only)
  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Create a new task (Admin only)",
        body: createTaskSchema,
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          title: string;
          description?: string;
          userId: string;
        };

        const task = await taskService.createTask(body);
        reply.code(201).send(task);
      } catch (error: any) {
        if (error.message === "USER_NOT_FOUND") {
          return reply.code(400).send({ error: "User not found" });
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
      const user = request.user as { id: string; role: Role };
      const query = request.query as {
        status?: string;
        userId?: string;
        page?: number;
        limit?: number;
      };

      // If not admin, force userId to be the current user
      if (user.role !== Role.ADMIN) {
        query.userId = user.id;
      }

      const result = await taskService.getTasks(query);
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
      const user = request.user as { id: string; role: Role };
      const query = request.query as {
        status?: string;
        page?: number;
        limit?: number;
      };

      const result = await taskService.getMyTasks(user.id, query);
      reply.send(result);
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
        const user = request.user as { id: string; role: Role };

        const task = await taskService.getTaskById(id);

        // Check if user can view this task (admin or assigned user)
        if (user.role !== Role.ADMIN && task.userId !== user.id) {
          return reply
            .code(403)
            .send({ error: "You can only view your own tasks" });
        }

        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
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
        const user = request.user as { id: string; role: Role };

        const task = await taskService.updateTask(id, body, user.id, user.role);
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({
            error: "You can only update your own tasks or admin tasks",
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
        const user = request.user as { id: string; role: Role };

        const task = await taskService.updateTaskStatus(
          id,
          status,
          user.id,
          user.role
        );
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({ error: "You can only update status of your own tasks" });
        }
        throw error;
      }
    }
  );

  // Assign task to user (Admin only)
  fastify.patch(
    "/:id/assign",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Assign task to user (Admin only)",
        params: taskParamsSchema,
        body: assignTaskSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId } = request.body as { userId: string };
        const user = request.user as { id: string; role: Role };

        const task = await taskService.assignTask(
          id,
          userId,
          user.id,
          user.role
        );
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "USER_NOT_FOUND") {
          return reply.code(400).send({ error: "User not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({ error: "Only admins can assign tasks" });
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
        const user = request.user as { id: string; role: Role };

        const result = await taskService.deleteTask(id, user.id, user.role);
        reply.send(result);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({ error: "You can only delete your own tasks" });
        }
        throw error;
      }
    }
  );
}
