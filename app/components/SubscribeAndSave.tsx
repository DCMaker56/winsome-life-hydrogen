/*
 * Design: The Stationery Atelier
 * Subscribe & Save: A purchase option toggle that lets customers choose between
 * a one-time purchase or a recurring subscription at 15% off.
 * Subscription cadence: Monthly or Quarterly.
 * Warm cream bg, gold accents, elegant radio-style toggle.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Check, ChevronDown } from "lucide-react";

export type PurchaseMode = "one-time" | "subscribe";
export type SubscriptionCadence = "monthly" | "quarterly";

interface SubscribeAndSaveProps {
  price: number;
  discountPercent?: number;
  onModeChange?: (mode: PurchaseMode) => void;
  onCadenceChange?: (cadence: SubscriptionCadence) => void;
}

export function calculateSubscriptionPrice(price: number, discountPercent: number = 15): number {
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}

export function formatSubscriptionPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export default function SubscribeAndSave({
  price,
  discountPercent = 15,
  onModeChange,
  onCadenceChange,
}: SubscribeAndSaveProps) {
  const [mode, setMode] = useState<PurchaseMode>("one-time");
  const [cadence, setCadence] = useState<SubscriptionCadence>("monthly");
  const [cadenceOpen, setCadenceOpen] = useState(false);

  const subscriptionPrice = calculateSubscriptionPrice(price, discountPercent);
  const savings = (price - subscriptionPrice).toFixed(2);

  const handleModeChange = (newMode: PurchaseMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleCadenceChange = (newCadence: SubscriptionCadence) => {
    setCadence(newCadence);
    setCadenceOpen(false);
    onCadenceChange?.(newCadence);
  };

  return (
    <div className="space-y-3 mb-8">
      {/* One-Time Purchase Option */}
      <button
        onClick={() => handleModeChange("one-time")}
        className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 text-left ${
          mode === "one-time"
            ? "border-[#C9A96E] bg-[#C9A96E]/[0.03]"
            : "border-[#2D2D2D]/10 hover:border-[#C9A96E]/40"
        }`}
      >
        {/* Radio indicator */}
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
            mode === "one-time"
              ? "border-[#C9A96E]"
              : "border-[#2D2D2D]/20"
          }`}
        >
          {mode === "one-time" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]"
            />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span
              className="font-sans font-medium text-sm text-[#2D2D2D]"

            >
              One-Time Purchase
            </span>
            <span
              className="font-sans font-semibold text-sm text-[#2D2D2D]"

            >
              ${price.toFixed(2)}
            </span>
          </div>
        </div>
      </button>

      {/* Subscribe & Save Option */}
      <div
        className={`border transition-all duration-300 ${
          mode === "subscribe"
            ? "border-[#C9A96E] bg-[#C9A96E]/[0.03]"
            : "border-[#2D2D2D]/10 hover:border-[#C9A96E]/40"
        }`}
      >
        <button
          onClick={() => handleModeChange("subscribe")}
          className="w-full flex items-center gap-4 p-4 text-left"
        >
          {/* Radio indicator */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300 ${
              mode === "subscribe"
                ? "border-[#C9A96E]"
                : "border-[#2D2D2D]/20"
            }`}
          >
            {mode === "subscribe" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2.5 h-2.5 rounded-full bg-[#C9A96E]"
              />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="font-sans font-medium text-sm text-[#2D2D2D]"

                >
                  Subscribe & Save
                </span>
                <span
                  className="font-sans font-semibold text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 bg-[#C9A96E] text-white"

                >
                  {discountPercent}% Off
                </span>
              </div>
              <span
                className="font-sans font-semibold text-sm text-[#C9A96E]"

              >
                ${subscriptionPrice.toFixed(2)}
              </span>
            </div>
            <p
              className="font-sans font-light text-xs text-[#2D2D2D]/45 mt-1"

            >
              Save ${savings} per delivery &middot; Cancel anytime
            </p>
          </div>
        </button>

        {/* Cadence Selector (visible when subscribe is selected) */}
        <AnimatePresence>
          {mode === "subscribe" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-0">
                <div className="border-t border-[#C9A96E]/15 pt-4">
                  <p
                    className="font-sans font-medium text-[10px] tracking-[0.2em] uppercase text-[#2D2D2D]/40 mb-3"

                  >
                    Delivery Frequency
                  </p>

                  {/* Cadence dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCadenceOpen(!cadenceOpen);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 border border-[#C9A96E]/25 bg-white hover:border-[#C9A96E]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw size={14} className="text-[#C9A96E]" strokeWidth={1.5} />
                        <span
                          className="font-sans font-medium text-sm text-[#2D2D2D]"

                        >
                          {cadence === "monthly" ? "Every Month" : "Every 3 Months"}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-[#C9A96E] transition-transform duration-200 ${
                          cadenceOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {cadenceOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C9A96E]/25 shadow-lg z-10"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCadenceChange("monthly");
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAF8F5] transition-colors ${
                              cadence === "monthly" ? "bg-[#FAF8F5]" : ""
                            }`}
                          >
                            <div>
                              <span
                                className="font-sans font-medium text-sm text-[#2D2D2D] block"

                              >
                                Every Month
                              </span>
                              <span
                                className="font-sans font-light text-xs text-[#2D2D2D]/40"

                              >
                                Most popular &middot; Never run out
                              </span>
                            </div>
                            {cadence === "monthly" && (
                              <Check size={14} className="text-[#C9A96E]" />
                            )}
                          </button>
                          <div className="h-px bg-[#C9A96E]/10" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCadenceChange("quarterly");
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#FAF8F5] transition-colors ${
                              cadence === "quarterly" ? "bg-[#FAF8F5]" : ""
                            }`}
                          >
                            <div>
                              <span
                                className="font-sans font-medium text-sm text-[#2D2D2D] block"

                              >
                                Every 3 Months
                              </span>
                              <span
                                className="font-sans font-light text-xs text-[#2D2D2D]/40"

                              >
                                Seasonal refresh &middot; Great for gifts
                              </span>
                            </div>
                            {cadence === "quarterly" && (
                              <Check size={14} className="text-[#C9A96E]" />
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Subscription benefits */}
                  <div className="mt-4 space-y-2">
                    {[
                      "Save 15% on every delivery",
                      "Free shipping on all subscription orders",
                      "Skip, pause, or cancel anytime",
                      "Exclusive subscriber-only designs",
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2">
                        <Check size={12} className="text-[#C9A96E] shrink-0" strokeWidth={2} />
                        <span
                          className="font-sans text-xs text-[#2D2D2D]/50"

                        >
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
