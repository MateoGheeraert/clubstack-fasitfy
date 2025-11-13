import { FastifyInstance } from "fastify";
import { TaskService } from "./service";
import {
  createTaskSchema,
  getTasksQuerySchema,
} from "./schema";

export default async function postRoutes(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // POST /tasks - Create a new task (Admin or Moderator in organization)
  fastify.post(
    "/tasks",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary: "Create a new task (Admin/Moderator in organization)",
        body: createTaskSchema,
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          title: string;
          description?: string;
          userId: string;
          organizationId: string;
        };
        const user = request.user as { id: string };

        // Check if requester is admin/moderator in the organization
        const userOrg = await fastify.prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: body.organizationId,
            },
          },
        });

        if (
          !userOrg ||
          (userOrg.role !== "ADMIN" && userOrg.role !== "MODERATOR")
        ) {
          return reply
            .code(403)
            .send({ error: "Only admins and moderators can create tasks" });
        }

        const task = await taskService.createTask(body);
        reply.code(201).send(task);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "USER_NOT_IN_ORGANIZATION") {
          return reply
            .code(400)
            .send({ error: "User is not a member of this organization" });
        }
        throw error;
      }
    }
  );
}
