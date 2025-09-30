import { Task, User } from "@prisma/client";

export type TaskWithUser = Task & {
  user: Pick<User, "id" | "email" | "role">;
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  userId: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
};

export type TaskFilters = {
  status?: string;
  userId?: string;
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
