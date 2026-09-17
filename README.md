# Tymee

집중 타이머 & 학습 관리 앱

## Tech Stack

### Backend
- **Framework**: Spring Boot 4.0.1, Java 25
- **Database**: MySQL, Redis
- **Architecture**: Multi-module (core, auth, user, upload, bootstrap)
- **CI/CD**: GitHub Actions, Docker, Ansible

### Mobile
- **Framework**: React Native 0.76
- **State**: Zustand
- **Navigation**: React Navigation

### Infrastructure
- **Cloud**: Oracle Cloud (ARM)
- **Monitoring**: Grafana Cloud (Prometheus, Loki)
- **Container**: Docker Compose

## 일정과 작업 방식

기획부터 디자인, 백엔드, 모바일 앱까지 혼자 만들고 있습니다. 진행은 저장소에 남은 커밋과 Linear 기록으로 재구성할 수 있습니다.

| 기간 | 한 일 | 산출물 |
|---|---|---|
| 2025.11.28~12.02 | 프로젝트 초기 구조와 기본 기능, 뽀모도로 기능 구현 | 커밋 3개 |
| 2025.12.29 | 백엔드 멀티모듈 재구성, Spring Boot 4.0.1 업그레이드 | core/auth/user/upload/bootstrap 모듈 구조 |
| 2026.01.05 | Linear에 "Tymee MVP v1.0 출시" 프로젝트 생성, 목표 구간 1.5~1.30, 스코프 117건 | Linear 프로젝트 보드 |
| 2026.01.06~01.16 | Oracle Cloud 인프라와 CI/CD, 인증, 파일 업로드, 알림, FCM 푸시 등 구현 | PR 13개, 커밋 57개 |

develop 브랜치 기준 전체 커밋은 62개입니다. 1월 6일부터 16일까지 8영업일 동안 커밋 57개와 PR 13개가 올라가 그 전 5주보다 속도가 크게 빨라졌습니다.

이슈는 Linear로 관리합니다. PR은 전부 TYM 번호가 붙은 Linear 티켓 하나씩과 연결되고 브랜치 이름도 `feature/TYM-49-time-blocks`처럼 티켓 번호를 그대로 땁니다. 이전에는 GitHub Issues만 썼는데 PR을 머지해도 이슈 상태가 그대로 남아 진행률을 알 수 없었습니다. Linear의 GitHub Integration으로 이슈 생성부터 브랜치 생성, PR 머지, 이슈 종료까지 잇는 지금 구조로 옮겼습니다. 병합까지 걸린 시간은 작업 크기를 따라갔습니다. 카테고리 API처럼 작은 단위(PR #9)는 생성 4분 만에 병합됐고 RabbitMQ 알림 시스템처럼 큰 단위(PR #10)는 생성부터 병합까지 약 17시간이 걸렸습니다.

더 자세한 판단 과정과 진행 상황은 [블로그 소개 글](https://dj258255.github.io/IT-Oasis/blog/project/tymee/tymee-retrospective/)에 적었습니다.

