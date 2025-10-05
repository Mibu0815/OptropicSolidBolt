import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const createProject = baseProcedure
  .input(z.object({ 
    token: z.string(),
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    try {
      const verified = jwt.verify(input.token, env.JWT_SECRET);
      const parsed = z.object({ userId: z.number() }).parse(verified);
      
      const user = await db.user.findUnique({
        where: { id: parsed.userId },
      });

      if (!user || !user.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found or inactive",
        });
      }

      const project = await db.project.create({
        data: {
          name: input.name,
          description: input.description,
          userId: user.id,
          status: "DRAFT",
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              codes: true,
              keys: true,
              assets: true,
            },
          },
        },
      });

      // Log the activity
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: "CREATE_PROJECT",
          entityType: "Project",
          entityId: project.id,
          newValues: { name: input.name, description: input.description },
        },
      });

      return project;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
