import { ApiError } from "../../utils/ApiError.js";


export const checkRole = (roles) => {
    return (req, res, next) => {
        
        if (!req.user || !req.user.role) {
           
            return next(new ApiError(401, "Unauthorized: No user role found."));
        }

       
        if (req.user.role === 'SuperAdmin') {
           
            return next(); 
        }
       
        
        if (!roles.includes(req.user.role)) {
            console.log("Role check failed - throwing 403 error");
            
            return next(new ApiError(403, "Forbidden: You do not have permission to perform this action."));
        }
        
        console.log("Role check passed - proceeding");
        next();
    };
};