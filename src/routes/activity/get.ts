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
