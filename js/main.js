import { EXTERNAL_AUDIO_VOLUMES, playSound, realKameAudio, mainThemeAudio, suddenDeathAudio, winAudio, defeatedAudio, welcomeAudio } from './audio.js';
import { WEAPON_ASSETS, spawnFloatingText, takeDamage, fireConfetti, createDeflectedProjectile, playWeaponBarrage, spawnFloatingIcons, triggerStatusEffect } from './effects.js';
import { gameState } from './state.js';
import { saveMatchToHistory, renderHallOfFame, triggerEndGame, updateUI } from './ui.js';
import { loadSettings, saveSettings } from './settings.js';
import { triggerClickSkill, applyHealOverTime, playMeteorShower, playKamehamehaAnimation, useBasicSkill, triggerCooldownUI } from './skills.js';
import { registerUploadedImages, clearUploadedImages, getUploadedImageCount, applyImageWithFallback } from './imageResolver.js';

// Expose functions needed by inline HTML handlers and cross-module window references
window.triggerClickSkill = triggerClickSkill;
window.takeDamage = takeDamage;
window.spawnFloatingText = spawnFloatingText;
window.fireConfetti = fireConfetti;
window.createDeflectedProjectile = createDeflectedProjectile;
window.playWeaponBarrage = playWeaponBarrage;
window.triggerEndGame = triggerEndGame;
window.applyHealOverTime = applyHealOverTime;
window.triggerCooldownUI = triggerCooldownUI;
window.useBasicSkill = useBasicSkill;
window.triggerClickShop = function(playerPrefix, upgradeId) {
    if (!window.GameplayManager || typeof window.GameplayManager.buyUpgrade !== 'function') {
        console.warn('Shop is not ready yet');
        return;
    }
    window.GameplayManager.buyUpgrade(playerPrefix, upgradeId);
};

        window.triggerClickAnswer = function(playerPrefix, index) {
            if (window.GameplayManager) {
                window.GameplayManager.handlePlayerAnswer(playerPrefix, index);
            }
        };


            // ========================================================
            // BIẾN TOÀN CỤC
            // ========================================================

            // ========================================================
            // ⚓ [NEO -1]: HỆ THỐNG LƯU TRỮ (LOCAL STORAGE)
            // ========================================================


            // =========================================================================
            // TABS & DATA GRID & MODAL LOGIC
            // =========================================================================
            const gridContainer = document.getElementById('debug-grid');
            for(let r = 1; r <= 9; r++) {
                for(let c = 0; c < 16; c++) {
                    const cell = document.createElement('div');
                    cell.className = "border border-green-400/50 flex items-start justify-start p-1 text-green-400 font-mono text-xs";
                    cell.innerText = String.fromCharCode(65 + c) + r;
                    gridContainer.appendChild(cell);
                }
            }
            document.getElementById('toggle-grid-btn').addEventListener('click', () => {
                gridContainer.classList.toggle('hidden');
            });

            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    tabBtns.forEach(b => { 
                        b.classList.remove('active', 'border-b-4', 'border-orange-500', 'text-orange-600', 'bg-edNavy', 'text-white'); 
                        b.classList.add('bg-e5e7eb', 'text-374151'); 
                    });
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    btn.classList.remove('bg-e5e7eb', 'text-374151'); 
                    if(btn.dataset.target === 'tab-controls') {
                        btn.classList.add('active', 'border-b-4', 'border-orange-500', 'text-orange-600'); 
                    } else {
                        btn.classList.add('active', 'bg-edNavy', 'text-white');
                    }
                    document.getElementById(btn.dataset.target).classList.add('active');
                });
            });

            const modal = document.getElementById('settings-modal');
            const modalContent = document.getElementById('modal-content');
            
            document.getElementById('open-settings-btn').addEventListener('click', () => {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            });
            
            document.getElementById('close-settings-btn').addEventListener('click', () => {
                modal.classList.add('opacity-0', 'pointer-events-none');
                modalContent.classList.add('scale-95');
                modalContent.classList.remove('scale-100');
            });

            const keybindInputs = document.querySelectorAll('.keybind-input');
            let activeKeybindInput = null;

            keybindInputs.forEach(input => {
                input.addEventListener('focus', function() {
                    activeKeybindInput = this;
                    this.value = '...';
                });
                input.addEventListener('blur', function() {
                    if (this.value === '...') {
                        this.value = this.dataset.oldValue || 'A'; 
                    }
                    activeKeybindInput = null;
                });
                input.dataset.oldValue = input.value;
            });

            document.addEventListener('keydown', (e) => {
                if (activeKeybindInput) {
                    e.preventDefault(); 
                    let key = e.key;
                    
                    if (e.code.startsWith('Numpad') && key >= '0' && key <= '9') {
                        key = 'NUM' + key;
                    } else if (e.code === 'NumpadEnter') {
                        key = 'NUM ENTER';
                    }
                    
                    if(key === ' ') key = 'SPACE';
                    else if(key === 'Enter') key = 'ENTER';
                    else if(key.length === 1) key = key.toUpperCase();
                    else if(key.startsWith('Arrow')) key = key.replace('Arrow', 'A-');

                    activeKeybindInput.value = key;
                    activeKeybindInput.dataset.oldValue = key;
                    activeKeybindInput.blur(); 
                    activeKeybindInput.dispatchEvent(new Event('change'));
                }
            });

            const tbody = document.getElementById('grid-body');
            let currentRowCount = 0;
            const colATypeSelect = document.getElementById('col-a-type');
            const colBTypeSelect = document.getElementById('col-b-type');
            const colALbl = document.getElementById('col-a-lbl');
            const colBLbl = document.getElementById('col-b-lbl');

            function updateGridHeaders() {
                colALbl.textContent = colATypeSelect.value === 'image' ? '(Upload / URL / images/)' : '(Text)';
                colBLbl.textContent = colBTypeSelect.value === 'image' ? '(Upload / URL / images/)' : '(Text)';
                refreshImagePreviews();
            }

            function refreshImagePreviews() {
                document.querySelectorAll('.excel-input').forEach(inp => {
                    inp.dispatchEvent(new Event('input'));
                });
            }

            function refreshUploadedImagesCount() {
                const uploadedCount = document.getElementById('uploaded-images-count');
                if (uploadedCount) uploadedCount.textContent = `${getUploadedImageCount()} ảnh`;
            }

            function collectActiveGridData() {
                const rows = [];
                for (let r = 1; r <= currentRowCount; r++) {
                    const colA = document.querySelector(`.excel-input[data-col="colA"][data-row="${r}"]`)?.value?.trim();
                    const colB = document.querySelector(`.excel-input[data-col="colB"][data-row="${r}"]`)?.value?.trim();
                    const active = document.querySelector(`.custom-checkbox[data-col="active"][data-row="${r}"]`)?.checked;
                    if (colA && colB && active) rows.push({ cotA: colA, cotB: colB, active });
                }
                return rows;
            }

            function updateSetupStatus() {
                const card = document.getElementById('setup-status-card');
                const text = document.getElementById('setup-status-text');
                if (!card || !text) return;
                const rows = collectActiveGridData();
                const uniqueAnswers = new Set(rows.map(row => row.cotB));
                card.classList.remove('ready', 'warning', 'error');
                if (rows.length === 0) {
                    card.classList.add('error');
                    card.firstElementChild.textContent = '⚠️ Chưa có data';
                    text.textContent = 'Cần ít nhất 4 dòng active';
                } else if (rows.length < 4 || uniqueAnswers.size < 4) {
                    card.classList.add('warning');
                    card.firstElementChild.textContent = '⚠️ Cần thêm đáp án';
                    text.textContent = `${rows.length} câu, ${uniqueAnswers.size} đáp án khác nhau`;
                } else {
                    card.classList.add('ready');
                    card.firstElementChild.textContent = '✅ Sẵn sàng';
                    text.textContent = `${rows.length} câu active, ${uniqueAnswers.size} đáp án`;
                }
            }

            function showAnswerFeedback(answerIndex, message, type) {
                const card = document.querySelectorAll('#answers-container > div')[answerIndex];
                if (!card) return;
                const rect = card.getBoundingClientRect();
                const pop = document.createElement('div');
                pop.className = `answer-feedback-pop ${type}`;
                pop.textContent = message;
                pop.style.left = `${rect.left + rect.width / 2}px`;
                pop.style.top = `${rect.top + rect.height / 2}px`;
                document.body.appendChild(pop);
                setTimeout(() => pop.remove(), 1200);
            }

            function showShopToast(message, type = 'success') {
                const toast = document.createElement('div');
                toast.className = `shop-toast ${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 1100);
            }


            const SAMPLE_DATA_SETS = {
                animals: [
                    ['cat', 'mèo'], ['dog', 'chó'], ['bird', 'chim'], ['fish', 'cá'],
                    ['rabbit', 'thỏ'], ['tiger', 'hổ'], ['monkey', 'khỉ'], ['elephant', 'voi']
                ],
                classroom: [
                    ['book', 'sách'], ['pen', 'bút'], ['desk', 'bàn học'], ['chair', 'ghế'],
                    ['board', 'bảng'], ['teacher', 'giáo viên'], ['student', 'học sinh'], ['bag', 'cặp sách']
                ],
                actions: [
                    ['run', 'chạy'], ['jump', 'nhảy'], ['read', 'đọc'], ['write', 'viết'],
                    ['listen', 'nghe'], ['speak', 'nói'], ['draw', 'vẽ'], ['sing', 'hát']
                ]
            };

            function fillSampleData(sampleKey) {
                const rows = SAMPLE_DATA_SETS[sampleKey] || SAMPLE_DATA_SETS.animals;
                while (currentRowCount < rows.length) { createGridRow(currentRowCount + 1); }
                for (let r = 1; r <= currentRowCount; r++) {
                    const pair = rows[r - 1] || ['', ''];
                    const colA = document.querySelector(`.excel-input[data-col="colA"][data-row="${r}"]`);
                    const colB = document.querySelector(`.excel-input[data-col="colB"][data-row="${r}"]`);
                    const checkbox = document.querySelector(`.custom-checkbox[data-col="active"][data-row="${r}"]`);
                    if (colA) { colA.value = pair[0]; colA.dispatchEvent(new Event('input')); }
                    if (colB) { colB.value = pair[1]; colB.dispatchEvent(new Event('input')); }
                    if (checkbox) checkbox.checked = Boolean(pair[0] && pair[1]);
                }
                document.querySelectorAll('.sample-data-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.sample === sampleKey));
                updateSetupStatus();
                showShopToast(`Loaded ${rows.length} ${sampleKey} questions`, 'success');
            }

            const uploadInput = document.getElementById('image-upload-input');
            const uploadBtn = document.getElementById('btn-upload-images');
            const clearUploadBtn = document.getElementById('btn-clear-uploaded-images');

            uploadBtn?.addEventListener('click', () => uploadInput?.click());
            uploadInput?.addEventListener('change', () => {
                registerUploadedImages(uploadInput.files);
                uploadInput.value = '';
                refreshUploadedImagesCount();
                refreshImagePreviews();
            });
            clearUploadBtn?.addEventListener('click', () => {
                clearUploadedImages();
                refreshUploadedImagesCount();
                refreshImagePreviews();
            });

            colATypeSelect.addEventListener('change', updateGridHeaders);
            colBTypeSelect.addEventListener('change', updateGridHeaders);

            function attachInputListeners(input) {
                input.addEventListener('focus', function() { this.parentElement.classList.add('focused'); });
                input.addEventListener('blur', function() { this.parentElement.classList.remove('focused'); });
                
                input.addEventListener('input', function() {
                    const row = this.dataset.row;
                    const colName = this.dataset.col; 
                    const type = colName === 'colA' ? colATypeSelect.value : colBTypeSelect.value;
                    const previewImg = document.getElementById(`preview-${colName}-${row}`);
                    const val = this.value.trim();

                    if (type === 'image' && val !== '') {
                        applyImageWithFallback(previewImg, val, {
                            onFail: () => {
                                previewImg.src = 'https://placehold.co/32x32/f1f5f9/94a3b8?text=X';
                            }
                        });
                        previewImg.classList.remove('hidden');
                        this.style.paddingRight = '40px'; 
                    } else {
                        previewImg.classList.add('hidden');
                        previewImg.removeAttribute('src');
                        this.style.paddingRight = '8px';
                    }
                    updateSetupStatus();
                });

                input.addEventListener('keydown', function(e) {
                    if(activeKeybindInput) return; 
                    const row = parseInt(this.dataset.row); 
                    const col = this.dataset.col; 
                    if (e.key === 'Tab' && !e.shiftKey && col === 'colB' && row === currentRowCount) {
                        e.preventDefault();
                        addDataRow({ focus: true });
                        return;
                    }
                    let nextRow = row; let nextInput = null;
                    if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); nextRow = row < currentRowCount ? row + 1 : row; nextInput = document.querySelector(`.excel-input[data-row="${nextRow}"][data-col="${col}"]`); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); nextRow = row > 1 ? row - 1 : 1; nextInput = document.querySelector(`.excel-input[data-row="${nextRow}"][data-col="${col}"]`); }
                    else if (e.key === 'ArrowRight' && this.selectionStart === this.value.length) { if(col === 'colA') nextInput = document.querySelector(`.excel-input[data-row="${row}"][data-col="colB"]`); if(nextInput) e.preventDefault(); }
                    else if (e.key === 'ArrowLeft' && this.selectionStart === 0) { if(col === 'colB') nextInput = document.querySelector(`.excel-input[data-row="${row}"][data-col="colA"]`); if(nextInput) e.preventDefault(); }
                    if (nextInput) nextInput.focus();
                });
            }

            function createGridRow(i) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="row-num">${i}</td>
                    <td class="excel-cell">
                        <div class="flex items-center w-full h-full relative">
                            <input type="text" class="excel-input text-left" data-col="colA" data-row="${i}">
                            <img src="" class="img-preview hidden" id="preview-colA-${i}">
                        </div>
                    </td>
                    <td class="excel-cell">
                        <div class="flex items-center w-full h-full relative">
                            <input type="text" class="excel-input text-left" data-col="colB" data-row="${i}">
                            <img src="" class="img-preview hidden" id="preview-colB-${i}">
                        </div>
                    </td>
                    <td class="excel-cell flex items-center justify-center"><input type="checkbox" class="custom-checkbox" data-col="active" data-row="${i}" checked></td>
                `;
                tbody.appendChild(tr);
                tr.querySelectorAll('.excel-input').forEach(attachInputListeners);
                tr.querySelector('.custom-checkbox')?.addEventListener('change', updateSetupStatus);
                currentRowCount = i;
                updateSetupStatus();
            }

            function addDataRow({ focus = true } = {}) {
                createGridRow(currentRowCount + 1);
                if (focus) {
                    document.querySelector(`.excel-input[data-col="colA"][data-row="${currentRowCount}"]`)?.focus();
                }
                updateSetupStatus();
            }

            for (let i = 1; i <= 5; i++) { createGridRow(i); }
            updateGridHeaders();
            document.getElementById('btn-add-row')?.addEventListener('click', () => addDataRow());

            document.querySelectorAll('.sample-data-btn').forEach(btn => {
                btn.addEventListener('click', () => fillSampleData(btn.dataset.sample));
            });

            document.getElementById('btn-clear-data').addEventListener('click', () => {
                if(confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu hiện tại?')) {
                    document.querySelectorAll('.excel-input').forEach(inp => { inp.value = ''; inp.dispatchEvent(new Event('input')); });
                    document.querySelectorAll('.custom-checkbox').forEach(cb => cb.checked = false);
                    localStorage.removeItem('pvp_game_data');
                }
            });

            document.getElementById('data-grid').addEventListener('paste', function(e) {
                e.preventDefault(); 
                const pastedData = (e.clipboardData || window.clipboardData).getData('Text'); if (!pastedData) return;
                const activeElement = document.activeElement; if (!activeElement.classList.contains('excel-input')) return;
                const startRow = parseInt(activeElement.dataset.row); 
                const columns = ['colA', 'colB']; 
                let startColIndex = columns.indexOf(activeElement.dataset.col);
                const rows = pastedData.split(/\r?\n/); 
                const neededRows = startRow + rows.length - 1;
                while(currentRowCount < neededRows) { createGridRow(currentRowCount + 1); }
                let cRow = startRow;
                rows.forEach(row => {
                    if (row.trim() === '') return;
                    const cells = row.split('\t'); let currentColIndex = startColIndex;
                    cells.forEach(cellText => {
                        if (currentColIndex < columns.length) {
                            const targetInput = document.querySelector(`.excel-input[data-col="${columns[currentColIndex]}"][data-row="${cRow}"]`);
                            if (targetInput) { targetInput.value = cellText; targetInput.dispatchEvent(new Event('input')); }
                        }
                        currentColIndex++;
                    });
                    cRow++;
                });
            });

            const DEFAULT_AVATAR_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlM2E4YSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzgiIHI9IjE4IiBmaWxsPSIjOTNjNWZkIi8+PGVsbGlwc2UgY3g9IjUwIiBjeT0iODUiIHJ4PSIyOCIgcnk9IjIwIiBmaWxsPSIjOTNjNWZkIi8+PC9zdmc+';

            function getAvatarHtml(val) {
                if(!val) return "";
                const isUrl = val.startsWith('http') || val.startsWith('data:');
                const tenorMatch = val.match(/tenor\.com\/view\/.*-(\d+)$/);
                if (tenorMatch) { return `<div class="avatar-media-wrap"><iframe src="https://tenor.com/embed/${tenorMatch[1]}" width="100%" height="100%" frameBorder="0" scrolling="no" class="avatar-media pointer-events-none bg-black" allowtransparency="true"></iframe></div>`; } 
                else if (isUrl) { return `<div class="avatar-media-wrap"><img src="${val}" class="avatar-media pointer-events-none bg-black" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR_SVG}';" /></div>`; } 
                else { return `<div class="avatar-media-wrap"><img src="Hero/${val}.png" onerror="if(this.src.includes('.png')){this.src='Hero/${val}.jpg'}else{this.onerror=null;this.src='${DEFAULT_AVATAR_SVG}';}" class="avatar-media pointer-events-none bg-black" /></div>`; }
            }

            const GAME_PRESETS = {
                classic: { label: 'PvP', quizMode: 'sequential', bossHp: 100, heroHp: 100, p1Name: 'P1', p2Name: 'P2', stunTime: 2, timerSeconds: 180, rewardMultiplier: 1, shopEnabled: false },
                raid: { label: 'Boss Raid', quizMode: 'random', bossHp: 1600, heroHp: 100, p1Name: 'P1', p2Name: 'BOSS', stunTime: 2.5, timerSeconds: 240, rewardMultiplier: 1.35, shopEnabled: true },
                god: { label: 'God Mode', quizMode: 'random', bossHp: 1600, heroHp: 100, p1Name: 'P1', p2Name: 'BOSS', stunTime: 0.5, timerSeconds: 240, rewardMultiplier: 1.35, shopEnabled: true, godMode: true }
            };

            function safeSetText(elementId, textValue) {
                const el = document.getElementById(elementId);
                if (el && textValue) el.innerText = textValue;
            }

            function isShopEnabledForCurrentSettings() {
                const shopToggle = document.getElementById('setting_shop_enabled');
                if (shopToggle) return !!shopToggle.checked;
                const preset = GAME_PRESETS[document.getElementById('setting_game_preset')?.value || 'classic'] || GAME_PRESETS.classic;
                return !!preset.shopEnabled;
            }

            function updateShopEnabledUI(isEnabled = isShopEnabledForCurrentSettings()) {
                document.body.classList.toggle('shop-enabled', !!isEnabled);
            }

            function syncShopKeyHints() {
                const mapping = {
                    key_p1_shop_mana: 'ui-key-p1-shop-mana',
                    key_p1_shop_shield: 'ui-key-p1-shop-shield',
                    key_p1_shop_double: 'ui-key-p1-shop-double',
                    key_p2_shop_mana: 'ui-key-p2-shop-mana',
                    key_p2_shop_shield: 'ui-key-p2-shop-shield',
                    key_p2_shop_double: 'ui-key-p2-shop-double'
                };
                Object.entries(mapping).forEach(([saveKey, hintId]) => {
                    const input = document.querySelector(`[data-save="${saveKey}"]`);
                    safeSetText(hintId, input?.value || '');
                });
            }

            function applyPreset(presetId, { updateInputs = true } = {}) {
                const presetKey = GAME_PRESETS[presetId] ? presetId : 'classic';
                const preset = GAME_PRESETS[presetKey];
                const hidden = document.getElementById('setting_game_preset');
                if (hidden) hidden.value = presetKey;
                document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.preset === presetKey));
                if (updateInputs) {
                    const quizMode = document.getElementById('setting_quiz_mode');
                    const bossHp = document.getElementById('boss-max-hp');
                    const heroHp = document.getElementById('hero-max-hp');
                    const stunTime = document.getElementById('setting_stun_time');
                    const shopToggle = document.getElementById('setting_shop_enabled');
                    const p1NameInput = document.getElementById('p1-name-input');
                    const p2NameInput = document.getElementById('p2-name-input');
                    if (quizMode) quizMode.value = preset.quizMode;
                    if (bossHp) bossHp.value = preset.bossHp;
                    if (heroHp) heroHp.value = preset.heroHp;
                    if (stunTime) stunTime.value = preset.stunTime;
                    if (shopToggle) shopToggle.checked = !!preset.shopEnabled;
                    if (p1NameInput) p1NameInput.value = preset.p1Name || 'P1';
                    if (p2NameInput) p2NameInput.value = preset.p2Name || 'P2';
                }
                const hudMode = document.getElementById('hud-mode-label');
                if (hudMode) hudMode.innerText = preset.label;
                updateShopEnabledUI();
            }

            const svgTick = `<div class="bg-white rounded-full p-2 shadow-[0_0_20px_rgba(34,197,94,0.8)]"><svg class="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg></div>`;
            const svgCross = `<div class="bg-white rounded-full p-2 shadow-[0_0_20px_rgba(239,68,68,0.8)]"><svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></div>`;

            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
            });
            document.querySelectorAll('[data-save^="key_"]').forEach(inp => {
                inp.addEventListener('change', syncShopKeyHints);
            });
            document.getElementById('setting_shop_enabled')?.addEventListener('change', () => updateShopEnabledUI());

            document.getElementById('save-and-close-btn').addEventListener('click', function() {
                try {
                    this.blur(); 
                    const savedKeys = {};
                    document.querySelectorAll('.keybind-input').forEach(inp => { savedKeys[inp.dataset.save] = inp.value; });
                    
                    safeSetText('ui-key-p1-a1', savedKeys.key_p1_a1); safeSetText('ui-ans-p1-1', savedKeys.key_p1_a1);
                    safeSetText('ui-key-p1-a2', savedKeys.key_p1_a2); safeSetText('ui-ans-p1-2', savedKeys.key_p1_a2);
                    safeSetText('ui-key-p1-a3', savedKeys.key_p1_a3); safeSetText('ui-ans-p1-3', savedKeys.key_p1_a3);
                    safeSetText('ui-key-p1-a4', savedKeys.key_p1_a4); safeSetText('ui-ans-p1-4', savedKeys.key_p1_a4);
                    
                    safeSetText('ui-key-p1-s1', savedKeys.key_p1_s1); safeSetText('ui-key-p1-s2', savedKeys.key_p1_s2);
                    safeSetText('ui-key-p1-s3', savedKeys.key_p1_s3); safeSetText('ui-key-p1-ult', savedKeys.key_p1_ult);

                    safeSetText('ui-key-p2-a1', savedKeys.key_p2_a1); safeSetText('ui-ans-p2-1', savedKeys.key_p2_a1);
                    safeSetText('ui-key-p2-a2', savedKeys.key_p2_a2); safeSetText('ui-ans-p2-2', savedKeys.key_p2_a2);
                    safeSetText('ui-key-p2-a3', savedKeys.key_p2_a3); safeSetText('ui-ans-p2-3', savedKeys.key_p2_a3);
                    safeSetText('ui-key-p2-a4', savedKeys.key_p2_a4); safeSetText('ui-ans-p2-4', savedKeys.key_p2_a4);
                    
                    safeSetText('ui-key-p2-s1', savedKeys.key_p2_s1); safeSetText('ui-key-p2-s2', savedKeys.key_p2_s2);
                    safeSetText('ui-key-p2-s3', savedKeys.key_p2_s3); safeSetText('ui-key-p2-ult', savedKeys.key_p2_ult);

                    safeSetText('ui-key-p1-shop-mana', savedKeys.key_p1_shop_mana);
                    safeSetText('ui-key-p1-shop-shield', savedKeys.key_p1_shop_shield);
                    safeSetText('ui-key-p1-shop-double', savedKeys.key_p1_shop_double);
                    safeSetText('ui-key-p2-shop-mana', savedKeys.key_p2_shop_mana);
                    safeSetText('ui-key-p2-shop-shield', savedKeys.key_p2_shop_shield);
                    safeSetText('ui-key-p2-shop-double', savedKeys.key_p2_shop_double);

                    const p1Av = document.getElementById('p1-avatar-input').value;
                    const p2Av = document.getElementById('p2-avatar-input').value;
                    if(p1Av) {
                        let avHtml = getAvatarHtml(p1Av);
                        document.getElementById('p1-avatar-inner').innerHTML = avHtml.replace(/^<div class="avatar-media-wrap">|<\/div>$/g, '');
                        document.getElementById('vs-p1-avatar').innerHTML = avHtml;
                    }
                    if(p2Av) {
                        let avHtml = getAvatarHtml(p2Av);
                        document.getElementById('p2-avatar-inner').innerHTML = avHtml.replace(/^<div class="avatar-media-wrap">|<\/div>$/g, '');
                        document.getElementById('vs-p2-avatar').innerHTML = avHtml;
                    }

                    let gridData = collectActiveGridData();
                    
                    saveSettings(gridData);
                    
                    if (gridData.length < 4) {
                        alert("Please enter and tick at least 4 valid rows of data to have 4 options!");
                        return; // DO NOT CLOSE MODAL
                    }

                    if (typeof window.GameplayManager !== 'undefined') { window.GameplayManager.initGame(null, gridData); }

                    document.getElementById('close-settings-btn').click();
                    document.getElementById('vs-modal').classList.remove('hidden');
                } catch(e) {
                    alert("ERROR in save and close: " + e.message + "\n" + e.stack);
                }
            });

            document.getElementById('btn-play-again').addEventListener('click', function() {
                document.getElementById('endgame-modal').classList.add('hidden');
                
                // Tắt nhạc Win và các nhạc nền khác để đảm bảo im lặng trước trận mới
                winAudio.pause();
                winAudio.currentTime = 0;
                mainThemeAudio.pause();
                mainThemeAudio.currentTime = 0;
                suddenDeathAudio.pause();
                suddenDeathAudio.currentTime = 0;
                
                // Reset hiệu ứng chết/thắng của Avatar để vào trận mới
                ['p1', 'p2'].forEach(p => {
                     const box = document.getElementById(`${p}-avatar-box`);
                     box.style.transition = 'none'; 
                     box.style.filter = ''; 
                     box.style.transform = ''; 
                     box.style.opacity = '1'; 
                     box.style.zIndex = '10';
                     box.style.boxShadow = '';
                     box.style.borderRadius = ''; // Xóa border-radius set thủ công
                     if(box.effectIntervalId) clearInterval(box.effectIntervalId);

                     if(window.GameplayManager && window.GameplayManager.state[p]) {
                         window.GameplayManager.state[p].hp = window.GameplayManager.state[p].maxHp;
                         window.GameplayManager.state[p].shield = 0;
                     }
                });
                
                if (window.GameplayManager) {
                    window.GameplayManager.updateUI();
                    // Reset đồng hồ và câu hỏi
                    window.GameplayManager.state.questionsPassed = 0;
                    window.GameplayManager.state.isSuddenDeath = false; // Đặt lại cờ SD
                    document.getElementById('quiz-timer').classList.remove('text-red-500', 'animate-pulse');
                    if (window.GameplayManager.suddenDeathTimer) clearInterval(window.GameplayManager.suddenDeathTimer);
                }
                document.getElementById('vs-modal').classList.remove('hidden');
            });

            document.getElementById('btn-start-battle').addEventListener('click', function() {
                // Phát âm thanh Welcome
                welcomeAudio.currentTime = 0;
                welcomeAudio.play().catch(e => console.log("Cần tương tác để phát âm thanh"));

                // ======================================================
                // ⚙️ THÔNG SỐ ĐIỀU CHỈNH: THỜI GIAN TRỄ BẬT NHẠC MAIN THEME
                // Đổi số 2000 thành thời gian bạn muốn (ví dụ: 3000 = 3 giây)
                // ======================================================
                const MAIN_THEME_DELAY_MS = 2000;

                // Chờ X giây sau mới bật nhạc nền chính Main Theme
                setTimeout(() => {
                    if (window.GameplayManager && window.GameplayManager.state.isPlaying && !window.GameplayManager.state.isSuddenDeath) {
                        mainThemeAudio.currentTime = 0;
                        mainThemeAudio.play().catch(e => console.log(e));
                    }
                }, MAIN_THEME_DELAY_MS);

                const activePreset = GAME_PRESETS[window.GameplayManager.state.preset] || GAME_PRESETS.classic;
                window.GameplayManager.state.p1.name = document.getElementById('p1-name-input').value || activePreset.p1Name || 'P1';
                window.GameplayManager.state.p2.name = document.getElementById('p2-name-input').value || activePreset.p2Name || 'P2';
                
                document.getElementById('p1-name-input').dispatchEvent(new Event('change'));
                document.getElementById('p2-name-input').dispatchEvent(new Event('change'));

                document.getElementById('vs-modal').classList.add('hidden');
                window.GameplayManager.startGame(); 
            });


            const loaded = loadSettings();
            if (loaded.settings) {
                document.querySelectorAll('[data-save]').forEach(el => {
                    if (loaded.settings[el.dataset.save] !== undefined) {
                        if (el.type === 'checkbox') el.checked = loaded.settings[el.dataset.save];
                        else el.value = loaded.settings[el.dataset.save];
                        el.dispatchEvent(new Event('change')); 
                    }
                });
                applyPreset(document.getElementById('setting_game_preset')?.value || 'classic', { updateInputs: false });
                updateShopEnabledUI();
            } else {
                applyPreset('classic');
            }
            syncShopKeyHints();
            if (loaded.gridData && loaded.gridData.length > 0) {
                const tbody = document.getElementById('grid-body');
                tbody.innerHTML = ''; 
                currentRowCount = 0;
                loaded.gridData.forEach((row, index) => {
                    createGridRow(index + 1);
                    document.querySelector(`.excel-input[data-col="colA"][data-row="${index + 1}"]`).value = row.cotA || '';
                    document.querySelector(`.excel-input[data-col="colB"][data-row="${index + 1}"]`).value = row.cotB || '';
                    document.querySelector(`.custom-checkbox[data-col="active"][data-row="${index + 1}"]`).checked = row.active;
                });
            }
            updateSetupStatus();

            // =========================================================================
            // --- [MODULE: GAMEPLAY_MANAGER_CORE] ---
            // =========================================================================
            const GameplayManager = {
                state: gameState,
                suddenDeathTimer: null,
                SKILL_POOL: [
                    { id: 'copycat', icon: '👁️', ownerKey: 'skill_1_owner' },
                    { id: 'shuriken', icon: '🥷', ownerKey: 'skill_2_owner' },
                    { id: 'meteor', icon: '☄️', ownerKey: 'skill_3_owner' },
                    { id: 'thunder', icon: '⚡', ownerKey: 'skill_4_owner' },
                    { id: 'junk', icon: '🍔', ownerKey: 'skill_5_owner' },
                    { id: 'freeze', icon: '❄️', ownerKey: 'skill_6_owner' },
                    { id: 'mirror', icon: '🛡️', ownerKey: 'skill_7_owner' },
                    { id: 'rest', icon: '💤', ownerKey: 'skill_8_owner' },
                    { id: 'fireball', icon: '🔥', ownerKey: 'skill_9_owner' },
                    { id: 'kamehameha', icon: '🌊', ownerKey: 'skill_10_owner' }
                ],

                initGame: function(settingsData, gridData) {
                    this.state.dataPool = gridData;
                    this.state.totalQuestions = gridData.length;
                    this.state.questionsPassed = 1;
                    
                    this.state.preset = document.getElementById('setting_game_preset')?.value || 'classic';
                    const activePreset = GAME_PRESETS[this.state.preset] || GAME_PRESETS.classic;
                    this.state.mode = document.getElementById('setting_quiz_mode')?.value || activePreset.quizMode || 'sequential';
                    const hudMode = document.getElementById('hud-mode-label');
                    if (hudMode) hudMode.innerText = activePreset.label;
                    this.state.shopEnabled = isShopEnabledForCurrentSettings();
                    updateShopEnabledUI(this.state.shopEnabled);
                    this.state.stunTime = (parseFloat(document.getElementById('setting_stun_time')?.value) || activePreset.stunTime || 2) * 1000;
                    
                    this.state.p1.maxHp = this.state.p1.hp = parseInt(document.getElementById('hero-max-hp')?.value) || activePreset.heroHp || 100;
                    this.state.p2.maxHp = this.state.p2.hp = parseInt(document.getElementById('boss-max-hp')?.value) || activePreset.bossHp || 100;
                    this.state.p1.mana = 0; this.state.p2.mana = 0;
                    this.state.p1.cash = 0; this.state.p2.cash = 0;
                    this.state.p1.streak = 0; this.state.p2.streak = 0;
                    this.state.p1.bestStreak = 0; this.state.p2.bestStreak = 0;
                    this.state.p1.multiplier = activePreset.rewardMultiplier || 1; this.state.p2.multiplier = activePreset.rewardMultiplier || 1;
                    this.state.p1.multiplierTurns = 0; this.state.p2.multiplierTurns = 0;
                    this.state.p1.isStunned = false; this.state.p2.isStunned = false;
                    this.state.p1.isFrozen = false; this.state.p2.isFrozen = false;
                    this.state.p1.queue = []; this.state.p2.queue = [];
                    this.state.p1.lastUltimateAt = 0; this.state.p2.lastUltimateAt = 0;
                    
                    this.state.wrongPool = [];
                    this.state.isRetryPhase = false;
                    this.state.isTransitioning = false;
                    this.buildDecks();
                    this.applyGodModeResources();
                    this.refreshActivePool();
                    this.updateUI();
                    
                    document.getElementById('quiz-counter').innerText = `1/${this.state.totalQuestions}`;
                    renderHallOfFame(); // Hiển thị lịch sử ngay khi load
                },

                updateUI: function() {
                    this.applyGodModeResources();
                    updateUI(this.state);
                },

                isGodMode: function() {
                    return !!(GAME_PRESETS[this.state.preset]?.godMode);
                },

                applyGodModeResources: function() {
                    if (!this.isGodMode()) return;
                    ['p1', 'p2'].forEach(playerPrefix => {
                        const player = this.state[playerPrefix];
                        if (!player) return;
                        player.mana = 10;
                        player.cash = 9999;
                        this.ensureUltimateQueue(playerPrefix);
                    });
                },

                getAvailableSkillPool: function(playerPrefix) {
                    const fallback = this.SKILL_POOL.filter(skill => skill.id === 'meteor' || skill.id === 'kamehameha');
                    const pool = this.SKILL_POOL.filter(skill => {
                        const owner = document.querySelector(`[data-save="${skill.ownerKey}"]`)?.value || 'both';
                        return owner === 'both' || owner === playerPrefix;
                    });
                    return pool.length > 0 ? pool : fallback;
                },

                shuffleSkillPool: function(playerPrefix) {
                    const deck = [...this.getAvailableSkillPool(playerPrefix)];
                    for (let i = deck.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [deck[i], deck[j]] = [deck[j], deck[i]];
                    }
                    return deck;
                },

                buildDecks: function() {
                    // Ultimate deck mirrors the Skills tab: shuffle eligible skills, then consume sequentially before recycling.
                    this.state.p1.deck = this.shuffleSkillPool('p1');
                    this.state.p2.deck = this.shuffleSkillPool('p2');
                },

                drawSkill: function(playerPrefix) {
                    let player = this.state[playerPrefix];
                    if (player.deck.length === 0) {
                        player.deck = this.shuffleSkillPool(playerPrefix);
                    }
                    return player.deck.shift();
                },

                ensureUltimateQueue: function(playerPrefix) {
                    const player = this.state[playerPrefix];
                    if (!player) return;
                    const targetSlots = Math.min(2, Math.floor((player.mana || 0) / 5));
                    while (player.queue.length < targetSlots) {
                        const drawnSkill = this.drawSkill(playerPrefix);
                        if (!drawnSkill) break;
                        player.queue.push(drawnSkill);
                    }
                    if (player.queue.length > targetSlots) {
                        player.queue = player.queue.slice(0, targetSlots);
                    }
                },

                startGame: function() {
                    this.state.isPlaying = true;
                    this.state.matchStartTime = Date.now();
                    this.startSuddenDeathTimer();
                    this.loadNextQuestion();
                },
                
                startSuddenDeathTimer: function() {
                    if (this.suddenDeathTimer) clearInterval(this.suddenDeathTimer);
                    
                    const activePreset = GAME_PRESETS[this.state.preset] || GAME_PRESETS.classic;
                    let limitMinutes = parseFloat(document.getElementById('sudden-death-time')?.value) || (activePreset.timerSeconds / 60) || 3;
                    let limitSec = activePreset.timerSeconds || (limitMinutes * 60);
                    let sdDmg = parseFloat(document.getElementById('sudden-death-dmg')?.value) || 5;
                    let timerEl = document.getElementById('quiz-timer');
                    
                    this.suddenDeathTimer = setInterval(() => {
                        if (!this.state.isPlaying) {
                            clearInterval(this.suddenDeathTimer);
                            return;
                        }
                        
                        let elapsedSec = Math.floor((Date.now() - this.state.matchStartTime) / 1000);
                        let remaining = Math.max(0, limitSec - elapsedSec);
                        
                        let mins = Math.floor(remaining / 60).toString().padStart(2, '0');
                        let secs = (remaining % 60).toString().padStart(2, '0');
                        timerEl.innerText = `${mins}:${secs}`;

                        // Hết giờ: Kích hoạt Sudden Death
                        if (remaining <= 0) {
                            // Chuyển nhạc nếu chưa chuyển
                            if (!this.state.isSuddenDeath) {
                                this.state.isSuddenDeath = true;
                                mainThemeAudio.pause();
                                mainThemeAudio.currentTime = 0; // Đảm bảo ngưng hẳn Main Theme
                                suddenDeathAudio.currentTime = 0;
                                suddenDeathAudio.play().catch(e => console.log("Cần tương tác audio"));

                                // ==========================================
                                // HIỆU ỨNG SUDDEN DEATH: MA QUỶ BAY LÊN
                                // ==========================================
                                for (let i = 0; i < 20; i++) {
                                    setTimeout(() => {
                                        let entity = document.createElement('div');
                                        entity.innerText = Math.random() > 0.4 ? '👻' : (Math.random() > 0.5 ? '💀' : '☠️');
                                        entity.style.position = 'fixed';
                                        entity.style.left = (Math.random() * 100) + 'vw';
                                        entity.style.top = '110vh'; // Bắt đầu từ dưới đáy màn hình
                                        entity.style.fontSize = (50 + Math.random() * 80) + 'px'; 
                                        entity.style.zIndex = '9999';
                                        entity.style.pointerEvents = 'none';
                                        entity.style.filter = 'drop-shadow(0 0 15px red)';
                                        document.body.appendChild(entity);

                                        let duration = 2000 + Math.random() * 2000;
                                        
                                        entity.animate([
                                            { transform: 'translate(-50%, 0) rotate(0deg) scale(0.5)', opacity: 0 },
                                            { transform: `translate(-50%, -30vh) rotate(${(Math.random() - 0.5) * 45}deg) scale(1)`, opacity: 0.9, offset: 0.2 },
                                            { transform: `translate(-50%, -120vh) rotate(${(Math.random() - 0.5) * 90}deg) scale(1.5)`, opacity: 0 }
                                        ], { duration: duration, easing: 'ease-in-out' }).onfinish = () => entity.remove();
                                    }, i * 150); // Xuất hiện lần lượt
                                }
                            }

                            timerEl.classList.add('text-red-500', 'animate-pulse');
                            
                            // Trừ thẳng máu (Sudden Death) bằng hàm takeDamage để kích hoạt hiệu ứng văng máu
                            window.takeDamage('p1', sdDmg);
                            window.takeDamage('p2', sdDmg);
                            
                            // Rung nhẹ màn hình cảnh báo
                            document.body.style.transform = `translate(${(Math.random()-0.5)*4}px, ${(Math.random()-0.5)*4}px)`;
                            setTimeout(()=> document.body.style.transform = '', 100);
                        }
                    }, 1000);
                },

                refreshActivePool: function() {
                    this.state.activePool = [...this.state.dataPool];
                    if (this.state.mode === 'random') { this.state.activePool.sort(() => Math.random() - 0.5); }
                    this.state.wrongPool = [];
                    this.state.isRetryPhase = false;
                },

                loadNextQuestion: function() {
                    if (this.state.activePool.length === 0) {
                        if (this.state.wrongPool.length > 0 && !this.state.isRetryPhase) {
                            this.state.activePool = [...this.state.wrongPool];
                            if (this.state.mode === 'random') { this.state.activePool.sort(() => Math.random() - 0.5); }
                            this.state.wrongPool = [];
                            this.state.isRetryPhase = true; 
                        } else {
                            this.refreshActivePool();
                        }
                    }
                    
                    // Cập nhật Q Counter
                    if (this.state.questionsPassed > this.state.totalQuestions && this.state.totalQuestions > 0) {
                        // Tính chu kỳ lặp lại
                         let displayNum = ((this.state.questionsPassed - 1) % this.state.totalQuestions) + 1;
                         document.getElementById('quiz-counter').innerText = `${displayNum}/${this.state.totalQuestions}`;
                    } else {
                         document.getElementById('quiz-counter').innerText = `${this.state.questionsPassed}/${this.state.totalQuestions}`;
                    }

                    this.state.currentQuestionFails = 0;
                    let quizItem = this.state.activePool.shift(); 
                    if (!quizItem) {
                        console.warn("Quiz pool is empty! Cannot load next question.");
                        return;
                    }
                    let correctAnswer = quizItem.cotB || "N/A";
                    
                    let otherOptions = this.state.dataPool.map(item => item.cotB).filter(val => val !== correctAnswer);
                    let uniqueDistractors = [...new Set(otherOptions)]; 
                    uniqueDistractors.sort(() => Math.random() - 0.5);
                    
                    let selectedDistractors = [];
                    if (uniqueDistractors.length === 0) {
                         selectedDistractors = ["A", "B", "C"]; 
                    } else {
                        for(let i=0; i<3; i++) { 
                            selectedDistractors.push(uniqueDistractors[i % uniqueDistractors.length]); 
                        }
                    }

                    let finalAnswers = [correctAnswer, ...selectedDistractors];
                    finalAnswers.sort(() => Math.random() - 0.5);

                    this.state.currentQuiz = {
                        originalItem: quizItem, 
                        questionImageOrText: quizItem.cotA,
                        correctAnswer: correctAnswer,
                        options: finalAnswers,
                        correctIndex: finalAnswers.indexOf(correctAnswer)
                    };

                    let ansContainer = document.getElementById('answers-container');
                    let quizQ = document.getElementById('question-container');
                    
                    ansContainer.classList.add('opacity-0', 'scale-90');
                    quizQ.classList.add('opacity-0', 'scale-90');
                    
                    for(let i=1; i<=4; i++){
                        document.getElementById(`overlay-ans-${i}`).classList.add('hidden');
                        document.getElementById(`icon-ans-${i}`).classList.replace('scale-100', 'scale-0');
                    }

                    setTimeout(() => {
                        this.renderQuizUI();
                        ansContainer.classList.remove('opacity-0', 'scale-90');
                        quizQ.classList.remove('opacity-0', 'scale-90');
                        this.state.isTransitioning = false; 
                    }, 300); 
                },

                renderQuizUI: function() {
                    let qState = this.state.currentQuiz;
                    if (!qState) return;
                    let qImg = document.getElementById('quiz-q-img');
                    let qTxt = document.getElementById('quiz-q-txt');
                    let colAType = document.getElementById('col-a-type').value;
                    let colBType = document.getElementById('col-b-type').value;
                    
                    if (colAType === 'image') {
                        qImg.classList.remove('hidden');
                        qTxt.classList.add('hidden');
                        applyImageWithFallback(qImg, qState.questionImageOrText, {
                            onFail: () => {
                                qImg.classList.add('hidden');
                                qTxt.innerText = qState.questionImageOrText;
                                qTxt.classList.remove('hidden');
                            }
                        });
                    } else {
                        qTxt.innerText = qState.questionImageOrText;
                        qTxt.classList.remove('hidden'); qImg.classList.add('hidden');
                    }

                    let answerButtons = document.querySelectorAll('#answers-container > div');
                    answerButtons.forEach((btn, index) => {
                        let spanTxt = btn.querySelector('span.text-3xl');
                        if (spanTxt && qState.options[index]) {
                            if (colBType === 'image') {
                                spanTxt.innerHTML = '';
                                const ansImg = document.createElement('img');
                                ansImg.className = 'w-full h-full max-h-24 object-contain drop-shadow-md';
                                spanTxt.appendChild(ansImg);
                                applyImageWithFallback(ansImg, qState.options[index], {
                                    onFail: () => {
                                        spanTxt.innerText = qState.options[index];
                                    }
                                });
                            } else { spanTxt.innerText = qState.options[index]; }
                        }
                    });
                },

                addMana: function(playerPrefix, amount) {
                    if (this.isGodMode()) {
                        this.applyGodModeResources();
                        this.updateUI();
                        return;
                    }
                    let player = this.state[playerPrefix];
                    let oldCapacity = Math.floor(player.mana / 5);
                    player.mana = Math.min(10, player.mana + amount);
                    let newCapacity = Math.floor(player.mana / 5);

                    const beforeQueue = player.queue.length;
                    this.ensureUltimateQueue(playerPrefix);
                    if (player.queue.length > beforeQueue) playSound('draw_skill');
                    this.updateUI();
                },

                buyUpgrade: function(playerPrefix, upgradeId) {
                    const player = this.state[playerPrefix];
                    if (!this.state.shopEnabled) {
                        showShopToast('Shop is disabled for this match', 'warning');
                        return;
                    }
                    if (!player || !this.state.isPlaying) return;
                    const upgrades = {
                        mana: { cost: 20, label: '+2 Mana', apply: () => { this.addMana(playerPrefix, 2); } },
                        shield: { cost: 30, label: '+25 Shield', apply: () => { player.shield = Math.min(99, (player.shield || 0) + 25); } },
                        double: { cost: 40, label: '2x Cash x3', apply: () => { player.multiplier = 2; player.multiplierTurns = 3; } }
                    };
                    const upgrade = upgrades[upgradeId];
                    if (!upgrade) return;
                    if ((player.cash || 0) < upgrade.cost) {
                        showShopToast(`${player.name}: need $${upgrade.cost}`, 'warning');
                        return;
                    }
                    player.cash -= upgrade.cost;
                    upgrade.apply();
                    this.applyGodModeResources();
                    showShopToast(`${player.name} bought ${upgrade.label}!`);
                    this.updateUI();
                },

                handlePlayerAnswer: function(playerPrefix, selectedAnswerIndex) {
                    if (!this.state.isPlaying || this.state.isTransitioning) return;
                    let player = this.state[playerPrefix];
                    let opponentPrefix = playerPrefix === 'p1' ? 'p2' : 'p1';
                    let opponent = this.state[opponentPrefix];

                    if (player.isStunned || player.isFrozen) return;

                    let isCorrect = (selectedAnswerIndex === this.state.currentQuiz.correctIndex);
                    
                    let ansIndexPlus1 = selectedAnswerIndex + 1;
                    let overlay = document.getElementById(`overlay-ans-${ansIndexPlus1}`);
                    let icon = document.getElementById(`icon-ans-${ansIndexPlus1}`);
                    overlay.classList.remove('hidden');

                    if (isCorrect) {
                        this.state.isTransitioning = true;
                        
                        icon.innerHTML = svgTick;
                        icon.classList.replace('scale-0', 'scale-100');
                        
                        playSound('correct');
                        player.streak = (player.streak || 0) + 1;
                        player.bestStreak = Math.max(player.bestStreak || 0, player.streak);
                        const streakBonus = Math.floor(player.streak / 3) * 5;
                        const activeMultiplier = player.multiplier || 1;
                        const cashReward = Math.round((10 + streakBonus) * activeMultiplier);
                        player.cash = (player.cash || 0) + cashReward;
                        if ((player.multiplierTurns || 0) > 0) {
                            player.multiplierTurns -= 1;
                            if (player.multiplierTurns <= 0) player.multiplier = 1;
                        }
                        const multiplierText = activeMultiplier > 1 ? ` x${activeMultiplier}` : '';
                        showAnswerFeedback(selectedAnswerIndex, `+$${cashReward}${multiplierText} | 🔥${player.streak}`, 'correct');
                        this.addMana(playerPrefix, 1);
                        this.state.questionsPassed++; // Tăng câu hỏi khi đúng
                        
                        setTimeout(() => {
                            this.loadNextQuestion();
                        }, 1200);
                        
                    } else {
                        icon.innerHTML = svgCross;
                        icon.classList.replace('scale-0', 'scale-100');

                        playSound('wrong');
                        player.streak = 0;
                        showAnswerFeedback(selectedAnswerIndex, 'Stunned! Streak reset', 'wrong');

                        let oldCapacity = Math.floor(player.mana / 5);
                        if (!this.isGodMode()) player.mana = Math.max(0, player.mana - 1);
                        let newCapacity = Math.floor(player.mana / 5);
                        
                        if (newCapacity < oldCapacity && player.queue.length > newCapacity) {
                            player.queue.pop();
                        }

                        player.isStunned = true;
                        let actionBox = document.getElementById(`actions-${playerPrefix}`);
                        if(actionBox) actionBox.classList.add('stun-lock');
                        this.updateUI();
                        
                        this.state.currentQuestionFails++;

                        if (this.state.currentQuestionFails >= 2) {
                            this.state.isTransitioning = true;
                            if (!this.state.isRetryPhase) {
                                this.state.wrongPool.push(this.state.currentQuiz.originalItem);
                            }
                            
                            setTimeout(() => { this.loadNextQuestion(); }, 1000);
                        }
                        
                        setTimeout(() => { 
                            player.isStunned = false; 
                            if(actionBox) actionBox.classList.remove('stun-lock');
                            this.updateUI(); 
                        }, this.state.stunTime);
                    }
                },

                castUltimateSkill: function(skillToUse, playerPrefix, opponentPrefix) {
                    const targetBox = document.getElementById(`${opponentPrefix}-avatar-box`);
                    const casterBox = document.getElementById(`${playerPrefix}-avatar-box`);
                    if (!skillToUse) return;
                    this.state[playerPrefix].lastUltimateSkillId = skillToUse.id;

                    if (skillToUse.id === 'meteor') { playMeteorShower(playerPrefix, opponentPrefix); }
                    else if (skillToUse.id === 'kamehameha') { playKamehamehaAnimation(playerPrefix, opponentPrefix); }
                    else if (skillToUse.id === 'shuriken') {
                        const hits = Math.min(parseInt(document.querySelector('[data-save="skill_2_multi"]')?.value) || 3, 5);
                        const dmgPerHit = parseFloat(document.getElementById(playerPrefix === 'p1' ? 'hero-mana-atk' : 'boss-mana-atk')?.value) || 10;
                        spawnFloatingIcons(targetBox, ['🥷', '✦', '✧'], hits, 700, 0.7, 1.5, 90);
                        window.takeDamage(opponentPrefix, dmgPerHit * hits);
                    }
                    else if (skillToUse.id === 'thunder') {
                        const dmg = parseFloat(document.querySelector('[data-save="skill_4_dmg"]')?.value) || 20;
                        const seconds = parseFloat(document.querySelector('[data-save="skill_4_time"]')?.value) || 3;
                        triggerStatusEffect(targetBox, opponentPrefix, 'stun', seconds * 1000, true);
                        window.takeDamage(opponentPrefix, dmg);
                    }
                    else if (skillToUse.id === 'junk') {
                        const seconds = parseFloat(document.querySelector('[data-save="skill_5_time"]')?.value) || 5;
                        triggerStatusEffect(targetBox, opponentPrefix, 'poison', seconds * 1000, false);
                    }
                    else if (skillToUse.id === 'freeze') {
                        const seconds = parseFloat(document.querySelector('[data-save="skill_6_time"]')?.value) || 4;
                        triggerStatusEffect(targetBox, opponentPrefix, 'freeze', seconds * 1000, true);
                    }
                    else if (skillToUse.id === 'mirror') {
                        const seconds = parseFloat(document.querySelector('[data-save="skill_7_time"]')?.value) || 5;
                        triggerStatusEffect(casterBox, playerPrefix, 'reflect', seconds * 1000, false);
                        this.state[playerPrefix].reflectUntil = Date.now() + seconds * 1000;
                    }
                    else if (skillToUse.id === 'rest') {
                        const shield = parseFloat(document.querySelector('[data-save="skill_8_shield"]')?.value) || 100;
                        const seconds = parseFloat(document.querySelector('[data-save="skill_8_time"]')?.value) || 5;
                        this.state[playerPrefix].shield = Math.min((this.state[playerPrefix].shield || 0) + shield, shield);
                        triggerStatusEffect(casterBox, playerPrefix, 'freeze', seconds * 1000, false);
                        this.updateUI();
                    }
                    else if (skillToUse.id === 'fireball') {
                        const dmg = parseFloat(document.querySelector('[data-save="skill_9_dmg"]')?.value) || 100;
                        triggerStatusEffect(targetBox, opponentPrefix, 'burn', 1200, true);
                        window.takeDamage(opponentPrefix, dmg);
                    }
                    else if (skillToUse.id === 'copycat') {
                        const copied = this.state[opponentPrefix].lastUltimateSkillId;
                        if (copied && copied !== 'copycat') {
                            this.castUltimateSkill({ id: copied }, playerPrefix, opponentPrefix);
                        } else {
                            playMeteorShower(playerPrefix, opponentPrefix);
                        }
                    }
                },

                handleSkill: function(playerPrefix) {
                    if (!this.state.isPlaying) return;
                    let player = this.state[playerPrefix];
                    let opponentPrefix = playerPrefix === 'p1' ? 'p2' : 'p1';

                    if (player.isFrozen) { playSound('freeze'); return; }
                    
                    if (player.queue.length > 0 && player.mana >= 5) {
                        const now = Date.now();
                        const ultCooldownMs = this.isGodMode() ? 500 : 0;
                        if (ultCooldownMs && player.lastUltimateAt && now - player.lastUltimateAt < ultCooldownMs) return;

                        let skillToUse = player.queue.shift();
                        if (!this.isGodMode()) player.mana -= 5;
                        player.lastUltimateAt = now;
                        this.ensureUltimateQueue(playerPrefix);
                        this.applyGodModeResources();
                        this.updateUI();

                        // ==========================================
                        // ⚓ [NEO 4]: GỌI TÊN SKILL (KÍCH HOẠT)
                        // Khi có skill mới, thêm 1 dòng "else if" ở đây:
                        // ==========================================
                        this.castUltimateSkill(skillToUse, playerPrefix, opponentPrefix);
                        // ✂️👇 THÊM ELSE IF CHO SKILL MỚI VÀO ĐÂY 👇✂️

                        // ==========================================
                    }
                },

            };
            window.GameplayManager = GameplayManager;

            window.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); }

                let key = e.key;
                if (e.code.startsWith('Numpad') && key >= '0' && key <= '9') { key = 'NUM' + key; } 
                else if (e.code === 'NumpadEnter') { key = 'NUM ENTER'; }

                key = key.toUpperCase();
                if(key === ' ') key = 'SPACE';
                
                let p1_keys = [
                    document.getElementById('ui-ans-p1-1')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p1-2')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p1-3')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p1-4')?.innerText.trim().toUpperCase()
                ];
                
                let p2_keys = [
                    document.getElementById('ui-ans-p2-1')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p2-2')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p2-3')?.innerText.trim().toUpperCase(),
                    document.getElementById('ui-ans-p2-4')?.innerText.trim().toUpperCase()
                ];

                let p1_ult = document.getElementById('ui-key-p1-ult')?.innerText.trim().toUpperCase();
                let p2_ult = document.getElementById('ui-key-p2-ult')?.innerText.trim().toUpperCase();

                if (key === p1_ult) { window.GameplayManager.handleSkill('p1'); return; }
                if (key === p2_ult) { window.GameplayManager.handleSkill('p2'); return; }

                let p1_s1 = document.getElementById('ui-key-p1-s1')?.innerText.trim().toUpperCase(); 
                let p1_s2 = document.getElementById('ui-key-p1-s2')?.innerText.trim().toUpperCase(); 
                let p1_s3 = document.getElementById('ui-key-p1-s3')?.innerText.trim().toUpperCase(); 
                
                let p2_s1 = document.getElementById('ui-key-p2-s1')?.innerText.trim().toUpperCase(); 
                let p2_s2 = document.getElementById('ui-key-p2-s2')?.innerText.trim().toUpperCase(); 
                let p2_s3 = document.getElementById('ui-key-p2-s3')?.innerText.trim().toUpperCase(); 

                if (key === p1_s2) { window.triggerClickSkill('p1', 'atk'); return; }
                if (key === p1_s1) { window.triggerClickSkill('p1', 'def'); return; }
                if (key === p1_s3) { window.triggerClickSkill('p1', 'heal'); return; }

                if (key === p2_s2) { window.triggerClickSkill('p2', 'atk'); return; }
                if (key === p2_s1) { window.triggerClickSkill('p2', 'def'); return; }
                if (key === p2_s3) { window.triggerClickSkill('p2', 'heal'); return; }

                const shopKeys = [
                    ['p1', 'mana', document.getElementById('ui-key-p1-shop-mana')?.innerText.trim().toUpperCase()],
                    ['p1', 'shield', document.getElementById('ui-key-p1-shop-shield')?.innerText.trim().toUpperCase()],
                    ['p1', 'double', document.getElementById('ui-key-p1-shop-double')?.innerText.trim().toUpperCase()],
                    ['p2', 'mana', document.getElementById('ui-key-p2-shop-mana')?.innerText.trim().toUpperCase()],
                    ['p2', 'shield', document.getElementById('ui-key-p2-shop-shield')?.innerText.trim().toUpperCase()],
                    ['p2', 'double', document.getElementById('ui-key-p2-shop-double')?.innerText.trim().toUpperCase()]
                ];
                const shopMatch = shopKeys.find(([, , shopKey]) => shopKey && key === shopKey);
                if (shopMatch) { window.triggerClickShop(shopMatch[0], shopMatch[1]); return; }

                let p1Index = p1_keys.indexOf(key);
                if (p1Index !== -1) { window.GameplayManager.handlePlayerAnswer('p1', p1Index); return; }

                let p2Index = p2_keys.indexOf(key);
                if (p2Index !== -1) { window.GameplayManager.handlePlayerAnswer('p2', p2Index); }
            });
