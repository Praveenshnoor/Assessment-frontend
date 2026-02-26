import React from 'react';

const InputField = ({
    label,
    type = 'text',
    placeholder,
    id,
    required = false,
    ...props
}) => {
    return (
        <div className="flex flex-col w-full mb-4">
            {label && (
                <label
                    htmlFor={id}
                    className="text-[11px] font-semibold text-shnoor-navy mb-1.5 uppercase tracking-wide flex items-center gap-1"
                >
                    {label}
                    {required && <span className="text-shnoor-danger">*</span>}
                </label>
            )}

            <input
                id={id}
                type={type}
                placeholder={placeholder}
                required={required}
                className="w-full h-[50px] px-4 rounded-lg border border-shnoor-light bg-white text-shnoor-navy placeholder-shnoor-soft focus:outline-none focus:border-shnoor-indigo focus:ring-1 focus:ring-shnoor-indigo transition-colors"
                {...props}
            />
        </div>
    );
};

export default InputField;