import { Role } from "@prisma/client";
import { TransactionService } from "./transaction.service";
import { createTransactionSchema, updateTransactionSchema, getTransactionsQuerySchema, transactionParamsSchema, accountTransactionParamsSchema, transactionResponseSchema, transactionsResponseSchema, errorResponseSchema, } from "./transaction.schema";
export default async function transactionRoutes(fastify) {
    const transactionService = new TransactionService(fastify.prisma);
    // Create a new transaction
    fastify.post("/", {
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
    }, async (request, reply) => {
        try {
            const body = request.body;
            const user = request.user;
            const transactionData = {
                ...body,
                transactionDate: new Date(body.transactionDate),
            };
            const transaction = await transactionService.createTransaction(transactionData, user.id, user.role);
            reply.code(201).send(transaction);
        }
        catch (error) {
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
    });
    // Get all transactions with filters
    fastify.get("/", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["transactions"],
            security: [{ bearerAuth: [] }],
            summary: "Get all transactions with filters",
            querystring: getTransactionsQuerySchema,
            response: {
                200: transactionsResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const user = request.user;
            const query = request.query;
            const filters = {
                ...query,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
            };
            const result = await transactionService.getTransactions(filters, user.id, user.role);
            reply.send(result);
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
    // Get my transactions (shortcut for current user's transactions)
    fastify.get("/my", {
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
    }, async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const filters = {
            ...query,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        };
        const result = await transactionService.getMyTransactions(user.id, filters);
        reply.send(result);
    });
    // Get transaction by ID
    fastify.get("/:id", {
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
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const transaction = await transactionService.getTransactionById(id, user.id, user.role);
            reply.send(transaction);
        }
        catch (error) {
            if (error.message === "TRANSACTION_NOT_FOUND") {
                return reply.code(404).send({ error: "Transaction not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Get transactions for a specific account
    fastify.get("/account/:accountId", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["transactions"],
            security: [{ bearerAuth: [] }],
            summary: "Get transactions for a specific account",
            params: accountTransactionParamsSchema,
            querystring: {
                type: "object",
                properties: {
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
            response: {
                200: transactionsResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { accountId } = request.params;
            const user = request.user;
            const query = request.query;
            const filters = {
                ...query,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
            };
            const result = await transactionService.getAccountTransactions(accountId, filters, user.id, user.role);
            reply.send(result);
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
    // Update transaction details (Admin only)
    fastify.patch("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["transactions"],
            security: [{ bearerAuth: [] }],
            summary: "Update transaction details (Admin only)",
            params: transactionParamsSchema,
            body: updateTransactionSchema,
            response: {
                200: transactionResponseSchema,
                400: errorResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            const user = request.user;
            const updateData = {
                ...body,
                transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
            };
            const transaction = await transactionService.updateTransaction(id, updateData, user.id, user.role);
            reply.send(transaction);
        }
        catch (error) {
            if (error.message === "TRANSACTION_NOT_FOUND") {
                return reply.code(404).send({ error: "Transaction not found" });
            }
            if (error.message === "INSUFFICIENT_FUNDS") {
                return reply.code(400).send({ error: "Insufficient funds" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Delete transaction (Admin only)
    fastify.delete("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["transactions"],
            security: [{ bearerAuth: [] }],
            summary: "Delete transaction (Admin only)",
            params: transactionParamsSchema,
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
            const result = await transactionService.deleteTransaction(id, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "TRANSACTION_NOT_FOUND") {
                return reply.code(404).send({ error: "Transaction not found" });
            }
            if (error.message === "INSUFFICIENT_FUNDS") {
                return reply.code(400).send({ error: "Insufficient funds for reversal" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
}
