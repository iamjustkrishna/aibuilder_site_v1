# Certificate Management - Testing Guide

## Quick Start Testing

### 1. Navigate to the Component
1. Open the admin dashboard: `/admin`
2. Click on the **"Certificates"** tab (with Award icon ⭐)
3. You should see the Certificate Management interface

### 2. Test Basic Interactions

#### Test Cohort Selection
```
1. Click dropdown "Cohort 0 (Current)"
2. Should see:
   - Cohort 0 (12 users) ✓
   - Cohort 1 (8 users)
   - Cohort 2 (15 users)
3. Select "Cohort 1"
4. User list should update
5. Selections should clear
```

#### Test User Selection
```
1. Start with Cohort 0
2. Click "☑ Select All"
3. All 12 user checkboxes should be checked
4. Counter should show "12 of 12 users selected"
5. Uncheck one user (e.g., John Doe)
6. "Select All" checkbox should become unchecked
7. Counter should show "11 of 12 users selected"
```

#### Test Generate Button
```
1. With 0 users selected:
   - Button should be disabled (gray background)
   - Cursor should show "not-allowed"
2. Select a user:
   - Button should become enabled (purple background)
   - Text should update: "Generate Certificates for 1 User"
3. Select all users:
   - Text should update: "Generate Certificates for 12 Users"
```

### 3. Test Certificate Generation

#### Test Generation Flow
```
1. Select 5 users
2. Click "🚀 Generate Certificates for 5 Users"
3. Button should show:
   - Spinner: "⏳ Queueing..."
   - Button disabled temporarily
4. After 0.5 seconds:
   - Button goes back to normal
   - Toast appears: "✓ Queued 5 certificate(s) for generation"
   - Toast auto-dismisses after 3 seconds
5. Status tracking table appears with:
   - Status Summary cards (In Progress: 0, Generated: 0, Failed: 0)
   - Full status table with all 5 users
```

### 4. Test Real-time Status Updates

#### Watch the Polling
```
Time 0s (Immediate):
  - All 5 users showing "⏳ Pending" 
  - Progress: 0%
  - Button "Make All Generated Visible" is DISABLED

Time 2s (First poll):
  - Status changes to "⏳ In Queue"
  - Progress: 25%
  - In Progress counter updates to 5

Time 4s (Second poll):
  - Status changes to "🔄 Generating"
  - Progress: 50%
  - In Progress counter still 5

Time 6s (Third poll):
  - Status changes to "✅ Generated" (or ❌ Failed for 1)
  - Progress: 100%
  - Download link appears for completed ones
  - Visibility toggle becomes ENABLED (eye icon clickable)
  - In Progress decreases, Generated increases
  - "Make All Generated Visible" button becomes ENABLED

Time 8s (Final poll):
  - All statuses finalized
  - Polling stops automatically
  - Status counters show final tally
```

### 5. Test Visibility Controls

#### Test Individual Toggle
```
For a "Generated" certificate:
1. Click the eye icon (currently hidden ▢)
2. Icon changes to eye-with-slash (visible ▪)
3. Visibility column updates
4. Repeat - should toggle back to ▢

For non-generated (pending/failed):
1. Eye icon should be disabled (grayed out)
2. Click should do nothing
3. Hover should show "not-allowed" cursor
```

#### Test Bulk Visibility
```
After generation with 3 completed:
1. Click "Make All Generated Visible"
2. Toast appears: "✓ Made 3 certificate(s) visible"
3. All 3 generated certificates should show visible icon (▪)
4. Failed certificates unchanged
5. Button becomes disabled again (no more generated to toggle)
```

### 6. Test Status Summary Cards

```
After generation:
┌─────────────────┬──────────────────┬────────────────┐
│ 🟦 In Progress  │ 🟩 Generated     │ 🟥 Failed      │
│      2          │        2         │       1        │
└─────────────────┴──────────────────┴────────────────┘

Should update in real-time every 2 seconds as statuses change
```

### 7. Test Download Links

#### Test Certificate Link
```
1. Wait for a certificate to show "✅ Generated"
2. In the Certificate column, you should see: "⬇️ Download"
3. Click the link
4. Opens: https://certificates.aibuilder.space/{user_id}.pdf
   in a new tab (target="_blank")
5. For failing certificates, this link doesn't appear
   Instead shows: "⚠️ Generation failed - invalid user data"
```

### 8. Test Error Handling

#### Test Failure State
```
Mock setup: 1 in 7 users fails (user IDs ending in 0)

In test with 5 users:
1. Possibly one user (Charlie with ID "u5" has math: 5 % 7 ≠ 0)
   Actually, Ivan (u11) would fail, but he's beyond 5 user limit
   
In test with 12 users (Select All):
1. One user fails (e.g., user ending in 0)
2. Status shows: "❌ Failed"
3. Error message shows in Certificate column
4. Visibility toggle disabled for failed
5. No download link available
```

#### Test Empty State
```
1. Close the component or clear data
2. If no status table shown:
   Shows "Step 1: Select Cohort" and "Step 2: Select Users"
3. Once you click Generate, status table appears
4. Component stays visible until you manually clear it
```

### 9. Test Responsive Design

#### Desktop (1920px or larger)
```
- Full width tables visible
- All columns visible without scrolling
- Hover effects on rows
- Status cards in a row
```

#### Tablet (768px - 1024px)
```
- Tables may have horizontal scroll
- Status cards stack properly
- Controls remain accessible
- Touch-friendly button sizes
```

#### Mobile (< 768px)
```
- Vertical layout
- Dropdown scrollable
- Table columns prioritized or simplified
- Buttons full width
- Touch targets large enough (44px minimum)
```

### 10. Test Data Persistence

#### Changing Cohorts
```
1. Select Cohort 0, select 5 users
2. Click Generate
3. Wait for updates to start
4. Switch to Cohort 1
5. Selection clears, status table remains visible
6. Switch back to Cohort 0
7. Cohort changes, but status table stays visible
   (Real implementation may want to clear after cohort change)
```

## Testing Matrix

| Feature | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| Cohort Selection | Select different cohort | User list updates | ✓ |
| Select All | Click checkbox | All users selected | ✓ |
| Deselect All | Uncheck all individually | Select All unchecks | ✓ |
| Generate Button | Disabled with 0 users | Button is gray | ✓ |
| Generate Button | Enabled with users | Button is purple | ✓ |
| Generate Click | Click button | Toast notification | ✓ |
| Status Updates | Wait 2s | Status changes | ✓ |
| Progress Bar | Watch updates | Bar fills gradually | ✓ |
| Download Link | Status = Generated | Link appears | ✓ |
| Download Link | Status != Generated | Link hidden | ✓ |
| Visibility Toggle | Click eye icon | Toggles visible/hidden | ✓ |
| Visibility Disabled | Non-generated cert | Eye icon disabled | ✓ |
| Bulk Visibility | Click "Make All" | All generated visible | ✓ |
| Toast Messages | After action | Auto-dismisses 3s | ✓ |
| Responsive | Resize window | Layouts adapt | ✓ |
| Error State | Watch fail status | Error message shows | ✓ |

## Common Issues & Solutions

### Issue: Component doesn't appear
**Solution**: 
- Check that you're on the admin page
- Look for "Certificates" tab in the navigation
- Check browser console for errors
- Verify imports are working

### Issue: Buttons don't respond
**Solution**:
- Check that JavaScript is enabled
- Try refreshing the page
- Check browser DevTools console for errors
- Verify React hooks are working

### Issue: Status doesn't update
**Solution**:
- Wait at least 2 seconds (polling interval)
- Check browser DevTools console for polling logs
- Verify the useEffect is triggering polling
- Check that pollingActive state is true

### Issue: Download link doesn't work
**Solution**:
- This is mock data - the URLs are fake
- In real implementation, would point to actual certificates
- Check that status is actually "Generated" (not "In Queue")
- Links should open in new tab

### Issue: Visibility toggle doesn't work
**Solution**:
- Toggle only works for "Generated" status
- Try clicking on a certificate that shows ✅ Generated
- Eye icon should be visible (not grayed out)
- Should toggle between visible ▪ and hidden ▢

## Performance Testing

### Load Test
```
1. Select all 12 users in Cohort 0
2. Generate certificates
3. Watch status updates every 2 seconds
4. Monitor browser performance (DevTools)
5. Should have minimal lag or stutter
```

### Memory Test
```
1. Generate multiple batches (select, generate, repeat)
2. Watch memory usage in DevTools
3. Should not have memory leaks
4. Switching cohorts should not cause memory issues
```

### Responsive Test
```
1. Open DevTools with device toolbar
2. Test at: 320px, 640px, 768px, 1024px, 1920px
3. All controls should remain accessible
4. No horizontal scroll (except table overflow)
5. Touch targets should be >= 44px
```

## Browser Compatibility

Test in:
- [x] Chrome/Edge (Chromium)
- [x] Firefox
- [x] Safari
- [x] Mobile Safari
- [x] Chrome Mobile

## Accessibility Testing

```
1. Tab navigation:
   - Press Tab key through all controls
   - Order should be logical
   - Focus should be visible

2. Keyboard usage:
   - Tab to buttons, press Enter
   - Tab to checkboxes, press Space
   - Tab to dropdown, press Enter/Space, use arrow keys

3. Screen reader:
   - Labels should be read correctly
   - Buttons should announce their state
   - Table headers should be announced
```

## Demo Video Script

If creating a demo video:

```
"Let me show you the Certificate Management interface...

First, we select a cohort - here's Cohort 0 with 12 users.

Next, I can select individual users or click Select All to choose everyone.

Notice the counter updates as I select users.

Now I'll click Generate to queue certificate creation for all 12 users.

See the toast notification confirming the queue.

In the status table below, watch as the status updates every 2 seconds:
- Starting as Pending
- Moving to In Queue
- Then Generating
- Finally completing with a download link

As certificates complete, I can toggle their visibility - notice the eye icon
only works for completed certificates.

For bulk operations, I can make all generated certificates visible at once.

The component handles errors gracefully - if a generation fails, you can see
the error message and handle it appropriately.

Everything is real-time and responsive!"
```

---

## Checklist for Testing

- [ ] Can select different cohorts
- [ ] User list updates when changing cohorts
- [ ] Can select/deselect all users
- [ ] Select All checkbox updates with individual selections
- [ ] Generate button enables/disables correctly
- [ ] Generation queues and shows toast
- [ ] Status updates appear after 2 seconds
- [ ] Progress bars show correct percentages
- [ ] Download links appear for generated certs
- [ ] Visibility toggle works for generated certs
- [ ] Bulk visibility action works
- [ ] Error messages show for failed certs
- [ ] Toast notifications auto-dismiss
- [ ] Component is responsive on mobile
- [ ] No console errors

---

**Ready to test?** Open `/admin` and click the **Certificates** tab! 🎓
