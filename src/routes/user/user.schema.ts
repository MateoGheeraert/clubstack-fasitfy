export const userResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    role: { type: "string" },
  },
};

export const userProfileResponseSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    email: { type: "string" },
    role: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    organizations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          joinedAt: { type: "string", format: "date-time" },
          organization: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    recentTasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          status: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
    stats: {
      type: "object",
      properties: {
        totalOrganizations: { type: "integer" },
        totalTasks: { type: "integer" },
      },
    },
  },
};

export const userStatsResponseSchema = {
  type: "object",
  properties: {
    totalTasks: { type: "integer" },
    totalOrganizations: { type: "integer" },
  },
};
