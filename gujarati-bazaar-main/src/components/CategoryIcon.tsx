import React from 'react';
import { Icon } from '@iconify/react';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as RiIcons from 'react-icons/ri';
import * as GiIcons from 'react-icons/gi';
import { HelpCircle } from 'lucide-react';

// Legacy react-icons map for backward compatibility
const LegacyIcons: any = { ...FaIcons, ...MdIcons, ...RiIcons, ...GiIcons };

interface CategoryIconProps {
  /** The icon value — Iconify ID (e.g. "mdi:tshirt-crew") or uploaded URL or legacy react-icons name */
  name: string;
  /** Icon source type */
  iconType?: 'iconify' | 'uploaded_svg' | 'uploaded_image' | 'legacy' | string;
  className?: string;
  size?: number;
}

/**
 * Universal icon renderer.
 * Automatically renders Iconify icons, uploaded SVG/images, or legacy react-icons
 * based on icon_type. Auto-detects legacy names when icon_type is missing.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  name,
  iconType,
  className = '',
  size = 20,
}) => {
  if (!name) {
    return <HelpCircle className={className} size={size} />;
  }

  // Determine the effective icon type
  const effectiveType = resolveIconType(name, iconType);

  switch (effectiveType) {
    case 'iconify':
      return (
        <Icon
          icon={name}
          width={size}
          height={size}
          className={className}
        />
      );

    case 'uploaded_svg':
    case 'uploaded_image':
      return (
        <img
          src={name}
          alt="category icon"
          width={size}
          height={size}
          className={`object-contain ${className}`}
          loading="lazy"
        />
      );

    case 'legacy': {
      const LegacyComponent = LegacyIcons[name];
      if (LegacyComponent) {
        return <LegacyComponent className={className} size={size} />;
      }
      // Fallback: try as iconify anyway (might be a valid iconify ID)
      return (
        <Icon
          icon={name}
          width={size}
          height={size}
          className={className}
        />
      );
    }

    default:
      return <HelpCircle className={className} size={size} />;
  }
};

/**
 * Auto-detect icon type from the icon value when icon_type is not set.
 * - Names starting with a URL path (/ or http) → uploaded
 * - Names containing ":" (e.g. "mdi:home") → iconify
 * - Names starting with Fa/Md/Ri/Gi/Hi/Bs → legacy react-icons
 * - Fallback → iconify
 */
function resolveIconType(
  name: string,
  iconType?: string
): 'iconify' | 'uploaded_svg' | 'uploaded_image' | 'legacy' {
  if (iconType && iconType !== '') {
    return iconType as any;
  }

  // URL-based uploaded icons
  if (name.startsWith('/media/') || name.startsWith('http')) {
    if (name.endsWith('.svg')) return 'uploaded_svg';
    return 'uploaded_image';
  }

  // Legacy react-icons pattern (PascalCase starting with known prefixes)
  if (/^(Fa|Md|Ri|Gi|Hi|Bs)[A-Z]/.test(name)) {
    return 'legacy';
  }

  // Iconify pattern (contains colon like "mdi:home")
  if (name.includes(':')) {
    return 'iconify';
  }

  // Default fallback — try iconify
  return 'iconify';
}
