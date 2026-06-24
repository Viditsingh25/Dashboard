import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

const TOUR_KEY = "kims-tour-last-date";

const steps = [
  {
    target: "[data-tour=sidebar]",
    title: "Navigation Sidebar",
    content: "Access all modules from here. Click the chevron to collapse.",
    position: "right",
  },
  {
    target: "[data-tour=header-search]",
    title: "Global Search (Ctrl+K)",
    content: "Press Ctrl+K anywhere to search patients, reports, users, and more.",
    position: "bottom",
  },
  {
    target: "[data-tour=header-notifications]",
    title: "Notifications",
    content: "View system alerts, critical warnings, and report readiness.",
    position: "bottom",
  },
  {
    target: "[data-tour=header-user]",
    title: "Your Profile",
    content: "Manage your settings, change password, and logout.",
    position: "left",
  },
  {
    target: "[data-tour=kpi-cards]",
    title: "KPI Cards",
    content: "Key metrics at a glance. Drag to rearrange (coming soon).",
    position: "top",
  },
  {
    target: "[data-tour=charts]",
    title: "Charts & Analytics",
    content: "Visual insights for revenue, patients, operations, and more.",
    position: "top",
  },
];

function getPositionStyles(step, targetRect) {
  const { position } = step;
  const offset = 16;
  const arrowSize = 8;

  switch (position) {
    case "right":
      return {
        top: targetRect.top + targetRect.height / 2 - 150,
        left: targetRect.right + offset,
        arrow: { top: "50%", left: `-${arrowSize}px`, transform: "translateY(-50%) rotate(45deg)" },
      };
    case "left":
      return {
        top: targetRect.top + targetRect.height / 2 - 150,
        right: window.innerWidth - targetRect.left + offset,
        arrow: { top: "50%", right: `-${arrowSize}px`, transform: "translateY(-50%) rotate(45deg)" },
      };
    case "bottom":
      return {
        top: targetRect.bottom + offset,
        left: targetRect.left + targetRect.width / 2 - 150,
        arrow: { top: `-${arrowSize}px`, left: "50%", transform: "translateX(-50%) rotate(45deg)" },
      };
    case "top":
    default:
      return {
        bottom: window.innerHeight - targetRect.top + offset,
        left: targetRect.left + targetRect.width / 2 - 150,
        arrow: { bottom: `-${arrowSize}px`, left: "50%", transform: "translateX(-50%) rotate(45deg)" },
      };
  }
}

const today = new Date().toISOString().slice(0, 10);

export default function Tour({ onComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const tooltipRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    const lastDate = localStorage.getItem(TOUR_KEY);
    if (lastDate !== today) {
      setTimeout(() => setIsOpen(true), 500);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStep];
    const target = document.querySelector(step.target);
    if (target) {
      setTargetRect(target.getBoundingClientRect());
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("tour-highlight");
    }
    return () => {
      const target = document.querySelector(step.target);
      if (target) target.classList.remove("tour-highlight");
    };
  }, [currentStep, isOpen]);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const finish = () => {
    localStorage.setItem(TOUR_KEY, today);
    setIsOpen(false);
    onComplete?.();
  };

  const skip = () => {
    localStorage.setItem(TOUR_KEY, today);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const styles = targetRect ? getPositionStyles(step, targetRect) : {};
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={skip}
        aria-hidden="true"
      />
      {targetRect && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-80 rounded-xl bg-white shadow-2xl border border-gray-200 p-5 transition-all duration-300"
          style={{
            top: styles.top !== undefined ? `${styles.top + scrollY}px` : undefined,
            bottom: styles.bottom !== undefined ? `${styles.bottom}px` : undefined,
            left: styles.left !== undefined ? `${styles.left + scrollX}px` : undefined,
            right: styles.right !== undefined ? `${styles.right}px` : undefined,
          }}
          role="dialog"
          aria-label={`Tour step ${currentStep + 1} of ${steps.length}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
              <p className="mt-2 text-sm text-gray-600">{step.content}</p>
            </div>
            <button
              onClick={skip}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Skip tour"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === currentStep ? "bg-green-600" : "bg-gray-200"
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prev}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={next}
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <Check size={16} className="mr-1" /> Finish
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            className="absolute w-3 h-3 bg-white border border-gray-200 rotate-45"
            style={{
              ...styles.arrow,
              borderTop: "none",
              borderRight: "none",
            }}
          />
        </div>
      )}
      <style jsx>{`
        .tour-highlight {
          position: relative;
          z-index: 45 !important;
          box-shadow: 0 0 0 3px #10b981, 0 0 0 6px rgba(16, 185, 129, 0.3) !important;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}