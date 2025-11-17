import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../service";
import { activitiesResponseSchema } from "../schema";

export default async function myActivitiesRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // GET /activities/my - Get current user's activities
  fastify.get(
    "/activities/my",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Get current user's activities",
        querystring: {
          type: "object",
          properties: {
            title: { type: "string" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            location: { type: "string" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        },
        response: { 200: activitiesResponseSchema },
      },
    },
    async (request, reply) => {
      const user = request.user as { id: string; role: Role };
      const query = request.query as {
        title?: string;
        startDate?: string;
        endDate?: string;
        location?: string;
        page?: number;
        limit?: number;
      };

      const filters = {
        ...query,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      };

      const result = await activityService.getMyActivities(user.id, filters);
      reply.send(result);
    }
  );
}
