rootProject.name = "tymee"

enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

// Core module (공통 + 도메인 추상화 + 인프라 설정)
include("core")

// Domain modules (Vertical Slice per domain)
include("user")
include("auth")
include("upload")

// Bootstrap module (실행 진입점)
include("bootstrap")