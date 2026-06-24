            
            

export const gameState = {
                    isPlaying: false,
                    isTransitioning: false,
                    mode: 'sequential',
                    preset: 'classic',
                    shopEnabled: false,
                    stunTime: 2000,
                    dataPool: [],
                    activePool: [],
                    wrongPool: [], 
                    isRetryPhase: false, 
                    currentQuestionFails: 0, 
                    currentQuiz: null,
                    totalQuestions: 0,
                    questionsPassed: 0,
                    matchStartTime: 0,
                    isSuddenDeath: false,
                    p1: { name: 'P1', hp: 100, maxHp: 100, mana: 0, shield: 0, cash: 0, streak: 0, bestStreak: 0, multiplier: 1, multiplierTurns: 0, isStunned: false, isFrozen: false, deck: [], queue: [] },
                    p2: { name: 'P2', hp: 100, maxHp: 100, mana: 0, shield: 0, cash: 0, streak: 0, bestStreak: 0, multiplier: 1, multiplierTurns: 0, isStunned: false, isFrozen: false, deck: [], queue: [] }
                };
