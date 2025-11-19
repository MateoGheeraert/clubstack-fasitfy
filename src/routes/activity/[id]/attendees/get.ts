import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../../service";
import {
  activityParamsSchema,
  attendeesResponseSchema,
  errorResponseSchema,
} from "../../schema";

export default async function getAttendeesRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // GET /activities/:id/attendees - Get all attendees of an activity (admin/moderator only)
  fastify.get(
    "/activities/:id/attendees",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Get activity attendees",
        description: "Get all users attending an activity. Requires admin or moderator role for the organization.",
        params: activityParamsSchema,
        response: {
          200: attendeesResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string; role: Role };

        const attendees = await activityService.getActivityAttendees(
          id,
          user.id,
          user.role
        );
        reply.send(attendees);
      } catch (error: any) {
        if (error.message === "ACTIVITY_NOT_FOUND") {
          return reply.code(404).send({ error: "Activity not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ 
            error: "Access denied. You must be an admin or moderator of the organization." 
          });
        }
        throw error;
      }
    }
  );
}
