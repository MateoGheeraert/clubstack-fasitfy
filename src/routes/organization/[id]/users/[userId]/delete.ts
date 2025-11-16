import { FastifyInstance } from "fastify";
import { OrganizationService } from "../../../service";
import { userOrganizationParamsSchema, errorResponseSchema } from "../../../schema";

const successResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
} as const;

export default async function deleteUserRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // DELETE /organizations/:id/users/:userId - Remove user from organization (Admin only)
  fastify.delete(
    "/organizations/:id/users/:userId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Remove user from organization (Admin only)",
        params: userOrganizationParamsSchema,
        response: {
          200: successResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id, userId } = request.params as { id: string; userId: string };
        const user = request.user as { id: string };

        const result = await organizationService.removeUserFromOrganization(
          id,
          userId,
          user.id
        );
        reply.send(result);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "USER_NOT_IN_ORGANIZATION") {
          return reply
            .code(404)
            .send({ error: "User is not in this organization" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
