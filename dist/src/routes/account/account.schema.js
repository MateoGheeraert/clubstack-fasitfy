export const createAccountSchema = {
    type: "object",
    required: ["organizationId", "accountName", "type"],
    properties: {
        organizationId: { type: "string" },
        accountName: { type: "string", minLength: 1, maxLength: 255 },
        type: { type: "string", minLength: 1, maxLength: 100 },
        balance: { type: "number", minimum: 0 },
    },
};
export const updateAccountSchema = {
    type: "object",
    properties: {
        accountName: { type: "string", minLength: 1, maxLength: 255 },
        type: { type: "string", minLength: 1, maxLength: 100 },
        balance: { type: "number", minimum: 0 },
    },
};
export const getAccountsQuerySchema = {
    type: "object",
    properties: {
        organizationId: { type: "string" },
        type: { type: "string" },
        accountName: { type: "string" },
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
};
export const accountParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string" },
    },
};
export const organizationAccountParamsSchema = {
    type: "object",
    required: ["organizationId"],
    properties: {
        organizationId: { type: "string" },
    },
};
export const accountResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        organizationId: { type: "string" },
        accountName: { type: "string" },
        balance: { type: "number" },
        type: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        organization: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
            },
        },
        Transaction: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    amount: { type: "number" },
                    transactionType: { type: "string" },
                    description: { type: "string" },
                    transactionDate: { type: "string", format: "date-time" },
                    transactionCode: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
        },
        _count: {
            type: "object",
            properties: {
                Transaction: { type: "integer" },
            },
        },
    },
};
export const accountsResponseSchema = {
    type: "object",
    properties: {
        accounts: {
            type: "array",
            items: accountResponseSchema,
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
    },
};
export const errorResponseSchema = {
    type: "object",
    properties: {
        error: { type: "string" },
    },
};
