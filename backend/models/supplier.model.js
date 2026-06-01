import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    certifications: {
        type: [String], 
        default: []
    },
    components: {
        type: [String],  
        default: []
    },
    avg_delivery_days: {
        type: Number,
        default: 0
    },
    warranty_years: {
        type: Number,
        default: 1
    },
    price_range: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 }
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;