'use client';

import { useState, useEffect } from 'react';

interface FavoriteVehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  addedAt: Date;
}

export function useGuestFavorites() {
  const [favorites, setFavorites] = useState<FavoriteVehicle[]>([]);

  useEffect(() => {
    // Load favorites from localStorage
    const stored = localStorage.getItem('guestFavorites');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFavorites(parsed.map((fav: any) => ({
          ...fav,
          addedAt: new Date(fav.addedAt)
        })));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }
  }, []);

  const addFavorite = (vehicle: Omit<FavoriteVehicle, 'addedAt'>) => {
    const newFavorite = { ...vehicle, addedAt: new Date() };
    const updated = [...favorites, newFavorite];
    setFavorites(updated);
    localStorage.setItem('guestFavorites', JSON.stringify(updated));
    return true;
  };

  const removeFavorite = (vehicleId: number) => {
    const updated = favorites.filter(fav => fav.id !== vehicleId);
    setFavorites(updated);
    localStorage.setItem('guestFavorites', JSON.stringify(updated));
    return true;
  };

  const isFavorite = (vehicleId: number) => {
    return favorites.some(fav => fav.id === vehicleId);
  };

  const toggleFavorite = (vehicle: Omit<FavoriteVehicle, 'addedAt'>) => {
    if (isFavorite(vehicle.id)) {
      return removeFavorite(vehicle.id);
    } else {
      return addFavorite(vehicle);
    }
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('guestFavorites');
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    favoritesCount: favorites.length
  };
}
