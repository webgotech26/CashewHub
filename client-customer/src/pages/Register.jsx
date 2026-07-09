import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', mobile:'', email:'', password:'', confirmPassword:'' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await api.post('/api/auth/register', { name:form.name, mobile:form.mobile, email:form.email, password:form.password });
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'DM Sans',sans-serif" }}>

      {/* LEFT — Brand panel */}
      <div style={{
        width:'42%',
        position:'relative',
        display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'60px 48px', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(/assets/pexels-nandamends-30878379.jpg)',
          backgroundSize:'cover', backgroundPosition:'center', zIndex:0,
        }} />
        <div style={{
          position:'absolute', inset:0, zIndex:1,
          background:'linear-gradient(160deg,rgba(26,10,0,0.92) 0%,rgba(61,26,0,0.85) 100%)',
        }} />
        <div style={{ position:'relative', zIndex:2 }}>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
          <img src="/assets/cashewlogo.png" alt="" style={{ width:50, height:50, borderRadius:'50%', objectFit:'cover' }}
            onError={e => e.target.style.display='none'} />
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:700, color:'#fff' }}>H²B³ Cashew</div>
            <div style={{ fontSize:10, color:'#F5C842', fontWeight:600, textTransform:'uppercase', letterSpacing:1.5 }}>Premium Quality Nuts</div>
          </div>
        </div>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:800,
          color:'#fff', lineHeight:1.2, marginBottom:14 }}>
          Join the<br />
          <span style={{ color:'#F5C842', fontStyle:'italic' }}>H²B³ Cashew</span><br />
          Family Today
        </h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,0.65)', lineHeight:1.85, marginBottom:40 }}>
          Create a free account and get access to premium cashews, exclusive deals and easy order tracking.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[
            ['1','Create your account','Takes less than 2 minutes'],
            ['2','Browse our catalogue','Premium cashew varieties'],
            ['3','Place your order','Fast delivery, fresh cashews'],
          ].map(([num,title,sub]) => (
            <div key={num} style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:'50%',
                background:'linear-gradient(135deg,#C9972B,#F5C842)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14, fontWeight:800, color:'#1a0a00', flexShrink:0 }}>{num}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{title}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
        </div> {/* end zIndex:2 */}
      </div>

      {/* RIGHT — Form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        background:'#FAFAFA', padding:'40px 32px', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28,
            fontWeight:800, color:'#1A1A1A', marginBottom:6 }}>Create Account</h2>
          <p style={{ fontSize:14, color:'#9CA3AF', marginBottom:28 }}>Fill in the details below to get started</p>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12,
              padding:'12px 16px', marginBottom:20, fontSize:13, color:'#B91C1C' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { label:'Full Name',     key:'name',     type:'text',     placeholder:'e.g. Ravi Kumar' },
              { label:'Mobile Number', key:'mobile',   type:'tel',      placeholder:'+91 XXXXX XXXXX' },
              { label:'Email Address', key:'email',    type:'email',    placeholder:'your@email.com' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A', display:'block', marginBottom:5 }}>{label}</label>
                <input
                  type={type} required value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{
                    width:'100%', padding:'12px 16px', borderRadius:12, boxSizing:'border-box',
                    border:'1.5px solid #EBEBEB', fontSize:14, outline:'none',
                    fontFamily:'inherit', background:'#fff', transition:'border 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor='#C9972B'}
                  onBlur={e => e.target.style.borderColor='#EBEBEB'}
                />
              </div>
            ))}

            {/* Password */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A', display:'block', marginBottom:5 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  style={{
                    width:'100%', padding:'12px 48px 12px 16px', borderRadius:12, boxSizing:'border-box',
                    border:'1.5px solid #EBEBEB', fontSize:14, outline:'none',
                    fontFamily:'inherit', background:'#fff', transition:'border 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor='#C9972B'}
                  onBlur={e => e.target.style.borderColor='#EBEBEB'}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9CA3AF',
                }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#4A4A4A', display:'block', marginBottom:5 }}>Confirm Password</label>
              <input
                type="password" required value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Re-enter your password"
                style={{
                  width:'100%', padding:'12px 16px', borderRadius:12, boxSizing:'border-box',
                  border:'1.5px solid #EBEBEB', fontSize:14, outline:'none',
                  fontFamily:'inherit', background:'#fff', transition:'border 0.2s',
                }}
                onFocus={e => e.target.style.borderColor='#C9972B'}
                onBlur={e => e.target.style.borderColor='#EBEBEB'}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              padding:'14px', borderRadius:12, border:'none', marginTop:4,
              background:'linear-gradient(135deg,#C9972B,#F5C842)', color:'#1a0a00',
              fontSize:15, fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1, boxShadow:'0 4px 16px rgba(201,151,43,0.35)',
            }}>
              {loading ? 'Creating Account…' : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:20 }}>
            <span style={{ fontSize:13, color:'#9CA3AF' }}>Already have an account? </span>
            <Link to="/login" style={{ fontSize:13, fontWeight:700, color:'#C9972B', textDecoration:'none' }}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
