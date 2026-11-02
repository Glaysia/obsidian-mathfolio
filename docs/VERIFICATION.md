# 검증 기록 — 2026-10-30

이전 0.1.0 기록은 아래에 보존한다. 최신 개발 결과는 0.1.8 절을 따른다.

## 0.1.0 환경과 빌드

- Linux 데스크톱, Flatpak Obsidian 1.14.5, 실제 b2 Vault.
- 플러그인 개발 버전 0.1.0, TypeScript 7.0.2, Node.js 24.
- SDK 0.1.1 / protocol 1. 원본 커밋과 WASM 해시는 루트 sdk.lock.json에 기록했다.
- Rust 빌드 경로를 `/mathfolio`, `/cargo`로 매핑해 빌더별 절대 경로가 WASM 해시를 바꾸지 않도록 했다.
- 생성된 main.js는 약 20 MiB다. WASM, 계산 Worker, Nanum Gothic과 라이선스를 내장했다.
- npm run check, npm test(4개), npm run build 통과.
- 설치 전 플러그인 파일과 community-plugins.json 백업을 리포의 .local-backups에 보존했다.

## 실제 Obsidian에서 확인

- 플러그인 로드와 명령 등록, SDK Canvas 렌더링 및 한글 글꼴 표시.
- 원본 engineering-worksheet 예제를 열고 계산 Worker 실행: 힘 19.6133, 행렬식 5 확인.
- 새 워크시트 생성 모달과 Vault 파일 생성.
- Chromium DevTools 입력으로 빈 Canvas에 `2+3=` 작성, Rust 문서와 결과 5 확인.
- 자동 저장과 명시 저장, 편집 dirty 상태가 실제 쓰기 후 해제되는 것 확인.
- SDK 세션을 정리하고 파일을 다시 열어 계산 캐시와 결과 5가 보존되는 것 확인. 열기만으로 Worker가 시작되지 않았음.
- 편집 중 외부에서 파일을 수정한 뒤 저장: 외부 파일을 보존하고 SaveConflict를 반환하며 Mathfolio Recovery에 편집 사본을 생성함.
- 실제 SDK exportPdf와 Vault 쓰기로 44,351바이트 PDF 생성.
- 초기 CSS 색상 변환에서 소수 채널 때문에 SDK가 거절하는 문제를 발견해 Canvas 색 변환으로 수정함. 이후 실제 로드 성공.
- 사용자가 실제로 사용해 보고 “잘 되더라”라고 확인함. 구체적인 전체 기능/물리 IME 검증을 뜻하지 않음.
- 사용자가 테스트 파일과 탭을 삭제했음을 확인했으며, 해당 파일을 재생성하지 않음.

## 남은 범위

- Windows, Obsidian Mobile, 분리 창은 검증하지 않았다.
- 한글 표시는 확인했으나 물리 한글 IME 조합·클립보드·모든 단축키를 전수 검증하지 않았다.
- 정상 저장·재열기와 충돌 복구는 확인했다. 앱 강제 종료/전원 차단 복구 및 디스크 쓰기와 외부 프로세스 쓰기의 원자적 배제는 보장하지 않는다.
- 0.1.0 시점에는 SDK 릴리스가 미게시 상태여서 고정 소스 빌드를 사용했다. 0.1.7은 게시된 SDK 0.1.1 tarball 의존성으로 전환했다.
- 커뮤니티 등록과 모든 배포 환경의 적합성은 아직 확인하지 않았다.


## 0.1.7 통합 검증

- 2026-10-30, Linux / Flatpak Obsidian 1.14.5 / Node.js 24 / TypeScript 5.9.3.
- 기존 b2와 분리한 임시 프로필과 Vault에서 main.js, manifest.json, styles.css 세 파일만 설치했다. b2의 삭제된 테스트 문서는 재생성하지 않았다.
- SDK 0.1.1 / protocol 1 고정 GitHub Release tarball을 npm ci로 설치했다. SDK 원본 저장소의 소스는 변경하지 않았다.
- 깨끗한 npm ci 뒤 타입 검사, 공식 Obsidian 권장 strict ESLint 경고 0개, 회귀 테스트 9개, npm audit 취약점 0개, 빌드 및 릴리스 메타데이터 검사 통과.
- main.js 4,922,658바이트, styles.css 2,740,908바이트. 각 파일은 5,000,000바이트 미만이다. 원본 WASM 13,251,502바이트를 Binaryen으로 13,056,553바이트로 최적화하고, Worker·고지와 함께 Brotli로 압축했다.
- Desktop 내장 Node zlib로 압축 해제, WASM 초기화, 정적 Blob Worker 실행과 한글 글꼴 표시를 실제 앱에서 확인했다. 글꼴은 CSS에 분할된 데이터로 포함한다.
- 실제 DevTools 키보드/포인터 입력으로 `2+3=` 작성 후 Worker 결과 5, 저장 성공과 dirty 해제를 확인했다.
- SDK 세션을 종료하고 다시 열어 저장된 계산 캐시와 결과 5가 보존되는 것을 확인했다. 재열기 시 worker_count는 0이었다. 앱 자체 재시작 후에도 `2+3=5`, `X:=10`, `3X=30` 표시를 스크린샷으로 확인했다. inspectResults는 실행 중 Worker의 결과 진단이며, 저장 캐시는 inspectDocument의 calculation_cache와 실제 표시로 확인했다.
- SDK PDF 출력 `%PDF-` 헤더와 44,445바이트 출력을 확인했다. 별도 QA.pdf의 Vault 쓰기도 확인했다.
- 편집 중 외부 파일 수정 후 저장 시 SaveConflict 반환, 외부 내용 보존과 Mathfolio Recovery 사본 생성을 실제 Vault API로 확인했다.
- 선언형 설정 세 항목과 Nord/호스트 테마 변경, 자동 저장 토글의 반영을 확인했다.
- 워크시트 선택기가 현재 폴더의 파일과 Mathfolio Recovery 폴더를 표시하는 것을 확인했다. 전체 Vault 열거 호출은 호스트 소스에서 제거했다.
- 통합 테스트 중 페이지에서 발생하는 HTTP(S) 요청은 0개였다. 이것은 SDK 자산을 서버나 CDN에서 가져오지 않는다는 검증이며 Obsidian 자체의 업데이트 확인을 차단한 테스트는 아니다.
- 사용자가 수정본을 직접 사용하고 “너무 잘 되더라”라고 확인했다. 사용자가 입력한 QA 문서는 보존했다.
- 통합 테스트에서 긴 CSS 변수의 Chromium 제한과 Node Buffer.slice의 backing-buffer 유지 문제를 발견해 수정했다. 글꼴을 작은 CSS 변수로 분할하고, ArrayBuffer 복사를 Uint8Array 생성자로 수행한다. Buffer 경계 회귀 검사를 추가했다.
- 로컬 통합 실행 스크립트·JSON·스크린샷은 개발 체크아웃의 artifacts/에 남긴다. 사용자 Vault 데이터는 릴리스에 포함하지 않는다.

Windows, 실제 분리 창, 물리 한글 IME 전체 흐름, 강제 종료/전원 차단 복구는 미검증이다. Obsidian 커뮤니티의 재검사 통과 여부는 해당 서비스의 새 결과를 기다려야 한다.


## 0.1.8 개발 통합 검증 — 2026-11-02

- Mathfolio SDK 0.1.2-rc2 / protocol 1, 소스 커밋 63da611467b501a0c3cb384909a87f863719d72d. 개발 아카이브·원본 WASM 해시는 sdk.lock.json에 고정한다. 공개 SDK 릴리스 의존성으로 전환하기 전까지 공개 플러그인 릴리스 gate는 false다.
- gzip 압축 바이너리 데이터를 main.js와 styles.css로 나눠 보관한다. 각 CSS 문자열을 524,288자 이하로 나누며 Worker JavaScript는 main.js에 정적으로 포함한다. 실행 경로는 Node zlib를 사용하지 않는다.
- Node.js 24, 타입 검사·공식 strict ESLint·회귀 테스트 12개 통과. gzip 손상, 잘못된 패키지 헤더, 잘린 WASM/글꼴 범위와 전송 문자열 검사를 포함한다.
- 운영 8082와 b2를 건드리지 않는 별도 rootless Podman 테스트 서비스 9082, 빈 QA Vault, 기존과 같은 Ignis 이미지(0.8.18)와 Obsidian 1.14.4 프로그램을 사용했다. 프로그램 볼륨은 읽기 전용이며 b2·운영 runtime data는 마운트하지 않았다. 브라우저는 Chromium 155다.
- 실제 Flatpak Obsidian Desktop 1.14.5의 별도 QA 프로필에서도 같은 세 설치 파일과 같은 테스트 harness를 실행했다. CLI는 테스트 프로필에서만 활성화했다.
- 두 환경에서 통합 검사 13개씩 통과: 검색 가능한 설정, 테마 반영, 열기만으로 계산하지 않음, 실제 Worker 2+3=5, 쓰기 성공 후 저장 승인, 계산 캐시 저장, 44,443바이트 PDF, 재열기 시 worker_count=0과 캐시 유지, 실제 DOM Ctrl+A/Delete, SaveConflict, 외부 내용 보존, 복구 사본 생성.
- tests/obsidian-harness.cjs는 테스트 전용 플러그인으로 Vault 이름이 QA일 때만 실행한다. 배포 번들에 포함하지 않는다. 원시 JSON은 artifacts/web-qa/vaults/QA/QA-report.json과 별도 Desktop QA Vault에 보존한다.
- Mathfolio SDK의 실제 WebRunner 검사 90개는 원본 저장소의 rc2 기록을 따른다. 물리 IME/마우스, Windows 플러그인, 모바일과 강제 종료 복구를 검증했다는 뜻은 아니다.
- 런타임 의존성 npm audit --omit=dev는 취약점 0개. 2026-11-02 전체 audit에는 개발 도구 minimatch GHSA-g3hv-75wg-m249에서 전파된 moderate 21개가 보고된다. eslint-plugin-obsidianmd 계열의 여러 minimatch 세대 API가 달라 전역 major override로 숨기지 않았다. 전체 audit 실패는 공개 CI 전 해결/검토할 항목으로 남긴다.

최종 개발 빌드: main.js 4,421,766바이트, styles.css 3,371,205바이트. 두 파일 모두 5,000,000바이트 미만이다.


## 0.1.8 정식 SDK·릴리즈 승인 검증 — 2026-11-02

- 정식 Mathfolio SDK 0.1.2 / protocol 1을 v0.1.2 GitHub Release URL과 npm integrity에 고정했다. 원본 소스 9d40235c91e5f0083942333e8780565d73d8b21f, archive SHA-256 dd22c3b4d8033d694e06ae5ee0e6f4611ff960c0a93459ed43c3c5cc0d2c4ec3, 원본 WASM cb05afb3c353abbecc436b7117f0e2278d03b36415b29c72ee38875a86336ee0.
- 개발용 RC2 의존성을 제거한 npm ci·타입 검사·strict ESLint·회귀 테스트 17개·build 통과. 5개 새 검사는 audit 정책의 알 수 없는 공지·변조 소스·누락 응답 및 상속/순환 의존성 처리를 확인한다.
- 같은 세 설치 파일로 앞 절의 분리된 PC 웹 환경과 실제 Linux Obsidian Desktop에서 각각 13개 통합 검사 재통과. 웹 receipt는 2026-11-02T12:43:36.660Z, Desktop은 12:43:20.687Z에 완료됐다. 계산·저장·캐시·PDF·재열기·선택/삭제·충돌 및 복구를 확인했다.
- 테스트 harness가 실제 로드한 최적화 WASM의 SHA-256도 기록한다. 두 환경 모두 ac888cb483af58b456f328b8007f5abe155e34261e6c056cbd99c44844348486으로 build-info와 일치했다. 최적화 WASM은 13,161,590바이트다.
- 최종 main.js 4,421,766바이트, styles.css 3,371,209바이트로 각 5,000,000바이트 미만이다. 이번 SDK의 원본 저장소 브라우저 검사는 91개 통과했으며 해당 원본의 정식 배포 기록을 따른다.
- 현대 minimatch 소비자는 11.0.4로, JSON schema lint 플러그인은 6.3.2로 업데이트했다. 런타임 audit 0개, 전체 raw audit 20 moderate는 개발 전용 minimatch 3.1.5의 같은 GHSA 공지와 상속 finding이다. 정확한 파일 해시와 문제 optimizer의 부재를 검증하는 단일 공지 검토만 허용하며 다른 moderate/high/critical은 계속 실패한다. [근거·범위](DEPENDENCY-AUDIT.md). 전체 raw audit가 0개라고 주장하지 않는다.
- 사용자가 정식 게시를 요청했다. 릴리즈 CI는 고정 SDK에서 빌드하고 main.js·styles.css의 출처 증명을 생성한다. 표준 세 파일로 초안을 만든 뒤 다운로드와 바이트 대조를 통과한 초안만 게시한다.

Windows 플러그인, 모바일, 실제 분리 창, 물리 한글 IME 전체 흐름과 강제 종료 복구의 미검증 범위는 유지한다. b2에 삭제된 테스트 문서를 만들지 않는다.
