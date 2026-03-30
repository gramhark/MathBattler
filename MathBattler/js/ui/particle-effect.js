/**
 * メインメニューボタン（BTN_main_〜）などをクリックした際に、
 * 四則演算の記号が飛び散るパーティクルエフェクトを制御するスクリプト。
 */
let lastParticleTime = 0;

function handleParticleTrigger(e) {
    // 短時間での同期タップによる2重発火を防止（touchstartとclickの重複防止）
    const now = Date.now();
    if (now - lastParticleTime < 100) return;
    
    // 座標の取得 (タッチ対応)
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.type === 'touchstart') {
        if (!e.touches || e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    }

    // クリックされた要素（ボタン等の包含要素）を一番近い位置から取得
    const targetEl = e.target.closest('button, div, a');

    // 要素自身が画像、または内包している画像を検索
    let imgEl = null;
    if (e.target.tagName === 'IMG') {
        imgEl = e.target;
    } else if (targetEl) {
        imgEl = targetEl.querySelector('img');
    }

    // ① メニューボタンの判定
    const isMainButton = imgEl && imgEl.src && imgEl.src.includes('BTN_main_');
    // ② タイトル画面の判定 (#top-screen内をタップした場合)
    const isTitleScreen = targetEl && targetEl.closest('#top-screen');

    if (isMainButton || isTitleScreen) {
        lastParticleTime = now;
        createMathExplosionEffect(clientX, clientY);
    }
}

// クリックイベントとタッチイベントの両方を監視
document.addEventListener('click', handleParticleTrigger);
// タイトル画面等ではTouchStartのデフォルト動作がキャンセルされることがあるため、ここで別途捕捉
document.addEventListener('touchstart', handleParticleTrigger, { passive: true });

/**
 * 指定した画面座標から四則演算記号を飛び散らせる
 * @param {number} x - クリックされたX座標 (clientX)
 * @param {number} y - クリックされたY座標 (clientY)
 */
function createMathExplosionEffect(x, y) {
    // 記号と対応する色の定義 (＋: 赤, －: 青, ×: 黄, ÷: 緑)
    const operators = [
        { char: '＋', color: '#ff6666' }, // 明るめの赤
        { char: '－', color: '#66aaff' }, // 明るめの青
        { char: '×', color: '#ffdd44' }, // 明るめの黄色
        { char: '÷', color: '#66ee88' }  // 明るめの緑
    ];
    // 飛散させる記号の数 (6〜12個)
    const particleCount = 6 + Math.floor(Math.random() * 7);

    for (let i = 0; i < particleCount; i++) {
        const op = operators[Math.floor(Math.random() * operators.length)];
        const particle = document.createElement('span');

        // スタイルと初期状態の設定
        particle.textContent = op.char;
        particle.style.position = 'fixed';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // 指定された色を適用
        particle.style.color = op.color;
        // 色が背景に埋もれないよう、黒っぽい縁取りを追加
        particle.style.textShadow = '0px 1px 3px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.6)';

        particle.style.fontSize = `${16 + Math.random() * 16}px`; // 16px〜32px
        particle.style.fontWeight = 'bold';
        particle.style.pointerEvents = 'none'; // クリックの妨げにならないように
        particle.style.zIndex = '9999'; // 最前面

        document.body.appendChild(particle);

        // 飛散する方向と距離
        const angle = Math.random() * Math.PI * 2; // 0〜360度 (ラジアン)
        const distance = 50 + Math.random() * 70;  // 50px〜120px 飛ぶ
        const destX = Math.cos(angle) * distance;
        const destY = Math.sin(angle) * distance;

        // Web Animations API で飛び散りとフェードアウトのアニメーション
        const animation = particle.animate([
            { transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)', opacity: 1.0 },
            { transform: `translate(calc(-50% + ${destX}px), calc(-50% + ${destY}px)) scale(1.5) rotate(${Math.random() * 180 * (Math.random() > 0.5 ? 1 : -1)}deg)`, opacity: 0 }
        ], {
            duration: 600 + Math.random() * 400, // 0.6〜1.0秒
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // 最初は速く、だんだんゆっくり
            fill: 'forwards'
        });

        // アニメーション完了後に削除
        animation.onfinish = () => {
            particle.remove();
        };
    }
}
