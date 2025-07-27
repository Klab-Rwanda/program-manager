import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js'; // Needed for getOnboardedUsers
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js';
import { Submission } from '../models/submission.model.js';
import { Course } from '../models/course.model.js';

const getAllUsers = asyncHandler(async (req, res) => {
    const { role } = req.query; 

    let query = { isActive: true };
    if (role) {
        const roleRegex = new RegExp(`^${role.replace(/\s/g, '\s*')}$`, 'i');
        query.role = { $regex: roleRegex };
    }

    // If fetching facilitators, provide comprehensive data
    if (role && role.toLowerCase() === 'facilitator') {
        const facilitators = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: "programs",
                    localField: "_id",
                    foreignField: "facilitators",
                    as: "assignedPrograms"
                }
            },
            {
                $lookup: {
                    from: "courses",
                    localField: "_id",
                    foreignField: "facilitator",
                    as: "courses"
                }
            },
            {
                $addFields: {
                    // Calculate students count from assigned programs
                    studentsCount: {
                        $reduce: {
                            input: "$assignedPrograms",
                            initialValue: 0,
                            in: { $add: ["$$value", { $size: { $ifNull: ["$$this.trainees", []] } }] }
                        }
                    },
                    // Count content submissions (courses)
                    contentSubmissions: { $size: "$courses" },
                    // Count approved content
                    approvedContent: {
                        $size: {
                            $filter: {
                                input: "$courses",
                                cond: { $eq: ["$$this.status", "Approved"] }
                            }
                        }
                    },
                    // Get program names
                    programs: {
                        $map: {
                            input: "$assignedPrograms",
                            as: "program",
                            in: "$$program.name"
                        }
                    },
                    // Format join date
                    joinDate: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: { $ifNull: ["$joinDate", "$createdAt"] }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    role: 1,
                    status: 1,
                    isActive: 1,
                    phone: 1,
                    specialization: 1,
                    experience: 1,
                    rating: 1,
                    github: 1,
                    joinDate: 1,
                    studentsCount: 1,
                    contentSubmissions: 1,
                    approvedContent: 1,
                    type: 1,
                    previousProgram: 1,
                    promotionDate: 1,
                    programs: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);
        
        return res.status(200).json(new ApiResponse(200, facilitators, "Facilitators fetched successfully."));
    }

    // For other roles, use the existing logic
    const users = await User.aggregate([
        { $match: query },
        {
            $lookup: {
                from: "programs", // The name of the programs collection in MongoDB
                localField: "_id",
                foreignField: "trainees",
                as: "enrolledPrograms"
            }
        },
        {
            $project: {
                name: 1,
                email: 1,
                role: 1,
                status: 1,
                isActive: 1,
                enrolledPrograms: {
                    $map: {
                        input: "$enrolledPrograms",
                        as: "program",
                        in: "$$program.name"
                    }
                }
            }
        }
    ]);
    
    return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully."));
});


export const getAllManagers = asyncHandler(async (req, res) => {
    const managers = await User.find({ role: 'Program Manager', isActive: true }).select('name email');
    return res.status(200).json(new ApiResponse(200, managers, "Program Managers fetched successfully."));
});



const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // --- ROBUST DATA FETCHING ---
    // First, find the user. If they don't exist, stop immediately.
    const user = await User.findById(id).select('-password').lean();
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Now, fetch all related data. This is safer than doing it all in one Promise.all
    // when subsequent queries depend on the first one succeeding.
    const programs = await Program.find({ 
        $or: [{ trainees: id }, { facilitators: id }, { programManager: id }] 
    }).select('name').lean();

    const recentAttendance = await Attendance.find({ user: id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('program', 'name') // Populate is fine, we will check for null below
        .lean();

    // In the future, you would add Submissions here as well.
    // const recentSubmissions = await Submission.find({ trainee: id })...

    // --- SAFELY BUILD THE ACTIVITY FEED ---
    const activityFeed = [];

    // Safely map attendance records
    recentAttendance.forEach(a => {
        // This check prevents the crash. If the program was deleted, a.program will be null.
        if (a.program) { 
            activityFeed.push({
                id: a._id.toString(),
                type: 'Attendance',
                text: `Status marked as '${a.status}' for program: ${a.program.name}.`,
                timestamp: a.createdAt
            });
        }
    });
    
    // In the future, you would map submissions here and push to the same `activityFeed` array.
    
    // Sort the combined feed by date
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // --- COMBINE ALL DATA FOR THE RESPONSE ---
    const userDetails = {
        ...user,
        programs: programs,
        activityFeed: activityFeed.slice(0, 5) // Ensure we only send the top 5 overall
    };

    return res.status(200).json(new ApiResponse(200, userDetails, "User details fetched successfully."));
});


/**
 * @desc    Logged-in user gets their own profile details.
 * @route   GET /api/v1/users/me
 * @access  Private (Any logged-in user)
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "Current user data fetched successfully"));
});

/**
 * @desc    Logged-in user updates their own account details (e.g., name).
 * @route   PATCH /api/v1/users/update-account
 * @access  Private (Any logged-in user)
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === "") {
        throw new ApiError(400, "Name field cannot be empty");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { name: name.trim() } },
        { new: true }
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

/**
 * @desc    Logged-in user changes their own password.
 * @route   POST /api/v1/users/change-password
 * @access  Private (Any logged-in user)
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required.");
    }
    
    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully. Please log in again."));
});

/**
 * @desc    Admin gets a list of users who have logged in at least once.
 * @route   GET /api/v1/users/manage/onboarded
 * @access  Private (SuperAdmin, ProgramManager)
 */
const getOnboardedUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role } = req.query;

    let query = {
        firstLogin: { $exists: true, $ne: null }
    };

    if (role) {
        query.role = role;
    }
    
    if (req.user.role === 'Program Manager') {
        const programs = await Program.find({ programManager: req.user._id }).select('trainees facilitators');
        let managedUserIds = [];
        programs.forEach(p => {
            managedUserIds.push(...p.trainees, ...p.facilitators);
        });
        query._id = { $in: managedUserIds };
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { firstLogin: 'desc' },
        select: '-password -forgotPasswordToken -forgotPasswordExpiry'
    };
    
    // Manual pagination since we aren't using a plugin here
    const onboardedUsers = await User.find(query)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .select(options.select)
        .lean(); // Use .lean() for faster queries when you don't need Mongoose methods
        
    const totalDocs = await User.countDocuments(query);
    
    const responseData = {
        data: onboardedUsers,
        pagination: {
            total: totalDocs,
            limit: options.limit,
            page: options.page,
            totalPages: Math.ceil(totalDocs / options.limit)
        }
    };
    
    return res.status(200).json(new ApiResponse(200, responseData, "Onboarded users fetched successfully."));
});


// --- THIS IS THE MISSING FUNCTION ---
/**
 * @desc    Admin updates a user's status (activates/deactivates them).
 * @route   PATCH /api/v1/users/manage/:id/status
 * @access  Private (SuperAdmin)
 */
const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        throw new ApiError(400, "The 'isActive' field must be a boolean (true or false).");
    }

    // A SuperAdmin should not be able to deactivate themselves.
    if (req.user._id.toString() === id) {
        throw new ApiError(400, "You cannot change your own active status.");
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true }
    ).select('-password');

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    const message = user.isActive ? "User account has been reactivated." : "User account has been deactivated.";
    return res.status(200).json(new ApiResponse(200, user, message));
});

const getUserListByRole = asyncHandler(async (req, res) => {
    const { role } = req.query;

    if (!role) {
        throw new ApiError(400, "A 'role' query parameter is required for this endpoint.");
    }

    // --- THE ROBUST FIX ---
    // Create a regular expression that is case-insensitive and ignores spaces.
    // Example: "ProgramManager" becomes a regex that matches "ProgramManager", "Program Manager", "program manager", etc.
    const roleSearchTerm = role.replace(/\s/g, ''); // Remove all spaces from the input
    const roleRegex = new RegExp(`^${roleSearchTerm}$`.replace(' ', '\\s*'), 'i');
    
    // We can't apply the regex directly to the enum field in a simple query.
    // Instead, we will fetch all users and filter them in the application code.
    // This is acceptable because the number of potential managers/admins is small.
    
    // Let's find ALL users first.
    const allUsers = await User.find({}).select('name email role status');
    
    // Now, filter them based on our flexible role check.
    const filteredUsers = allUsers.filter(user => {
        try {
            if (!user.role || typeof user.role !== 'string') return false;
            const dbRole = user.role.replace(/\s/g, '');
            return dbRole.toLowerCase() === roleSearchTerm.toLowerCase();
        } catch (e) {
            console.error('Error filtering user by role:', user, e);
            return false;
        }
    });
    // --- END OF FIX ---


    return res.status(200).json(new ApiResponse(200, filteredUsers, `User list for role '${role}' fetched successfully.`));
});

export const getArchivedUsers = asyncHandler(async (req, res) => {
    // This query explicitly looks for users where isActive is false.
    // It will bypass the default `pre('find')` middleware on the User model if you have one.
    const users = await User.find({ isActive: false }).select('-password');
    return res.status(200).json(new ApiResponse(200, users, "Archived users fetched successfully."));
});

 const updateUserDetailsByAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;

    // A SuperAdmin should not be able to change their own role.
    if (req.user._id.toString() === id && role && req.user.role !== role) {
        throw new ApiError(400, "You cannot change your own role.");
    }
    
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
        throw new ApiError(404, "User not found.");
    }

    if (name) userToUpdate.name = name.trim();
    if (role) userToUpdate.role = role;

    await userToUpdate.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(id).select('-password');
    return res.status(200).json(new ApiResponse(200, updatedUser, "User details updated successfully."));
});


/**
 * @desc    Admin permanently (soft) deletes a user.
 * @route   DELETE /api/v1/users/manage/:id
 * @access  Private (SuperAdmin)
 */
 const deleteUserByAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // A SuperAdmin should not be able to delete themselves.
    if (req.user._id.toString() === id) {
        throw new ApiError(400, "You cannot delete your own account.");
    }

    const user = await User.findByIdAndUpdate(
        id,
        { $set: { isActive: false, isDeleted: true } },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    return res.status(200).json(new ApiResponse(200, {}, "User has been deleted."));
});

/**
 * @desc    Update facilitator profile details.
 * @route   PATCH /api/v1/users/manage/:id/facilitator-profile
 * @access  Private (SuperAdmin, Program Manager)
 */
const updateFacilitatorProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
        phone, 
        specialization, 
        experience, 
        rating, 
        github,
        type,
        previousProgram,
        promotionDate 
    } = req.body;

    // Verify the user is a facilitator
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    if (user.role !== 'Facilitator') {
        throw new ApiError(400, "This endpoint is only for facilitators.");
    }

    // Build update object with only provided fields
    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = experience;
    if (rating !== undefined) {
        if (rating < 0 || rating > 5) {
            throw new ApiError(400, "Rating must be between 0 and 5.");
        }
        updateData.rating = rating;
    }
    if (github !== undefined) updateData.github = github;
    if (type !== undefined) updateData.type = type;
    if (previousProgram !== undefined) updateData.previousProgram = previousProgram;
    if (promotionDate !== undefined) updateData.promotionDate = promotionDate;

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    ).select('-password');

    return res.status(200).json(new ApiResponse(200, updatedUser, "Facilitator profile updated successfully."));
});

export {
    getAllUsers, 
    getUserById,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentPassword,
    getOnboardedUsers,
    updateUserStatus,
    getUserListByRole,
    updateUserDetailsByAdmin,
    deleteUserByAdmin,
    updateFacilitatorProfile,
};