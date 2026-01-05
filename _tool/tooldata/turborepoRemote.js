
const getRemoteCachingConfigs = () => {
    const Vercel = {
        TURBO_TOKEN: process.env.vercelToken  ?? 'TURBO_TOKEN',
        TURBO_TEAM:  process.env.vercelTeam   ?? 'TURBO_TEAM',
    }
    
    return {
        vercel: Vercel,
    };
}

module.exports = getRemoteCachingConfigs();
 