# Drug Control Legislation Database

A comprehensive JSON database documenting international treaties, national legislation, and institutional bodies related to drug control from 1909 to 2015, with a focus on Peru and the United States.

## Overview

This database was created for academic research on the evolution of global drug control policies. It provides structured data on 45 key entries spanning over a century of drug control legislation, including:

- 15 International treaties and conventions
- 12 International bodies and organizations
- 11 Peru laws and treaty ratifications
- 7 United States federal laws
- 1 Regional framework

## File Structure

**Filename**: `drug_control_legislation_shortened.json`

**Format**: JSON (JavaScript Object Notation)

**Encoding**: UTF-8

## Data Schema

Each entry in the JSON database contains the following fields:

```json
{
  "Key-ID": {
    "name": "Full official name of the law/treaty/body",
    "year": 1234,
    "type": "treaty|law|body|commission|regulation|ratification|decision|amendment|framework",
    "entity": "Issuing organization or country",
    "description": "Detailed description of purpose and key provisions",
    "signed_in": "Location and date of signing",
    "in_force": "Date when law/treaty entered into force",
    "status": "Active|Superseded|Active (Amended)|N/A",
    "replaced_by": "Key-ID of superseding legislation or empty string"
  }
}
```

### Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | String | Official name of the law, treaty, or body | Yes |
| `year` | Integer/null | Year of enactment or establishment | Yes |
| `type` | String | Category of entry (see types below) | Yes |
| `entity` | String | Issuing organization or country | Yes |
| `description` | String | Purpose, key provisions, and context | Yes |
| `signed_in` | String | Location and date of signing | Yes |
| `in_force` | String | When the law/treaty became active | Yes |
| `status` | String | Current status (see statuses below) | Yes |
| `replaced_by` | String | Key-ID or description of successor | Yes |

### Entry Types

- **treaty**: International agreements between nations
- **law**: National legislation
- **body**: Permanent organizations or institutions
- **commission**: Temporary or advisory bodies
- **regulation**: Administrative rules or EU framework decisions
- **ratification**: National adoption of international treaties
- **decision**: Regional bloc decisions (e.g., Andean Community)
- **amendment**: Modifications to existing treaties
- **framework**: Strategic policy frameworks

### Status Values

- **Active**: Currently in force
- **Active (Amended)**: In force but modified by subsequent legislation
- **Superseded**: Replaced by newer legislation
- **N/A**: Not applicable (for commissions or transitional bodies)

## Key Naming Convention

Keys follow a structured format for easy identification and parsing:

### Format Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| `Comm-[Location]-[Year]` | `Comm-Shanghai-1909` | Commissions |
| `Treaty-[Location]-[Year]` | `Treaty-Hague-1912` | International treaties |
| `Treaty-[Org]-[Year]` | `Treaty-UN-1961` | UN/OAS treaties |
| `Treaty-[Region]-[Year]` | `Treaty-CAN-1985` | Regional agreements |
| `Body-[Acronym]` | `Body-INCB` | International bodies |
| `Body-[Name]` | `Body-EuropeanCouncil` | Named bodies |
| `Framework-[Org]` | `Framework-CAN` | Strategic frameworks |
| `[CC]-[LawID]-[Year]` | `PE-DL22095-1978` | National laws |
| `[CC]-Treaty-[Year]` | `PE-Treaty-1964` | Treaty ratifications |

**Country Codes:**
- `PE` = Peru
- `US` = United States

**Law ID Examples:**
- `DL` = Decreto Ley (Decree Law)
- `Harrison` = Named after sponsor
- `CSA` = Controlled Substances Act

## Usage Examples

### Loading the Data (Python)

```python
import json

# Load the database
with open('drug_control_legislation_shortened.json', 'r', encoding='utf-8') as f:
    legislation = json.load(f)

# Access a specific entry
harrison_act = legislation['US-Harrison-1914']
print(f"{harrison_act['name']} was signed in {harrison_act['year']}")

# Filter by country
peru_laws = {k: v for k, v in legislation.items() if k.startswith('PE-')}
print(f"Found {len(peru_laws)} Peru entries")

# Filter by type
treaties = {k: v for k, v in legislation.items() if v['type'] == 'treaty'}
print(f"Found {len(treaties)} international treaties")

# Filter by status
active_laws = {k: v for k, v in legislation.items() if v['status'].startswith('Active')}
print(f"Found {len(active_laws)} currently active laws")

# Find laws by decade
laws_1970s = {k: v for k, v in legislation.items() 
              if v['year'] and 1970 <= v['year'] < 1980}
print(f"Found {len(laws_1970s)} entries from the 1970s")
```

### Loading the Data (JavaScript)

```javascript
// Node.js
const fs = require('fs');
const legislation = JSON.parse(
  fs.readFileSync('drug_control_legislation_shortened.json', 'utf8')
);

// Access entries
console.log(legislation['Treaty-UN-1961'].name);

// Filter by entity
const unTreaties = Object.entries(legislation)
  .filter(([key, value]) => value.entity === 'United Nations')
  .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

console.log(`Found ${Object.keys(unTreaties).length} UN treaties`);
```

### Loading the Data (R)

```r
library(jsonlite)

# Load the database
legislation <- fromJSON('drug_control_legislation_shortened.json')

# Convert to data frame for analysis
df <- bind_rows(legislation, .id = "key_id")

# Filter and analyze
us_laws <- df %>% filter(str_starts(key_id, "US-"))
peru_laws <- df %>% filter(str_starts(key_id, "PE-"))

# Timeline analysis
timeline <- df %>%
  filter(!is.na(year)) %>%
  arrange(year) %>%
  select(key_id, name, year, type, entity)
```

## Data Coverage

### Geographic Coverage

- **International**: Global treaties and UN conventions
- **Regional**: Americas (OAS, CAN), Europe (EU)
- **National**: Peru, United States

### Temporal Coverage

- **Start Date**: 1909 (Shanghai Opium Commission)
- **End Date**: 2015 (Peru's latest major reform)
- **Span**: 106 years

### Thematic Coverage

1. **Opium and Traditional Narcotics** (1909-1940s)
2. **Cannabis Control** (1937-present)
3. **Psychotropic Substances** (1971-present)
4. **Precursor Chemicals** (1988-present)
5. **Money Laundering** (1986-present)
6. **Alternative Development** (1990s-present)

## Historical Context

### Major Periods

1. **1909-1946**: League of Nations Era
   - International cooperation emerges
   - Focus on opium control

2. **1946-1961**: Transition to UN System
   - Post-WWII restructuring
   - Expansion to include cannabis

3. **1961-1970**: Consolidation
   - Single Convention unifies earlier treaties
   - Psychotropic substances added

4. **1970-1988**: War on Drugs
   - US mandatory minimums
   - Punitive turn in drug policy

5. **1988-Present**: Enhanced Enforcement
   - Money laundering controls
   - Precursor chemical regulations
   - International cooperation strengthened

### Peru-Specific Timeline

- **1949**: First drug control law (DL 11005)
- **1978**: Major comprehensive reform (DL 22095) - still in force
- **1981**: Amendments for flexibility in sentencing
- **1991**: New criminal code decriminalizes personal use
- **1996-2015**: Continuous strengthening and modernization

### US-Specific Timeline

- **1914**: Harrison Act (taxation approach)
- **1937**: Marihuana Tax Act
- **1951-1956**: Mandatory minimum era begins
- **1970**: Controlled Substances Act (modern foundation)
- **1986-1988**: War on Drugs peak legislation

## Research Applications

This database is suitable for:

- **Historical analysis** of drug policy evolution
- **Comparative policy research** across countries
- **Timeline visualizations** for academic presentations
- **Network analysis** of treaty relationships and influences
- **Policy impact studies** on sentencing and enforcement
- **International relations** research on drug control cooperation

## Data Quality and Limitations

### Sources

All data was compiled from authoritative sources including:

- **International treaties**: UN Office on Drugs and Crime (UNODC)
- **Peru legislation**: Official Peruvian government gazettes, CICAD OAS, Transnational Institute (TNI)
- **US legislation**: Federal congressional records, NCBI legal archives, official government sources
- **Organizations**: Official founding documents and institutional websites

### Known Limitations

1. **Selective Coverage**: Focuses on major legislation; many amendments and minor regulations not included
2. **Geographic Scope**: Limited to Peru and United States for national legislation
3. **Temporal Cutoff**: Peru data ends in 2015; US data ends in 1988 (major laws only)
4. **Language**: All descriptions in English; original documents may be in Spanish, French, etc.
5. **Simplification**: Complex legal provisions summarized; consult original texts for legal precision

### Data Validation

- Entry dates cross-referenced with multiple sources
- Law numbers verified against official government databases
- Descriptions reviewed for accuracy against original documents

## Updates and Maintenance

**Last Updated**: October 2025

**Version**: 1.0

To suggest corrections or additions, please note:
- This is a research database created for academic purposes
- Updates should include authoritative source citations
- Maintain consistent formatting with existing entries

## Citation

If using this database in academic work, please cite as:

```
Drug Control Legislation Database (2025). Comprehensive database of international 
drug control treaties, national legislation, and institutional bodies (1909-2015). 
[Dataset]. Focus on Peru and United States.
```

## Related Files

- **Timeline**: `drug_control_timeline.md` - Chronological view organized by decade
- **Original Template**: `tooltip_data_template.json` - Earlier version with long keys

## License and Usage

This database was created for academic research purposes. When using this data:

- Verify all information with primary sources for legal or policy decisions
- Cite appropriately in academic work
- Note that legal interpretations may vary by jurisdiction
- Consult original legislative texts for authoritative information

## Technical Specifications

- **File Size**: ~45 KB
- **Character Encoding**: UTF-8
- **Line Endings**: Unix (LF)
- **JSON Validation**: Valid according to JSON Schema
- **Total Entries**: 45
- **Average Entry Size**: ~400 characters

## Contact and Contribution

For questions, corrections, or suggestions regarding this database, please ensure:
- Specific entry keys are referenced
- Source citations are provided
- Formatting conventions are maintained

---

**Created**: October 2025  
**Purpose**: Academic research on drug control policy evolution  
**Primary Focus**: International treaties, Peru, and United States legislation
