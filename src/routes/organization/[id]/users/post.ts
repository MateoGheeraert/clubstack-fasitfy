import { FastifyInstance } from "fastify";
import { OrganizationService } from "../../service";
import {
  organizationParamsSchema,
  addUserToOrganizationSchema,
} from "../../schema";

export default async function postUsersRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // POST /organizations/:id/users - Add user to organization (Admin only)
  fastify.post(
    "/organizations/:id/users",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Add user to organization (Admin only)",
        params: organizationParamsSchema,
        body: addUserToOrganizationSchema,
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { userId } = request.body as { userId: string };
        const user = request.user as { id: string };

        const result = await organizationService.addUserToOrganization(
          id,
          userId,
          user.id
        );
        reply.code(201).send(result);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "USER_NOT_FOUND") {
          return reply.code(404).send({ error: "User not found" });
        }
        if (error.message === "USER_ALREADY_IN_ORGANIZATION") {
          return reply
            .code(409)
            .send({ error: "User is already in this organization" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
