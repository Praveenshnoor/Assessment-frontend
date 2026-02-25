import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  type = 'button',
  disabled = false,
  className = '',
  onClick
}) => {
  // Define our branded color styles based on the variant
  const baseStyles = "h-[50px] px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-shnoor-indigo text-white hover:bg-shnoor-navy shadow-[0_4px_14px_rgba(68,68,142,0.3)]",
    secondary: "bg-shnoor-lavender text-shnoor-navy hover:bg-shnoor-light",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
  };

  const disabledStyles = "bg-shnoor-lavender text-shnoor-soft cursor-not-allowed shadow-none";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${disabled ? disabledStyles : variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;