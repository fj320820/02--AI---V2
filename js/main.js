// 墨香国学AI Demo V1.0 升级版统一脚本
(function () {
  const defaultGrowth = { wisdom: 0, calligraphy: 0, thinking: 0 };
  const growthKey = "moxiangGrowthV1";

  // 站内允许的页面，用于拦截非法协议跳转
  const internalPages = new Set([
    "index.html",
    "article.html",
    "teacher.html",
    "copybook.html",
    "thinking.html",
    "chat.html"
  ]);

  // 把任意可能被客户端改写的链接（如 solo-remote-file://...）规范化为相对路径
  function normalizeHref(rawHref) {
    if (!rawHref) return "";
    let href = String(rawHref).trim();
    // 剥离常见的非标准协议前缀
    href = href.replace(/^solo-remote-file:\/+/i, "");
    href = href.replace(/^computer:\/+/i, "");
    href = href.replace(/^file:\/+/i, "");
    // 取出最后的文件名 + 锚点
    const lastSlash = href.lastIndexOf("/");
    if (lastSlash !== -1 && /\.html(\b|#|$)/i.test(href)) {
      href = href.slice(lastSlash + 1);
    }
    return href;
  }

  // 全局拦截：所有 a 标签和带 data-go 的按钮统一走 window.location 跳转
  function setupSafeNavigation() {
    document.addEventListener(
      "click",
      function (event) {
        const target = event.target.closest("a[href], [data-go]");
        if (!target) return;
        // 普通锚点（同页内 #xx）保持原生行为
        const raw = target.getAttribute("href") || target.getAttribute("data-go") || "";
        if (!raw || raw.startsWith("#")) return;

        // 外链保持原生行为
        if (/^(https?:|mailto:|tel:)/i.test(raw)) return;

        const href = normalizeHref(raw);
        if (!href) return;

        // 仅处理站内 .html 页面（含 # 锚点）
        const fileOnly = href.split("#")[0].split("?")[0];
        if (!internalPages.has(fileOnly)) return;

        event.preventDefault();
        window.location.assign(href);
      },
      true
    );
  }

  function readGrowth() {
    try {
      return { ...defaultGrowth, ...JSON.parse(localStorage.getItem(growthKey)) };
    } catch (error) {
      return { ...defaultGrowth };
    }
  }

  function saveGrowth(data) {
    localStorage.setItem(growthKey, JSON.stringify(data));
    // 同窗口内的页面（同时打开 article/copybook/index 等）实时同步
    try {
      window.dispatchEvent(new CustomEvent("moxiang:growth", { detail: data }));
    } catch (e) { /* ignore */ }
  }

  // 跨标签：监听 storage 事件，自动重渲染
  window.addEventListener("storage", function (event) {
    if (event && event.key && event.key !== growthKey) return;
    renderGrowth();
  });
  // 同标签：成长值变化时也重渲染（多模块协同）
  window.addEventListener("moxiang:growth", function () {
    renderGrowth();
  });

  // 注入"+N 飘字"动画样式（一次注入，所有页面通用）
  function injectGrowthFlyStyle() {
    if (document.getElementById("moxiang-growth-fly-style")) return;
    const style = document.createElement("style");
    style.id = "moxiang-growth-fly-style";
    style.textContent =
      ".growth-fly{position:fixed;z-index:9999;pointer-events:none;" +
      "padding:8px 14px;border-radius:999px;font-weight:700;font-size:.95rem;" +
      "letter-spacing:.04em;color:#fff8e6;" +
      "background:linear-gradient(135deg,#8f1d24,#5a0f15);" +
      "box-shadow:0 10px 30px rgba(143,29,36,.45),inset 0 0 0 1px rgba(255,255,255,.18);" +
      "transform:translate(-50%,0);opacity:0;animation:growthFly 1.4s ease forwards;}" +
      ".growth-fly.wisdom{background:linear-gradient(135deg,#caa45a,#7a5018);}" +
      ".growth-fly.calligraphy{background:linear-gradient(135deg,#8f1d24,#5a0f15);}" +
      ".growth-fly.thinking{background:linear-gradient(135deg,#1f6a5e,#0e3b34);}" +
      "@keyframes growthFly{" +
      "0%{opacity:0;transform:translate(-50%,10px) scale(.85);}" +
      "20%{opacity:1;transform:translate(-50%,-6px) scale(1);}" +
      "75%{opacity:1;transform:translate(-50%,-46px) scale(1);}" +
      "100%{opacity:0;transform:translate(-50%,-72px) scale(.95);}}";
    document.head.appendChild(style);
  }

  // 浮动 +N 动画（可指定锚点元素，默认屏幕右上）
  window.flyGrowth = function (type, value, anchorEl, label) {
    injectGrowthFlyStyle();
    const text = (value > 0 ? "+" : "") + value + " " + (label || (
      type === "wisdom" ? "智慧值" :
      type === "calligraphy" ? "书法值" :
      type === "thinking" ? "思辨值" : "成长值"
    ));
    const el = document.createElement("div");
    el.className = "growth-fly " + (type || "");
    el.textContent = text;
    let x, y;
    if (anchorEl && anchorEl.getBoundingClientRect) {
      const rect = anchorEl.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top;
    } else {
      // 默认浮在成长面板某项的位置（如有），否则右上
      const target = document.querySelector("[data-growth='" + type + "']");
      if (target) {
        const rect = target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top;
      } else {
        x = window.innerWidth - 80;
        y = 80;
      }
    }
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1500);
  };

  function getRank(total) {
    if (total >= 90) return "卧龙出山";
    if (total >= 60) return "博学少年";
    if (total >= 30) return "草庐进学";
    return "初入草庐";
  }

  function renderGrowth(changedType) {
    const data = readGrowth();
    const total = data.wisdom + data.calligraphy + data.thinking;
    document.querySelectorAll("[data-growth='wisdom']").forEach((el) => (el.textContent = data.wisdom));
    document.querySelectorAll("[data-growth='calligraphy']").forEach((el) => (el.textContent = data.calligraphy));
    document.querySelectorAll("[data-growth='thinking']").forEach((el) => (el.textContent = data.thinking));
    document.querySelectorAll("[data-growth-rank]").forEach((el) => (el.textContent = getRank(total)));
    Object.keys(defaultGrowth).forEach((key) => {
      document.querySelectorAll(`[data-growth-bar='${key}']`).forEach((el) => {
        el.style.width = `${Math.min(100, data[key])}%`;
      });
    });
    if (changedType) {
      document.querySelectorAll(`[data-growth='${changedType}']`).forEach((el) => {
        const item = el.closest(".growth-item");
        if (!item) return;
        item.classList.remove("bump");
        void item.offsetWidth;
        item.classList.add("bump");
      });
    }
  }

  window.addGrowth = function (type, value, message, anchorEl) {
    const data = readGrowth();
    data[type] = Math.max(0, (data[type] || 0) + value);
    saveGrowth(data);
    renderGrowth(type);
    // 浮动 +N 动画
    try { window.flyGrowth(type, value, anchorEl); } catch (e) { /* ignore */ }
    showToast(message || "成长值已更新");
  };

  window.resetGrowth = function () {
    saveGrowth({ ...defaultGrowth });
    renderGrowth();
    showToast("成长系统已重置");
  };

  function showToast(text) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function markActiveNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === current) link.classList.add("active");
    });
  }

  function addMessage(container, text, type) {
    const message = document.createElement("div");
    message.className = `message ${type}`;
    message.textContent = text;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    return message;
  }

  function addTyping(container, name) {
    return addMessage(container, `${name}正在思考……`, "ai typing");
  }

  const teacherAnswers = {
    "为什么诸葛亮要北伐？":
      "可以这样理解：北伐是诸葛亮完成刘备遗愿的一种方式，也是蜀汉主动争取生存空间的选择。蜀汉国力不如魏国，如果一直被动防守，局面可能越来越难。诸葛亮明知困难，仍然坚持，是因为他把“责任”看得比个人安稳更重要。",
    "“亲贤臣，远小人”是什么意思？":
      "这句话的意思是：要亲近有能力、有品德、敢说真话的人，远离只会讨好、没有原则的人。放到今天也很好理解：学习和生活中，我们也要多听真诚有益的建议，而不是只听让自己舒服的话。",
    "《出师表》表达了诸葛亮怎样的情感？":
      "它主要表达了三种情感：第一，是对刘备知遇之恩的感激；第二，是对后主刘禅的担忧和叮嘱；第三，是自己即将北伐时的责任感。文章感人，是因为这些话不是表演，而像是一位老臣临行前认真交代心事。",
    "为什么说《出师表》忠诚感人？":
      "因为诸葛亮在文中一直把国家、承诺和责任放在前面。他没有夸耀自己，而是反复提醒后主要任用贤臣、治理好国家。一个人愿意在艰难时刻承担重任，并且坚持很多年，这就是《出师表》打动人的地方。"
  };

  // AI老师自由追问：按关键词匹配回答
  const teacherTopics = [
    {
      keys: ["北伐", "为什么北伐", "出征", "打仗", "战争"],
      answer: "北伐这件事，要从蜀汉的处境说起。魏国地大兵多，蜀汉如果一直守着，只会越来越弱。诸葛亮选择主动出击，不是因为他觉得能赢，而是因为他知道：一直被动挨打，最后连打的机会都没有。这是一种「明知不可为而为之」的选择。"
    },
    {
      keys: ["优点", "长处", "厉害", "伟大", "了不起", "佩服", "崇拜"],
      answer: "诸葛亮的优点，不是聪明，而是「认真」。他对每一件小事都认真：写表文认真、用人认真、甚至批评自己也认真。这种认真，让他在乱世中赢得了很多人的信任。"
    },
    {
      keys: ["成就", "功绩", "成绩", "功业", "业绩", "贡献", "建树"],
      answer: "诸葛亮的成就，可以从几个方面来看：政治上，他治理蜀地井井有条，让百姓安居乐业；军事上，他发明了木牛流马、八阵图，多次北伐牵制魏国；文学上，《出师表》成为千古名篇。但他说过一句话：「鞠躬尽瘁，死而后已」——他最看重的不是这些成就，而是「答应了先帝的事，做到了没有」。"
    },
    {
      keys: ["缺点", "短处", "错误", "失误", "过错", "失败"],
      answer: "诸葛亮最大的失误，可能是太相信自己。马谡守街亭那次，很多人劝他换人，但他坚持用马谡，结果街亭丢了，第一次北伐失败。这件事告诉我们：再厉害的人，也需要听别人的意见。"
    },
    {
      keys: ["亲贤臣", "远小人", "贤臣", "小人", "亲近", "远离"],
      answer: "「亲贤臣，远小人」是诸葛亮对后主刘禅的叮嘱。意思是：要亲近有才能、有品德的人，远离只会讨好、没有原则的人。放到今天，就是告诉我们：交朋友、选伙伴，要看对方是不是真心对你好，而不是只会说让你开心的话。"
    },
    {
      keys: ["情感", "感情", "心情", "感受", "表达", "表达了什么"],
      answer: "《出师表》的情感很复杂：有对刘备的感激，有对刘禅的担忧，也有对北伐的责任感。最打动人的是，诸葛亮没有把话说得很漂亮，而是像一位老父亲在交代家事——真诚、朴实、没有表演。"
    },
    {
      keys: ["忠诚", "忠心", "感人", "感动", "为什么感人"],
      answer: "《出师表》之所以感人，是因为诸葛亮把「国家」和「责任」放在「自己」前面。他没有夸耀自己的功劳，而是反复提醒后主要怎么做。一个人愿意在艰难时刻承担重任，并且坚持很多年，这就是最打动人的地方。"
    },
    {
      keys: ["出师表", "文章", "写了什么", "内容", "名句", "主要表达", "观点"],
      answer: "《出师表》主要表达了三层意思：第一，分析当前形势，提醒后主要警惕；第二，推荐贤臣，告诉后主谁可以信任；第三，表达自己北伐的决心和对先帝的忠诚。全文没有一句空话，每一句都是诸葛亮的心里话。"
    },
    {
      keys: ["人物", "评价", "怎么看", "如何评价", "印象"],
      answer: "诸葛亮是一个复杂的人。他不是神，也会犯错；他也不是完美的人，也会累、会怕。但他有一个特点：答应了的事，就一定会做到。这种「说到做到」的品质，让他在乱世中成为了一个值得信任的人。"
    },
    {
      keys: ["刘备", "先帝", "三顾", "草庐", "知遇"],
      answer: "刘备对诸葛亮有知遇之恩。三顾茅庐不是简单的「请」，而是刘备放下身段，真心诚意地邀请一个年轻人。诸葛亮后来一直忠于蜀汉，很大程度上是因为这份「被认真对待」的感动。"
    },
    {
      keys: ["刘禅", "后主", "阿斗", "陛下"],
      answer: "刘禅是一个被误解很深的人。他确实不是雄才大略的君主，但也不是完全无能。诸葛亮在《出师表》中对他既担忧又期待，像一位老师对学生——希望他能成长，但又怕他走错路。"
    },
    {
      keys: ["责任", "担当", "承担", "答应", "承诺"],
      answer: "责任是《出师表》的核心主题之一。诸葛亮说「受命以来，夙夜忧叹」，意思是：从答应先帝那天起，他就没睡过安稳觉。责任不是负担，而是一种「答应了就要做到」的自觉。"
    },
    {
      keys: ["困难", "挫折", "难", "卡住", "瓶颈"],
      answer: "诸葛亮面对困难的态度是：不逃避，但也不硬拼。他知道北伐很难，但还是选择去做；他知道可能会失败，但还是坚持到底。这种「明知山有虎，偏向虎山行」的勇气，不是鲁莽，而是责任。"
    },
    {
      keys: ["结局", "死亡", "去世", "死", "五丈原", "最后", "结局如何", "下场", "结果"],
      answer: "公元234年，诸葛亮在第五次北伐途中，因积劳成疾，病逝于五丈原，享年五十四岁。临终前，他安排好了退兵计划，推荐了蒋琬、费祎接班。他这一生，从隆中出山到五丈原，二十七年没有停过。后人用四个字概括他的一生：「鞠躬尽瘁，死而后已」。"
    },
    {
      keys: ["司马懿", "司马", "对手", "敌人", " rivalry", "宿敌"],
      answer: "司马懿是诸葛亮最大的对手。两人多次交手，司马懿深知诸葛亮用兵谨慎，所以选择「拖」的策略——不主动进攻，等蜀军粮尽自退。诸葛亮曾派人送女装给司马懿，想激怒他出战，但司马懿不为所动。司马懿对诸葛亮的评价很高，说他「一生唯谨慎」。"
    },
    {
      keys: ["马谡", "街亭", "失街亭", "用人"],
      answer: "马谡是诸葛亮很看好的年轻将领。第一次北伐时，诸葛亮派马谡守街亭，但马谡不听劝告，把军队驻扎在山上，结果被魏军切断了水源，大败而归。街亭失守后，诸葛亮不得不退兵，第一次北伐失败。诸葛亮依法处斩了马谡，但也自责用人不当，上书自贬三级。"
    },
    {
      keys: ["木牛流马", "发明", "创造", "八阵图", "孔明灯", "连弩"],
      answer: "诸葛亮不仅是政治家和军事家，还是一位发明家。他发明了木牛流马（运输粮草的工具）、诸葛连弩（可以连发多箭的武器）、八阵图（训练士兵的阵法），传说中还改进了孔明灯。这些发明都是为了解决实际军事问题，说明他是一个善于动脑筋、注重实效的人。"
    },
    {
      keys: ["隆中", "三顾茅庐", "出山", "隐居", "草庐", "卧龙"],
      answer: "诸葛亮年轻时隐居在隆中（今湖北襄阳），一边耕种一边读书。他自号「卧龙」，意思是潜伏的龙，等待时机。刘备三次到草庐拜访他，前两次都没见到，第三次终于见面。诸葛亮被刘备的诚意打动，答应出山辅佐他。这就是著名的「三顾茅庐」。"
    },
    {
      keys: ["白帝城", "托孤", "临终", "遗言", "先帝托付"],
      answer: "公元223年，刘备在白帝城病重，把诸葛亮叫到床前，对他说：「君才十倍曹丕，必能安国，终定大事。若嗣子可辅，辅之；如其不才，君可自取。」意思是：你的才能远超曹丕，一定能安定国家。如果刘禅能辅佐就辅佐，如果不行，你可以取而代之。诸葛亮流着泪答应了，此后一生都在践行这个承诺。"
    },
    {
      keys: ["空城计", "计谋", "策略", "智谋", "妙计"],
      answer: "空城计是《三国演义》中诸葛亮最著名的故事之一。当时司马懿大军压境，诸葛亮城中兵力空虚，他反而大开城门，自己在城楼上弹琴。司马懿怀疑有伏兵，不敢进攻，率军撤退。不过这个故事更多是小说的演绎，历史上是否真的发生过，还有争议。但它很好地体现了诸葛亮「以智取胜」的形象。"
    },
    {
      keys: ["妻子", "黄月英", "家庭", "婚姻", "老婆"],
      answer: "诸葛亮的妻子是黄月英，据说相貌平平但才华出众。传说她发明了木狗、木虎等机关，还帮助诸葛亮解决了很多技术难题。诸葛亮选择妻子看重的是才华而非外貌，这也反映了他「重才轻貌」的价值观。"
    },
    {
      keys: ["七擒孟获", "孟获", "南征", "南方", "平定"],
      answer: "诸葛亮在北伐之前，先率军南征，平定了南中地区（今云南、贵州一带）的叛乱。首领孟获被诸葛亮七次擒获又七次释放，最终心服口服，发誓不再反叛。这就是「七擒孟获」的故事，体现了诸葛亮「攻心为上」的治理智慧。"
    },
    {
      keys: ["周瑜", "赤壁", "借东风", "火烧", "联盟"],
      answer: "赤壁之战是三国时期最重要的战役之一。诸葛亮协助刘备与孙权结盟，共同对抗曹操。传说中诸葛亮「借东风」「草船借箭」的故事就出自这一时期。不过这些故事更多来自《三国演义》的文学加工，真实历史中诸葛亮在赤壁之战中主要发挥了外交使者的作用。"
    },
    {
      keys: ["性格", "脾气", "为人", "品格", "品质", "性格特点"],
      answer: "诸葛亮的性格可以用几个词概括：谨慎、认真、执着、谦逊。他做事从不冒险，每次用兵都反复计算；他对人对事都很认真，连小事也不马虎；他一旦答应的事就绝不放弃；他从不夸耀自己，反而经常反省自己的不足。"
    },
    {
      keys: ["学习", "读书", "方法", "智慧", "聪明"],
      answer: "诸葛亮年轻时非常勤奋好学。他读书不追求死记硬背，而是「观其大略」——抓住重点，理解精髓。他喜欢和朋友们讨论天下大事，把学到的知识和实际情况结合起来思考。这种学习方法值得我们借鉴：读书要理解，不要死背；学了要用，不要只学不想。"
    },
    {
      keys: ["名言", "语录", "经典", "名句", "金句", "句子"],
      answer: "《出师表》中有很多经典名句：「受任于败军之际，奉命于危难之间」——在军队战败时受命，在危难时刻承担使命；「亲贤臣，远小人，此先汉所以兴隆也」——亲近贤臣、远离小人，这是前汉兴盛的原因；「鞠躬尽瘁，死而后已」——竭尽全力，直到死去才停止。每一句背后都有深刻的人生道理。"
    },
    {
      keys: ["写作", "写法", "手法", "修辞", "文体", "怎么写"],
      answer: "《出师表》是一篇「表文」，是臣子写给君主的奏章。它的写作特点：第一，以情动人，不是空洞说教，而是用真心话打动人；第二，条理清晰，先分析形势，再推荐人才，最后表达决心；第三，语言简洁有力，没有华丽的辞藻，但每一句都有分量。好的文章不需要花哨的语言，真诚和逻辑才是最重要的。"
    },
    {
      keys: ["时代", "背景", "历史", "年代", "时期", "什么时候"],
      answer: "《出师表》写于公元227年，当时三国鼎立的局面已经形成。蜀汉国力最弱，魏国最强，东吴居中。刘备刚去世不久，后主刘禅年幼，蜀汉内部人心不稳。诸葛亮在这种情况下决定北伐，一方面是为了完成刘备的遗愿，另一方面也是为了以攻代守，争取主动权。"
    },
    {
      keys: ["今天", "现实", "现代", "意义", "启发", "启示", "有什么用"],
      answer: "《出师表》对今天的我们有很多启发：第一，责任意识——答应了的事要做到；第二，用人之道——亲近有能力的人，远离只会讨好的人；第三，面对困难的态度——明知艰难也要坚持；第四，真诚的力量——真正打动人的不是技巧，而是真心。这些道理放在今天的学习、工作和生活中，同样适用。"
    },
    {
      keys: ["鞠躬尽瘁", "死而后已", "夙夜忧叹", "受任于败军"],
      answer: "这些是《出师表》中最经典的句子。「鞠躬尽瘁，死而后已」意思是：竭尽全力工作，直到死去才停止；「受任于败军之际，奉命于危难之间」意思是：在军队战败时受命，在危难时刻承担使命。这些话之所以打动人，是因为它们不是漂亮的口号，而是诸葛亮一生的真实写照。"
    }
  ];

  function pickTeacherAnswer(question) {
    const q = String(question || "").trim();
    if (teacherAnswers[q]) return teacherAnswers[q];
    // 关键词匹配（越长越优先，且优先匹配更具体的主题）
    let bestMatch = null;
    let bestScore = 0;
    for (let i = 0; i < teacherTopics.length; i++) {
      const topic = teacherTopics[i];
      for (let j = 0; j < topic.keys.length; j++) {
        const key = topic.keys[j];
        if (q.indexOf(key) !== -1) {
          // 计算匹配分数：关键词长度 + 在问题中的位置（越靠前分数越高）
          const position = q.indexOf(key);
          const score = key.length * 10 + (100 - position);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = topic;
          }
        }
      }
    }
    if (bestMatch) return bestMatch.answer;
    // 如果问题中包含"诸葛亮/孔明/丞相"但没有匹配到具体主题，给一个通用人物介绍
    if (q.indexOf("诸葛亮") !== -1 || q.indexOf("孔明") !== -1 || q.indexOf("丞相") !== -1) {
      return "诸葛亮，字孔明，号卧龙。他是三国时期蜀汉的丞相，也是《出师表》的作者。他最让人敬佩的品质不是聪明，而是「鞠躬尽瘁，死而后已」——答应了刘备的事，用一生去完成。你想了解他哪方面的故事？比如他的成就、他的失误、他写的《出师表》？";
    }
    // 兜底回复
    return "这个问题问得很好。你可以试着从「字面意思、历史背景、人物情感」三个角度去理解：先找出关键词，再想想诸葛亮为什么要这样说，最后联系自己的学习和生活。如果你还有具体的疑问，欢迎继续追问。";
  }

  // ====== 诸葛亮 · 历史决策对话剧场 V2.1 ======
  // 规则：
  // ① 三段式结构：【判断】直接结论 → 【应对】行动策略 → 【留问】反问用户
  // ② 不解释概念、不写作文、不总结道理
  // ③ 只做决策与回应，形成对话压迫感
  const kongmingPersona = {
    "若魏延不服军令但仍能战，你杀还是留？": {
      mood: "按剑而坐",
      judge: "留。但削兵权，调离中军。",
      act: "魏延骁勇，杀他等于自断一臂。但不服军令的人留在中军，军心必乱。我让他去前锋，既能用其勇，又能离其势。若再违令——斩。",
      ask: "若你是魏延，被削权调离，你会反吗？"
    },
    "若杨仪掌后勤却不愿配合前线，你如何处理？": {
      mood: "放下笔",
      judge: "不换人。但分权。",
      act: "杨仪善算，后勤离了他会乱。但他不配合前线，我便把粮草的「调度权」和「发放权」拆开。他管账，前线派专人领粮。互相牵制，各尽其职。",
      ask: "若你是杨仪，被分权制衡，你会配合还是阳奉阴违？"
    },
    "若北伐失败在即，是否继续推进？": {
      mood: "舆图前沉吟",
      judge: "撤。但分批次，留断后。",
      act: "败局已定，硬推进是送死。但全军撤退会被追击，我留一支死士断后，主力分批撤回。败了不可怕，可怕的是败得没有章法。",
      ask: "若你是那支断后部队，明知是死路，你会服从吗？"
    },
    "若陛下召你回朝夺兵权，你奉诏还是抗命？": {
      mood: "灯下独坐",
      judge: "奉诏。但带亲兵回。",
      act: "抗命等于造反，蜀汉内乱，魏吴必趁虚而入。我奉诏回朝，但带三千亲兵随行。不是威胁，是自保。若陛下真要杀我，我死；若只是试探，我活。",
      ask: "若你是陛下，看到丞相带亲兵回朝，你会怎么想？"
    },
    "若司马懿送女装羞辱逼你出战，你接不接？": {
      mood: "抚须沉思",
      judge: "接。穿上。然后继续屯田。",
      act: "不接，将士会觉得我受辱必战，反而军心浮躁。接了，司马懿以为我怯，他便松懈。我在营前屯田，摆出长期对峙的架势。他拖，我也拖。谁先急，谁先输。",
      ask: "若你是帐前将士，看到丞相穿女装，你会失望还是更敬他？"
    },
    "若先帝托孤时说「可自取」，你当真还是当谦？": {
      mood: "目光悠远",
      judge: "当谦。但把「谦」做到底。",
      act: "先帝那句话是试探，也是真心。我若当真，蜀汉必乱；我若当谦，先帝不放心。所以我当场涕泣，发誓「效死不渝」——不是表演，是让先帝知道：我接的不是江山，是责任。",
      ask: "若你是先帝，听到丞相发誓效死，你会信他几分？"
    }
  };

  // 自由追问主题：按关键词匹配，三段式结构
  const kongmingTopics = [
    {
      keys: ["粮草", "粮食", "补给", "后勤", "运输", "粮道"],
      mood: "舆图前沉吟",
      judge: "就地取粮，限三日为期。",
      act: "蜀道运粮难，等后方等于等死。我分兵屯田，同时派小股部队袭扰魏军粮道。三日取不到粮，便撤。不撤，全军覆没。",
      ask: "若你是运粮官，蜀道被断，你会冒险翻山还是绕道百里？"
    },
    {
      keys: ["将领", "魏延", "杨仪", "不服", "调度", "军令", "违令", "叛乱"],
      mood: "按剑而坐",
      judge: "削权调离，再违即斩。",
      act: "魏延能战，杀之可惜；杨仪善算，弃之可惜。但军中只能有一个声音。我把魏延调前锋，杨仪管后方，两人不见面。这是最后一次机会。",
      ask: "若你是魏延，被削权后你会忍还是反？"
    },
    {
      keys: ["受阻", "攻城", "陈仓", "郝昭", "推进", "撤退", "退兵"],
      mood: "凭栏远望",
      judge: "再攻三日，不下则撤。",
      act: "攻城是消耗战，蜀汉耗不起。但直接撤，前功尽弃，军心也散。我再攻三日，是给将士一个交代——不是我不打，是打不下来。撤的时候，留一支死士断后。",
      ask: "若你是断后部队的将领，明知必死，你会接令吗？"
    },
    {
      keys: ["后主", "刘禅", "陛下", "谗言", "小人", "李严", "回朝", "猜忌"],
      mood: "灯下独坐",
      judge: "奉诏回朝，带亲兵随行。",
      act: "抗命是造反，蜀汉内乱，魏吴必来。我奉诏，但带三千亲兵。不是威胁陛下，是防小人。若陛下真要杀我，我死；若只是试探，我活。",
      ask: "若你是陛下，丞相带亲兵回朝，你是信他还是要防他？"
    },
    {
      keys: ["司马懿", "司马", "坚守", "不出", "破敌", "女装", "羞辱", "对峙"],
      mood: "抚须沉思",
      judge: "穿上，然后继续屯田。",
      act: "不接，将士会觉得我受辱必战，军心浮躁。接了，司马懿以为我怯，他便松懈。我在营前屯田，摆出长期对峙的架势。他拖，我也拖。谁先急，谁先输。",
      ask: "若你是帐前将士，看到丞相穿女装，你会失望还是更敬他？"
    },
    {
      keys: ["先帝", "刘备", "托孤", "拒绝", "白帝城", "答应", "承诺"],
      mood: "目光悠远",
      judge: "当场涕泣，发誓效死。",
      act: "先帝那句话是试探，也是真心。我若当真，蜀汉必乱；我若当谦，先帝不放心。所以我当场发誓——不是表演，是让先帝知道：我接的不是江山，是责任。",
      ask: "若你是先帝，听到丞相发誓效死，你会信他几分？"
    },
    {
      keys: ["北伐", "出征", "祁山", "五丈原", "胜算", "成败", "值不值"],
      mood: "夜半独坐",
      judge: "继续。但准备退路。",
      act: "胜算几何，我比谁都清楚。但不打，蜀汉是慢慢等死；打，是带着伤往前走。我不求必胜，只求在倒下之前，多替先帝走几步。",
      ask: "若你是后主，丞相屡战屡败，你会让他继续还是召回？"
    },
    {
      keys: ["马谡", "街亭", "失误", "用人", "错用", "自贬"],
      mood: "沉默片刻",
      judge: "斩马谡，上书自贬三级。",
      act: "马谡是我推荐的，他失街亭，是我的错。斩他，是给军法一个交代；自贬，是给自己一个交代。但自贬之后，兵权仍在——因为没人能接。",
      ask: "若你是马谡，被斩前你会怨丞相还是认命？"
    },
    {
      keys: ["木牛流马", "发明", "八阵图", "连弩", "孔明灯", "创造"],
      mood: "案前抚卷",
      judge: "造。但只为实战。",
      act: "木牛流马运粮，八阵图练兵，连弩杀敌。不是为了炫耀，是为了解决实际问题。蜀道难，粮运不上，我就造工具；兵少，我就让每一支箭都更值钱。",
      ask: "若你是工匠，丞相让你造一种从未见过的兵器，你敢接吗？"
    },
    {
      keys: ["隆中", "三顾", "草庐", "出山", "隐居", "卧龙"],
      mood: "执笔停顿",
      judge: "出山。但不带家眷。",
      act: "先帝三顾，是诚意。但我出山时没带家眷——不是绝情，是给自己留一条退路。若刘备不是明主，我便回隆中。后来我没回去，不是因为不能，是因为不想。",
      ask: "若你是诸葛亮，第三次见到刘备，你会当场答应还是再试探？"
    },
    {
      keys: ["空城计", "计谋", "智谋", "策略", "妙计", "险招"],
      mood: "苦笑摇头",
      judge: "险招。不到绝境不用。",
      act: "空城计是赌。赌司马懿多疑，赌他不敢进。赢了是运气，输了是命。我这一生，真正靠运气赢的，只有这一次。",
      ask: "若你是司马懿，看到城门大开，你会进还是退？"
    },
    {
      keys: ["死亡", "病死", "五丈原", "去世", "临终", "遗言", "后事"],
      mood: "拭剑不语",
      judge: "安排退兵，推荐接班人。",
      act: "我死后，魏延必反。所以我提前安排：杨仪掌军，姜维断后，魏延若反，就地诛杀。同时推荐蒋琬、费祎接班。蜀汉的命，比我的命重要。",
      ask: "若你是魏延，丞相死后你被排除在权力之外，你会反吗？"
    }
  ];

  // 全局兜底
  const kongmingFallback = {
    mood: "放下竹简，抬眼望你",
    judge: "这个问题，我没有现成答案。",
    act: "五十四年了，我仍有很多事想不明白。你问的这个问题，从前没人这样问过我。但我不愿敷衍你——有些答案，我自己也在找。",
    ask: "若你是我，面对一个想不明白的问题，你会硬答还是承认不知道？"
  };

  function pickKongmingReply(question) {
    const q = String(question || "").trim();
    if (kongmingPersona[q]) return kongmingPersona[q];
    // 先尝试精确匹配（关键词越长越优先）
    let bestMatch = null;
    let bestScore = 0;
    for (let i = 0; i < kongmingTopics.length; i++) {
      const topic = kongmingTopics[i];
      for (let j = 0; j < topic.keys.length; j++) {
        const key = topic.keys[j];
        if (q.indexOf(key) !== -1 && key.length > bestScore) {
          bestScore = key.length;
          bestMatch = topic;
        }
      }
    }
    if (bestMatch) return bestMatch;
    return kongmingFallback;
  }

  // 渲染决策对话回复（三段式：判断 / 应对 / 留问）
  function addKongmingReply(messages, persona) {
    const wrap = document.createElement("div");
    wrap.className = "message ai kongming-reply";
    let html = "";
    if (persona.mood) {
      html += '<div class="km-mood">[ ' + persona.mood + ' ]</div>';
    }
    if (persona.judge) {
      html += '<div class="km-section km-judge"><b>【判断】</b>' + persona.judge + '</div>';
    }
    if (persona.act) {
      html += '<div class="km-section km-act"><b>【应对】</b>' + persona.act + '</div>';
    }
    if (persona.ask) {
      html += '<div class="km-section km-ask"><b>【留问】</b>' + persona.ask + '</div>';
    }
    wrap.innerHTML = html;
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  }

  // 一次性注入诸葛亮决策对话样式 V2.1
  function injectKongmingStyle() {
    if (document.getElementById("moxiang-kongming-style")) return;
    const style = document.createElement("style");
    style.id = "moxiang-kongming-style";
    style.textContent =
      ".message.kongming-reply{display:block;max-width:92%;line-height:1.85;letter-spacing:.01em;}" +
      ".message.kongming-reply .km-mood{display:inline-block;margin-bottom:10px;padding:2px 10px;" +
      "border:1px solid rgba(216,181,108,.45);border-radius:999px;color:#caa45a;" +
      "font-size:.78rem;letter-spacing:.18em;background:rgba(0,0,0,.18);}" +
      ".message.kongming-reply .km-section{margin:0 0 10px;padding:10px 12px;border-radius:6px;}" +
      ".message.kongming-reply .km-judge{background:rgba(143,29,36,.12);border-left:3px solid #8f1d24;}" +
      ".message.kongming-reply .km-judge b{color:#d46a6a;}" +
      ".message.kongming-reply .km-act{background:rgba(216,181,108,.1);border-left:3px solid #d8b56c;}" +
      ".message.kongming-reply .km-act b{color:#d8b56c;}" +
      ".message.kongming-reply .km-ask{background:rgba(126,228,211,.08);border-left:3px solid #7ee4d3;border:1px dashed rgba(126,228,211,.3);}" +
      ".message.kongming-reply .km-ask b{color:#7ee4d3;}" +
      ".message.kongming-reply .km-section b{display:block;margin-bottom:4px;font-size:.8rem;letter-spacing:.12em;}" +
      ".ai-badge{position:absolute;bottom:4px;right:14px;font-size:.68rem;color:#7ee4d3;" +
      "letter-spacing:.08em;opacity:.6;pointer-events:none;}";
    document.head.appendChild(style);
  }

  // ====== AI API 调用（真实大模型） ======
  // 优先调用后端 AI API，失败时降级到本地关键词匹配
  var AI_API_ENABLED = true; // 设为 false 可强制使用本地匹配

  async function callAIApi(endpoint, question) {
    if (!AI_API_ENABLED) return null;
    try {
      var resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question })
      });
      if (!resp.ok) return null;
      var data = await resp.json();
      if (data.status === "ok" && data.is_ai) return data.reply;
      return null;
    } catch (e) {
      return null;
    }
  }

  // 解析 AI 返回的诸葛亮三段式回复
  function parseKongmingAIReply(text) {
    var mood = "";
    var judge = "";
    var act = "";
    var ask = "";

    // 提取动作描写 [xxx]
    var moodMatch = text.match(/\[([^\]]+)\]/);
    if (moodMatch) { mood = moodMatch[1]; text = text.replace(moodMatch[0], "").trim(); }

    // 提取【判断】【应对】【留问】
    var judgeMatch = text.match(/【判断】\s*([\s\S]*?)(?=【应对】|$)/);
    var actMatch = text.match(/【应对】\s*([\s\S]*?)(?=【留问】|$)/);
    var askMatch = text.match(/【留问】\s*([\s\S]*?)$/);

    if (judgeMatch) judge = judgeMatch[1].trim();
    if (actMatch) act = actMatch[1].trim();
    if (askMatch) ask = askMatch[1].trim();

    // 如果 AI 没有按格式返回，把整段作为 judge
    if (!judge && !act && !ask) {
      judge = text;
    }

    return { mood: mood, judge: judge, act: act, ask: ask };
  }

  function setupTeacherChat() {
    const box = document.querySelector("[data-chat='teacher']");
    if (!box) return;
    const messages = box.querySelector(".messages");
    document.querySelectorAll("[data-teacher-question]").forEach((button) => {
      button.addEventListener("click", async () => {
        document.querySelectorAll("[data-teacher-question]").forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
        const question = button.dataset.teacherQuestion;
        addMessage(messages, question, "user");
        const typing = addTyping(messages, "AI老师");

        // 优先调用真实 AI
        var aiReply = await callAIApi("/api/teacher", question);
        typing.remove();

        if (aiReply) {
          addMessage(messages, aiReply, "ai");
        } else {
          // 降级到本地匹配
          addMessage(messages, teacherAnswers[question] || pickTeacherAnswer(question), "ai");
        }
        window.addGrowth("wisdom", 5, "智慧值 +5：你完成了一次 AI 老师问答");
      });
    });
    setupFreeChat(box, messages, "teacher");
  }

  function setupKongmingChat() {
    const box = document.querySelector("[data-chat='kongming']");
    if (!box) return;
    injectKongmingStyle();
    const messages = box.querySelector(".messages");

    // 历史长廊彩蛋：互动计数
    var _kcCount = 0;
    function checkCorridorTrigger() {
      _kcCount++;
      if (_kcCount >= 2) {
        var trigger = document.getElementById('history-corridor-trigger');
        if (trigger && trigger.style.display === 'none') {
          trigger.style.display = 'block';
          trigger.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }

    document.querySelectorAll("[data-kongming-question]").forEach((button) => {
      button.addEventListener("click", async () => {
        document.querySelectorAll("[data-kongming-question]").forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
        const question = button.dataset.kongmingQuestion;
        addMessage(messages, question, "user");
        const typing = addTyping(messages, "诸葛亮");

        // 优先调用真实 AI
        var aiReply = await callAIApi("/api/kongming", question);
        typing.remove();

        if (aiReply) {
          var parsed = parseKongmingAIReply(aiReply);
          addKongmingReply(messages, parsed);
        } else {
          // 降级到本地匹配
          var persona = pickKongmingReply(question);
          addKongmingReply(messages, persona);
        }
        window.addGrowth("wisdom", 3, "智慧值 +3：你与诸葛亮完成了一次对话");
        checkCorridorTrigger();
      });
    });
    setupFreeChat(box, messages, "kongming", checkCorridorTrigger);
  }

  function setupFreeChat(box, messages, mode, onReply) {
    const input = box.querySelector("[data-free-input]");
    const send = box.querySelector("[data-free-send]");
    if (!input || !send) return;
    async function reply() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      addMessage(messages, text, "user");
      const typing = addTyping(messages, mode === "kongming" ? "诸葛亮" : "AI老师");

      // 优先调用真实 AI
      var endpoint = mode === "kongming" ? "/api/kongming" : "/api/teacher";
      var aiReply = await callAIApi(endpoint, text);
      typing.remove();

      if (aiReply) {
        if (mode === "kongming") {
          injectKongmingStyle();
          var parsed = parseKongmingAIReply(aiReply);
          addKongmingReply(messages, parsed);
        } else {
          addMessage(messages, aiReply, "ai");
        }
      } else {
        // 降级到本地匹配
        if (mode === "kongming") {
          injectKongmingStyle();
          const persona = pickKongmingReply(text);
          addKongmingReply(messages, persona);
        } else {
          const answer = pickTeacherAnswer(text, teacherAnswers);
          addMessage(messages, answer, "ai");
        }
      }

      window.addGrowth("wisdom", 2, mode === "kongming"
        ? "智慧值 +2：你与诸葛亮自由对谈"
        : "智慧值 +2：你完成了一次自由追问");
      if (typeof onReply === "function") onReply();
    }
    send.addEventListener("click", reply);
    // 使用 keyup 而非 keydown，避免干扰中文输入法（IME）的候选词确认
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        reply();
      }
    });
    // 兼容某些浏览器的 compositionend 处理
    var _composing = false;
    input.addEventListener("compositionstart", () => { _composing = true; });
    input.addEventListener("compositionend", () => { _composing = false; });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && _composing) {
        event.stopPropagation();
      }
    }, true);
  }

  function setupThinking() {
    const result = document.querySelector("[data-thinking-result]");
    if (!result) return;
    document.querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-choice]").forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
        const choice = button.dataset.choice;
        const content =
          choice === "A"
            ? {
                title: "AI 分析：继续北伐，完成先帝遗志",
                good: "能够主动争取机会，保持蜀汉的斗志，也体现诸葛亮对刘备托付的忠诚。",
                risk: "蜀汉国力有限，长期战争会消耗粮草、兵力和民生。",
                lesson: "理想需要行动支撑，但行动也要考虑现实条件。"
              }
            : {
                title: "AI 分析：休养生息，发展蜀汉国力",
                good: "可以减轻百姓负担，积累粮草和人才，让国家更稳定。",
                risk: "如果只防守，可能错过改变局势的机会，也可能让对手越来越强。",
                lesson: "稳健是一种智慧，但只求安全也可能失去主动。"
              };
        result.innerHTML = `
          <h2>${content.title}</h2>
          <p><strong>优点：</strong>${content.good}</p>
          <p><strong>风险：</strong>${content.risk}</p>
          <p><strong>历史启发：</strong>${content.lesson}</p>
          <p><strong>总结：</strong>历史没有唯一标准答案，重要的是学会独立思考。</p>
        `;
        result.classList.remove("show");
        void result.offsetWidth;
        result.classList.add("show");
        window.addGrowth("thinking", 8, "思辨值 +8：你完成了一次历史选择分析");
      });
    });
  }

  renderGrowth();
  markActiveNav();
  setupSafeNavigation();
  setupTeacherChat();
  setupKongmingChat();
  setupThinking();
})();
