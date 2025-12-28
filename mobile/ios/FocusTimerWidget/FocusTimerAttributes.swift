import ActivityKit
import Foundation

struct FocusTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // 동적 상태 (업데이트 가능)
        var startTime: Date    // 타이머 시작 시간 (프로그레스 계산용)
        var endTime: Date      // 종료 시간 (iOS 시스템이 자동 카운트다운)
        var isPaused: Bool     // 일시정지 여부
        var pausedTimeLeft: Int // 일시정지 시 남은 시간
        var targetDuration: Int // 목표 시간 (초) - 동적으로 변경 가능
    }

    // 정적 상태 (시작 시 설정, 변경 불가)
    var timerMode: String // "FOCUS", "BREAK", "FREE_FOCUS", "FREE_BREAK"
    var focusColor: String // 집중 시간 색상 (hex: "#FF5252")
    var breakColor: String // 휴식 시간 색상 (hex: "#2196F3")
}
