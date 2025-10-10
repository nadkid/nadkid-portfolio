import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CartIcon = ({ cart, onClick, theme, isExpanded, positioned = true }) => {
  const { itemCount } = cart;

  const cartIconByTheme = {
    persimmon: "/shapes/NavIcons/Navarrow_Persimmon.svg",
    matcha: "/shapes/NavIcons/Navarrow_Matcha.svg",
    glacier: "/shapes/NavIcons/Navarrow_Glacier.svg"
  };

  return (
    <motion.button
      className={`${positioned ? 'fixed top-4 right-4' : ''} flex items-center justify-center w-12 h-12 hover:scale-110 transition-all duration-200 ${positioned && isExpanded ? 'z-40' : positioned ? 'z-50' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Shopping cart (${itemCount} items)`}
    >
      <div className="relative">
        {/* Cart Icon from SVG file */}
        <img
          src="/shapes/NavIcons/CartIcon.svg"
          alt="Cart"
          className="w-6 h-6"
        />

        {/* Item count badge */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

export default CartIcon;
