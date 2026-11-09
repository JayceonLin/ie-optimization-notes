/* =========================================================
   互動元件：gantt（排程甘特圖）
   依工件順序計算「排列式流程工廠」排程（單機就是只有一台機器），畫出甘特圖，
   並可用按鈕切換不同的工件順序，比較績效指標。

   設定（放在 <script type="application/json"> 裡）：
   {
     "title": "圖的文字說明（給螢幕閱讀器）",
     "machines": ["機器 1", "機器 2"],
     "jobs": [ { "id": "A", "p": [3, 6], "d": 10 } ],   // p：在各機器的處理時間；d：交期（可省略）
     "sequences": [ { "label": "Johnson 法則", "order": ["C", "A", "D", "E", "B"] } ],
     "metrics": ["cmax", "sumC", "lmax"]                 // 要顯示的指標，可任選
   }
   規則見 AGENTS.md 第 9 節。
   ========================================================= */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // 排列式流程工廠：每台機器依同一順序加工，工件要做完前一台才能上下一台
  function schedule(cfg, order) {
    var nM = cfg.machines.length;
    var free = [];
    for (var k = 0; k < nM; k++) free.push(0);
    var ops = [], completion = {};
    order.forEach(function (id) {
      var job = cfg.jobs.filter(function (j) { return j.id === id; })[0];
      var prevDone = 0;
      for (var k = 0; k < nM; k++) {
        var start = Math.max(free[k], prevDone);
        var end = start + job.p[k];
        ops.push({ id: id, machine: k, start: start, end: end });
        free[k] = end;
        prevDone = end;
      }
      completion[id] = prevDone;
    });
    var cmax = Math.max.apply(null, free);
    var sumC = 0, lmax = -Infinity;
    order.forEach(function (id) {
      sumC += completion[id];
      var job = cfg.jobs.filter(function (j) { return j.id === id; })[0];
      if (typeof job.d === "number") lmax = Math.max(lmax, completion[id] - job.d);
    });
    return { ops: ops, cmax: cmax, sumC: sumC, lmax: lmax, completion: completion };
  }

  window.OptWidgets = window.OptWidgets || {};
  window.OptWidgets["gantt"] = function (body, cfg) {
    var seqs = cfg.sequences || [];
    var metrics = cfg.metrics || ["cmax"];
    var results = seqs.map(function (s) { return schedule(cfg, s.order); });
    var T = Math.max.apply(null, results.map(function (r) { return r.cmax; }));
    var colorOf = {};
    cfg.jobs.forEach(function (j, i) { colorOf[j.id] = "w-job-" + ((i % 6) + 1); });

    var nM = cfg.machines.length;
    var W = 560, labelW = 66, rowH = 42, top = 22, axisH = 30;
    var H = top + nM * rowH + axisH;
    function sx(t) { return labelW + (t / T) * (W - labelW - 18); }

    var tabs = document.createElement("div");
    tabs.className = "widget-tabs";
    tabs.setAttribute("role", "group");
    tabs.setAttribute("aria-label", "選擇工件順序");
    body.appendChild(tabs);

    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "widget-svg", role: "img", "aria-label": cfg.title || "甘特圖" });
    body.appendChild(svg);
    var readout = document.createElement("p");
    readout.className = "widget-readout";
    readout.setAttribute("aria-live", "polite");
    body.appendChild(readout);

    // 固定的背景：時間格線、刻度、機器名稱
    var tick = T <= 15 ? 1 : (T <= 30 ? 2 : 5);
    for (var t = 0; t <= T; t++) {
      el("line", { x1: sx(t), y1: top, x2: sx(t), y2: top + nM * rowH, class: t % 5 === 0 ? "w-grid-major" : "w-grid" }, svg);
      if (t % tick === 0) el("text", { x: sx(t), y: top + nM * rowH + 18, "text-anchor": "middle", class: "w-tick" }, svg).textContent = t;
    }
    el("line", { x1: sx(0), y1: top + nM * rowH, x2: sx(T), y2: top + nM * rowH, class: "w-axis" }, svg);
    cfg.machines.forEach(function (name, k) {
      el("text", { x: labelW - 10, y: top + k * rowH + rowH / 2 + 4, "text-anchor": "end", class: "w-text" }, svg).textContent = name;
    });
    var layer = el("g", {}, svg);

    function draw(i) {
      var r = results[i];
      while (layer.firstChild) layer.removeChild(layer.firstChild);
      r.ops.forEach(function (op) {
        var y = top + op.machine * rowH + 5;
        el("rect", { x: sx(op.start), y: y, width: sx(op.end) - sx(op.start), height: rowH - 10, rx: 3, class: "w-job " + colorOf[op.id] }, layer);
        if (sx(op.end) - sx(op.start) > 14) {
          el("text", { x: (sx(op.start) + sx(op.end)) / 2, y: y + (rowH - 10) / 2 + 5, "text-anchor": "middle", class: "w-job-text" }, layer).textContent = op.id;
        }
      });
      el("line", { x1: sx(r.cmax), y1: top - 6, x2: sx(r.cmax), y2: top + nM * rowH, class: "w-cmax" }, layer);
      el("text", { x: sx(r.cmax) - 4, y: top - 9, "text-anchor": "end", class: "w-cmax-label" }, layer).textContent = "Cₘₐₓ = " + r.cmax;

      var parts = [];
      if (metrics.indexOf("cmax") >= 0) parts.push("最大完工時間 Cₘₐₓ = " + r.cmax);
      if (metrics.indexOf("sumC") >= 0) parts.push("完工時間總和 ΣCⱼ = " + r.sumC);
      if (metrics.indexOf("lmax") >= 0 && isFinite(r.lmax)) parts.push("最大延遲 Lₘₐₓ = " + r.lmax);
      readout.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = parts.join("，") + "。";
      readout.appendChild(strong);
      var detail = document.createElement("span");
      detail.textContent = " 順序：" + seqs[i].order.join(" → ");
      readout.appendChild(detail);

      Array.prototype.forEach.call(tabs.children, function (b, j) { b.setAttribute("aria-pressed", String(j === i)); });
    }

    seqs.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = s.label;
      b.addEventListener("click", function () { draw(i); });
      tabs.appendChild(b);
    });
    if (seqs.length) draw(0);
  };
})();
