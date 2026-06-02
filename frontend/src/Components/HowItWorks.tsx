import { memo, useEffect, useRef, useState } from "react";

const steps = [
  { icon: "🔍", tag: "MongoDB",    title: "Supplier search",        desc: "Query the database to find suppliers matching your technical requirements." },
  { icon: "💰", tag: "Analysis",   title: "Price comparison",       desc: "Analyze quotes, calculate averages, and detect market anomalies." },
  { icon: "📜", tag: "Compliance", title: "Certification check",    desc: "Verify compliance with CE, IEC, ISO, UL and industry standards." },
  { icon: "⚠️", tag: "Risk",       title: "Risk analysis",          desc: "Evaluate geopolitical, delivery, and supplier reliability risks." },
  { icon: "🏆", tag: "Output",     title: "Final recommendation",   desc: "Generate a ranked supplier list with a procurement score." },
];

const HowItWorks = () => {
  const [visible, setVisible] = useState<boolean[]>(Array(steps.length).fill(false));
  const [trackH, setTrackH] = useState(0);
  const pipelineRef = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || animated.current) return;
        animated.current = true;
        steps.forEach((_, i) => {
          setTimeout(() => {
            setVisible(prev => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
            setTrackH(((i + 1) / steps.length) * 100);
          }, i * 160);
        });
      },
      { threshold: 0.15 }
    );
    if (pipelineRef.current) observer.observe(pipelineRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full flex flex-col items-center py-24 px-6">

      {/* Eyebrow */}
      <p className="font-mono text-[11px] tracking-[.12em] uppercase text-gray-500 mb-3">
        Pipeline
      </p>

      {/* Title */}
      <h2 className="text-3xl md:text-4xl font-semibold text-gray-100 text-center leading-tight max-w-lg">
        How it works
      </h2>
      <p className="text-gray-400 text-sm text-center mt-3 max-w-md leading-relaxed">
        A fully automated AI pipeline that transforms raw supplier data into
        actionable procurement decisions.
      </p>

      {/* Pipeline */}
      <div ref={pipelineRef} className="relative mt-14 max-w-xl w-full">

        {/* Track background */}
        <div className="absolute left-7 top-0 bottom-0 w-px bg-white/10" />
        {/* Track fill */}
        <div
          className="absolute left-7 top-0 w-px bg-gradient-to-b from-blue-500 to-violet-500 transition-all duration-700"
          style={{ height: `${trackH}%` }}
        />

        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`
                relative flex items-start gap-5 pb-9 last:pb-0
                transition-all duration-500 ease-out
                ${visible[i] ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
              `}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Dot */}
              <div className="flex-shrink-0 w-14 flex flex-col items-center gap-1.5 relative z-10">
                <div className="w-[18px] h-[18px] rounded-full border border-white/20 bg-gray-950 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/25" />
                </div>
                <span className="font-mono text-[10px] text-gray-600 tracking-wide">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              {/* Card */}
              <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-base leading-none">{step.icon}</span>
                  <span className="font-mono text-[10px] tracking-[.04em] text-gray-500 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded">
                    {step.tag}
                  </span>
                </div>
                <p className="text-gray-100 font-medium text-sm mb-1">{step.title}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(HowItWorks);