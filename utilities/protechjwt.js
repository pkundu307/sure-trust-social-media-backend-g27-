import jwt from 'jsonwebtoken';

export const protect= (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log(token);
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, no token provided' });
    }
    try {
        const decoded = jwt.verify(token, 'prasanna');

        req.user = decoded; // Attach user info to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Unauthorized, token verification failed' });
    }
}