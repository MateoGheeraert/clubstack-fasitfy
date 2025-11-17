import { FastifyInstance } from "fastify";
import { TaskService } from "../service";
import { taskStatisticsResponseSchema, errorResponseSchema } from "../schema";

export default async function taskStatisticsRoute(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // GET /tasks/statistics - Get task statistics (Admin only)
  fastify.get(
    "/tasks/statistics",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Get task statistics dashboard (Admin only)",
        response: {
          200: taskStatisticsResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const stats = await taskService.getTaskStatistics();
      reply.send(stats);
    }
  );
}
