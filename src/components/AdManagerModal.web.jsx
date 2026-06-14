import React, { useEffect } from 'react';

export default function AdManagerModal({ visible, onAdFinished, onClose }) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onAdFinished?.();
      onClose?.();
    }, 350);
    return () => clearTimeout(timer);
  }, [visible, onAdFinished, onClose]);

  return null;
}
