import { z } from "zod";
export declare const CreateProjectSchema: z.ZodObject<{
    token: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    token: string;
    description?: string | undefined;
}, {
    name: string;
    token: string;
    description?: string | undefined;
}>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["DRAFT", "ACTIVE", "ARCHIVED"]>;
    userId: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    user: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string | null;
        lastName: string | null;
    }, {
        email: string;
        firstName: string | null;
        lastName: string | null;
    }>>;
    _count: z.ZodOptional<z.ZodObject<{
        codes: z.ZodNumber;
        keys: z.ZodNumber;
        assets: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        keys: number;
        codes: number;
        assets: number;
    }, {
        keys: number;
        codes: number;
        assets: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    id: number;
    name: string;
    description: string | null;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        email: string;
        firstName: string | null;
        lastName: string | null;
    } | undefined;
    _count?: {
        keys: number;
        codes: number;
        assets: number;
    } | undefined;
}, {
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    id: number;
    name: string;
    description: string | null;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
    user?: {
        email: string;
        firstName: string | null;
        lastName: string | null;
    } | undefined;
    _count?: {
        keys: number;
        codes: number;
        assets: number;
    } | undefined;
}>;
export declare const GetProjectsSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type GetProjectsInput = z.infer<typeof GetProjectsSchema>;
//# sourceMappingURL=project.d.ts.map