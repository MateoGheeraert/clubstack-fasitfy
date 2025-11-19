import { FastifyInstance } from "fastify";
import { ActivityService } from "../../service";
import {
  activityParamsSchema,
  errorResponseSchema,
  successResponseSchema,
} from "../../schema";

export default async function joinActivityRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // POST /activities/:id/join - Join an activity as a user
  fastify.post(
    "/activities/:id/join",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Join an activity",
        description: "Allows a user to join an activity they have access to",
        params: activityParamsSchema,
        response: {
          200: successResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string };

        await activityService.joinActivity(id, user.id);
        reply.send({ message: "Successfully joined the activity" });
      } catch (error: any) {
        if (error.message === "ACTIVITY_NOT_FOUND") {
          return reply.code(404).send({ error: "Activity not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ 
            error: "You don't have access to this activity. You must be a member of the organization." 
          });
        }
        if (error.message === "ALREADY_ATTENDING") {
          return reply.code(409).send({ error: "You are already attending this activity" });
        }
        throw error;
      }
    }
  );
}
