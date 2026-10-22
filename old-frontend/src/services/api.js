const BASE_URL = 'https://webstore-ryo9.onrender.com/api';

export const api = {
  async getShops() {
    try {
      const response = await fetch(`${BASE_URL}/shops`);
      const data = await response.json();
      return data.allShops || [];
    } catch (error) {
      console.error("Error fetching shops:", error.message);
      return [];
    }
  },

  async getShopById(id) {
    try {
      const response = await fetch(`${BASE_URL}/shops/${id}`);
      const data = await response.json();
      return data.shop || null;
    } catch (error) {
      console.error(`Error fetching shop ${id}:`, error.message);
      return null;
    }
  },

  async getProducts() {
    try {
      const response = await fetch(`${BASE_URL}/products`);
      const data = await response.json();
      return data.getAllProducts || [];
    } catch (error) {
      console.error("Error fetching products:", error.message);
      return [];
    }
  },

  async getProductById(id) {
    try {
      const response = await fetch(`${BASE_URL}/products/${id}`);
      const data = await response.json();
      return data.product || null;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error.message);
      return null;
    }
  },

  async getProductImages(id) {
    try {
      const response = await fetch(`${BASE_URL}/products/${id}/images`);
      const data = await response.json();
      return data.images || [];
    } catch (error) {
      console.error(`Error fetching images for product ${id}:`, error.message);
      return [];
    }
  },

  async getProductImage(id) {
    try {
      const response = await fetch(`${BASE_URL}/products/${id}/image`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching image for product ${id}:`, error.message);
      return null;
    }
  }
};
