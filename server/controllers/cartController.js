const CartItem = require('../models/CartItem');

exports.getCart = async (req, res) => {
    try {
        const items = await CartItem.findAll({ where: { UserId: req.user.id } });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { id, name, image, price, amount } = req.body;
        const quantityToAdd = amount || 1; 

        let item = await CartItem.findOne({ where: { UserId: req.user.id, coinId: id } });

        if (item) {
            item.amount += quantityToAdd;
            await item.save();
        } else {
            await CartItem.create({
                coinId: id,
                name,
                image,
                price,
                amount: quantityToAdd,
                UserId: req.user.id
            });
        }
        res.json({ message: "Added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateQuantity = async (req, res) => {
    try {
        const { coinId, action } = req.body;
        const item = await CartItem.findOne({ where: { UserId: req.user.id, coinId } });

        if (!item) return res.status(404).json({ error: "Item not found" });

        if (action === 'increase') {
            item.amount += 1;
            await item.save();
        } else if (action === 'decrease') {
            if (item.amount > 1) {
                item.amount -= 1;
                await item.save();
            } else {
                await item.destroy();
            }
        }
        res.json({ message: "Updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        await CartItem.destroy({ where: { UserId: req.user.id } });
        res.json({ message: "Cart Cleared" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};