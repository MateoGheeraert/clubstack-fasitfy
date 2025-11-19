import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../../service";
import {
  activityResponseSchema,
  errorResponseSchema,
} from "../../schema";

export default async function postAttendeesRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // POST /activities/:id/attendees - Add non-user attendee to activity (Admin/Moderator only)
  fastify.post(
    "/activities/:id/attendees",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN, Role.MODERATOR])],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Add non-user attendee to activity (Admin/Moderator only)",
        description: "Add a non-user attendee (guest name) to an activity. For user attendees, users should use the join endpoint.",
        body: {
          type: "object",
          required: ["attendee"],
          properties: {
            attendee: { type: "string", minLength: 1, maxLength: 255 },
          },
        },
        response: {
          200: activityResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { attendee } = request.body as { attendee: string };
        const user = request.user as { id: string; role: Role };

        const activity = await activityService.addAttendee(
          id,
          attendee,
          user.id,
          user.role
        );
        reply.send(activity);
      } catch (error: any) {
        if (error.message === "ACTIVITY_NOT_FOUND") {
          return reply.code(404).send({ error: "Activity not found" });
        }
        if (error.message === "ATTENDEE_ALREADY_EXISTS") {
          return reply.code(409).send({ error: "Attendee already exists" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
