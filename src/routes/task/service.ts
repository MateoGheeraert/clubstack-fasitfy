import { PrismaClient, Role } from "@prisma/client";
import { CreateTaskInput, UpdateTaskInput, TaskFilters } from "./types";

export class TaskService {
  constructor(private prisma: PrismaClient) {}

  // Helper function to get user's role in an organization
  private async getUserRoleInOrganization(
    userId: string,
    organizationId: string
  ): Promise<Role | null> {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
    return userOrg?.role || null;
  }

  // Helper function to check if user is admin or moderator in organization
  private async isAdminOrModeratorInOrg(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const role = await this.getUserRoleInOrganization(userId, organizationId);
    return role === "ADMIN" || role === "MODERATOR";
  }

  async createTask(data: CreateTaskInput) {
    // Verify the organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: data.organizationId },
    });

    if (!organization) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

    // Verify the user exists and is a member of the organization
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
      data,
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

  async getTasks(filters: TaskFilters, requesterId: string) {
    const { status, userId, organizationId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (organizationId) where.organizationId = organizationId;

    // If no organizationId filter, only show tasks from organizations the user belongs to
    if (!organizationId) {
      const userOrgs = await this.prisma.userOrganization.findMany({
        where: { userId: requesterId },
        select: { organizationId: true },
      });
      where.organizationId = { in: userOrgs.map((uo) => uo.organizationId) };
    }

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

  async getTaskById(id: string, requesterId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Check if requester has access to this task's organization
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: requesterId,
          organizationId: task.organizationId,
        },
      },
    });

    if (!userOrg) {
      throw new Error("UNAUTHORIZED");
    }

    return task;
  }

  async updateTask(id: string, data: UpdateTaskInput, requesterId: string) {
    const task = await this.getTaskById(id, requesterId);

    // Check if user is admin/moderator in the organization OR is the assigned user
    const isAdminOrMod = await this.isAdminOrModeratorInOrg(
      requesterId,
      task.organizationId
    );

    if (!isAdminOrMod && task.userId !== requesterId) {
      throw new Error("UNAUTHORIZED");
    }

    return this.prisma.task.update({
      where: { id },
      data,
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

  async updateTaskStatus(id: string, status: string, requesterId: string) {
    const task = await this.getTaskById(id, requesterId);

    // Check if user is admin/moderator in the organization OR is the assigned user
    const isAdminOrMod = await this.isAdminOrModeratorInOrg(
      requesterId,
      task.organizationId
    );

    if (!isAdminOrMod && task.userId !== requesterId) {
      throw new Error("UNAUTHORIZED");
    }

    return this.prisma.task.update({
      where: { id },
      data: { status },
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

  async assignTask(id: string, userId: string, requesterId: string) {
    const task = await this.getTaskById(id, requesterId);

    // Only admins/moderators in the organization can assign tasks
    const isAdminOrMod = await this.isAdminOrModeratorInOrg(
      requesterId,
      task.organizationId
    );

    if (!isAdminOrMod) {
      throw new Error("UNAUTHORIZED");
    }

    // Verify the new user exists and is a member of the organization
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: task.organizationId,
        },
      },
    });

    if (!userOrg) {
      throw new Error("USER_NOT_IN_ORGANIZATION");
    }

    return this.prisma.task.update({
      where: { id },
      data: { userId },
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

  async deleteTask(id: string, requesterId: string) {
    const task = await this.getTaskById(id, requesterId);

    // Only admins/moderators in the organization can delete tasks
    const isAdminOrMod = await this.isAdminOrModeratorInOrg(
      requesterId,
      task.organizationId
    );

    if (!isAdminOrMod && task.userId !== requesterId) {
      throw new Error("UNAUTHORIZED");
    }

    await this.prisma.task.delete({
      where: { id },
    });

    return { message: "Task deleted successfully" };
  }

  async getMyTasks(
    userId: string,
    filters: Omit<TaskFilters, "userId">
  ) {
    return this.getTasks({ ...filters, userId }, userId);
  }

  // Admin methods
  async getAllTasks(filters: TaskFilters) {
    const { status, userId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

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

  async reassignTask(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    // Verify the new user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Verify the user is in the task's organization
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: userId,
          organizationId: task.organizationId,
        },
      },
    });

    if (!userOrg) {
      throw new Error("USER_NOT_IN_ORGANIZATION");
    }

    return this.prisma.task.update({
      where: { id },
      data: { userId },
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

  async deleteAnyTask(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    await this.prisma.task.delete({
      where: { id },
    });

    return { message: "Task deleted successfully" };
  }

  async getTaskStatistics() {
    const [total, pending, completed] = await Promise.all([
      this.prisma.task.count(),
      this.prisma.task.count({ where: { status: "pending" } }),
      this.prisma.task.count({ where: { status: "completed" } }),
    ]);

    return {
      total,
      pending,
      completed,
      other: total - pending - completed,
    };
  }
}
