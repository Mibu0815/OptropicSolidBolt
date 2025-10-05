import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { baseProcedure } from "~/server/trpc/main";
import { createTokenPair } from "~/server/services/refreshTokenService";

export const login = baseProcedure
  .input(z.object({ 
    email: z.string().email(),
    password: z.string().min(1),
  }))
  .mutation(async ({ input }) => {
    const user = await db.user.findUnique({
      where: { email: input.email },
      include: {
        archetype: true,
        roleMappings: {
          where: { isEnabled: true },
          include: {
            archetype: true
          },
          take: 1 // Get the primary role mapping for this user
        }
      }
    });

    if (!user || !user.isActive) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new TRPCError({
        code: "UNAUTHORIZED", 
        message: "Invalid credentials",
      });
    }

    const tokens = await createTokenPair(user.id);

    // Get the primary tenant role mapping (user's own tenant or first enabled mapping)
    const primaryRoleMapping = user.roleMappings.find(mapping => mapping.tenantId === user.id) || user.roleMappings[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        archetype: user.archetype,
        tenantRoleMapping: primaryRoleMapping,
        tenantId: user.tenantId,
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  });
