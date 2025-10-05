import { z } from "zod";
export declare const KeyTypeSchema: z.ZodEnum<["ENCRYPTION", "SIGNING", "NFC_PAIRING", "RFID_PAIRING"]>;
export declare const GenerateKeySchema: z.ZodObject<{
    projectId: z.ZodNumber;
    keyName: z.ZodString;
    keyType: z.ZodEnum<["ENCRYPTION", "SIGNING", "NFC_PAIRING", "RFID_PAIRING"]>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    projectId: number;
    keyName: string;
    keyType: "ENCRYPTION" | "SIGNING" | "NFC_PAIRING" | "RFID_PAIRING";
    expiresAt?: string | undefined;
}, {
    projectId: number;
    keyName: string;
    keyType: "ENCRYPTION" | "SIGNING" | "NFC_PAIRING" | "RFID_PAIRING";
    expiresAt?: string | undefined;
}>;
export declare const KeySchema: z.ZodObject<{
    id: z.ZodNumber;
    projectId: z.ZodNumber;
    keyName: z.ZodString;
    type: z.ZodEnum<["ENCRYPTION", "SIGNING", "NFC_PAIRING", "RFID_PAIRING"]>;
    publicKey: z.ZodString;
    isActive: z.ZodBoolean;
    expiresAt: z.ZodNullable<z.ZodDate>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: "ENCRYPTION" | "SIGNING" | "NFC_PAIRING" | "RFID_PAIRING";
    id: number;
    createdAt: Date;
    updatedAt: Date;
    projectId: number;
    keyName: string;
    expiresAt: Date | null;
    publicKey: string;
    isActive: boolean;
}, {
    type: "ENCRYPTION" | "SIGNING" | "NFC_PAIRING" | "RFID_PAIRING";
    id: number;
    createdAt: Date;
    updatedAt: Date;
    projectId: number;
    keyName: string;
    expiresAt: Date | null;
    publicKey: string;
    isActive: boolean;
}>;
export declare const ListKeysSchema: z.ZodObject<{
    projectId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    projectId: number;
}, {
    projectId: number;
}>;
export declare const RotateKeySchema: z.ZodObject<{
    keyId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    keyId: number;
}, {
    keyId: number;
}>;
export declare const RevokeKeySchema: z.ZodObject<{
    keyId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    keyId: number;
}, {
    keyId: number;
}>;
export declare const GetActiveKeysSchema: z.ZodObject<{
    projectId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    projectId: number;
}, {
    projectId: number;
}>;
export type KeyType = z.infer<typeof KeyTypeSchema>;
export type GenerateKeyInput = z.infer<typeof GenerateKeySchema>;
export type Key = z.infer<typeof KeySchema>;
export type ListKeysInput = z.infer<typeof ListKeysSchema>;
export type RotateKeyInput = z.infer<typeof RotateKeySchema>;
export type RevokeKeyInput = z.infer<typeof RevokeKeySchema>;
export type GetActiveKeysInput = z.infer<typeof GetActiveKeysSchema>;
//# sourceMappingURL=keys.d.ts.map