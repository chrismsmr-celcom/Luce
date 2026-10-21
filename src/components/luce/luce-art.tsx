import type { SVGProps } from "react";

/**
 * Illustration plein cadre de la page de connexion : le petit monde de Luce.
 * Le ciel est transparent (c'est le fond rouge du panneau), les collines débordent
 * sur les côtés. À placer en `absolute inset-0 h-full w-full`.
 */
export function LuceArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 800"
      fill="none"
      role="img"
      aria-label="Le village de Luce : des maisons rondes aux fenêtres à lunettes, des collines vertes et Luce au premier plan"
      preserveAspectRatio="xMidYMax slice"
      {...props}
    >

  <defs>
    <g id="house">
      <rect x="-40" y="0" width="80" height="62" rx="16" fill="#F5EBDD"/>
      <rect x="16" y="-44" width="11" height="34" rx="4" fill="#8B5A3C"/>
      <path d="M-52 8Q0 -66 52 8Z" fill="#4472B8"/>
      <path d="M-30 -8Q-8 -40 14 -34" stroke="#6F96D6" strokeWidth="6" strokeLinecap="round"/>
      <circle cx="-17" cy="28" r="11" fill="#fff" stroke="#4472B8" strokeWidth="5"/>
      <circle cx="17" cy="28" r="11" fill="#fff" stroke="#4472B8" strokeWidth="5"/>
      <path d="M-6 28h12" stroke="#4472B8" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="-16" cy="30" r="4.5" fill="#1F2D4D"/>
      <circle cx="18" cy="30" r="4.5" fill="#1F2D4D"/>
      <path d="M-8 48q8 7 16 0" stroke="#1F2D4D" strokeWidth="3.5" strokeLinecap="round"/>
    </g>
    <g id="tree">
      <rect x="-5" y="0" width="10" height="34" rx="4" fill="#8B5A3C"/>
      <circle cx="0" cy="-8" r="26" fill="currentColor"/>
      <circle cx="-9" cy="-16" r="7" fill="#fff" opacity=".12"/>
    </g>
    <g id="cloud">
      <path d="M0 40a26 26 0 0 1 48-12 22 22 0 0 1 42 10 18 18 0 0 1-4 36H16A20 20 0 0 1 0 40z" fill="#F5EBDD"/>
    </g>
  </defs>
    <circle cx="735" cy="150" r="104" fill="#FFF1C9" opacity=".22"/>
  <circle cx="735" cy="150" r="72" fill="#FFF1C9"/>
    <use href="#cloud" transform="translate(500 160) scale(1.3)"/>
  <use href="#cloud" transform="translate(820 330) scale(.8)" opacity=".85"/>
  <use href="#cloud" transform="translate(40 330) scale(.9)" opacity=".7"/>
    <g fill="#FFF7E0">
    <path d="M470 290l7 18 18 7-18 7-7 18-7-18-18-7 18-7z"/>
    <path d="M860 450l5 12 12 5-12 5-5 12-5-12-12-5 12-5z"/>
    <path d="M120 420l5 12 12 5-12 5-5 12-5-12-12-5 12-5z"/>
    <path d="M640 80l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/>
  </g>
    <g transform="rotate(-10 590 300)">
    <rect x="540" y="268" width="100" height="70" rx="12" fill="#fff"/>
    <path d="M546 278l44 32 44-32" stroke="#4472B8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="634" cy="270" r="12" fill="#E8695F"/>
  </g>
  <g transform="rotate(8 790 330)">
    <rect x="752" y="290" width="76" height="84" rx="12" fill="#fff"/>
    <path d="M752 302a12 12 0 0 1 12-12h52a12 12 0 0 1 12 12v18H752z" fill="#E8695F"/>
    <g fill="#4472B8"><circle cx="774" cy="344" r="5.5"/><circle cx="790" cy="344" r="5.5"/><circle cx="806" cy="344" r="5.5"/><circle cx="774" cy="360" r="5.5"/><circle cx="790" cy="360" r="5.5" fill="#6DBB6F"/></g>
  </g>
  <circle cx="690" cy="236" r="26" fill="#fff"/>
  <path d="M678 237l9 9 15-18" stroke="#6DBB6F" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M0 470Q200 380 420 440T900 405V800H0Z" fill="#3F8F4E"/>
  <g style={{ color: "#2F7D43" }}>
    <use href="#tree" transform="translate(110 430) scale(.75)"/>
    <use href="#tree" transform="translate(160 446) scale(.55)"/>
    <use href="#tree" transform="translate(840 400) scale(.8)"/>
    <use href="#tree" transform="translate(690 420) scale(.6)"/>
  </g>
  <use href="#house" transform="translate(48 452) scale(.7)"/>
  <use href="#house" transform="translate(575 408) scale(.62)"/>
    <path d="M0 565Q260 450 520 530T900 495V800H0Z" fill="#5DAF5F"/>
  <g style={{ color: "#3F8F4E" }}>
    <use href="#tree" transform="translate(30 520) scale(1)"/>
    <use href="#tree" transform="translate(330 505) scale(.8)"/>
    <use href="#tree" transform="translate(865 505) scale(1.05)"/>
    <use href="#tree" transform="translate(560 500) scale(.7)"/>
  </g>
  <use href="#house" transform="translate(185 485) scale(1.3)"/>
  <use href="#house" transform="translate(430 470) scale(1)"/>
    <path d="M390 800C300 745 520 705 445 650S385 575 432 540" stroke="#F5EBDD" strokeWidth="44" strokeLinecap="round" opacity=".95"/>
    <path d="M0 690Q300 600 900 670V800H0Z" fill="#7CC66F"/>
  <g style={{ color: "#5DAF5F" }}>
    <use href="#tree" transform="translate(80 650) scale(1.3)"/>
    <use href="#tree" transform="translate(850 650) scale(1.3)"/>
  </g>
  <g fill="#F6C453">
    <circle cx="260" cy="740" r="7"/><circle cx="300" cy="765" r="6"/><circle cx="200" cy="775" r="6"/><circle cx="830" cy="770" r="7"/>
  </g>
  <g fill="#E8695F"><circle cx="230" cy="765" r="6"/><circle cx="330" cy="735" r="6"/><circle cx="790" cy="740" r="6"/></g>
    <g transform="translate(510 345) scale(.76)">
    <path d="M60 600c0-70 45-120 140-120s140 50 140 120z" fill="#1F2D4D"/>
    <path d="M165 482l35 40 35-40" fill="#F5EBDD"/>
    <rect x="172" y="395" width="56" height="95" rx="14" fill="#E9A06F"/>
    <circle cx="100" cy="335" r="22" fill="#F4B183"/>
    <circle cx="300" cy="335" r="22" fill="#F4B183"/>
    <circle cx="101" cy="337" r="10" fill="#E9A06F"/>
    <circle cx="299" cy="337" r="10" fill="#E9A06F"/>
    <rect x="95" y="250" width="210" height="165" rx="42" fill="#F4B183"/>
    <path d="M97 292V264Q150 232 212 222L256 188Q268 240 303 264V292Q200 262 97 292Z" fill="#8B5A3C"/>
    <path d="M222 240q22-10 40 2" stroke="#6DBB6F" strokeWidth="8" strokeLinecap="round"/>
    <rect x="112" y="302" width="76" height="62" rx="18" fill="#fff"/>
    <rect x="212" y="302" width="76" height="62" rx="18" fill="#fff"/>
    <circle cx="152" cy="336" r="15" fill="#1F2D4D"/>
    <circle cx="248" cy="336" r="15" fill="#1F2D4D"/>
    <circle cx="157" cy="330" r="5" fill="#fff"/>
    <circle cx="253" cy="330" r="5" fill="#fff"/>
    <g stroke="#4472B8" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round">
      <rect x="112" y="302" width="76" height="62" rx="18"/>
      <rect x="212" y="302" width="76" height="62" rx="18"/>
      <path d="M188 322h24"/><path d="M112 322l-14-4"/><path d="M288 322l14-4"/>
    </g>
    <ellipse cx="200" cy="380" rx="9" ry="6" fill="#E9A06F"/>
    <circle cx="128" cy="392" r="14" fill="#E8695F" opacity=".55"/>
    <circle cx="272" cy="392" r="14" fill="#E8695F" opacity=".55"/>
    <path d="M176 396q24 20 48 0" stroke="#1F2D4D" strokeWidth="5" strokeLinecap="round"/>
  </g>
    </svg>
  );
}
