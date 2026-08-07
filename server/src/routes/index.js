import { Router } from 'express';
import { getMessages, postMessage } from '../controllers/messageController.js';
import { login, listUsers } from '../controllers/userController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.get('/messages', getMessages);
router.post('/messages', postMessage);
router.post('/users/login', login);
router.get('/users', listUsers);

export default router;
