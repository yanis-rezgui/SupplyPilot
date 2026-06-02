import { memo } from "react";
import { motion } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Hero = () => {
    return (
        <section
            id="hero"
            className="w-full flex flex-col justify-center items-center text-center px-4 py-20"
        >
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-3xl"
            >
                {/* Badge */}
                <motion.span
                    variants={item}
                    className="text-blue-400 text-sm font-semibold tracking-wide"
                >
                    AI-Powered Procurement Intelligence
                </motion.span>

                {/* Title */}
                <motion.h1
                    variants={item}
                    className="mt-4 text-gray-100 text-4xl md:text-5xl font-bold leading-tight"
                >
                    Find the Best Industrial Suppliers in Minutes, Not Days
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    variants={item}
                    className="mt-5 text-gray-300 text-lg md:text-xl leading-relaxed"
                >
                    SupplyPilot analyzes suppliers, compares prices, verifies certifications,
                    evaluates risks, and recommends the best sourcing option based on your
                    business priorities.
                </motion.p>

                {/* Features */}
                <motion.ul
                    variants={item}
                    className="mt-8 flex flex-col gap-2 text-gray-200 font-medium"
                >
                    <li>⚡ 5x Faster Supplier Evaluation</li>
                    <li>🧠 100% Explainable Recommendations</li>
                    <li>🛡️ Automated Compliance Checks</li>
                </motion.ul>

                {/* CTA */}
                <motion.div
                    variants={item}
                    className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-blue-600 text-white rounded-md px-5 py-3 font-semibold shadow-lg cursor-pointer"
                    >
                        Start Supplier Analysis
                    </motion.a>

                    <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-white text-gray-900 rounded-md px-5 py-3 font-semibold cursor-pointer"
                    >
                        View Demo
                    </motion.a>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default memo(Hero);