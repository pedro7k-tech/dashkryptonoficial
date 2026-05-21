require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const useMongoDB = !!MONGODB_URI;

// --- CONFIGURAÇÃO DE ARQUIVOS LOCAIS JSON ---
const DATA_FILE = path.join(__dirname, 'leads.json');
const FINANCE_FILE = path.join(__dirname, 'finance.json');
const GOALS_FILE = path.join(__dirname, 'goals.json');

// Função auxiliar para garantir a criação dos arquivos locais
const initLocalFiles = () => {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    if (!fs.existsSync(FINANCE_FILE)) fs.writeFileSync(FINANCE_FILE, JSON.stringify([]));
    if (!fs.existsSync(GOALS_FILE)) fs.writeFileSync(GOALS_FILE, JSON.stringify({}));
};

let db = {};

if (useMongoDB) {
    console.log('🔌 Conectando ao MongoDB Atlas...');
    
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ Conectado ao MongoDB Atlas com sucesso!'))
        .catch(err => {
            console.error('❌ Erro crítico ao conectar ao MongoDB. O app usará o fallback local.', err);
            // Fallback imediato em caso de erro na conexão na inicialização
            process.env.MONGODB_URI = '';
            module.exports = require('./db.js');
        });

    // Mapeamento dos Esquemas do Mongoose
    const LeadSchema = new mongoose.Schema({
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        device: { type: String, required: true },
        service_type: { type: String, required: true },
        status: { type: String, default: 'pending' },
        city: { type: String, required: true },
        createdAt: { type: String, default: () => new Date().toISOString() }
    }, { versionKey: false });

    const FinanceSchema = new mongoose.Schema({
        id: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, required: true }, // 'income' ou 'expense'
        method: { type: String, default: 'PIX' },
        date: { type: String, default: () => new Date().toISOString() }
    }, { versionKey: false });

    const GoalSchema = new mongoose.Schema({
        month: { type: String, required: true, unique: true },
        target: { type: Number, required: true }
    }, { versionKey: false });

    const LeadModel = mongoose.model('Lead', LeadSchema);
    const FinanceModel = mongoose.model('Finance', FinanceSchema);
    const GoalModel = mongoose.model('Goal', GoalSchema);

    db = {
        leads: {
            getAll: async () => {
                return await LeadModel.find({}).sort({ createdAt: -1 }).lean();
            },
            add: async (lead) => {
                const newLead = new LeadModel(lead);
                await newLead.save();
                return newLead.toObject();
            },
            updateStatus: async (id, status) => {
                return await LeadModel.findOneAndUpdate(
                    { id: id },
                    { status: status },
                    { new: true }
                ).lean();
            },
            delete: async (id) => {
                await LeadModel.deleteOne({ id: id });
            }
        },
        finance: {
            getAll: async () => {
                return await FinanceModel.find({}).sort({ date: -1 }).lean();
            },
            add: async (tx) => {
                const newTx = new FinanceModel(tx);
                await newTx.save();
                return newTx.toObject();
            },
            delete: async (id) => {
                await FinanceModel.deleteOne({ id: id });
            }
        },
        goals: {
            getAll: async () => {
                const goals = await GoalModel.find({}).lean();
                return goals.reduce((acc, curr) => {
                    acc[curr.month] = curr.target;
                    return acc;
                }, {});
            },
            set: async (month, target) => {
                await GoalModel.findOneAndUpdate(
                    { month: month },
                    { target: target },
                    { upsert: true, new: true }
                );
                return await db.goals.getAll();
            }
        }
    };
} else {
    console.log('💾 Usando banco de dados local (arquivos JSON)...');
    initLocalFiles();

    db = {
        leads: {
            getAll: async () => {
                const data = fs.readFileSync(DATA_FILE, 'utf8');
                return JSON.parse(data);
            },
            add: async (lead) => {
                const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                data.unshift(lead);
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
                return lead;
            },
            updateStatus: async (id, status) => {
                const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                const idx = data.findIndex(l => l.id === id);
                if (idx !== -1) {
                    data[idx].status = status;
                    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
                    return data[idx];
                }
                return null;
            },
            delete: async (id) => {
                let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                data = data.filter(l => l.id !== id);
                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            }
        },
        finance: {
            getAll: async () => {
                const data = fs.readFileSync(FINANCE_FILE, 'utf8');
                return JSON.parse(data);
            },
            add: async (tx) => {
                const data = JSON.parse(fs.readFileSync(FINANCE_FILE, 'utf8'));
                data.unshift(tx);
                fs.writeFileSync(FINANCE_FILE, JSON.stringify(data, null, 2));
                return tx;
            },
            delete: async (id) => {
                let data = JSON.parse(fs.readFileSync(FINANCE_FILE, 'utf8'));
                data = data.filter(t => t.id !== id);
                fs.writeFileSync(FINANCE_FILE, JSON.stringify(data, null, 2));
            }
        },
        goals: {
            getAll: async () => {
                const data = fs.readFileSync(GOALS_FILE, 'utf8');
                return JSON.parse(data);
            },
            set: async (month, target) => {
                const data = JSON.parse(fs.readFileSync(GOALS_FILE, 'utf8'));
                data[month] = target;
                fs.writeFileSync(GOALS_FILE, JSON.stringify(data, null, 2));
                return data;
            }
        }
    };
}

module.exports = db;
