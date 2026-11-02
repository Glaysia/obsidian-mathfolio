# 개발 및 검증 계획

## 완료한 버전별 개선

| 버전 | 범위 |
| --- | --- |
| 0.1.0 | Rust SDK 호스트, 실제 Linux 편집·계산·저장·재열기·PDF·충돌 복구, b2 사용자 확인 |
| 0.1.1 | 고정 SDK 릴리스 의존성 및 타입 선언, 설정과 Worker 메시지 경계 검증 |
| 0.1.2 | 공식 strict lint, 검색 가능한 선언형 설정, 창 소유 타이머, DOM helper, CSS specificity |
| 0.1.3 | 영어 README와 한국어 안내 |
| 0.1.4 | CI artifact attestation, 지원되는 파일 세 개만 첨부, CI 검증 후 공개 |
| 0.1.5 | 폴더 단위 워크시트 선택과 복구 폴더 조회 |
| 0.1.6 | 오프라인 압축 번들, 파일별 5 MB 미만, 전송·설정·Worker 회귀 검사 |
| 0.1.7 | 실제 앱 통합 검증과 문서 정리, 최종 버전만 CI 릴리스 |

0.1.1~0.1.6은 순차 커밋으로 남긴다. 플러그인 태그와 GitHub Release는 0.1.7만 추가한다. Mathfolio SDK의 버전과 태그는 별도다.

## 유지할 구조

- Rust SDK가 편집기, 문서, 계산, 이력과 PDF를 소유한다.
- TypeScript는 Vault IO, 저장 충돌, 복구, 뷰, 테마와 설정을 연결한다.
- npm 고정 tarball과 lockfile로 SDK를 설치한다. 로컬 SDK 체크아웃은 개발에만 사용한다.
- 표준 설치 파일 main.js, manifest.json, styles.css만으로 오프라인 실행한다.
- WASM·Worker·라이선스는 main.js, 글꼴은 styles.css에 포함한다. 생성 CSS의 원본은 css/plugin.css다.
- Vault 전체 열거 없이 선택한 폴더와 Mathfolio Recovery 폴더를 조회한다.
- 최소 Obsidian 1.14.4, Desktop 전용, AGPL-3.0-only.

## 남은 검증과 등록

- [ ] Windows 깨끗한 Vault에서 설치·저장·재시작·PDF 확인.
- [ ] 실제 분리 창에서 입력·테마·타이머 확인.
- [ ] 물리 한글 IME, 클립보드와 전체 단축키 확인.
- [ ] 강제 종료·전원 차단·파일 삭제/이름 변경 등 추가 복구 조건 확인.
- [ ] Obsidian 커뮤니티 재검사 결과 확인 및 등록 절차 완료.

버전별 실제 검증 결과는 docs/VERIFICATION.md를 따른다. 파일 확인과 쓰기는 운영체제 수준의 원자적 잠금을 제공하지 않는다. 미검증 플랫폼을 지원 확인으로 표시하지 않는다.


## 0.1.8 개발 — 2026-11-02

- [x] Node 런타임 압축 해제 제거, 브라우저 gzip 초기화 및 실패 후 재시도.
- [x] WASM·글꼴·고지 데이터 분산과 설치 파일별 5 MB 미만. Worker 코드는 main.js에 정적으로 포함.
- [x] Mathfolio 0.1.2 정식 SDK 릴리즈 URL·커밋·해시 고정.
- [x] 웹 및 실제 Desktop의 분리된 QA Vault에서 통합 검사 13개씩 통과.
- [x] SDK 공개 릴리즈 의존성으로 전환하고 새 빌드를 양쪽 QA Vault에서 재검증.
- [x] 현대 minimatch 경로 업데이트 및 정확한 구형 소스의 단일 audit 공지 검토.
- 공개 릴리즈 요청을 수용했다. 0.1.8 태그 CI에서 최종 검사·출처 증명·초안 다운로드 대조 후 게시한다.

모바일과 모든 웹 호스트의 호환성을 주장하지 않는다. 사용자 b2에 테스트 문서를 생성하지 않는다.
