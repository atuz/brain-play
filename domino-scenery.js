// Original, code-drawn scenery. It lives behind the camera so a large level
// keeps its distant landscape when the player pans or zooms the puzzle.
const svg = (kind, evening, artwork, definitions = '') => {
  const id = `dc-landscape-${kind}-${evening ? 'evening' : 'day'}`;
  return `<svg class="dc-landscape" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}-sky" x2="0" y2="1"><stop stop-color="var(--dc-sky-top)"/><stop offset="1" stop-color="var(--dc-sky-bottom)"/></linearGradient>
      <linearGradient id="${id}-water" x2="0" y2="1"><stop stop-color="#bed5ce"/><stop offset="1" stop-color="#8db8b2"/></linearGradient>
      <pattern id="${id}-windows" width="30" height="38" patternUnits="userSpaceOnUse"><rect x="11" y="12" width="7" height="13" rx="2" fill="${evening ? '#ffe4a7' : '#f5f5df'}" opacity=".62"/></pattern>
      ${definitions}
    </defs>
    <rect width="1200" height="800" fill="url(#${id}-sky)"/>
    ${artwork(id)}
    <rect width="1200" height="800" fill="#fff9ec" opacity=".16"/>
  </svg>`;
};
const sun = (x = 925, y = 210, r = 60) => `<circle cx="${x}" cy="${y}" r="${r * 1.5}" fill="#ffedbd" opacity=".16"/><circle cx="${x}" cy="${y}" r="${r}" fill="#f4d59b" opacity=".65"/>`;
const clouds = `<g class="dc-clouds" fill="#fff9e9" opacity=".65"><path d="M110 245c-18-26 15-46 36-32 3-43 62-47 73-8 28-8 49 8 44 28H110Z"/><path d="M707 138c-12-19 9-36 27-27 4-33 51-38 63-6 21-5 37 5 35 23H707Z"/></g>`;
const hills = `<path d="M0 622Q170 429 410 590T810 539T1200 581V800H0Z" fill="#b6c5ac" opacity=".65"/><path d="M0 726Q216 584 465 688T870 646T1200 705V800H0Z" fill="#8ea78c" opacity=".3"/>`;
const waves = (y, width = 1200) => `<g fill="none" stroke="#f5f3dc" stroke-width="3" stroke-linecap="round" opacity=".55">${Array.from({ length: 14 }, (_, i) => {
  const x = (i * 107 + (i % 3) * 39) % width;
  return `<path d="M${x} ${y + (i % 4) * 43}h${23 + i % 4 * 12}"/>`;
}).join('')}</g>`;

function garden() {
  return `${sun()}${clouds}${hills}
    <g fill="#9db596" opacity=".55"><path d="M25 574q-42-76 13-102-18-59 35-62 60 2 42 65 48 27 12 81Z"/><path d="M1038 559q-35-64 9-87-13-55 36-54 50 9 31 61 47 31 6 72Z"/></g>
    <g stroke="#8e9b78" stroke-width="9" opacity=".55"><path d="M73 518v175m1010-184v176"/></g>
    <g fill="none" stroke="#d4c39a" stroke-width="10" opacity=".6"><path d="M187 698v-69a83 83 0 0 1 166 0v69m-166-53h166m-144-54h123"/></g>
    <g fill="#f3e5ba" opacity=".7"><circle cx="401" cy="705" r="5"/><circle cx="417" cy="691" r="4"/><circle cx="862" cy="715" r="5"/></g>`;
}

function harbor(id) {
  return `${sun(950, 205, 65)}${clouds}
    <path d="M0 462q180-98 341-21t301-18 558 11v126H0Z" fill="#b1c5be" opacity=".53"/>
    <g fill="#97b5ac" opacity=".38"><path d="M56 459v-86h34v86m22 0v-114h55v114m18 0v-68h43v68m740 0v-77h42v77m20 0v-126h45v126m16 0v-91h47v91"/></g>
    <path d="M0 477q270-14 570 0t630-3v326H0Z" fill="url(#${id}-water)" opacity=".67"/>
    <path d="M0 488q300 9 604 0t596 0" fill="none" stroke="#f6f0d4" stroke-width="5"/>
    <g class="dc-cruise-ship">
      <path d="M282 506h694l-57 66c-16 17-50 23-96 23H393c-50 0-82-24-111-89Z" fill="#f7f2d8" stroke="#adc1b4" stroke-width="3"/>
      <path d="M308 539h639l-15 18H318Z" fill="#769c9d" opacity=".72"/>
      <path d="M375 504v-51h472l56 51Z" fill="#eaf0dc" stroke="#adc1b4" stroke-width="3"/>
      <path d="M410 453v-42h342l50 42Z" fill="#f4f0d8" stroke="#b5c5b7" stroke-width="3"/>
      <path d="M446 411v-34h252l35 34Z" fill="#f5f1da" stroke="#b5c5b7" stroke-width="3"/>
      <g fill="#7e9f9c" opacity=".75">${Array.from({ length: 11 }, (_, i) => `<rect x="${399 + i * 38}" y="468" width="23" height="14" rx="3"/>`).join('')}${Array.from({ length: 8 }, (_, i) => `<rect x="${432 + i * 36}" y="423" width="21" height="12" rx="3"/>`).join('')}<path d="M469 389h212v10H469Z"/></g>
      <path d="M580 376v-46h45l17 46" fill="#d5a58b"/><path d="M580 333h45v10h-45Z" fill="#a68874"/>
      <path d="M707 377v-65m0 6 38 11-38 11" fill="#dcb579" stroke="#a5b5a2" stroke-width="3"/>
      <path d="M357 500h489m-466-8v13m53-13v13m53-13v13m53-13v13m53-13v13m53-13v13m53-13v13m53-13v13m53-13v13" fill="none" stroke="#9db5a9" stroke-width="3"/>
      <g fill="#bc8e73" opacity=".68"><circle cx="427" cy="555" r="5"/><circle cx="471" cy="555" r="5"/><circle cx="515" cy="555" r="5"/><circle cx="559" cy="555" r="5"/></g>
    </g>
    <path d="M385 611q230 18 489-4l-56 34H440Z" fill="#eaf0d5" opacity=".22"/>
    ${waves(615)}
    <g stroke="#9cafa0" stroke-width="3" fill="none" opacity=".58"><path d="m213 260 12-5 12 5m568-54 12-5 12 5"/></g>
    <path d="M0 708h167v15H0m30 0v77m93-77v77" fill="none" stroke="#b2aa8b" stroke-width="12" opacity=".48"/>`;
}

function city(id, evening) {
  const buildings = [
    [70, 350, 86, 382], [177, 292, 105, 440], [310, 405, 90, 327],
    [425, 224, 111, 508], [566, 357, 82, 375], [674, 167, 122, 565],
    [830, 312, 93, 420], [947, 257, 104, 475], [1080, 387, 83, 345],
  ];
  return `${sun(evening ? 295 : 950, evening ? 305 : 190, evening ? 72 : 56)}${clouds}
    <g fill="#b0bfb7" opacity=".42"><path d="M0 721V479h65V359h58v120h59V435h96v97h59V340h69v126h49v-80h66v153h56V431h75v75h67V291h70v158h61v-77h100v145h55V376h93v99h80v-48h62v294Z"/></g>
    <g opacity=".62">${buildings.map(([x, y, w, h], i) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${i % 3 === 0 ? 10 : 3}" fill="${['#a1b4ab', '#adc1b5', '#97aea7'][i % 3]}"/><rect x="${x + 8}" y="${y + 10}" width="${w - 16}" height="${h - 14}" fill="url(#${id}-windows)"/></g>`).join('')}</g>
    <g stroke="#91aaa1" fill="#b7c8ba" stroke-width="4" opacity=".68"><path d="M691 167v-18h87v18m-45-18v-47m-278 122v-20h53v20m-25-20v-36"/></g>
    <path d="M0 728q375-56 625-4t575-3v79H0Z" fill="#a4baaa" opacity=".65"/>
    <path d="M0 765q410-39 724-8t476-3" fill="none" stroke="#f5e9c6" stroke-width="7" opacity=".55"/>
    <g fill="none" stroke="#9bb4a7" stroke-width="4" opacity=".48"><path d="M0 637h1200m-963 0v88m621-88v88"/></g>`;
}

function workshop(id) {
  const gear = (x, y, radius) => `<g transform="translate(${x} ${y})" fill="none" stroke="#bca988" opacity=".31"><circle r="${radius}" stroke-width="20"/><circle r="${radius * .45}" stroke-width="7"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${-radius - 8}v-20" stroke-width="19" transform="rotate(${i * 30})"/>`).join('')}<path d="M0 ${-radius * .8}V${radius * .8}M${-radius * .8} 0H${radius * .8}" stroke-width="6"/></g>`;
  return `<g fill="#d0bb97" opacity=".38"><path d="M58 0h26v800H58m1056-800h26v800h-26M0 163h1200v20H0m0 477h1200v20H0"/></g>
    <path d="M370 541V283a230 230 0 0 1 460 0v258Z" fill="#e0e5ce" opacity=".64"/>
    <path d="M370 541V283a230 230 0 0 1 460 0v258Zm230-485v485m-229-222h458" fill="none" stroke="#b7b492" stroke-width="9" opacity=".46"/>
    ${gear(220, 430, 103)}${gear(967, 525, 133)}
    <g fill="none" stroke="#b9a483" stroke-width="14" opacity=".33"><path d="M1092 0v300q0 32-32 32h-34M0 575h127q27 0 27 27v198"/></g>
    <path d="M0 740h1200v60H0" fill="#bcaa88" opacity=".27"/>
    <g fill="#af9b7e" opacity=".24"><path d="M332 718h113v22H332m-60-39h65v39h-65m604-15h123v15H876"/></g>`;
}

function ruins() {
  const column = (x, y, h, broken = false) => `<g opacity=".52" fill="#b0b396"><path d="M${x - 14} ${y + h}h91v18h-91Zm8-15h75v15h-75Z"/><path d="M${x} ${y + h}V${y + (broken ? 22 : 0)}${broken ? 'l14-10 17 17 18-24 15 11' : 'h64'}V${y + h}Z"/><path d="M${x + 12} ${y + 36}v${h - 50}m20-${h - 50}v${h - 50}m20-${h - 50}v${h - 50}" fill="none" stroke="#e3ddba" stroke-width="5" opacity=".7"/>${broken ? '' : `<path d="M${x - 11} ${y - 15}h86v20h-86Z"/>`}</g>`;
  return `${sun(863, 187, 64)}${clouds}
    <path d="M0 621 184 397l170 224 155-151 156 151 234-308 301 308v179H0Z" fill="#b4c1aa" opacity=".39"/>
    <path d="M400 642V373a191 191 0 0 1 382 0v269h-51V375a140 140 0 0 0-280 0v267Z" fill="#b5b69b" opacity=".45"/>
    <path d="M405 370h42m-20-73 36 18m73-109 12 44m98-38-12 42m103 48-38 18" fill="none" stroke="#e5dfbc" stroke-width="8" opacity=".55"/>
    ${column(192, 327, 356)}${column(880, 410, 284, true)}${column(1003, 280, 403)}
    <g fill="none" stroke="#90aa8d" stroke-width="8" opacity=".48"><path d="M236 662q-18-67 2-106t-9-109m204 192q23-66 1-114m593 131q-19-66 7-119t-1-115"/></g>
    <g fill="#99ae91" opacity=".5"><ellipse cx="231" cy="520" rx="16" ry="6" transform="rotate(-35 231 520)"/><ellipse cx="1029" cy="500" rx="19" ry="7" transform="rotate(35 1029 500)"/></g>
    <path d="M0 755q240-107 496-32t704-32v109H0Z" fill="#a8b69a" opacity=".5"/>
    <g fill="#bac0a3" opacity=".67"><path d="M350 712h51v28h-51m10-39h39v12h-39m399-9h84v35h-84m242-16h47v28h-47"/></g>`;
}

// A chapter owns its setting and lighting; individual levels change the puzzle.
// The picker uses this same list so its scene names match the stage artwork.
export const chapterSceneries = Object.freeze([
  { kind: 'garden', label: '庭院', evening: false },
  { kind: 'workshop', label: '工坊', evening: false },
  { kind: 'harbor', label: '游船港湾', evening: false },
  { kind: 'city', label: '高楼城市', evening: true },
  { kind: 'ruins', label: '古代遗迹', evening: false },
].map(Object.freeze));

export function sceneryForLevel(level) {
  const {kind, evening} = chapterSceneries[level.chapter] || chapterSceneries[0];
  return { kind, evening, artwork: svg(kind, evening, id => ({
    garden, harbor, city: name => city(name, evening), workshop, ruins,
  })[kind](id)) };
}
