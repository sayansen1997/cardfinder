/**
 * calculateRankings
 * @param {Object} spendingInputs  - { category_name: monthlyAED, ... }
 * @param {Array}  cards           - card objects from API (each has .rates array and .annual_fee)
 * @returns {Array} cards sorted by net annual savings descending, each with cashbackByCategory and netAnnualSavings
 */
export function calculateRankings(spendingInputs, cards) {
  return cards
    .map((card) => {
      const cashbackByCategory = {};
      let totalAnnualCashback = 0;

      (card.rates || []).forEach((rate) => {
        const monthlySpend = parseFloat(spendingInputs[rate.category_name] || 0);
        const cashbackRate = parseFloat(rate.cashback_rate);
        const monthlyCap = parseFloat(rate.monthly_cap);

        const monthlyCashback = Math.min(monthlySpend * cashbackRate, monthlyCap);
        const annualCashback = monthlyCashback * 12;

        cashbackByCategory[rate.category_name] = {
          monthly: monthlyCashback,
          annual: annualCashback,
          rate: cashbackRate,
          cap: monthlyCap,
        };
        totalAnnualCashback += annualCashback;
      });

      const annualFee = parseFloat(card.annual_fee || 0);
      const netAnnualSavings = totalAnnualCashback - annualFee;

      return {
        ...card,
        cashbackByCategory,
        totalAnnualCashback,
        netAnnualSavings,
      };
    })
    .sort((a, b) => b.netAnnualSavings - a.netAnnualSavings);
}
