import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "~/server/trpc/main";
import { refreshAccessToken } from "~/server/services/refreshTokenService";

export const refreshToken = baseProcedure
  .input(
    z.object({
      refreshToken: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const result = await refreshAccessToken(input.refreshToken);

    if (!result) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid or expired refresh token",
      });
    }

    return {
      token: result.accessToken,
      expiresIn: result.expiresIn,
    };
  });
