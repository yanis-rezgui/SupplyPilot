

export function calculateProcurementScores(suppliers, prices, certifications, risks) {

  
    const normalizeInverse = (value, min, max) => {
        if (max === min) return 100;
        return Math.round(((max - value) / (max - min)) * 100);
    };

    const normalize = (value, min, max) => {
        if (max === min) return 100;
        return Math.round(((value - min) / (max - min)) * 100);
    };

    const allPrices = prices.breakdown.map(p => p.price);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    const allDeliveries = suppliers.map(s => s.avg_delivery_days);
    const minDelivery = Math.min(...allDeliveries);
    const maxDelivery = Math.max(...allDeliveries);

    const allRatings = suppliers.map(s => s.rating);
    const minRating = Math.min(...allRatings);
    const maxRating = Math.max(...allRatings);

   
    const scores = suppliers.map(supplier => {

     
        const priceData = prices.breakdown.find(
            p => p.supplier_name === supplier.name
        );
        const priceScore = priceData
            ? normalizeInverse(priceData.price, minPrice, maxPrice)
            : 0;

     
        const deliveryScore = normalizeInverse(
            supplier.avg_delivery_days, minDelivery, maxDelivery
        );

       
        const certData = certifications.find(
            c => c.supplier_name === supplier.name
        );
        const certScore = certData
            ? certData.is_compliant
                ? 100
                : Math.round((certData.certifications.length /
                    (certData.certifications.length + certData.missing.length)) * 100)
            : 0;

        
        const reliabilityScore = normalize(supplier.rating, minRating, maxRating);

       
        const finalScore = Math.round(
            priceScore       * 0.40 +
            deliveryScore    * 0.25 +
            certScore        * 0.20 +
            reliabilityScore * 0.15
        );

        return {
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            score: finalScore,
            breakdown: {
                price_score:       { score: priceScore,       weight: "40%" },
                delivery_score:    { score: deliveryScore,    weight: "25%" },
                cert_score:        { score: certScore,        weight: "20%" },
                reliability_score: { score: reliabilityScore, weight: "15%" }
            },
            price: priceData?.price || null,
            delivery_days: supplier.avg_delivery_days,
            certifications: supplier.certifications,
            risk_level: risks.find(r => r.supplier_name === supplier.name)?.risk_level || "unknown"
        };
    });

   
    return scores.sort((a, b) => b.score - a.score);
}