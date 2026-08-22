import { Person, RelativeRelationInfo } from '../types';

export const UZBEK_ANCESTOR_TITLES: Record<number, { title: string; desc: string }> = {
  0: { title: "O'zingiz", desc: "Shajaradagi boshlang'ich shaxs" },
  1: { title: "Ota", desc: "1-avlod: To'g'ridan-to'g'ri ota" },
  2: { title: "Bobo", desc: "2-avlod: Otangizning otasi (Katta ota)" },
  3: { title: "Katta bobo", desc: "3-avlod: Bobongizning otasi" },
  4: { title: "Bobokalon", desc: "4-avlod: Katta bobongizning otasi" },
  5: { title: "Qat bobo", desc: "5-avlod: Bobokalongizning otasi" },
  6: { title: "Ajdod (Bobonozir)", desc: "6-avlod: Qat bobongizning otasi" },
  7: { title: "Ulug' ajdod (Tub bobo)", desc: "7-avlod: Shajarangizning 7-ajdodi" },
};

export const UZBEK_DESCENDANT_TITLES: Record<number, { title: string; desc: string }> = {
  1: { title: "Farzand (O'g'il / Qiz)", desc: "1-avlod quyi: Farzandingiz" },
  2: { title: "Nabira", desc: "2-avlod quyi: Farzandingizning bolasi" },
  3: { title: "Evara", desc: "3-avlod quyi: Nabirangizning bolasi" },
  4: { title: "Chevara", desc: "4-avlod quyi: Evarangizning bolasi" },
  5: { title: "Ebag'a", desc: "5-avlod quyi: Chevarangizning bolasi" },
  6: { title: "Yuvg'a", desc: "6-avlod quyi: Ebag'angizning bolasi" },
  7: { title: "Qovg'a", desc: "7-avlod quyi: Yuvg'angizning bolasi" },
};

// Get lineage from person up to root
export function getLineageToRoot(personId: string, people: Record<string, Person>): Person[] {
  const path: Person[] = [];
  let current: Person | undefined = people[personId];

  while (current) {
    path.push(current);
    if (!current.parentId) break;
    current = people[current.parentId];
  }

  return path;
}

// Get all children of a person
export function getChildren(personId: string, people: Record<string, Person>): Person[] {
  return Object.values(people).filter((p) => p.parentId === personId);
}

// Get siblings of a person
export function getSiblings(personId: string, people: Record<string, Person>): Person[] {
  const current = people[personId];
  if (!current || !current.parentId) return [];
  return Object.values(people).filter(
    (p) => p.parentId === current.parentId && p.id !== personId
  );
}

// Lowest Common Ancestor (LCA)
export function findLowestCommonAncestor(
  personIdA: string,
  personIdB: string,
  people: Record<string, Person>
): { lca: Person | null; pathA: Person[]; pathB: Person[] } {
  const pathA = getLineageToRoot(personIdA, people);
  const pathB = getLineageToRoot(personIdB, people);

  const pathAIds = new Set(pathA.map((p) => p.id));
  let lca: Person | null = null;

  for (const b of pathB) {
    if (pathAIds.has(b.id)) {
      lca = b;
      break;
    }
  }

  return { lca, pathA, pathB };
}

// Calculate Kinship relation from reference person (Me / Reference) to Target Person
export function calculateKinship(
  fromPersonId: string,
  toPersonId: string,
  people: Record<string, Person>
): RelativeRelationInfo {
  const fromPerson = people[fromPersonId];
  const toPerson = people[toPersonId];

  if (!fromPerson || !toPerson) {
    return {
      relationNameUz: "Noma'lum",
      description: "Shaxs ma'lumoti topilmadi",
      generationDiff: 0,
      path: [],
      isDirectAncestor: false,
      isDirectDescendant: false,
    };
  }

  if (fromPersonId === toPersonId) {
    return {
      relationNameUz: "O'zingiz",
      description: "Sizning o'z profilingiz",
      generationDiff: 0,
      path: [fromPerson.name],
      isDirectAncestor: false,
      isDirectDescendant: false,
      ancestorTitleUz: "O'zingiz (1-pusht)",
    };
  }

  const { lca, pathA, pathB } = findLowestCommonAncestor(fromPersonId, toPersonId, people);

  // Index of LCA in pathA (fromPerson up to root) and pathB (toPerson up to root)
  const distFrom = lca ? pathA.findIndex((p) => p.id === lca.id) : -1;
  const distTo = lca ? pathB.findIndex((p) => p.id === lca.id) : -1;

  const isMale = toPerson.gender === 'male';

  // 1. Direct Ancestor (toPerson is direct ancestor of fromPerson)
  if (lca && lca.id === toPersonId) {
    const steps = distFrom; // e.g. 1 = father, 2 = grandfather, etc.
    const titleInfo = UZBEK_ANCESTOR_TITLES[steps] || {
      title: `${steps}-ajdod bobo`,
      desc: `${steps}-avlod yuqori ajdod`,
    };
    return {
      relationNameUz: !isMale && steps === 1 ? 'Ona' : titleInfo.title,
      description: `Sizdan ${steps} avlod yuqori turuvchi to'g'ridan-to'g'ri ajdodingiz`,
      generationDiff: steps,
      path: pathA.slice(0, distFrom + 1).map((p) => p.name),
      commonAncestorName: toPerson.name,
      isDirectAncestor: true,
      isDirectDescendant: false,
      ancestorTitleUz: titleInfo.title,
    };
  }

  // 2. Direct Descendant (toPerson is child/grandchild of fromPerson)
  if (lca && lca.id === fromPersonId) {
    const steps = distTo;
    let title = isMale ? "O'g'lingiz" : "Qizingiz";
    if (steps === 2) title = isMale ? "O'g'il nabirangiz" : "Qiz nabirangiz";
    else if (steps === 3) title = "Evarangiz";
    else if (steps === 4) title = "Chevarangiz";
    else if (steps === 5) title = "Ebag'angiz";
    else if (steps === 6) title = "Yuvg'angiz";
    else if (steps >= 7) title = `${steps}-avlod chevarangiz`;

    return {
      relationNameUz: title,
      description: `Sizdan ${steps} avlod quyi turuvchi to'g'ridan-to'g'ri zurriyotingiz`,
      generationDiff: -steps,
      path: pathB.slice(0, distTo + 1).map((p) => p.name).reverse(),
      commonAncestorName: fromPerson.name,
      isDirectAncestor: false,
      isDirectDescendant: true,
    };
  }

  // 3. Siblings (Same Father)
  if (distFrom === 1 && distTo === 1) {
    const relationName = isMale ? "Akangiz / Ukangiz" : "Opangiz / Singlingiz";
    return {
      relationNameUz: relationName,
      description: "Bir ota-onadan tug'ilgan tug'ishganingiz",
      generationDiff: 0,
      path: [fromPerson.name, lca!.name, toPerson.name],
      commonAncestorName: lca?.name,
      isDirectAncestor: false,
      isDirectDescendant: false,
    };
  }

  // 4. Uncle / Aunt (distFrom = 2, distTo = 1) -> Father's Brother or Sister
  if (distFrom === 2 && distTo === 1) {
    const relationName = isMale ? "Amakingiz (Otangizning akasi/ukasi)" : "Ammangiz (Otangizning opasi/singlisi)";
    return {
      relationNameUz: relationName,
      description: `Otangizning ${isMale ? "og'asi / ukasi" : "opasi / singlisi"}`,
      generationDiff: 1,
      path: [fromPerson.name, pathA[1].name, lca!.name, toPerson.name],
      commonAncestorName: lca?.name,
      isDirectAncestor: false,
      isDirectDescendant: false,
    };
  }

  // 5. Great Uncle / Aunt (distFrom = 3, distTo = 1) -> Grandfather's Brother or Sister
  if (distFrom === 3 && distTo === 1) {
    const relationName = isMale ? "Katta amakingiz (Bobongizning akasi/ukasi)" : "Katta ammangiz (Bobongizning opasi/singlisi)";
    return {
      relationNameUz: relationName,
      description: `Bobongizning ${isMale ? "akasi/ukasi" : "opasi/singlisi"}`,
      generationDiff: 2,
      path: [fromPerson.name, pathA[1].name, pathA[2].name, lca!.name, toPerson.name],
      commonAncestorName: lca?.name,
      isDirectAncestor: false,
      isDirectDescendant: false,
    };
  }

  // 6. Cousin (distFrom = 2, distTo = 2) -> Amakivachcha / Ammavachcha
  if (distFrom === 2 && distTo === 2) {
    const parentOfTo = pathB[1];
    const isParentMale = parentOfTo?.gender === 'male';
    const relationName = isParentMale
      ? (isMale ? "Amakivachcha (o'g'il)" : "Amakivachcha (qiz)")
      : (isMale ? "Ammavachcha (o'g'il)" : "Ammavachcha (qiz)");

    return {
      relationNameUz: relationName,
      description: `Bobongiz orqali bog'langan ${isParentMale ? "amakingizning" : "ammangizning"} farzandi`,
      generationDiff: 0,
      path: [fromPerson.name, pathA[1].name, lca!.name, parentOfTo.name, toPerson.name],
      commonAncestorName: lca?.name,
      isDirectAncestor: false,
      isDirectDescendant: false,
    };
  }

  // 7. Nephew / Niece (distFrom = 1, distTo = 2) -> Jiyan
  if (distFrom === 1 && distTo === 2) {
    const relationName = isMale ? "Jiyaningiz (o'g'il jiyan)" : "Jiyaningiz (qiz jiyan)";
    return {
      relationNameUz: relationName,
      description: "Akangiz yoki ukangizning farzandi",
      generationDiff: -1,
      path: [fromPerson.name, lca!.name, pathB[1].name, toPerson.name],
      commonAncestorName: lca?.name,
      isDirectAncestor: false,
      isDirectDescendant: false,
    };
  }

  // 8. Distant Cousin / Sibling of higher level
  if (distFrom === distTo) {
    return {
      relationNameUz: `${distFrom}-darajali qarindosh (avlod tengdoshi)`,
      description: `${lca?.name || 'Umumiy bobo'} orqali tutashgan qarindoshingiz`,
      generationDiff: 0,
      path: [fromPerson.name, '...', lca?.name || '', '...', toPerson.name],
      commonAncestorName: lca?.name,
      isDirectAncestor: false,
      isDirectDescendant: false,
    };
  }

  // General classification based on generation difference
  const genDiff = distFrom - distTo;
  let generalName = "Qarindosh";
  if (genDiff > 0) {
    generalName = isMale ? `Katta qarindosh (amaki/tog'a avlodi, +${genDiff} pusht)` : `Katta qarindosh (amma/xola avlodi, +${genDiff} pusht)`;
  } else if (genDiff < 0) {
    generalName = isMale ? `Kichik qarindosh (jiyan/nabira avlodi, ${genDiff} pusht)` : `Kichik qarindosh (jiyan avlodi, ${genDiff} pusht)`;
  }

  return {
    relationNameUz: generalName,
    description: `${lca ? lca.name : 'Bobolar'} nasli orqali bog'langan qarindoshingiz`,
    generationDiff: genDiff,
    path: [fromPerson.name, lca ? lca.name : '', toPerson.name].filter(Boolean),
    commonAncestorName: lca?.name,
    isDirectAncestor: false,
    isDirectDescendant: false,
  };
}
