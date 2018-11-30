export async function fetchJSON(...args) {
  return fetch(...args).then(r => r.json());
}

export async function getGamesForGroup(groupId, cb) {
  let page = 1;
  const games = [];
  let stillGames = true;

  while (stillGames) {
    console.log("Fetching games page", page);
    const data = await fetchJSON(
      `https://www.the100.io/api/v2/groups/${groupId}/gaming_sessions?page=${page}`
    );

    games.push(...data);

    cb && cb(games);

    if (!data.length) {
      stillGames = false;
    }

    page += 1;
  }

  return games;
}

export async function getUserId() {
  const response = await fetch("https://www.the100.io/user");
  const userId = response.url.match(/\/users\/(\d+)/)[1];
  return userId;
}

export async function getUser(userId) {
  return await fetchJSON(`https://www.the100.io/api/v2/users/${userId}`);
}

export async function getSelfUser() {
  const userId = await getUserId();
  return await getUser(userId);
}
