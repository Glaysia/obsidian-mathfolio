# 검증 기록 — 2026-10-30

## 환경과 빌드

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
- 원본의 0.1.1 SDK GitHub Release는 미게시 상태다. 0.1.0 플러그인 릴리스는 원본 커밋·도구 버전·WASM 해시를 고정한 소스 빌드를 사용한다. 사용자가 Linux 실사용 확인 후 0.1.0 공개 릴리스를 요청했다.
- 커뮤니티 등록과 모든 배포 환경의 적합성은 아직 확인하지 않았다.
