import { Role } from "@prisma/client";
import { AdminService } from "./admin.service";
import { adminUserListResponse, adminCreateTaskSchema, adminReassignTaskSchema, adminTasksQuerySchema, taskParamsSchema, } from "./admin.schema";
const adminRoutes = async (fastify) => {
    const adminService = new AdminService(fastify.prisma);
    // User management
    fastify.get("/users", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["admin"],
            security: [{ bearerAuth: [] }],
            summary: "List all users (ADMIN only)",
            response: adminUserListResponse,
        },
    }, async () => {
        return adminService.listUsers();
    });
    // Task management endpoints for admins
    // Get all tasks (admin view with all filters)
    fastify.get("/tasks", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["admin"],
            security: [{ bearerAuth: [] }],
            summary: "Get all tasks across all users (ADMIN only)",
            querystring: adminTasksQuerySchema,
        },
    }, async (request, reply) => {
        const query = request.query;
        const result = await adminService.getAllTasks(query);
        reply.send(result);
    });
    // Create task and assign to user
    fastify.post("/tasks", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["admin"],
            security: [{ bearerAuth: [] }],
            summary: "Create task and assign to user (ADMIN only)",
            body: adminCreateTaskSchema,
        },
    }, async (request, reply) => {
        try {
            const body = request.body;
            const task = await adminService.createTaskForUser(body);
            reply.code(201).send(task);
        }
        catch (error) {
            if (error.message === "USER_NOT_FOUND") {
                return reply.code(400).send({ error: "User not found" });
            }
            throw error;
        }
    });
    // Reassign task to different user
    fastify.patch("/tasks/:id/reassign", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["admin"],
            security: [{ bearerAuth: [] }],
            summary: "Reassign task to different user (ADMIN only)",
            params: taskParamsSchema,
            body: adminReassignTaskSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { userId } = request.body;
            const task = await adminService.reassignTask(id, userId);
            reply.send(task);
        }
        catch (error) {
            if (error.message === "TASK_NOT_FOUND") {
                return reply.code(404).send({ error: "Task not found" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return reply.code(400).send({ error: "User not found" });
            }
            throw error;
        }
    });
    // Force delete any task
    fastify.delete("/tasks/:id", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["admin"],
            security: [{ bearerAuth: [] }],
            summary: "Force delete any task (ADMIN only)",
            params: taskParamsSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const result = await adminService.deleteAnyTask(id);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "TASK_NOT_FOUND") {
                return reply.code(404).send({ error: "Task not found" });
            }
            throw error;
        }
    });
    // Get task statistics dashboard
    fastify.get("/tasks/statistics", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["admin"],
            security: [{ bearerAuth: [] }],
            summary: "Get task statistics dashboard (ADMIN only)",
        },
    }, async (request, reply) => {
        const stats = await adminService.getTaskStatistics();
        reply.send(stats);
    });
};
export default adminRoutes;
