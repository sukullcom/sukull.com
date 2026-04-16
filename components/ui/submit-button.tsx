import React from 'react';
import { Button } from './button';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  loadingText: string;
  loading: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ text, loadingText, loading, ...props }) => {
  return (
    <Button
      {...props}
      variant="primary"
      disabled={loading}
    >
      {loading ? loadingText : text}
    </Button>
  );
};

export default SubmitButton;
