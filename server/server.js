// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega variáveis de ambiente do .env

// Importações da nossa arquitetura
const { connectDB, closeDB } = require('./src/infrastructure/database/mongodb'); // Ajuste o caminho se necessário
const FeedbackMongoRepository = require('./src/infrastructure/repositories/FeedbackMongoRepository'); // Ajuste o caminho

const app = express();
const PORT = process.env.PORT || 3000; // Use variável de ambiente para a porta

// Middlewares (mantidos)
app.use(cors());
app.use(express.json());

// Middlewares de Segurança (mantidos)
function requireApiKey(req, res, next) {
    // ... (código mantido)
}
// ... (Rate Limiter mantido)

// --- Instancia o Repositório ---
const feedbackRepository = new FeedbackMongoRepository();
// -----------------------------

// Endpoint POST /api/feedback - MODIFICADO para usar o repositório
app.post('/api/feedback', requireApiKey, /* rateLimiter, */ async (req, res, next) => { // Removi rateLimiter temporariamente para teste, pode adicionar de volta
    try {
        const { pdv_id, input_raw, transaction_details } = req.body;

        if (!pdv_id || !input_raw) {
            return res.status(400).json({ error: 'pdv_id e input_raw são obrigatórios' });
        }

        // Mapeamento de categoria (mantido)
        let categoria = 'Não Definida';
         switch (input_raw.toUpperCase()) {
             case 'VERYGOOD': categoria = 'Gostei de tudo'; break;
             case 'GOOD':     categoria = 'Ambiente'; break;
             case 'FAIR':     categoria = 'Preço'; break;
             case 'POOR':     categoria = 'Atendimento'; break;
             case 'VERYPOOR': categoria = 'Tempo de Espera'; break;
         }

        // Cria o objeto de dados para salvar
        const feedbackData = {
            timestamp: new Date().toISOString(), // Pode usar o timestamp que vem do agent se preferir
            pdv_id: pdv_id,
            input_raw: input_raw,
            categoria: categoria,
            transaction_details: transaction_details || null
        };

        // --- USA O REPOSITÓRIO PARA SALVAR ---
        const savedFeedback = await feedbackRepository.save(feedbackData);
        // ------------------------------------

        console.log('Feedback recebido e salvo no MongoDB:', savedFeedback);
        res.status(201).json({ message: 'Feedback recebido com sucesso!', data: savedFeedback });

    } catch (error) {
         console.error("Erro no endpoint /api/feedback (POST):", error);
         // Passa o erro para um middleware de tratamento de erros, se houver
         next(error); // Ou envia uma resposta de erro genérica
        // res.status(500).json({ error: "Erro interno ao processar o feedback." });
    }
});

// Endpoint GET /api/feedback - MODIFICADO para usar o repositório
app.get('/api/feedback', async (req, res, next) => {
    try {
        // --- USA O REPOSITÓRIO PARA BUSCAR ---
        const allFeedbacks = await feedbackRepository.findAll();
        // -----------------------------------
        res.json(allFeedbacks);
    } catch (error) {
        console.error("Erro no endpoint /api/feedback (GET):", error);
        next(error); // Ou envia uma resposta de erro genérica
        // res.status(500).json({ error: "Erro interno ao buscar feedbacks." });
    }
});

// Middleware genérico de tratamento de erros (opcional, mas recomendado)
app.use((err, req, res, next) => {
  console.error("Erro não tratado:", err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor.'
  });
});


// Função para iniciar o servidor
async function startServer() {
    try {
        await connectDB(); // Conecta ao banco ANTES de iniciar o servidor
        app.listen(PORT, () => {
            console.log('--- Servidor de Feedback Iniciado ---');
            console.log(`Conectado ao MongoDB (${process.env.MONGODB_DB_NAME})`);
            console.log(`API rodando na porta ${PORT}`);
            console.log(`Endpoint de recebimento: http://localhost:${PORT}/api/feedback (POST)`);
            console.log(`Endpoint de visualização: http://localhost:${PORT}/api/feedback (GET)`);
        });
    } catch (error) {
        console.error("Falha ao iniciar o servidor:", error);
        process.exit(1);
    }
}

// Lida com o encerramento gracioso
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

// Inicia o servidor
startServer();