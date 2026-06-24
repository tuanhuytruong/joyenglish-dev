import { playSound } from './audio.js';

            // ========================================================
            // ⚓ [NEO 1]: HÀM BỔ TRỢ ĐẺ ICON/TEXT (FLOATING ICONS)
            // ========================================================
            export const WEAPON_ASSETS = {
                '🏹': { type: 'straight', content: '🏹' },
                '🪃': { type: 'spin', content: '🪃' },
                '🍌': { type: 'spin', content: '🍌' },
                '🩴': { type: 'spin', content: '🩴' },
                '🦖': { type: 'animal', content: '🦖' },
                '🐡': { type: 'spin', content: '🐡' },
                '🦈': { type: 'animal', content: '🦈' },
                '🐱': { type: 'animal', content: '🐱' },
                'omelette': { type: 'spin', content: '<svg viewBox="0 0 100 100" width="30" height="30" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4));"><path d="M 50 15 C 65 15, 75 5, 85 15 C 95 25, 100 45, 90 55 C 95 70, 80 85, 65 85 C 50 95, 30 90, 20 75 C 5 70, 5 50, 15 35 C 10 20, 30 10, 50 15 Z" fill="#fff"/><circle cx="50" cy="50" r="22" fill="#FFC107"/><circle cx="45" cy="45" r="6" fill="#FFD54F"/></svg>' }
            };

            export function spawnFloatingText(targetElement, text, amount, duration, startScale = 1, endScale = 1.5, offsetRange = 60, specificColor = null) {
                amount = Math.min(amount, 2);
                const rect = targetElement.getBoundingClientRect();
                const targetX = rect.left + rect.width / 2 + window.scrollX;
                const targetY = rect.top + rect.height / 2 + window.scrollY;
                for(let i = 0; i < amount; i++) {
                    const item = document.createElement('div');
                    item.innerText = text;
                    item.style.position = 'absolute';
                    item.style.left = (targetX - 15) + 'px'; 
                    item.style.top = (targetY - 15) + 'px';
                    item.style.fontSize = '35px'; 
                    item.style.fontFamily = 'Arial, sans-serif';
                    item.style.fontWeight = '900'; 
                    if(specificColor) item.style.color = specificColor;
                    item.style.textShadow = '0 0 5px black';
                    item.style.zIndex = '10000';
                    item.style.pointerEvents = 'none';
                    document.body.appendChild(item);
                    
                    const endX = (Math.random() - 0.5) * (offsetRange / 2);
                    const endY = -offsetRange - 80; 
                    
                    item.animate([
                        { transform: `translate(0px, 0px) scale(${startScale})`, opacity: 1 },
                        { transform: `translate(${endX}px, ${endY}px) scale(${endScale})`, opacity: 0 }
                    ], { duration: duration + Math.random() * 200, easing: 'ease-out' }).onfinish = () => item.remove();
                }
            };

            export function takeDamage(targetPrefix, amount) {
                let state = window.GameplayManager.state;
                let target = state[targetPrefix];
                let dmg = amount;
                let hitShield = false;
                let hitHP = false;

                if (target.shield > 0) {
                    hitShield = true;
                    if (target.shield >= dmg) {
                        target.shield -= dmg;
                        dmg = 0; 
                    } else {
                        dmg -= target.shield; 
                        target.shield = 0;
                    }
                }

                if (dmg > 0) {
                    hitHP = true;
                    target.hp = Math.max(0, target.hp - dmg);
                }

                window.GameplayManager.updateUI();

                const targetAvatarBox = document.getElementById(`${targetPrefix}-avatar-box`);
                const targetAvatarInner = document.getElementById(`${targetPrefix}-avatar-inner`) || targetAvatarBox; 
                
                if (hitShield) {
                    playSound('shield_hit_bloop');
                    const bubble = document.getElementById(`${targetPrefix}-shield-bubble`);
                    if(bubble) bubble.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: 150 });
                }
                
                if (hitHP) {
                    playSound('hp_hit');
                    targetAvatarInner.animate([{ transform: 'translate(0, 0)' }, { transform: 'translate(-5px, 5px)' }, { transform: 'translate(5px, -5px)' }, { transform: 'translate(0, 0)' }], { duration: 150 });
                    spawnFloatingIcons(targetAvatarBox, ['😭', '😢', '😰', '💢'], 1, 900, 0.5, 1.8, 100);
                    window.spawnFloatingText(targetAvatarBox, `-${Math.round(dmg)}`, 1, 1000, 1.5, 0.5, 60, '#e74c3c');
                }

                if (target.hp <= 0 && window.GameplayManager.state.isPlaying) {
                    window.triggerEndGame(targetPrefix === 'p1' ? 'p2' : 'p1');
                }

                return { hitShield: hitShield, hitHP: hitHP };
            };

            export function fireConfetti() {
                const container = document.getElementById('confetti-container');
                container.innerHTML = '';
                const colors = ['#fce18a', '#ff726d', '#b48def', '#f4306d', '#4ade80', '#60a5fa'];
                for(let i=0; i<150; i++) {
                    let conf = document.createElement('div');
                    conf.style.position = 'absolute';
                    conf.style.width = (Math.random() * 10 + 5) + 'px';
                    conf.style.height = (Math.random() * 20 + 10) + 'px';
                    conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    conf.style.left = Math.random() * 100 + '%';
                    conf.style.top = '-20px';
                    conf.style.opacity = Math.random() + 0.5;
                    conf.style.transform = `rotate(${Math.random() * 360}deg)`;
                    container.appendChild(conf);

                    conf.animate([
                        { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                        { transform: `translate(${(Math.random() - 0.5)*300}px, ${window.innerHeight}px) rotate(${Math.random() * 1080}deg)`, opacity: 0 }
                    ], { duration: 1500 + Math.random() * 2000, easing: 'cubic-bezier(.37,0,.63,1)' });
                }
            };

            export function createDeflectedProjectile(startX, startY, weaponValue, isMovingRight) {
                const weaponData = WEAPON_ASSETS[weaponValue] || { type: 'straight', content: weaponValue };
                const def = document.createElement('div');
                def.innerHTML = weaponData.content;
                def.style.position = 'absolute';
                def.style.fontSize = '30px';
                def.style.zIndex = '10000';
                def.style.pointerEvents = 'none';
                def.style.left = startX + 'px';
                def.style.top = startY + 'px';
                def.style.filter = 'grayscale(30%) brightness(1.5)'; 
                let flipScale = weaponData.type === 'animal' ? (isMovingRight ? 'scaleX(-1)' : 'scaleX(1)') : '';
                document.body.appendChild(def);
                playSound('deflect');

                const bounceDirection = isMovingRight ? -1 : 1; 
                const flyX = bounceDirection * (100 + Math.random() * 100); 
                const flyY = -100 + Math.random() * 250; 

                def.animate([
                    { transform: `translate(-50%, -50%) ${flipScale} rotate(0deg) scale(1)`, opacity: 1 },
                    { transform: `translate(calc(-50% + ${flyX}px), calc(-50% + ${flyY}px)) ${flipScale} rotate(${Math.random() * 1080}deg) scale(0.5)`, opacity: 0 }
                ], { duration: 400 + Math.random() * 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }).onfinish = () => def.remove();
            };

            export function playWeaponBarrage(attacker, target) {
                const attackerAvatar = document.getElementById(`${attacker}-avatar-box`);
                const targetAvatar = document.getElementById(`${target}-avatar-box`);

                const startX = attackerAvatar.getBoundingClientRect().left + attackerAvatar.offsetWidth / 2 + window.scrollX;
                const startY = attackerAvatar.getBoundingClientRect().top + attackerAvatar.offsetHeight / 2 + window.scrollY;
                const targetCenterX = targetAvatar.getBoundingClientRect().left + targetAvatar.offsetWidth / 2 + window.scrollX;
                const targetCenterY = targetAvatar.getBoundingClientRect().top + targetAvatar.offsetHeight / 2 + window.scrollY;

                const weaponValue = attacker === 'p1' ? '🏹' : '🩴'; 
                const weaponData = WEAPON_ASSETS[weaponValue] || { type: 'straight', content: weaponValue };
                const isSpinning = weaponData.type === 'spin';
                const isAnimal = weaponData.type === 'animal';
                const isMovingRight = startX < targetCenterX;

                const PROJECTILE_COUNT = 4;
                for (let i = 0; i < PROJECTILE_COUNT; i++) {
                    setTimeout(() => {
                        playSound('bow_shoot'); 
                        let finalTargetX, finalTargetY;
                        let targetShield = window.GameplayManager.state[target].shield;
                        
                        if (targetShield > 0) {
                            const baseAngleBack = Math.atan2(startY - targetCenterY, startX - targetCenterX);
                            const angleVariance = (Math.random() - 0.5) * 1.5; 
                            const finalAngle = baseAngleBack + angleVariance;
                            const shieldRadius = 90; 
                            finalTargetX = targetCenterX + Math.cos(finalAngle) * shieldRadius;
                            finalTargetY = targetCenterY + Math.sin(finalAngle) * shieldRadius;
                        } else {
                            const variance = 50; 
                            finalTargetX = targetCenterX + (Math.random() * variance * 2 - variance);
                            finalTargetY = targetCenterY + (Math.random() * variance * 2 - variance);
                        }

                        const projectile = document.createElement('div');
                        projectile.innerHTML = weaponData.content;
                        projectile.style.position = 'absolute';
                        projectile.style.fontSize = '30px';
                        projectile.style.zIndex = '10000';
                        projectile.style.pointerEvents = 'none';
                        document.body.appendChild(projectile);

                        const travelAngle = Math.atan2(finalTargetY - startY, finalTargetX - startX);
                        const pointAngle = travelAngle * (180 / Math.PI) + 45; 

                        let startTransform, endTransform;
                        if (isSpinning) {
                            startTransform = `translate(-50%, -50%) rotate(0deg)`;
                            endTransform = `translate(-50%, -50%) rotate(${1080 * (Math.random() > 0.5 ? 1 : -1)}deg)`;
                        } else if (isAnimal) {
                            let faceScale = isMovingRight ? 'scaleX(-1)' : 'scaleX(1)';
                            startTransform = `translate(-50%, -50%) ${faceScale}`;
                            endTransform = `translate(-50%, -50%) ${faceScale}`;
                        } else {
                            startTransform = `translate(-50%, -50%) rotate(${pointAngle}deg)`;
                            endTransform = `translate(-50%, -50%) rotate(${pointAngle}deg)`;
                        }

                        const anim = projectile.animate([
                            { transform: startTransform, left: startX+'px', top: startY+'px' },
                            { transform: endTransform, left: finalTargetX+'px', top: finalTargetY+'px' }
                        ], { duration: 450 + Math.random() * 200, easing: 'ease-out' });

                        anim.onfinish = () => {
                            projectile.remove();
                            let atkDmg = parseFloat(document.getElementById(attacker === 'p1' ? 'hero-mana-atk' : 'boss-mana-atk')?.value) || 10;
                            let dmgPerHit = atkDmg / PROJECTILE_COUNT; 
                            const result = window.takeDamage(target, dmgPerHit); 
                            
                            if (result.hitShield) {
                                window.createDeflectedProjectile(finalTargetX, finalTargetY, weaponValue, isMovingRight);
                            }
                        };
                    }, i * 100); 
                }
            };


            export function spawnFloatingIcons(targetElement, itemsArray, amount, duration, startScale = 1, endScale = 1.5, offsetRange = 60) {
                amount = Math.min(amount, 6);
                const rect = targetElement.getBoundingClientRect();
                const targetX = rect.left + rect.width / 2 + window.scrollX;
                const targetY = rect.top + rect.height / 2 + window.scrollY;

                for(let i = 0; i < amount; i++) {
                    const item = document.createElement('div');
                    item.innerText = itemsArray[Math.floor(Math.random() * itemsArray.length)];
                    item.style.position = 'absolute';
                    item.style.left = (targetX - 20) + 'px'; 
                    item.style.top = (targetY - 20) + 'px';
                    item.style.fontSize = (20 + Math.random() * 10) + 'px';
                    item.style.fontWeight = 'bold'; 
                    item.style.color = '#fff';
                    item.style.textShadow = '0 0 5px black'; 
                    item.style.zIndex = '10000';
                    item.style.pointerEvents = 'none';
                    document.body.appendChild(item);

                    const endX = (Math.random() - 0.5) * offsetRange;
                    const endY = (Math.random() - 0.5) * offsetRange - 50; 

                    item.animate([
                        { transform: `translate(0px, 0px) scale(${startScale}) rotate(0deg)`, opacity: 1 },
                        { transform: `translate(${endX}px, ${endY}px) scale(${endScale}) rotate(${Math.random()*360}deg)`, opacity: 0 }
                    ], { duration: duration + Math.random() * 200, easing: 'ease-out' }).onfinish = () => item.remove();
                }
            }

            // ========================================================
            // ⚓ [NEO 2]: TỔNG ĐÀI HIỆU ỨNG NHẬN SÁT THƯƠNG
            // ========================================================
            export function triggerStatusEffect(targetElement, targetPrefix, effectType, effectDuration = 3000, isHeavyHit = false) {
                if (!targetElement) return;

                playSound(effectType);
                if (isHeavyHit) playSound('heavy_hit'); 

                if (isHeavyHit) {
                    document.body.animate([
                        { transform: 'translate(0, 0) scale(1)' },
                        { transform: 'translate(-25px, 20px) scale(1.02)' },
                        { transform: 'translate(25px, -25px) scale(1.01)' },
                        { transform: 'translate(0, 0) scale(1)' }
                    ], { duration: 600, easing: 'ease-out' });
                } else if(effectType) { 
                    document.body.animate([
                        { transform: 'translate(0, 0)' },
                        { transform: 'translate(-5px, 5px)' },
                        { transform: 'translate(5px, -5px)' },
                        { transform: 'translate(0, 0)' }
                    ], { duration: 150 });
                }

                if (targetElement.effectIntervalId) {
                    clearInterval(targetElement.effectIntervalId);
                }

                targetElement.style.borderRadius = '50%';

                switch(effectType) {
                    case 'burn':
                        targetElement.style.backgroundColor = 'rgba(255, 69, 0, 0.5)'; 
                        targetElement.style.boxShadow = 'inset 0 0 30px red, 0 0 20px orange';
                        setTimeout(() => { targetElement.style.backgroundColor = ''; targetElement.style.boxShadow = ''; }, effectDuration);
                        break;
                    case 'poison':
                        targetElement.style.backgroundColor = 'rgba(50, 205, 50, 0.5)'; 
                        targetElement.style.boxShadow = 'inset 0 0 30px green';
                        
                        targetElement.effectIntervalId = setInterval(() => { 
                            spawnFloatingIcons(targetElement, ['🤢', '🤮', '🫧'], 2, 1000); 
                            targetElement.style.opacity = '0.5';
                            setTimeout(() => targetElement.style.opacity = '1', 200);
                        }, 1000);
                        
                        setTimeout(() => { 
                            clearInterval(targetElement.effectIntervalId);
                            targetElement.style.backgroundColor = ''; 
                            targetElement.style.boxShadow = ''; 
                        }, effectDuration);
                        break;
                    case 'stun':
                        targetElement.animate([ { transform: 'translate(-3px, 0)' }, { transform: 'translate(3px, 0)' } ], { duration: 100, iterations: 10 }); 
                        spawnFloatingIcons(targetElement, ['⭐', '💫', '✨'], 4, 1000, 1, 1.2, 80);
                        break;
                    case 'reflect':
                        spawnFloatingIcons(targetElement, ['Haha! 😂', 'Lêu lêu! 😜', 'Non! 🤣'], 3, 1200, 1, 1.5, 100);
                        setTimeout(() => spawnFloatingIcons(targetElement, ['🤣', '😂', '👎'], 2, 1000), 300);
                        break;
                    case 'paralyze':
                        targetElement.style.backgroundColor = '#FFD700';
                        setTimeout(() => targetElement.style.backgroundColor = '', effectDuration);
                        break;
                    case 'freeze':
                        targetElement.style.backgroundColor = 'rgba(0, 255, 255, 0.3)'; 
                        targetElement.style.boxShadow = 'inset 0 0 30px cyan, 0 0 15px cyan';
                        targetElement.classList.add('icy-spikes'); 
                        
                        if (targetPrefix === 'p1') window.GameplayManager.state.p1.isFrozen = true;
                        if (targetPrefix === 'p2') window.GameplayManager.state.p2.isFrozen = true;
                        
                        let actionBox = document.getElementById(`actions-${targetPrefix}`);
                        if(actionBox) {
                            actionBox.classList.add('frozen-ui', 'icy-spikes');
                        }

                        targetElement.effectIntervalId = setInterval(() => { 
                            spawnFloatingIcons(targetElement, ['❄️', '🧊'], 2, 800); 
                        }, 1000);

                        setTimeout(() => { 
                            clearInterval(targetElement.effectIntervalId);
                            targetElement.style.backgroundColor = ''; 
                            targetElement.style.boxShadow = ''; 
                            targetElement.classList.remove('icy-spikes');
                            
                            if (targetPrefix === 'p1') window.GameplayManager.state.p1.isFrozen = false;
                            if (targetPrefix === 'p2') window.GameplayManager.state.p2.isFrozen = false;
                            
                            if(actionBox) {
                                actionBox.classList.remove('frozen-ui', 'icy-spikes');
                            }
                        }, effectDuration);
                        break;
                }
            }
