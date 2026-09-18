// One slot per topic at small sizes; aggregate larger plans into at most ten dots.
export function socialDotScale(topicCount, outputCount, maxDots = 10) {
  const total = Math.max(0, Math.floor(topicCount));
  const count = Math.min(total, Math.max(0, outputCount));
  const unit = Math.max(1, Math.ceil(total / maxDots));
  return {
    unit,
    fills: Array.from({ length: Math.ceil(total / unit) }, (_, index) => {
      const start = index * unit;
      const capacity = Math.min(unit, total - start);
      return Math.min(1, Math.max(0, (count - start) / capacity));
    }),
  };
}
