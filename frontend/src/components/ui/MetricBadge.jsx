import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export default function MetricBadge({ value = 0, prefix = "", decimals = 0 }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) =>
    `${prefix}${Number(latest).toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`
  );

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.1, ease: "easeOut" });
    return controls.stop;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <motion.span>{rounded}</motion.span>;
}
