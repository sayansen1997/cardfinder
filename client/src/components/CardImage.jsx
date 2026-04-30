const COLOR_MAP = {
  ADCB: '#1A3C5E',
  'Dubai First': '#0F4C2A',
  'Emirates NBD': '#8B2020',
  'HSBC UAE': '#C41E3A',
  'Liv. (Emirates NBD)': '#4B3B8C',
  Rakbank: '#CC2200',
};

export default function CardImage({ card, height = 140 }) {
  const h = typeof height === 'number' ? `${height}px` : height;

  if (card.image_url) {
    return (
      <img
        src={card.image_url}
        alt={card.name}
        style={{
          width: '100%',
          height: h,
          objectFit: 'cover',
          borderRadius: '8px',
          display: 'block',
        }}
      />
    );
  }

  const bankColor = COLOR_MAP[card.bank] || '#1A3C5E';
  const initials = card.bank
    ? card.bank.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase()
    : 'CC';

  return (
    <div
      style={{
        width: '100%',
        height: h,
        background: `linear-gradient(135deg, ${bankColor}, ${bankColor}dd)`,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'Manrope, sans-serif',
        fontSize: '24px',
        fontWeight: 800,
        letterSpacing: '0.05em',
      }}
    >
      {initials}
    </div>
  );
}
