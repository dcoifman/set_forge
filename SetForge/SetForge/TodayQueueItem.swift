//
//  TodayQueueItem.swift
//  SetForge
//
//  Created by Daniel Coifman on 5/15/25.
//


import SwiftUI

struct TodayQueueItem: Identifiable, Hashable {
    let id = UUID()
    var athleteName: String
    var taskDescription: String
    var time: String
    var iconName: String = "figure.strengthtraining.traditional"
}

let sampleQueueItems = [
    TodayQueueItem(athleteName: "Eleanor Vance", taskDescription: "Log Morning HRV", time: "Now", iconName: "heart.text.square"),
    TodayQueueItem(athleteName: "Marcus Cole", taskDescription: "Afternoon Session Check-in", time: "2:00 PM"),
    TodayQueueItem(athleteName: "Aisha Khan", taskDescription: "Review Training Plan", time: "4:30 PM", iconName: "list.clipboard")
]

struct TodayQueueView: View {
    @State private var items = sampleQueueItems

    var body: some View {
        VStack(alignment: .leading) {
            Text("Today's Queue")
                .interFont(weight: .bold, size: 22)
                .foregroundColor(.coolSteel)
                .padding(.bottom, 5)

            if items.isEmpty {
                Text("All caught up for today!")
                    .interFont(size: 16)
                    .foregroundColor(.coolSteel.opacity(0.7))
                    .padding()
                    .frame(maxWidth: .infinity)
                    .glassCardStyle()
            } else {
                ForEach(items) { item in
                    HStack {
                        Image(systemName: item.iconName)
                            .foregroundColor(.moltenOrange)
                            .font(.title2)
                        VStack(alignment: .leading) {
                            Text(item.athleteName)
                                .interFont(weight: .semiBold, size: 16)
                                .foregroundColor(.coolSteel)
                            Text(item.taskDescription)
                                .interFont(size: 14)
                                .foregroundColor(.coolSteel.opacity(0.8))
                        }
                        Spacer()
                        Text(item.time)
                            .interFont(size: 14)
                            .foregroundColor(.coolSteel.opacity(0.7))
                    }
                    .glassCardStyle()
                    .padding(.bottom, 8) // Spacing between queue items
                }
            }
        }
    }
}