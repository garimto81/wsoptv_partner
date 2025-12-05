# Debugging Strategy Guide

문제 해결 실패 시 체계적인 디버깅 전략 가이드입니다.

---

## Phase 0: 문제 추론 검증 (Debug Logging)

### 0.1 디버그 로그 대량 추가

문제가 발생한 영역에 **추측하지 말고 로그로 확인**:

```python
# Python 예시
import logging
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                    filename='debug_output.log')

logger = logging.getLogger(__name__)

def problematic_function(data):
    logger.debug(f"[ENTRY] data type: {type(data)}, value: {data}")
    logger.debug(f"[STATE] current_state: {self.state}")

    result = process(data)
    logger.debug(f"[RESULT] result type: {type(result)}, value: {result}")

    return result
```

```typescript
// TypeScript 예시
const DEBUG = true;
const debugLog = (tag: string, msg: string, data?: any) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp} [${tag}] ${msg} ${data ? JSON.stringify(data) : ''}`;
    console.log(logLine);
    fs.appendFileSync('debug_output.log', logLine + '\n');
  }
};

function problematicFunction(input: unknown) {
  debugLog('ENTRY', 'input received', { type: typeof input, value: input });
  debugLog('STATE', 'current state', this.state);

  const result = process(input);
  debugLog('RESULT', 'output', { type: typeof result, value: result });

  return result;
}
```

### 0.2 로그 파일 분석

```powershell
# 로그 파일 저장 위치
D:\AI\claude01\logs\debug_<issue-number>_<timestamp>.log

# 로그 분석 명령어
Get-Content debug_output.log | Select-String "ERROR|WARN|ENTRY|RESULT"
```

**분석 체크리스트**:
- [ ] 예상한 입력값이 실제로 들어오는가?
- [ ] 중간 상태가 예상과 일치하는가?
- [ ] 출력값이 예상과 다른 지점은 어디인가?
- [ ] **내 문제 추론이 로그로 검증되었는가?**

> **핵심**: 로그 분석 후 "내 예측이 맞았는가?" 판단. 틀렸으면 Phase 0 재시작.

---

## Phase 1: 문제 영역 분류

### 1.1 신규 기능 vs 기존 로직 판단

```
문제 발생 코드 확인
    ↓
┌─────────────────────────────────────────┐
│ Q: 이 코드는 언제 작성되었는가?         │
│                                         │
│ A) 이번 작업에서 새로 작성 → Phase 2    │
│ B) 기존에 있던 로직       → Phase 3    │
└─────────────────────────────────────────┘
```

**판단 기준**:
| 구분 | 신규 기능 | 기존 로직 |
|------|-----------|-----------|
| Git blame | 최근 커밋 (이번 브랜치) | 이전 커밋 |
| 테스트 | 테스트 없거나 새로 작성 | 기존 테스트 존재 |
| 문서 | PRD에 명시됨 | PRD에 없음 |

```bash
# Git blame으로 확인
git blame <file_path> | grep "<line_number>"
```

---

## Phase 2: 신규 기능 문제 (PRD 기반 접근)

### 2.1 PRD 업데이트

신규 기능에서 문제 발생 시, **PRD가 불완전할 가능성** 높음:

```markdown
## PRD 검토 항목

- [ ] 요구사항이 모호한 부분 있는가?
- [ ] Edge case가 정의되어 있는가?
- [ ] 에러 처리 방식이 명시되어 있는가?
- [ ] 다른 기능과의 상호작용이 정의되어 있는가?
```

**PRD 업데이트 후**:
1. `tasks/prds/NNNN-*.md` 수정
2. Phase 0.5 재실행 (Task 분해)
3. 영향받는 테스트 업데이트

### 2.2 전체 리팩토링 판단

다음 조건 중 **2개 이상** 해당 시 전체 리팩토링 고려:

| 조건 | 체크 |
|------|------|
| 동일 버그 3회 이상 반복 | [ ] |
| 수정 시 다른 곳에서 문제 발생 (Side effect) | [ ] |
| 테스트 커버리지 < 50% | [ ] |
| 코드 복잡도(Cyclomatic) > 15 | [ ] |
| "이해하기 어렵다"는 느낌 | [ ] |

### 2.3 전체 리팩토링 진행

```bash
# 리팩토링 전용 브랜치 생성
git checkout -b refactor/issue-<num>-<desc>

# 리팩토링 완료 후 PR 생성
gh pr create --title "refactor: <description>" --body "Resolves #<num>"
```

**리팩토링 원칙**:
1. **기존 테스트 먼저 보강** (Green 상태 확보)
2. 작은 단위로 리팩토링 (각 단계마다 테스트 통과 확인)
3. 기능 변경 없이 구조만 개선

---

## Phase 3: 기존 로직 문제 (예측 정확도 집중)

### 3.1 문제 예측 검증 프로세스

> **핵심 원칙**: 해결보다 **문제 파악**에 집중. 문제를 정확히 알면 해결은 쉬움.

```
내 문제 예측 작성
    ↓
"나는 [X]가 원인이라고 생각한다"
    ↓
검증 방법 설계
    ↓
"만약 [X]가 원인이라면, [Y]를 하면 [Z] 결과가 나와야 한다"
    ↓
실험 실행
    ↓
┌─────────────────────────────────────────┐
│ 예측과 결과 비교                        │
│                                         │
│ 일치 → 문제 확정 → 해결 진행            │
│ 불일치 → 새로운 예측 수립 → 반복        │
└─────────────────────────────────────────┘
```

### 3.2 문제 예측 템플릿

```markdown
## 문제 예측 기록

### 예측 #1
**가설**: [문제의 원인이라고 생각하는 것]
**근거**: [왜 이렇게 생각하는지]
**검증 방법**: [어떻게 확인할 것인지]
**예상 결과**: [가설이 맞다면 어떤 결과가 나올지]

### 실험 결과
**실제 결과**: [실험 후 관찰된 결과]
**일치 여부**: ✅ 일치 / ❌ 불일치
**결론**: [가설 확정 / 새로운 가설 필요]
```

### 3.3 문제 파악 확인 체크리스트

해결 진행 전 **반드시** 확인:

- [ ] 문제를 한 문장으로 설명할 수 있는가?
- [ ] 문제를 **재현**할 수 있는가?
- [ ] 문제가 발생하는 **정확한 조건**을 아는가?
- [ ] 문제가 발생하지 **않는** 조건을 아는가?
- [ ] 로그/디버깅으로 예측이 **검증**되었는가?

> **모든 항목 체크 후에만** 해결 단계로 진행

---

## 실패 시 워크플로우 요약

```
해결 시도 실패
    ↓
Phase 0: 디버그 로그 추가 → 로그 분석 → 예측 검증
    ↓
Phase 1: 신규 기능인가? 기존 로직인가?
    ↓
┌─────────────┬─────────────┐
│ 신규 기능   │ 기존 로직   │
│ (Phase 2)   │ (Phase 3)   │
├─────────────┼─────────────┤
│ PRD 검토    │ 예측 검증   │
│ ↓           │ ↓           │
│ PRD 업데이트│ 가설 수립   │
│ ↓           │ ↓           │
│ 리팩토링?   │ 실험 실행   │
│ Y → 브랜치  │ ↓           │
│ N → 재구현  │ 예측=결과?  │
│             │ Y → 해결    │
│             │ N → 새 가설 │
└─────────────┴─────────────┘
    ↓
3회 실패 → `/issue-failed` → 수동 개입 요청
```

---

## 관련 커맨드

| 커맨드 | 용도 |
|--------|------|
| `/issue-failed` | 실패 분석 + 새 솔루션 제안 |
| `/analyze-logs` | 로그 파일 분석 |
| `/tdd` | TDD로 재접근 |
| `/parallel-review` | 코드 리뷰 요청 |

---

## Anti-Patterns (하지 말 것)

| 금지 | 이유 |
|------|------|
| ❌ 로그 없이 코드 수정 | 추측 기반 수정은 새 버그 유발 |
| ❌ 문제 파악 전 해결 시도 | 시간 낭비, 잘못된 방향 |
| ❌ 여러 곳 동시 수정 | 원인 파악 불가능해짐 |
| ❌ "아마 이거겠지" 접근 | 반드시 로그로 검증 |
| ❌ 기존 테스트 무시 | 리그레션 발생 |
