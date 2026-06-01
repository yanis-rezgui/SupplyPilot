import Supplier from "../models/supplier.model.js";
import Quote from "../models/quote.model.js";
import Search from "../models/search.model.js";

// ─── TOOL 1 : Recherche de fournisseurs ───────────────────────────────────────
export async function searchSuppliers({ component_type, power, protection, standard }) {
    
    const query = { is_active: true };

    if (component_type) {
        query.components = { $in: [component_type] };
    }

    const suppliers = await Supplier.find(query).lean();

    // Sauvegarde la recherche dans l'historique
    await Search.create({
        query: `${component_type} ${power || ""} ${protection || ""}`.trim(),
        parsed_criteria: { component_type, power, protection, standard },
        results_count: suppliers.length,
        suppliers_found: suppliers.map(s => s.name)
    });

    return suppliers.map(s => ({
        id: s._id,
        name: s.name,
        country: s.country,
        rating: s.rating,
        certifications: s.certifications,
        avg_delivery_days: s.avg_delivery_days,
        warranty_years: s.warranty_years,
        price_range: s.price_range
    }));
}

// ─── TOOL 2 : Comparaison des prix ────────────────────────────────────────────
export async function comparePrices({ supplier_ids }) {

    const quotes = await Quote.find({
        supplier: { $in: supplier_ids }
    }).lean();

    if (quotes.length === 0) return { error: "Aucun devis trouvé" };

    const prices = quotes.map(q => q.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    const breakdown = quotes.map(q => ({
        supplier_id: q.supplier,
        supplier_name: q.supplier_name,
        price: q.price,
        currency: q.currency,
        delivery_days: q.delivery_days
    }));

    return { min, max, average, breakdown };
}

// ─── TOOL 3 : Vérification des certifications ─────────────────────────────────
export async function checkCertifications({ supplier_ids, required_certs }) {

    const suppliers = await Supplier.find({
        _id: { $in: supplier_ids }
    }).lean();

    const results = suppliers.map(s => {
        const missing = required_certs.filter(
            cert => !s.certifications.includes(cert)
        );
        return {
            supplier_id: s._id,
            supplier_name: s.name,
            certifications: s.certifications,
            required: required_certs,
            missing: missing,
            is_compliant: missing.length === 0
        };
    });

    return results;
}

// ─── TOOL 4 : Évaluation des risques ──────────────────────────────────────────
export async function assessRisk({ supplier_ids }) {

    const suppliers = await Supplier.find({
        _id: { $in: supplier_ids }
    }).lean();

    // Pays considérés à risque élevé pour la livraison en Europe
    const HIGH_RISK_COUNTRIES = ["China", "Russia", "Belarus"];
    const MEDIUM_RISK_COUNTRIES = ["Brazil", "India", "Turkey"];

    const results = suppliers.map(s => {
        let risk_level = "low";
        const risk_factors = [];

        // Risque pays
        if (HIGH_RISK_COUNTRIES.includes(s.country)) {
            risk_level = "high";
            risk_factors.push(`Pays à risque logistique : ${s.country}`);
        } else if (MEDIUM_RISK_COUNTRIES.includes(s.country)) {
            risk_level = "medium";
            risk_factors.push(`Pays à risque modéré : ${s.country}`);
        }

        // Risque rating
        if (s.rating < 4.0) {
            risk_level = risk_level === "low" ? "medium" : risk_level;
            risk_factors.push(`Note fournisseur faible : ${s.rating}/5`);
        }

        // Risque délai
        if (s.avg_delivery_days > 20) {
            risk_factors.push(`Délai de livraison long : ${s.avg_delivery_days} jours`);
        }

        return {
            supplier_id: s._id,
            supplier_name: s.name,
            risk_level,
            risk_factors,
            rating: s.rating,
            country: s.country
        };
    });

    return results;
}