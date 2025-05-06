# Mini DNS API

A simplified yet realistic DNS service API that handles DNS records like A records (IPv4 addresses) and CNAME records (aliases), reflecting real-world DNS constraints and behavior.

## Features

- Support for A Records (hostname to IPv4 addresses)
- Support for CNAME Records (hostname alias to another hostname)
- Realistic DNS implementation constraints
- TTL (Time To Live) with expiration via async cleanup
- Asynchronous DNS query logging for analytics
- Comprehensive validation and error handling

## Table of Contents

- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
  - [Add DNS Record](#add-dns-record)
  - [Resolve Hostname](#resolve-hostname)
  - [List DNS Records for Hostname](#list-dns-records-for-hostname)
  - [Delete DNS Record](#delete-dns-record)
- [Implementation Decisions](#implementation-decisions)
- [Asynchronous Processing](#asynchronous-processing)
- [AI Tools Usage](#ai-tools-usage)

## Setup Instructions

### Prerequisites

- Node.js 18.x or later
- MongoDB 5.x or later
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/abhishekgiri49/speer-mini-dns.git
   cd speer-mini-dns
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables in a `.env` file:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/mini-dns
   LOGGING_ENABLED=true
   TTL_CLEANUP_INTERVAL=3600000
   ```

4. Start the application:

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. For Docker setup:
   ```bash
   docker compose up -d
   ```

## API Documentation

### Add DNS Record

Adds a new DNS record to the system.

**Endpoint:** `POST /api/dns`

**Request Body:**

For A Record:

```json
{
  "type": "A",
  "hostname": "example.com",
  "value": "192.168.1.1",
  "ttl": 3600
}
```

For CNAME Record:

```json
{
  "type": "CNAME",
  "hostname": "alias.example.com",
  "value": "example.com",
  "ttl": 3600
}
```

**Response:** `201 Created`

```json
{
  "hostname": "example.com",
  "type": "A",
  "value": "192.168.1.1",
  "ttl": 3600,
  "createdAt": "2025-05-05T12:00:00Z",
  "expiresAt": "2025-05-05T13:00:00Z"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input or validation failure

  ```json
  {
    "error": "Validation error",
    "details": "Hostname must be a valid domain name"
  }
  ```

- `409 Conflict`: Record conflicts with existing records
  ```json
  {
    "error": "Conflict",
    "details": "Cannot add A record for hostname with existing CNAME record"
  }
  ```

### Resolve Hostname

Resolves a hostname to its final IP addresses, following CNAME chains if necessary.

**Endpoint:** `GET /api/dns/{hostname}`

**Response:** `200 OK`

For hostname with A records:

```json
{
  "hostname": "example.com",
  "resolvedIps": ["192.168.1.1", "192.168.1.2"],
  "recordType": "A"
}
```

For hostname with CNAME record:

```json
{
  "hostname": "alias.example.com",
  "resolvedIps": ["192.168.1.1", "192.168.1.2"],
  "recordType": "CNAME",
  "pointsTo": "example.com"
}
```

**Error Responses:**

- `404 Not Found`: Hostname not found

  ```json
  {
    "error": "Not found",
    "details": "No DNS records found for hostname"
  }
  ```

- `508 Loop Detected`: Circular reference in CNAME chain
  ```json
  {
    "error": "DNS resolution error",
    "details": "Circular reference detected in CNAME chain"
  }
  ```

### List DNS Records for Hostname

Retrieves all DNS records for a specific hostname.

**Endpoint:** `GET /api/dns/{hostname}/records`

**Response:** `200 OK`

```json
{
  "hostname": "example.com",
  "records": [
    {
      "type": "A",
      "value": "192.168.1.1",
      "ttl": 3600,
      "createdAt": "2025-05-05T12:00:00Z",
      "expiresAt": "2025-05-05T13:00:00Z"
    },
    {
      "type": "A",
      "value": "192.168.1.2",
      "ttl": 3600,
      "createdAt": "2025-05-05T12:00:00Z",
      "expiresAt": "2025-05-05T13:00:00Z"
    }
  ]
}
```

**Error Responses:**

- `404 Not Found`: Hostname not found
  ```json
  {
    "error": "Not found",
    "details": "No DNS records found for hostname"
  }
  ```

### Delete DNS Record

Deletes a specific DNS record for a hostname.

**Endpoint:** `DELETE /api/dns/{hostname}?type=A&value=192.168.1.1`

**Query Parameters:**

- `type`: Record type (A or CNAME)
- `value`: Record value (IP address for A records, hostname for CNAME records)

**Response:** `200 OK`

```json
{
  "message": "DNS record deleted successfully",
  "hostname": "example.com",
  "type": "A",
  "value": "192.168.1.1"
}
```

**Error Responses:**

- `404 Not Found`: Record not found for the specified parameters
  ```json
  {
    "error": "Not found",
    "details": "No matching DNS record found for deletion"
  }
  ```

## Implementation Decisions

### Data Model

I chose a MongoDB database with the following schema for DNS records:

```typescript
interface DNSRecord {
  hostname: string;
  type: "A" | "CNAME";
  value: string;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
}
```

This model efficiently supports the key DNS operations while maintaining the necessary constraints:

- Multiple A records per hostname
- Only one CNAME record per hostname
- No mixing of CNAME and other record types for the same hostname

### Architecture

The application follows a clean, modular architecture:

1. **Controllers**: Handle HTTP requests and responses
2. **Services**: Contain core business logic
3. **Repositories**: Manage data access and storage
4. **Validators**: Ensure input data meets requirements
5. **Background Workers**: Handle asynchronous tasks

This separation of concerns improves maintainability and testability while facilitating future extensions.

### Validation Strategy

Comprehensive validation is implemented at multiple levels:

- **Hostname validation**: Ensures hostnames follow RFC standards
- **IP validation**: Verifies that IP addresses are valid IPv4 addresses
- **Business rule validation**: Enforces DNS constraints like CNAME exclusivity
- **Duplicate prevention**: Checks for and prevents duplicate records

### Error Handling

A unified error handling approach with:

- Specific error classes (ValidationError, ConflictError, NotFoundError)
- Consistent error response format
- Appropriate HTTP status codes

## Asynchronous Processing

### TTL Expiration Management

The system implements TTL-based record expiration through:

1. A background job that runs at configurable intervals (default: every hour)
2. Uses a MongoDB TTL index as a backup mechanism for efficiency
3. Records with expired TTLs are automatically removed

Implementation:

### DNS Query Logging

All DNS resolution requests are logged asynchronously for analytics:

1. Resolution operations emit events to a logging queue
2. A separate worker processes these events without blocking the main API responses
3. Logs are stored in a separate collection for analysis

## AI Tools Usage

During the development of this project, I used AI tools to assist with:

1. Initial project structure planning
2. Writing boilerplate code for validators and middleware
3. Resolving specific implementation challenges

All AI-generated code was reviewed and modified as needed to ensure it meets the project requirements and coding standards. The core architecture decisions and DNS logic implementation were designed by me based on my understanding of DNS systems.

The specific AI interactions are documented in a separate file at [AI_USAGE.md](AI_USAGE.md) in this repository.
