import { FastifyInstance } from "fastify";
import { OrganizationService } from "../../service";
import {
  organizationParamsSchema,
  errorResponseSchema,
} from "../../schema";

const organizationUsersResponseSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      userId: { type: "string" },
      organizationId: { type: "string" },
      role: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      user: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
} as const;

export default async function getUsersRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // GET /organizations/:id/users - Get all users of an organization (Admin only)
  fastify.get(
    "/organizations/:id/users",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Get all users of an organization (Admin only)",
        params: organizationParamsSchema,
        response: {
          200: organizationUsersResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string };

        const users = await organizationService.getOrganizationUsers(
          id,
          user.id
        );
        reply.send(users);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply
            .code(403)
            .send({ error: "Access denied. Admin role required." });
        }
        throw error;
      }
    }
  );
}
