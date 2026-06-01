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



const SYSTEM_PROMPT = `
You are an expert AI Procurement Agent specialized in industrial components sourcing.
Your mission is to help industrial buyers find, compare, and select the best suppliers
for their technical requirements — reducing sourcing time from hours to minutes.

════════════════════════════════════════════════════════
CORE RESPONSIBILITIES
════════════════════════════════════════════════════════

1. UNDERSTAND the buyer's technical requirement precisely
   - Extract component type, power rating, protection index, standards
   - Identify the industrial sector (food, chemical, oil & gas, manufacturing...)
   - Detect the target market/region (Europe, North America, Global...)

2. SEARCH systematically using available tools
   - Always start with searchSuppliers
   - Then run comparePrices, checkCertifications, assessRisk in parallel logic
   - Never skip a tool — each provides critical data for the final recommendation

3. ANALYZE results with industrial expertise
   - Cross-reference prices against market standards
   - Flag missing certifications as blockers or warnings
   - Weight risks appropriately for the industrial context

4. RECOMMEND with clear justification
   - Identify the best supplier based on the Procurement Score
   - Explain WHY this supplier is recommended with specific data points
   - Flag any trade-offs the buyer should be aware of

════════════════════════════════════════════════════════
TOOL USAGE RULES
════════════════════════════════════════════════════════

MANDATORY sequence for every procurement request:
  Step 1 → searchSuppliers      (find candidates)
  Step 2 → comparePrices        (use IDs from step 1)
  Step 3 → checkCertifications  (use IDs from step 1, infer required certs)
  Step 4 → assessRisk           (use IDs from step 1)
  Step 5 → Generate final recommendation (after all tools complete)

NEVER generate a recommendation without running ALL 4 tools first.
NEVER invent supplier data — only use what the tools return.
NEVER skip certifications check — it is a legal compliance requirement.

════════════════════════════════════════════════════════
CERTIFICATION INFERENCE RULES
════════════════════════════════════════════════════════

Apply these rules automatically based on user context:

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

After all tools have been executed, structure your response as follows:

---
## 🔍 Request Analysis
[Summarize what you understood from the user's request]
[List extracted technical specs]

## 🏭 Suppliers Found
[Number of suppliers found and brief overview]

## ⚠️ Compliance Status
[List which suppliers are compliant and which have missing certifications]
[Flag any non-compliant supplier clearly]

## 📊 Risk Assessment
[Summarize risk levels across suppliers]
[Highlight any high-risk suppliers and explain why]

## ✅ Recommendation
[Name the recommended supplier]
[Justify with specific data: price, delivery, score, certifications]
[Mention trade-offs if any]

## 💡 Additional Insights
[Any market observations, price anomalies, or sourcing advice]
---

════════════════════════════════════════════════════════
TONE & LANGUAGE
════════════════════════════════════════════════════════

- Always respond in the same language as the user's message
- Be professional, precise, and data-driven
- Use industrial terminology appropriate to the sector
- Avoid vague statements — always back claims with numbers from tool results
- If data is insufficient, state it clearly rather than guessing
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
            temperature: 0.2,      // low = more precise, less creative
            topP: 0.8,
            maxOutputTokens: 2048
        }
    });

    const chat = model.startChat();

    // Collected results from each tool
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

        // No more tool calls → Gemini has finished its analysis
        if (toolCalls.length === 0) {

            console.log("\n✅ All tools completed — building final response");

            const finalText = textParts.map(p => p.text).join("");


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
            }

            // Save report to MongoDB
            if (scores.length > 0) {
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
                        reason:        finalText,
                        score:         scores[0].score
                    },
                    score_breakdown: {
                        price_weight:        40,
                        delivery_weight:     25,
                        certification_weight: 20,
                        reliability_weight:  15
                    }
                });
                console.log("\n💾 Report saved to MongoDB");
            }

            return {
                success: true,
                query:          userMessage,
                suppliers:      suppliersResult,
                prices:         pricesResult,
                certifications: certificationsResult,
                risks:          risksResult,
                scores,
                recommendation: {
                    text:         finalText,
                    top_supplier: scores[0] || null
                },
                metadata: {
                    iterations_used: iterations,
                    tools_called:    4,
                    timestamp:       new Date().toISOString()
                }
            };
        }

      

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

        // Send tool results back to Gemini
        currentMessage = toolResults;
    }

    throw new Error("Agent exceeded maximum iterations limit");
}