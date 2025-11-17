import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { OrganizationService } from "../service";
import { organizationResponseSchema } from "../schema";

export default async function myOrganizationsRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

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
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
                role: { type: "string", enum: ["ADMIN", "USER"] },
              },
            },
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
}
