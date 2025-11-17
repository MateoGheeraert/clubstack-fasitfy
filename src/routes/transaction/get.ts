import { FastifyInstance } from "fastify";
import { Role, TransactionType } from "@prisma/client";
import { TransactionService } from "./service";
import { getTransactionsQuerySchema, transactionsResponseSchema, errorResponseSchema } from "./schema";

export default async function getRoutes(fastify: FastifyInstance) {
  const transactionService = new TransactionService(fastify.prisma);

  // GET /transactions - Get all transactions with filters
  fastify.get(
    "/transactions",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        summary: "Get all transactions with filters",
        querystring: getTransactionsQuerySchema,
        response: {
          200: transactionsResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as { id: string; role: Role };
        const query = request.query as {
          accountId?: string;
          organizationId?: string;
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

        const result = await transactionService.getTransactions(
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
