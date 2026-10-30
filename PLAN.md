# 개발 계획

## 0. 초기 구성

- [x] 별도 Git 리포와 TypeScript 도구 구성
- [x] README, AGPL-3.0-only LICENSE와 고지
- [x] 로컬 SDK 연결 도구와 배포 SDK 출처 기록
- [x] 메타데이터 검사 CI와 GitHub draft release 워크플로
- [x] 사용자 후속 요청에 따라 TypeScript 호스트 구현 및 b2 설치
- [x] Linux 실제 Obsidian 편집·계산·저장·재열기·PDF·충돌 복구 확인
- [x] 사용자 실사용 확인. 상세 범위는 docs/VERIFICATION.md 참고

## 1. SDK 배포 기준 확정

- [x] 현재는 sdk.lock.json의 고정 원본 커밋을 로컬/CI에서 빌드하고 WASM SHA-256을 대조한다.
- [ ] 추후 Mathfolio SDK를 GitHub Release tarball 의존성으로 전환할 수 있다. 0.1.0은 고정 원본 소스 빌드로 배포한다.
- 생성 패키지명 `@mathfolio/wasm-sdk`, 버전, 프로토콜, 원본 커밋을 확인한다.
- 플러그인의 package.json에 해당 릴리스 tarball URL을 의존성으로 추가한다. latest, 브랜치 HEAD, 개발자 절대 경로는 배포 의존성으로 사용하지 않는다.
- package-lock.json 및 sdk.lock.json에 실제 URL·태그·커밋·SHA-256을 고정한다. CI에서 다운로드 파일의 SHA-256을 검사한다.
- JS glue·WASM·Worker·글꼴이 모두 같은 SDK 버전인지 확인한다. 라이선스 원문과 NOTICE를 배포에 보존한다.

## 2. 최소 호스트 연결 — 구현, Linux 확인

- TypeScript `src/main.ts`에 Obsidian Plugin 진입점과 전용 파일 뷰를 작성한다.
- SDK Canvas mount와 탭별 세션을 연결한다. 탭 숨김에는 setActive(false), 닫힘에는 구독 해제와 dispose를 호출한다.
- 지원 문서 확장자는 원본 포맷과 Obsidian 파일 처리 계약을 확인한 뒤 확정한다.
- 문서 모델·계산·수식 입력은 Rust SDK를 그대로 사용한다.

## 3. 저장과 사용자 데이터 — 구현, 주요 경로 확인

- Vault API로 바이너리 문서를 열고 저장한다. 저장 직전에 외부 변경을 검사한다.
- prepareSave → 실제 Vault 쓰기 성공 → acknowledgeSave 순서를 지킨다.
- 저장 실패, 저장 중 재편집, 외부 변경 충돌, dirty 문서 교체, 이름 변경·삭제, 종료 시 미저장 처리와 복구 정책을 검증한다.
- 문서를 열거나 저장 결과를 표시하는 동작이 계산을 자동 실행하지 않도록 한다.

## 4. 자산·입력·테마 — 내장 번들 및 테마 구현

- [x] 표준 설치 파일만으로 SDK 자산을 공급한다. WASM·Worker·한글 글꼴·고지를 main.js에 내장했다.
- [x] 계산 Worker의 glue를 번들링하고 main.js에 내장한 동일 WASM의 Blob URL로 초기화한다.
- Obsidian 실제 CSP·Worker·WebGL·리소스 URI에서 동작을 검증한다. CDN·로컬 서버·native helper를 실행 의존성으로 두지 않는다.
- [x] 호스트 테마 CSS 변수를 정수 RGBA로 변환하고 변경을 반영한다.
- 한글 물리 IME, 클립보드, 포커스, F5/Ctrl+F5 등 호스트 단축키 충돌을 실제 앱에서 확인한다.

## 5. 배포 전 검증

- Windows와 Linux의 깨끗한 Vault에서 릴리스 첨부 파일만으로 설치한다.
- 열기·편집·저장·재시작·다중 탭·계산 취소·PDF 내보내기와 자원 해제를 검증한다.
- 오프라인에서 WASM·Worker·필요 글꼴이 모두 로드되는지 확인한다.
- minAppVersion은 현재 설정한 1.14.4를 시작점으로 실제 검증 후 확정한다. Mobile은 별도 검증 전까지 지원을 주장하지 않는다.
- 번들 내 SDK/제3자 라이선스 고지 보존과 원본 소스 접근 경로를 확인한다.
- 0.1.0은 Linux 검증과 사용자 실사용 확인을 근거로 사용자의 명시적 공개 요청에 따라 릴리스한다. Windows·물리 IME·강제 종료 복구는 남은 범위로 공개한다. 플래그 변경만으로 검증을 대신하지 않는다.

## 6. GitHub 릴리스와 커뮤니티 등록

- npm version으로 package.json, lockfile, manifest.json, versions.json을 동기화한다.
- 플러그인 버전과 SDK 버전은 별도로 관리한다.
- manifest와 정확히 같은 `x.y.z` 태그를 push한다. 옵시디언용 태그에는 v 접두어를 붙이지 않는다.
- Actions가 main.js·manifest.json·선택 styles.css 및 체크섬을 첨부한 draft release를 만든다.
- draft 첨부 파일을 내려받아 수동 설치 검증 후 공개한다.
- 이름·ID 중복과 최신 정책을 확인하고 Obsidian Community에서 최초 등록한다. 이 초기 구성 단계에서는 등록하거나 설치 가능하다고 표시하지 않는다.
