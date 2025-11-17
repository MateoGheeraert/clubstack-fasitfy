import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AccountService } from "./service";
import {
  getAccountsQuerySchema,
  accountsResponseSchema,
  accountResponseSchema,
  errorResponseSchema,
} from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const accountService = new AccountService(fastify.prisma);

  // GET /accounts - Get all accounts with filters
  fastify.get(
    "/accounts",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["accounts"],
        security: [{ bearerAuth: [] }],
        summary: "Get all accounts with filters",
        querystring: getAccountsQuerySchema,
        response: {
          200: accountsResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as { id: string; role: Role };
        const query = request.query as {
          organizationId?: string;
          type?: string;
          accountName?: string;
          page?: number;
          limit?: number;
        };

        const result = await accountService.getAccounts(
          query,
          user.id,
          user.role
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
