/**
 * QuestionCard: reusable question card used in Dashboard and MyQuestions.
 * @param {Object} question - The question object
 * @param {Object} currentUser - The logged-in user from AuthContext
 * @param {Function} onClick - Navigation handler
 */

import { MessageSquare, Clock } from "lucide-react";
import styles from "./QuestionCard.module.css";
import ConfirmModal from "../ConfirmModal/ConfirmModal"; // for delete
import { useState } from "react"; //for delete
import { deleteQuestion } from "../../services/questions/question.service.js"; //for delete

const getAvatarUrl = (firstName, lastName) =>
  `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
};

export default function QuestionCard({
  question: q,
  currentUser,
  onClick,
  onDelete,
}) {
  // State for delete
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // handler for delete
  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteQuestion(q.questionHash);
    setIsDeleting(false);
    setShowModal(false);
    onDelete(q.questionHash); // tell parent to remove it
  };

  // const handleDelete = async () => {
  //   setIsDeleting(true);

  //   console.log("Deleting question:", q.questionHash);

  //   setTimeout(() => {
  //     setIsDeleting(false);
  //     setShowModal(false);
  //     onDelete(q.questionHash);
  //   }, 500);
  // };

  const isOwn = q.author?.id === currentUser?.id;
  const initials =
    `${q.author?.firstName?.[0] ?? ""}${q.author?.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div
      className={`${styles.qcard} ${isOwn ? styles["qcard--own"] : ""}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* Avatar */}
      <img
        className={styles.qcard__avatar}
        src={getAvatarUrl(q.author?.firstName, q.author?.lastName)}
        alt={initials}
      />

      {/* Content */}
      <div className={styles.qcard__content}>
        <div className={styles.qcard__titleRow}>
          <h3
            className={styles.qcard__title}
            style={{ color: isOwn ? "#f97316" : "#111827" }}
          >
            {q.title}
          </h3>

          {isOwn && (
            <div className={styles.qcard__actions}>
              <span className={styles.qcard__yours}>YOURS</span>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        {q.content && (
          <p className={styles.qcard__excerpt}>
            {q.content.length > 120 ? q.content.slice(0, 120) + "…" : q.content}
          </p>
        )}
        <div className={styles.qcard__meta}>
          <span className={styles.qcard__metaItem}>
            <MessageSquare size={12} aria-hidden />
            {q.answerCount ?? 0} {q.answerCount === 1 ? "reply" : "replies"}
          </span>
          <span className={styles.qcard__metaItem}>
            <Clock size={12} aria-hidden />
            {formatDate(q.createdAt)} by{" "}
            {isOwn ? "You" : `${q.author?.firstName} ${q.author?.lastName}`}
          </span>
        </div>
      </div>
      <ConfirmModal
        isOpen={showModal}
        title="Delete question"
        message="Are you sure you want to delete this question? This cannot be undone."
        confirmLabel="Delete"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </div>
  );
}
