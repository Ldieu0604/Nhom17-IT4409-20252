# Website Quản Lý Công Việc

Đề tài 4: xây dựng website quản lý dự án/công việc, hỗ trợ tạo task, phân công, theo dõi tiến độ, quản lý tài liệu dùng chung và mở rộng theo hướng realtime bằng WebSocket.

README này đã được cập nhật lại theo đúng codebase hiện tại.

## 1. Mục tiêu dự án

Hệ thống cho phép một nhóm làm việc trong cùng một `workspace` để:

- tạo và quản lý công việc
- phân công người thực hiện
- theo dõi tiến độ
- quản lý tài liệu nội bộ
- ghi nhận hoạt động
- trao đổi qua chat nhóm và chat cá nhân
- mở rộng theo hướng realtime

## 2. Công nghệ đang dùng

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Prisma ORM`
- `MySQL`
- `Clerk`
- `Socket.IO`
- `Tiptap`
- `Tailwind CSS`
- `Zod`

## 3. Kiến trúc tổng thể

Hệ thống hiện tại là một project fullstack duy nhất:

- `Next.js` xử lý giao diện và API
- `Prisma` kết nối với `MySQL`
- `Clerk` xử lý xác thực
- `Socket.IO` chạy ở một realtime server riêng

Luồng chính:

```text
Trình duyệt
  -> Giao diện Next.js/React
  -> API trong app/api
  -> Prisma
  -> MySQL

Song song:

Trình duyệt
  -> Socket.IO Client
  -> server/realtime-server.js
```

## 4. Cấu trúc thư mục chính

```text
app/
  api/
  dashboard/
  sign-in/
  sign-up/
  workspaces/

components/
  auth/
  editor/
  ui/
  workspace/

lib/
  auth.ts
  data.ts
  demo-data.ts
  permissions.ts
  prisma.ts
  types.ts

prisma/
  schema.prisma
  seed.js
  migrations/

server/
  realtime-server.js
```

Các file quan trọng:

- `app/workspaces/[workspaceId]/page.tsx`: trang chi tiết workspace
- `components/chat-panel.tsx`: panel chat nhóm, chat cá nhân, unread, read, presence
- `components/workspace/member-panel.tsx`: danh sách thành viên, thêm thành viên, xem lời mời
- `components/workspace-invitations-panel.tsx`: nhận lời mời tại dashboard
- `app/api/workspaces/[workspaceId]/members/route.ts`: API thành viên workspace
- `app/api/invitations/[invitationId]/accept/route.ts`: API chấp nhận lời mời
- `app/api/workspaces/[workspaceId]/chat/route.ts`: API đọc/gửi tin nhắn
- `app/api/workspaces/[workspaceId]/chat/channels/route.ts`: API danh sách kênh chat và tạo direct chat
- `server/realtime-server.js`: Socket.IO server

## 5. Hệ thống hiện tại đã có gì

## 5.1. Workspace

Đã có:

- tạo workspace
- xem danh sách workspace
- vào trang chi tiết từng workspace
- hiển thị thành viên, số tài liệu, số task

## 5.2. Task

Đã có:

- tạo task
- cập nhật trạng thái
- cập nhật ưu tiên
- cập nhật deadline
- phân công người thực hiện
- hiển thị task theo cột trạng thái
- ghi activity khi task thay đổi

Chưa hoàn thiện:

- kéo thả trực tiếp kiểu Trello
- cập nhật vị trí bằng drag-and-drop thật

## 5.3. Tài liệu

Đã có:

- tạo tài liệu mới
- nhập tiêu đề và nội dung ban đầu
- import `.txt` hoặc `.md`
- mở editor
- autosave nội dung
- lấy và cập nhật tài liệu qua API

Đã có nền database cho:

- version tài liệu
- attachment
- comment
- collaborative state

Nhưng phần collaborative editing thật bằng CRDT/Yjs chưa hoàn thiện.

## 5.4. Thành viên workspace

Đã có:

- danh sách thành viên trong workspace
- hiển thị vai trò hiện tại
- thêm thành viên bằng email
- nếu email đã có tài khoản thì thêm trực tiếp vào workspace
- nếu email chưa có tài khoản thì tạo lời mời
- lời mời xuất hiện ở dashboard của người được mời
- người được mời có thể bấm chấp nhận để tham gia workspace

Rule hiện tại:

- chỉ `OWNER` hoặc `ADMIN` mới được thêm thành viên

## 5.5. Chat

Hiện tại chat đã dùng được ở mức chức năng chính.

Đã có:

- chat nhóm theo workspace
- channel mặc định `general`
- chat cá nhân theo email trong cùng workspace
- lưu tin nhắn vào database
- Socket.IO realtime
- unread count
- trạng thái đã đọc/chưa đọc
- reply tin nhắn
- reaction cho tin nhắn
- badge unread ở nút chat tròn
- hiển thị người online/offline và thời gian gần nhất

Giới hạn nghiệp vụ hiện tại:

- direct chat chỉ tạo được nếu hai tài khoản đã cùng một workspace
- hiện chưa có UI tạo nhiều channel nhóm ngoài `general`

## 5.6. Activity và Notification

Đã có:

- activity log cho nhiều thao tác chính
- notification schema trong database
- một phần thông báo trong app cho tin nhắn mới

Chưa hoàn thiện:

- khu notification UI đầy đủ
- đồng bộ notification thành một module riêng hoàn chỉnh

## 5.7. Auth

Đã có:

- đăng nhập/đăng ký với Clerk
- middleware bảo vệ route
- đồng bộ user từ Clerk vào bảng `User`

Lưu ý:

- để đăng nhập thật cần cấu hình Clerk hợp lệ trong `.env`

## 5.8. Realtime

Đã có:

- server riêng tại `server/realtime-server.js`
- room cho chat
- room cho document/presence nền tảng
- broadcast tin nhắn realtime
- broadcast presence cho chat

Chưa hoàn thiện:

- realtime task board
- realtime document editing thật
- realtime activity feed hoàn chỉnh

## 6. Database hiện tại

Database đã được thiết kế theo hướng đủ rộng để tiếp tục code tính năng mà không phải đổi schema liên tục nữa.

## 6.1. Nhóm bảng người dùng và workspace

- `User`: người dùng nội bộ của hệ thống
- `Workspace`: không gian làm việc
- `WorkspaceSetting`: cấu hình riêng của workspace
- `WorkspaceMember`: thành viên thuộc workspace
- `WorkspaceInvitation`: lời mời tham gia workspace

## 6.2. Nhóm bảng task

- `Task`
- `TaskLabel`
- `TaskLabelAssignment`
- `TaskWatcher`
- `TaskChecklist`
- `TaskChecklistItem`
- `TaskDependency`
- `TaskHistory`

## 6.3. Nhóm bảng tài liệu

- `Document`
- `DocumentVersion`

## 6.4. Nhóm bảng trao đổi và cộng tác

- `Comment`
- `CommentMention`
- `CommentReaction`
- `Attachment`
- `Notification`

## 6.5. Nhóm bảng chat

- `ChatChannel`
- `ChatChannelMember`
- `ChatMessage`
- `ChatMessageRead`
- `ChatMessageReaction`
- `Presence`

Ý nghĩa thực tế:

- `ChatChannel` lưu một cuộc trò chuyện
- `GENERAL` dùng cho chat nhóm mặc định
- `DIRECT` dùng cho chat cá nhân
- `ChatMessage` lưu nội dung tin nhắn
- `ChatMessageRead` lưu trạng thái đã đọc
- `Presence` hỗ trợ online/offline

## 7. Các API hiện đang có

### Workspace

- `GET /api/workspaces`
- `POST /api/workspaces`

### Task

- `GET /api/workspaces/[workspaceId]/tasks`
- `POST /api/workspaces/[workspaceId]/tasks`
- `PATCH /api/workspaces/[workspaceId]/tasks/[taskId]`

### Document

- `GET /api/workspaces/[workspaceId]/documents`
- `POST /api/workspaces/[workspaceId]/documents`
- `GET /api/workspaces/[workspaceId]/documents/[documentId]`
- `PATCH /api/workspaces/[workspaceId]/documents/[documentId]`

### Member và Invitation

- `GET /api/workspaces/[workspaceId]/members`
- `POST /api/workspaces/[workspaceId]/members`
- `POST /api/invitations/[invitationId]/accept`

### Chat

- `GET /api/workspaces/[workspaceId]/chat`
- `POST /api/workspaces/[workspaceId]/chat`
- `POST /api/workspaces/[workspaceId]/chat/read`
- `GET /api/workspaces/[workspaceId]/chat/channels`
- `POST /api/workspaces/[workspaceId]/chat/channels`
- `POST /api/workspaces/[workspaceId]/chat/[messageId]/reactions`

## 8. Luồng sử dụng quan trọng

## 8.1. Thêm thành viên vào workspace

1. `OWNER` hoặc `ADMIN` mở trang workspace
2. bấm `Thêm thành viên`
3. nhập email và vai trò
4. hệ thống kiểm tra email đã có tài khoản hay chưa
5. nếu đã có tài khoản thì thêm vào `WorkspaceMember`
6. nếu chưa có thì tạo `WorkspaceInvitation`

## 8.2. Chấp nhận lời mời

1. người được mời đăng nhập bằng đúng email
2. vào dashboard
3. xem mục lời mời đang chờ
4. bấm tham gia workspace
5. hệ thống thêm người đó vào `WorkspaceMember`

## 8.3. Tạo direct chat

1. hai tài khoản phải cùng một workspace
2. mở panel chat trong workspace
3. nhập email ở ô tạo trò chuyện riêng
4. hệ thống tìm user theo email
5. nếu hợp lệ, tạo hoặc lấy lại `ChatChannel` loại `DIRECT`

## 8.4. Chat realtime

1. client mở panel chat
2. client tải danh sách channel
3. client join room Socket.IO theo từng channel
4. gửi tin nhắn qua API để lưu database
5. sau khi lưu xong, client phát event socket
6. các client khác trong cùng channel nhận tin nhắn realtime

## 9. Trạng thái hoàn thiện hiện tại

## 9.1. Đã có và dùng được

- workspace
- task CRUD mức cơ bản
- document CRUD mức cơ bản
- autosave editor
- thêm thành viên
- lời mời tham gia workspace
- chấp nhận lời mời
- chat nhóm
- chat cá nhân trong cùng workspace
- realtime chat bằng Socket.IO
- read/unread cơ bản
- presence online/offline cơ bản

## 9.2. Đã có nền tảng nhưng chưa hoàn chỉnh

- notification module hoàn chỉnh
- comment đầy đủ cho task/document
- nhiều channel chat nhóm
- collaborative document realtime
- realtime activity feed
- realtime task board

## 9.3. Chưa hoàn thiện theo đúng trọng tâm đề tài

- drag-and-drop task board thật
- collaborative editing thật bằng CRDT/Yjs
- realtime đồng bộ task/document ở mức sản phẩm

## 10. Hướng dẫn chạy dự án

## 10.1. Yêu cầu

- Node.js `20+`
- MySQL `8.x`
- npm

## 10.2. Cài package

```bash
npm install
```

## 10.3. Tạo file `.env`

Sao chép `.env.example` thành `.env` rồi điền tối thiểu:

```env
DATABASE_URL="mysql://root:password@localhost:3306/coworkhub"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4001"
ALLOWED_DEV_ORIGINS="localhost,127.0.0.1"
CLERK_SECRET_KEY=""
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"
```

## 10.4. Tạo database

```sql
CREATE DATABASE coworkhub;
```

## 10.5. Migrate và seed

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

## 10.6. Chạy app

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run realtime:dev
```

Mặc định:

- app: `http://localhost:3000`
- realtime server: `http://localhost:4001`

## 10.7. Chạy theo LAN để test nhiều tài khoản

Nếu muốn mở bằng IP LAN:

```env
NEXT_PUBLIC_APP_URL="http://192.168.53.101:3000"
NEXT_PUBLIC_SOCKET_URL="http://192.168.53.101:4001"
ALLOWED_DEV_ORIGINS="localhost,127.0.0.1,192.168.53.101"
```

Chạy:

```bash
npm run dev:lan
npm run realtime:lan
```

Lưu ý:

- phải thêm đúng URL vào Clerk nếu muốn đăng nhập thật qua LAN
- không commit `.env` thật lên GitHub

## 10.8. Kiểm tra database

```bash
npx prisma studio
```

## 11. Cách test chat realtime

1. chạy `npm run dev`
2. chạy `npm run realtime:dev`
3. đăng nhập 2 tài khoản khác nhau
4. đảm bảo 2 tài khoản cùng thuộc một workspace
5. mở cùng workspace đó
6. mở panel chat ở cả hai phía
7. gửi tin nhắn để kiểm tra realtime

Muốn test direct chat:

- tài khoản B phải được thêm vào workspace hoặc đã chấp nhận lời mời trước

## 12. Kết luận

Dự án hiện tại đã vượt mức “khung demo giao diện” và đã có một số luồng dùng được thật:

- quản lý workspace
- quản lý task
- quản lý tài liệu
- thêm thành viên và lời mời
- chat nhóm và chat cá nhân
- realtime chat cơ bản

Phần cần đầu tư mạnh nhất tiếp theo vẫn là:

- drag-and-drop task board
- collaborative editing thật
- realtime đồng bộ ở mức sản phẩm
