/* Icons — minimal hairline SVG */

const Ic = ({ d, size = 16, stroke = 1.4 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const icons = {
  overview: <><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></>,
  students: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><circle cx="17" cy="9" r="2.5"/><path d="M21.5 18c0-2.5-2-4.5-4.5-4.5"/></>,
  programs: <><path d="M4 5h16v14H4z"/><path d="M4 9h16"/><path d="M9 5v14"/></>,
  groups: <><circle cx="7" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M2 19c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M12 19c0-2.8 2.2-5 5-5s5 2.2 5 5"/></>,
  apply: <><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><path d="M9 13h6M9 17h4"/></>,
  inst: <><path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M10 21v-6h4v6"/></>,
  analytics: <><path d="M4 20V8"/><path d="M10 20V4"/><path d="M16 20v-9"/><path d="M22 20H2"/></>,
  reports: <><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
  collapse: <><path d="M9 4v16"/><path d="M14 9l-3 3 3 3"/><path d="M4 4h16v16H4z"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  arrowUp: <><path d="M7 17 17 7"/><path d="M9 7h8v8"/></>,
  arrowDn: <><path d="M7 7 17 17"/><path d="M17 9v8H9"/></>,
  download: <><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/></>,
  filter: <><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></>,
};

window.Ic = Ic;
window.icons = icons;
