# Spotify MCP Server

An MCP-compliant HTTP server that wraps the Spotify Web API, allowing Claude to search for tracks on Spotify.

## Setup

1. Create a Spotify Developer Application:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new application
   - Note down your Client ID and Client Secret
   - Add `http://localhost:3000/callback` to your application's Redirect URIs

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   REDIRECT_URI=http://localhost:3000/callback
   PORT=3000
   ```

## Running the Server

1. Start the server:
   ```bash
   npm start
   ```

2. Visit `http://localhost:3000/login` to authenticate with Spotify

3. The server exposes the following endpoints:
   - `/.well-known/ai-plugin.json`: MCP manifest
   - `/openapi.json`: OpenAPI specification
   - `/tools/search`: Search endpoint (requires authentication)

## Using with Claude Desktop

1. Copy the `claude_desktop_config.json` to your Claude Desktop configuration directory
2. Set the environment variables in Claude Desktop:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`

## Example Search Response

```json
{
  "tracks": [
    {
      "name": "Track Name",
      "artist": "Artist Name",
      "album": "Album Name",
      "url": "https://open.spotify.com/track/..."
    }
  ]
}
```