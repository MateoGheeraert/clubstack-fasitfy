import { FastifyInstance } from "fastify";
import { TaskService } from "../../service";
import { tasksResponseSchema, errorResponseSchema } from "../../schema";

export default async function getOrganizationIdRoute(fastify: FastifyInstance) {
  const taskService = new TaskService(fastify.prisma);

  // GET /tasks/organization/:organizationId - Get all tasks for an organization
  fastify.get(
    "/organization/:organizationId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        summary:
          "Get all tasks for an organization (optionally filtered by user)",
        params: {
          type: "object",
          required: ["organizationId"],
          properties: {
            organizationId: { type: "string" },
          },
        },
        querystring: {
          type: "object",
          properties: {
            userId: { type: "string" },
            status: { type: "string" },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        },
        response: {
          200: tasksResponseSchema,
          403: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { organizationId } = request.params as { organizationId: string };
        const user = request.user as { id: string };
        const filters = request.query as {
          userId?: string;
          status?: string;
          page?: number;
          limit?: number;
        };

        // Check if user is a member of this organization
        const userOrg = await fastify.prisma.userOrganization.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: organizationId,
            },
          },
        });

        if (!userOrg) {
          return reply.code(403).send({
            error: "You don't have access to this organization",
          });
        }

        // Get tasks for this organization with optional user filter
        const result = await taskService.getTasks(
          {
            organizationId,
            userId: filters.userId,
            status: filters.status,
            page: filters.page,
            limit: filters.limit,
          },
          user.id
        );

        reply.send(result);
      } catch (error: any) {
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({
            error: "You don't have access to this organization",
          });
        }
        throw error;
      }
    }
  );
}
