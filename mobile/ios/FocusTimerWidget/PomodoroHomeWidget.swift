import WidgetKit
import SwiftUI

// MARK: - Widget Data Model
struct PomodoroWidgetData: Codable {
    var todayPomodoros: Int           // 오늘 완료한 뽀모도로 수
    var todayFocusMinutes: Int        // 오늘 집중 시간 (분)
    var currentStreak: Int            // 현재 연속 일수
    var dailyGoal: Int                // 일일 목표 뽀모도로 수
    var focusDuration: Int            // 집중 시간 설정 (분)
    var breakDuration: Int            // 휴식 시간 설정 (분)
    var isTimerRunning: Bool          // 타이머 실행 중 여부
    var currentMode: String           // "FOCUS" or "BREAK"
    var lastUpdated: Date             // 마지막 업데이트 시간

    static var placeholder: PomodoroWidgetData {
        PomodoroWidgetData(
            todayPomodoros: 3,
            todayFocusMinutes: 75,
            currentStreak: 5,
            dailyGoal: 8,
            focusDuration: 25,
            breakDuration: 5,
            isTimerRunning: false,
            currentMode: "FOCUS",
            lastUpdated: Date()
        )
    }
}

// MARK: - Timeline Entry
struct PomodoroEntry: TimelineEntry {
    let date: Date
    let data: PomodoroWidgetData
}

// MARK: - Timeline Provider
struct PomodoroProvider: TimelineProvider {
    private let appGroupId = "group.com.tymee.mobile"

    func placeholder(in context: Context) -> PomodoroEntry {
        PomodoroEntry(date: Date(), data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (PomodoroEntry) -> Void) {
        let entry = PomodoroEntry(date: Date(), data: loadWidgetData())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PomodoroEntry>) -> Void) {
        let currentDate = Date()
        let data = loadWidgetData()
        let entry = PomodoroEntry(date: currentDate, data: data)

        // 15분마다 새로고침
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadWidgetData() -> PomodoroWidgetData {
        guard let userDefaults = UserDefaults(suiteName: appGroupId),
              let data = userDefaults.data(forKey: "pomodoroWidgetData"),
              let widgetData = try? JSONDecoder().decode(PomodoroWidgetData.self, from: data) else {
            return .placeholder
        }
        return widgetData
    }
}

// MARK: - Small Widget View
struct SmallPomodoroWidgetView: View {
    let entry: PomodoroEntry

    var body: some View {
        ZStack {
            // 배경 그라데이션
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "#FF6B6B").opacity(0.9),
                    Color(hex: "#FF8E8E").opacity(0.9)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 8) {
                // 상단: 아이콘 + 앱 이름
                HStack {
                    Image(systemName: "timer")
                        .font(.system(size: 12, weight: .semibold))
                    Text("타이미")
                        .font(.system(size: 12, weight: .semibold))
                    Spacer()
                }
                .foregroundColor(.white.opacity(0.9))

                Spacer()

                // 중앙: 뽀모도로 카운트
                HStack(alignment: .lastTextBaseline, spacing: 4) {
                    Text("\(entry.data.todayPomodoros)")
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    Text("/ \(entry.data.dailyGoal)")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))
                }

                // 진행률 바
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white.opacity(0.3))
                            .frame(height: 6)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.white)
                            .frame(width: geometry.size.width * progressRatio, height: 6)
                    }
                }
                .frame(height: 6)

                Spacer()

                // 하단: 오늘 집중 시간
                HStack {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 10))
                    Text(formatMinutes(entry.data.todayFocusMinutes))
                        .font(.system(size: 11, weight: .medium))
                    Spacer()
                    if entry.data.currentStreak > 0 {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 10))
                        Text("\(entry.data.currentStreak)일")
                            .font(.system(size: 11, weight: .medium))
                    }
                }
                .foregroundColor(.white.opacity(0.9))
            }
            .padding(14)
        }
    }

    private var progressRatio: CGFloat {
        guard entry.data.dailyGoal > 0 else { return 0 }
        return min(1.0, CGFloat(entry.data.todayPomodoros) / CGFloat(entry.data.dailyGoal))
    }

    private func formatMinutes(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        if h > 0 {
            return "\(h)시간 \(m)분"
        }
        return "\(m)분"
    }
}

// MARK: - Medium Widget View
struct MediumPomodoroWidgetView: View {
    let entry: PomodoroEntry

    var body: some View {
        ZStack {
            // 배경 그라데이션
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "#FF6B6B").opacity(0.9),
                    Color(hex: "#FF8E8E").opacity(0.9)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack(spacing: 16) {
                // 왼쪽: 뽀모도로 프로그레스
                VStack(spacing: 8) {
                    // 원형 프로그레스
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.3), lineWidth: 8)

                        Circle()
                            .trim(from: 0, to: progressRatio)
                            .stroke(Color.white, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 2) {
                            Text("\(entry.data.todayPomodoros)")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("/ \(entry.data.dailyGoal)")
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white.opacity(0.7))
                        }
                    }
                    .frame(width: 90, height: 90)
                }

                // 오른쪽: 상세 정보
                VStack(alignment: .leading, spacing: 10) {
                    // 앱 이름
                    HStack {
                        Image(systemName: "timer")
                            .font(.system(size: 12, weight: .semibold))
                        Text("타이미 뽀모도로")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundColor(.white.opacity(0.9))

                    Spacer()

                    // 오늘 집중 시간
                    HStack(spacing: 6) {
                        Image(systemName: "clock.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.white.opacity(0.8))
                        VStack(alignment: .leading, spacing: 2) {
                            Text("오늘 집중")
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.7))
                            Text(formatMinutes(entry.data.todayFocusMinutes))
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }

                    // 연속 일수
                    if entry.data.currentStreak > 0 {
                        HStack(spacing: 6) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 14))
                                .foregroundColor(.orange)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("연속 달성")
                                    .font(.system(size: 10))
                                    .foregroundColor(.white.opacity(0.7))
                                Text("\(entry.data.currentStreak)일째")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                            }
                        }
                    }

                    Spacer()

                    // 타이머 상태
                    if entry.data.isTimerRunning {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 6, height: 6)
                            Text(entry.data.currentMode == "FOCUS" ? "집중 중" : "휴식 중")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.white.opacity(0.9))
                        }
                    }
                }

                Spacer()
            }
            .padding(16)
        }
    }

    private var progressRatio: CGFloat {
        guard entry.data.dailyGoal > 0 else { return 0 }
        return min(1.0, CGFloat(entry.data.todayPomodoros) / CGFloat(entry.data.dailyGoal))
    }

    private func formatMinutes(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        if h > 0 {
            return "\(h)시간 \(m)분"
        }
        return "\(m)분"
    }
}

// MARK: - Large Widget View
struct LargePomodoroWidgetView: View {
    let entry: PomodoroEntry

    var body: some View {
        ZStack {
            // 배경 그라데이션
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(hex: "#FF6B6B").opacity(0.9),
                    Color(hex: "#FF8E53").opacity(0.9)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 16) {
                // 상단: 앱 이름
                HStack {
                    Image(systemName: "timer")
                        .font(.system(size: 14, weight: .semibold))
                    Text("타이미 뽀모도로")
                        .font(.system(size: 14, weight: .semibold))
                    Spacer()
                    if entry.data.isTimerRunning {
                        HStack(spacing: 4) {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 8, height: 8)
                            Text(entry.data.currentMode == "FOCUS" ? "집중 중" : "휴식 중")
                                .font(.system(size: 12, weight: .medium))
                        }
                    }
                }
                .foregroundColor(.white.opacity(0.9))

                // 중앙: 큰 원형 프로그레스
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.3), lineWidth: 12)

                    Circle()
                        .trim(from: 0, to: progressRatio)
                        .stroke(Color.white, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                        .rotationEffect(.degrees(-90))

                    VStack(spacing: 4) {
                        Text("\(entry.data.todayPomodoros)")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text("/ \(entry.data.dailyGoal) 뽀모")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white.opacity(0.7))
                    }
                }
                .frame(width: 140, height: 140)

                // 하단: 통계 카드들
                HStack(spacing: 12) {
                    // 오늘 집중 시간
                    StatCard(
                        icon: "clock.fill",
                        title: "오늘 집중",
                        value: formatMinutes(entry.data.todayFocusMinutes),
                        iconColor: .white
                    )

                    // 연속 일수
                    StatCard(
                        icon: "flame.fill",
                        title: "연속 달성",
                        value: "\(entry.data.currentStreak)일",
                        iconColor: .orange
                    )

                    // 설정
                    StatCard(
                        icon: "gearshape.fill",
                        title: "집중/휴식",
                        value: "\(entry.data.focusDuration)/\(entry.data.breakDuration)분",
                        iconColor: .white.opacity(0.8)
                    )
                }

                // 뽀모도로 도트 표시
                HStack(spacing: 6) {
                    ForEach(0..<entry.data.dailyGoal, id: \.self) { index in
                        Circle()
                            .fill(index < entry.data.todayPomodoros ? Color.white : Color.white.opacity(0.3))
                            .frame(width: 12, height: 12)
                    }
                }
                .padding(.top, 4)
            }
            .padding(20)
        }
    }

    private var progressRatio: CGFloat {
        guard entry.data.dailyGoal > 0 else { return 0 }
        return min(1.0, CGFloat(entry.data.todayPomodoros) / CGFloat(entry.data.dailyGoal))
    }

    private func formatMinutes(_ minutes: Int) -> String {
        let h = minutes / 60
        let m = minutes % 60
        if h > 0 {
            return "\(h)시간 \(m)분"
        }
        return "\(m)분"
    }
}

// MARK: - Stat Card Component
struct StatCard: View {
    let icon: String
    let title: String
    let value: String
    let iconColor: Color

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(iconColor)
            Text(title)
                .font(.system(size: 10))
                .foregroundColor(.white.opacity(0.7))
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.15))
        .cornerRadius(12)
    }
}

// MARK: - Widget Definition
struct PomodoroHomeWidget: Widget {
    let kind: String = "PomodoroHomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PomodoroProvider()) { entry in
            if #available(iOS 17.0, *) {
                PomodoroWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                PomodoroWidgetEntryView(entry: entry)
                    .padding()
                    .background(Color(.systemBackground))
            }
        }
        .configurationDisplayName("뽀모도로")
        .description("오늘의 뽀모도로 진행 상황을 확인하세요")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Entry View (Size Responsive)
struct PomodoroWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: PomodoroEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallPomodoroWidgetView(entry: entry)
        case .systemMedium:
            MediumPomodoroWidgetView(entry: entry)
        case .systemLarge:
            LargePomodoroWidgetView(entry: entry)
        default:
            SmallPomodoroWidgetView(entry: entry)
        }
    }
}

// MARK: - Preview
@available(iOS 17.0, *)
#Preview(as: .systemSmall) {
    PomodoroHomeWidget()
} timeline: {
    PomodoroEntry(date: .now, data: .placeholder)
}

@available(iOS 17.0, *)
#Preview(as: .systemMedium) {
    PomodoroHomeWidget()
} timeline: {
    PomodoroEntry(date: .now, data: .placeholder)
}

@available(iOS 17.0, *)
#Preview(as: .systemLarge) {
    PomodoroHomeWidget()
} timeline: {
    PomodoroEntry(date: .now, data: .placeholder)
}
