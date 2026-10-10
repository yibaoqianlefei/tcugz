import { useId } from 'react';

export default function CompanionPet({ thinking = false }: { thinking?: boolean }) {
  const gradientId = useId();
  return <svg viewBox="0 0 100 106" className={`companion-pet${thinking ? ' is-thinking' : ''}`} aria-hidden="true">
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7186c2"/><stop offset="1" stopColor="#40548d"/></linearGradient></defs>
    <ellipse cx="51" cy="96" rx="27" ry="4" fill="#40548d" opacity=".12" />
    <path d="M26 76v13m48-13v13" stroke="#40548d" strokeWidth="7" strokeLinecap="round" />
    <path d="M18 54 10 66m72-12 8 7" stroke="#7186c2" strokeWidth="6" strokeLinecap="round" />
    <path d="m13 26 38-17 36 17-36 17Z" fill={`url(#${gradientId})`}/>
    <path d="M13 26v9l38 17 36-17v-9L51 43Z" fill="#40548d"/>
    <path d="M24 42h54v35c0 5-4 9-9 9H33c-5 0-9-4-9-9Z" fill="#f4f6ff" stroke="#7186c2" strokeWidth="2"/>
    <path d="M24 48h54" stroke="#d9e1f3" strokeWidth="2"/>
    <g className="companion-eyes" fill="#40548d"><rect x="35" y="56" width="6" height="10" rx="3"/><rect x="61" y="56" width="6" height="10" rx="3"/></g>
    <path d="M45 72q6 5 12 0" stroke="#7186c2" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M77 8v9m-4-4h8" stroke="#99aad2" strokeWidth="2" strokeLinecap="round"/>
  </svg>;
}
