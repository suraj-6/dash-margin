import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { DepthLevel } from "@/lib/types";

const CURRENT_LEVEL: DepthLevel = 3;

interface Level {
  level: DepthLevel;
  name: string;
  icon: string;
  description: string;
  abilities: string[];
  nextRequirement?: string;
}

const LEVELS: Level[] = [
  {
    level: 0,
    name: "Reader",
    icon: "👁️",
    description: "You're here to explore. Read freely, see where others engaged.",
    abilities: ["Read articles", "See heat maps"],
    nextRequirement: "Read 3 articles deeply",
  },
  {
    level: 1,
    name: "Highlighter",
    icon: "✨",
    description: "You've proven you read. Now see what others think.",
    abilities: ["Highlight passages", "See annotations"],
    nextRequirement: "Make 5 meaningful highlights + read 2 more articles",
  },
  {
    level: 2,
    name: "Annotator",
    icon: "✍️",
    description: "Your voice is ready. Make it count.",
    abilities: ["Write annotations (3 per article)", "Reply to threads"],
    nextRequirement: "Contribute annotations that spark conversations",
  },
  {
    level: 3,
    name: "Voice",
    icon: "🎙️",
    description: "Your thinking resonates. Speak freely.",
    abilities: ["Unlimited annotations", "Start discussions", "Profile visible"],
    nextRequirement: "Sustained quality over time",
  },
  {
    level: 4,
    name: "Contributor",
    icon: "🌟",
    description: "You shape the community.",
    abilities: ["Publish response essays", "Curate reading paths", "Invite others"],
  },
];

export function DepthLevelsPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-['Playfair_Display'] text-4xl font-bold text-[#1a1a1a] mb-3">
            Earning Your Voice
          </h1>
          <p className="text-[#6B6B6B] text-lg font-['Libre_Baskerville'] italic">
            Great conversations start with deep listening
          </p>
        </motion.div>

        {/* Journey */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[39px] top-12 bottom-12 w-px bg-[#E8E6E1]" />

          <div className="space-y-0">
            {LEVELS.map((level, i) => {
              const isCurrent = level.level === CURRENT_LEVEL;
              const isPast = level.level < CURRENT_LEVEL;
              const isFuture = level.level > CURRENT_LEVEL;

              return (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  {/* Level card */}
                  <div
                    className={`
                      relative flex items-start gap-6 py-8
                      ${isFuture ? "opacity-50" : ""}
                    `}
                  >
                    {/* Icon circle */}
                    <div
                      className={`
                        relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-3xl shrink-0
                        transition-all duration-300
                        ${isCurrent
                          ? "bg-[#E07A5F]/15 ring-2 ring-[#E07A5F] ring-offset-2 ring-offset-[#FAFAF8]"
                          : isPast
                            ? "bg-[#E07A5F]/10"
                            : "bg-[#F5F5F0] border border-[#E8E6E1]"
                        }
                      `}
                    >
                      {level.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-['Playfair_Display'] text-xl font-semibold text-[#1a1a1a]">
                          Level {level.level}: {level.name}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E07A5F] text-white font-medium">
                            Current
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#1a1a1a]/10 text-[#6B6B6B] font-medium">
                            Completed
                          </span>
                        )}
                      </div>

                      <p className={`text-sm mb-3 leading-relaxed ${isCurrent ? "text-[#1a1a1a]" : "text-[#6B6B6B]"}`}>
                        {level.description}
                      </p>

                      {/* Abilities */}
                      <div className="flex flex-wrap gap-2">
                        {level.abilities.map((ability) => (
                          <span
                            key={ability}
                            className={`
                              text-xs px-2.5 py-1 rounded-md
                              ${isCurrent
                                ? "bg-[#E07A5F]/10 text-[#E07A5F]"
                                : "bg-[#F5F5F0] text-[#6B6B6B] border border-[#E8E6E1]"
                              }
                            `}
                          >
                            {ability}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Progression arrow */}
                  {level.nextRequirement && (
                    <div className="flex items-center gap-6 py-2">
                      <div className="w-20 flex justify-center">
                        <ChevronDown
                          size={16}
                          className={isPast ? "text-[#E07A5F]" : "text-[#E8E6E1]"}
                        />
                      </div>
                      <p className={`text-xs italic ${isPast ? "text-[#E07A5F]" : "text-[#9B9B9B]"}`}>
                        {isPast ? "✓ " : ""}{level.nextRequirement}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="w-12 h-px bg-[#E07A5F] mx-auto mb-6" />
          <p className="font-['Playfair_Display'] text-lg italic text-[#6B6B6B]">
            This isn&rsquo;t gamification.
            <br />
            It&rsquo;s trust, earned through thought.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
