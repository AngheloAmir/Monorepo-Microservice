import { Router }       from 'express';
import AuthMiddleware   from '../middleware/auth.middleware';
import { generateToken } from '../utils/token';

const router = Router();
router.get('/login', async (req, res) => {
    const usertoken = generateToken({ userid: 'test', email: "test" });
    res.json({ token: usertoken });
});

router.post('/auth', AuthMiddleware, (req, res) => {
   res.json({ message: 'Authenticated' });
})

export default router;
