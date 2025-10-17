import { PrismaClient, Role } from "@prisma/client";
import {
  OrganizationModel,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters,
} from "./organization.model";

export class OrganizationService {
  private organizationModel: OrganizationModel;

  constructor(private prisma: PrismaClient) {
    this.organizationModel = new OrganizationModel(prisma);
  }

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
    const existingOrg = await this.organizationModel.findByName(data.name);
    if (existingOrg) {
      throw new Error("ORGANIZATION_ALREADY_EXISTS");
    }

    return this.organizationModel.create(data);
  }

  async getOrganizations(filters: OrganizationFilters) {
    const [organizations, total] = await this.organizationModel.findMany(
      filters
    );

    return {
      organizations,
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },
    };
  }

  async getOrganizationById(id: string) {
    const organization = await this.organizationModel.findById(id);
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
      const existingOrg = await this.organizationModel.findByName(data.name);
      if (existingOrg && existingOrg.id !== id) {
        throw new Error("ORGANIZATION_NAME_TAKEN");
      }
    }

    return this.organizationModel.update(id, data);
  }

  async deleteOrganization(id: string, requesterId: string) {
    // Check if user has admin role in this organization
    const userRole = await this.getUserRoleInOrganization(requesterId, id);
    if (userRole !== "ADMIN") {
      throw new Error("UNAUTHORIZED");
    }

    // Check if organization exists
    await this.getOrganizationById(id);

    await this.organizationModel.delete(id);
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

    return this.organizationModel.addUser(organizationId, userId);
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

    await this.organizationModel.removeUser(organizationId, userId);
    return { message: "User removed from organization successfully" };
  }

  async getUserOrganizations(userId: string, requesterId: string) {
    // Users can only see their own organizations unless they request someone else's
    // In that case, we should check if the requester is an admin in at least one organization
    if (userId !== requesterId) {
      // For now, we'll just deny access. You could implement a more sophisticated check
      throw new Error("UNAUTHORIZED");
    }

    return this.organizationModel.getUserOrganizations(userId);
  }

  async getMyOrganizations(userId: string) {
    return this.organizationModel.getUserOrganizations(userId);
  }
}
