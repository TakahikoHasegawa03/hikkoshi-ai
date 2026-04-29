import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const PHASES = [
  { id: "before",      label: "引越し前",   sub: "1〜2ヶ月前",  kanji: "前" },
  { id: "week_before", label: "直前準備",   sub: "1週間〜前日",  kanji: "備" },
  { id: "moving_day",  label: "当日",       sub: "引越し当日",   kanji: "日" },
  { id: "after",       label: "引越し後",   sub: "14日以内",     kanji: "後" },
  { id: "misc",        label: "要注意",     sub: "見落としがち",  kanji: "注" },
];

const ALL_TASKS = {
  before: [
    { id:"b1",  label:"現在の賃貸の解約通知",       cat:"契約・住居",   tags:["all"],           detail:"通常1ヶ月前までに通知が必要。管理会社・オーナーへ書面で連絡を。" },
    { id:"b2",  label:"新居の契約完了",             cat:"契約・住居",   tags:["all"],           detail:"初期費用の振込・鍵受け取り日の確認を忘れずに。" },
    { id:"b3",  label:"駐車場の契約",               cat:"契約・住居",   tags:["car"],           detail:"新居近くの月極駐車場を早めに確保。" },
    { id:"b4",  label:"火災保険 加入 / 変更",       cat:"契約・住居",   tags:["all"],           detail:"新居に合わせて補償内容を見直し更新。" },
    { id:"b5",  label:"電気 解約（旧居）",          cat:"ライフライン", tags:["all"],           detail:"電力会社のWebまたは電話で解約手続き。" },
    { id:"b6",  label:"電気 開始申込（新居）",      cat:"ライフライン", tags:["all"],           detail:"引越し当日から使えるよう事前に申込。" },
    { id:"b7",  label:"ガス 解約",                  cat:"ライフライン", tags:["all"],           detail:"ガス会社に連絡。旧居での閉栓立ち会いを確認。" },
    { id:"b8", personalGuide:true, deadlineDays:-3, deadlineLabel:"引越し3日前までに予約", urgent:true,   label:"ガス 開栓予約（新居）",      cat:"ライフライン", tags:["all"],           detail:"開栓には立ち会いが必要。引越し当日か翌日に予約。" },
    { id:"b9",  label:"水道 解約",                  cat:"ライフライン", tags:["all"],           detail:"市区町村の水道局へ連絡。" },
    { id:"b10", label:"水道 開始（新居）",          cat:"ライフライン", tags:["all"],           detail:"新居管轄の水道局へ利用開始を申請。" },
    { id:"b11", personalGuide:true, deadlineDays:-30, deadlineLabel:"引越し1ヶ月前まで", urgent:false,  label:"インターネット 解約 / 移転", cat:"インフラ",    tags:["all"],           detail:"光回線の工事は1〜2ヶ月待ちの場合も。早めに動く。", link:"https://px.a8.net/svt/ejp?a8mat=4B1WLY+63OZ02+3NMM+61JSI", linkLabel:"🔗 ソフトバンク光で申し込む" },
    { id:"b12", label:"新規回線 申し込み",          cat:"インフラ",    tags:["all"],           detail:"工事日を先に押さえておくのがコツ。", link:"https://px.a8.net/svt/ejp?a8mat=4B1WLY+63OZ02+3NMM+61JSI", linkLabel:"🔗 ソフトバンク光で申し込む" },
    { id:"b13", deadlineDays:-21, deadlineLabel:"引越し3週間前まで", urgent:false,  label:"引越し業者 見積もり比較",    cat:"引越し",      tags:["all"],           detail:"繁忙期（3〜4月）は特に早めに。3社以上で比較推奨。", link:"https://px.a8.net/svt/ejp?a8mat=4B1WLY+6NXPKI+4HN6+TS3OI", linkLabel:"🔗 ハコブで見積もりを取る" },
    { id:"b14", label:"引越し業者 予約確定",        cat:"引越し",      tags:["all"],           detail:"日程・プランを確定し、書面（メール）で確認。", link:"https://px.a8.net/svt/ejp?a8mat=4B1WLY+6NXPKI+4HN6+TS3OI", linkLabel:"🔗 ハコブで予約する" },
    { id:"b15", label:"ダンボール手配",             cat:"引越し",      tags:["all"],           detail:"業者提供 or スーパー・ホームセンターで調達。" },
    { id:"b16", personalGuide:true, deadlineDays:-7, deadlineLabel:"引越し1週間前まで", urgent:false,  label:"郵便 転送届の提出",          cat:"住所変更",    tags:["all"],           detail:"郵便局窓口 or「e転居」（無料）で1年間転送設定。", link:"https://www.post.japanpost.jp/int/information/2020/0401_01.html", linkLabel:"e転居で手続き" },
    { id:"b17", label:"粗大ゴミの処分予約",        cat:"その他",      tags:["all"],           detail:"自治体の受付は混むので早めに。" },
    { id:"b18", label:"家具・家電の購入",           cat:"その他",      tags:["all"],           detail:"新居の寸法を必ず測ってから注文。搬入経路も要確認。" },
    { id:"b19", label:"梱包開始",                  cat:"その他",      tags:["all"],           detail:"使用頻度の低いものから。ラベルは必ず。" },
  ],
  week_before: [
    { id:"w1", label:"荷造りを完了させる",         cat:"梱包",  tags:["all"], detail:"当日使うもの以外はすべて梱包完了させる。" },
    { id:"w2", label:"貴重品を手荷物に分離",       cat:"梱包",  tags:["all"], detail:"現金・通帳・印鑑・パスポートは自分で運ぶ。" },
    { id:"w3", label:"冷蔵庫の整理・水抜き",       cat:"梱包",  tags:["all"], detail:"前日夜には電源を抜いて水抜きを。食材を計画的に消費する。" },
    { id:"w4", label:"ゴミの処理",                 cat:"梱包",  tags:["all"], detail:"引越し前日までに不燃・可燃ゴミを処理。" },
    { id:"w5", personalGuide:true, deadlineDays:-14, deadlineLabel:"引越し14日前まで", urgent:true,  label:"転出届（役所）",             cat:"書類",  tags:["all"], detail:"引越し前14日以内 or 当日に窓口へ。マイナポータル利用も可。", link:"https://viewx.myna.go.jp/", linkLabel:"マイナポータルで手続き" },
    { id:"w6", label:"印鑑登録の廃止",             cat:"書類",  tags:["all"], detail:"転出届と同時に廃止される場合多。窓口で確認。" },
    { id:"w7", label:"家賃精算の確認",             cat:"支払い",tags:["all"], detail:"日割り家賃・敷金返還スケジュールを書面で確認。" },
    { id:"w8", label:"光熱費の最終確認",           cat:"支払い",tags:["all"], detail:"各社のWebで未払いがないか確認しておく。" },
  ],
  moving_day: [
    { id:"m1", label:"旧居 搬出立ち会い",          cat:"作業",             tags:["all"], detail:"業者の作業を確認しながら全部屋・押し入れ・ベランダの忘れ物チェック。" },
    { id:"m2", label:"旧居の最終確認と鍵返却",     cat:"作業",             tags:["all"], detail:"傷・汚れを記録し、管理会社への報告。鍵は最後に返却。" },
    { id:"m3", label:"新居 搬入立ち会い",          cat:"作業",             tags:["all"], detail:"家具配置を指示しながら傷チェック。後から言い訳できるよう写真を撮る。" },
    { id:"m4", label:"電気の開通確認",             cat:"ライフライン確認",  tags:["all"], detail:"ブレーカーをONにして各コンセントを確認。" },
    { id:"m5", label:"水道の開通確認",             cat:"ライフライン確認",  tags:["all"], detail:"止水栓を開く。水漏れや異常があればすぐ管理会社へ。" },
    { id:"m6", label:"ガス開栓の立ち会い",         cat:"ライフライン確認",  tags:["all"], detail:"ガス会社スタッフが訪問。本人立ち会いが必要。" },
  ],
  after: [
    { id:"a1", personalGuide:true, deadlineDays:14, deadlineLabel:"引越し後14日以内", urgent:true,   label:"転入届（14日以内）",        cat:"行政",    tags:["all"],           detail:"新居の市区町村窓口へ。転出証明書を持参。", link:"https://viewx.myna.go.jp/", linkLabel:"マイナポータルで確認" },
    { id:"a2", personalGuide:true, deadlineDays:14, deadlineLabel:"引越し後14日以内", urgent:true,   label:"マイナンバー住所変更",       cat:"行政",    tags:["all"],           detail:"転入届と同時に手続き可能な場合が多い。マイナポータルアプリからも手続き可能。", link:"https://viewx.myna.go.jp/", linkLabel:"マイナポータルで手続き" },
    { id:"a3", personalGuide:true, deadlineDays:14, deadlineLabel:"引越し後14日以内", urgent:false,   label:"国民健康保険の変更",         cat:"行政",    tags:["solo","family"], detail:"会社員は勤務先経由。自営は役所で手続き。" },
    { id:"a4", personalGuide:true, deadlineDays:14, deadlineLabel:"引越し後14日以内", urgent:false,   label:"国民年金の住所変更",         cat:"行政",    tags:["solo","family"], detail:"マイナンバー連携済みなら自動更新の場合も。" },
    { id:"a5", personalGuide:true, deadlineDays:14, deadlineLabel:"引越し後14日以内", urgent:false,   label:"運転免許証 住所変更",        cat:"車関係",  tags:["car"],           detail:"警察署・運転免許センターで手続き。新住所の住民票が必要。" },
    { id:"a6", personalGuide:true,  label:"車検証の住所変更",           cat:"車関係",  tags:["car"],           detail:"陸運局で変更。車庫証明が必要な場合も。" },
    { id:"a7",  label:"駐車場の車庫証明申請",       cat:"車関係",  tags:["car"],           detail:"所轄警察署で手続き。申請から交付まで約1週間。" },
    { id:"a8",  label:"銀行 住所変更",              cat:"金融",    tags:["all"],           detail:"ネットバンクはアプリで。窓口は通帳・印鑑持参。", link:"https://www.mizuhobank.co.jp/retail/products/account/change/address.html", linkLabel:"みずほ銀行（例）" },
    { id:"a9",  label:"クレジットカード 住所変更",  cat:"金融",    tags:["all"],           detail:"各社のWebマイページから変更可能。" },
    { id:"a10", label:"証券口座 住所変更",          cat:"金融",    tags:["all"],           detail:"SBI・楽天等はWebで手続き可。" },
    { id:"a11", label:"携帯キャリア 住所変更",      cat:"サービス",tags:["all"],           detail:"My docomo / au / SoftBankなどのマイページから。", link:"https://www.nttdocomo.co.jp/", linkLabel:"My docomoへ" },
    { id:"a12", label:"Amazon 住所変更",            cat:"サービス",tags:["all"],           detail:"デフォルト配送先住所を更新。", link:"https://www.amazon.co.jp/a/addresses", linkLabel:"Amazonで住所変更" },
    { id:"a13", label:"サブスク 住所変更",          cat:"サービス",tags:["all"],           detail:"Netflix等は請求先住所のみ変更が必要な場合も。" },
    { id:"a14", label:"子供の学校・保育園の手続き",cat:"その他",  tags:["family"],         detail:"転校手続き・保育園の転園申請は早めに。自治体によって異なる。" },
    { id:"a15", label:"かかりつけ病院の変更",       cat:"その他",  tags:["all"],           detail:"紹介状をもらっておくとスムーズ。" },
  ],
  misc: [
    { id:"x1", label:"NHK 住所変更",              cat:"見落とし",tags:["all"],  detail:"NHKのWebサイトから手続き可能。", link:"https://pid.nhk.or.jp/jusho/", linkLabel:"NHKで住所変更" },
    { id:"x2", label:"ふるさと納税 配送先変更",    cat:"見落とし",tags:["all"],  detail:"年末に集中するので早めに更新。", link:"https://www.satofull.jp/", linkLabel:"さとふるで変更（例）" },
    { id:"x3", label:"ペット登録の変更",           cat:"見落とし",tags:["pet"],  detail:"犬は市区町村への狂犬病登録の住所変更が必要。" },
    { id:"x4", label:"宅配サービス 住所変更",      cat:"見落とし",tags:["all"],  detail:"定期便の配送先は別途変更が必要。" },
    { id:"x5", label:"会社への住所申請",           cat:"見落とし",tags:["all"],  detail:"通勤交通費の変更・住所変更を人事部へ。" },
    { id:"x6", label:"各種会員サービス 住所変更",  cat:"見落とし",tags:["all"],  detail:"ポイントカード・通販サイト等。まとめて確認。" },
  ],
};

const PROFILES = {
  situation: [
    { value:"solo",   label:"一人暮らし",    note:"Single" },
    { value:"couple", label:"カップル・夫婦", note:"Couple" },
    { value:"family", label:"家族（子あり）", note:"Family" },
  ],
  car: [
    { value:"car",    label:"車あり",  note:"With car" },
    { value:"no_car", label:"車なし",  note:"No car" },
  ],
  pet: [
    { value:"pet",    label:"ペットあり", note:"With pet" },
    { value:"no_pet", label:"ペットなし", note:"No pet" },
  ],
};

function getFilteredTasks(profile) {
  const tags = ["all"];
  if (profile.situation) tags.push(profile.situation);
  if (profile.car === "car") tags.push("car");
  if (profile.pet === "pet") tags.push("pet");
  const out = {};
  for (const [phase, list] of Object.entries(ALL_TASKS)) {
    out[phase] = list.filter(t => t.tags.some(g => tags.includes(g)));
  }
  return out;
}

async function callClaude(messages, system) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:800, system, messages }),
  });
  const d = await r.json();
  return d.content?.find(b => b.type==="text")?.text || "";
}

// ─────────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────────
function FormScreen({ situation, car, pet, onComplete, Wrap }) {
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const canSubmit = date && from && to;
  return (
    <Wrap>
      <div className="ob-step">
        <div className="ob-step-head"><span className="ob-step-num">引越し情報の入力</span></div>
        <div className="ob-fields">
          <div className="ob-field">
            <span className="ob-field-label">引越し予定日</span>
            <input className="ob-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          <div className="ob-field">
            <span className="ob-field-label">旧住所（市区町村まで）</span>
            <input className="ob-input" type="text" placeholder="例：東京都渋谷区" value={from} onChange={e=>setFrom(e.target.value)}/>
          </div>
          <div className="ob-field">
            <span className="ob-field-label">新住所（市区町村まで）</span>
            <input className="ob-input" type="text" placeholder="例：神奈川県横浜市" value={to} onChange={e=>setTo(e.target.value)}/>
          </div>
        </div>
        <button className={"ob-submit" + (canSubmit?" ob-submit-on":"")} disabled={!canSubmit}
          onClick={() => onComplete({ profile:{ situation, car, pet }, date, from, to })}>
          チェックリストを作成する →
        </button>
      </div>
    </Wrap>
  );
}

function Onboarding({ onComplete }) {
  const [screen, setScreen] = useState("q0");
  const [situation, setSituation] = useState(null);
  const [car, setCar] = useState(null);
  const [pet, setPet] = useState(null);

  const Brand = () => (
    <div className="ob-brand">
      <div className="ob-seal"><span className="ob-seal-kanji">引</span></div>
      <div className="ob-brand-text">
        <h1 className="ob-title">HikkoshiAI</h1>
        <p className="ob-tagline">引越し手続きを、一緒に整える。</p>
      </div>
    </div>
  );

  const Pips = ({ n }) => (
    <div className="ob-step-track">
      {[1,2,3].map(i => <div key={i} className={"ob-pip" + (i<=n?" ob-pip-on":"")}/>)}
    </div>
  );

  const Wrap = ({ children }) => (
    <div className="ob-root"><div className="ob-bg-grid"/>
      <div className="ob-center">
        <Brand/>
        <div className="ob-card">{children}</div>
        <p className="ob-footer">データはブラウザに保存されます。外部送信はしません。</p>
      </div>
    </div>
  );

  if (screen === "q0") return (
    <Wrap>
      <div className="ob-step">
        <div className="ob-step-head"><span className="ob-step-num">Step 01 / 03</span><Pips n={1}/></div>
        <div className="ob-q">引越しの状況を教えてください</div>
        <div className="ob-opts">
          {PROFILES.situation.map(opt => (
            <button key={opt.value} className={"ob-opt" + (situation===opt.value?" ob-opt-sel":"")}
              onClick={() => { setSituation(opt.value); setScreen("q1"); }}>
              <span className="ob-opt-label">{opt.label}</span>
              <span className="ob-opt-note">{opt.note}</span>
            </button>
          ))}
        </div>
      </div>
    </Wrap>
  );

  if (screen === "q1") return (
    <Wrap>
      <div className="ob-step">
        <div className="ob-step-head"><span className="ob-step-num">Step 02 / 03</span><Pips n={2}/></div>
        <div className="ob-q">車はお持ちですか？</div>
        <div className="ob-opts">
          {PROFILES.car.map(opt => (
            <button key={opt.value} className={"ob-opt" + (car===opt.value?" ob-opt-sel":"")}
              onClick={() => { setCar(opt.value); setScreen("q2"); }}>
              <span className="ob-opt-label">{opt.label}</span>
              <span className="ob-opt-note">{opt.note}</span>
            </button>
          ))}
        </div>
      </div>
    </Wrap>
  );

  if (screen === "q2") return (
    <Wrap>
      <div className="ob-step">
        <div className="ob-step-head"><span className="ob-step-num">Step 03 / 03</span><Pips n={3}/></div>
        <div className="ob-q">ペットはいますか？</div>
        <div className="ob-opts">
          {PROFILES.pet.map(opt => (
            <button key={opt.value} className={"ob-opt" + (pet===opt.value?" ob-opt-sel":"")}
              onClick={() => { setPet(opt.value); setScreen("form"); }}>
              <span className="ob-opt-label">{opt.label}</span>
              <span className="ob-opt-note">{opt.note}</span>
            </button>
          ))}
        </div>
      </div>
    </Wrap>
  );

  return <FormScreen situation={situation} car={car} pet={pet} onComplete={onComplete} Wrap={Wrap}/>;
}


function TaskItem({ task, onToggle, onAsk, loading, ctx }) {
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleToggle = () => {
    if (!task.done) { setFlash(true); setTimeout(() => setFlash(false), 500); }
    onToggle(task.id);
  };

  // Compute deadline status
  const deadlineInfo = (() => {
    if (!task.deadlineDays || !ctx?.date) return null;
    const moving = new Date(ctx.date);
    const deadline = new Date(moving);
    deadline.setDate(moving.getDate() + task.deadlineDays);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.round((deadline - today) / 86400000);
    return { diff, label: task.deadlineLabel, urgent: task.urgent };
  })();

  const deadlineBadge = (() => {
    if (!deadlineInfo || task.done) return null;
    const { diff, label, urgent } = deadlineInfo;
    if (diff < 0) return { text: `期限超過 ${Math.abs(diff)}日`, color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
    if (diff === 0) return { text: "今日が期限", color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
    if (diff <= 3) return { text: `あと${diff}日`, color: "#d97706", bg: "rgba(217,119,6,0.1)" };
    if (diff <= 7) return { text: `あと${diff}日`, color: "#ca8a04", bg: "rgba(202,138,4,0.08)" };
    return { text: label, color: "#6b7280", bg: "rgba(107,114,128,0.07)" };
  })();

  return (
    <div className={`ti ${task.done?"ti-done":""} ${flash?"ti-flash":""}`}>
      <div className="ti-row" onClick={handleToggle}>
        <div className={`ti-box ${task.done?"ti-box-checked":""}`}>
          {task.done && (
            <svg viewBox="0 0 12 10" className="ti-check-svg">
              <polyline points="1,5 4.5,9 11,1" />
            </svg>
          )}
        </div>
        <div className="ti-body">
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span className="ti-name">{task.label}</span>
            {deadlineBadge && (
              <span style={{fontSize:10,fontWeight:700,color:deadlineBadge.color,background:deadlineBadge.bg,padding:"1px 6px",borderRadius:10,whiteSpace:"nowrap"}}>
                {deadlineBadge.text}
              </span>
            )}
          </div>
        </div>
        <button className="ti-toggle" onClick={e=>{e.stopPropagation();setOpen(!open);}}>
          <svg viewBox="0 0 10 6" className={`ti-chevron ${open?"ti-chevron-up":""}`}>
            <polyline points="0,0 5,6 10,0"/>
          </svg>
        </button>
      </div>

      {open && (
        <div className="ti-detail">
          <p className="ti-detail-text">{task.detail}</p>

          {deadlineInfo && !task.done && (
            <div style={{display:"flex",gap:6,alignItems:"flex-start",padding:"8px 10px",marginBottom:10,background:"rgba(192,57,43,0.05)",border:"1px solid rgba(192,57,43,0.15)",borderRadius:2}}>
              <span style={{fontSize:13,flexShrink:0}}>📅</span>
              <span style={{fontSize:12,color:"#C0392B",fontWeight:600}}>{deadlineInfo.label}</span>
            </div>
          )}

          <div className="ti-action-row">
            {task.link && (
              <a className="ti-link-btn" href={task.link} target="_blank" rel="noopener noreferrer">
                🔗 {task.linkLabel || "公式サイトで手続き"}
              </a>
            )}
            <button className="ti-ask-btn" onClick={()=>onAsk(task)} disabled={loading===task.id}>
              {loading===task.id ? "考え中…" : task.personalGuide ? "✦ あなたの場合を確認" : "AIにアドバイスを聞く"}
            </button>
          </div>
          {task.aiTip && (
            <div className="ti-ai-tip">
              <span className="ti-ai-badge">AI</span>
              <p className="ti-ai-text">{task.aiTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CHAT PANEL
// ─────────────────────────────────────────────
function ChatPanel({ ctx, onClose }) {
  const [msgs, setMsgs] = useState([{
    role:"assistant",
    content:`こんにちは。引越しのことなら何でも聞いてください。\n\n旧住所：${ctx.from||"未入力"}　→　新住所：${ctx.to||"未入力"}\n引越し日：${ctx.date||"未設定"}`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  const send = async () => {
    if (!input.trim()||loading) return;
    const user = {role:"user", content:input};
    const next = [...msgs, user];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const apiMsgs = next.map(m=>({role:m.role, content:m.content}));
      const reply = await callClaude(apiMsgs, `あなたは引越し手続きの専門アドバイザーです。ユーザー情報：旧住所=${ctx.from}、新住所=${ctx.to}、引越し日=${ctx.date}。丁寧かつ簡潔な日本語でアドバイスをしてください。`);
      setMsgs(p => [...p, {role:"assistant", content:reply}]);
    } catch {
      setMsgs(p => [...p, {role:"assistant", content:"エラーが発生しました。もう一度お試しください。"}]);
    }
    setLoading(false);
  };

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-panel" onClick={e=>e.stopPropagation()}>
        <div className="chat-head">
          <div className="chat-head-left">
            <div className="chat-ai-dot" />
            <span className="chat-head-title">AIアドバイザー</span>
          </div>
          <button className="chat-close" onClick={onClose}>✕</button>
        </div>
        <div className="chat-msgs">
          {msgs.map((m,i) => (
            <div key={i} className={`chat-bubble ${m.role==="user"?"cb-user":"cb-ai"}`}>
              {m.content.split("\n").map((l,j)=><span key={j}>{l}<br/></span>)}
            </div>
          ))}
          {loading && <div className="chat-typing"><span/><span/><span/></div>}
          <div ref={bottomRef}/>
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="例：転入届に必要な書類は？"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&send()}
          />
          <button className="chat-send" onClick={send} disabled={loading}>送信</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// TODAY PANEL
// ─────────────────────────────────────────────
function TodayPanel({ tasks, ctx, onPhaseSelect }) {
  const urgent = [];
  if (!ctx?.date) return null;
  const moving = new Date(ctx.date);
  const today = new Date(); today.setHours(0,0,0,0);

  for (const [phase, list] of Object.entries(tasks)) {
    for (const task of list) {
      if (task.done || !task.deadlineDays) continue;
      const deadline = new Date(moving);
      deadline.setDate(moving.getDate() + task.deadlineDays);
      const diff = Math.round((deadline - today) / 86400000);
      if (diff <= 7) {
        urgent.push({ ...task, diff, phase });
      }
    }
  }
  if (urgent.length === 0) return null;

  urgent.sort((a,b) => a.diff - b.diff);

  return (
    <div style={{margin:"0 0 20px",padding:"14px 16px",background:"rgba(192,57,43,0.06)",border:"1px solid rgba(192,57,43,0.2)",borderRadius:2,borderLeft:"3px solid #C0392B"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        <span style={{fontSize:13}}>⚠️</span>
        <span style={{fontSize:12,fontWeight:700,color:"#C0392B",letterSpacing:"0.04em"}}>期限が近い手続き</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {urgent.slice(0,3).map(t => (
          <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,cursor:"pointer"}}
            onClick={() => onPhaseSelect(t.phase)}>
            <span style={{fontSize:13,color:"#1C2B3A",flex:1}}>{t.label}</span>
            <span style={{
              fontSize:10,fontWeight:700,whiteSpace:"nowrap",padding:"2px 7px",borderRadius:10,
              color: t.diff < 0 ? "#dc2626" : t.diff <= 3 ? "#d97706" : "#6b7280",
              background: t.diff < 0 ? "rgba(220,38,38,0.1)" : t.diff <= 3 ? "rgba(217,119,6,0.1)" : "rgba(107,114,128,0.07)"
            }}>
              {t.diff < 0 ? `期限超過 ${Math.abs(t.diff)}日` : t.diff === 0 ? "今日が期限" : `あと${t.diff}日`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("onboarding");
  const [ctx, setCtx] = useState(null);
  const [tasks, setTasks] = useState({});
  const [activePhase, setActivePhase] = useState("before");
  const [aiLoading, setAiLoading] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    try {
      const s = localStorage.getItem("hks3");
      if (s) { const p = JSON.parse(s); setCtx(p.ctx); setTasks(p.tasks); setScreen("dashboard"); }
    } catch {}
  }, []);

  const save = useCallback((c, t) => {
    try { localStorage.setItem("hks3", JSON.stringify({ctx:c,tasks:t})); } catch {}
  }, []);

  const start = (data) => {
    const filtered = getFilteredTasks(data.profile);
    const init = {};
    for (const [k,v] of Object.entries(filtered)) {
      init[k] = v.map(t => ({...t, done:false, aiTip:null}));
    }
    setCtx(data); setTasks(init); save(data, init); setScreen("dashboard");
  };

  const toggle = (id) => {
    const next = {};
    for (const [k,v] of Object.entries(tasks)) next[k] = v.map(t => t.id===id ? {...t, done:!t.done} : t);
    setTasks(next); save(ctx, next);
  };

  const askAI = async (task) => {
    setAiLoading(task.id);
    try {
      const isPersonal = task.personalGuide;
      const prompt = isPersonal
        ? `引越し手続きの「${task.label}」について、以下のユーザー情報に基づいて「あなたの場合」の具体的な手順を教えてください。
旧住所：${ctx?.from || "不明"}
新住所：${ctx?.to || "不明"}
引越し日：${ctx?.date || "不明"}
家族構成：${ctx?.profile?.situation === "family" ? "家族あり" : ctx?.profile?.situation === "couple" ? "カップル/夫婦" : "一人暮らし"}
車：${ctx?.profile?.car === "car" ? "あり" : "なし"}

以下の形式で回答してください：
【いつ】具体的な期限や時期
【どこで】窓口やサイトの名前
【何を持っていく】必要書類・持ち物
【注意点】1〜2点`
        : `「${task.label}」の手続きについて、日本の引越しの文脈で実用的なアドバイスを3点以内で教えてください。旧住所：${ctx?.from}、新住所：${ctx?.to}。`;
      const tip = await callClaude(
        [{role:"user", content: prompt}],
        "あなたは日本の引越し手続きの専門家です。簡潔で実用的なアドバイスを日本語で提供してください。"
      );
      const next = {};
      for (const [k,v] of Object.entries(tasks)) next[k] = v.map(t => t.id===task.id ? {...t, aiTip:tip} : t);
      setTasks(next); save(ctx, next);
    } catch {}
    setAiLoading(null);
  };

  const reset = () => {
    localStorage.removeItem("hks3");
    setScreen("onboarding"); setCtx(null); setTasks({});
  };

  if (screen === "onboarding") return <><AppStyles/><Onboarding onComplete={start}/></>;

  const allFlat = Object.values(tasks).flat();
  const allDone = allFlat.filter(t=>t.done).length;
  const pct = allFlat.length ? Math.round(allDone/allFlat.length*100) : 0;
  const current = tasks[activePhase] || [];
  const phaseDone = current.filter(t=>t.done).length;

  const TaskList = () => (
    <>
      {(() => {
        const cats = [...new Set(current.map(t=>t.cat))];
        return cats.map(cat => {
          const items = current.filter(t=>t.cat===cat);
          return (
            <div key={cat} style={{marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{flex:1,height:1,background:"rgba(28,43,58,0.13)"}}/>
                <span style={{fontSize:10,fontWeight:700,color:"#8C8077",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>{cat}</span>
                <div style={{flex:1,height:1,background:"rgba(28,43,58,0.13)"}}/>
              </div>
              <div style={{border:"1px solid rgba(28,43,58,0.13)",borderRadius:2,overflow:"hidden",background:"white",boxShadow:"0 1px 8px rgba(28,43,58,0.08)"}}>
                {items.map(task => <TaskItem key={task.id} task={task} onToggle={toggle} onAsk={askAI} loading={aiLoading} ctx={ctx}/>)}
              </div>
            </div>
          );
        });
      })()}
      {allDone===allFlat.length && allFlat.length>0 && (
        <div style={{marginTop:22,padding:"22px 24px",background:"white",border:"1px solid rgba(28,43,58,0.13)",borderTop:"3px solid #C0392B",display:"flex",alignItems:"center",gap:18}}>
          <div style={{width:46,height:46,flexShrink:0,border:"2px solid #C0392B",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"serif",fontSize:17,fontWeight:700,color:"#C0392B"}}>完</div>
          <div>
            <p style={{fontSize:15,fontWeight:700,color:"#1C2B3A"}}>すべて完了しました</p>
            <p style={{fontSize:12,color:"#8C8077",marginTop:3}}>新しい生活のスタートをお祝い申し上げます。</p>
          </div>
        </div>
      )}
    </>
  );

  const NavItems = () => (
    <>
      {PHASES.map(ph => {
        const pt = tasks[ph.id]||[];
        const pd = pt.filter(t=>t.done).length;
        const full = pd===pt.length && pt.length>0;
        const active = activePhase===ph.id;
        return (
          <button key={ph.id}
            className={`sb-nav-item ${active?"sni-active":""} ${full?"sni-full":""}`}
            onClick={()=>setActivePhase(ph.id)}>
            <div className="sni-kanji">{ph.kanji}</div>
            <div className="sni-text">
              <span className="sni-label">{ph.label}</span>
              <span className="sni-sub">{ph.sub}</span>
            </div>
            <span className={`sni-badge ${full?"sni-badge-full":""}`}>{pd}/{pt.length}</span>
          </button>
        );
      })}
    </>
  );

  // ── MOBILE LAYOUT ──
  if (isMobile) return (
    <>
      <AppStyles/>
      <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"#F5F2ED"}}>
        <div style={{background:"#1C2B3A",color:"white",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:30,height:30,border:"1.5px solid #C0392B",borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:"serif",fontWeight:700,fontSize:14,color:"#C0392B"}}>引</span>
              </div>
              <span style={{fontFamily:"serif",fontSize:16,color:"white"}}>HikkoshiAI</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontFamily:"serif",fontSize:22,fontWeight:700,color:"white",lineHeight:1}}>{pct}<small style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>%</small></span>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{allDone}/{allFlat.length}</span>
            </div>
          </div>
          <div style={{height:2,background:"rgba(255,255,255,0.08)",margin:"10px 0 0"}}>
            <div style={{height:"100%",background:"#C0392B",width:`${pct}%`,transition:"width 0.5s"}}/>
          </div>
          <nav style={{display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch",padding:"4px 8px 0",gap:2}}>
            {PHASES.map(ph => {
              const pt = tasks[ph.id]||[];
              const pd = pt.filter(t=>t.done).length;
              const active = activePhase===ph.id;
              return (
                <button key={ph.id} onClick={()=>setActivePhase(ph.id)}
                  style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 10px 10px",background:"transparent",border:"none",borderBottom:`3px solid ${active?"#C0392B":"transparent"}`,color:active?"white":"rgba(255,255,255,0.45)",cursor:"pointer",minWidth:54,transition:"all 0.14s"}}>
                  <span style={{fontFamily:"serif",fontSize:16,fontWeight:700,lineHeight:1}}>{ph.kanji}</span>
                  <span style={{fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{ph.label}</span>
                  <span style={{fontSize:9,opacity:0.6,background:"rgba(255,255,255,0.1)",padding:"1px 5px",borderRadius:8}}>{pd}/{pt.length}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{padding:"16px 14px",flex:1}}>
          <TodayPanel tasks={tasks} ctx={ctx} onPhaseSelect={setActivePhase}/>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <span style={{fontFamily:"serif",fontSize:18,fontWeight:700,color:"#1C2B3A"}}>{PHASES.find(p=>p.id===activePhase)?.label}</span>
              <span style={{fontSize:11,color:"#8C8077",marginLeft:8}}>{PHASES.find(p=>p.id===activePhase)?.sub}</span>
            </div>
            <span style={{fontSize:11,color:"#8C8077"}}>{phaseDone}/{current.length} 完了</span>
          </div>
          <TaskList/>
        </div>

        <div style={{padding:"12px 14px",background:"#1C2B3A",display:"flex",gap:8,flexShrink:0}}>
          <button onClick={()=>setShowChat(true)}
            style={{flex:1,padding:"11px",background:"#C0392B",border:"none",borderRadius:2,color:"white",fontFamily:"sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            ✦ AIに質問する
          </button>
          <button onClick={reset}
            style={{padding:"11px 14px",background:"transparent",border:"1px solid rgba(255,255,255,0.15)",borderRadius:2,color:"rgba(255,255,255,0.4)",fontFamily:"sans-serif",fontSize:11,cursor:"pointer"}}>
            やり直す
          </button>
        </div>

        {showChat && <ChatPanel ctx={ctx||{}} onClose={()=>setShowChat(false)}/>}
      </div>
    </>
  );

  // ── DESKTOP LAYOUT ──
  return (
    <>
      <AppStyles/>
      <div className="app">
        <div className="bg-grid"/>
        <aside className="sidebar">
          <div className="sb-top">
            <div className="sb-brand">
              <div className="sb-seal"><span>引</span></div>
              <span className="sb-brand-name">HikkoshiAI</span>
            </div>
            <div className="sb-meta">
              {ctx?.date && <div className="sb-meta-row"><span className="sb-meta-lbl">日程</span><span className="sb-meta-val">{ctx.date}</span></div>}
              {ctx?.from && <div className="sb-meta-row"><span className="sb-meta-lbl">旧居</span><span className="sb-meta-val">{ctx.from}</span></div>}
              {ctx?.to   && <div className="sb-meta-row"><span className="sb-meta-lbl">新居</span><span className="sb-meta-val">{ctx.to}</span></div>}
            </div>
            <div className="sb-progress">
              <div className="sb-prog-top">
                <span className="sb-prog-pct">{pct}<small>%</small></span>
                <span className="sb-prog-label">{allDone} / {allFlat.length} 完了</span>
              </div>
              <div className="sb-prog-track">
                <div className="sb-prog-fill" style={{width:`${pct}%`}}/>
              </div>
            </div>
            <nav className="sb-nav"><NavItems/></nav>
          </div>
          <div className="sb-bottom">
            <button className="sb-chat-btn" onClick={()=>setShowChat(true)}>✦ &nbsp;AIに質問する</button>
            <button className="sb-reset" onClick={reset}>はじめからやり直す</button>
          </div>
        </aside>
        <main className="main">
          <div className="main-head">
            <div>
              <h2 className="main-title">{PHASES.find(p=>p.id===activePhase)?.label}</h2>
              <span className="main-sub">{PHASES.find(p=>p.id===activePhase)?.sub}</span>
            </div>
            <span className="main-count">{phaseDone} / {current.length} 完了</span>
          </div>
          <div className="main-body">
            <TodayPanel tasks={tasks} ctx={ctx} onPhaseSelect={setActivePhase}/>
            <TaskList/>
          </div>
        </main>
        {showChat && <ChatPanel ctx={ctx||{}} onClose={()=>setShowChat(false)}/>}
      </div>
    </>
  );
}

function AppStyles() {
  return <style>{css}</style>;
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Shippori+Mincho:wght@400;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ink:     #1C2B3A;
  --ink-mid: #364858;
  --paper:   #F5F2ED;
  --paper2:  #EDE9E1;
  --paper3:  #E4DFD6;
  --red:     #C0392B;
  --red2:    #A93226;
  --muted:   #8C8077;
  --border:  rgba(28,43,58,0.13);
  --sh:      0 1px 8px rgba(28,43,58,0.08), 0 4px 24px rgba(28,43,58,0.06);
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: 'Zen Kaku Gothic New', 'Hiragino Kaku Gothic Pro', 'Yu Gothic UI', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}

.bg-grid {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(28,43,58,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(28,43,58,0.045) 1px, transparent 1px);
  background-size: 28px 28px;
}

/* ═══════════════ ONBOARDING ═══════════════ */
.ob-root {
  min-height: 100vh; background: var(--paper);
  display: flex; align-items: center; justify-content: center; padding: 24px;
  position: relative;
}
.ob-bg-grid {
  position: fixed; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(28,43,58,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(28,43,58,0.05) 1px, transparent 1px);
  background-size: 24px 24px;
}
.ob-center { position: relative; z-index: 1; width: 100%; max-width: 420px; }

.ob-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.ob-seal {
  width: 54px; height: 54px;
  border: 2px solid var(--red); border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  position: relative; flex-shrink: 0;
  box-shadow: inset 0 0 0 3px rgba(192,57,43,0.1);
}
.ob-seal-kanji {
  font-family: 'Shippori Mincho', serif; font-weight: 700;
  font-size: 27px; color: var(--red); line-height: 1;
}
.ob-title {
  font-family: 'Shippori Mincho', serif; font-weight: 700;
  font-size: 24px; color: var(--ink); letter-spacing: 0.02em;
}
.ob-tagline { font-size: 12px; color: var(--muted); margin-top: 3px; letter-spacing: 0.04em; }

.ob-card {
  background: white; border: 1px solid var(--border);
  border-radius: 2px; padding: 30px 26px; box-shadow: var(--sh);
}

.ob-step { animation: stepIn 0.2s ease; }
@keyframes stepIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:none} }

.ob-step-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.ob-step-num { font-size: 11px; color: var(--muted); letter-spacing: 0.1em; font-weight: 700; }
.ob-step-track { display: flex; gap: 4px; }
.ob-pip { width: 22px; height: 2px; background: var(--paper3); border-radius: 1px; transition: background 0.2s; }
.ob-pip-on { background: var(--red); }

.ob-q { font-weight: 700; font-size: 16px; color: var(--ink); margin-bottom: 16px; letter-spacing: 0.01em; }

.ob-opts { display: flex; flex-direction: column; gap: 7px; }
.ob-opt {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 15px;
  background: var(--paper); border: 1.5px solid var(--border); border-radius: 2px;
  cursor: pointer; transition: all 0.14s;
  font-family: 'Zen Kaku Gothic New';
}
.ob-opt:hover { border-color: var(--ink); background: white; }
.ob-opt-sel { background: var(--ink); border-color: var(--ink); color: white; }
.ob-opt-sel .ob-opt-note { color: rgba(255,255,255,0.45); }
.ob-opt-label { font-weight: 700; font-size: 14px; }
.ob-opt-note { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; }

.ob-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
.ob-field { display: flex; flex-direction: column; gap: 5px; }
.ob-field-label { font-size: 11px; color: var(--muted); font-weight: 700; letter-spacing: 0.06em; }
.ob-input {
  padding: 10px 12px;
  border: 1.5px solid var(--border); border-radius: 2px;
  background: var(--paper); color: var(--ink);
  font-family: 'Zen Kaku Gothic New'; font-size: 14px;
  outline: none; transition: border 0.14s;
}
.ob-input:focus { border-color: var(--ink); background: white; }
input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }

.ob-submit {
  width: 100%; padding: 13px;
  background: var(--paper2); border: 1.5px solid var(--border); border-radius: 2px;
  color: var(--muted); font-family: 'Zen Kaku Gothic New'; font-size: 14px; font-weight: 700;
  cursor: not-allowed; transition: all 0.18s;
}
.ob-submit-on { background: var(--ink); border-color: var(--ink); color: white; cursor: pointer; }
.ob-submit-on:hover { background: var(--ink-mid); }
.ob-footer { text-align: center; font-size: 11px; color: var(--muted); margin-top: 14px; }

/* ═══════════════ APP SHELL ═══════════════ */
.app { display: flex; height: 100vh; overflow: hidden; position: relative; }

/* ═══════════════ SIDEBAR ═══════════════ */
.sidebar {
  width: 244px; flex-shrink: 0;
  background: var(--ink); color: white;
  display: flex; flex-direction: column;
  position: relative; z-index: 2;
  box-shadow: 2px 0 16px rgba(28,43,58,0.15);
}
.sb-top { flex: 1; overflow-y: auto; }


.sb-brand {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 18px 14px; border-bottom: 1px solid rgba(255,255,255,0.07);
}
.sb-seal {
  width: 32px; height: 32px;
  border: 1.5px solid var(--red); border-radius: 2px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sb-seal span { font-family: 'Shippori Mincho', serif; font-weight: 700; font-size: 16px; color: var(--red); line-height: 1; }
.sb-brand-name { font-family: 'Shippori Mincho', serif; font-size: 17px; color: white; letter-spacing: 0.02em; }

.sb-meta {
  padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; flex-direction: column; gap: 5px;
}
.sb-meta-row { display: flex; gap: 8px; align-items: baseline; }
.sb-meta-lbl { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 0.04em; min-width: 22px; }
.sb-meta-val { font-size: 12px; color: rgba(255,255,255,0.6); word-break: break-all; }

.sb-progress { padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); }
.sb-prog-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
.sb-prog-pct { font-family: 'Shippori Mincho', serif; font-size: 30px; font-weight: 700; color: white; line-height: 1; }
.sb-prog-pct small { font-size: 14px; color: rgba(255,255,255,0.45); margin-left: 1px; }
.sb-prog-label { font-size: 11px; color: rgba(255,255,255,0.38); }
.sb-prog-track { height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; }
.sb-prog-fill { height: 100%; background: var(--red); border-radius: 1px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }

.sb-nav { padding: 8px 0; }
.sb-nav-item {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 9px 18px; background: transparent; border: none; border-right: 3px solid transparent;
  color: rgba(255,255,255,0.42); cursor: pointer; transition: all 0.14s;
  font-family: 'Zen Kaku Gothic New'; text-align: left;
}
.sb-nav-item:hover { color: rgba(255,255,255,0.72); background: rgba(255,255,255,0.04); }
.sni-active { color: white !important; background: rgba(255,255,255,0.07) !important; border-right-color: var(--red) !important; }

.sni-kanji {
  width: 26px; height: 26px; flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.12); border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Shippori Mincho', serif; font-size: 12px; font-weight: 700;
  color: rgba(255,255,255,0.3); transition: all 0.14s;
}
.sni-active .sni-kanji { border-color: rgba(192,57,43,0.6); color: #e67e73; }
.sni-full .sni-kanji { border-color: rgba(192,57,43,0.4); color: rgba(192,57,43,0.7); }

.sni-text { flex: 1; display: flex; flex-direction: column; }
.sni-label { font-size: 13px; font-weight: 700; line-height: 1.3; }
.sni-sub { font-size: 10px; color: rgba(255,255,255,0.28); margin-top: 1px; }

.sni-badge {
  font-size: 10px; padding: 2px 6px;
  background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.38);
  border-radius: 10px; font-variant-numeric: tabular-nums;
}
.sni-badge-full { background: rgba(192,57,43,0.2); color: rgba(224,100,87,0.9); }

.sb-bottom { padding: 12px 18px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 7px; }
.sb-chat-btn {
  padding: 10px 14px; background: var(--red); border: none; border-radius: 2px;
  color: white; font-family: 'Zen Kaku Gothic New'; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 0.14s; letter-spacing: 0.02em;
}
.sb-chat-btn:hover { background: var(--red2); }
.sb-reset {
  padding: 7px; background: transparent;
  border: 1px solid rgba(255,255,255,0.1); border-radius: 2px;
  color: rgba(255,255,255,0.28); font-family: 'Zen Kaku Gothic New'; font-size: 11px; cursor: pointer; transition: all 0.14s;
}
.sb-reset:hover { border-color: rgba(255,255,255,0.22); color: rgba(255,255,255,0.52); }

/* ═══════════════ MAIN ═══════════════ */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; z-index: 1; }
.main-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 30px 16px; border-bottom: 1px solid var(--border);
  background: rgba(245,242,237,0.95); backdrop-filter: blur(4px);
}
.main-title { font-family: 'Shippori Mincho', serif; font-size: 20px; font-weight: 700; color: var(--ink); }
.main-sub { font-size: 12px; color: var(--muted); margin-left: 10px; }
.main-count { font-size: 12px; color: var(--muted); white-space: nowrap; }
.main-body { flex: 1; overflow-y: auto; padding: 22px 30px 40px; }

/* ═══════════════ CATEGORY GROUP ═══════════════ */
.cat-group { margin-bottom: 26px; }
.cat-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.cat-line { flex: 1; height: 1px; background: var(--border); }
.cat-name { font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: 0.08em; white-space: nowrap; }
.cat-tasks { border: 1px solid var(--border); border-radius: 2px; overflow: hidden; background: white; box-shadow: var(--sh); }

/* ═══════════════ TASK ITEM ═══════════════ */
.ti { border-bottom: 1px solid rgba(28,43,58,0.07); transition: background 0.12s; }
.ti:last-child { border-bottom: none; }
.ti-done { background: rgba(28,43,58,0.015); }
@keyframes inkPop { 0%{background:rgba(192,57,43,0.06)} 100%{background:transparent} }
.ti-flash { animation: inkPop 0.45s ease; }

.ti-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; transition: background 0.1s; }
.ti-row:hover { background: rgba(28,43,58,0.025); }

.ti-box {
  width: 17px; height: 17px; flex-shrink: 0;
  border: 1.5px solid rgba(28,43,58,0.22); border-radius: 2px;
  display: flex; align-items: center; justify-content: center; transition: all 0.14s;
}
.ti-box-checked { background: var(--ink); border-color: var(--ink); }
.ti-check-svg { width: 10px; height: 8px; fill: none; stroke: white; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

.ti-body { flex: 1; }
.ti-name { font-size: 13px; font-weight: 500; color: var(--ink); line-height: 1.4; }
.ti-done .ti-name { text-decoration: line-through; color: var(--muted); }

.ti-toggle { background: none; border: none; cursor: pointer; padding: 4px 6px; color: var(--muted); }
.ti-chevron { width: 9px; height: 6px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; display: block; transition: transform 0.18s; }
.ti-chevron-up { transform: rotate(180deg); }

.ti-detail {
  padding: 12px 14px 14px 43px;
  background: var(--paper); border-top: 1px solid rgba(28,43,58,0.07);
  animation: detailOpen 0.16s ease;
}
@keyframes detailOpen { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:none} }
.ti-detail-text { font-size: 13px; color: var(--ink-mid); line-height: 1.75; margin-bottom: 10px; }

.ti-ai-tip {
  display: flex; gap: 9px; align-items: flex-start;
  padding: 10px 12px; margin-bottom: 10px;
  background: white; border: 1px solid var(--border);
  border-left: 3px solid var(--red); border-radius: 0 2px 2px 0;
}
.ti-ai-badge {
  font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
  color: var(--red); border: 1px solid var(--red);
  padding: 1px 5px; flex-shrink: 0; margin-top: 3px; line-height: 1.5;
}
.ti-ai-text { font-size: 12px; color: var(--ink-mid); line-height: 1.75; white-space: pre-wrap; }

.ti-action-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 0; }
.ti-link-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 13px; background: var(--red);
  border: none; border-radius: 2px;
  color: white; font-family: 'Zen Kaku Gothic New'; font-size: 12px;
  text-decoration: none; cursor: pointer; transition: background 0.14s;
  font-weight: 700;
}
.ti-link-btn:hover { background: var(--red2); }
.ti-ask-btn {
  padding: 6px 13px; background: transparent;
  border: 1px solid var(--border); border-radius: 2px;
  color: var(--muted); font-family: 'Zen Kaku Gothic New'; font-size: 12px;
  cursor: pointer; transition: all 0.14s;
}
.ti-ask-btn:hover { border-color: var(--ink); color: var(--ink); background: white; }
.ti-ask-btn:disabled { opacity: 0.5; cursor: default; }

/* ═══════════════ COMPLETE ═══════════════ */
.complete-banner {
  margin-top: 22px; padding: 22px 24px;
  background: white; border: 1px solid var(--border);
  border-top: 3px solid var(--red); border-radius: 0 0 2px 2px;
  display: flex; align-items: center; gap: 18px; box-shadow: var(--sh);
}
.complete-seal {
  width: 46px; height: 46px; flex-shrink: 0;
  border: 2px solid var(--red); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Shippori Mincho', serif; font-size: 17px; font-weight: 700; color: var(--red);
}
.complete-title { font-size: 15px; font-weight: 700; color: var(--ink); }
.complete-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }

/* ═══════════════ CHAT ═══════════════ */
.chat-overlay {
  position: fixed; inset: 0; background: rgba(28,43,58,0.35); z-index: 200;
  display: flex; align-items: flex-end; justify-content: flex-end; padding: 20px;
}
.chat-panel {
  width: 348px; height: 490px; background: white;
  border: 1px solid var(--border); border-radius: 2px;
  display: flex; flex-direction: column;
  box-shadow: 0 16px 48px rgba(28,43,58,0.18);
  animation: chatIn 0.18s ease;
}
@keyframes chatIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

.chat-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 15px; border-bottom: 1px solid var(--border); background: var(--paper);
}
.chat-head-left { display: flex; align-items: center; gap: 8px; }
.chat-ai-dot { width: 7px; height: 7px; background: var(--red); border-radius: 50%; }
.chat-head-title { font-size: 13px; font-weight: 700; color: var(--ink); }
.chat-close { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 3px 6px; }

.chat-msgs { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 9px; }
.chat-bubble { max-width: 84%; padding: 9px 12px; font-size: 13px; line-height: 1.65; border-radius: 2px; }
.cb-user { background: var(--ink); color: white; align-self: flex-end; }
.cb-ai { background: var(--paper); border: 1px solid var(--border); color: var(--ink); align-self: flex-start; }

.chat-typing { display: flex; gap: 4px; padding: 10px 14px; align-self: flex-start; }
.chat-typing span { width: 5px; height: 5px; background: var(--muted); border-radius: 50%; animation: bounce 1s infinite; }
.chat-typing span:nth-child(2) { animation-delay: 0.16s; }
.chat-typing span:nth-child(3) { animation-delay: 0.32s; }
@keyframes bounce { 0%,60%,100%{transform:none} 30%{transform:translateY(-4px)} }

.chat-input-row { display: flex; gap: 7px; padding: 11px; border-top: 1px solid var(--border); }
.chat-input {
  flex: 1; padding: 8px 11px; border: 1px solid var(--border); border-radius: 2px;
  background: var(--paper); color: var(--ink);
  font-family: 'Zen Kaku Gothic New'; font-size: 13px; outline: none; transition: border 0.13s;
}
.chat-input:focus { border-color: var(--ink); background: white; }
.chat-send {
  padding: 8px 15px; background: var(--ink); border: none; border-radius: 2px;
  color: white; font-family: 'Zen Kaku Gothic New'; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: background 0.13s;
}
.chat-send:hover { background: var(--ink-mid); }
.chat-send:disabled { opacity: 0.5; cursor: default; }

/* ═══════════════ SCROLLBAR ═══════════════ */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(28,43,58,0.14); border-radius: 2px; }

/* ═══════════════ MOBILE ═══════════════ */
@media (max-width: 768px) {
  .app { flex-direction: column; height: auto; min-height: 100vh; overflow-y: auto; overflow-x: hidden; }
  .sidebar { width: 100%; flex-shrink: 0; box-shadow: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .sb-top { overflow-y: visible; }
  .sb-meta { display: none; }
  .sb-progress { padding: 10px 16px; }
  .sb-prog-pct { font-size: 22px; }
  .sb-nav { display: flex; flex-direction: row; overflow-x: auto; padding: 6px 10px; gap: 4px; white-space: nowrap; -webkit-overflow-scrolling: touch; }
  .sb-nav-item { flex-direction: column; align-items: center; padding: 8px 10px; gap: 3px; border-right: none; border-bottom: 3px solid transparent; min-width: 58px; flex-shrink: 0; }
  .sni-active { border-bottom: 3px solid var(--red); }
  .sni-kanji { width: 26px; height: 26px; }
  .sni-text { align-items: center; }
  .sni-label { font-size: 11px; }
  .sni-sub { display: none; }
  .sni-badge { font-size: 9px; padding: 1px 4px; }
  .sb-bottom { flex-direction: row; gap: 8px; padding: 10px 16px; }
  .sb-chat-btn { flex: 1; }
  .sb-reset { flex-shrink: 0; font-size: 10px; }
  .main { flex: none; width: 100%; overflow: visible; height: auto; }
  .main-head { padding: 14px 16px 12px; position: sticky; top: 0; z-index: 10; background: rgba(245,242,237,0.97); }
  .main-title { font-size: 16px; }
  .main-sub { font-size: 11px; }
  .main-body { padding: 14px 16px 60px; overflow: visible; height: auto; flex: none; }
  .ti-row { padding: 12px; }
  .ti-detail { padding: 10px 12px 14px 40px; }
  .ti-action-row { flex-direction: column; }
  .ti-link-btn, .ti-ask-btn { width: 100%; justify-content: center; text-align: center; }
  .chat-panel { width: 100%; height: 90vh; border-radius: 8px 8px 0 0; }
  .chat-overlay { padding: 0; align-items: flex-end; }
  .complete-banner { padding: 16px; gap: 12px; }
}
`;
