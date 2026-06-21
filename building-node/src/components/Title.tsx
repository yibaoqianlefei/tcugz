import { motion as fm } from "framer-motion";
import { colors, typography } from "../data/tokens";

export default function Title() {
  const text = "建筑构造";

  return (
    <div>
      <fm.h1
        style={{
          fontFamily: typography.font.display,
          fontSize: 42,
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: -0.5,
          color: colors.ink,
        }}
      >
        {text.split("").map((char, i) => (
          <fm.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: i * 0.06,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
          >
            {char}
          </fm.span>
        ))}
      </fm.h1>

      {/* Coral baseline accent */}
      <div
        style={{
          color: colors.primary,
          marginTop: -4,
          fontSize: 16,
          fontFamily: typography.font.display,
          letterSpacing: 4,
        }}
      >
        ───
      </div>
    </div>
  );
}
