import { Role } from "@prisma/client";
import { OrganizationService } from "./organization.service";
import { createOrganizationSchema, updateOrganizationSchema, addUserToOrganizationSchema, getOrganizationsQuerySchema, organizationParamsSchema, userOrganizationParamsSchema, organizationResponseSchema, organizationsResponseSchema, errorResponseSchema, } from "./organization.schema";
export default async function organizationRoutes(fastify) {
    const organizationService = new OrganizationService(fastify.prisma);
    // Create a new organization (Admin only)
    fastify.post("/", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Create a new organization (Admin only)",
            body: createOrganizationSchema,
            response: {
                201: organizationResponseSchema,
                409: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const body = request.body;
            const organization = await organizationService.createOrganization(body);
            reply.code(201).send(organization);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_ALREADY_EXISTS") {
                return reply.code(409).send({ error: "Organization with this name already exists" });
            }
            throw error;
        }
    });
    // Get all organizations with filters (Admin only)
    fastify.get("/", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Get all organizations with filters (Admin only)",
            querystring: getOrganizationsQuerySchema,
            response: { 200: organizationsResponseSchema },
        },
    }, async (request, reply) => {
        const query = request.query;
        const result = await organizationService.getOrganizations(query);
        reply.send(result);
    });
    // Get my organizations (shortcut for current user's organizations)
    fastify.get("/my", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Get current user's organizations",
        },
    }, async (request, reply) => {
        const user = request.user;
        const result = await organizationService.getMyOrganizations(user.id);
        reply.send(result);
    });
    // Get organization by ID
    fastify.get("/:id", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Get organization by ID",
            params: organizationParamsSchema,
            response: {
                200: organizationResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const organization = await organizationService.getOrganizationById(id);
            // Check if user can view this organization (admin or member)
            if (user.role !== Role.ADMIN) {
                const isMember = organization.users.some(userOrg => userOrg.user.id === user.id);
                if (!isMember) {
                    return reply.code(403).send({ error: "Access denied" });
                }
            }
            reply.send(organization);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_NOT_FOUND") {
                return reply.code(404).send({ error: "Organization not found" });
            }
            throw error;
        }
    });
    // Update organization details (Admin only)
    fastify.patch("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Update organization details (Admin only)",
            params: organizationParamsSchema,
            body: updateOrganizationSchema,
            response: {
                200: organizationResponseSchema,
                403: errorResponseSchema,
                404: errorResponseSchema,
                409: errorResponseSchema,
            },
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            const user = request.user;
            const organization = await organizationService.updateOrganization(id, body, user.role);
            reply.send(organization);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_NOT_FOUND") {
                return reply.code(404).send({ error: "Organization not found" });
            }
            if (error.message === "ORGANIZATION_NAME_TAKEN") {
                return reply.code(409).send({ error: "Organization name already taken" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Add user to organization (Admin only)
    fastify.post("/:id/users", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Add user to organization (Admin only)",
            params: organizationParamsSchema,
            body: addUserToOrganizationSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { userId } = request.body;
            const user = request.user;
            const result = await organizationService.addUserToOrganization(id, userId, user.role);
            reply.code(201).send(result);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_NOT_FOUND") {
                return reply.code(404).send({ error: "Organization not found" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return reply.code(404).send({ error: "User not found" });
            }
            if (error.message === "USER_ALREADY_IN_ORGANIZATION") {
                return reply.code(409).send({ error: "User is already in this organization" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Remove user from organization (Admin only)
    fastify.delete("/:id/users/:userId", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Remove user from organization (Admin only)",
            params: userOrganizationParamsSchema,
        },
    }, async (request, reply) => {
        try {
            const { id, userId } = request.params;
            const user = request.user;
            const result = await organizationService.removeUserFromOrganization(id, userId, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "ORGANIZATION_NOT_FOUND") {
                return reply.code(404).send({ error: "Organization not found" });
            }
            if (error.message === "USER_NOT_IN_ORGANIZATION") {
                return reply.code(404).send({ error: "User is not in this organization" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
    // Delete organization (Admin only)
    fastify.delete("/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Delete organization (Admin only)",
            params: organizationParamsSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const result = await organizationService.deleteOrganization(id, user.role);
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
    // Get user's organizations
    fastify.get("/users/:userId", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["organizations"],
            security: [{ bearerAuth: [] }],
            summary: "Get user's organizations",
            params: {
                type: "object",
                required: ["userId"],
                properties: {
                    userId: { type: "string" },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            const user = request.user;
            const result = await organizationService.getUserOrganizations(userId, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Access denied" });
            }
            throw error;
        }
    });
}
