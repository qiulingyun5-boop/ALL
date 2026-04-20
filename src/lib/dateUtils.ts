
/**
 * Returns the local date string in YYYY-MM-DD format.
 */
export const getLocalDateString = (date: Date | number = new Date()): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
