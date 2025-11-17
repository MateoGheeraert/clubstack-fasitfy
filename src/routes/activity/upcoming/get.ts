import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../service";

export default async function upcomingActivitiesRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // GET /activities/upcoming - Get upcoming activities
  fastify.get(
    "/activities/upcoming",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Get upcoming activities",
        querystring: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
          },
        },
        response: {
          200: {
            type: "array",
            items: {
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
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { id: string; role: Role };
      const query = request.query as { limit?: number };

      const result = await activityService.getUpcomingActivities(
        user.id,
        user.role,
        query.limit
      );
      reply.send(result);
    }
  );
}
