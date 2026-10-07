import { lazy, Suspense, useState, useRef, useEffect } from "react"
import { Capacitor } from "@capacitor/core"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"

const StudyGuideViewer = lazy(() => import("./StudyGuideViewer"))

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* noop */ }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Screen = "dashboard" | "learn" | "flashcards"

interface FlashCard {
  id: number
  question: string
  answer: string
  category: string
}

interface WouldYouRather {
  id: number
  optionA: string
  optionB: string
  encourageA: string
  encourageB: string
  icon: string
}

interface Badge {
  icon: string
  label: string
  earned: boolean
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FLASHCARDS: FlashCard[] = [
  // ── Financial Literacy (Pillar 2) ──────────────────────────────────────────
  {
    id: 101,
    category: "Financial Literacy",
    question: "What is the Profit Formula?",
    answer:
      "Profit = Sales Revenue − Business Costs. Only what is left after all costs is really yours to plan with.",
  },
  {
    id: 102,
    category: "Financial Literacy",
    question: "What is the Kids Haven 60-30-10 Rule?",
    answer:
      "Split your profit: 60% Reinvest in the business, 30% Personal Needs, 10% Savings. It is applied to PROFIT, not total sales.",
  },
  {
    id: 103,
    category: "Financial Literacy",
    question: "Why is the 60-30-10 split based on profit, not total sales?",
    answer:
      "Because some of your revenue belongs to materials, transport and tools. Only profit — what remains after costs — is truly yours to plan with.",
  },
  {
    id: 104,
    category: "Financial Literacy",
    question: "What does the 60% Reinvest portion pay for?",
    answer:
      "Materials, tools, stock, data, transport and anything that helps the business grow.",
  },
  {
    id: 105,
    category: "Financial Literacy",
    question: "What does the 30% Personal Needs portion cover?",
    answer: "Food, transport, airtime and personal day-to-day expenses.",
  },
  {
    id: 106,
    category: "Financial Literacy",
    question: "What is the 10% Savings portion for?",
    answer:
      "Building a savings habit and creating a safety net for slow months or future opportunities.",
  },
  {
    id: 107,
    category: "Financial Literacy",
    question: "What is the Earn → Reinvest → Grow model?",
    answer:
      "Make a sale → Calculate profit → Split 60/30/10 → Reinvest → Grow income → Repeat the cycle.",
  },
  {
    id: 108,
    category: "Financial Literacy",
    question:
      "Tumelo sold a chair for R350 with R120 in costs. What was his profit?",
    answer: "R230. Profit = R350 − R120 = R230. Not the full R350 he received.",
  },
  {
    id: 109,
    category: "Financial Literacy",
    question:
      "Using the 60-30-10 rule on R230 profit, how much goes to reinvest?",
    answer: "R138 (60% of R230) goes back into materials and business costs.",
  },
  {
    id: 110,
    category: "Financial Literacy",
    question:
      "Using the 60-30-10 rule on R230 profit, how much goes to personal needs?",
    answer:
      "R69 (30% of R230) covers personal expenses like transport and airtime.",
  },
  {
    id: 111,
    category: "Financial Literacy",
    question:
      "Using the 60-30-10 rule on R230 profit, how much goes to savings?",
    answer: "R23 (10% of R230) goes into savings.",
  },
  {
    id: 112,
    category: "Financial Literacy",
    question: "How do you build a simple monthly budget?",
    answer:
      "Add up all sales, all costs, and total profit for the month — then apply the 60-30-10 split to the monthly total, not just one sale.",
  },
  {
    id: 113,
    category: "Financial Literacy",
    question: "What mistake do many hustlers make when counting money?",
    answer:
      "They treat the full amount a customer pays as profit. In reality, part of it belongs to materials, transport and tools.",
  },
  {
    id: 114,
    category: "Financial Literacy",
    question: "Why should you track every sale in writing?",
    answer:
      "So you always know your real profit number. Guessing leads to working hard but still losing money.",
  },
  {
    id: 115,
    category: "Financial Literacy",
    question: "What is the Kids Haven Academy motto?",
    answer:
      "Earn. Save. Grow. Earn honestly, meet daily needs, reduce stress, become independent and create opportunities.",
  },
  {
    id: 116,
    category: "Financial Literacy",
    question: "What does the 10% savings jar protect you from?",
    answer:
      "It becomes a safety net for slow months and a deposit for bigger tools that help you earn more.",
  },
  {
    id: 117,
    category: "Financial Literacy",
    question: "Does the 60-30-10 model only work for woodwork?",
    answer:
      "No. It works for any hustle — sewing, baking, hairdressing, graphic design, reselling. The amounts change but the split stays the same.",
  },
  {
    id: 118,
    category: "Financial Literacy",
    question:
      "If your profit for the month is R1,000, how much goes to savings?",
    answer: "R100 (10% of R1,000).",
  },
  {
    id: 119,
    category: "Financial Literacy",
    question: "If your profit for the month is R1,000, how much is reinvested?",
    answer: "R600 (60% of R1,000).",
  },
  {
    id: 120,
    category: "Financial Literacy",
    question:
      "If your profit for the month is R1,000, how much covers personal needs?",
    answer: "R300 (30% of R1,000).",
  },
  {
    id: 121,
    category: "Financial Literacy",
    question: "What is revenue?",
    answer:
      "The total amount a customer pays you before any costs are subtracted.",
  },
  {
    id: 122,
    category: "Financial Literacy",
    question: "What are business costs?",
    answer:
      "All expenses needed to deliver your product or service — materials, transport, packaging, data, tools.",
  },
  {
    id: 123,
    category: "Financial Literacy",
    question: "Why does consistency in saving matter more than one big sale?",
    answer:
      "Small, consistent discipline builds sustainable income over time. One big sale spent carelessly leaves nothing.",
  },
  {
    id: 124,
    category: "Financial Literacy",
    question: "Where can you safely keep your 10% savings?",
    answer:
      "In a savings jar, a stokvel, a bank account or a mobile money account like Capitec or MTN MoMo.",
  },
  {
    id: 125,
    category: "Financial Literacy",
    question: "What is the first thing to calculate before splitting profit?",
    answer:
      "Subtract all business costs from sales revenue to find your true profit — then apply the 60-30-10 split.",
  },
  {
    id: 126,
    category: "Financial Literacy",
    question:
      "Tumelo's first full month: R1,450 sales, R430 costs. What was his profit?",
    answer: "R1,020 profit (R1,450 − R430).",
  },
  {
    id: 127,
    category: "Financial Literacy",
    question: "How much did Tumelo reinvest from his R1,020 monthly profit?",
    answer: "R612 (60%) went back into materials and a proper sanding block.",
  },
  {
    id: 128,
    category: "Financial Literacy",
    question: "How much did Tumelo save from his R1,020 monthly profit?",
    answer: "R102 (10%) went into savings.",
  },
  {
    id: 129,
    category: "Financial Literacy",
    question: "What is the Stability income range according to Kids Haven?",
    answer:
      "R2,846 – R5,000 per month, with repeat customers, weekly income and regular demand.",
  },
  {
    id: 130,
    category: "Financial Literacy",
    question: "What is the Survival income stage?",
    answer:
      "R500 – R2,000 per month — piece jobs, inconsistent income, few customers.",
  },
  {
    id: 131,
    category: "Financial Literacy",
    question: "What is the Growth income stage?",
    answer:
      "R5,000+ per month — referrals, multiple customers and possible small team support.",
  },
  {
    id: 132,
    category: "Financial Literacy",
    question:
      "Which income stage should most Hustling Academy participants aim for first?",
    answer:
      "Stage 2 — Stability — with repeat customers and reliable weekly income.",
  },
  {
    id: 133,
    category: "Financial Literacy",
    question: "What does it mean to reinvest in your business?",
    answer:
      "Using part of your profit to buy more materials, better tools or more stock so you can earn more next time.",
  },
  {
    id: 134,
    category: "Financial Literacy",
    question: "Why is it important to write down costs before making a sale?",
    answer:
      "If you ignore costs, you may work hard and still lose money. Knowing your costs ensures every sale is actually profitable.",
  },
  {
    id: 135,
    category: "Financial Literacy",
    question: "A chair cost R40 to make and sold for R100. What is the profit?",
    answer: "R60 profit. Profit = R100 − R40 = R60.",
  },
  {
    id: 136,
    category: "Financial Literacy",
    question: "What is the purpose of a monthly budget?",
    answer:
      "To track total sales, costs and profit across the whole month and plan how to split and use that money wisely.",
  },
  {
    id: 137,
    category: "Financial Literacy",
    question:
      "What happens if you do not separate your business money from personal money?",
    answer:
      "You lose track of profit, overspend on personal needs, and cannot grow or save consistently.",
  },
  {
    id: 138,
    category: "Financial Literacy",
    question: "Name three examples of business costs for a sewing hustle.",
    answer:
      "Fabric, thread, transport to deliver orders, packaging, electricity for the sewing machine.",
  },
  {
    id: 139,
    category: "Financial Literacy",
    question: "What is the difference between income and profit?",
    answer:
      "Income is the total amount received from sales. Profit is what remains after all business costs are subtracted.",
  },
  {
    id: 140,
    category: "Financial Literacy",
    question: "How does splitting profit three ways build stability faster?",
    answer:
      "Each portion works simultaneously: reinvesting grows the business, personal needs are covered, and savings build a safety net.",
  },
  {
    id: 141,
    category: "Financial Literacy",
    question: "What is the golden rule of the Kids Haven money model?",
    answer: "The 60-30-10 split is applied to PROFIT, not total sales revenue.",
  },
  {
    id: 142,
    category: "Financial Literacy",
    question:
      "If you earn R500 in sales but have R300 in costs, what is your profit?",
    answer: "R200 profit. You then split R200 using 60-30-10.",
  },
  {
    id: 143,
    category: "Financial Literacy",
    question: "What is a stokvel?",
    answer:
      "A South African savings club where a group of people contribute money regularly and take turns receiving the pot — a community savings tool.",
  },
  {
    id: 144,
    category: "Financial Literacy",
    question: "Name two examples of personal needs covered by the 30% portion.",
    answer:
      "Food, transport, airtime, toiletries — daily living expenses not related to the business.",
  },
  {
    id: 145,
    category: "Financial Literacy",
    question:
      'Why does Tumelo say he had been "guessing before" he tracked his profit?',
    answer:
      "He never wrote down costs — he thought the full sale price was his money. Tracking revealed his true number for the first time.",
  },
  {
    id: 146,
    category: "Financial Literacy",
    question: "What tool can you use to track sales and costs on your phone?",
    answer:
      "A notes app, a simple spreadsheet (Google Sheets), or even a notebook works. The key is writing every sale down.",
  },
  {
    id: 147,
    category: "Financial Literacy",
    question: "What is a slow month and how does savings protect you?",
    answer:
      "A slow month is when fewer customers buy. Your 10% savings pot covers personal needs so the business does not collapse.",
  },
  {
    id: 148,
    category: "Financial Literacy",
    question: 'What does "sustainable income" mean?',
    answer:
      "Income that continues reliably over time — not a one-off lucky sale, but consistent earnings from repeat customers and good money habits.",
  },
  {
    id: 149,
    category: "Financial Literacy",
    question: "What is the action challenge after learning the 60-30-10 rule?",
    answer:
      "Physically separate your profit into three envelopes, jars or mobile wallets — Reinvest, Personal Needs, Savings — even if the amounts are small.",
  },
  {
    id: 150,
    category: "Financial Literacy",
    question: 'What does "Earn → Reinvest → Grow" mean in practice?',
    answer:
      "Every sale funds the next sale. Reinvesting keeps the cycle going so income grows steadily over time.",
  },
  {
    id: 151,
    category: "Financial Literacy",
    question: "What should you bring to Day 2 of the Finance module?",
    answer:
      "Your written numbers from Day 1 — sale price, costs, and profit for at least one sale.",
  },
  {
    id: 152,
    category: "Financial Literacy",
    question: "What is the Kids Haven success principle for finance?",
    answer:
      "If participants consistently follow the 60-30-10 rule, they can build sustainable income regardless of industry or craft.",
  },
  {
    id: 153,
    category: "Financial Literacy",
    question:
      "Why might a small profit split properly be better than a large profit spent carelessly?",
    answer:
      "Because the discipline of splitting — even small amounts — builds stock, stability and savings simultaneously over time.",
  },
  {
    id: 154,
    category: "Financial Literacy",
    question: "What are Tumelo's material costs for a typical chair repair?",
    answer:
      "Sandpaper, varnish and glue — approximately R90 per piece in his example.",
  },
  {
    id: 155,
    category: "Financial Literacy",
    question: "What costs does Tumelo include beyond materials?",
    answer:
      "Transport to collect and deliver — an additional R30 per job in his example.",
  },
  {
    id: 156,
    category: "Financial Literacy",
    question: "What happens to the savings pot over many months?",
    answer:
      "It grows into a meaningful buffer — protecting you during slow periods and eventually funding bigger tools or investments.",
  },
  {
    id: 157,
    category: "Financial Literacy",
    question:
      "Is it possible to earn money and still go backwards financially?",
    answer:
      "Yes. If you ignore costs and spend all revenue on personal needs, you deplete your stock and cannot serve the next customer.",
  },
  {
    id: 158,
    category: "Financial Literacy",
    question: 'What does "Grow steadily" mean in the Kids Haven motto?',
    answer:
      "Build income step by step — from Survival to Stability to Growth — through consistency, not one big overnight moment.",
  },
  {
    id: 159,
    category: "Financial Literacy",
    question: "At what stage does Tumelo have a waiting list of customers?",
    answer:
      "By month three he reached Stability, and his next goal was Growth — where referrals bring more work than he can handle alone.",
  },
  {
    id: 160,
    category: "Financial Literacy",
    question:
      "What is the simplest way to start saving if you have very little money?",
    answer:
      "Start with R10. Consistency matters more than the amount. A savings habit built small grows over time.",
  },
  {
    id: 161,
    category: "Financial Literacy",
    question: "Name three business costs a hairdresser must track.",
    answer:
      "Relaxer/colour chemicals, water and electricity, transport to clients, and packaging for products.",
  },
  {
    id: 162,
    category: "Financial Literacy",
    question:
      "Why is it important to know your costs before setting your price?",
    answer:
      "So your selling price is always higher than your costs — ensuring every sale actually generates profit.",
  },
  {
    id: 163,
    category: "Financial Literacy",
    question:
      "What is the financial goal of Hustling Academy, according to Day 6?",
    answer:
      "Food, transport, rent support, dignity and stability — not luxury. The goal is stable, reliable income.",
  },
  {
    id: 164,
    category: "Financial Literacy",
    question:
      "What is the difference between a single sale and a monthly budget?",
    answer:
      "A single sale shows one transaction. A monthly budget totals all sales, costs and profit to give the full financial picture.",
  },
  {
    id: 165,
    category: "Financial Literacy",
    question:
      'What does "Earn honestly" mean for a Hustling Academy participant?',
    answer:
      "Charge fair prices, deliver what you promise, never deceive customers — build a reputation people trust.",
  },
  {
    id: 166,
    category: "Financial Literacy",
    question:
      "Why is a 60% reinvestment rate so important in the early stages?",
    answer:
      "Because the business needs constant stock, materials and tools to keep serving customers and growing income.",
  },
  {
    id: 167,
    category: "Financial Literacy",
    question: "What is the risk of spending all profit on personal needs?",
    answer:
      "You will have no materials to complete the next job, and no savings for emergencies — the business stalls.",
  },
  {
    id: 168,
    category: "Financial Literacy",
    question: "How can you track whether your income is growing?",
    answer:
      "Compare your monthly profit totals month by month — if the number increases, the hustle is growing.",
  },
  {
    id: 169,
    category: "Financial Literacy",
    question: "What is one way to reduce costs in a sewing hustle?",
    answer:
      "Buy fabric in bulk, share transport costs with others, or source donated materials through community networks.",
  },
  {
    id: 170,
    category: "Financial Literacy",
    question: "What is the relationship between reinvestment and growth?",
    answer:
      "The more you reinvest in better materials and tools, the better your product quality, the more customers you attract, and the higher your income grows.",
  },
  {
    id: 171,
    category: "Financial Literacy",
    question: "How does the 60-30-10 model change as income grows?",
    answer:
      "The percentages stay the same but the actual amounts grow — R600 from R1,000 profit becomes R6,000 from R10,000 profit.",
  },
  {
    id: 172,
    category: "Financial Literacy",
    question: "What is the Kids Haven approach to financial discipline?",
    answer:
      "Small, consistent discipline beats one lucky sale. Track every rand, split every profit, and repeat the cycle.",
  },
  {
    id: 173,
    category: "Financial Literacy",
    question: "What should you do the first week you earn any profit?",
    answer:
      "Physically separate your profit into three portions — even if small — to begin the discipline of the 60-30-10 split immediately.",
  },
  {
    id: 174,
    category: "Financial Literacy",
    question:
      "Can the 60-30-10 rule work for a digital hustle like graphic design?",
    answer:
      "Yes. 60% covers data, software subscriptions, and equipment. 30% covers personal needs. 10% goes to savings.",
  },
  {
    id: 175,
    category: "Financial Literacy",
    question:
      "What does Tumelo learn from doing his sums properly for the first time?",
    answer:
      "That he had been guessing before. Writing down real numbers showed him exactly where every rand was going — and gave him control.",
  },
  {
    id: 176,
    category: "Financial Literacy",
    question:
      "Name two signs that a hustle has moved from Survival to Stability.",
    answer:
      "Repeat customers are ordering regularly, and income arrives weekly rather than sporadically.",
  },
  {
    id: 177,
    category: "Financial Literacy",
    question: "What is the Growth stage goal beyond Stability?",
    answer:
      "Referrals bring in more work than one person can handle — possibly training another young person to help.",
  },
  {
    id: 178,
    category: "Financial Literacy",
    question: "Why track profit per sale AND monthly total?",
    answer:
      "Per-sale tracking shows if each job is profitable. Monthly totals show the bigger picture and inform your budget plan.",
  },
  {
    id: 179,
    category: "Financial Literacy",
    question:
      "What is Tumelo's furniture up-cycling profit example from Pillar 1?",
    answer:
      "A repaired chair costs R40 in materials and sells for R150 — a profit of R110 per chair.",
  },
  {
    id: 180,
    category: "Financial Literacy",
    question: "What is the action challenge at the end of Finance Day 3?",
    answer:
      "Choose one place to keep savings safe — a jar, stokvel, bank or mobile wallet — and start it that week, even with R10.",
  },
  {
    id: 181,
    category: "Financial Literacy",
    question:
      "What does the savings portion become over 12 months of consistent saving?",
    answer:
      "A meaningful reserve that can fund a slow month, buy a better tool, or cover an unexpected expense without debt.",
  },
  {
    id: 182,
    category: "Financial Literacy",
    question: "If profit is R800, how much goes to personal needs?",
    answer: "R240 (30% of R800).",
  },
  {
    id: 183,
    category: "Financial Literacy",
    question: "If profit is R800, how much is reinvested?",
    answer: "R480 (60% of R800).",
  },
  {
    id: 184,
    category: "Financial Literacy",
    question: "If profit is R800, how much is saved?",
    answer: "R80 (10% of R800).",
  },
  {
    id: 185,
    category: "Financial Literacy",
    question: "What is the first step of the Earn → Reinvest → Grow model?",
    answer:
      "Make a sale — then immediately calculate your profit before spending anything.",
  },
  {
    id: 186,
    category: "Financial Literacy",
    question: "What is the last step of the Earn → Reinvest → Grow model?",
    answer:
      "Repeat the cycle. Every sale restarts the process — building income, stability and savings each time.",
  },
  {
    id: 187,
    category: "Financial Literacy",
    question: "What is Tumelo's savings method at Kids Haven?",
    answer:
      "He keeps a savings jar at Kids Haven — a simple, physical way to separate and protect his 10%.",
  },
  {
    id: 188,
    category: "Financial Literacy",
    question: "Why is the profit split important even when amounts are small?",
    answer:
      "Because the habit itself is the lesson. Small splits build the discipline needed to manage larger amounts as income grows.",
  },
  {
    id: 189,
    category: "Financial Literacy",
    question: "What is one sign you are not tracking your costs properly?",
    answer:
      "You feel busy and seem to be selling well, but you never have money left over — you are confusing revenue with profit.",
  },
  {
    id: 190,
    category: "Financial Literacy",
    question: "What does a budget tell you that a single sale cannot?",
    answer:
      "A budget reveals patterns — whether income is growing, where money is leaking, and how close you are to your income targets.",
  },
  {
    id: 191,
    category: "Financial Literacy",
    question: "What three things does splitting profit build simultaneously?",
    answer:
      "Stock and business capacity (60%), personal stability (30%), and a financial safety net (10%).",
  },
  {
    id: 192,
    category: "Financial Literacy",
    question: "What is the profit formula in words?",
    answer:
      "Profit equals what the customer pays you, minus everything it cost you to deliver the product or service.",
  },
  {
    id: 193,
    category: "Financial Literacy",
    question: "What makes a hustle financially sustainable?",
    answer:
      "Tracking costs, knowing your profit, reinvesting consistently, covering personal needs, and saving — every single sale.",
  },
  {
    id: 194,
    category: "Financial Literacy",
    question:
      "What is the Kids Haven principle about success and responsibility?",
    answer:
      "Success often starts with responsibility, not money. You do not need a perfect plan, expensive equipment, or permission.",
  },
  {
    id: 195,
    category: "Financial Literacy",
    question:
      "What is the minimum savings amount Kids Haven recommends to start with?",
    answer:
      "Start with even R10. The habit and consistency matter more than the size of the amount.",
  },
  {
    id: 196,
    category: "Financial Literacy",
    question:
      "Why might two hustlers with the same revenue end up with different profits?",
    answer:
      "Because their costs differ. Lower costs mean higher profit from the same revenue.",
  },
  {
    id: 197,
    category: "Financial Literacy",
    question:
      "What does Tumelo's story teach about moving from Survival to Stability?",
    answer:
      "It happened gradually — one chair at a time, one repeat customer at a time. Stability is built through showing up consistently.",
  },
  {
    id: 198,
    category: "Financial Literacy",
    question: 'What is the difference between "income" in Stage 1 and Stage 2?',
    answer:
      "Stage 1 income is inconsistent and unpredictable. Stage 2 income is regular and weekly from repeat customers.",
  },
  {
    id: 199,
    category: "Financial Literacy",
    question: "What is a practical way to reinvest 60% in a baking hustle?",
    answer:
      "Buy flour, sugar, butter, packaging, and gas in bulk — keeping the business stocked for the next batch of orders.",
  },
  {
    id: 200,
    category: "Financial Literacy",
    question: "What is the final Kids Haven financial message?",
    answer:
      "Start small. Learn fast. Serve people well. Earn honestly. Save consistently. Grow steadily. Earn. Save. Grow.",
  },

  // ── Entrepreneurship (Pillar 1) ────────────────────────────────────────────
  {
    id: 201,
    category: "Entrepreneurship",
    question: "What does a hustler do differently from most people?",
    answer:
      "A hustler looks for opportunities. Most people wait for them. A hustler asks: What can I do with what I already have?",
  },
  {
    id: 202,
    category: "Entrepreneurship",
    question:
      "What are 5 examples of things you already have that can become income?",
    answer:
      "Time, energy, a cellphone, a bicycle, willing hands, knowledge, or a skill — all of these can generate income.",
  },
  {
    id: 203,
    category: "Entrepreneurship",
    question: "What are the 5 Qualities of Successful Hustlers?",
    answer:
      "They Show Up, They Learn Fast, They Respect Customers, They Keep Going, and They Solve Problems.",
  },
  {
    id: 204,
    category: "Entrepreneurship",
    question: "Why is showing up a skill for a hustler?",
    answer:
      "Many opportunities are lost because people are late or unreliable. Being punctual and consistent sets you apart immediately.",
  },
  {
    id: 205,
    category: "Entrepreneurship",
    question: "What is the Opportunity Formula?",
    answer:
      "Skill + Problem + Customer = Income. Every hustle must bring these three things together.",
  },
  {
    id: 206,
    category: "Entrepreneurship",
    question: "How do you spot a business opportunity in your community?",
    answer:
      "Look for what people complain about, struggle with, or what takes too much of their time. These problems are business opportunities.",
  },
  {
    id: 207,
    category: "Entrepreneurship",
    question: "What is the Simple Hustle Canvas?",
    answer:
      "Five questions every hustle must answer: What can I do? Who needs it? What problem am I solving? What does it cost me? What do I earn?",
  },
  {
    id: 208,
    category: "Entrepreneurship",
    question: "What do customers really buy?",
    answer:
      "Customers buy solutions, not products. A sandwich buyer is really buying convenience, hunger relief and time.",
  },
  {
    id: 209,
    category: "Entrepreneurship",
    question: "What is the academy's goal for participants according to Day 1?",
    answer:
      "To earn honestly, meet daily needs, reduce stress, become independent, and create opportunities — not to get rich overnight.",
  },
  {
    id: 210,
    category: "Entrepreneurship",
    question: "What is Tumelo's hustle?",
    answer:
      "Furniture up-cycling — repairing wobbly legs, sanding, re-varnishing and reupholstering donated furniture.",
  },
  {
    id: 211,
    category: "Entrepreneurship",
    question: "What problem does Tumelo's hustle solve?",
    answer:
      "People want good furniture without paying new-furniture prices. He fills the gap between too expensive (new) and too worn (donated).",
  },
  {
    id: 212,
    category: "Entrepreneurship",
    question: "What is a Community Opportunity Map?",
    answer:
      "A way of thinking about places nearby — schools, churches, taxi ranks, local businesses — and what services they might need.",
  },
  {
    id: 213,
    category: "Entrepreneurship",
    question:
      "Name four example hustles that could come from spotting community problems.",
    answer:
      "Gardening (overgrown yards), car washing (no time), tutoring (homework struggles), furniture up-cycling (broken items).",
  },
  {
    id: 214,
    category: "Entrepreneurship",
    question: 'What does "respecting customers" mean for a hustler?',
    answer:
      "Treating customers as people first — being friendly, honest, on time, and grateful for every sale.",
  },
  {
    id: 215,
    category: "Entrepreneurship",
    question:
      "What is the action challenge from Day 1 of Business Foundations?",
    answer:
      'Ask five people: "What am I good at?" Write down their answers. You may discover skills you never noticed.',
  },
  {
    id: 216,
    category: "Entrepreneurship",
    question: "Where does your hustle idea often come from?",
    answer:
      "The overlap between what you can do, what you enjoy, and what people often ask you to help with.",
  },
  {
    id: 217,
    category: "Entrepreneurship",
    question: "What did Tumelo have before starting his hustle?",
    answer:
      "No workshop, no truck, no money for materials — only willing hands, knowledge of woodwork, and a pile of broken chairs.",
  },
  {
    id: 218,
    category: "Entrepreneurship",
    question: "What lesson does Tumelo's friend teach about waiting to start?",
    answer:
      "His friend waited two years for a whole shop before starting a car wash. Another just picked up a bucket and started that same week. Start with what you have.",
  },
  {
    id: 219,
    category: "Entrepreneurship",
    question: "What is the Income Journey? Name the three stages.",
    answer:
      "Stage 1: Survival (R500–R2,000). Stage 2: Stability (R2,846–R5,000). Stage 3: Growth (R5,000+).",
  },
  {
    id: 220,
    category: "Entrepreneurship",
    question: "What does the Growth Secret say about business growth?",
    answer:
      "Growth is rarely one big moment. It comes from showing up, giving good service, repeat customers, continuous learning and consistency.",
  },
  {
    id: 221,
    category: "Entrepreneurship",
    question: "What is a 90-Day Plan used for in the programme?",
    answer:
      "To set a hustle target — identifying the hustle, the customer, monthly income goal, and customers needed each week.",
  },
  {
    id: 222,
    category: "Entrepreneurship",
    question: "What is the 4-Step Sales Conversation?",
    answer:
      "1. Greet warmly. 2. Introduce yourself and what you do. 3. Explain your value. 4. Ask for the sale.",
  },
  {
    id: 223,
    category: "Entrepreneurship",
    question: "What makes free marketing powerful for hustlers?",
    answer:
      "It costs nothing. Word of mouth, WhatsApp Status, before-and-after photos, and referrals reach real customers without spending money on ads.",
  },
  {
    id: 224,
    category: "Entrepreneurship",
    question: "What is the purpose of a 30-second sales pitch?",
    answer:
      "To clearly introduce who you are, what you do, and how you help — so a potential customer can quickly understand your value.",
  },
  {
    id: 225,
    category: "Entrepreneurship",
    question: "What is a referral and why does it matter?",
    answer:
      "A referral is when a happy customer tells someone else about you. It is free advertising from a trusted source.",
  },
  {
    id: 226,
    category: "Entrepreneurship",
    question: "How does Tumelo find his first customers?",
    answer:
      "He posted a before-and-after WhatsApp status, told Kids Haven staff, the youth hub, and two aunties near the taxi rank.",
  },
  {
    id: 227,
    category: "Entrepreneurship",
    question: "What is trust in a business context?",
    answer:
      "People believe you will arrive, do the work, charge fairly, and keep your word — every single time.",
  },
  {
    id: 228,
    category: "Entrepreneurship",
    question: "What are the Five Golden Rules of trust for a hustler?",
    answer:
      "Be On Time. Be Honest. Be Respectful. Communicate proactively. Say Thank You.",
  },
  {
    id: 229,
    category: "Entrepreneurship",
    question: "Why does trust create repeat business?",
    answer:
      "When customers trust you, they return — and tell others. Repeat business creates the stable income that moves you from Survival to Stability.",
  },
  {
    id: 230,
    category: "Entrepreneurship",
    question: "What should you do if you cannot meet a deadline you promised?",
    answer:
      "Communicate first, before the customer has to chase you. Explain honestly and offer a new, realistic commitment.",
  },
  {
    id: 231,
    category: "Entrepreneurship",
    question: "What is the story of Tumelo's varnish delay?",
    answer:
      "The table needed one more day to dry. Instead of staying silent, he messaged the customer early. She was impressed, not upset — and became a repeat customer.",
  },
  {
    id: 232,
    category: "Entrepreneurship",
    question: "How many people can one unhappy customer tell?",
    answer:
      "One unhappy customer can tell ten people. One happy customer can also tell ten people. You choose which story spreads.",
  },
  {
    id: 233,
    category: "Entrepreneurship",
    question: "What is the Kids Haven message about starting a business?",
    answer:
      "You do not need a perfect plan, expensive equipment, or permission. Start small, learn fast, serve people well.",
  },
  {
    id: 234,
    category: "Entrepreneurship",
    question:
      "What are three examples of hustles available at schools or churches?",
    answer:
      "Schools: tutoring, printing, snacks. Churches: cleaning, gardening, event support.",
  },
  {
    id: 235,
    category: "Entrepreneurship",
    question: 'What does "learning fast" mean for a hustler?',
    answer:
      "Treating every mistake as a lesson. Hustlers do not wait to be trained — they act, observe, adjust, and keep improving.",
  },
  {
    id: 236,
    category: "Entrepreneurship",
    question: "Why do hustlers keep going on slow days?",
    answer:
      "Because consistency is what separates people who stay in Survival from those who reach Stability and Growth.",
  },
  {
    id: 237,
    category: "Entrepreneurship",
    question: 'What does "money follows solutions" mean?',
    answer:
      "The more problems you solve for people, the more they are willing to pay you. Find real problems and you will find income.",
  },
  {
    id: 238,
    category: "Entrepreneurship",
    question: "What hustle does Tumelo's canvas show?",
    answer:
      "What: woodwork repairs and up-cycling. Who: young renters and families. Problem: expensive new furniture. Cost: R40. Earnings: R150 per piece.",
  },
  {
    id: 239,
    category: "Entrepreneurship",
    question:
      "What is the action challenge from Day 3 of Business Foundations?",
    answer:
      'Show your Hustle Canvas to two people and ask: "Would you pay for this?" Listen carefully to the feedback.',
  },
  {
    id: 240,
    category: "Entrepreneurship",
    question: "What does Tumelo's story teach about problem-spotting?",
    answer:
      "He noticed that donated furniture piled up unsold — because it was broken but fixable. He saw the gap others walked past.",
  },
  {
    id: 241,
    category: "Entrepreneurship",
    question:
      "What is the action challenge from Day 2 of Business Foundations?",
    answer:
      "Interview one hustler in your community. Ask: What do you sell? Who buys? What challenges do you face? What advice can you give?",
  },
  {
    id: 242,
    category: "Entrepreneurship",
    question: "What does the Day 4 action challenge ask you to do?",
    answer:
      "Tell ten people about your hustle — not tomorrow, today. Take immediate action to spread the word.",
  },
  {
    id: 243,
    category: "Entrepreneurship",
    question: "What is a before-and-after photo used for in marketing?",
    answer:
      "It shows potential customers the transformation your service delivers — people trust what they can see.",
  },
  {
    id: 244,
    category: "Entrepreneurship",
    question: "What is an example of a 30-second pitch from the handbook?",
    answer:
      '"Hi, my name is Lerato. I help busy families keep their yards neat. I charge affordable prices and work weekends. May I leave you my number?"',
  },
  {
    id: 245,
    category: "Entrepreneurship",
    question: 'What makes a customer a "repeat customer"?',
    answer:
      "They had a good experience — product quality, fair price, on-time delivery and respectful communication — so they return.",
  },
  {
    id: 246,
    category: "Entrepreneurship",
    question: "How does Tumelo describe his own 30-second pitch?",
    answer:
      "\"Hi, I'm Tumelo. I fix up old furniture so it looks new again, for a fraction of the price. Send me a photo and I'll tell you if I can save it.\"",
  },
  {
    id: 247,
    category: "Entrepreneurship",
    question: "What is the Personal Reputation Score from Day 5?",
    answer:
      "A self-assessment of Punctuality, Honesty, Respect, Communication and Reliability — each scored out of 10.",
  },
  {
    id: 248,
    category: "Entrepreneurship",
    question:
      "What is a hustle's strongest marketing tool according to Pillar 1?",
    answer:
      "A happy customer who tells ten other people. Word-of-mouth referrals are free and trusted.",
  },
  {
    id: 249,
    category: "Entrepreneurship",
    question:
      "What type of hustles are mentioned as examples throughout Pillar 1?",
    answer:
      "Braiding, cooking, repairs, cleaning, gardening, baking, car washing, tutoring, babysitting, graphic design, reselling products.",
  },
  {
    id: 250,
    category: "Entrepreneurship",
    question: 'What does "becoming the person customers trust" require?',
    answer:
      "Consistent punctuality, honesty about what you can and cannot do, respectful communication, and always saying thank you.",
  },
  {
    id: 251,
    category: "Entrepreneurship",
    question:
      "What are the three things Tumelo's Hustle Canvas says he can do?",
    answer:
      "Repair wobbly legs, sand and re-varnish, and reupholster simple seats.",
  },
  {
    id: 252,
    category: "Entrepreneurship",
    question:
      "What is the main difference between a Survival hustler and a Stability hustler?",
    answer:
      "Survival: inconsistent income, few customers. Stability: repeat customers, reliable weekly income, regular demand.",
  },
  {
    id: 253,
    category: "Entrepreneurship",
    question: "How long did it take Tumelo to move from Survival to Stability?",
    answer:
      "About three months. By month three, three families and the Kids Haven charity shop were sending him regular work.",
  },
  {
    id: 254,
    category: "Entrepreneurship",
    question: "What is Tumelo's next goal after reaching Stability?",
    answer:
      "Growth — where referrals bring in more work than he can handle alone, possibly training another young person to help.",
  },
  {
    id: 255,
    category: "Entrepreneurship",
    question: "What should you focus on rather than what you do not have?",
    answer:
      "Focus on what you already have — your time, energy, skills, knowledge and willingness to work. These are your starting assets.",
  },
  {
    id: 256,
    category: "Entrepreneurship",
    question: 'What does "consistent income" look like at Stage 2 (Stability)?',
    answer:
      "Weekly income from repeat customers who regularly request your service — predictable rather than random.",
  },
  {
    id: 257,
    category: "Entrepreneurship",
    question: "How does Hustling Academy define a hustle in simple terms?",
    answer:
      "A hustle turns what you already have — your skills, time, hands — into real income that meets your needs.",
  },
  {
    id: 258,
    category: "Entrepreneurship",
    question:
      'Why does the handbook say to "Keep this handbook with you. Write in it. Fold the corners"?',
    answer:
      "Because a used handbook shows you have engaged with the learning. It becomes a record of your thinking and progress.",
  },
  {
    id: 259,
    category: "Entrepreneurship",
    question: "What is the overlap exercise from Day 1?",
    answer:
      "List 3 things you can do, 3 things you enjoy, and 3 things people ask you for help with. The overlap may be your hustle.",
  },
  {
    id: 260,
    category: "Entrepreneurship",
    question: 'What does Pillar 1, Day 6 call the "Growth Secret"?',
    answer:
      "Growth comes from showing up, giving good service, repeat customers, learning continuously, and consistency — not one big moment.",
  },
  {
    id: 261,
    category: "Entrepreneurship",
    question:
      'What does "the best product nobody knows about earns nothing" mean?',
    answer:
      "Having a great skill or product is not enough. You must actively find and tell customers — marketing is essential.",
  },
  {
    id: 262,
    category: "Entrepreneurship",
    question:
      "What is the difference between waiting for opportunity and looking for opportunity?",
    answer:
      "Waiters stay stuck. Hustlers take action — they look around, notice problems, and act before someone else does.",
  },
  {
    id: 263,
    category: "Entrepreneurship",
    question:
      "What four things do taxi rank customers typically need from hustlers?",
    answer:
      "Snacks, drinks, phone accessories, and top-up services — quick, convenient items for commuters on the move.",
  },
  {
    id: 264,
    category: "Entrepreneurship",
    question:
      "How does building a waiting list show you have moved to Growth stage?",
    answer:
      "When demand exceeds what you can supply alone, you have more customers than capacity — the definition of business growth.",
  },
  {
    id: 265,
    category: "Entrepreneurship",
    question: "What is the purpose of telling your story as a hustler?",
    answer:
      "Stories build trust and connection. When customers hear your journey, they root for you and are more likely to buy.",
  },
  {
    id: 266,
    category: "Entrepreneurship",
    question: 'What does "being honest" as a rule mean in practice?',
    answer:
      "Never promise what you cannot deliver. If you cannot meet a deadline or quality standard, say so before the customer has to ask.",
  },
  {
    id: 267,
    category: "Entrepreneurship",
    question: "What makes WhatsApp Status an effective free marketing tool?",
    answer:
      "It reaches your existing contacts directly, is visual, and updates regularly — keeping your hustle visible to people who already know you.",
  },
  {
    id: 268,
    category: "Entrepreneurship",
    question: "What is the Hustling Academy's definition of success?",
    answer:
      "Not fancy offices or luxury cars — success is food, transport, rent support, dignity and stability.",
  },
  {
    id: 269,
    category: "Entrepreneurship",
    question:
      "What is the Kids Haven programme that Hustling Academy is part of?",
    answer:
      "The Pathway Programme — supporting young people transitioning out of residential care and disadvantaged youth in Ekurhuleni.",
  },
  {
    id: 270,
    category: "Entrepreneurship",
    question:
      "What is one thing Tumelo's story teaches about earning a reputation?",
    answer:
      "Communicating proactively — even to deliver bad news — builds more trust than silence or excuses ever could.",
  },
  {
    id: 271,
    category: "Entrepreneurship",
    question: 'What does "serve people well" mean for a hustler?',
    answer:
      "Deliver quality work, communicate clearly, keep your promises, follow up after the sale, and treat every customer with respect.",
  },
  {
    id: 272,
    category: "Entrepreneurship",
    question: "How does the Simple Hustle Canvas help a new entrepreneur?",
    answer:
      "It structures your idea into five clear answers — making sure you have thought about your customer, costs and profit before starting.",
  },
  {
    id: 273,
    category: "Entrepreneurship",
    question: "What does the Day 5 action challenge ask you to do?",
    answer:
      "Choose one area of your reputation (punctuality, honesty, respect, communication, reliability) to actively improve that week.",
  },
  {
    id: 274,
    category: "Entrepreneurship",
    question: "What are two hustles that local businesses might pay for?",
    answer:
      "Cleaning services and delivery/courier services — practical, recurring needs that many small businesses outsource.",
  },
  {
    id: 275,
    category: "Entrepreneurship",
    question:
      "What is the Kids Haven programme motto printed on the handbook cover?",
    answer:
      '"Good things come to those who hustle." — emphasising that results come from action, not waiting.',
  },
  {
    id: 276,
    category: "Entrepreneurship",
    question: "Why does every day in the handbook follow the same structure?",
    answer:
      "So learners always know what is coming — a theme, lessons, Tumelo's story, exercises, an action challenge, and a day summary.",
  },
  {
    id: 277,
    category: "Entrepreneurship",
    question: 'What does "gratitude is free" mean in the Five Golden Rules?',
    answer:
      "Saying thank you costs nothing but creates a positive lasting impression that encourages customers to return and refer others.",
  },
  {
    id: 278,
    category: "Entrepreneurship",
    question: "What kind of customer does Tumelo primarily serve?",
    answer:
      "Young people renting their first flat and mothers furnishing a home on a tight budget — people who need quality without high prices.",
  },
  {
    id: 279,
    category: "Entrepreneurship",
    question: "What did Tumelo have by the end of the 15-day programme?",
    answer:
      "A name for his hustle, steady customers, a working budget, and a reputation people trusted.",
  },
  {
    id: 280,
    category: "Entrepreneurship",
    question: "What is the final check-in question from Tumelo's Journey?",
    answer:
      "What is my hustle? Who is my customer? What is my monthly profit target? How will I split 60-30-10? How will people find me? How will they come back?",
  },
  {
    id: 281,
    category: "Entrepreneurship",
    question: "What is the programme's approach to mistakes?",
    answer:
      "Every mistake teaches something. Hustlers learn fast — they do not fear mistakes, they mine them for lessons.",
  },
  {
    id: 282,
    category: "Entrepreneurship",
    question:
      "What is the difference between selling your time and selling a solution?",
    answer:
      "Selling time is charging per hour. Selling a solution is charging for the outcome — what the customer gains — which is often worth more.",
  },
  {
    id: 283,
    category: "Entrepreneurship",
    question: 'Why does the handbook say "Start small"?',
    answer:
      "Because starting small removes the barrier of waiting for perfect conditions. Action now beats a perfect plan that never begins.",
  },
  {
    id: 284,
    category: "Entrepreneurship",
    question: "What does Kids Haven say about needing permission to start?",
    answer:
      "You do not need permission. You need a skill, a customer who has a problem, and the courage to offer your solution.",
  },
  {
    id: 285,
    category: "Entrepreneurship",
    question:
      "What is the key difference between a problem and a business opportunity?",
    answer:
      "A problem with a paying customer willing to solve it is a business opportunity. No customer means no income.",
  },
  {
    id: 286,
    category: "Entrepreneurship",
    question: 'How does Hustling Academy define the word "hustle"?',
    answer:
      "Turning what you already have — your skills, time, and hands — into honest income that meets your needs and builds your future.",
  },
  {
    id: 287,
    category: "Entrepreneurship",
    question: "What does Pillar 1 teach about reliability and opportunity?",
    answer:
      "Many opportunities are lost because people are late or unreliable. Being reliable is itself a skill that creates a competitive advantage.",
  },
  {
    id: 288,
    category: "Entrepreneurship",
    question:
      "Name three things that can be turned into income according to Day 1.",
    answer:
      "Knowledge, a skill, a cellphone, energy, time, a bicycle, willing hands — all of these have economic value.",
  },
  {
    id: 289,
    category: "Entrepreneurship",
    question: "What is Tumelo's journey summarised in one sentence?",
    answer:
      "He started with broken chairs and willing hands, and built a trusted furniture up-cycling business serving repeat customers within three months.",
  },
  {
    id: 290,
    category: "Entrepreneurship",
    question: 'What does "Earn. Save. Grow." represent as a life philosophy?',
    answer:
      "It is a cycle of intention: earn honestly, save consistently, and grow steadily — creating independence and opportunity over time.",
  },
  {
    id: 291,
    category: "Entrepreneurship",
    question: "What is the Day 6 transition lesson about?",
    answer:
      "It bridges Business Foundations and Finance — showing that moving from Survival to Stability requires understanding and managing money, not just earning it.",
  },
  {
    id: 292,
    category: "Entrepreneurship",
    question: "What is the Kids Haven Pathway Programme designed to do?",
    answer:
      "Support young people leaving residential care and those from disadvantaged communities in Ekurhuleni to build independent, stable lives.",
  },
  {
    id: 293,
    category: "Entrepreneurship",
    question: "What does the handbook say about equipment when starting?",
    answer:
      "You do not need expensive equipment. Many successful hustles start with what is already available — a phone, tools at hand, or borrowed items.",
  },
  {
    id: 294,
    category: "Entrepreneurship",
    question: 'What does "problem-solving" mean as a hustler quality?',
    answer:
      "Looking at what people struggle with and offering a service that removes that struggle — because money follows solutions.",
  },
  {
    id: 295,
    category: "Entrepreneurship",
    question: "How can a school or church become a client for your hustle?",
    answer:
      "Schools need tutoring, printing and snack sales. Churches need cleaning, gardening and event support — ongoing, reliable opportunities.",
  },
  {
    id: 296,
    category: "Entrepreneurship",
    question:
      "Why does Tumelo repair donated furniture rather than making new pieces?",
    answer:
      "He identified a specific gap — families want quality furniture but cannot afford new. Repairing donated pieces fills that gap at low cost.",
  },
  {
    id: 297,
    category: "Entrepreneurship",
    question:
      'What does the handbook mean by "your hustle is not finished — it\'s just steady"?',
    answer:
      "Stability is not the end goal — it is the platform. Once steady, you keep learning, growing and possibly expanding.",
  },
  {
    id: 298,
    category: "Entrepreneurship",
    question: "What is the Kids Haven contact email for the Academy?",
    answer:
      "youth@kidshaven.co.za — for youth who want to engage with the Hustling Academy programme.",
  },
  {
    id: 299,
    category: "Entrepreneurship",
    question:
      "What is the connection between customer trust and stable income?",
    answer:
      "Trust → repeat business → predictable income. Without trust, every customer is a one-off — unstable and exhausting.",
  },
  {
    id: 300,
    category: "Entrepreneurship",
    question: "What does Kids Haven say is enough to start your journey?",
    answer:
      "A skill, a problem worth solving, a customer willing to pay, and the commitment to show up — nothing more is required.",
  },

  // ── Sales (Pillar 3) ───────────────────────────────────────────────────────
  {
    id: 301,
    category: "Sales",
    question: "What is the simple definition of marketing?",
    answer: "Marketing is helping people know, like, trust, and buy from you.",
  },
  {
    id: 302,
    category: "Sales",
    question: "What is a target audience?",
    answer:
      "The group of people most likely to buy your product or service. You cannot sell to everyone — focus on who needs you most.",
  },
  {
    id: 303,
    category: "Sales",
    question: "What is a customer persona?",
    answer:
      "A simple profile of your ideal customer — including their name, age, occupation, interests and the problem they need solved.",
  },
  {
    id: 304,
    category: "Sales",
    question: "Who is Tumelo's customer persona?",
    answer:
      "Ayanda, age 24, retail assistant, just moved into her own flat. Wants a homely space but cannot afford new furniture.",
  },
  {
    id: 305,
    category: "Sales",
    question: "Why do people buy products?",
    answer:
      "People buy for convenience, status, safety, happiness, to save money, or to solve a specific problem.",
  },
  {
    id: 306,
    category: "Sales",
    question: "What is the Problem → Solution → Benefit formula?",
    answer:
      "State the problem your customer has, explain your solution, then describe the benefit they get. Builds a clear, compelling message.",
  },
  {
    id: 307,
    category: "Sales",
    question: "Give an example of the Problem → Solution → Benefit formula.",
    answer:
      'Problem: dirty car. Solution: car wash service. Benefit: looks great and saves time. Message: "Get your car shining while you shop."',
  },
  {
    id: 308,
    category: "Sales",
    question: "What are the three elements of a good social media post?",
    answer:
      'Photo + Short message + Call to action. Example: "Fresh homemade vetkoek today! Order on WhatsApp."',
  },
  {
    id: 309,
    category: "Sales",
    question: "What free social media tools can a hustler use?",
    answer:
      "Facebook, WhatsApp Business, TikTok and Instagram are all free — and they reach large audiences at no cost.",
  },
  {
    id: 310,
    category: "Sales",
    question: "What are the 6 Basic Sales Steps?",
    answer:
      "Greet → Ask questions → Listen → Explain benefits → Ask for the sale → Thank the customer.",
  },
  {
    id: 311,
    category: "Sales",
    question: 'What does "sales is helping, not forcing" mean?',
    answer:
      "Good selling is about understanding what the customer needs and showing how your product or service meets that need — not pressure or begging.",
  },
  {
    id: 312,
    category: "Sales",
    question: "What makes a marketing message bad?",
    answer:
      'Complicated language, jargon, or vague claims nobody understands. Example: "integrated service solutions" tells a customer nothing useful.',
  },
  {
    id: 313,
    category: "Sales",
    question: "What makes a marketing message good?",
    answer:
      "Simple, clear, honest and easy to remember. It speaks directly to the customer's problem and the benefit they will get.",
  },
  {
    id: 314,
    category: "Sales",
    question: "Why do people remember stories better than facts?",
    answer:
      "Stories connect emotionally. A simple business story — problem, solution, result — is far more memorable than a list of features.",
  },
  {
    id: 315,
    category: "Sales",
    question: "What is storytelling for marketing?",
    answer:
      "Answering three questions: What problem existed? What did you do? How did it help people? Then sharing that story simply.",
  },
  {
    id: 316,
    category: "Sales",
    question: "What is Tumelo's marketing message?",
    answer:
      "\"Good furniture doesn't have to be new furniture.\" Simple, honest and directly aimed at his target customer's mindset.",
  },
  {
    id: 317,
    category: "Sales",
    question: "What did Tumelo post on WhatsApp Status?",
    answer:
      'A before-and-after photo, his marketing message, and "DM me for prices." Two people messaged him within the hour.',
  },
  {
    id: 318,
    category: "Sales",
    question: "What should a simple advertisement include?",
    answer:
      "Business name, an image, your offer (what you sell and the price), and your contact details.",
  },
  {
    id: 319,
    category: "Sales",
    question:
      "What free app does the handbook recommend for creating advertisements?",
    answer:
      "Canva — a free design app accessible on smartphones that allows anyone to create professional-looking flyers and adverts.",
  },
  {
    id: 320,
    category: "Sales",
    question: "What did Tumelo's Canva flyer include?",
    answer:
      'A bright photo of his best chair, "Tumelo\'s Furniture Fix-Ups," his prices, and his WhatsApp number.',
  },
  {
    id: 321,
    category: "Sales",
    question: "What is a call to action in a social media post?",
    answer:
      'A clear instruction that tells the customer what to do next — "Order now on WhatsApp," "Send me a message," or "Call today."',
  },
  {
    id: 322,
    category: "Sales",
    question: "What is a target audience for up-cycled furniture?",
    answer:
      "Young renters, small families, and budget-conscious buyers — people who need quality furniture without paying new prices.",
  },
  {
    id: 323,
    category: "Sales",
    question: "What is a target audience for baby clothes?",
    answer:
      "Parents — specifically new parents looking for quality, affordable clothing for their babies.",
  },
  {
    id: 324,
    category: "Sales",
    question: "What is a target audience for school uniforms?",
    answer:
      "Parents and schools — particularly at the start of each school year when new uniforms are needed.",
  },
  {
    id: 325,
    category: "Sales",
    question: "Why can't you sell to everyone?",
    answer:
      "Different people have different problems, needs and budgets. Focusing on a specific group allows you to tailor your message and product precisely.",
  },
  {
    id: 326,
    category: "Sales",
    question: "What is the action challenge from Marketing Day 2?",
    answer:
      "Write one Facebook post, one WhatsApp advert, and one TikTok promotion idea for your hustle using Photo + Message + Call to action.",
  },
  {
    id: 327,
    category: "Sales",
    question: "How does a customer persona help Tumelo choose his photos?",
    answer:
      "Once he pictured Ayanda, he knew exactly what she valued — a homely look on a budget. He posted photos that spoke directly to her.",
  },
  {
    id: 328,
    category: "Sales",
    question: "What is an example of a bad marketing message rewritten well?",
    answer:
      'Bad: "premium refurbishment solutions for pre-owned domestic furnishings." Good: "We fix up old furniture so it looks new again — affordable prices."',
  },
  {
    id: 329,
    category: "Sales",
    question: "What is the action challenge from Marketing Day 3?",
    answer:
      "Design one advertisement for your hustle this week — on Canva, your phone, or paper — and share it with at least five people.",
  },
  {
    id: 330,
    category: "Sales",
    question:
      "What is the Tumelo furniture story told as a Problem → Solution → Benefit?",
    answer:
      "Problem: empty flat, no budget for new furniture. Solution: up-cycled chairs and tables. Benefit: a homely space at a fraction of new prices.",
  },
  {
    id: 331,
    category: "Sales",
    question: 'What does "know, like, trust, buy" mean in marketing?',
    answer:
      "Customers must know you exist, like what you offer, trust you to deliver, and then make the buying decision. Marketing moves them through each stage.",
  },
  {
    id: 332,
    category: "Sales",
    question:
      "What marketing influences make people choose brands like KFC or Nike?",
    answer:
      "Quality, popularity, affordability, appearance, and friends' recommendations. These same forces apply to your hustle.",
  },
  {
    id: 333,
    category: "Sales",
    question: "What is the group activity from Marketing Day 3?",
    answer:
      "Choose a business and develop: target audience, customer persona, marketing message, social media post, advertisement and sales pitch.",
  },
  {
    id: 334,
    category: "Sales",
    question: "What question should you ask after building a sales pitch?",
    answer:
      '"Would you pay for this?" Test your idea with real people before investing too much time or money.',
  },
  {
    id: 335,
    category: "Sales",
    question: "What is the most important step in the 6 Basic Sales Steps?",
    answer:
      "Listen — ask questions first and genuinely understand what the customer needs before pitching your product.",
  },
  {
    id: 336,
    category: "Sales",
    question:
      "Why is listening before explaining important in a sales conversation?",
    answer:
      "If you talk before you listen, you may pitch the wrong thing. Listening reveals exactly which benefit matters most to this specific customer.",
  },
  {
    id: 337,
    category: "Sales",
    question: 'What is an "offer" in an advertisement?',
    answer:
      "A clear statement of what you are selling, at what price, and why the customer should act now.",
  },
  {
    id: 338,
    category: "Sales",
    question: "How does Tumelo ask for the sale with his furniture customer?",
    answer:
      'He greeted her, asked what she needed the piece for, listened, explained how the wood would last, then simply asked: "Would you like me to start this week?"',
  },
  {
    id: 339,
    category: "Sales",
    question: "What is the Marketing Pillar's simple definition of sales?",
    answer:
      "Helping someone make a buying decision. Not forcing. Not begging. Helping.",
  },
  {
    id: 340,
    category: "Sales",
    question: 'What does "look good, sell better" mean?',
    answer:
      "Good visuals — clear, bright, relevant images — attract attention before words do. Professional-looking content builds credibility and trust.",
  },
  {
    id: 341,
    category: "Sales",
    question: "Why do good visuals matter in marketing?",
    answer:
      "People notice images before words. A strong visual tells your story instantly and makes your product look worth the price.",
  },
  {
    id: 342,
    category: "Sales",
    question: "What should good visuals be?",
    answer:
      "Clear, bright, easy to understand, and directly relevant to the product or service being sold.",
  },
  {
    id: 343,
    category: "Sales",
    question: "What is the marketing action challenge from Day 1?",
    answer:
      "Ask three people who have bought from you: Who are you? What age? Where do you spend time? What problems do you have? Use this to build your persona.",
  },
  {
    id: 344,
    category: "Sales",
    question: "What does Tumelo's customer persona reveal about his marketing?",
    answer:
      "He stops trying to reach everyone and focuses on one type of customer — Ayanda — making his posts, prices and pitch much more effective.",
  },
  {
    id: 345,
    category: "Sales",
    question: "What is one reason young customers choose a brand or service?",
    answer:
      "A friend's recommendation — word of mouth from a trusted peer carries more weight than any paid advertisement.",
  },
  {
    id: 346,
    category: "Sales",
    question:
      'What does "say the right thing to the right person" mean in marketing?',
    answer:
      "Different customers respond to different messages. Knowing your persona means you can speak directly to their specific problem and desire.",
  },
  {
    id: 347,
    category: "Sales",
    question: "What is the three-part business story structure?",
    answer:
      "What problem existed? What did you do? How did it help people? Told simply and honestly, this builds connection and credibility.",
  },
  {
    id: 348,
    category: "Sales",
    question: "What is WhatsApp Business and why is it useful for a hustler?",
    answer:
      "A free version of WhatsApp designed for businesses — with a catalogue, quick replies and a business profile to look professional.",
  },
  {
    id: 349,
    category: "Sales",
    question:
      "Why is consistency in posting important for social media marketing?",
    answer:
      "Regular posts keep your hustle visible. Customers who see your work regularly are more likely to think of you when they need your service.",
  },
  {
    id: 350,
    category: "Sales",
    question: "What is a mini marketing campaign?",
    answer:
      "A small, planned set of marketing activities — target audience, persona, message, post, ad and pitch — all aligned to reach one group of customers.",
  },
  {
    id: 351,
    category: "Sales",
    question: 'What does "greet the customer" achieve in the 6 Sales Steps?',
    answer:
      "It creates a welcoming first impression and makes the customer feel comfortable — increasing their likelihood of buying.",
  },
  {
    id: 352,
    category: "Sales",
    question: 'What is a "call to action" and why is it essential?',
    answer:
      'A clear next step for the customer — without it, people may be interested but do nothing. "Message me now" converts interest into a sale.',
  },
  {
    id: 353,
    category: "Sales",
    question:
      "What is the difference between explaining features and explaining benefits?",
    answer:
      "A feature is what the product is. A benefit is what it does for the customer. Customers buy benefits — explain how it helps their life.",
  },
  {
    id: 354,
    category: "Sales",
    question: "How does a before-and-after photo sell Tumelo's service?",
    answer:
      "It shows the transformation visually — from broken, faded furniture to solid, varnished, shining pieces. Proof beats promises.",
  },
  {
    id: 355,
    category: "Sales",
    question:
      'What does "honest" mean in the context of a good marketing message?',
    answer:
      "Only promise what you can deliver. Never exaggerate quality or mislead customers — dishonest marketing destroys trust and reputation.",
  },
  {
    id: 356,
    category: "Sales",
    question: "What is the final day of Marketing about?",
    answer:
      "Visuals and sales skills — combining good-looking advertisements with a confident, structured sales conversation.",
  },
  {
    id: 357,
    category: "Sales",
    question: "Why should a sales pitch be under 30 seconds?",
    answer:
      "Customers have short attention spans. A tight, clear pitch respects their time and is more memorable than a long explanation.",
  },
  {
    id: 358,
    category: "Sales",
    question:
      "What type of questions should you ask in step 2 of the sales steps?",
    answer:
      'Open questions that help you understand what the customer needs — "What are you looking for?" "What does your space look like?"',
  },
  {
    id: 359,
    category: "Sales",
    question: "What is TikTok useful for in marketing a hustle?",
    answer:
      "Short, engaging videos showing your work process, before-and-after transformations, or tips — reaching a young audience organically and for free.",
  },
  {
    id: 360,
    category: "Sales",
    question: "What is the marketing pillar's summary of Day 1?",
    answer:
      "Marketing means helping people know, like, trust and buy. You cannot sell to everyone — define your target audience and build a persona.",
  },
  {
    id: 361,
    category: "Sales",
    question: 'What does "memorable" mean for a marketing message?',
    answer:
      "Simple enough that customers can repeat it — to themselves and to friends. If they can't remember it, they can't share it.",
  },
  {
    id: 362,
    category: "Sales",
    question: "What should you include when you thank a customer after a sale?",
    answer:
      'Genuine appreciation and an open invitation — "Let me know if you need anything else." This opens the door to the next sale.',
  },
  {
    id: 363,
    category: "Sales",
    question: "What is Tumelo's key insight from Marketing Day 2?",
    answer:
      "Once he built his message around Ayanda's specific situation, his WhatsApp status got two enquiries within the hour.",
  },
  {
    id: 364,
    category: "Sales",
    question:
      "What free tool can create a professional-looking flyer on a smartphone?",
    answer:
      "Canva — a free design app available on Android and iOS that requires no design skills.",
  },
  {
    id: 365,
    category: "Sales",
    question: 'What does "explain benefits" mean in the 6 Sales Steps?',
    answer:
      "Connect your product's qualities to what the customer actually gains — save money, save time, feel proud, feel safe.",
  },
  {
    id: 366,
    category: "Sales",
    question: "What is the marketing pillar's golden rule for messaging?",
    answer:
      "Say the right thing to the right person in a way they understand. Simplicity beats sophistication.",
  },
  {
    id: 367,
    category: "Sales",
    question: "What marketing activities can be done with just a smartphone?",
    answer:
      "WhatsApp Status posts, before-and-after photos, Canva flyers, Facebook posts, TikTok videos and Instagram stories — all free.",
  },
  {
    id: 368,
    category: "Sales",
    question: 'What does "ask for the sale" mean?',
    answer:
      'Directly invite the customer to buy: "Can I help you today?" or "Would you like me to start this week?" Don\'t wait — ask.',
  },
  {
    id: 369,
    category: "Sales",
    question: "How many steps are in the Basic Sales Steps?",
    answer:
      "Six: Greet → Ask questions → Listen → Explain benefits → Ask for the sale → Thank the customer.",
  },
  {
    id: 370,
    category: "Sales",
    question: "What is the marketing pillar's Day 3 summary?",
    answer:
      "Good visuals are clear, bright, easy to understand and relevant. Sales is helping. Follow all 6 sales steps every time.",
  },
  {
    id: 371,
    category: "Sales",
    question:
      'Why is "thank the customer" the final step in the sales process?',
    answer:
      "Gratitude leaves a positive lasting impression, encourages repeat purchases and motivates word-of-mouth referrals.",
  },
  {
    id: 372,
    category: "Sales",
    question: 'What is a "hustle\'s voice" in marketing?',
    answer:
      "The tone and personality of how you communicate — friendly, honest and professional — that makes customers feel comfortable buying from you.",
  },
  {
    id: 373,
    category: "Sales",
    question: 'What does "know your customer" achieve?',
    answer:
      "It ensures every marketing decision — your message, platform, visuals and pricing — speaks directly to the person most likely to buy.",
  },
  {
    id: 374,
    category: "Sales",
    question:
      "What is the difference between a marketing message and an advertisement?",
    answer:
      'A message is the core idea ("Good furniture doesn\'t have to be new"). An advertisement wraps the message in visuals, an offer and a call to action.',
  },
  {
    id: 375,
    category: "Sales",
    question: "How does Tumelo use storytelling to turn a chair into a sale?",
    answer:
      "He shares the before-and-after story — Ayanda's empty flat problem, his solution, and the benefit of a homely space — making the chair feel personally relevant.",
  },
  {
    id: 376,
    category: "Sales",
    question:
      "What platform does Tumelo use most effectively for his first customers?",
    answer:
      "WhatsApp Status — a before-and-after photo and a clear message got him two enquiries within one hour.",
  },
  {
    id: 377,
    category: "Sales",
    question: "What is the marketing pillar's Day 2 summary?",
    answer:
      "Good messages are simple, clear, honest and memorable. Use Problem → Solution → Benefit. Post with Photo + Message + Call to action.",
  },
  {
    id: 378,
    category: "Sales",
    question: 'Why is "simple" the first quality of a good marketing message?',
    answer:
      "Customers make fast decisions. A complicated message loses them. Simple messages are understood in seconds and remembered for days.",
  },
  {
    id: 379,
    category: "Sales",
    question: 'What does a customer "enquiry" mean?',
    answer:
      "A potential customer reaching out to ask about your product, price or availability — the first step toward a sale.",
  },
  {
    id: 380,
    category: "Sales",
    question: 'What is the "confidence exercise" in Marketing Day 3?',
    answer:
      "Practise your sales pitch until it is under 30 seconds, clear and confident — repeat it until it feels natural.",
  },
  {
    id: 381,
    category: "Sales",
    question: 'What does "relevant" mean for a good visual?',
    answer:
      "The image must directly show your product or the transformation it delivers. Irrelevant images confuse customers and reduce trust.",
  },
  {
    id: 382,
    category: "Sales",
    question: "Name two marketing platforms suited to a food hustle.",
    answer:
      "WhatsApp Status (daily specials and order links) and TikTok (cooking videos showing fresh preparation and final product).",
  },
  {
    id: 383,
    category: "Sales",
    question:
      'What is a "price" objection from a customer and how do you handle it?',
    answer:
      "A customer says the price is too high. Respond by explaining the value — materials, time, quality — and optionally offering a cheaper alternative.",
  },
  {
    id: 384,
    category: "Sales",
    question: "What is the marketing pillar's opening statement?",
    answer:
      '"Marketing is not about being loud. It is about saying the right thing, to the right person, in a way they understand."',
  },
  {
    id: 385,
    category: "Sales",
    question:
      "Why should you use real customer photos rather than stock images?",
    answer:
      "Authentic photos build more trust. Customers see real work, real results — not generic images that could come from anywhere.",
  },
  {
    id: 386,
    category: "Sales",
    question: "What is the effect of a well-written social media post?",
    answer:
      "It generates enquiries from the right people — those who have the exact problem your hustle solves — at zero advertising cost.",
  },
  {
    id: 387,
    category: "Sales",
    question: 'What is the role of "price" in a good advertisement?',
    answer:
      "Transparency about price removes uncertainty and helps the right customer self-select — attracting those ready to buy and filtering out those who are not.",
  },
  {
    id: 388,
    category: "Sales",
    question:
      "What is one way to build a larger following for your hustle on social media?",
    answer:
      "Post consistently, use before-and-after content, ask happy customers to share your posts, and engage with everyone who comments or messages.",
  },
  {
    id: 389,
    category: "Sales",
    question: "What is a hustle's unique selling point?",
    answer:
      "The one thing that makes your product or service different and better for your specific customer — it is the core of your marketing message.",
  },
  {
    id: 390,
    category: "Sales",
    question:
      "What does a good sales conversation have in common with good customer service?",
    answer:
      "Both start with listening. Understanding the customer before talking builds trust, surfaces real needs, and leads to better outcomes.",
  },
  {
    id: 391,
    category: "Sales",
    question:
      "What is the Marketing Pillar's three-day summary in one sentence?",
    answer:
      "Know your customer, build a simple honest message, use free tools to reach them, and follow a structured 6-step sales conversation.",
  },
  {
    id: 392,
    category: "Sales",
    question: "What is the purpose of posting regularly on WhatsApp Status?",
    answer:
      "To keep your hustle visible. Customers who see your work regularly remember you when they — or their friends — need that service.",
  },
  {
    id: 393,
    category: "Sales",
    question:
      "What makes word-of-mouth more powerful than paid advertising for a new hustler?",
    answer:
      "It is free, trusted and personal. A recommendation from a friend carries far more weight than an advert from a stranger.",
  },
  {
    id: 394,
    category: "Sales",
    question: "How do you turn a one-time buyer into a repeat customer?",
    answer:
      "Deliver great quality, communicate professionally, follow up after the sale, and make them feel valued — so they want to return.",
  },
  {
    id: 395,
    category: "Sales",
    question: "What is the marketing lesson from Tumelo's first WhatsApp post?",
    answer:
      "A single photo with a clear message and a call to action generated two paying enquiries within one hour — at zero cost.",
  },
  {
    id: 396,
    category: "Sales",
    question:
      "What does Tumelo's furniture-fixing pitch achieve that a vague description does not?",
    answer:
      'It immediately tells the customer what they get ("looks new again"), why it matters ("fraction of the price"), and what to do next ("send me a photo").',
  },
  {
    id: 397,
    category: "Sales",
    question: "What is the minimum a hustler needs to start marketing?",
    answer:
      "A smartphone with WhatsApp. Posting before-and-after photos with a clear message and contact details is enough to find first customers.",
  },
  {
    id: 398,
    category: "Sales",
    question:
      'What does it mean to "explain value" in the 4-Step Sales Conversation?',
    answer:
      "Tell the potential customer specifically how your service solves their problem or improves their situation — not just what you do, but why it matters.",
  },
  {
    id: 399,
    category: "Sales",
    question: "What is the action challenge from Marketing Day 1?",
    answer:
      "Ask three potential or existing customers questions about who they are, their age, where they spend time, and what problems they have.",
  },
  {
    id: 400,
    category: "Sales",
    question: "What is the core question every marketing message must answer?",
    answer:
      '"Why should I buy from you?" Your message must answer this clearly, simply and honestly in a few seconds.',
  },

  // ── Customer Service (Pillar 4) ────────────────────────────────────────────
  {
    id: 401,
    category: "Customer Service",
    question: "What is customer service?",
    answer:
      "How you treat, help and communicate with people before, during and after they buy from you.",
  },
  {
    id: 402,
    category: "Customer Service",
    question: "What is the Customer Service golden rule?",
    answer:
      "A happy customer can come back and bring more customers. One satisfied person multiplies your business.",
  },
  {
    id: 403,
    category: "Customer Service",
    question: "What are the 5 Basic Rules of Customer Service?",
    answer:
      "1. Greet properly. 2. Listen first. 3. Stay respectful. 4. Communicate clearly. 5. Follow up.",
  },
  {
    id: 404,
    category: "Customer Service",
    question: 'What does "Greet properly" mean in customer service?',
    answer:
      'Make the customer feel welcome and respected from the first moment. Example: "Good morning. How can I help you?"',
  },
  {
    id: 405,
    category: "Customer Service",
    question: 'What does "Listen first" mean in customer service?',
    answer:
      'Understand what the customer wants before answering or suggesting. Example: "So, you need something small for a small room, correct?"',
  },
  {
    id: 406,
    category: "Customer Service",
    question: 'What does "Stay respectful" mean in customer service?',
    answer:
      'Remain calm and professional even if the customer is upset. Example: "I understand. Let me see how I can assist."',
  },
  {
    id: 407,
    category: "Customer Service",
    question: 'What does "Communicate clearly" mean in customer service?',
    answer:
      "Explain price, timing, payment and delivery so the customer knows exactly what to expect. No surprises.",
  },
  {
    id: 408,
    category: "Customer Service",
    question: 'What does "Follow up" mean in customer service?',
    answer:
      'Check in with the customer after the sale to confirm they are satisfied. Example: "Thank you. Let me know if you need anything."',
  },
  {
    id: 409,
    category: "Customer Service",
    question: "What is the L.E.A.R.N Method?",
    answer:
      "Listen → Empathize → Apologize → Resolve → Next step. Used to handle complaints professionally and rebuild trust.",
  },
  {
    id: 410,
    category: "Customer Service",
    question: "What does L stand for in L.E.A.R.N?",
    answer:
      "Listen — let the customer fully explain their complaint without interrupting.",
  },
  {
    id: 411,
    category: "Customer Service",
    question: "What does E stand for in L.E.A.R.N?",
    answer:
      'Empathize — show that you understand how the customer feels. Example: "I understand why you are upset."',
  },
  {
    id: 412,
    category: "Customer Service",
    question: "What does A stand for in L.E.A.R.N?",
    answer:
      'Apologize — say sorry if something went wrong. Example: "I am sorry for the delay."',
  },
  {
    id: 413,
    category: "Customer Service",
    question: "What does R stand for in L.E.A.R.N?",
    answer:
      "Resolve — offer a solution or explain what you can do to fix the problem.",
  },
  {
    id: 414,
    category: "Customer Service",
    question: "What does N stand for in L.E.A.R.N?",
    answer:
      "Next step — tell the customer what happens next: a specific date, time, or clear action.",
  },
  {
    id: 415,
    category: "Customer Service",
    question: "Give an example complaint response using L.E.A.R.N.",
    answer:
      '"I am sorry for the delay. I understand you expected it yesterday. It will be ready tomorrow by 3 PM, and I will keep you updated."',
  },
  {
    id: 416,
    category: "Customer Service",
    question:
      "Why does how you handle a complaint matter more than the complaint itself?",
    answer:
      "A well-handled complaint builds more trust than a problem-free sale. Customers remember how you responded under pressure.",
  },
  {
    id: 417,
    category: "Customer Service",
    question: 'What does "a customer should never have to chase you" mean?',
    answer:
      "You should communicate first — especially about delays, changes or problems. Proactive communication prevents frustration.",
  },
  {
    id: 418,
    category: "Customer Service",
    question: "What are three things you should always DO in customer service?",
    answer:
      "Greet politely. Listen carefully before answering. Be honest about prices and delays.",
  },
  {
    id: 419,
    category: "Customer Service",
    question: "What are three things you should NEVER do in customer service?",
    answer:
      "Never ignore messages. Never speak rudely. Never make promises you cannot keep.",
  },
  {
    id: 420,
    category: "Customer Service",
    question: "What should you NEVER do when a customer complains?",
    answer:
      "Never argue with the customer, blame them immediately, or lie about product quality.",
  },
  {
    id: 421,
    category: "Customer Service",
    question:
      "What is the WhatsApp message template for a new customer enquiry?",
    answer:
      '"Hi, thank you for reaching out. Please let me know what you are looking for, and I will gladly assist."',
  },
  {
    id: 422,
    category: "Customer Service",
    question: "What is the WhatsApp template for confirming an order?",
    answer:
      '"Thank you for your order. Just to confirm: you ordered [item]. The price is R[amount], ready on [date]."',
  },
  {
    id: 423,
    category: "Customer Service",
    question: "What is the WhatsApp template for a delivery delay?",
    answer:
      '"Hi, I apologize for the delay. It\'s taking longer because [reason]. It will now be ready [new date/time]. Thank you for your patience."',
  },
  {
    id: 424,
    category: "Customer Service",
    question: "What is the WhatsApp template for a payment reminder?",
    answer:
      '"Hi, this is a friendly reminder that R[amount] is still outstanding for [item/service]. Please let me know once paid."',
  },
  {
    id: 425,
    category: "Customer Service",
    question: "What is the WhatsApp template for a thank-you message?",
    answer:
      '"Thank you for supporting my business. I really appreciate it. Message me again if you need anything else."',
  },
  {
    id: 426,
    category: "Customer Service",
    question: "What is the WhatsApp template for a complaint response?",
    answer:
      '"I am sorry about your experience. Please explain what happened so I can see how best to assist."',
  },
  {
    id: 427,
    category: "Customer Service",
    question: "What happened with Tumelo's chair damaged in transport?",
    answer:
      "He used L.E.A.R.N — listened, empathised, apologised, resolved (collected and fixed for free), and gave a clear next step (returned by Thursday). She became one of his best referrals.",
  },
  {
    id: 428,
    category: "Customer Service",
    question: "What is the customer service principle before the sale?",
    answer:
      "Answer questions clearly and explain the product or service so the customer knows exactly what they are paying for.",
  },
  {
    id: 429,
    category: "Customer Service",
    question: "What is the customer service principle during the sale?",
    answer:
      "Be honest about price, timing and payment. No surprises — customers hate discovering things after they commit.",
  },
  {
    id: 430,
    category: "Customer Service",
    question: "What is the customer service principle after the sale?",
    answer:
      "Say thank you and check if the customer is happy. This creates loyalty and opens the door to repeat business.",
  },
  {
    id: 431,
    category: "Customer Service",
    question:
      'What does "before, during and after the sale — you are always representing your hustle" mean?',
    answer:
      "Every interaction, at every stage, shapes your reputation. Good service is not just the product — it is the whole experience.",
  },
  {
    id: 432,
    category: "Customer Service",
    question: "How does Tumelo build repeat customers through communication?",
    answer:
      "He sends every customer a short thank-you message after collection. More than half his orders came from repeat customers or referrals within three months.",
  },
  {
    id: 433,
    category: "Customer Service",
    question: "What is the Pillar 4 golden rule?",
    answer:
      "Customers do not only remember what they bought — they remember how you made them feel. Experience matters as much as product.",
  },
  {
    id: 434,
    category: "Customer Service",
    question:
      "What is a good customer service response if a woodwork customer wants a smaller table?",
    answer:
      '"Yes, I can check if that is possible. Please send the measurements and I will confirm the price." — and then respond promptly.',
  },
  {
    id: 435,
    category: "Customer Service",
    question:
      "What is a good response if a sewing customer says the item does not fit?",
    answer:
      '"Thank you for letting me know. Please show me where it does not fit so I can assist." Stay calm and solution-focused.',
  },
  {
    id: 436,
    category: "Customer Service",
    question:
      "What is a good response if an appliance repair customer says it is not working again?",
    answer:
      '"I am sorry to hear that. Please send a picture or video so I can check the issue." Respond quickly and constructively.',
  },
  {
    id: 437,
    category: "Customer Service",
    question:
      "What is a good response to a market stall customer who says the price is too high?",
    answer:
      '"I understand. The price includes materials, time and quality. I can also show a cheaper option." Explain value — do not argue.',
  },
  {
    id: 438,
    category: "Customer Service",
    question: "What does Tumelo's customer service story in Day 1 teach?",
    answer:
      "He replied calmly to a request for a smaller table, asked for measurements, built exactly what was needed — and she paid a deposit that same day.",
  },
  {
    id: 439,
    category: "Customer Service",
    question:
      'What is the difference between "communicating" and "proactively communicating"?',
    answer:
      "Communicating means responding when asked. Proactive communication means updating the customer before they have to ask — this is what great service looks like.",
  },
  {
    id: 440,
    category: "Customer Service",
    question: "Why should you keep a record of orders and payments?",
    answer:
      "To avoid disputes, confirm what was agreed, and show professionalism. Records protect both you and the customer.",
  },
  {
    id: 441,
    category: "Customer Service",
    question: "What is the Pillar 4 Day 1 action challenge?",
    answer:
      "Practise greeting every customer — real or role-play — using the words from Rule 1, and notice how they respond.",
  },
  {
    id: 442,
    category: "Customer Service",
    question: "What is the Pillar 4 Day 2 action challenge?",
    answer:
      "Write your own L.E.A.R.N response to a complaint you have received or might receive in your hustle.",
  },
  {
    id: 443,
    category: "Customer Service",
    question: "What is the Pillar 4 Day 3 action challenge?",
    answer:
      "Send a thank-you message to your last three customers — even if the sale happened a while ago.",
  },
  {
    id: 444,
    category: "Customer Service",
    question: 'What does "ask for feedback" do for your hustle?',
    answer:
      "It shows customers you care about quality, helps you identify areas to improve, and makes customers feel valued and heard.",
  },
  {
    id: 445,
    category: "Customer Service",
    question:
      "What is the customer service lesson from Tumelo and the varnish delay?",
    answer:
      "He messaged the customer before she asked. She was impressed, not upset. Proactive honesty always beats reactive excuses.",
  },
  {
    id: 446,
    category: "Customer Service",
    question: "What happens when you deliver late without communicating?",
    answer:
      "The customer loses trust. They worry, they feel disrespected, and they tell others about the bad experience.",
  },
  {
    id: 447,
    category: "Customer Service",
    question:
      "What is the result of a well-handled complaint according to the handbook?",
    answer:
      "It can build more trust than a problem-free sale — and a well-handled complaint customer often becomes a loyal referral source.",
  },
  {
    id: 448,
    category: "Customer Service",
    question: "How did Tumelo's thank-you messages transform his business?",
    answer:
      "Within three months, more than half his orders came from repeat customers or referrals — people who remembered how he made them feel.",
  },
  {
    id: 449,
    category: "Customer Service",
    question: "What does the complaint activity exercise involve?",
    answer:
      'Working in pairs — one as customer, one as business owner — and practising responses to "Price is too high," "Taking too long," and "Item is damaged."',
  },
  {
    id: 450,
    category: "Customer Service",
    question:
      'What is the difference between "staying respectful" and "agreeing with the customer"?',
    answer:
      "Staying respectful means keeping your tone calm and professional — it does not mean agreeing with everything. You can disagree respectfully.",
  },
  {
    id: 451,
    category: "Customer Service",
    question: "Why should you never lie about product quality?",
    answer:
      "Customers will discover the truth when they receive the product. A lie destroys trust permanently and generates negative word-of-mouth.",
  },
  {
    id: 452,
    category: "Customer Service",
    question: "What does a thank-you message after a sale actually achieve?",
    answer:
      "It closes the sale positively, shows appreciation, invites future orders, and builds the kind of relationship that leads to referrals.",
  },
  {
    id: 453,
    category: "Customer Service",
    question: "What is the mini assessment from Pillar 4 Day 3?",
    answer:
      "Seven questions testing understanding of customer service, complaint handling, WhatsApp messaging, follow-up, and what to avoid with difficult customers.",
  },
  {
    id: 454,
    category: "Customer Service",
    question: 'What does "representing your hustle" mean at all times?',
    answer:
      "How you behave, message, and communicate — even outside a sale — shapes your reputation. Every interaction is a potential customer moment.",
  },
  {
    id: 455,
    category: "Customer Service",
    question: "What do customers remember most about a service experience?",
    answer:
      "How you made them feel — not just the product quality. Respect, communication and gratitude are remembered long after the transaction.",
  },
  {
    id: 456,
    category: "Customer Service",
    question: 'What does "Next step" in L.E.A.R.N accomplish?',
    answer:
      "It gives the customer clarity and certainty after a complaint. A specific date or action replaces anxiety with confidence.",
  },
  {
    id: 457,
    category: "Customer Service",
    question: "Why does good customer service matter even before someone buys?",
    answer:
      "How you answer enquiries — speed, clarity, friendliness — influences whether a potential customer decides to buy from you or go elsewhere.",
  },
  {
    id: 458,
    category: "Customer Service",
    question:
      "What is one way to improve your customer service this week, from the Day 5 action challenge?",
    answer:
      "Choose one area from your Personal Reputation Score — punctuality, honesty, respect, communication or reliability — and actively improve it.",
  },
  {
    id: 459,
    category: "Customer Service",
    question:
      "What is the correct way to handle a customer who changes the price they agreed to?",
    answer:
      "Remain calm. Politely reference the original agreed price and explain why it was fair. Never change your price without explaining — or agreeing — first.",
  },
  {
    id: 460,
    category: "Customer Service",
    question: "What makes a WhatsApp message template useful for a hustler?",
    answer:
      "It saves time, ensures professionalism, removes the stress of what to say, and creates consistent communication across all customer interactions.",
  },
  {
    id: 461,
    category: "Customer Service",
    question:
      "What is the connection between customer service and repeat business?",
    answer:
      "Excellent service creates trust. Trust creates loyalty. Loyalty creates repeat orders and referrals — the engine of Stability income.",
  },
  {
    id: 462,
    category: "Customer Service",
    question:
      "What should you say when you make a mistake with a customer's order?",
    answer:
      "Acknowledge it immediately, apologise sincerely, offer a clear solution, and give a specific timeline for resolution. Do not make excuses.",
  },
  {
    id: 463,
    category: "Customer Service",
    question:
      'Why is "do not interrupt" important when listening to a complaint?',
    answer:
      "Interrupting signals disrespect and prevents you from fully understanding the problem. Full listening leads to better, faster resolutions.",
  },
  {
    id: 464,
    category: "Customer Service",
    question: 'What does "empathize" mean in the L.E.A.R.N method?',
    answer:
      'Show the customer you understand their frustration as a human being — not just as a transaction. "I understand why you are upset" validates their experience.',
  },
  {
    id: 465,
    category: "Customer Service",
    question: "What is the customer service Pillar 4 summary from Day 1?",
    answer:
      "Customer service is how you treat people before, during and after a sale. Follow the 5 rules: greet, listen, respect, communicate, follow up.",
  },
  {
    id: 466,
    category: "Customer Service",
    question: "What is the customer service Pillar 4 summary from Day 2?",
    answer:
      "Use L.E.A.R.N: Listen, Empathize, Apologize, Resolve, Next step. Never argue. A well-handled complaint builds more trust than no complaint at all.",
  },
  {
    id: 467,
    category: "Customer Service",
    question: "What is the customer service Pillar 4 summary from Day 3?",
    answer:
      "Treat customers with respect before, during and after the sale. Greet, Listen, Respect, Communicate clearly, Follow up. A happy customer comes back.",
  },
  {
    id: 468,
    category: "Customer Service",
    question:
      "How does Tumelo end up with more than half his orders from repeat customers?",
    answer:
      "By sending a personal thank-you message after every collection and making every customer feel genuinely valued and remembered.",
  },
  {
    id: 469,
    category: "Customer Service",
    question:
      "What is the customer service lesson from Tumelo's entire Pillar 4 story?",
    answer:
      'He became "the person customers trust" — which is what Day 5 of Business Foundations promised. Trust is the foundation of every lasting hustle.',
  },
  {
    id: 470,
    category: "Customer Service",
    question:
      'What does "follow up" look like in practice after a sewing order?',
    answer:
      '"Hi, I hope the dress fits perfectly. Let me know if you need any alterations. Thank you for supporting my work!"',
  },
  {
    id: 471,
    category: "Customer Service",
    question:
      "What is one thing you should always do when a delivery will be late?",
    answer:
      "Message the customer first — before they ask. Explain the reason and give a new realistic date. Never go silent.",
  },
  {
    id: 472,
    category: "Customer Service",
    question:
      "What is one thing you should always do before starting an order?",
    answer:
      "Confirm the details in writing — what is ordered, the agreed price, and when it will be ready. This prevents misunderstandings.",
  },
  {
    id: 473,
    category: "Customer Service",
    question: 'What is "resolve" in the L.E.A.R.N method?',
    answer:
      "Offering a practical solution to fix the problem — a replacement, a refund, a repair, or whatever is fair and within your power to deliver.",
  },
  {
    id: 474,
    category: "Customer Service",
    question: "What is a friendly reminder message and when do you send it?",
    answer:
      "A polite, non-aggressive payment reminder when an amount is outstanding. Send it promptly, state the amount clearly, and keep the tone respectful.",
  },
  {
    id: 475,
    category: "Customer Service",
    question: "Why is it important to ask for feedback from customers?",
    answer:
      "Feedback reveals where you can improve, shows customers you value their opinion, and often leads to positive reviews or referrals.",
  },
  {
    id: 476,
    category: "Customer Service",
    question:
      "What is the difference between customer service for a product hustle and a service hustle?",
    answer:
      "Both need the same five rules, but service hustles (like repairs) often need more proactive communication about timing, quality checks, and after-delivery follow-up.",
  },
  {
    id: 477,
    category: "Customer Service",
    question:
      'What does "Keep your promises" mean in the customer service Do\'s?',
    answer:
      "Whatever you commit to — price, delivery date, quality — honour it. Breaking promises damages trust more than any other single action.",
  },
  {
    id: 478,
    category: "Customer Service",
    question:
      'What does "change the price without explaining" mean in the Don\'ts?',
    answer:
      "Never charge more (or less) than agreed without first discussing it and getting the customer's agreement. Surprise price changes feel dishonest.",
  },
  {
    id: 479,
    category: "Customer Service",
    question:
      "What is one practical outcome from Tumelo doing L.E.A.R.N correctly on the broken chair?",
    answer:
      "The customer stayed with him and later became one of his best referral sources — turning a complaint into a long-term business relationship.",
  },
  {
    id: 480,
    category: "Customer Service",
    question:
      'What does "blame the customer immediately" do to the relationship?',
    answer:
      "It destroys trust immediately. Even if the customer contributed to the problem, starting with blame puts them on the defensive and escalates the situation.",
  },
  {
    id: 481,
    category: "Customer Service",
    question: "What is the ideal tone for a customer service message?",
    answer:
      "Warm, professional and clear. Friendly without being casual, helpful without being desperate, honest without being blunt.",
  },
  {
    id: 482,
    category: "Customer Service",
    question: "What is an example of communicating clearly about a delivery?",
    answer:
      '"Your order will be ready Friday at 2 PM. The total is R150. I will message you when it is on its way."',
  },
  {
    id: 483,
    category: "Customer Service",
    question:
      "What does proactive customer communication look like for a baking hustle?",
    answer:
      "\"Hi, your order is baking now and will be ready by 3 PM as agreed. I'll send a photo when it's done!\"",
  },
  {
    id: 484,
    category: "Customer Service",
    question: "Why is it unprofessional to ignore customer messages?",
    answer:
      "Silence signals that you do not value their business. Customers move on quickly — and tell others about being ignored.",
  },
  {
    id: 485,
    category: "Customer Service",
    question: 'What makes a customer feel "remembered"?',
    answer:
      "Using their name, referencing their previous order, and following up personally. Small details make customers feel like people, not transactions.",
  },
  {
    id: 486,
    category: "Customer Service",
    question: "How should you respond to a rude customer?",
    answer:
      'Stay respectful and calm. Do not match their energy. Example: "I understand you are frustrated. Let me see how I can help you right now."',
  },
  {
    id: 487,
    category: "Customer Service",
    question:
      "What is the business impact of one customer telling ten people about a bad experience?",
    answer:
      "Ten potential customers are warned away before ever trying your product — a damaging ripple effect on your reputation and income.",
  },
  {
    id: 488,
    category: "Customer Service",
    question:
      "What is the business impact of one customer telling ten people about a great experience?",
    answer:
      "Ten potential customers arrive pre-trusting you — significantly reducing the effort needed to convert them into buyers.",
  },
  {
    id: 489,
    category: "Customer Service",
    question: "What is a simple follow-up question to ask after a sale?",
    answer:
      '"Are you happy with your order? Please let me know if there is anything I can fix or improve."',
  },
  {
    id: 490,
    category: "Customer Service",
    question:
      "What does Tumelo's journey in Pillar 4 prove about customer service?",
    answer:
      "That the feeling customers are left with — valued, respected, remembered — matters as much as the furniture itself. Service creates loyalty.",
  },
  {
    id: 491,
    category: "Customer Service",
    question: "What should you say to a customer when confirming their order?",
    answer:
      "Confirm the item, agreed price, and ready date. Written confirmation removes ambiguity and shows professionalism.",
  },
  {
    id: 492,
    category: "Customer Service",
    question: "Why does Tumelo message every customer after collection?",
    answer:
      "To leave a positive final impression, thank them genuinely, and invite them back — turning a completed sale into an ongoing relationship.",
  },
  {
    id: 493,
    category: "Customer Service",
    question: "What is the role of patience in customer service?",
    answer:
      "Patience — especially with difficult customers — shows maturity and professionalism. It prevents escalation and opens space for a real resolution.",
  },
  {
    id: 494,
    category: "Customer Service",
    question:
      'What does "deliver late without communicating" do to a customer?',
    answer:
      "It causes anxiety, frustration and distrust. They feel disrespected and may not return — and will likely warn others.",
  },
  {
    id: 495,
    category: "Customer Service",
    question:
      "What is the long-term result of following the 5 Basic Customer Service Rules consistently?",
    answer:
      "Customers trust you, refer you, and return repeatedly — creating the stable repeat income that powers your hustle's growth.",
  },
  {
    id: 496,
    category: "Customer Service",
    question: "What is the final Kids Haven message about customer service?",
    answer:
      "Remember: Greet, Listen, Respect, Communicate clearly, Follow up. A happy customer can come back and bring more customers.",
  },
  {
    id: 497,
    category: "Customer Service",
    question: "What three customer service habits made Tumelo successful?",
    answer:
      "Proactive communication (messaging first), genuine thank-you messages after every sale, and using L.E.A.R.N when things went wrong.",
  },
  {
    id: 498,
    category: "Customer Service",
    question: "What is one way customer service protects your reputation?",
    answer:
      "By handling problems quickly and professionally before they become public complaints — stopping negative word-of-mouth before it spreads.",
  },
  {
    id: 499,
    category: "Customer Service",
    question: "What should you avoid saying to a difficult customer?",
    answer:
      'Never say "That\'s your problem," "I told you so," or anything dismissive. Avoid any language that puts the customer down or shifts blame.',
  },
  {
    id: 500,
    category: "Customer Service",
    question: "What information should you give a customer before they buy?",
    answer:
      "Price, delivery date, payment method, what is included in the service, and what to do if something is not right after delivery.",
  },
]

const WYR_QUESTIONS: WouldYouRather[] = [
  {
    id: 1,
    icon: "💡",
    optionA: "Start a business with R500 and no plan",
    optionB: "Start a business with R0 and a solid plan",
    encourageA:
      "Bold move! Action creates momentum. Now build your plan as you go — every mistake is a lesson that money can't buy.",
    encourageB:
      "Smart thinking! A clear plan is your roadmap to success. A well-prepared entrepreneur can start with nothing and build everything.",
  },
  {
    id: 2,
    icon: "🤝",
    optionA: "Sell to 10 loyal customers who love your work",
    optionB: "Sell once to 100 strangers",
    encourageA:
      "Excellent instinct! Loyal customers refer others, leave reviews, and keep coming back. Relationships are the engine of any lasting business.",
    encourageB:
      "Ambition is great! Reaching many people builds brand awareness. Now your challenge is turning those strangers into repeat customers.",
  },
  {
    id: 3,
    icon: "📱",
    optionA: "Learn to market on social media",
    optionB: "Learn to manage your business finances",
    encourageA:
      "Marketing fuels growth! Knowing how to reach people is a superpower. Pair it with financial knowledge and you're unstoppable.",
    encourageB:
      "Financial literacy is the foundation of every successful business. Understanding your numbers means you'll never be caught off guard.",
  },
  {
    id: 4,
    icon: "⏰",
    optionA: "Work 4 hours a day on something you love",
    optionB: "Work 10 hours a day on something profitable",
    encourageA:
      "Passion is powerful! When you love what you do, creativity flows and quality shows. Find ways to make your passion profitable.",
    encourageB:
      "Hustle builds discipline and income. As your business grows, you can shape it around what you love most. The grind pays off.",
  },
  {
    id: 5,
    icon: "🎓",
    optionA: "Learn from a mentor for free",
    optionB: "Learn from an expensive online course",
    encourageA:
      "Brilliant choice! A good mentor gives real-world wisdom, accountability, and connections no course can match. Seek one out.",
    encourageB:
      "Investing in structured learning shows commitment. Good courses give you frameworks and community. Apply everything you learn!",
  },
  {
    id: 6,
    icon: "💰",
    optionA: "Save 20% of every payment you receive",
    optionB: "Reinvest 50% back into your business",
    encourageA:
      "Saving first is golden! You're building a financial buffer that protects you when things are slow. That's real financial intelligence.",
    encourageB:
      "Reinvesting accelerates growth! The more you put back in, the faster your business can scale. Just keep something for emergencies.",
  },
]

// Achievements are computed from localStorage activity — never hardcoded
function computeBadges(): Badge[] {
  const questionsAnswered = lsGet<number>("ach_questions_answered", 0)
  const completedModules = lsGet<string[]>("ach_completed_modules", [])
  const perfectModules = lsGet<string[]>("ach_perfect_modules", [])
  const categoriesSeen = lsGet<string[]>("ach_categories_seen", [])
  const ALL_CATS = ["Financial Literacy", "Entrepreneurship", "Sales", "Customer Service"]
  return [
    { icon: "🔥", label: "Streak Master", earned: questionsAnswered >= 10 },
    { icon: "💰", label: "Money Wise", earned: completedModules.includes("finance") },
    { icon: "🚀", label: "Hustler", earned: completedModules.includes("business") },
    { icon: "🎯", label: "Sales Pro", earned: completedModules.includes("marketing") },
    { icon: "👑", label: "Top Earner", earned: perfectModules.length > 0 },
    { icon: "📚", label: "Scholar", earned: ALL_CATS.every((c) => categoriesSeen.includes(c)) },
  ]
}

// Helpers to record quiz activity
function recordQuizAnswer() {
  const n = lsGet<number>("ach_questions_answered", 0)
  lsSet("ach_questions_answered", n + 1)
}
function recordModuleComplete(moduleId: string, score: number, total: number) {
  const completed = lsGet<string[]>("ach_completed_modules", [])
  if (!completed.includes(moduleId)) lsSet("ach_completed_modules", [...completed, moduleId])
  if (score === total) {
    const perfect = lsGet<string[]>("ach_perfect_modules", [])
    if (!perfect.includes(moduleId)) lsSet("ach_perfect_modules", [...perfect, moduleId])
  }
}

function getModuleProgress(mod: Module): QuizProgress {
  const saved = lsGet<Partial<QuizProgress>>(`learn_progress_${mod.id}`, {})
  const nextQuestion =
    typeof saved.nextQuestion === "number" &&
    Number.isInteger(saved.nextQuestion) &&
    saved.nextQuestion >= 0
      ? Math.min(saved.nextQuestion, mod.questions.length)
      : 0
  const score =
    typeof saved.score === "number" &&
    Number.isInteger(saved.score) &&
    saved.score >= 0
      ? Math.min(saved.score, mod.questions.length)
      : 0
  const answers = Array.from({ length: mod.questions.length }, (_, index) => {
    const answer = saved.answers?.[index]
    return typeof answer === "number" &&
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < mod.questions[index].options.length
      ? answer
      : null
  })

  return {
    nextQuestion,
    score,
    completed: saved.completed === true || nextQuestion >= mod.questions.length,
    answers,
  }
}

function saveModuleProgress(mod: Module, progress: QuizProgress) {
  lsSet(`learn_progress_${mod.id}`, progress)
}

function recordCategorySeen(cat: string) {
  const seen = lsGet<string[]>("ach_categories_seen", [])
  if (!seen.includes(cat)) lsSet("ach_categories_seen", [...seen, cat])
}

const CATEGORY_COLORS: Record<string, string> = {
  "Financial Literacy": "#f59e0b",
  Entrepreneurship: "#10b981",
  Sales: "#3b82f6",
  "Customer Service": "#ec4899",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BG = "linear-gradient(160deg, #1e3a72 0%, #1a2f5e 40%, #14245a 100%)"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        color: "rgba(255,255,255,0.55)",
        letterSpacing: 1.8,
        textTransform: "uppercase",
        marginBottom: 12,
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {children}
    </div>
  )
}

// ─── Module data ──────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  icon: string
}

interface QuizProgress {
  nextQuestion: number
  score: number
  completed: boolean
  answers: (number | null)[]
}

interface Module {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  rgb: string
  questions: QuizQuestion[]
}

const MODULES: Module[] = [
  {
    id: "business",
    title: "Business Foundations",
    subtitle: "Think like a hustler",
    icon: "🚀",
    color: "#10b981",
    rgb: "16,185,129",
    questions: [
      {
        question: "What does a hustler do differently from most people?",
        options: [
          "They wait for the right moment",
          "They look for opportunities actively",
          "They save money first",
          "They ask for help",
        ],
        correct: 1,
        icon: "💡",
      },
      {
        question: "What is the Opportunity Formula?",
        options: [
          "Skill + Money + Luck = Income",
          "Skill + Problem + Customer = Income",
          "Effort + Time + Patience = Income",
          "Network + Brand + Marketing = Income",
        ],
        correct: 1,
        icon: "📐",
      },
      {
        question: "What do customers actually buy?",
        options: [
          "Products and goods",
          "Services from professionals",
          "Solutions to their problems",
          "Whatever is cheapest",
        ],
        correct: 2,
        icon: "🛒",
      },
      {
        question: "What is the first quality of a successful hustler?",
        options: [
          "They have lots of money",
          "They show up reliably",
          "They have connections",
          "They have a big following",
        ],
        correct: 1,
        icon: "⏰",
      },
      {
        question:
          "The Simple Hustle Canvas asks five questions. Which is NOT one of them?",
        options: [
          "What can I do?",
          "Who needs it?",
          "What is my competition?",
          "What do I earn?",
        ],
        correct: 2,
        icon: "📋",
      },
      {
        question: "Where does your hustle idea often come from?",
        options: [
          "Copying what others do",
          "The overlap of skill, enjoyment and what people ask you",
          "Watching YouTube videos",
          "Getting a business degree",
        ],
        correct: 1,
        icon: "🎯",
      },
      {
        question: "What is Stage 1 of the income journey called?",
        options: ["Growth", "Stability", "Survival", "Success"],
        correct: 2,
        icon: "📊",
      },
      {
        question: "What income range does Stability represent?",
        options: [
          "R500 – R2,000",
          "R2,846 – R5,000",
          "R5,000 – R10,000",
          "R10,000+",
        ],
        correct: 1,
        icon: "💰",
      },
      {
        question: "What is the Kids Haven Academy motto?",
        options: [
          "Work Hard, Play Hard",
          "Earn. Save. Grow.",
          "Skills First, Money Second",
          "Dream Big, Start Small",
        ],
        correct: 1,
        icon: "📖",
      },
      {
        question: "How does Tumelo find his first customers?",
        options: [
          "He runs expensive ads",
          "He opens a store",
          "He posts a before-and-after on WhatsApp Status",
          "He hands out printed flyers",
        ],
        correct: 2,
        icon: "📱",
      },
      {
        question: "What is Tumelo's hustle?",
        options: [
          "Car washing",
          "Tutoring maths",
          "Furniture up-cycling",
          "Hairdressing",
        ],
        correct: 2,
        icon: "🪵",
      },
      {
        question: "What is a 30-second sales pitch used for?",
        options: [
          "Applying for a job",
          "Quickly explaining your value to a potential customer",
          "Describing your background",
          "Reporting your income",
        ],
        correct: 1,
        icon: "🎤",
      },
      {
        question: "Which free tool helps a hustler market daily?",
        options: [
          "Paid newspaper adverts",
          "WhatsApp Status",
          "Television commercials",
          "Billboards",
        ],
        correct: 1,
        icon: "📲",
      },
      {
        question: "What is the Five Golden Rules' first rule for trust?",
        options: ["Be loud", "Be on time", "Be expensive", "Be everywhere"],
        correct: 1,
        icon: "⭐",
      },
      {
        question: 'What does "money follows solutions" mean?',
        options: [
          "Wealthy people solve problems for money",
          "The more problems you solve for people, the more they pay you",
          "Money solves all problems",
          "Financial solutions create money",
        ],
        correct: 1,
        icon: "💡",
      },
      {
        question: "What happens when one customer is unhappy?",
        options: [
          "Nothing significant",
          "They can tell up to 10 people",
          "Only one person is affected",
          "They quietly stop buying",
        ],
        correct: 1,
        icon: "⚠️",
      },
      {
        question: "What does the Growth stage (R5,000+) often involve?",
        options: [
          "Just one loyal customer",
          "Part-time work only",
          "Referrals and possibly a small team",
          "Working fewer hours",
        ],
        correct: 2,
        icon: "📈",
      },
      {
        question: "What should you do if you cannot meet a promised deadline?",
        options: [
          "Stay quiet and hope they forget",
          "Communicate proactively and give a new date",
          "Offer a refund immediately",
          "Ask someone else to help",
        ],
        correct: 1,
        icon: "📩",
      },
      {
        question:
          "Tumelo's chair costs R40 in materials and sells for R150. What is the profit?",
        options: ["R40", "R150", "R110", "R90"],
        correct: 2,
        icon: "🧮",
      },
      {
        question:
          "Which of these is an example of a community business opportunity?",
        options: [
          "Starting a bank",
          "Tutoring children who struggle with maths",
          "Building a shopping mall",
          "Importing goods from overseas",
        ],
        correct: 1,
        icon: "🏘️",
      },
      {
        question: 'What does "learning fast" mean for a hustler?',
        options: [
          "Finishing the programme quickly",
          "Taking short courses online",
          "Treating every mistake as a lesson and adjusting",
          "Reading as many books as possible",
        ],
        correct: 2,
        icon: "🔄",
      },
      {
        question: "What does the 90-Day Plan help you do?",
        options: [
          "Memorise the handbook",
          "Set income targets and identify the customers needed",
          "Track your social media followers",
          "Apply for a government grant",
        ],
        correct: 1,
        icon: "📅",
      },
      {
        question:
          "Which quality helps a hustler grow from Survival to Stability?",
        options: [
          "Spending freely",
          "Consistency and showing up every day",
          "Having a big social media following",
          "Owning expensive equipment",
        ],
        correct: 1,
        icon: "🔁",
      },
      {
        question: "What is Tumelo's biggest competitive advantage?",
        options: [
          "He has a big workshop",
          "He charges the lowest prices in town",
          "He builds trust through reliability and proactive communication",
          "He has a large team",
        ],
        correct: 2,
        icon: "🏆",
      },
      {
        question: 'What does "start with what you already have" mean?',
        options: [
          "Only use things you own",
          "Take action now using existing skills and resources rather than waiting for perfect conditions",
          "Never ask anyone for help",
          "Avoid spending money",
        ],
        correct: 1,
        icon: "🚀",
      },
      {
        question: "What is a referral?",
        options: [
          "A formal business letter",
          "When a happy customer tells someone else about your hustle",
          "A discount for loyal customers",
          "A government business certificate",
        ],
        correct: 1,
        icon: "🗣️",
      },
      {
        question: "What type of income does a Growth-stage hustler have?",
        options: [
          "Inconsistent piece jobs",
          "Weekly income from repeat customers",
          "R5,000+ per month with referrals and possibly a small team",
          "A fixed monthly salary",
        ],
        correct: 2,
        icon: "📈",
      },
      {
        question: "What is the best way to find your first customer?",
        options: [
          "Wait for someone to contact you",
          "Spend money on paid ads",
          "Tell everyone you know — friends, family, neighbours, church members",
          "Create a website first",
        ],
        correct: 2,
        icon: "📢",
      },
      {
        question:
          "What does the Kids Haven handbook say about needing permission to start?",
        options: [
          "You need government approval",
          "You need a mentor to give you the go-ahead",
          "You do not need permission — just a skill, a customer, and the courage to offer your solution",
          "You need a registered business first",
        ],
        correct: 2,
        icon: "✅",
      },
      {
        question:
          "What is Tumelo's furniture profit per chair (from Pillar 1)?",
        options: ["R40", "R150", "R110", "R350"],
        correct: 2,
        icon: "💺",
      },
      {
        question: "How do the Five Golden Rules protect your reputation?",
        options: [
          "They ensure you always have stock",
          "Being on time, honest, respectful, communicative and grateful builds lasting customer trust",
          "They guarantee more sales every month",
          "They help you set better prices",
        ],
        correct: 1,
        icon: "⭐",
      },
      {
        question: "What does the handbook say about making mistakes?",
        options: [
          "Mistakes end careers",
          "Mistakes should be hidden from customers",
          "Every mistake teaches something — hustlers learn fast and keep going",
          "Mistakes mean you should change your hustle",
        ],
        correct: 2,
        icon: "🔄",
      },
      {
        question: "What is the Community Opportunity Map used for?",
        options: [
          "Tracking competitor businesses",
          "Identifying places nearby and what services they might need",
          "Mapping delivery routes",
          "Listing all community members",
        ],
        correct: 1,
        icon: "🗺️",
      },
      {
        question: "Which of these is NOT a quality of a successful hustler?",
        options: [
          "They show up reliably",
          "They wait for the right moment before acting",
          "They respect customers",
          "They solve problems",
        ],
        correct: 1,
        icon: "❌",
      },
      {
        question:
          "What happens at the Growth stage that did not happen at Survival?",
        options: [
          "The hustler stops working",
          "Referrals bring in more work than one person can handle alone",
          "Costs increase significantly",
          "The customer base shrinks",
        ],
        correct: 1,
        icon: "🚀",
      },
      {
        question: "How many people can one happy customer influence?",
        options: [
          "Only themselves",
          "Up to 5 people",
          "Up to 10 people",
          "Hundreds via social media",
        ],
        correct: 2,
        icon: "👥",
      },
      {
        question:
          'What does "saying thank you" accomplish as a business practice?',
        options: [
          "It is a legal requirement",
          "It is free and creates a positive impression that encourages return visits and referrals",
          "It guarantees a 5-star review",
          "It increases your prices",
        ],
        correct: 1,
        icon: "🙏",
      },
      {
        question: "What should you do before setting your selling price?",
        options: [
          "Check what competitors charge",
          "Ask your friends",
          "Know your costs so your price always exceeds them and generates profit",
          "Set it as high as possible",
        ],
        correct: 2,
        icon: "🏷️",
      },
      {
        question:
          "What is the overlap exercise from Day 1 designed to help you find?",
        options: [
          "Your income stage",
          "Your customer persona",
          "The intersection of skill, enjoyment and what people ask of you — your hustle",
          "Your savings target",
        ],
        correct: 2,
        icon: "🎯",
      },
      {
        question:
          "How does Tumelo move from Survival to Stability in three months?",
        options: [
          "He borrows money to expand",
          "He advertises on TV",
          "He builds repeat customers through quality work, reliability and communication",
          "He hires a team immediately",
        ],
        correct: 2,
        icon: "📅",
      },
      {
        question:
          'What does "customers buy solutions, not products" mean in practice?',
        options: [
          "You should only sell services, not goods",
          "Position your offering around the problem it solves rather than just describing what it is",
          "Never talk about your product features",
          "Products are less valuable than services",
        ],
        correct: 1,
        icon: "💡",
      },
      {
        question:
          "What is the purpose of a before-and-after photo in your marketing?",
        options: [
          "To show your workspace",
          "To prove the transformation your service delivers so customers trust the result",
          "To compare prices",
          "To show your equipment",
        ],
        correct: 1,
        icon: "📸",
      },
      {
        question: "What does the 4-Step Sales Conversation end with?",
        options: [
          "Handing over a brochure",
          'Asking for the sale: "Can I help you today?"',
          "Giving a discount",
          "Walking away politely",
        ],
        correct: 1,
        icon: "🤝",
      },
      {
        question: "Which of the following is a free marketing tool?",
        options: [
          "Television advertisement",
          "Paid Google Ads",
          "WhatsApp Status posts with before-and-after photos",
          "Printed magazine spread",
        ],
        correct: 2,
        icon: "📱",
      },
      {
        question: "What is the first step in the 4-Step Sales Conversation?",
        options: [
          "Explain value",
          "Ask for the sale",
          "Greet warmly",
          "Introduce your price list",
        ],
        correct: 2,
        icon: "👋",
      },
      {
        question: 'What is a "hustle" according to Hustling Academy?',
        options: [
          "A side job that is illegal",
          "Turning what you already have into honest income that meets your needs",
          "A get-rich-quick scheme",
          "A temporary job while waiting for employment",
        ],
        correct: 1,
        icon: "💼",
      },
      {
        question: "What do hustlers focus on instead of what they do not have?",
        options: [
          "Their competition",
          "What they already have — skills, time, knowledge, hands",
          "Their income goals only",
          "Their social media following",
        ],
        correct: 1,
        icon: "🔍",
      },
      {
        question:
          "In Tumelo's story, what does the varnish delay teach about customer service?",
        options: [
          "Always meet deadlines no matter what",
          "It is okay to be late if the work is good",
          "Proactive honesty builds more trust than silence — message first, explain clearly",
          "Never promise delivery dates",
        ],
        correct: 2,
        icon: "🪵",
      },
      {
        question:
          "What is the action challenge from Business Foundations Day 4?",
        options: [
          "Write your monthly budget",
          "Tell ten people about your hustle — not tomorrow, today",
          "Calculate your profit margin",
          "Create a customer persona",
        ],
        correct: 1,
        icon: "⚡",
      },
      {
        question:
          'What does "value before price" mean in a sales conversation?',
        options: [
          "Always quote a high price first",
          "Show the customer the benefit they will receive before revealing your charge",
          "Give discounts to everyone",
          "Never mention price at all",
        ],
        correct: 1,
        icon: "💎",
      },
    ],
  },
  {
    id: "finance",
    title: "Finance & Budgeting",
    subtitle: "Know your money",
    icon: "💰",
    color: "#f59e0b",
    rgb: "245,158,11",
    questions: [
      {
        question: "What is the Profit Formula?",
        options: [
          "Profit = Sales + Costs",
          "Profit = Sales Revenue − Business Costs",
          "Profit = Total income ÷ 2",
          "Profit = Money received",
        ],
        correct: 1,
        icon: "🧮",
      },
      {
        question: "What does the 60% portion of profit pay for?",
        options: [
          "Personal food and transport",
          "Savings in a jar",
          "Materials, tools and business growth",
          "Entertainment and luxuries",
        ],
        correct: 2,
        icon: "🔧",
      },
      {
        question: "What does the 30% portion of profit cover?",
        options: [
          "Business tools",
          "Savings",
          "Personal needs like food and transport",
          "Marketing costs",
        ],
        correct: 2,
        icon: "🏠",
      },
      {
        question: "What is the 10% savings portion for?",
        options: [
          "Buying new equipment",
          "Building a safety net for slow months",
          "Paying suppliers",
          "Marketing expenses",
        ],
        correct: 1,
        icon: "🏦",
      },
      {
        question: "The 60-30-10 split is based on what?",
        options: [
          "Total sales revenue",
          "Profit only — after costs are subtracted",
          "What the customer pays",
          "Your monthly salary",
        ],
        correct: 1,
        icon: "⚠️",
      },
      {
        question:
          "Tumelo sold a chair for R350 with R120 in costs. What was his profit?",
        options: ["R350", "R120", "R470", "R230"],
        correct: 3,
        icon: "🪑",
      },
      {
        question:
          "Tumelo's monthly sales were R1,450 and costs were R430. What was his profit?",
        options: ["R1,450", "R1,020", "R430", "R880"],
        correct: 1,
        icon: "📊",
      },
      {
        question:
          "From R1,020 monthly profit, how much does Tumelo reinvest (60%)?",
        options: ["R102", "R306", "R612", "100"],
        correct: 2,
        icon: "🔄",
      },
      {
        question:
          "From R1,020 monthly profit, how much does Tumelo save (10%)?",
        options: ["R102", "R612", "R306", "R204"],
        correct: 0,
        icon: "💾",
      },
      {
        question: "What mistake do many hustlers make with money?",
        options: [
          "They save too much",
          "They reinvest everything",
          "They treat total revenue as profit",
          "They track costs too carefully",
        ],
        correct: 2,
        icon: "❌",
      },
      {
        question: 'What does "Earn → Reinvest → Grow" mean?',
        options: [
          "Three separate stages of business",
          "A repeating cycle where profit funds the next sale",
          "A one-time investment strategy",
          "A savings account plan",
        ],
        correct: 1,
        icon: "♻️",
      },
      {
        question: "Where can you keep your 10% savings safely?",
        options: [
          "In your wallet",
          "A savings jar, stokvel, bank or mobile wallet",
          "With a friend",
          "Under your mattress",
        ],
        correct: 1,
        icon: "🏧",
      },
      {
        question: "What is a stokvel?",
        options: [
          "A type of bank account",
          "A community savings club where members take turns receiving the pot",
          "A government savings scheme",
          "A mobile money app",
        ],
        correct: 1,
        icon: "🤝",
      },
      {
        question: "If your profit is R500, how much goes to savings?",
        options: ["R300", "R150", "R50", "R100"],
        correct: 2,
        icon: "💵",
      },
      {
        question: "If your profit is R800, how much goes to reinvest?",
        options: ["R80", "R240", "R480", "400"],
        correct: 2,
        icon: "💵",
      },
      {
        question: "What happens if you spend all revenue on personal needs?",
        options: [
          "The business grows faster",
          "You lose materials and cannot serve the next customer",
          "Savings increases",
          "Profit automatically rises",
        ],
        correct: 1,
        icon: "📉",
      },
      {
        question: "Why should you track every sale in writing?",
        options: [
          "For tax purposes",
          "So you always know your real profit and can plan",
          "To impress customers",
          "Because it is a legal requirement",
        ],
        correct: 1,
        icon: "📝",
      },
      {
        question:
          "A product costs R40 to make and sells for R100. What is the profit?",
        options: ["R100", "R40", "R140", "R60"],
        correct: 3,
        icon: "🧮",
      },
      {
        question: "What is the Stability income range?",
        options: [
          "R500 – R2,000",
          "R2,846 – R5,000",
          "R1,000 – R2,846",
          "R5,000+",
        ],
        correct: 1,
        icon: "📈",
      },
      {
        question:
          'What does "small, consistent discipline beats one lucky sale" mean?',
        options: [
          "Luck is more important than discipline",
          "Regular habits build reliable income; a one-off windfall changes nothing long-term",
          "You only need one good sale to succeed",
          "Discipline is more important than marketing",
        ],
        correct: 1,
        icon: "💪",
      },
      {
        question:
          "Why is a monthly budget more useful than tracking only single sales?",
        options: [
          "It shows patterns, income trends and whether you are hitting targets",
          "It is required by law",
          "It impresses investors",
          "It reduces costs automatically",
        ],
        correct: 0,
        icon: "📅",
      },
      {
        question: "What does Kids Haven say is enough to start saving?",
        options: [
          "At least R1,000",
          "R500 minimum",
          "Even R10 — the habit matters more than the amount",
          "Only when you earn R2,000+ per month",
        ],
        correct: 2,
        icon: "🌱",
      },
      {
        question:
          "If costs go up but your selling price stays the same, what happens to profit?",
        options: [
          "Profit stays the same",
          "Profit increases",
          "Profit decreases",
          "Revenue increases",
        ],
        correct: 2,
        icon: "📉",
      },
      {
        question: 'What does "reinvesting 60%" in a baking hustle look like?',
        options: [
          "Buying a new phone",
          "Paying rent",
          "Buying flour, sugar, gas and packaging in bulk",
          "Taking a holiday",
        ],
        correct: 2,
        icon: "🍞",
      },
      {
        question:
          "Why is it important to separate business money from personal money?",
        options: [
          "It is a legal requirement",
          "So you can track profit accurately and avoid spending business funds on personal needs",
          "Banks require it",
          "To pay less tax",
        ],
        correct: 1,
        icon: "💳",
      },
      {
        question: "What is the risk of not saving any profit?",
        options: [
          "Your prices will drop",
          "A slow month leaves you with nothing to cover personal needs",
          "Customers will leave",
          "Your costs will increase",
        ],
        correct: 1,
        icon: "⚠️",
      },
      {
        question:
          "Which portion of profit directly supports your personal stability?",
        options: [
          "60% Reinvest",
          "10% Savings",
          "30% Personal Needs",
          "None — all profit goes back to the business",
        ],
        correct: 2,
        icon: "🏠",
      },
      {
        question:
          "If you earn R1,200 in sales and have R400 in costs, what is your profit?",
        options: ["R1,200", "R400", "R800", "R1,600"],
        correct: 2,
        icon: "🧮",
      },
      {
        question: "From R800 profit, how much goes to personal needs (30%)?",
        options: ["R80", "R480", "R240", "R160"],
        correct: 2,
        icon: "💵",
      },
      {
        question: "What should you do immediately after making a sale?",
        options: [
          "Post about it on social media",
          "Calculate profit before spending anything",
          "Pay yourself first",
          "Buy more stock immediately",
        ],
        correct: 1,
        icon: "1️⃣",
      },
      {
        question: "What is one sign a hustler is in the Survival stage?",
        options: [
          "They have a waiting list",
          "They earn regular weekly income",
          "Income is inconsistent — piece jobs, few customers",
          "They have hired a helper",
        ],
        correct: 2,
        icon: "📊",
      },
      {
        question: 'What does "financial discipline" mean for a hustler?',
        options: [
          "Spending as little as possible",
          "Following the 60-30-10 split consistently for every sale, every time",
          "Only spending on necessities",
          "Keeping all money in a bank account",
        ],
        correct: 1,
        icon: "💪",
      },
      {
        question: "Name one personal need the 30% portion would NOT cover.",
        options: [
          "Food for the week",
          "Airtime",
          "New sewing materials for the next order",
          "Transport to work",
        ],
        correct: 2,
        icon: "❌",
      },
      {
        question:
          "Why might two hustlers with the same revenue have different profits?",
        options: [
          "One works harder",
          "Their costs differ — lower costs mean higher profit from the same revenue",
          "One has more customers",
          "One charges differently",
        ],
        correct: 1,
        icon: "⚖️",
      },
      {
        question:
          "What does Tumelo reinvest his 60% into after the first month?",
        options: [
          "A new phone",
          "Materials and a proper sanding block",
          "Transport costs",
          "Marketing flyers",
        ],
        correct: 1,
        icon: "🔧",
      },
      {
        question: 'What is a "slow month" and how does saving protect you?',
        options: [
          "A month with fewer sales — your savings covers personal needs so the business survives",
          "A month with high costs",
          "A month with no new customers",
          "A holiday month",
        ],
        correct: 0,
        icon: "🌧️",
      },
      {
        question: "What simple tool can you use to track sales and costs?",
        options: [
          "A gaming app",
          "A notes app, spreadsheet, or notebook — write every sale down",
          "Instagram",
          "A banking app only",
        ],
        correct: 1,
        icon: "📱",
      },
      {
        question: 'What does "revenue" mean?',
        options: [
          "Money left after costs",
          "The total amount customers pay you before any deductions",
          "Your monthly salary",
          "Net income after tax",
        ],
        correct: 1,
        icon: "💰",
      },
      {
        question: "What is the Kids Haven success principle about consistency?",
        options: [
          "One big sale changes everything",
          "Small, consistent discipline applied to every sale builds sustainable income",
          "You need 100 customers before profit matters",
          "Track sales only monthly",
        ],
        correct: 1,
        icon: "🏆",
      },
      {
        question:
          "What does a monthly budget reveal that tracking single sales cannot?",
        options: [
          "How much each customer paid",
          "Income patterns, spending trends and progress toward targets",
          "Your hourly rate",
          "What competitors are earning",
        ],
        correct: 1,
        icon: "📅",
      },
      {
        question: "What is the financial goal of Hustling Academy?",
        options: [
          "Making participants wealthy",
          "Building stable income covering food, transport, rent and dignity",
          "Getting participants into formal employment",
          "Teaching participants to invest in shares",
        ],
        correct: 1,
        icon: "🎯",
      },
      {
        question:
          "What does Tumelo discover by writing down his profit for the first time?",
        options: [
          "He was overcharging customers",
          "He had been guessing — real numbers showed him exactly where every rand goes",
          "His costs were much lower than expected",
          "He needed to raise his prices",
        ],
        correct: 1,
        icon: "✏️",
      },
      {
        question: "From R800 profit, how much goes to savings (10%)?",
        options: ["R480", "R240", "R160", "R80"],
        correct: 3,
        icon: "🏦",
      },
      {
        question: "What is the Earn → Reinvest → Grow model also known as?",
        options: [
          "The profit ladder",
          "The Kids Haven Hustle Money Model",
          "The savings loop",
          "The income chain",
        ],
        correct: 1,
        icon: "♻️",
      },
      {
        question: "What does Tumelo save from his first R230 profit?",
        options: ["R138", "R69", "R23", "R50"],
        correct: 2,
        icon: "🏺",
      },
      {
        question: "What is the difference between income and profit?",
        options: [
          "They are the same thing",
          "Income is total revenue; profit is what remains after all costs are subtracted",
          "Profit includes tax; income does not",
          "Income is weekly; profit is monthly",
        ],
        correct: 1,
        icon: "📖",
      },
      {
        question:
          "What happens if you ignore business costs when pricing your product?",
        options: [
          "Customers are happier",
          "You may work hard and still lose money",
          "Your profit increases",
          "Costs disappear over time",
        ],
        correct: 1,
        icon: "🚨",
      },
      {
        question:
          "What is the final financial message of the Kids Haven handbook?",
        options: [
          "Earn as much as possible quickly",
          "Start small, save consistently, reinvest wisely, and grow steadily",
          "Save everything and never spend on yourself",
          "Reinvest all profit and never pay personal needs",
        ],
        correct: 1,
        icon: "📖",
      },
      {
        question:
          "How does splitting profit three ways simultaneously benefit a hustler?",
        options: [
          "It does not — you should focus only on reinvesting",
          "Each portion works at once: growing the business, covering personal needs, and building a safety net",
          "It reduces total profit",
          "It only works for large businesses",
        ],
        correct: 1,
        icon: "🔀",
      },
      {
        question: 'What does "pay yourself first" mean in personal finance?',
        options: [
          "Spend freely before budgeting",
          "Set aside your savings portion before spending on anything else",
          "Reinvest all profit back into the business",
          "Pay bills before buying food",
        ],
        correct: 1,
        icon: "💳",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing & Sales",
    subtitle: "Find customers, sell with confidence",
    icon: "🎯",
    color: "#3b82f6",
    rgb: "59,130,246",
    questions: [
      {
        question: "What is the simple definition of marketing?",
        options: [
          "Advertising on social media",
          "Helping people know, like, trust and buy from you",
          "Creating a logo and brand colours",
          "Running promotions and discounts",
        ],
        correct: 1,
        icon: "📣",
      },
      {
        question: "What is a target audience?",
        options: [
          "Everyone in your city",
          "Any person with money",
          "The group most likely to buy your product or service",
          "People who already know you",
        ],
        correct: 2,
        icon: "🎯",
      },
      {
        question: "What is a customer persona?",
        options: [
          "A legal business entity",
          "A fake profile to test marketing",
          "A simple profile of your ideal customer including their problem",
          "A social media account",
        ],
        correct: 2,
        icon: "👤",
      },
      {
        question: "Why do people buy products?",
        options: [
          "Because of advertising alone",
          "To solve a problem, gain status, or feel happy",
          "Only when they have extra money",
          "Because someone tells them to",
        ],
        correct: 1,
        icon: "🛒",
      },
      {
        question: "What is the Problem → Solution → Benefit formula?",
        options: [
          "Three stages of business growth",
          "State the problem, your solution, then the benefit customers get",
          "A financial planning model",
          "A customer service framework",
        ],
        correct: 1,
        icon: "📐",
      },
      {
        question: "What are the three elements of a good social media post?",
        options: [
          "Long text, hashtags, emojis",
          "Photo + Short message + Call to action",
          "Price, description, address",
          "Video, music, filter",
        ],
        correct: 1,
        icon: "📱",
      },
      {
        question: 'What is a "call to action" in a post?',
        options: [
          "The photo in your post",
          "A hashtag",
          "A clear instruction telling the customer what to do next",
          "A discount code",
        ],
        correct: 2,
        icon: "👆",
      },
      {
        question:
          "Which free app can a hustler use to create professional advertisements?",
        options: ["Microsoft Word", "Canva", "Adobe Photoshop", "Google Maps"],
        correct: 1,
        icon: "🎨",
      },
      {
        question: "What are the 6 Basic Sales Steps in order?",
        options: [
          "Ask → Greet → Listen → Explain → Thank → Close",
          "Greet → Ask → Listen → Explain benefits → Ask for the sale → Thank",
          "Pitch → Demonstrate → Close → Follow up → Ask → Thank",
          "Advertise → Meet → Sell → Invoice → Deliver → Follow up",
        ],
        correct: 1,
        icon: "🪜",
      },
      {
        question: 'What does "sales is helping, not forcing" mean?',
        options: [
          "You should always offer discounts",
          "Never push a customer — understand their need and show how you meet it",
          "Be aggressive to close the sale",
          "Always agree with the customer",
        ],
        correct: 1,
        icon: "🤝",
      },
      {
        question: "What makes a marketing message BAD?",
        options: [
          "It is short and direct",
          "It is honest about the price",
          "It uses complicated jargon nobody understands",
          "It includes a photo",
        ],
        correct: 2,
        icon: "❌",
      },
      {
        question: "Why do people remember stories better than facts?",
        options: [
          "Stories are longer",
          "Stories connect emotionally — they are more memorable than lists",
          "Facts are harder to read",
          "Stories use better grammar",
        ],
        correct: 1,
        icon: "📖",
      },
      {
        question: "Who is Tumelo's customer persona?",
        options: [
          "A wealthy homeowner named Thabo",
          "Ayanda — a 24-year-old retail assistant in her first flat on a tight budget",
          "A school that buys furniture",
          "A charity shop manager",
        ],
        correct: 1,
        icon: "👩🏾",
      },
      {
        question: "What is Tumelo's marketing message?",
        options: [
          '"We sell quality furniture at premium prices"',
          '"Good furniture doesn\'t have to be new furniture"',
          '"The best chairs in Ekurhuleni"',
          '"Affordable luxury for discerning buyers"',
        ],
        correct: 1,
        icon: "💬",
      },
      {
        question: "What should a good advertisement include?",
        options: [
          "Your life story",
          "Business name, image, offer, and contact details",
          "Testimonials from 10 customers",
          "A long product description",
        ],
        correct: 1,
        icon: "📋",
      },
      {
        question: "What did Tumelo's first WhatsApp Status achieve?",
        options: [
          "He got 1,000 followers",
          "Two people messaged him within the hour",
          "He went viral on TikTok",
          "He received a business loan",
        ],
        correct: 1,
        icon: "⚡",
      },
      {
        question: "Which social media platforms are free for hustlers?",
        options: [
          "Only paid platforms work",
          "LinkedIn and Twitter",
          "Facebook, WhatsApp Business, TikTok and Instagram",
          "Only WhatsApp",
        ],
        correct: 2,
        icon: "🌐",
      },
      {
        question: "What is a before-and-after photo used for?",
        options: [
          "Showing your process step by step",
          "Demonstrating the transformation so customers trust the result",
          "Comparing your prices to competitors",
          "Showing off your workspace",
        ],
        correct: 1,
        icon: "📸",
      },
      {
        question:
          "What is the most powerful and cheapest marketing tool for a new hustler?",
        options: [
          "Paid social media ads",
          "Word-of-mouth referrals from happy customers",
          "TV commercials",
          "Printed catalogues",
        ],
        correct: 1,
        icon: "💬",
      },
      {
        question: "Why should your sales pitch be under 30 seconds?",
        options: [
          "It is a legal requirement",
          "Customers have short attention spans — a tight pitch is more memorable",
          "It is easier to memorise",
          "Long pitches cost more",
        ],
        correct: 1,
        icon: "⏱️",
      },
      {
        question: "What is the marketing pillar's opening principle?",
        options: [
          "Marketing is about being the loudest",
          "Marketing is saying the right thing, to the right person, in a way they understand",
          "Marketing needs a big budget",
          "Marketing is only for big companies",
        ],
        correct: 1,
        icon: "📢",
      },
      {
        question:
          "What should you do when a customer raises a price objection?",
        options: [
          "Immediately lower the price",
          "Argue that your price is fair",
          "Explain the value — materials, time, quality — and offer an alternative if possible",
          "Walk away from the sale",
        ],
        correct: 2,
        icon: "💬",
      },
      {
        question: "What is the first step in knowing your customer?",
        options: [
          "Run a survey",
          "Define your target audience — the group most likely to buy from you",
          "Post on social media",
          "Ask your family",
        ],
        correct: 1,
        icon: "🎯",
      },
      {
        question:
          'Why is "simple" the most important quality in a marketing message?',
        options: [
          "Simple messages cost less to produce",
          "Customers make fast decisions — simple messages are understood in seconds and remembered for days",
          "Simple messages are easier to write",
          "Short messages get more likes on social media",
        ],
        correct: 1,
        icon: "✂️",
      },
      {
        question: "What does a strong call to action do?",
        options: [
          "Makes the post look longer",
          "Tells the customer exactly what to do next, turning interest into action",
          "Adds hashtags to the post",
          "Increases your follower count",
        ],
        correct: 1,
        icon: "👆",
      },
      {
        question:
          "What marketing information should you include in an advertisement?",
        options: [
          "Your full life story",
          "Business name, image, offer, price, and contact details",
          "Only your social media handle",
          "A long list of product features",
        ],
        correct: 1,
        icon: "📋",
      },
      {
        question:
          "What is WhatsApp Business useful for beyond regular WhatsApp?",
        options: [
          "Making video calls",
          "A business catalogue, quick replies and professional profile for your hustle",
          "Sending money",
          "Group video calling",
        ],
        correct: 1,
        icon: "💼",
      },
      {
        question:
          "What is the marketing story structure taught in the handbook?",
        options: [
          "Introduction → Body → Conclusion",
          "What problem existed → What you did → How it helped people",
          "Challenge → Solution → Result → Lesson",
          "Hook → Offer → Deadline → Close",
        ],
        correct: 1,
        icon: "📖",
      },
      {
        question:
          "Why does Tumelo build a customer persona before posting on WhatsApp?",
        options: [
          "Because the platform requires it",
          "Because knowing Ayanda tells him exactly what to say and which photos to use",
          "To track how many views he gets",
          "Because his mentor told him to",
        ],
        correct: 1,
        icon: "👤",
      },
      {
        question: "What is the benefit of consistent social media posting?",
        options: [
          "It automatically generates sales",
          "It keeps your hustle visible so customers think of you when they need your service",
          "It builds your follower count",
          "It reduces your marketing costs",
        ],
        correct: 1,
        icon: "📲",
      },
      {
        question:
          'What does "honest" mean in the context of a marketing message?',
        options: [
          "Tell the customer what they want to hear",
          "Only promise what you can deliver — never exaggerate quality or mislead",
          "Be modest about your prices",
          "Reveal all your business information publicly",
        ],
        correct: 1,
        icon: "✅",
      },
      {
        question: "What is a unique selling point?",
        options: [
          "Your lowest price",
          "The one thing that makes your product better for your specific customer than alternatives",
          "Your social media handle",
          "A discount you always offer",
        ],
        correct: 1,
        icon: "⭐",
      },
      {
        question: "What is the group activity at the end of Marketing Day 3?",
        options: [
          "Filming a TikTok video",
          "Developing a full mini marketing campaign — persona, message, post, ad, pitch",
          "Writing a business plan",
          "Calculating monthly profit",
        ],
        correct: 1,
        icon: "🎭",
      },
      {
        question:
          "What question does a good marketing message answer for the customer?",
        options: [
          '"How much does it cost?"',
          '"Why should I buy from you — specifically?"',
          '"Where are you located?"',
          '"How long have you been in business?"',
        ],
        correct: 1,
        icon: "💡",
      },
      {
        question: "What is the difference between a feature and a benefit?",
        options: [
          "They mean the same thing",
          "A feature is what the product is; a benefit is what it does for the customer — sell benefits",
          "Features are more important than benefits",
          "Benefits are listed on packaging; features are spoken",
        ],
        correct: 1,
        icon: "🔄",
      },
      {
        question: "What does TikTok offer a hustler as a marketing platform?",
        options: [
          "Paid advertising only",
          "Short engaging videos reaching a young audience organically and for free",
          "A way to sell products directly",
          "Business registration services",
        ],
        correct: 1,
        icon: "🎵",
      },
      {
        question:
          'What is the "Photo + Short message + Call to action" formula used for?',
        options: [
          "Writing a business plan",
          "Creating effective, simple social media posts that generate enquiries",
          "Designing a product",
          "Training sales staff",
        ],
        correct: 1,
        icon: "📸",
      },
      {
        question: 'What does it mean to "ask for the sale"?',
        options: [
          "Send a payment request",
          'Directly invite the customer to commit: "Would you like me to start this week?"',
          "Hand them a flyer",
          "Offer a discount to close",
        ],
        correct: 1,
        icon: "🤝",
      },
      {
        question:
          "Why should you listen before explaining in a sales conversation?",
        options: [
          "It is polite",
          "Listening reveals which specific benefit matters most to this customer, so you can address it directly",
          "Customers expect it",
          "It saves time",
        ],
        correct: 1,
        icon: "👂",
      },
      {
        question: "What is the result of Tumelo's first WhatsApp post?",
        options: [
          "He gained 1,000 followers",
          "He went viral",
          "Two people messaged him with enquiries within the hour",
          "He received a business grant",
        ],
        correct: 2,
        icon: "⚡",
      },
      {
        question:
          "What makes a before-and-after photo more powerful than a description?",
        options: [
          "Photos are easier to create",
          "Visual proof of transformation builds instant trust — customers see the result, not just a promise",
          "Descriptions take too long to read",
          "Photos get more social media engagement",
        ],
        correct: 1,
        icon: "🖼️",
      },
      {
        question: "Which step of the 6 Sales Steps comes AFTER listening?",
        options: [
          "Greeting",
          "Asking questions",
          "Explaining benefits",
          "Thanking the customer",
        ],
        correct: 2,
        icon: "🪜",
      },
      {
        question:
          'What is a "target audience" different from a "customer persona"?',
        options: [
          "They are the same thing",
          "Target audience is the broad group; persona is one detailed example of a person in that group",
          "Persona is broader; audience is specific",
          "Target audience is for products; persona is for services",
        ],
        correct: 1,
        icon: "🔍",
      },
      {
        question: "What marketing minimum does a hustler need to start?",
        options: [
          "A registered business and logo",
          "A paid advertising budget",
          "A smartphone with WhatsApp — post before-and-after photos with a clear message and contact number",
          "A professional website",
        ],
        correct: 2,
        icon: "📱",
      },
      {
        question:
          "What makes word-of-mouth more powerful than paid advertising for a new hustler?",
        options: [
          "It is louder",
          "It is free, trusted and personal — a friend's recommendation outweighs any ad",
          "It reaches more people",
          "It is more creative",
        ],
        correct: 1,
        icon: "🗣️",
      },
      {
        question: "What does the Problem → Solution → Benefit formula produce?",
        options: [
          "A business plan",
          "A customer profile",
          "A clear marketing message that speaks directly to what the customer needs",
          "A pricing strategy",
        ],
        correct: 2,
        icon: "📐",
      },
      {
        question:
          'In the 4-Step Sales Conversation, what does "explain value" mean?',
        options: [
          "List all product features",
          "Tell the customer specifically how your service solves their problem or improves their life",
          "Show them your qualifications",
          "Describe your business history",
        ],
        correct: 1,
        icon: "💎",
      },
      {
        question: "What is the marketing pillar summary in one sentence?",
        options: [
          "Sell to everyone and advertise everywhere",
          "Know your customer, craft a simple honest message, use free tools, and follow the 6-step sales conversation",
          "Build a website and wait for customers",
          "Create the best product and customers will come",
        ],
        correct: 1,
        icon: "📌",
      },
      {
        question:
          "What type of content performs best for a furniture up-cycling hustle?",
        options: [
          "Motivational quotes",
          "Price lists only",
          "Before-and-after photos showing the transformation of specific pieces",
          "Videos of the workshop",
        ],
        correct: 2,
        icon: "🛋️",
      },
      {
        question: "What is the final step in the 6 Basic Sales Steps?",
        options: [
          "Ask for the sale",
          "Give a discount",
          "Thank the customer",
          "Send a receipt",
        ],
        correct: 2,
        icon: "🙏",
      },
    ],
  },
  {
    id: "customerservice",
    title: "Customer Service",
    subtitle: "Treat people well, they come back",
    icon: "🤝",
    color: "#ec4899",
    rgb: "236,72,153",
    questions: [
      {
        question: "What is customer service?",
        options: [
          "Advertising to new customers",
          "How you treat people before, during and after they buy from you",
          "Delivering products on time",
          "Answering complaints only",
        ],
        correct: 1,
        icon: "🤝",
      },
      {
        question: "What is the Customer Service golden rule?",
        options: [
          "The customer is always right",
          "A happy customer can come back and bring more customers",
          "Never argue with customers",
          "Always give a discount",
        ],
        correct: 1,
        icon: "🌟",
      },
      {
        question: 'What does "Greet properly" mean?',
        options: [
          "Say hello and walk away",
          "Make the customer feel welcome and respected from the first moment",
          "Use formal English only",
          "Wave from a distance",
        ],
        correct: 1,
        icon: "👋",
      },
      {
        question: 'What does "Listen first" mean in customer service?',
        options: [
          "Let the customer finish, then do what you planned anyway",
          "Understand what the customer wants BEFORE answering or suggesting",
          "Listen to music while serving",
          "Take notes on everything",
        ],
        correct: 1,
        icon: "👂",
      },
      {
        question: "What does L stand for in the L.E.A.R.N method?",
        options: ["Love", "Learn", "Listen", "Lead"],
        correct: 2,
        icon: "📖",
      },
      {
        question: "What does E stand for in L.E.A.R.N?",
        options: ["Explain", "Execute", "Empathize", "Evaluate"],
        correct: 2,
        icon: "❤️",
      },
      {
        question: "What does A stand for in L.E.A.R.N?",
        options: ["Ask", "Apologize", "Advertise", "Analyse"],
        correct: 1,
        icon: "🙏",
      },
      {
        question: "What does R stand for in L.E.A.R.N?",
        options: ["Respond", "Refer", "Resolve", "Repeat"],
        correct: 2,
        icon: "🔧",
      },
      {
        question: "What does N stand for in L.E.A.R.N?",
        options: [
          "Note it down",
          "Next step",
          "Negotiate",
          "Notify management",
        ],
        correct: 1,
        icon: "➡️",
      },
      {
        question: "When should you communicate a delivery delay to a customer?",
        options: [
          "After the customer asks where their order is",
          "Never — just deliver when ready",
          "Before the customer has to ask — proactively",
          "Only if the delay is more than a week",
        ],
        correct: 2,
        icon: "📩",
      },
      {
        question: "What happens if you deliver late WITHOUT communicating?",
        options: [
          "Customers understand — life happens",
          "Customers lose trust and may not return",
          "Nothing changes",
          "Customers give you more time",
        ],
        correct: 1,
        icon: "⚠️",
      },
      {
        question: "What is the WhatsApp template for confirming an order?",
        options: [
          '"I got your order, thanks."',
          '"Thank you for your order. Item: [item], Price: R[amount], Ready: [date]."',
          '"Your order is being processed."',
          '"We will contact you soon."',
        ],
        correct: 1,
        icon: "✅",
      },
      {
        question: "What should you NEVER do when a customer complains?",
        options: [
          "Listen carefully",
          "Offer a solution",
          "Argue or blame the customer immediately",
          "Apologize sincerely",
        ],
        correct: 2,
        icon: "🚫",
      },
      {
        question: "How does Tumelo handle the chair damaged in transport?",
        options: [
          "He blames the transport company",
          "He ignores the customer",
          "He uses L.E.A.R.N — listens, empathises, apologises, fixes it free, gives a deadline",
          "He offers a full refund and ends the relationship",
        ],
        correct: 2,
        icon: "🪑",
      },
      {
        question: 'What does "follow up" after a sale look like?',
        options: [
          "Sending a discount code for next purchase",
          "Checking if the customer is satisfied and thanking them",
          "Asking for a 5-star review",
          "Sending your price list again",
        ],
        correct: 1,
        icon: "📲",
      },
      {
        question: 'What does "communicate clearly" mean in customer service?',
        options: [
          "Use long detailed messages",
          "Explain price, timing, payment and delivery so there are no surprises",
          "Communicate only in writing",
          "Never give a deadline",
        ],
        correct: 1,
        icon: "💬",
      },
      {
        question:
          "What is the result of Tumelo sending thank-you messages to every customer?",
        options: [
          "Customers started expecting discounts",
          "More than half his orders came from repeat customers or referrals within 3 months",
          "Nothing changed",
          "Customers stopped buying from him",
        ],
        correct: 1,
        icon: "📈",
      },
      {
        question: "What should you say when you cannot keep a promise?",
        options: [
          "Stay silent and hope they forget",
          "Blame an external problem",
          "Contact the customer first, be honest and give a new realistic commitment",
          "Offer a replacement product",
        ],
        correct: 2,
        icon: "🤲",
      },
      {
        question: "Which of these is in the Customer Service DO list?",
        options: [
          "Ignore messages you find difficult",
          "Change prices without explaining",
          "Keep your promises",
          "Argue when the customer is wrong",
        ],
        correct: 2,
        icon: "✅",
      },
      {
        question:
          "What does a customer remember most about a service experience?",
        options: [
          "Exactly what they paid",
          "The quality of the product packaging",
          "How you made them feel — respect, communication, gratitude",
          "The delivery speed alone",
        ],
        correct: 2,
        icon: "💭",
      },
      {
        question:
          "What is the purpose of the WhatsApp thank-you message template?",
        options: [
          "To ask for a review",
          "To close the sale positively, show appreciation and invite future orders",
          "To remind them to pay",
          "To share your price list",
        ],
        correct: 1,
        icon: "💌",
      },
      {
        question:
          'What does "a well-handled complaint builds more trust than a problem-free sale" mean?',
        options: [
          "Problems are good for business",
          "How you respond under pressure reveals your character and builds lasting loyalty",
          "Complaints should be ignored",
          "Customers prefer businesses that make mistakes",
        ],
        correct: 1,
        icon: "🏆",
      },
      {
        question:
          "What is the correct response when a customer says your price is too high?",
        options: [
          "Immediately lower the price",
          "Argue that they are wrong",
          "Stay calm, explain the value, and offer an alternative option if possible",
          "End the conversation",
        ],
        correct: 2,
        icon: "💰",
      },
      {
        question:
          'What does "proactive communication" look like for a hustler?',
        options: [
          "Waiting for the customer to ask for an update",
          "Messaging the customer with updates before they need to ask",
          "Posting on social media about your progress",
          "Sending a monthly newsletter",
        ],
        correct: 1,
        icon: "📩",
      },
      {
        question:
          'What is the correct L.E.A.R.N response to "You are taking too long with my order"?',
        options: [
          "Tell them your business is busy",
          "Listen fully, empathize, apologize, give a clear resolution and a new delivery time",
          "Offer a refund immediately",
          "Ask them to be patient without explanation",
        ],
        correct: 1,
        icon: "⏱️",
      },
      {
        question: 'What does "stay respectful" mean when a customer is rude?',
        options: [
          "Match their energy",
          "End the conversation",
          "Remain calm and professional regardless of the customer's tone",
          "Ask them to leave",
        ],
        correct: 2,
        icon: "🧘",
      },
      {
        question: "Why is it important to confirm order details in writing?",
        options: [
          "To create legal records",
          "To prevent misunderstandings about price, item and delivery date — protecting both parties",
          "Banks require it",
          "To show professionalism on social media",
        ],
        correct: 1,
        icon: "📝",
      },
      {
        question: "What does the WhatsApp delay message template achieve?",
        options: [
          "Excuses the hustler from the commitment",
          "Informs the customer early, apologises, gives a reason and a new date — preventing frustration",
          "Asks the customer to wait without a new date",
          "Transfers responsibility to a supplier",
        ],
        correct: 1,
        icon: "🕐",
      },
      {
        question: 'What is a "payment reminder" in customer service?',
        options: [
          "A legal demand letter",
          "A polite, specific message noting an outstanding amount and asking for confirmation once paid",
          "A message threatening to stop service",
          "A formal invoice",
        ],
        correct: 1,
        icon: "💵",
      },
      {
        question:
          "Which of the following is in the Customer Service DO NOT list?",
        options: [
          "Greet customers politely",
          "Keep a record of orders",
          "Lie about product quality",
          "Say thank you",
        ],
        correct: 2,
        icon: "🚫",
      },
      {
        question:
          'What does "follow up after a sale" demonstrate to the customer?',
        options: [
          "That you want more money from them",
          "That you value them beyond the transaction and care whether they are satisfied",
          "That you are checking they have not complained",
          "That you need a review",
        ],
        correct: 1,
        icon: "💌",
      },
      {
        question:
          "How should you respond to a customer whose order arrived damaged?",
        options: [
          "Blame the transport",
          "Apologize and offer to fix it at your own cost, then give a clear new deadline",
          "Offer a discount on the next order only",
          "Ask the customer to return it and wait",
        ],
        correct: 1,
        icon: "📦",
      },
      {
        question: "What three customer service habits make Tumelo successful?",
        options: [
          "Good prices, fast delivery, large range",
          "Proactive communication, genuine thank-you messages, and L.E.A.R.N for complaints",
          "Social media presence, cheap prices, fast work",
          "Fancy packaging, quick turnaround, low prices",
        ],
        correct: 1,
        icon: "🎯",
      },
      {
        question: 'What does "before the sale" customer service look like?',
        options: [
          "Sending a discount code",
          "Answering enquiries clearly and explaining the product so the customer knows what they are buying",
          "Posting reviews on social media",
          "Preparing an invoice in advance",
        ],
        correct: 1,
        icon: "🔍",
      },
      {
        question: 'What does "during the sale" customer service look like?',
        options: [
          "Processing payment only",
          "Being honest about price, timing and payment — no surprises",
          "Upselling additional products",
          "Rushing to close the transaction",
        ],
        correct: 1,
        icon: "🛒",
      },
      {
        question:
          "What is the result for Tumelo of handling the L.E.A.R.N complaint correctly?",
        options: [
          "He lost the customer",
          "The customer demanded a refund",
          "The customer stayed and later became one of his best referral sources",
          "The customer posted a negative review",
        ],
        correct: 2,
        icon: "🌟",
      },
      {
        question:
          "What makes a thank-you message effective in customer service?",
        options: [
          "It mentions the next product on sale",
          "It is genuine, uses the customer's name if possible, and invites future contact",
          "It asks for a 5-star review immediately",
          "It is sent automatically by an app",
        ],
        correct: 1,
        icon: "💬",
      },
      {
        question: "Why should you never ignore a customer message?",
        options: [
          "Legal consequences",
          "Silence signals that you do not value their business — customers move on and warn others",
          "It is impolite",
          "It reduces your response rate statistics",
        ],
        correct: 1,
        icon: "📵",
      },
      {
        question: 'What does "communicate clearly" about price mean?',
        options: [
          "Give a vague estimate first",
          "State the exact price, what is included, and when payment is due — before work starts",
          "Reveal the price only after delivery",
          "Charge per hour without explanation",
        ],
        correct: 1,
        icon: "🏷️",
      },
      {
        question:
          'What does "ask for feedback" accomplish as a customer service practice?',
        options: [
          "It is just a formality",
          "It shows you care about quality, reveals improvement areas, and makes customers feel valued",
          "It guarantees a positive review",
          "It is mainly for large businesses",
        ],
        correct: 1,
        icon: "🎤",
      },
      {
        question:
          "What is the ideal tone for a WhatsApp customer service message?",
        options: [
          "Casual and informal",
          "Stiff and corporate",
          "Warm, professional and clear — friendly but not careless",
          "Brief and blunt",
        ],
        correct: 2,
        icon: "💡",
      },
      {
        question:
          'What does "keep a record of orders and payments" protect you from?',
        options: [
          "Tax obligations",
          "Disputes about what was agreed — records show exactly what was ordered, priced and promised",
          "Losing customers",
          "Forgetting deadlines",
        ],
        correct: 1,
        icon: "📒",
      },
      {
        question:
          "What is the connection between customer service and repeat business?",
        options: [
          "Good products create repeat business; service is secondary",
          "Trust from excellent service creates loyalty, which creates repeat orders and referrals",
          "Price is the main driver of repeat business",
          "Location determines repeat business more than service",
        ],
        correct: 1,
        icon: "🔁",
      },
      {
        question: 'What does "every interaction represents your hustle" mean?',
        options: [
          "You must always be in work mode",
          "How you behave and communicate at every stage shapes your reputation — there are no off moments",
          "Only formal business meetings count",
          "Your social media presence defines your hustle",
        ],
        correct: 1,
        icon: "🏪",
      },
      {
        question: "What is the Pillar 4 Day 3 action challenge?",
        options: [
          "Write a complaint response",
          "Send a thank-you message to your last three customers this week",
          "Create a social media post",
          "Calculate your monthly profit",
        ],
        correct: 1,
        icon: "✅",
      },
      {
        question: 'What makes customers feel "remembered" by a hustler?',
        options: [
          "Receiving a discount code",
          "Being addressed personally and having previous orders referenced — feeling like a person, not a number",
          "Getting a newsletter",
          "Seeing their name on a loyalty card",
        ],
        correct: 1,
        icon: "💛",
      },
      {
        question:
          "What is the customer service lesson from Tumelo sending thank-you messages consistently?",
        options: [
          "It increased his social media followers",
          "Within three months, more than half his orders came from repeat customers or referrals",
          "Customers started asking for discounts",
          "It had no measurable effect",
        ],
        correct: 1,
        icon: "📈",
      },
      {
        question: 'What does "say thank you" accomplish beyond being polite?',
        options: [
          "Nothing beyond politeness",
          "It creates a memorable final impression, builds loyalty, and opens the door to future orders",
          "It is required by law",
          "It substitutes for following up after delivery",
        ],
        correct: 1,
        icon: "🙏",
      },
      {
        question: "What is the final Pillar 4 message about customer service?",
        options: [
          "A good product is enough",
          "Greet, listen, respect, communicate clearly and follow up — a happy customer comes back and brings others",
          "Price and speed matter most",
          "Customer service is only needed when things go wrong",
        ],
        correct: 1,
        icon: "🌟",
      },
      {
        question: "What does the L.E.A.R.N method turn a complaint into?",
        options: [
          "A refund situation",
          "A chance to build trust and demonstrate character under pressure",
          "A reason to end the customer relationship",
          "A legal document",
        ],
        correct: 1,
        icon: "🔄",
      },
    ],
  },
]

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({
  screen,
  setScreen,
}: {
  screen: Screen
  setScreen: (s: Screen) => void
}) {
  const tabs: { id: Screen; icon: string; label: string }[] = [
    { id: "dashboard", icon: "🏠", label: "Home" },
    { id: "learn", icon: "⚡", label: "Learn" },
    { id: "flashcards", icon: "🃏", label: "Cards" },
  ]
  return (
    <nav
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(26,47,94,0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.15)",
        display: "flex",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setScreen(t.id)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "10px 0",
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 24,
              filter: screen === t.id ? "none" : "grayscale(1) opacity(0.4)",
            }}
          >
            {t.icon}
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "Nunito, sans-serif",
              fontWeight: 800,
              color: screen === t.id ? "#93c5fd" : "rgba(255,255,255,0.35)",
              letterSpacing: 0.3,
            }}
          >
            {t.label}
          </span>
          {screen === t.id && (
            <div
              style={{
                width: 20,
                height: 3,
                borderRadius: 2,
                background: "linear-gradient(90deg, #3b82f6, #93c5fd)",
                marginTop: 2,
              }}
            />
          )}
        </button>
      ))}
    </nav>
  )
}

// ─── Would You Rather Section ─────────────────────────────────────────────────

function WouldYouRatherSection() {
  const [index, setIndex] = useState(() => lsGet("wyr_index", 0))
  const [chosen, setChosen] = useState<"A" | "B" | null>(null)
  const q = WYR_QUESTIONS[index % WYR_QUESTIONS.length]

  const choose = (side: "A" | "B") => setChosen(side)

  const next = () => {
    const next = index + 1
    setIndex(next)
    lsSet("wyr_index", next)
    setChosen(null)
  }

  const feedback =
    chosen === "A" ? q.encourageA : chosen === "B" ? q.encourageB : null

  return (
    <div>
      <SectionLabel>Would You Rather?</SectionLabel>
      <div className="glass-card" style={{ borderRadius: 20, padding: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 28 }}>{q.icon}</span>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "Outfit, sans-serif",
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Business Scenario #{(index % WYR_QUESTIONS.length) + 1}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(["A", "B"] as const).map((side) => {
            const text = side === "A" ? q.optionA : q.optionB
            const isChosen = chosen === side
            const isOther = chosen !== null && chosen !== side
            return (
              <button
                key={side}
                onClick={() => !chosen && choose(side)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: isChosen
                    ? "2px solid #60a5fa"
                    : "1.5px solid rgba(255,255,255,0.18)",
                  background: isChosen
                    ? "rgba(37,99,235,0.35)"
                    : isOther
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.1)",
                  color: isOther ? "rgba(255,255,255,0.35)" : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Nunito, sans-serif",
                  textAlign: "left",
                  cursor: chosen ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: isChosen ? "#3b82f6" : "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 900,
                    fontFamily: "Outfit, sans-serif",
                    color: isChosen ? "white" : "rgba(255,255,255,0.7)",
                  }}
                >
                  {isChosen ? "✓" : side}
                </div>
                {text}
              </button>
            )
          })}
        </div>

        {feedback && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "Outfit, sans-serif",
                  marginBottom: 5,
                }}
              >
                🌟 Great choice!
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.6,
                }}
              >
                {feedback}
              </div>
            </div>
            <button
              onClick={next}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: "none",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "Outfit, sans-serif",
                cursor: "pointer",
              }}
            >
              Next Scenario →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

function DashboardScreen({
  setScreen,
  goToModule,
}: {
  setScreen: (s: Screen) => void
  goToModule: (m: Module) => void
}) {
  const [studyGuideOpen, setStudyGuideOpen] = useState(false)
  const [savingStudyGuide, setSavingStudyGuide] = useState(false)
  const [studyGuideMessage, setStudyGuideMessage] = useState<string | null>(null)

  const saveStudyGuide = async () => {
    setSavingStudyGuide(true)
    setStudyGuideMessage(null)

    try {
      const response = await fetch(`${import.meta.env.BASE_URL}study-guide.pdf`)
      if (!response.ok) {
        throw new Error(`The PDF could not be loaded (${response.status}).`)
      }

      if (!Capacitor.isNativePlatform()) {
        const fileName = "Kids_Haven_Hustle_Academy_Study_Guide.pdf"
        const blob = await response.blob()
        const file = new File([blob], fileName, { type: "application/pdf" })
        // iPhone/iPad: the share sheet offers "Save to Files".
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: "Study guide" })
            setStudyGuideMessage("Choose Save to Files to keep a copy on your device.")
            return
          } catch (cause) {
            if (cause instanceof DOMException && cause.name === "AbortError") return
          }
        }
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        setStudyGuideMessage("The study guide download has started.")
        return
      }

      const bytes = new Uint8Array(await response.arrayBuffer())
      const chunks: string[] = []
      const chunkSize = 0x8000
      for (let index = 0; index < bytes.length; index += chunkSize) {
        chunks.push(
          String.fromCharCode(...bytes.subarray(index, index + chunkSize)),
        )
      }

      const fileName = "Kids_Haven_Hustle_Academy_Study_Guide.pdf"
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        directory: Directory.Documents,
        data: btoa(chunks.join("")),
      })
      setStudyGuideMessage(
        "Saved to your Documents folder. Choose an app below to open or share it.",
      )

      try {
        await Share.share({
          title: "Kids Haven Hustling Academy Study Guide",
          text: "Study guide PDF",
          files: [savedFile.uri],
          dialogTitle: "Open or share study guide",
        })
      } catch (cause) {
        setStudyGuideMessage(
          `The PDF was saved to Documents, but the share menu could not open: ${
            cause instanceof Error ? cause.message : "unknown error"
          }`,
        )
      }
    } catch (cause) {
      setStudyGuideMessage(
        cause instanceof Error
          ? `Could not save the study guide: ${cause.message}`
          : "Could not save the study guide.",
      )
    } finally {
      setSavingStudyGuide(false)
    }
  }

  return (
    <>
      <div style={{ overflowY: "auto", height: "100%", paddingBottom: 80 }}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 18px",
          background: "rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              Good morning 👋
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                fontFamily: "Outfit, sans-serif",
                lineHeight: 1.1,
              }}
            >
              Budding Entrepreneur!
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              Kids Haven Hustling Academy
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Flashcards */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <SectionLabel>Flashcards</SectionLabel>
            <button
              onClick={() => setScreen("flashcards")}
              style={{
                background: "none",
                border: "none",
                color: "#93c5fd",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                marginTop: -12,
              }}
            >
              See all →
            </button>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {[
              {
                label: "Financial Literacy",
                count: 100,
                icon: "💰",
                color: "#f59e0b",
                rgb: "245,158,11",
              },
              {
                label: "Entrepreneurship",
                count: 100,
                icon: "🚀",
                color: "#10b981",
                rgb: "16,185,129",
              },
              {
                label: "Sales Skills",
                count: 100,
                icon: "🎯",
                color: "#3b82f6",
                rgb: "59,130,246",
              },
              {
                label: "Customer Service",
                count: 100,
                icon: "🤝",
                color: "#ec4899",
                rgb: "236,72,153",
              },
            ].map((c) => (
              <button
                key={c.label}
                onClick={() => setScreen("flashcards")}
                style={{
                  border: `1px solid rgba(${c.rgb},0.3)`,
                  borderRadius: 16,
                  padding: "14px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  background: `rgba(${c.rgb},0.12)`,
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 7 }}>{c.icon}</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "Outfit, sans-serif",
                    color: "white",
                    marginBottom: 2,
                    lineHeight: 1.2,
                  }}
                >
                  {c.label}
                </div>
                <div style={{ fontSize: 11, color: c.color, fontWeight: 800 }}>
                  {c.count} cards
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Would You Rather */}
        <div style={{ marginTop: 24 }}>
          <WouldYouRatherSection />
        </div>

        {/* Achievements */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <SectionLabel>Achievements</SectionLabel>
          <div
            className="glass-card"
            style={{
              borderRadius: 18,
              padding: 16,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {computeBadges().map((b) => (
              <div
                key={b.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: b.earned
                      ? "rgba(59,130,246,0.3)"
                      : "rgba(255,255,255,0.06)",
                    border: b.earned
                      ? "1px solid rgba(147,197,253,0.5)"
                      : "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    filter: b.earned ? "none" : "grayscale(1) opacity(0.3)",
                  }}
                >
                  {b.icon}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: b.earned
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.3)",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {b.label}
                </span>
                {!b.earned && (
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.2 }}>
                    {({
                      "Streak Master": "Answer 10 quiz questions",
                      "Money Wise": "Finish Finance module",
                      "Hustler": "Finish Business module",
                      "Sales Pro": "Finish Marketing module",
                      "Top Earner": "Score 100% on any quiz",
                      "Scholar": "Swipe cards in all 4 categories",
                    } as Record<string, string>)[b.label]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Study Guide Download */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <SectionLabel>Study Guide</SectionLabel>
          <div
            className="glass-card"
            style={{
              borderRadius: 18,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "rgba(245,158,11,0.2)",
                border: "1px solid rgba(245,158,11,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                flexShrink: 0,
              }}
            >
              📄
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  fontFamily: "Outfit, sans-serif",
                  color: "white",
                  marginBottom: 3,
                }}
              >
                Kids Haven Hustling Academy
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 700,
                }}
              >
                Full handbook · Save offline
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setStudyGuideOpen(true)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 900,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                View
              </button>
              <button
                onClick={() => void saveStudyGuide()}
                disabled={savingStudyGuide}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  color: "#1a1a1a",
                  fontSize: 12,
                  fontWeight: 900,
                  fontFamily: "Outfit, sans-serif",
                  opacity: savingStudyGuide ? 0.65 : 1,
                }}
              >
                {savingStudyGuide ? "Saving…" : "↓ Save"}
              </button>
            </div>
          </div>
          {studyGuideMessage && (
            <div
              role="status"
              style={{
                marginTop: 10,
                fontSize: 12,
                lineHeight: 1.5,
                color: studyGuideMessage.startsWith("Could not")
                  ? "#fecaca"
                  : "rgba(255,255,255,0.75)",
              }}
            >
              {studyGuideMessage}
            </div>
          )}
        </div>
      </div>
      </div>
      {studyGuideOpen && (
        <Suspense
          fallback={
            <div
              role="status"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2000,
                display: "grid",
                placeItems: "center",
                background: "#14245a",
                color: "white",
              }}
            >
              Loading study guide viewer…
            </div>
          }
        >
          <StudyGuideViewer onClose={() => setStudyGuideOpen(false)} />
        </Suspense>
      )}
    </>
  )
}

// ─── Module Picker ─────────────────────────────────────────────────────────────

function ModulePicker({ onSelect }: { onSelect: (m: Module) => void }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: 80 }}>
      <div
        style={{
          padding: "20px 20px 18px",
          background: "rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "Outfit, sans-serif",
          }}
        >
          Choose a Module
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          Select what you want to learn today
        </div>
      </div>

      <div
        style={{
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            style={{
              width: "100%",
              padding: 0,
              border: "none",
              background: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              className="glass-card"
              style={{
                borderRadius: 20,
                padding: "18px 20px",
                border: `1px solid rgba(${m.rgb},0.35)`,
                background: `rgba(${m.rgb},0.1)`,
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    flexShrink: 0,
                    background: `rgba(${m.rgb},0.22)`,
                    border: `1.5px solid rgba(${m.rgb},0.45)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 900,
                      fontFamily: "Outfit, sans-serif",
                      color: "white",
                      marginBottom: 4,
                    }}
                  >
                    {m.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    {m.subtitle}
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      background: `rgba(${m.rgb},0.18)`,
                      border: `1px solid rgba(${m.rgb},0.3)`,
                      borderRadius: 8,
                      padding: "3px 10px",
                    }}
                  >
                    <span
                      style={{ fontSize: 11, color: m.color, fontWeight: 800 }}
                    >
                      {(() => {
                        const progress = getModuleProgress(m)
                        if (progress.completed) return "Completed · Play again"
                        if (progress.nextQuestion > 0) {
                          return `Continue · Question ${progress.nextQuestion + 1} of ${m.questions.length}`
                        }
                        return `${m.questions.length} questions`
                      })()}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: `rgba(${m.rgb},0.2)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    color: m.color,
                    flexShrink: 0,
                  }}
                >
                  ›
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Quiz Screen ──────────────────────────────────────────────────────────────

function QuizScreen({
  module: mod,
  onBack,
  onHome,
}: {
  module: Module
  onBack: () => void
  onHome: () => void
}) {
  const [progressAtStart] = useState(() => getModuleProgress(mod))
  const [answers, setAnswers] = useState(progressAtStart.answers)
  const [nextQuestion, setNextQuestion] = useState(progressAtStart.nextQuestion)
  const [currentQ, setCurrentQ] = useState(() =>
    Math.min(progressAtStart.nextQuestion, mod.questions.length - 1),
  )
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    progressAtStart.answers[
      Math.min(progressAtStart.nextQuestion, mod.questions.length - 1)
    ],
  )
  const [showResult, setShowResult] = useState(
    progressAtStart.answers[
      Math.min(progressAtStart.nextQuestion, mod.questions.length - 1)
    ] !== null,
  )
  const [score, setScore] = useState(progressAtStart.score)
  const [completed, setCompleted] = useState(progressAtStart.completed)
  const [floatingXP, setFloatingXP] = useState<{ x: number; y: number } | null>(
    null,
  )

  const q = mod.questions[currentQ]
  const total = mod.questions.length
  const isLast = currentQ === total - 1
  const XP_PER_Q = 50

  const showQuestion = (index: number) => {
    const answer = answers[index]
    setCurrentQ(index)
    setSelectedAnswer(answer)
    setShowResult(answer !== null)
  }

  const handleAnswer = (idx: number, e: React.MouseEvent) => {
    if (showResult) return
    setSelectedAnswer(idx)
    setShowResult(true)
    recordQuizAnswer()
    const updatedAnswers = [...answers]
    updatedAnswers[currentQ] = idx
    setAnswers(updatedAnswers)
    const previousAnswer = answers[currentQ]
    const nextScore =
      score +
      (idx === q.correct ? 1 : 0) -
      (previousAnswer === q.correct ? 1 : 0)
    setScore(nextScore)
    const updatedNextQuestion = Math.max(nextQuestion, currentQ + 1)
    setNextQuestion(updatedNextQuestion)
    const isComplete = updatedAnswers.every((answer) => answer !== null)
    saveModuleProgress(mod, {
      nextQuestion: updatedNextQuestion,
      score: nextScore,
      completed: isComplete,
      answers: updatedAnswers,
    })
    if (isComplete) {
      setCompleted(true)
      recordModuleComplete(mod.id, nextScore, total)
    }
    if (idx === q.correct) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setFloatingXP({ x: rect.left + rect.width / 2, y: rect.top })
      setTimeout(() => setFloatingXP(null), 1000)
    }
  }

  const handleNext = () => {
    if (isLast) {
      setCompleted(true)
      return
    }
    showQuestion(currentQ + 1)
  }

  const handlePrevious = () => {
    if (currentQ > 0) showQuestion(currentQ - 1)
  }

  const letters = ["A", "B", "C", "D"]

  const getOptionStyle = (idx: number): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: "100%",
      padding: "13px 16px",
      borderRadius: 14,
      border: "1.5px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.1)",
      color: "white",
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "Nunito, sans-serif",
      textAlign: "left",
      cursor: showResult ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: 12,
      transition: "all 0.2s",
    }
    if (!showResult) return base
    if (idx === q.correct)
      return {
        ...base,
        background: "rgba(16,185,129,0.25)",
        border: "1.5px solid #10b981",
      }
    if (idx === selectedAnswer)
      return {
        ...base,
        background: "rgba(244,63,94,0.25)",
        border: "1.5px solid #f43f5e",
      }
    return { ...base, opacity: 0.3 }
  }

  if (completed) {
    const finalScore = score
    const pct = Math.round((finalScore / total) * 100)
    return (
      <div
        style={{
          height: "100%",
          overflowY: "auto",
          padding: "24px 20px",
          paddingBottom: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div style={{ fontSize: 56 }}>
          {pct >= 80 ? "🏆" : pct >= 60 ? "🎉" : "💪"}
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              fontFamily: "Outfit, sans-serif",
              marginBottom: 6,
            }}
          >
            {pct >= 80
              ? "Excellent Work!"
              : pct >= 60
                ? "Great Effort!"
                : "Keep Practising!"}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.65)",
              fontWeight: 600,
            }}
          >
            You scored {finalScore} out of {total} on {mod.title}
          </div>
        </div>
        <div
          style={{
            width: "100%",
            maxWidth: 300,
            background: `rgba(${mod.rgb},0.15)`,
            border: `1px solid rgba(${mod.rgb},0.35)`,
            borderRadius: 20,
            padding: "20px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              fontFamily: "Outfit, sans-serif",
              color: mod.color,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              fontWeight: 700,
              marginTop: 4,
            }}
          >
            Score
          </div>
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <button
            onClick={() => {
              setCompleted(false)
              showQuestion(total - 1)
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 14,
              border: "1.5px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "Outfit, sans-serif",
              cursor: "pointer",
            }}
          >
            ← Review Previous Question
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              const resetAnswers: (number | null)[] = Array.from(
                { length: total },
                () => null,
              )
              saveModuleProgress(mod, {
                nextQuestion: 0,
                score: 0,
                completed: false,
                answers: resetAnswers,
              })
              setAnswers(resetAnswers)
              setNextQuestion(0)
              setCurrentQ(0)
              setSelectedAnswer(null)
              setShowResult(false)
              setScore(0)
              setCompleted(false)
            }}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "none",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              fontFamily: "Outfit, sans-serif",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <button
            onClick={onHome}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "1.5px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.8)",
              fontSize: 14,
              fontWeight: 800,
              fontFamily: "Outfit, sans-serif",
              cursor: "pointer",
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 80,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 10,
              padding: "6px 12px",
              color: "white",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "Nunito, sans-serif",
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              {mod.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                fontWeight: 600,
              }}
            >
              Question {currentQ + 1} of {total}
            </div>
          </div>
          <div style={{ fontSize: 22 }}>{mod.icon}</div>
        </div>
        <div
          style={{
            height: 6,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 999,
          }}
        >
          <div
            className="progress-bar-fill"
            style={{
              height: "100%",
              borderRadius: 999,
              width: `${((currentQ + (showResult ? 1 : 0)) / total) * 100}%`,
              background: `linear-gradient(90deg, ${mod.color}, rgba(${mod.rgb},0.6))`,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
          {mod.questions.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background:
                  i < currentQ
                    ? mod.color
                    : i === currentQ
                      ? `rgba(${mod.rgb},0.5)`
                      : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: "16px 16px 0" }}>
        <div
          style={{
            borderRadius: 20,
            padding: "18px 18px 14px",
            background: `rgba(${mod.rgb},0.12)`,
            border: `1px solid rgba(${mod.rgb},0.3)`,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: `rgba(${mod.rgb},0.25)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {q.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: mod.color,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {mod.title}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  fontFamily: "Outfit, sans-serif",
                  lineHeight: 1.45,
                  color: "white",
                }}
              >
                {q.question}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              style={getOptionStyle(idx)}
              onClick={(e) => handleAnswer(idx, e)}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  flexShrink: 0,
                  background:
                    showResult && idx === q.correct
                      ? "#10b981"
                      : showResult && idx === selectedAnswer
                        ? "#f43f5e"
                        : "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 900,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                {showResult && idx === q.correct
                  ? "✓"
                  : showResult && idx === selectedAnswer && idx !== q.correct
                    ? "✗"
                    : letters[idx]}
              </div>
              {opt}
            </button>
          ))}
        </div>

        {showResult && (
          <div style={{ marginTop: 14, marginBottom: 8 }}>
            <div
              style={{
                background:
                  selectedAnswer === q.correct
                    ? "rgba(16,185,129,0.18)"
                    : "rgba(244,63,94,0.18)",
                border: `1px solid ${
                  selectedAnswer === q.correct
                    ? "rgba(16,185,129,0.45)"
                    : "rgba(244,63,94,0.45)"
                }`,
                borderRadius: 16,
                padding: "14px 16px",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  fontFamily: "Outfit, sans-serif",
                  marginBottom: 4,
                }}
              >
                {selectedAnswer === q.correct
                  ? "🎉 Correct! Well done!"
                  : "💪 Not quite — keep going!"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.55,
                }}
              >
                {selectedAnswer === q.correct
                  ? `+${XP_PER_Q} points! Every right answer builds your knowledge.`
                  : `The correct answer was: "${q.options[q.correct]}". Review the flashcards to reinforce this.`}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 8 }}>
          {currentQ > 0 && (
            <button
              onClick={handlePrevious}
              style={{
                flex: 1,
                padding: "13px 8px",
                borderRadius: 14,
                border: "1.5px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "Outfit, sans-serif",
                cursor: "pointer",
              }}
            >
              ← Previous
            </button>
          )}
          {showResult && (
            <button
              className="btn-primary"
              onClick={handleNext}
              style={{
                flex: 1,
                padding: "13px 8px",
                borderRadius: 14,
                border: "none",
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "Outfit, sans-serif",
                cursor: "pointer",
              }}
            >
              {isLast ? "Finish Module →" : "Next Question →"}
            </button>
          )}
        </div>
      </div>

      {floatingXP && (
        <div
          className="float-xp"
          style={{
            position: "fixed",
            left: floatingXP.x - 30,
            top: floatingXP.y - 20,
            fontSize: 19,
            fontWeight: 900,
            color: "#fcd34d",
            fontFamily: "Outfit, sans-serif",
            pointerEvents: "none",
            zIndex: 999,
            textShadow: "0 0 12px rgba(245,158,11,0.8)",
          }}
        >
          +{XP_PER_Q}!
        </div>
      )}
    </div>
  )
}

// ─── Learn Screen (picker + quiz) ─────────────────────────────────────────────

function LearnScreen({
  initialModule,
  onModuleChange,
  onHome,
}: {
  initialModule: Module | null
  onModuleChange: (m: Module | null) => void
  onHome: () => void
}) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(
    initialModule,
  )

  const selectModule = (m: Module | null) => {
    setSelectedModule(m)
    onModuleChange(m)
  }

  if (selectedModule) {
    return (
      <QuizScreen
        module={selectedModule}
        onBack={() => selectModule(null)}
        onHome={onHome}
      />
    )
  }
  return <ModulePicker onSelect={selectModule} />
}

// ─── Flashcards Screen ────────────────────────────────────────────────────────

function FlashcardsScreen() {
  const [category, setCategory] = useState(() => lsGet("fc_category", "All"))
  const [cardIndex, setCardIndex] = useState(() => lsGet(`fc_index_${lsGet("fc_category", "All")}`, 0))
  const [flipped, setFlipped] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [swipeAnim, setSwipeAnim] = useState<"left" | "right" | null>(null)
  const [knownCount, setKnownCount] = useState(0)
  const [practiceCount, setPracticeCount] = useState(0)
  const [showXP, setShowXP] = useState(false)
  // IDs of cards swiped "need practice"
  const [practiceIds, setPracticeIds] = useState<number[]>(() => lsGet("fc_practice_ids", []))
  // "review" mode shows only practice cards
  const [mode, setMode] = useState<"main" | "review">("main")
  // index within the review list
  const [reviewIndex, setReviewIndex] = useState(0)
  const dragStart = useRef<{ x: number } | null>(null)

  const categories = [
    "All",
    "Financial Literacy",
    "Entrepreneurship",
    "Sales",
    "Customer Service",
  ]

  const filtered =
    category === "All"
      ? FLASHCARDS
      : FLASHCARDS.filter((c) => c.category === category)

  const practiceCards = FLASHCARDS.filter((c) => practiceIds.includes(c.id))

  const activeCards = mode === "review" ? practiceCards : filtered
  const activeIndex = mode === "review" ? reviewIndex : cardIndex
  const card = activeCards.length > 0 ? activeCards[activeIndex % activeCards.length] : null

  // Persist index when it changes
  useEffect(() => {
    if (mode === "main") lsSet(`fc_index_${category}`, cardIndex)
  }, [cardIndex, category, mode])

  const handleSwipe = (dir: "left" | "right") => {
    if (swipeAnim || !card) return
    setSwipeAnim(dir)
    recordCategorySeen(card.category)

    if (dir === "right") {
      setKnownCount((k) => k + 1)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 900)
      // Remove from practice list if it was there
      if (mode === "review" || practiceIds.includes(card.id)) {
        const next = practiceIds.filter((id) => id !== card.id)
        setPracticeIds(next)
        lsSet("fc_practice_ids", next)
      }
    } else {
      setPracticeCount((p) => p + 1)
      // Add to practice list (avoid duplicates)
      if (!practiceIds.includes(card.id)) {
        const next = [...practiceIds, card.id]
        setPracticeIds(next)
        lsSet("fc_practice_ids", next)
      }
    }

    setTimeout(() => {
      if (mode === "review") {
        setReviewIndex((i) => i + 1)
      } else {
        const next = cardIndex + 1
        setCardIndex(next)
        lsSet(`fc_index_${category}`, next)
      }
      setFlipped(false)
      setSwipeAnim(null)
      setDragX(0)
    }, 280)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { x: e.clientX }
    setIsDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStart.current && isDragging)
      setDragX(e.clientX - dragStart.current.x)
  }
  const onPointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > 60) handleSwipe("right")
    else if (dragX < -60) handleSwipe("left")
    else setDragX(0)
    dragStart.current = null
  }

  const swipeOpacity = Math.min(Math.abs(dragX) / 80, 1)

  // ── Review mode screen ──
  if (mode === "review") {
    if (practiceCards.length === 0) {
      return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", paddingBottom: 80 }}>
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setMode("main")} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "7px 14px", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>← Back</button>
            <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "Outfit, sans-serif" }}>Need Practice</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "Outfit, sans-serif", marginBottom: 10 }}>All clear!</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 700, lineHeight: 1.6 }}>You haven't marked any cards for practice yet. Swipe left on cards you want to revisit.</div>
            <button onClick={() => setMode("main")} className="btn-primary" style={{ marginTop: 28, padding: "13px 28px", borderRadius: 14, border: "none", color: "white", fontSize: 14, fontWeight: 800, fontFamily: "Outfit, sans-serif", cursor: "pointer" }}>Back to Cards</button>
          </div>
        </div>
      )
    }

    const reviewCard = practiceCards[reviewIndex % practiceCards.length]
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <button onClick={() => { setMode("main"); setReviewIndex(0) }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "7px 14px", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>← Back</button>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "Outfit, sans-serif" }}>Need Practice</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>{practiceCards.length} card{practiceCards.length !== 1 ? "s" : ""} to review</div>
            </div>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}>
            <div style={{ height: "100%", width: `${((reviewIndex % practiceCards.length) / practiceCards.length) * 100}%`, background: "linear-gradient(90deg, #f43f5e, #fb7185)", borderRadius: 999, transition: "width 0.4s ease" }} />
          </div>
        </div>
        {/* Card area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px 20px", position: "relative" }}>
          {isDragging && dragX < -40 && (
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10, opacity: swipeOpacity }}>
              <div style={{ background: "rgba(244,63,94,0.9)", borderRadius: 12, padding: "8px 14px", fontSize: 13, fontWeight: 800 }}>↺ Still Tricky</div>
            </div>
          )}
          {isDragging && dragX > 40 && (
            <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10, opacity: swipeOpacity }}>
              <div style={{ background: "rgba(16,185,129,0.9)", borderRadius: 12, padding: "8px 14px", fontSize: 13, fontWeight: 800 }}>Got It ✓</div>
            </div>
          )}
          {showXP && (
            <div className="float-xp" style={{ position: "absolute", top: "28%", left: "50%", transform: "translateX(-50%)", fontSize: 22, fontWeight: 900, color: "#fcd34d", fontFamily: "Outfit, sans-serif", zIndex: 20, textShadow: "0 0 16px rgba(245,158,11,0.8)" }}>
              Mastered! 🌟
            </div>
          )}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onClick={() => !isDragging && Math.abs(dragX) < 5 && setFlipped((f) => !f)}
            className="swipe-card"
            style={{
              width: "100%", maxWidth: 360, minHeight: 270, borderRadius: 24, position: "relative",
              transform: swipeAnim === "right" ? "translateX(120%) rotate(15deg)" : swipeAnim === "left" ? "translateX(-120%) rotate(-15deg)" : `translateX(${dragX}px) rotate(${dragX * 0.06}deg)`,
              transition: swipeAnim ? "transform 0.28s ease" : isDragging ? "none" : "transform 0.15s ease",
            }}
          >
            {!flipped ? (
              <div style={{ width: "100%", minHeight: 270, borderRadius: 24, background: "white", color: "#1a2f5e", padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.35)", position: "relative" }}>
                <div style={{ position: "absolute", top: 16, left: 16, padding: "4px 10px", borderRadius: 8, background: "#f43f5e20", border: "1px solid #f43f5e50", fontSize: 10, fontWeight: 800, color: "#f43f5e", letterSpacing: 0.5 }}>Practice</div>
                <div style={{ fontSize: 36, marginBottom: 16 }}>🤔</div>
                <div style={{ fontSize: 17, fontWeight: 800, fontFamily: "Outfit, sans-serif", textAlign: "center", lineHeight: 1.4, color: "#1a2f5e" }}>{reviewCard.question}</div>
                <div style={{ marginTop: 20, fontSize: 12, color: "rgba(26,47,94,0.45)", fontWeight: 700 }}>Tap to reveal answer</div>
              </div>
            ) : (
              <div className="bounce-in" style={{ width: "100%", minHeight: 270, borderRadius: 24, background: "linear-gradient(135deg, #7c1d3a, #f43f5e)", color: "white", padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(244,63,94,0.5)" }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>💡</div>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "Nunito, sans-serif", textAlign: "center", lineHeight: 1.6 }}>{reviewCard.answer}</div>
                <div style={{ marginTop: 18, fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>Swipe right if you've got it now ✓</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 22, width: "100%", maxWidth: 360 }}>
            <button className="btn-danger" onClick={() => handleSwipe("left")} style={{ flex: 1, padding: "13px", borderRadius: 14, border: "none", color: "white", fontSize: 13, fontWeight: 800, fontFamily: "Outfit, sans-serif", cursor: "pointer" }}>← Still Tricky</button>
            <button className="btn-success" onClick={() => handleSwipe("right")} style={{ flex: 1, padding: "13px", borderRadius: 14, border: "none", color: "white", fontSize: 13, fontWeight: 800, fontFamily: "Outfit, sans-serif", cursor: "pointer" }}>Got It! →</button>
          </div>
          <div className="glass-card" style={{ marginTop: 14, borderRadius: 14, padding: "11px 16px", width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>Swipe right when you feel confident — it removes the card from this list</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main flashcard mode ──
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Flashcards
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
                fontWeight: 700,
              }}
            >
              Card {Math.min(cardIndex + 1, filtered.length)} of{" "}
              {filtered.length}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                background: "rgba(16,185,129,0.2)",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: 99,
                padding: "4px 10px",
                fontSize: 12,
                color: "#34d399",
                fontWeight: 800,
              }}
            >
              ✓ {knownCount}
            </div>
            {/* Practice pile button */}
            <button
              onClick={() => { setMode("review"); setReviewIndex(0); setFlipped(false) }}
              style={{
                background: practiceIds.length > 0 ? "rgba(244,63,94,0.25)" : "rgba(255,255,255,0.08)",
                border: practiceIds.length > 0 ? "1px solid rgba(244,63,94,0.5)" : "1px solid rgba(255,255,255,0.18)",
                borderRadius: 99,
                padding: "4px 10px",
                fontSize: 12,
                color: practiceIds.length > 0 ? "#fb7185" : "rgba(255,255,255,0.4)",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              ↺ {practiceIds.length}
            </button>
          </div>
        </div>
        <div
          style={{
            height: 5,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 999,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(cardIndex / filtered.length) * 100}%`,
              background: "linear-gradient(90deg, #3b82f6, #93c5fd)",
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 12,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat)
                lsSet("fc_category", cat)
                const saved = lsGet(`fc_index_${cat}`, 0)
                setCardIndex(saved)
                setFlipped(false)
              }}
              style={{
                padding: "5px 12px",
                borderRadius: 99,
                border:
                  category === cat
                    ? "1px solid rgba(147,197,253,0.65)"
                    : "1px solid rgba(255,255,255,0.18)",
                background:
                  category === cat
                    ? "rgba(37,99,235,0.3)"
                    : "rgba(255,255,255,0.07)",
                color: category === cat ? "#93c5fd" : "rgba(255,255,255,0.45)",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Card area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 20px",
          position: "relative",
        }}
      >
        {isDragging && dragX < -40 && (
          <div
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              opacity: swipeOpacity,
            }}
          >
            <div
              style={{
                background: "rgba(244,63,94,0.9)",
                borderRadius: 12,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              ↺ Need Practice
            </div>
          </div>
        )}
        {isDragging && dragX > 40 && (
          <div
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              opacity: swipeOpacity,
            }}
          >
            <div
              style={{
                background: "rgba(16,185,129,0.9)",
                borderRadius: 12,
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              I Know This ✓
            </div>
          </div>
        )}
        {showXP && (
          <div
            className="float-xp"
            style={{
              position: "absolute",
              top: "28%",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 22,
              fontWeight: 900,
              color: "#fcd34d",
              fontFamily: "Outfit, sans-serif",
              zIndex: 20,
              textShadow: "0 0 16px rgba(245,158,11,0.8)",
            }}
          >
            +20 XP! 🎉
          </div>
        )}

        {/* Card */}
        {card && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClick={() =>
            !isDragging && Math.abs(dragX) < 5 && setFlipped((f) => !f)
          }
          className="swipe-card"
          style={{
            width: "100%",
            maxWidth: 360,
            minHeight: 270,
            borderRadius: 24,
            position: "relative",
            transform:
              swipeAnim === "right"
                ? "translateX(120%) rotate(15deg)"
                : swipeAnim === "left"
                  ? "translateX(-120%) rotate(-15deg)"
                  : `translateX(${dragX}px) rotate(${dragX * 0.06}deg)`,
            transition: swipeAnim
              ? "transform 0.28s ease"
              : isDragging
                ? "none"
                : "transform 0.15s ease",
          }}
        >
          {!flipped ? (
            <div
              style={{
                width: "100%",
                minHeight: 270,
                borderRadius: 24,
                background: "white",
                color: "#1a2f5e",
                padding: 28,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: `${CATEGORY_COLORS[card.category] || "#3b82f6"}20`,
                  border: `1px solid ${CATEGORY_COLORS[card.category] || "#3b82f6"}50`,
                  fontSize: 10,
                  fontWeight: 800,
                  color: CATEGORY_COLORS[card.category] || "#3b82f6",
                  letterSpacing: 0.5,
                }}
              >
                {card.category}
              </div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>🤔</div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  fontFamily: "Outfit, sans-serif",
                  textAlign: "center",
                  lineHeight: 1.4,
                  color: "#1a2f5e",
                }}
              >
                {card.question}
              </div>
              <div
                style={{
                  marginTop: 20,
                  fontSize: 12,
                  color: "rgba(26,47,94,0.45)",
                  fontWeight: 700,
                }}
              >
                Tap to reveal answer
              </div>
            </div>
          ) : (
            <div
              className="bounce-in"
              style={{
                width: "100%",
                minHeight: 270,
                borderRadius: 24,
                background: "linear-gradient(135deg, #1e3a72, #2563eb)",
                color: "white",
                padding: 28,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 40px rgba(37,99,235,0.5)",
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 14 }}>💡</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "Nunito, sans-serif",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                {card.answer}
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.55)",
                  fontWeight: 700,
                }}
              >
                Swipe right if you know it ✓
              </div>
            </div>
          )}
        </div>
        )}

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 22,
            width: "100%",
            maxWidth: 360,
          }}
        >
          <button
            className="btn-danger"
            onClick={() => handleSwipe("left")}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 14,
              border: "none",
              color: "white",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "Outfit, sans-serif",
              cursor: "pointer",
            }}
          >
            ← Need Practice
          </button>
          <button
            className="btn-success"
            onClick={() => handleSwipe("right")}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: 14,
              border: "none",
              color: "white",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "Outfit, sans-serif",
              cursor: "pointer",
            }}
          >
            I Know This →
          </button>
        </div>

        {practiceIds.length > 0 && (
          <button
            onClick={() => { setMode("review"); setReviewIndex(0); setFlipped(false) }}
            style={{
              marginTop: 12,
              width: "100%",
              maxWidth: 360,
              padding: "11px 16px",
              borderRadius: 14,
              border: "1px solid rgba(244,63,94,0.4)",
              background: "rgba(244,63,94,0.12)",
              color: "#fb7185",
              fontSize: 13,
              fontWeight: 800,
              fontFamily: "Outfit, sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            ↺ Review {practiceIds.length} card{practiceIds.length !== 1 ? "s" : ""} you found tricky
          </button>
        )}

        <div
          className="glass-card"
          style={{
            marginTop: practiceIds.length > 0 ? 10 : 14,
            borderRadius: 14,
            padding: "11px 16px",
            width: "100%",
            maxWidth: 360,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {knownCount >= 3
              ? "🔥 You're on fire! Keep going!"
              : knownCount >= 1
                ? "💪 Great work! You're building knowledge!"
                : "✨ Swipe right for what you know, left to revisit"}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard")
  const [activeModule, setActiveModule] = useState<Module | null>(null)

  const goToModule = (m: Module) => {
    setActiveModule(m)
    setScreen("learn")
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: BG,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      {/* Ambient blobs */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(59,130,246,0.12)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(147,197,253,0.08)",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "30%",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(37,99,235,0.07)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 430,
          height: "100vh",
          maxHeight: 900,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {screen === "dashboard" && (
            <DashboardScreen setScreen={setScreen} goToModule={goToModule} />
          )}
          {screen === "learn" && (
            <LearnScreen
              initialModule={activeModule}
              onModuleChange={setActiveModule}
              onHome={() => {
                setActiveModule(null)
                setScreen("dashboard")
              }}
            />
          )}
          {screen === "flashcards" && <FlashcardsScreen />}
        </div>
        <BottomNav
          screen={screen}
          setScreen={(s) => {
            if (s === "learn") setActiveModule(null)
            setScreen(s)
          }}
        />
      </div>
    </div>
  )
}
