const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    try {
        const emailExist = await User.findOne({ where: { email: req.body.email } });
        if (emailExist) return res.status(400).send('Email already exists');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });
        res.send({ user: user.id });
    } catch (err) {
        res.status(400).send(err);
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ where: { email: req.body.email } });
        if (!user) return res.status(400).send('Email or Password incorrect');

        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) return res.status(400).send('Email or Password incorrect');

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
        res.header('auth-token', token).send({ token });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;