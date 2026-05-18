export const CARD_CATEGORY_FILTERS = [
  {
    id: 'groceries',
    label: 'Best for Groceries',
    matches: (card) => {
      const r = (card.rates || []).find((r) => r.category_slug === 'groceries');
      return r && Number(r.cashback_rate) >= 0.03;
    },
    sortBy: (a, b) => {
      const aRate = (a.rates || []).find((r) => r.category_slug === 'groceries')?.cashback_rate || 0;
      const bRate = (b.rates || []).find((r) => r.category_slug === 'groceries')?.cashback_rate || 0;
      return Number(bRate) - Number(aRate);
    },
  },
  {
    id: 'family',
    label: 'Everyday Family Saver',
    matches: (card) => Number(card.annual_fee) === 0,
    sortBy: (a, b) => {
      const getRateSum = (card) => {
        const slugs = ['groceries', 'dining', 'utilities'];
        return slugs.reduce((sum, slug) => {
          const r = (card.rates || []).find((r) => r.category_slug === slug);
          return sum + Number(r?.cashback_rate || 0);
        }, 0);
      };
      return getRateSum(b) - getRateSum(a);
    },
  },
  {
    id: 'travel',
    label: 'Travel',
    matches: (card) => card.card_category === 'travel' || card.card_category === 'miles',
    sortBy: (a, b) => {
      const aRate = (a.rates || []).find((r) => r.category_slug === 'travel')?.cashback_rate || 0;
      const bRate = (b.rates || []).find((r) => r.category_slug === 'travel')?.cashback_rate || 0;
      return Number(bRate) - Number(aRate);
    },
  },
  {
    id: 'premium',
    label: 'Premium Lifestyle',
    matches: (card) => Number(card.annual_fee) >= 500,
    sortBy: (a, b) => {
      const getRateSum = (card) => {
        const slugs = ['dining', 'shopping', 'travel'];
        return slugs.reduce((sum, slug) => {
          const r = (card.rates || []).find((r) => r.category_slug === slug);
          return sum + Number(r?.cashback_rate || 0);
        }, 0);
      };
      return getRateSum(b) - getRateSum(a);
    },
  },
  {
    id: 'minimalist',
    label: 'Minimalist Cards',
    matches: (card) => Number(card.annual_fee) === 0 && Number(card.min_salary) <= 5000,
    sortBy: (a, b) => Number(a.min_salary) - Number(b.min_salary),
  },
];

export const getCardsForCategory = (allCards, categoryId, limit = null) => {
  const filter = CARD_CATEGORY_FILTERS.find((f) => f.id === categoryId);
  if (!filter) return allCards;

  let filtered = allCards.filter(filter.matches);
  if (filter.sortBy) filtered = [...filtered].sort(filter.sortBy);
  if (limit) filtered = filtered.slice(0, limit);

  return filtered;
};
