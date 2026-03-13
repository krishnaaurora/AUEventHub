npm rundev
import React from 'react';

const Announcement = ({ variant, onClick, children, disabled }) => {
  const className = `announcement ${variant} ${disabled ? 'disabled' : ''}`;

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Announcement;