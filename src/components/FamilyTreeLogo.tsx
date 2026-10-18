import React from 'react';

interface FamilyTreeLogoProps {
  className?: string;
  size?: number;
}

/**
 * 1-rasmdagi oila daraxti ikonkasi (Family Tree SVG):
 * Yashil shox-shabbalar, daraxt tanasi, oilaviy shajara chiziqlari
 * va yuqori-pastki avlodlar (ko'k va qizil kiyimdagi shaxslar).
 */
export const FamilyTreeLogo: React.FC<FamilyTreeLogoProps> = ({ 
  className = "w-8 h-8", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Daraxt tanasi va ildizlari (Trunk) */}
      <path
        d="M236 370H276L292 460L336 490H300L256 430L212 490H176L220 460L236 370Z"
        fill="#C98144"
        stroke="#111827"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      {/* Tana vertikal to'qimasining chizig'i */}
      <path
        d="M256 405V430"
        stroke="#8D5222"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Daraxt barglari qatlami (Canopy / Foliage) */}
      <path
        d="M256 24C190 24 150 70 148 108C110 112 80 142 80 186C80 200 84 214 91 226C65 242 48 274 48 312C48 368 94 412 152 412C160 412 168 411 176 408C194 424 220 434 256 434C292 434 318 424 336 408C344 411 352 412 360 412C418 412 464 368 464 312C464 274 447 242 421 226C428 214 432 200 432 186C432 142 402 112 364 108C362 70 322 24 256 24Z"
        fill="#26BBA0"
        stroke="#111827"
        strokeWidth="16"
        strokeLinejoin="round"
      />

      {/* Ichki barg detallari va to'lqin soyalari */}
      <path
        d="M170 116C190 76 230 52 256 52C282 52 322 76 342 116"
        stroke="#199E86"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Shajara bog'lovchi qora chiziqlari (Family Connections) */}
      {/* Yuqori 2 kishi orasidagi rishta */}
      <path
        d="M188 172V220H324V172"
        stroke="#111827"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Yuqoridan pastki avlodga tushuvchi vertikal markaziy ustun */}
      <path
        d="M256 220V310"
        stroke="#111827"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Pastki gorizontal shox chizig'i (4 ta farzandga ulanadi) */}
      <path
        d="M68 310H444"
        stroke="#111827"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Pastki o'rtadagi 2 kishiga vertikal ulanishlar */}
      <path
        d="M192 310V250H320V310"
        stroke="#111827"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      {/* 4 farzandning pastga tushuvchi kalta chiziqlari */}
      <path
        d="M68 310V330 M192 310V330 M320 310V330 M444 310V330"
        stroke="#111827"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* YUQORI QATOR (Ota-Ona) */}
      {/* Ota (Ko'k) */}
      <g id="person-top-left">
        {/* Bosh/yuz */}
        <circle cx="188" cy="116" r="28" fill="#FDB89E" stroke="#111827" strokeWidth="12" />
        {/* Tana (Ko'k) */}
        <path
          d="M156 186V164C156 150 168 140 182 140H194C208 140 220 150 220 164V186H156Z"
          fill="#2563EB"
          stroke="#111827"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>

      {/* Ona (Qizil/Pushti) */}
      <g id="person-top-right">
        {/* Bosh/yuz */}
        <circle cx="324" cy="116" r="28" fill="#FDB89E" stroke="#111827" strokeWidth="12" />
        {/* Tana (Qizil) */}
        <path
          d="M292 186V164C292 150 304 140 318 140H330C344 140 356 150 356 164V186H292Z"
          fill="#E11D48"
          stroke="#111827"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>

      {/* PASTKI QATOR (4 Farzand) */}
      {/* Farzand 1: Qizil */}
      <g id="child-1">
        <circle cx="68" cy="360" r="28" fill="#FDB89E" stroke="#111827" strokeWidth="12" />
        <path
          d="M36 430V408C36 394 48 384 62 384H74C88 384 100 394 100 408V430H36Z"
          fill="#E11D48"
          stroke="#111827"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>

      {/* Farzand 2: Ko'k */}
      <g id="child-2">
        <circle cx="192" cy="360" r="28" fill="#FDB89E" stroke="#111827" strokeWidth="12" />
        <path
          d="M160 430V408C160 394 172 384 186 384H198C212 384 224 394 224 408V430H160Z"
          fill="#2563EB"
          stroke="#111827"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>

      {/* Farzand 3: Qizil */}
      <g id="child-3">
        <circle cx="320" cy="360" r="28" fill="#FDB89E" stroke="#111827" strokeWidth="12" />
        <path
          d="M288 430V408C288 394 300 384 314 384H326C340 384 352 394 352 408V430H288Z"
          fill="#E11D48"
          stroke="#111827"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>

      {/* Farzand 4: Ko'k */}
      <g id="child-4">
        <circle cx="444" cy="360" r="28" fill="#FDB89E" stroke="#111827" strokeWidth="12" />
        <path
          d="M412 430V408C412 394 424 384 438 384H450C464 384 476 394 476 408V430H412Z"
          fill="#2563EB"
          stroke="#111827"
          strokeWidth="12"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
