/* Additional screens — Direction B (Sharp) */

/* shared compact sidebar + topbar wrapper */
function Shell({ themeClass, active, children }) {
  return (
    <div className={`dash ${themeClass}`} style={{['--sidebar-w']: '72px'}}>
      <Sidebar collapsed={true}/>
      <main className="main">
        <div className="topbar">
          <div className="crumbs">
            <span>Платформа</span>
            <span className="sep">/</span>
            <span>Учебный процесс</span>
            <span className="sep">/</span>
            <span className="now">{active}</span>
          </div>
          <div className="search">
            <Ic d={icons.search} size={14}/>
            <span>Поиск по всему разделу…</span>
            <kbd>⌘K</kbd>
          </div>
          <div className="tb-btn"><Ic d={icons.filter} size={15}/></div>
          <div className="tb-btn">
            <Ic d={icons.bell} size={15}/>
            <span className="dot"/>
          </div>
        </div>
        {children}
        <div className="footer-rail">
          <span>ЭДУЛАЙН · {active.toUpperCase()}</span>
          <span>СИНХР. 14:03 · API V2.4.1</span>
        </div>
      </main>
    </div>
  );
}

/* ─── STUDENTS ─────────────────────────────────────── */
const STUDENTS = [
  { id:'S-04812', n:'Колесникова Алиса',   gr:'22-ИС-04',  pr:'Прикладная информатика', avg:9.2, pct:92, st:'Активный',     last:'2 мин назад' },
  { id:'S-04811', n:'Мартынов Илья',       gr:'21-БИ-02',  pr:'Биоинженерия',           avg:8.7, pct:88, st:'Активный',     last:'18 мин' },
  { id:'S-04810', n:'Соколов Артём',       gr:'23-ЭК-01',  pr:'Экономика',              avg:8.4, pct:76, st:'Сессия',       last:'1 ч' },
  { id:'S-04809', n:'Прохорова Мария',     gr:'22-ЛГ-01',  pr:'Лингвистика',            avg:9.0, pct:84, st:'Активный',     last:'2 ч' },
  { id:'S-04808', n:'Журавлёв Даниил',     gr:'20-ИС-03',  pr:'Прикладная информатика', avg:8.1, pct:96, st:'Диплом',       last:'4 ч' },
  { id:'S-04807', n:'Гончарова Виктория',  gr:'23-МД-02',  pr:'Медицина',               avg:7.8, pct:64, st:'Активный',     last:'5 ч' },
  { id:'S-04806', n:'Лебедев Кирилл',      gr:'21-ЮР-01',  pr:'Юриспруденция',          avg:8.6, pct:80, st:'Активный',     last:'вчера' },
  { id:'S-04805', n:'Никонова Дарья',      gr:'22-ХМ-01',  pr:'Химия',                  avg:9.4, pct:91, st:'Активный',     last:'вчера' },
  { id:'S-04804', n:'Орлов Сергей',        gr:'23-ИС-01',  pr:'Прикладная информатика', avg:7.2, pct:58, st:'На контроле',  last:'2 дн' },
  { id:'S-04803', n:'Терентьев Глеб',      gr:'22-ИС-04',  pr:'Прикладная информатика', avg:8.9, pct:88, st:'Активный',     last:'2 дн' },
  { id:'S-04802', n:'Шарапова Анна',       gr:'21-ЛТ-01',  pr:'Литература',             avg:9.1, pct:90, st:'Активный',     last:'3 дн' },
  { id:'S-04801', n:'Хабиров Ринат',       gr:'20-ИС-03',  pr:'Прикладная информатика', avg:8.3, pct:82, st:'Диплом',       last:'3 дн' },
];

function StatusDot({ s }) {
  const map = {
    'Активный':    'var(--pos)',
    'Сессия':      'var(--accent)',
    'Диплом':      'var(--fg)',
    'На контроле': 'var(--neg)',
  };
  return <span className="dot-status" style={{background: map[s]}}/>;
}

function StudentsScreen({ themeClass }) {
  return (
    <Shell themeClass={themeClass} active="Студенты">
      <div className="eyebrow">
        <span className="idx">№ 002 — РЕЕСТР</span>
        <span className="meta">12 845 АКТИВНЫХ · 312 ЗАЯВОК · 48 НА КОНТРОЛЕ</span>
      </div>
      <h1 className="h-title">Студенты — <em>12 845</em><br/><span className="ital">персональных</span> траекторий.</h1>
      <p className="h-sub">Объединённый реестр по 38 учреждениям. Фильтрация по программе, группе, статусу и активности. Двойной клик — открыть карточку.</p>

      {/* filter strip */}
      <div className="kpi-row" style={{gridTemplateColumns:'repeat(6, 1fr)'}}>
        {[
          ['ВСЕГО','12 845','+4,2%','up'],
          ['АКТИВНЫЕ','11 924','+3,1%','up'],
          ['СЕССИЯ','548','—',''],
          ['ДИПЛОМ','325','+18','up'],
          ['НА КОНТРОЛЕ','48','−6','up'],
          ['ОТЧИСЛЕНЫ','12','+2','dn'],
        ].map(([l,v,d,t],i)=>(
          <div key={i} className="kpi" style={{minHeight:120}}>
            <div className="kpi-head"><span>{l}</span>{d!=='—' && <span className={`delta ${t}`}>{d}</span>}</div>
            <div className="kpi-num" style={{fontSize:36}}>{v}</div>
          </div>
        ))}
      </div>

      <section className="sec">
        <div className="sec-head">
          <span className="idx">02</span>
          <span className="ttl">Реестр студентов</span>
          <span className="sub">— 12 из 12 845, сортировка по обновлению</span>
          <span className="right">
            <span className="chip on">Все</span>
            <span className="chip">Активные</span>
            <span className="chip">Сессия</span>
            <span className="chip">Контроль</span>
            <span className="chip"><Ic d={icons.download} size={11}/> CSV</span>
          </span>
        </div>

        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--hair)'}}>
                {['ID','СТУДЕНТ','ГРУППА','ПРОГРАММА','СРЕДНИЙ БАЛЛ','ПРОГРЕСС','СТАТУС','АКТИВНОСТЬ',''].map((h,i)=>(
                  <th key={i} style={{
                    textAlign: i===4||i===5 ? 'right' : 'left',
                    padding:'14px 18px',
                    fontSize:10,
                    letterSpacing:'0.12em',
                    color:'var(--mute)',
                    fontWeight:500,
                    fontFamily:'var(--font-mono)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STUDENTS.map((r,i)=>(
                <tr key={r.id} style={{borderBottom: i<STUDENTS.length-1 ? '1px solid var(--hair)' : 'none'}}>
                  <td style={{padding:'14px 18px', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--mute)'}}>{r.id}</td>
                  <td style={{padding:'14px 18px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <span className="avatar" style={{width:26, height:26, fontSize:10}}>
                        {r.n.split(' ').map(p=>p[0]).join('').slice(0,2)}
                      </span>
                      {r.n}
                    </div>
                  </td>
                  <td style={{padding:'14px 18px', color:'var(--mute)', fontFamily:'var(--font-mono)', fontSize:11.5}}>{r.gr}</td>
                  <td style={{padding:'14px 18px', color:'var(--mute)'}}>{r.pr}</td>
                  <td style={{padding:'14px 18px', textAlign:'right', fontFamily:'var(--font-mono)', fontVariantNumeric:'tabular-nums'}}>
                    <span style={{color: r.avg>=9 ? 'var(--accent)' : r.avg<8 ? 'var(--neg)' : 'var(--fg)'}}>
                      {r.avg.toFixed(1)}
                    </span>
                  </td>
                  <td style={{padding:'14px 18px', width:160}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <span className="bar-track" style={{flex:1}}>
                        <span className="bar-fill" style={{width:`${r.pct}%`, background: r.pct<70?'var(--neg)':'var(--accent)'}}/>
                      </span>
                      <span style={{fontFamily:'var(--font-mono)', color:'var(--mute)', fontSize:11, minWidth:28, textAlign:'right'}}>{r.pct}%</span>
                    </div>
                  </td>
                  <td style={{padding:'14px 18px'}}>
                    <span className="row" style={{fontSize:12}}><StatusDot s={r.st}/> {r.st}</span>
                  </td>
                  <td style={{padding:'14px 18px', color:'var(--mute)', fontSize:11.5}}>{r.last}</td>
                  <td style={{padding:'14px 18px', textAlign:'right', color:'var(--mute)'}}><Ic d={icons.more} size={16}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18, fontSize:11.5, color:'var(--mute)'}}>
          <span style={{fontFamily:'var(--font-mono)'}}>1 — 12 из 12 845</span>
          <div style={{display:'flex', gap:6}}>
            <span className="chip">←</span>
            {['1','2','3','…','1071'].map((p,i)=>(
              <span key={i} className={`chip ${p==='1'?'on':''}`}>{p}</span>
            ))}
            <span className="chip">→</span>
          </div>
        </div>
      </section>
    </Shell>
  );
}

/* ─── PROGRAMS ─────────────────────────────────────── */
const PROGRAMS = [
  { code:'01.03.02', n:'Прикладная информатика', fac:'Институт IT',           dur:'4 года', st:'Бакалавриат', s:842, prog:78, rate:9.1, status:'Активна', tags:['Очно','Бюджет','Платно'] },
  { code:'03.04.02', n:'Биомедицинская инженерия', fac:'Институт био',         dur:'2 года', st:'Магистратура', s:184, prog:62, rate:8.7, status:'Активна', tags:['Очно','Платно'] },
  { code:'40.03.01', n:'Юриспруденция',          fac:'Юридический ф-т',       dur:'4 года', st:'Бакалавриат', s:512, prog:84, rate:8.4, status:'Активна', tags:['Очно','Заочно','Бюджет'] },
  { code:'38.03.01', n:'Экономика',              fac:'Экономический ф-т',     dur:'4 года', st:'Бакалавриат', s:728, prog:71, rate:8.2, status:'Активна', tags:['Очно','Платно'] },
  { code:'45.03.02', n:'Лингвистика',            fac:'Гуманитарный ф-т',      dur:'4 года', st:'Бакалавриат', s:298, prog:68, rate:8.9, status:'Активна', tags:['Очно','Бюджет'] },
  { code:'31.05.01', n:'Лечебное дело',          fac:'Медицинский институт',  dur:'6 лет',  st:'Специалитет', s:432, prog:54, rate:8.3, status:'Активна', tags:['Очно','Бюджет'] },
  { code:'07.04.04', n:'Градостроительство',     fac:'Архитектурный ф-т',     dur:'2 года', st:'Магистратура', s:64,  prog:42, rate:8.5, status:'На доработке', tags:['Очно'] },
  { code:'09.04.04', n:'Программная инженерия',  fac:'Институт IT',           dur:'2 года', st:'Магистратура', s:216, prog:88, rate:9.3, status:'Активна', tags:['Очно','Платно'] },
];

function ProgramCard({ p, large }) {
  const onCtrl = p.status === 'На доработке';
  return (
    <div className="card" style={{display:'flex', flexDirection:'column', gap:18, gridColumn: large?'span 2':undefined}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div>
          <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--mute)', letterSpacing:'0.04em'}}>
            {p.code} · {p.st}
          </div>
          <div style={{fontSize: large ? 28 : 20, fontWeight:500, marginTop:6, letterSpacing:'-0.015em', lineHeight:1.15}}>
            {p.n}
          </div>
          <div style={{fontSize:12, color:'var(--mute)', marginTop:4}}>{p.fac} · {p.dur}</div>
        </div>
        <span className="tag" style={{
          fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em',
          padding:'4px 9px', border:'1px solid var(--hair)', borderRadius:999,
          color: onCtrl ? 'var(--neg)' : 'var(--pos)',
          borderColor: onCtrl ? 'var(--neg-line)' : 'var(--pos-line)',
        }}>{p.status}</span>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14, borderTop:'1px solid var(--hair)', borderBottom:'1px solid var(--hair)', padding:'14px 0'}}>
        {[
          ['СТУДЕНТОВ', p.s.toLocaleString('ru-RU')],
          ['ВЫПОЛНЕНО', `${p.prog}%`],
          ['СР. БАЛЛ',  p.rate.toFixed(1)],
        ].map(([l,v],i)=>(
          <div key={i}>
            <div style={{fontSize:10, color:'var(--mute)', letterSpacing:'0.12em'}}>{l}</div>
            <div style={{fontSize: large?28:22, fontWeight:300, marginTop:4, letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums'}}>{v}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{fontSize:10, color:'var(--mute)', letterSpacing:'0.12em', marginBottom:8}}>ВЫПОЛНЕНИЕ ПЛАНА</div>
        <div className="bar-track" style={{height:4}}>
          <div className="bar-fill" style={{width:`${p.prog}%`}}/>
        </div>
      </div>

      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
        {p.tags.map((t,i)=>(<span key={i} className="chip">{t}</span>))}
      </div>
    </div>
  );
}

function ProgramsScreen({ themeClass }) {
  return (
    <Shell themeClass={themeClass} active="Программы">
      <div className="eyebrow">
        <span className="idx">№ 003 — КАТАЛОГ</span>
        <span className="meta">84 ПРОГРАММЫ · 38 УЧРЕЖДЕНИЙ · 7 НАПРАВЛЕНИЙ</span>
      </div>
      <h1 className="h-title"><em>84</em> программы<br/><span className="ital">подготовки</span>.</h1>
      <p className="h-sub">Реестр образовательных программ всех уровней. От бакалавриата до программ дополнительного профессионального образования. Можно фильтровать по форме обучения, направлению, источнику финансирования.</p>

      <div className="kpi-row">
        {[
          ['БАКАЛАВРИАТ','42','50%'],
          ['МАГИСТРАТУРА','24','29%'],
          ['СПЕЦИАЛИТЕТ','8','9%'],
          ['ДПО','10','12%'],
        ].map(([l,v,p],i)=>(
          <div key={i} className="kpi">
            <div className="kpi-head"><span>{l}</span><span className="chip" style={{padding:'2px 7px'}}>{p}</span></div>
            <div className="kpi-num">{v}</div>
            <div className="kpi-foot"><span>программ</span></div>
          </div>
        ))}
      </div>

      <section className="sec">
        <div className="sec-head">
          <span className="idx">02</span>
          <span className="ttl">Все программы</span>
          <span className="sub">— карточный вид · сортировка по числу студентов</span>
          <span className="right">
            <span className="chip on">Все 84</span>
            <span className="chip">Активные</span>
            <span className="chip">На доработке</span>
            <span className="chip">Архив</span>
          </span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20}}>
          <ProgramCard p={PROGRAMS[0]} large/>
          {PROGRAMS.slice(1).map((p,i)=>(<ProgramCard key={i} p={p}/>))}
        </div>
      </section>
    </Shell>
  );
}

/* ─── APPLICATIONS — KANBAN ─────────────────────────── */
const COLS = [
  { id:'new',    label:'Новые',           count:42, items:[
    { id:'A-2841', n:'Колесникова А.', pr:'Прикл. информатика', d:'12 мая', who:'Очно · бюджет', warn:false },
    { id:'A-2840', n:'Терентьев Г.',  pr:'Биоинженерия',        d:'12 мая', who:'Очно · бюджет', warn:false },
    { id:'A-2839', n:'Иванов П.',     pr:'Юриспруденция',       d:'11 мая', who:'Очно · платно', warn:false },
    { id:'A-2838', n:'Гончарова В.',  pr:'Медицина',            d:'11 мая', who:'Очно · бюджет', warn:true  },
  ]},
  { id:'review', label:'На проверке',     count:124, items:[
    { id:'A-2835', n:'Сергеева М.', pr:'Лингвистика',  d:'10 мая', who:'Заочно · платно', warn:false },
    { id:'A-2834', n:'Лебедев К.',  pr:'Экономика',     d:'10 мая', who:'Очно · бюджет', warn:false },
    { id:'A-2833', n:'Хабиров Р.',  pr:'Программная инж.', d:'09 мая', who:'Очно · платно', warn:false },
  ]},
  { id:'docs',   label:'Документы',       count:88, items:[
    { id:'A-2828', n:'Никонова Д.', pr:'Химия',         d:'08 мая', who:'Очно · бюджет', warn:false },
    { id:'A-2827', n:'Орлов С.',     pr:'История',       d:'08 мая', who:'Заочно · платно', warn:true },
    { id:'A-2826', n:'Журавлёв Д.',  pr:'Архитектура',   d:'07 мая', who:'Очно · бюджет', warn:false },
    { id:'A-2825', n:'Соколов А.',   pr:'Биология',      d:'07 мая', who:'Очно · бюджет', warn:false },
  ]},
  { id:'interview', label:'Собеседование', count:24, items:[
    { id:'A-2818', n:'Мартынов И.', pr:'Магистратура · биоинж.', d:'06 мая', who:'Очно', warn:false },
    { id:'A-2817', n:'Прохорова М.', pr:'Аспирантура · лит.',     d:'06 мая', who:'Очно', warn:false },
  ]},
  { id:'accept', label:'Зачислено',       count:34, items:[
    { id:'A-2811', n:'Шарапова А.', pr:'Литература', d:'05 мая', who:'Очно · бюджет', warn:false },
    { id:'A-2810', n:'Тимофеев Е.', pr:'Социология', d:'04 мая', who:'Очно · платно', warn:false },
  ]},
];

function KanbanCard({ c }) {
  return (
    <div style={{
      border:'1px solid var(--hair)',
      borderRadius:10,
      padding:14,
      background:'var(--bg)',
      display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{display:'flex', justifyContent:'space-between', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--mute)', letterSpacing:'0.04em'}}>
        <span>{c.id}</span>
        <span>{c.d}</span>
      </div>
      <div style={{fontSize:13.5, fontWeight:500, letterSpacing:'-0.005em'}}>{c.n}</div>
      <div style={{fontSize:11.5, color:'var(--mute)'}}>{c.pr}</div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4, paddingTop:8, borderTop:'1px solid var(--hair)'}}>
        <span style={{fontSize:10.5, color:'var(--mute)', textTransform:'uppercase', letterSpacing:'0.08em'}}>{c.who}</span>
        {c.warn && <span className="dot-status" style={{background:'var(--neg)'}}/>}
      </div>
    </div>
  );
}

function ApplicationsScreen({ themeClass }) {
  return (
    <Shell themeClass={themeClass} active="Заявки">
      <div className="eyebrow">
        <span className="idx">№ 004 — ПОТОК</span>
        <span className="meta">312 В РАБОТЕ · 4 ТРЕБУЮТ РЕАКЦИИ · ОБНОВЛЕНО 14:03</span>
      </div>
      <h1 className="h-title">Заявки и зачисление —<br/><em>312</em> <span className="ital">в&nbsp;потоке</span>.</h1>
      <p className="h-sub">Канбан-доска приёмной кампании. Каждая колонка — этап рассмотрения. Заявка движется по колонкам автоматически по мере прохождения проверок и согласований.</p>

      <section className="sec" style={{borderBottom:'none'}}>
        <div className="sec-head">
          <span className="idx">02</span>
          <span className="ttl">Конвейер приёма</span>
          <span className="sub">— приёмная кампания 2026</span>
          <span className="right">
            <span className="chip on">Все направления</span>
            <span className="chip">Бюджет</span>
            <span className="chip">Платно</span>
            <span className="chip"><Ic d={icons.download} size={11}/> Отчёт</span>
          </span>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14}}>
          {COLS.map((col,i)=>(
            <div key={col.id} style={{display:'flex', flexDirection:'column', gap:10}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'0 4px 10px', borderBottom:'1px solid var(--hair)'}}>
                <div>
                  <div style={{fontSize:10, color:'var(--mute)', letterSpacing:'0.12em', textTransform:'uppercase'}}>0{i+1} ЭТАП</div>
                  <div style={{fontSize:14, fontWeight:500, marginTop:2}}>{col.label}</div>
                </div>
                <span style={{fontFamily:'var(--font-mono)', fontSize:13, color: i===0 ? 'var(--accent)' : 'var(--mute)', fontVariantNumeric:'tabular-nums'}}>{col.count}</span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {col.items.map(c => <KanbanCard key={c.id} c={c}/>)}
                {col.items.length < 4 && (
                  <div style={{
                    border:'1px dashed var(--hair)',
                    borderRadius:10, padding:14,
                    textAlign:'center', fontSize:11.5, color:'var(--mute)',
                    fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
                  }}>+ ещё {col.count - col.items.length}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

/* ─── INSTITUTIONS ─────────────────────────────────── */
const INSTS = [
  { c:'1', n:'Институт информационных технологий', city:'Москва',         s:2840, p:18, a:96, st:'Активно' },
  { c:'2', n:'Биомедицинский институт',            city:'Санкт-Петербург', s:1240, p:9,  a:92, st:'Активно' },
  { c:'3', n:'Юридический факультет',              city:'Москва',         s:1820, p:7,  a:88, st:'Активно' },
  { c:'4', n:'Экономический факультет',            city:'Казань',         s:2120, p:12, a:84, st:'Активно' },
  { c:'5', n:'Гуманитарный институт',              city:'Новосибирск',    s:980,  p:8,  a:79, st:'Активно' },
  { c:'6', n:'Медицинский институт',               city:'Екатеринбург',   s:1480, p:6,  a:90, st:'Активно' },
  { c:'7', n:'Архитектурный факультет',            city:'Москва',         s:380,  p:4,  a:72, st:'Аудит' },
  { c:'8', n:'Химический институт',                city:'Томск',          s:720,  p:7,  a:86, st:'Активно' },
];

function InstitutionsScreen({ themeClass }) {
  return (
    <Shell themeClass={themeClass} active="Учреждения">
      <div className="eyebrow">
        <span className="idx">№ 005 — СЕТЬ</span>
        <span className="meta">38 УЧРЕЖДЕНИЙ · 12 ГОРОДОВ · СЕТЬ 4 ОКРУГА</span>
      </div>
      <h1 className="h-title">Сеть из <em>38</em><br/><span className="ital">образовательных</span> учреждений.</h1>
      <p className="h-sub">Институты, факультеты и подразделения, входящие в платформу. Каждое учреждение управляется автономно, общая аналитика и единый реестр студентов синхронизированы.</p>

      <div className="kpi-row">
        {[
          ['УЧРЕЖДЕНИЙ','38','+2 в квартале','up'],
          ['ГОРОДОВ','12','—',''],
          ['ВСЕГО СТУДЕНТОВ','12 845','+4,2%','up'],
          ['СРЕДН. АКТИВНОСТЬ','87,3%','+1,4 п.п.','up'],
        ].map(([l,v,d,t],i)=>(
          <div key={i} className="kpi">
            <div className="kpi-head"><span>{l}</span>{d!=='—' && <span className={`delta ${t}`}>{d}</span>}</div>
            <div className="kpi-num">{v}</div>
            <div className="kpi-foot"><span>{i===0?'из них 1 на аудите':i===2?'активных 11 924':'обновлено сегодня'}</span></div>
          </div>
        ))}
      </div>

      <section className="sec">
        <div className="sec-head">
          <span className="idx">02</span>
          <span className="ttl">Список учреждений</span>
          <span className="sub">— сортировка по числу студентов</span>
          <span className="right">
            <span className="chip on">Все</span>
            <span className="chip">Москва</span>
            <span className="chip">С-Пб</span>
            <span className="chip">Регионы</span>
            <span className="chip"><Ic d={icons.download} size={11}/> Реестр</span>
          </span>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:20}}>
          {INSTS.map(it => (
            <div key={it.c} className="card" style={{padding:0, overflow:'hidden', display:'flex', flexDirection:'column'}}>
              {/* "fascia" — editorial photo placeholder */}
              <div style={{
                height:120,
                background: `
                  repeating-linear-gradient(45deg, var(--surface-2) 0 2px, transparent 2px 12px),
                  linear-gradient(135deg, color-mix(in oklch, var(--accent) 15%, transparent), transparent 70%)
                `,
                borderBottom:'1px solid var(--hair)',
                position:'relative',
              }}>
                <div style={{
                  position:'absolute', top:14, left:14,
                  fontFamily:'var(--font-mono)', fontSize:32, fontWeight:300,
                  letterSpacing:'-0.04em', color:'var(--fg)',
                }}>№ {it.c.padStart(2,'0')}</div>
                <div style={{
                  position:'absolute', bottom:12, left:14,
                  fontSize:10, color:'var(--mute)', letterSpacing:'0.12em',
                }}>📍 {it.city.toUpperCase()}</div>
                <div style={{
                  position:'absolute', top:14, right:14,
                  fontSize:10, padding:'3px 8px',
                  border:`1px solid ${it.st==='Аудит'?'var(--neg-line)':'var(--pos-line)'}`,
                  borderRadius:999,
                  color: it.st==='Аудит'?'var(--neg)':'var(--pos)',
                  letterSpacing:'0.08em', textTransform:'uppercase',
                }}>{it.st}</div>
              </div>
              <div style={{padding:18, display:'flex', flexDirection:'column', gap:14, flex:1}}>
                <div style={{fontSize:15, fontWeight:500, letterSpacing:'-0.01em', lineHeight:1.2}}>{it.n}</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:'auto'}}>
                  <div>
                    <div style={{fontSize:10, color:'var(--mute)', letterSpacing:'0.12em'}}>СТУДЕНТЫ</div>
                    <div style={{fontSize:22, fontWeight:300, letterSpacing:'-0.03em', marginTop:2, fontVariantNumeric:'tabular-nums'}}>{it.s.toLocaleString('ru-RU')}</div>
                  </div>
                  <div>
                    <div style={{fontSize:10, color:'var(--mute)', letterSpacing:'0.12em'}}>ПРОГРАММ</div>
                    <div style={{fontSize:22, fontWeight:300, letterSpacing:'-0.03em', marginTop:2}}>{it.p}</div>
                  </div>
                </div>
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--mute)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6}}>
                    <span>Активность</span><span>{it.a}%</span>
                  </div>
                  <div className="bar-track" style={{height:4}}>
                    <div className="bar-fill" style={{width:`${it.a}%`, background: it.a<80?'var(--fg)':'var(--accent)'}}/>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

window.StudentsScreen = StudentsScreen;
window.ProgramsScreen = ProgramsScreen;
window.ApplicationsScreen = ApplicationsScreen;
window.InstitutionsScreen = InstitutionsScreen;
