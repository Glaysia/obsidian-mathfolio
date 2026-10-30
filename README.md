# Mathfolio for Obsidian

[Mathfolio](https://github.com/Glaysia/mathfolio)의 Rust 워크시트 편집기와 계산 엔진을 Obsidian에서 사용하는 TypeScript 플러그인 프로젝트다.

**현재는 리포 초기 구성 단계다.** 플러그인 메인 코드, 파일 편집 기능, 설치 가능한 릴리스는 아직 없다. 커뮤니티 등록도 하지 않았다.

## 구성

| 항목 | 값 |
| --- | --- |
| GitHub 리포 | `Glaysia/obsidian-mathfolio` |
| 플러그인 이름 / ID | `Mathfolio` / `mathfolio` |
| 구현 언어 | TypeScript |
| 공통 편집기·계산 엔진 | Mathfolio WASM SDK |
| 라이선스 | `AGPL-3.0-only` |
| 초기 검증 대상 | Obsidian Desktop / Windows·Linux |

Rust 프로젝트가 편집기·문서 모델·계산·Undo/Redo·PDF 출력을 소유한다. 이 리포는 Vault 파일 IO, 뷰 수명, 저장 충돌, 테마, 설정과 단축키 중재를 담당한다. 별도 TypeScript 수식 엔진은 만들지 않는다.

## 개발 준비

Node.js 24와 npm을 사용한다.

```sh
npm ci
npm run check
```

로컬 Mathfolio 개발 체크아웃은 `/home/harry/Projects/RustProjects/mathfolio`다. 먼저 해당 리포의 [SDK 빌드 안내](https://github.com/Glaysia/mathfolio/blob/main/docs/WASM-SDK.md)에 따라 SDK를 생성한다.

```sh
cd /home/harry/Projects/RustProjects/mathfolio
npm ci --prefix web
python3 scripts/build-wasm.py

cd /home/harry/Projects/WebstormProjects/obsidian-mathfolio
npm run sdk:link
```

다른 위치에서는 `npm run sdk:link -- /absolute/path/to/mathfolio`를 사용한다. 이 명령은 생성된 SDK를 `node_modules/@mathfolio/wasm-sdk`에 연결한다. 원본 소스를 복사하거나 서브모듈로 추가하지 않는다. `npm ci` 후에는 다시 연결한다. 현재 지정한 체크아웃에는 SDK 산출물이 없으므로 SDK 빌드가 먼저 필요하다.

`npm run check`는 초기 메타데이터와 도구 스크립트를 확인한다. `src/main.ts`가 생기면 TypeScript 검사도 실행한다. `npm run build`는 메인 코드가 없는 현재 단계에서는 의도적으로 실패한다.

## SDK 의존성과 릴리스

개발에는 로컬 SDK를 사용하고, 배포에는 Mathfolio의 **고정된 GitHub Release SDK tarball**을 사용한다. npm 레지스트리 게시를 필수로 두지 않는다. SDK 릴리스 자산을 `package.json` 의존성 URL로 지정하고 `package-lock.json` 및 `sdk.lock.json`에 버전·출처·SHA-256을 고정할 계획이다.

2026-10-30 확인 기준 로컬 SDK는 `@mathfolio/wasm-sdk` 0.1.1 / 프로토콜 1이다. GitHub의 기존 `v0.1.0`에는 이름 변경 전 `mathcraft-wasm-sdk-0.1.0.tar.gz`가 있다. **Mathfolio 0.1.1 SDK 릴리스는 아직 확인되지 않아 배포 의존성을 연결하지 않았다.** `sdk.lock.json`은 이 미완료 상태를 명시한다.

Obsidian 설치에는 `main.js`, `manifest.json`, 선택적 `styles.css`를 사용한다. SDK의 WASM·Worker·글꼴은 이 설치 경로에서 동작하도록 번들에 포함해야 한다. 별도 ZIP이나 `.wasm` 첨부만으로 설치가 완성된다고 가정하지 않는다. 사용자에게 Rust·Node·Mathfolio 독립판 설치를 요구하지 않는다.

[개발 계획](PLAN.md) · [릴리스 절차](docs/RELEASING.md) · [공식 플러그인 제출 안내](https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin)

## 라이선스

이 리포의 자체 소스·스크립트·문서는 Mathfolio와 동일한 **GNU AGPL v3 only (`AGPL-3.0-only`)**로 제공한다. 전문은 [LICENSE](LICENSE), 배포 시 보존할 고지는 [NOTICE.md](NOTICE.md)를 따른다. SDK에 포함된 제3자 글꼴·라이브러리는 각자의 라이선스를 유지한다.
