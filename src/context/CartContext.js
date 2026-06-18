import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const CartContext = createContext();

const API_BASE_URL = `${API_URL}/api/cart`;

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    if (token && user && user.role === 'buyer') {
      fetchCart();
    } else {
      setCart({ items: [] });
    }
  }, [token, user]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(API_BASE_URL);
      setCart(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const addToCart = async (product) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/add`, {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        seller: product.seller
      });
      setCart(res.data);
    } catch (err) {
      console.error('Error adding to cart:', err);
      throw new Error(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/update`, {
        productId,
        quantity
      });
      setCart(res.data);
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const toggleSaveForLater = async (productId, savedForLater) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/update`, {
        productId,
        savedForLater
      });
      setCart(res.data);
    } catch (err) {
      console.error('Error saving item for later:', err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/remove/${productId}`);
      setCart(res.data);
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/clear`);
      setCart(res.data);
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  return (
    <CartContext.Provider value={{
      cart,
      fetchCart,
      addToCart,
      updateQuantity,
      toggleSaveForLater,
      removeFromCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
