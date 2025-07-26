import { ApiError } from "../../utils/ApiError.js";

/**
 * Middleware to check if the authenticated user has one of the allowed roles.
 * A user with the 'SuperAdmin' role will bypass all checks and always be granted access.
 * 
 * @param {string[]} roles - An array of role strings that are allowed to access the route (e.g., ['Program Manager', 'Facilitator']).
 */
export const checkRole = (roles) => {
    return (req, res, next) => {
        // First, check if a user is attached to the request at all.
        if (!req.user || !req.user.role) {
            // This is an authentication issue, not authorization.
            // The verifyJWT middleware should have already caught this.
            return next(new ApiError(401, "Unauthorized: No user role found."));
        }

        // --- THIS IS THE CRITICAL FIX ---
        // 1. Immediately grant access if the user is a SuperAdmin.
        if (req.user.role === 'SuperAdmin') {
            console.log("SuperAdmin access granted, bypassing specific role check.");
            return next(); // Grant access and stop further checks.
        }
        // --- END OF FIX ---
        
        // 2. For all other non-SuperAdmin users, perform the original role check.
        
        // Your original debug logs, which are very helpful
        console.log("=== ROLE MIDDLEWARE DEBUG ===");
        console.log("Allowed roles:", roles);
        console.log("User role:", req.user.role);
        console.log("Roles includes check:", roles.includes(req.user.role));
        console.log("=============================");
        
        if (!roles.includes(req.user.role)) {
            console.log("Role check failed - throwing 403 error");
            // Pass the error to Express's error handler instead of throwing
            return next(new ApiError(403, "Forbidden: You do not have permission to perform this action."));
        }
        
        console.log("Role check passed - proceeding");
        next();
    };
};