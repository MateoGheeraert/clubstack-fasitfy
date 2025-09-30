import { Role } from "@prisma/client";
import { AccountService } from "./account.service";
import { createAccountSchema, updateAccountSchema, getAccountsQuerySchema, accountParamsSchema, organizationAccountParamsSchema, accountResponseSchema, accountsResponseSchema, errorResponseSchema, } from "./account.schema";
export default async function accountRoutes(fastify) {
    const accountService = new AccountService(fastify.prisma);
    // Create a new account (Admin only)
    fastify.post("/", {
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
    }, async (request, reply) => {
        try {
            const body = request.body;
            const user = request.user;
            const account = await accountService.createAccount(body, user.role);
            reply.code(201).send(account);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_NOT_FOUND") {
                return reply.code(404).send({ error: "Organization not found" });
            }
            if (error.message === "ORGANIZATION_ALREADY_HAS_ACCOUNT") {
                return reply.code(409).send({ error: "Organization already has an account" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Get all accounts with filters
    fastify.get("/", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["accounts"],
            security: [{ bearerAuth: [] }],
            summary: "Get all accounts with filters",
            querystring: getAccountsQuerySchema,
            response: {
                200: accountsResponseSchema,
                403: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const user = request.user;
            const query = request.query;
            const result = await accountService.getAccounts(query, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Get my accounts (shortcut for current user's accounts)
    fastify.get("/my", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["accounts"],
            security: [{ bearerAuth: [] }],
            summary: "Get current user's accounts",
        },
    }, async (request, reply) => {
        const user = request.user;
        const result = await accountService.getMyAccounts(user.id);
        reply.send(result);
    });
    // Get account by ID
    fastify.get("/:id", {
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
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const account = await accountService.getAccountById(id, user.id, user.role);
            reply.send(account);
        }
        catch (error) {
            if (error.message === "ACCOUNT_NOT_FOUND") {
                return reply.code(404).send({ error: "Account not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Get account by organization ID
    fastify.get("/organization/:organizationId", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["accounts"],
            security: [{ bearerAuth: [] }],
            summary: "Get account by organization ID",
            params: organizationAccountParamsSchema,
            response: {
                200: accountResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { organizationId } = request.params;
            const user = request.user;
            const account = await accountService.getAccountByOrganization(organizationId, user.id, user.role);
            reply.send(account);
        }
        catch (error) {
            if (error.message === "ACCOUNT_NOT_FOUND") {
                return reply.code(404).send({ error: "Account not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Update account details (Admin only)
    fastify.patch("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["accounts"],
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
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            const user = request.user;
            const account = await accountService.updateAccount(id, body, user.id, user.role);
            reply.send(account);
        }
        catch (error) {
            if (error.message === "ACCOUNT_NOT_FOUND") {
                return reply.code(404).send({ error: "Account not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Delete account (Admin only)
    fastify.delete("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["accounts"],
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
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const result = await accountService.deleteAccount(id, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "ACCOUNT_NOT_FOUND") {
                return reply.code(404).send({ error: "Account not found" });
            }
            if (error.message === "ACCOUNT_HAS_TRANSACTIONS") {
                return reply.code(400).send({ error: "Cannot delete account with existing transactions" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
}
