import { useState, useEffect, useCallback, useRef } from "react";

// ─── Constants & Data ───────────────────────────────────────────────────────

const MASTERY_THRESHOLD = 80;
const XP_PER_CORRECT = 25;
const XP_PER_STREAK_BONUS = 10;
const XP_PER_LEVEL = 200;
const COMBO_THRESHOLD = 3;

const LEARNING_STYLES = {
  visual: { label: "Visual Learner", icon: "\u{1F441}\uFE0F", desc: "You learn best with diagrams, graphs, and visual representations" },
  stepByStep: { label: "Step-by-Step Learner", icon: "\u{1FA9C}", desc: "You learn best breaking problems into small, clear steps" },
  realWorld: { label: "Real-World Learner", icon: "\u{1F30D}", desc: "You learn best when math connects to real life situations" },
  practice: { label: "Practice Learner", icon: "\u{1F4AA}", desc: "You learn best by doing lots of problems with immediate feedback" },
};

const ACHIEVEMENTS = [
  { id: "first_correct", title: "First Steps", desc: "Get your first answer correct", icon: "\u2B50", check: (s) => s.totalCorrect >= 1 },
  { id: "streak_3", title: "On Fire!", desc: "Get 3 in a row correct", icon: "\u{1F525}", check: (s) => s.bestStreak >= 3 },
  { id: "streak_5", title: "Unstoppable", desc: "Get 5 in a row correct", icon: "\u26A1", check: (s) => s.bestStreak >= 5 },
  { id: "streak_10", title: "Math Legend", desc: "Get 10 in a row correct", icon: "\u{1F451}", check: (s) => s.bestStreak >= 10 },
  { id: "first_mastery", title: "Mastery Unlocked", desc: "Master your first topic", icon: "\u{1F3C6}", check: (s) => s.topicsMastered >= 1 },
  { id: "five_mastery", title: "Knowledge Builder", desc: "Master 5 topics", icon: "\u{1F3D7}\uFE0F", check: (s) => s.topicsMastered >= 5 },
  { id: "ten_mastery", title: "Algebra Boss", desc: "Master 10 topics", icon: "\u{1F48E}", check: (s) => s.topicsMastered >= 10 },
  { id: "level_5", title: "Rising Star", desc: "Reach Level 5", icon: "\u{1F31F}", check: (s) => s.level >= 5 },
  { id: "level_10", title: "Math Warrior", desc: "Reach Level 10", icon: "\u2694\uFE0F", check: (s) => s.level >= 10 },
  { id: "problems_50", title: "Dedicated", desc: "Solve 50 problems", icon: "\u{1F4DA}", check: (s) => s.totalAttempted >= 50 },
  { id: "problems_100", title: "Committed", desc: "Solve 100 problems", icon: "\u{1F3AF}", check: (s) => s.totalAttempted >= 100 },
  { id: "comeback", title: "Comeback Kid", desc: "Get 3 correct after getting 2 wrong", icon: "\u{1F98B}", check: (s) => s.comebackAchieved },
];

const CURRICULUM = [
  {
    id: "alg1",
    title: "Algebra 1 Foundations",
    icon: "\u{1F9F1}",
    color: "#FF6B6B",
    topics: [
      { id: "a1_order_ops", title: "Order of Operations", desc: "PEMDAS mastery" },
      { id: "a1_variables", title: "Variables & Expressions", desc: "Translating words to math" },
      { id: "a1_one_step", title: "One-Step Equations", desc: "Solving x + 5 = 12 type problems" },
      { id: "a1_two_step", title: "Two-Step Equations", desc: "Solving 2x + 3 = 11 type problems" },
      { id: "a1_multi_step", title: "Multi-Step Equations", desc: "Variables on both sides" },
      { id: "a1_inequalities", title: "Inequalities", desc: "Solving and graphing inequalities" },
      { id: "a1_linear_graph", title: "Graphing Linear Equations", desc: "Slope-intercept form y = mx + b" },
      { id: "a1_systems_intro", title: "Intro to Systems", desc: "Solving pairs of equations" },
      { id: "a1_exponents", title: "Exponent Rules", desc: "Product, quotient, and power rules" },
      { id: "a1_polynomials", title: "Polynomial Basics", desc: "Adding and multiplying polynomials" },
      { id: "a1_factoring", title: "Factoring", desc: "GCF, trinomials, difference of squares" },
    ],
  },
  {
    id: "alg2",
    title: "Algebra 2 Mastery",
    icon: "\u{1F680}",
    color: "#4ECDC4",
    topics: [
      { id: "a2_complex_num", title: "Complex Numbers", desc: "Imaginary numbers and operations" },
      { id: "a2_quadratic", title: "Quadratic Functions", desc: "Vertex form, graphing parabolas" },
      { id: "a2_quad_formula", title: "Quadratic Formula", desc: "Solving any quadratic equation" },
      { id: "a2_polynomials", title: "Polynomial Functions", desc: "End behavior, zeros, graphing" },
      { id: "a2_poly_divide", title: "Polynomial Division", desc: "Long division and synthetic division" },
      { id: "a2_rational", title: "Rational Expressions", desc: "Simplifying and solving rational equations" },
      { id: "a2_radical", title: "Radical Functions", desc: "Square roots, cube roots, and beyond" },
      { id: "a2_exponential", title: "Exponential Functions", desc: "Growth, decay, and modeling" },
      { id: "a2_logarithms", title: "Logarithms", desc: "Log rules and solving log equations" },
      { id: "a2_sequences", title: "Sequences & Series", desc: "Arithmetic and geometric patterns" },
      { id: "a2_systems_adv", title: "Advanced Systems", desc: "Three variables and nonlinear systems" },
      { id: "a2_conic", title: "Conic Sections", desc: "Circles, ellipses, parabolas, hyperbolas" },
    ],
  },
];

const ALL_TOPICS = CURRICULUM.flatMap((s) => s.topics.map((t) => ({ ...t, sectionId: s.id, sectionColor: s.color })));

// ─── Utility Helpers ────────────────────────────────────────────────────────

function getLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
function getXpInLevel(xp) {
  return xp % XP_PER_LEVEL;
}
function getXpProgress(xp) {
  return (getXpInLevel(xp) / XP_PER_LEVEL) * 100;
}

// ─── Confetti Component ─────────────────────────────────────────────────────

function Confetti({ active }) {
  if (!active) return null;
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A855F7", "#FF8A5C", "#22D3EE"][i % 6],
    size: Math.random() * 8 + 4,
    duration: Math.random() * 1.5 + 1,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            borderRadius: p.size > 8 ? "50%" : "2px",
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Toast Notification ─────────────────────────────────────────────────────

function Toast({ message, type, visible }) {
  const colors = {
    success: { bg: "#065F46", border: "#10B981", text: "#D1FAE5" },
    error: { bg: "#7F1D1D", border: "#EF4444", text: "#FEE2E2" },
    achievement: { bg: "#4A1D96", border: "#A855F7", text: "#EDE9FE" },
    info: { bg: "#1E3A5F", border: "#3B82F6", text: "#DBEAFE" },
    levelup: { bg: "#713F12", border: "#F59E0B", text: "#FEF3C7" },
  };
  const c = colors[type] || colors.info;
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "-120px"})`,
        background: c.bg,
        border: `2px solid ${c.border}`,
        color: c.text,
        padding: "14px 28px",
        borderRadius: 16,
        fontWeight: 700,
        fontSize: 15,
        zIndex: 10000,
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: `0 8px 32px ${c.border}44`,
        textAlign: "center",
        maxWidth: "90vw",
      }}
    >
      {message}
    </div>
  );
}

// ─── Main App Component ─────────────────────────────────────────────────────

export default function AlgebraMasteryApp() {
  // Navigation
  const [screen, setScreen] = useState("welcome"); // welcome, quiz, dashboard, lesson, achievements, review

  // User profile
  const [playerName, setPlayerName] = useState("");
  const [learningStyle, setLearningStyle] = useState(null);

  // Progress state
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [topicProgress, setTopicProgress] = useState({}); // topicId: { attempted, correct, mastered }
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [recentWrong, setRecentWrong] = useState(0);
  const [comebackAchieved, setComebackAchieved] = useState(false);

  // Current lesson
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(null); // null, 'correct', 'incorrect'
  const [explanation, setExplanation] = useState("");
  const [problemsInSession, setProblemsInSession] = useState(0);
  const [correctInSession, setCorrectInSession] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // UI state
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info", visible: false });
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizStep, setQuizStep] = useState(0);

  const inputRef = useRef(null);

  // ─── Toast Helper ───────────────────────────────────────────────────────

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }, []);

  // ─── Achievement Checker ────────────────────────────────────────────────

  const checkAchievements = useCallback(
    (stats) => {
      const newUnlocked = [];
      ACHIEVEMENTS.forEach((a) => {
        if (!unlockedAchievements.includes(a.id) && a.check(stats)) {
          newUnlocked.push(a.id);
        }
      });
      if (newUnlocked.length > 0) {
        setUnlockedAchievements((prev) => [...prev, ...newUnlocked]);
        const ach = ACHIEVEMENTS.find((a) => a.id === newUnlocked[0]);
        setTimeout(() => {
          showToast(`${ach.icon} Achievement: ${ach.title}!`, "achievement");
        }, 800);
      }
    },
    [unlockedAchievements, showToast]
  );

  // ─── AI Problem Generation ─────────────────────────────────────────────

  const generateProblem = useCallback(
    async (topicId) => {
      setIsLoading(true);
      const topic = ALL_TOPICS.find((t) => t.id === topicId);
      const progress = topicProgress[topicId] || { attempted: 0, correct: 0, mastered: false };
      const accuracy = progress.attempted > 0 ? Math.round((progress.correct / progress.attempted) * 100) : 50;

      const styleInstructions = {
        visual: "Include a visual representation or diagram description. Use number lines, tables, or coordinate descriptions where possible. Format the problem so it's visually clear with spacing.",
        stepByStep: "Structure the explanation as numbered micro-steps. Each step should be one tiny action. Never skip steps. Show every single operation.",
        realWorld: "Frame the problem as a real-world scenario a teenager would relate to (shopping, social media followers, music streaming, sports stats, saving money for something). Make it feel relevant.",
        practice: "Keep the problem concise and direct. Focus on clear, quick-to-solve format. Provide a brief but complete explanation.",
      };

      const difficultyGuide =
        accuracy > 85
          ? "Make this problem CHALLENGING - at the harder end of this topic. Include a twist or extra step."
          : accuracy > 60
          ? "Make this problem MEDIUM difficulty - straightforward but requires understanding."
          : "Make this problem EASIER - focus on the core concept with simple numbers. Build confidence.";

      const systemPrompt = `You are an expert algebra tutor creating problems for a high school junior. You are patient, encouraging, and break things down clearly.

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown, no backticks, no extra text
- The JSON must have exactly these fields: question, options (array of 4 strings), correctIndex (0-3), explanation, hint
- ${styleInstructions[learningStyle] || styleInstructions.practice}
- ${difficultyGuide}
- Make explanations warm and encouraging. Use phrases like "Great question!", "Here's the trick...", "You've got this!"
- Keep the question text clear and not too long
- The hint should be a gentle nudge without giving the answer away`;

      const userPrompt = `Create a multiple-choice algebra problem for the topic: "${topic.title}" (${topic.desc}).

Student accuracy on this topic so far: ${accuracy}% across ${progress.attempted} problems.

Return JSON format:
{"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "...", "hint": "..."}`;

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        const data = await response.json();
        const text = data.content?.map((i) => i.text || "").join("") || "";
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        setCurrentProblem(parsed);
      } catch (err) {
        console.error("Problem generation error:", err);
        // Fallback problem
        setCurrentProblem({
          question: `Solve for x: 2x + 6 = 14`,
          options: ["x = 3", "x = 4", "x = 5", "x = 10"],
          correctIndex: 1,
          explanation: "Subtract 6 from both sides: 2x = 8. Then divide both sides by 2: x = 4. You've got this! \u{1F4AA}",
          hint: "Start by getting the x term alone on one side.",
        });
      }
      setIsLoading(false);
    },
    [learningStyle, topicProgress]
  );

  // ─── Answer Handling ────────────────────────────────────────────────────

  const handleAnswer = useCallback(
    (optionIndex) => {
      if (showResult || !currentProblem) return;

      setSelectedOption(optionIndex);
      const isCorrect = optionIndex === currentProblem.correctIndex;
      const newAttempted = totalAttempted + 1;
      const newCorrect = totalCorrect + (isCorrect ? 1 : 0);
      const newStreak = isCorrect ? streak + 1 : 0;
      const newBestStreak = Math.max(bestStreak, newStreak);
      const comboBonus = newStreak >= COMBO_THRESHOLD ? XP_PER_STREAK_BONUS * (newStreak - COMBO_THRESHOLD + 1) : 0;
      const xpGain = isCorrect ? XP_PER_CORRECT + comboBonus : 0;
      const newXp = xp + xpGain;
      const oldLevel = getLevel(xp);
      const newLevel = getLevel(newXp);

      // Track wrong answers for comeback achievement
      let newRecentWrong = isCorrect ? (recentWrong >= 2 ? 0 : recentWrong) : recentWrong + 1;
      let newComeback = comebackAchieved;
      if (isCorrect && newStreak >= 3 && recentWrong >= 2) {
        newComeback = true;
        newRecentWrong = 0;
      }

      setTotalAttempted(newAttempted);
      setTotalCorrect(newCorrect);
      setStreak(newStreak);
      setBestStreak(newBestStreak);
      setXp(newXp);
      setRecentWrong(newRecentWrong);
      setComebackAchieved(newComeback);
      setProblemsInSession((p) => p + 1);
      if (isCorrect) setCorrectInSession((c) => c + 1);

      // Update topic progress
      const tp = topicProgress[currentTopic] || { attempted: 0, correct: 0, mastered: false };
      const newTp = {
        attempted: tp.attempted + 1,
        correct: tp.correct + (isCorrect ? 1 : 0),
        mastered: tp.mastered || (tp.attempted >= 4 && ((tp.correct + (isCorrect ? 1 : 0)) / (tp.attempted + 1)) * 100 >= MASTERY_THRESHOLD),
      };
      const newTopicProgress = { ...topicProgress, [currentTopic]: newTp };
      setTopicProgress(newTopicProgress);

      const topicsMastered = Object.values(newTopicProgress).filter((t) => t.mastered).length;

      // Session history
      setSessionHistory((h) => [
        ...h,
        { question: currentProblem.question, correct: isCorrect, answer: currentProblem.options[optionIndex] },
      ]);

      // Show result
      setShowResult(isCorrect ? "correct" : "incorrect");
      setExplanation(currentProblem.explanation);

      if (isCorrect) {
        showToast(
          newStreak >= COMBO_THRESHOLD
            ? `\u{1F525} ${newStreak}x Combo! +${xpGain} XP`
            : `\u2705 Correct! +${XP_PER_CORRECT} XP`,
          "success"
        );
        if (newStreak >= 3) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2500);
        }
      } else {
        showToast("Not quite \u2014 check the explanation below!", "error");
      }

      // Level up notification
      if (newLevel > oldLevel) {
        setTimeout(() => {
          showToast(`\u{1F389} LEVEL UP! You're now Level ${newLevel}!`, "levelup");
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }, 1500);
      }

      // Mastery notification
      if (newTp.mastered && !tp.mastered) {
        setTimeout(() => {
          showToast(`\u{1F3C6} Topic Mastered: ${ALL_TOPICS.find((t) => t.id === currentTopic)?.title}!`, "achievement");
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }, 2000);
      }

      // Check achievements
      checkAchievements({
        totalCorrect: newCorrect,
        totalAttempted: newAttempted,
        bestStreak: newBestStreak,
        topicsMastered,
        level: newLevel,
        comebackAchieved: newComeback,
      });
    },
    [showResult, currentProblem, totalAttempted, totalCorrect, streak, bestStreak, xp, recentWrong, comebackAchieved, topicProgress, currentTopic, checkAchievements, showToast]
  );

  const nextProblem = useCallback(() => {
    setShowResult(null);
    setSelectedOption(null);
    setExplanation("");
    setUserAnswer("");
    generateProblem(currentTopic);
  }, [currentTopic, generateProblem]);

  // ─── Learning Style Quiz ────────────────────────────────────────────────

  const QUIZ_QUESTIONS = [
    {
      q: "When someone explains a new idea, you understand best when they\u2026",
      options: [
        { text: "Draw it out or show a picture", style: "visual" },
        { text: "Walk through it one step at a time", style: "stepByStep" },
        { text: "Give a real-life example", style: "realWorld" },
        { text: "Let you try it yourself right away", style: "practice" },
      ],
    },
    {
      q: "If you had to learn a new phone feature, you'd rather\u2026",
      options: [
        { text: "Watch a video tutorial", style: "visual" },
        { text: "Follow written step-by-step instructions", style: "stepByStep" },
        { text: "Hear why it's useful in daily life first", style: "realWorld" },
        { text: "Just tap around and figure it out", style: "practice" },
      ],
    },
    {
      q: "In math class, what bugs you the most?",
      options: [
        { text: "When there's no graph or picture to look at", style: "visual" },
        { text: "When the teacher skips steps", style: "stepByStep" },
        { text: "When they don't explain WHY it matters", style: "realWorld" },
        { text: "Too much talking, not enough doing", style: "practice" },
      ],
    },
    {
      q: "When studying for a test, you prefer to\u2026",
      options: [
        { text: "Make colorful notes or mind maps", style: "visual" },
        { text: "Rewrite notes in order", style: "stepByStep" },
        { text: "Think about how topics connect to life", style: "realWorld" },
        { text: "Do as many practice problems as possible", style: "practice" },
      ],
    },
  ];

  const handleQuizAnswer = (style) => {
    const newAnswers = [...quizAnswers, style];
    setQuizAnswers(newAnswers);

    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Calculate dominant style
      const counts = {};
      newAnswers.forEach((s) => (counts[s] = (counts[s] || 0) + 1));
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setLearningStyle(dominant);
      setScreen("dashboard");
    }
  };

  // ─── Start Lesson ──────────────────────────────────────────────────────

  const startLesson = (topicId) => {
    setCurrentTopic(topicId);
    setProblemsInSession(0);
    setCorrectInSession(0);
    setShowResult(null);
    setSelectedOption(null);
    setExplanation("");
    setSessionHistory([]);
    setScreen("lesson");
    generateProblem(topicId);
  };

  // ─── Check Topic Availability ──────────────────────────────────────────

  const isTopicUnlocked = (topicId) => {
    const idx = ALL_TOPICS.findIndex((t) => t.id === topicId);
    if (idx === 0) return true;
    const prevTopic = ALL_TOPICS[idx - 1];
    const prevProgress = topicProgress[prevTopic.id];
    return prevProgress?.mastered === true;
  };

  const getTopicStatus = (topicId) => {
    const progress = topicProgress[topicId];
    if (!progress) return "new";
    if (progress.mastered) return "mastered";
    if (progress.attempted > 0) return "in_progress";
    return "new";
  };

  // ─── Render Helpers ────────────────────────────────────────────────────

  const level = getLevel(xp);
  const xpProgress = getXpProgress(xp);

  const topicsMasteredCount = Object.values(topicProgress).filter((t) => t.mastered).length;
  const totalTopics = ALL_TOPICS.length;

  // ─── Screens ──────────────────────────────────────────────────────────

  // WELCOME SCREEN
  if (screen === "welcome") {
    return (
      <div style={styles.container}>
        <style>{globalStyles}</style>
        <div style={styles.welcomeWrapper}>
          <div style={styles.welcomeGlow} />
          <div style={styles.welcomeCard}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>{"\u{1F3AE}"}</div>
            <h1 style={styles.welcomeTitle}>
              Algebra<span style={{ color: "#4ECDC4" }}>Quest</span>
            </h1>
            <p style={styles.welcomeSubtitle}>Master Algebra Your Way</p>
            <p style={styles.welcomeDesc}>
              A personalized math journey that adapts to how YOU learn best. Level up, earn achievements, and conquer Algebra 2 one topic at a time.
            </p>
            <div style={{ marginTop: 32, width: "100%", maxWidth: 320 }}>
              <input
                type="text"
                placeholder="Enter your name\u2026"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={styles.nameInput}
                onKeyDown={(e) => e.key === "Enter" && playerName.trim() && setScreen("quiz")}
              />
              <button
                onClick={() => playerName.trim() && setScreen("quiz")}
                disabled={!playerName.trim()}
                style={{
                  ...styles.primaryBtn,
                  opacity: playerName.trim() ? 1 : 0.4,
                  cursor: playerName.trim() ? "pointer" : "not-allowed",
                  width: "100%",
                  marginTop: 12,
                }}
              >
                Start Your Journey {"\u2192"}
              </button>
            </div>
            <div style={styles.featureRow}>
              <div style={styles.featureChip}>{"\u{1F3AF}"} Mastery-Based</div>
              <div style={styles.featureChip}>{"\u{1F9E0}"} Adaptive AI</div>
              <div style={styles.featureChip}>{"\u{1F3C6}"} Gamified</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LEARNING STYLE QUIZ
  if (screen === "quiz") {
    const q = QUIZ_QUESTIONS[quizStep];
    return (
      <div style={styles.container}>
        <style>{globalStyles}</style>
        <div style={styles.quizWrapper}>
          <div style={styles.quizCard}>
            <div style={{ marginBottom: 24 }}>
              <p style={styles.quizLabel}>Learning Style Discovery</p>
              <div style={styles.quizProgress}>
                <div style={{ ...styles.quizProgressBar, width: `${((quizStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
              </div>
              <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 6 }}>
                Question {quizStep + 1} of {QUIZ_QUESTIONS.length}
              </p>
            </div>
            <h2 style={styles.quizQuestion}>{q.q}</h2>
            <div style={styles.quizOptions}>
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => handleQuizAnswer(opt.style)} style={styles.quizOption}>
                  <span style={styles.quizOptionLetter}>{String.fromCharCode(65 + i)}</span>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACHIEVEMENTS SCREEN
  if (screen === "achievements") {
    return (
      <div style={styles.container}>
        <style>{globalStyles}</style>
        <div style={styles.screenPad}>
          <button onClick={() => setScreen("dashboard")} style={styles.backBtn}>
            {"\u2190"} Back to Dashboard
          </button>
          <h2 style={styles.sectionTitle}>
            {"\u{1F3C6}"} Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </h2>
          <div style={styles.achievementGrid}>
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedAchievements.includes(a.id);
              return (
                <div key={a.id} style={{ ...styles.achievementCard, opacity: unlocked ? 1 : 0.35 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{unlocked ? a.icon : "\u{1F512}"}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#F1F5F9" }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>{a.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // LESSON SCREEN
  if (screen === "lesson") {
    const topic = ALL_TOPICS.find((t) => t.id === currentTopic);
    const tp = topicProgress[currentTopic] || { attempted: 0, correct: 0, mastered: false };
    const accuracy = tp.attempted > 0 ? Math.round((tp.correct / tp.attempted) * 100) : 0;

    return (
      <div style={styles.container}>
        <style>{globalStyles}</style>
        <Confetti active={showConfetti} />
        <Toast {...toast} />

        <div style={styles.lessonWrapper}>
          {/* Top Bar */}
          <div style={styles.lessonTopBar}>
            <button onClick={() => setScreen("dashboard")} style={styles.backBtnSmall}>
              {"\u2190"} Back
            </button>
            <div style={styles.lessonStats}>
              <span style={styles.statBadge}>{"\u{1F525}"} {streak}</span>
              <span style={styles.statBadge}>{"\u2B50"} {xp} XP</span>
              <span style={styles.statBadge}>
                {"\u{1F4CA}"} {correctInSession}/{problemsInSession}
              </span>
            </div>
          </div>

          {/* XP Bar */}
          <div style={styles.miniXpBar}>
            <div style={{ ...styles.miniXpFill, width: `${xpProgress}%` }} />
            <span style={styles.miniXpLabel}>Lv {level}</span>
          </div>

          {/* Topic Header */}
          <div style={styles.lessonHeader}>
            <h2 style={styles.lessonTitle}>{topic?.title}</h2>
            <p style={styles.lessonDesc}>{topic?.desc}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ ...styles.tagPill, background: "#1E293B" }}>
                Mastery: {accuracy}% {tp.mastered ? "\u2705" : `(need ${MASTERY_THRESHOLD}%)`}
              </span>
              <span style={{ ...styles.tagPill, background: "#1E293B" }}>
                Attempted: {tp.attempted}
              </span>
              <span style={{ ...styles.tagPill, background: LEARNING_STYLES[learningStyle]?.label ? "#2D1B69" : "#1E293B" }}>
                {LEARNING_STYLES[learningStyle]?.icon} {LEARNING_STYLES[learningStyle]?.label}
              </span>
            </div>
          </div>

          {/* Problem Area */}
          <div style={styles.problemCard}>
            {isLoading ? (
              <div style={styles.loadingArea}>
                <div style={styles.spinner} />
                <p style={{ color: "#94A3B8", marginTop: 16 }}>Generating a problem just for you...</p>
              </div>
            ) : currentProblem ? (
              <>
                <div style={styles.questionText}>{currentProblem.question}</div>

                {/* Hint Button */}
                {!showResult && (
                  <button
                    onClick={() => showToast(`\u{1F4A1} Hint: ${currentProblem.hint}`, "info")}
                    style={styles.hintBtn}
                  >
                    {"\u{1F4A1}"} Need a hint?
                  </button>
                )}

                {/* Options */}
                <div style={styles.optionsGrid}>
                  {currentProblem.options.map((opt, i) => {
                    let optStyle = { ...styles.optionBtn };
                    if (showResult) {
                      if (i === currentProblem.correctIndex) {
                        optStyle = { ...optStyle, ...styles.optionCorrect };
                      } else if (i === selectedOption && showResult === "incorrect") {
                        optStyle = { ...optStyle, ...styles.optionIncorrect };
                      } else {
                        optStyle = { ...optStyle, opacity: 0.4 };
                      }
                    } else if (i === selectedOption) {
                      optStyle = { ...optStyle, borderColor: "#A855F7", background: "#2D1B69" };
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => !showResult && handleAnswer(i)}
                        disabled={!!showResult}
                        style={optStyle}
                      >
                        <span style={styles.optionLetter}>{String.fromCharCode(65 + i)}</span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {showResult && i === currentProblem.correctIndex && <span>{"\u2705"}</span>}
                        {showResult === "incorrect" && i === selectedOption && <span>{"\u274C"}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showResult && (
                  <div
                    style={{
                      ...styles.explanationBox,
                      borderColor: showResult === "correct" ? "#10B981" : "#EF4444",
                      background: showResult === "correct" ? "#052E16" : "#450A0A",
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: showResult === "correct" ? "#6EE7B7" : "#FCA5A5" }}>
                      {showResult === "correct" ? "\u{1F389} Awesome work!" : "\u{1F4D6} Let's learn from this:"}
                    </p>
                    <p style={{ color: "#E2E8F0", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{explanation}</p>
                  </div>
                )}

                {/* Next Button */}
                {showResult && (
                  <button onClick={nextProblem} style={{ ...styles.primaryBtn, width: "100%", marginTop: 16 }}>
                    Next Problem {"\u2192"}
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ──────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <style>{globalStyles}</style>
      <Confetti active={showConfetti} />
      <Toast {...toast} />

      <div style={styles.dashWrapper}>
        {/* Header */}
        <div style={styles.dashHeader}>
          <div>
            <h1 style={styles.dashTitle}>
              Hey {playerName}! <span style={{ fontSize: 28 }}>{"\u{1F44B}"}</span>
            </h1>
            <p style={styles.dashSub}>
              {LEARNING_STYLES[learningStyle]?.icon} {LEARNING_STYLES[learningStyle]?.label} {"\u00B7"} Level {level}
            </p>
          </div>
          <button onClick={() => setScreen("achievements")} style={styles.achieveBtn}>
            {"\u{1F3C6}"} {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </button>
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>{"\u2B50"}</div>
            <div style={styles.statValue}>{xp}</div>
            <div style={styles.statLabel}>Total XP</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>{"\u{1F525}"}</div>
            <div style={styles.statValue}>{bestStreak}</div>
            <div style={styles.statLabel}>Best Streak</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>{"\u{1F4CA}"}</div>
            <div style={styles.statValue}>{totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}%</div>
            <div style={styles.statLabel}>Accuracy</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>{"\u{1F3C6}"}</div>
            <div style={styles.statValue}>
              {topicsMasteredCount}/{totalTopics}
            </div>
            <div style={styles.statLabel}>Mastered</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div style={styles.xpBarContainer}>
          <div style={styles.xpBarHeader}>
            <span style={{ color: "#F59E0B", fontWeight: 700 }}>Level {level}</span>
            <span style={{ color: "#94A3B8", fontSize: 13 }}>
              {getXpInLevel(xp)}/{XP_PER_LEVEL} XP to Level {level + 1}
            </span>
          </div>
          <div style={styles.xpBarTrack}>
            <div style={{ ...styles.xpBarFill, width: `${xpProgress}%` }} />
          </div>
        </div>

        {/* Overall Progress */}
        <div style={styles.overallProgress}>
          <div style={styles.overallBar}>
            <div
              style={{
                ...styles.overallFill,
                width: `${totalTopics > 0 ? (topicsMasteredCount / totalTopics) * 100 : 0}%`,
              }}
            />
          </div>
          <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 6 }}>
            Overall Journey: {topicsMasteredCount} of {totalTopics} topics mastered
          </p>
        </div>

        {/* Curriculum */}
        {CURRICULUM.map((section) => (
          <div key={section.id} style={styles.sectionBlock}>
            <h2 style={{ ...styles.sectionHeader, color: section.color }}>
              {section.icon} {section.title}
            </h2>
            <div style={styles.topicList}>
              {section.topics.map((topic) => {
                const unlocked = isTopicUnlocked(topic.id);
                const status = getTopicStatus(topic.id);
                const tp = topicProgress[topic.id] || { attempted: 0, correct: 0, mastered: false };
                const accuracy = tp.attempted > 0 ? Math.round((tp.correct / tp.attempted) * 100) : 0;

                return (
                  <button
                    key={topic.id}
                    onClick={() => unlocked && startLesson(topic.id)}
                    disabled={!unlocked}
                    style={{
                      ...styles.topicCard,
                      borderColor: status === "mastered" ? "#10B981" : status === "in_progress" ? section.color : unlocked ? "#334155" : "#1E293B",
                      opacity: unlocked ? 1 : 0.4,
                      cursor: unlocked ? "pointer" : "not-allowed",
                    }}
                  >
                    <div style={styles.topicCardInner}>
                      <div style={styles.topicIcon}>
                        {status === "mastered" ? "\u2705" : status === "in_progress" ? "\u{1F4DD}" : unlocked ? "\u{1F513}" : "\u{1F512}"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.topicName}>{topic.title}</div>
                        <div style={styles.topicDesc}>{topic.desc}</div>
                        {status !== "new" && unlocked && (
                          <div style={styles.topicMeter}>
                            <div style={{ ...styles.topicMeterFill, width: `${Math.min(accuracy, 100)}%`, background: accuracy >= MASTERY_THRESHOLD ? "#10B981" : section.color }} />
                          </div>
                        )}
                      </div>
                      {status !== "new" && unlocked && (
                        <div style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: "right" }}>
                          {accuracy}%
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={styles.footer}>
          <p style={{ color: "#475569", fontSize: 13 }}>
            AlgebraQuest {"\u2014"} Built with {"\u{1F49B}"} to help you succeed
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @keyframes confettiFall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes glowPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  button { font-family: 'Space Grotesk', sans-serif; }
  input { font-family: 'Space Grotesk', sans-serif; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0F172A; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
`;

const styles = {
  container: {
    fontFamily: "'Space Grotesk', sans-serif",
    background: "#0F172A",
    minHeight: "100vh",
    color: "#F1F5F9",
    position: "relative",
    overflow: "hidden",
  },

  // Welcome
  welcomeWrapper: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, position: "relative" },
  welcomeGlow: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, #4ECDC422 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    animation: "glowPulse 4s ease-in-out infinite",
  },
  welcomeCard: {
    textAlign: "center",
    maxWidth: 480,
    width: "100%",
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  welcomeTitle: { fontSize: 48, fontWeight: 800, letterSpacing: -2, color: "#F1F5F9", marginBottom: 4 },
  welcomeSubtitle: { fontSize: 18, color: "#94A3B8", fontWeight: 500, marginBottom: 16 },
  welcomeDesc: { fontSize: 15, color: "#64748B", lineHeight: 1.7, maxWidth: 400 },
  nameInput: {
    width: "100%",
    padding: "14px 20px",
    borderRadius: 12,
    border: "2px solid #334155",
    background: "#1E293B",
    color: "#F1F5F9",
    fontSize: 16,
    outline: "none",
    fontFamily: "'Space Grotesk', sans-serif",
    textAlign: "center",
  },
  featureRow: { display: "flex", gap: 10, marginTop: 32, flexWrap: "wrap", justifyContent: "center" },
  featureChip: {
    padding: "8px 16px",
    borderRadius: 20,
    background: "#1E293B",
    border: "1px solid #334155",
    fontSize: 13,
    fontWeight: 600,
    color: "#94A3B8",
  },

  // Quiz
  quizWrapper: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 },
  quizCard: { maxWidth: 520, width: "100%", padding: "32px 24px" },
  quizLabel: { color: "#4ECDC4", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 },
  quizProgress: { height: 6, background: "#1E293B", borderRadius: 3, overflow: "hidden" },
  quizProgressBar: { height: "100%", background: "linear-gradient(90deg, #4ECDC4, #22D3EE)", borderRadius: 3, transition: "width 0.5s ease" },
  quizQuestion: { fontSize: 22, fontWeight: 700, lineHeight: 1.4, color: "#F1F5F9", marginBottom: 28 },
  quizOptions: { display: "flex", flexDirection: "column", gap: 12 },
  quizOption: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 20px",
    borderRadius: 14,
    border: "2px solid #334155",
    background: "#1E293B",
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
  },
  quizOptionLetter: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    color: "#94A3B8",
    flexShrink: 0,
  },

  // Buttons
  primaryBtn: {
    padding: "14px 32px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #4ECDC4, #22D3EE)",
    color: "#0F172A",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    letterSpacing: 0.5,
  },
  backBtn: {
    padding: "10px 20px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "transparent",
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 24,
  },
  backBtnSmall: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "transparent",
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  hintBtn: {
    padding: "8px 18px",
    borderRadius: 10,
    border: "1px solid #F59E0B44",
    background: "#78350F22",
    color: "#FCD34D",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 12,
    marginBottom: 8,
  },
  achieveBtn: {
    padding: "10px 18px",
    borderRadius: 12,
    border: "2px solid #F59E0B44",
    background: "#78350F22",
    color: "#FCD34D",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  // Dashboard
  dashWrapper: { maxWidth: 720, margin: "0 auto", padding: "24px 20px" },
  dashHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  dashTitle: { fontSize: 28, fontWeight: 800, letterSpacing: -1 },
  dashSub: { color: "#94A3B8", fontSize: 14, marginTop: 4, fontWeight: 500 },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 },
  statCard: {
    padding: "16px 8px",
    borderRadius: 14,
    background: "#1E293B",
    border: "1px solid #334155",
    textAlign: "center",
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 800, color: "#F1F5F9" },
  statLabel: { fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: 1 },

  xpBarContainer: { marginBottom: 16, padding: "16px 20px", borderRadius: 14, background: "#1E293B", border: "1px solid #334155" },
  xpBarHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  xpBarTrack: { height: 10, background: "#334155", borderRadius: 5, overflow: "hidden" },
  xpBarFill: { height: "100%", background: "linear-gradient(90deg, #F59E0B, #FBBF24)", borderRadius: 5, transition: "width 0.5s ease" },

  overallProgress: { marginBottom: 28 },
  overallBar: { height: 6, background: "#1E293B", borderRadius: 3, overflow: "hidden" },
  overallFill: { height: "100%", background: "linear-gradient(90deg, #A855F7, #EC4899)", borderRadius: 3, transition: "width 0.5s ease" },

  sectionBlock: { marginBottom: 32 },
  sectionHeader: { fontSize: 20, fontWeight: 700, marginBottom: 14 },
  topicList: { display: "flex", flexDirection: "column", gap: 8 },
  topicCard: {
    padding: "14px 16px",
    borderRadius: 14,
    border: "2px solid #334155",
    background: "#1E293B",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    transition: "all 0.2s ease",
  },
  topicCardInner: { display: "flex", alignItems: "center", gap: 14 },
  topicIcon: { fontSize: 24, flexShrink: 0 },
  topicName: { fontWeight: 700, fontSize: 15, color: "#F1F5F9", marginBottom: 2 },
  topicDesc: { fontSize: 13, color: "#64748B" },
  topicMeter: { height: 4, background: "#334155", borderRadius: 2, overflow: "hidden", marginTop: 6, width: "100%" },
  topicMeterFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },

  tagPill: { padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#94A3B8" },

  // Lesson
  lessonWrapper: { maxWidth: 640, margin: "0 auto", padding: "16px 20px" },
  lessonTopBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  lessonStats: { display: "flex", gap: 8 },
  statBadge: { padding: "4px 12px", borderRadius: 8, background: "#1E293B", fontSize: 13, fontWeight: 600 },
  miniXpBar: { height: 4, background: "#1E293B", borderRadius: 2, overflow: "hidden", marginBottom: 20, position: "relative" },
  miniXpFill: { height: "100%", background: "linear-gradient(90deg, #F59E0B, #FBBF24)", borderRadius: 2, transition: "width 0.3s ease" },
  miniXpLabel: { position: "absolute", right: 0, top: -18, fontSize: 11, color: "#F59E0B", fontWeight: 700 },
  lessonHeader: { marginBottom: 24 },
  lessonTitle: { fontSize: 24, fontWeight: 800, letterSpacing: -0.5 },
  lessonDesc: { color: "#94A3B8", fontSize: 14, marginTop: 4 },

  problemCard: {
    padding: "28px 24px",
    borderRadius: 18,
    background: "#1E293B",
    border: "2px solid #334155",
    minHeight: 300,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.6,
    color: "#F1F5F9",
    whiteSpace: "pre-wrap",
    fontFamily: "'JetBrains Mono', monospace",
  },
  optionsGrid: { display: "flex", flexDirection: "column", gap: 10, marginTop: 24 },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 18px",
    borderRadius: 12,
    border: "2px solid #334155",
    background: "#0F172A",
    color: "#E2E8F0",
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    fontFamily: "'JetBrains Mono', monospace",
    width: "100%",
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    color: "#94A3B8",
    flexShrink: 0,
  },
  optionCorrect: { borderColor: "#10B981", background: "#052E16" },
  optionIncorrect: { borderColor: "#EF4444", background: "#450A0A" },

  explanationBox: {
    marginTop: 20,
    padding: "20px 24px",
    borderRadius: 14,
    border: "2px solid",
    lineHeight: 1.7,
  },

  loadingArea: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #334155",
    borderTopColor: "#4ECDC4",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  // Achievements
  screenPad: { maxWidth: 640, margin: "0 auto", padding: "24px 20px" },
  sectionTitle: { fontSize: 22, fontWeight: 800, marginBottom: 20 },
  achievementGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 },
  achievementCard: {
    padding: "20px 16px",
    borderRadius: 14,
    background: "#1E293B",
    border: "1px solid #334155",
    textAlign: "center",
    transition: "opacity 0.3s ease",
  },

  footer: { textAlign: "center", padding: "32px 0 16px", borderTop: "1px solid #1E293B", marginTop: 24 },
};
