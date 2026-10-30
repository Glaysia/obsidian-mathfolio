# Mathfolio for Obsidian

[Mathfolio](https://github.com/Glaysia/mathfolio)의 Rust 워크시트 편집기와 계산 엔진을 Obsidian에서 사용하는 TypeScript 플러그인이다.

현재 개발 빌드를 b2 Vault에 설치하고 **Linux / Obsidian 1.14.5에서 편집·계산·저장·재열기와 PDF 출력을 확인**했다. 0.1.0은 GitHub Releases로 배포하며 커뮤니티 등록은 별도 절차다. 검증 범위는 [검증 기록](docs/VERIFICATION.md)을 따른다.

## 사용

- 명령 팔레트의 **Mathfolio: Create worksheet** 또는 리본의 수식 아이콘으로 `.mathfolio` 파일을 만든다.
- `.mathfolio`, 이전 `.mathcraft`, `.mcdx` 파일을 열면 공통 Rust 편집기를 표시한다.
- 빈 곳을 클릭해 수식을 입력한다. 기존 Mathfolio 단축키와 도구 모음을 사용한다.
- **Save**로 저장하고 **Calculate**로 전체 계산한다. 기본 자동 저장은 편집이 멈춘 뒤 약 0.9초 후 실행된다.
- **Save copy**는 원본을 유지한 새 `.mathfolio` 파일을 만든다. **PDF**는 Vault에 벡터 PDF를 만든다. 기존 파일을 자동으로 덮어쓰지 않는다.
- 설정에서 Obsidian 테마 따르기, Light, Dark, Nord와 자동 저장 여부를 선택한다.

외부 변경과 충돌하면 원본을 덮어쓰지 않는다. 미저장 내용은 Vault의 `Mathfolio Recovery/`에 `.mathfolio` 복구 사본으로 남긴다. **Mathfolio: Open recovery folder** 명령은 가장 최근 복구 사본을 연다. 파일 확인과 쓰기는 운영체제 수준의 원자적 비교·교환이 아니므로 동시 외부 쓰기를 완전히 잠그는 기능은 아니다.

## 개발

Node.js 24와 npm을 사용한다. 로컬 SDK 소스는 `/home/harry/Projects/RustProjects/mathfolio`다.

```sh
cd /home/harry/Projects/RustProjects/mathfolio
npm ci --prefix web

cd /home/harry/Projects/WebstormProjects/obsidian-mathfolio
npm ci
npm run sdk:build
npm run sdk:link
npm run check
npm test
npm run build
npm run install:vault -- /home/harry/Documents/b2
```

Rust·wasm-bindgen 준비는 원본의 [SDK 빌드 안내](https://github.com/Glaysia/mathfolio/blob/main/docs/WASM-SDK.md)를 따른다. 다른 체크아웃은 `npm run sdk:link -- /absolute/path/to/mathfolio`로 연결한다. sdk:build는 Rust 경로를 고정된 가상 경로로 매핑해 로컬/CI의 WASM 빌드 경로 차이를 제거한다. sdk:link는 SDK 버전·원본 커밋·WASM SHA-256을 `sdk.lock.json`과 대조한다. SDK를 갱신할 때는 pin과 검증 기록을 함께 갱신한다. `npm ci` 후에는 링크를 다시 만든다.

설치 도구는 기존 플러그인 파일과 활성 플러그인 목록을 리포의 `.local-backups/`에 보존한다. 실행 중인 Obsidian에서는 커뮤니티 플러그인에서 Mathfolio를 다시 켜거나, 활성화된 Obsidian CLI의 `obsidian vault=b2 plugin:reload id=mathfolio`로 새 빌드를 적용한다.

## SDK와 배포

| 항목 | 값 |
| --- | --- |
| GitHub 리포 | `Glaysia/obsidian-mathfolio` |
| 플러그인 이름 / ID | `Mathfolio` / `mathfolio` |
| 플러그인 버전 | `0.1.0` |
| SDK | `@mathfolio/wasm-sdk` 0.1.1 / 프로토콜 1 |
| 라이선스 | `AGPL-3.0-only` |
| 초기 대상 | Obsidian Desktop / Linux, Windows는 후속 검증 |

Rust 프로젝트가 편집기·문서 모델·계산·Undo/Redo·PDF 출력을 소유한다. 이 리포는 Vault IO, 저장 충돌, 뷰 수명, 테마, 설정과 단축키 중재를 담당한다.

현재 SDK는 고정된 원본 커밋에서 빌드한다. GitHub CI도 같은 커밋과 도구 버전으로 SDK를 생성하고 WASM 해시를 검사한다. 원본의 이름 변경 후 SDK 릴리스 자산이 게시되면 고정 tarball 의존성으로 전환할 계획이다. 서브모듈이나 원본 소스 복사본은 관리하지 않는다.

빌드 결과는 `main.js`, `manifest.json`, `styles.css`다. **WASM·Worker·한글 글꼴·라이선스 고지를 main.js에 포함**하므로 사용자는 Rust·Node·Mathfolio 독립판을 따로 설치하지 않는다. CDN이나 로컬 서버도 필요하지 않다. 포함된 고지는 플러그인 설정에서 확인할 수 있다.

GitHub 릴리스는 manifest 버전과 정확히 같은 `x.y.z` 태그로 draft를 만든 뒤 첨부 파일을 검증해 공개한다. 0.1.0은 고정 SDK 소스 빌드를 사용한다. Windows·물리 IME·강제 종료 복구는 아직 검증하지 않았으며, 현재 확인한 환경은 Linux / Obsidian 1.14.5다.

[개발 계획](PLAN.md) · [릴리스 절차](docs/RELEASING.md) · [검증 기록](docs/VERIFICATION.md)

## 라이선스

자체 소스·스크립트·문서는 Mathfolio와 동일한 **GNU AGPL v3 only (`AGPL-3.0-only`)**로 제공한다. 전문은 [LICENSE](LICENSE), 고지는 [NOTICE.md](NOTICE.md)를 따른다. SDK의 제3자 글꼴·라이브러리는 각자의 라이선스를 유지한다.
