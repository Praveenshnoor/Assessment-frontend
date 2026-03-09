import React from 'react';

const Badge = ({ status, text }) => {
  const styles = {
    published: "bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20", // Success Green
    draft: "bg-shnoor-lavender text-shnoor-navy border-shnoor-light", // Neutral Lavender
    active: "bg-shnoor-lavender text-shnoor-indigo border-shnoor-indigo/20", // Brand Indigo
    error: "bg-shnoor-dangerLight text-shnoor-danger border-shnoor-dangerLight" // Warning Red
  };

  // Default to 'draft' styling if status is not found
  const appliedStyle = styles[status] || styles.draft;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${appliedStyle}`}>
      {/* Optional: Add a little dot indicator before the text */}
      {status === 'published' && <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5"></span>}
      {text}
    </span>
  );
};

export default Badge;