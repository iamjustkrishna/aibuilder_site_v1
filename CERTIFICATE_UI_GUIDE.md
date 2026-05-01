# Certificate Management UI - Visual Guide

## Component Structure

```
Certificate Management Page
├── Header Section
│   ├── Title: "Certificate Management"
│   └── Subtitle: "Generate and manage certificates for cohort members"
│
├── Cohort & Generation Controls (Step 1)
│   ├── Cohort Selector Dropdown
│   │   └── Current: "Cohort 0 (Current)" with 12 users
│   └── Options: Cohort 1 (8 users), Cohort 2 (15 users)
│
├── User Selection Table (Step 2)
│   ├── Header
│   │   ├── "☑ Select All" checkbox
│   │   └── "5 of 12 users selected" counter
│   ├── Table Columns
│   │   ├── Checkbox column
│   │   ├── User Avatar + Name
│   │   ├── Email
│   │   └── Tier Badge (Foundational, Builder, Architect, Explorer)
│   └── User Rows
│       ├── John Doe (john@example.com, Foundational)
│       ├── Jane Smith (jane@example.com, Builder)
│       ├── Bob Wilson (bob@example.com, Foundational)
│       └── ... 12 total users
│
├── Generation Button
│   └── "🚀 Generate Certificates for 5 Users"
│       (Disabled if no users selected, shows spinner during generation)
│
├── Status Summary Cards (After clicking Generate)
│   ├── 🟦 Blue Card: "2 In Progress"
│   ├── 🟩 Green Card: "3 Generated"
│   └── 🟥 Red Card: "0 Failed"
│
└── Status Tracking Table (Real-time updates)
    ├── Header
    │   ├── Title: "Generation Status"
    │   └── "Make All Generated Visible" button
    ├── Table Columns
    │   ├── Name + Email
    │   ├── Status Badge
    │   ├── Progress Bar (0%, 25%, 50%, 75%, 100%)
    │   ├── Certificate Link (Download when complete)
    │   └── Visibility Toggle (Eye/Eye-off icon)
    └── Status Rows with Real-time Updates
        ├── John | ⏳ Pending (25%) | — | Hidden
        ├── Jane | 🔄 Generating (50%) | — | Hidden
        ├── Bob | ✅ Generated (100%) | ⬇️ Download | Visible
        └── ... updates every 2 seconds
```

## User Journey

### Step 1: Select Cohort
```
[Cohort Dropdown ▼] → Shows current cohort with user count
                    ↓
                [Select different cohort]
                    ↓
            Users list updates automatically
```

### Step 2: Select Users
```
[☑ Select All checkbox]  ← Check to select all 12 users
    ↓
[☐ John Doe    ]  ← Individual checkboxes
[☑ Jane Smith  ]
[☐ Bob Wilson  ]
... 9 more users

Status: "5 of 12 users selected"
```

### Step 3: Generate Certificates
```
[🚀 Generate Certificates for 5 Users]  ← Button enabled
                    ↓
            (Loading spinner appears)
                    ↓
            "Queued 5 certificate(s) for generation"  ← Toast
                    ↓
            Real-time polling starts (every 2 sec)
```

### Step 4: Monitor Progress
```
Status Summary:
┌─────────────┬──────────────┬─────────────┐
│ 🟦 In Progress │ 🟩 Generated │ 🟥 Failed   │
│      2      │       2      │      1      │
└─────────────┴──────────────┴─────────────┘

Status Table with Real-time Updates:
────────────────────────────────────────────────────────
Name   │ Status          │ Progress │ Cert  │ Visibility
────────────────────────────────────────────────────────
John   │ ⏳ In Queue      │ 25% ███  │ —     │ ▢ (hidden)
Jane   │ 🔄 Generating   │ 50% ██▢  │ —     │ ▢ (hidden)
Bob    │ ✅ Generated    │ 100% ███ │ ⬇️ DL │ ▪ (visible)
Alice  │ ✅ Generated    │ 100% ███ │ ⬇️ DL │ ▢ (hidden)
Charlie│ ❌ Failed       │ 100% ███ │ —     │ ▢ (hidden)
────────────────────────────────────────────────────────
              ↑ Updates every 2 seconds
```

### Step 5: Manage Visibility
```
Individual Toggle:
Bob's row: [▪] ← Eye icon (Visible) - Click to hide
           [▢] ← Eye-off icon (Hidden) - Click to show

Bulk Action:
[Make All Generated Visible] ← Makes all 2 generated ones visible
                                "Made 2 certificate(s) visible" ← Toast
```

## Visual Styles

### Color Scheme
- **Primary Purple**: #492B8C (buttons, active states)
- **Success Green**: #00C8A7 (generated status)
- **Warning Yellow**: #FFD13F (in queue status)
- **Danger Red**: #FF6B34 (failed status)
- **Background**: #F4F1FB (light purple)

### Status Badges
```
⏳ Pending     (Gray: bg-gray-100, text-gray-700)
⏳ In Queue    (Yellow: bg-yellow-100, text-yellow-700)
🔄 Generating (Blue: bg-blue-100, text-blue-700)
✅ Generated  (Green: bg-green-100, text-green-700)
❌ Failed     (Red: bg-red-100, text-red-700)
```

### Membership Tier Badges
```
Explorer     (bg-gray-100 text-gray-700)
Foundational (bg-blue-100 text-blue-700)
Builder      (bg-purple-100 text-purple-700)
Architect    (bg-pink-100 text-pink-700)
```

### Progress Bars
```
0%:   |▢▢▢▢▢|  0%
25%:  |███▢▢|  25%
50%:  |██▢▢▢|  50%
75%:  |███▢▢|  75%
100%: |█████|  100%
```

## Interactive Elements

### Buttons
- **Generate Button**: Purple, disabled when no users selected, shows spinner while loading
- **Make All Visible**: Purple outline, disabled when no generated certificates
- **Cohort Dropdown**: White background, chevron down icon
- **Visibility Toggles**: Eye/Eye-off icons, disabled for non-generated certificates

### Checkboxes
- **Select All**: Checked state updates individual checkboxes
- **Individual User**: Checked state updates "Select All" parent
- Visual feedback on hover and focus

### Links
- **Certificate Download**: Only visible when status = "Generated"
- Opens in new tab (target="_blank")
- Styled as purple link with download icon

### Toast Notifications
```
Info Toast (Blue):
┌─────────────────────────────┐
│ ℹ️ Queued 5 certificate(s)  │
│    for generation            │
└─────────────────────────────┘
(Auto-dismisses after 3 seconds)
```

## Responsive Design

### Desktop (1024px+)
- Full table layout
- Side-by-side columns
- Hover effects on rows
- All controls visible

### Tablet (768px - 1023px)
- Condensed padding
- Responsive grid for status cards
- Dropdown menu for options
- Touch-friendly controls

### Mobile (< 768px)
- Single column layout
- Stacked forms
- Simplified tables
- Large touch targets for buttons/checkboxes

## Animation & Transitions

- **Status Updates**: Smooth color transitions (0.3s)
- **Progress Bars**: Animated fill (0.5s)
- **Dropdown Menu**: Slide in from top
- **Checkboxes**: Fade in/out
- **Spinners**: Continuous rotation during loading
- **Toast**: Fade in (0.3s) and fade out (0.3s)

## Mock Data Preview

### Cohorts Available
1. **Cohort 0 (Current)** - 12 users
2. **Cohort 1** - 8 users
3. **Cohort 2** - 15 users

### Sample Users
- John Doe (Foundational)
- Jane Smith (Builder)
- Bob Wilson (Foundational)
- Alice Johnson (Architect)
- Charlie Brown (Explorer)
- Diana Martinez (Builder)
- Ethan Lee (Foundational)
- Fiona Garcia (Architect)
- George Taylor (Builder)
- Hannah White (Foundational)
- Ivan Robinson (Explorer)
- Julia Clark (Builder)

### Failure Simulation
- User ID ending in "0" (1 in 7) randomly fails
- Failure message: "Generation failed - invalid user data"
- All other users succeed

## Features in Action

### Feature 1: Select All
```
Start: ☐ Select All  [☐ John] [☐ Jane] [☐ Bob]
Click: ☑ Select All  [☑ John] [☑ Jane] [☑ Bob]
Uncheck one: ☐ Select All [☐ John] [☑ Jane] [☑ Bob]
```

### Feature 2: Cohort Switching
```
Selected: Cohort 0 (12 users) [☑ John] [☑ Jane]
Click dropdown
Select: Cohort 1 (8 users)
Result: Selection clears, user list updates
```

### Feature 3: Real-time Polling
```
Time 0s:  John (⏳ Pending, 0%)
Time 2s:  John (⏳ In Queue, 25%)
Time 4s:  John (🔄 Generating, 50%)
Time 6s:  John (🔄 Generating, 75%)
Time 8s:  John (✅ Generated, 100%) → Download link appears
```

### Feature 4: Visibility Toggle
```
Before: Bob (✅ Generated) → Hidden [▢]
Click eye icon
After:  Bob (✅ Generated) → Visible [▪]
Toast: "1 certificate(s) visibility toggled"
```

### Feature 5: Bulk Visibility
```
Status: 3 Generated, 2 Failed
Click: [Make All Generated Visible]
Result: 3 certificates now Visible (2 Failed ones unaffected)
Toast: "Made 3 certificate(s) visible"
```

---

## Next Steps

When connected to backend APIs, the component will:
1. Fetch real cohorts from `/api/admin/cohorts`
2. Fetch real users from `/api/admin/cohorts/{id}/users`
3. Queue generation jobs via `POST /api/admin/certificates/generate`
4. Poll real status via `GET /api/admin/certificates/status`
5. Toggle visibility via `PATCH /api/admin/certificates/{user_id}/visibility`

All UI elements remain the same - only the data sources change!
