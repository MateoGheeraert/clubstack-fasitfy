import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "./service";
import {
  getActivitiesQuerySchema,
  activitiesResponseSchema,
  errorResponseSchema,
} from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // GET /activities - Get all activities with filters
  fastify.get(
    "/activities",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Get all activities with filters",
        querystring: getActivitiesQuerySchema,
        response: {
          200: activitiesResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as { id: string; role: Role };
        const query = request.query as {
          organizationId?: string;
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

        const result = await activityService.getActivities(
          filters,
          user.id,
          user.role
        );
        reply.send(result);
      } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
