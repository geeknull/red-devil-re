package harness;

import java.lang.reflect.*;
import javax.microedition.lcdui.*;

/** 诊断：paint 的 try/catch 会吞异常，这里绕过它，直接看资源是否真加载 + paint 到底抛了什么。 */
public class Diag {
  static Field f(Class<?> c, String n) {
    while (c != null) {
      try { Field x = c.getDeclaredField(n); x.setAccessible(true); return x; }
      catch (Exception e) { c = c.getSuperclass(); }
    }
    return null;
  }
  static Method m(Class<?> c, String n, Class<?>... p) {
    while (c != null) {
      try { Method x = c.getDeclaredMethod(n, p); x.setAccessible(true); return x; }
      catch (Exception e) { c = c.getSuperclass(); }
    }
    return null;
  }

  public static void main(String[] a) throws Exception {
    Class<?> M = Class.forName("tjge.GameMIDlet");
    Constructor<?> ct = M.getDeclaredConstructor(); ct.setAccessible(true);
    Object midlet = ct.newInstance();
    ((java.util.Random) f(M, "c").get(null)).setSeed(12345L);
    m(M, "startApp").invoke(midlet);

    Canvas c = (Canvas) HeadlessBridge.current;
    Class<?> CC = c.getClass();
    System.out.println("[D] canvas class = " + CC.getName());

    // 1. 所有 Image / Image[] 字段是否 null、尺寸如何
    System.out.println("[D] --- Image 字段 ---");
    for (Field fl : CC.getDeclaredFields()) {
      fl.setAccessible(true);
      Object v = fl.get(c);
      Class<?> t = fl.getType();
      if (t == Image.class) {
        Image im = (Image) v;
        System.out.println("[D]   " + fl.getName() + " : Image = "
            + (im == null ? "NULL" : ("id=" + im.id + " " + im.w + "x" + im.h + " raw=" + (im.raw == null ? "null" : im.raw.length))));
      } else if (t.isArray() && t.getComponentType() == Image.class) {
        Object[] arr = (Object[]) v;
        if (arr == null) { System.out.println("[D]   " + fl.getName() + " : Image[] = NULL"); continue; }
        StringBuilder sb = new StringBuilder();
        int nulls = 0;
        for (Object o : arr) { if (o == null) nulls++; }
        sb.append("len=").append(arr.length).append(" nulls=").append(nulls);
        for (int i = 0; i < Math.min(arr.length, 6); i++) {
          Image im = (Image) arr[i];
          sb.append(" [").append(i).append("]=").append(im == null ? "NULL" : (im.w + "x" + im.h));
        }
        System.out.println("[D]   " + fl.getName() + " : Image[] " + sb);
      }
    }

    // 2. 绕过游戏内 try/catch：直接调 paint 并把真实异常打出来
    System.out.println("[D] --- 直接调 paint，捕获真实异常 ---");
    Method paint = m(CC, "paint", Graphics.class);
    Field pf = f(CC, "p");
    System.out.println("[D] state p=" + pf.get(c));
    for (int i = 0; i < 3; i++) {
      Graphics g = new Graphics();
      try {
        paint.invoke(c, g);
        System.out.println("[D] paint#" + i + " ok, ops=" + g.ops.size() + " p=" + pf.get(c));
      } catch (InvocationTargetException e) {
        System.out.println("[D] paint#" + i + " THREW: " + e.getCause());
      }
    }

    // 3. 菜单确定键：直接调 a(16,false) 看状态变不变
    System.out.println("[D] --- 菜单确定 a(16,false) ---");
    Method act = m(CC, "a", int.class, boolean.class);
    System.out.println("[D] a(int,boolean) found = " + (act != null));
    if (act != null) {
      System.out.println("[D] before p=" + pf.get(c));
      try { act.invoke(c, 16, false); } catch (InvocationTargetException e) { System.out.println("[D] a() THREW: " + e.getCause()); }
      System.out.println("[D] after  p=" + pf.get(c));
    }
    System.exit(0);
  }
}
