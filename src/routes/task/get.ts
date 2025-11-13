import { FastifyInstance } from "fastify";
import { TaskService } from "./service";
import {
  getTasksQuerySchema,
  taskParamsSchema,
} from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // GET /tasks - Get all tasks with filters
  fastify.get(
    "/tasks",
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

  // GET /tasks/my - Get current user's tasks
  fastify.get(
    "/tasks/my",
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

  // GET /tasks/statistics - Get task statistics (Admin only)
  fastify.get(
    "/tasks/statistics",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Get task statistics dashboard (Admin only)",
      },
    },
    async (request, reply) => {
      const stats = await taskService.getTaskStatistics();
      reply.send(stats);
    }
  );
}
