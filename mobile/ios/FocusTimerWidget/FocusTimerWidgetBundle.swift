import WidgetKit
import SwiftUI

@main
struct FocusTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        // 홈 화면 위젯
        PomodoroHomeWidget()
        // Live Activity
        FocusTimerLiveActivity()
    }
}
