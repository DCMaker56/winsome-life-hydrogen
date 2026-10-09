/*
 * Design: The Stationery Atelier
 * GiftMessage: Reusable toggle component that lets customers add a personalized
 * gift message and optional gift wrapping to any order. Elegant collapsible panel
 * with gold accents, character counter, and live preview.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, MessageSquare, Ribbon, ChevronDown, X } from "lucide-react";

interface GiftMessageProps {
  onGiftMessageChange?: (message: string | null) => void;
  onGiftWrapChange?: (enabled: boolean) => void;
  className?: string;
}

const MAX_CHARS = 200;

export default function GiftMessage({
  onGiftMessageChange,
  onGiftWrapChange,
  className = "",
}: GiftMessageProps) {
  const [isGift, setIsGift] = useState(false);
  const [giftWrap, setGiftWrap] = useState(true);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleToggle = () => {
    const newVal = !isGift;
    setIsGift(newVal);
    if (!newVal) {
      setMessage("");
      setShowPreview(false);
      onGiftMessageChange?.(null);
      onGiftWrapChange?.(false);
    } else {
      onGiftWrapChange?.(true);
    }
  };

  const handleMessageChange = (val: string) => {
    if (val.length > MAX_CHARS) return;
    setMessage(val);
    onGiftMessageChange?.(val || null);
  };

  const handleGiftWrapToggle = () => {
    const newVal = !giftWrap;
    setGiftWrap(newVal);
    onGiftWrapChange?.(newVal);
  };

  return (
    <div className={`${className}`}>
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={`w-full flex items-center justify-between px-4 py-3.5 border transition-all duration-300 group ${
          isGift
            ? "border-[#C9A96E]/40 bg-[#C9A96E]/5"
            : "border-[#2D2D2D]/10 bg-transparent hover:border-[#C9A96E]/25 hover:bg-[#C9A96E]/3"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
              isGift
                ? "bg-[#C9A96E]/15 text-[#C9A96E]"
                : "bg-[#2D2D2D]/5 text-[#2D2D2D]/30 group-hover:text-[#C9A96E]/50"
            }`}
          >
            <Gift size={15} strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <p
              className="font-sans font-medium text-sm text-[#2D2D2D]"

            >
              This is a gift
            </p>
            <p
              className="font-sans font-light text-[11px] text-[#2D2D2D]/40"

            >
              Add a personal message &amp; gift wrapping
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isGift && (
            <span
              className="font-sans font-semibold text-[10px] tracking-[0.1em] uppercase text-[#C9A96E]"

            >
              Complimentary
            </span>
          )}
          <motion.div
            animate={{ rotate: isGift ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown
              size={16}
              className={isGift ? "text-[#C9A96E]" : "text-[#2D2D2D]/25"}
            />
          </motion.div>
        </div>
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {isGift && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 py-5 border-x border-b border-[#C9A96E]/20 bg-white">
              {/* Gift wrap toggle */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <Ribbon size={14} className="text-[#C9A96E]" strokeWidth={1.5} />
                  <span
                    className="font-sans text-sm text-[#2D2D2D]/70"

                  >
                    Gift wrapping
                  </span>
                </div>
                <button
                  onClick={handleGiftWrapToggle}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                    giftWrap ? "bg-[#C9A96E]" : "bg-[#2D2D2D]/15"
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ left: giftWrap ? "calc(100% - 18px)" : "2px" }}
                    transition={{ duration: 0.2 }}
                  />
                </button>
              </div>

              {/* Message textarea */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-2.5">
                  <MessageSquare size={13} className="text-[#C9A96E]" strokeWidth={1.5} />
                  <label
                    className="font-sans font-medium text-xs tracking-[0.1em] uppercase text-[#2D2D2D]/45"

                  >
                    Your Gift Message
                  </label>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  placeholder="Write something heartfelt... e.g., 'Happy Mother's Day! These reminded me of your beautiful garden.'"
                  className="w-full h-28 px-4 py-3 bg-[#FAF8F5] border border-[#2D2D2D]/8 text-sm text-[#2D2D2D] placeholder:text-[#2D2D2D]/25 resize-none focus:outline-none focus:border-[#C9A96E]/40 transition-colors duration-300"
                  style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 300,
                    fontStyle: "italic",
                    lineHeight: 1.7,
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <p
                    className="font-sans font-light text-[10px] text-[#2D2D2D]/30"

                  >
                    Handwritten on a Winsome notecard &amp; tucked inside
                  </p>
                  <span
                    className={`font-sans text-[10px] transition-colors ${
                      message.length > MAX_CHARS * 0.9
                        ? "text-[#e07c7c]"
                        : "text-[#2D2D2D]/25"
                    }`}

                  >
                    {message.length}/{MAX_CHARS}
                  </span>
                </div>
              </div>

              {/* Preview toggle */}
              {message.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="font-sans font-medium text-xs text-[#C9A96E] hover:text-[#b8944f] transition-colors flex items-center gap-1.5"

                  >
                    {showPreview ? "Hide Preview" : "Preview Message"}
                    <motion.div
                      animate={{ rotate: showPreview ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={12} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showPreview && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 p-5 bg-[#FAF8F5] border border-[#C9A96E]/15 relative">
                          {/* Decorative corner flourishes */}
                          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#C9A96E]/20" />
                          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#C9A96E]/20" />
                          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#C9A96E]/20" />
                          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#C9A96E]/20" />

                          <p
                            className="font-sans font-medium text-center text-[10px] tracking-[0.2em] uppercase text-[#C9A96E]/60 mb-3"

                          >
                            Your Gift Message
                          </p>
                          <p
                            className="text-sm text-[#2D2D2D]/70 text-center leading-relaxed px-4"
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontStyle: "italic",
                              fontWeight: 400,
                            }}
                          >
                            &ldquo;{message}&rdquo;
                          </p>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <div className="w-8 h-[1px] bg-[#C9A96E]/20" />
                            <Gift size={12} className="text-[#C9A96E]/30" />
                            <div className="w-8 h-[1px] bg-[#C9A96E]/20" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-[#2D2D2D]/5 flex items-center gap-4">
                {giftWrap && (
                  <div className="flex items-center gap-1.5">
                    <Ribbon size={11} className="text-[#C9A96E]" />
                    <span
                      className="font-sans text-[10px] text-[#2D2D2D]/40"

                    >
                      Gift wrapped
                    </span>
                  </div>
                )}
                {message.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={11} className="text-[#C9A96E]" />
                    <span
                      className="font-sans text-[10px] text-[#2D2D2D]/40"

                    >
                      Message included
                    </span>
                  </div>
                )}
                <span
                  className="font-sans font-semibold ml-auto text-[10px] text-[#C9A96E]"

                >
                  Free
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
