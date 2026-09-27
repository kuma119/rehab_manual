# 재활센터 인터랙티브 사용 안내

재활운동 예약 앱의 실제 화면을 따라 배우는 공개용 매뉴얼입니다. 슈퍼 관리자·센터 관리자·운동지도자·회원의 주요 업무 9가지를 82개 장면으로 안내합니다.

## 먼저 열어 보기

이 폴더의 **index.html을 더블클릭**하면 브라우저에서 볼 수 있습니다. 로그인이나 별도 설치가 필요하지 않습니다.

- **직접 따라 하기:** 초록색 표시 또는 다음 버튼을 누릅니다.
- **자동 시연:** 자동 시연을 선택하고 시연 재생을 누릅니다. 속도와 일시정지를 조절할 수 있습니다.
- **촬영 모드:** 촬영 설정에서 전체 과정 또는 핵심 장면, 가로 16:9 또는 세로 9:16을 고릅니다. 3초 뒤 시연이 시작되며 Esc로 나갑니다.
- **영상 저장:** 기기의 화면 녹화 기능으로 브라우저의 촬영 영역을 녹화합니다. 매뉴얼 자체가 영상 파일을 저장하지는 않습니다.

화면의 이름·아이디·연락처·예약은 모두 가상 시연 자료입니다. 입력 과정은 예시가 채워진 화면으로 보여주며, 캡처 안의 입력란에 직접 글을 쓰지는 않습니다. 이 매뉴얼은 실제 앱의 정보나 예약을 바꾸지 않습니다.

## GitHub Pages로 공개하기

1. GitHub에서 매뉴얼 전용 저장소를 만들고 공개 범위를 **Public**으로 선택합니다. 저장소 이름은 예를 들어 `freekim-manual`로 정합니다.
2. 저장소의 **Add file → Upload files**에서 이 폴더 **안의 파일과 assets 폴더**를 올립니다. `index.html`이 저장소 첫 화면에 바로 보여야 합니다. `interactive-manual` 폴더 자체를 한 단계 더 감싸서 올리지 마세요. `.nojekyll`과 `.gitignore`도 함께 포함합니다.
3. 업로드 내용을 **Commit changes**로 저장합니다.
4. **Settings → Pages → Build and deployment**에서 다음과 같이 선택하고 **Save**를 누릅니다.
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
5. 배포가 완료되면 같은 Pages 화면의 **Visit site** 주소를 공유합니다. 일반 프로젝트 저장소의 주소는 `https://사용자명.github.io/저장소이름/` 형식입니다.

이 패키지는 빌드가 필요 없는 HTML·CSS·JavaScript·이미지로 구성되어 있습니다. `.nojekyll`은 파일을 그대로 게시하기 위한 설정입니다. 별도 GitHub Actions 파일이나 서버, 데이터베이스, 비밀번호를 추가할 필요가 없습니다.

절차는 [GitHub Pages 게시 설정 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)와 [정적 사이트 생성 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)를 기준으로 작성했습니다.

## 포함된 파일

| 파일         | 용도                               |
| ------------ | ---------------------------------- |
| `index.html` | 매뉴얼 첫 화면과 재생 화면         |
| `styles.css` | 화면 디자인과 촬영 비율            |
| `app.js`     | 단계 이동·검색·자동 시연·촬영 기능 |
| `data.js`    | 9개 업무의 설명과 화면 연결        |
| `assets/`    | 사용 중인 실제 화면 캡처 82장      |
| `.nojekyll`  | GitHub Pages의 정적 파일 게시 설정 |
| `.gitignore` | 작업용 파일의 실수 업로드 방지     |
| `README.md`  | 사용 및 게시 방법                  |

내부 검증 자료, 환경 설정과 접속 정보, 캡처 제작 도구, 로컬 실행 서버는 공개 패키지에 포함하지 않았습니다. 캡처의 글자와 배치는 앱의 2026-09-27 화면을 기준으로 합니다.

## 나중에 수정할 때

설명과 단계 연결은 `data.js`, 화면은 `assets/`에서 관리합니다. 이미지를 바꾸면 해당 단계의 클릭 위치도 함께 확인하세요. GitHub의 `main` 브랜치에 변경 내용을 저장하면 Pages가 갱신됩니다.

파일 경로는 상대 경로이며 단계 주소는 `#업무이름/step/번호` 형식입니다. 저장소 이름이 달라도 `/저장소이름/` 아래에서 작동하며, 별도 서버 경로 설정은 필요하지 않습니다.
