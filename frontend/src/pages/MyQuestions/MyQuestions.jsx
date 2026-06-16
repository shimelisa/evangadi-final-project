/**
 * MyQuestions: displays only questions authored by the logged-in user.
 * Route: /my-questions
 * API: getQuestions({ mine: true }) → GET /api/questions?mine=true
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getQuestions } from '../../services/questions/question.service.js';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import styles from './MyQuestions.module.css';

const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
  return date.toLocaleDateString();
};

const getAvatarUrl = (firstName, lastName) =>
  `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;

export default function MyQuestions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [myQuestions, setMyQuestions] = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await getQuestions({ mine: true });
        setMyQuestions(res.data?.data ?? []);
      } catch {
        setError('Failed to fetch questions.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className={styles.page}>

      {/* ── Header card ── */}
      <div className={styles.headerCard}>
        <div>
          <p className={styles.eyebrow}>YOUR WORKSPACE</p>
          <h1 className={styles.title}>Your topics</h1>
          <p className={styles.sub}>
            Only questions you created. Open one to read answers or add
            follow-ups. Rows use the same left accent as your threads on Home.
          </p>
        </div>
        <button
          type='button'
          className={styles.newBtn}
          onClick={() => navigate('/questions/ask')}
        >
          <Plus size={15} aria-hidden />
          New question
        </button>
      </div>

      {/* ── Feed card ── */}
      <div className={styles.feedCard}>

        {/* Loading */}
        {isLoading && (
          <p className={styles.stateText}>Loading your questions...</p>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className={styles.errorBox}>
            <p>{error}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && myQuestions.length === 0 && (
          <div className={styles.emptyBox}>
            <p>
              You have not asked any questions yet. Use Ask a Question in the
              sidebar to start.
            </p>
          </div>
        )}

        {/* Question list */}
        {!isLoading && !error && myQuestions.length > 0 && (
          <ul className={styles.list}>
            {myQuestions.map((q) => (
              <li key={q.id ?? q.questionHash}>
                <button
                  type='button'
                  className={styles.qcard}
                  onClick={() => navigate(`/question/${q.questionHash}`)}
                >
                  <img
                    className={styles.qcard__avatar}
                    src={getAvatarUrl(q.author?.firstName, q.author?.lastName)}
                    alt={`${q.author?.firstName?.[0] ?? ''}${q.author?.lastName?.[0] ?? ''}`.toUpperCase()}
                  />
                  <div className={styles.qcard__body}>
                    <div className={styles.qcard__titleRow}>
                      <h3 className={styles.qcard__title}>{q.title}</h3>
                      <span className={styles.qcard__yours}>YOURS</span>
                    </div>
                    {q.content && (
                      <p className={styles.qcard__excerpt}>
                        {q.content.length > 160 ? q.content.slice(0, 160) + '…' : q.content}
                      </p>
                    )}
                    <div className={styles.qcard__meta}>
                      <span className={styles.qcard__metaItem}>
                        <MessageSquare size={12} aria-hidden />
                        {q.answerCount ?? 0} {q.answerCount === 1 ? 'reply' : 'replies'}
                      </span>
                      <span className={styles.qcard__metaItem}>
                        <Clock size={12} aria-hidden />
                        {formatDate(q.createdAt)} by You
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
