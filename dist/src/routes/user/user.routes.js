import { UserService } from "./user.service";
import { userResponseSchema } from "./user.schema";
const userRoutes = async (fastify) => {
    const userService = new UserService(fastify.prisma);
    fastify.get("/me", {
        preHandler: [fastify.authenticate],
        schema: {
            tags: ["user"],
            security: [{ bearerAuth: [] }],
            response: { 200: userResponseSchema },
        },
    }, async (req) => {
        return await userService.getProfile(req.user.id);
    });
};
export default userRoutes;
