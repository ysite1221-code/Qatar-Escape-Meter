//  日付関連（カタール脱出）

// 赴任日（開始）
const start_day = new Date("2025-05-25");
// 帰任日（終了）
const end_day = new Date("2026-03-10");

// 1日のミリ秒
const MS_DAY = 1000 * 60 * 60 * 24;

// カタール脱出メーター更新
function updateEscapeMeter() {
    const today = new Date();

    const totalDays  = Math.ceil((end_day - start_day) / MS_DAY);
    const passedDays = Math.max(
        0,
        Math.min(totalDays, Math.ceil((today - start_day) / MS_DAY))
    );
    const remaining = Math.max(0, totalDays - passedDays);

    // 残り日数テキスト
    $("#days_text").text(remaining + " 日");

    // メーター（経過率をパーセントで）
    const rate = Math.floor((passedDays / totalDays) * 100);
    $("#escape_meter").val(rate);
}

//  localStorage 共通系

// キー生成（タイムスタンプ付き）
function generateTimestampKey(prefix = "anger") {
    return `${prefix}_${Date.now()}`;
}

// オブジェクトを JSON で保存
function saveToLocalStorage(prefix, dataObj) {
    const key = generateTimestampKey(prefix);
    localStorage.setItem(key, JSON.stringify(dataObj));
    return key;
}

// anger_* だけ読み出す
function getAllAngerEvents() {
    const events = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith("anger_")) continue;

        const raw = localStorage.getItem(key);
        try {
            const obj = JSON.parse(raw);
            if (!obj) continue;
            // 最低限 point は持っている前提
            if (typeof obj.point === "number") {
                events.push(obj);
            }
        } catch (e) {
            // 壊れたデータは無視する処理みたい
            continue;
        }
    }
    return events;
}
//  怒りポイント系

// セレクトボックスに 0〜1000 おこ を入れる
function setupAngerPointOptions() {
    let o = "";
    for (let i = 0; i <= 1000; i++) {
        o += `<option value="${i}">${i}おこ</option>`;
    }
    $("#anger_point_auto").html(o);
}

// 怒りレベルメーターを更新（件数ベース）
function updateAngerLevelBar(events) {
    const count = events.length;

    // 何件で MAX と見なすか（仮に 30件で100%）
    const MAX_COUNT = 30;
    const ratio = Math.min(1, count / MAX_COUNT); // 0〜1
    const percent = Math.round(ratio * 100);

    $("#anger_level_meter").val(percent);
    $("#anger_meter_count").text(count + "件");
}

// ランキング・ログの描画＋怒りレベルメーター更新
function renderAngerRanking() {
    const events = getAllAngerEvents();
    
    // ★ データが 1件もなければ Best Anger を非表示
    if (events.length === 0) {
        $(".best_anger").hide();
    } else {
        $(".best_anger").show();
    }

    // 怒りレベルバー更新
    updateAngerLevelBar(events);

    // ポイント降順で並べる
    events.sort((a, b) => b.point - a.point);

    // ベスト5
    const best5 = events.slice(0, 5);
    for (let i = 0; i < 5; i++) {
        const li = $("#list" + (i + 1));
        if (best5[i]) {
            li.text(`${best5[i].point}おこ：${best5[i].text}`);
        } else {
            li.text("");
        }
    }

    // 過去ログ（テキストエリアの下とかに出したければ #log を作る）
    // 今はログ表示が HTML に無いので、必要になったらここで追加
}

// 「刻みつける」ボタン
function setupSubmitHandler() {
    $("#submit").on("click", function () {
        const text = $("#anger_innertext").val().trim();
        const point = Number($("#anger_point_auto").val() || 0);

        if (!text) {
            alert("何があったか書いてください。");
            return;
        }

        const eventObj = {
            text,
            point,
            createdAt: new Date().toISOString()
        };

        saveToLocalStorage("anger", eventObj);

        // 入力欄クリア
        $("#anger_innertext").val("");

        // 表示更新
        renderAngerRanking();

        alert("刻みつけたぞ！");
    });
}

// 「全部砂漠に流してあげる」ボタン
function setupDeleteHandler() {
    $("#delete").on("click", function () {
        // anger_* だけ消す（他の localStorage への影響を避ける）
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("anger_")) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        $("#anger_innertext").val("");

        renderAngerRanking();
        alert("全部流したぞ…");
    });
}

//  DOM Ready（初期化）
$(function () {
    // カタール脱出メーター
    updateEscapeMeter();

    // 怒りポイント初期化
    setupAngerPointOptions();
    setupSubmitHandler();
    setupDeleteHandler();

    // 初期表示
    renderAngerRanking();
});