import { PrismaClient, Role } from "@prisma/client";
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters,
} from "./types";

export class OrganizationService {
  constructor(private prisma: PrismaClient) {}

  // Helper method to get user's role in an organization
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
      select: {
        role: true,
      },
    });

    return userOrg?.role || null;
  }

  async createOrganization(data: CreateOrganizationInput) {
    // Check if organization with same name already exists
    const existingOrg = await this.prisma.organization.findFirst({
      where: { name: data.name },
    });
    if (existingOrg) {
      throw new Error("ORGANIZATION_ALREADY_EXISTS");
    }

    return this.prisma.organization.create({
      data: {
        name: data.name,
      },
    });
  }

  async getOrganizations(filters: OrganizationFilters) {
    const { name, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = name
      ? {
          name: {
            contains: name,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganizationById(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!organization) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }
    return organization;
  }

  async updateOrganization(
    id: string,
    data: UpdateOrganizationInput,
    requesterId: string
  ) {
    // Check if user has admin role in this organization
    const userRole = await this.getUserRoleInOrganization(requesterId, id);
    if (userRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    // Check if organization exists
    await this.getOrganizationById(id);

    // If updating name, check if new name is already taken
    if (data.name) {
      const existingOrg = await this.prisma.organization.findFirst({
        where: { name: data.name },
      });
      if (existingOrg && existingOrg.id !== id) {
        throw new Error("ORGANIZATION_NAME_TAKEN");
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async deleteOrganization(id: string, requesterId: string) {
    // Check if user has admin role in this organization
    const userRole = await this.getUserRoleInOrganization(requesterId, id);
    if (userRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    // Check if organization exists
    await this.getOrganizationById(id);

    await this.prisma.organization.delete({
      where: { id },
    });
    return { message: "Organization deleted successfully" };
  }

  async addUserToOrganization(
    organizationId: string,
    userId: string,
    requesterId: string
  ) {
    // Check if requester has admin role in this organization
    const requesterRole = await this.getUserRoleInOrganization(
      requesterId,
      organizationId
    );
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    // Check if organization exists
    await this.getOrganizationById(organizationId);

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Check if user is already in organization
    const existingRelation = await this.prisma.userOrganization.findFirst({
      where: {
        organizationId,
        userId,
      },
    });
    if (existingRelation) {
      throw new Error("USER_ALREADY_IN_ORGANIZATION");
    }

    return this.prisma.userOrganization.create({
      data: {
        organizationId,
        userId,
        role: "USER",
      },
    });
  }

  async removeUserFromOrganization(
    organizationId: string,
    userId: string,
    requesterId: string
  ) {
    // Check if requester has admin role in this organization
    const requesterRole = await this.getUserRoleInOrganization(
      requesterId,
      organizationId
    );
    if (requesterRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    // Check if organization exists
    await this.getOrganizationById(organizationId);

    // Check if user exists in organization
    const existingRelation = await this.prisma.userOrganization.findFirst({
      where: {
        organizationId,
        userId,
      },
    });
    if (!existingRelation) {
      throw new Error("USER_NOT_IN_ORGANIZATION");
    }

    await this.prisma.userOrganization.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
    return { message: "User removed from organization successfully" };
  }

  async getUserOrganizations(userId: string, requesterId: string) {
    // Users can only see their own organizations unless they request someone else's
    if (userId !== requesterId) {
      throw new Error("UNAUTHORIZED");
    }

    return this.prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });
  }

  async getMyOrganizations(userId: string) {
    return this.prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: true,
      },
    });
  }
}
