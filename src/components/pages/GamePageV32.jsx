import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import GamePageV31 from './GamePageV31';
import CrossDevicePolish from '../objects/CrossDevicePolish';
import ViewportStability from '../objects/ViewportStability';
import { isAdminTestMode } from '../utils/adminTestMode';
import { getMetaBonuses } from '../utils/metaProgression';
import { getDailyChallenge } from '../utils/dailyChallengeV31';
import { loadRunV31 } from '../utils/runSaveV31';
import { buildDraftRosterForEconomy, getOpeningEconomy } from '../utils/openingEconomyV32';
import { setScopedOpeningMoneyMultiplier, clearScopedOpeningMoneyMultiplier } from '../utils/difficulty';

const GamePageV32 = () => {
    const [searchParams] = useSearchParams();
    const resumeRequested = searchParams.get('resume') === '1';
    const savedRun = resumeRequested ? loadRunV31() : null;
    const dailyRequested = searchParams.get('daily') === '1';
    const daily = dailyRequested ? getDailyChallenge() : null;

    const difficultyKey = savedRun?.difficultyKey || daily?.difficultyKey || searchParams.get('difficulty') || 'basic';
    const modeKey = savedRun?.modeKey || daily?.modeKey || searchParams.get('rules') || 'classic';
    const seed = savedRun?.seed || daily?.seed || searchParams.get('seed') || 'standard';
    const ranked = Boolean(savedRun?.ranked || dailyRequested || searchParams.get('ranked') === '1');
    const competitive = ranked || dailyRequested;
    const metaStartGoldBonus = competitive ? 0 : getMetaBonuses().startGoldBonus;

    const opening = useMemo(() => {
        const draftRoster = modeKey === 'draft' ? buildDraftRosterForEconomy(seed) : null;
        return getOpeningEconomy({ difficultyKey, modeKey, metaStartGoldBonus, draftRoster });
    }, [difficultyKey, modeKey, seed, metaStartGoldBonus]);

    const legacyOpeningBase = Math.max(1, 20 + metaStartGoldBonus);
    const scopedMultiplier = opening.totalMoney / legacyOpeningBase;
    setScopedOpeningMoneyMultiplier(difficultyKey, scopedMultiplier);

    useEffect(() => {
        setScopedOpeningMoneyMultiplier(difficultyKey, scopedMultiplier);
        return () => clearScopedOpeningMoneyMultiplier();
    }, [difficultyKey, scopedMultiplier]);

    return (
        <>
            <ViewportStability />
            <CrossDevicePolish />
            <div style={{ maxWidth: 1500, margin: '3px auto 0', textAlign: 'center', fontFamily: 'pixel', color: '#9facbc', fontSize: 11 }}>
                Tower Defense 3.2 · 100 unique maps · 28 towers · 21 modes · 550 achievements · Opening ${opening.totalMoney}
                {isAdminTestMode() && <span style={{ color: '#ffd60a', marginLeft: 10 }}>QA / ADMIN — progression and competitive writes disabled</span>}
            </div>
            <GamePageV31 />
        </>
    );
};

export default GamePageV32;
