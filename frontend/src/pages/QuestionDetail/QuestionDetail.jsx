/**
 * QuestionDetail: full question + answers + post answer form + AI answer fit.
 * Route: /question/:questionHash
 * API: getQuestion, assessAnswerFit (question.service), postAnswer (answer.service)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getQuestion, assessAnswerFit, getSimilarQuestions } from '../../services/questions/question.service.js';
import styles from './QuestionDetail.module.css';
import { ArrowLeft, Share2, MessageSquare, Sparkles } from 'lucide-react';
import AnswerCard from '../../components/AnswerCard/AnswerCard.jsx'

// ── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};

const getAvatarUrl = (firstName, lastName) =>
  `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;

export default function QuestionDetail() {
  const { questionHash } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── question state ──
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── answer form state ──
  const [answerText, setAnswerText] = useState("");
  const [answerError, setAnswerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── AI fit state ──
  const [fitResult, setFitResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await getQuestion(questionHash);
        setQuestion(res.data?.question);
        setAnswers(res.data?.answers ?? []);

        // fetch similar in background
        getSimilarQuestions(questionHash)
          .then((r) => setSimilar(r.data?.data ?? []))
          .catch(() => {});
      } catch {
        setError("Failed to load question details.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [questionHash]);

  // ── post answer ───────────────────────────────────────────────────────────
  const handlePostAnswer = async () => {
    if (answerText.trim().length < 20) {
      setAnswerError("Answer must be at least 20 characters.");
      return;
    }
    try {
      setIsSubmitting(true);
      setAnswerError(null);

      // dynamic import to avoid circular dep issues
      const { postAnswer } =
        await import("../../services/answers/answers.service.js");
      const res = await postAnswer({
        questionId: question.id,
        content: answerText,
      });
      const newAnswer = res.data?.data ?? res.data;
      setAnswers((prev) => [...prev, newAnswer]);
      setAnswerText("");
      setFitResult(null);
    } catch (err) {
      setAnswerError(
        err?.response?.data?.message ||
          "Failed to post answer. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── AI fit ────────────────────────────────────────────────────────────────
  const handleCheckFit = async () => {
    if (answerText.trim().length < 20) {
      setAnswerError("You need at least 20 characters.");
      return;
    }
    try {
      setIsChecking(true);
      setAnswerError(null);
      const res = await assessAnswerFit(questionHash, { answerText });
      setFitResult(res.data?.data ?? res.data);
    } catch {
      setAnswerError("AI fit check unavailable right now.");
    } finally {
      setIsChecking(false);
    }
  };

  // ── Answer deleted ────────────────────────────────────────────────────────
  const handleAnswerDeleted = (deletedId) => {
    setAnswers((prev) => prev.filter((a) => a.id !== deletedId));
  };

  // ── loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.centered}>
        <p className={styles.loadingText}>Loading question details...</p>
      </div>
    );
  }

  // ── error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.btnPrimary}
          onClick={() => navigate("/dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isOwn = question?.author?.id === user?.id;
  const answerCount = answers.length;

  return (
    <div className={styles.layout}>
      {/* ── Main column ── */}
      <div className={styles.main}>
        {/* Back */}
        <button className={styles.back} onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={15} aria-hidden /> Back to feed
        </button>

        {/* Question card */}
        <div className={styles.qcard}>
          <div className={styles.qcard__author}>
            <img
              className={styles.qcard__avatar}
              src={getAvatarUrl(
                question?.author?.firstName,
                question?.author?.lastName,
              )}
              alt={`${question?.author?.firstName} ${question?.author?.lastName}`}
            />
            <div>
              <p className={styles.qcard__name}>
                {question?.author?.firstName} {question?.author?.lastName}
              </p>
              <p className={styles.qcard__date}>
                Posted {formatDate(question?.createdAt)}
              </p>
            </div>
          </div>

          <h1 className={styles.qcard__title}>{question?.title}</h1>
          <p className={styles.qcard__content}>{question?.content}</p>

          <hr className={styles.divider} />

          <div className={styles.qcard__actions}>
            <button
              className={styles.actionBtn}
              onClick={() =>
                navigator.clipboard?.writeText(window.location.href)
              }
            >
              <Share2 size={14} aria-hidden /> Share
            </button>
            <button className={styles.actionBtn}>
              <MessageSquare size={14} aria-hidden />
              {answerCount} {answerCount === 1 ? "Answer" : "Answers"}
            </button>
          </div>
        </div>

        {/* Answers section */}
        <h2 className={styles.sectionTitle}>
          Community Answers ({answerCount})
        </h2>

        {/* Empty answers */}
        {answerCount === 0 && (
          <div className={styles.emptyAnswers}>
            <MessageSquare
              size={32}
              className={styles.emptyAnswers__icon}
              aria-hidden
            />
            <p className={styles.emptyAnswers__title}>Be the first to help!</p>
            <p className={styles.emptyAnswers__sub}>
              This question is waiting for an expert like you. Share your
              knowledge and earn reputation points.
            </p>
          </div>
        )}

        {/* Answer list */}
        {answerCount > 0 && (
          <ul className={styles.answerList}>
            {answers.map((a) => (
              <AnswerCard
                key={a.id}
                answer={a}
                onDelete={handleAnswerDeleted}
              />
            ))}
          </ul>
        )}

        {/* Answer form — hide if own question */}
        {isOwn ? (
          <div className={styles.ownNote}>
            You cannot answer your own question.
          </div>
        ) : (
          <div className={styles.answerForm}>
            <h3 className={styles.answerForm__title}>Contribute an answer</h3>

            {answerError && (
              <p className={styles.answerForm__error}>{answerError}</p>
            )}

            <div className={styles.editor}>
              <div className={styles.editor__toolbar}>
                <button type="button" className={styles.editor__tool}>
                  <strong>B</strong>
                </button>
                <button type="button" className={styles.editor__tool}>
                  <em>I</em>
                </button>
                <button type="button" className={styles.editor__tool}>
                  {"</>"}
                </button>
                <button type="button" className={styles.editor__tool}>
                  🔗
                </button>
                <span className={styles.editor__charCount}>
                  {answerText.length} characters
                </span>
              </div>
              <textarea
                className={styles.editor__textarea}
                placeholder="Type your answer here... You can use Markdown to format your code!"
                value={answerText}
                onChange={(e) => {
                  setAnswerText(e.target.value);
                  setAnswerError(null);
                  setFitResult(null);
                }}
                rows={8}
              />
            </div>

            {/* AI fit result */}
            {fitResult && (
              <div
                className={`${styles.fitPanel} ${styles[`fitPanel--${fitResult.level}`]}`}
              >
                <strong>{fitResult.level}</strong>
                {fitResult.note && <p>{fitResult.note}</p>}
              </div>
            )}

            <div className={styles.answerForm__footer}>
              <div className={styles.answerForm__footerLeft}>
                <button
                  type="button"
                  className={styles.coachBtn}
                  onClick={handleCheckFit}
                  disabled={isChecking}
                >
                  <Sparkles size={13} aria-hidden />
                  {isChecking ? "Checking…" : "Check draft fit"}
                </button>
                <span className={styles.coachNote}>
                  Relevance only. Not grading correctness. You need at least 20
                  characters.
                </span>
              </div>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handlePostAnswer}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Posting…" : "Post Your Answer"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebar__title}>Related Questions</h3>
        {similar.length === 0 && (
          <p className={styles.sidebar__empty}>No related questions found.</p>
        )}
        <ul className={styles.sidebar__list}>
          {similar.map((q) => (
            <li key={q.id ?? q.questionHash}>
              <button
                className={styles.sidebar__item}
                onClick={() => navigate(`/question/${q.questionHash}`)}
              >
                <p className={styles.sidebar__itemTitle}>{q.title}</p>
                <div className={styles.sidebar__itemMeta}>
                  <span>
                    {q.author?.firstName} {q.author?.lastName}
                  </span>
                  <span>{formatDate(q.createdAt)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
