import { Role } from "@prisma/client";
import { ActivityService } from "./activity.service";
import { createActivitySchema, updateActivitySchema, addAttendeeSchema, getActivitiesQuerySchema, activityParamsSchema, organizationActivityParamsSchema, activityResponseSchema, activitiesResponseSchema, errorResponseSchema, } from "./activity.schema";
export default async function activityRoutes(fastify) {
    const activityService = new ActivityService(fastify.prisma);
    // Create a new activity
    fastify.post("/", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Create a new activity",
            body: createActivitySchema,
            response: {
                201: activityResponseSchema,
                400: errorResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const body = request.body;
            const user = request.user;
            const activityData = {
                ...body,
                starts_at: new Date(body.starts_at),
                ends_at: new Date(body.ends_at),
            };
            const activity = await activityService.createActivity(activityData, user.id, user.role);
            reply.code(201).send(activity);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_NOT_FOUND") {
                return reply.code(404).send({ error: "Organization not found" });
            }
            if (error.message === "INVALID_DATE_RANGE") {
                return reply.code(400).send({ error: "Start date must be before end date" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Get all activities with filters
    fastify.get("/", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Get all activities with filters",
            querystring: getActivitiesQuerySchema,
            response: {
                200: activitiesResponseSchema,
                403: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const user = request.user;
            const query = request.query;
            const filters = {
                ...query,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
            };
            const result = await activityService.getActivities(filters, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Get my activities (shortcut for current user's activities)
    fastify.get("/my", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Get current user's activities",
            querystring: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    startDate: { type: "string", format: "date-time" },
                    endDate: { type: "string", format: "date-time" },
                    location: { type: "string" },
                    page: { type: "integer", minimum: 1, default: 1 },
                    limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
                },
            },
            response: { 200: activitiesResponseSchema },
        },
    }, async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const filters = {
            ...query,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        };
        const result = await activityService.getMyActivities(user.id, filters);
        reply.send(result);
    });
    // Get upcoming activities
    fastify.get("/upcoming", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Get upcoming activities",
            querystring: {
                type: "object",
                properties: {
                    limit: { type: "integer", minimum: 1, maximum: 20, default: 5 },
                },
            },
        },
    }, async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const result = await activityService.getUpcomingActivities(user.id, user.role, query.limit);
        reply.send(result);
    });
    // Get activity by ID
    fastify.get("/:id", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Get activity by ID",
            params: activityParamsSchema,
            response: {
                200: activityResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const activity = await activityService.getActivityById(id, user.id, user.role);
            reply.send(activity);
        }
        catch (error) {
            if (error.message === "ACTIVITY_NOT_FOUND") {
                return reply.code(404).send({ error: "Activity not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Get activities for a specific organization
    fastify.get("/organization/:organizationId", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Get activities for a specific organization",
            params: organizationActivityParamsSchema,
            querystring: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    startDate: { type: "string", format: "date-time" },
                    endDate: { type: "string", format: "date-time" },
                    location: { type: "string" },
                    page: { type: "integer", minimum: 1, default: 1 },
                    limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
                },
            },
            response: {
                200: activitiesResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { organizationId } = request.params;
            const user = request.user;
            const query = request.query;
            const filters = {
                ...query,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
            };
            const result = await activityService.getOrganizationActivities(organizationId, filters, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_NOT_FOUND") {
                return reply.code(404).send({ error: "Organization not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Update activity details (Admin only)
    fastify.patch("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Update activity details (Admin only)",
            params: activityParamsSchema,
            body: updateActivitySchema,
            response: {
                200: activityResponseSchema,
                400: errorResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            const user = request.user;
            const updateData = {
                ...body,
                starts_at: body.starts_at ? new Date(body.starts_at) : undefined,
                ends_at: body.ends_at ? new Date(body.ends_at) : undefined,
            };
            const activity = await activityService.updateActivity(id, updateData, user.id, user.role);
            reply.send(activity);
        }
        catch (error) {
            if (error.message === "ACTIVITY_NOT_FOUND") {
                return reply.code(404).send({ error: "Activity not found" });
            }
            if (error.message === "INVALID_DATE_RANGE") {
                return reply.code(400).send({ error: "Start date must be before end date" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Add attendee to activity (Admin only)
    fastify.post("/:id/attendees", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Add attendee to activity (Admin only)",
            params: activityParamsSchema,
            body: addAttendeeSchema,
            response: {
                200: activityResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
                409: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { attendee } = request.body;
            const user = request.user;
            const activity = await activityService.addAttendee(id, attendee, user.id, user.role);
            reply.send(activity);
        }
        catch (error) {
            if (error.message === "ACTIVITY_NOT_FOUND") {
                return reply.code(404).send({ error: "Activity not found" });
            }
            if (error.message === "ATTENDEE_ALREADY_EXISTS") {
                return reply.code(409).send({ error: "Attendee already exists" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Remove attendee from activity (Admin only)
    fastify.delete("/:id/attendees/:attendee", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Remove attendee from activity (Admin only)",
            params: {
                type: "object",
                required: ["id", "attendee"],
                properties: {
                    id: { type: "string" },
                    attendee: { type: "string" },
                },
            },
            response: {
                200: activityResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id, attendee } = request.params;
            const user = request.user;
            const activity = await activityService.removeAttendee(id, attendee, user.id, user.role);
            reply.send(activity);
        }
        catch (error) {
            if (error.message === "ACTIVITY_NOT_FOUND") {
                return reply.code(404).send({ error: "Activity not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Delete activity (Admin only)
    fastify.delete("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["activities"],
            security: [{ bearerAuth: [] }],
            summary: "Delete activity (Admin only)",
            params: activityParamsSchema,
            response: {
                200: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                    },
                },
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const result = await activityService.deleteActivity(id, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "ACTIVITY_NOT_FOUND") {
                return reply.code(404).send({ error: "Activity not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
}
