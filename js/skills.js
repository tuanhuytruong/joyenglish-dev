import { playSound, realKameAudio } from './audio.js';
import { spawnFloatingIcons, spawnFloatingText, takeDamage, triggerStatusEffect, playWeaponBarrage } from './effects.js';

let isRealAudioWorking = true;
realKameAudio.onerror = () => { isRealAudioWorking = false; };

export function triggerClickSkill(playerPrefix, skillType) {
            if (window.GameplayManager) {
                if(skillType === 'ult') {
                    window.GameplayManager.handleSkill(playerPrefix);
                } else {
                    window.useBasicSkill(playerPrefix, skillType);
                }
            }
        };

            export function applyHealOverTime(caster, totalAmount, durationMs) {
                let state = window.GameplayManager.state;
                let player = state[caster];

                const targetAvatarBox = document.getElementById(`${caster}-avatar-box`);
                const targetAvatarInner = document.getElementById(`${caster}-avatar-inner`) || targetAvatarBox;
                
                targetAvatarInner.animate([
                    { boxShadow: '0 0 0px 0px rgba(46, 204, 113, 0)' },
                    { boxShadow: '0 0 25px 15px rgba(46, 204, 113, 0.8)' },
                    { boxShadow: '0 0 0px 0px rgba(46, 204, 113, 0)' }
                ], { duration: 1000, iterations: 3 }); 

                const ticks = 10; 
                const tickInterval = durationMs / ticks;
                const amountPerTick = totalAmount / ticks;
                let currentTick = 0;

                const healTimer = setInterval(() => {
                    if (!state.isPlaying) { clearInterval(healTimer); return; }
                    player.hp = Math.min(player.maxHp, player.hp + amountPerTick);
                    window.GameplayManager.updateUI();
                    currentTick++;
                    if (currentTick >= ticks) clearInterval(healTimer);
                }, tickInterval);

                const plusTimer = setInterval(() => {
                    if (!state.isPlaying) { clearInterval(plusTimer); return; }
                    window.spawnFloatingText(targetAvatarBox, '+', 1, 1000, 1.5, 0.5, 60, '#2ecc71');
                }, durationMs / 5);

                setTimeout(() => { clearInterval(plusTimer); }, durationMs);
            };





            // ========================================================
            // ⚓ [NEO 3]: KHU VỰC THIẾT KẾ CÁC KỸ NĂNG (SKILLS)
            // ========================================================
            export function playMeteorShower(attackerPrefix, targetPrefix) {
                const targetAvatar = document.getElementById(`${targetPrefix}-avatar-box`);
                if (!targetAvatar) return;

                const totalMeteors = 8;
                const fastInterval = 90; 
                
                // 1. Thả 14 viên nhỏ liên tục
                for (let i = 0; i < totalMeteors - 1; i++) {
                    setTimeout(() => {
                        createAndDropMeteor(targetAvatar, targetPrefix, false);
                        playSound('meteor_fall');
                    }, i * fastInterval); 
                }

                // 2. Tụ lực & Cảnh báo
                const giantMeteorDelay = (totalMeteors - 1) * fastInterval + 350;
                
                setTimeout(() => {
                    targetAvatar.animate([
                        { boxShadow: '0 0 0px red' },
                        { boxShadow: '0 0 50px red' },
                        { boxShadow: '0 0 0px red' }
                    ], { duration: 350, iterations: 1 });
                }, giantMeteorDelay - 350);

                // 3. Giáng viên khổng lồ thứ 15
                setTimeout(() => {
                    createAndDropMeteor(targetAvatar, targetPrefix, true);
                    playSound('meteor_giant'); 
                }, giantMeteorDelay);
            }

            function createAndDropMeteor(targetElement, targetPrefix, isGiant) {
                const rect = targetElement.getBoundingClientRect();
                const targetX = rect.left + rect.width / 2 + window.scrollX;
                const targetY = rect.top + rect.height / 2 + window.scrollY;

                const meteor = document.createElement('div');
                meteor.innerText = '☄️';
                meteor.style.position = 'absolute'; 
                meteor.style.zIndex = '9999';
                meteor.style.pointerEvents = 'none';

                if (isGiant) {
                    meteor.style.fontSize = '250px'; 
                    meteor.style.filter = 'drop-shadow(0 0 20px #ff4500) brightness(1.5)';
                } else {
                    meteor.style.fontSize = '40px';
                }

                const startX = targetX + (Math.random() * 300 - 150);
                const startY = targetY - (isGiant ? 600 : 400) - Math.random() * 100; 

                meteor.style.left = startX + 'px';
                meteor.style.top = startY + 'px';
                meteor.style.transform = 'translate(-50%, -50%)'; 
                
                document.body.appendChild(meteor);

                const angle = Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
                const adjustAngle = angle - 135; 
                
                const fallDuration = isGiant ? 600 : (150 + Math.random() * 100);

                const animation = meteor.animate([
                    { transform: `translate(-50%, -50%) rotate(${adjustAngle}deg) scale(0.5)`, opacity: 0 },
                    { transform: `translate(-50%, -50%) rotate(${adjustAngle}deg) scale(1)`, opacity: 1, offset: 0.1 },
                    { transform: `translate(calc(-50% + ${targetX - startX}px), calc(-50% + ${targetY - startY}px)) rotate(${adjustAngle}deg) scale(1)`, opacity: 1 } 
                ], {
                    duration: fallDuration,
                    easing: 'ease-in'
                });

                animation.onfinish = () => {
                    meteor.remove();
                    
                    let dmg = parseFloat(document.querySelector('[data-save="skill_3_dmg"]')?.value) || 5;
                    
                    if (isGiant) {
                        playSound('epic_explosion'); 
                        triggerStatusEffect(targetElement, targetPrefix, 'burn', 4000, true); 
                        spawnFloatingIcons(targetElement, ['🪨', '⛰️', '💥', '💨'], 15, 1500, 1, 2.5, 120);
                        // Batch most meteor damage into the giant hit to avoid many UI updates.
                        window.takeDamage(targetPrefix, dmg * 12);
                    } else {
                        triggerStatusEffect(targetElement, targetPrefix, 'burn', 180, false);
                    }
                };
            }

            export function playKamehamehaAnimation(attackerPrefix, targetPrefix) {
                const attackerAvatar = document.getElementById(`${attackerPrefix}-avatar-box`);
                const targetAvatar = document.getElementById(`${targetPrefix}-avatar-box`);
                if (!attackerAvatar || !targetAvatar) return;

                const attRect = attackerAvatar.getBoundingClientRect();
                const tarRect = targetAvatar.getBoundingClientRect();
                
                // Lấy chính xác Tâm của Avatar
                const startX = attRect.left + attRect.width / 2 + window.scrollX;
                const startY = attRect.top + attRect.height / 2 + window.scrollY;
                const targetX = tarRect.left + tarRect.width / 2 + window.scrollX;
                const targetY = tarRect.top + tarRect.height / 2 + window.scrollY;

                const dx = targetX - startX;
                const dy = targetY - startY;
                const distance = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const isP1 = (attackerPrefix === 'p1');

                if (isRealAudioWorking && realKameAudio.readyState >= 2) {
                    realKameAudio.currentTime = 0; 
                    realKameAudio.play().catch(e => console.log("Cần click vào màn hình để cho phép phát tiếng"));
                } else {
                    playSound('kame_charge'); 
                }

                // =========================================================================
                const CHARGE_TIME = 1600; 
                const BEAM_DURATION = 900;
                const GIF_STAY_TIME = 700;
                
                const GIF_OFFSET_X = 0;
                const GIF_OFFSET_Y = 0; 

                const LASER_HEIGHT = 42; 
                const LASER_OFFSET_X = isP1 ? 30 : -30; 
                const LASER_OFFSET_Y = 0; 
                // =========================================================================

                const gif = document.createElement('img');
                gif.src = 'kamekameha.gif'; 
                gif.className = 'goku-gif';
                
                gif.onerror = function() {
                    this.src = 'https://placehold.co/120x120/1a1a2e/00ffff?text=GOKU';
                    this.style.borderRadius = '50%';
                    this.style.border = '2px solid cyan';
                };

                gif.style.left = (startX + GIF_OFFSET_X) + 'px';
                gif.style.top = (startY + GIF_OFFSET_Y) + 'px';
                gif.style.transform = `translate(-50%, -50%) ${isP1 ? '' : 'scaleX(-1)'}`;
                document.body.appendChild(gif);

                let energyBall = null;
                if (!isRealAudioWorking) {
                    energyBall = document.createElement('div');
                    energyBall.className = 'kamehameha-ball';
                    
                    energyBall.style.left = (startX + GIF_OFFSET_X) + 'px';
                    energyBall.style.top = (startY + GIF_OFFSET_Y) + 'px';
                    const ballOffsetX = isP1 ? 60 : -60; 
                    energyBall.style.transform = `translate(calc(-50% + ${ballOffsetX}px), -50%)`;
                    document.body.appendChild(energyBall);

                    energyBall.animate([
                        { width: '0px', height: '0px', opacity: 0 },
                        { width: '20px', height: '20px', opacity: 1, offset: 0.2 },
                        { width: '60px', height: '60px', opacity: 1 } 
                    ], { duration: CHARGE_TIME, fill: 'forwards' });
                }

                setTimeout(() => {
                    if (!isRealAudioWorking) playSound('kame_blast'); 
                    
                    // Avoid full-screen shake here; it was the main Kamehameha jank source.
                    triggerStatusEffect(attackerAvatar, attackerPrefix, '', 0, false);

                    const beam = document.createElement('div');
                    beam.className = 'kamehameha-beam';
                    
                    beam.style.height = LASER_HEIGHT + 'px';
                    beam.style.left = (startX + LASER_OFFSET_X) + 'px';
                    
                    beam.style.top = (startY + GIF_OFFSET_Y + LASER_OFFSET_Y - (LASER_HEIGHT / 2)) + 'px'; 
                    beam.style.width = (distance - Math.abs(LASER_OFFSET_X)) + 'px';
                    beam.style.transform = `rotate(${angle}deg)`;
                    document.body.appendChild(beam);

                    const beamAnim = beam.animate([
                        { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 1 },
                        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.05 }, 
                        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.8 }, 
                        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0 } 
                    ], { duration: BEAM_DURATION, easing: 'ease-out' });

                    setTimeout(() => {
                        triggerStatusEffect(targetAvatar, targetPrefix, 'burn', 3000, true);
                        targetAvatar.animate([
                            { transform: 'translate(-6px, 0)' }, { transform: 'translate(6px, 0)' }
                        ], { duration: 45, iterations: 8 });
                        
                        // --- THÊM TAKE DAMAGE Ở ĐÂY ---
                        let dmg = parseFloat(document.querySelector('[data-save="skill_10_dmg"]')?.value) || 120;
                        window.takeDamage(targetPrefix, dmg);
                    }, 50);

                    setTimeout(() => {
                        if (gif && document.body.contains(gif)) {
                            gif.animate([{opacity: 1}, {opacity: 0}], {duration: 300}).onfinish = () => gif.remove();
                        }
                    }, GIF_STAY_TIME);

                    beamAnim.onfinish = () => { 
                        beam.remove(); 
                        if(energyBall) energyBall.remove(); 
                    };
                }, CHARGE_TIME); 
            }

            export function triggerCooldownUI(btnId, txtId, cooldownSeconds) {
                const btn = document.getElementById(btnId);
                if (!btn || btn.classList.contains('on-cd')) return false; 
                const ring = btn.querySelector('.cd-ring');
                const overlay = btn.querySelector('.cd-overlay');
                const text = document.getElementById(txtId);

                btn.classList.add('on-cd');
                ring.style.display = 'block'; overlay.style.display = 'block'; text.style.display = 'flex';

                const durationMs = cooldownSeconds * 1000;
                const startTime = performance.now();

                function updateFrame(currentTime) {
                    const elapsed = currentTime - startTime;
                    const remaining = Math.max(0, durationMs - elapsed);
                    text.innerText = (remaining / 1000).toFixed(1);
                    ring.style.setProperty('--p', `${(elapsed / durationMs) * 100}%`);
                    if (remaining > 0) requestAnimationFrame(updateFrame);
                    else {
                        btn.classList.remove('on-cd');
                        ring.style.display = 'none'; overlay.style.display = 'none'; text.style.display = 'none';
                        btn.classList.add('cd-ready-flash');
                        setTimeout(() => btn.classList.remove('cd-ready-flash'), 500);
                    }
                }
                requestAnimationFrame(updateFrame);
                return true; 
            };

            export function useBasicSkill(caster, skillType, options = {}) {
                if (!window.GameplayManager || !window.GameplayManager.state.isPlaying) return;
                
                let state = window.GameplayManager.state[caster];
                if (state.isFrozen || state.isStunned) {
                    playSound('wrong'); 
                    return;
                }
                
                const isGodMode = window.GameplayManager?.isGodMode?.() || false;
                let cdSec = 3;
                if (isGodMode) {
                    cdSec = 0.5;
                } else {
                    if (skillType === 'atk') cdSec = parseFloat(document.getElementById('setting_cd_atk')?.value) || 3;
                    if (skillType === 'def') cdSec = parseFloat(document.getElementById('setting_cd_def')?.value) || 5;
                    if (skillType === 'heal') cdSec = parseFloat(document.getElementById('setting_cd_heal')?.value) || 8;
                }

                const btnId = `btn-${caster}-${skillType}`;
                const txtId = `cd-txt-${caster}-${skillType}`;

                if (options.bypassCooldown || window.triggerCooldownUI(btnId, txtId, cdSec)) {
                    let target = caster === 'p1' ? 'p2' : 'p1';
                    
                    if (skillType === 'atk') {
                        window.playWeaponBarrage(caster, target);
                    } 
                    else if (skillType === 'def') {
                        playSound('shield_hit_bloop'); 
                        let defAmount = parseFloat(document.getElementById(caster === 'p1' ? 'hero-mana-def' : 'boss-mana-def')?.value) || 10;
                        let maxShield = parseFloat(document.getElementById(caster === 'p1' ? 'hero-max-shield' : 'boss-max-shield')?.value) || 100;
                        
                        // Cộng dồn shield, nhưng không vượt qua Max Shield
                        state.shield = Math.min(state.shield + defAmount, maxShield);
                        
                        window.GameplayManager.updateUI();
                    }
                    else if (skillType === 'heal') {
                        playSound('heal');
                        let healAmt = parseFloat(document.getElementById(caster === 'p1' ? 'hero-mana-heal' : 'boss-mana-heal')?.value) || 15;
                        window.applyHealOverTime(caster, healAmt, 3000); 
                    }
                }
            };
