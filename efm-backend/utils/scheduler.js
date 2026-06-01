// utils/scheduler.js
/**
 * Generates round-robin fixtures for an array of player IDs
 * @param {Array} playerIds - Array of MongoDB User Object IDs
 * @returns {Array} List of fixture objects containing matchday, playerA, and playerB
 */
const generateRoundRobin = (playerIds, rounds = 0) => {
    let list = [...playerIds];
    const isOdd = list.length % 2 !== 0;
    if (isOdd) {
        list.push('BYE');
    }

    const numPlayers = list.length;
    const maxRounds = numPlayers - 1;
    const totalRounds = rounds > 0 ? Math.min(rounds, maxRounds) : maxRounds;
    const matchesPerRound = numPlayers / 2;
    const fixtures = [];

    for (let round = 0; round < totalRounds; round++) {
        const matchday = round + 1;

        for (let match = 0; match < matchesPerRound; match++) {
            const home = list[match];
            const away = list[numPlayers - 1 - match];

            if (home !== 'BYE' && away !== 'BYE') {
                fixtures.push({
                    matchday,
                    playerA: home,
                    playerB: away
                });
            }
        }

        list.splice(1, 0, list.pop());
    }

    return fixtures;
};

module.exports = generateRoundRobin;