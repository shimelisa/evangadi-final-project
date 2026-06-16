/**
 * AnswerCard: displays a single answer with author info and content.
 * Used in QuestionDetail.jsx
 * @param {Object} answer - The answer object
 */

import styles from './AnswerCard.module.css';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import { useState } from "react";
import { deleteAnswer } from '../../services/answers/answers.service';

const getAvatarUrl = (firstName, lastName) =>
  `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`;

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
};

  export default function AnswerCard({ answer: a, onDelete }) {
    // State for delete
    const [showModal, setShowModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // handler for delete
    const handleDelete = async () => {
      setIsDeleting(true);
      await deleteAnswer(a.id);
      setIsDeleting(false);
      setShowModal(false);
      onDelete(a.id); // ← tell parent to remove this answer
    };

  return (
    <li className={styles.card}>
      {/* Author */}
      <div className={styles.author}>
        <img
          className={styles.avatar}
          src={getAvatarUrl(a.author?.firstName, a.author?.lastName)}
          alt={`${a.author?.firstName?.[0] ?? ""}${a.author?.lastName?.[0] ?? ""}`.toUpperCase()}
        />
        <div>
          <p className={styles.name}>
            {a.author?.firstName} {a.author?.lastName}
          </p>
          <p className={styles.date}>{formatDate(a.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      <p className={styles.content}>{a.content}</p>

      {/* Delete button */}
      <button className={styles.deleteBtn} onClick={() => setShowModal(true)}>Delete</button>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showModal}
        title="Delete answer"
        message="Are you sure you want to delete this answer? This cannot be undone."
        confirmLabel="Delete"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </li>
  );
}
