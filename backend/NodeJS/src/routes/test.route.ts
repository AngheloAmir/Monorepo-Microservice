import { Router }       from 'express';
import AuthMiddleware   from '../middleware/auth.middleware';
import { generateToken } from '../utils/token';

const router = Router();
router.get('/test', (req, res) => {
    console.log('I have been visited')
    res.json({ message: 'Test' });
});

router.get('/login', async (req, res) => {
    console.log('you have visited login')
    const usertoken = generateToken({ userid: 'test', email: "test" });
    res.json({ token: usertoken });
});

router.post('/auth', AuthMiddleware, (req, res) => {
    console.log('you have visited auth')
   res.json({ message: 'Authenticated' });
})

export default router;
