import { Asserter } from "../src/assert.ts";
import { installClock } from "../src/fake-clock.ts";

const a = new Asserter();
const original = Date.now;

const clock = installClock(1000);
a.eq("安装后 Date.now 冻结在 startMs", Date.now(), 1000);
a.eq("controller.now 一致", clock.now(), 1000);
clock.advance(80);
a.eq("advance 推进 Date.now", Date.now(), 1080);
a.eq("同一时刻多次调用相等", Date.now(), Date.now());
clock.uninstall();
a.ok("卸载后还原原始 Date.now", Date.now !== (() => 1080) && Date.now === original);

a.done("fake-clock");
