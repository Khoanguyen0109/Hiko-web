import type { PublicWheelSlot, WheelDisplaySlot } from '@/types/campaign';

const LOSE_LABEL_PATTERN = /try again|thử lại|thu lai|chúc may mắn|good luck/i;

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 10) {
    return digits;
  }

  if (digits.length === 9 && digits.startsWith('9')) {
    return `0${digits}`;
  }

  return null;
}

export function findSlotIndexByLabel(
  slots: PublicWheelSlot[],
  label: string
): number {
  const index = slots.findIndex((slot) => slot.label === label);
  return index >= 0 ? index : 0;
}

export function findLoseSlotIndex(slots: PublicWheelSlot[]): number {
  const loseIndex = slots.findIndex((slot) =>
    LOSE_LABEL_PATTERN.test(slot.label)
  );
  return loseIndex >= 0 ? loseIndex : Math.min(1, slots.length - 1);
}

function pickIcon(label: string): string {
  const lower = label.toLowerCase();

  if (/%\s*off|giảm|discount/.test(lower)) return '🏷️';
  if (/free|miễn phí|tang/.test(lower)) {
    if (/latte|coffee|cà phê/.test(lower)) return '☕';
    if (/mochi/.test(lower)) return '🍡';
    return '🎁';
  }
  if (/try again|thử lại|thu lai/.test(lower)) return '🍃';

  return '✨';
}

function pickTextColor(color: string): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return '#FFFFFF';

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.62 ? '#1F2D24' : '#FFFFFF';
}

export function mapSlotsToDisplay(
  slots: PublicWheelSlot[]
): WheelDisplaySlot[] {
  return slots.map((slot) => {
    const textColor = pickTextColor(slot.color);
    const icon = pickIcon(slot.label);
    const percentMatch = slot.label.match(/(\d+)\s*%/);
    const freeMatch = slot.label.match(/^(.+?)\s+free$/i);

    if (percentMatch) {
      return {
        label: slot.label,
        color: slot.color,
        sub: 'Giảm',
        main: `${percentMatch[1]}%`,
        icon,
        textColor,
        bg: textColor === '#1F2D24' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)',
        stroke:
          textColor === '#1F2D24' ? 'rgba(31,45,36,0.1)' : 'rgba(255,255,255,0.18)',
      };
    }

    if (freeMatch) {
      return {
        label: slot.label,
        color: slot.color,
        sub: freeMatch[1].trim(),
        main: 'Free',
        icon,
        textColor,
        bg: textColor === '#1F2D24' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.18)',
        stroke:
          textColor === '#1F2D24' ? 'rgba(31,45,36,0.1)' : 'rgba(255,255,255,0.18)',
      };
    }

    if (LOSE_LABEL_PATTERN.test(slot.label)) {
      return {
        label: slot.label,
        color: slot.color,
        single: slot.label,
        icon,
        textColor,
        bg: textColor === '#1F2D24' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.16)',
        stroke:
          textColor === '#1F2D24' ? 'rgba(31,45,36,0.1)' : 'rgba(255,255,255,0.18)',
      };
    }

    return {
      label: slot.label,
      color: slot.color,
      single: slot.label,
      icon,
      textColor,
      bg: textColor === '#1F2D24' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.18)',
      stroke:
        textColor === '#1F2D24' ? 'rgba(31,45,36,0.1)' : 'rgba(255,255,255,0.18)',
    };
  });
}
