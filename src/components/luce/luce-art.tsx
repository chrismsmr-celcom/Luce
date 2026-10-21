import type { SVGProps } from "react";

/** Illustration de la page de connexion : le petit monde de Luce (village, collines, mail, agenda). */
export function LuceArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 720"
      fill="none"
      role="img"
      aria-label="Le village de Luce : des maisons rondes aux fenêtres à lunettes, des collines vertes et Luce au premier plan"
      preserveAspectRatio="xMaxYMax meet"
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
  </defs>
    <circle cx="372" cy="120" r="78" fill="#FFF1C9" opacity=".25"/>
  <circle cx="372" cy="120" r="56" fill="#FFF1C9"/>
  <g fill="#F5EBDD">
    <path d="M30 200a26 26 0 0 1 48-12 22 22 0 0 1 42 10 18 18 0 0 1-4 36H46a20 20 0 0 1-16-34z"/>
    <path d="M300 300a20 20 0 0 1 38-8 17 17 0 0 1 32 8 14 14 0 0 1-2 28h-56a14 14 0 0 1-12-28z" opacity=".9"/>
  </g>
    <g transform="rotate(-10 86 300)">
    <rect x="44" y="270" width="84" height="58" rx="10" fill="#fff"/>
    <path d="M48 278l38 27 38-27" stroke="#4472B8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="122" cy="272" r="10" fill="#E8695F"/>
  </g>
  <g transform="rotate(8 410 250)">
    <rect x="378" y="216" width="64" height="70" rx="10" fill="#fff"/>
    <path d="M378 226a10 10 0 0 1 10-10h44a10 10 0 0 1 10 10v14H378z" fill="#E8695F"/>
    <g fill="#4472B8"><circle cx="397" cy="258" r="4.5"/><circle cx="410" cy="258" r="4.5"/><circle cx="423" cy="258" r="4.5"/><circle cx="397" cy="272" r="4.5"/><circle cx="410" cy="272" r="4.5" fill="#6DBB6F"/></g>
  </g>
  <g fill="#FFF7E0">
    <path d="M200 170l6 15 15 6-15 6-6 15-6-15-15-6 15-6z"/>
    <path d="M450 370l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/>
    <path d="M30 400l4 10 10 4-10 4-4 10-4-10-10-4 10-4z"/>
  </g>
    <path d="M0 450Q110 360 240 410T480 390V720H0Z" fill="#3F8F4E"/>
  <g style={{ color: "#2F7D43" }}>
    <use href="#tree" transform="translate(52 400) scale(.7)"/>
    <use href="#tree" transform="translate(96 418) scale(.55)"/>
    <use href="#tree" transform="translate(436 392) scale(.7)"/>
  </g>
  <use href="#house" transform="translate(262 380) scale(.55)"/>
    <path d="M0 520Q150 410 310 480T480 460V720H0Z" fill="#5DAF5F"/>
  <g style={{ color: "#3F8F4E" }}>
    <use href="#tree" transform="translate(30 470) scale(.95)"/>
    <use href="#tree" transform="translate(206 476) scale(.75)"/>
    <use href="#tree" transform="translate(452 480) scale(1)"/>
  </g>
  <use href="#house" transform="translate(112 455) scale(.9)"/>
  <use href="#house" transform="translate(352 425) scale(1.15)"/>
    <path d="M250 720C190 670 340 630 280 585S236 520 300 492" stroke="#F5EBDD" strokeWidth="34" strokeLinecap="round" opacity=".95"/>
    <path d="M0 610Q190 530 480 590V720H0Z" fill="#7CC66F"/>
  <g style={{ color: "#5DAF5F" }}>
    <use href="#tree" transform="translate(430 600) scale(1.25)"/>
  </g>
  <g fill="#F6C453">
    <circle cx="330" cy="650" r="6"/><circle cx="360" cy="672" r="5"/><circle cx="300" cy="690" r="5"/><circle cx="410" cy="690" r="6"/>
  </g>
  <g fill="#E8695F"><circle cx="345" cy="690" r="5"/><circle cx="385" cy="650" r="5"/></g>
    <g transform="translate(40 400) scale(.55)">
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
