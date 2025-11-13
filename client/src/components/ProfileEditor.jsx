import React, { useState } from 'react';

export default function ProfileEditor({ user, onSave, onClose }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [role, setRole] = useState(user?.role || 'Senior Graphic Designer');
  const [followers, setFollowers] = useState(user?.followers || 1000);
  const [following, setFollowing] = useState(user?.following || 1200);
  // Socials (optional)
  const [twitter, setTwitter] = useState(user?.twitter || '@username');
  const [behance, setBehance] = useState(user?.behance || '');
  const [facebook, setFacebook] = useState(user?.facebook || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...user, name, email, mobile, role, followers, following, twitter, behance, facebook });
  };

  return (
    <div style={{
      maxWidth: 380,
      margin: '40px auto',
      borderRadius: 20,
      boxShadow: '0 4px 24px #0002',
      background: '#fff',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Blue header */}
      <div style={{
        background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
        height: 120,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Settings/close icon */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer' }}>×</button>
        {/* Avatar */}
        <div style={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: '#eee',
          border: '4px solid #fff',
          position: 'absolute',
          bottom: -45,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          color: '#bbb',
        }}>
          <span role="img" aria-label="avatar">👤</span>
        </div>
      </div>
      {/* Profile content */}
      <div style={{ padding: '60px 24px 24px 24px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>{name}</div>
        <div style={{ color: '#3a7bd5', fontWeight: 500, fontSize: 15, marginBottom: 12 }}>{role}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{followers}</div>
            <div style={{ color: '#888', fontSize: 13 }}>Followers</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{following}</div>
            <div style={{ color: '#888', fontSize: 13 }}>Following</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', margin: '0 auto', maxWidth: 300 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#888', fontSize: 13 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: 6, fontSize: 15, background: 'none', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#888', fontSize: 13 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: 6, fontSize: 15, background: 'none', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#888', fontSize: 13 }}>Mobile</label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: 6, fontSize: 15, background: 'none', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#888', fontSize: 13 }}>Twitter</label>
            <input value={twitter} onChange={e => setTwitter(e.target.value)} style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: 6, fontSize: 15, background: 'none', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: '#888', fontSize: 13 }}>Behance</label>
            <input value={behance} onChange={e => setBehance(e.target.value)} style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: 6, fontSize: 15, background: 'none', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ color: '#888', fontSize: 13 }}>Facebook</label>
            <input value={facebook} onChange={e => setFacebook(e.target.value)} style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: 6, fontSize: 15, background: 'none', outline: 'none' }} />
          </div>
          <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginBottom: 8 }}>Save</button>
        </form>
      </div>
    </div>
  );
}
