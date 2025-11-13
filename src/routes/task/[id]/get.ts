import { FastifyInstance } from "fastify";
import { TaskService } from "../service";
import { taskParamsSchema } from "../schema";

export default async function getIdRoute(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // GET /tasks/:id - Get task by ID
  fastify.get(
    "/tasks/:id",
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
}
