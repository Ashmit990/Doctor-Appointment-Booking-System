# First-Time Doctor Login Schedule Setup - Testing Guide

## Quick Start Testing

### Prerequisites
- XAMPP running (Apache + MySQL)
- Database with `hospital` schema populated
- Doctor account ready for testing

### Test Scenario 1: First-Time Login (Schedule NOT Setup)

**Setup**: Create a test doctor account with `schedule_setup_completed = FALSE`

```sql
-- Create test doctor if needed
INSERT INTO users (user_id, full_name, email, password_hash, role, schedule_setup_completed) 
VALUES ('DOC_TEST_NEW', 'Dr. Test Doctor', 'test@doctor.com', 'hash123', 'Doctor', FALSE);

INSERT INTO doctor_profiles (user_id, specialization, contact_number, consultation_fee, bio)
VALUES ('DOC_TEST_NEW', 'General', '9876543210', 500.00, 'Test doctor');
```

**Steps**:
1. Open browser and navigate to login page
2. Enter credentials:
   - Email: `test@doctor.com`
   - Password: `hash123`
3. Click Login

**Expected Result**:
- ✅ Redirects to home.html
- ✅ Modal appears immediately (cannot be closed)
- ✅ Cannot interact with dashboard behind modal
- ✅ Modal shows: "Set Your Weekly Schedule" title
- ✅ Modal shows info box with "must select at least one working day" message

### Test Scenario 2: Schedule Selection

**Steps** (continuing from above):
1. Click on "Monday" day selector
2. Verify Monday section appears with 3 default time slots
3. Click on "Wednesday" 
4. Verify Wednesday section appears
5. Click on "Friday"
6. Verify Friday section appears

**Expected Result**:
- ✅ Selected days highlighted in teal (#007E85)
- ✅ Time slot sections appear for each selected day
- ✅ Default time slots: 09:00-10:00, 10:00-11:00, 14:00-15:00
- ✅ Can modify times using time pickers
- ✅ Can add more time slots ("+ Add Time Slot" button)
- ✅ Can remove time slots (red Remove button)

### Test Scenario 3: Time Slot Management

**Steps**:
1. For Monday, modify first slot to: 08:00 - 09:00
2. For Wednesday, add an additional time slot: 13:00 - 14:00
3. For Friday, remove the middle slot (10:00-11:00)

**Expected Result**:
- ✅ Time inputs change correctly
- ✅ New slot added successfully
- ✅ Removed slot disappears
- ✅ Form shows 2 Monday slots, 4 Wednesday slots, 2 Friday slots

### Test Scenario 4: Validation Testing

#### Test 4a: No Days Selected
**Steps**:
1. Click "Save Schedule & Continue" without selecting any days

**Expected Result**:
- ✅ Error box appears: "Please select at least one working day."
- ✅ Modal stays open (cannot proceed)

#### Test 4b: Invalid Time Range
**Steps**:
1. Select Monday
2. Set first slot to: 10:00 (start) and 09:00 (end)
3. Click "Save Schedule & Continue"

**Expected Result**:
- ✅ Error box appears: "Start time must be before end time"
- ✅ Modal stays open

#### Test 4c: Empty Time Slot
**Steps**:
1. Select Monday with default time slots
2. Clear the start time of the first slot
3. Click "Save Schedule & Continue"

**Expected Result**:
- ✅ Form skips empty slots
- ✅ Saves successfully with remaining valid slots

### Test Scenario 5: Successful Schedule Save

**Steps**:
1. Select Monday, Wednesday, Friday
2. Keep default times
3. Modify as needed
4. Click "Save Schedule & Continue"

**Expected Result**:
- ✅ Button shows loading state: "Saving..."
- ✅ Success message appears: "✓ Schedule saved successfully! Redirecting..."
- ✅ After ~1.5 seconds, page reloads
- ✅ Dashboard loads normally
- ✅ Modal no longer appears

### Test Scenario 6: Verify Data Persistence

**Steps**:
1. Check database for created availability slots

```sql
SELECT * FROM doctor_availability 
WHERE doctor_id = 'DOC_TEST_NEW' 
ORDER BY available_date, start_time;
```

**Expected Result**:
- ✅ Multiple availability slots created for the next week
- ✅ Slots match selected days and times
- ✅ Next week starting from Monday
- ✅ `users` table shows `schedule_setup_completed = 1` for test doctor

### Test Scenario 7: Second Login (Schedule Already Setup)

**Steps**:
1. Log out
2. Log back in with same credentials

**Expected Result**:
- ✅ Redirects to home.html
- ✅ Modal does NOT appear
- ✅ Dashboard loads normally
- ✅ Can access all pages (Schedules, Earnings, Profile, etc.)

### Test Scenario 8: Responsive Design

**Desktop Testing**:
- ✅ Modal centered on screen
- ✅ Time slots grid layout looks good
- ✅ All buttons clickable
- ✅ Scrollable if content exceeds viewport

**Tablet Testing** (iPad):
- ✅ Modal responsive
- ✅ Touch-friendly buttons
- ✅ Time pickers work on touch devices

**Mobile Testing** (iPhone/Android):
- ✅ Modal width 90% with padding
- ✅ Scrollable when needed
- ✅ Day grid wraps properly
- ✅ Touch events work correctly

### Test Scenario 9: Browser Console Errors

**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Repeat scenarios 1-5
4. Check for errors

**Expected Result**:
- ✅ No JavaScript errors
- ✅ No 404 errors for API endpoints
- ✅ Network requests show 200 status codes
- ✅ Console shows debug messages like:
  - "Initializing Schedule Setup Modal..."
  - "Schedule setup not completed - showing modal"
  - "Updated schedule data: {...}"
  - "Submitting schedule..."

### Test Scenario 10: API Response Verification

**Manual API Testing with cURL**:

#### Check Schedule Setup Status
```bash
curl -b cookies.txt \
  http://localhost/Doctor-Appointment-Booking-System/api/doctor/check_schedule_setup.php
```

**Expected Response**:
```json
{
  "status": "success",
  "schedule_setup_completed": false
}
```

#### Save Schedule
```bash
curl -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": {
      "Monday": [{"start_time": "09:00", "end_time": "10:00"}],
      "Wednesday": [{"start_time": "10:00", "end_time": "11:00"}]
    },
    "start_date": "2026-05-05"
  }' \
  http://localhost/Doctor-Appointment-Booking-System/api/doctor/save_schedule.php
```

**Expected Response**:
```json
{
  "status": "success",
  "message": "Schedule setup complete! Created 2 availability slots.",
  "inserted_count": 2
}
```

## Accessibility Testing

- [ ] Modal is keyboard navigable (Tab through fields)
- [ ] Error messages are announced
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible
- [ ] Time pickers work with keyboard input

## Performance Testing

- [ ] Modal loads in < 200ms
- [ ] Form submission completes in < 2 seconds
- [ ] No memory leaks when closing/reopening modal
- [ ] Smooth animations (60fps)

## Edge Cases

1. **Multiple rapid submissions**: Second click before first completes
   - ✅ Button disabled during submission
   
2. **Network timeout**: Internet disconnects during save
   - ✅ Error message shown, can retry
   
3. **Server error**: API returns error response
   - ✅ Error message displayed, modal stays open
   
4. **Extremely long times**: 23:59 start to 00:00 end time
   - ✅ Validation catches as invalid (end before start)

## Bugs Found & Fixed

- [ ] List any bugs encountered during testing here

## Sign-off

- **Tested By**: ___________________
- **Date**: ___________________
- **Status**: ☐ PASS ☐ FAIL
- **Notes**: ___________________
