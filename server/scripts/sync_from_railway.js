const { Pool } = require('pg');

const railwayPool = new Pool({
  host: 'switchback.proxy.rlwy.net',
  port: 49397,
  user: 'postgres',
  password: 'nYLthDJRRkBcaTiIwsmCMsbkkJGMVlIy',
  database: 'railway',
  ssl: { rejectUnauthorized: false }
});

const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'hi2u_Postgres',
  database: 'cardfiner'
});

const MISSING_CARD_IDS = [12, 15, 16, 17, 18, 19];

async function buildCategoryMap() {
  // Map Railway category_id → local category_id by matching slugs
  const [railwayCats, localCats] = await Promise.all([
    railwayPool.query('SELECT id, slug FROM categories'),
    localPool.query('SELECT id, slug FROM categories'),
  ]);

  const localBySlug = {};
  for (const row of localCats.rows) localBySlug[row.slug] = row.id;

  const map = {};
  for (const row of railwayCats.rows) {
    if (localBySlug[row.slug] !== undefined) {
      map[row.id] = localBySlug[row.slug];
    } else {
      console.warn(`  WARNING: Railway category slug '${row.slug}' (id ${row.id}) has no local match — rates using it will be skipped`);
    }
  }

  console.log('Category ID mapping (Railway → Local):');
  for (const [rId, lId] of Object.entries(map)) {
    const slug = railwayCats.rows.find(r => r.id == rId)?.slug;
    console.log(`  ${rId} (${slug}) → ${lId}`);
  }

  return map;
}

async function syncCard(cardId, categoryMap) {
  console.log(`\nSyncing card ID ${cardId}...`);

  // --- Card row ---
  const cardRes = await railwayPool.query('SELECT * FROM cards WHERE id = $1', [cardId]);
  if (!cardRes.rows.length) {
    console.log(`  Not found on Railway, skipping`);
    return;
  }

  const card = cardRes.rows[0];
  const cardCols = Object.keys(card);
  const cardVals = cardCols.map((_, i) => `$${i + 1}`);

  await localPool.query(
    `INSERT INTO cards (${cardCols.join(',')}) VALUES (${cardVals.join(',')}) ON CONFLICT (id) DO NOTHING`,
    cardCols.map(c => card[c])
  );
  console.log(`  Card row inserted: "${card.name}"`);

  // --- card_rates (map category IDs) ---
  const ratesRes = await railwayPool.query('SELECT * FROM card_rates WHERE card_id = $1', [cardId]);
  let ratesInserted = 0;
  let ratesSkipped = 0;

  for (const rate of ratesRes.rows) {
    const localCatId = categoryMap[rate.category_id];
    if (localCatId === undefined) {
      console.warn(`    Skipping rate: no local category for Railway category_id ${rate.category_id}`);
      ratesSkipped++;
      continue;
    }

    const rateRow = { ...rate, category_id: localCatId };
    // id is from Railway sequence — omit it so local sequence assigns a new one
    delete rateRow.id;

    const rCols = Object.keys(rateRow);
    const rVals = rCols.map((_, i) => `$${i + 1}`);

    await localPool.query(
      `INSERT INTO card_rates (${rCols.join(',')}) VALUES (${rVals.join(',')})`,
      rCols.map(c => rateRow[c])
    );
    ratesInserted++;
  }
  console.log(`  Rates: ${ratesInserted} inserted, ${ratesSkipped} skipped`);

  // --- card_hide_rules ---
  const rulesRes = await railwayPool.query('SELECT * FROM card_hide_rules WHERE card_id = $1', [cardId]);
  let rulesInserted = 0;

  for (const rule of rulesRes.rows) {
    const ruleRow = { ...rule };
    delete ruleRow.id; // let local sequence assign

    const rCols = Object.keys(ruleRow);
    const rVals = rCols.map((_, i) => `$${i + 1}`);

    await localPool.query(
      `INSERT INTO card_hide_rules (${rCols.join(',')}) VALUES (${rVals.join(',')})`,
      rCols.map(c => ruleRow[c])
    );
    rulesInserted++;
  }
  console.log(`  Hide rules: ${rulesInserted} inserted`);
}

async function resetSequences() {
  await localPool.query("SELECT setval('cards_id_seq', (SELECT MAX(id) FROM cards))");
  await localPool.query("SELECT setval('card_rates_id_seq', (SELECT MAX(id) FROM card_rates))");
  await localPool.query("SELECT setval('card_hide_rules_id_seq', (SELECT MAX(id) FROM card_hide_rules))");
  await localPool.query("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))");
  console.log('\nSequences reset to current MAX ids');
}

async function sync() {
  console.log('=== Sync: Railway → Local ===\n');

  const categoryMap = await buildCategoryMap();

  for (const cardId of MISSING_CARD_IDS) {
    await syncCard(cardId, categoryMap);
  }

  await resetSequences();

  console.log('\n=== Sync complete ===');
  await railwayPool.end();
  await localPool.end();
}

sync().catch(err => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
