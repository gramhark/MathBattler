/* AnimationRenderer - battle visual effects extracted from UIManager */
class AnimationRenderer {
    /**
     * 攻撃エフェクト画像をモンスターの上にアニメーション表示する
     * @param {'attack'|'critical'|'attack_H'|'critical_H'|'attack_S'|'critical_S'|'attack_SP'} type
     */
    showAttackEffect(type) {
        const el = document.getElementById('attack-effect-img');
        if (!el) return;

        // クラスとsrcをリセット（reflow強制で前回のアニメを確実に終了）
        el.className = 'attack-effect-img';
        el.src = '';
        void el.offsetWidth;

        const src = `assets/image/effect/${type}.webp`;
        let animClass = '';

        if (type === 'attack_SP') {
            animClass = 'anim-sp-attack';
        } else if (type === 'critical_S') {
            animClass = 'anim-crescent';
        } else if (type === 'attack_S') {
            animClass = 'anim-slash';
        } else if (type === 'critical_H' || type === 'critical') {
            animClass = 'anim-critical-hit';
        } else {
            animClass = 'anim-hit'; // attack_H, attack, その他
        }

        el.src = src;
        el.classList.add(animClass);

        // アニメーション終了後にクリーンアップ
        el.addEventListener('animationend', () => {
            el.className = 'attack-effect-img';
            el.src = '';
        }, { once: true });
    }

    /**
     * @param {'normal'|'critical'|'sp'} type
     */
    flashScreen(type = 'normal') {
        const monsterImg = document.getElementById('monster-img');
        const container = document.querySelector('.monster-container');

        // モンスター画像: 点滅（opacity アニメ）
        monsterImg.classList.remove('flash-effect', 'flash-critical', 'flash-sp', 'dodge-effect', 'attack-effect');
        void monsterImg.offsetWidth;
        if (type === 'sp') {
            monsterImg.classList.add('flash-sp');
        } else if (type === 'critical') {
            monsterImg.classList.add('flash-critical');
        } else {
            monsterImg.classList.add('flash-effect');
        }

        // 過去のモンスターコンテナ揺れは削除（モンスター画像のみ揺らすため）

        // モンスター画像(wrapper): 小刻みに左右に揺れるアニメーション (全ダメージ共通)
        const wrapper = document.querySelector('.monster-img-wrapper');
        if (wrapper) {
            const shakeClassImg = (type === 'sp' || type === 'critical') ? 'shake-img-wrapper-crit' : 'shake-img-wrapper';
            wrapper.classList.remove('shake-img-wrapper', 'shake-img-wrapper-crit');
            void wrapper.offsetWidth;
            wrapper.classList.add(shakeClassImg);
            wrapper.addEventListener('animationend', () => {
                wrapper.classList.remove(shakeClassImg);
            }, { once: true });
        }

        // 必殺技時: バトルビュー全体を白いオーバーレイでフラッシュ
        if (type === 'sp') {
            const battleView = document.querySelector('.battle-view');
            if (battleView) {
                const old = battleView.querySelector('.battle-white-flash');
                if (old) old.remove();
                const flashEl = document.createElement('div');
                flashEl.className = 'battle-white-flash';
                battleView.appendChild(flashEl);
                flashEl.addEventListener('animationend', () => flashEl.remove(), { once: true });
            }
        }
    }


    shakeScreen() {
        const target = document.querySelector('.screen.active');
        if (!target) return;

        target.classList.remove('shake-effect');
        void target.offsetWidth;
        target.classList.add('shake-effect');

        // 被ダメージ時: ステータスウィンドウを赤いオーバーレイでフラッシュ
        const statusPanel = document.querySelector('.panel-section--status');
        if (statusPanel) {
            const old = statusPanel.querySelector('.damage-flash-overlay');
            if (old) old.remove();
            const prevPosition = statusPanel.style.position;
            statusPanel.style.position = 'relative';
            const flashEl = document.createElement('div');
            flashEl.className = 'damage-flash-overlay';
            statusPanel.appendChild(flashEl);
            flashEl.addEventListener('animationend', () => {
                flashEl.remove();
                statusPanel.style.position = prevPosition;
            }, { once: true });
        }
    }

    dodgeScreen() {
        const monsterImg = document.getElementById('monster-img');
        monsterImg.classList.remove('flash-effect', 'dodge-effect', 'attack-effect', 'damage-effect');
        void monsterImg.offsetWidth; // trigger reflow
        monsterImg.classList.add('dodge-effect');
    }

    attackScreen() {
        const monsterImg = document.getElementById('monster-img');
        monsterImg.classList.remove('flash-effect', 'dodge-effect', 'attack-effect', 'damage-effect');
        void monsterImg.offsetWidth; // trigger reflow
        monsterImg.classList.add('attack-effect');
    }

    damageScreen() {
        const monsterImg = document.getElementById('monster-img');
        monsterImg.classList.remove('flash-effect', 'dodge-effect', 'attack-effect', 'damage-effect');
        void monsterImg.offsetWidth; // trigger reflow
        monsterImg.classList.add('damage-effect');
    }

    /**
     * 必殺技時にフラクタル雷ボルトをcanvasで描画する
     */
    showLightning() {
        const container = document.querySelector('.monster-container');
        if (!container) return;

        const canvas = document.createElement('canvas');
        const w = container.offsetWidth || 300;
        const h = container.offsetHeight || 400;
        canvas.width = w;
        canvas.height = h;
        canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:12;';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const cx = w / 2;
        const cy = h * 0.38;

        // フラクタル分岐で雷ボルトを描画
        function drawBolt(x1, y1, x2, y2, depth) {
            if (depth <= 0) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                return;
            }
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const offset = (Math.random() - 0.5) * len * 0.45;
            const nx = mx + (-dy / len) * offset;
            const ny = my + (dx / len) * offset;
            drawBolt(x1, y1, nx, ny, depth - 1);
            drawBolt(nx, ny, x2, y2, depth - 1);
        }

        let frame = 0;
        const totalFrames = 26;
        const numBolts = 9;
        const angles = Array.from({ length: numBolts }, (_, i) =>
            (i / numBolts) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
        );
        const lengths = Array.from({ length: numBolts }, () => 75 + Math.random() * 75);

        const animate = () => {
            ctx.clearRect(0, 0, w, h);
            if (frame >= totalFrames) {
                container.removeChild(canvas);
                return;
            }
            const alpha = frame < 5
                ? frame / 5
                : Math.max(0, 1 - (frame - 5) / (totalFrames - 5));

            angles.forEach((angle, i) => {
                const len = lengths[i] * (0.75 + Math.random() * 0.5);
                const ex = cx + Math.cos(angle) * len;
                const ey = cy + Math.sin(angle) * len;

                // 外側グロウ（橙）
                ctx.strokeStyle = `rgba(255, 160, 0, ${alpha * 0.55})`;
                ctx.lineWidth = 5;
                ctx.shadowColor = '#ff8c00';
                ctx.shadowBlur = 22;
                drawBolt(cx, cy, ex, ey, 3);

                // 本体（黄）
                ctx.strokeStyle = `rgba(255, 230, 30, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ffe000';
                ctx.shadowBlur = 10;
                drawBolt(cx, cy, ex, ey, 3);

                // コア（白）
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
                ctx.lineWidth = 0.8;
                ctx.shadowBlur = 4;
                drawBolt(cx, cy, ex, ey, 2);
            });

            frame++;
            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Special_モンスター撃破時: 青いグラデーションを下から上に走らせるエフェクト
     */
    showAtkUpEffect() {
        // ユーザー名があるウィンドウ（ステータスウィンドウ）だけにグラデーションを適用する
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        // 既存のクリップコンテナを除去
        const oldClip = statusPanel.querySelector('.atkup-clip');
        if (oldClip) oldClip.remove();

        // ステータスウィンドウは position:static の場合があるので relative に変更
        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        // 絶対配置のクリップコンテナ経由でoverflow:hiddenを実現する
        // （statusPanel本体にoverflow:hiddenを当てるとflexレイアウトが崩れるため）
        const clipDiv = document.createElement('div');
        clipDiv.className = 'atkup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'atkup-effect';
        clipDiv.appendChild(el);

        // アニメーション終了後にクリップコンテナごと削除し、position を元に戻す
        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * かいふくモンスター回復時: 緑グラデーションを下から上に走らせるエフェクト
     */
    showHealEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.healup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'healup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'healup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * ぼうぎょだま使用時: 青いグラデーションを下から上に走らせるエフェクト
     */
    showDefUpEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.defup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'defup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'defup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * ミスターきんか効果時: 黄色いグラデーションを下から上に走らせるエフェクト
     */
    showGoldUpEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.goldup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'goldup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'goldup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }

    /**
     * ミスターねんりん効果時: 紫のグラデーションを下から上に走らせるエフェクト
     */
    showExpUpEffect() {
        const statusPanel = document.querySelector('.panel-section--status');
        if (!statusPanel) return;

        const oldClip = statusPanel.querySelector('.expup-clip');
        if (oldClip) oldClip.remove();

        const prevPosition = statusPanel.style.position;
        statusPanel.style.position = 'relative';

        const clipDiv = document.createElement('div');
        clipDiv.className = 'expup-clip';
        clipDiv.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:25;';
        statusPanel.appendChild(clipDiv);

        const el = document.createElement('div');
        el.className = 'expup-effect';
        clipDiv.appendChild(el);

        el.addEventListener('animationend', () => {
            clipDiv.remove();
            statusPanel.style.position = prevPosition;
        }, { once: true });
    }
}
