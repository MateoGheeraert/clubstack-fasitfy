export const createActivitySchema = {
    type: "object",
    required: ["organizationId", "title", "starts_at", "ends_at"],
    properties: {
        organizationId: { type: "string" },
        title: { type: "string", minLength: 1, maxLength: 255 },
        starts_at: { type: "string", format: "date-time" },
        ends_at: { type: "string", format: "date-time" },
        location: { type: "string", maxLength: 255 },
        description: { type: "string", maxLength: 1000 },
        attendees: {
            type: "array",
            items: { type: "string" },
            maxItems: 100,
        },
    },
};
export const updateActivitySchema = {
    type: "object",
    properties: {
        title: { type: "string", minLength: 1, maxLength: 255 },
        starts_at: { type: "string", format: "date-time" },
        ends_at: { type: "string", format: "date-time" },
        location: { type: "string", maxLength: 255 },
        description: { type: "string", maxLength: 1000 },
        attendees: {
            type: "array",
            items: { type: "string" },
            maxItems: 100,
        },
    },
};
export const addAttendeeSchema = {
    type: "object",
    required: ["attendee"],
    properties: {
        attendee: { type: "string", minLength: 1, maxLength: 255 },
    },
};
export const getActivitiesQuerySchema = {
    type: "object",
    properties: {
        organizationId: { type: "string" },
        title: { type: "string" },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        location: { type: "string" },
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
    },
};
export const activityParamsSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string" },
    },
};
export const organizationActivityParamsSchema = {
    type: "object",
    required: ["organizationId"],
    properties: {
        organizationId: { type: "string" },
    },
};
export const activityResponseSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        organizationId: { type: "string" },
        title: { type: "string" },
        starts_at: { type: "string", format: "date-time" },
        ends_at: { type: "string", format: "date-time" },
        location: { type: "string" },
        description: { type: "string" },
        attendees: {
            type: "array",
            items: { type: "string" },
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        organization: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
            },
        },
    },
};
export const activitiesResponseSchema = {
    type: "object",
    properties: {
        activities: {
            type: "array",
            items: activityResponseSchema,
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
