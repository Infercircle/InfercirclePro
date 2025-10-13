import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  withBlur?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, withBlur = false }) => {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center ${withBlur ? 'bg-black/70 backdrop-blur-md' : 'bg-black/60'}`}
      onClick={onClose} // Handle outside click here
    >
      <div
        className="bg-[#151820] rounded-2xl p-6 shadow-xl relative w-full max-w-[800px] max-w-[95vw] w-full mx-4 border border-[#23272b]"
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling
        style={{ maxHeight: '85xvh' }}
      >
        <div className="overflow-y-auto max-h-[75vh] pr-2">
          {children}
        </div>
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Modal;
 