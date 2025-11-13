import { FastifyInstance } from "fastify";
import { OrganizationService } from "../service";
import {
  organizationParamsSchema,
  updateOrganizationSchema,
  organizationResponseSchema,
  errorResponseSchema,
} from "../schema";

export default async function patchRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // PATCH /organizations/:id - Update organization details (Admin only)
  fastify.patch(
    "/organizations/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Update organization details (Admin only)",
        params: organizationParamsSchema,
        body: updateOrganizationSchema,
        response: {
          200: organizationResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          name?: string;
        };
        const user = request.user as { id: string };

        const organization = await organizationService.updateOrganization(
          id,
          body,
          user.id
        );
        reply.send(organization);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "ORGANIZATION_NAME_TAKEN") {
          return reply
            .code(409)
            .send({ error: "Organization name already taken" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
