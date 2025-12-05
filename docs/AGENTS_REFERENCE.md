# Agent 참조 가이드 (내장 Subagent 중심)

**목적**: Claude Code 내장 subagent 37개 활용법 및 병렬 실행 전략

**버전**: 2.0.0 | **업데이트**: 2025-12-05

---

## 내장 Subagent 전체 목록 (37개)

Task tool의 `subagent_type`으로 호출.

### 1. 유틸리티 (5개) - 내장 전용

| Agent | 용도 | 사용 시점 |
|-------|------|-----------|
| `general-purpose` | 복잡한 질문 조사, 멀티스텝 태스크 | 복합 조사 |
| `Explore` | 코드베이스 빠른 탐색 (파일 패턴, 키워드) | 파일/코드 검색 |
| `Plan` | 구현 계획 설계, 아키텍처 트레이드오프 | 복잡한 기능 시작 전 |
| `claude-code-guide` | Claude Code/Agent SDK 문서 조회 | 사용법 질문 |
| `statusline-setup` | 상태줄 설정 | 시스템 설정 |

### 2. 핵심 개발 (7개)

| Agent | 용도 | 병렬 | Phase |
|-------|------|------|-------|
| `frontend-developer` | React/Next.js, 반응형, 접근성 | ✅ | 1 |
| `backend-architect` | RESTful API, 마이크로서비스, DB 스키마 | ✅ | 1 |
| `fullstack-developer` | 프론트+백엔드+DB 풀스택 | ⚠️ | 1 |
| `typescript-expert` | TypeScript 타입 시스템, 제네릭 | ✅ | 1 |
| `mobile-developer` | React Native/Flutter 모바일 | ✅ | 1 |
| `graphql-architect` | GraphQL 스키마, 리졸버, Federation | ✅ | 1 |
| `supabase-engineer` | Supabase DB/RLS/Auth 설계 | ✅ | 1 |

### 3. 품질 보증 (5개)

| Agent | 용도 | 병렬 | Phase |
|-------|------|------|-------|
| `test-automator` | 단위/통합/E2E 테스트 작성 | ✅ | 2 |
| `playwright-engineer` | Playwright MCP E2E 테스트 | ✅ | 2, 5 |
| `security-auditor` | OWASP 보안 취약점 분석 | ✅ | 5 |
| `code-reviewer` | 코드 품질, 보안, 유지보수성 리뷰 | ✅ | 2.5 |
| `performance-engineer` | 성능 분석, 병목 식별, 캐싱 | ✅ | 5 |

### 4. 인프라/DevOps (4개)

| Agent | 용도 | 병렬 | Phase |
|-------|------|------|-------|
| `deployment-engineer` | CI/CD, Docker, K8s 설정 | ❌ | 6 |
| `devops-troubleshooter` | 프로덕션 이슈 진단, 로그 분석 | ❌ | 5 |
| `cloud-architect` | AWS/Azure/GCP 클라우드 설계 | ✅ | 0, 1 |
| `github-engineer` | GitHub 작업, 레포 관리, Actions | ✅ | 4 |

### 5. 데이터 (4개)

| Agent | 용도 | 병렬 | Phase |
|-------|------|------|-------|
| `database-architect` | DB 설계, 데이터 모델링, 스케일링 | ✅ | 1 |
| `database-optimizer` | SQL 쿼리 최적화, 인덱스, 마이그레이션 | ✅ | 1, 5 |
| `data-engineer` | ETL 파이프라인, 데이터 웨어하우스 | ✅ | 1 |
| `data-scientist` | SQL/BigQuery, 통계 분석, 시각화 | ✅ | 분석 |

### 6. AI/ML (3개)

| Agent | 용도 | 병렬 | Phase |
|-------|------|------|-------|
| `ai-engineer` | LLM/RAG 시스템, 프롬프트 파이프라인 | ✅ | 1 |
| `ml-engineer` | ML 파이프라인, 모델 배포, 피처 엔지니어링 | ✅ | 1 |
| `prompt-engineer` | LLM 프롬프트 최적화 | ✅ | 분석 |

### 7. 분석/계획 (8개)

| Agent | 용도 | 병렬 | Phase |
|-------|------|------|-------|
| `seq-engineer` | sequentialthinking MCP 순차적 분석 | ✅ | 0 |
| `context7-engineer` | context-7 MCP 외부 기술 최신 문서 검증 | ✅ | 0, 1 |
| `debugger` | 에러, 테스트 실패, 스택 트레이스 분석 | ❌ | 버그 |
| `taskmanager-planner` | taskmanager MCP 작업 분해 | ✅ | 0.5 |
| `task-decomposition-expert` | 복잡한 목표 분해, 워크플로우 설계 | ✅ | 0.5 |
| `architect-reviewer` | 아키텍처 일관성, SOLID 원칙 리뷰 | ✅ | 0, 1 |
| `exa-search-specialist` | Exasearch MCP 고급 웹 검색 | ✅ | 0 |
| `context-manager` | 멀티에이전트 워크플로우, 컨텍스트 관리 | ✅ | 전체 |

### 8. 디자인 (1개)

| Agent | 용도 | 병렬 | Phase |
|-------|------|------|-------|
| `ui-ux-designer` | UI/UX 디자인, 와이어프레임, 접근성 | ✅ | 0, 1 |

**범례**:
- ✅ 병렬 가능
- ❌ 순차 필수
- ⚠️ 조건부

---

## 로컬 전용 에이전트 (1개)

내장 subagent에 없어 `.claude/agents/`에서 유지:

| Agent | 용도 | 파일 |
|-------|------|------|
| `python-pro` | Python 고급 구현 (decorators, async, metaclass) | `python-pro.md` |

> **주의**: `python-pro`는 Task tool로 직접 호출 불가. 프롬프트 참조용.

---

## Phase별 필수 에이전트

| Phase | 필수 | 선택 |
|-------|------|------|
| 0 (PRD) | `Plan`, `context7-engineer` | `seq-engineer`, `Explore`, `exa-search-specialist` |
| 0.5 (Task) | `task-decomposition-expert` | `taskmanager-planner` |
| 1 (구현) | `debugger`(버그), `context7-engineer` | 개발 에이전트 선택 |
| 2 (테스트) | `test-automator` | `playwright-engineer` |
| 2.5 (리뷰) | `code-reviewer` | `security-auditor`, `architect-reviewer` |
| 5 (E2E) | `playwright-engineer`, `security-auditor` | `performance-engineer` |
| 6 (배포) | `deployment-engineer` | `cloud-architect` |

---

## 병렬 실행 패턴

### 패턴 1: Phase 0 병렬 분석
```
Plan (계획 설계)
  ∥
context7-engineer (기술 스택 검증)
  ∥
seq-engineer (순차적 분석)
  ∥
exa-search-specialist (기술 조사)
```

### 패턴 2: Phase 1 병렬 구현
```
frontend-developer (UI)
  ∥
backend-architect (API)
  ∥
database-architect (DB)
```

### 패턴 3: Phase 2/5 병렬 테스트
```
test-automator (단위 테스트)
  ∥
playwright-engineer (E2E)
  ∥
security-auditor (보안 스캔)
  ∥
performance-engineer (성능)
```

---

## 시나리오별 Agent 조합

### 새 기능 개발 (풀스택)

```
Phase 0: Plan + context7-engineer + architect-reviewer (병렬)
    ↓
Phase 1: frontend-developer ∥ backend-architect ∥ database-architect
    ↓
Phase 2: test-automator ∥ playwright-engineer
    ↓
Phase 2.5: code-reviewer → security-auditor
    ↓
Phase 5: playwright-engineer ∥ security-auditor ∥ performance-engineer
```

### 버그 수정

```
Phase 0: debugger → context7-engineer (순차)
    ↓
Phase 1: 해당 개발 에이전트 (단일)
    ↓
Phase 2: test-automator ∥ playwright-engineer (병렬)
```

### 성능 최적화

```
Phase 0: seq-engineer ∥ performance-engineer ∥ database-optimizer (병렬)
    ↓
Phase 1: performance-engineer ∥ database-optimizer
    ↓
Phase 2: test-automator ∥ playwright-engineer
```

---

## Agent 선택 가이드

### 기술별

| 기술 | 추천 Agent |
|------|-----------|
| Python | 로컬 `python-pro` 참조 |
| TypeScript | `typescript-expert` |
| React/Next.js | `frontend-developer` |
| Node.js API | `backend-architect` |
| React Native/Flutter | `mobile-developer` |
| GraphQL | `graphql-architect` |
| Supabase | `supabase-engineer` |
| AWS/GCP/Azure | `cloud-architect` |

### 작업별

| 작업 | 추천 Agent |
|------|-----------|
| 코드베이스 탐색 | `Explore` |
| 계획 수립 | `Plan` |
| 기술 검증 | `context7-engineer` (필수) |
| API 설계 | `backend-architect` |
| DB 설계 | `database-architect` |
| 테스트 | `test-automator` + `playwright-engineer` |
| 보안 | `security-auditor` |
| 성능 | `performance-engineer` |
| 배포 | `deployment-engineer` |
| 디버깅 | `debugger` |

---

## 참조

- [CLAUDE.md](../CLAUDE.md) - 핵심 워크플로우
- [PHASE_AGENT_MAPPING.md](PHASE_AGENT_MAPPING.md) - Phase별 상세 매핑

---

**버전**: 2.0.0
**업데이트**: 2025-12-05
