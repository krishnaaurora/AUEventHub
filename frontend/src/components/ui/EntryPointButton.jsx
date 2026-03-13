import React from "react";
import "./EntryPointButton.css";

export default function EntryPointButton({ onClick }) {
  return (
    <button className="Btn-Container" onClick={onClick}>
      <div className="text">Entry</div>
      <div className="icon-Container">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 12H19" stroke="#1d2129" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 5L19 12L12 19" stroke="#1d2129" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
}
