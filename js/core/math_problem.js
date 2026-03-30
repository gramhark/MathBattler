/* MathProblem: 難易度×ダンジョンベースの問題生成クラス */

/**
 * 難易度別ダンジョン問題テーブル
 * 各エントリ: { min, max, type }
 *   noLower: true  → 下ダンジョンの問題を混入しない（91階以降の★3など）
 *   bossType: '...' → floor===100 のときに type の代わりに使う問題タイプ
 *
 * 問題タイプ識別子（_genByType() 参照）:
 *   add1_1_nc   1桁+1桁（繰り上がりなし）
 *   sub1_1_nb   1桁-1桁（繰り下がりなし）
 *   add1_1_c    1桁+1桁（繰り上がりあり）
 *   add2_1_nc   2桁+1桁（繰り上がりなし）
 *   sub2_1_nb   2桁-1桁（繰り下がりなし）
 *   add2_1_c    2桁+1桁（繰り上がりあり）
 *   sub2_1_b    2桁-1桁（繰り下がりあり）
 *   add2_2_nc   2桁+2桁（繰り上がりなし）
 *   sub2_2_nb   2桁-2桁（繰り下がりなし）
 *   kuku        九九（1桁×1桁 ×2〜×9）
 *   add2_2_c    2桁+2桁（繰り上がりあり）
 *   sub2_2_b    2桁-2桁（繰り下がりあり）
 *   div2_1_nr1  2桁÷1桁（余りなし・商1桁）
 *   div2_1_nr2  2桁÷1桁（余りなし・商2桁）
 *   mul2_1_3    2桁×1桁（×1〜×3）
 *   mul2_1_6    2桁×1桁（×1〜×6）
 *   mul2_1_9    2桁×1桁（×1〜×9）
 *   all2_easy   2桁四則ランダム（簡単・割り算は余りあり含む）
 *   all2_hard   2桁四則ランダム（難化・割り算は余りあり含む）
 *   all2_hardest 2桁四則ランダム（最難化・×の割合高め）
 *   carry_borrow 繰り上がり・繰り下がり混合（★1 100階ボス用）
 */
const FLOOR_TABLES = {
    // ★★★（小学5・6年生）
    3: [
        { min: 1,   max: 5,   type: 'add1_1_nc' },
        { min: 6,   max: 10,  type: 'sub1_1_nb' },
        { min: 11,  max: 15,  type: 'add1_1_c' },
        { min: 16,  max: 20,  type: 'add2_1_nc' },
        { min: 21,  max: 25,  type: 'sub2_1_nb' },
        { min: 26,  max: 30,  type: 'add2_1_c' },
        { min: 31,  max: 35,  type: 'sub2_1_b' },
        { min: 36,  max: 40,  type: 'add2_2_nc' },
        { min: 41,  max: 45,  type: 'sub2_2_nb' },
        { min: 46,  max: 50,  type: 'kuku' },
        { min: 51,  max: 55,  type: 'add2_2_c' },
        { min: 56,  max: 60,  type: 'sub2_2_b' },
        { min: 61,  max: 65,  type: 'div2_1_nr1' },
        { min: 66,  max: 70,  type: 'div2_1_nr2' },
        { min: 71,  max: 75,  type: 'mul2_1_3' },
        { min: 76,  max: 80,  type: 'mul2_1_6' },
        { min: 81,  max: 85,  type: 'mul2_1_9' },
        { min: 86,  max: 90,  type: 'all2_easy' },
        { min: 91,  max: 95,  type: 'all2_hard',    noLower: true },
        { min: 96,  max: 100, type: 'all2_hard',    noLower: true, bossType: 'all2_hardest' },
    ],
    // ★★（小学3・4年生）
    2: [
        { min: 1,   max: 5,   type: 'add1_1_nc' },
        { min: 6,   max: 10,  type: 'sub1_1_nb' },
        { min: 11,  max: 15,  type: 'add1_1_c' },
        { min: 16,  max: 20,  type: 'add2_1_nc' },
        { min: 21,  max: 25,  type: 'sub2_1_nb' },
        { min: 26,  max: 35,  type: 'add2_1_c' },
        { min: 36,  max: 45,  type: 'sub2_1_b' },
        { min: 46,  max: 50,  type: 'add2_2_nc' },
        { min: 51,  max: 55,  type: 'sub2_2_nb' },
        { min: 56,  max: 70,  type: 'kuku' },
        { min: 71,  max: 75,  type: 'add2_2_c' },
        { min: 76,  max: 80,  type: 'sub2_2_b' },
        { min: 81,  max: 90,  type: 'div2_1_nr1' },
        { min: 91,  max: 95,  type: 'div2_1_nr2' },
        { min: 96,  max: 100, type: 'mul2_1_3',  bossType: 'mul2_1_9' },
    ],
    // ★（小学1・2年生）
    1: [
        { min: 1,   max: 15,  type: 'add1_1_nc' },
        { min: 16,  max: 30,  type: 'sub1_1_nb' },
        { min: 31,  max: 45,  type: 'add1_1_c' },
        { min: 46,  max: 60,  type: 'add2_1_nc' },
        { min: 61,  max: 75,  type: 'sub2_1_nb' },
        { min: 76,  max: 90,  type: 'add2_2_nc' },
        { min: 91,  max: 100, type: 'sub2_2_nb', bossType: 'carry_borrow' },
    ],
};

class MathProblem {
    constructor(floor, difficulty) {
        this.floor = floor;
        this.difficulty = difficulty || Difficulty.HARD;
        this.isBoss = (floor === 100);
        this.left = 0;
        this.right = 0;
        this.operator = '+';
        this.answer = 0;
        this.displayText = '';
        this._remainder = null;
    }

    // ---- ユーティリティ ----

    _hasBorrow(left, right, op) {
        if (op === '+') return (left % 10) + (right % 10) >= 10;
        if (op === '-') return (left % 10) < (right % 10);
        return false;
    }

    _r1()                   { return Math.floor(Math.random() * 9) + 1; }
    _r2()                   { return Math.floor(Math.random() * 90) + 10; }
    _rRange(min, max)       { return Math.floor(Math.random() * (max - min + 1)) + min; }
    _pickOp(ops)            { return ops[Math.floor(Math.random() * ops.length)]; }

    _genDivNoRem(leftMin, leftMax, rightMin, rightMax) {
        for (let i = 0; i < 200; i++) {
            const right = this._rRange(rightMin, rightMax);
            const maxAns = Math.floor(leftMax / right);
            if (maxAns < 2) continue;
            const ans = this._rRange(2, maxAns);
            const left = right * ans;
            if (left >= leftMin && left <= leftMax) return { left, right, answer: ans };
        }
        return { left: 6, right: 3, answer: 2 };
    }

    _genDivWithRem(leftMin, leftMax, rightMin, rightMax) {
        for (let i = 0; i < 200; i++) {
            const right = this._rRange(rightMin, rightMax);
            const ans = this._rRange(1, Math.floor(leftMax / right));
            const rem = this._rRange(1, right - 1);
            const left = right * ans + rem;
            if (left >= leftMin && left <= leftMax) return { left, right, answer: ans, remainder: rem };
        }
        return { left: 7, right: 3, answer: 2, remainder: 1 };
    }

    // ---- 問題タイプ別生成 ----

    _genByType(type) {
        this._remainder = null;
        let attempts, result;

        switch (type) {
            case 'add1_1_nc':
                attempts = 0;
                do { this.left = this._r1(); this.right = this._r1(); attempts++; }
                while (this._hasBorrow(this.left, this.right, '+') && attempts < 100);
                this.operator = '+'; this.answer = this.left + this.right;
                break;

            case 'sub1_1_nb':
                this.left = this._r1(); this.right = this._r1();
                if (this.left < this.right) [this.left, this.right] = [this.right, this.left];
                this.operator = '-'; this.answer = this.left - this.right;
                break;

            case 'add1_1_c':
                attempts = 0;
                do { this.left = this._r1(); this.right = this._r1(); attempts++; }
                while (!this._hasBorrow(this.left, this.right, '+') && attempts < 100);
                this.operator = '+'; this.answer = this.left + this.right;
                break;

            case 'add2_1_nc':
                attempts = 0;
                do { this.left = this._r2(); this.right = this._r1(); attempts++; }
                while (this._hasBorrow(this.left, this.right, '+') && attempts < 100);
                this.operator = '+'; this.answer = this.left + this.right;
                break;

            case 'sub2_1_nb':
                attempts = 0;
                do {
                    this.left = this._r2(); this.right = this._r1();
                    if (this.left < this.right) [this.left, this.right] = [this.right, this.left];
                    attempts++;
                } while (this._hasBorrow(this.left, this.right, '-') && attempts < 100);
                this.operator = '-'; this.answer = this.left - this.right;
                break;

            case 'add2_1_c':
                attempts = 0;
                do { this.left = this._r2(); this.right = this._r1(); attempts++; }
                while (!this._hasBorrow(this.left, this.right, '+') && attempts < 100);
                this.operator = '+'; this.answer = this.left + this.right;
                break;

            case 'sub2_1_b':
                attempts = 0;
                do {
                    this.left = this._r2(); this.right = this._r1();
                    if (this.left < this.right) [this.left, this.right] = [this.right, this.left];
                    attempts++;
                } while (!this._hasBorrow(this.left, this.right, '-') && attempts < 100);
                this.operator = '-'; this.answer = this.left - this.right;
                break;

            case 'add2_2_nc':
                attempts = 0;
                do { this.left = this._r2(); this.right = this._r2(); attempts++; }
                while (this._hasBorrow(this.left, this.right, '+') && attempts < 100);
                this.operator = '+'; this.answer = this.left + this.right;
                break;

            case 'sub2_2_nb':
                attempts = 0;
                do {
                    this.left = this._r2(); this.right = this._r2();
                    if (this.left < this.right) [this.left, this.right] = [this.right, this.left];
                    attempts++;
                } while (this._hasBorrow(this.left, this.right, '-') && attempts < 100);
                this.operator = '-'; this.answer = this.left - this.right;
                break;

            case 'kuku':
                this.left = this._r1(); this.right = this._rRange(2, 9);
                this.operator = '*'; this.answer = this.left * this.right;
                break;

            case 'add2_2_c':
                attempts = 0;
                do { this.left = this._r2(); this.right = this._r2(); attempts++; }
                while (!this._hasBorrow(this.left, this.right, '+') && attempts < 100);
                this.operator = '+'; this.answer = this.left + this.right;
                break;

            case 'sub2_2_b':
                attempts = 0;
                do {
                    this.left = this._r2(); this.right = this._r2();
                    if (this.left < this.right) [this.left, this.right] = [this.right, this.left];
                    attempts++;
                } while (!this._hasBorrow(this.left, this.right, '-') && attempts < 100);
                this.operator = '-'; this.answer = this.left - this.right;
                break;

            case 'div2_1_nr1':
                // 商が1桁になるよう: left = right(2〜9) × ans(1桁2以上) → left≤81
                result = this._genDivNoRem(10, 81, 2, 9);
                this.left = result.left; this.right = result.right;
                this.operator = '/'; this.answer = result.answer;
                break;

            case 'div2_1_nr2':
                // 商が2桁: left = right(2〜9) × ans(10〜99/right) → left ≤ 99
                result = this._genDivNoRem(10, 99, 2, 9);
                // 商が2桁以上になるまでリトライ
                for (let i = 0; i < 50 && result.answer < 10; i++) {
                    result = this._genDivNoRem(10, 99, 2, 9);
                }
                this.left = result.left; this.right = result.right;
                this.operator = '/'; this.answer = result.answer;
                break;

            case 'mul2_1_3':
                this.left = this._r2(); this.right = this._rRange(1, 3);
                this.operator = '*'; this.answer = this.left * this.right;
                break;

            case 'mul2_1_6':
                this.left = this._r2(); this.right = this._rRange(1, 6);
                this.operator = '*'; this.answer = this.left * this.right;
                break;

            case 'mul2_1_9':
                this.left = this._r2(); this.right = this._r1();
                this.operator = '*'; this.answer = this.left * this.right;
                break;

            case 'all2_easy': {
                // +（繰り上がりあり）/ −（繰り下がりあり）/ ×1桁 / ÷余りなし からランダム
                const roll = Math.floor(Math.random() * 4);
                if (roll === 0) {
                    this._genByType('add2_2_c');
                } else if (roll === 1) {
                    this._genByType('sub2_2_b');
                } else if (roll === 2) {
                    this._genByType('mul2_1_9');
                } else {
                    result = this._genDivWithRem(10, 99, 2, 9);
                    this.left = result.left; this.right = result.right;
                    this.operator = '/'; this.answer = result.answer;
                    this._remainder = result.remainder;
                }
                break;
            }

            case 'all2_hard': {
                // all2_easy と同じ構成（難化は問題数増加・下ダンジョンなしで対応）
                const roll = Math.floor(Math.random() * 4);
                if (roll === 0) {
                    this._genByType('add2_2_c');
                } else if (roll === 1) {
                    this._genByType('sub2_2_b');
                } else if (roll === 2) {
                    this._genByType('mul2_1_9');
                } else {
                    result = this._genDivWithRem(10, 99, 2, 9);
                    this.left = result.left; this.right = result.right;
                    this.operator = '/'; this.answer = result.answer;
                    this._remainder = result.remainder;
                }
                break;
            }

            case 'all2_hardest': {
                // ×の割合を50%に高める
                const roll = Math.random();
                if (roll < 0.50) {
                    // ×（右辺を高め）
                    this.left = this._r2(); this.right = this._rRange(6, 9);
                    this.operator = '*'; this.answer = this.left * this.right;
                } else if (roll < 0.67) {
                    this._genByType('add2_2_c');
                } else if (roll < 0.84) {
                    this._genByType('sub2_2_b');
                } else {
                    result = this._genDivWithRem(10, 99, 2, 9);
                    this.left = result.left; this.right = result.right;
                    this.operator = '/'; this.answer = result.answer;
                    this._remainder = result.remainder;
                }
                break;
            }

            case 'carry_borrow': {
                // ★1 100階ボス用: 繰り上がり・繰り下がりあり問題
                const types = ['add1_1_c', 'add2_1_c', 'sub2_1_b'];
                this._genByType(types[Math.floor(Math.random() * types.length)]);
                break;
            }

            default:
                // フォールバック
                this._genByType('add1_1_nc');
                break;
        }
    }

    // ---- メイン生成ロジック ----

    generate() {
        this._remainder = null;
        const table = FLOOR_TABLES[this.difficulty];
        const f = this.floor;

        // 現在のティアを検索
        const tierIdx = table.findIndex(t => f >= t.min && f <= t.max);
        if (tierIdx === -1) {
            // テーブル外（フォールバック）
            this._genByType('add1_1_nc');
        } else {
            const tier = table[tierIdx];

            // floor===100 のとき bossType があれば差し替え
            const currentType = (f === 100 && tier.bossType) ? tier.bossType : tier.type;

            if (tier.noLower || tierIdx === 0) {
                // 下ダンジョンの問題なし → 100% 現ティア
                this._genByType(currentType);
            } else {
                // 60% 現ティア / 40% 下ティアからランダム1つ
                if (Math.random() < 0.60) {
                    this._genByType(currentType);
                } else {
                    // 下ティア（0〜tierIdx-1）からランダムに1つ選ぶ
                    const lowerTier = table[Math.floor(Math.random() * tierIdx)];
                    // 下ティアにも bossType があっても floor===100 以外では適用しない
                    this._genByType(lowerTier.type);
                }
            }
        }

        const opDisplay = { '+': '＋', '-': '－', '*': '×', '/': '÷' }[this.operator];
        this.displayText = `${this.left} ${opDisplay} ${this.right} ＝ `;
        return this.displayText;
    }

    check(val) {
        return parseInt(val) === this.answer;
    }
}

/* SRareMathProblem: げきレアモンスター専用のひねり問題 */
class SRareMathProblem {
    constructor() {
        this.answer = 0;
        this.displayText = '';
        this.hintText = '';        // 演算子穴埋め用ヒント
        this.displayAnswer = null; // 誤答時に表示する記号（演算子穴埋め用）
        this.fillInBlank = false;  // true: □を入力値で置換 / false: 末尾追記
    }

    _r(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    generate() {
        this.hintText = '';
        this.displayAnswer = null;
        this.fillInBlank = false;
        this.blankDisplayMap = null;
        const type = Math.floor(Math.random() * 3);
        if (type === 0) this._genMushikuizan();
        else if (type === 1) this._genSequence();
        else this._genOperator();
        return this.displayText;
    }

    check(val) { return parseInt(val) === this.answer; }

    // ---- 虫食い算: □＋3＝ など ----
    _genMushikuizan() {
        const ops = ['+', '-', '*', '/'];
        const op = ops[Math.floor(Math.random() * 4)];
        const D = { '+': '＋', '-': '－', '*': '×', '/': '÷' };
        let a, b;
        switch (op) {
            case '+': a = this._r(1, 9); b = this._r(1, 9); break;
            case '-': a = this._r(2, 9); b = this._r(1, a - 1); break;
            case '*': a = this._r(2, 9); b = this._r(2, 9); break;
            case '/': b = this._r(2, 9); a = b * this._r(2, 9); break;
        }
        // 減算は左のみ（負の答えを避ける）
        const boxLeft = (op === '-') || Math.random() < 0.5;
        const calc = { '+': a + b, '-': a - b, '*': a * b, '/': a / b };
        const c = calc[op];
        this.fillInBlank = true;
        if (boxLeft) { this.answer = a; this.displayText = `□${D[op]}${b}＝${c}`; }
        else         { this.answer = b; this.displayText = `${a}${D[op]}□＝${c}`; }
    }

    // ---- 等差数列: 2,4,6,□＝ など ----
    _genSequence() {
        const inc = Math.random() < 0.7;
        const diff = inc ? this._r(1, 5) : -this._r(1, 4);
        const minStart = diff < 0 ? Math.abs(diff) * 3 + 1 : 1;
        const s = this._r(minStart, minStart + 8);
        const ans = s + 3 * diff;
        if (ans < 0 || ans > 99) {
            // フォールバック（増加列）
            const d = this._r(1, 5), s2 = this._r(1, 5);
            this.answer = s2 + 3 * d;
            this.fillInBlank = true;
            this.displayText = `${s2},${s2+d},${s2+2*d},□`;
            return;
        }
        this.answer = ans;
        this.fillInBlank = true;
        this.displayText = `${s},${s+diff},${s+2*diff},□`;
    }

    // ---- 演算子穴埋め: 3□4＝12 → □は何？（1=＋ 2=－ 3=× 4=÷）----
    _genOperator() {
        const OPS = ['+', '-', '*', '/'];
        const D = { '+': '＋', '-': '－', '*': '×', '/': '÷' };
        const N = { '+': 1, '-': 2, '*': 3, '/': 4 };
        for (let i = 0; i < 100; i++) {
            const op = OPS[Math.floor(Math.random() * 4)];
            let a, b, c;
            switch (op) {
                case '+': a = this._r(1, 9); b = this._r(1, 9); c = a + b; break;
                case '-': a = this._r(2, 9); b = this._r(1, a - 1); c = a - b; break;
                case '*': a = this._r(2, 9); b = this._r(2, 9); c = a * b; break;
                case '/': b = this._r(2, 9); c = this._r(2, 9); a = b * c; break;
                default: continue;
            }
            // 解が一意かチェック（複数の演算子が成立する場合はスキップ）
            const valid = [];
            if (a + b === c) valid.push('+');
            if (a - b === c) valid.push('-');
            if (a * b === c) valid.push('*');
            if (b && Number.isInteger(a / b) && a / b === c) valid.push('/');
            if (valid.length === 1) {
                this.answer = N[op];
                this.displayAnswer = D[op]; // 誤答フィードバック用
                this.displayText = `${a}□${b}＝${c} `;
                this.hintText = '１:＋　２:－　３:×　４:÷';
                this.fillInBlank = true;
                this.blankDisplayMap = { '1': '＋', '2': '－', '3': '×', '4': '÷' };
                return;
            }
        }
        // フォールバック
        this._genMushikuizan();
    }
}
