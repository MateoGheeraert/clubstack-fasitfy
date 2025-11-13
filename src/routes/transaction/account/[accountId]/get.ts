import { FastifyInstance } from "fastify";
import { Role, TransactionType } from "@prisma/client";
import { TransactionService } from "../../service";
import { accountTransactionParamsSchema, transactionsResponseSchema, errorResponseSchema } from "../../schema";

export default async function getAccountIdRoute(fastify: FastifyInstance) {
  const transactionService = new TransactionService(fastify.prisma);

  // GET /transactions/account/:accountId - Get transactions for a specific account
  fastify.get(
    "/account/:accountId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        summary: "Get transactions for a specific account",
        params: accountTransactionParamsSchema,
        querystring: {
          type: "object",
          properties: {
            transactionType: {
              type: "string",
              enum: ["DEPOSIT", "WITHDRAWAL", "PAYMENT", "INCOME"],
            },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            minAmount: { type: "number", minimum: 0 },
            maxAmount: { type: "number", minimum: 0 },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        },
        response: {
          200: transactionsResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { accountId } = request.params as { accountId: string };
        const user = request.user as { id: string; role: Role };
        const query = request.query as {
          transactionType?: TransactionType;
          startDate?: string;
          endDate?: string;
          minAmount?: number;
          maxAmount?: number;
          page?: number;
          limit?: number;
        };

        const filters = {
          ...query,
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
        };

        const result = await transactionService.getAccountTransactions(
          accountId,
          filters,
          user.id,
          user.role
        );
        reply.send(result);
      } catch (error: any) {
        if (error.message === "ACCOUNT_NOT_FOUND") {
          return reply.code(404).send({ error: "Account not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
