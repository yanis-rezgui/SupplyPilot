import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/env.js";
import {
    searchSuppliers,
    comparePrices,
    checkCertifications,
    assessRisk
} from "./tools.js";
import { calculateProcurementScores } from "./scoring.js";
import Report from "../models/report.model.js";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ─── Tool Definitions ──────────────────────────────────────────────────────────

const toolDefinitions = [
    {
        name: "searchSuppliers",
        description: `
            Search the MongoDB database for industrial component suppliers 
            that match the user's technical requirements.
            
            Use this tool FIRST before any other tool.
            
            Extract from the user message:
            - component_type : the type of component (electric_motor, pump, valve, 
              sensor, bearing, transformer, compressor, gearbox)
            - power          : power rating if mentioned (15kW, 7.5kW, 100HP)
            - protection     : IP rating if mentioned (IP55, IP65, IP67)
            - standard       : compliance standard if mentioned (IEC, NEMA, CE, UL)
            
            Returns a list of matching suppliers with their full profile.
        `,
        parameters: {
            type: "object",
            properties: {
                component_type: {
                    type: "string",
                    description: `
                        Normalized component type in snake_case.
                        Examples: electric_motor, hydraulic_pump, 
                        pressure_valve, temperature_sensor, roller_bearing,
                        power_transformer, air_compressor, helical_gearbox
                    `
                },
                power: {
                    type: "string",
                    description: "Power rating extracted from user message. Examples: 15kW, 7.5kW, 100HP, 200W"
                },
                protection: {
                    type: "string",
                    description: "IP protection index. Examples: IP55, IP65, IP67, IP68"
                },
                standard: {
                    type: "string",
                    description: "Compliance standard required. Examples: IEC, NEMA, CE, UL, ISO"
                }
            },
            required: ["component_type"]
        }
    },
    {
        name: "comparePrices",
        description: `
            Retrieve and compare price quotes from MongoDB for a specific 
            list of suppliers.

            Use this tool AFTER searchSuppliers returns supplier IDs.

            Analyzes:
            - Individual price per supplier
            - Minimum, maximum and average market price
            - Price per delivery day ratio (value for money)

            Returns structured pricing data for all requested suppliers.
        `,
        parameters: {
            type: "object",
            properties: {
                supplier_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of MongoDB supplier _id strings returned by searchSuppliers"
                }
            },
            required: ["supplier_ids"]
        }
    },
    {
        name: "checkCertifications",
        description: `
            Verify whether suppliers hold the certifications and compliance 
            standards required for the user's industrial context.

            Use this tool AFTER searchSuppliers.

            Infer required certifications from context:
            - European market          → always require CE
            - Electrical components    → require IEC
            - Food industry            → require ISO9001, consider ATEX
            - North American market    → require UL
            - Quality management       → require ISO9001
            - Hazardous environments   → require ATEX

            Returns compliance status and missing certifications per supplier.
        `,
        parameters: {
            type: "object",
            properties: {
                supplier_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of MongoDB supplier _id strings"
                },
                required_certs: {
                    type: "array",
                    items: { type: "string" },
                    description: `
                        List of required certifications inferred from user context.
                        Possible values: CE, IEC, ISO9001, UL, ATEX, RoHS, 
                        REACH, FDA, IP55, IP65
                    `
                }
            },
            required: ["supplier_ids", "required_certs"]
        }
    },
    {
        name: "assessRisk",
        description: `
            Evaluate the supply chain risk level for each supplier based on 
            their country of origin, reliability rating, delivery performance,
            and historical data stored in MongoDB.

            Use this tool AFTER searchSuppliers.

            Risk factors analyzed:
            - Geopolitical risk by country
            - Supplier reliability score (rating)
            - Delivery time risk (delays impact production)
            - Single source dependency risk
            - Financial stability indicators

            Returns risk level (low / medium / high) with detailed factors.
        `,
        parameters: {
            type: "object",
            properties: {
                supplier_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of MongoDB supplier _id strings"
                }
            },
            required: ["supplier_ids"]
        }
    }
];

// ─── Tool Executor ─────────────────────────────────────────────────────────────

async function executeTool(toolName, toolArgs) {
    console.log(`\n🔧 Executing tool  : ${toolName}`);
    console.log(`   Arguments       : ${JSON.stringify(toolArgs, null, 2)}`);

    const startTime = Date.now();

    let result;
    switch (toolName) {
        case "searchSuppliers":
            result = await searchSuppliers(toolArgs);
            break;
        case "comparePrices":
            result = await comparePrices(toolArgs);
            break;
        case "checkCertifications":
            result = await checkCertifications(toolArgs);
            break;
        case "assessRisk":
            result = await assessRisk(toolArgs);
            break;
        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }

    console.log(`   ✅ Completed in  : ${Date.now() - startTime}ms`);
    console.log(`   Results count   : ${Array.isArray(result) ? result.length : "N/A"}`);

    return result;
}

// ─── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `
You are SupplyPilot, an expert AI Procurement Agent specialized in industrial components sourcing.

════════════════════════════════════════════════════════
TOOL USAGE RULES
════════════════════════════════════════════════════════

MANDATORY sequence for every procurement request:
  Step 1 → searchSuppliers      (find candidates)
  Step 2 → comparePrices        (use IDs from step 1)
  Step 3 → checkCertifications  (use IDs from step 1, infer required certs)
  Step 4 → assessRisk           (use IDs from step 1)
  Step 5 → Generate final JSON response (ONLY after all 4 tools complete)

NEVER generate a response without running ALL 4 tools first.
NEVER invent supplier data — only use what the tools return.
NEVER skip certifications check — it is a legal compliance requirement.

════════════════════════════════════════════════════════
CERTIFICATION INFERENCE RULES
════════════════════════════════════════════════════════

  European deployment     → require [CE, IEC]
  Food & beverage sector  → require [CE, IEC, ISO9001]
  Hazardous areas (ATEX)  → require [CE, IEC, ATEX]
  North American market   → require [UL, NEMA]
  Global deployment       → require [CE, IEC, ISO9001, UL]
  Chemical industry       → require [CE, IEC, ATEX, ISO9001]
  Standard manufacturing  → require [CE, IEC]

════════════════════════════════════════════════════════
FINAL RESPONSE FORMAT
════════════════════════════════════════════════════════

After ALL 4 tools have been executed, respond with a single valid JSON object.
No markdown, no backticks, no preamble — pure JSON only.

{
  "request_summary": {
    "component_type": "string",
    "power": "string or null",
    "protection": "string or null",
    "standards": ["string"],
    "region": "string",
    "industry": "string"
  },
  "suppliers_overview": {
    "total_found": number,
    "compliant_count": number,
    "non_compliant_count": number
  },
  "compliance": [
    {
      "supplier_name": "string",
      "is_compliant": boolean,
      "certifications_held": ["string"],
      "missing_certifications": ["string"],
      "compliance_verdict": "✅ Fully compliant | ⚠️ Partial | ❌ Non-compliant"
    }
  ],
  "risk_summary": [
    {
      "supplier_name": "string",
      "risk_level": "low | medium | high",
      "risk_factors": ["string"],
      "country": "string"
    }
  ],
  "recommendation": {
    "top_supplier": "string",
    "score": number,
    "justification": "2-3 sentences explaining WHY this supplier wins with specific data points (price, delivery, certs)",
    "trade_offs": "any downsides or caveats the buyer should know"
  },
  "rejection_reasons": [
    {
      "supplier_name": "string",
      "reason": "specific reason why this supplier was not recommended"
    }
  ],
  "market_insights": [
    "observation 1 derived from the data — e.g. European suppliers are 18% more expensive but deliver 2x faster",
    "observation 2 — e.g. Only 2 out of 5 suppliers hold ATEX in this dataset"
  ],
  "price_analysis": {
    "min": number,
    "max": number,
    "average": number,
    "currency": "EUR",
    "spread_percent": number
  }
}

RULES:
- Always respond in the same language as the user's message
- market_insights must contain at least 2 meaningful observations from the actual data
- rejection_reasons must cover every supplier that is NOT the top recommendation
- spread_percent = Math.round(((max - min) / average) * 100)
- The JSON must be valid and parseable — no trailing commas, no comments inside
`;

// ─── Main Agent Function ───────────────────────────────────────────────────────

export async function runProcurementAgent(userMessage) {

    console.log("\n════════════════════════════════════════");
    console.log("🚀 Procurement Agent Started");
    console.log(`   Query : ${userMessage}`);
    console.log(`   Time  : ${new Date().toISOString()}`);
    console.log("════════════════════════════════════════");

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        tools: [{ functionDeclarations: toolDefinitions }],
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 4096   // increased for richer structured JSON
        }
    });

    const chat = model.startChat();

    let suppliersResult      = null;
    let pricesResult         = null;
    let certificationsResult = null;
    let risksResult          = null;

    let currentMessage = userMessage;
    let iterations     = 0;
    const MAX_ITERATIONS = 10;

    // ─── Function Calling Loop ─────────────────────────────────────────────────

    while (iterations < MAX_ITERATIONS) {
        iterations++;
        console.log(`\n🔄 Iteration ${iterations}/${MAX_ITERATIONS}`);

        const response  = await chat.sendMessage(currentMessage);
        const candidate = response.response.candidates[0];
        const parts     = candidate.content.parts;

        const toolCalls = parts.filter(p => p.functionCall);
        const textParts = parts.filter(p => p.text);

        // ── No more tool calls → Gemini finished ──────────────────────────────
        if (toolCalls.length === 0) {

            console.log("\n✅ All tools completed — parsing structured response");

            const rawText = textParts.map(p => p.text).join("");

            // Parse structured JSON from Gemini
            let structuredAnalysis = null;
            try {
                const clean = rawText.replace(/```json|```/g, "").trim();
                structuredAnalysis = JSON.parse(clean);
                console.log("\n📋 Structured analysis parsed successfully");
            } catch (e) {
                console.warn("⚠️  Could not parse structured JSON — storing raw text");
                structuredAnalysis = { raw: rawText };
            }

            // Procurement scores (computed locally, not by Gemini)
            let scores = [];
            if (suppliersResult && pricesResult && certificationsResult && risksResult) {
                scores = calculateProcurementScores(
                    suppliersResult,
                    pricesResult,
                    certificationsResult,
                    risksResult
                );
                console.log(`\n📊 Procurement Scores:`);
                scores.forEach(s => {
                    console.log(`   ${s.supplier_name.padEnd(20)} → ${s.score}/100`);
                });

                // Inject computed scores into structuredAnalysis for frontend use
                if (structuredAnalysis && !structuredAnalysis.raw) {
                    structuredAnalysis.scores = scores;

                    // Sync recommendation score with computed value
                    if (structuredAnalysis.recommendation && scores[0]) {
                        structuredAnalysis.recommendation.score      = scores[0].score;
                        structuredAnalysis.recommendation.top_supplier = scores[0].supplier_name;
                    }
                }
            }

            // Save report to MongoDB
            if (scores.length > 0) {
                try {
                    await Report.create({
                        query: userMessage,
                        suppliers_analyzed: scores.map(s => ({
                            supplier_name:     s.supplier_name,
                            price:             s.price,
                            delivery_days:     s.delivery_days,
                            certifications:    s.certifications,
                            warranty_years:    suppliersResult.find(
                                sup => sup.name === s.supplier_name
                            )?.warranty_years || 0,
                            procurement_score: s.score
                        })),
                        recommendation: {
                            supplier_name: scores[0].supplier_name,
                            reason:        structuredAnalysis?.recommendation?.justification || rawText,
                            score:         scores[0].score
                        },
                        score_breakdown: {
                            price_weight:         40,
                            delivery_weight:      25,
                            certification_weight: 20,
                            reliability_weight:   15
                        }
                    });
                    console.log("\n💾 Report saved to MongoDB");
                } catch (dbErr) {
                    console.error("⚠️  Failed to save report:", dbErr.message);
                }
            }

            return {
                success: true,
                query:    userMessage,
                analysis: structuredAnalysis,   // full structured JSON for frontend
                metadata: {
                    iterations_used: iterations,
                    tools_called:    4,
                    timestamp:       new Date().toISOString()
                }
            };
        }

        // ── Execute tool calls and send results back to Gemini ─────────────────

        const toolResults = [];

        for (const part of toolCalls) {
            const { name, args } = part.functionCall;
            const result = await executeTool(name, args);

            if (name === "searchSuppliers")     suppliersResult      = result;
            if (name === "comparePrices")        pricesResult         = result;
            if (name === "checkCertifications")  certificationsResult = result;
            if (name === "assessRisk")           risksResult          = result;

            toolResults.push({
                functionResponse: {
                    name,
                    response: { result }
                }
            });
        }

        currentMessage = toolResults;
    }

    throw new Error("Agent exceeded maximum iterations limit");
}
