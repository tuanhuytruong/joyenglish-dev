// AudioContext is created lazily on first user interaction to comply with browser autoplay policies
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}
export { audioCtx, getAudioCtx };
            
            // ✂️ CẤU HÌNH MP3 NGOÀI & VOLUME ✂️
            export const EXTERNAL_AUDIO_VOLUMES = {
                kamehameha: 0.3,
                welcome: 0.6,
                defeated: 0.6,
                win: 0.5,
                mainTheme: 0.4,     // Cài đặt âm lượng Nhạc nền chính (0.0 đến 1.0)
                suddenDeath: 0.6    // Cài đặt âm lượng Nhạc Sudden Death (0.0 đến 1.0)
            };

            export let realKameAudio = new Audio('audiokamekameha.mp3');
            realKameAudio.volume = EXTERNAL_AUDIO_VOLUMES.kamehameha; 
            
            export let welcomeAudio = new Audio('Welcome.mp3');
            welcomeAudio.volume = EXTERNAL_AUDIO_VOLUMES.welcome;

            export let defeatedAudio = new Audio('Defeated.mp3');
            defeatedAudio.volume = EXTERNAL_AUDIO_VOLUMES.defeated;

            export let winAudio = new Audio('Win-battle.mp3');
            winAudio.volume = EXTERNAL_AUDIO_VOLUMES.win;
            winAudio.loop = true; // Loop vô tận
            
            export let mainThemeAudio = new Audio('Main-theme.mp3');
            mainThemeAudio.volume = EXTERNAL_AUDIO_VOLUMES.mainTheme;
            mainThemeAudio.loop = true; // Loop vô tận cho đến khi Sudden Death
            
            export let suddenDeathAudio = new Audio('Sudden-death.mp3');
            suddenDeathAudio.volume = EXTERNAL_AUDIO_VOLUMES.suddenDeath;
            suddenDeathAudio.loop = true; // Loop vô tận cho đến khi Game Over

            let isRealAudioWorking = true;
            realKameAudio.onerror = () => { isRealAudioWorking = false; };
            
            export function playSound(effectType) {
                if (!effectType) return; 
                try {
                const ctx = getAudioCtx();
                
                const gain = ctx.createGain();
                gain.connect(ctx.destination);
                const now = ctx.currentTime;

                function createExplosion(duration, bassFreq, volume) {
                    const bufferSize = Math.floor(ctx.sampleRate * duration); 
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                    
                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;
                    
                    const noiseFilter = ctx.createBiquadFilter();
                    noiseFilter.type = 'lowpass';
                    noiseFilter.frequency.setValueAtTime(1000, now);
                    noiseFilter.frequency.exponentialRampToValueAtTime(50, now + duration);
                    
                    noise.connect(noiseFilter);
                    noiseFilter.connect(gain);
                    noise.start(now);

                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(bassFreq, now);
                    osc.frequency.exponentialRampToValueAtTime(10, now + duration);
                    osc.connect(gain);
                    osc.start(now);
                    osc.stop(now + duration);

                    gain.gain.setValueAtTime(volume, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
                }

                function createTone(type, freqStart, freqEnd, duration, volume) {
                    const osc = ctx.createOscillator();
                    osc.type = type;
                    osc.frequency.setValueAtTime(freqStart, now);
                    if(freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
                    
                    osc.connect(gain);
                    gain.gain.setValueAtTime(volume, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
                    
                    osc.start(now);
                    osc.stop(now + duration);
                }

                switch(effectType) {
                    case 'meteor_fall': createTone('sawtooth', 300, 50, 0.3, 0.1); break;
                    case 'meteor_giant': createTone('sawtooth', 150, 20, 0.6, 0.3); break;
                    case 'heavy_hit': createExplosion(1.5, 80, 0.5); break; 
                    case 'epic_explosion': 
                        createExplosion(2.5, 50, 0.8); 
                        createTone('square', 100, 20, 1.0, 0.4); 
                        break;
                    case 'burn': createTone('sawtooth', 100, 10, 0.4, 0.1); break;
                    case 'freeze': createTone('square', 800, 200, 0.3, 0.05); break;
                    case 'stun': createTone('triangle', 400, 600, 0.4, 0.1); break;
                    case 'poison': createTone('square', 150, 50, 0.6, 0.1); break;
                    case 'reflect': createTone('sine', 600, 800, 0.2, 0.1); break;
                    case 'paralyze': createTone('sawtooth', 300, 100, 0.1, 0.1); break;
                    case 'sleep': createTone('sine', 200, 100, 0.8, 0.1); break;
                    case 'draw_skill': createTone('sine', 400, 800, 0.15, 0.1); break;
                    case 'correct': 
                        // Âm thanh giống nhặt vàng Mario (B5 -> E6)
                        createTone('square', 987, 987, 0.08, 0.1); 
                        setTimeout(() => createTone('sine', 1318, 1318, 0.4, 0.2), 80);
                        break;
                    case 'wrong': 
                        createTone('sawtooth', 150, 50, 0.4, 0.3); // Gắt hơn một chút
                        break;
                    case 'kame_charge':
                        const chargeOsc = ctx.createOscillator();
                        chargeOsc.type = 'sine';
                        chargeOsc.frequency.setValueAtTime(200, now);
                        chargeOsc.frequency.exponentialRampToValueAtTime(1500, now + 1.5);
                        chargeOsc.connect(gain);
                        gain.gain.setValueAtTime(0.01, now);
                        gain.gain.linearRampToValueAtTime(0.2, now + 1.5);
                        chargeOsc.start(now);
                        chargeOsc.stop(now + 1.5);
                        break;
                    case 'kame_blast': createExplosion(2.0, 150, 0.4); break;
                    case 'bow_shoot': createTone('triangle', 800, 100, 0.15, 0.2); break;
                    case 'shield_hit_bloop': createTone('sine', 300, 800, 0.15, 0.5); break; 
                    case 'hp_hit': 
                        const bs = Math.floor(ctx.sampleRate * 0.2); 
                        const b = ctx.createBuffer(1, bs, ctx.sampleRate);
                        const d = b.getChannelData(0);
                        for (let i = 0; i < bs; i++) d[i] = Math.random() * 2 - 1;
                        const n = ctx.createBufferSource();
                        n.buffer = b;
                        const nf = ctx.createBiquadFilter();
                        nf.type = 'lowpass'; nf.frequency.setValueAtTime(800, now);
                        n.connect(nf); nf.connect(gain);
                        gain.gain.setValueAtTime(0.4, now);
                        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                        n.start(now);
                        createTone('square', 150, 50, 0.2, 0.3); 
                        break;
                    case 'heal': createTone('sine', 400, 1200, 0.6, 0.2); break;
                    case 'deflect': createTone('sine', 800, 200, 0.1, 0.3); break;
                }
                } catch(e) { console.warn('Audio error (non-fatal):', e); }
            }
