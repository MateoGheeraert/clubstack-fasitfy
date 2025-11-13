import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AccountService } from "../service";
import {
  updateAccountSchema,
  accountParamsSchema,
  accountResponseSchema,
  errorResponseSchema,
} from "../schema";

export default async function patchRoute(fastify: FastifyInstance) {
  const accountService = new AccountService(fastify.prisma);

  // PATCH /accounts/:id - Update account details (Admin only)
  fastify.patch(
    "/accounts/:id",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["accounts", "admin"],
        security: [{ bearerAuth: [] }],
        summary: "Update account details (Admin only)",
        params: accountParamsSchema,
        body: updateAccountSchema,
        response: {
          200: accountResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = request.body as {
          accountName?: string;
          type?: string;
          balance?: number;
        };
        const user = request.user as { id: string; role: Role };

        const account = await accountService.updateAccount(
          id,
          body,
          user.id,
          user.role
        );
        reply.send(account);
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
