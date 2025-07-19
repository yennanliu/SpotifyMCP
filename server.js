require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// In-memory token storage
let accessToken = null;

app.use(cors());
app.use(express.json());

// OAuth endpoints
app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.REDIRECT_URI,
    }).toString()
  );
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        code: code,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
      }).toString(),
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    res.send('Authentication successful! You can now use the MCP tools.');
  } catch (error) {
    console.error('Error getting access token:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// MCP manifest endpoint
app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.json({
    schema_version: "v1",
    name_for_human: "Spotify Search",
    name_for_model: "spotify_search",
    description_for_human: "Search for tracks on Spotify",
    description_for_model: "Plugin for searching tracks on Spotify. Returns top 5 matching tracks.",
    auth: {
      type: "oauth",
      client_url: "/login",
      scope: "user-read-private user-read-email"
    },
    api: {
      type: "openapi",
      url: "http://localhost:" + port + "/openapi.json"
    },
    logo_url: "https://www.spotify.com/favicon.ico",
    contact_email: "support@example.com",
    legal_info_url: "http://example.com/legal"
  });
});

// OpenAPI specification
app.get('/openapi.json', (req, res) => {
  res.json({
    openapi: "3.0.1",
    info: {
      title: "Spotify Search API",
      version: "v1",
    },
    servers: [
      {
        url: "http://localhost:" + port,
      },
    ],
    paths: {
      "/tools/search": {
        post: {
          operationId: "searchTracks",
          summary: "Search for tracks on Spotify",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    query: {
                      type: "string",
                      description: "Search query for tracks"
                    }
                  },
                  required: ["query"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      tracks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            artist: { type: "string" },
                            album: { type: "string" },
                            url: { type: "string" }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

// MCP search tool endpoint
app.post('/tools/search', async (req, res) => {
  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated. Please visit /login first.' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        q: query,
        type: 'track',
        limit: 5
      }
    });

    const tracks = response.data.tracks.items.map(track => ({
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      url: track.external_urls.spotify
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Error searching tracks:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Visit http://localhost:${port}/login to authenticate with Spotify`);
}); 