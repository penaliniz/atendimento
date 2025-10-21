// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB, closeDB } = require('./src/infrastructure/database/mongodb');
const FeedbackMongoRepository = require('./src/infrastructure/repositories/FeedbackMongoRepository');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function requireApiKey(req, res, next) {
    const expectedApiKey = process.env.API_KEY;
    const providedApiKey = req.header('x-api-key');

    if (!expectedApiKey) {
        console.error('[requireApiKey] ERRO: API_KEY não configurada no arquivo .env.');
        return res.status(503).json({ error: 'Servidor mal configurado: chave de API ausente.' });
    }

    if (!providedApiKey || providedApiKey !== expectedApiKey) {
        console.warn(`[requireApiKey] Acesso negado. Chave fornecida inválida ou ausente.`);
        return res.status(401).json({ error: 'Não autorizado' });
    }
    
    console.log('[requireApiKey] Chave de API validada com sucesso.');
    next();
}

const _rateMap = new Map();
const RATE_WINDOW = Number(process.env.RATE_WINDOW_MS) || 60_000;
const RATE_MAX = Number(process.env.RATE_LIMIT_MAX) || 60;
function rateLimiter(req, res, next) {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = _rateMap.get(key);
    if (!entry || now - entry.startAt > RATE_WINDOW) { _rateMap.set(key, { count: 1, startAt: now }); return next(); }
    entry.count += 1;
    if (entry.count > RATE_MAX) { return res.status(429).json({ error: 'Too Many Requests' }); }
    return next();
}

const feedbackRepository = new FeedbackMongoRepository();

app.post('/api/feedback', requireApiKey, rateLimiter, async (req, res, next) => {
    console.log(`[SERVER POST /api/feedback] Recebido request: ${new Date().toISOString()}`);
    console.log("[SERVER POST /api/feedback] Body:", req.body);

    try {
        const { pdv_id, input_raw, transaction_details } = req.body;

        if (!pdv_id || !input_raw) {
            return res.status(400).json({ error: 'pdv_id e input_raw são obrigatórios' });
        }

        // Mapeamento de categoria
        let categoria = 'Não Definida';
        switch (input_raw.toUpperCase()) {
            case 'VERYGOOD': categoria = 'Gostei de tudo'; break;
            case 'GOOD':     categoria = 'Ambiente'; break;
            case 'FAIR':     categoria = 'Preço'; break;
            case 'POOR':     categoria = 'Atendimento'; break;
            case 'VERYPOOR': categoria = 'Tempo de Espera'; break;
        }

        // --- ALTERAÇÃO PARA FORMATAR O CAMPO transaction_details ---
        let parsedTransactionDetails = transaction_details || null; // Valor padrão
        if (transaction_details && typeof transaction_details === 'string') {
            const parts = transaction_details.split(',');
            if (parts.length === 4) {
                parsedTransactionDetails = {
                    Data: parts[0],
                    NSU: parts[1],
                    PDV: parts[2],
                    Loja: parts[3]
                };
                console.log("[SERVER] transaction_details formatado para objeto:", parsedTransactionDetails);
            }
        }
        // -----------------------------------------------------------

        const feedbackData = {
            timestamp: new Date().toISOString(),
            pdv_id: pdv_id,
            input_raw: input_raw,
            categoria: categoria,
            transaction_details: parsedTransactionDetails // Usa o valor formatado
        };

        console.log("[SERVER POST /api/feedback] Tentando salvar no repositório...");
        const savedFeedback = await feedbackRepository.save(feedbackData);
        console.log("[SERVER POST /api/feedback] Salvo com sucesso no repositório:", savedFeedback);

        res.status(201).json({ message: 'Feedback recebido com sucesso!', data: savedFeedback });
        console.log(`[SERVER POST /api/feedback] Resposta 201 enviada: ${new Date().toISOString()}`);

    } catch (error) {
        console.error("[SERVER POST /api/feedback] Erro no try-catch:", error);
        next(error);
    }
});

app.get('/api/feedback', requireApiKey, async (req, res, next) => {
    try {
        const allFeedbacks = await feedbackRepository.findAll();
        res.json(allFeedbacks);
    } catch (error) {
        console.error("Erro no endpoint /api/feedback (GET):", error);
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error("Erro não tratado:", err.stack || err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor.'
    });
});

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log('--- Servidor de Feedback Iniciado ---');
            console.log(`Conectado ao MongoDB (${process.env.MONGODB_DB_NAME})`);
            console.log(`API rodando na porta ${PORT}`);
        });
    } catch (error) {
        console.error("Falha ao iniciar o servidor:", error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    console.log('Recebido SIGINT. Fechando conexão com MongoDB...');
    await closeDB();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Recebido SIGTERM. Fechando conexão com MongoDB...');
    await closeDB();
    process.exit(0);
});

startServer();

