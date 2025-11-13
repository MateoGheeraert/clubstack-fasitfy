import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AccountService } from "../service";
import {
  accountParamsSchema,
  accountResponseSchema,
  errorResponseSchema,
} from "../schema";

export default async function getByIdRoute(fastify: FastifyInstance) {
  const accountService = new AccountService(fastify.prisma);

  // GET /accounts/:id - Get account by ID
  fastify.get(
    "/accounts/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["accounts"],
        security: [{ bearerAuth: [] }],
        summary: "Get account by ID",
        params: accountParamsSchema,
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
        const user = request.user as { id: string; role: Role };

        const account = await accountService.getAccountById(
          id,
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
