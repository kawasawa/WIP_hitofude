export const convertToBoolean = (value: string | null, defaultValue = true) =>
  defaultValue ? (value?.toLowerCase() === 'false' ? false : true) : value?.toLowerCase() === 'true' ? true : false;

export const convertToString = (value: boolean) => (value ? 'true' : 'false');

export const convertToNumber = (value: string | null, defaultValue: number) => {
  if (!value) return defaultValue;
  const n = Number(value);
  if (isNaN(n)) return defaultValue;
  return n;
};
