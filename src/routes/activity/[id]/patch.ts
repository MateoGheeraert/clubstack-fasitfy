import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../service";
import {
  updateActivitySchema,
  activityParamsSchema,
  activityResponseSchema,
  errorResponseSchema,
} from "../schema";

export default async function patchRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // PATCH /activities/:id - Update activity details (Admin only)
  fastify.patch(
    "/activities/:id",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Update activity details (Admin only)",
        params: activityParamsSchema,
        body: updateActivitySchema,
        response: {
          200: activityResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          title?: string;
          starts_at?: string;
          ends_at?: string;
          location?: string;
          description?: string;
          attendees?: string[];
        };
        const user = request.user as { id: string; role: Role };

        const updateData = {
          ...body,
          starts_at: body.starts_at ? new Date(body.starts_at) : undefined,
          ends_at: body.ends_at ? new Date(body.ends_at) : undefined,
        };

        const activity = await activityService.updateActivity(
          id,
          updateData,
          user.id,
          user.role
        );
        reply.send(activity);
      } catch (error: any) {
        if (error.message === "ACTIVITY_NOT_FOUND") {
          return reply.code(404).send({ error: "Activity not found" });
        }
        if (error.message === "INVALID_DATE_RANGE") {
          return reply
            .code(400)
            .send({ error: "Start date must be before end date" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
