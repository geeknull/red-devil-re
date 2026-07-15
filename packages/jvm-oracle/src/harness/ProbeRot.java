package harness;

import java.lang.reflect.*;
import java.util.*;
import javax.microedition.lcdui.*;

/**
 * 探针：扫 game1 各关，找出哪一关会触发 Nokia manipulation 的 90/270 旋转。
 *
 * 背景：port 的 SpriteAtlas.manipulationToTransform 与 FreeJ2ME 独立参照在 90/270 上相反
 * （见 docs/jvm-oracle-保真审计.md）。但 game1-level 场景只跑 m=0 / m=8192，裁决不了。
 * 唯一设 orientation=270 的地方是 ProjectileActor.spawnAt（typeId=10 PlayerBounceShot 且
 * byArray[2]==2，即关卡数据放置的弹反/地雷物），故需逐关找。
 *
 * 手法：把存档 tjge.a.Q 置为 [关号, 关号, 1]（Q[0]=最高解锁关 → 菜单起始选项即该关），
 * 再走与 game1-level 相同的输入脚本进关，统计出现过的 manipulation 码。
 *
 * ⚠️ **本探针尚未达成目标，诚实记录**：Q[0] 只影响「任务选择屏」的起始项，而 game1-level 脚本
 * 在主菜单按确定（48）直接进第一项=新游戏→关卡0，**根本没走到任务选择屏**，故实测 8 关的
 * levelIndex 恒为 0、transform 分布恒为 {0:3357, 2:786}（无任何旋转）。要真正逐关扫描，需先
 * 摸清主菜单→任务选择屏的导航键序。
 * 另一个已踩的坑：`a.java c(1)` 里 `Q = recordStore.getRecord(n2)` 会**整个替换数组引用**，
 * 故对 Q 的写入必须在「游戏已从 RMS 读回存档」之后（本探针放在 frame 95）。
 *
 * 注：rot90/270 的**映射正确性**已不依赖本探针——已由 Nokia 官方规范 + FreeJ2ME 双重裁决并修复，
 * 由 packages/j2me-shim/test/nokia-manip.verify.ts 锚定（全 16 组合）。本探针的剩余价值是
 * 找到该路径的**实际触发场景**，以便让跨引擎差分也在 in-situ 覆盖它。
 *
 * 用法：ProbeRot <levelIndex> <frames>
 */
public class ProbeRot {
  static Field f(Class<?> c, String n) {
    while (c != null) { try { Field x = c.getDeclaredField(n); x.setAccessible(true); return x; } catch (Exception e) { c = c.getSuperclass(); } }
    return null;
  }
  static Method m(Class<?> c, String n, Class<?>... p) {
    while (c != null) { try { Method x = c.getDeclaredMethod(n, p); x.setAccessible(true); return x; } catch (Exception e) { c = c.getSuperclass(); } }
    return null;
  }

  public static void main(String[] a) throws Exception {
    int level = Integer.parseInt(a[0]);
    int frames = a.length > 1 ? Integer.parseInt(a[1]) : 600;

    Class<?> M = Class.forName("tjge.GameMIDlet");
    Constructor<?> ct = M.getDeclaredConstructor(); ct.setAccessible(true);
    Object midlet = ct.newInstance();
    ((Random) f(M, "c").get(null)).setSeed(12345L);
    m(M, "startApp").invoke(midlet);

    Class<?> A = Class.forName("tjge.a");
    Field QF = f(A, "Q");

    Canvas c = (Canvas) HeadlessBridge.current;
    Class<?> CC = c.getClass();
    Field pf = f(CC, "p");
    Method paint = m(CC, "paint", Graphics.class);
    Method keyP = m(CC, "keyPressed", int.class);
    Method keyR = m(CC, "keyReleased", int.class);

    // 与 game1-level 同一脚本；进关后持续右移+反复开火，尽量把弹药/物件触发出来
    Set<String> states = new LinkedHashSet<>();
    Map<String, Integer> manips = new TreeMap<>();
    OpTap.begin();
    for (int frame = 0; frame < frames; frame++) {
      // ⚠️ 必须在「游戏已从 RMS 读回存档」之后再写：a.java c(1) 里 `Q = recordStore.getRecord(n2)`
      // 会整个替换数组引用，早写会被覆盖。Q[0]=最高解锁关 → 决定菜单起始任务号（a.java:238 F=Q[0]）。
      if (frame == 95) {
        Object Q = QF.get(null);
        java.lang.reflect.Array.set(Q, 0, (byte) level);
        java.lang.reflect.Array.set(Q, 1, (byte) level);
      }
      if (frame == 100) keyP.invoke(c, 48);
      if (frame == 101) keyR.invoke(c, 48);
      if (frame == 210) keyP.invoke(c, 5);           // 持续右移
      if (frame > 220 && frame % 20 == 0) keyP.invoke(c, 48);   // 反复开火
      if (frame > 220 && frame % 20 == 1) keyR.invoke(c, 48);
      paint.invoke(c, new Graphics());
      for (String op : OpTap.take()) {
        int i = op.indexOf(" t=");
        if (op.startsWith("blitSprite") && i > 0) {
          String t = op.substring(i + 3, op.indexOf(' ', i + 3));
          manips.merge("t=" + t, 1, Integer::sum);
        }
      }
      states.add(String.valueOf(pf.get(c)));
    }
    System.out.println("[probe] 请求关卡=" + level + " 实际 levelIndex(x)=" + f(CC,"x").get(c) + " statesSeen=" + states);
    System.out.println("[probe] blitSprite transform 分布 = " + manips);
    System.exit(0);
  }
}
