import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { disableAdminTestMode, enableAdminTestMode, isAdminTestMode } from '../utils/adminTestMode';

const AdminTestPanel = () => {
    const [open, setOpen] = useState(false);
    const [key, setKey] = useState('');
    const [message, setMessage] = useState('');
    const active = isAdminTestMode();

    const enable = e => {
        e.preventDefault();
        const result = enableAdminTestMode(key);
        if (!result.success) {
            setMessage(result.reason === 'invalid-key' ? 'Invalid admin key.' : 'Could not enable QA mode on this device.');
            return;
        }
        setMessage('QA unlock enabled. Reloading...');
        window.location.reload();
    };

    const disable = () => {
        disableAdminTestMode();
        window.location.reload();
    };

    return (
        <div style={{ maxWidth: 680, margin: '18px auto', textAlign: 'center' }}>
            <Button size="sm" variant={active ? 'warning' : 'outline-secondary'} onClick={() => setOpen(value => !value)}>
                {active ? 'QA / Admin Mode Active' : 'Admin / QA Testing'}
            </Button>
            {open && (
                <div style={{ marginTop: 10, padding: 14, border: '1px solid #4a5665', borderRadius: 10, background: '#15191f' }}>
                    {active ? (
                        <>
                            <div style={{ color: '#ffd60a', marginBottom: 8 }}>All 100 maps, 28 towers, 300 stars, 550 achievements, permanent upgrades, palettes and mastery levels are virtually unlocked. Tower placement and in-run upgrades are free.</div>
                            <div style={{ color: '#aaa', fontSize: 13, marginBottom: 10 }}>QA runs cannot write achievements, progression, mastery XP, Cores or leaderboards. Your real save remains underneath this overlay.</div>
                            <Button variant="outline-warning" onClick={disable}>Disable QA Unlock</Button>
                        </>
                    ) : (
                        <form onSubmit={enable}>
                            <div style={{ color: '#bbb', fontSize: 13, marginBottom: 8 }}>Testing only. Enter the admin key to temporarily unlock all game progression and free tower upgrades without modifying the real save.</div>
                            <input
                                type="password"
                                value={key}
                                onChange={e => setKey(e.target.value)}
                                placeholder="Admin key"
                                autoComplete="off"
                                style={{ fontFamily: 'pixel', background: '#0d1014', color: '#fff', border: '1px solid #46505e', borderRadius: 6, padding: '8px 10px', marginRight: 8 }}
                            />
                            <Button type="submit" variant="outline-warning">Enable QA Unlock</Button>
                            {message && <div style={{ color: '#ff9f9f', marginTop: 8 }}>{message}</div>}
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminTestPanel;
