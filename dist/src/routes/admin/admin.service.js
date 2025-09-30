export class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listUsers() {
        return this.prisma.user.findMany({
            select: { id: true, email: true, role: true },
        });
    }
    // Admin-specific task management methods
    async getAllTasks(filters) {
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
    async createTaskForUser(data) {
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
    async reassignTask(taskId, newUserId) {
        // Verify the new user exists
        const user = await this.prisma.user.findUnique({
            where: { id: newUserId },
        });
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }
        // Verify the task exists
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new Error("TASK_NOT_FOUND");
        }
        return this.prisma.task.update({
            where: { id: taskId },
            data: { userId: newUserId },
            include: {
                user: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }
    async deleteAnyTask(taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
        });
        if (!task) {
            throw new Error("TASK_NOT_FOUND");
        }
        await this.prisma.task.delete({
            where: { id: taskId },
        });
        return { message: "Task deleted successfully" };
    }
    async getTaskStatistics() {
        const [totalTasks, pendingTasks, inProgressTasks, completedTasks, userTaskCounts,] = await Promise.all([
            this.prisma.task.count(),
            this.prisma.task.count({ where: { status: "pending" } }),
            this.prisma.task.count({ where: { status: "in_progress" } }),
            this.prisma.task.count({ where: { status: "completed" } }),
            this.prisma.task.groupBy({
                by: ["userId"],
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: "desc",
                    },
                },
                take: 5,
            }),
        ]);
        // Get user details for the top task assignees
        const topAssignees = await Promise.all(userTaskCounts.map(async (item) => {
            const user = await this.prisma.user.findUnique({
                where: { id: item.userId },
                select: { id: true, email: true, role: true },
            });
            return {
                user,
                taskCount: item._count.id,
            };
        }));
        return {
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            topAssignees,
        };
    }
}
