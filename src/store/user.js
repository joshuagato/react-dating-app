import { create } from "zustand";

export const useUser = create((set) => ({
    user: {},
    setUser: userData => set({ user: userData }), 
    updateUser: (newUser) => set({ user: newUser }),
}));