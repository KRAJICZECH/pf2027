(function () {
  // ===== TEXTY – upravte zde =====
  var T = {
    forYou: "Pro vás",
    title1: "Veselé Vánoce",
    title2: "a šťastný nový rok",
    hello: "Vážení obchodní partneři,",
    p1: "rok 2026 se chýlí ke konci a my bychom vám rádi poděkovali za důvěru a spolupráci, kterou jste nám v uplynulém roce věnovali.",
    p2: "Přejeme vám klidné a radostné vánoční svátky a do nového roku 2027 hodně zdraví, spokojenosti a úspěchů. Těšíme se na další spolupráci.",
    regards: "S přátelským pozdravem",
    team: "tým KRAJICZECH",
    turn: "Klikněte nebo klepněte pro otočení",
    again: "Přehrát znovu"
  };
  // ===============================

  var scene = document.getElementById("scene");
  var book = document.getElementById("book");
  var leaf1 = document.getElementById("leaf1");
  var leaf2 = document.getElementById("leaf2");
  var cover = document.getElementById("cover");
  var controls = document.getElementById("controls");
  var prevBtn = document.getElementById("prev");
  var nextBtn = document.getElementById("next");
  var hint = document.getElementById("hint");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = 0, busy = true, timers = [];

  // Snowflakes on the inside pages: [x %, y %, size, orange?, rotation, extra class (optional)]
  //   x, y     – centre of the flake in % of the page width / height
  //   size     – width and height in units of --u
  //   orange?  – 1 = orange, 0 = grey
  //   rotation – in degrees
  //   class    – extra CSS class for the flake, e.g. "fl-corner" (hidden on small screens, see style.css)
  var flakes = {
    deco: [[8,10,54,0,0],[30,6,26,0,20],[52,18,40,1,10],[74,8,22,0,35],[18,34,30,0,15],[62,40,62,0,5],
           [40,52,20,1,25],[84,30,28,0,0],[10,62,22,0,30],[80,66,36,1,12],[58,78,24,0,8],[88,88,18,0,20]],
    letter: [[90,8,26,0,10],[97,26,14,1,0],[84,86,30,0,25,"fl-corner"],[97,70,16,0,5],[6,90,18,1,15]]
  };
  function placeFlakes(id, list) {
    var host = document.getElementById(id);
    list.forEach(function (f) {
      var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("class", f[5] ? "fl " + f[5] : "fl");
      s.setAttribute("viewBox", "-50 -50 100 100");
      s.style.cssText = "left:" + f[0] + "%;top:" + f[1] + "%;width:calc(var(--u)*" + f[2] + ");height:calc(var(--u)*" + f[2] +
        ");translate:-50% -50%;rotate:" + f[4] + "deg;color:var(" + (f[3] ? "--orange" : "--flake") + ");opacity:" + (f[3] ? .9 : .75);
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("fill", "none"); g.setAttribute("stroke", "currentColor");
      g.setAttribute("stroke-width", "3.2"); g.setAttribute("stroke-linecap", "round");
      for (var a = 0; a < 6; a++) {
        var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
        p.setAttribute("d", "M0 0V-44M0-15L-10-25M0-15L10-25M0-29L-7-36M0-29L7-36");
        p.setAttribute("transform", "rotate(" + a * 60 + ")");
        g.appendChild(p);
      }
      s.appendChild(g);
      host.insertBefore(s, host.firstChild);
    });
  }
  placeFlakes("deco", flakes.deco);
  placeFlakes("letter", flakes.letter);

  function render() {
    document.querySelectorAll("[data-t]").forEach(function (el) {
      el.textContent = T[el.getAttribute("data-t")];
    });
    document.getElementById("hello").textContent = T.hello;
    hint.textContent = state === 2 ? T.again : T.turn;
  }

  function setState(s) {
    if (s === 0) { leaf1.style.zIndex = 3; leaf2.style.zIndex = 2; }
    if (s === 2) { leaf2.style.zIndex = 4; }
    state = s;
    book.dataset.state = s;
    leaf1.classList.toggle("flipped", s >= 1);
    leaf2.classList.toggle("flipped", s >= 2);
    prevBtn.disabled = s === 0;
    render();
  }

  function later(fn, ms) { timers.push(setTimeout(fn, reduce ? 0 : ms)); }

  function runIntro() {
    busy = true;
    controls.classList.add("hide");
    later(function () { scene.classList.add("flap-open"); }, 700);
    later(function () { scene.classList.add("card-out"); }, 1400);
    later(function () { scene.classList.add("env-away"); }, 2300);
    later(function () { cover.classList.add("tree"); controls.classList.remove("hide"); busy = false; snow.boost(); }, 3300);
  }

  function restart() {
    busy = true;
    scene.classList.add("fade");
    later(function () {
      scene.classList.add("no-anim");
      scene.classList.remove("flap-open", "card-out", "env-away");
      cover.classList.remove("tree");
      setState(0);
      void scene.offsetWidth;
      scene.classList.remove("no-anim", "fade");
      snow.calm();
      runIntro();
    }, 450);
  }

  function lock() { busy = true; later(function () { busy = false; }, 1000); }
  function next() {
    if (busy) return;
    if (state < 2) { setState(state + 1); lock(); } else restart();
  }
  function prev() {
    if (busy || state === 0) return;
    setState(state - 1); lock();
  }

  book.addEventListener("click", next);
  book.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); next(); } });
  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  });

  // ===== Sníh =====
  var snow = (function () {
    var c = document.getElementById("snow"), ctx = c.getContext("2d");
    var list = [], w, h, target = 90;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function flake(top) {
      return { x: Math.random() * w, y: top ? -10 : Math.random() * h, r: .8 + Math.random() * 2.4,
               s: .3 + Math.random() * 1, d: Math.random() * 6.28, o: .4 + Math.random() * .55 };
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      while (list.length < target) list.push(flake(list.length > 0));
      for (var i = list.length - 1; i >= 0; i--) {
        var f = list[i];
        f.y += f.s; f.d += .01; f.x += Math.sin(f.d) * .4;
        if (f.y > h + 10) { if (list.length > target) { list.splice(i, 1); continue; } f.y = -10; f.x = Math.random() * w; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832);
        ctx.fillStyle = "rgba(244,241,236," + f.o + ")"; ctx.fill();
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    size(); window.addEventListener("resize", size); draw();
    return { boost: function () { target = 180; }, calm: function () { target = 90; } };
  })();

  setState(0);
  runIntro();
})();
