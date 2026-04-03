/* ResultsManager: ゲームオーバー・クリア・マールドロップの管理 */
class ResultsManager {
    constructor(game) {
        this.game = game;
        this.storage = game.storage;
        this.sound = game.sound;
        this.ui = game.ui;
    }

    _onGameOver() {
        cancelAnimationFrame(this.game.timerIntervalId);
        this.game.state = GameState.GAME_OVER;
        this.game.prevBossDefeated = false; // ゲームオーバーでフラグをリセット
        this.sound.stopBgm();

        if (this.sound.bgmGameover) {
            this.sound.bgmGameover.currentTime = 0;
            this.sound.currentBgm = this.sound.bgmGameover;
            this.sound.fadeInBgm(this.sound.bgmGameover, 0.5, 500);
        }

        this.ui.showMessage("ゲームオーバー...", false);
        setTimeout(() => {
            alert("ゲームオーバー！ つぎはまけないぞ！");
            this.game.showTop();
        }, 2000);
    }

    _onGameClear() {
        this.game.state = GameState.RESULT;
        // ダンジョンクリアを保存
        this.storage.saveFloorClear(this.game.currentFloor, this.game.difficulty);
        // 100階クリア時にモンスターハウスを解放
        if (this.game.currentFloor === 100 && !this.storage.isMonsterHouseUnlocked()) {
            this.storage.setMonsterHouseUnlocked();
        }
        this.sound.stopBgm();
        this.sound.playSe('clear');

        if (this.sound.bgmClear) {
            this.sound.bgmClear.currentTime = 0;
            this.sound.currentBgm = this.sound.bgmClear;
            this.sound.fadeInBgm(this.sound.bgmClear, 0.5, 500);
        }

        // Show result screen
        document.getElementById('battle-screen').classList.remove('active');
        document.getElementById('result-screen').classList.add('active');

        // Adjust scale for result screen content
        this.ui.adjustScale();

        const list = document.getElementById('time-list');
        list.innerHTML = '';

        // Calculate Total
        const times = this.game.defeatTimes.map(item => parseFloat(item.time));
        const totalTime = times.reduce((a, b) => a + b, 0).toFixed(1);
        document.getElementById('total-time-display').textContent = `${totalTime}秒`;

        // Display floor info
        document.getElementById('result-settings-text').textContent = `${this.game.currentFloor}かいダンジョン`;

        // Find Min/Max for highlighting
        // Note: multiple items can be min or max
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        this.game.defeatTimes.forEach((item, i) => {
            const val = parseFloat(item.time);
            const li = document.createElement('li');
            li.className = 'result-card'; // Add class for styling

            let timeClass = 'result-time';
            if (val === minTime) timeClass += ' time-fastest';
            else if (val === maxTime) timeClass += ' time-slowest';

            // Construct Inner HTML with Image
            li.innerHTML = `
                <div class="result-img-container" data-src="${item.imageSrc}" data-name="${item.name}">
                    <img src="${item.imageSrc}" class="result-img" alt="${item.name}" loading="lazy">
                </div>
                <div class="result-info">
                    <span class="result-name">${item.name}</span>
                    <span class="${timeClass}">${item.time}秒</span>
                </div>
            `;
            list.appendChild(li);

            // Click event for zoom
            // Bind to the whole card (li) for better UX
            li.addEventListener('click', (e) => {
                const src = item.imageSrc; // Use item directly instead of DOM read
                const name = item.name;
                this.ui.openImageModal(src, name);
            });
        });
    }

    _downloadShareImage() {
        const game = this.game;
        const W = 600, H = 800;
        const times = game.defeatTimes.map(item => parseFloat(item.time));
        const totalTime = times.reduce((a, b) => a + b, 0).toFixed(1);

        const drawToCanvas = (bossImg) => {
            const c = document.createElement('canvas');
            c.width = W;
            c.height = H;
            const ctx = c.getContext('2d');

            // Background
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#1a2444');
            bg.addColorStop(1, '#0d1222');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            // Top glow
            const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 320);
            glow.addColorStop(0, 'rgba(79,172,254,0.18)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, W, H);

            // Border
            ctx.strokeStyle = '#4facfe';
            ctx.lineWidth = 3;
            ctx.strokeRect(8, 8, W - 16, H - 16);

            ctx.textAlign = 'center';

            // Game title
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 30px "DotGothic16", sans-serif';
            ctx.fillText('マスバトール', W / 2, 55);

            // Clear title
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 34px "DotGothic16", sans-serif';
            ctx.fillText('🎉 クリアおめでとう！ 🎉', W / 2, 106);

            // Boss image
            const imgY = 128, imgSize = 218;
            if (bossImg) {
                ctx.save();
                ctx.shadowColor = 'rgba(255,255,255,0.8)';
                ctx.shadowBlur = 18;
                ctx.drawImage(bossImg, (W - imgSize) / 2, imgY, imgSize, imgSize);
                ctx.restore();
            }

            // Player name
            ctx.fillStyle = '#8ab4f8';
            ctx.font = '28px "DotGothic16", sans-serif';
            ctx.fillText(game.playerName || 'ゆうしゃ', W / 2, imgY + imgSize + 48);

            // Floor + difficulty
            const diffLabels = ['', '★', '★★', '★★★'];
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '26px "DotGothic16", sans-serif';
            ctx.fillText(`${game.currentFloor}かいダンジョン  ${diffLabels[game.difficulty] || ''}`, W / 2, imgY + imgSize + 92);

            // Separator
            ctx.strokeStyle = 'rgba(79,172,254,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, imgY + imgSize + 116);
            ctx.lineTo(W - 60, imgY + imgSize + 116);
            ctx.stroke();

            // Total time label
            ctx.fillStyle = '#94a3b8';
            ctx.font = '24px "DotGothic16", sans-serif';
            ctx.fillText('ごうけいタイム', W / 2, imgY + imgSize + 158);

            // Total time value
            ctx.fillStyle = '#4facfe';
            ctx.shadowColor = 'rgba(79,172,254,0.6)';
            ctx.shadowBlur = 12;
            ctx.font = 'bold 88px "DotGothic16", sans-serif';
            ctx.fillText(`${totalTime}秒`, W / 2, imgY + imgSize + 260);
            ctx.shadowBlur = 0;

            // Attribution
            ctx.fillStyle = '#3a4a70';
            ctx.font = '17px sans-serif';
            ctx.fillText('マスバトール', W / 2, H - 22);

            return c;
        };

        const triggerDownload = (canvas) => {
            try {
                const a = document.createElement('a');
                a.download = `masabattler_${game.currentFloor}F_${totalTime}s.png`;
                a.href = canvas.toDataURL('image/png');
                a.click();
            } catch (e) {
                // Canvas tainted: 画像なしの新規 canvas で再試行
                try {
                    const c2 = drawToCanvas(null);
                    const a = document.createElement('a');
                    a.download = `masabattler_${game.currentFloor}F_${totalTime}s.png`;
                    a.href = c2.toDataURL('image/png');
                    a.click();
                } catch (e2) {
                    alert('画像の保存に失敗しました。\nブラウザの制限により使用できない場合があります。');
                }
            }
        };

        const bossItem = game.defeatTimes[game.defeatTimes.length - 1];
        if (bossItem) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => triggerDownload(drawToCanvas(img));
            img.onerror = () => triggerDownload(drawToCanvas(null));
            img.src = bossItem.imageSrc;
        } else {
            triggerDownload(drawToCanvas(null));
        }
    }

    _doMalleDrop(onComplete, directAmount = null) {
        let amount = directAmount !== null ? directAmount : 1000;
        if (this.game.goldMultiplied) amount = Math.round(amount * 2);
        if (this.game.companionMalleBonus) amount = Math.round(amount * (1 + this.game.companionMalleBonus));
        if (amount <= 0) {
            onComplete();
            return;
        }

        this.game.malle = Math.min(this.game.malle + amount, Constants.MAX_MALLE);
        this.storage.saveMalle(this.game.malle);

        // マール画像をモンスターコンテナに表示
        const monsterContainer = document.querySelector('.monster-container');
        const malleImg = document.createElement('img');
        malleImg.src = 'assets/image/ui/malle.webp';
        malleImg.className = 'malle-drop-img';
        monsterContainer.appendChild(malleImg);

        this.sound.playSe('malle');
        this.ui.showMessage(`${amount}マールを\nてにいれた！`, false, 3000, 'text-neutral');

        setTimeout(() => {
            malleImg.remove();
            onComplete();
        }, 3000);
    }

    /**
     * ボス撃破後のメダルドロップ処理
     * @param {object} m モンスター
     * @param {function} onComplete 完了コールバック
     */
    _doMedalDrop(m, onComplete) {
        if (!this.storage.isMonsterHouseUnlocked()) {
            onComplete();
            return;
        }
        if (!window.MEDAL_LIST || !window.MEDAL_DROP_TABLE) {
            onComplete();
            return;
        }

        const diff = this.game.difficulty || 1;
        const floor = this.game.currentFloor;
        let bandKey;
        if (floor <= 25) bandKey = '1-25';
        else if (floor <= 50) bandKey = '26-50';
        else if (floor <= 75) bandKey = '51-75';
        else bandKey = '76-100';

        const table = (window.MEDAL_DROP_TABLE[diff] || window.MEDAL_DROP_TABLE[1])[bandKey];
        if (!table) { onComplete(); return; }

        const r = Math.random();
        let rarity;
        if (r < table[0]) rarity = 'bronze';
        else if (r < table[0] + table[1]) rarity = 'silver';
        else if (r < table[0] + table[1] + table[2]) rarity = 'gold';
        else rarity = 'diamond';

        // diamondが0%の場合は gold にフォールバック
        if (rarity === 'diamond' && table[3] === 0) rarity = 'gold';

        const candidates = window.MEDAL_LIST.filter(md => md.rarity === rarity);
        if (candidates.length === 0) { onComplete(); return; }
        const medal = candidates[Math.floor(Math.random() * candidates.length)];

        // 枚数増加
        const medals = this.storage.loadMedals();
        const current = medals[medal.id] || 0;
        medals[medal.id] = Math.min(current + 1, 99);
        this.storage.saveMedals(medals);

        const rarityLabel = { bronze: '（銅）', silver: '（銀）', gold: '（金）', diamond: '（ダイヤ）' }[rarity] || '';
        this.ui.showMessage(`${medal.name.replace(/（.*?）/, '')}${rarityLabel}を\nてにいれた！`, false, 2000, 'text-neutral');

        setTimeout(() => onComplete(), 2000);
    }
}
