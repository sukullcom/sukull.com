// src/components/custom/submit-button.tsx
import React from 'react';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  loadingText: string;
  loading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ text, loadingText, loading, ...props }) => {
  return (
    <button
      {...props}
      disabled={loading}
      className={`px-4 py-2 rounded ${
        loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
      } text-white focus:outline-none focus:ring`}
    >
      {loading ? loadingText : text}
    </button>
  );
};

export default SubmitButton;
