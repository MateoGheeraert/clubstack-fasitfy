import { Role } from "@prisma/client";
import { AdminService } from "./admin.service";
import { adminUserListResponse } from "./admin.schema";
const adminRoutes = async (fastify) => {
    const adminService = new AdminService(fastify.prisma);
    fastify.get("/users", {
        preHandler: [fastify.authenticate, fastify.authorize([Role.ADMIN])],
        schema: {
            tags: ["admin"],
            security: [{ bearerAuth: [] }],
            summary: "List all users (ADMIN only)",
            response: adminUserListResponse,
        },
    }, async () => {
        return adminService.listUsers();
    });
};
export default adminRoutes;
