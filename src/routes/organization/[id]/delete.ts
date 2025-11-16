import { FastifyInstance } from "fastify";
import { OrganizationService } from "../service";
import {
  organizationParamsSchema,
  errorResponseSchema,
} from "../schema";

const successResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
} as const;

export default async function deleteRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // DELETE /organizations/:id - Delete organization (Admin only)
  fastify.delete(
    "/organizations/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Delete organization (Admin only)",
        params: organizationParamsSchema,
        response: {
          200: successResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string };

        const result = await organizationService.deleteOrganization(
          id,
          user.id
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
