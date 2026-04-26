# Website Quản Lý Công Việc

Đề tài 4: xây dựng website quản lý dự án/công việc, hỗ trợ tạo task, phân công, theo dõi tiến độ, quản lý tài liệu dùng chung và mở rộng theo hướng realtime bằng WebSocket.

README này được cập nhật theo đúng codebase hiện tại và viết theo hướng người mới vẫn có thể đọc để hiểu:

- hệ thống đang có gì
- database hoạt động ra sao
- từng kỹ thuật đang được dùng như thế nào
- cú pháp cơ bản để cả nhóm đọc code và làm tiếp

## 1. Mục tiêu dự án

Hệ thống cho phép một nhóm làm việc trong cùng một `workspace` để:

- tạo và quản lý công việc
- phân công người thực hiện
- theo dõi tiến độ
- quản lý tài liệu nội bộ
- ghi nhận hoạt động
- trao đổi qua chat nhóm và chat cá nhân
- mở rộng theo hướng realtime

Hiểu ngắn gọn:

- `Workspace` là không gian làm việc chung
- `Task` là công việc
- `Document` là tài liệu chung
- `Chat` là khu trao đổi trong quá trình làm việc

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

## 6. Database: giải thích cách hoạt động chi tiết

Phần này tập trung vào tác dụng thật của từng bảng trong hệ thống, các trường chính dùng để làm gì và bảng đó tham gia vào luồng chức năng nào.

Database hiện tại dùng:

- `MySQL`
- mô tả bằng `prisma/schema.prisma`

## 6.1. Database dùng để làm gì trong dự án này

Database là nơi giữ dữ liệu thật của hệ thống. Không có database thì:

- refresh trang sẽ mất dữ liệu
- hai người dùng khác nhau sẽ không nhìn thấy cùng một trạng thái
- không thể theo dõi lịch sử
- không thể xây các chức năng như chat, thành viên, phân quyền, notification

Trong dự án này, database đang phục vụ trực tiếp cho:

- quản lý tài khoản người dùng
- quản lý workspace
- quản lý thành viên và quyền
- quản lý lời mời
- lưu task và lịch sử task
- lưu tài liệu và phiên bản tài liệu
- lưu chat, trạng thái đọc và reaction
- lưu notification
- lưu trạng thái presence

## 6.2. Luồng dữ liệu từ giao diện xuống database

Ví dụ với việc thêm thành viên:

1. người dùng nhập email
2. giao diện gọi API `POST /api/workspaces/[workspaceId]/members`
3. API kiểm tra người gửi có phải `OWNER` hoặc `ADMIN` không
4. API kiểm tra email đó đã có tài khoản chưa
5. nếu đã có tài khoản thì tạo bản ghi trong `WorkspaceMember`
6. nếu chưa có tài khoản thì tạo bản ghi trong `WorkspaceInvitation`
7. hệ thống cập nhật lại giao diện

Ví dụ với việc gửi tin nhắn:

1. người dùng nhập nội dung chat
2. giao diện gọi API `POST /api/workspaces/[workspaceId]/chat`
3. API tạo bản ghi trong `ChatMessage`
4. API tạo bản ghi `ChatMessageRead` cho người gửi
5. client phát sự kiện realtime qua Socket.IO
6. client khác nhận và hiển thị tin nhắn mới

## 6.3. Các bảng chính và tác dụng của từng bảng

## 6.3.1. Bảng `User`

### Tác dụng

Bảng này lưu thông tin người dùng nội bộ của hệ thống. Dù đăng nhập bằng Clerk, hệ thống vẫn cần bảng `User` riêng để nối user với workspace, task, document, chat và notification.

### Các trường chính

- `id`: mã định danh nội bộ của user trong database
- `clerkId`: mã user do Clerk cấp, dùng để đối chiếu user đăng nhập
- `email`: email của user, thường là duy nhất
- `name`: tên đầy đủ hiển thị trên giao diện
- `username`: tên ngắn hoặc bí danh nếu hệ thống dùng
- `avatarUrl`: đường dẫn ảnh đại diện
- `createdAt`: thời điểm tạo user trong database
- `updatedAt`: thời điểm cập nhật gần nhất

### Bảng này được dùng ở đâu

- khi đăng nhập, hệ thống đồng bộ user từ Clerk vào đây
- khi thêm thành viên vào workspace
- khi gán task cho ai đó
- khi gửi chat hoặc tạo comment

## 6.3.2. Bảng `Workspace`

### Tác dụng

Bảng này lưu không gian làm việc chung. Mọi dữ liệu lớn của dự án đều xoay quanh workspace.

### Các trường chính

- `id`: mã workspace
- `name`: tên workspace
- `slug`: tên rút gọn để tạo link hoặc định danh dễ đọc
- `description`: mô tả workspace
- `visibility`: phạm vi hiển thị của workspace
- `ownerId`: user sở hữu workspace
- `archivedAt`: thời điểm workspace bị lưu trữ
- `deletedAt`: thời điểm workspace bị xóa mềm
- `createdAt`: thời điểm tạo
- `updatedAt`: thời điểm cập nhật

### Bảng này được dùng ở đâu

- trang danh sách workspace
- trang chi tiết workspace
- tạo task, document, chat trong cùng một phạm vi

## 6.3.3. Bảng `WorkspaceSetting`

### Tác dụng

Bảng này lưu cấu hình riêng cho từng workspace, để sau này không phải nhét tất cả option vào bảng `Workspace`.

### Các trường thường dùng

- `workspaceId`: cấu hình này thuộc workspace nào
- các cờ bật/tắt tính năng: ví dụ cho phép mời thành viên, bật retention, cấu hình mặc định task
- `createdAt`, `updatedAt`

### Bảng này được dùng ở đâu

- khi cần cấu hình khác nhau giữa các workspace
- khi muốn mở rộng hệ thống mà không làm bảng `Workspace` quá nặng

## 6.3.4. Bảng `WorkspaceMember`

### Tác dụng

Bảng này lưu việc một người dùng có thuộc một workspace hay không, và nếu thuộc thì vai trò là gì.

### Các trường chính

- `id`: mã membership
- `workspaceId`: user đang thuộc workspace nào
- `userId`: thành viên là ai
- `role`: quyền trong workspace
- `joinedAt` hoặc `createdAt`: thời điểm tham gia
- `updatedAt`: thời điểm cập nhật role nếu có

### Trường `role` dùng để làm gì

- `OWNER`: chủ workspace
- `ADMIN`: quản trị workspace
- `MEMBER`: thành viên làm việc bình thường
- `VIEWER`: chỉ xem

### Bảng này được dùng ở đâu

- kiểm tra quyền thêm thành viên
- kiểm tra ai được vào workspace
- kiểm tra direct chat có được tạo không

## 6.3.5. Bảng `WorkspaceInvitation`

### Tác dụng

Bảng này lưu lời mời tham gia workspace khi người được mời chưa phải thành viên chính thức.

### Các trường chính

- `id`: mã lời mời
- `workspaceId`: lời mời thuộc workspace nào
- `email`: email được mời
- `invitedById`: ai là người gửi lời mời
- `invitedUserId`: nếu email đó đã khớp với user sẵn có thì có thể nối thẳng
- `role`: vai trò dự kiến sau khi tham gia
- `status`: trạng thái như `PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`
- `token`: mã xác thực lời mời
- `expiresAt`: thời điểm hết hạn
- `acceptedAt`: thời điểm người dùng chấp nhận
- `createdAt`, `updatedAt`

### Bảng này được dùng ở đâu

- khi nhập email thêm thành viên nhưng người đó chưa ở trong workspace
- khi dashboard hiển thị lời mời đang chờ
- khi người dùng bấm chấp nhận lời mời

## 6.3.6. Bảng `Task`

### Tác dụng

Bảng này lưu toàn bộ công việc chính của hệ thống.

### Các trường chính

- `id`: mã task
- `title`: tiêu đề công việc
- `description`: mô tả chi tiết
- `status`: trạng thái công việc
- `priority`: độ ưu tiên
- `position`: vị trí trong board để phục vụ drag-and-drop
- `startDate`: ngày bắt đầu
- `dueDate`: hạn hoàn thành
- `workspaceId`: task thuộc workspace nào
- `createdById`: ai tạo task
- `assigneeId`: ai đang được giao thực hiện
- `archivedAt`: thời điểm lưu trữ
- `deletedAt`: thời điểm xóa mềm
- `createdAt`, `updatedAt`

### Trường `status` dùng để làm gì

Ví dụ:

- `TODO`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`

### Trường `position` dùng để làm gì

- quyết định thứ tự hiển thị của task trong cùng một cột
- là nền cho chức năng kéo thả sau này

## 6.3.7. Bảng `TaskLabel`

### Tác dụng

Lưu các nhãn dùng để phân loại task.

### Các trường chính

- `id`
- `workspaceId`: label thuộc workspace nào
- `name`: tên nhãn
- `color`: màu nhãn
- `createdAt`, `updatedAt`

## 6.3.8. Bảng `TaskLabelAssignment`

### Tác dụng

Bảng trung gian nối task với label, vì một task có thể có nhiều label và một label có thể dùng cho nhiều task.

### Các trường chính

- `taskId`
- `labelId`
- `createdAt`

## 6.3.9. Bảng `TaskWatcher`

### Tác dụng

Lưu danh sách người theo dõi task để phục vụ notification hoặc màn hình “đang theo dõi”.

### Các trường chính

- `taskId`
- `userId`
- `createdAt`

## 6.3.10. Bảng `TaskChecklist`

### Tác dụng

Lưu checklist thuộc một task.

### Các trường chính

- `id`
- `taskId`
- `title`: tên checklist
- `createdAt`, `updatedAt`

## 6.3.11. Bảng `TaskChecklistItem`

### Tác dụng

Lưu từng mục con trong checklist.

### Các trường chính

- `id`
- `checklistId`
- `content`: nội dung việc nhỏ
- `isCompleted`: đã xong chưa
- `position`: thứ tự trong checklist
- `completedAt`
- `completedById`

## 6.3.12. Bảng `TaskDependency`

### Tác dụng

Lưu quan hệ phụ thuộc giữa các task.

### Các trường chính

- `taskId`: task hiện tại
- `dependsOnTaskId`: task mà nó phụ thuộc
- `createdAt`

### Bảng này dùng để làm gì

- kiểm tra task nào phải hoàn thành trước
- phục vụ quản lý tiến độ chuyên nghiệp hơn

## 6.3.13. Bảng `TaskHistory`

### Tác dụng

Lưu lịch sử thay đổi của task để biết ai đã đổi gì và khi nào.

### Các trường chính

- `id`
- `taskId`
- `actorId`: ai thực hiện thay đổi
- `action`: loại thay đổi
- `oldValue`: giá trị cũ
- `newValue`: giá trị mới
- `createdAt`

### Bảng này dùng để làm gì

- audit lịch sử task
- hiển thị timeline thay đổi

## 6.3.14. Bảng `Document`

### Tác dụng

Lưu tài liệu làm việc trong workspace.

### Các trường chính

- `id`
- `title`: tiêu đề tài liệu
- `content`: nội dung hiện tại
- `workspaceId`
- `createdById`
- `lastEditedById`
- `yjsState`: trạng thái dùng cho collaborative editing trong tương lai
- `archivedAt`
- `deletedAt`
- `createdAt`, `updatedAt`

### Trường `content` dùng để làm gì

- lưu nội dung editor hiện tại
- là dữ liệu được autosave

### Trường `yjsState` dùng để làm gì

- chuẩn bị cho đồng bộ document nhiều người cùng sửa realtime

## 6.3.15. Bảng `DocumentVersion`

### Tác dụng

Lưu lịch sử phiên bản của tài liệu.

### Các trường chính

- `id`
- `documentId`
- `versionNumber`
- `titleSnapshot`
- `contentSnapshot`
- `editedById`
- `createdAt`

### Bảng này dùng để làm gì

- rollback tài liệu
- xem lại phiên bản cũ
- phục vụ audit

## 6.3.16. Bảng `Comment`

### Tác dụng

Lưu bình luận trong hệ thống, có thể dùng cho task hoặc tài liệu.

### Các trường chính

- `id`
- `content`
- `authorId`
- `taskId`: nếu comment thuộc task
- `documentId`: nếu comment thuộc tài liệu
- `parentId`: nếu là reply comment khác
- `createdAt`, `updatedAt`
- `deletedAt`

### Bảng này dùng để làm gì

- thảo luận trực tiếp trên dữ liệu công việc
- làm chuỗi hội thoại dạng lồng nhau

## 6.3.17. Bảng `CommentMention`

### Tác dụng

Lưu ai đã được mention trong một comment.

### Các trường chính

- `commentId`
- `mentionedUserId`
- `createdAt`

### Bảng này dùng để làm gì

- tạo notification đúng người được gọi tên

## 6.3.18. Bảng `CommentReaction`

### Tác dụng

Lưu cảm xúc trên comment.

### Các trường chính

- `commentId`
- `userId`
- `emoji`
- `createdAt`

## 6.3.19. Bảng `Attachment`

### Tác dụng

Lưu metadata của file đính kèm. File thật không nên nhét trực tiếp vào database.

### Các trường chính

- `id`
- `fileName`: tên file
- `fileType`: loại file
- `fileSize`: dung lượng
- `url` hoặc `storageKey`: vị trí lưu file
- `uploadedById`: ai tải file lên
- `taskId`, `documentId`, `commentId`, `messageId`: file này đang gắn với thực thể nào
- `createdAt`

### Bảng này dùng để làm gì

- gắn file cho task
- gắn file cho document
- gắn file cho chat

## 6.3.20. Bảng `Notification`

### Tác dụng

Lưu thông báo gửi cho từng người dùng.

### Các trường chính

- `id`
- `recipientId`: người nhận
- `actorId`: người tạo ra sự kiện nếu có
- `type`: loại thông báo
- `title`: tiêu đề ngắn
- `content`: nội dung
- `link`: đường dẫn điều hướng khi bấm vào
- `isRead`: đã đọc chưa
- `readAt`: thời điểm đọc
- `createdAt`

### Bảng này dùng để làm gì

- thông báo được mời vào workspace
- thông báo được gán task
- thông báo tin nhắn mới

## 6.3.21. Bảng `Presence`

### Tác dụng

Lưu trạng thái hiện diện của người dùng để phục vụ online/offline và realtime.

### Các trường chính

- `id`
- `userId`
- `workspaceId`: nếu presence gắn theo workspace
- `status`: `ONLINE`, `OFFLINE`, `IDLE`...
- `lastSeenAt`: lần cuối hoạt động
- `currentDocumentId` hoặc vùng đang mở nếu schema có hỗ trợ
- `socketId` hoặc định danh session nếu có
- `createdAt`, `updatedAt`

### Bảng này dùng để làm gì

- hiển thị đang online
- hiển thị “vài phút trước”
- hỗ trợ collaboration và presence

## 6.3.22. Bảng `ChatChannel`

### Tác dụng

Lưu một cuộc trò chuyện hoặc một kênh chat.

### Các trường chính

- `id`
- `name`: tên kênh hoặc tên hội thoại
- `description`: mô tả ngắn
- `type`: loại channel
- `workspaceId`: thuộc workspace nào
- `createdById`: ai tạo
- `createdAt`, `updatedAt`

### Trường `type` dùng để làm gì

- `GENERAL`: kênh nhóm mặc định
- `GROUP`: nhóm chat nhiều người
- `DIRECT`: chat cá nhân 1-1
- `ANNOUNCEMENT`: kênh thông báo nếu mở rộng

## 6.3.23. Bảng `ChatChannelMember`

### Tác dụng

Lưu danh sách thành viên thuộc một channel chat.

### Các trường chính

- `channelId`
- `userId`
- `joinedAt`
- `role` nếu hệ thống cần quyền trong kênh

### Bảng này dùng để làm gì

- xác định ai được thấy hội thoại
- xác định direct chat có những ai

## 6.3.24. Bảng `ChatMessage`

### Tác dụng

Lưu nội dung tin nhắn.

### Các trường chính

- `id`
- `channelId`: tin nhắn thuộc hội thoại nào
- `senderId`: ai gửi
- `content`: nội dung
- `parentMessageId`: nếu là reply
- `createdAt`
- `updatedAt`
- `deletedAt`

### Trường `parentMessageId` dùng để làm gì

- hỗ trợ trả lời một tin nhắn trước đó

## 6.3.25. Bảng `ChatMessageRead`

### Tác dụng

Lưu trạng thái đọc của từng user theo từng tin nhắn.

### Các trường chính

- `messageId`
- `userId`
- `readAt`

### Bảng này dùng để làm gì

- tính số tin chưa đọc
- hiển thị đã đọc/chưa đọc

## 6.3.26. Bảng `ChatMessageReaction`

### Tác dụng

Lưu reaction trên tin nhắn chat.

### Các trường chính

- `messageId`
- `userId`
- `emoji`
- `createdAt`

## 6.4. Quan hệ giữa các bảng

Một số quan hệ quan trọng:

- một `User` có thể thuộc nhiều `Workspace` qua `WorkspaceMember`
- một `Workspace` có nhiều `Task`
- một `Workspace` có nhiều `Document`
- một `Workspace` có nhiều `ChatChannel`
- một `Task` có thể có nhiều `TaskChecklist`, `TaskLabel`, `TaskHistory`
- một `Document` có thể có nhiều `DocumentVersion`
- một `ChatChannel` có nhiều `ChatMessage`
- một `ChatMessage` có nhiều `ChatMessageRead`
- một `ChatMessage` có nhiều `ChatMessageReaction`

## 6.5. Kết luận về database

Schema hiện tại đã đủ rộng cho:

- workspace và thành viên
- lời mời và phân quyền
- task và lịch sử task
- tài liệu và version
- comment
- attachment
- notification
- chat
- presence

Tức là từ thời điểm này, phần cần ưu tiên là code tiếp tính năng và tối ưu trải nghiệm, không phải thay đổi lớn về database nữa.

## 7. Technique: cách dùng và cú pháp cơ bản

Phần này không chỉ liệt kê công nghệ, mà giải thích cách dùng trong dự án.

## 7.1. Next.js

### Dùng để làm gì

- tạo trang giao diện
- tạo API backend ngay trong cùng project

### Cách dùng cơ bản

Trang:

```tsx
export default function Page() {
  return <div>Hello</div>
}
```

API:

```ts
export async function GET() {
  return Response.json({ ok: true })
}
```

### Cách dự án đang dùng

- `app/dashboard/page.tsx`
- `app/workspaces/[workspaceId]/page.tsx`
- `app/api/...`

## 7.2. React

### Dùng để làm gì

- xây các component giao diện
- quản lý state phía client

### Cú pháp cơ bản

Component:

```tsx
function MyComponent() {
  return <div>Nội dung</div>
}
```

State:

```tsx
const [value, setValue] = useState("")
```

Effect:

```tsx
useEffect(() => {
  // chạy khi component mount hoặc khi dependency đổi
}, [])
```

### Cách dự án đang dùng

- `components/chat-panel.tsx`
- `components/workspace/member-panel.tsx`
- `components/task-board.tsx`

## 7.3. TypeScript

### Dùng để làm gì

- khai báo kiểu dữ liệu
- giảm lỗi khi code

### Cú pháp cơ bản

```ts
type User = {
  id: string
  name: string
}
```

```ts
function greet(user: User) {
  return user.name
}
```

### Cách dự án đang dùng

- định nghĩa type trong `lib/types.ts`
- ràng buộc props của component
- ràng buộc dữ liệu API

## 7.4. Prisma ORM

### Dùng để làm gì

- thao tác với database bằng code thay vì viết SQL thô

### Cú pháp cơ bản

Tạo client:

```ts
import { prisma } from "@/lib/prisma"
```

Lấy nhiều bản ghi:

```ts
const items = await prisma.task.findMany()
```

Lấy một bản ghi:

```ts
const item = await prisma.workspace.findUnique({
  where: { id: workspaceId },
})
```

Tạo mới:

```ts
const task = await prisma.task.create({
  data: {
    title: "Làm giao diện",
    workspaceId,
    createdById: user.id,
  },
})
```

Cập nhật:

```ts
const task = await prisma.task.update({
  where: { id: taskId },
  data: { status: "DONE" },
})
```

Lấy quan hệ:

```ts
const workspace = await prisma.workspace.findUnique({
  where: { id: workspaceId },
  include: {
    members: true,
    tasks: true,
  },
})
```

### Cách dự án đang dùng

- lấy dashboard data
- lấy workspace detail
- thêm thành viên
- tạo lời mời
- tạo direct chat
- lưu tin nhắn

## 7.5. MySQL

### Dùng để làm gì

- lưu dữ liệu thật của hệ thống

### Câu lệnh cơ bản

Tạo database:

```sql
CREATE DATABASE coworkhub;
```

Xem bảng:

```sql
SHOW TABLES;
```

Xem dữ liệu:

```sql
SELECT * FROM User;
```

### Cách dự án đang dùng

- Prisma sẽ là lớp trung gian
- thường không thao tác MySQL trực tiếp trong code app

## 7.6. Zod

### Dùng để làm gì

- kiểm tra dữ liệu đầu vào trước khi ghi database

### Cú pháp cơ bản

```ts
const schema = z.object({
  title: z.string().min(1),
})
```

Kiểm tra:

```ts
const parsed = schema.safeParse(body)
if (!parsed.success) {
  return Response.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 })
}
```

### Cách dự án đang dùng

- validate request tạo workspace
- validate request tạo task
- validate request tạo document

## 7.7. Clerk

### Dùng để làm gì

- đăng nhập
- đăng ký
- quản lý session

### Cú pháp cơ bản

Ở server:

```ts
import { auth, currentUser } from "@clerk/nextjs/server"

const { userId } = await auth()
const clerkUser = await currentUser()
```

### Cách dự án đang dùng

- lấy user hiện tại
- đồng bộ user từ Clerk vào bảng `User`
- bảo vệ route cần đăng nhập

## 7.8. Socket.IO

### Dùng để làm gì

- gửi dữ liệu realtime giữa client và server

### Cú pháp cơ bản phía server

```js
io.on("connection", (socket) => {
  socket.on("chat:join", (payload) => {
    // xử lý
  })
})
```

Phát dữ liệu:

```js
socket.emit("event-name", data)
io.to(roomId).emit("event-name", data)
```

### Cú pháp cơ bản phía client

```ts
const socket = io("http://localhost:4001")
socket.emit("chat:join", payload)
socket.on("chat:new", (data) => {
  console.log(data)
})
```

### Cách dự án đang dùng

- `chat:join`
- `chat:message`
- `chat:new`
- `chat:presence`

## 7.9. Tiptap

### Dùng để làm gì

- tạo rich text editor

### Cú pháp cơ bản

```tsx
const editor = useEditor({
  extensions: [StarterKit],
  content: initialContent,
})
```

```tsx
<EditorContent editor={editor} />
```

### Cách dự án đang dùng

- tạo editor tài liệu
- autosave nội dung document

## 7.10. Tailwind CSS

### Dùng để làm gì

- viết giao diện nhanh bằng utility class

### Cú pháp cơ bản

```tsx
<div className="rounded-xl border p-4">Nội dung</div>
```

Ý nghĩa:

- `rounded-xl`: bo góc
- `border`: có viền
- `p-4`: padding

### Cách dự án đang dùng

- gần như toàn bộ UI đang dùng Tailwind

## 7.11. Fetch API

### Dùng để làm gì

- gửi request từ giao diện tới backend

### Cú pháp cơ bản

```ts
const response = await fetch("/api/workspaces", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
```

### Cách dự án đang dùng

- tạo workspace
- tạo task
- cập nhật task
- thêm thành viên
- gửi tin nhắn
- tạo direct chat

## 8. Các API hiện đang có

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

## 9. Luồng sử dụng quan trọng

## 9.1. Thêm thành viên vào workspace

1. `OWNER` hoặc `ADMIN` mở trang workspace
2. bấm `Thêm thành viên`
3. nhập email và vai trò
4. hệ thống kiểm tra email đã có tài khoản hay chưa
5. nếu đã có tài khoản thì thêm vào `WorkspaceMember`
6. nếu chưa có thì tạo `WorkspaceInvitation`

## 9.2. Chấp nhận lời mời

1. người được mời đăng nhập bằng đúng email
2. vào dashboard
3. xem mục lời mời đang chờ
4. bấm tham gia workspace
5. hệ thống thêm người đó vào `WorkspaceMember`

## 9.3. Tạo direct chat

1. hai tài khoản phải cùng một workspace
2. mở panel chat trong workspace
3. nhập email ở ô tạo trò chuyện riêng
4. hệ thống tìm user theo email
5. nếu hợp lệ, tạo hoặc lấy lại `ChatChannel` loại `DIRECT`

## 9.4. Chat realtime

1. client mở panel chat
2. client tải danh sách channel
3. client join room Socket.IO theo từng channel
4. gửi tin nhắn qua API để lưu database
5. sau khi lưu xong, client phát event socket
6. client khác trong cùng channel nhận tin nhắn realtime

## 10. Trạng thái hoàn thiện hiện tại

## 10.1. Đã có và dùng được

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

## 10.2. Đã có nền tảng nhưng chưa hoàn chỉnh

- notification module hoàn chỉnh
- comment đầy đủ cho task/document
- nhiều channel chat nhóm
- collaborative document realtime
- realtime activity feed
- realtime task board

## 10.3. Chưa hoàn thiện theo đúng trọng tâm đề tài

- drag-and-drop task board thật
- collaborative editing thật bằng CRDT/Yjs
- realtime đồng bộ task/document ở mức sản phẩm

## 11. Hướng dẫn chạy dự án

## 11.1. Yêu cầu

- Node.js `20+`
- MySQL `8.x`
- npm

## 11.2. Cài package

```bash
npm install
```

## 11.3. Tạo file `.env`

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

## 11.4. Tạo database

```sql
CREATE DATABASE coworkhub;
```

## 11.5. Migrate và seed

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

## 11.6. Chạy app

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

## 11.7. Chạy theo LAN để test nhiều tài khoản

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

## 11.8. Kiểm tra database

```bash
npx prisma studio
```

## 12. Cách test chat realtime

1. chạy `npm run dev`
2. chạy `npm run realtime:dev`
3. đăng nhập 2 tài khoản khác nhau
4. đảm bảo 2 tài khoản cùng thuộc một workspace
5. mở cùng workspace đó
6. mở panel chat ở cả hai phía
7. gửi tin nhắn để kiểm tra realtime

Muốn test direct chat:

- tài khoản B phải được thêm vào workspace hoặc đã chấp nhận lời mời trước

## 13. Những gì còn thiếu nếu so với Trello

Nếu so với Trello, hệ thống hiện tại đã có nền tảng khá tốt về dữ liệu và đã bắt đầu có chat, tài liệu và thành viên workspace. Tuy nhiên vẫn còn thiếu khá nhiều ở mức sản phẩm hoàn chỉnh.

### 13.1. Phần công việc và board

Còn thiếu:

- kéo thả task trực tiếp bằng chuột
- cập nhật thứ tự task theo thời gian thực
- tạo nhiều cột board linh hoạt như Trello
- thao tác nhanh trên card như đổi label, due date, assignee ngay trên board
- lọc task theo người phụ trách, label, deadline, trạng thái
- tìm kiếm task nhanh trên toàn board

### 13.2. Phần card chi tiết

Còn thiếu:

- màn hình chi tiết task mạnh hơn
- comment đầy đủ cho task
- checklist UI hoàn chỉnh
- attachment UI đầy đủ
- theo dõi lịch sử chỉnh sửa của task ngay trên giao diện
- watcher và mention người dùng trong task

### 13.3. Phần cộng tác

Còn thiếu:

- realtime update cho task board
- realtime activity feed
- notification UI hoàn chỉnh
- read receipt sâu hơn cho chat nhóm
- nhiều channel chat nhóm ngoài `general`

### 13.4. Phần trải nghiệm sản phẩm

Còn thiếu:

- trải nghiệm drag-and-drop mượt như Trello
- luồng thao tác nhanh, ít bấm
- bộ lọc, sort, search rõ ràng hơn
- mobile UX tốt hơn ở các màn hình làm việc chính
- phân quyền UI rõ ràng hơn theo `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`

### 13.5. Điểm hệ thống hiện tại có thể mở rộng hơn Trello

Không phải mọi thứ đều thua Trello. Hệ thống hiện tại có hướng mở rộng mà Trello cơ bản không mạnh bằng:

- tài liệu nội bộ gắn ngay trong workspace
- version tài liệu
- chat gắn với workspace
- có thể phát triển thành hệ thống lai giữa quản lý công việc và không gian làm việc nhóm

## 14. Những gì database đã có

- trong `schema.prisma` đã có bảng hoặc trường để hỗ trợ tính năng
- nhưng ở tầng API, business logic, UI hoặc realtime thì hệ thống chưa khai thác hết

### 14.1. Task

Database đã có:

- `TaskChecklist`, `TaskChecklistItem`: chưa có UI checklist hoàn chỉnh trên task
- `TaskDependency`: chưa có chức năng thể hiện task phụ thuộc nhau
- `TaskWatcher`: chưa có UI theo dõi task
- `TaskHistory`: chưa có timeline thay đổi task đầy đủ trên giao diện
- `position`: đã có trong `Task`, nhưng drag-and-drop thật chưa hoàn thiện

### 14.2. Tài liệu

Database đã có:

- `DocumentVersion`: chưa có giao diện xem danh sách version hoặc khôi phục version cũ
- `yjsState`: đã có trường chuẩn bị cho collaborative editing nhưng chưa dùng đầy đủ ở code

### 14.3. Comment và cộng tác

Database đã có:

- `Comment`: chưa có module comment hoàn chỉnh cho task/document
- `CommentMention`: chưa có luồng mention hoạt động đầy đủ trên UI
- `CommentReaction`: chưa có UI reaction cho comment

### 14.4. Attachment

Database đã có:

- `Attachment`: chưa có luồng upload, gắn file, xem file đính kèm đầy đủ cho task/document/chat

### 14.5. Notification

Database đã có:

- `Notification`: chưa có trung tâm thông báo hoàn chỉnh
- chưa có danh sách notification, đánh dấu đã đọc và điều hướng đầy đủ từ notification

### 14.6. Chat

Database đã có:

- `ChatChannel` loại `GROUP`: schema đã hỗ trợ nhưng UI chưa có tạo nhiều nhóm chat hoàn chỉnh
- `ChatChannelMember`: đã có bảng nhưng chưa có giao diện quản lý thành viên từng channel
- `ChatMessageReaction`: mới dùng ở mức cơ bản
- `ChatMessageRead`: đã có nhưng chưa có read receipt sâu kiểu ai đã đọc trong group

### 14.7. Presence

Database đã có:

- `Presence`: đã có nền cho online/offline, nhưng chưa khai thác mạnh cho collaboration document hoặc task

### 14.8. Workspace setting

Database đã có:

- `WorkspaceSetting`: đã có bảng nhưng chưa có trang cấu hình workspace hoàn chỉnh

## 15. Phần mở rộng database trong tương lai (không phải phần thiếu hiện tại)

Phần này không phải là “code còn thiếu so với database hiện tại”.

Đây chỉ là các gợi ý nếu sau này nhóm muốn:

- mở rộng sản phẩm lớn hơn
- tối ưu cho dữ liệu rất lớn
- đi xa hơn phạm vi hiện tại của đề tài

Nếu mục tiêu hiện tại là hoàn thiện dự án theo schema đang có, thì nhóm nên ưu tiên mục `14` trước.

### 15.1. Phần chat

Nên bổ sung thêm:

- `editedAt` cho `ChatMessage` để biết tin nhắn đã sửa chưa
- `isPinned` cho `ChatMessage` nếu muốn ghim tin nhắn
- `lastMessageId` hoặc `lastMessageAt` cho `ChatChannel` để tối ưu danh sách hội thoại
- retention policy cho chat cũ nếu dùng lâu dài
- chiến lược archive chat nếu dữ liệu tăng lớn

### 15.2. Phần notification

Nên bổ sung thêm:

- phân loại notification chi tiết hơn
- `link` hoặc `targetType`, `targetId` nếu muốn điều hướng chính xác tới task/document/message
- cơ chế dọn notification cũ đã đọc

### 15.3. Phần task

Nên bổ sung thêm:

- chuẩn hóa `TaskHistory` để lưu nhiều kiểu thay đổi hơn
- có thể thêm snapshot cũ/mới dưới dạng JSON nếu cần audit mạnh hơn

### 15.4. Phần tài liệu

Nên bổ sung thêm:

- chính sách tạo `DocumentVersion` rõ ràng hơn
- retention cho version quá cũ
- metadata rõ hơn cho collaborative editing nếu dùng Yjs thật

### 15.5. Phần file đính kèm

Nên bổ sung thêm:

- `checksum` để kiểm tra file trùng hoặc toàn vẹn dữ liệu
- `storageProvider` nếu sau này dùng nhiều loại storage
- `deletedAt` nếu muốn xóa mềm attachment

### 15.6. Phần meeting nếu mở rộng sản phẩm

Nếu muốn phát triển hệ thống vượt mức Trello cơ bản, database hiện tại vẫn còn thiếu module meeting riêng. Khi đó có thể cần thêm:

- `Meeting`
- `MeetingParticipant`
- `MeetingNote`
- `MeetingActionItem`
- `MeetingAttachment`

### 15.7. Kết luận về phần mở rộng database

Điểm quan trọng là:

- hiện tại database chưa bắt buộc phải sửa lớn để code tiếp
- phần nên làm ngay là khai thác hết những gì schema đã có ở mục `14`
- nếu muốn đi xa hơn theo hướng sản phẩm thật lâu dài, các phần chat, notification, versioning, retention và meeting là những nơi nên bổ sung trước

## 16. Kết luận

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
