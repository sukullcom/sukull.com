import { create } from "zustand"

type CompletionModalState = {
    isOpen: boolean
    points: number
    open: (points: number) => void
    close: () => void
}

export const useCompletionModal = create<CompletionModalState>((set) => ({
    isOpen: false,
    points: 0,
    open: (points: number) => set({ isOpen: true, points }),
    close: () => set({ isOpen: false, points: 0 })
})) 