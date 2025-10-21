// server/src/application/repositories/FeedbackRepository.js

class FeedbackRepository {
    /**
     * Salva um novo registro de feedback.
     * @param {object} feedbackData - Os dados do feedback a serem salvos.
     * @returns {Promise<object>} O feedback salvo (com ID, etc.).
     * @throws {Error} Se ocorrer um erro ao salvar.
     */
    async save(feedbackData) {
      throw new Error("Método 'save' não implementado.");
    }
  
    /**
     * Busca todos os registros de feedback.
     * @returns {Promise<Array<object>>} Uma lista de todos os feedbacks.
     * @throws {Error} Se ocorrer um erro ao buscar.
     */
    async findAll() {
      throw new Error("Método 'findAll' não implementado.");
    }
  
    // Outros métodos podem ser definidos aqui (findById, findByPdvId, etc.)
  }
  
  module.exports = FeedbackRepository;