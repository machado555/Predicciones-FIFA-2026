import { GROUPS } from './groups.js';
import { KNOCKOUT_ROUNDS } from './knockout.js';

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

const VENUES = {
  azteca: 'Estadio Azteca, Ciudad de México',
  bbva: 'Estadio BBVA, Guadalupe',
  akron: 'Estadio Akron, Guadalajara',
  univ: 'Estadio Universitario, San Nicolás',
  bc: 'BC Place, Vancouver',
  bmo: 'BMO Field, Toronto',
  metlife: 'MetLife Stadium, East Rutherford',
  sofi: 'SoFi Stadium, Inglewood',
  att: 'AT&T Stadium, Arlington',
  mbs: 'Mercedes-Benz Stadium, Atlanta',
  nrg: 'NRG Stadium, Houston',
  arrow: 'Arrowhead Stadium, Kansas City',
  hard: 'Hard Rock Stadium, Miami Gardens',
  lff: 'Lincoln Financial Field, Philadelphia',
  levi: "Levi's Stadium, Santa Clara",
  lumen: 'Lumen Field, Seattle',
};

const GROUP_VENUE_MAP = {
  A: [VENUES.azteca, VENUES.bbva, VENUES.azteca, VENUES.univ, VENUES.azteca, VENUES.bbva],
  B: [VENUES.bc, VENUES.akron, VENUES.bc, VENUES.bmo, VENUES.bmo, VENUES.akron],
  C: [VENUES.levi, VENUES.lumen, VENUES.levi, VENUES.lff, VENUES.lff, VENUES.lumen],
  D: [VENUES.sofi, VENUES.att, VENUES.sofi, VENUES.nrg, VENUES.nrg, VENUES.att],
  E: [VENUES.lumen, VENUES.bc, VENUES.lumen, VENUES.bmo, VENUES.bmo, VENUES.bc],
  F: [VENUES.mbs, VENUES.nrg, VENUES.mbs, VENUES.hard, VENUES.hard, VENUES.nrg],
  G: [VENUES.arrow, VENUES.bc, VENUES.arrow, VENUES.bmo, VENUES.bmo, VENUES.bc],
  H: [VENUES.azteca, VENUES.univ, VENUES.azteca, VENUES.bbva, VENUES.azteca, VENUES.bbva],
  I: [VENUES.hard, VENUES.att, VENUES.hard, VENUES.mbs, VENUES.mbs, VENUES.att],
  J: [VENUES.metlife, VENUES.lff, VENUES.metlife, VENUES.levi, VENUES.levi, VENUES.lff],
  K: [VENUES.sofi, VENUES.akron, VENUES.sofi, VENUES.azteca, VENUES.azteca, VENUES.akron],
  L: [VENUES.metlife, VENUES.arrow, VENUES.metlife, VENUES.nrg, VENUES.nrg, VENUES.arrow],
};

const KNOCKOUT_VENUES = [
  VENUES.sofi, VENUES.azteca, VENUES.lumen, VENUES.att,
  VENUES.hard, VENUES.metlife, VENUES.levi, VENUES.mbs,
  VENUES.nrg, VENUES.arrow, VENUES.lff, VENUES.bc,
  VENUES.akron, VENUES.univ, VENUES.bmo, VENUES.bbva,
  VENUES.sofi, VENUES.att, VENUES.metlife, VENUES.lumen,
  VENUES.azteca, VENUES.levi, VENUES.hard, VENUES.nrg,
  VENUES.mbs, VENUES.arrow, VENUES.sofi, VENUES.metlife,
  VENUES.att, VENUES.azteca, VENUES.hard,
];

function buildGroupFixtures() {
  const result = [];
  const TIMES = ['13:00', '16:00', '19:00', '22:00'];

  function addMatch(gi, mi, date, timeIdx) {
    const letter = GROUP_LETTERS[gi];
    result.push({
      id: `g${letter}${mi}`,
      date,
      time: TIMES[timeIdx % TIMES.length],
      phase: `Grupo ${letter}`,
      venue: GROUP_VENUE_MAP[letter][mi],
      ref: { type: 'group', gi, mi },
    });
  }

  function genMd(day, groups, mi1, mi2) {
    groups.forEach((gi, idx) => {
      addMatch(gi, mi1, `2026-06-${pad2(day)}`, idx * 2);
      addMatch(gi, mi2, `2026-06-${pad2(day)}`, idx * 2 + 1);
    });
  }

  // Matchday 1: 2 groups per day, 2 matches each (4 matches/day)
  genMd(11, [0, 1], 0, 1);
  genMd(12, [2, 3], 0, 1);
  genMd(13, [4, 5], 0, 1);
  genMd(14, [6, 7], 0, 1);
  genMd(15, [8, 9], 0, 1);
  genMd(16, [10, 11], 0, 1);
  // Matchday 2
  genMd(17, [0, 1], 2, 3);
  genMd(18, [2, 3], 2, 3);
  genMd(19, [4, 5], 2, 3);
  genMd(20, [6, 7], 2, 3);
  genMd(21, [8, 9], 2, 3);
  genMd(22, [10, 11], 2, 3);
  // Matchday 3: 4 groups per day
  genMd(23, [0, 1, 2, 3], 4, 5);
  genMd(24, [4, 5, 6, 7], 4, 5);
  genMd(25, [8, 9, 10, 11], 4, 5);

  return result;
}

function buildKnockoutFixtures() {
  const result = [];
  const PHASE_LABEL = {
    R32: 'Dieciseisavos',
    R16: 'Octavos',
    Cuartos: 'Cuartos',
    Semis: 'Semifinal',
    '3er Lugar': '3er Puesto',
    '🏆 FINAL': 'Final',
  };

  const R32_DATES = ['2026-06-28', '2026-06-29', '2026-06-30', '2026-07-01'];
  const R16_DATES = ['2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07'];
  const QF_DATES = ['2026-07-10', '2026-07-11'];
  const SF_DATES = ['2026-07-14', '2026-07-15'];
  const TIMES_POOL = ['13:00', '16:00', '19:00', '22:00'];

  let koIdx = 0;

  KNOCKOUT_ROUNDS.forEach((m, idx) => {
    const round = m.round;
    let date, time;
    if (round === 'R32') {
      date = R32_DATES[Math.floor(koIdx / 4)];
      time = TIMES_POOL[koIdx % 4];
    } else if (round === 'R16') {
      date = R16_DATES[koIdx % 4];
      time = TIMES_POOL[koIdx % 2 === 0 ? 1 : 3];
    } else if (round === 'Cuartos') {
      date = QF_DATES[koIdx % 2];
      time = TIMES_POOL[koIdx % 2 === 0 ? 1 : 2];
    } else if (round === 'Semis') {
      date = SF_DATES[koIdx % 2];
      time = TIMES_POOL[koIdx % 2 === 0 ? 1 : 2];
    } else if (round === '3er Lugar') {
      date = '2026-07-18';
      time = '16:00';
    } else if (round === '🏆 FINAL') {
      date = '2026-07-19';
      time = '16:00';
    } else {
      date = '2026-07-19';
      time = '16:00';
    }

    result.push({
      id: `ko${idx}`,
      date,
      time,
      phase: PHASE_LABEL[round] || round,
      venue: KNOCKOUT_VENUES[koIdx] || VENUES.metlife,
      ref: { type: 'ko', idx },
    });
    koIdx++;
  });

  return result;
}

export const FIXTURES = [...buildGroupFixtures(), ...buildKnockoutFixtures()];

FIXTURES.sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  return a.time.localeCompare(b.time);
});
