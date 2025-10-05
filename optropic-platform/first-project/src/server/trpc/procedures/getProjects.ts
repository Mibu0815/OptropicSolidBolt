import { z } from "zod";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { db } from "~/server/db";
import { env } from "~/server/env";
import { baseProcedure } from "~/server/trpc/main";

export const getProjects = baseProcedure
  .input(z.object({ 
    token: z.string(),
  }))
  .query(async ({ input }) => {
    try {
      const verified = jwt.verify(input.token, env.JWT_SECRET);
      const parsed = z.object({ userId: z.number() }).parse(verified);
      
      const user = await db.user.findUnique({
        where: { id: parsed.userId },
        include: {
          archetype: true
        }
      });

      if (!user || !user.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found or inactive",
        });
      }

      // Admin can see all projects, others see only their own
      // Check both old role system and new archetype system for backward compatibility
      const isAdmin = user.role === "ADMIN" || user.archetype?.code === "ADMIN";
      const whereClause = isAdmin ? {} : { userId: user.id };

      const projects = await db.project.findMany({
        where: whereClause,
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
        orderBy: {
          createdAt: "desc",
        },
      });

      return projects;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid token",
      });
    }
  });
