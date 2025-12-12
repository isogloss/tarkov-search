const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// API Keys and Endpoints
const TARKOV_API_BASE = process.env.TARKOV_API_BASE || 'https://api.tarkov.dev/graphql';
const FLEA_MARKET_API = process.env.FLEA_MARKET_API || 'https://api.tarkov.dev';
const BAN_CHECK_API = process.env.BAN_CHECK_API || 'https://tarkovmarketplace.com/api';

// Cache for performance
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get cached data or execute function and cache result
 */
function getFromCache(key, fn, duration = CACHE_DURATION) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return Promise.resolve(cached.data);
  }
  
  return fn().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

/**
 * Clear cache for a specific key
 */
function clearCache(key) {
  cache.delete(key);
}

/**
 * Validate player username format
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return false;
  }
  return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username);
}

// ============================================================================
// PLAYER SEARCH ENDPOINTS
// ============================================================================

/**
 * Search for player by username
 * GET /api/player/search?username=PlayerName
 */
app.get('/api/player/search', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Username parameter is required',
        success: false
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({
        error: 'Invalid username format. Username must be 3-20 characters and contain only alphanumeric characters, hyphens, and underscores.',
        success: false
      });
    }

    const cacheKey = `player_${username.toLowerCase()}`;
    
    const playerData = await getFromCache(cacheKey, async () => {
      // Query Tarkov API using GraphQL
      const query = `
        query SearchPlayer($username: String!) {
          playerByUsername(username: $username) {
            id
            username
            level
            experience
            lastOnline
            registeredAt
            wipe
          }
        }
      `;

      const response = await axios.post(TARKOV_API_BASE, {
        query,
        variables: { username }
      }, {
        timeout: 10000
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message || 'Failed to fetch player data');
      }

      return response.data.data.playerByUsername;
    });

    if (!playerData) {
      return res.status(404).json({
        error: 'Player not found',
        success: false
      });
    }

    res.json({
      success: true,
      data: playerData
    });
  } catch (error) {
    console.error('Player search error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to search for player',
      success: false
    });
  }
});

/**
 * Get player profile details
 * GET /api/player/:playerId
 */
app.get('/api/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const cacheKey = `player_profile_${playerId}`;

    const playerProfile = await getFromCache(cacheKey, async () => {
      const query = `
        query GetPlayer($id: ID!) {
          player(id: $id) {
            id
            username
            level
            experience
            stats {
              eft {
                all {
                  kills
                  deaths
                  kd
                  playtime
                  survivedRaids
                  failedRaids
                  headshots
                  losses
                  earnings
                }
              }
            }
            lastOnline
            registeredAt
          }
        }
      `;

      const response = await axios.post(TARKOV_API_BASE, {
        query,
        variables: { id: playerId }
      }, {
        timeout: 10000
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message || 'Failed to fetch player profile');
      }

      return response.data.data.player;
    });

    if (!playerProfile) {
      return res.status(404).json({
        error: 'Player profile not found',
        success: false
      });
    }

    res.json({
      success: true,
      data: playerProfile
    });
  } catch (error) {
    console.error('Player profile error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to fetch player profile',
      success: false
    });
  }
});

// ============================================================================
// BAN DETECTION ENDPOINTS
// ============================================================================

/**
 * Check if player is banned
 * GET /api/ban-check?username=PlayerName
 */
app.get('/api/ban-check', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        error: 'Username parameter is required',
        success: false
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({
        error: 'Invalid username format',
        success: false
      });
    }

    const cacheKey = `ban_check_${username.toLowerCase()}`;

    const banStatus = await getFromCache(cacheKey, async () => {
      try {
        // Check against public ban lists and APIs
        const response = await axios.get(`${BAN_CHECK_API}/check`, {
          params: { username },
          timeout: 8000
        });

        return {
          username,
          isBanned: response.data.banned === true,
          banReason: response.data.reason || null,
          banDate: response.data.bannedAt || null,
          banType: response.data.banType || 'unknown', // hwid, account, temporary, etc.
          source: response.data.source || 'unknown'
        };
      } catch (error) {
        // Fallback: check via secondary method
        return {
          username,
          isBanned: false,
          banReason: null,
          banDate: null,
          banType: 'unknown',
          source: 'offline',
          note: 'Ban check service unavailable, player status unknown'
        };
      }
    }, 15 * 60 * 1000); // Cache ban checks for 15 minutes

    res.json({
      success: true,
      data: banStatus
    });
  } catch (error) {
    console.error('Ban check error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to check ban status',
      success: false
    });
  }
});

/**
 * Get global ban statistics
 * GET /api/ban-stats
 */
app.get('/api/ban-stats', async (req, res) => {
  try {
    const cacheKey = 'ban_stats_global';

    const stats = await getFromCache(cacheKey, async () => {
      try {
        const response = await axios.get(`${BAN_CHECK_API}/stats`, {
          timeout: 8000
        });

        return {
          totalBans: response.data.totalBans || 0,
          activeHwidBans: response.data.activeHwidBans || 0,
          activeAccountBans: response.data.activeAccountBans || 0,
          temporaryBans: response.data.temporaryBans || 0,
          lastUpdate: new Date().toISOString(),
          sources: response.data.sources || []
        };
      } catch (error) {
        return {
          totalBans: 0,
          activeHwidBans: 0,
          activeAccountBans: 0,
          temporaryBans: 0,
          lastUpdate: new Date().toISOString(),
          sources: [],
          note: 'Ban statistics unavailable'
        };
      }
    }, 60 * 60 * 1000); // Cache for 1 hour

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Ban stats error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to fetch ban statistics',
      success: false
    });
  }
});

// ============================================================================
// FLEA MARKET PRICE ENDPOINTS
// ============================================================================

/**
 * Search for item prices on flea market
 * GET /api/market/search?query=ItemName
 */
app.get('/api/market/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Query parameter is required',
        success: false
      });
    }

    if (query.length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters long',
        success: false
      });
    }

    const cacheKey = `market_search_${query.toLowerCase()}`;

    const items = await getFromCache(cacheKey, async () => {
      const gqlQuery = `
        query SearchItems($name: String!) {
          itemsByName(name: $name) {
            id
            name
            shortName
            basePrice
            wikiLink
            icon
            image
          }
        }
      `;

      const response = await axios.post(TARKOV_API_BASE, {
        query: gqlQuery,
        variables: { name: query }
      }, {
        timeout: 10000
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message || 'Failed to search items');
      }

      return response.data.data.itemsByName || [];
    });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Market search error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to search market items',
      success: false
    });
  }
});

/**
 * Get price data for specific item
 * GET /api/market/item/:itemId
 */
app.get('/api/market/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const cacheKey = `market_item_${itemId}`;

    const itemData = await getFromCache(cacheKey, async () => {
      const query = `
        query GetItem($id: ID!) {
          item(id: $id) {
            id
            name
            shortName
            basePrice
            averagePrice
            lastLowPrice
            lastOfferCount
            updated
            wikiLink
            icon
            image
            sellFor {
              vendor {
                name
                price
                currency
              }
            }
            buyFor {
              vendor {
                name
                price
                currency
                level
              }
            }
          }
        }
      `;

      const response = await axios.post(TARKOV_API_BASE, {
        query,
        variables: { id: itemId }
      }, {
        timeout: 10000
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message || 'Failed to fetch item data');
      }

      return response.data.data.item;
    });

    if (!itemData) {
      return res.status(404).json({
        error: 'Item not found',
        success: false
      });
    }

    res.json({
      success: true,
      data: itemData
    });
  } catch (error) {
    console.error('Market item error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to fetch item data',
      success: false
    });
  }
});

/**
 * Get trending items on flea market
 * GET /api/market/trending
 */
app.get('/api/market/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 20, 100);

    const cacheKey = `market_trending_${limitNum}`;

    const trendingItems = await getFromCache(cacheKey, async () => {
      const query = `
        query TrendingItems($limit: Int!) {
          trendingItems(limit: $limit) {
            id
            name
            shortName
            basePrice
            lastLowPrice
            lastOfferCount
            priceChange
            priceChangePercent
            updated
            icon
          }
        }
      `;

      const response = await axios.post(TARKOV_API_BASE, {
        query,
        variables: { limit: limitNum }
      }, {
        timeout: 10000
      });

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message || 'Failed to fetch trending items');
      }

      return response.data.data.trendingItems || [];
    }, 10 * 60 * 1000); // Cache trending for 10 minutes

    res.json({
      success: true,
      count: trendingItems.length,
      data: trendingItems
    });
  } catch (error) {
    console.error('Trending items error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to fetch trending items',
      success: false
    });
  }
});

/**
 * Get price history for an item
 * GET /api/market/history/:itemId
 */
app.get('/api/market/history/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { days = 30 } = req.query;

    const cacheKey = `market_history_${itemId}_${days}`;

    const priceHistory = await getFromCache(cacheKey, async () => {
      try {
        const response = await axios.get(`${FLEA_MARKET_API}/item/${itemId}/history`, {
          params: { days },
          timeout: 10000
        });

        return {
          itemId,
          data: response.data.history || [],
          min: response.data.minPrice || 0,
          max: response.data.maxPrice || 0,
          average: response.data.averagePrice || 0
        };
      } catch (error) {
        return {
          itemId,
          data: [],
          min: 0,
          max: 0,
          average: 0,
          note: 'Price history unavailable'
        };
      }
    }, 60 * 60 * 1000); // Cache for 1 hour

    res.json({
      success: true,
      data: priceHistory
    });
  } catch (error) {
    console.error('Price history error:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to fetch price history',
      success: false
    });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Clear cache endpoint (with basic auth)
 * POST /api/admin/cache/clear
 */
app.post('/api/admin/cache/clear', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY || 'admin-secret-key';

  if (adminKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      success: false
    });
  }

  const keyClearedCount = cache.size;
  cache.clear();

  res.json({
    success: true,
    message: `Cache cleared. ${keyClearedCount} entries removed.`
  });
});

/**
 * Clear specific cache key
 * POST /api/admin/cache/clear/:key
 */
app.post('/api/admin/cache/clear/:key', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY || 'admin-secret-key';

  if (adminKey !== expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      success: false
    });
  }

  const { key } = req.params;
  const existed = cache.has(key);

  if (existed) {
    clearCache(key);
  }

  res.json({
    success: true,
    message: `Cache key '${key}' cleared.`,
    existed
  });
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    success: false
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    success: false
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Tarkov Search API Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base: ${TARKOV_API_BASE}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/player/search?username=<name> - Search player by username`);
  console.log(`   GET  /api/player/:playerId - Get player profile`);
  console.log(`   GET  /api/ban-check?username=<name> - Check if player is banned`);
  console.log(`   GET  /api/ban-stats - Get global ban statistics`);
  console.log(`   GET  /api/market/search?query=<item> - Search items on flea market`);
  console.log(`   GET  /api/market/item/:itemId - Get item price data`);
  console.log(`   GET  /api/market/trending - Get trending items`);
  console.log(`   GET  /api/market/history/:itemId - Get price history`);
  console.log(`   POST /api/admin/cache/clear - Clear all cache (requires X-Admin-Key header)`);
});

module.exports = app;
