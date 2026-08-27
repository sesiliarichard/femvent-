import React, { useState, useRef, useEffect } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  as?: React.ElementType;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  as: Tag = 'span',
  className = '',
  multiline = false,
  placeholder = 'Click to edit',
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<any>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  if (editing) {
    return multiline ? (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`${className} w-full bg-yellow-50 border-2 border-blue-400 rounded outline-none resize-y`}
        rows={3}
      />
    ) : (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`${className} w-full bg-yellow-50 border-2 border-blue-400 rounded outline-none`}
      />
    );
  }

  return React.createElement(
    Tag,
    {
      onClick: () => setEditing(true),
      className: `${className} cursor-text outline-dashed outline-1 outline-transparent hover:outline-blue-400 hover:bg-blue-50/40 transition-colors rounded px-0.5`,
      title: 'Click to edit',
    },
    value || React.createElement('span', { className: 'text-gray-400 italic' }, placeholder)
  );
};