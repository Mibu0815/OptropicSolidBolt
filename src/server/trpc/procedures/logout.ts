import { z } from "zod";
import { protectedProcedure } from "~/server/trpc/main";
import {
  revokeRefreshToken,
  revokeAllUserTokens,
} from "~/server/services/refreshTokenService";

export const logout = protectedProcedure
  .input(
    z.object({
      refreshToken: z.string().optional(),
      allDevices: z.boolean().default(false),
    })
  )
  .mutation(async ({ ctx, input }) => {
    if (input.allDevices) {
      const revokedCount = await revokeAllUserTokens(ctx.user.id);
      return {
        success: true,
        message: `Logged out from ${revokedCount} device(s)`,
      };
    }

    if (input.refreshToken) {
      const revoked = await revokeRefreshToken(
        input.refreshToken,
        ctx.user.id
      );
      return {
        success: revoked,
        message: revoked
          ? "Logged out successfully"
          : "Refresh token not found or already revoked",
      };
    }

    return {
      success: true,
      message: "Access token will expire automatically",
    };
  });
