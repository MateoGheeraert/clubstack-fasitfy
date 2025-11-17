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
}
