"use client";
import React, { useState } from "react";

type QA = { q: string; a: string };

const faqs: QA[] = [
  {
    q: "Who can use UPSHIFT?",
    a: "UPSHIFT supports Super Admins, School Admins, Teachers, and Students with role-based access."
  },
  {
    q: "Do students see other students’ data?",
    a: "No. Access is scoped to each user’s role; students only see their own information."
  },
  {
    q: "Can I export reports?",
    a: "Yes. Export to CSV/Excel and schedule recurring email reports with audit logs."
  },
  {
    q: "Is training included?",
    a: "Yes. We provide a one-month pilot and role-based training for smooth adoption."
  }
];

const FAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen((v) => (v === i ? null : i));

  return (
    <section 
    id="faq"
    className="w-full bg-[var(--neutral-100)] py-16">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: two-line heading (48px, weight 400) */}
        <div className="lg:col-span-5">
          <h2 className="leading-tight">
            <span className="block text-[48px] font-normal text-[var(--neutral-1000)]">
              Frequently asked
            </span>
            <span className="block text-[48px] font-normal text-[var(--blue-400)]">
              questions
            </span>
          </h2>
        </div>

        {/* Right: accordion list */}
        <div className="lg:col-span-7 w-full space-y-4">
          {faqs.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div
                key={q}
                className="rounded-[22px] bg-[var(--neutral-200)] border border-[var(--neutral-300)]"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                  aria-expanded={isOpen}
                  onClick={() => toggle(i)}
                >
                  {/* Question: 18px, weight 400 */}
                  <span className="text-[18px] font-normal text-[var(--neutral-1000)]">
                    {q}
                  </span>

                  {/* Chevron in light circle */}
                  <span className="flex-none inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--neutral-100)] border border-[var(--neutral-300)]">
                    <svg
                      className={`w-5 h-5 text-[var(--neutral-900)] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>

                {/* Answer (animated height) — 18px, weight 400 */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out px-6 ${
                    isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-[18px] leading-[28px] font-normal text-[var(--neutral-800)]">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
