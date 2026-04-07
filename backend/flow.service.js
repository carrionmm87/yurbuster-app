const axios = require('axios');
const crypto = require('crypto');

class FlowService {
  constructor() {
    this.apiKey = process.env.FLOW_API_KEY;
    this.secret = process.env.FLOW_SECRET_KEY;
    this.apiUrl = process.env.FLOW_API_URL;
  }

  /**
   * Generates the HMAC SHA256 signature required by Flow
   * @param {Object} params - The parameters to sign
   * @returns {string} - The signature
   */
  sign(params) {
    const keys = Object.keys(params).sort();
    let signatureString = '';
    
    keys.forEach(key => {
      signatureString += `${key}${params[key]}`;
    });

    return crypto
      .createHmac('sha256', this.secret)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Creates a payment order in Flow
   * @param {Object} orderData - { commerceOrder, subject, amount, email, urlConfirmation, urlReturn }
   */
  async createPayment(orderData) {
    const params = {
      apiKey: this.apiKey,
      ...orderData
    };

    params.s = this.sign(params);

    try {
      const response = await axios.post(`${this.apiUrl}/payment/create`, new URLSearchParams(params).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Flow API Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Error al comunicarse con Flow");
    }
  }

  /**
   * Gets the status of a payment using the token
   * @param {string} token 
   */
  async getStatus(token) {
    const params = {
      apiKey: this.apiKey,
      token: token
    };

    params.s = this.sign(params);

    try {
      const response = await axios.get(`${this.apiUrl}/payment/getStatus`, { params });
      return response.data;
    } catch (error) {
      console.error("Flow Status Error:", error.response?.data || error.message);
      throw new Error("Error al obtener estado en Flow");
    }
  }
}

module.exports = new FlowService();
