import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Widget Icon Helper
struct WidgetIconView: View {
    // Get widget extension bundle
    private var widgetBundle: Bundle {
        Bundle(for: BundleToken.self)
    }

    var body: some View {
        // Try SwiftUI Image with explicit bundle first
        Image("WidgetIcon", bundle: widgetBundle)
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 16, height: 16)
            .clipShape(RoundedRectangle(cornerRadius: 3))
    }
}

// Helper class to get widget extension bundle
private class BundleToken {}

// MARK: - Live Activity Widget
struct FocusTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FocusTimerAttributes.self) { context in
            // 잠금화면
            LockScreenLiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Leading: 아이콘 + 타이미 (카메라 왼쪽)
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 5) {
                        WidgetIconView()
                        Text("타이미")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                    }
                    .padding(.leading, 12)
                }

                // Trailing: 집중/휴식 모드 (카메라 오른쪽)
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.attributes.timerMode.contains("FOCUS") ? "집중모드" : "휴식모드")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(getColor(context))
                        .padding(.trailing, 4)
                }

                // Bottom: 타이머 정보
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        // 왼쪽: 원형 프로그레스 - 실시간 업데이트
                        if context.state.isPaused || isTimerFinished(context) {
                            ZStack {
                                Circle()
                                    .stroke(getColor(context).opacity(0.3), lineWidth: 4)
                                Circle()
                                    .trim(from: 0, to: getProgress(context))
                                    .stroke(getColor(context), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                                    .rotationEffect(.degrees(-90))
                            }
                            .frame(width: 44, height: 44)
                        } else {
                            ProgressView(
                                timerInterval: context.state.startTime...context.state.endTime,
                                countsDown: true
                            ) {
                                EmptyView()
                            } currentValueLabel: {
                                EmptyView()
                            }
                            .progressViewStyle(.circular)
                            .tint(getColor(context))
                            .frame(width: 44, height: 44)
                        }

                        Spacer()

                        // 경과시간 (실시간)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("경과시간")
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.6))
                            if context.state.isPaused || isTimerFinished(context) {
                                Text(getElapsedTime(context))
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .monospacedDigit()
                                    .foregroundColor(.white)
                            } else {
                                // startTime부터 endTime까지, 경과시간으로 표시 (0에서 시작해서 증가)
                                Text(timerInterval: context.state.startTime...context.state.endTime, countsDown: false)
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .monospacedDigit()
                                    .foregroundColor(.white)
                            }
                        }

                        Spacer()

                        // 구분선
                        Rectangle()
                            .fill(Color.white.opacity(0.3))
                            .frame(width: 1, height: 36)

                        Spacer()

                        // 남은시간
                        VStack(alignment: .leading, spacing: 2) {
                            Text("남은시간")
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.6))
                            if context.state.isPaused || isTimerFinished(context) {
                                Text(formatTime(context))
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .monospacedDigit()
                                    .foregroundColor(getColor(context))
                            } else {
                                Text(timerInterval: Date()...context.state.endTime, countsDown: true)
                                    .font(.system(size: 20, weight: .bold, design: .rounded))
                                    .monospacedDigit()
                                    .foregroundColor(getColor(context))
                            }
                        }

                        Spacer()
                    }
                    .padding(.horizontal, 4)
                }

            } compactLeading: {
                // 원형 프로그레스 - endTime 기준으로 자동 계산
                if context.state.isPaused || isTimerFinished(context) {
                    ProgressView(value: getProgress(context))
                        .progressViewStyle(.circular)
                        .tint(getColor(context))
                } else {
                    // 실시간 프로그레스: startTime부터 endTime까지의 진행률
                    ProgressView(
                        timerInterval: context.state.startTime...context.state.endTime,
                        countsDown: true
                    ) {
                        EmptyView()
                    } currentValueLabel: {
                        EmptyView()
                    }
                    .progressViewStyle(.circular)
                    .tint(getColor(context))
                }
            } compactTrailing: {
                if context.state.isPaused || isTimerFinished(context) {
                    Text(formatTime(context))
                        .foregroundColor(getColor(context))
                        .monospacedDigit()
                } else {
                    // iOS 자동 카운트다운 + frame으로 너비 제한
                    Text(timerInterval: Date()...context.state.endTime, countsDown: true)
                        .foregroundColor(getColor(context))
                        .monospacedDigit()
                        .frame(maxWidth: 48)
                }
            } minimal: {
                // 원형 프로그레스 - endTime 기준으로 자동 계산
                if context.state.isPaused || isTimerFinished(context) {
                    ProgressView(value: getProgress(context))
                        .progressViewStyle(.circular)
                        .tint(getColor(context))
                } else {
                    ProgressView(
                        timerInterval: context.state.startTime...context.state.endTime,
                        countsDown: true
                    ) {
                        EmptyView()
                    } currentValueLabel: {
                        EmptyView()
                    }
                    .progressViewStyle(.circular)
                    .tint(getColor(context))
                }
            }
        }
    }

    private func getColor(_ context: ActivityViewContext<FocusTimerAttributes>) -> Color {
        let hex = context.attributes.timerMode.contains("FOCUS")
            ? context.attributes.focusColor
            : context.attributes.breakColor
        return Color(hex: hex)
    }

    private func isTimerFinished(_ context: ActivityViewContext<FocusTimerAttributes>) -> Bool {
        return Date() >= context.state.endTime
    }

    private func isTimerFinishedAt(_ context: ActivityViewContext<FocusTimerAttributes>, date: Date) -> Bool {
        return date >= context.state.endTime
    }

    private func getModeText(_ context: ActivityViewContext<FocusTimerAttributes>) -> String {
        let mode = context.attributes.timerMode
        if mode.contains("FOCUS") {
            return "집중 모드"
        } else {
            return "휴식 모드"
        }
    }

    private func getElapsedTime(_ context: ActivityViewContext<FocusTimerAttributes>) -> String {
        return getElapsedTimeAt(context, date: Date())
    }

    private func getElapsedTimeAt(_ context: ActivityViewContext<FocusTimerAttributes>, date: Date) -> String {
        let total = context.state.targetDuration // ContentState에서 가져오기
        let remaining: Int
        if context.state.isPaused {
            remaining = context.state.pausedTimeLeft
        } else {
            remaining = Int(max(0, context.state.endTime.timeIntervalSince(date)))
        }
        let elapsed = max(0, total - remaining)
        let m = elapsed / 60
        let s = elapsed % 60
        return String(format: "%d:%02d", m, s)
    }

    private func getProgress(_ context: ActivityViewContext<FocusTimerAttributes>) -> Double {
        return getProgressAt(context, date: Date())
    }

    private func getProgressAt(_ context: ActivityViewContext<FocusTimerAttributes>, date: Date) -> Double {
        let total = Double(context.state.targetDuration) // ContentState에서 가져오기
        guard total > 0 else { return 0 }

        let remaining: Double
        if context.state.isPaused {
            remaining = Double(context.state.pausedTimeLeft)
        } else {
            remaining = max(0, context.state.endTime.timeIntervalSince(date))
        }
        return remaining / total
    }

    private func formatSeconds(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }

    private func formatTime(_ context: ActivityViewContext<FocusTimerAttributes>) -> String {
        return formatTimeAt(context, date: Date())
    }

    private func formatTimeAt(_ context: ActivityViewContext<FocusTimerAttributes>, date: Date) -> String {
        let remaining: Int
        if context.state.isPaused {
            remaining = context.state.pausedTimeLeft
        } else {
            remaining = Int(max(0, context.state.endTime.timeIntervalSince(date)))
        }
        let m = remaining / 60
        let s = remaining % 60
        return String(format: "%d:%02d", m, s)
    }

    private func formatSecondsShort(_ context: ActivityViewContext<FocusTimerAttributes>) -> String {
        let remaining: Int
        if context.state.isPaused {
            remaining = context.state.pausedTimeLeft
        } else {
            remaining = Int(max(0, context.state.endTime.timeIntervalSince(Date())))
        }
        let m = remaining / 60
        let s = remaining % 60
        return String(format: "%d:%02d", m, s)
    }
}

// MARK: - 잠금화면 뷰
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<FocusTimerAttributes>

    var body: some View {
        HStack {
            // 왼쪽: 아이콘 + 모드
            Label {
                Text(context.attributes.timerMode.contains("FOCUS") ? "집중" : "휴식")
                    .fontWeight(.semibold)
            } icon: {
                Image(systemName: "timer")
            }
            .foregroundColor(timerColor)

            Spacer()

            // 오른쪽: 시간
            if context.state.isPaused || isTimerFinished {
                Text(formatTime)
                    .font(.title)
                    .fontWeight(.bold)
                    .monospacedDigit()
                    .foregroundColor(timerColor)
            } else {
                Text(timerInterval: Date()...context.state.endTime, countsDown: true)
                    .font(.title)
                    .fontWeight(.bold)
                    .monospacedDigit()
                    .foregroundColor(timerColor)
            }
        }
        .padding()
    }

    private var timerColor: Color {
        let hex = context.attributes.timerMode.contains("FOCUS")
            ? context.attributes.focusColor
            : context.attributes.breakColor
        return Color(hex: hex)
    }

    private var isTimerFinished: Bool {
        return Date() >= context.state.endTime
    }

    private var formatTime: String {
        let remaining: Int
        if context.state.isPaused {
            remaining = context.state.pausedTimeLeft
        } else {
            remaining = Int(max(0, context.state.endTime.timeIntervalSince(Date())))
        }
        let m = remaining / 60
        let s = remaining % 60
        return String(format: "%d:%02d", m, s)
    }
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)

        let r, g, b: Double
        switch hex.count {
        case 6:
            r = Double((int >> 16) & 0xFF) / 255
            g = Double((int >> 8) & 0xFF) / 255
            b = Double(int & 0xFF) / 255
        default:
            r = 1; g = 0; b = 0
        }
        self.init(red: r, green: g, blue: b)
    }
}
