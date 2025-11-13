import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { TransactionService } from "../service";
import { transactionParamsSchema, transactionResponseSchema, errorResponseSchema } from "../schema";

export default async function getIdRoute(fastify: FastifyInstance) {
  const transactionService = new TransactionService(fastify.prisma);

  // GET /transactions/:id - Get transaction by ID
  fastify.get(
    "/transactions/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["transactions"],
        security: [{ bearerAuth: [] }],
        summary: "Get transaction by ID",
        params: transactionParamsSchema,
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
        const user = request.user as { id: string; role: Role };

        const transaction = await transactionService.getTransactionById(
          id,
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
