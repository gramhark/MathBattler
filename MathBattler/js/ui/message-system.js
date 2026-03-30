/* MessageSystem - message queue and typewriter effect extracted from UIManager */
class MessageSystem {
    constructor() {
        this._messageQueue = [];
        this._typewriterInterval = null;
        this._typewriterRunning = false;
    }

    showMessage(text, isCrit = false, duration = 1500, extraClass = null) {
        this._messageQueue.push({ text, isCrit, extraClass });
        if (!this._typewriterRunning) {
            this._processNextMessage();
        }
    }

    _processNextMessage() {
        if (this._messageQueue.length === 0) {
            this._typewriterRunning = false;
            return;
        }
        this._typewriterRunning = true;

        const { text, isCrit, extraClass } = this._messageQueue.shift();
        const log = document.getElementById('message-log');
        if (!log) { this._typewriterRunning = false; return; }

        // 最大行表示: 古いものを上から削除 (常に最新数件を残しつつコンテナの高さを超えたらスクロール)
        while (log.children.length >= 10) {
            log.removeChild(log.firstChild);
        }

        // 新しいメッセージ行を追加
        const line = document.createElement('div');
        line.className = 'message-log-line';
        if (isCrit) line.classList.add('critical');
        if (extraClass) line.classList.add(extraClass);
        log.appendChild(line);

        // タイプライター効果 — ローカルクロージャで状態を管理（インスタンス変数汚染なし）
        const segments = text.split('\n');
        const tokens = [];
        segments.forEach((seg, i) => {
            for (const ch of seg) tokens.push({ type: 'char', val: ch });
            if (i < segments.length - 1) tokens.push({ type: 'br' });
        });
        let idx = 0;
        const CHAR_INTERVAL = 45;
        let lastTime = null;
        let rafId = null;

        const tick = (timestamp) => {
            if (lastTime === null) lastTime = timestamp;
            const elapsed = timestamp - lastTime;
            const steps = Math.floor(elapsed / CHAR_INTERVAL);
            if (steps > 0) {
                lastTime += steps * CHAR_INTERVAL;
                for (let s = 0; s < steps && idx < tokens.length; s++) {
                    const token = tokens[idx++];
                    if (token.type === 'br') {
                        line.appendChild(document.createElement('br'));
                    } else {
                        line.appendChild(document.createTextNode(token.val));
                    }
                }
                if (log.parentElement) {
                    log.parentElement.scrollTop = log.parentElement.scrollHeight;
                }
            }
            if (idx < tokens.length) {
                rafId = requestAnimationFrame(tick);
            } else {
                this._typewriterInterval = null;
                if (log.parentElement) {
                    log.parentElement.scrollTop = log.parentElement.scrollHeight;
                }
                this._processNextMessage();
            }
        };
        rafId = requestAnimationFrame(tick);
        this._typewriterInterval = rafId;
    }

    clearMessageLog() {
        const log = document.getElementById('message-log');
        if (log) log.innerHTML = '';
        if (this._typewriterInterval) {
            cancelAnimationFrame(this._typewriterInterval);
            this._typewriterInterval = null;
        }
        this._messageQueue = [];
        this._typewriterRunning = false;
    }
}
