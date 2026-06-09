// ============================================================
// PeakFlow AI — Trello Integration Helper
// ============================================================

export async function fetchTrelloCards(config: {
  appKey?: string;
  token?: string;
  boardId?: string;
  listId?: string;
}) {
  const key = config.appKey;
  const token = config.token;
  const boardId = config.boardId;
  const listId = config.listId;

  if (!key || !token || (!boardId && !listId)) {
    throw new Error('Missing Trello configuration parameters (Key, Token, and Board/List ID)');
  }

  let url = '';
  if (listId) {
    url = `https://api.trello.com/1/lists/${listId}/cards?key=${key}&token=${token}`;
  } else {
    url = `https://api.trello.com/1/boards/${boardId}/cards?key=${key}&token=${token}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Trello API responded with status ${res.status}: ${errText}`);
  }

  const cards = await res.json();
  if (!Array.isArray(cards)) return [];

  return cards.map((card: any) => {
    const isCompleted = card.dueComplete === true || card.closed === true;
    const status: 'todo' | 'in_progress' | 'completed' = isCompleted ? 'completed' : 'todo';

    // Map labels to impactScore
    let impactScore = 3;
    if (card.labels && Array.isArray(card.labels)) {
      const labelsText = card.labels.map((l: any) => (l.name || l.color || '').toLowerCase());
      if (labelsText.some((l: string) => l.includes('high') || l.includes('urgent') || l.includes('red') || l.includes('critical'))) {
        impactScore = 5;
      } else if (labelsText.some((l: string) => l.includes('medium') || l.includes('orange') || l.includes('yellow'))) {
        impactScore = 3;
      } else if (labelsText.some((l: string) => l.includes('low') || l.includes('green') || l.includes('blue'))) {
        impactScore = 2;
      }
    }

    return {
      sourceId: card.id,
      title: card.name,
      estimatedDuration: 30, // default 30 min focus block
      impactScore,
      status,
    };
  });
}
