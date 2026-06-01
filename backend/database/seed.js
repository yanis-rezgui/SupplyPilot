import mongoose from "mongoose";
import { DB_URI } from "../config/env.js";
import Supplier from "../models/supplier.model.js";
import Quote from "../models/quote.model.js";

const suppliers = [
    {
        name: "ABB Motors",
        country: "Germany",
        rating: 4.8,
        certifications: ["CE", "IEC", "ISO9001"],
        components: ["electric_motor", "drive", "transformer"],
        avg_delivery_days: 7,
        warranty_years: 2,
        price_range: { min: 1100, max: 1400 }
    },
    {
        name: "Siemens Industry",
        country: "Germany",
        rating: 4.9,
        certifications: ["CE", "IEC", "ISO9001", "UL"],
        components: ["electric_motor", "plc", "sensor"],
        avg_delivery_days: 10,
        warranty_years: 3,
        price_range: { min: 1300, max: 1700 }
    },
    {
        name: "WEG Europe",
        country: "Brazil",
        rating: 4.5,
        certifications: ["CE", "IEC"],
        components: ["electric_motor"],
        avg_delivery_days: 15,
        warranty_years: 2,
        price_range: { min: 950, max: 1200 }
    },
    {
        name: "Leroy-Somer",
        country: "France",
        rating: 4.6,
        certifications: ["CE", "IEC", "ISO9001"],
        components: ["electric_motor", "generator"],
        avg_delivery_days: 5,
        warranty_years: 2,
        price_range: { min: 1050, max: 1350 }
    },
    {
        name: "ElectroParts DZ",
        country: "Algeria",
        rating: 3.9,
        certifications: ["CE"],
        components: ["electric_motor"],
        avg_delivery_days: 3,
        warranty_years: 1,
        price_range: { min: 800, max: 1050 }
    }
];

export const seedDatabase = async () => {
    await mongoose.connect(DB_URI);
    
    await Supplier.deleteMany({});
    const insertedSuppliers = await Supplier.insertMany(suppliers);
    console.log(`✅ ${insertedSuppliers.length} fournisseurs insérés`);

    // Génère des devis pour chaque fournisseur
    const quotes = insertedSuppliers.map(s => ({
        supplier: s._id,
        supplier_name: s.name,
        component_type: "electric_motor",
        specifications: {
            power: "15kW",
            protection: "IP55",
            standard: "IEC",
            voltage: "400V"
        },
        price: Math.floor(
            Math.random() * (s.price_range.max - s.price_range.min) 
            + s.price_range.min
        ),
        delivery_days: s.avg_delivery_days,
        currency: "EUR"
    }));

    await Quote.deleteMany({});
    await Quote.insertMany(quotes);
    console.log(`✅ ${quotes.length} devis insérés`);

    mongoose.disconnect();
    console.log("🎉 Base de données peuplée avec succès !");
};

seedDatabase().catch(console.error);