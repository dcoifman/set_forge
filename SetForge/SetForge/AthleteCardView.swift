//
//  AthleteCardView.swift
//  SetForge
//
//  Created by Daniel Coifman on 5/15/25.
//


import SwiftUI

struct AthleteCardView: View {
    let athlete: Athlete

    var body: some View {
        HStack(spacing: 15) {
            Image(systemName: athlete.profileImageName)
                .font(.system(size: 40))
                .foregroundColor(Color.moltenOrange)
                .frame(width: 50, height: 50)
                .background(Color.gunmetalGrey.opacity(0.5))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(athlete.name)
                    .interFont(weight: .bold, size: 18)
                    .foregroundColor(.coolSteel)
                Text("Last: \(athlete.lastWorkout)")
                    .interFont(size: 14)
                    .foregroundColor(.coolSteel.opacity(0.8))
                    .lineLimit(1)
            }

            Spacer()

            VStack {
                Text("\(athlete.readinessScore)%")
                    .interFont(weight: .bold, size: 18)
                    .foregroundColor(Athlete.readinessColor(score: athlete.readinessScore))
                Text("Ready")
                    .interFont(size: 12)
                    .foregroundColor(.coolSteel.opacity(0.7))
            }
        }
        .glassCardStyle()
    }
}
