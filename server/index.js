require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cardsRouter = require('./routes/cards');
const categoriesRouter = require('./routes/categories');
const incomeBracketsRouter = require('./routes/incomeBrackets');
const leadsRouter = require('./routes/leads');
const adminRouter = require('./routes/admin');
const usersRouter = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/cards', cardsRouter);
app.post('/api/calculate', cardsRouter.calculateHandler);
app.post('/api/compare', cardsRouter.compareHandler);
app.use('/api/categories', categoriesRouter);
app.use('/api/income-brackets', incomeBracketsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
