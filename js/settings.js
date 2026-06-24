export function loadSettings() {
    let result = { settings: null, gridData: null };
    try {
        const savedSettings = localStorage.getItem('pvp_game_settings');
        if (savedSettings) {
            result.settings = JSON.parse(savedSettings);
        }
        const savedDataGrid = localStorage.getItem('pvp_game_data');
        if (savedDataGrid) {
            result.gridData = JSON.parse(savedDataGrid);
        }
    } catch (e) {
        console.error("Lỗi tải dữ liệu LocalStorage:", e);
    }
    return result;
}

export function saveSettings(gridData) {
    const settingsToSave = {};
    document.querySelectorAll('[data-save]').forEach(el => {
        if (el.type === 'checkbox') settingsToSave[el.dataset.save] = el.checked;
        else settingsToSave[el.dataset.save] = el.value;
    });
    
    localStorage.setItem('pvp_game_settings', JSON.stringify(settingsToSave));
    if (gridData) localStorage.setItem('pvp_game_data', JSON.stringify(gridData));
}
