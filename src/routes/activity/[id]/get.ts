import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../service";
import {
  activityParamsSchema,
  activityResponseSchema,
  errorResponseSchema,
} from "../schema";

export default async function getByIdRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // GET /activities/:id - Get activity by ID
  fastify.get(
    "/activities/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Get activity by ID",
        params: activityParamsSchema,
        response: {
          200: activityResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string; role: Role };

        const activity = await activityService.getActivityById(
          id,
          user.id,
          user.role
        );
        reply.send(activity);
      } catch (error: any) {
        if (error.message === "ACTIVITY_NOT_FOUND") {
          return reply.code(404).send({ error: "Activity not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
