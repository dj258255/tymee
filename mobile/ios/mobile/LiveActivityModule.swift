import Foundation
import ActivityKit
import WidgetKit

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {

    private var currentActivityId: String?
    private var currentTargetDuration: Int = 0 // 현재 타이머의 목표 시간 저장
    private let appGroupId = "group.com.tymee.mobile"

    override init() {
        super.init()
        // 앱 시작 시 기존 Live Activity 정리
        cleanupAllActivities()
    }

    private func cleanupAllActivities() {
        if #available(iOS 16.2, *) {
            Task {
                for activity in Activity<FocusTimerAttributes>.activities {
                    await activity.end(dismissalPolicy: .immediate)
                }
            }
        }
    }

    @objc
    static func endAllActivities() {
        if #available(iOS 16.2, *) {
            Task {
                for activity in Activity<FocusTimerAttributes>.activities {
                    await activity.end(dismissalPolicy: .immediate)
                }
            }
        }
    }

    @objc
    func startActivity(_ timerMode: String, remainingSeconds: Int, colors: NSDictionary, totalTargetDuration: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.2, *) else {
            rejecter("NOT_SUPPORTED", "Live Activity requires iOS 16.2 or later", nil)
            return
        }

        // 색상 파싱
        let focusColor = colors["focusColor"] as? String ?? "#FF5252"
        let breakColor = colors["breakColor"] as? String ?? "#2196F3"

        // 기존 활동 종료
        Task {
            for activity in Activity<FocusTimerAttributes>.activities {
                await activity.end(dismissalPolicy: .immediate)
            }
        }

        // 총 목표 시간 저장 (경과시간/프로그레스 계산용)
        let targetDuration = totalTargetDuration > 0 ? totalTargetDuration : remainingSeconds
        self.currentTargetDuration = targetDuration

        // 현재 시간 기준으로 endTime 계산 (남은 시간 기준)
        let now = Date()
        let endTime = now.addingTimeInterval(TimeInterval(remainingSeconds))

        // 경과시간 계산하여 startTime 역산
        let elapsedSeconds = targetDuration - remainingSeconds
        let startTime = now.addingTimeInterval(TimeInterval(-elapsedSeconds))

        // attributes는 정적 데이터만 (timerMode, colors)
        let attributes = FocusTimerAttributes(
            timerMode: timerMode,
            focusColor: focusColor,
            breakColor: breakColor
        )

        // ContentState에 targetDuration 포함 (경과시간/프로그레스 계산용)
        let initialState = FocusTimerAttributes.ContentState(
            startTime: startTime,
            endTime: endTime,
            isPaused: false,
            pausedTimeLeft: 0,
            targetDuration: targetDuration
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialState, staleDate: nil),
                pushType: nil
            )
            currentActivityId = activity.id
            print("✅ Live Activity started: \(activity.id) remaining=\(remainingSeconds)s target=\(targetDuration)s elapsed=\(elapsedSeconds)s mode=\(timerMode)")
            resolver(activity.id)
        } catch {
            print("❌ Live Activity failed: \(error.localizedDescription)")
            rejecter("START_FAILED", "Failed to start Live Activity: \(error.localizedDescription)", error)
        }
    }

    @objc
    func updateActivity(_ remainingSeconds: Int, isRunning: Bool, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.2, *) else {
            rejecter("NOT_SUPPORTED", "Live Activity requires iOS 16.2 or later", nil)
            return
        }

        let isPaused = !isRunning
        let now = Date()
        let endTime = now.addingTimeInterval(TimeInterval(remainingSeconds))

        Task {
            let activities = Activity<FocusTimerAttributes>.activities
            for activity in activities {
                // ContentState에서 targetDuration 가져오기
                let targetDuration = activity.content.state.targetDuration
                let elapsedSeconds = targetDuration - remainingSeconds
                let startTime = now.addingTimeInterval(TimeInterval(-elapsedSeconds))

                let updatedState = FocusTimerAttributes.ContentState(
                    startTime: startTime,
                    endTime: endTime,
                    isPaused: isPaused,
                    pausedTimeLeft: isPaused ? remainingSeconds : 0,
                    targetDuration: targetDuration
                )
                await activity.update(using: updatedState)
                print("📱 Live Activity updated: remaining=\(remainingSeconds)s, target=\(targetDuration)s, elapsed=\(elapsedSeconds)s")
            }
            resolver(true)
        }
    }

    @objc
    func endActivity(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 16.2, *) else {
            rejecter("NOT_SUPPORTED", "Live Activity requires iOS 16.2 or later", nil)
            return
        }

        Task {
            for activity in Activity<FocusTimerAttributes>.activities {
                await activity.end(dismissalPolicy: .immediate)
            }
            currentActivityId = nil
            currentTargetDuration = 0
            resolver(true)
        }
    }

    @objc
    func isActivitySupported(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.2, *) {
            resolver(ActivityAuthorizationInfo().areActivitiesEnabled)
        } else {
            resolver(false)
        }
    }

    @objc
    func isActivityActive(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.2, *) {
            let activities = Activity<FocusTimerAttributes>.activities
            resolver(!activities.isEmpty)
        } else {
            resolver(false)
        }
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    // MARK: - Widget Data Update

    @objc
    func updateWidgetData(_ data: NSDictionary, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            rejecter("NO_APP_GROUP", "App Group not available", nil)
            return
        }

        // React Native에서 전달받은 데이터
        let widgetData: [String: Any] = [
            "todayPomodoros": data["todayPomodoros"] as? Int ?? 0,
            "todayFocusMinutes": data["todayFocusMinutes"] as? Int ?? 0,
            "currentStreak": data["currentStreak"] as? Int ?? 0,
            "dailyGoal": data["dailyGoal"] as? Int ?? 8,
            "focusDuration": data["focusDuration"] as? Int ?? 25,
            "breakDuration": data["breakDuration"] as? Int ?? 5,
            "isTimerRunning": data["isTimerRunning"] as? Bool ?? false,
            "currentMode": data["currentMode"] as? String ?? "FOCUS",
            "lastUpdated": Date().timeIntervalSince1970
        ]

        // JSON으로 변환해서 저장
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: widgetData)
            userDefaults.set(jsonData, forKey: "pomodoroWidgetData")
            userDefaults.synchronize()

            // 위젯 새로고침 트리거
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadTimelines(ofKind: "PomodoroHomeWidget")
            }

            print("✅ Widget data updated: \(widgetData)")
            resolver(true)
        } catch {
            print("❌ Widget data update failed: \(error)")
            rejecter("SAVE_FAILED", "Failed to save widget data", error)
        }
    }

    @objc
    func refreshWidget(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "PomodoroHomeWidget")
            resolver(true)
        } else {
            resolver(false)
        }
    }
}
