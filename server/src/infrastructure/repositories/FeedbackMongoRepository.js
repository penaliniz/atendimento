// server/src/infrastructure/repositories/FeedbackMongoRepository.js
const FeedbackRepository = require('../../application/repositories/FeedbackRepository');
const { getDB } = require('../database/mongodb');
const { ObjectId } = require('mongodb'); // Para trabalhar com IDs do MongoDB

class FeedbackMongoRepository extends FeedbackRepository {
  constructor() {
    super();
    this.collectionName = 'feedbacks'; // Nome da collection no MongoDB
  }

  async _getCollection() {
    const db = await getDB();
    return db.collection(this.collectionName);
  }

  async save(feedbackData) {
    try {
      const collection = await this._getCollection();
      const result = await collection.insertOne({
        ...feedbackData,
        createdAt: new Date() // Adiciona um timestamp de criação
      });

      // Retorna o documento inserido, incluindo o _id gerado pelo Mongo
      return {
        id: result.insertedId.toString(), // Converte ObjectId para string
        ...feedbackData,
        createdAt: result.ops && result.ops[0] ? result.ops[0].createdAt : new Date() // Pega a data exata se disponível
      };
    } catch (error) {
      console.error("[FeedbackMongoRepository] Erro ao salvar feedback:", error);
      // Log detalhado do erro pode ser útil aqui
      throw new Error("Falha ao salvar feedback no banco de dados.");
    }
  }

  async findAll() {
    try {
      const collection = await this._getCollection();
      const feedbacks = await collection.find({}).sort({ createdAt: -1 }).toArray(); // Ordena pelos mais recentes

      // Mapeia _id para id (string) para consistência
      return feedbacks.map(fb => ({
        id: fb._id.toString(),
        pdv_id: fb.pdv_id,
        input_raw: fb.input_raw,
        categoria: fb.categoria,
        transaction_details: fb.transaction_details,
        timestamp: fb.timestamp, // Mantém o timestamp original se já existia
        createdAt: fb.createdAt
      }));
    } catch (error) {
      console.error("[FeedbackMongoRepository] Erro ao buscar feedbacks:", error);
      throw new Error("Falha ao buscar feedbacks do banco de dados.");
    }
  }
}

module.exports = FeedbackMongoRepository;