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
            let count = store.deadlines.filter { $0.isUrgent }.count
            if count > 0 {
                Label("\(count)", systemImage: "calendar.badge.exclamationmark")
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
