import { Task, User, Organization } from "@prisma/client";

export type TaskWithUser = Task & {
  user: Pick<User, "id" | "email">;
  organization: Pick<Organization, "id" | "name">;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  userId: string;
  organizationId: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
};

export type TaskFilters = {
  status?: string;
  userId?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
};

export type TasksResponse = {
  tasks: TaskWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
