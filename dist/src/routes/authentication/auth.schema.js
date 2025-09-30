export const authBodySchema = {
    type: "object",
    required: ["email", "password"],
    properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 },
    },
};
export const authRegisterResponse = {
    201: {
        type: "object",
        properties: {
            id: { type: "string" },
            email: { type: "string" },
            role: { type: "string" },
        },
    },
    409: {
        type: "object",
        properties: { message: { type: "string" } },
    },
};
export const authLoginResponse = {
    200: {
        type: "object",
        properties: { token: { type: "string" } },
    },
    401: {
        type: "object",
        properties: { message: { type: "string" } },
    },
};
