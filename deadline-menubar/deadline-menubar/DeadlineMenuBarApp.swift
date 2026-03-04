import SwiftUI

@main
struct DeadlineMenuBarApp: App {
    @StateObject private var store = DeadlineStore()

    var body: some Scene {
        MenuBarExtra {
            MenuBarView()
                .environmentObject(store)
                .onChange(of: store.deadlines) { newDeadlines in
                    NotificationScheduler.scheduleAll(deadlines: newDeadlines)
                }
        } label: {
            let emergency = store.deadlines.filter(\.isEmergency)
            let urgentCount = store.deadlines.filter { $0.isUrgent && !$0.isEmergency }.count
            if let first = emergency.first {
                // Show warning icon + truncated task title in the menu bar
                let title = first.title.count > 28
                    ? String(first.title.prefix(28)) + "…"
                    : first.title
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text(title)
                        .font(.system(size: 12, weight: .semibold))
                    if emergency.count > 1 {
                        Text("+\(emergency.count - 1)")
                            .font(.system(size: 11))
                            .foregroundColor(.red)
                    }
                }
            } else if urgentCount > 0 {
                Label("\(urgentCount)", systemImage: "calendar.badge.exclamationmark")
            } else {
                Image(systemName: "calendar")
            }
        }
        .menuBarExtraStyle(.window)
    }

    init() {
        NotificationScheduler.requestPermission()
    }
}
