// utils/scheduler.js

/**
 * 🏟️ FORMAT A: Classic League (Multi-Round Round-Robin)
 * Generates matches, support legs, and flips home/away on even-numbered legs.
 * @param {Array} playerIds - Array of MongoDB User Object IDs
 * @param {Number} totalRounds - Number of rounds/legs to play (e.g., 2 for Home & Away)
 * @returns {Array} List of fixtures
 */
const generateClassicLeague = (playerIds, totalRounds = 1) => {
    let list = [...playerIds];
    const isOdd = list.length % 2 !== 0;
    if (isOdd) {
        list.push('BYE');
    }

    const numPlayers = list.length;
    const baseRoundsInSingleLeg = numPlayers - 1; 
    let baseLegFixtures = [];

    // --- STEP 1: Generate a single baseline leg template ---
    let rotationList = [...list];
    for (let round = 0; round < baseRoundsInSingleLeg; round++) {
        const baseMatchday = round + 1;
        const matchesPerRound = numPlayers / 2;

        for (let match = 0; match < matchesPerRound; match++) {
            const home = rotationList[match];
            const away = rotationList[numPlayers - 1 - match];

            if (home !== 'BYE' && away !== 'BYE') {
                baseLegFixtures.push({
                    baseMatchday,
                    playerA: home,
                    playerB: away
                });
            }
        }
        rotationList.splice(1, 0, rotationList.pop());
    }

    // --- STEP 2: Duplicate across multiple rounds/legs and flip sides ---
    let finalizedFixtures = [];
    let absoluteMatchday = 1;

    for (let leg = 1; leg <= totalRounds; leg++) {
        for (let roundNum = 1; roundNum <= baseRoundsInSingleLeg; roundNum++) {
            const dayMatches = baseLegFixtures.filter(f => f.baseMatchday === roundNum);
            
            if (dayMatches.length === 0) continue;

            dayMatches.forEach(match => {
                const swapSides = leg % 2 === 0;

                finalizedFixtures.push({
                    matchday: absoluteMatchday,
                    playerA: swapSides ? match.playerB : match.playerA,
                    playerB: swapSides ? match.playerA : match.playerB,
                    playerAScore: null,
                    playerBScore: null,
                    playerASubmittedScore: null,
                    playerBSubmittedScore: null,
                    status: 'pending'
                });
            });

            absoluteMatchday++;
        }
    }

    return finalizedFixtures;
};

/**
 * 🪓 FORMAT B: Knockout Bracket Elimination Engine
 * Builds standard single-elimination tournament trees with automated dynamic round naming
 * @param {Array} playerIds - Array of MongoDB User Object IDs 
 * @returns {Array} List of initialized pending structural match fixtures
 */
const generateKnockoutBracket = (playerIds) => {
    if (!playerIds || playerIds.length < 2) return [];

    let teams = [...playerIds];
    const totalTeamsCount = teams.length;

    // 1. Calculate the next highest power of 2 bracket size
    let bracketSize = 2;
    while (bracketSize < totalTeamsCount) {
        bracketSize *= 2;
    }

    const totalByesCount = bracketSize - totalTeamsCount;
    let fixtures = [];
    let currentRoundMatchday = 1;

    // Helper to resolve round name dynamically based on match numbers
    const getRoundLabel = (matchesCount) => {
        if (matchesCount === 1) return "Finals";
        if (matchesCount === 2) return "Semifinals";
        if (matchesCount === 4) return "Quarterfinals";
        return `Round of ${matchesCount * 2}`;
    };

    // 2. Handle Case A: Perfect power-of-two bracket (No Byes needed)
    if (totalByesCount === 0) {
        const matchesInRound = bracketSize / 2;
        const roundName = getRoundLabel(matchesInRound);

        for (let matchIdx = 0; matchIdx < matchesInRound; matchIdx++) {
            fixtures.push({
                matchday: currentRoundMatchday,
                roundName: roundName, // 🚀 FIXED: Dynamic naming injection
                stageType: 'knockout_stage',
                label: `R1_MATCH_${matchIdx + 1}`,
                playerA: teams[matchIdx * 2],
                playerB: teams[matchIdx * 2 + 1],
                playerAScore: null,
                playerBScore: null,
                playerASubmittedScore: null,
                playerBSubmittedScore: null,
                status: 'pending'
            });
        }
        return fixtures;
    }

    // 3. Handle Case B: Uneven bracket. Requires preliminary survival matches
    const playingTeamsCount = totalTeamsCount - totalByesCount; 
    const matchesInRound1 = playingTeamsCount / 2;

    // 🚀 FIXED: Dynamic round calculation for the opening matches based on bracket size limits
    const roundName = getRoundLabel(bracketSize / 2);

    const activeCompetitors = teams.slice(totalByesCount);

    for (let i = 0; i < matchesInRound1; i++) {
        fixtures.push({
            matchday: currentRoundMatchday,
            roundName: roundName, // 🚀 FIXED: Assigns proper context context
            stageType: 'knockout_stage',
            label: `R1_MATCH_${i + 1}`,
            playerA: activeCompetitors[i * 2],
            playerB: activeCompetitors[i * 2 + 1],
            playerAScore: null,
            playerBScore: null,
            playerASubmittedScore: null,
            playerBSubmittedScore: null,
            status: 'pending'
        });
    }
    
    return fixtures;
};

/**
 * 🏆 FORMAT C: Group + Knockout (Champions League Style Stage 1 Engine)
 * Splits players into micro-groups and generates independent round-robin fixtures for each group.
 * @param {Array} playerIds - Array of MongoDB User Object IDs
 * @param {Object} options - Configuration options { groupsCount: 4 }
 * @returns {Array} List of initialized group fixture objects containing group labels
 */
const generateGroupAndKnockout = (playerIds, options = { groupsCount: 4 }) => {
    if (!playerIds || playerIds.length < 4) return [];
    
    const teams = [...playerIds];
    const numGroups = parseInt(options.groupsCount, 10) || 4;
    
    let groupBuckets = Array.from({ length: numGroups }, () => []);
    
    teams.forEach((teamId, index) => {
        const groupTargetIndex = index % numGroups;
        groupBuckets[groupTargetIndex].push(teamId);
    });
    
    let allGroupFixtures = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    
    groupBuckets.forEach((groupPlayers, groupIdx) => {
        const groupLabel = alphabet[groupIdx] || `Group ${groupIdx + 1}`;
        let list = [...groupPlayers];
        
        const isOdd = list.length % 2 !== 0;
        if (isOdd) {
            list.push('BYE');
        }
        
        const numPlayersInGroup = list.length;
        const totalRoundsInGroup = numPlayersInGroup - 1;
        const matchesPerRound = numPlayersInGroup / 2;
        
        let rotationList = [...list];
        
        for (let round = 0; round < totalRoundsInGroup; round++) {
            const matchday = round + 1;
            
            for (let match = 0; match < matchesPerRound; match++) {
                const home = rotationList[match];
                const away = rotationList[rotationList.length - 1 - match];
                
                if (home !== 'BYE' && away !== 'BYE') {
                    allGroupFixtures.push({
                        matchday,
                        stageType: 'group_stage',
                        groupLabel, 
                        playerA: home,
                        playerB: away,
                        playerAScore: null,
                        playerBScore: null,
                        playerASubmittedScore: null,
                        playerBSubmittedScore: null,
                        status: 'pending'
                    });
                }
            }
            
            rotationList.splice(1, 0, rotationList.pop());
        }
    });
    
    return allGroupFixtures.sort((a, b) => a.matchday - b.matchday);
};

module.exports = {
    generateClassicLeague,
    generateKnockoutBracket,
    generateGroupAndKnockout
};