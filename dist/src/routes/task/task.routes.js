import { Role } from "@prisma/client";
import { TaskService } from "./task.service.js";
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, assignTaskSchema, getTasksQuerySchema, taskParamsSchema, } from "./task.schema.js";
export default async function taskRoutes(fastify) {
    const taskService = new TaskService(fastify.prisma);
    // Create a new task (Admin only)
    fastify.post("/", {
        preHandler: [
            fastify.authenticate,
            fastify.authorize([Role.ADMIN]),
        ],
        schema: {
            body: createTaskSchema,
        },
    }, async (request, reply) => {
        try {
            const body = request.body;
            const task = await taskService.createTask(body);
            reply.code(201).send(task);
        }
        catch (error) {
            if (error.message === "USER_NOT_FOUND") {
                return reply.code(400).send({ error: "User not found" });
            }
            throw error;
        }
    });
    // Get all tasks with filters (Admin sees all, users see only their own)
    fastify.get("/", {
        preHandler: [fastify.authenticate],
        schema: {
            querystring: getTasksQuerySchema,
        },
    }, async (request, reply) => {
        const user = request.user;
        const query = request.query;
        // If not admin, force userId to be the current user
        if (user.role !== Role.ADMIN) {
            query.userId = user.id;
        }
        const result = await taskService.getTasks(query);
        reply.send(result);
    });
    // Get my tasks (shortcut for current user's tasks)
    fastify.get("/my", {
        preHandler: [fastify.authenticate],
        schema: {
            querystring: {
                type: "object",
                properties: {
                    status: { type: "string" },
                    page: { type: "integer", minimum: 1, default: 1 },
                    limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
                },
            },
        },
    }, async (request, reply) => {
        const user = request.user;
        const query = request.query;
        const result = await taskService.getMyTasks(user.id, query);
        reply.send(result);
    });
    // Get task by ID
    fastify.get("/:id", {
        preHandler: [fastify.authenticate],
        schema: {
            params: taskParamsSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const task = await taskService.getTaskById(id);
            // Check if user can view this task (admin or assigned user)
            if (user.role !== Role.ADMIN && task.userId !== user.id) {
                return reply.code(403).send({ error: "You can only view your own tasks" });
            }
            reply.send(task);
        }
        catch (error) {
            if (error.message === "TASK_NOT_FOUND") {
                return reply.code(404).send({ error: "Task not found" });
            }
            throw error;
        }
    });
    // Update task details
    fastify.patch("/:id", {
        preHandler: [fastify.authenticate],
        schema: {
            params: taskParamsSchema,
            body: updateTaskSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = request.body;
            const user = request.user;
            const task = await taskService.updateTask(id, body, user.id, user.role);
            reply.send(task);
        }
        catch (error) {
            if (error.message === "TASK_NOT_FOUND") {
                return reply.code(404).send({ error: "Task not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "You can only update your own tasks or admin tasks" });
            }
            throw error;
        }
    });
    // Update task status
    fastify.patch("/:id/status", {
        preHandler: [fastify.authenticate],
        schema: {
            params: taskParamsSchema,
            body: updateTaskStatusSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { status } = request.body;
            const user = request.user;
            const task = await taskService.updateTaskStatus(id, status, user.id, user.role);
            reply.send(task);
        }
        catch (error) {
            if (error.message === "TASK_NOT_FOUND") {
                return reply.code(404).send({ error: "Task not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "You can only update status of your own tasks" });
            }
            throw error;
        }
    });
    // Assign task to user (Admin only)
    fastify.patch("/:id/assign", {
        preHandler: [
            fastify.authenticate,
            fastify.authorize([Role.ADMIN]),
        ],
        schema: {
            params: taskParamsSchema,
            body: assignTaskSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { userId } = request.body;
            const user = request.user;
            const task = await taskService.assignTask(id, userId, user.id, user.role);
            reply.send(task);
        }
        catch (error) {
            if (error.message === "TASK_NOT_FOUND") {
                return reply.code(404).send({ error: "Task not found" });
            }
            if (error.message === "USER_NOT_FOUND") {
                return reply.code(400).send({ error: "User not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "Only admins can assign tasks" });
            }
            throw error;
        }
    });
    // Delete task
    fastify.delete("/:id", {
        preHandler: [fastify.authenticate],
        schema: {
            params: taskParamsSchema,
        },
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = request.user;
            const result = await taskService.deleteTask(id, user.id, user.role);
            reply.send(result);
        }
        catch (error) {
            if (error.message === "TASK_NOT_FOUND") {
                return reply.code(404).send({ error: "Task not found" });
            }
            if (error.message === "UNAUTHORIZED") {
                return reply.code(403).send({ error: "You can only delete your own tasks" });
            }
            throw error;
        }
    });
}
