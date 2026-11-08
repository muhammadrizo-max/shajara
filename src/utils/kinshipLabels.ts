import { Person, RelativeRelationInfo } from '../types';

type Side = 'father' | 'mother' | 'self';
interface AncestorInfo { dist: number; side: Side }

// Ota va ona: motherId bo'lmasa, otaning turmush o'rtog'i ona hisoblanadi (va aksincha)
function getParentLinks(p: Person, people: Record<string, Person>): Array<{ id: string; side: 'father' | 'mother' }> {
  let fatherId: string | null = p.parentId && people[p.parentId] ? p.parentId : null;
  let motherId: string | null = p.motherId && people[p.motherId] ? p.motherId : null;

  if (fatherId && !motherId) {
    const f = people[fatherId];
    if (f.spouseId && people[f.spouseId]) motherId = f.spouseId;
  }
  if (motherId && !fatherId) {
    const m = people[motherId];
    if (m.spouseId && people[m.spouseId]) fatherId = m.spouseId;
  }

  const out: Array<{ id: string; side: 'father' | 'mother' }> = [];
  if (fatherId) out.push({ id: fatherId, side: 'father' });
  if (motherId && motherId !== fatherId) out.push({ id: motherId, side: 'mother' });
  return out;
}

// Har bir ajdod: nechanchi avlod ekani va qaysi tomondan (ota yoki ona) kelgani
function ancestorMap(startId: string, people: Record<string, Person>): Map<string, AncestorInfo> {
  const map = new Map<string, AncestorInfo>();
  map.set(startId, { dist: 0, side: 'self' });
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const curId = queue.shift()!;
    const cur = map.get(curId)!;
    const person = people[curId];
    if (!person) continue;

    for (const link of getParentLinks(person, people)) {
      if (map.has(link.id)) continue;
      const side: Side = cur.dist === 0 ? link.side : cur.side;
      map.set(link.id, { dist: cur.dist + 1, side });
      queue.push(link.id);
    }
  }
  return map;
}

const ANCESTOR_NAMES: Record<number, { m: string; f: string }> = {
  1: { m: 'Ota', f: 'Ona' },
  2: { m: 'Bobo', f: 'Buvi' },
  3: { m: 'Katta bobo', f: 'Katta buvi' },
  4: { m: 'Bobokalon', f: 'Bobokalon (ayol)' },
  5: { m: 'Qat bobo', f: 'Qat buvi' },
  6: { m: 'Ajdod (Bobonozir)', f: 'Ajdod (ayol)' },
  7: { m: "Ulug' ajdod", f: "Ulug' ajdod (ayol)" },
};

const DESCENDANT_NAMES: Record<number, { m: string; f: string }> = {
  1: { m: "O'g'lingiz", f: "Qizingiz" },
  2: { m: "O'g'il nabirangiz", f: "Qiz nabirangiz" },
  3: { m: 'Evarangiz', f: 'Evarangiz' },
  4: { m: 'Chevarangiz', f: 'Chevarangiz' },
  5: { m: "Ebag'angiz", f: "Ebag'angiz" },
  6: { m: "Yuvg'angiz", f: "Yuvg'angiz" },
  7: { m: "Qovg'angiz", f: "Qovg'angiz" },
};

export function calculateKinship(
  fromId: string,
  toId: string,
  people: Record<string, Person>
): RelativeRelationInfo {
  const from = people[fromId];
  const to = people[toId];
  const base = { generationDiff: 0, isDirectAncestor: false, isDirectDescendant: false };

  if (!from || !to) {
    return { ...base, relationNameUz: "Noma'lum", description: "Shaxs ma'lumoti topilmadi", path: [] };
  }

  if (fromId === toId) {
    return {
      ...base,
      relationNameUz: "O'zingiz",
      description: "Sizning o'z profilingiz",
      path: [from.name],
      ancestorTitleUz: "O'zingiz (1-pusht)",
    };
  }

  // Turmush o'rtoq
  if (from.spouseId === toId || to.spouseId === fromId) {
    const isFemale = to.gender === 'female';
    return {
      ...base,
      relationNameUz: isFemale ? "Turmush o'rtog'ingiz (Rafiqangiz)" : "Turmush o'rtog'ingiz (Eringiz)",
      description: "Qonuniy turmush o'rtog'ingiz",
      path: [from.name, to.name],
      ancestorTitleUz: isFemale ? 'Rafiqangiz' : 'Eringiz',
    };
  }

  const A = ancestorMap(fromId, people);
  const B = ancestorMap(toId, people);

  // Eng yaqin umumiy ajdodni topamiz (a + b eng kichik)
  let best: { id: string; a: number; b: number; sideA: Side } | null = null;
  for (const [id, av] of Array.from(A.entries())) {
    const bv = B.get(id);
    if (!bv) continue;
    if (!best || av.dist + bv.dist < best.a + best.b) {
      best = { id, a: av.dist, b: bv.dist, sideA: av.side };
    }
  }

  if (!best) {
    return {
      ...base,
      relationNameUz: to.gender === 'female' ? 'Qarindosh ayol' : 'Qarindosh',
      description: 'Shajaradagi qarindoshingiz',
      path: [from.name, to.name],
    };
  }

  const { id: lcaId, a, b, sideA } = best;
  const isMale = to.gender === 'male';
  const sideText = sideA === 'father' ? 'otangiz tomonidan' : sideA === 'mother' ? 'onangiz tomonidan' : '';

  // 1. To'g'ridan-to'g'ri ajdod (ota, ona, bobo, buvi...)
  if (b === 0) {
    const names = ANCESTOR_NAMES[a];
    const title = names ? (isMale ? names.m : names.f) : `${a}-avlod ajdod`;
    return {
      ...base,
      relationNameUz: a === 2 ? `${title} (${sideText})` : title,
      description: `Sizdan ${a} avlod yuqori ajdodingiz`,
      generationDiff: a,
      path: [from.name, to.name],
      commonAncestorName: to.name,
      isDirectAncestor: true,
      ancestorTitleUz: title,
    };
  }

  // 2. To'g'ridan-to'g'ri avlod (farzand, nabira...)
  if (a === 0) {
    const names = DESCENDANT_NAMES[b];
    const title = names ? (isMale ? names.m : names.f) : `${b}-avlod nabira`;
    return {
      ...base,
      relationNameUz: title,
      description: `Sizdan ${b} avlod quyi zurriyotingiz`,
      generationDiff: -b,
      path: [from.name, to.name],
      commonAncestorName: from.name,
      isDirectDescendant: true,
    };
  }

  // 3. Aka-uka, opa-singil
  if (a === 1 && b === 1) {
    return {
      ...base,
      relationNameUz: isMale ? 'Akangiz / Ukangiz' : 'Opangiz / Singlingiz',
      description: 'Bir ota-onadan tug\'ilgan tug\'ishganingiz',
      path: [from.name, to.name],
    };
  }

  // 4. Amaki / Amma (otaning aka-uka/opa-singli) yoki Tog'a / Xola (onaning aka-uka/opa-singli)
  if (a === 2 && b === 1) {
    const isPaternal = sideA === 'father';
    const title = isPaternal ? (isMale ? 'Amaki' : 'Amma') : (isMale ? "Tog'a" : 'Xola');
    return {
      ...base,
      relationNameUz: `${title} (${sideText})`,
      description: `Bobongizning ${isMale ? 'o\'g\'li' : 'qizi'}, ${isPaternal ? 'otangizning' : 'onangizning'} tug'ishgani`,
      generationDiff: 1,
      path: [from.name, to.name],
      commonAncestorName: people[lcaId]?.name,
    };
  }

  // 5. Katta amaki/amma, katta tog'a/xola (bobo-buvining aka-uka/opa-singli)
  if (a === 3 && b === 1) {
    const isPaternal = sideA === 'father';
    const title = isPaternal ? (isMale ? 'Katta amaki' : 'Katta amma') : (isMale ? "Katta tog'a" : 'Katta xola');
    return {
      ...base,
      relationNameUz: `${title} (${sideText})`,
      description: 'Bobongizning tug\'ishgani',
      generationDiff: 2,
      path: [from.name, to.name],
      commonAncestorName: people[lcaId]?.name,
    };
  }

  // 6. Amakivachcha / Ammavachcha (otaning aka-singli farzandi) yoki Tog'avachcha / Xolavachcha (onaning)
  if (a === 2 && b === 2) {
    const parents = getParentLinks(to, people)
      .map((l) => people[l.id])
      .filter((p): p is Person => !!p);
    const uncleParent = parents.find((p) => getParentLinks(p, people).some((l) => l.id === lcaId));
    const parentIsMale = uncleParent ? uncleParent.gender === 'male' : true;
    const isPaternal = sideA === 'father';

    let title: string;
    if (isPaternal) {
      title = parentIsMale
        ? (isMale ? "Amakivachcha (o'g'il)" : 'Amakivachcha (qiz)')
        : (isMale ? "Ammavachcha (o'g'il)" : 'Ammavachcha (qiz)');
    } else {
      title = parentIsMale
        ? (isMale ? "Tog'avachcha (o'g'il)" : "Tog'avachcha (qiz)")
        : (isMale ? "Xolavachcha (o'g'il)" : 'Xolavachcha (qiz)');
    }

    return {
      ...base,
      relationNameUz: title,
      description: `Bobongiz orqali bog'langan ${isPaternal ? 'otangiz' : 'onangiz'} tomonidagi amakivachcha/tog'avachcha`,
      generationDiff: 0,
      path: [from.name, to.name],
      commonAncestorName: people[lcaId]?.name,
    };
  }

  // 7. Jiyan (aka-uka/opa-singil farzandi)
  if (a === 1 && b === 2) {
    return {
      ...base,
      relationNameUz: isMale ? "Jiyan (o'g'il)" : 'Jiyan (qiz)',
      description: "Akangiz yoki ukangizning farzandi",
      generationDiff: -1,
      path: [from.name, to.name],
      commonAncestorName: people[lcaId]?.name,
    };
  }

  // 8. Umumiy holat (uzoq qarindoshlar)
  const diff = a - b;
  let generalName = 'Qarindosh';
  if (a === b) generalName = 'Uzoq qarindosh (umumiy bobo-buvi orqali)';
  else if (diff > 0) generalName = 'Katta qarindosh (yuqori avlod)';
  else generalName = 'Kichik qarindosh (pastki avlod)';

  return {
    ...base,
    relationNameUz: generalName,
    description: `${people[lcaId]?.name || 'Umumiy ajdod'} nasli orqali bog'langan qarindoshingiz`,
    generationDiff: diff,
    path: [from.name, to.name],
    commonAncestorName: people[lcaId]?.name,
  };
}
