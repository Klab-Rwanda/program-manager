import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Program } from '../models/program.model.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js'; // Assuming this import is needed for other functions
import { Submission } from '../models/submission.model.js'; // Assuming this import is needed for other functions
import { Course } from '../models/course.model.js'; // Assuming this import is needed for other functions
import { createNotification } from '../../services/notification.service.js'; // Ensure this is imported

const getAllUsers = asyncHandler(async (req, res) => {
    const { role } = req.query; 

    let query = { isActive: true };
    if (role) {
        const roleRegex = new RegExp(`^${role.replace(/\s/g, '\s*')}$`, 'i');
        query.role = { $regex: roleRegex };
    }

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
                    studentsCount: {
                        $reduce: {
                            input: "$assignedPrograms",
                            initialValue: 0,
                            in: { $add: ["$$value", { $size: { $ifNull: ["$$this.trainees", []] } }] }
                        }
                    },
                    contentSubmissions: { $size: "$courses" },
                    approvedContent: {
                        $size: {
                            $filter: {
                                input: "$courses",
                                cond: { $eq: ["$$this.status", "Approved"] }
                            }
                        }
                    },
                    programs: {
                        $map: {
                            input: "$assignedPrograms",
                            as: "program",
                            in: "$$program.name"
                        }
                    },
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

    const users = await User.aggregate([
        { $match: query },
        {
            $lookup: {
                from: "programs",
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

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const programs = await Program.find({ 
        $or: [{ trainees: id }, { facilitators: id }, { programManager: id }] 
    }).select('name').lean();

    const recentAttendance = await Attendance.find({ userId: id }) // Corrected 'user' to 'userId'
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('programId', 'name') // Corrected 'program' to 'programId'
        .lean();

    const activityFeed = [];

    recentAttendance.forEach(a => {
        if (a.programId && typeof a.programId === 'object') { // Check if populated and is object
            activityFeed.push({
                id: a._id.toString(),
                type: 'Attendance',
                text: `Status marked as '${a.status}' for program: ${a.programId.name}.`,
                timestamp: a.createdAt
            });
        }
    });
    
    activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const userDetails = {
        ...user,
        programs: programs,
        activityFeed: activityFeed.slice(0, 5)
    };

    return res.status(200).json(new ApiResponse(200, userDetails, "User details fetched successfully."));
});


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "Current user data fetched successfully"));
});


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

    await createNotification({
        recipient: user._id,
        sender: req.user._id,
        title: "Profile Updated",
        message: `Your profile name has been changed to '${user.name}'.`,
        link: `/dashboard/profile`,
        type: 'info'
    });

    return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});


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

    await createNotification({
        recipient: user._id,
        sender: req.user._id, // User themselves or System if no specific sender
        title: "Password Changed",
        message: "Your password has been successfully changed.",
        link: `/dashboard/settings`,
        type: 'success'
    });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully. Please log in again."));
});


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
    
    const onboardedUsers = await User.find(query)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .select(options.select)
        .lean(); 
        
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


const updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        throw new ApiError(400, "The 'isActive' field must be a boolean (true or false).");
    }

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
     await createNotification({
        recipient: user._id,
        sender: req.user._id, 
        title: `Account ${user.isActive ? 'Reactivated' : 'Deactivated'}`,
        message: `Your account (${user.email}) has been ${user.isActive ? 'reactivated' : 'deactivated'} by a Super Admin.`,
        link: `/dashboard/profile`, 
        type: user.isActive ? 'success' : 'warning'
    });
    return res.status(200).json(new ApiResponse(200, user, message));
});

const getUserListByRole = asyncHandler(async (req, res) => {
    const { role } = req.query;

    if (!role) {
        throw new ApiError(400, "A 'role' query parameter is required for this endpoint.");
    }

    const roleSearchTerm = role.replace(/\s/g, ''); 
    
    const allUsers = await User.find({}).select('name email role status');
    
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
    
    return res.status(200).json(new ApiResponse(200, filteredUsers, `User list for role '${role}' fetched successfully.`));
});

export const getArchivedUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ isActive: false }).select('-password');
    return res.status(200).json(new ApiResponse(200, users, "Archived users fetched successfully."));
});

 const updateUserDetailsByAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;

    if (req.user._id.toString() === id && role && req.user.role !== role) {
        throw new ApiError(400, "You cannot change your own role.");
    }
    
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
        throw new ApiError(404, "User not found.");
    }

    // Capture old role for notification
    const oldRole = userToUpdate.role;

    if (name) userToUpdate.name = name.trim();
    if (role) userToUpdate.role = role;

    await userToUpdate.save({ validateBeforeSave: false });

    // Send notification for role change
    if (oldRole !== userToUpdate.role) {
        await createNotification({
            recipient: userToUpdate._id,
            sender: req.user._id,
            title: "Your Role Has Changed",
            message: `Your role has been changed from '${oldRole}' to '${userToUpdate.role}' by a Super Admin.`,
            link: `/dashboard/profile`,
            type: 'info'
        });
    }

    const updatedUser = await User.findById(id).select('-password');
    return res.status(200).json(new ApiResponse(200, updatedUser, "User details updated successfully."));
});


 const deleteUserByAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
        throw new ApiError(400, "You cannot delete your own account.");
    }

    // FIX: Fetch the user BEFORE attempting to delete/update and notify
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
        throw new ApiError(404, "User not found.");
    }

    // Perform the soft delete
    const user = await User.findByIdAndUpdate(
        id,
        { $set: { isActive: false, isDeleted: true } },
        { new: true }
    );

    // Send notification
    await createNotification({
        recipient: userToDelete._id, // Use userToDelete for notification details
        sender: req.user._id, 
        title: "Account Deleted",
        message: `Your account (${userToDelete.email}) has been deleted by a Super Admin. You will no longer be able to log in.`,
        link: `/auth/login`, 
        type: 'error'
    });
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

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    if (user.role !== 'Facilitator') {
        throw new ApiError(400, "This endpoint is only for facilitators.");
    }

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

    const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
    ).select('-password');

    await createNotification({
        recipient: updatedUser._id,
        sender: req.user._id,
        title: "Facilitator Profile Updated",
        message: `Your facilitator profile has been updated by ${req.user.name}.`,
        link: `/dashboard/profile`,
        type: 'info'
    });

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