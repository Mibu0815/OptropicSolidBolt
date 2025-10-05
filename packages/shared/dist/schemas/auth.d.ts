import { z } from "zod";
export declare const AuthLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const AuthTokenResponseSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodNumber;
        email: z.ZodString;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        role: z.ZodEnum<["ADMIN", "USER", "VIEWER"]>;
        archetype: z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            name: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: number;
            name: string;
            description: string | null;
        }, {
            id: number;
            name: string;
            description: string | null;
        }>>;
        tenantRoleMapping: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            tenantId: z.ZodNumber;
            archetype: z.ZodObject<{
                id: z.ZodNumber;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: number;
                name: string;
            }, {
                id: number;
                name: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: number;
            archetype: {
                id: number;
                name: string;
            };
            tenantId: number;
        }, {
            id: number;
            archetype: {
                id: number;
                name: string;
            };
            tenantId: number;
        }>>>;
        tenantId: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        id: number;
        firstName: string | null;
        lastName: string | null;
        role: "ADMIN" | "USER" | "VIEWER";
        archetype: {
            id: number;
            name: string;
            description: string | null;
        } | null;
        tenantId: number | null;
        tenantRoleMapping?: {
            id: number;
            archetype: {
                id: number;
                name: string;
            };
            tenantId: number;
        } | null | undefined;
    }, {
        email: string;
        id: number;
        firstName: string | null;
        lastName: string | null;
        role: "ADMIN" | "USER" | "VIEWER";
        archetype: {
            id: number;
            name: string;
            description: string | null;
        } | null;
        tenantId: number | null;
        tenantRoleMapping?: {
            id: number;
            archetype: {
                id: number;
                name: string;
            };
            tenantId: number;
        } | null | undefined;
    }>;
    token: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    user: {
        email: string;
        id: number;
        firstName: string | null;
        lastName: string | null;
        role: "ADMIN" | "USER" | "VIEWER";
        archetype: {
            id: number;
            name: string;
            description: string | null;
        } | null;
        tenantId: number | null;
        tenantRoleMapping?: {
            id: number;
            archetype: {
                id: number;
                name: string;
            };
            tenantId: number;
        } | null | undefined;
    };
    token: string;
    refreshToken: string;
    expiresIn: number;
}, {
    user: {
        email: string;
        id: number;
        firstName: string | null;
        lastName: string | null;
        role: "ADMIN" | "USER" | "VIEWER";
        archetype: {
            id: number;
            name: string;
            description: string | null;
        } | null;
        tenantId: number | null;
        tenantRoleMapping?: {
            id: number;
            archetype: {
                id: number;
                name: string;
            };
            tenantId: number;
        } | null | undefined;
    };
    token: string;
    refreshToken: string;
    expiresIn: number;
}>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const RefreshTokenResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    expiresIn: number;
    accessToken: string;
}, {
    refreshToken: string;
    expiresIn: number;
    accessToken: string;
}>;
export declare const CurrentUserSchema: z.ZodObject<{
    id: z.ZodNumber;
    email: z.ZodString;
    firstName: z.ZodNullable<z.ZodString>;
    lastName: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<["ADMIN", "USER", "VIEWER"]>;
    tenantId: z.ZodNullable<z.ZodNumber>;
    archetype: z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        description: string | null;
    }, {
        id: number;
        name: string;
        description: string | null;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    id: number;
    firstName: string | null;
    lastName: string | null;
    role: "ADMIN" | "USER" | "VIEWER";
    archetype: {
        id: number;
        name: string;
        description: string | null;
    } | null;
    tenantId: number | null;
}, {
    email: string;
    id: number;
    firstName: string | null;
    lastName: string | null;
    role: "ADMIN" | "USER" | "VIEWER";
    archetype: {
        id: number;
        name: string;
        description: string | null;
    } | null;
    tenantId: number | null;
}>;
export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;
export type CurrentUser = z.infer<typeof CurrentUserSchema>;
//# sourceMappingURL=auth.d.ts.map