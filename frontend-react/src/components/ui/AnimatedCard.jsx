import { motion } from "framer-motion";

export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function AnimatedCard({ children, className = "", hover = true, ...rest }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={hover ? { y: -4, boxShadow: "0 0 28px rgba(0,212,255,0.18)" } : undefined}
      className={`glass rounded-2xl p-5 ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
