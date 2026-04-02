/* BattleManager: バトルロジック専門クラス。UIには一切触らない。
 * 計算結果を返すだけで、画面更新はgame.jsまたはui.jsが行う。
 */
class BattleManager {

    constructor(constants) {
        this._constants = constants;
    }

    // --- ダメージ計算 ---

    /**
     * プレイヤーの攻撃ダメージを計算する
     * @param {number} equippedSwordBonus - 装備中の剣のボーナス値（equipment.attack or equipment.bonus）
     * @param {number} swordBonus         - ミスターといし・こうげきだまによる一時ボーナス
     * @returns {{ damage: number, isSpecial: boolean }}
     */
    calcPlayerDamage(equippedSwordBonus, swordBonus, isCrit, specialMoveReady, extraDamage = 0) {
        // 新ダメージ計算式: ((1 + 武器のボーナス) × 1.5[クリティカル補正。端数切捨て] + スペシャルボーナス) × 2[必殺技補正]
        let damage = 1 + equippedSwordBonus; // 1 + 武器のボーナス（素手=0）

        if (isCrit) {
            damage = Math.floor(damage * 1.5); // クリティカル補正: ×1.5, 端数切捨て
        }

        damage += swordBonus; // スペシャルボーナス追加
        damage += (extraDamage || 0); // コンパニオンメダルの追加ダメージ

        const isSpecial = specialMoveReady;
        if (isSpecial) {
            damage *= 2; // 必殺技補正: ×2
        }

        damage = Math.max(0, damage); // 下限0（呪われた装備でもマイナスにはならない）

        return { damage, isSpecial };
    }

    /**
     * モンスターの攻撃ダメージを計算する
     * 盾は壊れない仕様。耐久度廃止。最低ダメージは1。
     * @param {object} monster
     * @param {number} equippedShieldBonus - 装備盾の防御ボーナス値（ミスターてっぱん効果適用済み）
     * @param {number} defenseBonus        - ぼうぎょだまによる一時防御ボーナス（1バトル有効）
     * @returns {{ damage: number }}
     */
    calcMonsterDamage(monster, equippedShieldBonus, defenseBonus) {
        const totalDefense = equippedShieldBonus + defenseBonus;
        const damage = Math.max(1, monster.attackPower - totalDefense);
        return { damage };
    }

    // --- 連続回避・必殺技 ---

    /**
     * 連続回避カウントを更新する
     * @param {{ dodgeStreak: number, specialMoveReady: boolean }} current 現在の状態
     * @param {boolean} hit プレイヤーが被弾したか（true=被弾, false=回避）
     * @param {number} shieldLevel 現在の盾レベル
     * @param {boolean} isBoss ボス戦かどうか
     * @returns {{ dodgeStreak: number, specialMoveReady: boolean }}
     */
    updateDodgeStreak(current, hit, shieldLevel, isBoss = false) {
        let { dodgeStreak, specialMoveReady } = current;

        if (!hit) {
            // 回避成功: 必殺技未待機中のみカウントアップ
            if (!specialMoveReady) {
                dodgeStreak++;
                if (dodgeStreak >= 4) {
                    specialMoveReady = true;
                }
            }
        } else {
            if (shieldLevel === 0) {
                // 盾なし: 全リセット
                dodgeStreak = 0;
                specialMoveReady = false;
            } else if (isBoss) {
                // 盾あり＋ボス戦: ゲージを1つだけ減らす
                if (specialMoveReady) specialMoveReady = false;
                dodgeStreak = Math.max(0, dodgeStreak - 1);
            }
            // 盾あり＋通常戦: 変化なし
        }

        return { dodgeStreak, specialMoveReady };
    }

    // --- モンスター状態異常ダメージ ---

    /** どくダメージ（モンスター最大HPの10%、最低1） */
    calcPoisonDamage(monster) {
        return Math.max(1, Math.ceil((monster.maxHp || monster.hp) * 0.1));
    }

    /** せきかだまの発動確率（固定値）*/
    calcStoneProcChance() {
        return 0.2;
    }

    // --- とげだまダメージ ---

    /** とげだまのダメージ（固定値）*/
    calcThornDamage() {
        return 3;
    }

    // --- アイテム使用可否チェック ---

    /**
     * 指定アイテムが現在使用可能かチェックする
     * @param {string} itemName
     * @param {Object} bag アイテム所持数
     * @param {number} playerHp 現在HP
     * @param {number} maxHp 最大HP
     * @param {Object} monsterItemUsage 対モンスター使用状態
     * @param {Object} monster 現在のモンスター（将来の拡張用）
     * @returns {boolean}
     */
    canUseItem(itemName, bag, playerHp, maxHp, monsterItemUsage, monster) {
        if ((bag[itemName] || 0) <= 0) return false;
        switch (itemName) {
            case 'healOrb':     return playerHp < maxHp;
            case 'attackOrb':   return (monsterItemUsage.attackOrb || 0) < 3;
            case 'defenseOrb':  return (monsterItemUsage.defenseOrb || 0) < 3;
            case 'spikeOrb':    return (monsterItemUsage.spikeOrb || 0) < 3;
            case 'poisonOrb':   return !monsterItemUsage.poisonOrb;
            case 'paralyzeOrb': return !monsterItemUsage.paralyzeOrb;
            case 'stoneOrb':    return !monsterItemUsage.stoneOrb;
            case 'rainbowOrb':  return !monsterItemUsage.rainbowOrbUsed;
            case 'friendshipBerry': return (monsterItemUsage.friendshipBerry || 0) < 5;
            default: return false;
        }
    }
}
