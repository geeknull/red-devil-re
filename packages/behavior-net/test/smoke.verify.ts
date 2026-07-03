import { Asserter } from "../src/assert.ts";
const a = new Asserter();
a.eq("断言辅助自检", 1 + 1, 2);
a.done("smoke");
