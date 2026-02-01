# Redis MCP Setup

Redis MCP server configured for Wellbeing Ecommerce project.

## What is Redis MCP?

Redis MCP provides Model Context Protocol integration with Redis, allowing AI assistants to interact with Redis data operations through standardized tools.

## Setup

### Quick Start

```bash
./setup-redis-mcp.sh
```

This will:

1. Start Redis container using Docker
2. Verify Redis connection
3. Configure environment variables
4. Show available MCP tools

### Manual Setup

#### Start Redis

```bash
docker compose up -d
```

#### Stop Redis

```bash
docker compose down
```

## Configuration Files

### `.cursor/mcp.json`

Configuration for Cursor editor MCP integration:

```json
{
  "mcpServers": {
    "redis": {
      "command": "npx",
      "args": ["@liangshanli/mcp-server-redis"],
      "env": {
        "HOST": "localhost",
        "PORT": "6379",
        "PASSWORD": "",
        "ALLOW_INSERT": "true",
        "ALLOW_UPDATE": "true",
        "ALLOW_DELETE": "true",
        "ALLOW_CREATE": "true",
        "ALLOW_DROP": "true"
      }
    }
  }
}
```

### `.vscode/settings.json`

Configuration for VS Code MCP integration:

```json
{
  "mcp.servers": {
    "redis": {
      "command": "npx",
      "args": ["@liangshanli/mcp-server-redis"],
      "env": {
        "HOST": "localhost",
        "PORT": "6379",
        "PASSWORD": "",
        "ALLOW_INSERT": "true",
        "ALLOW_UPDATE": "true",
        "ALLOW_DELETE": "true",
        "ALLOW_CREATE": "true",
        "ALLOW_DROP": "true"
      }
    }
  }
}
```

## Available Tools

### Read Operations (Always Available)

| Tool | Description |
| ------- | ------------- |
| `get_data` | Get data by key |
| `list_keys` | List Redis keys with pattern matching |
| `exists_key` | Check if key exists |
| `get_key_info` | Get key information |
| `get_redis_info` | Get Redis server information |
| `get_database_stats` | Get database statistics |
| `get_memory_info` | Get memory usage information |
| `test_connection` | Test Redis connection |
| `get_operation_logs` | Get operation logs |
| `check_permissions` | Check current permissions |
| `set_ttl` | Set time to live for a key |
| `remove_ttl` | Remove time to live from a key |

### Write Operations (Based on Permissions)

| Tool | Description | Required Permission |
| ------- | ------------- | --------------------- |
| `set_data` | Set/insert data for a key | ALLOW_INSERT |
| `update_data` | Update existing data | ALLOW_UPDATE |
| `delete_data` | Delete data by key | ALLOW_DELETE |
| `create_key` | Create a new key | ALLOW_CREATE |
| `drop_key` | Drop/delete a key | ALLOW_DROP |
| `rename_key` | Rename a key | ALLOW_CREATE + ALLOW_DROP |

## Environment Variables

| Variable | Default | Description |
| ---------- | ----------- | ------------- |
| `HOST` | `localhost` | Redis host address |
| `PORT` | `6379` | Redis port |
| `PASSWORD` | `""` | Redis password (empty for no auth) |
| `ALLOW_INSERT` | `true` | Enable insert operations |
| `ALLOW_UPDATE` | `true` | Enable update operations |
| `ALLOW_DELETE` | `true` | Enable delete operations |
| `ALLOW_CREATE` | `true` | Enable create key operations |
| `ALLOW_DROP` | `true` | Enable drop key operations |
| `MCP_LOG_DIR` | `./logs` | Log directory |
| `MCP_LOG_FILE` | `mcp-redis.log` | Log filename |

## Permission Examples

### Default (All Operations)

```bash
export ALLOW_INSERT=true
export ALLOW_UPDATE=true
export ALLOW_DELETE=true
export ALLOW_CREATE=true
export ALLOW_DROP=true
```

### Read-Only Mode (Safe)

```bash
export ALLOW_INSERT=false
export ALLOW_UPDATE=false
export ALLOW_DELETE=false
export ALLOW_CREATE=false
export ALLOW_DROP=false
```

### Insert/Update Only (No Delete)

```bash
export ALLOW_INSERT=true
export ALLOW_UPDATE=true
export ALLOW_DELETE=false
export ALLOW_CREATE=true
export ALLOW_DROP=false
```

## Usage Examples

### Get Data

```json
{
  "name": "get_data",
  "arguments": {
    "key": "user:123"
  }
}
```

### Set Data

```json
{
  "name": "set_data",
  "arguments": {
    "key": "user:123",
    "value": "John Doe",
    "ttl": 3600
  }
}
```

### List Keys

```json
{
  "name": "list_keys",
  "arguments": {
    "pattern": "user:*",
    "limit": 10
  }
}
```

## Docker Services

| Service | Image            | Ports      | Description                       |
|---------|------------------| -----------|---------------------------------- |
| `redis` | `redis:7-alpine` | `6379:6379`| Redis server with AOF persistence |

## Logs

- **MCP Server Logs**: `./logs/mcp-redis.log`
- **Docker Logs**: `docker compose logs redis`

## Troubleshooting

### Redis Connection Failed

```bash
docker compose logs redis
docker exec welbeing-redis redis-cli ping
```

### MCP Server Not Responding

```bash
tail -f logs/mcp-redis.log
```

### Permission Issues

Check that environment variables are properly set:

```bash
env | grep ALLOW_
```

## Links

- [Redis MCP Package](https://www.npmjs.com/package/@liangshanli/mcp-server-redis)
- [Redis MCP GitHub](https://github.com/liliangshan/mcp-server-redis)
- [MCP Documentation](https://modelcontextprotocol.io)
