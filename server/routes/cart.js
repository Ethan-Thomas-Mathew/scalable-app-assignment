const router = require('express').Router();
const cartController = require('../controllers/cartController');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send('Access Denied');
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

router.get('/', verifyToken, cartController.getCart);
router.post('/', verifyToken, cartController.addToCart);
router.put('/', verifyToken, cartController.updateQuantity);
router.delete('/', verifyToken, cartController.clearCart);

module.exports = router;