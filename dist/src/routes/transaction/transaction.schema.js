export const createTransactionSchema = {
    type: "object",
    required: ["accountId", "amount", "transactionType", "transactionDate", "transactionCode"],
    properties: {
        accountId: { type: "string" },
        amount: { type: "number", minimum: 0.01 },
        transactionType: {
            type: "string",
            enum: ["DEPOSIT", "WITHDRAWAL", "PAYMENT", "INCOME"],
        },
        description: { type: "string", maxLength: 500 },
        transactionDate: { type: "string", format: "date-time" },
        transactionCode: { type: "string", minLength: 1, maxLength: 50 },
    },
};
export const updateTransactionSchema = {
    type: "object",
    properties: {
        amount: { type: "number", minimum: 0.01 },
        transactionType: {
            type: "string",
            enum: ["DEPOSIT", "WITHDRAWAL", "PAYMENT", "INCOME"],
        },
        description: { type: "string", maxLength: 500 },
        transactionDate: { type: "string", format: "date-time" },
        transactionCode: { type: "string", minLength: 1, maxLength: 50 },
    },
};
export const getTransactionsQuerySchema = {
    type: "object",
    properties: {
        accountId: { type: "string" },
        organizationId: { type: "string" },
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
};
export const transactionParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string" },
    },
};
export const accountTransactionParamsSchema = {
    type: "object",
    required: ["accountId"],
    properties: {
        accountId: { type: "string" },
    },
};
export const transactionResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        accountId: { type: "string" },
        amount: { type: "number" },
        transactionType: { type: "string" },
        description: { type: "string" },
        transactionDate: { type: "string", format: "date-time" },
        transactionCode: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        account: {
            type: "object",
            properties: {
                id: { type: "string" },
                organizationId: { type: "string" },
                accountName: { type: "string" },
                balance: { type: "number" },
                type: { type: "string" },
                organization: {
                    type: "object",
                    properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                    },
                },
            },
        },
    },
};
export const transactionsResponseSchema = {
    type: "object",
    properties: {
        transactions: {
            type: "array",
            items: transactionResponseSchema,
        },
        pagination: {
            type: "object",
            properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
            },
        },
        summary: {
            type: "object",
            properties: {
                totalAmount: { type: "number" },
                deposits: { type: "number" },
                withdrawals: { type: "number" },
                payments: { type: "number" },
                income: { type: "number" },
            },
        },
    },
};
export const errorResponseSchema = {
    type: "object",
    properties: {
        error: { type: "string" },
    },
};
