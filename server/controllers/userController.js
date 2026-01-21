const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ['username', 'email'] });
        if (!user) return res.status(404).send(null);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const updates = {};
        if (username) updates.username = username;
        if (email) updates.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password, salt);
        }
        await User.update(updates, { where: { id: req.user.id } });
        res.json({ message: "Profile Updated" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        await Transaction.destroy({ where: { UserId: req.user.id } });
        await User.destroy({ where: { id: req.user.id } });
        res.json({ message: "Account deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};