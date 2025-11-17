import { FastifyInstance } from "fastify";
import { TaskService } from "./service";
import {
  getTasksQuerySchema,
  taskParamsSchema,
  tasksResponseSchema,
  taskStatisticsResponseSchema,
  errorResponseSchema,
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
        response: {
          200: tasksResponseSchema,
          403: errorResponseSchema,
        },
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
}
