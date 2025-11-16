import { FastifyInstance } from "fastify";
import { TaskService } from "../service";
import { taskParamsSchema, successResponseSchema, errorResponseSchema } from "../schema";

export default async function deleteIdRoute(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // DELETE /tasks/:id - Delete task
  fastify.delete(
    "/tasks/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Delete task",
        params: taskParamsSchema,
        response: {
          200: successResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
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
