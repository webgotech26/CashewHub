import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_META = {
  pending:    { bg:'#FEF9C3', color:'#A16207', label:'Pending',    icon:'🕐' },
  confirmed:  { bg:'#DBEAFE', color:'#1D4ED8', label:'Confirmed',  icon:'✅' },
  processing: { bg:'#EDE9FE', color:'#6D28D9', label:'Processing', icon:'📦' },
  shipped:    { bg:'#E0F2FE', color:'#0369A1', label:'Shipped',    icon:'🚚' },
  delivered:  { bg:'#DCFCE7', color:'#15803D', label:'Delivered',  icon:'🎉' },
  cancelled:  { bg:'#FEE2E2', color:'#B91C1C', label:'Cancelled',  icon:'❌' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { bg:'#F3F4F6', color:'#6B7280', label:status, icon:'●' };
  return (
    <span style={{ background:m.bg, color:m.color, padding:'6px 16px',
      borderRadius:20, fontSize:13, fontWeight:700,
      display:'inline-flex', alignItems:'center', gap:6 }}>
      {m.icon} {m.label}
    </span>
  );
}

function OrderTracker({ status }) {
  if (status === 'cancelled') return (
    <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12,
      padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
      <span style={{ fontSize:24 }}>❌</span>
      <div>
        <p style={{ fontWeight:700, color:'#B91C1C', fontSize:14 }}>Order Cancelled</p>
        <p style={{ fontSize:12, color:'#EF4444', marginTop:2 }}>Contact us if you need help.</p>
      </div>
    </div>
  );

  const currentIdx = STATUS_STEPS.indexOf(status);
  const STEP_DESC = {
    pending:'Order received, awaiting confirmation.',
    confirmed:'Order confirmed and being prepared.',
    processing:'Cashews are being packed for you.',
    shipped:'Package is on its way.',
    delivered:'Delivered successfully. Enjoy!',
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', marginBottom:12 }}>
        {STATUS_STEPS.map((step, i) => {
          const m = STATUS_META[step];
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <div key={step} style={{ display:'flex', alignItems:'center',
              flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{
                  width:40, height:40, borderRadius:'50%', flexShrink:0,
                  background: done ? 'linear-gradient(135deg,#C9972B,#F5C842)' : '#F0F0F0',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
                  border: current ? '3px solid #C9972B' : '3px solid transparent',
                  boxShadow: current ? '0 0 0 4px rgba(201,151,43,0.2)' : 'none',
                  transition:'all 0.3s',
                }}>
                  {done ? m.icon : <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:700 }}>{i+1}</span>}
                </div>
                <span style={{ fontSize:10, fontWeight:700,
                  color: done ? '#C9972B' : '#9CA3AF',
                  textTransform:'uppercase', letterSpacing:0.5, whiteSpace:'nowrap' }}>
                  {m.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div style={{ flex:1, height:3, borderRadius:2, marginBottom:24, marginLeft:2, marginRight:2,
                  background: i < currentIdx ? 'linear-gradient(90deg,#C9972B,#F5C842)' : '#F0F0F0',
                  transition:'background 0.4s' }} />
              )}
            </div>
          );
        })}
      </div>
      {STEP_DESC[status] && (
        <div style={{ background:'#FDF8F3', border:'1px solid #F0E8D0', borderRadius:10,
          padding:'12px 16px', fontSize:13, color:'#6B4A1A', fontWeight:500,
          display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>{STATUS_META[status]?.icon}</span>
          {STEP_DESC[status]}
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true); setError(null);
    api.get(`/api/orders/${id}`)
      .then(r => setOrder(r.data.data))
      .catch(err => setError(err.response?.data?.message || 'Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="shop-content">
      {[300,200,160].map((h,i) => (
        <div key={i} style={{ height:h, borderRadius:16, marginBottom:16,
          background:'linear-gradient(90deg,#F0F0F0 25%,#FAFAFA 50%,#F0F0F0 75%)',
          backgroundSize:'200% 100%', animation:'pcShimmer 1.4s infinite' }} />
      ))}
      <style>{`@keyframes pcShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  if (error) return (
    <div className="shop-content" style={{ textAlign:'center', padding:'60px 20px' }}>
      <div style={{ fontSize:52, marginBottom:16 }}>😕</div>
      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'#1A1A1A', marginBottom:8 }}>{error}</h2>
      <button onClick={() => navigate('/home/orders')} style={{
        marginTop:20, background:'#1A1A1A', color:'#fff', border:'none',
        borderRadius:10, padding:'12px 24px', fontSize:14, fontWeight:700, cursor:'pointer',
      }}>← Back to Orders</button>
    </div>
  );

  if (!order) return null;

  const subtotal = (order.items || []).reduce((s,i) => s + Number(i.line_total), 0);
  const gst = subtotal * 0.05;

  return (
    <div className="shop-content">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28, flexWrap:'wrap' }}>
        <button onClick={() => navigate('/home/orders')} style={{
          background:'#F5F5F5', color:'#1A1A1A', border:'none',
          borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer',
        }}>← My Orders</button>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24,
            fontWeight:800, color:'#1A1A1A', lineHeight:1 }}>Order #{order.id}</h1>
          <p style={{ fontSize:12, color:'#9CA3AF', marginTop:4 }}>
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN',
              { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
          </p>
        </div>
        <div style={{ marginLeft:'auto' }}><StatusBadge status={order.status} /></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Tracker */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EBEBEB',
            boxShadow:'0 2px 8px rgba(0,0,0,0.05)', padding:'24px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:20 }}>📍 Order Status</h2>
            <OrderTracker status={order.status} />
          </div>

          {/* Items */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EBEBEB',
            boxShadow:'0 2px 8px rgba(0,0,0,0.05)', padding:'24px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:20 }}>
              🛒 Items Ordered ({(order.items||[]).length})
            </h2>
            {(!order.items || order.items.length === 0) ? (
              <p style={{ color:'#9CA3AF', fontSize:14 }}>No item details available.</p>
            ) : (
              <div>
                {order.items.map((item, i) => (
                  <div key={`${item.product_id}-${i}`} style={{
                    display:'flex', alignItems:'center', gap:16,
                    padding:'14px 0',
                    borderBottom: i < order.items.length-1 ? '1px solid #F5F5F5' : 'none',
                  }}>
                    <div style={{ width:64, height:64, borderRadius:10, flexShrink:0,
                      background:'#F7F4EF', border:'1px solid #EBEBEB',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:28, cursor:'pointer', overflow:'hidden' }}
                      onClick={() => navigate(`/home/product/${item.product_id}`)}>
                      🌰
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:14, color:'#1A1A1A', cursor:'pointer',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        onClick={() => navigate(`/home/product/${item.product_id}`)}>
                        {item.product_name}
                      </p>
                      <p style={{ fontSize:12, color:'#9CA3AF', marginTop:3 }}>
                        ₹{Number(item.unit_price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <p style={{ fontWeight:800, fontSize:15, color:'#1A1A1A', flexShrink:0 }}>
                      ₹{Number(item.line_total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Price summary */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EBEBEB',
            boxShadow:'0 2px 8px rgba(0,0,0,0.05)', padding:'22px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:18 }}>💰 Price Summary</h2>
            {[['Subtotal', `₹${subtotal.toFixed(2)}`], ['GST (5%)', `₹${gst.toFixed(2)}`], ['Delivery', 'FREE']].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between',
                fontSize:13, color:'#6B6B6B', marginBottom:10 }}>
                <span>{l}</span>
                <span style={{ fontWeight:600, color:v==='FREE'?'#16a34a':'#374151' }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop:'2px solid #F3F4F6', paddingTop:12, marginTop:4,
              display:'flex', justifyContent:'space-between',
              fontSize:16, fontWeight:800, color:'#1A1A1A' }}>
              <span>Total Paid</span>
              <span>₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Order info */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #EBEBEB',
            boxShadow:'0 2px 8px rgba(0,0,0,0.05)', padding:'22px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', marginBottom:16 }}>📋 Order Info</h2>
            {[
              ['Order ID',  `#${order.id}`],
              ['Date',      new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})],
              ['Status',    STATUS_META[order.status]?.label || order.status],
              ['Customer',  order.customer_name || '—'],
            ].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between',
                fontSize:13, marginBottom:10, gap:8 }}>
                <span style={{ color:'#9CA3AF', flexShrink:0 }}>{l}</span>
                <span style={{ fontWeight:600, color:'#1A1A1A', textAlign:'right' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={() => navigate('/home/shop')} style={{
              padding:'12px', borderRadius:10, border:'none',
              background:'linear-gradient(135deg,#C9972B,#F5C842)',
              color:'#1a0a00', fontSize:14, fontWeight:700, cursor:'pointer',
            }}>🛍 Order Again</button>
            <button onClick={() => navigate('/home/contact')} style={{
              padding:'11px', borderRadius:10, border:'1.5px solid #EBEBEB',
              background:'#fff', color:'#1A1A1A',
              fontSize:13, fontWeight:600, cursor:'pointer',
            }}>💬 Need Help?</button>
          </div>
        </div>
      </div>
    </div>
  );
}
