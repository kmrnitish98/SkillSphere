import express from 'express';
import { getUsers, deleteUser, toggleFavoriteMentor, banUser, updateProfile, changePassword, uploadAvatar, getTopMentors } from '../controllers/userController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/favorites/:mentorId', protect, authorize('student'), toggleFavoriteMentor);

router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/change-password', protect, changePassword);

router.get('/top-mentors', getTopMentors);
router.get('/', protect, authorize('admin'), getUsers);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.put('/:id/ban', protect, authorize('admin'), banUser);

export default router;
