const fs = require('fs');
const path = require('path');

const outPath = path.join(__dirname, 'data.csv');

// Deterministic PRNG for reproducibility
let seed = 987654321;
function rand() {
  seed = (1103515245 * seed + 12345) % 0x80000000;
  return seed / 0x80000000;
}
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function choice(arr) { return arr[Math.floor(rand() * arr.length)]; }

// Metadata pools
const gameTitles = ["Aetherbound","Neon Armada","RuneHollow","GlyphQuest","MetroRaiders","Starwright"];
const platforms = ["PC","PS5","Xbox Series X","Switch","iOS","Android"];
const regions = ["NA","EU","APAC","LATAM","MEA"];
const countriesByRegion = {
  NA: ["USA","Canada","Mexico"],
  EU: ["UK","Germany","France","Spain","Poland"],
  APAC: ["Japan","South Korea","China","Australia","India"],
  LATAM: ["Brazil","Argentina","Chile","Colombia"],
  MEA: ["South Africa","Egypt","UAE","Israel"]
};
const genders = ["Male","Female","Non-binary","Prefer not to say"];
const segments = ["Casual","Core","Hardcore"];
const channels = ["Organic","UA - Ads","Influencer","Email","Partner","Referral"];
const deviceModels = ["Intel i7 PC","Ryzen 5 PC","PS5","XboxX","Switch OLED","iPhone 14","Samsung S21","Pixel 6"];
const osVersions = ["Windows 10","Windows 11","macOS 12","iOS 17","Android 13","PS5 OS","Xbox OS"];
const appVersions = ["1.0.0","1.0.1","1.1.0","1.2.0","1.3.5","2.0.0"];
const feedbackSnippets = {
  positive: ["Loving latest patch","Great new event","Game runs smooth","Fantastic balancing","Love the new skins"],
  neutral: ["Needs more content","UI could be clearer","Average experience","Waiting for new mode","Okay performance"],
  negative: ["Frequent crashes","Paywall is harsh","Matchmaking broken","Lag spikes","Toxic community"]
};

// Helpers for value generation influenced by segment
function segmentModifiers(seg) {
  if (seg === "Casual") return {playMin: 30, playMax: 300, sessionsMin: 1, sessionsMax: 7, spendProb: 0.06, spendMult: 0.6};
  if (seg === "Core") return {playMin: 300, playMax: 1500, sessionsMin: 5, sessionsMax: 20, spendProb: 0.2, spendMult: 1.2};
  return {playMin: 1500, playMax: 5000, sessionsMin: 15, sessionsMax: 40, spendProb: 0.45, spendMult: 2.5}; // Hardcore
}

// CSV header
const header = [
  "SnapshotDate",
  "PlayerID",
  "GameTitle",
  "Platform",
  "Region",
  "Country",
  "Age",
  "Gender",
  "PlayerSegment",
  "AcquisitionChannel",
  "Campaign",
  "DeviceModel",
  "OSVersion",
  "AppVersion",
  "SessionsLast7d",
  "PlaytimeLast7d_Minutes",
  "AvgSession_Minutes",
  "Retention7dPercent",
  "SpentLast7d_USD",
  "PurchasesLast7d",
  "InGameCurrencyBalance",
  "AdImpressionsLast7d",
  "AdClicksLast7d",
  "PurchaseRatePercent",
  "CrashCountLast7d",
  "AvgPingMs",
  "AvgFPS",
  "BugsReportedLast7d",
  "ChurnProbabilityPercent",
  "NPS",
  "FeedbackCategory",
  "FeedbackShort",
  "CommunityMentionsLast7d",
  "SentimentScore" // -1 (very negative) .. 1 (very positive)
].join(',');

const rows = [header];

// Generate data for the last 7 days
const numDays = 7;
const baseDate = new Date('2025-10-20');
let playerIdCounter = 1;

for (let day = numDays - 1; day >= 0; day--) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() - day);
    const snapshotDate = currentDate.toISOString().split('T')[0];

    // Vary the number of active players per day
    const dailyActivePlayers = randInt(150, 220);

    for (let i = 1; i <= dailyActivePlayers; i++) {
        const playerId = `P${String(playerIdCounter++).padStart(5, '0')}`;
        const title = choice(gameTitles);
        const platform = choice(platforms);
        const region = choice(regions);
        const country = choice(countriesByRegion[region]);
        const age = randInt(13, 55);
        const gender = choice(genders);
        const segment = choice(segments);
        const channel = choice(channels);
        const campaign = channel.startsWith("UA") ? `Campaign_${randInt(1, 6)}` : "";
        const device = choice(deviceModels);
        const os = choice(osVersions);
        const appVer = choice(appVersions);

        const mod = segmentModifiers(segment);
        const sessions = randInt(mod.sessionsMin, mod.sessionsMax);
        const playtime = Math.round(randInt(mod.playMin, mod.playMax) * (1 + (age < 25 ? rand() * 0.2 : 0)));
        const avgSession = +(playtime / Math.max(1, sessions)).toFixed(1);

        let retention = Math.min(98, Math.max(2, Math.round(20 + (sessions / (mod.sessionsMax)) * 60 + (appVer.startsWith("1.3") ? 5 : 0) + (rand() * 10 - 5))));
        const willSpend = rand() < mod.spendProb;
        const purchases = willSpend ? randInt(1, Math.max(1, Math.round(mod.spendMult * randInt(1, 8)))) : 0;
        const avgPurchaseValue = +(1 + rand() * 49).toFixed(2);
        const spent = +(purchases * avgPurchaseValue).toFixed(2);
        const igCurrency = Math.round(spent * (50 + rand() * 500) + randInt(0, 2000));

        const adImpr = randInt(0, 200) * (platform === "Mobile" || platform === "iOS" || platform === "Android" ? 1 : 0.2);
        const adClicks = Math.round(adImpr * (0.005 + rand() * 0.03));
        const purchaseRatePercent = +((purchases / Math.max(1, sessions)) * 100).toFixed(2);

        const crashBase = platform === "PC" ? 0.02 : (platform === "Android" ? 0.06 : 0.03);
        const crashCount = Math.max(0, Math.round((playtime / 60 / 2) * (crashBase + rand() * 0.08)));
        const avgPing = Math.round(20 + rand() * 200);
        const avgFPS = Math.round(30 + rand() * 60);
        const bugs = Math.round(rand() * 2 * (1 + crashCount / 3));

        const sentimentRoll = rand();
        let feedbackCategory, feedbackText, sentimentScore;
        if (sentimentRoll > 0.78) {
            feedbackCategory = "positive";
            feedbackText = choice(feedbackSnippets.positive);
            sentimentScore = +(0.4 + rand() * 0.6).toFixed(2);
        } else if (sentimentRoll > 0.4) {
            feedbackCategory = "neutral";
            feedbackText = choice(feedbackSnippets.neutral);
            sentimentScore = +(-0.2 + rand() * 0.5).toFixed(2);
        } else {
            feedbackCategory = "negative";
            feedbackText = choice(feedbackSnippets.negative);
            sentimentScore = +(-0.9 + rand() * 0.6).toFixed(2);
        }
        const nps = Math.max(-100, Math.min(100, Math.round(sentimentScore * 100 + (rand() * 20 - 10))));

        let churnProb = Math.min(99, Math.max(1, Math.round(60 - retention + (100 * (1 - sentimentScore)) / 3 + (purchases === 0 ? 5 : -8) + rand() * 12 - 6)));
        const mentions = Math.max(0, Math.round((Math.abs(sentimentScore) + 0.1) * (rand() * 3)));

        const row = [
            snapshotDate, playerId, title, platform, region, country, age, gender, segment, channel, campaign, device, os, appVer,
            sessions, playtime, avgSession, retention, spent.toFixed(2), purchases, igCurrency, Math.round(adImpr), Math.round(adClicks),
            purchaseRatePercent, crashCount, avgPing, avgFPS, bugs, churnProb, nps, feedbackCategory, feedbackText.replace(/,/g, ';'),
            mentions, sentimentScore.toFixed(2)
        ].join(',');

        rows.push(row);
    }
}

fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
console.log(`Wrote ${rows.length - 1} rows across ${numDays} days to ${outPath}`);