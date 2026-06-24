import { mainThemeAudio, suddenDeathAudio, winAudio, defeatedAudio } from './audio.js';
import { spawnFloatingIcons, fireConfetti } from './effects.js';

export function saveMatchToHistory(winnerPrefix, durationStr) {
                let p1Name = window.GameplayManager.state.p1.name || 'P1';
                let p2Name = window.GameplayManager.state.p2.name || 'P2';
                let p1Avatar = document.getElementById('p1-avatar-inner').innerHTML;
                let p2Avatar = document.getElementById('p2-avatar-inner').innerHTML;

                let matchRecord = {
                    time: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}),
                    duration: durationStr,
                    p1: { name: p1Name, avatar: p1Avatar, isWinner: winnerPrefix === 'p1' },
                    p2: { name: p2Name, avatar: p2Avatar, isWinner: winnerPrefix === 'p2' }
                };

                let history = JSON.parse(localStorage.getItem('pvp_match_history') || '[]');
                history.unshift(matchRecord); // Thêm vào đầu
                if(history.length > 20) history.pop(); // Giữ tối đa 20 trận
                localStorage.setItem('pvp_match_history', JSON.stringify(history));
                
                renderHallOfFame();
            }

            export function renderHallOfFame() {
                let history = JSON.parse(localStorage.getItem('pvp_match_history') || '[]');
                let tbody = document.getElementById('history-tbody');
                tbody.innerHTML = '';
                
                history.forEach(match => {
                    let tr = document.createElement('tr');
                    tr.className = "hover:bg-slate-700/30 transition-colors";
                    
                    let p1Style = match.p1.isWinner ? 'text-blue-400 font-bold drop-shadow-[0_0_5px_blue]' : 'text-slate-500 grayscale opacity-60';
                    let p2Style = match.p2.isWinner ? 'text-red-400 font-bold drop-shadow-[0_0_5px_red]' : 'text-slate-500 grayscale opacity-60';
                    
                    tr.innerHTML = `
                        <td class="px-4 py-3 whitespace-nowrap text-slate-400">
                            <span class="block text-xs">${match.time}</span>
                            <span class="block text-[10px] text-yellow-500 font-mono">⏱️ ${match.duration}</span>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap">
                            <div class="flex items-center gap-2 ${p1Style}">
                                <div class="w-8 h-8 rounded-full overflow-hidden border border-current shrink-0">${match.p1.avatar}</div>
                                <span>${match.p1.name}</span>
                            </div>
                        </td>
                        <td class="px-4 py-3 whitespace-nowrap text-center text-slate-600 font-black text-xs">VS</td>
                        <td class="px-4 py-3 whitespace-nowrap">
                            <div class="flex items-center justify-end gap-2 ${p2Style}">
                                <span>${match.p2.name}</span>
                                <div class="w-8 h-8 rounded-full overflow-hidden border border-current shrink-0">${match.p2.avatar}</div>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            document.getElementById('btn-clear-history').addEventListener('click', () => {
                if(confirm("Bạn có chắc muốn xóa toàn bộ lịch sử đấu?")) {
                    localStorage.removeItem('pvp_match_history');
                    renderHallOfFame();
                }
            });

            export function triggerEndGame(winnerPrefix) {
                window.GameplayManager.state.isPlaying = false;
                
                // Tắt các nhạc nền đang chạy trong trận
                mainThemeAudio.pause();
                suddenDeathAudio.pause();

                // Phát âm thanh Defeated
                defeatedAudio.currentTime = 0;
                defeatedAudio.play().catch(e => console.log("Cần tương tác để phát âm thanh"));

                let loserPrefix = winnerPrefix === 'p1' ? 'p2' : 'p1';
                let winnerBox = document.getElementById(`${winnerPrefix}-avatar-box`);
                let loserBox = document.getElementById(`${loserPrefix}-avatar-box`);

                // 1. Kẻ thua: Xám xịt, văng khóc
                loserBox.style.transition = 'all 1s ease';
                loserBox.style.filter = 'grayscale(100%) brightness(0.5)';
                loserBox.style.transform = 'scale(0.8) translateY(40px) rotate(-15deg)';
                spawnFloatingIcons(loserBox, ['😭', '💢', '💦'], 10, 2000, 1, 2, 100);

                // 2. Hoạt ảnh Linh hồn & Đầu lâu
                const rect = loserBox.getBoundingClientRect();
                const targetX = rect.left + rect.width / 2 + window.scrollX;
                const targetY = rect.top + rect.height / 2 + window.scrollY;

                // Linh hồn bay lên
                let ghost = document.createElement('div');
                ghost.innerText = '👻';
                ghost.style.position = 'absolute';
                ghost.style.left = (targetX - 30) + 'px';
                ghost.style.top = (targetY - 30) + 'px';
                ghost.style.fontSize = '60px';
                ghost.style.zIndex = '5000';
                ghost.style.pointerEvents = 'none';
                ghost.style.filter = 'drop-shadow(0 0 10px cyan)';
                document.body.appendChild(ghost);

                ghost.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 0 },
                    { transform: 'translate(0, -50px) scale(1.2) rotate(10deg)', opacity: 1, offset: 0.3 },
                    { transform: 'translate(0, -150px) scale(1.5) rotate(-10deg)', opacity: 0 }
                ], { duration: 2000, easing: 'ease-out' }).onfinish = () => {
                    ghost.remove();
                    
                    // Đầu lâu nổ bùm
                    let skull = document.createElement('div');
                    skull.innerText = '☠️';
                    skull.style.position = 'absolute';
                    skull.style.left = (targetX - 50) + 'px';
                    skull.style.top = (targetY - 180) + 'px';
                    skull.style.fontSize = '100px';
                    skull.style.zIndex = '5000';
                    skull.style.pointerEvents = 'none';
                    document.body.appendChild(skull);

                    skull.animate([
                        { transform: 'scale(0.5)', opacity: 1 },
                        { transform: 'scale(2)', opacity: 1, offset: 0.5 },
                        { transform: 'scale(3)', opacity: 0 }
                    ], { duration: 800 }).onfinish = () => skull.remove();
                };

                // 3. Người thắng: Chờ linh hồn bay xong (2 giây) rồi mới Zoom in & Pháo hoa
                setTimeout(() => {
                    // Nhạc chiến thắng
                    winAudio.currentTime = 0;
                    winAudio.play().catch(e => console.log(e));

                    winnerBox.style.transition = 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                    winnerBox.style.zIndex = '5000';
                    winnerBox.style.borderRadius = '50%'; // Đảm bảo box-shadow hình tròn
                    winnerBox.style.boxShadow = '0 0 100px 30px rgba(255, 215, 0, 0.9)';
                    winnerBox.style.transform = 'scale(2.5) translateY(-20px)';
                    
                    // Hiện Modal End Game
                    setTimeout(() => {
                        document.getElementById('endgame-modal').classList.remove('hidden');
                        let winnerName = window.GameplayManager.state[winnerPrefix].name || (winnerPrefix === 'p1' ? 'P1' : 'P2');
                        document.getElementById('winner-title').innerText = `${winnerName} WINS!`;
                        document.getElementById('winner-avatar').innerHTML = document.getElementById(`${winnerPrefix}-avatar-inner`).innerHTML;
                        
                        // Lưu lịch sử
                        let elapsedTotalSec = Math.floor((Date.now() - window.GameplayManager.state.matchStartTime) / 1000);
                        let mins = Math.floor(elapsedTotalSec / 60).toString().padStart(2, '0');
                        let secs = (elapsedTotalSec % 60).toString().padStart(2, '0');
                        saveMatchToHistory(winnerPrefix, `${mins}:${secs}`);

                        fireConfetti();
                    }, 1000);
                }, 2000);
            }

                export function updateUI(state) {
                    ['p1', 'p2'].forEach(p => {
                        let player = state[p];
                        
                        let shieldTxt = player.shield > 0 ? ` (+${Math.round(player.shield)})` : '';
                        document.getElementById(`${p}-hp-txt`).innerText = `${Math.round(player.hp)} / ${player.maxHp}${shieldTxt}`;
                        document.getElementById(`${p}-hp-bar`).style.width = `${(player.hp / player.maxHp) * 100}%`;
                        
                        let bubble = document.getElementById(`${p}-shield-bubble`);
                        if (bubble) {
                            if (player.shield > 0) {
                                bubble.classList.add('active');
                                if(p === 'p1') {
                                    bubble.style.borderColor = 'rgba(0, 168, 255, 0.8)';
                                    bubble.style.background = 'rgba(0, 168, 255, 0.2)';
                                    bubble.style.boxShadow = '0 0 15px rgba(0, 168, 255, 0.5), inset 0 0 15px rgba(0, 168, 255, 0.3)';
                                } else {
                                    bubble.style.borderColor = 'rgba(255, 71, 87, 0.8)';
                                    bubble.style.background = 'rgba(255, 71, 87, 0.2)';
                                    bubble.style.boxShadow = '0 0 15px rgba(255, 71, 87, 0.5), inset 0 0 15px rgba(255, 71, 87, 0.3)';
                                }
                            } else {
                                bubble.classList.remove('active');
                            }
                        }

                        document.getElementById(`${p}-mana-txt`).innerText = `Mana: ${player.mana}/10`;
                        document.getElementById(`${p}-mana-bar`).style.width = `${(player.mana / 10) * 100}%`;

                        const cashEl = document.getElementById(`${p}-cash-txt`);
                        if (cashEl) cashEl.innerText = `$${Math.round(player.cash || 0)}`;
                        const streakEl = document.getElementById(`${p}-streak-txt`);
                        if (streakEl) streakEl.innerText = player.streak || 0;
                        const shopCosts = { mana: 20, shield: 30, double: 40 };
                        Object.entries(shopCosts).forEach(([upgradeId, cost]) => {
                            const btn = document.getElementById(`shop-${p}-${upgradeId}`);
                            if (!btn) return;
                            const disabled = !window.GameplayManager?.state?.isPlaying || !window.GameplayManager?.state?.shopEnabled || (player.cash || 0) < cost;
                            btn.disabled = disabled;
                            btn.classList.toggle('is-disabled', disabled);
                        });

                        let q1 = document.getElementById(`${p}-queue-1`);
                        let q2 = document.getElementById(`${p}-queue-2`);
                        
                        if (player.queue.length > 1) {
                            q2.innerHTML = `<span class="drop-shadow-md">${player.queue[1].icon}</span>`;
                            q2.classList.replace('opacity-40', 'opacity-100');
                        } else {
                            q2.innerHTML = '';
                            q2.classList.replace('opacity-100', 'opacity-40');
                        }

                        if (player.queue.length > 0) {
                            q1.innerHTML = `<span class="drop-shadow-lg scale-125">${player.queue[0].icon}</span>`;
                            q1.classList.add('animate-pulse');
                            q1.style.filter = p === 'p1' ? 'drop-shadow(0 0 10px cyan)' : 'drop-shadow(0 0 10px orange)';
                        } else {
                            q1.innerHTML = `<span class="opacity-20 text-${p === 'p1' ? 'cyan-200' : 'orange-200'}">✨</span>`;
                            q1.classList.remove('animate-pulse');
                            q1.style.filter = 'none';
                        }
                    });
                }
