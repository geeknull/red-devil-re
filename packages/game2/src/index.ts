/**
 * @red-devil/game2 — 游戏2《红魔特种兵2-深海战舰》忠实移植入口。
 * 各类逐行移植自 reverse/game2/2-decompiled-cfr/tjge/。
 */
export { GameMIDlet } from "./GameMIDlet.ts";
// 偏差配套：暴露 actor 换色帧收集器，供运行壳预加载阶段离线解码（见 TileSheet.ts 类头偏差说明）。
export { TileSheet as TileSheet } from "./TileSheet.ts";
