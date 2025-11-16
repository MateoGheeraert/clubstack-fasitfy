export const createTaskSchema = {
  type: "object",
  required: ["title", "userId", "organizationId"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 255 },
    description: { type: "string", maxLength: 1000 },
    userId: { type: "string" },
    organizationId: { type: "string" },
  },
} as const;

export const updateTaskSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1, maxLength: 255 },
    description: { type: "string", maxLength: 1000 },
  },
} as const;

export const updateTaskStatusSchema = {
  type: "object",
  required: ["status"],
  properties: {
    status: {
      type: "string",
      enum: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const;

export const assignTaskSchema = {
  type: "object",
  required: ["userId"],
  properties: {
    userId: { type: "string" },
  },
} as const;

export const getTasksQuerySchema = {
  type: "object",
  properties: {
    status: { type: "string" },
    userId: { type: "string" },
    organizationId: { type: "string" },
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
  },
} as const;

export const taskParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
} as const;

export const taskResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    status: { type: "string" },
    userId: { type: "string" },
    organizationId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        role: { type: "string" },
      },
    },
    organization: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
      },
    },
  },
} as const;

export const tasksResponseSchema = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: taskResponseSchema,
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

export const taskStatisticsResponseSchema = {
  type: "object",
  properties: {
    total: { type: "integer" },
    pending: { type: "integer" },
    in_progress: { type: "integer" },
    completed: { type: "integer" },
    cancelled: { type: "integer" },
  },
} as const;

export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
} as const;

export const successResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
} as const;
