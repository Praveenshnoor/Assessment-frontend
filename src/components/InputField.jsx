import React from 'react';

const InputField = ({
    label,
    type = 'text',
    placeholder,
    id,
    required = false,
    error,
    errorId,
    'aria-describedby': ariaDescribedBy,
    ...props
}) => {
    // Combine error description with any other aria-describedby
    const describedBy = [errorId || (error ? `${id}-error` : null), ariaDescribedBy]
        .filter(Boolean)
        .join(' ') || undefined;

    return (
        <div className="flex flex-col w-full mb-4">
            {label && (
                <label
                    htmlFor={id}
                    className="text-[11px] font-semibold text-shnoor-navy mb-1.5 uppercase tracking-wide flex items-center gap-1"
                >
                    {label}
                    {required && <span className="text-shnoor-danger" aria-hidden="true">*</span>}
                    {required && <span className="sr-only">(required)</span>}
                </label>
            )}

            <input
                id={id}
                type={type}
                placeholder={placeholder}
                required={required}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={describedBy}
                className={`w-full h-[50px] px-4 rounded-lg border bg-white text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:ring-1 transition-colors ${
                    error 
                        ? 'border-shnoor-danger focus:border-shnoor-danger focus:ring-shnoor-danger' 
                        : 'border-shnoor-light focus:border-shnoor-indigo focus:ring-shnoor-indigo'
                }`}
                {...props}
            />
            
            {error && (
                <p id={errorId || `${id}-error`} className="text-shnoor-danger text-sm mt-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default InputField;