export interface ChessLesson {
  id: string;
  chapterId: number;
  chapterTitle: string;
  chapterBadge: string;
  title: string;
  subtitle: string;
  category: 'basics' | 'tactics' | 'mating' | 'strategy' | 'endgame';
  difficulty: 'Einsteiger' | 'Fortgeschritten' | 'Meister';
  conceptExplanation: string;
  proTip: string;
  goalDescription: string;
  hint: string;
  playerColor: 'w' | 'b';
  initialFen: string;
  // Moves in SAN or "from-to" (e.g. "e1g1" or "O-O" or "Nxc7+")
  correctMoves: string[];
  // If multi-move, opponent reply and next player move
  continuation?: {
    opponentMove: string; // SAN e.g. "Kd8"
    nextCorrectMoves: string[]; // SAN e.g. ["Nxa8"]
  };
}

export interface LearningChapter {
  id: number;
  title: string;
  badge: string;
  description: string;
  iconName: 'Shield' | 'Zap' | 'Crown' | 'Target' | 'Award';
}

export const LEARNING_CHAPTERS: LearningChapter[] = [
  {
    id: 1,
    title: 'Kapitel 1: Grundlagen & Spezialzüge',
    badge: 'Station 1',
    description: 'Rochade, En Passant, Bauernumwandlung und Figurenbewegung meistern.',
    iconName: 'Shield',
  },
  {
    id: 2,
    title: 'Kapitel 2: Taktische Meisterwaffen',
    badge: 'Station 2',
    description: 'Gabeln, tödliche Fesselungen, Spieße und Abzugsschach anwenden.',
    iconName: 'Zap',
  },
  {
    id: 3,
    title: 'Kapitel 3: Königsangriff & Mattbilder',
    badge: 'Station 3',
    description: 'Klassische Mattmuster: Grundreihe, Schäfermatt, ersticktes Matt.',
    iconName: 'Crown',
  },
  {
    id: 4,
    title: 'Kapitel 4: Strategie & Eröffnung',
    badge: 'Station 4',
    description: 'Zentrumsbeherrschung, zügige Entwicklung und Königssicherheit.',
    iconName: 'Target',
  },
  {
    id: 5,
    title: 'Kapitel 5: Endspiel-Geheimnisse',
    badge: 'Station 5',
    description: 'Opposition des Königs, Quadratregel und die Lucena-Brücke.',
    iconName: 'Award',
  },
];

export const CHESS_LESSONS: ChessLesson[] = [
  // ================= KAPITEL 1 =================
  {
    id: 'lesson-1',
    chapterId: 1,
    chapterTitle: 'Kapitel 1: Grundlagen & Spezialzüge',
    chapterBadge: 'Lektion 1',
    title: 'Die Rochade (Königssicherheit)',
    subtitle: 'Bringe deinen König in Sicherheit und aktiviere deinen Turm',
    category: 'basics',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Die Rochade ist der einzige Sonderzug im Schach, bei dem zwei Figuren gleichzeitig ziehen. Sie bringt den König aus der gefährlichen Mitte an den Flügel und bringt den Turm ins Spiel.',
    proTip: 'Rociere möglichst früh in der Partie (meistens Züge 4–9), um Angriffe auf der e-Linie zu verhindern!',
    goalDescription: 'Weiß am Zug: Führe die kurze Rochade (O-O) aus!',
    hint: 'Ziehe den weißen König zwei Felder nach rechts auf das Feld g1.',
    playerColor: 'w',
    initialFen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5',
    correctMoves: ['O-O', 'e1g1'],
  },
  {
    id: 'lesson-2',
    chapterId: 1,
    chapterTitle: 'Kapitel 1: Grundlagen & Spezialzüge',
    chapterBadge: 'Lektion 2',
    title: 'En Passant (Schlagen im Vorbeigehen)',
    subtitle: 'Die wichtigste Sonderregel für Bauern',
    category: 'basics',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Zieht ein gegnerischer Bauer vom Ausgangsfeld zwei Schritte vor und landet direkt neben deinem Bauern, darfst du ihn im unmittelbar nächsten Zug so schlagen, als wäre er nur ein Feld vorgerückt.',
    proTip: 'En Passant muss sofort im nächsten Zug gespielt werden – sonst verfällt das Recht für diesen Bauern!',
    goalDescription: 'Schwarz zog gerade f7-f5. Schlage den Bauern en passant mit deinem Bauern e5!',
    hint: 'Ziehe den Bauern von e5 diagonal nach f6.',
    playerColor: 'w',
    initialFen: 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
    correctMoves: ['exf6', 'e5f6'],
  },
  {
    id: 'lesson-3',
    chapterId: 1,
    chapterTitle: 'Kapitel 1: Grundlagen & Spezialzüge',
    chapterBadge: 'Lektion 3',
    title: 'Die Bauernumwandlung',
    subtitle: 'Ein Bauer wird zur stärksten Figur auf dem Brett',
    category: 'basics',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Erreicht ein Bauer die gegnerische Grundreihe (Reihe 8 für Weiß, Reihe 1 für Schwarz), wandelt er sich sofort in eine Dame, einen Turm, einen Läufer oder einen Springer um.',
    proTip: 'In 99% aller Fälle wählt man die Dame – sie besitzt die höchste Durchschlagskraft.',
    goalDescription: 'Weiß am Zug: Ziehe deinen Freibauern nach e8 und wandle ihn in eine Dame um!',
    hint: 'Ziehe den Bauern von e7 nach e8.',
    playerColor: 'w',
    initialFen: '8/4P3/8/8/8/6k1/8/6K1 w - - 0 1',
    correctMoves: ['e8=Q', 'e8=Q+', 'e7e8q'],
  },
  {
    id: 'lesson-4',
    chapterId: 1,
    chapterTitle: 'Kapitel 1: Grundlagen & Spezialzüge',
    chapterBadge: 'Lektion 4',
    title: 'Der Springer-Sprung',
    subtitle: 'Überspringe Figuren und schlage die ungedeckte Figur',
    category: 'basics',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Der Springer ist die einzige Figur, die über eigene und gegnerische Steine hinwegspringen kann. Er bewegt sich immer in einer L-Form (2 Felder gerade, 1 Feld zur Seite).',
    proTip: 'Springer am Rand bringt Schand – Springer gehören ins aktive Zentrum!',
    goalDescription: 'Weiß am Zug: Schlage den ungedeckten schwarzen Springer auf e4!',
    hint: 'Der weiße Springer auf c3 kann das Feld e4 im L-Sprung anspringen.',
    playerColor: 'w',
    initialFen: 'rnbqkb1r/pppppppp/8/8/4n3/2N5/PPPPPPPP/R1BQKBNR w KQkq - 2 3',
    correctMoves: ['Nxe4', 'c3e4'],
  },

  // ================= KAPITEL 2 =================
  {
    id: 'lesson-5',
    chapterId: 2,
    chapterTitle: 'Kapitel 2: Taktische Meisterwaffen',
    chapterBadge: 'Lektion 5',
    title: 'Die königliche Springergabel',
    subtitle: 'Zwei Figuren mit einem einzigen Zug gleichzeitig bedrohen',
    category: 'tactics',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Eine Gabel (Doppelangriff) greift zwei gegnerische Figuren gleichzeitig an. Besonders gefürchtet ist die Springergabel mit Schachgebot, da der König ziehen muss und die andere Figur verloren geht.',
    proTip: 'Suche immer nach ungedeckten Feldern wie c7 oder f7, von denen aus dein Springer König und Turm gabeln kann.',
    goalDescription: 'Weiß am Zug: Setze den Springer auf c7, um König und Turm gleichzeitig anzugreifen!',
    hint: 'Dein Springer auf d5 springt nach c7 mit Schachgebot.',
    playerColor: 'w',
    initialFen: 'r3k3/ppp2ppp/8/3N4/8/8/PPP2PPP/4K3 w - - 0 1',
    correctMoves: ['Nxc7+', 'd5c7'],
    continuation: {
      opponentMove: 'Kd8',
      nextCorrectMoves: ['Nxa8', 'c7a8'],
    },
  },
  {
    id: 'lesson-6',
    chapterId: 2,
    chapterTitle: 'Kapitel 2: Taktische Meisterwaffen',
    chapterBadge: 'Lektion 6',
    title: 'Die absolute Fesselung',
    subtitle: 'Eine Figur bewegungsunfähig machen und gewinnbringend schlagen',
    category: 'tactics',
    difficulty: 'Fortgeschritten',
    conceptExplanation:
      'Eine Fesselung liegt vor, wenn eine Figur nicht ziehen darf, weil dahinter der eigene König steht (absolut) oder eine wertvollere Figur verloren ginge (relativ).',
    proTip: 'Gefesselte Figuren können nicht verteidigen! Greife gefesselte Figuren mehrfach an.',
    goalDescription: 'Weiß am Zug: Schlage die gefesselte schwarze Dame auf e2 mit deinem Turm!',
    hint: 'Der weiße Turm auf e1 fesselt die Dame gegen den König auf e8.',
    playerColor: 'w',
    initialFen: '4k3/8/8/8/8/8/4qPPP/4R1K1 w - - 0 1',
    correctMoves: ['Rxe2+', 'e1e2'],
  },
  {
    id: 'lesson-7',
    chapterId: 2,
    chapterTitle: 'Kapitel 2: Taktische Meisterwaffen',
    chapterBadge: 'Lektion 7',
    title: 'Der Spieß (Skewer)',
    subtitle: 'Der umgekehrte Doppelangriff durch die gegnerische Linie',
    category: 'tactics',
    difficulty: 'Fortgeschritten',
    conceptExplanation:
      'Beim Spieß wird eine wertvolle Figur (z.B. der König) angegriffen. Weicht sie aus, wird die dahinterstehende Figur (z.B. der Turm) geschlagen.',
    proTip: 'Linien und Diagonalen mit König und Schwerfiguren des Gegners sind ideale Ziele für Spieße!',
    goalDescription: 'Weiß am Zug: Gib Schach auf der 8. Reihe, um den dahinterstehenden Turm aufzudecken!',
    hint: 'Ziehe deinen Turm von a1 nach a8.',
    playerColor: 'w',
    initialFen: '4k2r/8/8/8/8/8/8/R3K3 w - - 0 1',
    correctMoves: ['Ra8+', 'a1a8'],
    continuation: {
      opponentMove: 'Kd7',
      nextCorrectMoves: ['Rxh8', 'a8h8'],
    },
  },
  {
    id: 'lesson-8',
    chapterId: 2,
    chapterTitle: 'Kapitel 2: Taktische Meisterwaffen',
    chapterBadge: 'Lektion 8',
    title: 'Der Abzugsangriff mit Schach',
    subtitle: 'Zwei Drohungen gleichzeitig mit einem Abzugsschritt erschaffen',
    category: 'tactics',
    difficulty: 'Fortgeschritten',
    conceptExplanation:
      'Zieht eine Figur beiseite, deckt sie den Angriff einer dahinterstehenden Linienfigur (Turm, Dame, Läufer) auf. Dies nennt man Abzugsangriff – ist es ein Schach, ist es oft tödlich.',
    proTip: 'Achte immer darauf, wenn sich dein Läufer oder Springer vor einem deiner Türme auf der gleichen Linie wie der gegnerische König befindet!',
    goalDescription: 'Weiß am Zug: Ziehe den Läufer nach c6 mit Abzugsschach des Turms und Angriff auf die Dame!',
    hint: 'Dein Läufer auf e4 zieht nach c6 und gibt Abzugsschach durch den Turm e1.',
    playerColor: 'w',
    initialFen: '4k3/8/8/q7/4B3/8/8/4R1K1 w - - 0 1',
    correctMoves: ['Bc6+', 'e4c6'],
  },

  // ================= KAPITEL 3 =================
  {
    id: 'lesson-9',
    chapterId: 3,
    chapterTitle: 'Kapitel 3: Königsangriff & Mattbilder',
    chapterBadge: 'Lektion 9',
    title: 'Das Grundreihenmatt',
    subtitle: 'Wenn die eigenen Bauern zur tödlichen Falle werden',
    category: 'mating',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Haben die Bauern vor dem rochierten König noch nicht gezogen, kann der König nicht nach vorne fliehen. Ein Turm oder eine Dame auf der Grundreihe bedeutet sofortiges Schachmatt.',
    proTip: 'Mache rechtzeitig ein Luftloch (z.B. h2-h3 oder g2-g3), damit dein eigener König dem Grundreihenmatt entkommen kann.',
    goalDescription: 'Weiß am Zug: Setze den gegnerischen König mit deinem Turm auf der Grundreihe matt!',
    hint: 'Ziehe den Turm von d1 ganz nach d8.',
    playerColor: 'w',
    initialFen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
    correctMoves: ['Rd8#', 'd1d8'],
  },
  {
    id: 'lesson-10',
    chapterId: 3,
    chapterTitle: 'Kapitel 3: Königsangriff & Mattbilder',
    chapterBadge: 'Lektion 10',
    title: 'Das klassische Schäfermatt',
    subtitle: 'Den schwächsten Punkt der gegnerischen Stellung (f7) ausnutzen',
    category: 'mating',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Zu Beginn der Partie ist der Bauer auf f7 (bzw. f2) der verwundbarste Punkt, da er nur vom König gedeckt wird. Unterstützt vom Läufer c4 schlägt die Dame auf f7 matt.',
    proTip: 'Lerne dieses Motiv sowohl zum schnellen Bestrafen von Fehlern als auch zur soliden Abwehr mit Sf6 oder g6!',
    goalDescription: 'Weiß am Zug: Schlage mit der Dame auf f7 für den finalen Mattzug!',
    hint: 'Ziehe die Dame von f3 nach f7.',
    playerColor: 'w',
    initialFen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    correctMoves: ['Qxf7#', 'f3f7'],
  },
  {
    id: 'lesson-11',
    chapterId: 3,
    chapterTitle: 'Kapitel 3: Königsangriff & Mattbilder',
    chapterBadge: 'Lektion 11',
    title: 'Das erstickte Matt (Smothered Mate)',
    subtitle: 'Der gegnerische König erstickt in den eigenen Reihen',
    category: 'mating',
    difficulty: 'Fortgeschritten',
    conceptExplanation:
      'Ein spektakuläres Mattbild: Der gegnerische König ist komplett von seinen eigenen Steinen umzingelt und kann sich nicht rühren. Ein einziger Springerzug bringt die Entscheidung!',
    proTip: 'Springer sind die einzigen Figuren, die über die umzingelnden Bauern und Türme hinweg Schach bieten können.',
    goalDescription: 'Weiß am Zug: Führe das erstickte Matt mit deinem Springer auf f7 aus!',
    hint: 'Der Springer auf h6 springt auf das Feld f7.',
    playerColor: 'w',
    initialFen: '6rk/6pp/7N/8/8/8/8/4K3 w - - 0 1',
    correctMoves: ['Nf7#', 'h6f7'],
  },
  {
    id: 'lesson-12',
    chapterId: 3,
    chapterTitle: 'Kapitel 3: Königsangriff & Mattbilder',
    chapterBadge: 'Lektion 12',
    title: 'Das Treppenmatt (Rasenmähermatt)',
    subtitle: 'Zwei Schwerfiguren drängen den König schrittweise an den Rand',
    category: 'mating',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Beim Treppenmatt schneidet ein Turm die Fluchtlinie ab, während der zweite Turm dem König Schach bietet. Wie auf einer Treppe rollen die Türme den König an den Brettrand.',
    proTip: 'Turm 1 schneidet ab, Turm 2 gibt Schach – wechsle die Türme rhythmisch ab!',
    goalDescription: 'Weiß am Zug: Setze den abgeschnittenen schwarzen König auf der a-Linie matt!',
    hint: 'Der Turm auf a1 zieht nach a8.',
    playerColor: 'w',
    initialFen: 'k7/8/1K6/8/8/8/1R6/R7 w - - 0 1',
    correctMoves: ['Ra8#', 'a1a8', 'Rb8#', 'b2b8'],
  },

  // ================= KAPITEL 4 =================
  {
    id: 'lesson-13',
    chapterId: 4,
    chapterTitle: 'Kapitel 4: Strategie & Eröffnung',
    chapterBadge: 'Lektion 13',
    title: 'Die goldene Zentrumsregel',
    subtitle: 'Wer das Zentrum beherrscht, kontrolliert das Spiel',
    category: 'strategy',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Die vier Zentrumsfelder (e4, d4, e5, d5) sind das Herzstück des Schachbretts. Ein Zentrums-Bauer kontrolliert wichtige Fluchtfelder und öffnet Wege für Dame und Läufer.',
    proTip: 'Eröffne fast immer mit e4 oder d4, um sofort Raum im Zentrum zu beanspruchen!',
    goalDescription: 'Weiß am Zug: Eröffne die Partie mit dem stärksten Zentrumsstoß (e4)!',
    hint: 'Bewege deinen Königsbauern von e2 zwei Felder vor nach e4.',
    playerColor: 'w',
    initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    correctMoves: ['e4', 'e2e4'],
  },
  {
    id: 'lesson-14',
    chapterId: 4,
    chapterTitle: 'Kapitel 4: Strategie & Eröffnung',
    chapterBadge: 'Lektion 14',
    title: 'Springer vor Läufer entwickeln',
    subtitle: 'Aktive Figuren ins Spiel bringen und Gegenzentrum bedrohen',
    category: 'strategy',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'In der Eröffnung gilt der eiserne Grundsatz: Entwickle deine Figuren schnell. Der Königsspringer auf f3 greift sofort den Bauern e5 an und bereitet die Rochade vor.',
    proTip: 'Ziehe in der Eröffnung nicht dieselbe Figur mehrfach, bevor nicht alle Leichtfiguren im Spiel sind!',
    goalDescription: 'Schwarz hat mit e5 geantwortet. Entwickle deinen Springer nach f3!',
    hint: 'Bewege den Springer von g1 nach f3.',
    playerColor: 'w',
    initialFen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    correctMoves: ['Nf3', 'g1f3'],
  },
  {
    id: 'lesson-15',
    chapterId: 4,
    chapterTitle: 'Kapitel 4: Strategie & Eröffnung',
    chapterBadge: 'Lektion 15',
    title: 'Die Italienische Partie (Bc4)',
    subtitle: 'Druck auf f7 aufbauen und Rochade vollenden',
    category: 'strategy',
    difficulty: 'Einsteiger',
    conceptExplanation:
      'Der Zug Lc4 bringt den weißfeldrigen Läufer auf seine gefährlichste Diagonale. Er zielt direkt auf den schwachen Bauern f7 und räumt die letzte Figur zwischen König und Turm weg.',
    proTip: 'Nach Lc4 bist du bereit, im nächsten Zug mit O-O zu rochieren!',
    goalDescription: 'Weiß am Zug: Entwickle den Läufer nach c4!',
    hint: 'Ziehe den Läufer von f1 nach c4.',
    playerColor: 'w',
    initialFen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    correctMoves: ['Bc4', 'f1c4'],
  },

  // ================= KAPITEL 5 =================
  {
    id: 'lesson-16',
    chapterId: 5,
    chapterTitle: 'Kapitel 5: Endspiel-Geheimnisse',
    chapterBadge: 'Lektion 16',
    title: 'Die direkte Opposition des Königs',
    subtitle: 'Die wichtigste Waffe im reinen Bauernendspiel',
    category: 'endgame',
    difficulty: 'Fortgeschritten',
    conceptExplanation:
      'Zwei Könige stehen sich mit genau einem Leerfeld Abstand gegenüber. Derjenige, der NICHT am Zug ist, besitzt die Opposition – er zwingt den anderen König, zur Seite auszuweichen!',
    proTip: 'Wer die Opposition im Bauernendspiel hat, entscheidet über Sieg oder Remis.',
    goalDescription: 'Weiß am Zug: Nimm die direkte Opposition ein, indem du vor den schwarzen König trittst!',
    hint: 'Ziehe deinen König nach e4 direkt gegenüber von e6.',
    playerColor: 'w',
    initialFen: '8/8/4k3/8/8/8/4K3/8 w - - 0 1',
    correctMoves: ['Ke4', 'e2e4', 'Ke3', 'e2e3'],
  },
  {
    id: 'lesson-17',
    chapterId: 5,
    chapterTitle: 'Kapitel 5: Endspiel-Geheimnisse',
    chapterBadge: 'Lektion 17',
    title: 'Das Quadrat des Bauern',
    subtitle: 'Berechne sofort im Kopf, ob der König den Bauern einholen kann',
    category: 'endgame',
    difficulty: 'Fortgeschritten',
    conceptExplanation:
      'Konstruiere im Geiste ein Quadrat vom Bauern bis zum Umwandlungsfeld. Steht der gegnerische König außerhalb dieses Quadrats und du ziehst, kann er den Bauern niemals mehr einholen!',
    proTip: 'Zähle die Schritte zur Grundreihe – die gleiche Schrittanzahl zur Seite bildet das magische Quadrat.',
    goalDescription: 'Weiß am Zug: Ziehe deinen Freibauern nach e8 und kröne ihn zur Dame!',
    hint: 'Ziehe den Bauern von e7 nach e8.',
    playerColor: 'w',
    initialFen: '8/4P3/8/8/2k5/8/8/4K3 w - - 0 1',
    correctMoves: ['e8=Q', 'e8=Q+', 'e7e8q'],
  },
  {
    id: 'lesson-18',
    chapterId: 5,
    chapterTitle: 'Kapitel 5: Endspiel-Geheimnisse',
    chapterBadge: 'Lektion 18',
    title: 'Damenmatt am Brettrand',
    subtitle: 'Präziser Mattabschluss mit Dame und König',
    category: 'endgame',
    difficulty: 'Fortgeschritten',
    conceptExplanation:
      'Im Endspiel König + Dame gegen König treibst du den gegnerischen König an den Rand. Der eigene König deckt die Dame, die direkt vor den gegnerischen König tritt für Schachmatt.',
    proTip: 'Achte auf Patt! Lass dem gegnerischen König immer mindestens ein Feld, solange du noch nicht matt setzt.',
    goalDescription: 'Weiß am Zug: Setze den schwarzen König in der Ecke mit Qg7# matt!',
    hint: 'Ziehe die weiße Dame von h1 nach g7.',
    playerColor: 'w',
    initialFen: '7k/8/5K2/8/8/8/8/7Q w - - 0 1',
    correctMoves: ['Qg7#', 'h1g7'],
  },
];
