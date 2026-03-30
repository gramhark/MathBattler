/* SettingsManager: せってい画面の管理 */
class SettingsManager {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
    }

    showSetting() {
        this.game.state = GameState.SETTING;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('setting-screen').classList.add('active');
        this.ui.adjustScale();
        this._syncSettingUI();
    }

    hideSetting() {
        const nameInput = document.getElementById('player-name');
        if (nameInput) this.storage.savePlayerName(nameInput.value.trim() || 'ゆうしゃ');
        this.game.state = GameState.TOP;
        document.getElementById('setting-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        this.ui.adjustScale();
    }

    _syncSettingUI() {
        const bgmOn = document.getElementById('setting-bgm-on');
        const bgmOff = document.getElementById('setting-bgm-off');
        const seOn = document.getElementById('setting-se-on');
        const seOff = document.getElementById('setting-se-off');
        const bgmSlider = document.getElementById('setting-bgm-volume');
        const bgmVolVal = document.getElementById('setting-bgm-volume-value');
        const seSlider = document.getElementById('setting-se-volume');
        const seVolVal = document.getElementById('setting-se-volume-value');

        if (bgmOn) bgmOn.classList.toggle('active', this.game._settings.bgmEnabled);
        if (bgmOff) bgmOff.classList.toggle('active', !this.game._settings.bgmEnabled);
        if (seOn) seOn.classList.toggle('active', this.game._settings.seEnabled);
        if (seOff) seOff.classList.toggle('active', !this.game._settings.seEnabled);
        if (bgmSlider) bgmSlider.value = this.game._settings.bgmVolume;
        if (bgmVolVal) bgmVolVal.textContent = this.game._settings.bgmVolume;
        if (seSlider) seSlider.value = this.game._settings.seVolume;
        if (seVolVal) seVolVal.textContent = this.game._settings.seVolume;
    }

    _setSoundEnabled(type, enabled) {
        if (type === 'bgm') {
            this.game._settings.bgmEnabled = enabled;
        } else {
            this.game._settings.seEnabled = enabled;
        }
        this.storage.saveSettings(this.game._settings);
        this.sound.applySettings(this.game._settings.bgmEnabled, this.game._settings.seEnabled, this.game._settings.bgmVolume, this.game._settings.seVolume);
        if (type === 'bgm' && enabled && !this.sound.currentBgm) {
            this.sound.playMenuBgm();
        }
        this._syncSettingUI();
    }

    _exportSave() {
        const data = this.storage.exportBackup();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date();
        const stamp = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
        a.download = `mathbattler_save_${stamp}.json`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }

    _importSave(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const err = this.storage.importBackup(data);
                if (err) {
                    alert(`よみこみ失敗: ${err}`);
                    return;
                }
                alert('よみこみ完了！ゲームを再起動します。');
                location.reload();
            } catch {
                alert('ファイルが正しくありません');
            }
        };
        reader.readAsText(file);
    }

    _onVolumeChange(type) {
        const slider = document.getElementById(type === 'bgm' ? 'setting-bgm-volume' : 'setting-se-volume');
        const valueEl = document.getElementById(type === 'bgm' ? 'setting-bgm-volume-value' : 'setting-se-volume-value');
        if (!slider) return;
        const val = parseInt(slider.value);
        if (type === 'bgm') {
            this.game._settings.bgmVolume = val;
        } else {
            this.game._settings.seVolume = val;
        }
        if (valueEl) valueEl.textContent = val;
        this.storage.saveSettings(this.game._settings);
        this.sound.applySettings(this.game._settings.bgmEnabled, this.game._settings.seEnabled, this.game._settings.bgmVolume, this.game._settings.seVolume);
    }
}
