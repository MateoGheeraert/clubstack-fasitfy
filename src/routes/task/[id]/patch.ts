import { FastifyInstance } from "fastify";
import { TaskService } from "../service";
import {
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  taskParamsSchema,
  taskResponseSchema,
  errorResponseSchema,
} from "../schema";

export default async function patchIdRoutes(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // PATCH /tasks/:id - Update task details
  fastify.patch(
    "/tasks/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Update task details",
        params: taskParamsSchema,
        body: updateTaskSchema,
        response: {
          200: taskResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
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

  // PATCH /tasks/:id/status - Update task status
  fastify.patch(
    "/tasks/:id/status",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Update task status",
        params: taskParamsSchema,
        body: updateTaskStatusSchema,
        response: {
          200: taskResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
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

  // PATCH /tasks/:id/assign - Assign task to user (Admin/Moderator)
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
        response: {
          200: taskResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
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

  // PATCH /tasks/:id/reassign - Reassign task (Admin only)
  fastify.patch(
    "/:id/reassign",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Reassign task to different user (Admin only)",
        params: taskParamsSchema,
        body: { 
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" }
          }
        },
        response: {
          200: taskResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId } = request.body as { userId: string };

        const task = await taskService.reassignTask(id, userId);
        reply.send(task);
      } catch (error: any) {
        if (error.message === "TASK_NOT_FOUND") {
          return reply.code(404).send({ error: "Task not found" });
        }
        if (error.message === "USER_NOT_FOUND") {
          return reply.code(400).send({ error: "User not found" });
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
}
