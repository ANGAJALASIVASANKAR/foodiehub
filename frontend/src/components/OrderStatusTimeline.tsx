import { Check } from 'lucide-react';
import { OrderStatus, TrackingEvent } from '../types';

const STATUS_FLOW: OrderStatus[] = [
  'ORDER_PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

const LABELS: Record<string, string> = {
  ORDER_PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Being Prepared',
  READY_FOR_PICKUP: 'Ready for Pickup',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface Props {
  status: OrderStatus;
  events?: TrackingEvent[];
  compact?: boolean;
}

export default function OrderStatusTimeline({ status, events, compact = false }: Props) {
  const cancelled = status === 'CANCELLED';
  const currentIndex = STATUS_FLOW.indexOf(status);

  if (cancelled) {
    return (
      <div className="timeline timeline--cancelled">
        <div className="timeline__step done">
          <span className="timeline__dot"><Check size={12} /></span>
          <div>
            <strong>Order Placed</strong>
          </div>
        </div>
        <div className="timeline__step cancelled">
          <span className="timeline__dot">✕</span>
          <div>
            <strong>Cancelled</strong>
            <small>This order was cancelled</small>
          </div>
        </div>
      </div>
    );
  }

  const eventTime = (statusName: string) =>
    events?.find((e) => e.status === statusName)?.timestamp;

  return (
    <div className={`timeline ${compact ? 'timeline--compact' : ''}`}>
      {STATUS_FLOW.map((step, index) => {
        const done = index <= currentIndex;
        const time = eventTime(step);
        return (
          <div key={step} className={`timeline__step ${done ? 'done' : ''}`}>
            <span className="timeline__dot">{done ? <Check size={12} /> : index + 1}</span>
            <div>
              <strong>{LABELS[step]}</strong>
              {done && time && <small>{new Date(time).toLocaleString()}</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
