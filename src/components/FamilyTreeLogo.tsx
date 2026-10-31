import React from 'react';

interface FamilyTreeLogoProps {
  className?: string;
  size?: number;
  alt?: string;
}

/**
 * Shajarachi rasmiy logotipi (1-rasm):
 * - Kitob ustida unib chiqqan oilaviy shajara daraxti
 * - Shoxlardagi shaxslar (avlodlar) belgilari
 * - Zumrad va tabiiy yashil ranglar uyg'unligi
 */
export const FamilyTreeLogo: React.FC<FamilyTreeLogoProps> = ({ 
  className = "w-8 h-8", 
  size,
  alt = "Shajarachi logotipi"
}) => {
  return (
    <img
      src="/assets/aistudio/ikonca_6270f292.png"
      alt={alt}
      className={`object-contain select-none shrink-0 rounded-xl ${className}`}
      style={size ? { width: size, height: size } : undefined}
      draggable={false}
      loading="eager"
    />
  );
};
