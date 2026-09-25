import React, { useState, useEffect, useRef } from "react";
import {
  Shield, Zap, Target, Search, GraduationCap, Bell, Globe, Play, RotateCcw,
  Flame, Home as HomeIcon, ArrowUpRight,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const C = {
  bg: "#0B2B26",
  bgPanel: "#123832",
  bgPanelAlt: "#173F38",
  cream: "#FBF8F2",
  ink: "#15251F",
  textLight: "#F4F1E8",
  textMuted: "#9FB6AE",
  accent: "#F2A93B",
  accentDark: "#C98A22",
  green: "#2E9E63",
  red: "#C1443A",
  border: "rgba(244,241,232,0.12)",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
:root{ --accent:${C.accent}; }
.as-root{ font-family:'Inter',system-ui,sans-serif; }
.as-display{ font-family:'Space Grotesk',system-ui,sans-serif; }
.as-num{ font-variant-numeric: tabular-nums; }
@keyframes fadeInUp{ from{opacity:0; transform:translateY(8px);} to{opacity:1; transform:translateY(0);} }
.fade-in{ animation: fadeInUp .38s ease; }
@media (prefers-reduced-motion: reduce){ .fade-in{ animation:none; } }
.tab-btn{ transition: background .15s ease, color .15s ease, border-color .15s ease; }
.tile{ transition: transform .15s ease, border-color .15s ease; }
.tile:hover{ transform: translateY(-2px); border-color: var(--accent) !important; }
.btn:focus-visible, .tab-btn:focus-visible, .tile:focus-visible, .chip-btn:focus-visible{
  outline: 2px solid var(--accent); outline-offset: 2px;
}
.scrollbar-none::-webkit-scrollbar{ display:none; }
.scrollbar-none{ -ms-overflow-style:none; scrollbar-width:none; }
`;

type Lang = "en" | "hi";

interface TranslationText {
  tagline: string;
  heroHeadline: string;
  heroSub: string;
  chips: string[];
  ctaPrimary: string;
  demoNote: string;
  greeting: string;
  riskBadge: string;
  todayChange: string;
  quickAlgo: string;
  quickBuilder: string;
  quickLearn: string;
  whyTitle: string;
  footerNote: string;
  waitlistCta: string;
  waitlistDone: string;
  compare: string;
}

const T: Record<Lang, TranslationText> = {
  en: {
    tagline: "Trading intelligence for every Indian investor",
    heroHeadline: "Your risk decides the algo. Not the other way round.",
    heroSub:
      "AlgoSetu sizes a scalping algorithm to your capital and comfort with risk, builds option strategies in plain language, and teaches you the why — before real money is on the line.",
    chips: ["Risk-first algo", "No-code strategy builder", "Practice before real money"],
    ctaPrimary: "Explore the features",
    demoNote: "Sample data for illustration — not live prices or trading advice",
    greeting: "Namaste, Rohan",
    riskBadge: "Balanced risk",
    todayChange: "Today",
    quickAlgo: "Algo Engine",
    quickBuilder: "Strategy Builder",
    quickLearn: "Learn & Play",
    whyTitle: "What makes this a different kind of trading app",
    footerNote:
      "AlgoSetu is a product concept built for this demo with sample data. It is not a registered broker, analyst, or investment adviser, and nothing shown here is trading advice.",
    waitlistCta: "Get early access",
    waitlistDone: "You're on the list",
    compare: "Designed for modern Indian traders, combining real-time NSE/BSE option analytics, interactive payoff charts, and automated broker execution.",
  },
  hi: {
    tagline: "हर भारतीय निवेशक के लिए ट्रेडिंग इंटेलिजेंस",
    heroHeadline: "आपका जोखिम तय करता है एल्गो — इसका उल्टा नहीं।",
    heroSub:
      "AlgoSetu आपकी पूंजी और जोखिम क्षमता के अनुसार एक स्केल्पिंग एल्गो तैयार करता है, सरल भाषा में ऑप्शन स्ट्रैटेजी बनाता है, और असली पैसा लगाने से पहले आपको वजह समझाता है।",
    chips: ["जोखिम-पहले एल्गो", "नो-कोड स्ट्रैटेजी बिल्डर", "असली पैसे से पहले अभ्यास"],
    ctaPrimary: "फीचर्स देखें",
    demoNote: "उदाहरण डेटा — लाइव कीमतें या ट्रेडिंग सलाह नहीं",
    greeting: "नमस्ते, रोहन",
    riskBadge: "बैलेंस्ड रिस्क",
    todayChange: "आज",
    quickAlgo: "एल्गो इंजन",
    quickBuilder: "स्ट्रैटेजी बिल्डर",
    quickLearn: "सीखो और खेलो",
    whyTitle: "यह ट्रेडिंग ऐप अलग कैसे है",
    footerNote:
      "AlgoSetu इस डेमो के लिए बनाया गया एक प्रोडक्ट कॉन्सेप्ट है, जिसमें उदाहरण डेटा है। यह कोई पंजीकृत ब्रोकर, विश्लेषक या निवेश सलाहकार नहीं है, और यहाँ दिखाया गया कुछ भी ट्रेडिंग सलाह नहीं है।",
    waitlistCta: "जल्दी पहुँच पाएं",
    waitlistDone: "आप सूची में शामिल हैं",
    compare: "आधुनिक भारतीय व्यापारियों के लिए डिज़ाइन किया गया, जिसमें लाइव NSE/BSE ऑप्शन एनालिटिक्स, पेऑफ चार्ट और ऑटोमेटेड ब्रोकर एग्जीक्यूशन शामिल है।",
  },
};

interface Feature {
  id: string;
  icon: React.ElementType;
  label: Record<Lang, string>;
  desc: Record<Lang, string>;
  bullets: Record<Lang, string[]>;
}

const FEATURES: Feature[] = [
  {
    id: "risk",
    icon: Shield,
    label: { en: "Risk Compass", hi: "रिस्क कम्पास" },
    desc: {
      en: "Tell us your capital and how much risk feels okay, and AlgoSetu sets the boundaries everything else trades inside — before a single order goes out.",
      hi: "अपनी पूंजी और सहज जोखिम स्तर बताएं, और AlgoSetu वो सीमाएं तय करता है जिनके भीतर बाकी सब ट्रेड होता है — पहला ऑर्डर जाने से पहले।",
    },
    bullets: {
      en: [
        "Set capital and risk level in under a minute",
        "Get a realistic monthly target range, not a promised number",
        "Fix a daily max-loss guard before you start",
      ],
      hi: [
        "एक मिनट में पूंजी और जोखिम स्तर तय करें",
        "एक वास्तविक मासिक लक्ष्य सीमा पाएं, वादा किया गया आंकड़ा नहीं",
        "शुरू करने से पहले दैनिक अधिकतम-हानि सीमा तय करें",
      ],
    },
  },
  {
    id: "algo",
    icon: Zap,
    label: { en: "Algo Engine", hi: "एल्गो इंजन" },
    desc: {
      en: "A rules-based scalping algorithm sized to the risk profile you set — watch it work on sample trades, and see exactly when it pauses itself.",
      hi: "आपके तय जोखिम प्रोफ़ाइल के अनुसार एक नियम-आधारित स्केल्पिंग एल्गो — इसे उदाहरण ट्रेड पर काम करते देखें, और जानें यह कब खुद रुक जाता है।",
    },
    bullets: {
      en: [
        "Runs inside the boundaries set by your Risk Compass",
        "Auto-pauses when the daily loss guard is hit",
        "Every trade logged, win or loss",
      ],
      hi: [
        "रिस्क कम्पास से तय सीमाओं के भीतर काम करता है",
        "दैनिक हानि सीमा छूने पर खुद रुक जाता है",
        "हर ट्रेड दर्ज होता है, जीत हो या हार",
      ],
    },
  },
  {
    id: "builder",
    icon: Target,
    label: { en: "Strategy Builder", hi: "स्ट्रैटेजी बिल्डर" },
    desc: {
      en: "Pick a view on the market in one tap, and get an options strategy explained in plain terms — payoff, breakeven, and the worst case, upfront.",
      hi: "बाज़ार पर अपना नज़रिया एक टैप में चुनें, और सरल भाषा में समझाई गई ऑप्शन स्ट्रैटेजी पाएं — पेऑफ, ब्रेकईवन और सबसे बुरी स्थिति, पहले से साफ।",
    },
    bullets: {
      en: [
        "No coding or options-Greeks knowledge required to start",
        "See max profit, max loss and breakeven before placing anything",
        "Save strategies and compare them side by side",
      ],
      hi: [
        "शुरू करने के लिए कोडिंग या ग्रीक्स का ज्ञान ज़रूरी नहीं",
        "कुछ भी लगाने से पहले अधिकतम लाभ, हानि और ब्रेकईवन देखें",
        "स्ट्रैटेजी सेव करें और साथ-साथ तुलना करें",
      ],
    },
  },
  {
    id: "screener",
    icon: Search,
    label: { en: "Screener & Research", hi: "स्क्रीनर और रिसर्च" },
    desc: {
      en: "Filter the market by sector and signal, and open a snapshot of where option positions are building up — the same clues professional desks watch.",
      hi: "सेक्टर और सिग्नल के आधार पर बाज़ार फ़िल्टर करें, और देखें ऑप्शन पोज़िशन कहाँ बन रहे हैं — वही संकेत जो प्रोफेशनल डेस्क देखती हैं।",
    },
    bullets: {
      en: [
        "Filter by sector, price move or signal",
        "Option chain snapshot with open interest at a glance",
        "Save any stock straight to your watchlist",
      ],
      hi: [
        "सेक्टर, कीमत बदलाव या सिग्नल से फ़िल्टर करें",
        "एक नज़र में ओपन इंटरेस्ट के साथ ऑप्शन चेन",
        "किसी भी स्टॉक को सीधे वॉचलिस्ट में सेव करें",
      ],
    },
  },
  {
    id: "learn",
    icon: GraduationCap,
    label: { en: "Learn & Play", hi: "सीखो और खेलो" },
    desc: {
      en: "A practice arena with play money, XP, and streaks — so the first hundred mistakes happen here, not in a real Demat account.",
      hi: "प्ले मनी, XP और स्ट्रीक के साथ एक प्रैक्टिस अखाड़ा — ताकि पहली सौ गलतियां यहां हों, असली डीमैट अकाउंट में नहीं।",
    },
    bullets: {
      en: [
        "Lessons in Hindi and other Indian languages",
        "Virtual trading arena with a live leaderboard",
        "Level up as you complete real trading scenarios",
      ],
      hi: [
        "हिंदी और अन्य भारतीय भाषाओं में पाठ",
        "लाइव लीडरबोर्ड के साथ वर्चुअल ट्रेडिंग अखाड़ा",
        "असली ट्रेडिंग परिदृश्य पूरे करने पर लेवल बढ़ाएं",
      ],
    },
  },
  {
    id: "alerts",
    icon: Bell,
    label: { en: "Alerts", hi: "अलर्ट" },
    desc: {
      en: "One feed for everything that needs your attention — a target hit, a guard triggered, a lesson unlocked — so you're not staring at charts all day.",
      hi: "आपका ध्यान चाहने वाली हर चीज़ के लिए एक फ़ीड — लक्ष्य पूरा होना, गार्ड ट्रिगर होना, नया पाठ खुलना — ताकि पूरा दिन चार्ट न देखना पड़े।",
    },
    bullets: {
      en: [
        "Trade and target alerts as they happen",
        "A clear note whenever the loss guard pauses the algo",
        "Learning nudges that fit around your day",
      ],
      hi: [
        "ट्रेड और लक्ष्य अलर्ट जैसे ही होते हैं",
        "जब भी हानि गार्ड एल्गो को रोके, साफ सूचना",
        "आपके दिन में फिट होने वाले लर्निंग नज",
      ],
    },
  },
];

const WHY: Array<{ icon: React.ElementType; en: [string, string]; hi: [string, string] }> = [
  {
    icon: Shield,
    en: [
      "Risk sets the algo, not the other way round",
      "Most tools sell a strategy first and ask about risk later, if at all. Here, your capital and comfort with loss shape every suggestion from the start.",
    ],
    hi: [
      "जोखिम एल्गो तय करता है, उल्टा नहीं",
      "ज़्यादातर टूल पहले स्ट्रैटेजी बेचते हैं और जोखिम बाद में पूछते हैं। यहां, आपकी पूंजी और हानि सहनशीलता शुरू से हर सुझाव को आकार देती है।",
    ],
  },
  {
    icon: GraduationCap,
    en: [
      "Practice with play money first",
      "The virtual arena mirrors real option mechanics, so the learning curve happens before real capital is at risk — not during it.",
    ],
    hi: [
      "पहले प्ले मनी से अभ्यास करें",
      "वर्चुअल अखाड़ा असली ऑप्शन मैकेनिक्स को दर्शाता है, ताकि सीखना असली पूंजी जोखिम में आने से पहले हो — उसके दौरान नहीं।",
    ],
  },
  {
    icon: Globe,
    en: [
      "Built in your language",
      "Lessons, alerts and strategy explanations work in Hindi and other Indian languages, not just English.",
    ],
    hi: [
      "आपकी भाषा में बनाया गया",
      "पाठ, अलर्ट और स्ट्रैटेजी की व्याख्या हिंदी और अन्य भारतीय भाषाओं में काम करती हैं, सिर्फ अंग्रेज़ी में नहीं।",
    ],
  },
];

interface RiskLevel {
  id: string;
  en: string;
  hi: string;
  target: [number, number];
  guard: number;
}

const RISK_LEVELS: RiskLevel[] = [
  { id: "conservative", en: "Conservative", hi: "कंज़र्वेटिव", target: [8, 12], guard: 1 },
  { id: "balanced", en: "Balanced", hi: "बैलेंस्ड", target: [12, 18], guard: 2 },
  { id: "aggressive", en: "Aggressive", hi: "एग्रेसिव", target: [18, 25], guard: 3 },
];

interface TradeStep {
  label: string;
  delta: number;
}

const TRADE_STEPS: TradeStep[] = [
  { label: "BUY NIFTY 24800 CE", delta: 420 },
  { label: "SELL BANKNIFTY 51200 PE", delta: -180 },
  { label: "BUY NIFTY 24850 CE", delta: 650 },
  { label: "SELL NIFTY 24700 PE", delta: 310 },
  { label: "BUY BANKNIFTY 51300 CE", delta: -240 },
  { label: "SELL NIFTY 24900 CE", delta: 580 },
];

const WATCHLIST = [
  { name: "RELIANCE", sector: "Energy", price: 2940, chg: 1.2, signal: "Bullish" },
  { name: "TCS", sector: "IT", price: 4180, chg: -0.8, signal: "Neutral" },
  { name: "HDFCBANK", sector: "Banking", price: 1650, chg: 2.4, signal: "Bullish" },
  { name: "INFY", sector: "IT", price: 1820, chg: -1.5, signal: "Bearish" },
  { name: "TATAMOTORS", sector: "Auto", price: 980, chg: 0.4, signal: "Neutral" },
  { name: "ITC", sector: "FMCG", price: 485, chg: 0.9, signal: "Bullish" },
];
const SECTORS = ["All", "Energy", "IT", "Banking", "Auto", "FMCG"];

const OPTION_CHAIN = [
  { strike: 24700, call: 62, put: 38 },
  { strike: 24850, call: 48, put: 52 },
  { strike: 25000, call: 35, put: 65 },
];

interface StrategyDetails {
  name: Record<Lang, string>;
  points: string;
  maxProfit: string;
  maxLoss: string;
  breakeven: string;
}

const STRATEGIES: Record<string, StrategyDetails> = {
  bullish: {
    name: { en: "Bull Call Spread", hi: "बुल कॉल स्प्रेड" },
    points: "0,90 70,90 130,20 300,20",
    maxProfit: "₹4,200", maxLoss: "₹1,800", breakeven: "24,930",
  },
  neutral: {
    name: { en: "Iron Condor", hi: "आयरन कॉन्डोर" },
    points: "0,90 90,90 130,35 200,35 230,90 300,90",
    maxProfit: "₹2,600", maxLoss: "₹3,400", breakeven: "24,700 / 25,100",
  },
  bearish: {
    name: { en: "Bear Put Spread", hi: "बेयर पुट स्प्रेड" },
    points: "0,20 170,20 230,90 300,90",
    maxProfit: "₹3,900", maxLoss: "₹2,100", breakeven: "24,610",
  },
};

const ALERTS = [
  { icon: Target, tone: "green", en: "Your BANKNIFTY straddle hit target", hi: "आपकी BANKNIFTY स्ट्रैडल ने लक्ष्य पूरा किया", time: { en: "2m ago", hi: "2 मिनट पहले" } },
  { icon: Shield, tone: "red", en: "Daily loss guard paused the algo", hi: "दैनिक हानि गार्ड ने एल्गो को रोका", time: { en: "1h ago", hi: "1 घंटा पहले" } },
  { icon: GraduationCap, tone: "accent", en: "New lesson unlocked: Understanding Theta decay", hi: "नया पाठ अनलॉक हुआ: थीटा डेके को समझना", time: { en: "3h ago", hi: "3 घंटे पहले" } },
  { icon: Search, tone: "green", en: "Screener found 2 new bullish setups", hi: "स्क्रीनर ने 2 नए बुलिश सेटअप ढूंढे", time: { en: "5h ago", hi: "5 घंटे पहले" } },
];

const SPARK = [{ v: 0 }, { v: 4 }, { v: 3 }, { v: 8 }, { v: 6 }, { v: 12 }, { v: 10 }, { v: 15 }, { v: 13 }, { v: 18 }];

function fmtINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      className="as-num"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
        borderRadius: 999, fontSize: 13, fontWeight: 500, border: `1px solid ${C.border}`,
        color: C.textLight, ...style,
      }}
    >
      {children}
    </span>
  );
}

function PhoneFrame({ children, screenKey }: { children: React.ReactNode; screenKey: string }) {
  return (
    <div style={{ background: "#0E1613", borderRadius: 40, padding: 10, boxShadow: "0 30px 70px -25px rgba(0,0,0,0.65)", width: "100%", maxWidth: 300 }}>
      <div style={{ background: C.cream, borderRadius: 30, overflow: "hidden", minHeight: 580, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px 2px", fontSize: 12, color: C.ink, fontWeight: 600 }}>
          <span>9:41</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ width: 16, height: 8, border: `1.5px solid ${C.ink}`, borderRadius: 2 }} />
          </div>
        </div>
        <div key={screenKey} className="fade-in" style={{ padding: "10px 18px 20px", flex: 1 }}>
          {children}
        </div>
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <div style={{ width: 100, height: 4, borderRadius: 999, background: C.ink, opacity: 0.15 }} />
        </div>
      </div>
    </div>
  );
}

function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="as-display" style={{ fontSize: 17, fontWeight: 600, color: C.ink, margin: "2px 0 12px" }}>{children}</h3>;
}

function DashboardScreen({ lang, onGo }: { lang: Lang; onGo: (id: string) => void }) {
  const t = T[lang];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, color: "#6B7A75" }}>{t.greeting} 👋</div>
          <div style={{ marginTop: 4 }}>
            <Chip style={{ background: "#EFEAD9", borderColor: "transparent", color: C.ink, fontSize: 11, padding: "4px 10px" }}>{t.riskBadge}</Chip>
          </div>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#1A1200", fontSize: 13 }}>R</div>
      </div>

      <div className="as-num" style={{ marginTop: 18, fontSize: 30, fontWeight: 700, color: C.ink }}>{fmtINR(184320)}</div>
      <div className="as-num" style={{ display: "flex", alignItems: "center", gap: 4, color: C.green, fontSize: 13, fontWeight: 600, marginTop: 2 }}>
        <ArrowUpRight size={14} /> +₹2,140 (+1.17%) · {t.todayChange}
      </div>

      <div style={{ height: 56, margin: "12px 0 6px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SPARK}>
            <Area type="monotone" dataKey="v" stroke={C.green} fill={C.green} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
        {[
          { id: "algo", icon: Zap, label: t.quickAlgo },
          { id: "builder", icon: Target, label: t.quickBuilder },
          { id: "learn", icon: GraduationCap, label: t.quickLearn },
        ].map((tile) => (
          <button key={tile.id} onClick={() => onGo(tile.id)} className="tile"
            style={{ background: "#F1EEE3", border: "1px solid transparent", borderRadius: 14, padding: "10px 6px", textAlign: "center", cursor: "pointer" }}>
            <tile.icon size={16} color={C.ink} style={{ margin: "0 auto 6px" }} />
            <div style={{ fontSize: 10.5, fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>{tile.label}</div>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 22, paddingTop: 14, borderTop: "1px solid #EAE6D8" }}>
        {[HomeIcon, Shield, Zap, GraduationCap, Bell].map((Icon, i) => (
          <Icon key={i} size={18} color={i === 0 ? C.accentDark : "#B9C2BC"} />
        ))}
      </div>
    </div>
  );
}

function RiskCompassScreen({
  lang,
  capital,
  setCapital,
  riskLevel,
  setRiskLevel,
}: {
  lang: Lang;
  capital: number;
  setCapital: (v: number) => void;
  riskLevel: string;
  setRiskLevel: (v: string) => void;
}) {
  const level = RISK_LEVELS.find((r) => r.id === riskLevel) || RISK_LEVELS[1];
  const lo = Math.round((capital * level.target[0]) / 100);
  const hi = Math.round((capital * level.target[1]) / 100);
  const guard = Math.round((capital * level.guard) / 100);
  return (
    <div>
      <ScreenTitle>{lang === "en" ? "Risk Compass" : "रिस्क कम्पास"}</ScreenTitle>
      <div style={{ fontSize: 12.5, color: "#5C6B66", marginBottom: 6 }}>{lang === "en" ? "Capital for this algo" : "इस एल्गो के लिए पूंजी"}</div>
      <div className="as-num" style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 6 }}>{fmtINR(capital)}</div>
      <input type="range" min={25000} max={500000} step={5000} value={capital}
        onChange={(e) => setCapital(Number(e.target.value))}
        style={{ width: "100%", accentColor: C.accentDark }} />

      <div style={{ fontSize: 12.5, color: "#5C6B66", margin: "16px 0 8px" }}>{lang === "en" ? "Risk you're comfortable with" : "सहज जोखिम स्तर"}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {RISK_LEVELS.map((r) => (
          <button key={r.id} onClick={() => setRiskLevel(r.id)} className="chip-btn"
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${riskLevel === r.id ? C.accentDark : "#DFDACB"}`,
              background: riskLevel === r.id ? C.accent : "#F6F3E9",
              color: riskLevel === r.id ? "#1A1200" : "#556058",
            }}>
            {r[lang]}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 16, background: "#F1EEE3", borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 11.5, color: "#5C6B66", marginBottom: 4 }}>{lang === "en" ? "Suggested monthly target" : "सुझाया गया मासिक लक्ष्य"}</div>
        <div className="as-num" style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{fmtINR(lo)} – {fmtINR(hi)}</div>
        <div style={{ fontSize: 11, color: "#8A948F", marginTop: 2 }}>{level.target[0]}–{level.target[1]}% {lang === "en" ? "of capital" : "पूंजी का"}</div>
        <div style={{ height: 1, background: "#E2DECD", margin: "10px 0" }} />
        <div style={{ fontSize: 11.5, color: "#5C6B66", marginBottom: 4 }}>{lang === "en" ? "Daily max-loss guard" : "दैनिक अधिकतम-हानि सीमा"}</div>
        <div className="as-num" style={{ fontSize: 17, fontWeight: 700, color: C.red }}>{fmtINR(guard)}</div>
      </div>
    </div>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="chip-btn" style={{ width: 40, height: 22, borderRadius: 999, background: on ? C.green : "#D9D4C4", position: "relative", cursor: "pointer", border: "none", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: 999, background: "#fff", transition: "left .15s ease" }} />
    </button>
  );
}

function AlgoEngineScreen({
  lang,
  running,
  trades,
  series,
  guardOn,
  setGuardOn,
  onRun,
  onReset,
}: {
  lang: Lang;
  running: boolean;
  trades: TradeStep[];
  series: Array<{ t: number; v: number }>;
  guardOn: boolean;
  setGuardOn: (v: boolean) => void;
  onRun: () => void;
  onReset: () => void;
}) {
  const pnl = series[series.length - 1].v;
  const winRate = trades.length ? Math.round((100 * trades.filter((x) => x.delta > 0).length) / trades.length) : 0;
  return (
    <div>
      <ScreenTitle>{lang === "en" ? "NIFTY Options Scalper" : "NIFTY ऑप्शन स्केल्पर"}</ScreenTitle>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11.5, color: "#5C6B66" }}>{lang === "en" ? "Session P&L" : "सेशन P&L"}</div>
          <div className="as-num" style={{ fontSize: 24, fontWeight: 700, color: pnl >= 0 ? C.green : C.red }}>{pnl >= 0 ? "+" : ""}{fmtINR(pnl)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11.5, color: "#5C6B66" }}>{lang === "en" ? "Win rate" : "जीत दर"}</div>
          <div className="as-num" style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{winRate}%</div>
        </div>
      </div>

      <div style={{ height: 50, margin: "10px 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <Area type="monotone" dataKey="v" stroke={pnl >= 0 ? C.green : C.red} fill={pnl >= 0 ? C.green : C.red} fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "10px 0 14px" }}>
        <button onClick={onRun} disabled={running} className="btn"
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: "none", background: running ? "#DDD7C4" : C.accent, color: "#1A1200", fontWeight: 700, fontSize: 12.5, cursor: running ? "default" : "pointer" }}>
          <Play size={13} /> {lang === "en" ? (running ? "Running…" : "Run demo") : (running ? "चल रहा है…" : "डेमो चलाएं")}
        </button>
        <button onClick={onReset} className="btn"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 12px", borderRadius: 10, border: "1px solid #DFDACB", background: "#F6F3E9", color: "#556058", fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>
          <RotateCcw size={13} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F1EEE3", borderRadius: 12, padding: "9px 12px", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{lang === "en" ? "Auto-pause at −2% daily loss" : "−2% दैनिक हानि पर स्वतः रुकें"}</span>
        <Switch on={guardOn} onClick={() => setGuardOn(!guardOn)} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 120, overflowY: "auto" }}>
        {trades.length === 0 && <div style={{ fontSize: 11.5, color: "#8A948F" }}>{lang === "en" ? "No trades yet — run the demo." : "अभी कोई ट्रेड नहीं — डेमो चलाएं।"}</div>}
        {trades.map((tr, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, background: "#F8F6EF", borderRadius: 8, padding: "6px 10px" }}>
            <span style={{ color: "#4B564F" }}>{tr.label}</span>
            <span className="as-num" style={{ fontWeight: 700, color: tr.delta >= 0 ? C.green : C.red }}>{tr.delta >= 0 ? "+" : ""}{tr.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyBuilderScreen({ lang, view, setView }: { lang: Lang; view: string; setView: (v: string) => void }) {
  const strat = STRATEGIES[view];
  return (
    <div>
      <ScreenTitle>{lang === "en" ? "NIFTY · Weekly expiry" : "NIFTY · साप्ताहिक एक्सपायरी"}</ScreenTitle>
      <div style={{ fontSize: 12, color: "#5C6B66", marginBottom: 6 }}>{lang === "en" ? "Your view on the market" : "बाज़ार पर आपका नज़रिया"}</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["bullish", "neutral", "bearish"].map((v) => (
          <button key={v} onClick={() => setView(v)} className="chip-btn"
            style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
              border: `1px solid ${view === v ? C.accentDark : "#DFDACB"}`,
              background: view === v ? C.accent : "#F6F3E9",
              color: view === v ? "#1A1200" : "#556058",
            }}>
            {lang === "en" ? v : v === "bullish" ? "बुलिश" : v === "bearish" ? "बेयरिश" : "न्यूट्रल"}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 8 }}>{strat.name[lang]}</div>

      <svg viewBox="0 0 300 100" style={{ width: "100%", height: 90, background: "#F1EEE3", borderRadius: 12 }}>
        <line x1="0" y1="55" x2="300" y2="55" stroke="#C9C2AC" strokeWidth="1" strokeDasharray="4 4" />
        <polyline points={strat.points} fill="none" stroke={C.accentDark} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11 }}>
        <div>
          <div style={{ color: "#8A948F" }}>{lang === "en" ? "Max profit" : "अधिकतम लाभ"}</div>
          <div className="as-num" style={{ fontWeight: 700, color: C.green }}>{strat.maxProfit}</div>
        </div>
        <div>
          <div style={{ color: "#8A948F" }}>{lang === "en" ? "Max loss" : "अधिकतम हानि"}</div>
          <div className="as-num" style={{ fontWeight: 700, color: C.red }}>{strat.maxLoss}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#8A948F" }}>{lang === "en" ? "Breakeven" : "ब्रेकईवन"}</div>
          <div className="as-num" style={{ fontWeight: 700, color: C.ink }}>{strat.breakeven}</div>
        </div>
      </div>
    </div>
  );
}

function ScreenerScreen({ lang, sector, setSector }: { lang: Lang; sector: string; setSector: (s: string) => void }) {
  const rows = sector === "All" ? WATCHLIST : WATCHLIST.filter((r) => r.sector === sector);
  const sigColor = (s: string) => (s === "Bullish" ? C.green : s === "Bearish" ? C.red : "#8A7A45");
  return (
    <div>
      <ScreenTitle>{lang === "en" ? "Screener" : "स्क्रीनर"}</ScreenTitle>
      <div className="scrollbar-none" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
        {SECTORS.map((s) => (
          <button key={s} onClick={() => setSector(s)} className="chip-btn"
            style={{
              whiteSpace: "nowrap", padding: "6px 11px", borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${sector === s ? C.accentDark : "#DFDACB"}`,
              background: sector === s ? C.accent : "#F6F3E9",
              color: sector === s ? "#1A1200" : "#556058",
            }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8F6EF", borderRadius: 10, padding: "8px 10px" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{r.name}</div>
              <div style={{ fontSize: 10, color: sigColor(r.signal), fontWeight: 600 }}>{r.signal}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="as-num" style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>₹{r.price}</div>
              <div className="as-num" style={{ fontSize: 10.5, color: r.chg >= 0 ? C.green : C.red, fontWeight: 600 }}>{r.chg >= 0 ? "+" : ""}{r.chg}%</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#5C6B66", marginBottom: 6 }}>{lang === "en" ? "Option chain · Demo index 24,850" : "ऑप्शन चेन · डेमो इंडेक्स 24,850"}</div>
      {OPTION_CHAIN.map((o) => (
        <div key={o.strike} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8A948F", marginBottom: 2 }}>
            <span>{o.strike}</span>
          </div>
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${o.call}%`, background: C.green }} />
            <div style={{ width: `${o.put}%`, background: C.red }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LearnPlayScreen({ lang }: { lang: Lang }) {
  const leaderboard = [
    { name: "Priya S.", pnl: 12450, isUser: false },
    { name: "Rohit M.", pnl: 9800, isUser: false },
    { name: lang === "en" ? "You" : "आप", pnl: 7650, isUser: true },
  ];
  return (
    <div>
      <ScreenTitle>{lang === "en" ? "Learn & Play" : "सीखो और खेलो"}</ScreenTitle>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{lang === "en" ? "Level 4 · Options Explorer" : "लेवल 4 · ऑप्शन एक्सप्लोरर"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.accentDark, fontWeight: 600 }}><Flame size={12} /> {lang === "en" ? "6-day streak" : "6-दिन की स्ट्रीक"}</div>
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#E4E0D0", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: "68%", height: "100%", background: C.accent }} />
      </div>

      <div style={{ background: "#F1EEE3", borderRadius: 12, padding: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 10.5, color: "#8A948F", marginBottom: 3 }}>{lang === "en" ? "Today's lesson" : "आज का पाठ"}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{lang === "en" ? "Why option premiums decay over time" : "समय के साथ ऑप्शन प्रीमियम क्यों घटता है"}</div>
      </div>

      <div style={{ fontSize: 11, color: "#5C6B66", marginBottom: 6 }}>{lang === "en" ? "Virtual arena leaderboard" : "वर्चुअल अखाड़ा लीडरबोर्ड"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {leaderboard.map((p, i) => (
          <div key={p.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: p.isUser ? "#F6EBD2" : "#F8F6EF", borderRadius: 10, padding: "7px 10px" }}>
            <span style={{ fontSize: 12, fontWeight: p.isUser ? 700 : 500, color: C.ink }}>{i + 1}. {p.name}</span>
            <span className="as-num" style={{ fontSize: 12, fontWeight: 700, color: C.green }}>+{fmtINR(p.pnl)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsScreen({ lang }: { lang: Lang }) {
  const toneColor: Record<string, string> = { green: C.green, red: C.red, accent: C.accentDark };
  return (
    <div>
      <ScreenTitle>{lang === "en" ? "Alerts" : "अलर्ट"}</ScreenTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ALERTS.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 10, background: "#F8F6EF", borderRadius: 12, padding: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <a.icon size={14} color={toneColor[a.tone]} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.35 }}>{a[lang]}</div>
              <div style={{ fontSize: 10, color: "#9AA39D", marginTop: 2 }}>{a.time[lang]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const AlgoSetuDemo: React.FC = () => {
  const [lang, setLang] = useState<Lang>("en");
  const [activeTab, setActiveTab] = useState("risk");
  const featureRef = useRef<HTMLDivElement>(null);

  const [capital, setCapital] = useState(150000);
  const [riskLevel, setRiskLevel] = useState("balanced");

  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [trades, setTrades] = useState<TradeStep[]>([]);
  const [series, setSeries] = useState<Array<{ t: number; v: number }>>([{ t: 0, v: 0 }]);
  const [guardOn, setGuardOn] = useState(true);

  const [view, setView] = useState("bullish");
  const [sector, setSector] = useState("All");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    if (step >= TRADE_STEPS.length) { setRunning(false); return undefined; }
    const timer = setTimeout(() => {
      const next = TRADE_STEPS[step];
      setTrades((prev) => [next, ...prev]);
      setSeries((prev) => [...prev, { t: prev.length, v: prev[prev.length - 1].v + next.delta }]);
      setStep((s) => s + 1);
    }, 900);
    return () => clearTimeout(timer);
  }, [running, step]);

  function handleRun() {
    if (running) return;
    setTrades([]); setSeries([{ t: 0, v: 0 }]); setStep(0); setRunning(true);
  }
  function handleReset() {
    setRunning(false); setTrades([]); setSeries([{ t: 0, v: 0 }]); setStep(0);
  }
  function goToFeature(id: string) {
    setActiveTab(id);
    featureRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const t = T[lang];
  const activeFeature = FEATURES.find((f) => f.id === activeTab) || FEATURES[0];

  function renderScreen() {
    switch (activeTab) {
      case "risk": return <RiskCompassScreen lang={lang} capital={capital} setCapital={setCapital} riskLevel={riskLevel} setRiskLevel={setRiskLevel} />;
      case "algo": return <AlgoEngineScreen lang={lang} running={running} trades={trades} series={series} guardOn={guardOn} setGuardOn={setGuardOn} onRun={handleRun} onReset={handleReset} />;
      case "builder": return <StrategyBuilderScreen lang={lang} view={view} setView={setView} />;
      case "screener": return <ScreenerScreen lang={lang} sector={sector} setSector={setSector} />;
      case "learn": return <LearnPlayScreen lang={lang} />;
      case "alerts": return <AlertsScreen lang={lang} />;
      default: return null;
    }
  }

  return (
    <div className="as-root rounded-2xl overflow-hidden border border-gray-800 shadow-2xl" style={{ background: C.bg, minHeight: "100vh", color: C.textLight }}>
      <style>{css}</style>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(11,43,38,0.85)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}>
        <div className="mx-auto" style={{ maxWidth: 1100, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#1A1200" }}>A</div>
            <span className="as-display" style={{ fontWeight: 600, fontSize: 17 }}>AlgoTred Risk Engine</span>
          </div>
          <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="btn"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999, border: `1px solid ${C.border}`, background: "transparent", color: C.textLight, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            <Globe size={14} /> {lang === "en" ? "हिं" : "EN"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto" style={{ maxWidth: 1100, padding: "56px 24px 40px" }}>
        <div className="flex flex-col md:flex-row" style={{ gap: 48, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: C.accent, fontWeight: 600, marginBottom: 14 }}>{t.tagline}</div>
            <h1 className="as-display" style={{ fontSize: "clamp(28px,4.2vw,44px)", fontWeight: 700, lineHeight: 1.12, marginBottom: 18 }}>{t.heroHeadline}</h1>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: C.textMuted, maxWidth: 480, marginBottom: 22 }}>{t.heroSub}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
              {t.chips.map((c) => <Chip key={c}>{c}</Chip>)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => goToFeature("risk")} className="btn"
                style={{ padding: "12px 22px", borderRadius: 12, border: "none", background: C.accent, color: "#1A1200", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>
                {t.ctaPrimary}
              </button>
              <span style={{ fontSize: 12.5, color: C.textMuted }}>{t.demoNote}</span>
            </div>
          </div>
          <div className="flex justify-center" style={{ flex: 1, width: "100%" }}>
            <PhoneFrame screenKey="dashboard"><DashboardScreen lang={lang} onGo={goToFeature} /></PhoneFrame>
          </div>
        </div>
      </section>

      {/* Feature rail + detail */}
      <section ref={featureRef} style={{ borderTop: `1px solid ${C.border}`, background: C.bgPanel }}>
        <div className="mx-auto" style={{ maxWidth: 1100, padding: "40px 24px 60px" }}>
          <div className="scrollbar-none" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 32 }}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              const isActive = f.id === activeTab;
              return (
                <button key={f.id} onClick={() => setActiveTab(f.id)} className="tab-btn"
                  style={{
                    display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", padding: "9px 16px", borderRadius: 999, cursor: "pointer",
                    border: `1px solid ${isActive ? C.accent : C.border}`,
                    background: isActive ? "rgba(242,169,59,0.14)" : "transparent",
                    color: isActive ? C.accent : C.textMuted, fontSize: 13.5, fontWeight: 600,
                  }}>
                  <Icon size={15} /> {f.label[lang]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col md:flex-row" style={{ gap: 48, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <h2 className="as-display" style={{ fontSize: 24, fontWeight: 600, marginBottom: 14 }}>{activeFeature.label[lang]}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: C.textMuted, marginBottom: 18, maxWidth: 460 }}>{activeFeature.desc[lang]}</p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
                {activeFeature.bullets[lang].map((b) => (
                  <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: C.textLight }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: C.accent, marginTop: 8, flexShrink: 0 }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center" style={{ flex: 1, width: "100%" }}>
              <PhoneFrame screenKey={activeTab}>{renderScreen()}</PhoneFrame>
            </div>
          </div>
        </div>
      </section>

      {/* Why different */}
      <section className="mx-auto" style={{ maxWidth: 1100, padding: "64px 24px" }}>
        <h2 className="as-display" style={{ fontSize: 26, fontWeight: 600, marginBottom: 32, maxWidth: 560 }}>{t.whyTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 20 }}>
          {WHY.map((w, i) => {
            const Icon = w.icon;
            const [head, body] = w[lang];
            return (
              <div key={i} style={{ background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(242,169,59,0.14)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={17} color={C.accent} />
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 8, lineHeight: 1.35 }}>{head}</div>
                <div style={{ fontSize: 13.5, color: C.textMuted, lineHeight: 1.6 }}>{body}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 24, fontSize: 12.5, color: C.textMuted }}>{t.compare}</div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="mx-auto flex flex-col md:flex-row" style={{ maxWidth: 1100, padding: "28px 24px", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 12, color: C.textMuted, maxWidth: 620, lineHeight: 1.6, margin: 0 }}>{t.footerNote}</p>
          <button onClick={() => setJoined(true)} disabled={joined} className="btn"
            style={{ whiteSpace: "nowrap", padding: "10px 18px", borderRadius: 10, border: `1px solid ${C.accent}`, background: joined ? "transparent" : "rgba(242,169,59,0.14)", color: C.accent, fontWeight: 700, fontSize: 13, cursor: joined ? "default" : "pointer" }}>
            {joined ? t.waitlistDone : t.waitlistCta}
          </button>
        </div>
      </footer>
    </div>
  );
};
