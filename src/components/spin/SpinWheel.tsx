import { useCallback, useEffect, useRef } from 'react';
import type { WheelDisplaySlot } from '@/types/campaign';

interface SpinWheelProps {
  slots: WheelDisplaySlot[];
  targetIndex: number;
  spinning: boolean;
  onComplete: () => void;
}

function buildSlotLabel(slot: WheelDisplaySlot, shadowFilter: string): string {
  const stroke = slot.stroke ?? 'rgba(255,255,255,0.18)';

  if (slot.single) {
    const bgW = 30;
    const bgH = 22;
    return `
      <rect class="wheel-label-bg" x="${-bgW / 2}" y="${-bgH / 2}" width="${bgW}" height="${bgH}" rx="6"
        fill="${slot.bg}" stroke="${stroke}" />
      <text font-size="11" y="-3">${slot.icon}</text>
      <text font-size="5.5" font-weight="700" y="7" fill="${slot.textColor}" filter="${shadowFilter}"
        text-anchor="middle">${slot.single}</text>`;
  }

  const bgW = 32;
  const bgH = 24;
  return `
    <rect class="wheel-label-bg" x="${-bgW / 2}" y="${-bgH / 2}" width="${bgW}" height="${bgH}" rx="6"
      fill="${slot.bg}" stroke="${stroke}" />
    <text font-size="11" y="-4">${slot.icon}</text>
    <text font-size="4.5" font-weight="600" y="2" fill="${slot.textColor}" filter="${shadowFilter}"
      text-anchor="middle" letter-spacing="0.06em">${slot.sub?.toUpperCase() ?? ''}</text>
    <text font-size="6.5" font-weight="800" y="9" fill="${slot.textColor}" filter="${shadowFilter}"
      text-anchor="middle">${slot.main ?? ''}</text>`;
}

function buildWheelSvg(slots: WheelDisplaySlot[]): string {
  const n = slots.length;
  const slice = 360 / n;
  let svgContent = `
    <defs>
      <clipPath id="wheel-clip">
        <circle cx="0" cy="0" r="100" />
      </clipPath>
      <filter id="wheel-text-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.4" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
      <filter id="wheel-text-shadow-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" flood-color="#000000" flood-opacity="0.2"/>
      </filter>
    </defs>
    <g clip-path="url(#wheel-clip)">`;

  slots.forEach((slot, i) => {
    const start = (i * slice - 90) * (Math.PI / 180);
    const end = ((i + 1) * slice - 90) * (Math.PI / 180);
    const x1 = 100 * Math.cos(start);
    const y1 = 100 * Math.sin(start);
    const x2 = 100 * Math.cos(end);
    const y2 = 100 * Math.sin(end);
    const large = slice > 180 ? 1 : 0;

    svgContent += `<path class="wheel-segment" d="M 0 0 L ${x1} ${y1} A 100 100 0 ${large} 1 ${x2} ${y2} Z" fill="${slot.color}" />`;
  });

  svgContent += `</g>`;

  slots.forEach((slot, i) => {
    const bisector = i * slice + slice / 2;
    const angleRad = (bisector - 90) * (Math.PI / 180);
    const dist = 64;
    const cx = dist * Math.cos(angleRad);
    const cy = dist * Math.sin(angleRad);

    let textRot = bisector - 90;
    if (bisector > 90 && bisector < 270) {
      textRot += 180;
    }

    const shadowFilter =
      slot.textColor === '#1F2D24'
        ? 'url(#wheel-text-shadow-soft)'
        : 'url(#wheel-text-shadow)';
    const label = buildSlotLabel(slot, shadowFilter);

    svgContent += `
      <g transform="translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) rotate(${textRot.toFixed(2)})">
        ${label}
      </g>`;
  });

  return svgContent;
}

export default function SpinWheel({
  slots,
  targetIndex,
  spinning,
  onComplete,
}: SpinWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const completedRef = useRef(false);

  const spinToIndex = useCallback(
    (index: number) => {
      const wheelEl = wheelRef.current;
      if (!wheelEl || slots.length === 0) return;

      const n = slots.length;
      const slice = 360 / n;
      const target = 360 - (index * slice + slice / 2);
      const spins = 5 * 360;
      rotationRef.current += spins + target - (rotationRef.current % 360);
      wheelEl.style.transform = `rotate(${rotationRef.current}deg)`;
    },
    [slots.length]
  );

  useEffect(() => {
    if (!spinning || completedRef.current) return;

    completedRef.current = true;
    spinToIndex(targetIndex);

    const timer = window.setTimeout(() => {
      onComplete();
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [spinning, targetIndex, spinToIndex, onComplete]);

  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer" aria-hidden="true" />
      <div className="wheel-ring" aria-hidden="true" />
      <div
        ref={wheelRef}
        className="wheel"
        role="img"
        aria-label="Vòng quay may mắn"
      >
        <svg
          viewBox="-100 -100 200 200"
          dangerouslySetInnerHTML={{ __html: buildWheelSvg(slots) }}
        />
      </div>
      <div className="wheel-center">
        HIKO
        <br />
        MATCHA
      </div>
    </div>
  );
}
