const pool = require('../db');

const SUPPORTED_RULE_TYPES = {
  category_sum_below: (config, user) => {
    const sum = (config.categories || []).reduce((acc, cat) =>
      acc + (Number(user.spending[cat]) || 0), 0);
    return sum < Number(config.threshold);
  },

  category_sum_above: (config, user) => {
    const sum = (config.categories || []).reduce((acc, cat) =>
      acc + (Number(user.spending[cat]) || 0), 0);
    return sum > Number(config.threshold);
  },

  total_spend_below: (config, user) => {
    const total = Object.values(user.spending || {})
      .reduce((a, b) => a + (Number(b) || 0), 0);
    return total < Number(config.threshold);
  },

  total_spend_above: (config, user) => {
    const total = Object.values(user.spending || {})
      .reduce((a, b) => a + (Number(b) || 0), 0);
    return total > Number(config.threshold);
  },

  total_spend_range: (config, user) => {
    const total = Object.values(user.spending || {})
      .reduce((a, b) => a + (Number(b) || 0), 0);
    return total < Number(config.min) || total > Number(config.max);
  },

  age_above: (config, user) => {
    if (!user.date_of_birth) return false;
    const dob = new Date(user.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age > Number(config.threshold);
  },

  age_below: (config, user) => {
    if (!user.date_of_birth) return false;
    const dob = new Date(user.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    return age < Number(config.threshold);
  },
};

async function getRulesForCard(cardId) {
  const result = await pool.query(
    'SELECT id, rule_type, rule_config, description FROM card_hide_rules WHERE card_id = $1',
    [cardId]
  );
  return result.rows;
}

async function isHardEligible(card, user) {
  const income = Number(user.income) || 0;
  if (income > 0 && card.min_salary && income < Number(card.min_salary)) {
    return {
      eligible: false,
      reason: `Minimum salary requirement: AED ${Number(card.min_salary).toLocaleString()}`,
    };
  }
  return { eligible: true, reason: null };
}

async function evaluateHideRules(card, user) {
  const income = Number(user.income) || 0;

  if (income > 0 && card.min_salary && income < Number(card.min_salary)) {
    return {
      hidden: true,
      reason: `Minimum salary requirement: AED ${Number(card.min_salary).toLocaleString()}`,
    };
  }

  const rules = await getRulesForCard(card.id);

  for (const rule of rules) {
    const evaluator = SUPPORTED_RULE_TYPES[rule.rule_type];
    if (!evaluator) {
      console.warn(`Unknown rule type: ${rule.rule_type}`);
      continue;
    }

    const config = typeof rule.rule_config === 'string'
      ? JSON.parse(rule.rule_config)
      : rule.rule_config;

    const shouldHide = evaluator(config, user, card);
    if (shouldHide) {
      return {
        hidden: true,
        reason: rule.description || 'Card not suitable for your profile',
      };
    }
  }

  return { hidden: false, reason: null };
}

module.exports = {
  isHardEligible,
  evaluateHideRules,
  getRulesForCard,
  SUPPORTED_RULE_TYPES: Object.keys(SUPPORTED_RULE_TYPES),
};
