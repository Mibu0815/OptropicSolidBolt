export declare const API_VERSION = "3.0.0";
export declare const FRONTEND_MIN_VERSION = "3.0.0";
export declare const BACKEND_MIN_VERSION = "3.0.0";
export declare const VERSION_MISMATCH_ERROR = "Frontend and backend versions are incompatible";
export declare function validateVersionSync(frontendVersion: string, backendVersion: string): {
    isValid: boolean;
    message?: string;
};
//# sourceMappingURL=versions.d.ts.map