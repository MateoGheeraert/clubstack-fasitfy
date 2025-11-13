import { FastifyInstance } from "fastify";
import { Role } from "@prisma/client";
import { ActivityService } from "./service";
import {
  createActivitySchema,
  activityResponseSchema,
  errorResponseSchema,
} from "./schema";

export default async function postRoute(fastify: FastifyInstance) {
  const activityService = new ActivityService(fastify.prisma);

  // POST /activities - Create a new activity
  fastify.post(
    "/activities",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ["activities"],
        security: [{ bearerAuth: [] }],
        summary: "Create a new activity",
        body: createActivitySchema,
        response: {
          201: activityResponseSchema,
          400: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const body = request.body as {
          organizationId: string;
          title: string;
          starts_at: string;
          ends_at: string;
          location?: string;
          description?: string;
          attendees?: string[];
        };
        const user = request.user as { id: string; role: Role };

        const activityData = {
          ...body,
          starts_at: new Date(body.starts_at),
          ends_at: new Date(body.ends_at),
        };

        const activity = await activityService.createActivity(
          activityData,
          user.id,
          user.role
        );
        reply.code(201).send(activity);
      } catch (error: any) {
        if (error.message === "ORGANIZATION_NOT_FOUND") {
          return reply.code(404).send({ error: "Organization not found" });
        }
        if (error.message === "INVALID_DATE_RANGE") {
          return reply
            .code(400)
            .send({ error: "Start date must be before end date" });
        }
        if (error.message === "UNAUTHORIZED") {
          return reply.code(403).send({ error: "Access denied" });
        }
        throw error;
      }
    }
  );
}
