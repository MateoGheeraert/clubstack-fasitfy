import { FastifyInstance } from "fastify";
import { Role, TransactionType } from "@prisma/client";
import { TransactionService } from "./service";
import { createTransactionSchema, transactionResponseSchema, errorResponseSchema } from "./schema";

export default async function postRoutes(fastify: FastifyInstance) {
  const transactionService = new TransactionService(fastify.prisma);

  // POST /transactions - Create a new transaction
  fastify.post(
    "/transactions",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        summary: "Create a new transaction",
        body: createTransactionSchema,
        response: {
          201: transactionResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          accountId: string;
          amount: number;
          transactionType: TransactionType;
          description?: string;
          transactionDate: string;
          transactionCode: string;
        };
        const user = request.user as { id: string; role: Role };

        const transactionData = {
          ...body,
          transactionDate: new Date(body.transactionDate),
        };

        const transaction = await transactionService.createTransaction(
          transactionData,
          user.id,
          user.role
        );
        reply.code(201).send(transaction);
      } catch (error: any) {
        if (error.message === "ACCOUNT_NOT_FOUND") {
          return reply.code(404).send({ error: "Account not found" });
        }
        if (error.message === "INSUFFICIENT_FUNDS") {
          return reply.code(400).send({ error: "Insufficient funds" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
