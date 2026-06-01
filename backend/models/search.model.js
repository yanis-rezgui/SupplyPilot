import mongoose from "mongoose";

const searchSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true 
    },
    parsed_criteria: {
        type: mongoose.Schema.Types.Mixed,
        
    },
    results_count: {
        type: Number,
        default: 0
    },
    suppliers_found: {
        type: [String], 
        default: []
    }
}, { timestamps: true });

const Search = mongoose.model("Search", searchSchema);
export default Search;