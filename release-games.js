// Keep unfinished games out of both the launcher and direct game links.
// Add an ID here only after its mobile layout and interactions are ready.
const releasedGames = new Set([
  '2048', 'twentyfour', 'link', 'stars', 'lights',
  'fifteen', 'pipes', 'nonogram', 'guess',
]);

export const isGameReleased = id => releasedGames.has(id);
