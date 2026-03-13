import React from 'react';
import './IconMarquee.css';

const icons = [
  /* 1 – tadpole / teardrop blob */
  <svg key="1" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M38 14C38 14 14 16 14 40C14 58 26 68 40 68C54 68 66 57 66 43C66 30 58 22 50 20C44 18 40 22 36 26C32 30 30 36 34 40C38 44 44 42 46 38C48 34 46 30 42 30C40 30 38 32 38 34"
      stroke="#2d3a4d" strokeWidth="0" fill="#2d3a4d"
    />
    <path
      fillRule="evenodd" clipRule="evenodd"
      d="M40 12C26 12 12 22 12 40C12 58 26 70 40 70C54 70 68 58 68 43C68 29 59 20 50 18C44 16 40 20 37 24C34 28 32 35 36 40C40 45 47 43 50 38C53 33 50 27 44 27C41 27 39 29 39 32"
      fill="#2d3a4d"
    />
    <ellipse cx="30" cy="52" rx="10" ry="14" fill="#2d3a4d" />
    <circle cx="52" cy="30" r="10" fill="#2d3a4d" />
    <path d="M18 38 Q28 20 46 20 Q32 14 18 38Z" fill="#2d3a4d" />
  </svg>,

  /* 2 – four-square grid with rounded notches */
  <svg key="2" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="24" height="24" rx="4" fill="#2d3a4d" />
    <rect x="44" y="12" width="24" height="24" rx="4" fill="#2d3a4d" />
    <rect x="12" y="44" width="24" height="24" rx="4" fill="#2d3a4d" />
    <rect x="44" y="44" width="24" height="24" rx="4" fill="#2d3a4d" />
    <circle cx="40" cy="40" r="9" fill="white" />
    <circle cx="40" cy="12" r="7" fill="white" />
    <circle cx="40" cy="68" r="7" fill="white" />
    <circle cx="12" cy="40" r="7" fill="white" />
    <circle cx="68" cy="40" r="7" fill="white" />
  </svg>,

  /* 3 – leaf / arc shape */
  <svg key="3" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 14 C14 14 14 66 66 66 C66 66 66 14 14 14Z"
      fill="#2d3a4d"
    />
    <path
      d="M14 14 C14 14 66 14 66 66"
      stroke="white" strokeWidth="14" strokeLinecap="round" fill="none"
    />
  </svg>,

  /* 4 – arrow / butterfly */
  <svg key="4" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M40 12 L66 40 L40 68 L40 50 C28 50 18 58 14 68 C14 50 20 28 40 30 Z"
      fill="#2d3a4d"
    />
    <path
      d="M40 12 L14 40 L40 68 L40 50 C52 50 62 58 66 68 C66 50 60 28 40 30 Z"
      fill="#2d3a4d"
    />
  </svg>,

  /* 5 – diagonal pill / band-aid */
  <svg key="5" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="10" y="28" width="60" height="24" rx="12"
      fill="#2d3a4d"
      transform="rotate(-20 40 40)"
    />
    <rect
      x="10" y="28" width="60" height="24" rx="12"
      fill="#2d3a4d"
      transform="rotate(20 40 40)"
    />
  </svg>,

  /* 6 – asterisk / snowflake */
  <svg key="6" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="36" y="10" width="8" height="60" rx="4" fill="#2d3a4d" />
    <rect x="36" y="10" width="8" height="60" rx="4" fill="#2d3a4d" transform="rotate(60 40 40)" />
    <rect x="36" y="10" width="8" height="60" rx="4" fill="#2d3a4d" transform="rotate(120 40 40)" />
  </svg>,
];

export default function IconMarquee() {
  const repeated = [...icons, ...icons, ...icons];

  return (
    <div className="icon-marquee-wrapper">
      <div className="icon-marquee-track">
        {repeated.map((icon, i) => (
          <div className="icon-marquee-item" key={i}>
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
}
