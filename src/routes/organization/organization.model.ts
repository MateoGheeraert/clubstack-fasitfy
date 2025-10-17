import {
  PrismaClient,
  Organization,
  User,
  Account,
  Activity,
} from "@prisma/client";

export type OrganizationWithUsers = Organization & {
  users: {
    id: string;
    user: Pick<User, "id" | "email" | "role">;
    createdAt: Date;
  }[];
};

export type OrganizationWithDetails = Organization & {
  users: {
    id: string;
    user: Pick<User, "id" | "email" | "role">;
    createdAt: Date;
  }[];
  Account: Account | null;
  Activity: Activity[];
  _count: {
    users: number;
    Activity: number;
  };
};

export type CreateOrganizationInput = {
  name: string;
};

export type UpdateOrganizationInput = {
  name?: string;
};

export type AddUserToOrganizationInput = {
  userId: string;
};

export type OrganizationFilters = {
  name?: string;
  page?: number;
  limit?: number;
};

export type OrganizationsResponse = {
  organizations: OrganizationWithUsers[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export class OrganizationModel {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, email: true, role: true },
            },
          },
        },
        Account: true,
        Activity: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            users: true,
            Activity: true,
          },
        },
      },
    });
  }

  async findByName(name: string) {
    return this.prisma.organization.findUnique({
      where: { name },
    });
  }

  async create(data: CreateOrganizationInput) {
    return this.prisma.organization.create({
      data,
      include: {
        users: {
          include: {
            user: {
              select: { id: true, email: true, role: true },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateOrganizationInput) {
    return this.prisma.organization.update({
      where: { id },
      data,
      include: {
        users: {
          include: {
            user: {
              select: { id: true, email: true, role: true },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async findMany(filters: OrganizationFilters) {
    const { name, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    return Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            include: {
              user: {
                select: { id: true, email: true, role: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.organization.count({ where }),
    ]);
  }

  async addUser(organizationId: string, userId: string) {
    return this.prisma.userOrganization.create({
      data: {
        organizationId,
        userId,
      },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        organization: true,
      },
    });
  }

  async removeUser(organizationId: string, userId: string) {
    return this.prisma.userOrganization.deleteMany({
      where: {
        organizationId,
        userId,
      },
    });
  }

  async getUserOrganizations(userId: string) {
    const userOrganizations = await this.prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });
    return userOrganizations.map((uo) => uo.organization);
  }
}
