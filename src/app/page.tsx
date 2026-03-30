import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  MessageSquareQuote,
  Mic2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface LandingPageProps {
  onNavigate: (page: "reading") => void;
}

const annotationCards = [
  {
    author: "Priya S.",
    meta: "IIM-A",
    type: "💡 Insight",
    accent: "#E07A5F",
    body: "Knowledge compounds differently than attention because context makes interpretation cumulative.",
  },
  {
    author: "Daniel R.",
    meta: "Google",
    type: "❓ Question",
    accent: "#457B9D",
    body: "If friction is removed entirely, do we still get signals of seriousness from readers?",
  },
  {
    author: "Meera K.",
    meta: "LSE",
    type: "🔗 Connection",
    accent: "#E07A5F",
    body: "This echoes Hirschman: attention is cheap, but voice requires investment and risk.",
  },
];

const howItWorks = [
  {
    icon: BookOpenText,
    title: "Read Deeply",
    description:
      "Spend time with essays worth returning to. Reading is measured by attention, not by clicks.",
  },
  {
    icon: MessageSquareQuote,
    title: "Annotate in Context",
    description:
      "Conversations live beside the passage that sparked them, keeping interpretation grounded in the text.",
  },
  {
    icon: Mic2,
    title: "Earn Your Voice",
    description:
      "Visibility comes through thoughtful engagement over time, not through posting volume or social reach.",
  },
];

export default function Page({ onNavigate }: LandingPageProps) {
  return (
    <div className="bg-[#FAFAF8] text-[#1a1a1a]">
      <section className="mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-6 pt-28 pb-18 md:px-10 lg:px-12">
        <div className="max-w-4xl">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-5 text-xs uppercase tracking-[0.22em] text-[#8A877F]"
          >
            Reading as a shared intellectual act
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            className="max-w-4xl font-serif text-5xl leading-[1.04] tracking-[-0.03em] text-[#1a1a1a] md:text-7xl"
          >
            Where smart people read together
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="mt-6 max-w-2xl text-lg leading-8 text-[#5E5A54] md:text-xl"
          >
            Conversations that live in context. Voice that&apos;s earned through depth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <Button
              size="lg"
              onClick={() => onNavigate("reading")}
              className="rounded-full px-7 hover:-translate-y-0.5"
            >
              Start Reading
              <ArrowRight size={17} />
            </Button>
            <a
              href="#how-it-works"
              className="text-sm text-[#5E5A54] transition-colors hover:text-[#1a1a1a]"
            >
              Learn how it works
            </a>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="overflow-hidden rounded-[28px] border border-[#E8E4DA] bg-white shadow-[0_30px_80px_rgba(26,26,26,0.06)]"
        >
          <div className="flex items-center gap-2 border-b border-[#ECE8DE] bg-[#F7F5EF] px-5 py-4">
            <span className="h-3 w-3 rounded-full bg-[#E6DFD4]" />
            <span className="h-3 w-3 rounded-full bg-[#E6DFD4]" />
            <span className="h-3 w-3 rounded-full bg-[#E6DFD4]" />
            <div className="ml-5 h-8 w-full max-w-md rounded-full bg-white/80" />
          </div>

          <div className="grid min-h-[580px] lg:grid-cols-[1.55fr_1fr]">
            <div className="border-b border-[#ECE8DE] px-7 py-8 md:px-10 lg:border-b-0 lg:border-r">
              <div className="mb-8 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A877F]">Essay</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
                  The network effects of knowledge are slower, but stronger
                </h2>
                <p className="mt-3 text-sm text-[#6B675E]">By Asha Menon · 8 min read</p>
              </div>

              <div className="space-y-6 font-serif text-[18px] leading-8 text-[#2B2926] md:text-[19px]">
                <p>
                  In most consumer products, network effects begin with frequency. The more often we return,
                  the more value we seem to generate for one another. But intellectual communities do not scale
                  through frequency alone.
                </p>
                <p>
                  They scale through reference, trust, and rereading. A good note in the margin does not merely
                  react. It preserves a way of seeing that another reader can borrow later, when the same passage
                  opens differently on a second encounter.
                </p>
                <p className="rounded-md bg-[#E07A5F]/12 px-2 py-1">
                  The network effects of knowledge compound differently than the network effects of attention:
                  one rewards immediacy, the other rewards interpretation.
                </p>
                <p>
                  That is why serious reading communities often feel quiet at first. Their value is not obvious in
                  the moment of consumption. It becomes visible when a text develops a living edge through careful,
                  situated conversation.
                </p>
              </div>
            </div>

            <div className="bg-[#F5F5F0] px-6 py-8 md:px-8">
              <div className="mb-6 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A877F]">In the margins</p>
                <span className="text-xs text-[#8A877F]">3 notes</span>
              </div>

              <div className="space-y-4">
                {annotationCards.map((annotation, index) => (
                  <motion.div
                    key={annotation.author + annotation.type}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.55, delay: index * 0.12 }}
                  >
                    <Card
                      padding="md"
                      className="rounded-2xl border border-[#E7E1D7] bg-white shadow-[0_10px_30px_rgba(26,26,26,0.04)]"
                      style={{ borderLeft: `3px solid ${annotation.accent}` }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${annotation.accent}18`,
                            color: annotation.accent,
                          }}
                        >
                          {annotation.author
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-[#1a1a1a]">{annotation.author}</p>
                            <span className="text-xs text-[#8A877F]">• {annotation.meta}</span>
                          </div>
                          <span
                            className="mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px]"
                            style={{
                              backgroundColor: `${annotation.accent}14`,
                              color: annotation.accent,
                            }}
                          >
                            {annotation.type}
                          </span>
                          <p className="mt-3 text-sm leading-6 text-[#47433D]">{annotation.body}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 text-center md:px-10 lg:px-12">
        <p className="text-sm text-[#7A766F]">
          Early community from McKinsey, Google, IIM-A, LSE, XLRI
        </p>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24 md:px-10 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-[#8A877F]">How it works</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-[#1a1a1a] md:text-5xl">
            A reading product designed for substance, not noise
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {howItWorks.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: index * 0.1 }}
              >
                <Card className="group h-full rounded-[24px] border-[#EAE5DC] bg-white/80 p-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,26,26,0.05)]">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#E07A5F]/10 text-[#E07A5F] transition-transform duration-300 group-hover:scale-105">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-serif text-2xl text-[#1a1a1a]">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#5F5B55]">{item.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
