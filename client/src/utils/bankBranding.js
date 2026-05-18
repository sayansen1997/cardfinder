export const BANK_COLORS = {
  'ADCB': '#0D1B2A',
  'Emirates NBD': '#8B0000',
  'HSBC': '#DB0011',
  'Dubai First': '#003C2D',
  'Liv': '#FFD100',
  'Rakbank': '#C8102E',
  'Emirates Islamic': '#003E2A',
  'Mashreq': '#FF6B35',
  'FAB': '#00284C',
  'Ajman Bank': '#005EB8',
  'Al Hilal Bank': '#0066B3',
  'CBD': '#003366',
  'ADIB': '#8B0000',
};

export const getBankColor = (bank) => BANK_COLORS[bank] || '#001A3D';

export const getBankInitials = (bank) => {
  if (!bank) return 'CC';
  const parts = bank.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return bank.substring(0, 2).toUpperCase();
};
