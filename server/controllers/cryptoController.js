const Transaction = require('../models/Transaction');
const CartItem = require('../models/CartItem');

exports.getHistory = async (req, res) => {
    try {
        const history = await Transaction.findAll({ where: { UserId: req.user.id } });
        res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.buyCoin = async (req, res) => {
    try {
        const { items, paymentMethod } = req.body;
        await Promise.all(items.map(async (item) => {
            return await Transaction.create({
                coinName: item.name,
                amount: item.amount,
                priceAtBuy: item.price,
                paymentMethod: paymentMethod,
                note: 'Bulk Purchase',
                UserId: req.user.id
            });
        }));
        await CartItem.destroy({ where: { UserId: req.user.id } });
        res.json({ message: "Order Successful" });
    } catch (err) { res.status(400).json({ error: err.message }); }
};

// --- NEW SMART SELL FUNCTION ---
exports.sellCoinPartial = async (req, res) => {
    try {
        const { coinName, amountToSell } = req.body;
        let remainingToSell = parseFloat(amountToSell);

        // Get all transactions for this coin
        const txs = await Transaction.findAll({ 
            where: { UserId: req.user.id, coinName: coinName } 
        });

        // Loop through transactions and deduct amount
        for (let tx of txs) {
            if (remainingToSell <= 0) break;

            if (tx.amount <= remainingToSell) {
                // If this transaction is smaller than what we want to sell, delete it entirely
                remainingToSell -= tx.amount;
                await tx.destroy();
            } else {
                // If this transaction has enough, just reduce the amount
                tx.amount -= remainingToSell;
                await tx.save();
                remainingToSell = 0;
            }
        }

        res.json({ message: "Sold successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Keep for compatibility if needed, but we mostly use the partial one now
exports.sellCoin = async (req, res) => {
    try {
        const deleted = await Transaction.destroy({ where: { id: req.params.id, UserId: req.user.id } });
        if (deleted) res.json({ message: "Coin Sold" });
        else res.status(404).json({ message: "Transaction not found" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateNote = async (req, res) => {
    try {
        await Transaction.update({ note: req.body.note }, { where: { id: req.params.id, UserId: req.user.id } });
        res.json({ message: "Note Updated" });
    } catch (err) { res.status(400).json({ error: err.message }); }
};