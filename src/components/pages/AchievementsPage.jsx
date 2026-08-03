import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { ACHIEVEMENTS, getUnlockedIds } from '../utils/achievements';
import { exportProgress, importProgress } from '../utils/progressBackup';
import { playUiClick } from '../utils/sfx';

const AchievementsPage = () => {
    const unlockedIds = getUnlockedIds();
    const fileInputRef = useRef(null);
    const [backupMessage, setBackupMessage] = useState('');

    const handleExport = () => {
        exportProgress();
        playUiClick();
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow re-selecting the same file later
        if (!file) return;
        try {
            const restored = await importProgress(file);
            setBackupMessage(`Restored ${restored} item${restored === 1 ? '' : 's'} - reload the page to see it everywhere.`);
            playUiClick();
        } catch (err) {
            setBackupMessage(typeof err === 'string' ? err : 'Could not import that file.');
        }
    };

    return (
        <div>
            <h1>Achievements</h1>
            <p className="scores-note">
                {unlockedIds.length} / {ACHIEVEMENTS.length} unlocked
            </p>
            <div className="achievements-grid">
                {ACHIEVEMENTS.map(a => {
                    const unlocked = unlockedIds.includes(a.id);
                    return (
                        <div className={`achievement-card${unlocked ? ' unlocked' : ''}`} key={a.id}>
                            <span className="achievement-icon">{unlocked ? '🏆' : '🔒'}</span>
                            <div>
                                <div className="achievement-name">{a.name}</div>
                                <div className="achievement-desc">{a.desc}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <h2 className="upgrades-subheading">Backup & Restore</h2>
            <p className="scores-note">
                Everything above, plus your Cores, tower/map unlocks, and local scores, is only saved on this device. Export a backup file to keep it safe or move it to another device.
            </p>
            <div className="container backup-buttons">
                <Button className='sbtn' variant="outline-light" onClick={handleExport}>
                    Export Progress
                </Button>
                <Button
                    className='sbtn'
                    variant="outline-light"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Import Progress
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    style={{ display: 'none' }}
                    onChange={handleImportFile}
                />
            </div>
            {backupMessage && <p className="scores-note">{backupMessage}</p>}

            <div className="container">
                <Link to='/' onClick={playUiClick}>
                    <Button variant="outline-light">Home</Button>
                </Link>
            </div>
        </div>
    );
};

export default AchievementsPage;
