import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AccountService } from "../service";
import { accountResponseSchema } from "../schema";

export default async function myAccountsRoute(fastify: FastifyInstance) {
  const accountService = new AccountService(fastify.prisma);

  // GET /accounts/my - Get current user's accounts
  fastify.get(
    "/accounts/my",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["accounts"],
        security: [{ bearerAuth: [] }],
        summary: "Get current user's accounts",
        response: {
          200: {
            type: "array",
            items: accountResponseSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as { id: string; role: Role };
      const result = await accountService.getMyAccounts(user.id);
      reply.send(result);
    }
  );
}
