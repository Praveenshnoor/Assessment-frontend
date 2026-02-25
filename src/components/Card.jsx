import React from 'react';

const Card = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`
      bg-white 
      rounded-xl 
      border border-shnoor-light 
      shadow-[0_8px_30px_rgba(14,14,39,0.06)] 
      overflow-hidden
      ${noPadding ? '' : 'p-6'} 
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;