import { PrismaClient } from "@prisma/client";

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new Error("User not found");
    return user;
  }

  async getProfileWithOrganizations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                createdAt: true,
              },
            },
          },
        },
        Task: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) throw new Error("User not found");

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizations: user.organizations.map((uo) => ({
        id: uo.id,
        role: uo.role,
        joinedAt: uo.createdAt,
        organization: uo.organization,
      })),
      recentTasks: user.Task,
      stats: {
        totalOrganizations: user.organizations.length,
        totalTasks: user.Task.length,
      },
    };
  }

  async getUserStats(userId: string) {
    const [taskCount, organizationCount] = await Promise.all([
      this.prisma.task.count({ where: { userId } }),
      this.prisma.userOrganization.count({ where: { userId } }),
    ]);

    return {
      totalTasks: taskCount,
      totalOrganizations: organizationCount,
    };
  }

  async listAllUsers() {
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
}
