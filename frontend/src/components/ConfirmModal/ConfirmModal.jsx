/**
 * ConfirmModal: reusable confirmation dialog.
 * Usage: delete answer, delete question, logout confirm, etc.
 * @param {boolean} isOpen - show/hide modal
 * @param {string} title - modal heading
 * @param {string} message - body text
 * @param {string} confirmLabel - confirm button text (default: 'Delete')
 * @param {boolean} isDanger - red confirm button (default: true)
 * @param {boolean} isLoading - disables buttons during async action
 * @param {Function} onConfirm - called when user confirms
 * @param {Function} onCancel - called when user cancels
 */

import styles from './ConfirmModal.module.css';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-title'
      >
        <h2 className={styles.title} id='modal-title'>{title}</h2>
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button
            type='button'
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type='button'
            className={`${styles.confirmBtn} ${isDanger ? styles['confirmBtn--danger'] : styles['confirmBtn--primary']}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
