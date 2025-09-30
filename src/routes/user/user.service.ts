import { UserModel } from "./user.model";
import { PrismaClient } from "@prisma/client";

export class UserService {
  private userModel: UserModel;

  constructor(private prisma: PrismaClient) {
    this.userModel = new UserModel(prisma);
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new Error("User not found");
    return { id: user.id, email: user.email, role: user.role };
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
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizations: user.organizations.map((uo) => ({
        id: uo.id,
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
}
