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
    requesterRole: Role
  ) {
    // Only admins can update organizations
    if (requesterRole !== "ADMIN") {
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

  async deleteOrganization(id: string, requesterRole: Role) {
    // Only admins can delete organizations
    if (requesterRole !== "ADMIN") {
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
    requesterRole: Role
  ) {
    // Only admins can add users to organizations
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
    requesterRole: Role
  ) {
    // Only admins can remove users from organizations
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

  async getUserOrganizations(
    userId: string,
    requesterId: string,
    requesterRole: Role
  ) {
    // Users can only see their own organizations, admins can see any user's organizations
    if (requesterRole !== "ADMIN" && userId !== requesterId) {
      throw new Error("UNAUTHORIZED");
    }

    return this.organizationModel.getUserOrganizations(userId);
  }

  async getMyOrganizations(userId: string) {
    return this.organizationModel.getUserOrganizations(userId);
  }
}
