/*
 * Design: The Stationery Atelier
 * Newsletter: Email capture with elegant styling.
 * Charcoal background, gold accents, warm invitation.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "@/hooks/useInView";
import { toast } from "sonner";

export default function Newsletter() {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("Thank you for subscribing! Check your email for your 10% off coupon.");
      setEmail("");
    }
  };

  return (
    <section className="py-20 lg:py-24 bg-[#2D2D2D] relative overflow-hidden" ref={ref}>
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A96E' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-xl mx-auto text-center"
        >
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent mx-auto mb-8" />
          <h2
            className="font-serif font-medium text-3xl md:text-4xl text-white mb-4"

          >
            Stay in Touch
          </h2>
          <p
            className="font-sans font-light text-white/60 mb-2 text-lg"

          >
            Subscribe to receive a{" "}
            <span className="text-[#C9A96E] font-medium">10% off</span> coupon.
          </p>
          <p
            className="font-sans font-light text-white/40 mb-8 text-sm"

          >
            Thoughtfully curated collections and delightful updates worth opening.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="font-sans flex-1 px-5 py-3.5 bg-white/10 border border-[#C9A96E]/30 text-white placeholder:text-white/40 text-sm tracking-wide focus:outline-none focus:border-[#C9A96E] transition-colors duration-300"

            />
            <button
              type="submit"
              className="font-sans font-medium px-8 py-3.5 bg-[#C9A96E] text-white text-sm tracking-[0.15em] uppercase hover:bg-[#b8964f] transition-colors duration-400"

            >
              Subscribe
            </button>
          </form>

          <p
            className="font-sans text-white/30 text-xs mt-4"

          >
            By subscribing, you agree to receive our emails. Unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
