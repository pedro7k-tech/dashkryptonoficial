const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000; // Render e outros provedores definem o PORT automaticamente

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API DE LEADS ---
app.get('/api/leads', async (req, res) => {
    try {
        const leads = await db.leads.getAll();
        res.json(leads);
    } catch (err) {
        console.error('Erro ao ler leads:', err);
        res.status(500).json({ error: 'Erro ao ler leads.' });
    }
});

app.post('/api/leads', async (req, res) => {
    try {
        const { name, phone, device, service_type, city, status } = req.body;
        if (!name || !phone || !device || !service_type) {
            return res.status(400).json({ error: 'Faltam campos obrigatórios.' });
        }

        const cities = ["Cruz", "Bela Cruz", "Marco"];
        const selectedCity = city && cities.includes(city) ? city : cities[Math.floor(Math.random() * cities.length)];

        const newLead = {
            id: Date.now().toString(),
            name,
            phone,
            device,
            service_type,
            status: status || 'pending',
            city: selectedCity,
            createdAt: new Date().toISOString()
        };

        const savedLead = await db.leads.add(newLead);
        res.status(201).json({ message: 'Lead adicionado com sucesso', lead: savedLead });
    } catch (err) {
        console.error('Erro ao salvar lead:', err);
        res.status(500).json({ error: 'Erro ao salvar lead.' });
    }
});

app.patch('/api/leads/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedLead = await db.leads.updateStatus(req.params.id, status);
        if (!updatedLead) {
            return res.status(404).json({ error: 'Lead não encontrado.' });
        }
        res.json({ message: 'Status atualizado com sucesso', lead: updatedLead });
    } catch (err) {
        console.error('Erro ao atualizar lead:', err);
        res.status(500).json({ error: 'Erro ao atualizar.' });
    }
});

app.delete('/api/leads/:id', async (req, res) => {
    try {
        await db.leads.delete(req.params.id);
        res.json({ message: 'Lead removido com sucesso' });
    } catch (err) {
        console.error('Erro ao remover lead:', err);
        res.status(500).json({ error: 'Erro ao remover.' });
    }
});

// --- API DE FINANÇAS ---
app.get('/api/finance', async (req, res) => {
    try {
        const txs = await db.finance.getAll();
        res.json(txs);
    } catch (err) {
        console.error('Erro ao ler finanças:', err);
        res.status(500).json({ error: 'Erro ao ler finanças.' });
    }
});

app.post('/api/finance', async (req, res) => {
    try {
        const { description, amount, type, method } = req.body;
        if (!description || !amount || !type) {
            return res.status(400).json({ error: 'Faltam campos obrigatórios.' });
        }

        const newTx = {
            id: Date.now().toString(),
            description,
            amount: parseFloat(amount),
            type, // 'income' ou 'expense'
            method: method || 'PIX',
            date: new Date().toISOString()
        };

        const savedTx = await db.finance.add(newTx);
        res.status(201).json({ message: 'Transação adicionada com sucesso', tx: savedTx });
    } catch (err) {
        console.error('Erro ao salvar transação:', err);
        res.status(500).json({ error: 'Erro ao salvar.' });
    }
});

app.delete('/api/finance/:id', async (req, res) => {
    try {
        await db.finance.delete(req.params.id);
        res.json({ message: 'Transação removida com sucesso' });
    } catch (err) {
        console.error('Erro ao remover transação:', err);
        res.status(500).json({ error: 'Erro ao remover.' });
    }
});

// --- API DE METAS ---
app.get('/api/goals', async (req, res) => {
    try {
        const goals = await db.goals.getAll();
        res.json(goals);
    } catch (err) {
        console.error('Erro ao ler metas:', err);
        res.status(500).json({ error: 'Erro ao ler metas.' });
    }
});

app.post('/api/goals', async (req, res) => {
    try {
        const { month, target } = req.body;
        if (!month || target === undefined) {
            return res.status(400).json({ error: 'Faltam campos obrigatórios.' });
        }

        const updatedGoals = await db.goals.set(month, parseFloat(target));
        res.status(200).json({ message: 'Meta salva com sucesso', goals: updatedGoals });
    } catch (err) {
        console.error('Erro ao salvar meta:', err);
        res.status(500).json({ error: 'Erro ao salvar meta.' });
    }
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`🚀 DASH KRYPTON rodando com sucesso na porta ${PORT}`);
});
