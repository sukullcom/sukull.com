// src/components/ui/input.tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={props.id}>{label}</label>}
        <input
          {...props}
          ref={ref}
          className="border rounded px-3 py-2 focus:outline-none focus:ring"
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
