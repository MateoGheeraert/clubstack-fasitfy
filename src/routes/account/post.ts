import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { AccountService } from "./service";
import {
  createAccountSchema,
  accountResponseSchema,
  errorResponseSchema,
} from "./schema";

export default async function postRoute(fastify: FastifyInstance) {
  const accountService = new AccountService(fastify.prisma);

  // POST /accounts - Create a new account (Admin only)
  fastify.post(
    "/accounts",
    {
      preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
      schema: {
        tags: ["accounts"],
        security: [{ bearerAuth: [] }],
        summary: "Create a new account (Admin only)",
        body: createAccountSchema,
        response: {
          201: accountResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          organizationId: string;
          accountName: string;
          type: string;
          balance?: number;
        };
        const user = request.user as { id: string; role: Role };

        const account = await accountService.createAccount(body, user.role);
        reply.code(201).send(account);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "ORGANIZATION_ALREADY_HAS_ACCOUNT") {
          return reply
            .code(409)
            .send({ error: "Organization already has an account" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
