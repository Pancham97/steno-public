/* Progressive enhancement for the Steno site.
   Content works without this file; it adds scroll reveals and the interactive
   hero demo. Everything degrades gracefully under reduced motion / no JS. */
(function () {
    "use strict";

    window.__stenoEnhanced = true;

    var reduce =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Scroll reveal ---------- */
    var reveals = document.querySelectorAll("[data-reveal]");
    function showAll() {
        for (var i = 0; i < reveals.length; i++) {
            reveals[i].classList.add("is-visible");
        }
    }
    if (reduce || !("IntersectionObserver" in window)) {
        showAll();
    } else {
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        io.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        );
        for (var j = 0; j < reveals.length; j++) {
            io.observe(reveals[j]);
        }
    }

    /* ---------- Interactive hero demo ----------
       Mirrors how Steno actually works: hold Fn to record the whole thing,
       release to transcribe on-device, it copies to the clipboard, then ⌘V
       pastes the finished text into Notes. All simulated — no microphone. */
    initDemo();

    function initDemo() {
        var scene = document.querySelector(".hero-demo");
        if (!scene) return;
        var fnkey = scene.querySelector(".fnkey");
        var docTyped = scene.querySelector(".doc-typed");
        var docText = scene.querySelector(".doc-text");
        var popState = scene.querySelector(".pop-state");
        var popTime = scene.querySelector(".pop-time");
        var popProfile = scene.querySelector(".pop-profile");
        var popQuote = scene.querySelector(".pop-quote");
        var hint = scene.querySelector(".try-hint");
        if (!fnkey || !docTyped) return;

        var takes = [
            {
                profile: "Dictation",
                text: "Meeting notes are ready — send a short summary to the team.",
            },
            {
                profile: "Message",
                text: "Sounds good — I'll have the draft over to you by tomorrow morning.",
            },
            {
                profile: "Note",
                text: "Remember to email the design feedback before standup tomorrow.",
            },
        ];

        var idx = 0;
        var state = "idle";
        var timer = null;
        var holdStart = 0;
        var interacted = false;
        var busy = false;

        function sleep(ms) {
            return new Promise(function (r) {
                setTimeout(r, ms);
            });
        }
        function setState(s) {
            state = s;
            scene.setAttribute("data-state", s);
        }
        function setHint(t) {
            if (hint) hint.textContent = t;
        }
        function truncate(s, n) {
            return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s;
        }
        function pressKeys() {
            var keys = scene.querySelectorAll(".pk");
            for (var i = 0; i < keys.length; i++) keys[i].classList.add("is-press");
            setTimeout(function () {
                for (var k = 0; k < keys.length; k++)
                    keys[k].classList.remove("is-press");
            }, 175);
        }

        if (reduce) {
            /* Static, self-explanatory end state: a note that was pasted in. */
            docTyped.textContent = takes[0].text;
            if (popProfile) popProfile.textContent = takes[0].profile;
        }

        function start() {
            if (state !== "idle" || busy) return;
            setState("listening");
            fnkey.classList.add("is-down");
            setHint("Listening…");
            var take = takes[idx % takes.length];
            docTyped.textContent = "";
            if (docText) docText.classList.remove("paste-pop");
            if (popProfile) popProfile.textContent = take.profile;
            if (popState) popState.textContent = "Listening";
            var secs = 0;
            if (popTime) popTime.textContent = "0:00";
            timer = setInterval(function () {
                secs = Math.min(secs + 1, 9);
                if (popTime) popTime.textContent = "0:0" + secs;
            }, 700);
            holdStart = Date.now();
        }

        async function stop() {
            if (state !== "listening") return;
            fnkey.classList.remove("is-down");
            clearInterval(timer);
            busy = true;
            var held = Date.now() - holdStart;
            if (!reduce && held < 600) await sleep(600 - held);
            var take = takes[idx % takes.length];

            /* 1 — transcribe the whole utterance, on-device */
            setState("transcribing");
            if (popState) popState.textContent = "Transcribing…";
            setHint("Transcribing on your Mac…");
            await sleep(reduce ? 0 : 780);

            /* 2 — copy the finished transcript to the clipboard */
            setState("copied");
            if (popState) popState.textContent = "Copied to clipboard";
            if (popQuote) popQuote.textContent = "“" + truncate(take.text, 44) + "”";
            setHint("Copied to your clipboard");
            await sleep(reduce ? 0 : 1150);

            /* 3 — ⌘V pastes it into Notes, all at once */
            setState("pasting");
            setHint("Press ⌘V to paste");
            await sleep(reduce ? 0 : 300);
            if (!reduce) {
                pressKeys();
                await sleep(190);
            }
            docTyped.textContent = take.text;
            if (docText && !reduce) {
                docText.classList.remove("paste-pop");
                void docText.offsetWidth;
                docText.classList.add("paste-pop");
            }

            setState("done");
            setHint("Pasted into Notes");
            await sleep(reduce ? 300 : 1400);

            setState("idle");
            setHint("Hold to dictate");
            busy = false;
            idx++;
        }

        fnkey.addEventListener("pointerdown", function (e) {
            e.preventDefault();
            interacted = true;
            start();
        });
        window.addEventListener("pointerup", function () {
            if (state === "listening") stop();
        });
        window.addEventListener("pointercancel", function () {
            if (state === "listening") stop();
        });
        fnkey.addEventListener("keydown", function (e) {
            if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                interacted = true;
                start();
            }
        });
        fnkey.addEventListener("keyup", function (e) {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                if (state === "listening") stop();
            }
        });
        fnkey.addEventListener("blur", function () {
            if (state === "listening") stop();
        });

        /* Auto-play one full cycle so the flow is clear without a click. */
        if (!reduce) {
            setTimeout(function () {
                if (interacted) return;
                start();
                setTimeout(function () {
                    if (state === "listening") stop();
                }, 1900);
            }, 1500);
        }
    }
})();
