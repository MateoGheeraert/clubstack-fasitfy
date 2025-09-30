export class TaskService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTask(data) {
        // Verify the user exists
        const user = await this.prisma.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        return this.prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                userId: data.userId,
            },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    async getTasks(filters) {
        const { status, userId, page = 1, limit = 10 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (userId)
            where.userId = userId;
        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, email: true, role: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.task.count({ where }),
        ]);
        return {
            tasks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getTaskById(id) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
        if (!task) {
            throw new Error("TASK_NOT_FOUND");
        }
        return task;
    }
    async updateTask(id, data, requesterId, requesterRole) {
        const task = await this.getTaskById(id);
        // Only admin or the assigned user can update task details
        if (requesterRole !== "ADMIN" && task.userId !== requesterId) {
            throw new Error("UNAUTHORIZED");
        }
        return this.prisma.task.update({
            where: { id },
            data,
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    async updateTaskStatus(id, status, requesterId, requesterRole) {
        const task = await this.getTaskById(id);
        // Only admin or the assigned user can change status
        if (requesterRole !== "ADMIN" && task.userId !== requesterId) {
            throw new Error("UNAUTHORIZED");
        }
        return this.prisma.task.update({
            where: { id },
            data: { status },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    async assignTask(id, userId, requesterId, requesterRole) {
        // Only admins can assign tasks
        if (requesterRole !== "ADMIN") {
            throw new Error("UNAUTHORIZED");
        }
        // Verify the new user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        const task = await this.getTaskById(id);
        return this.prisma.task.update({
            where: { id },
            data: { userId },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    async deleteTask(id, requesterId, requesterRole) {
        const task = await this.getTaskById(id);
        // Only admin or the assigned user can delete tasks
        if (requesterRole !== "ADMIN" && task.userId !== requesterId) {
            throw new Error("UNAUTHORIZED");
        }
        await this.prisma.task.delete({
            where: { id },
        });
        return { message: "Task deleted successfully" };
    }
    async getMyTasks(userId, filters) {
        return this.getTasks({ ...filters, userId });
    }
}
