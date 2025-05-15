//
//  Athlete.swift
//  SetForge
//
//  Created by Daniel Coifman on 5/15/25.
//


import SwiftUI

struct Athlete: Identifiable, Hashable {
    let id = UUID()
    var name: String
    var profileImageName: String // System name for SF Symbols, or your asset name
    var lastWorkout: String
    var readinessScore: Int // 0-100
    
    static func readinessColor(score: Int) -> Color {
        if score > 70 {
            return .green
        } else if score > 40 {
            return .yellow
        } else {
            return .red // or .red
        }
    }
}

// Sample Data
let sampleAthletes = [
    Athlete(name: "Eleanor Vance", profileImageName: "figure.strengthtraining.functional", lastWorkout: "Upper Body Strength", readinessScore: 85),
    Athlete(name: "Marcus Cole", profileImageName: "figure.run", lastWorkout: "Endurance Run", readinessScore: 65),
    Athlete(name: "Aisha Khan", profileImageName: "figure.yoga", lastWorkout: "Recovery Flow", readinessScore: 92),
    Athlete(name: "James Rodriguez", profileImageName: "figure.cross.training", lastWorkout: "Metcon", readinessScore: 45)
]
