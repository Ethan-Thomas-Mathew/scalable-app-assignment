const router = require('express').Router();
const cryptoController = require('../controllers/cryptoController');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) return res.status(401).send('Access Denied');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) { res.status(400).send('Invalid Token'); }
};

router.get('/', verifyToken, cryptoController.getHistory);
router.post('/buy', verifyToken, cryptoController.buyCoin);
router.post('/sell', verifyToken, cryptoController.sellCoinPartial); // <--- NEW ROUTE
router.put('/:id', verifyToken, cryptoController.updateNote);
router.delete('/:id', verifyToken, cryptoController.sellCoin);

module.exports = router;