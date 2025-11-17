import { FastifyInstance } from "fastify";
import { TaskService } from "../service";
import { tasksResponseSchema, errorResponseSchema } from "../schema";

export default async function myTasksRoute(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

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
        response: {
          200: tasksResponseSchema,
          403: errorResponseSchema,
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
}
