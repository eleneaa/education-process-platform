# Интересные реализации кода

## 1. Одобрение заявки с автоматическим зачислением (Backend)

```python
# backend/app/api/routes/admission_requests.py
@router.post("/{admission_request_id}/approve")
def approve_admission_request(
    admission_request_id: UUID,
    body: ApprovalRequest,
    session: SessionDep,
    current_user: CurrentUser,
) -> AdmissionRequest:
    """Approve request and auto-enroll student in selected group."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can approve")
    
    req = crud_admission_request.get_admission_request_by_id(session, admission_request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check if user exists, create if not
    user = session.exec(select(User).where(User.email == req.email)).first()
    if not user:
        user = crud_user.create_user(
            session=session,
            user_create=UserCreate(
                email=req.email,
                password=generate_password(12),
                full_name=req.full_name,
                role=UserRole.STUDENT,
                is_active=True,
            ),
        )
    
    # Enroll in group
    enrollment = Enrollment(
        user_id=user.id,
        group_id=body.group_id,
        status=EnrollmentStatus.ACTIVE,
    )
    session.add(enrollment)
    
    # Update request status
    req.status = AdmissionRequestStatus.APPROVED
    session.add(req)
    session.commit()
    
    return req
```

## 2. Динамическая RBAC (Role-Based Access Control)

```python
# backend/app/api/deps.py
async def get_current_user(
    security_scopes: SecurityScopes,
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Session = Depends(get_session),
) -> User:
    """Validate JWT and return current user."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id: str = payload.get("sub")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user = session.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=403, detail="User not found or inactive")
    
    return user

# CurrentTeacherOrAdmin автоматически проверяет что это учитель или админ
CurrentTeacherOrAdmin: Annotated[User, Depends(check_teacher_or_admin)]
```

## 3. Kanban доска с drag-and-drop (Frontend)

```typescript
// frontend/src/routes/_layout/admission-requests.tsx
function KanbanColumn({ status, requests, onStatusChange, isLoading }) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData("requestId")
    if (draggedId) {
      onStatusChange(draggedId, status) // отправить на backend
    }
  }

  return (
    <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      {requests.map(req => (
        <Card
          key={req.id}
          draggable
          onDragStart={e => e.dataTransfer.setData("requestId", req.id)}
        >
          {/* Карточка заявки */}
        </Card>
      ))}
    </div>
  )
}
```

## 4. Approval Dialog с выбором группы (Frontend)

```typescript
// frontend/src/routes/_layout/admission-requests.tsx
function ApprovalDialog({ request, onApprove, groups }) {
  const [selectedGroupId, setSelectedGroupId] = useState("")

  return (
    <Dialog>
      <DialogContent>
        <h2>Одобрить заявку — {request?.full_name}</h2>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите группу..." />
          </SelectTrigger>
          <SelectContent>
            {groups.map(g => (
              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => onApprove(selectedGroupId)}
          disabled={!selectedGroupId}
        >
          Одобрить и зачислить
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

## 5. Автоматическое сидирование БД при старте (Backend)

```python
# backend/app/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database with seed data...")
    init()  # Создает админа и заполняет тестовые данные
    logger.info("Database initialized")
    
    if settings.telegram_enabled:
        await setup_webhook(webhook_url)
    
    yield
    
    # Shutdown
    if settings.telegram_enabled:
        await teardown_webhook()

app = FastAPI(lifespan=lifespan)
```

## 6. Статистика дашборда в реальном времени (Frontend)

```typescript
// frontend/src/routes/_layout/index.tsx
function KPISection() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  })

  return (
    <div className="kpi-grid">
      <KPICard
        label="СТУДЕНТЫ"
        value={stats?.active_students || 0}
        footer="активных зачисления"
      />
      <KPICard
        label="ПРОГРАММЫ"
        value={stats?.active_programs || 0}
        footer="всего программ"
      />
      <KPICard
        label="ГРУППЫ"
        value={stats?.total_groups || 0}
        footer="в системе"
      />
      <KPICard
        label="ЗАЯВКИ"
        value={stats?.pending_admissions || 0}
        footer="ожидают одобрения"
      />
    </div>
  )
}
```

## 7. Inline валидация форм (Frontend)

```typescript
// frontend/src/routes/login.tsx
const validateForm = () => {
  const newErrors: Record<string, string> = {}
  if (!fullName.trim()) newErrors.fullName = "ФИО обязательно"
  if (!phone.trim()) newErrors.phone = "Телефон обязателен"
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    newErrors.email = "Некорректный email"
  }
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

// В форме:
<Input
  value={fullName}
  onChange={(e) => {
    setFullName(e.target.value)
    if (errors.fullName) setErrors({ ...errors, fullName: "" })
  }}
  className={`mt-1 ${errors.fullName ? "border-red-500" : ""}`}
/>
{errors.fullName && <p className="text-red-500 text-xs">{errors.fullName}</p>}
```

## 8. Загрузочные скелеты (Frontend)

```typescript
// Во время загрузки данных показываем плейсхолдеры
{isLoading ? (
  <div className="space-y-2 p-6">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-12 bg-mute/10 rounded animate-pulse" />
    ))}
  </div>
) : (
  // Реальные данные
)}
```

## 9. Перехват ошибок и Toast уведомления (Frontend)

```typescript
const mutation = useMutation({
  mutationFn: approveAdmissionRequest,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admission-requests"] })
    showSuccessToast("Заявка одобрена и студент зачислен в группу")
  },
  onError: () => {
    showErrorToast("Ошибка при одобрении заявки")
  },
})
```

## 10. Полная типизация API (Frontend + Backend)

```typescript
// frontend/src/client/custom-types.ts
export interface AdmissionRequest {
  id: string
  full_name: string
  email: string | null
  phone_number: string
  program_interest: string | null
  status: "new" | "in_review" | "approved" | "user_created" | "rejected"
  source: "website" | "email" | "phone" | "telegram" | "offline"
  created_at: string
}

export interface AdmissionRequestsResponse {
  data: AdmissionRequest[]
  count: number
}
```

```python
# backend/app/models/admission_request.py
class AdmissionRequest(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    full_name: str
    email: str | None = None
    phone_number: str
    program_interest: str | None = None
    status: AdmissionRequestStatus = AdmissionRequestStatus.NEW
    source: AdmissionRequestSource = AdmissionRequestSource.WEBSITE
    created_at: datetime = Field(default_factory=get_datetime_utc)
```
