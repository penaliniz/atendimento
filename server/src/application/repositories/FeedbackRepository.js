// server/src/application/repositories/FeedbackRepository.js

class FeedbackRepository {
  /**
   * Salva um novo registro de feedback.
   * @param {object} feedbackData - Os dados do feedback a serem salvos.
   * @returns {Promise<object>} O feedback salvo (com ID, etc.).
   */
  async save(feedbackData) {
    throw new Error("Método 'save' não implementado.");
  }

  /**
   * Busca todos os registros de feedback (agora depreciado em favor de findByCriteria).
   * @returns {Promise<Array<object>>} Uma lista de todos os feedbacks.
   * @deprecated Usar findByCriteria({}) em vez disso.
   */
  async findAll() {
    throw new Error("Método 'findAll' não implementado.");
  }

  /**
   * Busca registros de feedback por NSU (agora depreciado em favor de findByCriteria).
   * @param {string} nsu - O NSU a ser pesquisado dentro de transaction_details.
   * @returns {Promise<Array<object>>} Uma lista de feedbacks que correspondem ao NSU.
   * @deprecated Usar findByCriteria({ nsu: 'valor' }) em vez disso.
   */
  async findByNsu(nsu) {
    throw new Error("Método 'findByNsu' não implementado.");
  }

  /**
   * Busca registros de feedback com base em múltiplos critérios.
   * @param {object} criteria - Um objeto com os critérios de busca (ex: { loja: '123', data: '20251021', nsu: '456', pdv: '01', pdvId: 'XYZ' }).
   * @returns {Promise<Array<object>>} Uma lista de feedbacks que correspondem aos critérios.
   */
  async findByCriteria(criteria) {
      throw new Error("Método 'findByCriteria' não implementado.");
  }
}

module.exports = FeedbackRepository;