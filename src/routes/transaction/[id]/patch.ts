import { FastifyInstance } from "fastify";
import { Role, TransactionType } from "@prisma/client";
import { TransactionService } from "../service";
import { transactionParamsSchema, updateTransactionSchema, transactionResponseSchema, errorResponseSchema } from "../schema";

export default async function patchIdRoute(fastify: FastifyInstance) {
  const transactionService = new TransactionService(fastify.prisma);

  // PATCH /transactions/:id - Update transaction (Admin only)
  fastify.patch(
    "/transactions/:id",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        summary: "Update transaction (Admin only)",
        params: transactionParamsSchema,
        body: updateTransactionSchema,
        response: {
          200: transactionResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          amount?: number;
          transactionType?: TransactionType;
          description?: string;
          transactionDate?: string;
          transactionCode?: string;
        };
        const user = request.user as { id: string; role: Role };

        const updateData = {
          ...body,
          transactionDate: body.transactionDate
            ? new Date(body.transactionDate)
            : undefined,
        };

        const transaction = await transactionService.updateTransaction(
          id,
          updateData,
          user.id,
          user.role
        );
        reply.send(transaction);
      } catch (error: any) {
        if (error.message === "TRANSACTION_NOT_FOUND") {
          return reply.code(404).send({ error: "Transaction not found" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
