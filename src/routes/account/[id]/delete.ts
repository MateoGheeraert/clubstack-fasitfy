import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AccountService } from "../service";
import {
  accountParamsSchema,
  errorResponseSchema,
} from "../schema";

export default async function deleteRoute(fastify: FastifyInstance) {
  const accountService = new AccountService(fastify.prisma);

  // DELETE /accounts/:id - Delete account (Admin only)
  fastify.delete(
    "/accounts/:id",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["accounts", "admin"],
        security: [{ bearerAuth: [] }],
        summary: "Delete account (Admin only)",
        params: accountParamsSchema,
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = request.user as { id: string; role: Role };

        const result = await accountService.deleteAccount(
          id,
          user.id,
          user.role
        );
        reply.send(result);
      } catch (error: any) {
        if (error.message === "ACCOUNT_NOT_FOUND") {
          return reply.code(404).send({ error: "Account not found" });
        }
        if (error.message === "ACCOUNT_HAS_TRANSACTIONS") {
          return reply.code(400).send({
            error: "Cannot delete account with existing transactions",
          });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
