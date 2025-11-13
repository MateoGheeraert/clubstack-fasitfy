import { FastifyInstance } from "fastify";
import { AdminService } from "./service";

export default async function getRoutes(fastify: FastifyInstance) {
  const adminService = new AdminService(fastify.prisma);

  // GET /admin/users - List all users (requires admin privileges)
  fastify.get(
    "/admin/users",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["admin"],
        security: [{ bearerAuth: [] }],
        summary: "List all users (requires admin privileges)",
      },
    },
    async () => {
      return adminService.listUsers();
    }
  );
}
