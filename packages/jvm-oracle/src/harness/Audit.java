package harness;

import java.lang.reflect.*;
import java.util.*;
import javax.microedition.lcdui.*;

/**
 * 任务 B 保真审计：只有「返回值会喂回游戏逻辑」的 shim API 才可能让 oracle 说谎。
 * 本工具驱动到 gameplay 后，dump 这些危险 API 的实际取值，以判定 shim 是否在编造。
 *
 * 用法：Audit <1|2>
 */
public class Audit {
  static Field f(Class<?> c, String n) {
    while (c != null) { try { Field x = c.getDeclaredField(n); x.setAccessible(true); return x; } catch (Exception e) { c = c.getSuperclass(); } }
    return null;
  }
  static Method m(Class<?> c, String n, Class<?>... p) {
    while (c != null) { try { Method x = c.getDeclaredMethod(n, p); x.setAccessible(true); return x; } catch (Exception e) { c = c.getSuperclass(); } }
    return null;
  }

  static final int[][] IN_G1 = {{100,48,1},{101,48,0},{210,5,1},{240,48,1},{241,48,0},{260,5,0},{290,48,1},{291,48,0}};
  static final int[][] IN_G2 = {{100,53,1},{101,53,0},{130,22,1},{131,22,0},{145,54,1},{160,53,1},{161,53,0},{175,54,0}};

  public static void main(String[] a) throws Exception {
    int game = Integer.parseInt(a[0]);
    int frames = game == 1 ? 330 : 300;
    int[][] ins = game == 1 ? IN_G1 : IN_G2;

    Class<?> M = Class.forName("tjge.GameMIDlet");
    Constructor<?> ct = M.getDeclaredConstructor(); ct.setAccessible(true);
    Object midlet = ct.newInstance();
    ((Random) f(M, "c").get(null)).setSeed(game == 1 ? 12345L : 54321L);
    m(M, "startApp").invoke(midlet);

    Canvas c = (Canvas) HeadlessBridge.current;
    Class<?> CC = c.getClass();
    Method paint = m(CC, "paint", Graphics.class);
    Method keyP = m(CC, "keyPressed", int.class);
    Method keyR = m(CC, "keyReleased", int.class);

    // 驱动到 gameplay
    for (int frame = 0; frame < frames; frame++) {
      for (int[] in : ins) if (in[0] == frame) { if (in[2] == 1) keyP.invoke(c, in[1]); else keyR.invoke(c, in[1]); }
      paint.invoke(c, new Graphics());
    }

    System.out.println("=== [AUDIT game" + game + "] 危险区 API 的实际取值 ===");
    System.out.println("-- Canvas.getWidth/getHeight (game1 用于布局) --");
    System.out.println("   getWidth()=" + c.getWidth() + " getHeight()=" + c.getHeight());

    System.out.println("-- Image.createImage 解码出的真实尺寸（0x0 = ImageIO 解不了 = shim 说谎） --");
    System.out.println("   Image 实例总数 = " + Image.instances.size());
    int zero = 0, ok = 0;
    Map<String, Integer> dims = new LinkedHashMap<>();
    for (Image im : Image.instances) {
      if (im.w == 0 || im.h == 0) zero++; else ok++;
      String k = im.w + "x" + im.h + (im.mutable ? "(mut)" : "(png)");
      dims.merge(k, 1, Integer::sum);
    }
    System.out.println("   尺寸非零 = " + ok + " ; 尺寸为 0 = " + zero + "   <<< 0 个为零才算 shim 忠实");
    System.out.println("   尺寸分布 = " + dims);

    System.out.println("-- Font 度量（shim 编造值） --");
    Font ft = Font.getDefaultFont();
    System.out.println("   getHeight()=" + ft.getHeight() + " stringWidth(\"ABC\")=" + ft.stringWidth("ABC")
        + " substringWidth(\"ABCDE\",1,3)=" + ft.substringWidth("ABCDE", 1, 3) + "   <<< 真机字模未知，此为编造");

    // RMS 存档：已核实会驱动绘制（game1 Q[0..2] / game2 k[2],k[3]），两侧初值必须一致
    System.out.println("-- RMS 存档字节（驱动绘制，须与 port 侧初值一致） --");
    Object save = (game == 1) ? f(Class.forName("tjge.a"), "Q").get(null)
                              : f(M, "k").get(null);
    if (save == null) {
      System.out.println("   存档数组 = NULL");
    } else {
      int len = java.lang.reflect.Array.getLength(save);
      StringBuilder sb = new StringBuilder();
      for (int i = 0; i < len; i++) sb.append(java.lang.reflect.Array.get(save, i)).append(i < len - 1 ? "," : "");
      System.out.println("   " + (game == 1 ? "tjge.a.Q" : "GameMIDlet.k") + " = [" + sb + "] (len=" + len + ")");
    }

    System.exit(0);
  }
}
