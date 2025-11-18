import { FastifyInstance } from "fastify";
import { OrganizationService } from "../../../service";
import {
  organizationParamsSchema,
  addUserByEmailToOrganizationSchema,
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

export default async function postUserByEmailRoute(fastify: FastifyInstance) {
  const organizationService = new OrganizationService(fastify.prisma);

  // POST /organizations/:id/users/email - Add user to organization by email (Admin only)
  fastify.post(
    "/organizations/:id/users/email",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["organizations"],
        security: [{ bearerAuth: [] }],
        summary: "Add user to organization by email (Admin only)",
        params: organizationParamsSchema,
        body: addUserByEmailToOrganizationSchema,
        response: {
          201: userOrganizationResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { email } = request.body as { email: string };
        const user = request.user as { id: string };

        const result = await organizationService.addUserToOrganizationByEmail(
          id,
          email,
          user.id
        );
        reply.code(201).send(result);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "USER_NOT_FOUND") {
          return reply
            .code(404)
            .send({ error: "User with this email not found" });
        }
        if (error.message === "USER_ALREADY_IN_ORGANIZATION") {
          return reply
            .code(409)
            .send({ error: "User is already in this organization" });
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
