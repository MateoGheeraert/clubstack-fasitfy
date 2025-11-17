import { FastifyInstance } from "fastify";
import { UserService } from "../service";

export default async function allUsersRoute(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);

  // GET /user/all - List all users (admin endpoint)
  fastify.get(
    "/user/all",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["user"],
        security: [{ bearerAuth: [] }],
        summary: "List all users (requires admin privileges)",
      },
    },
    async () => {
      return userService.listAllUsers();
    }
  );
}
