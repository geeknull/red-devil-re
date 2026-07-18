/**
 * 通关脚本录制器 —— 场景/策略注册表。
 * 每个 scenario = 固定前缀（入关+导航）+ 反应式 policy（读内部状态逐帧决策）+ 自检必达状态。
 * 新增 beat-level 单元时在此加一条；`recorder/cli.ts <name>` 即可重生夹具并自检。
 */
import { LevelLoader } from "@red-devil/game1/src/LevelLoader.ts";
import type { KF, PolicyFn, Scenario } from "./record.ts";

// keyCode（关卡态；见 GameScreen.keyCodeToAction / GameCanvas.keyToAction）
const K = { LEFT: 2, RIGHT: 5, UP: 1, DOWN: 6, FIRE: 48, SWITCH: 35, GRENADE: 49, RELOAD: 51 };

// ── game1 关卡3 通关 ────────────────────────────────────────────────────────
// 固定前缀：入关(save=3,3,1+Continue) + 导航宏（W=5 展开）。
const G1L3_ENTRY: KF[] = [
  { frame: 100, code: 6, down: true },
  { frame: 101, code: 6, down: false },
  { frame: 130, code: 48, down: true },
  { frame: 131, code: 48, down: false },
];
// 导航宏动作串（best-first/beam 搜出，送玩家到 boss 竞技场 col~72 hp9）。W=5 展开。
const G1L3_NAV = "FRRRRRRLVRRRRRRUGVRRVUUUUFLVRUUVUURRRRRRRVUU";
const G1_NAV_W = 5;
const G1_PLAY_START = 232;
function g1NavKeyframes(): KF[] {
  const kfs: KF[] = [];
  let f = G1_PLAY_START;
  for (const ch of G1L3_NAV) {
    switch (ch) {
      case "R": kfs.push({ frame: f, code: 5, down: true }); break;
      case "L": kfs.push({ frame: f, code: 2, down: true }); break;
      case "V": kfs.push({ frame: f, code: 1, down: true }, { frame: f + 1, code: 5, down: true }); break; // vault
      case "F": kfs.push({ frame: f, code: 48, down: true }); break;
      case "U": kfs.push({ frame: f, code: 1, down: true }); break;
      case "G": kfs.push({ frame: f, code: 49, down: true }); break;
      case "D": kfs.push({ frame: f, code: 6, down: true }); break;
      case "N": kfs.push({ frame: f, code: 5, down: false }); break;
    }
    f += G1_NAV_W;
  }
  return kfs;
}
const G1L3_POLICY_START = G1_PLAY_START + G1L3_NAV.length * G1_NAV_W + 1; // 453

function g1FindBoss(): any {
  const aa: any[] = (LevelLoader as any).activeActors ?? [];
  for (const a of aa) if (a && a.typeId === 8 && a.active) return a; // AtvVehicleBoss（关3 为普通 actor）
  return null;
}
function g1NearestBossMissilePx(screen: any, px: number): number | null {
  let bd = 1e9, found = false;
  for (let i = 0; i < screen.drawQueueCount; i++) {
    const a = screen.drawQueue[i];
    if (a && a.active && a.typeId === 21 && (a.velX ?? 0) < 0) { // boss 导弹左飞
      const d = (a.posX >> 10) - (px >> 10);
      if (d > -12 && d < bd) { bd = d; found = true; }
    }
  }
  return found ? bd : null;
}

// 打法：静止窗口开火(weapon0 换弹免费=无限弹)、蹲伏躲导弹、每波结算 boss 左冲刺时 leapleft(面左+起跳)腾空躲、
// 20 击穿→相机解锁→爬 col82 梯→col85 RescueNpc。参数为单进程网格搜索找出的通关组合。
const G1L3_CAMP = 72, G1L3_BACKOFF = 73, G1L3_DODGE = 56, G1L3_WINDUPSUB = 6;
const game1Level3Policy: PolicyFn = ({ screen }) => {
  const s = screen;
  const p = s.player;
  if (!p || s.state !== 10) return null; // 仅关卡内主玩法决策；过场/结算不发键
  const pcol = p.posX >> 14, prow = p.posY >> 14, ihc = p.inputHoldCount;
  const boss = g1FindBoss();
  if (s.scriptFlagL && boss) {
    const miss = g1NearestBossMissilePx(s, p.posX);
    const mag = p.magazineAmmo;
    const bcol = boss.posX >> 14;
    const reloading = p.actionId === 1 || p.actionId === 28;
    const dashActive = boss.phase === 3 || boss.targetVelX < -2048;
    const winding = boss.phase === 2 && (boss.subTimer ?? 0) >= G1L3_WINDUPSUB;
    if (dashActive || winding) {
      // leapleft：面左(按左)再起跳(UP→leap 64) 腾空躲左冲刺；面右起跳会跳进冲刺路径
      return p.facingLeft ? (ihc > 0 ? K.UP : -1) : K.LEFT;
    }
    if (pcol >= G1L3_BACKOFF) return K.LEFT; // 退开避免触碰宽 ATV
    if (miss != null && miss < G1L3_DODGE) return K.DOWN; // 蹲伏躲导弹
    if (reloading) return -1; // 换弹动画中，勿打断
    if (mag <= 0) return ihc > 1 ? K.RELOAD : -1; // 免费换弹→10；先 idle 蓄力
    if (boss.targetVelX !== 0 || bcol > 78) return -1; // boss 移动/入场→暂不开火
    if (pcol < G1L3_CAMP - 1) return K.RIGHT; // 靠回 camp 列
    return K.FIRE; // 静止 boss + 有弹→开火
  }
  if (s.scriptFlagL && !boss) return -1;
  // 相机解锁后：走到 col82 爬梯到 row8 平台→col85 RescueNpc 着地
  if ((p.stateFlags & 0x2000) !== 0) return prow > 8 ? K.UP : K.RIGHT; // 梯上
  if (pcol < 82) return K.RIGHT;
  if (prow > 8) return K.UP; // 到梯脚→爬
  return K.RIGHT;
};

export const SCENARIOS: Record<string, Scenario> = {
  "game1-beat-level3": {
    name: "game1-beat-level3",
    game: 1,
    saveCsv: "3,3,1",
    seed: 12345,
    frames: 900,
    fixed: [...G1L3_ENTRY, ...g1NavKeyframes()],
    policyStart: G1L3_POLICY_START,
    policy: game1Level3Policy,
    expectStates: [10, 19, 16], // Playing → GoalCutscene → MissionComplete
    playingState: 10,
  },
};

export const FIXTURE_HEADER: Record<string, string> = {
  "game1-beat-level3":
    "game1 关卡3 完整通关：打穿 9 波相机锁 boss(AtvVehicleBoss) → 爬梯到 RescueNpc → GoalCutscene(19) → MissionComplete(16)\n" +
    "\n" +
    "覆盖此前从未与原版对拍过的**结算/通关渲染**（含时钟驱动的耗时显示）。见 coverage/game1-beat-level3.cover。\n" +
    "由 packages/behavior-net/recorder 从源码可重生：`node --experimental-transform-types packages/behavior-net/recorder/cli.ts game1-beat-level3 --out <path>`。\n" +
    "打法/机制全部 file:line 钉死于 docs/jvm-oracle-保真审计.md「ultracode 续（2026-07-18 收官）」。\n" +
    "跑法：packages/jvm-oracle/diff.sh --script regress/game1-beat-level3.txt 1",
};
