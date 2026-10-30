# Mathfolio for Obsidian

[Mathfolio](https://github.com/Glaysia/mathfolio)의 Rust 워크시트 편집기와 계산 엔진을 Obsidian에서 사용하는 TypeScript 플러그인이다.

Linux / Obsidian 1.14.5에서 검증했다. 상세 범위와 남은 항목은 [검증 기록](docs/VERIFICATION.md)을 따른다. 커뮤니티 등록은 GitHub 릴리스와 별도 절차다.

## 설치와 사용

[GitHub Releases](https://github.com/Glaysia/obsidian-mathfolio/releases)의 `main.js`, `manifest.json`, `styles.css`를 Vault의 `.obsidian/plugins/mathfolio/`에 넣고 커뮤니티 플러그인에서 활성화한다. 기존 플러그인 파일은 교체 전에 백업한다.

- 명령 팔레트의 **Mathfolio: Create worksheet** 또는 리본 아이콘으로 `.mathfolio` 파일을 만든다.
- `.mathfolio`, 이전 `.mathcraft`, `.mcdx` 문서를 연다. 워크시트 선택기는 폴더를 하나씩 탐색한다.
- 빈 곳을 클릭해 수식을 입력한다. **Calculate**로 계산하고 **Save**로 저장한다. 기본 자동 저장은 편집이 멈춘 뒤 약 0.9초 후 실행된다.
- **Save copy**, **PDF**, MCDX 내보내기는 새 Vault 파일을 만든다. 기존 내보내기 파일을 자동으로 덮어쓰지 않는다.
- 검색 가능한 설정에서 Obsidian 테마 따르기, Light, Dark, Nord와 자동 저장 여부를 선택한다.

외부 변경과 충돌하면 외부 파일을 보존하고 미저장 내용을 `Mathfolio Recovery/`에 남긴다. **Mathfolio: Open latest recovery copy**는 해당 폴더의 가장 최근 사본을 연다. 확인과 쓰기가 운영체제 수준의 원자적 잠금을 제공하지는 않는다.

## 오프라인 자산과 데이터

Rust가 편집기·문서·계산·이력·PDF 출력을 소유한다. TypeScript는 Vault IO, 뷰, 설정과 테마를 연결한다. 계산은 로컬 Worker에서 실행하고 문서나 원격 측정 데이터를 서버로 보내지 않는다. 선택한 폴더와 복구 폴더만 목록을 조회하며 Vault 전체 파일을 열거하지 않는다.

압축된 WASM·Worker·라이선스는 `main.js`, 한글 글꼴 데이터는 `styles.css`에 포함한다. 각 설치 파일은 5,000,000바이트 미만이다. Obsidian Desktop에 내장된 Node zlib로 로컬에서 압축을 푼다. 사용자가 Rust, Node.js 또는 독립판 Mathfolio를 별도 설치할 필요가 없다. CDN이나 로컬 서버도 필요하지 않다.

## 개발

Node.js 24를 사용한다.

```sh
npm ci
npm run check
npm run lint
npm test
npm run build
npm run install:vault -- /path/to/vault
```

`npm ci`가 원본 Mathfolio의 고정된 GitHub Release tarball과 TypeScript 선언을 설치한다. `package-lock.json`과 `sdk.lock.json`에 URL·버전·소스 커밋·해시를 기록한다. SDK 0.1.1 / protocol 1을 사용하며 플러그인 버전과 독립적으로 관리한다.

로컬 SDK 개발 소스는 `/home/harry/Projects/RustProjects/mathfolio`다. `sdk:build`, `sdk:link`는 SDK 개발용으로 유지한다. 배포 빌드는 npm의 고정 패키지를 사용한다. 설치 도구는 기존 파일과 활성 플러그인 목록을 `.local-backups/`에 보존한다.

Desktop 전용, 최소 Obsidian 1.14.4. Windows, 분리 창, 물리 한글 IME 전체 동작과 강제 종료 복구는 아직 검증하지 않았다. Mobile은 지원하지 않는다.

[개발 계획](PLAN.md) · [릴리스 절차](docs/RELEASING.md) · [검증 기록](docs/VERIFICATION.md) · [English](README.md)

## 라이선스

자체 소스·스크립트·문서는 Mathfolio와 같은 **AGPL-3.0-only**다. [LICENSE](LICENSE), [NOTICE.md](NOTICE.md)를 따른다. 제3자 글꼴·라이브러리는 각자의 라이선스를 유지한다. 전체 고지와 SDK 출처는 플러그인 설정에서 확인할 수 있다.
