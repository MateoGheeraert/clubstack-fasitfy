import { FastifyPluginAsync } from "fastify";
import { AuthService } from "./auth.service";
import {
  authBodySchema,
  refreshBodySchema,
  authRegisterResponse,
  authLoginResponse,
  authRefreshResponse,
  authLogoutResponse,
} from "./auth.schema";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma);

  fastify.post(
    "/register",
    {
      schema: {
        tags: ["auth"],
        summary: "Create a user",
        body: authBodySchema,
        response: authRegisterResponse,
      },
    },
    async (req, reply) => {
      const { email, password } = req.body as any;
      try {
        const user = await authService.register(email, password);
        reply.code(201).send(user);
      } catch (e: any) {
        if (e.message === "EMAIL_EXISTS") {
          return reply.code(409).send({ message: "Email already exists" });
        }
        throw e;
      }
    }
  );

  fastify.post(
    "/login",
    {
      schema: {
        tags: ["auth"],
        summary: "Login and get a JWT and refresh token",
        body: authBodySchema,
        response: authLoginResponse,
      },
    },
    async (req, reply) => {
      const { email, password } = req.body as any;
      try {
        const result = await authService.login(
          email,
          password,
          fastify.jwt.sign,
          fastify.generateRefreshToken
        );
        return result;
      } catch (e: any) {
        if (e.message === "INVALID_CREDENTIALS") {
          return reply.code(401).send({ message: "Invalid credentials" });
        }
        throw e;
      }
    }
  );

  fastify.post(
    "/refresh",
    {
      schema: {
        tags: ["auth"],
        summary: "Refresh access token using refresh token",
        body: refreshBodySchema,
        response: authRefreshResponse,
      },
    },
    async (req, reply) => {
      const { refreshToken } = req.body as any;
      try {
        const result = await authService.refreshAccessToken(
          refreshToken,
          fastify.jwt.verify,
          fastify.jwt.sign
        );
        return result;
      } catch (e: any) {
        if (
          e.message === "INVALID_REFRESH_TOKEN" ||
          e.message === "REFRESH_TOKEN_EXPIRED"
        ) {
          return reply
            .code(401)
            .send({ message: "Invalid or expired refresh token" });
        }
        throw e;
      }
    }
  );

  fastify.post(
    "/logout",
    {
      schema: {
        tags: ["auth"],
        summary: "Logout and invalidate refresh token",
        body: refreshBodySchema,
        response: authLogoutResponse,
      },
    },
    async (req, reply) => {
      const { refreshToken } = req.body as any;
      try {
        await authService.logout(refreshToken);
        return { message: "Logged out successfully" };
      } catch (e: any) {
        throw e;
      }
    }
  );
};

export default authRoutes;
