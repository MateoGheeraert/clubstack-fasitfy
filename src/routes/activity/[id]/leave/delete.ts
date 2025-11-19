import { FastifyInstance } from "fastify";
import { ActivityService } from "../../service";
import {
  activityParamsSchema,
  errorResponseSchema,
  successResponseSchema,
} from "../../schema";

export default async function leaveActivityRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // DELETE /activities/:id/leave - Leave an activity as a user
  fastify.delete(
    "/activities/:id/leave",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Leave an activity",
        description: "Allows a user to leave an activity they are attending",
        params: activityParamsSchema,
        response: {
          200: successResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string };

        await activityService.leaveActivity(id, user.id);
        reply.send({ message: "Successfully left the activity" });
      } catch (error: any) {
        if (error.message === "ACTIVITY_NOT_FOUND") {
          return reply.code(404).send({ error: "Activity not found" });
        }
        if (error.message === "NOT_ATTENDING") {
          return reply.code(409).send({ error: "You are not attending this activity" });
        }
        throw error;
      }
    }
  );
}
