
// types/procurement-agent.types.ts

export type RiskLevel = "low" | "medium" | "high";

export type ComplianceVerdict =
    | "✅ Fully compliant"
    | "⚠️ Partial"
    | "❌ Non-compliant";

// ─────────────────────────────────────────────
// Request Summary
// ─────────────────────────────────────────────
export interface RequestSummary {
    component_type: string;
    power: string | null;
    protection: string | null;
    standards: string[];
    region: string;
    industry: string;
}

// ─────────────────────────────────────────────
// Suppliers Overview
// ─────────────────────────────────────────────
export interface SuppliersOverview {
    total_found: number;
    compliant_count: number;
    non_compliant_count: number;
}

// ─────────────────────────────────────────────
// Compliance
// ─────────────────────────────────────────────
export interface SupplierCompliance {
    supplier_name: string;
    is_compliant: boolean;
    certifications_held: string[];
    missing_certifications: string[];
    compliance_verdict: ComplianceVerdict;
}

// ─────────────────────────────────────────────
// Risk
// ─────────────────────────────────────────────
export interface SupplierRisk {
    supplier_name: string;
    risk_level: RiskLevel;
    risk_factors: string[];
    country: string;
}

// ─────────────────────────────────────────────
// Recommendation
// ─────────────────────────────────────────────
export interface Recommendation {
    top_supplier: string;
    score: number;
    justification: string;
    trade_offs: string;
}

// ─────────────────────────────────────────────
// Rejection Reasons
// ─────────────────────────────────────────────
export interface RejectionReason {
    supplier_name: string;
    reason: string;
}

// ─────────────────────────────────────────────
// Market Insights
// ─────────────────────────────────────────────
export type MarketInsight = string;

// ─────────────────────────────────────────────
// Price Analysis
// ─────────────────────────────────────────────
export interface PriceAnalysis {
    min: number;
    max: number;
    average: number;
    currency: string;
    spread_percent: number;
}

// ─────────────────────────────────────────────
// FULL AGENT RESPONSE
// ─────────────────────────────────────────────
export interface ProcurementAgentResponse {
    request_summary: RequestSummary;

    suppliers_overview: SuppliersOverview;

    compliance: SupplierCompliance[];

    risk_summary: SupplierRisk[];

    recommendation: Recommendation;

    rejection_reasons: RejectionReason[];

    market_insights: MarketInsight[];

    price_analysis: PriceAnalysis;
}

// ─────────────────────────────────────────────
// WRAPPER (ton backend renvoie ça)
// ─────────────────────────────────────────────
export interface ProcurementAgentAPIResponse {
    success: boolean;
    query: string;
    analysis: ProcurementAgentResponse;
    metadata: {
        iterations_used: number;
        tools_called: number;
        timestamp: string;
    };
}