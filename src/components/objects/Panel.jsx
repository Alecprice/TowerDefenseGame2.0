import React, { useState } from 'react';
import Draggable from './Draggable';
import { isTowerUnlocked, getTowerUpgradeLevel } from '../utils/progression';

const Panel = props => {
    const { place, state, values, ...rest } = props;
    const [paused, setPaused] = useState(state);

    const towerInfo = [
        { type: 1, name: 'Striker', cost: 10 },
        { type: 2, name: 'Slower', cost: 20 },
        { type: 3, name: 'Blaster', cost: 30 },
        { type: 4, name: 'Burner', cost: 40 },
    ];

    return (
        <div className="panel" {...rest}>
            <div className='panel-left'>
                <div className='towers'>
                    {towerInfo.map((info) => {
                        const isUnlocked = isTowerUnlocked(info.type);
                        const upgradeLevel = getTowerUpgradeLevel(info.type);
                        return (
                            <Draggable
                                key={info.type}
                                place={place}
                                type={info.type}
                                paused={paused}
                                isUnlocked={isUnlocked}
                                cost={info.cost}
                                upgradeLevel={upgradeLevel}
                                money={values?.money || 0}
                            />
                        );
                    })}
                </div>
            </div>
            <div className='panel-right'>
                <div className='buttons'>
                    <button className='pause' onClick={function (e) { setPaused(true) }}>Pause</button>
                    <button className='play' onClick={function (e) { setPaused(false) }}>Play</button>
                </div>
            </div>
        </div>
    );
}

export default Panel;
