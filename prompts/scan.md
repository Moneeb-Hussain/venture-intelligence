# Sourcing Scan Classification

## Instructions
Classify the candidate details retrieved from external sourcing scans (GitHub, Hacker News, or Y Combinator) to determine if they represent a technical founder building AI infrastructure.

Return a JSON object with:
- `is_technical_founder`: boolean (true if building AI infrastructure, deep tech dev tools, or ML engines)
- `founder_name`: string (extracted full name of the founder, fallback to username/handle if name is unknown)
- `relevance_rationale`: string (concise explanation of why this founder matches or doesn't match the criteria)
