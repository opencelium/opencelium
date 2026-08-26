import { create } from 'zustand';

type TestRunModePromptState = {
	isOpen: boolean;
	setOpen: (isOpen: boolean) => void;
};

// The mode dialog talks about the logs header's Live toggle ("you can switch to
// live mode at any time"), so the header highlights that toggle while the
// dialog is up — the two live in different subtrees (a globally hosted dialog
// vs. the logs panel), hence a store rather than a prop. Owned by the dialog
// content itself, set on mount and cleared on unmount, so closing it with the
// × can't leave the highlight stuck on.
export const useTestRunModePromptStore = create<TestRunModePromptState>((set) => ({
	isOpen: false,
	setOpen: (isOpen) => set({ isOpen }),
}));
