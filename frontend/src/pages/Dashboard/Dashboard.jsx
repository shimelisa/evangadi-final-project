/**
 * Dashboard: default home after login; question list, quick actions, URL-driven search.
 * Data: `questionService` (keyword `q`, semantic `semantic`, or full list).
 */
/**
 * Dashboard: default home after login; question list, quick actions, URL-driven search.
 * Data: `questionService` (keyword `q`, semantic `semantic`, or full list).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  getQuestions,
  semanticSearch,
} from "../../services/questions/question.service.js";
import styles from "./Dashboard.module.css";
import {
  PenSquare,
  Library,
  BookOpen,
} from "lucide-react";
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx'

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [questions, setQuestions] = useState([]);
  const [sortMode, setSortMode] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const firstName = user?.firstName?.trim();
  const welcomeLine = firstName
    ? `Good to see you, ${firstName}.`
    : "Welcome to the forum.";

  const fetchQuestions = useCallback(async (query = "", mode = "keyword") => {
    try {
      setIsLoading(true);
      setError(null);
      let res;
      if (!query) {
        res = await getQuestions({});
      } else if (mode === "semantic") {
        res = await semanticSearch(query);
      } else {
        res = await getQuestions({ q: query });
      }
      setQuestions(res.data?.data ?? []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load questions.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const semantic = searchParams.get("semantic") || "";
    if (semantic) {
      fetchQuestions(semantic, "semantic");
    } else {
      fetchQuestions(q, "keyword");
    }
  }, [searchParams, fetchQuestions]);

  // Derived stats
  const totalQuestions = questions.length;
  const totalReplies = questions.reduce(
    (sum, q) => sum + (q.answerCount ?? 0),
    0,
  );
  const unanswered = questions.filter((q) => (q.answerCount ?? 0) === 0).length;
  const yours = questions.filter((q) => q.author?.id === user?.id).length;

  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortMode === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const handleQuestionDelete = (questionHash) => {
    setQuestions((prev) => prev.filter((q) => q.questionHash !== questionHash));
  };

  return (
    <div className={styles.page}>
      {/* ── Top card ── */}
      <div className={styles.card}>
        {/* Hero area */}
        <div className={styles.hero}>
          <p className={styles.hero__eyebrow}>FORUM HOME</p>
          <h1 className={styles.hero__title}>{welcomeLine}</h1>
          <p className={styles.hero__sub}>
            Start a topic, revisit your own threads, or skim the live feed.
            Search above works from any page once you are back on Home.
          </p>
        </div>

        {/* Quick action cards */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.action}
            onClick={() => navigate("/questions/ask")}
          >
            <span className={styles.action__icon} aria-hidden>
              <PenSquare size={22} strokeWidth={1.75} />
            </span>
            <span className={styles.action__body}>
              <span className={styles.action__title}>New question</span>
              <span className={styles.action__desc}>
                Share context, errors, and what you already tried
              </span>
            </span>
          </button>

          <button
            type="button"
            className={styles.action}
            onClick={() => navigate("/my-questions")}
          >
            <span className={styles.action__icon} aria-hidden>
              <Library size={22} strokeWidth={1.75} />
            </span>
            <span className={styles.action__body}>
              <span className={styles.action__title}>Your topics</span>
              <span className={styles.action__desc}>
                Filtered list of threads you authored
              </span>
            </span>
          </button>

          <button
            type="button"
            className={styles.action}
            onClick={() => navigate("/rag-documents")}
          >
            <span className={styles.action__icon} aria-hidden>
              <BookOpen size={22} strokeWidth={1.75} />
            </span>
            <span className={styles.action__body}>
              <span className={styles.action__title}>Knowledge base</span>
              <span className={styles.action__desc}>
                Course library, uploads, and retrieval-backed context for
                threads
              </span>
            </span>
          </button>
        </div>

        {/* Divider */}
        <hr className={styles.divider} />

        {/* Stats */}
        <p className={styles.statsNote}>
          Figures below describe the newest threads in this feed (up to 100 from
          the API).
        </p>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.stat__label}>Questions</span>
            <span className={styles.stat__value}>{totalQuestions}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.stat__label}>Replies</span>
            <span className={styles.stat__value}>{totalReplies}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.stat__label}>Unanswered</span>
            <span className={styles.stat__value}>{unanswered}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.stat__label}>Yours</span>
            <span className={styles.stat__value}>{yours}</span>
          </div>
        </div>
      </div>

      {/* ── Feed card ── */}
      <div className={styles.card}>
        <div className={styles.feed__header}>
          <div>
            <h2 className={styles.feed__title}>Discussion feed</h2>
            <p className={styles.feed__sub}>
              Your threads use a slim left accent in this list.
            </p>
          </div>
          <button
            type="button"
            className={`${styles.feed__sortBtn} ${
              sortMode === "newest" ? styles["feed__sortBtn--active"] : ""
            }`}
            onClick={() =>
              setSortMode((m) => (m === "newest" ? "oldest" : "newest"))
            }
          >
            {sortMode === "newest" ? "NEWEST THREADS" : "OLDEST THREADS"}
          </button>
        </div>

        <hr className={styles.divider} />

        {/* Loading */}
        {isLoading && (
          <div className={styles.skeletons}>
            {[1, 2, 3].map((n) => (
              <div key={n} className={styles.skeleton} aria-hidden />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className={styles.error} role="alert">
            <p className={styles.error__title}>Something went wrong</p>
            <p className={styles.error__msg}>{error}</p>
            <button
              type="button"
              className={styles.error__retry}
              onClick={() => fetchQuestions()}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && questions.length === 0 && (
          <div className={styles.empty}>
            <p>No questions found. Be the first to ask!</p>
          </div>
        )}

        {/* Question list */}
        {!isLoading && !error && sortedQuestions.length > 0 && (
          <ul className={styles.list} aria-label="Questions">
            {sortedQuestions.map((q) => (
              <li key={q.id ?? q.questionHash}>
                <QuestionCard
                  question={q}
                  currentUser={user}
                  onClick={() => navigate(`/question/${q.questionHash}`)}
                  onDelete={handleQuestionDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
