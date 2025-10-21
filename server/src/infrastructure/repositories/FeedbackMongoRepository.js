// server/src/infrastructure/repositories/FeedbackMongoRepository.js
const FeedbackRepository = require('../../application/repositories/FeedbackRepository');
const { getDB } = require('../database/mongodb'); //
const { ObjectId } = require('mongodb');

class FeedbackMongoRepository extends FeedbackRepository {
  constructor() {
    super();
    this.collectionName = 'feedbacks'; // Nome da collection no MongoDB
  }

  async _getCollection() {
    const db = await getDB(); //
    return db.collection(this.collectionName); //
  }

  async save(feedbackData) {
    // Adiciona logs para depuração (mantidos da sugestão anterior)
    console.log("[FeedbackMongoRepository save] Iniciando save...");
    try {
      const collection = await this._getCollection();
      console.log("[FeedbackMongoRepository save] Obtida collection:", this.collectionName);

      // Adiciona o timestamp de criação ANTES de inserir
      const dataToInsert = {
        ...feedbackData,
        createdAt: new Date()
      };
      console.log("[FeedbackMongoRepository save] Dados para inserir:", dataToInsert);

      const result = await collection.insertOne(dataToInsert);
      console.log("[FeedbackMongoRepository save] Resultado da inserção:", result);

      // --- CORREÇÃO APLICADA AQUI ---
      // Monta a resposta usando o ID inserido e os dados que tentamos inserir
      const savedDoc = {
        id: result.insertedId.toString(), // Converte ObjectId para string
        ...dataToInsert // Já inclui o createdAt que definimos
      };
      // ---------------------

      console.log("[FeedbackMongoRepository save] Documento inserido (formatado):", savedDoc);
      return savedDoc; // Retorna o objeto corrigido

    } catch (error) {
      console.error("[FeedbackMongoRepository save] Erro durante a inserção:", error);
      // Re-lança o erro para ser tratado pela camada superior (server.js)
      throw new Error("Falha ao salvar feedback no banco de dados.");
    }
  }

  async findAll() {
    console.log("[FeedbackMongoRepository findAll] Buscando todos os feedbacks...");
    try {
      const collection = await this._getCollection();
      const feedbacks = await collection.find({}).sort({ createdAt: -1 }).toArray();
      console.log(`[FeedbackMongoRepository findAll] Encontrados ${feedbacks.length} feedbacks.`);

      // Mapeia _id para id (string) para consistência
      return feedbacks.map(fb => ({
        id: fb._id.toString(),
        pdv_id: fb.pdv_id,
        input_raw: fb.input_raw,
        categoria: fb.categoria,
        transaction_details: fb.transaction_details,
        timestamp: fb.timestamp,
        createdAt: fb.createdAt
      }));
    } catch (error) {
      console.error("[FeedbackMongoRepository findAll] Erro ao buscar feedbacks:", error);
      throw new Error("Falha ao buscar feedbacks do banco de dados.");
    }
  }
}

module.exports = FeedbackMongoRepository;