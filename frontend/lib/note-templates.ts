export interface NoteTemplate {
  id: string;
  title: string;
  description: string;
  defaultTitle: string;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "blank",
    title: "Blank Page",
    description: "Start with a clean slate",
    defaultTitle: "Untitled",
    content: "",
  },
  {
    id: "meeting",
    title: "Meeting Notes",
    description: "Capture meeting discussions and action items",
    defaultTitle: "Meeting Notes",
    content: `## Attendees
-

## Agenda
1.

## Discussion Notes


## Action Items
- [ ]

## Next Steps

`,
  },
  {
    id: "decision",
    title: "Decision Record",
    description: "Document important decisions and rationale",
    defaultTitle: "Decision Record",
    content: `## Context
What is the issue we are facing?

## Decision
What is the decision we made?

## Rationale
Why did we make this decision?

## Alternatives Considered
- **Option A:**
- **Option B:**

## Consequences
What are the implications of this decision?

## Status
- [ ] Proposed
- [ ] Accepted
- [ ] Implemented
`,
  },
  {
    id: "postmortem",
    title: "Incident Postmortem",
    description: "Analyze incidents and prevent recurrence",
    defaultTitle: "Incident Postmortem",
    content: `## Incident Summary
**Date:**
**Duration:**
**Severity:**

## Impact
Who/what was affected?

## Timeline
| Time | Event |
|------|-------|
|  |  |

## Root Cause
What was the underlying cause?

## Resolution
How was the incident resolved?

## Lessons Learned
-

## Action Items
- [ ]
`,
  },
  {
    id: "project",
    title: "Project Brief",
    description: "Outline project goals and scope",
    defaultTitle: "Project Brief",
    content: `## Overview
Brief description of the project.

## Goals
-

## Scope
### In Scope
-

### Out of Scope
-

## Success Criteria
How will we measure success?

## Timeline
| Milestone | Target Date |
|-----------|-------------|
|  |  |

## Stakeholders
-
`,
  },
];
