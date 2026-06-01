import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema({
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
        required: true
    },
    supplier_name: {
        type: String,  
        required: true
    },
    component_type: {
        type: String,
        required: true  
    },
    specifications: {
        power: String,      
        protection: String,  
        standard: String,    
        voltage: String      
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "EUR"
    },
    delivery_days: {
        type: Number,
        required: true
    },
    valid_until: {
        type: Date
    }
}, { timestamps: true });

const Quote = mongoose.model("Quote", quoteSchema);
export default Quote;