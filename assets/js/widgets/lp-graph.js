/* =========================================================
   互動元件：lp-graph（兩變數線性規劃圖解法）
   畫出可行解區域、所有頂點、通過最佳解的等目標線，並用滑桿改變某個目標係數。
   只支援「最大化」與「≤ 限制式 + 非負」且可行解區域有界的問題。

   設定（放在 <script type="application/json"> 裡）：
   {
     "title": "圖的文字說明（給螢幕閱讀器）",
     "vars": ["x₁", "x₂"],                     // 變數顯示名稱
     "objective": [3, 5],                       // 目標函數係數 c₁、c₂（最大化）
     "constraints": [                           // a₁x₁ + a₂x₂ ≤ b
       { "a": [1, 0], "b": 4, "label": "x₁ ≤ 4", "labelAt": [4.1, 9.2] }
     ],
     "xmax": 7, "ymax": 10,                     // 座標範圍
     "slider": { "index": 0, "min": 0, "max": 12, "step": 0.5, "label": "產品 1 的單位利潤" }  // 可省略
   }
   規則見 AGENTS.md 第 9 節。
   ========================================================= */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var EPS = 1e-7;

  function el(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function fmt(v) {
    var r = Math.round(v * 100) / 100;
    if (Math.abs(r) < EPS) r = 0;
    return String(r);
  }
  function term(c, name, first) {
    if (Math.abs(c) < EPS) return "";
    var sign = c < 0 ? " − " : (first ? "" : " + ");
    var abs = Math.abs(c);
    return sign + (Math.abs(abs - 1) < EPS ? "" : fmt(abs)) + name;
  }

  // 求所有頂點：任兩條邊界線的交點中，滿足全部限制式者
  function vertices(rows) {
    var pts = [];
    for (var i = 0; i < rows.length; i++) {
      for (var j = i + 1; j < rows.length; j++) {
        var a = rows[i], b = rows[j];
        var det = a.a[0] * b.a[1] - a.a[1] * b.a[0];
        if (Math.abs(det) < EPS) continue;
        var x = (a.b * b.a[1] - a.a[1] * b.b) / det;
        var y = (a.a[0] * b.b - a.b * b.a[0]) / det;
        var ok = rows.every(function (r) { return r.a[0] * x + r.a[1] * y <= r.b + EPS; });
        var dup = pts.some(function (p) { return Math.abs(p[0] - x) < 1e-6 && Math.abs(p[1] - y) < 1e-6; });
        if (ok && !dup) pts.push([x, y]);
      }
    }
    var cx = 0, cy = 0;
    pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
    cx /= pts.length || 1; cy /= pts.length || 1;
    pts.sort(function (p, q) { return Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx); });
    return pts;
  }

  // 把直線 a₁x + a₂y = b 裁切到 [0,xmax]×[0,ymax] 的方框內
  function clipLine(a, b, xmax, ymax) {
    var pts = [];
    function add(x, y) {
      if (x < -EPS || x > xmax + EPS || y < -EPS || y > ymax + EPS) return;
      if (pts.some(function (p) { return Math.abs(p[0] - x) < 1e-6 && Math.abs(p[1] - y) < 1e-6; })) return;
      pts.push([x, y]);
    }
    if (Math.abs(a[1]) > EPS) { add(0, b / a[1]); add(xmax, (b - a[0] * xmax) / a[1]); }
    if (Math.abs(a[0]) > EPS) { add(b / a[0], 0); add((b - a[1] * ymax) / a[0], ymax); }
    return pts.length >= 2 ? [pts[0], pts[1]] : null;
  }

  window.OptWidgets = window.OptWidgets || {};
  window.OptWidgets["lp-graph"] = function (body, cfg) {
    var vars = cfg.vars || ["x₁", "x₂"];
    var c = (cfg.objective || [1, 1]).slice();
    var xmax = cfg.xmax || 10, ymax = cfg.ymax || 10;
    var rows = (cfg.constraints || []).map(function (r) { return { a: r.a, b: r.b, label: r.label, labelAt: r.labelAt }; });
    var all = rows.concat([{ a: [-1, 0], b: 0 }, { a: [0, -1], b: 0 }]);
    var verts = vertices(all);

    var W = 480, H = 400, m = { l: 42, r: 16, t: 14, b: 40 };
    function sx(x) { return m.l + (x / xmax) * (W - m.l - m.r); }
    function sy(y) { return H - m.b - (y / ymax) * (H - m.t - m.b); }

    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "widget-svg", role: "img", "aria-label": cfg.title || "線性規劃圖解法" });
    el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: "w-bg" }, svg);

    // 格線與刻度
    var step = xmax <= 12 ? 1 : Math.ceil(xmax / 12);
    for (var gx = 0; gx <= xmax + EPS; gx += step) {
      el("line", { x1: sx(gx), y1: sy(0), x2: sx(gx), y2: sy(ymax), class: gx % 5 === 0 ? "w-grid-major" : "w-grid" }, svg);
      el("text", { x: sx(gx), y: sy(0) + 18, "text-anchor": "middle", class: "w-tick" }, svg).textContent = fmt(gx);
    }
    var ystep = ymax <= 12 ? 1 : Math.ceil(ymax / 12);
    for (var gy = 0; gy <= ymax + EPS; gy += ystep) {
      el("line", { x1: sx(0), y1: sy(gy), x2: sx(xmax), y2: sy(gy), class: gy % 5 === 0 ? "w-grid-major" : "w-grid" }, svg);
      if (gy > 0) el("text", { x: sx(0) - 8, y: sy(gy) + 4, "text-anchor": "end", class: "w-tick" }, svg).textContent = fmt(gy);
    }

    // 可行解區域
    if (verts.length >= 3) {
      el("polygon", { points: verts.map(function (p) { return sx(p[0]) + "," + sy(p[1]); }).join(" "), class: "w-feasible" }, svg);
    }

    // 限制式直線與標籤
    rows.forEach(function (r) {
      var seg = clipLine(r.a, r.b, xmax, ymax);
      if (!seg) return;
      el("line", { x1: sx(seg[0][0]), y1: sy(seg[0][1]), x2: sx(seg[1][0]), y2: sy(seg[1][1]), class: "w-constraint" }, svg);
      if (r.label) {
        var at = r.labelAt || [(seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2];
        el("text", { x: sx(at[0]), y: sy(at[1]), class: "w-constraint-label" }, svg).textContent = r.label;
      }
    });

    // 座標軸
    el("line", { x1: sx(0), y1: sy(0), x2: sx(xmax), y2: sy(0), class: "w-axis" }, svg);
    el("line", { x1: sx(0), y1: sy(0), x2: sx(0), y2: sy(ymax), class: "w-axis" }, svg);
    el("text", { x: sx(xmax) - 2, y: sy(0) - 8, "text-anchor": "end", class: "w-axis-label" }, svg).textContent = vars[0];
    el("text", { x: sx(0) + 8, y: sy(ymax) + 14, class: "w-axis-label" }, svg).textContent = vars[1];

    // 頂點
    verts.forEach(function (p) { el("circle", { cx: sx(p[0]), cy: sy(p[1]), r: 4, class: "w-vertex" }, svg); });

    // 會隨滑桿變動的部分
    var iso = el("line", { class: "w-iso" }, svg);
    var arrow = el("path", { class: "w-arrow" }, svg);
    var opt = el("circle", { r: 7, class: "w-opt" }, svg);
    var optLabel = el("text", { class: "w-opt-label" }, svg);
    body.appendChild(svg);

    var controls = document.createElement("div");
    controls.className = "widget-controls";
    var readout = document.createElement("p");
    readout.className = "widget-readout";
    readout.setAttribute("aria-live", "polite");

    if (cfg.slider) {
      var s = cfg.slider;
      var label = document.createElement("label");
      var input = document.createElement("input");
      input.type = "range";
      input.min = s.min; input.max = s.max; input.step = s.step || 1;
      input.value = c[s.index];
      var valueSpan = document.createElement("span");
      label.appendChild(document.createTextNode((s.label || "係數") + " "));
      label.appendChild(input);
      label.appendChild(valueSpan);
      controls.appendChild(label);
      input.addEventListener("input", function () { c[s.index] = parseFloat(input.value); update(); });
      var showValue = function () { valueSpan.textContent = vars[s.index] + " 的係數 = " + fmt(c[s.index]); };
    }
    body.appendChild(controls);
    body.appendChild(readout);

    function update() {
      if (showValue) showValue();
      var vals = verts.map(function (p) { return c[0] * p[0] + c[1] * p[1]; });
      var best = Math.max.apply(null, vals);
      var ties = [];
      vals.forEach(function (v, i) { if (Math.abs(v - best) < 1e-6) ties.push(verts[i]); });
      var p = ties[0];
      // 若有兩個頂點同分，最佳解是整條邊；標示在其中一點即可
      opt.setAttribute("cx", sx(p[0])); opt.setAttribute("cy", sy(p[1]));
      optLabel.textContent = "(" + fmt(p[0]) + ", " + fmt(p[1]) + ")";

      // 等目標線 c₁x + c₂y = Z*
      var seg = (Math.abs(c[0]) + Math.abs(c[1]) > EPS) ? clipLine(c, best, xmax, ymax) : null;
      if (seg) {
        iso.setAttribute("x1", sx(seg[0][0])); iso.setAttribute("y1", sy(seg[0][1]));
        iso.setAttribute("x2", sx(seg[1][0])); iso.setAttribute("y2", sy(seg[1][1]));
        iso.removeAttribute("visibility");
        // 箭頭：目標函數增加的方向（以像素座標計算）
        var dx = c[0] / xmax * (W - m.l - m.r), dy = -c[1] / ymax * (H - m.t - m.b);
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / len, uy = dy / len, L = 34;
        var x0 = sx(p[0]) + ux * 10, y0 = sy(p[1]) + uy * 10, x1 = x0 + ux * L, y1 = y0 + uy * L;
        var hx = -uy * 5, hy = ux * 5;
        arrow.setAttribute("d", "M" + x0 + " " + y0 + " L" + x1 + " " + y1 +
          " M" + (x1 - ux * 8 + hx) + " " + (y1 - uy * 8 + hy) + " L" + x1 + " " + y1 + " L" + (x1 - ux * 8 - hx) + " " + (y1 - uy * 8 - hy));
        // 標籤放在箭頭的反方向，避免重疊
        optLabel.setAttribute("x", sx(p[0]) - ux * 14);
        optLabel.setAttribute("y", sy(p[1]) - uy * 14 + 4);
        optLabel.setAttribute("text-anchor", ux > 0.3 ? "end" : (ux < -0.3 ? "start" : "middle"));
      } else {
        iso.setAttribute("visibility", "hidden");
        arrow.setAttribute("d", "");
        optLabel.setAttribute("x", sx(p[0]) + 10);
        optLabel.setAttribute("y", sy(p[1]) - 10);
      }

      var expr = term(c[0], vars[0], true) + term(c[1], vars[1], Math.abs(c[0]) < EPS);
      var obj = "Z = " + (expr || "0");
      var msg;
      if (ties.length === verts.length) {
        msg = "目標函數為 0，所有可行解都一樣好。";
      } else if (ties.length >= 2) {
        msg = obj + "：有無限多個最佳解，從 (" + fmt(ties[0][0]) + ", " + fmt(ties[0][1]) + ") 到 (" +
          fmt(ties[1][0]) + ", " + fmt(ties[1][1]) + ") 整條邊都是最佳解，Z* = " + fmt(best) + "。";
      } else {
        msg = obj + "：最佳解 (" + vars[0] + ", " + vars[1] + ") = (" + fmt(p[0]) + ", " + fmt(p[1]) + ")，Z* = " + fmt(best) + "。";
      }
      readout.innerHTML = "";
      var strong = document.createElement("strong");
      strong.textContent = msg;
      readout.appendChild(strong);
    }
    update();
  };
})();
