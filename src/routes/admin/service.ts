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
}
