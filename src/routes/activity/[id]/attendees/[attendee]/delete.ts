import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../../../service";
import {
  errorResponseSchema,
} from "../../../schema";

export default async function deleteAttendeeRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // DELETE /activities/:id/attendees/:attendee - Remove non-user attendee from activity (Admin/Moderator only)
  fastify.delete(
    "/activities/:id/attendees/:attendee",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN, Role.MODERATOR])],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Remove non-user attendee from activity (Admin/Moderator only)",
        description: "Remove a non-user attendee (guest name) from an activity. For user attendees, users should use the leave endpoint.",
        params: {
          type: "object",
          required: ["id", "attendee"],
          properties: {
            id: { type: "string" },
            attendee: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              organizationId: { type: "string" },
              title: { type: "string" },
              starts_at: { type: "string", format: "date-time" },
              ends_at: { type: "string", format: "date-time" },
              location: { type: "string" },
              description: { type: "string" },
              attendees: {
                type: "array",
                items: { type: "string" },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              organization: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                },
              },
            },
          },
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id, attendee } = request.params as {
          id: string;
          attendee: string;
        };
        const user = request.user as { id: string; role: Role };

        const activity = await activityService.removeAttendee(
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
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
