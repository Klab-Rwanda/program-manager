import { ApiError } from "../../utils/ApiError.js";

export const checkRole = (roles) => {
    return (req, res, next) => {
        console.log("=== ROLE MIDDLEWARE DEBUG ===");
        console.log("Allowed roles:", roles);
        console.log("User:", req.user);
        console.log("User role:", req.user?.role);
        console.log("User role type:", typeof req.user?.role);
        console.log("Roles includes check:", roles.includes(req.user?.role));
        console.log("=============================");
        
        if (!req.user || !roles.includes(req.user.role)) {
            console.log("Role check failed - throwing 403 error");
            throw new ApiError(403, "Forbidden: You do not have permission to perform this action.");
        }
        console.log("Role check passed - proceeding");
        next();
    };
};