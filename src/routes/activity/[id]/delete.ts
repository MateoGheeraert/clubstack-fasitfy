import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../service";
import {
  activityParamsSchema,
  errorResponseSchema,
} from "../schema";

export default async function deleteRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // DELETE /activities/:id - Delete activity (Admin only)
  fastify.delete(
    "/activities/:id",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["activities", "admin"],
        security: [{ bearerAuth: [] }],
        summary: "Delete activity (Admin only)",
        params: activityParamsSchema,
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string; role: Role };

        const result = await activityService.deleteActivity(
          id,
          user.id,
          user.role
        );
        reply.send(result);
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
