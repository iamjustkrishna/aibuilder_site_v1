# Curated Videos Admin Management

## Overview

The admin dashboard now includes a "Curated Videos" tab where administrators can:
1. **Manually add videos** to each week (Week 1-4) of the learning curriculum
2. **Delete videos** from any week
3. **Sync videos from GitHub** using a GitHub Actions workflow

## Admin Dashboard Features

### Week Selector
- Click on Week 1, 2, 3, or 4 tabs to view and manage videos for that specific week
- The selected week is highlighted with its color gradient

### Add Video Form
1. Click the "Add Video" button to open the form
2. Fill in:
   - **Video Title** (required): The title shown to users
   - **YouTube URL** (required): Full YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ)
   - **Description** (optional): Additional context about the video
   - **Tier Required**: Select which user tier can access this video (Explorer, Foundational, Builder, Architect)
3. Click "Add Video" to save

### Video Management
- Videos appear in a list below the form
- Click the **trash icon** on the right side to delete a video
- Videos display:
  - YouTube thumbnail preview
  - Title and description
  - Required tier badge
  - Link icon to view on YouTube

### GitHub Sync Feature

#### Setup Instructions

**1. Create a GitHub Repository with Videos JSON**

Create a JSON file in your GitHub repository (e.g., `videos.json`) with one of these formats:

**Format A: Direct Array**
```json
[
  {
    "title": "Introduction to AI",
    "youtube_url": "https://youtu.be/abc123",
    "description": "An overview of AI concepts",
    "week_number": 1,
    "tier_required": "foundational"
  },
  {
    "title": "Building AI Apps",
    "youtube_url": "https://youtu.be/def456",
    "description": "Learn to build AI applications",
    "week_number": 2,
    "tier_required": "foundational"
  }
]
```

**Format B: Wrapped Videos**
```json
{
  "videos": [
    {
      "title": "Introduction to AI",
      "youtube_url": "https://youtu.be/abc123",
      "description": "An overview of AI concepts",
      "week_number": 1,
      "tier_required": "foundational"
    }
  ]
}
```

**2. Create GitHub Actions Workflow**

Create `.github/workflows/sync-curated-videos.yml`:

```yaml
name: Sync Curated Videos

on:
  schedule:
    # Run daily at 12:00 AM UTC
    - cron: '0 0 * * *'
  workflow_dispatch:  # Allow manual trigger

permissions:
  contents: read

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Trigger Sync
        run: |
          curl -X POST 'https://www.aibuilder.space/api/learning/curated' \
            -H 'Content-Type: application/json' \
            -d '{
              "action": "sync-github",
              "github_json_url": "${{ secrets.VIDEOS_JSON_URL }}"
            }'

```

**3. Add GitHub Secret**

1. Go to your repository Settings → Secrets and variables → Actions
2. Create a new secret named `VIDEOS_JSON_URL`
3. Set the value to the raw GitHub URL of your videos.json file:
   ```
   https://raw.githubusercontent.com/your-username/your-repo/main/videos.json
   ```

**4. Use in Admin Dashboard**

1. Go to Admin Panel → Curated Videos tab
2. Scroll to "Sync from GitHub" section
3. Paste the raw GitHub URL: `https://raw.githubusercontent.com/your-username/your-repo/main/videos.json`
4. Click "Sync" button
5. Videos will be imported into the current cohort for the specified weeks

## API Endpoints

### GET `/api/learning/curated?week={weekNumber}`
Returns curated videos for a specific week (user-facing, requires authentication).

**Response:**
```json
[
  {
    "id": "uuid",
    "cohort_id": "uuid",
    "week_number": 1,
    "title": "Introduction to AI",
    "description": "An overview of AI concepts",
    "youtube_url": "https://youtu.be/abc123",
    "tier_required": "foundational",
    "sort_order": 0,
    "youtube_video_id": "abc123",
    "progress": null,
    "latest_quiz_attempt": null
  }
]
```

### POST `/api/learning/curated` (Add Video)
Adds a single curated video (admin-only).

**Request:**
```json
{
  "title": "Video Title",
  "description": "Optional description",
  "youtube_url": "https://youtu.be/abc123",
  "tier_required": "foundational",
  "week_number": 1
}
```

**Response:** 201 Created with the new video object

### POST `/api/learning/curated` (Sync from GitHub)
Syncs multiple videos from a GitHub JSON file (admin-only).

**Request:**
```json
{
  "action": "sync-github",
  "github_json_url": "https://raw.githubusercontent.com/your-repo/videos.json"
}
```

**Response:**
```json
{
  "synced_count": 5
}
```

### DELETE `/api/learning/curated?id={videoId}`
Deletes a curated video (admin-only).

**Response:**
```json
{
  "success": true
}
```

## Database Schema

Videos are stored in the `cohort_video_configs` table:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cohort_id | UUID | Foreign key to cohorts table |
| week_number | INTEGER | Week number (1-4) |
| title | TEXT | Video title |
| description | TEXT | Optional description |
| youtube_url | TEXT | YouTube URL |
| tier_required | TEXT | User tier requirement (initial, foundational, builder, architect) |
| sort_order | INTEGER | Display order within week |
| is_active | BOOLEAN | Whether video is visible |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Security

- All admin operations (POST/DELETE) require:
  - User authentication
  - Admin email verification
  - Current user must have admin privileges

- Users can only view videos that:
  - Belong to their enrolled cohorts
  - Have unlocked weeks (based on cohort_weeks unlock_at date)
  - Are active (is_active = true)
  - Match their tier requirements

## Testing

### Test Adding a Video
```bash
curl -X POST 'http://localhost:3000/api/learning/curated' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Test Video",
    "description": "A test video",
    "youtube_url": "https://youtu.be/dQw4w9WgXcQ",
    "tier_required": "foundational",
    "week_number": 1
  }'
```

### Test Getting Videos for a Week
```bash
curl 'http://localhost:3000/api/learning/curated?week=1'
```

### Test GitHub Sync
```bash
curl -X POST 'http://localhost:3000/api/learning/curated' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "sync-github",
    "github_json_url": "https://raw.githubusercontent.com/your-username/your-repo/main/videos.json"
  }'
```

## Troubleshooting

### "No current cohort found" Error
- Ensure that a cohort is marked as `is_current = true` in the database
- Admin dashboard should show the current cohort in the Cohorts tab

### Videos not appearing after sync
- Check that the JSON format matches one of the supported formats
- Ensure the GitHub URL is correct and accessible
- Videos must have: title, youtube_url, and week_number
- Check browser console for API error messages

### GitHub Actions workflow not triggering
- Verify the workflow file syntax (use `.github/workflows/sync-curated-videos.yml`)
- Check the repository's Actions tab to see workflow history
- Ensure secrets are set correctly in repository settings
- Manually trigger the workflow from Actions tab for testing

## Future Enhancements

Possible additions:
- Edit existing videos (currently only add/delete)
- Bulk import/export
- Video completion tracking and analytics
- Quiz auto-generation per video
- Video playlists and sequences
- Watch time tracking and leaderboards
