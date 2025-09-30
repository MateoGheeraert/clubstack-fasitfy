export const adminUserListResponse = {
    200: {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "string" },
                email: { type: "string" },
                role: { type: "string" },
            },
        },
    },
};
// Admin Task Management Schemas
export const adminCreateTaskSchema = {
    type: "object",
    required: ["title", "userId"],
    properties: {
        title: { type: "string", minLength: 1, maxLength: 255 },
        description: { type: "string", maxLength: 1000 },
        userId: { type: "string" },
    },
};
export const adminReassignTaskSchema = {
    type: "object",
    required: ["userId"],
    properties: {
        userId: { type: "string" },
    },
};
export const adminTasksQuerySchema = {
    type: "object",
    properties: {
        status: { type: "string" },
        userId: { type: "string" },
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
};
export const taskParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string" },
    },
};
