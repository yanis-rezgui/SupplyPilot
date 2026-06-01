import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true
    },
    suppliers_analyzed: [{
        supplier_name: String,
        price: Number,
        delivery_days: Number,
        certifications: [String],
        warranty_years: Number,
        procurement_score: Number
    }],
    recommendation: {
        supplier_name: String,
        reason: String,
        score: Number
    },
    score_breakdown: {

        price_weight: { type: Number, default: 40 },
        delivery_weight: { type: Number, default: 25 },
        certification_weight: { type: Number, default: 20 },
        reliability_weight: { type: Number, default: 15 }
    }
}, { timestamps: true });

const Report = mongoose.model("Report", reportSchema);
export default Report;