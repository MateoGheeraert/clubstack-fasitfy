import { FastifyInstance } from "fastify";
import { OrganizationService } from "../service";
import {
  organizationParamsSchema,
  organizationResponseSchema,
  errorResponseSchema,
} from "../schema";

export default async function getByIdRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // GET /organizations/:id - Get organization by ID
  fastify.get(
    "/organizations/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Get organization by ID",
        params: organizationParamsSchema,
        response: {
          200: organizationResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string };

        const organization = await organizationService.getOrganizationById(id);

        // Check if user is a member of this organization
        const isMember = organization.users.some(
          (userOrg) => userOrg.user.id === user.id
        );
        if (!isMember) {
          return reply.code(403).send({ error: "Access denied" });
        }

        reply.send(organization);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        throw error;
      }
    }
  );
}
