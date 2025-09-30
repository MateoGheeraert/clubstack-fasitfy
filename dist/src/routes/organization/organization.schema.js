export const createOrganizationSchema = {
    type: "object",
    required: ["name"],
    properties: {
        name: { type: "string", minLength: 1, maxLength: 255 },
    },
};
export const updateOrganizationSchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 1, maxLength: 255 },
    },
};
export const addUserToOrganizationSchema = {
    type: "object",
    required: ["userId"],
    properties: {
        userId: { type: "string" },
    },
};
export const getOrganizationsQuerySchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
};
export const organizationParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string" },
    },
};
export const userOrganizationParamsSchema = {
    type: "object",
    required: ["id", "userId"],
    properties: {
        id: { type: "string" },
        userId: { type: "string" },
    },
};
export const organizationResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        name: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        users: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    user: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            email: { type: "string" },
                            role: { type: "string" },
                        },
                    },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
        },
    },
};
export const organizationsResponseSchema = {
    type: "object",
    properties: {
        organizations: {
            type: "array",
            items: organizationResponseSchema,
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
