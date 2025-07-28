import { create } from 'zustand';
import { User, Property, UserPriority, UserRating } from '../types';

interface AppState {
  user: User | null;
  properties: Property[];
  priorities: UserPriority[];
  ratings: UserRating[];
  setUser: (user: User | null) => void;
  setProperties: (properties: Property[]) => void;
  setPriorities: (priorities: UserPriority[]) => void;
  setRatings: (ratings: UserRating[]) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  properties: [],
  priorities: [],
  ratings: [],
  setUser: (user) => set({ user }),
  setProperties: (properties) => set({ properties }),
  setPriorities: (priorities) => set({ priorities }),
  setRatings: (ratings) => set({ ratings }),
}));