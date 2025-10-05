export const API_VERSION = "3.0.0";
export const FRONTEND_MIN_VERSION = "3.0.0";
export const BACKEND_MIN_VERSION = "3.0.0";
export const VERSION_MISMATCH_ERROR = "Frontend and backend versions are incompatible";
export function validateVersionSync(frontendVersion, backendVersion) {
    const parseFrontend = parseVersion(frontendVersion);
    const parseBackend = parseVersion(backendVersion);
    const parseMin = parseVersion(FRONTEND_MIN_VERSION);
    if (!parseFrontend || !parseBackend || !parseMin) {
        return {
            isValid: false,
            message: "Invalid version format",
        };
    }
    const frontendValid = parseFrontend.major >= parseMin.major &&
        (parseFrontend.major > parseMin.major || parseFrontend.minor >= parseMin.minor);
    const backendValid = parseBackend.major >= parseMin.major &&
        (parseBackend.major > parseMin.major || parseBackend.minor >= parseMin.minor);
    if (!frontendValid || !backendValid) {
        return {
            isValid: false,
            message: `Version mismatch: Frontend ${frontendVersion}, Backend ${backendVersion}, Required ${FRONTEND_MIN_VERSION}+`,
        };
    }
    return { isValid: true };
}
function parseVersion(version) {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match)
        return null;
    return {
        major: parseInt(match[1] ?? "0", 10),
        minor: parseInt(match[2] ?? "0", 10),
        patch: parseInt(match[3] ?? "0", 10),
    };
}
