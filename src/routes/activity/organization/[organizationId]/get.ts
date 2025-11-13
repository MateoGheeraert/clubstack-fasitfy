import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "../../service";
import {
  organizationActivityParamsSchema,
  activitiesResponseSchema,
  errorResponseSchema,
} from "../../schema";

export default async function getByOrganizationRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // GET /activities/organization/:organizationId - Get activities for a specific organization
  fastify.get(
    "/activities/organization/:organizationId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Get activities for a specific organization",
        params: organizationActivityParamsSchema,
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
        response: {
          200: activitiesResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { organizationId } = request.params as { organizationId: string };
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

        const result = await activityService.getOrganizationActivities(
          organizationId,
          filters,
          user.id,
          user.role
        );
        reply.send(result);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
