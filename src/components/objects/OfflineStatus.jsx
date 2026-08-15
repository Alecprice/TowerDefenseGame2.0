import React, { useEffect, useState } from 'react';

export default function OfflineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    const onUpdate = () => setUpdated(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('td-app-update-ready', onUpdate);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('td-app-update-ready', onUpdate);
    };
  }, []);

  if (online && !updated) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
      background: '#111827', color: 'white', border: '1px solid #4b5563', borderRadius: 999,
      padding: '8px 14px', fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,.35)'
    }}>
      {!online ? 'Offline mode · local progress still works' : (
        <button style={{ background: 'none', color: 'white', border: 0 }} onClick={() => window.location.reload()}>
          New version ready · reload
        </button>
      )}
    </div>
  );
}
