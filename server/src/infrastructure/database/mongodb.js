// server/src/infrastructure/database/mongodb.js
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'atendimentoDB'; // Use a variável de ambiente ou um default

if (!uri) {
  console.error("ERRO FATAL: Variável de ambiente MONGODB_URI não definida.");
  process.exit(1);
}

// Cria um cliente MongoClient com opções
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Recomendações de segurança e performance:
  maxPoolSize: 10, // Ajuste conforme a necessidade
  socketTimeoutMS: 45000, // Tempo limite para operações de socket
  connectTimeoutMS: 10000, // Tempo limite para conexão inicial
});

let dbInstance = null;

async function connectDB() {
  if (dbInstance) {
    return dbInstance;
  }
  try {
    console.log("[MongoDB] Conectando ao banco de dados...");
    await client.connect();
    console.log("[MongoDB] Conectado com sucesso ao servidor MongoDB Atlas!");
    dbInstance = client.db(dbName);

    // Opcional: Ping para confirmar a conexão
    await dbInstance.command({ ping: 1 });
    console.log("[MongoDB] Ping realizado com sucesso.");

    return dbInstance;
  } catch (err) {
    console.error("[MongoDB] Erro ao conectar ao banco de dados:", err);
    // Em produção, considere estratégias de retry ou notificação antes de sair
    process.exit(1); // Falha crítica se não conseguir conectar
  }
}

async function getDB() {
  if (!dbInstance) {
    throw new Error("A conexão com o banco de dados não foi inicializada. Chame connectDB primeiro.");
  }
  return dbInstance;
}

// Opcional: Função para fechar a conexão graciosamente
async function closeDB() {
    if (client) {
        await client.close();
        console.log("[MongoDB] Conexão com o banco de dados fechada.");
        dbInstance = null;
    }
}

module.exports = { connectDB, getDB, closeDB };