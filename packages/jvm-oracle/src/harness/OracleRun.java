package harness;

import java.lang.reflect.*;
import java.util.*;
import javax.microedition.lcdui.*;

/** M1 实验的双游戏版：args[0]=1|2。复刻 behavior-net 的 game{1,2}-level 场景。 */
public class OracleRun {

  static class LoggingRandom extends Random {
    final List<Integer> draws = new ArrayList<>();
    LoggingRandom(long seed) { super(seed); }
    @Override protected int next(int bits) { int v = super.next(bits); draws.add(v); return v; }
  }

  static Field f(Class<?> c, String n) {
    while (c != null) { try { Field x = c.getDeclaredField(n); x.setAccessible(true); return x; } catch (Exception e) { c = c.getSuperclass(); } }
    return null;
  }
  static Method m(Class<?> c, String n, Class<?>... p) {
    while (c != null) { try { Method x = c.getDeclaredMethod(n, p); x.setAccessible(true); return x; } catch (Exception e) { c = c.getSuperclass(); } }
    return null;
  }
  static String sha(String s) {
    try {
      byte[] d = java.security.MessageDigest.getInstance("SHA-256").digest(s.getBytes("UTF-8"));
      StringBuilder sb = new StringBuilder();
      for (int i = 0; i < 6; i++) sb.append(String.format("%02x", d[i]));
      return sb.toString();
    } catch (Exception e) { return "ERR"; }
  }

  /** -Doracle.dumpOps=true → 逐帧输出原始 op 文本（供跨端差分），否则输出逐帧哈希 trace。 */
  static final boolean DUMP_OPS = Boolean.getBoolean("oracle.dumpOps");

  // behavior-net scenarios.ts 原样搬运
  static final int[][] IN_G1 = {{100,48,1},{101,48,0},{210,5,1},{240,48,1},{241,48,0},{260,5,0},{290,48,1},{291,48,0}};
  static final int[][] IN_G2 = {{100,53,1},{101,53,0},{130,22,1},{131,22,0},{145,54,1},{160,53,1},{161,53,0},{175,54,0}};

  public static void main(String[] a) throws Exception {
    int game = Integer.parseInt(a[0]);
    long seed   = game == 1 ? 12345L : 54321L;
    int frames  = game == 1 ? 330 : 300;
    int[][] ins = game == 1 ? IN_G1 : IN_G2;

    Class<?> M = Class.forName("tjge.GameMIDlet");
    Constructor<?> ct = M.getDeclaredConstructor(); ct.setAccessible(true);
    Object midlet = ct.newInstance();
    LoggingRandom rng = new LoggingRandom(seed);
    f(M, "c").set(null, rng);
    m(M, "startApp").invoke(midlet);

    Canvas c = (Canvas) HeadlessBridge.current;
    Class<?> CC = c.getClass();
    // 状态字段：game1=p, game2=b(uiState)
    Field pf = f(CC, game == 1 ? "p" : "b");
    Method paint = m(CC, "paint", Graphics.class);
    Method keyP = m(CC, "keyPressed", int.class);
    Method keyR = m(CC, "keyReleased", int.class);

    StringBuilder trace = new StringBuilder();
    String rngRoll = "";
    Set<String> states = new LinkedHashSet<>();
    int totalOps = 0;

    for (int frame = 0; frame < frames; frame++) {
      for (int[] in : ins) if (in[0] == frame) { if (in[2] == 1) keyP.invoke(c, in[1]); else keyR.invoke(c, in[1]); }
      int before = rng.draws.size();
      Graphics g = new Graphics();
      paint.invoke(c, g);
      StringBuilder ds = new StringBuilder();
      for (int v : rng.draws.subList(before, rng.draws.size())) ds.append(v).append(';');
      rngRoll = sha(rngRoll + ds);
      StringBuilder os = new StringBuilder();
      for (String op : g.ops) os.append(op).append('\n');
      totalOps += g.ops.size();
      Object st = pf.get(c);
      states.add(String.valueOf(st));
      if (DUMP_OPS) {
        // 逐 op 原文输出（差分 runner 用；与 TS 侧语义 tap 同 schema）
        for (String op : g.ops) trace.append("F").append(frame).append('\t').append(op).append('\n');
      } else {
        trace.append("F").append(frame).append(" s=").append(st)
             .append(" ops=").append(g.ops.size()).append(" opsHash=").append(sha(os.toString()))
             .append(" rngDraws=").append(rng.draws.size() - before)
             .append(" rngRoll=").append(rngRoll).append('\n');
      }
    }
    System.out.print(trace);
    System.out.println("[oracle] screen=" + ScreenConfig.WIDTH + "x" + ScreenConfig.HEIGHT
        + " (canvas.getWidth/getHeight 供游戏自适应布局)");
    System.out.println("[oracle] game=" + game + " frames=" + frames + " totalDrawOps=" + totalOps + " totalRngDraws=" + rng.draws.size());
    System.out.println("[oracle] statesSeen=" + states);
    System.out.println("[oracle] finalRngRolling=" + rngRoll);
    System.out.println("[oracle] traceHash=" + sha(trace.toString()));
    System.exit(0);
  }
}
