import React from 'react';
import { Search, Handshake, PackageCheck, Lightbulb } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Browse or List',
    description: 'Find what you need or share what you have',
    icon: Search,
  },
  {
    number: 2,
    title: 'Agree & Plan',
    description: 'Set terms and schedule a safe handover',
    icon: Handshake,
  },
  {
    number: 3,
    title: 'Borrow & Return',
    description: 'Complete the exchange with a smile!',
    icon: PackageCheck,
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-12 bg-white relative overflow-hidden">
      {/* Soft decorative blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blush-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blush-100/40 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-16">
          {/* Left intro */}
          <div className="lg:w-1/3 space-y-3">
            <div className="inline-flex items-center gap-2 text-[#c45a7c]">
              <Lightbulb size={22} strokeWidth={1.8} />
              <span className="font-medium text-sm uppercase tracking-wide">How it Works?</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#2d1f24] leading-tight">
              Borrowing made simple in 3 easy steps!
            </h2>
          </div>

          {/* Steps */}
          <div className="lg:w-2/3 flex flex-col sm:flex-row items-stretch gap-4 sm:gap-2">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="flex-1 bg-blush-50/80 rounded-2xl p-5 border border-blush-100 flex flex-col items-start gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#c45a7c] text-white text-sm font-semibold flex items-center justify-center shadow-sm">
                      {step.number}
                    </span>
                    <step.icon size={20} className="text-[#c45a7c]" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2d1f24] text-base">{step.title}</h3>
                    <p className="text-sm text-[#6b4f57] mt-0.5 leading-snug">{step.description}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center text-[#e8a0b0] px-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Decorative floral element bottom right */}
        <div className="absolute bottom-4 right-8 opacity-20 pointer-events-none">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4C24 4 28 12 24 20C20 12 24 4 24 4Z"
              fill="#c45a7c"
            />
            <path
              d="M24 4C24 4 16 12 24 20C32 12 24 4 24 4Z"
              fill="#e8a0b0"
            />
            <path
              d="M24 28C24 28 20 36 24 44C28 36 24 28 24 28Z"
              fill="#c45a7c"
            />
            <circle cx="24" cy="24" r="4" fill="#d97a9a" />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
