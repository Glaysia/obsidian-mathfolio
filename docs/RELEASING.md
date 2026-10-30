# 릴리스 절차

현재는 b2에 설치한 Linux 개발 빌드가 있다. 검증 범위는 VERIFICATION.md를 따른다. SDK 릴리스 pin과 남은 배포 검증이 끝나기 전에는 태그·플러그인 공개 릴리스를 만들지 않는다.

CI는 sdk.lock.json의 원본 커밋을 별도로 checkout하여 SDK를 빌드하고 WASM 해시를 대조한다. 아래 tarball 의존성 단계는 원본 SDK 릴리스 이후에 진행한다.

## SDK 준비

1. 원본 Mathfolio 리포에서 생성한 WASM SDK tarball을 버전이 고정된 GitHub Release 자산으로 게시한다.
2. package.json의 dependencies에 `@mathfolio/wasm-sdk`를 해당 tarball URL로 추가하고 npm install로 lockfile을 생성한다.
3. sdk.lock.json에 SDK 버전·프로토콜·원본 커밋·태그·자산 URL·SHA-256을 기록한다. 원본 소스와 빌드 안내가 해당 커밋에서 접근 가능해야 한다.
4. CI에 SDK tarball SHA-256 검증을 연결한다. 로컬 SDK 링크를 사용한 결과를 배포 검증으로 대신하지 않는다.

예정 URL 형식은 `https://github.com/Glaysia/mathfolio/releases/download/<tag>/mathfolio-wasm-sdk-<version>.tar.gz`다. 실제 자산 게시 후 확정하며, 존재하지 않는 URL을 package.json에 미리 넣지 않는다.

## 첫 플러그인 릴리스 전

PLAN의 저장·수명·입력·자산·라이선스 검증을 끝내고 결과를 기록한다. 특히 현재 main.js가 WASM·Worker·글꼴·고지를 내장한다. 깨끗한 설치 경로와 Windows 검증을 완료한 뒤 release-state.json의 ready를 true로 변경한다. 기본 워크플로는 이 조건과 SDK pin을 검사하고, 준비되지 않으면 draft 생성 전에 중단한다.

## 버전과 태그

```sh
npm ci
npm run check
npm version 0.1.1 --no-git-tag-version
# 최초 버전은 현재 0.1.0 그대로 사용할 수 있다.
# 변경된 package.json/package-lock.json/manifest.json/versions.json을 검토하고 커밋한다.
npm run build
npm run check:release

git tag 0.1.1
git push origin main
git push origin 0.1.1
```

예시는 다음 버전이 0.1.1인 경우다. 태그는 반드시 manifest.version과 일치해야 한다. `v0.1.1`은 사용하지 않는다. `npm version`의 version 스크립트가 manifest와 versions를 갱신한다.

## Actions와 공개

`.github/workflows/release.yml`은 태그 커밋을 checkout하고 npm ci → check → build → check:release를 거쳐 draft를 만든다. 첨부 파일은 main.js, manifest.json, 존재할 경우 styles.css, SHA256SUMS.txt다. 소스는 같은 태그의 GitHub source archive에서 제공한다.

첨부 파일을 새 Vault의 `.obsidian/plugins/mathfolio/`에 설치해 검증한 다음 draft를 공개한다. ZIP만 첨부하는 방식으로 표준 파일을 대체하지 않는다. 공개가 끝나도 커뮤니티 등록이 자동으로 되는 것은 아니다.

## 공식 참고

- https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin
- https://docs.obsidian.md/Reference/Manifest
- https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/.github/workflows/release.yml
- https://github.com/Glaysia/mathfolio/blob/main/docs/WASM-SDK.md
