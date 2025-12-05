# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version**: 3.1.0 | **Updated**: 2025-12-05 | **Context**: Windows 10/11, PowerShell, Root: `D:\AI\claude01`

## 1. Critical Rules

1. **Language**: 한글 출력. 기술 용어(code, GitHub)는 영어.
2. **Path**: 절대 경로만 사용. `D:\AI\claude01\...`
3. **Validation**: Phase 검증 필수. 실패 시 STOP.
4. **TDD**: Red → Green → Refactor. 테스트 없이 구현 완료 불가.
5. **Git**: 코드 수정은 브랜치 → PR 필수. main 직접 커밋 금지.

---

## 2. Workflow

### 요청 분류

| 요청 유형 | 자동 실행 |
|-----------|-----------|
| 신규 기능 / 리팩토링 | PRE_WORK → IMPL → FINAL_CHECK |
| 버그 수정 | PRE_WORK(light) → IMPL → FINAL_CHECK |
| 문서 수정 | 이슈 → 직접 커밋 |
| 단순 질문 | 직접 응답 |

### PRE_WORK
1. 오픈소스 검색 (MIT/Apache/BSD, Stars>500)
2. 중복 확인 (`gh issue/pr list`)
3. Make vs Buy 분석 → 사용자 승인

### IMPL
1. GitHub 이슈/브랜치 생성: `<type>/issue-<num>-<desc>`
2. TDD 구현
3. 커밋: `fix(scope): Resolve #123 🐛` / `feat(scope): Add feature ✨`

### FINAL_CHECK
E2E 테스트 → Phase 3~5 자동 진행 → Phase 6(배포)은 사용자 확인

> 상세: `docs/WORKFLOW_REFERENCE.md`

---

## 3. Phase Pipeline

| Phase | 핵심 | Validator |
|-------|------|-----------|
| 0 | PRD 생성 | `validate-phase-0.ps1` |
| 0.5 | Task 분해 | `validate-phase-0.5.ps1` |
| 1 | 구현 + 테스트 | `validate-phase-1.ps1` |
| 2 | 테스트 통과 | `validate-phase-2.ps1` |
| 2.5 | 코드 리뷰 | `/parallel-review` |
| 3 | 버전 결정 | Conventional Commits |
| 4 | PR 생성 | `validate-phase-4.ps1` |
| 5 | E2E + Security | `validate-phase-5.ps1` |
| 6 | 배포 | 사용자 확인 필수 |

**자동 진행 중지**: MAJOR 버전, Critical 보안 취약점, 배포, 3회 실패

### 실패 시 디버깅 전략

해결 실패 시 **반드시** `docs/DEBUGGING_STRATEGY.md` 참조:

```
실패 → Phase 0: 디버그 로그 추가 → 로그 분석 → 예측 검증
         ↓
       Phase 1: 신규 기능 vs 기존 로직 판단
         ↓
       ┌─────────────┬─────────────┐
       │ 신규 기능   │ 기존 로직   │
       │ → PRD 검토  │ → 예측 검증 │
       │ → 리팩토링? │ → 가설 실험 │
       └─────────────┴─────────────┘
         ↓
       3회 실패 → /issue-failed → 수동 개입
```

**핵심 원칙**:
1. **로그 없이 수정 금지**: 추측 기반 수정은 새 버그 유발
2. **문제 파악 > 해결**: 문제를 정확히 알면 해결은 쉬움
3. **예측 검증 필수**: "내 예측이 로그로 확인되었는가?"

---

## 4. Agents (내장 Subagent 중심)

Claude Code **내장 subagent 37개**를 활용. Task tool의 `subagent_type`으로 호출.

### Phase별 필수 에이전트

| Phase | 필수 | 선택 |
|-------|------|------|
| 0 (PRD) | `Plan`, `context7-engineer` | `seq-engineer`, `Explore` |
| 0.5 (Task) | `task-decomposition-expert` | `taskmanager-planner` |
| 1 (구현) | `debugger`(버그), `context7-engineer` | `backend-architect`, `frontend-developer`, `fullstack-developer` |
| 2 (테스트) | `test-automator` | `playwright-engineer` |
| 2.5 (리뷰) | `code-reviewer` | `security-auditor`, `architect-reviewer` |
| 5 (E2E) | `playwright-engineer`, `security-auditor` | `performance-engineer` |
| 6 (배포) | `deployment-engineer` | `cloud-architect` |

### 유틸리티 에이전트

| 에이전트 | 용도 | 사용 시점 |
|----------|------|-----------|
| `Explore` | 코드베이스 빠른 탐색 | 파일/키워드 검색 |
| `Plan` | 구현 계획 설계 | 복잡한 기능 시작 전 |
| `general-purpose` | 범용 멀티스텝 태스크 | 복합 조사 |
| `claude-code-guide` | Claude Code 문서 조회 | 사용법 질문 |

### 전문 분야 에이전트

| 분야 | 에이전트 |
|------|----------|
| **개발** | `backend-architect`, `frontend-developer`, `fullstack-developer`, `mobile-developer`, `typescript-expert`, `graphql-architect` |
| **데이터** | `database-architect`, `database-optimizer`, `data-engineer`, `data-scientist` |
| **AI/ML** | `ai-engineer`, `ml-engineer`, `prompt-engineer` |
| **인프라** | `cloud-architect`, `deployment-engineer`, `devops-troubleshooter`, `supabase-engineer` |
| **품질** | `code-reviewer`, `security-auditor`, `performance-engineer`, `test-automator`, `playwright-engineer` |
| **분석** | `seq-engineer`, `context7-engineer`, `exa-search-specialist`, `debugger` |

### Agent-Workflow 연결

```
사용자 요청
    ↓
┌─────────────────────────────────────────────────────┐
│ Workflow (PRE_WORK → IMPL → FINAL_CHECK)            │
│     │           │            │                      │
│     ↓           ↓            ↓                      │
│ ┌───────┐  ┌────────┐  ┌───────────┐               │
│ │Explore│  │개발    │  │playwright │               │
│ │context│  │에이전트│  │security   │               │
│ └───────┘  └────────┘  └───────────┘               │
└─────────────────────────────────────────────────────┘
```

| Workflow 단계 | 호출 Agent | 역할 |
|---------------|------------|------|
| PRE_WORK | `Explore`, `context7-engineer`, `exa-search-specialist` | 코드 탐색, 기술 검증, 오픈소스 검색 |
| IMPL | `debugger`, `backend-architect`, `frontend-developer`, `test-automator` | 원인 분석, 구현, 테스트 |
| FINAL_CHECK | `playwright-engineer`, `security-auditor`, `code-reviewer` | E2E, 보안, 리뷰 |

### 슬래시 커맨드 → Agent 매핑

| 커맨드 | 호출 Agent (병렬) |
|--------|-------------------|
| `/parallel-dev` | `architect` + `coder` + `tester` + `docs` |
| `/parallel-test` | `unit` + `integration` + `e2e` + `security` |
| `/parallel-review` | `code-reviewer` + `security-auditor` + `architect-reviewer` |
| `/fix-issue` | `debugger` → 개발 에이전트 (순차) |

### 병렬 호출 예시

```python
# 단일 메시지에 여러 Task 호출 = 병렬 실행
Task(subagent_type="frontend-developer", prompt="UI 구현", description="프론트")
Task(subagent_type="backend-architect", prompt="API 구현", description="백엔드")
Task(subagent_type="test-automator", prompt="테스트 작성", description="테스트")
```

> 상세: `docs/AGENTS_REFERENCE.md`

---

## 5. Architecture

```
D:\AI\claude01\
├── .claude/
│   ├── commands/      # 슬래시 커맨드 (28개)
│   ├── skills/        # skill-creator, webapp-testing
│   └── hooks/         # 프롬프트 검증
├── src/agents/        # LangGraph 멀티에이전트
│   ├── parallel_workflow.py  # Fan-Out/Fan-In (Supervisor → Subagents)
│   ├── dev_workflow.py       # Architect/Coder/Tester/Docs
│   ├── test_workflow.py      # Unit/Integration/E2E/Security
│   └── config.py             # Model Tiering (sonnet/haiku)
├── scripts/           # Phase Validators (PowerShell)
├── tasks/prds/        # PRD 문서
├── tests/             # pytest 테스트
└── archive-analyzer/  # 서브프로젝트 (별도 CLAUDE.md)
```

---

## 6. Commands (핵심)

| 커맨드 | 용도 |
|--------|------|
| `/autopilot` | 자율 운영 - 이슈 자동 처리 (토큰 한도까지) |
| `/fix-issue` | GitHub 이슈 분석 및 수정 |
| `/commit` | Conventional Commit 생성 |
| `/create-pr` | PR 생성 |
| `/parallel-dev` | 병렬 개발 에이전트 |
| `/tdd` | TDD 가이드 |
| `/check` | 코드 품질 검사 |
| `/issue-failed` | 실패 분석 + 새 솔루션 제안 |

> 전체 목록: `.claude/commands/`

---

## 7. Build & Test

```powershell
# 테스트
pytest tests/ -v
pytest tests/ -v -m unit                    # 단위 테스트
pytest tests/test_parallel_workflow.py -v   # 단일 파일
pytest tests/test_file.py::test_func -v     # 단일 함수
pytest tests/ -v --cov=src --cov-report=term  # 커버리지

# 에이전트 실행
python src/agents/parallel_workflow.py "프로젝트 분석"
python src/agents/dev_workflow.py "새 기능 구현"

# Phase 상태
.\scripts\phase-status.ps1
```

### archive-analyzer (서브프로젝트)

```powershell
cd D:\AI\claude01\archive-analyzer
pip install -e ".[dev,media,search]"
pytest tests/ -v
ruff check src/ && black --check src/ && mypy src/archive_analyzer/
uvicorn src.archive_analyzer.api:app --reload --port 8000
```

> 상세: `D:\AI\claude01\archive-analyzer\CLAUDE.md`

---

## 8. Environment

| 변수 | 용도 |
|------|------|
| `ANTHROPIC_API_KEY` | Claude API |
| `GITHUB_TOKEN` | GitHub CLI |
| `SMB_SERVER` / `SMB_USERNAME` / `SMB_PASSWORD` | NAS 접속 |
| `MEILISEARCH_URL` | 검색 서버 |

---

## 9. Do Not

- ❌ Phase validator 없이 다음 Phase 진행
- ❌ 상대 경로 사용 (`./`, `../`)
- ❌ PR 없이 main 직접 커밋
- ❌ 테스트 없이 구현 완료
- ❌ `pokervod.db` 스키마 무단 변경 (`qwen_hand_analysis` 소유)
