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
    // ... (código do save existente - sem alterações) ...
    console.log("[FeedbackMongoRepository save] Iniciando save...");
    try {
      const collection = await this._getCollection();
      console.log("[FeedbackMongoRepository save] Obtida collection:", this.collectionName);

      const dataToInsert = {
        ...feedbackData,
        createdAt: new Date()
      };
      console.log("[FeedbackMongoRepository save] Dados para inserir:", dataToInsert);

      const result = await collection.insertOne(dataToInsert);
      console.log("[FeedbackMongoRepository save] Resultado da inserção:", result);

      const savedDoc = {
        id: result.insertedId.toString(),
        ...dataToInsert
      };

      console.log("[FeedbackMongoRepository save] Documento inserido (formatado):", savedDoc);
      return savedDoc;

    } catch (error) {
      console.error("[FeedbackMongoRepository save] Erro durante a inserção:", error);
      throw new Error("Falha ao salvar feedback no banco de dados.");
    }
  }

  // --- NOVO MÉTODO findByCriteria ---
  async findByCriteria(criteria) {
    console.log("[FeedbackMongoRepository findByCriteria] Buscando feedbacks com critérios:", criteria);
    try {
      const collection = await this._getCollection();
      const query = {};

      // Construção da query baseada nos critérios recebidos
      if (criteria.loja) {
        // Acessa o campo aninhado 'Loja' dentro de 'transaction_details'
        query['transaction_details.Loja'] = criteria.loja;
      }
      if (criteria.data) {
        // Acessa o campo aninhado 'Data' dentro de 'transaction_details'
        // Considerar ajustar para busca por range de datas se necessário
        query['transaction_details.Data'] = criteria.data;
      }
      if (criteria.nsu) {
         // Acessa o campo aninhado 'NSU' dentro de 'transaction_details'
        query['transaction_details.NSU'] = criteria.nsu;
      }
      if (criteria.pdv) {
        // Acessa o campo aninhado 'PDV' dentro de 'transaction_details' OU o campo pdv_id principal
        // Decida qual campo usar ou use $or se puder ser um dos dois
        // Exemplo usando o campo dentro de transaction_details:
        query['transaction_details.PDV'] = criteria.pdv;
        // Exemplo usando o campo pdv_id principal (descomente se for o caso):
        // query['pdv_id'] = criteria.pdv;
        // Exemplo usando $or para buscar em ambos (descomente se for o caso):
        /*
        query['$or'] = [
            { 'transaction_details.PDV': criteria.pdv },
            { 'pdv_id': criteria.pdv }
        ];
        */
      }

      console.log("[FeedbackMongoRepository findByCriteria] Query MongoDB:", query);

      const feedbacks = await collection.find(query).sort({ createdAt: -1 }).toArray();
      console.log(`[FeedbackMongoRepository findByCriteria] Encontrados ${feedbacks.length} feedbacks.`);

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
      console.error("[FeedbackMongoRepository findByCriteria] Erro ao buscar feedbacks:", error);
      throw new Error("Falha ao buscar feedbacks do banco de dados com critérios.");
    }
  }
  // --- FIM NOVO MÉTODO ---


  // --- MÉTODO findAll AGORA USA findByCriteria ---
  async findAll() {
      console.log("[FeedbackMongoRepository findAll] Chamando findByCriteria sem critérios...");
      // Reutiliza o findByCriteria sem passar nenhum critério para buscar todos
      return this.findByCriteria({});
  }
  // --- FIM MÉTODO findAll ---
}

module.exports = FeedbackMongoRepository;