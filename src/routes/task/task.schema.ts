export const createTaskSchema = {
  type: "object",
  required: ["title", "userId"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 255 },
    description: { type: "string", maxLength: 1000 },
    userId: { type: "string" },
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
