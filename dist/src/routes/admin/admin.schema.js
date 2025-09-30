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
