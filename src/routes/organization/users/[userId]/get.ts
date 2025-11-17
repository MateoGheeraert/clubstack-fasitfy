import { FastifyInstance } from "fastify";
import { OrganizationService } from "../../service";
import { organizationResponseSchema, errorResponseSchema } from "../../schema";

export default async function userOrganizationsRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

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
