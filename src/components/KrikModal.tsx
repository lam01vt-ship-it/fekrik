import { createPortal } from 'react-dom'

type KrikModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function KrikModal({ open, title, onClose, children, footer, size = 'md' }: KrikModalProps) {
  if (!open) return null
  return createPortal(
    <div className="krik-modal-root">
      <button type="button" className="krik-modal-backdrop" onClick={onClose} aria-label="Đóng hộp thoại" />
      <div
        className={`krik-modal-panel krik-modal-panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="krik-modal-title"
      >
        <div className="krik-modal-header">
          <h2 id="krik-modal-title" className="krik-modal-title">
            {title}
          </h2>
          <button type="button" className="krik-modal-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="krik-modal-body">{children}</div>
        {footer ? <div className="krik-modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

type MessageProps = {
  open: boolean
  variant: 'success' | 'error'
  title: string
  message: string
  onClose: () => void
}

export function KrikMessageModal({ open, variant, title, message, onClose }: MessageProps) {
  return (
    <KrikModal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <button type="button" className="krik-btn krik-btn--primary" onClick={onClose}>
          Đóng
        </button>
      }
    >
      <p className={variant === 'success' ? 'krik-notice-line krik-notice-line--ok' : 'krik-notice-line krik-notice-line--err'}>
        {message}
      </p>
    </KrikModal>
  )
}

type ConfirmProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function KrikConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  danger,
  onConfirm,
  onClose,
}: ConfirmProps) {
  return (
    <KrikModal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="krik-btn krik-btn--ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`krik-btn${danger ? ' krik-btn--danger' : ' krik-btn--primary'}`}
            onClick={() => {
              onConfirm()
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="krik-notice-line">{message}</p>
    </KrikModal>
  )
}
