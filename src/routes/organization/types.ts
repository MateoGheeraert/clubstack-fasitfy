export interface CreateOrganizationInput {
  name: string;
}

export interface UpdateOrganizationInput {
  name?: string;
}

export interface OrganizationFilters {
  name?: string;
  page?: number;
  limit?: number;
}
