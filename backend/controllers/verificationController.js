import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendVerificationEmail, getApprovalEmailHTML, getRejectionEmailHTML, getSubmissionEmailHTML } from '../utils/sendEmail.js';

// @desc    Submit mentor verification application
// @route   POST /api/v1/verification/submit
// @access  Private (mentor)
export const submitVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.verificationStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'You already have a pending application' });
    }

    if (user.isVerifiedMentor) {
      return res.status(400).json({ success: false, message: 'You are already verified' });
    }

    const { fullName, phone, expertise, experience, bio, linkedin } = req.body;

    // Save verification data on user
    user.verificationData = {
      fullName,
      phone,
      expertise: expertise || [],
      experience,
      bio,
      linkedin,
      submittedAt: new Date(),
    };
    user.verificationStatus = 'pending';
    user.rejectionReason = '';
    await user.save();

    // Create notification
    await Notification.create({
      user: user._id,
      type: 'verification_submitted',
      title: 'Application Submitted',
      message: 'Your mentor verification application has been submitted and is under review.',
    });

    // Send confirmation email
    await sendVerificationEmail({
      to: user.email,
      subject: '📋 SkillSphere — Verification Application Received',
      html: getSubmissionEmailHTML(fullName || user.name),
    });

    res.json({
      success: true,
      message: 'Verification application submitted successfully',
      verificationStatus: 'pending',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current verification status
// @route   GET /api/v1/verification/status
// @access  Private (mentor)
export const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('isVerifiedMentor verificationStatus verificationData rejectionReason');

    res.json({
      success: true,
      data: {
        isVerifiedMentor: user.isVerifiedMentor,
        verificationStatus: user.verificationStatus || 'none',
        rejectionReason: user.rejectionReason || '',
        submittedAt: user.verificationData?.submittedAt || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending verifications (Admin)
// @route   GET /api/v1/verification/requests
// @access  Private/Admin
export const getVerificationRequests = async (req, res) => {
  try {
    const users = await User.find({ verificationStatus: { $in: ['pending', 'approved', 'rejected'] } })
      .select('name email verificationStatus verificationData rejectionReason createdAt')
      .sort({ 'verificationData.submittedAt': -1 });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or reject a verification (Admin)
// @route   PUT /api/v1/verification/:userId/decision
// @access  Private/Admin
export const handleVerificationDecision = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' | 'reject'
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (action === 'approve') {
      user.verificationStatus = 'approved';
      user.isVerifiedMentor = true;
      user.rejectionReason = '';
      await user.save();

      // Create notification
      await Notification.create({
        user: user._id,
        type: 'verification_approved',
        title: 'Verification Approved! 🎉',
        message: 'Congratulations! Your mentor verification has been approved. You can now create unlimited courses.',
      });

      // Send approval email
      await sendVerificationEmail({
        to: user.email,
        subject: '✅ SkillSphere — Mentor Verification Approved!',
        html: getApprovalEmailHTML(user.verificationData?.fullName || user.name),
      });

    } else if (action === 'reject') {
      user.verificationStatus = 'rejected';
      user.isVerifiedMentor = false;
      user.rejectionReason = reason || 'Your application did not meet our requirements.';
      await user.save();

      // Create notification
      await Notification.create({
        user: user._id,
        type: 'verification_rejected',
        title: 'Verification Not Approved',
        message: `Your mentor verification was not approved. Reason: ${user.rejectionReason}`,
      });

      // Send rejection email
      await sendVerificationEmail({
        to: user.email,
        subject: '❌ SkillSphere — Verification Update',
        html: getRejectionEmailHTML(user.verificationData?.fullName || user.name, user.rejectionReason),
      });
    }

    res.json({
      success: true,
      message: `Application ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get notifications for current user
// @route   GET /api/v1/verification/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/v1/verification/notifications/read
// @access  Private
export const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
