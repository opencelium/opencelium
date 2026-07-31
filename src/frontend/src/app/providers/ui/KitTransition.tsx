import { motion, AnimatePresence } from 'framer-motion';
import { useUISystem } from '@shared/theme/hooks/useUISystem';

export const KitTransition = ({ children }) => {
    const { system } = useUISystem();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={system}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};
