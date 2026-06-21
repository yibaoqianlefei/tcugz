import { motion } from "framer-motion";

export default function Title() {
  const text = "建筑构造";

  return (
    <div>
      <motion.h1 style={{ fontSize: 38, fontFamily: "serif" }}>
        {text.split("").map((char, i) => (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: i * 0.05,
              type: "spring",
            }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h1>

      <div style={{ color: "#FF6B5A", marginTop: -8 }}>───</div>
    </div>
  );
}
