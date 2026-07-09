/**
 * Timeline.jsx
 * Horizontal progress stepper for order tracking.
 *
 * Props:
 *   status  {string}  — current order status key
 *
 * Behaviour:
 *   - Cancelled orders show a cancellation banner instead of the stepper.
 *   - Completed steps are filled with brand gold (#C9972B).
 *   - The active step has a gold ring glow.
 *   - Inactive steps use light gray (#E5E7EB / #F3F4F6).
 *   - Connector lines between steps animate from gray → gold gradient.
 */
import { GOLD, GOLD_L, MUTED, FONT, STATUS_MAP, TIMELINE_STEPS } from './tokens';

export default function Timeline({ status }) {
  /* ── Cancelled — bail out early with a banner ── */
  if (status === 'cancelled') {
    return (
      <div
        role="alert"
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          padding:      '11px 15px',
          borderRadius: 10,
          marginTop:    18,
          background:   '#FFF1F2',
          border:       '1px solid #FECDD3',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15 }}>✕</span>
        <span style={{ fontFamily: FONT, fontSize: 13, color: '#BE123C', fontWeight: 600 }}>
          This order has been cancelled
        </span>
      </div>
    );
  }

  const currentIdx = TIMELINE_STEPS.indexOf(status);

  return (
    <div
      style={{
        marginTop:    20,
        paddingTop:   18,
        borderTop:    '1px solid #F0F0F0',
      }}
    >
      {/* Section label */}
      <p
        style={{
          fontFamily:    FONT,
          fontSize:      10,
          fontWeight:    700,
          color:         MUTED,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom:  14,
        }}
      >
        Order Progress
      </p>

      {/* Step track */}
      <div
        role="list"
        aria-label="Order progress steps"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {TIMELINE_STEPS.map((step, i) => {
          const stepMeta = STATUS_MAP[step];
          const isDone   = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const isLast   = i === TIMELINE_STEPS.length - 1;

          return (
            <div
              key={step}
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
              style={{
                display:    'flex',
                alignItems: 'center',
                flex:       isLast ? 'none' : 1,
              }}
            >
              {/* ── Step node ── */}
              <div
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  alignItems:    'center',
                  gap:           5,
                }}
              >
                {/* Circle */}
                <div
                  style={{
                    width:        32,
                    height:       32,
                    borderRadius: '50%',
                    flexShrink:   0,
                    background:   isDone
                      ? `linear-gradient(135deg, ${GOLD}, ${GOLD_L})`
                      : '#F3F4F6',        /* inactive: light gray #F3F4F6 */
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    fontSize:     13,
                    border:       isCurrent
                      ? `2px solid ${GOLD}`
                      : '2px solid transparent',
                    boxShadow:    isCurrent
                      ? `0 0 0 3px ${GOLD}25`
                      : isDone
                        ? `0 2px 6px ${GOLD}25`
                        : 'none',
                    transition:   'all 0.3s ease',
                  }}
                >
                  {isDone
                    ? <span aria-hidden="true">{stepMeta.icon}</span>
                    : (
                      <span
                        aria-hidden="true"
                        style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}
                      >
                        {i + 1}
                      </span>
                    )
                  }
                </div>

                {/* Label */}
                <span
                  style={{
                    fontFamily:    FONT,
                    fontSize:      9,
                    fontWeight:    600,
                    color:         isDone ? GOLD : MUTED,  /* gold when done, gray when not */
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    whiteSpace:    'nowrap',
                  }}
                >
                  {stepMeta.label}
                </span>
              </div>

              {/* ── Connector line (between steps, not after the last) ── */}
              {!isLast && (
                <div
                  aria-hidden="true"
                  style={{
                    flex:        1,
                    height:      2,
                    borderRadius: 2,
                    marginBottom: 20,      /* aligns with circle centre */
                    marginLeft:  2,
                    marginRight: 2,
                    /* gold gradient when passed, light gray #E5E7EB when upcoming */
                    background:  i < currentIdx
                      ? `linear-gradient(90deg, ${GOLD}, ${GOLD_L})`
                      : '#E5E7EB',
                    transition:  'background 0.4s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
