const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./db');

const User = require('./models/User');
const Transaction = require('./models/Transaction'); 
const CartItem = require('./models/CartItem');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/user'); 
const cartRoutes = require('./routes/cart');
const proxyRoutes = require('./routes/proxy');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/user', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/crypto', transactionRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/proxy', proxyRoutes);

const PORT = process.env.PORT || 5000;
sequelize.sync({ force: false })
    .then(() => {
        console.log("Database connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.log("Error:", err));