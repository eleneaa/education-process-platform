/* Editorial dashboard — shared component, themed via outer class */

const NAV = [
  { id: 'overview', label: 'Обзор', icon: 'overview', active: true },
  { id: 'students', label: 'Студенты', icon: 'students', count: '12 845' },
  { id: 'programs', label: 'Программы', icon: 'programs', count: '84' },
  { id: 'groups',   label: 'Группы',    icon: 'groups',   count: '412' },
  { id: 'apply',    label: 'Заявки',    icon: 'apply',    count: '312' },
  { id: 'inst',     label: 'Учреждения', icon: 'inst',    count: '38' },
];
const NAV2 = [
  { id: 'analytics', label: 'Аналитика', icon: 'analytics' },
  { id: 'reports',   label: 'Отчёты',    icon: 'reports' },
  { id: 'settings',  label: 'Настройки', icon: 'settings' },
];

/* ── Sparkline ── */
function Sparkline({ data, color = 'currentColor', filled = false }) {
  const w = 220, h = 32, p = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = p + (i / (data.length - 1)) * (w - 2*p);
    const y = h - p - ((v - min) / range) * (h - 2*p);
    return [x, y];
  });
  const d = pts.map((p,i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`)).join(' ');
  const dFill = `${d} L${w-p} ${h-p} L${p} ${h-p} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {filled && <path d={dFill} fill={color} opacity="0.08" />}
      <path d={d} stroke={color} strokeWidth="1.25" fill="none" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

/* ── Line Chart ── */
function LineChart() {
  const w = 720, h = 220, padL = 40, padR = 20, padT = 20, padB = 30;
  const a = [42, 58, 51, 73, 88, 76, 95, 112, 104, 128, 142, 138];
  const b = [30, 38, 44, 49, 55, 58, 64, 70, 78, 84, 90, 96];
  const labels = ['Июн','Июл','Авг','Сен','Окт','Ноя','Дек','Янв','Фев','Мар','Апр','Май'];
  const yMax = 160;
  const x = i => padL + (i/(a.length-1))*(w-padL-padR);
  const y = v => padT + (1 - v/yMax)*(h-padT-padB);
  const mk = arr => arr.map((v,i) => `${i?'L':'M'}${x(i)} ${y(v)}`).join(' ');
  const fill = arr => `${mk(arr)} L${x(arr.length-1)} ${h-padB} L${padL} ${h-padB} Z`;
  return (
    <svg className="line-wrap" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{width:'100%', height: 220}}>
      {[0, 40, 80, 120, 160].map(g => (
        <g key={g}>
          <line x1={padL} x2={w-padR} y1={y(g)} y2={y(g)} stroke="var(--hair)" strokeWidth="1"/>
          <text x={padL-8} y={y(g)+3} fontSize="10" textAnchor="end" fill="var(--mute)" fontFamily="JetBrains Mono">{g}</text>
        </g>
      ))}
      {labels.map((l,i)=>(
        <text key={i} x={x(i)} y={h-10} fontSize="10" textAnchor="middle" fill="var(--mute)" fontFamily="JetBrains Mono" letterSpacing="0.06em">{l}</text>
      ))}
      <path d={fill(a)} fill="var(--accent)" opacity="0.08"/>
      <path d={mk(b)} stroke="var(--fg)" strokeWidth="1.25" fill="none" strokeDasharray="3 3" opacity="0.5"/>
      <path d={mk(a)} stroke="var(--accent)" strokeWidth="1.75" fill="none" strokeLinejoin="round"/>
      {a.map((v,i)=>(
        <circle key={i} cx={x(i)} cy={y(v)} r={i===a.length-3?3.5:0} fill="var(--accent)"/>
      ))}
      <g transform={`translate(${x(a.length-3)} ${y(a[a.length-3])})`}>
        <line x1="0" y1="0" x2="0" y2="-22" stroke="var(--accent)" strokeWidth="1"/>
        <rect x="-30" y="-40" width="60" height="18" rx="3" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1"/>
        <text x="0" y="-27" fontSize="10" textAnchor="middle" fill="var(--accent)" fontFamily="JetBrains Mono">128 / Мар</text>
      </g>
    </svg>
  );
}

/* ── Donut ── */
function Donut({ data }) {
  const r = 64, sw = 14, cx = 80, cy = 80;
  const C = 2 * Math.PI * r;
  const total = data.reduce((s,d)=>s+d.v,0);
  let acc = 0;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} stroke="var(--surface-2)" strokeWidth={sw} fill="none"/>
      {data.map((d,i)=>{
        const len = (d.v/total) * C;
        const off = -acc;
        acc += len;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            stroke={d.color} strokeWidth={sw} fill="none"
            strokeDasharray={`${len-2} ${C}`} strokeDashoffset={off}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"/>
        );
      })}
      <text x={cx} y={cy-2} textAnchor="middle" fontSize="22" fill="var(--fg)" fontWeight="300" letterSpacing="-0.04em">{total.toLocaleString('ru-RU')}</text>
      <text x={cx} y={cy+16} textAnchor="middle" fontSize="9" fill="var(--mute)" letterSpacing="0.12em" fontFamily="JetBrains Mono">ВСЕГО</text>
    </svg>
  );
}

/* ── Heatmap ── */
function Heatmap({ accent }) {
  // 7 rows (days) x 20 cols (weeks)
  const rows = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  const rng = ((seed) => () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  })(7);
  const cells = rows.map(r => Array.from({length:20}, (_,c) => {
    const isWeekend = r === 'СБ' || r === 'ВС';
    const base = isWeekend ? 0.05 : 0.25 + rng()*0.7;
    return Math.min(1, base);
  }));
  return (
    <div className="heat" style={{gridTemplateColumns: '36px repeat(20, 1fr)'}}>
      {rows.map((r, ri) => (
        <React.Fragment key={ri}>
          <div className="ylabel">{r}</div>
          {cells[ri].map((v, ci) => (
            <div key={ci} className="cell" style={{
              background: v < 0.1 ? 'var(--surface-2)' :
                          `color-mix(in oklch, ${accent} ${Math.round(v*90)}%, transparent)`,
            }}/>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({ collapsed }) {
  return (
    <aside className={`side ${collapsed ? 'side-collapsed' : 'side-open'}`}>
      <div className="side-brand">
        <div className="brand-mark filled">Э</div>
        {!collapsed && (
          <div>
            <div className="brand-name">Эдулайн</div>
            <div className="brand-sub">Admin · v2.4</div>
          </div>
        )}
      </div>

      {!collapsed && <div className="side-section-label">Управление</div>}
      <nav className="side-nav">
        {NAV.map(n => (
          <div key={n.id} className={`nav-item ${n.active ? 'active' : ''}`} title={n.label}>
            <span className="icn"><Ic d={icons[n.icon]} size={17}/></span>
            {!collapsed && <span>{n.label}</span>}
            {!collapsed && n.count && <span className="count">{n.count}</span>}
          </div>
        ))}
      </nav>

      {!collapsed && <div className="side-section-label">Системное</div>}
      <nav className="side-nav">
        {NAV2.map(n => (
          <div key={n.id} className="nav-item">
            <span className="icn"><Ic d={icons[n.icon]} size={17}/></span>
            {!collapsed && <span>{n.label}</span>}
          </div>
        ))}
      </nav>

      <div className="side-foot">
        {!collapsed ? (
          <div className="side-user">
            <div className="avatar">АК</div>
            <div>
              <div className="user-name">А. Колесникова</div>
              <div className="user-role">Декан</div>
            </div>
          </div>
        ) : (
          <div className="side-user" style={{justifyContent:'center', padding:0}}>
            <div className="avatar">АК</div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Dashboard ── */
function Dashboard({ themeClass, collapsed = false, direction = 'A' }) {
  const isB = direction === 'B';

  // Donut data — programs by direction
  const donutData = [
    { label: 'Инженерия и IT',       v: 4280, color: 'var(--accent)' },
    { label: 'Естественные науки',   v: 2940, color: 'var(--fg)' },
    { label: 'Гуманитарные',         v: 2180, color: 'color-mix(in oklch, var(--accent) 55%, transparent)' },
    { label: 'Экономика и бизнес',   v: 1850, color: 'color-mix(in oklch, var(--fg) 50%, transparent)' },
    { label: 'Медицина',             v: 1595, color: 'color-mix(in oklch, var(--accent) 30%, transparent)' },
  ];

  const bars = [
    { label: 'Прикладная информатика', v: 92, alt: false },
    { label: 'Биоинженерия',           v: 86, alt: false },
    { label: 'Юриспруденция',          v: 79, alt: true  },
    { label: 'Экономика',              v: 74, alt: true  },
    { label: 'Лингвистика',            v: 68, alt: true  },
    { label: 'История',                v: 61, alt: true  },
  ];

  return (
    <div className={`dash ${themeClass}`} style={{['--sidebar-w']: collapsed ? '72px' : '248px'}}>
      <Sidebar collapsed={collapsed}/>
      <main className="main">
        <div className="topbar">
          <div className="crumbs">
            <span>Платформа</span>
            <span className="sep">/</span>
            <span>Учебный процесс</span>
            <span className="sep">/</span>
            <span className="now">Обзор</span>
          </div>
          <div className="search">
            <Ic d={icons.search} size={14}/>
            <span>Студент, программа, заявка…</span>
            <kbd>⌘K</kbd>
          </div>
          <div className="tb-btn"><Ic d={icons.filter} size={15}/></div>
          <div className="tb-btn">
            <Ic d={icons.bell} size={15}/>
            <span className="dot"/>
          </div>
        </div>

        <div className="eyebrow">
          <span className="idx">№ 001 — ОБЗОР</span>
          <span className="meta">12 МАЯ 2026 · ПН · ВЕСЕННИЙ СЕМЕСТР · 14 НЕДЕЛЯ</span>
        </div>

        <h1 className="h-title">
          {isB ? (
            <>Учебный <em>процесс</em><br/>в одном месте.</>
          ) : (
            <>Сегодня в системе&nbsp;— <em>12 845</em><br/><span className="ital">активных</span> студентов.</>
          )}
        </h1>
        <p className="h-sub">
          {isB
            ? 'Обзор ключевых метрик, успеваемости и движения заявок по 38 учреждениям. Данные обновляются в реальном времени.'
            : 'Сводка по 38 учреждениям, 84 программам и 412 группам. Тренды за последние 12 месяцев и текущая активность.'}
        </p>

        {/* KPI strip */}
        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-head">
              <span>Студенты</span>
              <span className="delta up"><Ic d={icons.arrowUp.props ? icons.arrowUp : "M7 17 17 7 M9 7h8v8"} size={10} stroke={1.6}/> 4,2%</span>
            </div>
            <div className="kpi-num">12 845</div>
            <Sparkline data={[40,42,46,44,52,58,55,64,72,78,82,88]} color="var(--accent)" filled/>
            <div className="kpi-foot"><span>было 12 327</span><span>30д</span></div>
          </div>
          <div className="kpi">
            <div className="kpi-head">
              <span>Активные программы</span>
              <span className="delta up">+ 3</span>
            </div>
            <div className="kpi-num">84</div>
            <Sparkline data={[78,79,79,80,80,81,82,82,82,83,83,84]} color="var(--fg)"/>
            <div className="kpi-foot"><span>11 на доработке</span><span>квартал</span></div>
          </div>
          <div className="kpi">
            <div className="kpi-head">
              <span>Заявки на рассмотрении</span>
              <span className="delta dn">− 12%</span>
            </div>
            <div className="kpi-num">312</div>
            <Sparkline data={[420,400,392,388,360,355,340,338,326,318,315,312]} color="var(--fg)"/>
            <div className="kpi-foot"><span>среднее 2,1 дня</span><span>неделя</span></div>
          </div>
          <div className="kpi">
            <div className="kpi-head">
              <span>Средний балл</span>
              <span className="delta up">+ 0,2</span>
            </div>
            <div className="kpi-num">8,4<span className="unit">/ 10</span></div>
            <Sparkline data={[7.9,8.0,8.1,8.0,8.1,8.2,8.2,8.3,8.3,8.3,8.4,8.4]} color="var(--accent)"/>
            <div className="kpi-foot"><span>медиана 8,5</span><span>семестр</span></div>
          </div>
        </div>

        {/* Section 02 — Charts row 1 */}
        <section className="sec">
          <div className="sec-head">
            <span className="idx">02</span>
            <span className="ttl">Динамика и распределение</span>
            <span className="sub">— потоки приёма и состав направлений</span>
            <span className="right">
              <span className="chip on">12М</span>
              <span className="chip">6М</span>
              <span className="chip">КВ</span>
              <span className="chip">МЕС</span>
            </span>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Поступления и зачисления</div>
                  <div className="card-sub">за последние 12 месяцев · ежемесячно</div>
                </div>
                <div className="card-num">1 248</div>
              </div>
              <LineChart/>
              <div className="legend">
                <span><span className="dot" style={{background:'var(--accent)'}}/>Поступило заявок</span>
                <span><span className="dot" style={{background:'var(--fg)', opacity:0.5}}/>Зачислено</span>
                <span style={{marginLeft:'auto', fontFamily:'var(--font-mono)'}}>↑ 18,4% к прошлому году</span>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Распределение по направлениям</div>
                  <div className="card-sub">5 ведущих направлений</div>
                </div>
              </div>
              <div className="donut-wrap">
                <Donut data={donutData}/>
              </div>
              <div className="donut-list" style={{marginTop: 20}}>
                {donutData.map((d,i)=>(
                  <div key={i} className="donut-row">
                    <span className="swatch" style={{background:d.color}}/>
                    <span>{d.label}</span>
                    <span className="val">{d.v.toLocaleString('ru-RU')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Топ программ по успеваемости</div>
                  <div className="card-sub">средний балл, текущий семестр</div>
                </div>
                <span className="chip">сравнить</span>
              </div>
              <div className="bars">
                {bars.map((b,i)=>(
                  <div key={i} className="bar-row">
                    <span className="label">{b.label}</span>
                    <span className="bar-track">
                      <span className={`bar-fill ${b.alt ? 'alt' : ''}`} style={{width: `${b.v}%`}}/>
                    </span>
                    <span className="bar-val">{(b.v/10).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Посещаемость · 20 недель</div>
                  <div className="card-sub">тепловая карта · % от плана</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--mute)', fontFamily:'var(--font-mono)'}}>
                  0
                  <span style={{display:'inline-flex', gap:2}}>
                    {[0.15,0.3,0.5,0.7,0.9].map((v,i)=>(
                      <span key={i} style={{width:12, height:12, borderRadius:2,
                        background: `color-mix(in oklch, var(--accent) ${v*100}%, transparent)`}}/>
                    ))}
                  </span>
                  100
                </div>
              </div>
              <Heatmap accent="var(--accent)"/>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:14, fontSize:11, color:'var(--mute)', fontFamily:'var(--font-mono)'}}>
                <span>Сред. посещ. 87,3%</span>
                <span>Пиков 4 · спадов 2</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 03 — Recent */}
        <section className="sec" style={{borderBottom:'none'}}>
          <div className="sec-head">
            <span className="idx">03</span>
            <span className="ttl">Поток активности</span>
            <span className="sub">— заявки и события, требующие внимания</span>
            <span className="right">
              <span className="chip">экспорт</span>
              <span className="chip on">все 312</span>
            </span>
          </div>

          <div className="feed">
            {[
              { t: '14:02', tag: 'Заявка', acc: true, ttl: 'Новая заявка на программу «Прикладная информатика»', who: 'Михаил В. — приёмная комиссия №3 · документы полные' },
              { t: '13:48', tag: 'Перевод', ttl: 'Перевод студента: гр. 22-ИС-04 → 22-ИС-02', who: 'И. Колесникова · согласовано деканатом' },
              { t: '13:31', tag: 'Оценка',  ttl: 'Закрыта сессия по курсу «Линейная алгебра»', who: '142 студента · средний балл 8,1 · сдано в срок 96%' },
              { t: '12:55', tag: 'Программа', ttl: 'Программа «Биомедицинская инженерия» переведена в активные', who: 'Лицензия №АА-2841 · 1 сентября 2026' },
              { t: '12:10', tag: 'Доступ', ttl: 'Запрос на роль «Куратор» — С. Прохорова', who: 'Учреждение «ИФТИ» · ожидает решения 4ч' },
            ].map((r,i)=>(
              <div key={i} className="feed-row">
                <span className="time">{r.t}</span>
                <div>
                  <div className="ttl">{r.ttl}</div>
                  <div className="who">{r.who}</div>
                </div>
                <span className={`tag ${r.acc ? 'acc' : ''}`}>{r.tag}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="footer-rail">
          <span>ЭДУЛАЙН · ПЛАТФОРМА АДМИНИСТРИРОВАНИЯ ОБРАЗОВАТЕЛЬНОГО ПРОЦЕССА</span>
          <span>СИНХР. 14:03 · API V2.4.1 · 38 УЗЛОВ</span>
        </div>
      </main>
    </div>
  );
}

window.Dashboard = Dashboard;
