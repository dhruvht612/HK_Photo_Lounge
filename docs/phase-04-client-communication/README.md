# Phase 4 — Client Communication (Messaging)

> **Goal:** Per-booking threaded messaging between client and photographer with real-time updates and file attachments.

---

## 1. Files to Create

```
src/pages/portal/
├── PortalMessages.jsx          # Message list (all bookings)
└── PortalMessageThread.jsx     # Single thread view

src/components/
└── MessageBubble.jsx           # Individual message bubble
└── MessageInput.jsx            # Text input + file upload
```

---

## 2. Supabase Queries

Create `src/supabase/queries/messages.js`:

```js
import { supabase } from '../client'

export async function getMessagesByBooking(bookingId) {
  return await supabase
    .from('messages')
    .select('*, sender_id, profiles!sender_id(name, avatar_url)')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })
}

export async function sendMessage(bookingId, senderId, content, attachments = null) {
  return await supabase
    .from('messages')
    .insert({
      booking_id: bookingId,
      sender_id: senderId,
      content,
      attachments,
    })
    .select()
    .single()
}

export async function markMessagesRead(bookingId, userId) {
  return await supabase
    .from('messages')
    .update({ read: true })
    .eq('booking_id', bookingId)
    .neq('sender_id', userId)
    .eq('read', false)
}

export async function getUnreadCount(userId) {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('client_id', userId)

  if (!bookings?.length) return 0

  const bookingIds = bookings.map(b => b.id)

  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('booking_id', bookingIds)
    .neq('sender_id', userId)
    .eq('read', false)

  return count
}
```

---

## 3. Messages List Page

`src/pages/portal/PortalMessages.jsx`:

Route: `/portal/messages`

**Layout:**
- Left panel: List of conversations grouped by booking
- Right panel: Active thread (or empty state if none selected)

**Conversation List Item:**
```
┌──────────────────────────────────┐
│  Wedding Photography             │
│  📅 May 15, 2026                 │
│  Last message: "Sounds great!..."│
│  [● Unread]                      │
└──────────────────────────────────┘
```

**States:**
- **Loading:** Skeleton conversation list
- **Empty:** "No messages yet. Send a message about an active booking."
- **No Selection:** "Select a conversation to start chatting"

---

## 4. Message Thread View

`src/pages/portal/PortalMessageThread.jsx`:

**Features:**
- Scrollable message list (auto-scroll to bottom on load/new message)
- Date separators ("Today", "Yesterday", "May 10, 2026")
- Message bubbles:
  - Client messages: right-aligned, accent color
  - Admin messages: left-aligned, neutral color
  - Show avatar, name, timestamp
- File attachment preview (image thumbnails, document icons with download)
- "Mark as read" when thread is opened

**Message Bubble Component (`MessageBubble.jsx`):**
```jsx
// Props: message, isOwn, senderName, senderAvatar
```

**Message Input Component (`MessageInput.jsx`):**
- Text area (auto-resize, submit on Enter or button click)
- Attachment button (paperclip icon)
- File picker (images, PDFs, docs) — max 10MB per file
- Upload progress indicator
- Drag-and-drop support (optional)

---

## 5. Real-Time Subscriptions

Use Supabase Realtime to listen for new messages:

```js
import { supabase } from '../../supabase/client'
import { useEffect } from 'react'

export function useMessageSubscription(bookingId, onNewMessage) {
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => onNewMessage(payload.new)
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [bookingId])
}
```

---

## 6. Unread Badge in Portal Nav

In `PortalLayout.jsx`, fetch unread count:

```js
const [unreadCount, setUnreadCount] = useState(0)

useEffect(() => {
  if (!user) return
  getUnreadCount(user.id).then(setUnreadCount)

  // Optional: real-time subscription for unread count changes
}, [user])
```

Display badge on Messages nav link:
```jsx
<NavLink to="/portal/messages">
  Messages
  {unreadCount > 0 && (
    <span className="ml-2 bg-accent text-white text-xs rounded-full px-2 py-0.5">
      {unreadCount}
    </span>
  )}
</NavLink>
```

---

## 7. File Upload Handler

Create `src/supabase/storage.js`:

```js
import { supabase } from './client'

export async function uploadMessageAttachment(file, userId) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
  const filePath = `message-attachments/${fileName}`

  const { error } = await supabase.storage
    .from('message-attachments')
    .upload(filePath, file)

  if (error) return { error }

  const { data: { publicUrl } } = supabase.storage
    .from('message-attachments')
    .getPublicUrl(filePath)

  return { url: publicUrl, name: file.name }
}
```

---

## 8. Verification Checklist

- [ ] Messages list shows all bookings with conversations
- [ ] Clicking a conversation loads the thread
- [ ] Messages auto-scroll to bottom
- [ ] Sending a message inserts to DB and appears in real-time
- [ ] Real-time subscription works (open two browsers, send message, see it appear)
- [ ] File attachment uploads to Supabase Storage
- [ ] Image attachments show preview in bubble
- [ ] Unread count badge updates on nav
- [ ] Messages are marked as read when thread is opened
- [ ] Client sees only their own messages (RLS enforced)
- [ ] Admin sees all client threads
- [ ] Loading/empty/error states handled
- [ ] Mobile responsive (conversation list stacks above thread)
