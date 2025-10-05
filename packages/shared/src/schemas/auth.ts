import { z } from "zod";

export const AuthLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const AuthTokenResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    role: z.enum(["ADMIN", "USER", "VIEWER"]),
    archetype: z
      .object({
        id: z.number(),
        name: z.string(),
        description: z.string().nullable(),
      })
      .nullable(),
    tenantRoleMapping: z
      .object({
        id: z.number(),
        tenantId: z.number(),
        archetype: z.object({
          id: z.number(),
          name: z.string(),
        }),
      })
      .nullable()
      .optional(),
    tenantId: z.number().nullable(),
  }),
  token: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const CurrentUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.enum(["ADMIN", "USER", "VIEWER"]),
  tenantId: z.number().nullable(),
  archetype: z
    .object({
      id: z.number(),
      name: z.string(),
      description: z.string().nullable(),
    })
    .nullable(),
});

export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type CurrentUser = z.infer<typeof CurrentUserSchema>;
