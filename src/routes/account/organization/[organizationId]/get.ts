import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AccountService } from "../../service";
import {
  organizationAccountParamsSchema,
  accountResponseSchema,
  errorResponseSchema,
} from "../../schema";

export default async function getByOrganizationRoute(fastify: FastifyInstance) {
  const accountService = new AccountService(fastify.prisma);

  // GET /accounts/organization/:organizationId - Get accounts for a specific organization
  fastify.get(
    "/accounts/organization/:organizationId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["accounts"],
        security: [{ bearerAuth: [] }],
        summary: "Get accounts by organization ID",
        params: organizationAccountParamsSchema,
        response: {
          200: {
            type: "array",
            items: accountResponseSchema,
          },
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { organizationId } = request.params as { organizationId: string };
        const user = request.user as { id: string; role: Role };

        const accounts = await accountService.getAccountByOrganization(
          organizationId,
          user.id,
          user.role
        );
        reply.send(accounts);
      } catch (error: any) {
        if (error.message === "ACCOUNTS_NOT_FOUND") {
          return reply
            .code(404)
            .send({ error: "No accounts found for this organization" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
