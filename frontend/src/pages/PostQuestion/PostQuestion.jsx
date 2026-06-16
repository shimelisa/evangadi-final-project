/**
 * PostQuestion: form to ask a new question with optional AI draft coach.
 * Routes: /questions/ask
 * API: createQuestion, generateQuestiongenerateQuestionDraftCoach (question.service.js)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import {
  createQuestion,
  generateQuestionDraftCoach,
} from '../../services/questions/question.service.js';
import styles from './PostQuestion.module.css';
import { CircleCheckBig } from "lucide-react";

// ── Validation ──────────────────────────────────────────────────────────────
const validate = ({ title, content }) => {
  const errors = {};
  if (!title.trim() || title.trim().length < 5)
    errors.title = 'Question title must be at least 5 characters';
  if (!content.trim() || content.trim().length < 10)
    errors.content = 'Question content must be at least 10 characters';
  return errors;
};

export default function PostQuestion() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ title: '', content: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successHash, setSuccessHash] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError(null);
  };

  // ── AI Draft Coach ─────────────────────────────────────────────────────────
  const handleCoach = async () => {
    const errors = validate(formData);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    try {
      setIsCoaching(true);
      setCoachFeedback(null);
      const res = await generateQuestionDraftCoach(formData);
      setCoachFeedback(res.data?.data ?? res.data);
    } catch {
      setError('AI suggestions unavailable right now.');
    } finally {
      setIsCoaching(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(formData);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await createQuestion(formData);
      const hash = res.data?.data?.questionHash ?? res.data?.questionHash;
      setSuccessHash(hash);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to post question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper} aria-hidden>
            <CircleCheckBig size={40} strokeWidth={2.25} color="#16a34a" />
          </div>
          <h2 className={styles.successTitle}>Thread published</h2>
          <p className={styles.successText}>
            Your post is indexed for keyword search and embedding-based
            similarity. Share the link in study groups, or stay on the thread to
            answer follow-up questions from peers.
          </p>
          <div className={styles.successActions}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
            {successHash && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate(`/question/${successHash}`)}
              >
                View Question
              </button>
            )}
            <button
              type="button"
              className={styles.btnOutline}
              onClick={() => {
                setSuccess(false);
                setSuccessHash(null);
                setFormData({ title: "", content: "" });
                setCoachFeedback(null);
              }}
            >
              Ask Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Page header */}
      <div className={styles.header}>
        <p className={styles.header__eyebrow}>ASK THE COHORT</p>
        <h1 className={styles.header__title}>Publish to the forum</h1>
        <p className={styles.header__sub}>
          Public threads help the whole cohort. Write as if a classmate will
          debug your issue tomorrow. They only know what you put on the page.
        </p>
      </div>

      {/* Guidelines card */}
      <div className={styles.guide}>
        <h2 className={styles.guide__title}>
          Write questions people can answer in one pass
        </h2>
        <p className={styles.guide__intro}>
          Mentors volunteer their time. Give them runnable context, expected vs
          actual behavior, and a tight scope so they can reproduce the issue
          without guessing your setup.
        </p>
        <h3 className={styles.guide__sub}>Checklist before you post</h3>
        <ul className={styles.guide__list}>
          <li><strong>Title as a headline</strong> that states the symptom and tech stack (e.g., "React 19: state resets after navigation").</li>
          <li><strong>Repro steps</strong> numbered, with environment (OS, browser, Node version) when it matters.</li>
          <li><strong>Minimal code</strong> in fenced markdown blocks; trim unrelated lines so readers scan faster.</li>
          <li><strong>Exact errors</strong> copied verbatim, including stack trace snippets when debugging backend routes.</li>
        </ul>
        <h3 className={styles.guide__sub}>Validation rules (enforced by the form)</h3>
        <ul className={styles.guide__list}>
          <li><strong>Title length:</strong> Must be between 5 and 255 characters.</li>
          <li><strong>Body length:</strong> Must contain a minimum of 10 characters detailing your problem.</li>
          <li><strong>Single topic:</strong> Split unrelated bugs into separate threads so search and embeddings stay precise.</li>
        </ul>
      </div>

      {/* Form card */}
      <form className={styles.formCard} onSubmit={handleSubmit} noValidate>

        {/* Error banner */}
        {error && (
          <div className={styles.errorBanner} role='alert'>{error}</div>
        )}

        {/* Title */}
        <div className={styles.field}>
          <label className={styles.field__label} htmlFor='title'>
            Title
          </label>
          <p className={styles.field__hint}>
            Be specific and imagine you're asking a question to another person.
          </p>
          <input
            id='title'
            type='text'
            className={`${styles.field__input} ${fieldErrors.title ? styles['field__input--error'] : ''}`}
            placeholder='e.g. How do I handle state management using Context API in React?'
            value={formData.title}
            onChange={handleChange('title')}
          />
          {fieldErrors.title && (
            <p className={styles.field__error}>{fieldErrors.title}</p>
          )}
        </div>

        {/* Content */}
        <div className={styles.field}>
          <label className={styles.field__label} htmlFor='content'>
            What are the details of your problem?
          </label>
          <p className={styles.field__hint}>
            Introduce the problem and expand on what you put in the title. Minimum 10 characters.
          </p>
          <div className={`${styles.editor} ${fieldErrors.content ? styles['editor--error'] : ''}`}>
            <div className={styles.editor__toolbar}>
              <button type='button' className={styles.editor__tool} title='Bold'>
                <strong>B</strong>
              </button>
              <button type='button' className={styles.editor__tool} title='Italic'>
                <em>I</em>
              </button>
              <button type='button' className={styles.editor__tool} title='Code'>
                {'</>'}
              </button>
              <button type='button' className={styles.editor__tool} title='Link'>
                🔗
              </button>
              <span className={styles.editor__charCount}>
                {formData.content.length} characters
              </span>
            </div>
            <textarea
              id='content'
              className={styles.editor__textarea}
              placeholder='Include all the information someone would need to answer your question... You can use Markdown to format your code!'
              value={formData.content}
              onChange={handleChange('content')}
              rows={8}
            />
          </div>
          {fieldErrors.content && (
            <p className={styles.field__error}>{fieldErrors.content}</p>
          )}
        </div>

        {/* AI Coach trigger */}
        <div className={styles.coachRow}>
          <button
            type='button'
            className={styles.coachBtn}
            onClick={handleCoach}
            disabled={isCoaching}
          >
            <Sparkles size={14} aria-hidden />
            {isCoaching ? 'Thinking…' : 'AI suggestions'}
          </button>
          <span className={styles.coachNote}>Suggestions only. You still choose what to post.</span>
        </div>

        {/* AI Coach feedback panel */}
        {coachFeedback && (
          <div className={styles.coachPanel}>
            {coachFeedback.feedback && (
              <p className={styles.coachPanel__text}>{coachFeedback.feedback}</p>
            )}
            {Array.isArray(coachFeedback.tips) && coachFeedback.tips.length > 0 && (
              <ul className={styles.coachPanel__list}>
                {coachFeedback.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type='button'
            className={styles.btnGhost}
            onClick={() => navigate('/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type='submit'
            className={styles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting…' : (
              <>
                Post Question <Send size={14} aria-hidden />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
