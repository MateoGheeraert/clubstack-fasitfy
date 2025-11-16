import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { OrganizationService } from "./service";
import {
  getOrganizationsQuerySchema,
  organizationsResponseSchema,
  organizationResponseSchema,
  errorResponseSchema,
} from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // GET /organizations - Get all organizations with filters (Admin only)
  fastify.get(
    "/organizations",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Get all organizations with filters (Admin only)",
        querystring: getOrganizationsQuerySchema,
        response: { 200: organizationsResponseSchema },
      },
    },
    async (request, reply) => {
      const query = request.query as {
        name?: string;
        page?: number;
        limit?: number;
      };

      const result = await organizationService.getOrganizations(query);
      reply.send(result);
    }
  );

  // GET /organizations/my - Get current user's organizations
  fastify.get(
    "/organizations/my",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Get current user's organizations",
        response: {
          200: {
            type: "array",
            items: organizationResponseSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { id: string; role: Role };
      const result = await organizationService.getMyOrganizations(user.id);
      reply.send(result);
    }
  );

  // GET /organizations/users/:userId - Get user's organizations
  fastify.get(
    "/organizations/users/:userId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Get user's organizations",
        params: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string" },
          },
        },
        response: {
          200: {
            type: "array",
            items: organizationResponseSchema,
          },
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { userId } = request.params as { userId: string };
        const user = request.user as { id: string };

        const result = await organizationService.getUserOrganizations(
          userId,
          user.id
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
