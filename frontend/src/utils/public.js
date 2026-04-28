export const getDeliveryDate = (days = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};