export const createOrganizationSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
  },
} as const;

export const updateOrganizationSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 255 },
  },
} as const;

export const addUserToOrganizationSchema = {
  type: "object",
  required: ["userId"],
  properties: {
    userId: { type: "string" },
  },
} as const;

export const addUserByEmailToOrganizationSchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: { type: "string", format: "email" },
  },
} as const;

export const updateUserRoleSchema = {
  type: "object",
  required: ["role"],
  properties: {
    role: { type: "string", enum: ["USER", "MODERATOR", "ADMIN"] },
  },
} as const;

export const getOrganizationsQuerySchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
  },
} as const;

export const organizationParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
} as const;

export const userOrganizationParamsSchema = {
  type: "object",
  required: ["id", "userId"],
  properties: {
    id: { type: "string" },
    userId: { type: "string" },
  },
} as const;

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
} as const;

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
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
} as const;
