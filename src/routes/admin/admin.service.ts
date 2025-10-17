import { PrismaClient } from "@prisma/client";

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  async listUsers() {
    // Return users with their organization roles
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        organizations: {
          select: {
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    return users;
  }

  // Admin-specific task management methods
  async getAllTasks(filters: {
    status?: string;
    userId?: string;
    organizationId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, userId, organizationId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (organizationId) where.organizationId = organizationId;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true },
          },
          organization: {
            select: { id: true, name: true },
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

  async createTaskForUser(data: {
    title: string;
    description?: string;
    userId: string;
    organizationId: string;
  }) {
    // Verify the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Verify the organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: data.organizationId },
    });

    if (!organization) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

    // Verify user is a member of the organization
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: data.userId,
          organizationId: data.organizationId,
        },
      },
    });

    if (!userOrg) {
      throw new Error("USER_NOT_IN_ORGANIZATION");
    }

    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        userId: data.userId,
        organizationId: data.organizationId,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async reassignTask(taskId: string, newUserId: string) {
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
      include: {
        organization: true,
      },
    });

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Verify the new user is a member of the task's organization
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: newUserId,
          organizationId: task.organizationId,
        },
      },
    });

    if (!userOrg) {
      throw new Error("USER_NOT_IN_ORGANIZATION");
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { userId: newUserId },
      include: {
        user: {
          select: { id: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async deleteAnyTask(taskId: string) {
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
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      userTaskCounts,
    ] = await Promise.all([
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
    const topAssignees = await Promise.all(
      userTaskCounts.map(async (item) => {
        const user = await this.prisma.user.findUnique({
          where: { id: item.userId },
          select: { id: true, email: true },
        });
        return {
          user,
          taskCount: item._count.id,
        };
      })
    );

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      topAssignees,
    };
  }
}
