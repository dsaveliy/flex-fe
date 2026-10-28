import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';

import type { ChatDeliveryStatus } from '@/api';

export type DeliveryState = ChatDeliveryStatus | 'read';

/** часики → ✓ доставлено → ✓✓ прочитано; «!» — не отправлено */
export function DeliveryMark({ state, color }: { state: DeliveryState; color: string }) {
  const { t } = useTranslation();
  const common = {
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const label = t(`chat.delivery.${state}`);

  return (
    <Svg width={16} height={12} viewBox="0 0 16 12" accessibilityLabel={label} accessible>
      {state === 'sending' && (
        <>
          <Circle cx={8} cy={6} r={4.6} {...common} />
          <Path d="M8 3.6V6l1.6 1" {...common} />
        </>
      )}
      {state === 'sent' && <Path d="M3.5 6.2 6.4 9l6-6" {...common} />}
      {state === 'read' && (
        <>
          <Path d="M1.5 6.2 4.4 9l6-6" {...common} />
          <Path d="M7.6 8.6 8 9l6-6" {...common} />
        </>
      )}
      {state === 'failed' && (
        <>
          <Circle cx={8} cy={6} r={4.6} {...common} />
          <Path d="M8 3.8v2.6M8 8.3v.1" {...common} />
        </>
      )}
    </Svg>
  );
}
