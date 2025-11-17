import { FastifyInstance } from "fastify";
import { UserService } from "../service";
import { userProfileResponseSchema } from "../schema";

export default async function profileRoute(fastify: FastifyInstance) {
  const userService = new UserService(fastify.prisma);

  // GET /user/profile - Get detailed user profile
  fastify.get(
    "/user/profile",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["user"],
        security: [{ bearerAuth: [] }],
        summary:
          "Get current user detailed profile with organizations and tasks",
        response: { 200: userProfileResponseSchema },
      },
    },
    async (req: any) => {
      return await userService.getProfileWithOrganizations(req.user.id);
    }
  );
}
