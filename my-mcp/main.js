import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an MCP server
const server = new McpServer({
  name: "my-mcp-server",
  version: "1.0.0",
});

server.registerResource(
  "database-schema",
  "schema://database",
  {
    title: "Database Schema",
    description: "SQLite schema for the issues database",
    mimeType: "text/plain",
  },
  async (uri) => {
    const dbPath = path.join(__dirname, "..", "backend", "database.sqlite");
    const schema = await new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
      db.all(
        "SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name",
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows.map((row) => row.sql + ";").join("\n"));
        }
      );
    });

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/plain",
          text: schema,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
// Server is ready - don't use console.log() as stdout is used for JSON-RPC communication