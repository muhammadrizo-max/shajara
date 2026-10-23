import React from 'react';

interface FamilyTreeLogoProps {
  className?: string;
  size?: number;
}

/**
 * 2-rasmdagi yangi zarhal (Gold Emblem) Oila Shajarasi logotipi:
 * - Markazda geometrik oltinrang barglar va shajaralar toji
 * - Tanada nafis xattotlik uslubidagi "Sh" (Shajara) harflari
 * - Pastda o'zaro to'qilgan mustahkam ildizlar
 * - Atrofda zarhalli rombsimon naqshlar
 */
export const FamilyTreeLogo: React.FC<FamilyTreeLogoProps> = ({ 
  className = "w-8 h-8", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        {/* Realistik oltinrang metall gradiyenti (Rich Metallic Gold Gradient) */}
        <linearGradient id="goldGradient" x1="50" y1="50" x2="450" y2="450" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5C158" />
          <stop offset="25%" stopColor="#C99738" />
          <stop offset="50%" stopColor="#F3DC82" />
          <stop offset="75%" stopColor="#B37D24" />
          <stop offset="100%" stopColor="#DFB74B" />
        </linearGradient>
        <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#8c6218" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#goldGlow)">
        {/* Atrofdagi 4 ta zarhal romb naqshlari (Side diamond accents) */}
        {/* Chapdagi romb */}
        <g transform="translate(135, 320)">
          <polygon points="0,-12 10,0 0,12 -10,0" fill="url(#goldGradient)" />
          <polygon points="0,-5 4,0 0,5 -4,0" fill="#ffffff" opacity="0.3" />
        </g>
        {/* O'ngdagi romb */}
        <g transform="translate(365, 320)">
          <polygon points="0,-12 10,0 0,12 -10,0" fill="url(#goldGradient)" />
          <polygon points="0,-5 4,0 0,5 -4,0" fill="#ffffff" opacity="0.3" />
        </g>

        {/* TEPADAGI GEOMETRIK ZARHAL BARGLAR VA TOJ QISMI (Crown of the Tree) */}
        {/* Eng yuqori markaziy barglar */}
        <path
          d="M250 80C240 100 240 120 250 145C260 120 260 100 250 80Z"
          fill="url(#goldGradient)"
        />
        <path
          d="M190 90C205 105 215 125 210 150C190 140 175 120 190 90Z"
          fill="url(#goldGradient)"
        />
        <path
          d="M310 90C325 120 310 140 290 150C285 125 295 105 310 90Z"
          fill="url(#goldGradient)"
        />

        {/* Qanot barglari (Outer side leaflets) */}
        <path
          d="M135 130C155 140 170 160 165 185C145 180 130 160 135 130Z"
          fill="url(#goldGradient)"
        />
        <path
          d="M365 130C370 160 355 180 335 185C330 160 345 140 365 130Z"
          fill="url(#goldGradient)"
        />
        <path
          d="M95 190C120 195 135 215 130 240C105 240 90 220 95 190Z"
          fill="url(#goldGradient)"
        />
        <path
          d="M405 190C410 220 395 240 370 240C365 215 380 195 405 190Z"
          fill="url(#goldGradient)"
        />

        {/* GEOMETRIK SHAXOBCHALAR (Symmetric Intersecting Gold Ribbons) */}
        {/* Markaziy M va V shaklidagi zarhallangan tasmalar */}
        <path
          d="M250 125L210 165L170 125L130 165L170 205L210 165L250 205L290 165L330 205L370 165L330 125L290 165L250 125Z"
          stroke="url(#goldGradient)"
          strokeWidth="11"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* O'rta qatordagi kengayuvchi qanotlar */}
        <path
          d="M130 165L90 205L130 245L170 205 M370 165L410 205L370 245L330 205"
          stroke="url(#goldGradient)"
          strokeWidth="11"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Markaziy Rombik Qalb (Central Diamond Core) */}
        <path
          d="M250 195L305 250L250 305L195 250Z"
          stroke="url(#goldGradient)"
          strokeWidth="11"
          strokeLinejoin="round"
        />

        {/* Pastki shox tarmog'i romb burchagidan tana tomon */}
        <path
          d="M195 250L150 295L210 295"
          stroke="url(#goldGradient)"
          strokeWidth="11"
          strokeLinejoin="round"
        />
        <path
          d="M305 250L350 295L290 295"
          stroke="url(#goldGradient)"
          strokeWidth="11"
          strokeLinejoin="round"
        />

        {/* MARKAZIY "Sh" XATTOTLIK TANASI (Calligraphic 'Sh' Monogram Trunk) */}
        {/* "S" harfi egri chizig'i (nafis zarhal harf) */}
        <path
          d="M225 295C210 290 185 300 185 320C185 345 235 340 235 365C235 385 205 390 185 375"
          stroke="url(#goldGradient)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* "h" harfi va daraxt tanasining tik poyasi */}
        <path
          d="M250 280V370"
          stroke="url(#goldGradient)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M250 325C265 315 285 315 295 330V370"
          stroke="url(#goldGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* PASTKI ILDIZLAR TO'QIMASI (Intertwined Golden Roots) */}
        {/* Gorizontal ildiz asosi */}
        <path
          d="M130 375C170 355 330 355 370 375"
          stroke="url(#goldGradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Markaziy bog'langan chuqur ildizlar */}
        <path
          d="M250 370C250 400 230 420 250 445C270 420 250 400 250 370Z"
          fill="url(#goldGradient)"
        />
        <path
          d="M210 375C215 410 190 425 180 440"
          stroke="url(#goldGradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M290 375C285 410 310 425 320 440"
          stroke="url(#goldGradient)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M160 380C155 405 140 420 145 435"
          stroke="url(#goldGradient)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M340 380C345 405 360 420 355 435"
          stroke="url(#goldGradient)"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
