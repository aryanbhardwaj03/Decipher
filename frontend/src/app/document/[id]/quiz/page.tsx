"use client";

import { use, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiGenerateQuiz, apiSubmitQuiz } from "@/lib/api";
import { showToast } from "@/components/ui/Toaster";
import { getCorrectMessage, getIncorrectMessage, cn } from "@/lib/utils";
import { QUIZ_TYPES } from "@/lib/constants";

interface Question {
  type: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
}

type Stage = "setup" | "playing" | "results";

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [stage, setStage] = useState<Stage>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId, setQuizId] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<Record<number, { correct: boolean; message: string }>>({});
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [generating, setGenerating] = useState(false);

  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [selectedTypes, setSelectedTypes] = useState(["mcq", "true_false"]);
  const [topicFocus, setTopicFocus] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const data = await apiGenerateQuiz(id, numQuestions, difficulty, selectedTypes, topicFocus);
      setQuestions(data.questions);
      setQuizId(data.quiz_id);
      setStage("playing");
      setCurrentQ(0);
      setAnswers({});
      setSubmitted({});
      setFeedback({});
      setScore(0);
      setStreak(0);
    } catch (err: any) {
      showToast(err.message || "Failed to generate quiz", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (answer: string) => {
    if (submitted[currentQ]) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
  };

  const handleSubmitAnswer = () => {
    const q = questions[currentQ];
    const userAnswer = answers[currentQ] || "";
    let isCorrect = false;
    if (q.type === "mcq" || q.type === "true_false") {
      isCorrect = userAnswer.toUpperCase() === q.correct_answer.toUpperCase();
    } else {
      isCorrect = userAnswer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim();
    }
    if (isCorrect) { setScore((p) => p + 1); setStreak((p) => p + 1); } else { setStreak(0); }
    setSubmitted((prev) => ({ ...prev, [currentQ]: true }));
    setFeedback((prev) => ({ ...prev, [currentQ]: { correct: isCorrect, message: isCorrect ? getCorrectMessage() : getIncorrectMessage() } }));
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) { setCurrentQ((p) => p + 1); } else { handleFinish(); }
  };

  const handleFinish = async () => {
    try {
      const answerList = Object.entries(answers).map(([idx, answer]) => ({ question_index: parseInt(idx), answer }));
      const result = await apiSubmitQuiz(quizId, answerList);
      setScore(result.score);
      setXpEarned(result.xp_earned);
    } catch {}
    setStage("results");
  };

  const q = questions[currentQ];
  const progress = questions.length > 0 ? ((currentQ + (submitted[currentQ] ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <AppLayout>
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <Link href={`/document/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Document
        </Link>

        <AnimatePresence mode="wait">
          {/* ── Setup ─── */}
          {stage === "setup" && (
            <motion.div key="setup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">
                <span className="gradient-text">Generate Quiz</span>
              </h1>
              <div className="space-y-5 p-5 rounded-2xl bg-card border border-border">
                <div>
                  <label className="text-xs font-semibold mb-2 block">Questions: {numQuestions}</label>
                  <input type="range" min={3} max={15} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full accent-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block">Difficulty</label>
                  <div className="flex gap-2">
                    {["easy", "medium", "hard"].map((d) => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={cn("px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-all",
                          difficulty === d ? "text-white shadow-md" : "bg-muted hover:bg-muted/80")}
                        style={difficulty === d ? { background: "var(--gradient-brand)" } : undefined}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-2 block">Question Types</label>
                  <div className="flex flex-wrap gap-2">
                    {QUIZ_TYPES.map((t) => (
                      <button key={t.id} onClick={() => setSelectedTypes((prev) =>
                        prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id])}
                        className={cn("px-3 py-1.5 rounded-xl text-xs transition-all",
                          selectedTypes.includes(t.id) ? "text-white shadow-md" : "bg-muted")}
                        style={selectedTypes.includes(t.id) ? { background: "var(--gradient-brand)" } : undefined}>
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Topic Focus (optional)</label>
                  <input type="text" value={topicFocus} onChange={(e) => setTopicFocus(e.target.value)}
                    placeholder="e.g., chapter 3, methodology…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" />
                </div>
                <button onClick={handleGenerate} disabled={generating || selectedTypes.length === 0}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/15"
                  style={{ background: "var(--gradient-brand)" }}>
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : "Start Quiz"}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Playing ─── */}
          {stage === "playing" && q && (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              {/* Progress */}
              <div className="mb-5">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>Question {currentQ + 1} of {questions.length}</span>
                  <span className="flex items-center gap-2.5">
                    <span>🏆 {score}/{currentQ + (submitted[currentQ] ? 1 : 0)}</span>
                    {streak > 1 && <span className="text-amber-500">🔥 {streak}</span>}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: "var(--gradient-brand)" }}
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
                </div>
              </div>

              {/* Question */}
              <div className="p-5 rounded-2xl bg-card border border-border mb-3">
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize mb-3">
                  {q.type.replace("_", " ")}
                </span>
                <h2 className="text-base font-semibold leading-snug mb-4">{q.question}</h2>

                {/* MCQ */}
                {q.type === "mcq" && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const letter = opt[0];
                      const sel = answers[currentQ] === letter;
                      const sub = submitted[currentQ];
                      const correct = letter === q.correct_answer;
                      return (
                        <button key={i} onClick={() => handleAnswer(letter)} disabled={sub}
                          className={cn("w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all leading-relaxed",
                            sub && correct ? "border-emerald-500/40 bg-emerald-500/10" :
                            sub && sel && !correct ? "border-red-500/40 bg-red-500/10" :
                            sel ? "border-primary/40 bg-primary/[0.06]" :
                            "border-border hover:border-primary/20")}>
                          {opt}
                          {sub && correct && <CheckCircle2 className="inline w-3.5 h-3.5 ml-1.5 text-emerald-500" />}
                          {sub && sel && !correct && <XCircle className="inline w-3.5 h-3.5 ml-1.5 text-red-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True/False */}
                {q.type === "true_false" && (
                  <div className="flex gap-2.5">
                    {["True", "False"].map((opt) => {
                      const sel = answers[currentQ] === opt;
                      const sub = submitted[currentQ];
                      const correct = opt === q.correct_answer;
                      return (
                        <button key={opt} onClick={() => handleAnswer(opt)} disabled={sub}
                          className={cn("flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all",
                            sub && correct ? "border-emerald-500/40 bg-emerald-500/10" :
                            sub && sel && !correct ? "border-red-500/40 bg-red-500/10" :
                            sel ? "border-primary/40 bg-primary/[0.06]" :
                            "border-border hover:border-primary/20")}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short answer / Fill blanks */}
                {(q.type === "short_answer" || q.type === "fill_blanks") && (
                  <input type="text" value={answers[currentQ] || ""} onChange={(e) => handleAnswer(e.target.value)}
                    disabled={submitted[currentQ]} placeholder="Type your answer…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground" />
                )}
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {feedback[currentQ] && (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className={cn("p-3.5 rounded-2xl mb-3 text-xs",
                      feedback[currentQ].correct ? "bg-emerald-500/10 border border-emerald-500/15" : "bg-red-500/10 border border-red-500/15")}>
                    <p className="font-semibold mb-0.5">{feedback[currentQ].message}</p>
                    {!feedback[currentQ].correct && <p className="text-muted-foreground">Correct: {q.correct_answer}</p>}
                    {q.explanation && <p className="mt-1.5 text-muted-foreground leading-relaxed">{q.explanation}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2.5">
                {!submitted[currentQ] ? (
                  <button onClick={handleSubmitAnswer} disabled={!answers[currentQ]}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 shadow-lg shadow-primary/15"
                    style={{ background: "var(--gradient-brand)" }}>
                    Submit Answer
                  </button>
                ) : (
                  <button onClick={handleNext}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex items-center justify-center gap-1.5 shadow-lg shadow-primary/15"
                    style={{ background: "var(--gradient-brand)" }}>
                    {currentQ < questions.length - 1 ? <>Next <ChevronRight className="w-3.5 h-3.5" /></> : <>See Results <Trophy className="w-3.5 h-3.5" /></>}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Results ─── */}
          {stage === "results" && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
                <Trophy className="w-16 h-16 mx-auto text-amber-400 mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold tracking-tight mb-1.5">Quiz Complete!</h1>
              <p className="text-xs text-muted-foreground mb-8">Here's how you did</p>
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
                <div className="p-3.5 rounded-2xl bg-card border border-border">
                  <p className="text-2xl font-bold gradient-text">{score}/{questions.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Score</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-card border border-border">
                  <p className="text-2xl font-bold text-amber-500">{Math.round((score / Math.max(questions.length, 1)) * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Accuracy</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-card border border-border">
                  <p className="text-2xl font-bold text-emerald-500">+{xpEarned}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">XP</p>
                </div>
              </div>
              <div className="flex gap-2.5 justify-center">
                <button onClick={() => setStage("setup")}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 transition-all flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Try Again
                </button>
                <Link href={`/document/${id}`}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md"
                  style={{ background: "var(--gradient-brand)" }}>
                  Back to Document
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AppLayout>
  );
}
