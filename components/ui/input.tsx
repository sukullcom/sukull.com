// src/components/ui/input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input
        {...props}
        className="border rounded px-3 py-2 focus:outline-none focus:ring"
      />
    </div>
  );
};

export default Input;
