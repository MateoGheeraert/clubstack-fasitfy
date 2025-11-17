import { FastifyInstance } from "fastify";
import { Role, TransactionType } from "@prisma/client";
import { TransactionService } from "../service";
import { transactionsResponseSchema } from "../schema";

export default async function myTransactionsRoute(fastify: FastifyInstance) {
  const transactionService = new TransactionService(fastify.prisma);

  // GET /transactions/my - Get current user's transactions
  fastify.get(
    "/transactions/my",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        summary: "Get current user's transactions",
        querystring: {
          type: "object",
          properties: {
            accountId: { type: "string" },
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
        response: { 200: transactionsResponseSchema },
      },
    },
    async (request, reply) => {
      const user = request.user as { id: string; role: Role };
      const query = request.query as {
        accountId?: string;
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

      const result = await transactionService.getMyTransactions(
        user.id,
        filters
      );
      reply.send(result);
    }
  );
}
