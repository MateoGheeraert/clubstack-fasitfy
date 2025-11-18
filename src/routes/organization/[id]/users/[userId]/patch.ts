import { FastifyInstance } from "fastify";
import { OrganizationService } from "../../../service";
import {
  userOrganizationParamsSchema,
  updateUserRoleSchema,
  errorResponseSchema,
} from "../../../schema";

const userOrganizationResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    userId: { type: "string" },
    organizationId: { type: "string" },
    role: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export default async function patchUserRoleRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // PATCH /organizations/:id/users/:userId - Update user role in organization (Admin only)
  fastify.patch(
    "/organizations/:id/users/:userId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Update user role in organization (Admin only)",
        description:
          "Promote or demote a user by changing their role. Possible roles: USER, MODERATOR, ADMIN",
        params: userOrganizationParamsSchema,
        body: updateUserRoleSchema,
        response: {
          200: userOrganizationResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id, userId } = request.params as {
          id: string;
          userId: string;
        };
        const { role } = request.body as { role: "USER" | "MODERATOR" | "ADMIN" };
        const user = request.user as { id: string };

        const result = await organizationService.updateUserRole(
          id,
          userId,
          role,
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
          return reply
            .code(403)
            .send({ error: "Access denied. Admin role required." });
        }
        if (error.message === "CANNOT_CHANGE_OWN_ROLE") {
          return reply
            .code(403)
            .send({ error: "You cannot change your own role" });
        }
        throw error;
      }
    }
  );
}
