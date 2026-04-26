# Website Quản Lý Công Việc

Đề tài 4: Xây dựng website quản lý dự án/công việc, hỗ trợ tạo task, phân công, theo dõi tiến độ, quản lý tài liệu làm việc chung, và mở rộng theo hướng realtime bằng WebSocket cùng kéo-thả trên bảng công việc.

Tài liệu này được viết lại theo đúng codebase hiện tại của dự án. Mục tiêu là để cả những người chưa có nền tảng về lập trình web, database hay realtime cũng có thể đọc, hiểu hệ thống đang có gì, hoạt động ra sao, và biết cần làm tiếp phần nào.

## 1. Dự án này là gì?

Đây là một hệ thống hỗ trợ nhóm làm việc cùng nhau trên một không gian chung gọi là `workspace`.

Trong mỗi `workspace`, hệ thống hướng đến việc cho phép:

- tạo và quản lý công việc
- phân công người thực hiện
- theo dõi trạng thái công việc
- tạo và chỉnh sửa tài liệu
- xem lịch sử hoạt động của nhóm
- mở rộng sang làm việc realtime

Có thể hiểu đơn giản:

- `Workspace` giống như một dự án hoặc một nhóm
- `Task` là một công việc cụ thể
- `Document` là tài liệu làm việc chung
- `Activity Log` là nhật ký hệ thống ghi lại ai đã làm gì
- `Presence` là trạng thái ai đang online, đang ở đâu, đang mở tài liệu nào

## 2. Hệ thống hiện tại đang dùng những gì?

Codebase hiện tại đang dùng các công nghệ chính sau:

- `Next.js 16`
- `React 19`
- `Prisma ORM`
- `MySQL`
- `Clerk`
- `Socket.IO`
- `Tiptap`
- `Tailwind CSS`
- `Zod`

Nói dễ hiểu hơn:

- `Next.js` là khung làm web fullstack
- `React` dùng để xây giao diện
- `Prisma` dùng để làm việc với cơ sở dữ liệu dễ hơn
- `MySQL` là nơi lưu dữ liệu thật
- `Clerk` lo phần đăng nhập/đăng ký
- `Socket.IO` dùng cho realtime
- `Tiptap` dùng để tạo trình soạn thảo tài liệu
- `Tailwind CSS` dùng để viết giao diện nhanh
- `Zod` dùng để kiểm tra dữ liệu đầu vào có hợp lệ không

## 3. Kiến trúc tổng thể của hệ thống

Hệ thống hiện tại không tách frontend và backend thành 2 project riêng. Thay vào đó, cả phần giao diện và phần xử lý API đang nằm trong cùng một dự án `Next.js`.

Luồng tổng quát:

```text
Người dùng mở trình duyệt
        |
        v
Giao diện React / Next.js
        |
        v
API trong app/api
        |
        v
Prisma ORM
        |
        v
MySQL Database

Song song:

Giao diện
        |
        v
Socket.IO Client
        |
        v
Realtime Server riêng trong server/realtime-server.js
```

Hiểu đơn giản:

- Khi người dùng bấm nút tạo task, giao diện sẽ gọi API
- API sẽ kiểm tra dữ liệu và lưu xuống MySQL qua Prisma
- Khi cần realtime, giao diện sẽ kết nối thêm tới Socket.IO server

## 4. Cấu trúc thư mục hiện tại

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
  activity.ts
  auth.ts
  clerk-config.ts
  data.ts
  demo-data.ts
  permissions.ts
  prisma.ts

prisma/
  schema.prisma

server/
  realtime-server.js
```

Ý nghĩa từng phần:

### `app/`

Đây là nơi chứa các trang và API của Next.js App Router.

- `app/page.tsx`: trang landing hoặc trang giới thiệu ban đầu
- `app/dashboard/page.tsx`: trang dashboard sau khi vào hệ thống
- `app/workspaces/[workspaceId]/page.tsx`: trang chi tiết từng workspace
- `app/workspaces/[workspaceId]/documents/[documentId]/page.tsx`: trang editor của tài liệu
- `app/api/...`: các API backend

### `components/`

Đây là nơi chứa các thành phần giao diện.

- `components/task-board.tsx`: bảng công việc
- `components/workspace/document-manager.tsx`: tạo và quản lý tài liệu trong workspace
- `components/workspace/assignment-panel.tsx`: giao diện phân công task
- `components/workspace/workspace-planner.tsx`: khu vực tạo task và xem deadline
- `components/editor/collaborative-editor-shell.tsx`: trình soạn thảo tài liệu
- `components/chat-panel.tsx`: panel dành cho activity/presence, định hướng realtime

### `lib/`

Đây là nơi chứa các hàm xử lý dùng chung.

- `lib/prisma.ts`: khởi tạo Prisma client
- `lib/auth.ts`: xử lý lấy user từ Clerk và đồng bộ vào DB
- `lib/data.ts`: lấy dữ liệu từ database và biến đổi sang dạng giao diện cần
- `lib/permissions.ts`: kiểm tra quyền truy cập workspace
- `lib/activity.ts`: ghi log hoạt động
- `lib/demo-data.ts`: dữ liệu mẫu khi chưa dùng database thật

### `prisma/`

- `prisma/schema.prisma`: file định nghĩa cấu trúc database

### `server/`

- `server/realtime-server.js`: server realtime dùng Socket.IO

## 5. Hệ thống hiện tại đã có gì?

Phần này rất quan trọng. Đây là danh sách chi tiết những gì dự án hiện tại đã có thật trong code.

## 5.1. Phần giao diện đã có

### Trang chính và dashboard

Hệ thống đã có:

- trang vào hệ thống
- dashboard tổng quan
- trang chi tiết workspace
- trang tài liệu
- form tạo task
- form tạo document
- khu vực phân công task
- bảng task theo cột trạng thái
- activity feed

Điều đó nghĩa là người xem demo có thể thấy được luồng sử dụng cơ bản của hệ thống.

### Giao diện task board

Hiện tại đã có bảng chia task theo các trạng thái:

- `TODO`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`

Tuy nhiên, hiện tại:

- chưa kéo-thả trực tiếp bằng chuột
- mới đổi trạng thái bằng nút bấm

Nói cách khác:

- logic quản lý trạng thái đã có
- trải nghiệm kéo-thả đúng yêu cầu đề tài thì chưa hoàn thiện

### Giao diện quản lý tài liệu

Hệ thống đã có:

- tạo tài liệu mới
- nhập tiêu đề
- nhập nội dung khởi tạo
- import file `.txt` hoặc `.md`
- mở editor để sửa nội dung
- tự động lưu nội dung sau khi người dùng chỉnh sửa

### Giao diện phân công công việc

Hệ thống đã có màn hình cho phép:

- xem danh sách task
- chọn người phụ trách cho từng task
- cập nhật người được giao việc

### Giao diện activity/presence

Hiện đã có panel giao diện dành cho:

- hiển thị hoạt động gần đây
- chuẩn bị gắn trạng thái online
- chuẩn bị gắn realtime event

Nhưng hiện tại đây mới là:

- khung giao diện tốt
- chưa phải chat realtime hoàn chỉnh

## 5.2. Phần backend/API đã có

Các API hiện tại đã có trong hệ thống:

- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/activity`
- `GET /api/workspaces/[workspaceId]/tasks`
- `POST /api/workspaces/[workspaceId]/tasks`
- `PATCH /api/workspaces/[workspaceId]/tasks/[taskId]`
- `GET /api/workspaces/[workspaceId]/documents`
- `POST /api/workspaces/[workspaceId]/documents`
- `GET /api/workspaces/[workspaceId]/documents/[documentId]`
- `PATCH /api/workspaces/[workspaceId]/documents/[documentId]`

### API workspace đã làm được gì?

API workspace hiện đang làm được:

- lấy danh sách workspace của user
- tạo workspace mới
- tự động tạo membership cho owner
- có thể tạo trước lời mời tham gia bằng email
- ghi activity log khi workspace được tạo

### API task đã làm được gì?

API task hiện đang làm được:

- lấy danh sách task trong workspace
- tạo task mới
- cập nhật trạng thái task
- cập nhật ưu tiên
- cập nhật assignee
- cập nhật deadline
- ghi activity log khi task thay đổi

### API document đã làm được gì?

API document hiện đang làm được:

- lấy danh sách document trong workspace
- tạo document mới
- lưu nội dung khởi tạo
- lấy chi tiết một document
- cập nhật tiêu đề document
- cập nhật nội dung document
- ghi activity log khi document thay đổi

### API activity đã làm được gì?

API activity hiện đang làm được:

- lấy danh sách hoạt động của các workspace mà user đang tham gia

## 5.3. Phần xác thực đã có

Hệ thống hiện đang tích hợp `Clerk`.

Điều này nghĩa là:

- nếu cấu hình Clerk đúng, người dùng có thể đăng nhập/đăng ký
- middleware sẽ bảo vệ các route cần đăng nhập
- khi user đăng nhập thành công, hệ thống sẽ đồng bộ thông tin người dùng vào bảng `User`

File liên quan:

- `lib/clerk-config.ts`
- `lib/auth.ts`
- `proxy.ts`

### Cơ chế hoạt động hiện tại của auth

Khi người dùng đăng nhập:

1. Clerk xác thực user
2. Ứng dụng lấy `userId` từ Clerk
3. Hệ thống kiểm tra xem user này đã có trong database chưa
4. Nếu chưa có, tạo mới
5. Nếu đã có, cập nhật lại thông tin cơ bản như email, tên, avatar

### Trường hợp chưa cấu hình Clerk

Code hiện tại có cơ chế khá linh hoạt:

- nếu chưa có key hợp lệ của Clerk, middleware có thể bỏ qua bảo vệ route
- một số nơi có thể hoạt động như chế độ demo

Điều này giúp nhóm:

- làm giao diện trước
- chưa cần cấu hình auth ngay từ đầu

Nhưng cũng có rủi ro:

- dễ nhầm giữa demo và hệ thống thật

## 5.4. Phần realtime đã có

Hệ thống hiện đã có một server realtime riêng tại:

- `server/realtime-server.js`

Server này đang dùng `Socket.IO`.

### Realtime server hiện đang có event nào?

- `document:join`
- `document:update`
- `activity:push`
- `presence:update` được server phát lại cho client
- `document:patch` được server phát lại cho client
- `activity:new` được server phát lại cho client

### Cách hoạt động hiện tại

Khi một client tham gia:

1. client kết nối tới socket server
2. client gửi `document:join`
3. server thêm client vào room
4. server cập nhật danh sách người đang có mặt trong room
5. server phát `presence:update`

Khi một client sửa nội dung tài liệu:

1. client gửi `document:update`
2. server nhận payload
3. server phát `document:patch` cho các client khác trong cùng room

Khi client ngắt kết nối:

1. server xóa socket đó khỏi danh sách presence
2. server phát lại danh sách presence mới

### Điều gì đã có và điều gì chưa có ở realtime?

Đã có:

- server socket chạy riêng
- cơ chế room
- cơ chế presence trong bộ nhớ
- cơ chế broadcast event

Chưa có đầy đủ:

- client thực sự kết nối đồng bộ tới socket ở các màn hình chính
- lưu presence xuống database một cách chuẩn
- đồng bộ task realtime
- chat realtime hoàn chỉnh
- editor realtime thực sự bằng CRDT

## 5.5. Phần dữ liệu demo đã có

Trong `lib/demo-data.ts`, hệ thống đang có dữ liệu mẫu để hiển thị khi chưa có database hoặc chưa cấu hình thật.

Điều này rất hữu ích khi:

- muốn làm UI trước
- muốn demo giao diện nhanh
- chưa kết nối database

Nhưng cần hiểu rõ:

- dữ liệu demo không phải dữ liệu thật
- có giao diện chạy được chưa có nghĩa backend đã hoàn chỉnh

## 6. Database: giải thích cách hoạt động của hệ thống

Database hiện dùng:

- `MySQL`
- được mô tả bằng file `prisma/schema.prisma`

## 6.1. Database dùng để làm gì trong dự án này?

Database là nơi lưu dữ liệu lâu dài. Khi người dùng tắt trình duyệt rồi mở lại, dữ liệu vẫn còn vì đã được lưu trong database.

Ví dụ:

- user tạo workspace
- user tạo task
- user cập nhật trạng thái task
- user tạo tài liệu
- user sửa tài liệu

Tất cả các thao tác này cần được lưu lại để lần sau vào vẫn thấy.

Nếu không có database:

- dữ liệu sẽ mất khi reload
- không thể làm hệ thống thật

## 6.2. Prisma là gì trong luồng database?

`Prisma` là lớp trung gian giữa code JavaScript/TypeScript và MySQL.

Nếu không dùng Prisma:

- phải viết SQL nhiều hơn
- khó quản lý kiểu dữ liệu
- dễ sai khi làm việc với quan hệ giữa các bảng

Khi dùng Prisma:

- ta định nghĩa bảng trong `schema.prisma`
- Prisma sinh ra client để gọi bằng code
- backend dùng client này để đọc/ghi dữ liệu

Ví dụ dễ hiểu:

Thay vì viết SQL kiểu:

```sql
SELECT * FROM Task WHERE workspaceId = 'abc';
```

Ta có thể viết bằng Prisma:

```ts
const items = await prisma.task.findMany({
  where: { workspaceId },
})
```

## 6.3. Luồng dữ liệu từ người dùng đến database

Ví dụ với việc tạo task:

1. người dùng nhập tên task trên giao diện
2. giao diện gửi request lên API
3. API kiểm tra dữ liệu có hợp lệ không bằng `Zod`
4. API kiểm tra user có quyền vào workspace không
5. Prisma tạo bản ghi mới trong bảng `Task`
6. hệ thống ghi thêm một bản ghi vào `ActivityLog`
7. giao diện tải lại dữ liệu

Đây là cách hệ thống “sống” nhờ database.

## 6.4. Các bảng chính trong database và vai trò của chúng

Database hiện tại đã được thiết kế theo hướng “khóa schema một lần để code tiếp”, nghĩa là phần cấu trúc dữ liệu cốt lõi đã được chốt đủ rộng cho các chức năng hiện tại và cả phần mở rộng tiếp theo. Từ đây nhóm có thể tập trung làm tính năng mà không phải quay lại đổi mô hình database nữa.

### Nhóm bảng người dùng và workspace

#### Bảng `User`

Lưu người dùng nội bộ của hệ thống.

Các cột quan trọng:

- `id`: mã nội bộ của hệ thống
- `clerkId`: mã người dùng từ Clerk
- `email`: email duy nhất
- `name`, `username`, `avatarUrl`
- `createdAt`, `updatedAt`

Vai trò:

- định danh người dùng
- liên kết user với workspace, task, document, comment, chat, notification

#### Bảng `Workspace`

Là bảng trung tâm đại diện cho một không gian làm việc.

Các cột quan trọng:

- `name`, `slug`, `description`
- `visibility`
- `ownerId`
- `archivedAt`, `deletedAt`

Vai trò:

- gom toàn bộ thành viên, task, document, activity, chat, notification vào cùng một phạm vi

#### Bảng `WorkspaceSetting`

Lưu cấu hình riêng của từng workspace.

Ví dụ:

- có cho phép member mời người khác không
- có bật versioning document không
- priority mặc định của task là gì

#### Bảng `WorkspaceMember`

Là bảng trung gian nối `User` và `Workspace`.

Vai trò:

- xác định ai đang thuộc workspace nào
- người đó có quyền gì: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`

#### Bảng `WorkspaceInvitation`

Lưu lời mời tham gia workspace.

Điểm đã hoàn thiện trong schema mới:

- có `status`
- có `token`
- có `expiresAt`
- có `acceptedAt`
- có thể liên kết luôn tới `invitedUserId` nếu người được mời đã có tài khoản

### Nhóm bảng tài liệu

#### Bảng `Document`

Lưu tài liệu làm việc chung.

Các cột quan trọng:

- `title`
- `summary`
- `content`
- `yjsState`
- `status`
- `createdById`
- `updatedById`
- `archivedAt`, `deletedAt`

Vai trò:

- lưu nội dung tài liệu hiện tại
- hỗ trợ autosave
- hỗ trợ tương lai cho collaborative editor bằng Yjs

#### Bảng `DocumentVersion`

Đây là bảng rất quan trọng trong schema mới.

Vai trò:

- lưu các phiên bản của document
- cho phép sau này làm lịch sử chỉnh sửa
- cho phép phục hồi phiên bản cũ

Các cột quan trọng:

- `documentId`
- `versionNumber`
- `title`
- `content`
- `yjsState`
- `createdById`

### Nhóm bảng công việc

#### Bảng `Task`

Đây là bảng lưu công việc chính.

Các cột quan trọng:

- `title`
- `description`
- `status`
- `priority`
- `startDate`
- `deadline`
- `completedAt`
- `estimatedMinutes`
- `actualMinutes`
- `position`
- `assigneeId`
- `createdById`
- `archivedAt`, `deletedAt`

Vai trò:

- lưu task
- lưu trạng thái thực hiện
- lưu người phụ trách
- lưu thời hạn
- lưu thứ tự hiển thị trên board

`position` là cột đã được chốt để làm drag-and-drop thật sau này mà không cần sửa schema.

#### Bảng `TaskLabel`

Lưu nhãn của task, ví dụ:

- Backend
- Frontend
- Realtime
- Bug
- Urgent

#### Bảng `TaskLabelAssignment`

Là bảng nối nhiều-nhiều giữa `Task` và `TaskLabel`.

Vai trò:

- một task có thể có nhiều nhãn
- một nhãn có thể dùng cho nhiều task

#### Bảng `TaskWatcher`

Lưu danh sách người đang theo dõi task.

Vai trò:

- phục vụ notification
- phục vụ màn hình “theo dõi công việc”

#### Bảng `TaskChecklist`

Lưu một checklist thuộc về task.

Ví dụ:

- checklist “Các bước triển khai”

#### Bảng `TaskChecklistItem`

Lưu từng dòng việc con trong checklist.

Vai trò:

- chia nhỏ task lớn thành các đầu việc nhỏ
- biết mục nào đã hoàn thành
- biết ai đánh dấu hoàn thành

#### Bảng `TaskDependency`

Lưu quan hệ phụ thuộc giữa các task.

Ví dụ:

- task A chặn task B
- task A liên quan task B

Đây là phần rất hữu ích khi dự án lớn dần lên.

#### Bảng `TaskHistory`

Đây là bảng timeline chi tiết cho task.

Vai trò:

- lưu thay đổi trạng thái
- lưu thay đổi assignee
- lưu thay đổi priority
- lưu thay đổi deadline
- lưu thay đổi position
- lưu thay đổi checklist hoặc nhãn

Nói cách khác:

- `ActivityLog` dùng để ghi log cấp hệ thống/workspace
- `TaskHistory` dùng để ghi lịch sử chi tiết riêng cho từng task

### Nhóm bảng trao đổi và bình luận

#### Bảng `Comment`

Schema mới đã hoàn thiện comment theo hướng dùng được lâu dài.

Comment hiện có thể:

- gắn vào `Task`
- gắn vào `Document`
- trả lời comment khác bằng `parentCommentId`
- được đánh dấu resolved
- hỗ trợ soft delete

#### Bảng `CommentMention`

Lưu việc nhắc tên người dùng trong comment.

Vai trò:

- phục vụ notification kiểu mention

#### Bảng `CommentReaction`

Lưu reaction vào comment, ví dụ:

- 👍
- ❤️
- 👀

### Nhóm bảng file và đính kèm

#### Bảng `Attachment`

Đây là bảng đã được bổ sung để khóa luôn phần file đính kèm.

Attachment hiện có thể gắn vào:

- `Task`
- `Document`
- `Comment`
- `ChatMessage`

Các cột quan trọng:

- `kind`
- `fileName`
- `originalName`
- `mimeType`
- `sizeBytes`
- `storageProvider`
- `storageKey`
- `publicUrl`
- `thumbnailUrl`
- `checksum`

Nhờ đó sau này có thể đổi sang local, cloud storage, S3, Supabase Storage... mà không cần đổi lại database.

### Nhóm bảng notification

#### Bảng `Notification`

Schema mới đã có bảng thông báo hoàn chỉnh.

Notification có thể liên kết tới:

- `Workspace`
- `Task`
- `Document`
- `Comment`
- `ChatMessage`

Vai trò:

- báo được giao task
- báo có mention
- báo có comment trả lời
- báo document cập nhật
- báo chat message

### Nhóm bảng chat và realtime

#### Bảng `Presence`

Lưu trạng thái hiện diện realtime.

Đã mở rộng thêm:

- `channelId`
- `connectionMeta`
- `connectedAt`
- `lastSeenAt`

#### Bảng `ChatChannel`

Lưu các kênh chat trong workspace.

Có thể dùng cho:

- kênh chung
- kênh riêng tư
- announcement
- direct/group

#### Bảng `ChatChannelMember`

Lưu thành viên thuộc kênh chat.

#### Bảng `ChatMessage`

Lưu tin nhắn.

Tin nhắn hiện hỗ trợ:

- text
- system message
- file message
- reply theo `parentMessageId`
- metadata mở rộng

#### Bảng `ChatMessageRead`

Lưu việc ai đã đọc tin nhắn nào.

#### Bảng `ChatMessageReaction`

Lưu reaction cho tin nhắn chat.

## 6.5. Các enum trong database nghĩa là gì?

Enum là tập giá trị cố định, giúp tránh nhập sai lung tung.

### `WorkspaceRole`

Giá trị:

- `OWNER`
- `ADMIN`
- `MEMBER`
- `VIEWER`

Ý nghĩa:

- `OWNER`: chủ workspace
- `ADMIN`: quản trị
- `MEMBER`: thành viên làm việc
- `VIEWER`: chỉ xem

### `WorkspaceVisibility`

Giá trị:

- `PRIVATE`
- `INTERNAL`

Ý nghĩa:

- `PRIVATE`: riêng tư
- `INTERNAL`: nội bộ

### `TaskStatus`

Giá trị:

- `TODO`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`

Ý nghĩa:

- `TODO`: chưa làm
- `IN_PROGRESS`: đang làm
- `REVIEW`: đang chờ kiểm tra
- `DONE`: hoàn thành

### `TaskPriority`

Giá trị:

- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

Ý nghĩa:

- `LOW`: ưu tiên thấp
- `MEDIUM`: trung bình
- `HIGH`: cao
- `URGENT`: khẩn cấp

### `DocumentStatus`

Giá trị:

- `DRAFT`
- `ACTIVE`
- `ARCHIVED`

Ý nghĩa:

- `DRAFT`: bản nháp
- `ACTIVE`: đang sử dụng
- `ARCHIVED`: đã lưu trữ

## 6.6. Quan hệ giữa các bảng

Nếu nhìn theo cách dễ hiểu:

- một `User` có thể sở hữu nhiều `Workspace`
- một `User` có thể tham gia nhiều `Workspace`
- một `Workspace` có nhiều `Task`, `Document`, `Comment`, `Notification`, `ChatChannel`
- một `Task` có thể có nhiều `Label`, `Checklist`, `Watcher`, `History`, `Attachment`
- một `Document` có nhiều `Version`, `Comment`, `Attachment`
- một `Comment` có thể có comment con, mention, reaction, attachment
- một `ChatChannel` có nhiều thành viên và nhiều tin nhắn
- một `ChatMessage` có thể có reaction, read receipt, attachment

Sơ đồ đơn giản:

```text
User
  |
  +---- Workspace (owner)
  |
  +---- WorkspaceMember ---- Workspace
                               |
                               +---- Task ---- TaskHistory / Checklist / Label / Dependency
                               +---- Document ---- DocumentVersion
                               +---- Comment ---- Mention / Reaction
                               +---- Attachment
                               +---- Notification
                               +---- ChatChannel ---- ChatMessage
                               +---- ActivityLog
                               +---- Invitation
                               +---- Presence
```

## 6.7. Những điểm mạnh của thiết kế database hiện tại

- đã có mô hình workspace rõ ràng
- đã có membership và role
- đã có task với trạng thái và độ ưu tiên
- đã có `position` để phục vụ drag-and-drop
- đã có document để phục vụ editor
- đã có `yjsState` để chuẩn bị cho realtime document
- đã có activity log
- đã có presence
- đã có versioning cho document
- đã có timeline chi tiết cho task
- đã có notification
- đã có attachment
- đã có chat schema hoàn chỉnh
- đã có soft delete và archive cho nhiều bảng chính
- đã có migration Prisma chính thức
- đã có seed dữ liệu mẫu chạy được

## 6.8. Trạng thái database hiện tại

Phần database hiện đã được chốt ở mức triển khai dài hạn.

Điều này có nghĩa là:

- schema Prisma đã hoàn chỉnh
- migration đầu tiên đã được tạo và áp dụng
- database local đã được reset sạch và dựng lại từ migration
- seed dữ liệu mẫu đã được tạo để nhóm dùng ngay

Từ thời điểm này, các phần còn lại của dự án chủ yếu là:

- viết API
- nối giao diện
- nối realtime
- xử lý phân quyền
- tối ưu trải nghiệm người dùng

Nói ngắn gọn:

- tầng database đã đủ rộng để không phải quay lại thiết kế lại nữa
- nhóm có thể code tiếp trên cùng một nền dữ liệu ổn định

## 7. Các kỹ thuật đang dùng: cách sử dụng và cú pháp cơ bản

Phần này tập trung vào “dùng như thế nào”, “viết ra sao”, dành cho người mới.

## 7.1. Next.js App Router

### Dùng để làm gì?

- tạo trang
- tạo route động
- tạo API

### Cách dùng cơ bản

Trong Next.js App Router:

- file `page.tsx` tạo ra một trang
- thư mục có `[id]` là route động
- file `route.ts` tạo API endpoint

Ví dụ:

```text
app/dashboard/page.tsx
```

nghĩa là có trang:

```text
/dashboard
```

Ví dụ:

```text
app/workspaces/[workspaceId]/page.tsx
```

nghĩa là route động:

```text
/workspaces/123
```

Ví dụ tạo API:

```text
app/api/workspaces/route.ts
```

nghĩa là API:

```text
/api/workspaces
```

### Cú pháp cơ bản của API route

```ts
export async function GET() {
  return Response.json({ ok: true })
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ body })
}
```

Trong dự án này, các API đang dùng:

- `GET`
- `POST`
- `PATCH`

## 7.2. React

### Dùng để làm gì?

- tạo component giao diện
- quản lý trạng thái
- phản ứng khi người dùng thao tác

### Cú pháp component cơ bản

```tsx
export function Hello() {
  return <div>Xin chào</div>
}
```

### Dùng props

```tsx
type CardProps = {
  title: string
}

export function Card({ title }: CardProps) {
  return <h2>{title}</h2>
}
```

### Dùng state

```tsx
const [value, setValue] = useState("")
```

Ý nghĩa:

- `value`: dữ liệu hiện tại
- `setValue`: hàm để cập nhật dữ liệu đó

Trong dự án này, React đang được dùng để:

- hiển thị danh sách task
- hiển thị danh sách document
- nhập form tạo task
- nhập form tạo document
- đổi trạng thái task
- chỉnh sửa nội dung document

## 7.3. Prisma ORM

### Dùng để làm gì?

- truy vấn database
- tạo bản ghi
- cập nhật bản ghi
- lấy dữ liệu theo quan hệ

### File khởi tạo Prisma

Hệ thống có file:

- `lib/prisma.ts`

Mục đích:

- tạo một Prisma client dùng chung
- tránh tạo quá nhiều kết nối trong môi trường dev

### Cú pháp Prisma cơ bản

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
    documents: true,
  },
})
```

### Cách dùng trong dự án hiện tại

Prisma đang được dùng để:

- lấy dashboard data
- lấy workspace detail
- tạo workspace
- tạo task
- cập nhật task
- tạo document
- cập nhật document
- ghi activity log
- đồng bộ user từ Clerk

## 7.4. Zod

### Dùng để làm gì?

`Zod` dùng để kiểm tra dữ liệu đầu vào.

Ví dụ:

- tiêu đề task không được để trống
- priority phải thuộc danh sách cho phép
- dữ liệu gửi lên phải đúng kiểu

### Cú pháp cơ bản

```ts
const schema = z.object({
  title: z.string().min(1),
})
```

Kiểm tra dữ liệu:

```ts
const parsed = schema.safeParse(body)
```

Nếu hợp lệ:

- `parsed.success === true`

Nếu không hợp lệ:

- `parsed.success === false`

### Cách dùng trong dự án

Hệ thống đang dùng Zod trong:

- API tạo workspace
- API tạo task
- API cập nhật task
- API tạo document
- API cập nhật document

## 7.5. Clerk

### Dùng để làm gì?

- đăng nhập
- đăng ký
- quản lý session
- lấy thông tin user

### Cách dùng cơ bản

Trong server:

```ts
import { auth, currentUser } from "@clerk/nextjs/server"
```

Lấy user hiện tại:

```ts
const { userId } = await auth()
```

Lấy thông tin đầy đủ hơn:

```ts
const clerkUser = await currentUser()
```

### Cách dự án đang dùng Clerk

Trong `lib/auth.ts`, hệ thống:

- lấy user từ Clerk
- kiểm tra xem user đã tồn tại trong DB chưa
- nếu chưa có thì tạo
- nếu có rồi thì cập nhật

Như vậy:

- Clerk lo phần xác thực
- bảng `User` trong MySQL lo phần dữ liệu người dùng nội bộ của hệ thống

## 7.6. Socket.IO

### Dùng để làm gì?

- gửi dữ liệu realtime giữa client và server
- cập nhật ngay khi có thay đổi

### Cú pháp cơ bản phía server

```js
io.on("connection", (socket) => {
  socket.on("event-name", (payload) => {
    // xử lý
  })
})
```

Phát dữ liệu:

```js
socket.emit("event-name", data)
```

Phát cho tất cả socket trong room:

```js
io.to(roomKey).emit("presence:update", users)
```

### Cách dự án đang dùng Socket.IO

Trong `server/realtime-server.js`, hệ thống đang:

- tạo HTTP server
- gắn Socket.IO vào
- tạo room theo `workspaceId` và `documentId`
- lưu presence tạm trong `Map`
- phát event cho các client khác

### Vì sao hiện tại nói là “mới có nền tảng realtime”?

Vì:

- server đã có
- event đã có
- nhưng phần client gắn đầy đủ vào luồng sản phẩm chưa hoàn chỉnh

## 7.7. Tiptap

### Dùng để làm gì?

- tạo trình soạn thảo rich text
- lưu nội dung dưới dạng JSON

### Cú pháp cơ bản

```tsx
const editor = useEditor({
  extensions: [StarterKit],
  content: initialContent,
})
```

Hiển thị editor:

```tsx
<EditorContent editor={editor} />
```

### Cách dự án đang dùng Tiptap

Trong `components/editor/collaborative-editor-shell.tsx`, hệ thống đang:

- khởi tạo editor
- nạp nội dung ban đầu
- theo dõi thay đổi
- tự động gửi `PATCH` lên API để lưu nội dung

Hiện tại editor đang là:

- editor có autosave
- chưa phải collaborative editor thực sự

## 7.8. Tailwind CSS

### Dùng để làm gì?

- viết giao diện bằng class tiện ích

Ví dụ:

```tsx
<div className="rounded-xl border p-4">Nội dung</div>
```

Ý nghĩa:

- `rounded-xl`: bo góc
- `border`: có viền
- `p-4`: padding

### Cách dùng trong dự án

Phần lớn giao diện hiện tại đều đang viết bằng Tailwind CSS và các component UI.

## 7.9. Fetch API

### Dùng để làm gì?

- gửi request từ giao diện lên backend

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

### Cách dùng trong dự án

Fetch đang được dùng để:

- tạo workspace
- tạo task
- cập nhật task
- tạo document
- cập nhật document

## 8. Luồng hoạt động chi tiết của hệ thống hiện tại

## 8.1. Luồng tạo workspace

1. người dùng mở form tạo workspace
2. nhập tên workspace
3. có thể nhập mô tả
4. có thể nhập email mời thành viên
5. giao diện gửi request `POST /api/workspaces`
6. API kiểm tra user hiện tại
7. API kiểm tra dữ liệu đầu vào bằng Zod
8. Prisma tạo `Workspace`
9. Prisma tạo `WorkspaceMember` cho owner
10. Prisma tạo `WorkspaceInvitation` nếu có email mời
11. hệ thống ghi `ActivityLog`
12. trả dữ liệu về cho giao diện

## 8.2. Luồng tạo task

1. người dùng nhập tên task
2. nhập mô tả, ưu tiên, deadline
3. giao diện gọi `POST /api/workspaces/[workspaceId]/tasks`
4. API kiểm tra user
5. API kiểm tra quyền vào workspace
6. API kiểm tra dữ liệu bằng Zod
7. Prisma tạo bản ghi mới trong `Task`
8. hệ thống ghi `ActivityLog`
9. giao diện refresh lại dữ liệu

## 8.3. Luồng cập nhật trạng thái task

1. người dùng bấm nút chuyển trạng thái
2. giao diện gọi `PATCH /api/workspaces/[workspaceId]/tasks/[taskId]`
3. API kiểm tra user
4. API kiểm tra quyền
5. Prisma cập nhật `status`
6. hệ thống ghi `ActivityLog`
7. giao diện cập nhật lại

## 8.4. Luồng phân công task

1. người dùng chọn assignee từ danh sách thành viên
2. giao diện gọi `PATCH /api/workspaces/[workspaceId]/tasks/[taskId]`
3. API cập nhật `assigneeId`
4. hệ thống ghi `ActivityLog`

## 8.5. Luồng tạo document

1. người dùng nhập tiêu đề document
2. có thể nhập nội dung ban đầu
3. có thể import từ file `.txt` hoặc `.md`
4. giao diện gọi `POST /api/workspaces/[workspaceId]/documents`
5. API tạo `Document`
6. trả về `id` document
7. giao diện điều hướng sang trang editor

## 8.6. Luồng autosave document

1. người dùng gõ nội dung trong editor
2. editor phát hiện thay đổi
3. hệ thống chờ một khoảng ngắn
4. gửi `PATCH /api/workspaces/[workspaceId]/documents/[documentId]`
5. Prisma cập nhật `content`
6. hệ thống đổi trạng thái lưu thành “Đã lưu”

## 8.7. Luồng dashboard

Khi vào dashboard:

1. server lấy user hiện tại
2. lấy các workspace user đang tham gia
3. lấy document gần đây
4. lấy task có deadline
5. lấy activity gần đây
6. ghép lại thành dữ liệu để render giao diện

## 9. Trạng thái hoàn thiện hiện tại: đã có gì, chưa có gì

Đây là phần quan trọng nhất để tránh hiểu nhầm.

## 9.1. Những gì đã có thật và dùng được

- cấu trúc dự án fullstack rõ ràng
- database schema khá đầy đủ
- có Prisma client
- có dashboard đọc dữ liệu thật từ database
- có workspace page
- có tạo workspace
- có tạo task
- có cập nhật task
- có gán assignee
- có tạo document
- có editor
- có autosave document
- có activity log
- có tích hợp Clerk
- có middleware bảo vệ route khi Clerk hợp lệ
- có realtime server riêng
- có dữ liệu demo để phát triển giao diện

## 9.2. Những gì mới có ở mức nền tảng

- realtime document
- realtime activity feed
- presence online
- collaborative editing
- lời mời thành viên hoàn chỉnh
- comment cho task/document

Nói chính xác:

- schema đã chuẩn bị
- package đã cài
- một phần server hoặc UI đã có khung
- nhưng chưa nối thành một chức năng hoàn chỉnh từ đầu đến cuối

## 9.3. Những gì chưa đạt đúng yêu cầu đề tài

### Drag-and-Drop

Yêu cầu đề tài có kéo-thả task.

Hiện tại:

- chưa có thao tác kéo-thả thực tế
- mới có chuyển trạng thái bằng nút bấm

### Realtime đúng nghĩa

Yêu cầu đề tài có realtime.

Hiện tại:

- đã có socket server
- nhưng chưa hoàn thiện luồng realtime cho task/document/activity ở mức sản phẩm

### Collaborative editor đúng nghĩa

Hiện tại editor đang là:

- editor + autosave

Chưa phải:

- nhiều người cùng sửa realtime bằng CRDT/Yjs

## 10. Hướng dẫn chạy dự án

## 10.1. Yêu cầu môi trường

- Node.js từ phiên bản `20` trở lên
- MySQL `8.x`
- npm

## 10.2. Cài package

```bash
npm install
```

## 10.3. Tạo file môi trường

Sao chép `.env.example` thành `.env` và điền dữ liệu:

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

Giải thích:

- `DATABASE_URL`: đường dẫn kết nối MySQL
- `NEXT_PUBLIC_APP_URL`: URL của web app
- `NEXT_PUBLIC_SOCKET_URL`: URL của realtime server
- `ALLOWED_DEV_ORIGINS`: danh sách host được phép truy cập dev server, phân tách bằng dấu phẩy
- `CLERK_SECRET_KEY`: key bí mật Clerk
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: key public của Clerk

## 10.4. Tạo database

Ví dụ:

```sql
CREATE DATABASE coworkhub;
```

## 10.5. Đồng bộ schema

```bash
npx prisma generate
npx prisma migrate dev
```

Nếu muốn nạp dữ liệu mẫu sau khi migrate:

```bash
npm run db:seed
```

## 10.6. Chạy hệ thống

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run realtime:dev
```

Địa chỉ mặc định:

- App: `http://localhost:3000`
- Socket server: `http://localhost:4001`

## 10.7. Xem dữ liệu database

```bash
npx prisma studio
```

## 10.8. Hướng dẫn để người khác clone từ GitHub về vẫn chạy được

Mục tiêu của repo này là:

- không khóa cứng theo máy của một người
- ai clone về cũng có thể chạy local
- nếu cần test nhiều thiết bị hoặc nhiều tài khoản thì có thể chạy qua mạng LAN

Nguyên tắc cấu hình:

- không commit file `.env` thật
- chỉ commit `.env.example`
- mọi cấu hình máy cá nhân phải đi qua biến môi trường

Khi một người khác clone repo:

1. chạy `npm install`
2. tạo `.env` từ `.env.example`
3. chuẩn bị MySQL
4. chạy migrate
5. chạy seed nếu cần dữ liệu mẫu
6. chạy app và realtime server

Các lệnh tối thiểu:

```bash
npx prisma migrate dev
npm run db:seed
npm run dev
npm run realtime:dev
```

## 10.9. Chạy ở chế độ local chuẩn

Đây là cách ổn định nhất cho hầu hết thành viên trong nhóm.

`.env` nên để:

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4001"
ALLOWED_DEV_ORIGINS="localhost,127.0.0.1"
```

Chạy:

```bash
npm run dev
npm run realtime:dev
```

## 10.10. Chạy ở chế độ LAN để test nhiều thiết bị hoặc nhiều tài khoản

Nếu muốn:

- dùng điện thoại hoặc máy khác trong cùng mạng
- đăng nhập 2 tài khoản khác nhau để test chat/realtime
- truy cập app bằng địa chỉ IP nội bộ

thì cần đổi `.env` theo IP thật của máy đang chạy app.

Ví dụ máy chạy app có IP:

```text
192.168.53.101
```

thì cấu hình:

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

Khi đó:

- máy chính có thể dùng `http://localhost:3000`
- máy khác trong mạng dùng `http://192.168.53.101:3000`

## 10.11. Cấu hình Clerk để ai clone về cũng đăng nhập được

Nếu chỉ cần làm UI hoặc test nội bộ không cần auth thật:

- có thể để trống `CLERK_SECRET_KEY`
- có thể để trống `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

Khi đó trang auth sẽ hiện trạng thái chưa cấu hình Clerk.

Nếu muốn đăng nhập thật bằng Clerk, mỗi người clone repo cần:

1. tạo hoặc dùng một Clerk application
2. điền đúng:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. thêm đúng các URL vào Clerk dashboard

Tối thiểu cần thêm:

- `http://localhost:3000`

Nếu test LAN, cần thêm cả:

- `http://<LAN_IP>:3000`

Ví dụ:

- `http://192.168.53.101:3000`

Lưu ý rất quan trọng:

- không dùng `.env` của một người để commit lên GitHub
- không hard-code IP của một máy vào repo
- mỗi máy chỉ cần sửa `.env`, không phải sửa code

## 11. Những việc nên làm tiếp

Đây là danh sách ưu tiên để đưa hệ thống từ mức “khung tốt” lên mức “đạt đúng trọng tâm đề tài”.

## 11.1. Ưu tiên cao nhất

- làm drag-and-drop thật cho task board
- lưu `position` khi kéo-thả
- nối client với Socket.IO ở các màn hình chính
- làm presence thật
- làm realtime update cho task board
- nối Tiptap với Yjs để thành collaborative editor thật

## 11.2. Ưu tiên tiếp theo

- hoàn thiện comment cho task/document
- hoàn thiện invitation flow
- thêm quản lý thành viên workspace
- thêm notification
- hoàn thiện role-based permission ở UI

## 11.3. Ưu tiên bổ sung

- attachment
- search
- filter task
- dashboard thống kê đẹp hơn
- version history cho document

## 12. Gợi ý phân công cho nhóm

### Nhóm 1: Database và API

Làm:

- API members
- API invitations
- API comments
- API notifications
- API attachments
- API chat
- API task history và document version

### Nhóm 2: Task board

Làm:

- drag-and-drop bằng `dnd-kit`
- cập nhật `status`
- cập nhật `position`
- tối ưu giao diện board

### Nhóm 3: Realtime

Làm:

- kết nối client tới socket server
- presence online
- task update realtime
- activity realtime

### Nhóm 4: Editor

Làm:

- Tiptap + Yjs
- realtime collaborative editing
- cursor presence
- lưu/phục hồi `yjsState`

### Nhóm 5: Auth và phân quyền

Làm:

- hoàn thiện Clerk flow
- role UI
- khóa/mở tính năng theo quyền
- hoàn thiện sign-in/sign-up experience

## 13. Kết luận

Dự án hiện tại đã có một bộ khung khá tốt và khá thật cho một hệ thống quản lý công việc:

- có database schema rõ ràng
- có backend API cơ bản
- có giao diện nhiều màn hình chính
- có editor
- có task board
- có auth
- có nền tảng realtime

Tuy nhiên, để đúng với trọng tâm của đề tài, 3 phần cần hoàn thiện mạnh nhất vẫn là:

- kéo-thả task thật
- realtime thật
- collaborative editing thật

Nếu hoàn thiện tốt 3 phần này, hệ thống sẽ vừa đúng yêu cầu đề tài, vừa có điểm nhấn kỹ thuật rõ ràng.
