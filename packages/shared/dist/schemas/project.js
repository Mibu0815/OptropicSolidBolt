import { z } from "zod";
export const CreateProjectSchema = z.object({
    token: z.string(),
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
});
export const ProjectSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    userId: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    user: z
        .object({
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        email: z.string().email(),
    })
        .optional(),
    _count: z
        .object({
        codes: z.number(),
        keys: z.number(),
        assets: z.number(),
    })
        .optional(),
});
export const GetProjectsSchema = z.object({
    token: z.string(),
});
