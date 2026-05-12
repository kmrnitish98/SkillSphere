import express from 'express';
import { getConversations, getMessages, sendMessage, markSeen } from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/messages', sendMessage);
router.put('/messages/:conversationId/seen', markSeen);

export default router;
