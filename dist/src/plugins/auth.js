import fp from "fastify-plugin";
export default fp(async (fastify) => {
    fastify.decorate("authenticate", async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
    fastify.decorate("authorize", (roles) => {
        return async (request, reply) => {
            const user = request.user;
            if (!user || !roles.includes(user.role)) {
                return reply.forbidden("Insufficient role");
            }
        };
    });
});
