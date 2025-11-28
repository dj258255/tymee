rootProject.name = "tymee"

enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")

// Common modules
include("common")
include("domain")
include("infrastructure")

// Domain modules (Pattern B: Vertical Slice per domain)
include("user")
include("auth")
include("upload")

// Bootstrap module (실행 진입점)
include("bootstrap")