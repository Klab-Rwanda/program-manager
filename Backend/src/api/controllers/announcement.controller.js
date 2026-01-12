import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { Announcement } from '../models/announcement.model.js';
import { Program } from '../models/program.model.js';
import { createNotification } from '../../services/notification.service.js';
import { sendAnnouncementEmail } from '../../services/email.service.js';

/**
 * @desc    Create a new announcement
 * @route   POST /api/v1/announcements
 * @access  Private (Facilitator, Evaluator, Program Manager)
 */
export const createAnnouncement = asyncHandler(async (req, res) => {
    const { title, content, program, priority, targetAudience, sendEmail, expiresAt } = req.body;
    const authorId = req.user._id;

    // Verify user has access to this program
    const programDoc = await Program.findById(program)
        .populate('trainees', 'name email')
        .populate('facilitators', 'name email')
        .populate('programManager', 'name email');

    if (!programDoc) {
        throw new ApiError(404, "Program not found");
    }

    // Check if user is authorized (facilitator, evaluator, or program manager of this program)
    const isFacilitator = programDoc.facilitators?.some(f => f._id.toString() === authorId.toString());
    const isManager = programDoc.programManager?._id.toString() === authorId.toString();
    const isEvaluator = req.user.role === 'Evaluator';

    if (!isFacilitator && !isManager && !isEvaluator) {
        throw new ApiError(403, "You are not authorized to create announcements for this program.");
    }

    const announcement = await Announcement.create({
        title,
        content,
        author: authorId,
        program,
        priority: priority || 'normal',
        targetAudience: targetAudience || 'all',
        expiresAt: expiresAt || null
    });

    // Determine recipients based on target audience
    let recipients = [];
    if (targetAudience === 'all' || targetAudience === 'trainees') {
        recipients = [...recipients, ...(programDoc.trainees || [])];
    }
    if (targetAudience === 'all' || targetAudience === 'facilitators') {
        recipients = [...recipients, ...(programDoc.facilitators || [])];
    }

    // Create in-app notifications for all recipients
    for (const recipient of recipients) {
        await createNotification({
            recipient: recipient._id,
            sender: authorId,
            title: `New Announcement: ${title}`,
            message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            link: `/dashboard/announcements`,
            type: 'info'
        });
    }

    // Send email if requested
    if (sendEmail && recipients.length > 0) {
        try {
            await sendAnnouncementEmail({
                recipients: recipients.map(r => ({ name: r.name, email: r.email })),
                title,
                content,
                authorName: req.user.name,
                programName: programDoc.name,
                priority
            });

            announcement.emailSent = true;
            announcement.emailSentAt = new Date();
            await announcement.save();
        } catch (emailError) {
            console.error('Failed to send announcement emails:', emailError);
            // Don't fail the request if email fails
        }
    }

    const populatedAnnouncement = await Announcement.findById(announcement._id)
        .populate('author', 'name email role')
        .populate('program', 'name');

    return res.status(201).json(new ApiResponse(201, populatedAnnouncement, "Announcement created successfully."));
});

/**
 * @desc    Get announcements for a program
 * @route   GET /api/v1/announcements/program/:programId
 * @access  Private
 */
export const getAnnouncementsByProgram = asyncHandler(async (req, res) => {
    const { programId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const announcements = await Announcement.find({
        program: programId,
        isActive: true,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    })
        .populate('author', 'name email role')
        .populate('program', 'name')
        .sort({ createdAt: -1 });

    // Filter based on target audience
    const filteredAnnouncements = announcements.filter(ann => {
        if (ann.targetAudience === 'all') return true;
        if (ann.targetAudience === 'trainees' && userRole === 'Trainee') return true;
        if (ann.targetAudience === 'facilitators' && userRole === 'Facilitator') return true;
        // Managers and authors can see all
        if (userRole === 'Program Manager' || ann.author._id.toString() === userId.toString()) return true;
        return false;
    });

    // Add isRead field for current user
    const announcementsWithReadStatus = filteredAnnouncements.map(ann => ({
        ...ann.toObject(),
        isRead: ann.readBy.some(id => id.toString() === userId.toString())
    }));

    return res.status(200).json(new ApiResponse(200, announcementsWithReadStatus, "Announcements fetched successfully."));
});

/**
 * @desc    Get all announcements for current user's programs
 * @route   GET /api/v1/announcements/my-announcements
 * @access  Private
 */
export const getMyAnnouncements = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Find all programs the user belongs to
    let programs = [];
    if (userRole === 'Trainee') {
        programs = await Program.find({ trainees: userId }).select('_id');
    } else if (userRole === 'Facilitator') {
        programs = await Program.find({ facilitators: userId }).select('_id');
    } else if (userRole === 'Program Manager') {
        programs = await Program.find({ programManager: userId }).select('_id');
    } else if (userRole === 'Evaluator') {
        // Evaluators can see all active programs
        programs = await Program.find({ status: 'Active' }).select('_id');
    }

    const programIds = programs.map(p => p._id);

    const announcements = await Announcement.find({
        program: { $in: programIds },
        isActive: true,
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
        ]
    })
        .populate('author', 'name email role')
        .populate('program', 'name')
        .sort({ createdAt: -1 });

    // Filter based on target audience
    const filteredAnnouncements = announcements.filter(ann => {
        if (ann.targetAudience === 'all') return true;
        if (ann.targetAudience === 'trainees' && userRole === 'Trainee') return true;
        if (ann.targetAudience === 'facilitators' && userRole === 'Facilitator') return true;
        if (userRole === 'Program Manager' || userRole === 'Evaluator') return true;
        if (ann.author._id.toString() === userId.toString()) return true;
        return false;
    });

    // Add isRead field
    const announcementsWithReadStatus = filteredAnnouncements.map(ann => ({
        ...ann.toObject(),
        isRead: ann.readBy.some(id => id.toString() === userId.toString())
    }));

    return res.status(200).json(new ApiResponse(200, announcementsWithReadStatus, "Announcements fetched successfully."));
});

/**
 * @desc    Mark announcement as read
 * @route   PATCH /api/v1/announcements/:announcementId/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;
    const userId = req.user._id;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }

    // Add user to readBy if not already there
    if (!announcement.readBy.includes(userId)) {
        announcement.readBy.push(userId);
        await announcement.save();
    }

    return res.status(200).json(new ApiResponse(200, {}, "Announcement marked as read."));
});

/**
 * @desc    Delete/deactivate an announcement
 * @route   DELETE /api/v1/announcements/:announcementId
 * @access  Private (Author or Program Manager)
 */
export const deleteAnnouncement = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;
    const userId = req.user._id;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }

    // Check authorization
    const isAuthor = announcement.author.toString() === userId.toString();
    const program = await Program.findById(announcement.program);
    const isManager = program?.programManager?.toString() === userId.toString();

    if (!isAuthor && !isManager) {
        throw new ApiError(403, "You are not authorized to delete this announcement.");
    }

    // Soft delete
    announcement.isActive = false;
    await announcement.save();

    return res.status(200).json(new ApiResponse(200, {}, "Announcement deleted successfully."));
});

/**
 * @desc    Update an announcement
 * @route   PATCH /api/v1/announcements/:announcementId
 * @access  Private (Author only)
 */
export const updateAnnouncement = asyncHandler(async (req, res) => {
    const { announcementId } = req.params;
    const { title, content, priority, targetAudience, expiresAt } = req.body;
    const userId = req.user._id;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
        throw new ApiError(404, "Announcement not found");
    }

    // Only author can update
    if (announcement.author.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this announcement.");
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (expiresAt !== undefined) announcement.expiresAt = expiresAt;

    await announcement.save();

    const populatedAnnouncement = await Announcement.findById(announcement._id)
        .populate('author', 'name email role')
        .populate('program', 'name');

    return res.status(200).json(new ApiResponse(200, populatedAnnouncement, "Announcement updated successfully."));
});
