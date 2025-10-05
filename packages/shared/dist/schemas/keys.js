import { z } from "zod";
export const KeyTypeSchema = z.enum(["ENCRYPTION", "SIGNING", "NFC_PAIRING", "RFID_PAIRING"]);
export const GenerateKeySchema = z.object({
    projectId: z.number(),
    keyName: z.string().min(1, "Key name is required"),
    keyType: KeyTypeSchema,
    expiresAt: z.string().optional(),
});
export const KeySchema = z.object({
    id: z.number(),
    projectId: z.number(),
    keyName: z.string(),
    type: KeyTypeSchema,
    publicKey: z.string(),
    isActive: z.boolean(),
    expiresAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const ListKeysSchema = z.object({
    projectId: z.number(),
});
export const RotateKeySchema = z.object({
    keyId: z.number(),
});
export const RevokeKeySchema = z.object({
    keyId: z.number(),
});
export const GetActiveKeysSchema = z.object({
    projectId: z.number(),
});
