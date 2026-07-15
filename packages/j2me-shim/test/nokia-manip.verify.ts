/**
 * Nokia DirectGraphics `manipulation` → MIDP Sprite `transform` 映射的**规范锚定**测试。
 *
 * 为什么需要它：这个映射曾经是**错的**（纯旋转 90/270 按字面直译成 TRANS_ROT90/ROT270），
 * 一直到 jvm-oracle 引入「原版」这个外部参照才查出（见 docs/jvm-oracle-保真审计.md）。
 * 行为网抓不到——因为 golden 是从 port 自己录的，port 错则 golden 把错的当基准。
 *
 * 权威依据（三个独立信源一致）：
 *  1. **Nokia UI API 官方文档**：「ROTATE_90 … rotating an image 90 degrees **counter-clockwise**」
 *     「to rotate 90 degrees clockwise, **ROTATE_270** would be used」；组合顺序为
 *     「先旋转 → 再垂直翻转 → 最后水平翻转」。
 *     https://nikita36078.github.io/J2ME_Docs/docs/Nokia_UI_API_1_1/com/nokia/mid/ui/DirectGraphics.html
 *  2. **FreeJ2ME**（第三方模拟器）`PlatformGraphics.manipulateImage` 的实测表（CFR 反编译）。
 *  3. 对 FreeJ2ME `PlatformImage.transformImage` 的**逐像素**核对：
 *     case5 `src(x,y)→dst(h-1-y,x)`=顺时针90°=TRANS_ROT90；case6 `src(x,y)→dst(y,w-1-x)`=TRANS_ROT270。
 *
 * 关键：MIDP Sprite `TRANS_ROT90` 是**顺时针** → **Nokia 90° ≡ Sprite ROT270**（互换）。
 *
 * 游戏产出的 manipulation 形如 `(8192 if flipH) | (16384 if flipV) | rot`
 * （见原版 CFR `i.java:40-48`：`n7 = 8192` / `n7 |= 0x4000` / `n7 |= n5`），故须覆盖全 16 种组合。
 */

// MIDP Sprite 变换常量
const TRANS_NONE = 0;
const TRANS_MIRROR_ROT180 = 1;
const TRANS_MIRROR = 2;
const TRANS_ROT180 = 3;
const TRANS_MIRROR_ROT270 = 4;
const TRANS_ROT90 = 5;
const TRANS_ROT270 = 6;
const TRANS_MIRROR_ROT90 = 7;

const H = 8192; // FLIP_HORIZONTAL
const V = 16384; // FLIP_VERTICAL

/** 规范表：manipulation → Sprite transform（值取自上述三个独立信源，勿据 port 实现反推）。 */
const SPEC: Array<[number, number, string]> = [
  [0, TRANS_NONE, "无操作"],
  [H, TRANS_MIRROR, "水平翻转"],
  [V, TRANS_MIRROR_ROT180, "垂直翻转"],
  [H | V, TRANS_ROT180, "水平+垂直翻转"],
  [90, TRANS_ROT270, "★Nokia 90°(逆时针) ≡ Sprite ROT270"],
  [H | 90, TRANS_MIRROR_ROT90, "水平翻转+90°"],
  [V | 90, TRANS_MIRROR_ROT270, "垂直翻转+90°"],
  [H | V | 90, TRANS_ROT90, "双翻转+90°"],
  [180, TRANS_ROT180, "180°"],
  [H | 180, TRANS_MIRROR_ROT180, "水平翻转+180°"],
  [V | 180, TRANS_MIRROR, "垂直翻转+180°"],
  [H | V | 180, TRANS_NONE, "双翻转+180°"],
  [270, TRANS_ROT90, "★Nokia 270°(逆时针) ≡ Sprite ROT90"],
  [H | 270, TRANS_MIRROR_ROT270, "水平翻转+270°"],
  [V | 270, TRANS_MIRROR_ROT90, "垂直翻转+270°"],
  [H | V | 270, TRANS_ROT270, "双翻转+270°"],
];

// 相对路径导入：本测试跨包引用 game1（workspace 别名在 test 目录下解析不到）。
// ⚠️ 必须先导 ProjectileActor.ts 再导其它：ActorBase↔ProjectileActor 循环导入会 TDZ 报错
// （同 behavior-net/src/game1-adapter.ts 的规避，勿调整顺序）。
await import("../../game1/src/ProjectileActor.ts");
const { SpriteAtlas } = await import("../../game1/src/SpriteAtlas.ts");
// manipulationToTransform 是 private（TS 编译期概念），运行期可直接取。
const toTransform = (
  SpriteAtlas as unknown as { manipulationToTransform(m: number): number }
).manipulationToTransform.bind(SpriteAtlas);

let fail = 0;
for (const [manip, expect, why] of SPEC) {
  const got = toTransform(manip);
  if (got !== expect) {
    console.error(`✗ manipulation=${manip} (${why}) 期望 transform=${expect} 实得=${got}`);
    fail++;
  }
}

if (fail > 0) {
  console.error(`\n❌ Nokia manipulation→transform 映射有 ${fail}/${SPEC.length} 项不符规范`);
  process.exit(1);
}
console.log(`✓ Nokia manipulation→transform：全 ${SPEC.length} 种组合符合官方规范`);
