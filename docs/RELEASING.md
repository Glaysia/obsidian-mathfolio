# 릴리스 절차

플러그인 버전과 SDK 버전은 독립적이다. 0.1.0 플러그인은 Mathfolio SDK 0.1.1 / protocol 1을 사용한다.

## SDK 고정

현재는 sdk.lock.json의 원본 커밋을 별도로 checkout하여 같은 Rust·wasm-bindgen·Binaryen 버전으로 빌드한다. `npm run sdk:build -- /path/to/mathfolio`가 절대 경로를 고정 가상 경로로 바꾸고, `npm run sdk:link`가 원본 커밋과 WASM SHA-256을 검사한다. CI와 release workflow도 같은 절차를 사용한다.

원본 SDK가 GitHub Release 자산으로 게시되면 고정 tarball URL을 package.json dependencies에 추가하고 package-lock.json을 갱신할 수 있다. 이때 sdk.lock.json의 status를 released로 바꾸고 실제 태그·URL·tarball SHA-256을 기록한다. 브랜치 HEAD나 latest를 배포 의존성으로 쓰지 않는다.

## 검증과 버전

검증 범위는 VERIFICATION.md에 기록한다. 현재 확인한 환경은 Linux / Obsidian 1.14.5다. 다른 플랫폼에서 확인하지 않은 동작을 검증됐다고 표시하지 않는다.

```sh
npm ci
npm run sdk:link
npm run check
npm test
npm run build
npm run check:release
```

위 명령은 sdk.lock.json에 맞는 로컬 SDK를 이미 빌드한 경우다. SDK가 없으면 원본의 빌드 도구를 준비하고 sdk:build부터 실행한다.

버전을 바꿀 때는 `npm version 0.1.1 --no-git-tag-version`처럼 실행한다. version 스크립트가 manifest.json과 versions.json을 갱신한다. 변경된 package.json, package-lock.json, manifest.json, versions.json을 검토해 커밋한다.

## 태그와 draft

```sh
git tag -a 0.1.0 -m "Mathfolio for Obsidian 0.1.0"
git push origin main
git push origin 0.1.0
```

태그는 manifest.version과 정확히 같아야 한다. v 접두어를 붙이지 않는다. release workflow가 태그를 checkout해 SDK 생성, 검사, 테스트, 플러그인 빌드와 provenance 확인 후 draft를 만든다.

첨부 파일은 main.js, manifest.json, 존재할 경우 styles.css, SHA256SUMS.txt다. WASM·Worker·글꼴·고지는 main.js에 포함한다. 대응 소스는 플러그인 태그와 sdk.lock.json의 원본 커밋에서 접근할 수 있다.

## 공개

draft의 첨부 파일을 내려받아 SHA256SUMS.txt와 manifest 버전을 확인한다. 릴리스 노트에 기능과 실제 검증 환경을 적고, 사용자에게 공개 요청을 받은 경우 draft를 공개한다. 커뮤니티 등록은 별도다. 등록 시 manifest.version과 일치하는 공개 GitHub Release가 필요하다.

## 공식 참고

- https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin
- https://docs.obsidian.md/Reference/Manifest
- https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/.github/workflows/release.yml
- https://github.com/Glaysia/mathfolio/blob/main/docs/WASM-SDK.md
